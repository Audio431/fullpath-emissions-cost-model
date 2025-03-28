import { logger } from "./logger.js";
import util from 'util';
import { fetchCarbonIntensityData, fetchCarbonIntensityDataForRegion } from "./carbon-query.js";
import { fetchCloudInstanceImpacts, type ImpactDetails, type ImpactResponse, fetchCPUImpacts} from "./power-query.js";
import type { CarbonIntensityData, RegionData } from "./carbon-query.js";
import NodeCache from 'node-cache';
import { parse } from "path";
import { log } from "console";

export class AggregationService {

	private cpuUsageMap: Map<string, any[]>;
	private NetworkDataMap: Map<string, any[]>;
	private carbonCache: NodeCache;
	private cloudPowerConsumptionCache: NodeCache;
	private CPUPowerConsumptionCache: NodeCache;

	constructor() {
		this.cpuUsageMap = new Map<string, any[]>();
		this.carbonCache = new NodeCache({ stdTTL: 1800 });
		this.cloudPowerConsumptionCache = new NodeCache({ stdTTL: 1800 });
		this.CPUPowerConsumptionCache = new NodeCache({ stdTTL: 1800 });
		this.NetworkDataMap = new Map<string, any[]>();
	}

	async processAggregatedData(message: { tabInfo: { pid: number, title: string, outerWindowID: number, tabId: string}, cpuUsage: number }): Promise<void> {
		logger.info(`Processing cpu message: ${message.tabInfo.tabId} - ${message.cpuUsage}`);
		if (!this.cpuUsageMap.has(message.tabInfo.tabId)) {
			this.cpuUsageMap.set(message.tabInfo.tabId, [{
				title: message.tabInfo.title,
				pid: message.tabInfo.pid,
				outerWindowID: message.tabInfo.outerWindowID,
				cpuUsage: message.cpuUsage
			}]);
		} else {
			this.cpuUsageMap.get(message.tabInfo.tabId)?.push(
				{
					title: message.tabInfo.title,
					pid: message.tabInfo.pid,
					outerWindowID: message.tabInfo.outerWindowID,
					cpuUsage: message.cpuUsage
				}
			);
		}
	}

	async processNetworkData(message: any): Promise<void> {
		logger.info(`Processing network message: ${message.tabId} - ${message.networkTransferMetrics}`);
		if (!this.NetworkDataMap.has(message.tabId)) {
			this.NetworkDataMap.set(message.tabId, [
				{
					action: message.action,
					metrics: message.networkTransferMetrics,
				}
			]);
		} else {
			this.NetworkDataMap.get(message.tabId)?.push({
				action: message.action,
				metrics: message.networkTransferMetrics,
			});
		}
	}

	private async getCarbonData() : Promise<{ actualData: CarbonIntensityData[], regionalData: RegionData[] }> {
		let actualData = this.carbonCache.get('actualData') as CarbonIntensityData[];
		let regionalData = this.carbonCache.get('regionalData') as RegionData[];
	
		if (!actualData || !regionalData) {
		  logger.info("Fetching new carbon intensity data...");
		  actualData = await fetchCarbonIntensityData();
		  regionalData = await fetchCarbonIntensityDataForRegion();
		  this.carbonCache.set('actualData', actualData);
		  this.carbonCache.set('regionalData', regionalData);
		}
		return { actualData, regionalData };
	}

	private async getCloudPowerConsumption(cloudInstance: string, time_workload: number): Promise<ImpactDetails> {
		const cacheKey = `${cloudInstance}_${time_workload}`;
		let cachedValue = this.cloudPowerConsumptionCache.get(cacheKey) as ImpactResponse | undefined;
		let powerConsumption = cachedValue?.impacts?.pe;
		
		if (!powerConsumption) {
			logger.info("Fetching new cloud power consumption data...");
			powerConsumption = (await fetchCloudInstanceImpacts(cloudInstance, time_workload)).impacts.pe;
			logger.info(`Power consumption: ${powerConsumption}`);
			this.cloudPowerConsumptionCache.set(cacheKey, powerConsumption);
		}
		return powerConsumption;
	}

	public async getCPUConsumption(): Promise<any> {
		logger.info("Fetching new cloud power consumption data...");
		const cacheKey = `13-inch MacBook Air (M1 CPU) 256GB - 2020`;
		let cachedValue = this.CPUPowerConsumptionCache.get(cacheKey) as any;
		let powerConsumption = cachedValue?.verbose?.avg_power;

		if (!powerConsumption) {
			logger.info("Fetching new cloud power consumption data...");
			powerConsumption = (await fetchCPUImpacts("13-inch MacBook Air (M1 CPU) 256GB - 2020", 10)).verbose.avg_power;
			this.CPUPowerConsumptionCache.set(cacheKey, powerConsumption);
		}
		return powerConsumption;
	}

	async convertCPUTimeToCO2Emissions(): Promise<Map<string, number>> {
		const result = new Map<string, number>();
		const device_power_consumption_W = 10;
		const fetched_device_power_consumption_W = await this.getCPUConsumption();
		const { actualData, regionalData } = await this.getCarbonData();
		
		// Extract cpuUsage values from the objects and sum them
		const totalCPUTimeNS = [...this.cpuUsageMap.values()]
			.flat()
			.reduce((total, entry) => total + entry.cpuUsage, 0);
		
		const totalCPUTimeHours = totalCPUTimeNS / 1000 / 1000 / 1000 / 60 / 60;
		const powerConsumptionW = totalCPUTimeHours * fetched_device_power_consumption_W.value;

		const powerConsumptionkWh = powerConsumptionW / 1000;
		
		// Actual carbon intensity
		result.set('actual', powerConsumptionkWh * actualData[0].intensity.actual!);
		
		// Regional forecast carbon intensity
		// regionalData.forEach(region => {
		// 	result.set(region.shortname, powerConsumptionkWh * region.intensity.forecast! * 1000 * 1000 * 100);
		// });	
		
		return result;
	}

	async convertServerProcessTimeToCO2Emissions(): Promise<Map<string, number>> {
		const result = new Map<string, number>();

		const cloudInstance = 't2.medium';
		const time_workload = 10;

		const cloudPowerConsumptionMJ = await this.getCloudPowerConsumption(cloudInstance, time_workload);

		const totalNetworkWaitTimeMS = [...this.NetworkDataMap.values()]
			.flat()
			.reduce((total, entry) => {
				const metrics = entry.metrics;
				if (metrics && metrics.timings && metrics.timings.wait !== undefined) {
					return total + metrics.timings.wait;
				}
				return total;
			}, 0);

		const totalRequestSize = [...this.NetworkDataMap.values()]
			.flat()
			.reduce((total, entry) => {
				const metrics = entry.metrics;
				if (metrics && metrics.request && metrics.request.bodySize !== undefined) {
					return total + metrics.request.bodySize;
				}
				return total;
			}, 0);

		const totalResponseSize = [...this.NetworkDataMap.values()]
			.flat()
			.reduce((total, entry) => {
				const metrics = entry.metrics;
				if (metrics && metrics.response && metrics.response.bodySize !== undefined) {
					return total + metrics.response.bodySize;
				}
				return total;
			}, 0);

		const totalNetworkSizeGB = (totalRequestSize + totalResponseSize) / 1024 / 1024 / 1024;
		const networkTransmissionConsumptionkWh = totalNetworkSizeGB * 0.065;
	
		const totalNetworkWaitTimeHours = totalNetworkWaitTimeMS / 1000 / 60 / 60;

		const cloudPowerConsumptionkW = cloudPowerConsumptionMJ.use.value / 3.6;
		const cloudPowerConsumptionkWh = cloudPowerConsumptionkW * totalNetworkWaitTimeHours;
		

		const { actualData , regionalData } = await this.getCarbonData();

		result.set('actual', (networkTransmissionConsumptionkWh + cloudPowerConsumptionkWh) * actualData[0].intensity.actual!);

		regionalData.forEach(region => {
			result.set(region.shortname, (networkTransmissionConsumptionkWh + cloudPowerConsumptionkWh) * region.intensity.forecast!);
		});

		return result;
	}
	
	async getAggregatedDataOfEachTab(): Promise<Map<string, Map<string, number | string>>> {
		const aggregatedData = new Map<string, Map<string, number | string>>();
		
		// Process CPU usage data
		this.cpuUsageMap.forEach((value, key) => {
			// Extract cpuUsage values from the objects
			const cpuUsageValues = value.map(item => item.cpuUsage);
			const sortedValues = [...cpuUsageValues].sort((a, b) => a - b);
			const mid = Math.floor(sortedValues.length / 2);
			const median = sortedValues.length % 2 !== 0 
				? sortedValues[mid] 
				: (sortedValues[mid - 1] + sortedValues[mid]) / 2;
			const mean = sortedValues.reduce((a, b) => a + b, 0) / sortedValues.length;
			const std = Math.sqrt(sortedValues.reduce((a, b) => a + Math.pow(b - mean, 2), 0) / sortedValues.length);
			
			// Get the latest tab information
			const latestInfo = value[value.length - 1];
			
			const tabMap = new Map<string, number | string>();
			tabMap.set('title', latestInfo.title);
			tabMap.set('pid', latestInfo.pid);
			tabMap.set('outerWindowID', latestInfo.outerWindowID);
			tabMap.set('cpu_median', median);
			tabMap.set('cpu_mean', mean);
			tabMap.set('cpu_std', std);
			aggregatedData.set(key, tabMap);
		});
		
		// Process Network data
		this.NetworkDataMap.forEach((networkEntries, tabId) => {
			let tabMap = aggregatedData.get(tabId);
			if (!tabMap) {
				tabMap = new Map<string, number | string>();
				aggregatedData.set(tabId, tabMap);
			}
			
			// Calculate total request and response sizes
			let totalRequestSize = 0;
			let totalResponseSize = 0;
			let totalNetworkTime = 0;
			let requestCount = 0;
			
			// Track different mime types
			const mimeTypes = new Map<string, number>();
			
			networkEntries.forEach(entry => {
				const metrics = entry.metrics;
				if (metrics) {
					// Track mime types and count
					if (metrics.response && metrics.response.mimeType) {
						const mime = metrics.response.mimeType;
						mimeTypes.set(mime, (mimeTypes.get(mime) || 0) + 1);
					}
					
					// Request size - prioritize content_length
					if (metrics.request) {
						const contentLength = metrics.request.content_length;
						if (contentLength !== undefined && contentLength !== null) {
							totalRequestSize += Number(contentLength);
						} else {
							totalRequestSize += (metrics.request.bodySize || 0) + (metrics.request.headersSize || 0);
						}
					}
					
					// Response size - prioritize content_length
					if (metrics.response) {
						const contentLength = metrics.response.content_length;
						if (contentLength !== undefined && contentLength !== null) {
							totalResponseSize += Number(contentLength);
						} else {
							totalResponseSize += (metrics.response.bodySize || 0) + (metrics.response.headersSize || 0);
						}
					}
					
					// Track all timing metrics
					if (metrics.timings) {
						if (metrics.timings.all !== undefined) totalNetworkTime += metrics.timings.all;
						
						// Initialize timing totals if this is the first request
						if (requestCount === 0) {
							tabMap.set('network_time_send', 0);
							tabMap.set('network_time_wait', 0);
							tabMap.set('network_time_receive', 0);
						}
						
						// Add each timing component
						if (metrics.timings.send !== undefined) {
							tabMap.set('network_time_send', (tabMap.get('network_time_send') as number || 0) + metrics.timings.send);
						}
						if (metrics.timings.wait !== undefined) {
							tabMap.set('network_time_wait', (tabMap.get('network_time_wait') as number || 0) + metrics.timings.wait);
						}
						if (metrics.timings.receive !== undefined) {
							tabMap.set('network_time_receive', (tabMap.get('network_time_receive') as number || 0) + metrics.timings.receive);
						}
					}
					
					// Count every request that has metrics
					requestCount++;
				}
			});
			
			// Determine dominant mime type
			let dominantMimeType = '';
			let maxCount = 0;
			mimeTypes.forEach((count, mime) => {
				if (count > maxCount) {
					maxCount = count;
					dominantMimeType = mime;
				}
			});
			
			// Store network metrics
			tabMap.set('network_request_count', requestCount);
			tabMap.set('network_total_request_size', totalRequestSize);
			tabMap.set('network_total_response_size', totalResponseSize);
			tabMap.set('network_total_size', totalRequestSize + totalResponseSize);
			tabMap.set('network_dominant_mime', dominantMimeType);
			tabMap.set('network_total_time', totalNetworkTime);
			
			// Calculate average network time if there are requests
			if (requestCount > 0) {
				tabMap.set('network_avg_time', totalNetworkTime / requestCount);
				
				// Calculate averages for each timing component
				if (tabMap.has('network_time_send')) {
					tabMap.set('network_avg_time_send', (tabMap.get('network_time_send') as number) / requestCount);
				}
				if (tabMap.has('network_time_wait')) {
					tabMap.set('network_avg_time_wait', (tabMap.get('network_time_wait') as number) / requestCount);
				}
				if (tabMap.has('network_time_receive')) {
					tabMap.set('network_avg_time_receive', (tabMap.get('network_time_receive') as number) / requestCount);
				}
			}
			
			// Calculate transfer rates if time data is available
			if (totalNetworkTime > 0) {
				const totalTransferSize = totalRequestSize + totalResponseSize;
				tabMap.set('network_transfer_rate', totalTransferSize / totalNetworkTime);
			}
		});
	
		// Add the timestamp for when this aggregation was created
		aggregatedData.forEach((tabMap) => {
			tabMap.set('timestamp', Date.now());
		});
		
		return aggregatedData;
	}

	async clearData(): Promise<void> {
		this.cpuUsageMap.clear();
		this.NetworkDataMap.clear();
	}
}
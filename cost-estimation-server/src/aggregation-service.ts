import { logger } from "./logger.js";
import util from 'util';
import { fetchCarbonIntensityData, fetchCarbonIntensityDataForRegion } from "./carbon-query.js";
import { fetchCloudInstanceImpacts, type ImpactDetails, type ImpactResponse} from "./power-query.js";
import type { CarbonIntensityData, RegionData } from "./carbon-query.js";
import NodeCache from 'node-cache';
import { parse } from "path";

export class AggregationService {

	private cpuUsageMap: Map<string, any[]>;
	private NetworkDataMap: Map<string, any[]>;
	private carbonCache: NodeCache;
	private cloudPowerConsumptionCache: NodeCache;


	constructor() {
		this.cpuUsageMap = new Map<string, any[]>();
		this.carbonCache = new NodeCache({ stdTTL: 1800 });
		this.cloudPowerConsumptionCache = new NodeCache({ stdTTL: 1800 });
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
			this.cloudPowerConsumptionCache.set(cacheKey, powerConsumption);
		}
		return powerConsumption;
	}

	async convertCPUTimeToCO2Emissions(): Promise<Map<string, number>> {
		const result = new Map<string, number>();
		const device_power_consumption_W = 10;
		const { actualData, regionalData } = await this.getCarbonData();
		
		// Extract cpuUsage values from the objects and sum them
		const totalCPUTimeNS = [...this.cpuUsageMap.values()]
			.flat()
			.reduce((total, entry) => total + entry.cpuUsage, 0);
		
		const totalCPUTimeHours = totalCPUTimeNS / 1000 / 1000 / 1000 / 60 / 60;
		const powerConsumptionW = totalCPUTimeHours * device_power_consumption_W;
		const powerConsumptionkWh = powerConsumptionW / 1000;
		
		// Actual carbon intensity
		result.set('actual', powerConsumptionkWh * actualData[0].intensity.actual! * 1000 * 1000 * 100);
		
		// // Regional forecast carbon intensity
		// regionalData.forEach(region => {
		// 	result.set(region.shortname, powerConsumptionkWh * region.intensity.forecast! * 1000 * 1000 * 100);
		// });
		
		return result;
	}

	async convertRoundtripTimeToCO2Emissions(): Promise<Map<string, number>> {
		const result = new Map<string, number>();

		const cloudInstance = 't3.large';
		const time_workload = 10;

		const cloudPowerConsumptionMJ = await this.getCloudPowerConsumption(cloudInstance, time_workload);
		const cloudPowerConsumptionkWh = cloudPowerConsumptionMJ.use.value / 3.6;

		const { actualData , regionalData } = await this.getCarbonData();

		return result;
	}
	

	async getAggregatedDataOfEachTab(): Promise<Map<string, Map<string, number | string>>> {
		const aggregatedData = new Map<string, Map<string, string | number>>();
		
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
				tabMap = new Map<string, number>();
				aggregatedData.set(tabId, tabMap);
			}
			
			// Calculate total request and response sizes
			let totalRequestSize = 0;
			let totalResponseSize = 0;
			let totalNetworkTime = 0;
			let requestCount = 0;
			
			networkEntries.forEach(entry => {
				const metrics = entry.metrics;
				if (metrics) {
					// Sum request sizes
					if (metrics.request && 
						(metrics.request.bodySize !== undefined || 
						 metrics.request.headersSize !== undefined)) {
						totalRequestSize += (metrics.request.bodySize || 0) + (metrics.request.headersSize || 0);
					}
					
					// Sum response sizes
					if (metrics.response && 
						(metrics.response.bodySize !== undefined || 
						 metrics.response.headersSize !== undefined)) {
						totalResponseSize += (metrics.response.bodySize || 0) + (metrics.response.headersSize || 0);
					}
					
					// Sum network times
					if (metrics.timings && metrics.timings.all !== undefined) {
						totalNetworkTime += metrics.timings.all;
						requestCount++;
					}
				}
			});
			
			// Store network metrics
			tabMap.set('network_total_request_size', totalRequestSize);
			tabMap.set('network_total_response_size', totalResponseSize);
			tabMap.set('network_request_count', requestCount);
			
			// Calculate average network time if there are requests
			if (requestCount > 0) {
				tabMap.set('network_avg_time', totalNetworkTime / requestCount);
			}
			
			// Calculate transfer rates if time data is available
			if (totalNetworkTime > 0) {
				const totalTransferSize = totalRequestSize + totalResponseSize;
				tabMap.set('network_transfer_rate_bytes_per_ms', totalTransferSize / totalNetworkTime);
			}
		});

		return aggregatedData;
	}

	async clearData(): Promise<void> {
		this.cpuUsageMap.clear();
		this.NetworkDataMap.clear();
	}
}
import { logger } from "./logger.js";
import util from 'util';
import { fetchCarbonIntensityData, fetchCarbonIntensityDataForRegion } from "./carbon-query.js";
import type { CarbonIntensityData, RegionData } from "./carbon-query.js";
import NodeCache from 'node-cache';

export class AggregationService {

	private cpuUsageMap: Map<string, number[]>;
	private carbonCache: NodeCache;

	constructor(cpuUsageMap?: Map<string, number[]>) {
		this.cpuUsageMap = cpuUsageMap || new Map<string, number[]>();
		this.carbonCache = new NodeCache({ stdTTL: 1800 });
	}

	async processAggregatedData(message: { activeTab: string, cpuUsage: number }): Promise<void> {
		logger.info(`Processing message: ${message.activeTab} - ${message.cpuUsage}`);
		if (!this.cpuUsageMap.has(message.activeTab)) {
			this.cpuUsageMap.set(message.activeTab, [message.cpuUsage]);
		} else {
			this.cpuUsageMap.get(message.activeTab)?.push(message.cpuUsage);
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

	async convertCPUTimeToCO2Emissions(): Promise<Map<string, number>> {

		const result = new Map<string, number>();

		const device_power_consumption_W = 10;
		const { actualData , regionalData } = await this.getCarbonData();

		const totalCPUTimeNS = [...this.cpuUsageMap.values()].flat().reduce((a, b) => a + b, 0);
		const totalCPUTImeHours = totalCPUTimeNS / 1000 / 1000 / 1000 / 60 / 60;
		const powerConsumptionW = totalCPUTImeHours * device_power_consumption_W /1000;
		const powerConsumptionkWh = powerConsumptionW / 1000;


		// Actual carbon intensity
		result.set('actual', powerConsumptionkWh  * actualData[0].intensity.actual! * 1000 * 1000 * 100);
		
		// Regional forecast carbon intensity
		regionalData.forEach(region => {
			result.set(region.shortname, powerConsumptionkWh  * region.intensity.forecast! * 1000 * 1000 * 100);
		});

		
		return result;
	};

	async getAggregatedDataOfEachTab(): Promise<Map<string, Map<string, number>>> {
		const aggregatedData = new Map<string, Map<string, number>>();

		this.cpuUsageMap.forEach((value, key) => {
	
			const sortedValues = [...value].sort((a, b) => a - b);
			const mid = Math.floor(sortedValues.length / 2);
			const median = sortedValues.length % 2 !== 0 
				? sortedValues[mid] 
				: (sortedValues[mid - 1] + sortedValues[mid]) / 2;

			const mean = sortedValues.reduce((a, b) => a + b, 0) / sortedValues.length;
			const std = Math.sqrt(sortedValues.reduce((a, b) => a + Math.pow(b - mean, 2), 0) / sortedValues.length);

			const tabMap = new Map<string, number>();
			tabMap.set('median', median);
			tabMap.set('mean', mean);
			tabMap.set('std', std);
			aggregatedData.set(key, tabMap);
		});
	
		return aggregatedData;
	}

	async clearData(): Promise<void> {
		this.cpuUsageMap.clear();
	}
}
import { logger } from "./logger.js";
import util from 'util';
import { fetchCarbonIntensityData, fetchCarbonIntensityDataForRegion } from "./carbon-query.js";

export class AggregationService {

	private cpuUsageMap: Map<string, number[]>;

	constructor(cpuUsageMap?: Map<string, number[]>) {
		this.cpuUsageMap = cpuUsageMap || new Map<string, number[]>();
	}

	async processAggregatedData(message: { activeTab: string, cpuUsage: number }): Promise<void> {
		logger.info(`Processing message: ${message.activeTab} - ${message.cpuUsage}`);
		if (!this.cpuUsageMap.has(message.activeTab)) {
			this.cpuUsageMap.set(message.activeTab, [message.cpuUsage]);
		} else {
			this.cpuUsageMap.get(message.activeTab)?.push(message.cpuUsage);
		}
	}

	async convertCPUTimeToCO2Emissions(): Promise<Map<string, number>> {

		const result = new Map<string, number>();

		const device_power_consumption_W = 10;
		const actual_carbon_intensity_g = await fetchCarbonIntensityData();
		const regions_estimated_carbon_intensity_g = await fetchCarbonIntensityDataForRegion();

		const totalCPUTimeNS = [...this.cpuUsageMap.values()].flat().reduce((a, b) => a + b, 0);
		const totalCPUTImeHours = totalCPUTimeNS / 1000 / 1000 / 1000 / 60 / 60;
		const power_consumption_W = totalCPUTImeHours * device_power_consumption_W /1000;
		const power_consumption_kWh = power_consumption_W / 1000;


		// Actual carbon intensity
		result.set('actual', power_consumption_kWh * actual_carbon_intensity_g[0].intensity.actual! * 1000 * 1000 * 100);
		
		// Regional forecast carbon intensity
		regions_estimated_carbon_intensity_g.forEach(region => {
			result.set(region.shortname, power_consumption_kWh * region.intensity.forecast! * 1000 * 1000 * 100);
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
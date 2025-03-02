import { logger } from "./logger.js";
import util from 'util';

export class AggregationService {

  private cpuUsageMap: Map<string, number[]>;
  
  constructor() {
    this.cpuUsageMap = new Map();
  }

  async processAggregation(message: any): Promise<void> {
    logger.info(`Processing message: ${message.activeTab} - ${message.usageRate}`);
    if (!this.cpuUsageMap.has(message.activeTab)) {
        this.cpuUsageMap.set(message.activeTab, [message.usageRate]);
    } else {
        this.cpuUsageMap.get(message.activeTab)?.push(message.usageRate);
    }

    logger.info(util.format('CPU Usage Map: %o', this.cpuUsageMap));
}

  async getAggregatedDataOfEachTab(): Promise<Map<string, number>> {
    const aggregatedData = new Map<string, number>();

    this.cpuUsageMap.forEach((value, key) => {
        const sum = value.reduce((a, b) => a + b, 0);
        const avg = sum / value.length;
        aggregatedData.set(key, avg);
    });

    return aggregatedData; 
  }

  async clearData(): Promise<void> {
    this.cpuUsageMap.clear();
  }
}
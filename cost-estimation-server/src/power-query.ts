import util from 'util';
import { logger } from './logger.ts';

export interface ImpactResponse {
    impacts: {
        gwp: ImpactDetails,
        adp: ImpactDetails,
        pe: ImpactDetails
    }
}

export interface ImpactDetails {
    unit: string,
    description: string,
    embedded: {
        value: number,
        min: number,
        max: number,
        warnings: string[]
    },
    use: {
        value: number,
        min: number,
        max: number
    }
}

export async function fetchCloudInstanceImpacts(cloudInstance: string, time_workload: number): Promise<ImpactResponse> {
    return fetch(`https://api.boavizta.org/v1/cloud/instance?verbose=true&duration=1`, {
        method: 'POST',
        headers: {
            'Accept': 'application/json',
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            provider: "aws",
            instance_type: cloudInstance,
            usage: {
                usage_location: "GBR",
                time_workload: time_workload
            }
        })
    })
        .then(response => response.json())
        .catch(error => console.error('Error:', error));
}

export async function fetchCPUImpacts(cloudInstance: string, time_workload: number): Promise<any> {
    return fetch(`https://api.boavizta.org/v1/component/cpu?verbose=true&duration=1`, {
        method: 'POST',
        headers: {
            'Accept': 'application/json',
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            name: "13-inch MacBook Air (M1 CPU) 256GB - 2020",
            usage: {
                usage_location: "GBR",
                time_workload: time_workload
            }
        })
    })
        .then(response => response.json())
        .catch(error => console.error('Error:', error));
}

console.log(util.inspect(await fetchCPUImpacts("13-inch MacBook Air (M1 CPU) 256GB - 2020", 10)));
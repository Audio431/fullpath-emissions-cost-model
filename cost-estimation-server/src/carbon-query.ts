import { log } from "console";

export interface CarbonIntensityData {
    from: string;
    to: string;
    intensity: {
        forecast: number;
        actual?: number;
        index: string;
    };
}

export interface RegionData extends CarbonIntensityData {
    dnoregion: string;
    shortname: string;
}


export async function fetchCarbonIntensityData(): Promise<CarbonIntensityData[]> {
    try {
        const response = await fetch('https://api.carbonintensity.org.uk/intensity');
        const data = await response.json();
        return data.data;
    }
    catch (error) {
        console.error("Error fetching carbon intensity data:", error);
        return [];
    }
}

export async function fetchCarbonIntensityDataForRegion(): Promise<RegionData[]> {
    const regions = new Array<RegionData>();

    try {
        const response = await fetch(`https://api.carbonintensity.org.uk/regional`);
        const data = await response.json();

        data.data[0].regions.forEach((region: any) => {
            const transformedRegion: RegionData = {
                from: data.data[0].from,
                to: data.data[0].to,
                intensity: region.intensity,
                dnoregion: region.dnoregion,
                shortname: region.shortname
            };
            regions.push(transformedRegion);
        });

    } catch (error) {
        console.error("Error fetching carbon intensity data for region:", error);
    }

    return regions;
}
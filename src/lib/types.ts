// Raw API response types
export interface OctopusConsumptionResponse {
	count: number;
	next: string | null;
	previous: string | null;
	results: ConsumptionResult[];
}

export interface ConsumptionResult {
	consumption: number;
	interval_start: string;
	interval_end: string;
}

export type Rate = 'Peak' | 'Medium' | 'Low';

export interface DailyResult {
	date: string;
	consumptionKwh: number;
	cost: number;
}

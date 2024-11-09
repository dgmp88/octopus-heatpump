import type { ConsumptionResult, DailyResult } from './types';

const STANDING_CHARGE = 0.4879; // 48.79p per day

// Rates in £/kWh
const RATES = {
	Peak: 0.3742, // Peak rate (16:00-19:00)
	Medium: 0.2581, // Medium rate (00:00-04:00, 07:00-13:00, 19:00-22:00)
	Low: 0.1265 // Low rate (04:00-07:00, 13:00-16:00, 22:00-00:00)
} as const;

export function getRateForHour(hour: number): number {
	if (hour >= 16 && hour < 19) return RATES.Peak; // Peak
	if (hour >= 4 && hour < 7) return RATES.Low; // Early morning low
	if (hour >= 13 && hour < 16) return RATES.Low; // Afternoon low
	if (hour >= 22 || hour < 4) return RATES.Low; // Night low
	return RATES.Medium; // All other times
}

export function calculateDailyCost(readings: ConsumptionResult[]): DailyResult[] {
	const dailyGroups = new Map<string, DailyResult>();

	for (const reading of readings) {
		const rawDate = new Date(reading.interval_start);
		const date = new Date(
			rawDate.getFullYear(),
			rawDate.getMonth(),
			rawDate.getDate()
		).toISOString();
		const rate = getRateForHour(new Date(reading.interval_start).getHours());
		const consumption = reading.consumption;
		const cost = consumption * rate;

		if (!dailyGroups.has(date)) {
			dailyGroups.set(date, {
				date,
				consumptionKwh: 0,
				cost: STANDING_CHARGE
			});
		}
		const dailyGroup = dailyGroups.get(date)!;
		dailyGroup.consumptionKwh += consumption;
		dailyGroup.cost += cost;
	}

	return Array.from(dailyGroups.values());
}

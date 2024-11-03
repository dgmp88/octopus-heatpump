import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { OCTOPUS_API_KEY, METER_MPAN, METER_SERIAL } from '$env/static/private';

import type { ConsumptionResult, OctopusConsumptionResponse, DailyResult } from '$lib/types';

const OCTOPUS_BASE_URL = 'https://api.octopus.energy/v1';

const STANDING_CHARGE = 0.4879; // 48.79p per day

// Rates in £/kWh
const RATES = {
	Peak: 0.3742, // Peak rate (16:00-19:00)
	Medium: 0.2581, // Medium rate (00:00-04:00, 07:00-13:00, 19:00-22:00)
	Low: 0.1265 // Low rate (04:00-07:00, 13:00-16:00, 22:00-00:00)
} as const;

function getRateForHour(hour: number): number {
	if (hour >= 16 && hour < 19) return RATES.Peak; // Peak
	if (hour >= 4 && hour < 7) return RATES.Low; // Early morning low
	if (hour >= 13 && hour < 16) return RATES.Low; // Afternoon low
	if (hour >= 22 || hour < 4) return RATES.Low; // Night low
	return RATES.Medium; // All other times
}

function calculateDailyCost(readings: ConsumptionResult[]): DailyResult[] {
	const dailyGroups = new Map<string, DailyResult>();

	for (const reading of readings) {
		const date = new Date(reading.interval_start).toLocaleDateString();
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

async function getAllReadings(url: string): Promise<ConsumptionResult[]> {
	let allReadings: ConsumptionResult[] = [];
	let nextUrl: string | null = url;

	while (nextUrl) {
		const response = await fetch(nextUrl, {
			headers: {
				Authorization: `Basic ${btoa(OCTOPUS_API_KEY + ':')}`
			}
		});

		if (!response.ok) {
			throw new Error(`API returned ${response.status}`);
		}

		const data: OctopusConsumptionResponse = await response.json();
		allReadings = [...allReadings, ...data.results];
		nextUrl = data.next;
	}

	return allReadings;
}

export const GET: RequestHandler = async () => {
	const now = new Date();
	//  Set now to 12am
	now.setHours(0, 0, 0, 0);
	const sevenDaysAgo = new Date(now);
	sevenDaysAgo.setDate(now.getDate() - 7);

	console.log('From', sevenDaysAgo.toISOString(), 'To', now.toISOString());

	const periodFrom = sevenDaysAgo.toISOString();
	const periodTo = now.toISOString();

	const url = `${OCTOPUS_BASE_URL}/electricity-meter-points/${METER_MPAN}/meters/${METER_SERIAL}/consumption/?period_from=${periodFrom}&period_to=${periodTo}&group_by=hour`;

	try {
		const readings = await getAllReadings(url);

		// Sort readings chronologically
		const sortedReadings: ConsumptionResult[] = [...readings].sort(
			(a, b) => new Date(b.interval_start).getTime() - new Date(a.interval_start).getTime()
		);

		console.log('Data summary:', {
			totalReadings: sortedReadings.length,
			firstReading: sortedReadings[0]?.interval_start,
			lastReading: sortedReadings[sortedReadings.length - 1]?.interval_start,
			timespan:
				sortedReadings.length > 0
					? {
							from: new Date(sortedReadings[0].interval_start).toLocaleString(),
							to: new Date(
								sortedReadings[sortedReadings.length - 1].interval_start
							).toLocaleString()
						}
					: null
		});

		const dailyResults = calculateDailyCost(sortedReadings);
		return json(dailyResults);
	} catch (error) {
		console.error('Detailed error:', error);
		return new Response(
			JSON.stringify({
				error: 'Failed to fetch data',
				details: error.message
			}),
			{
				status: 500
			}
		);
	}
};

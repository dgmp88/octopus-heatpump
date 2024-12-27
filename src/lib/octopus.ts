import { OCTOPUS_API_KEY, ELECTRICITY_MPAN, ELECTRICITY_SERIAL } from '$env/static/private';

import type { ConsumptionResult, OctopusConsumptionResponse } from '$lib/types';

const OCTOPUS_BASE_URL = 'https://api.octopus.energy/v1';

export async function getAllReadings(from: Date, to: Date): Promise<ConsumptionResult[]> {
	const periodFrom = from.toISOString();
	const periodTo = to.toISOString();

	const url = `${OCTOPUS_BASE_URL}/electricity-meter-points/${ELECTRICITY_MPAN}/meters/${ELECTRICITY_SERIAL}/consumption/?period_from=${periodFrom}&period_to=${periodTo}&group_by=hour`;

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

	// Sort readings chronologically
	allReadings.sort(
		(a, b) => new Date(a.interval_start).getTime() - new Date(b.interval_start).getTime()
	);

	console.log('Data summary:', {
		totalReadings: allReadings.length,
		firstReading: allReadings[0]?.interval_start,
		lastReading: allReadings[allReadings.length - 1]?.interval_start,
		timespan:
			allReadings.length > 0
				? {
						from: new Date(allReadings[0].interval_start).toLocaleString(),
						to: new Date(allReadings[allReadings.length - 1].interval_start).toLocaleString()
					}
				: null
	});

	return allReadings;
}

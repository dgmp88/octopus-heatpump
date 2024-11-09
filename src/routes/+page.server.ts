import { OCTOPUS_API_KEY, METER_MPAN, METER_SERIAL } from '$env/static/private';
import type { PageServerLoad } from './$types';

import type { ConsumptionResult, OctopusConsumptionResponse } from '$lib/types';

const OCTOPUS_BASE_URL = 'https://api.octopus.energy/v1';

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

export const load: PageServerLoad = async () => {
	const now = new Date();
	//  Set now to 12am
	now.setHours(0, 0, 0, 0);
	const sevenDaysAgo = new Date(now);
	sevenDaysAgo.setDate(now.getDate() - 7);

	console.log('From', sevenDaysAgo.toISOString(), 'To', now.toISOString());

	const periodFrom = sevenDaysAgo.toISOString();
	const periodTo = now.toISOString();

	const url = `${OCTOPUS_BASE_URL}/electricity-meter-points/${METER_MPAN}/meters/${METER_SERIAL}/consumption/?period_from=${periodFrom}&period_to=${periodTo}&group_by=hour`;

	const readings = await getAllReadings(url);

	// Sort readings chronologically
	const sortedReadings: ConsumptionResult[] = [...readings].sort(
		(a, b) => new Date(a.interval_start).getTime() - new Date(b.interval_start).getTime()
	);

	console.log('Data summary:', {
		totalReadings: sortedReadings.length,
		firstReading: sortedReadings[0]?.interval_start,
		lastReading: sortedReadings[sortedReadings.length - 1]?.interval_start,
		timespan:
			sortedReadings.length > 0
				? {
						from: new Date(sortedReadings[0].interval_start).toLocaleString(),
						to: new Date(sortedReadings[sortedReadings.length - 1].interval_start).toLocaleString()
					}
				: null
	});

	return { sortedReadings };
};

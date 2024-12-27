import {
	OCTOPUS_API_KEY,
	OCTOPUS_BASE_URL,
	ELECTRICITY_MPAN,
	ELECTRICITY_SERIAL,
	GAS_MPRN,
	GAS_SERIAL
} from '$env/static/private';

import type { PageServerLoad } from './$types';

// Correct as of 2024/12/14
const ELECTRICITY_STANDING_CHARGE = 0.4879; // £/day
const ELECTRICITY_UNIT_RATE = 0.2425; // £/kWh
const GAS_STANDING_CHARGE = 0.2938; // £/day
const GAS_UNIT_RATE = 0.0585; // £/kWh
const GAS_M3_TO_KWH = 11.104; // Conversion factor from m³ to kWh

const LATITUDE = 51.95;
const LONGITUDE = -0.28;

async function fetchConsumption(url: string): Promise<any[]> {
	let results: any[] = [];
	let nextUrl: string | null = url;
	const auth = Buffer.from(`${OCTOPUS_API_KEY}:`).toString('base64');

	while (nextUrl) {
		const response = await fetch(nextUrl, {
			headers: {
				Authorization: `Basic ${auth}`
			}
		});

		if (!response.ok) {
			throw new Error(`API returned ${response.status}`);
		}

		const data = await response.json();
		results = results.concat(data.results);
		nextUrl = data.next;
	}

	return results;
}

export const load: PageServerLoad = async () => {
	const periodFrom = '2023-01-01T00:00:00Z';
	const periodTo = '2024-11-20T00:00:00Z';

	const electricityUrl = `${OCTOPUS_BASE_URL}/electricity-meter-points/${ELECTRICITY_MPAN}/meters/${ELECTRICITY_SERIAL}/consumption/?period_from=${periodFrom}&period_to=${periodTo}&group_by=day`;

	const gasUrl = `${OCTOPUS_BASE_URL}/gas-meter-points/${GAS_MPRN}/meters/${GAS_SERIAL}/consumption/?period_from=${periodFrom}&period_to=${periodTo}&group_by=day`;

	const [electricityData, gasData] = await Promise.all([
		fetchConsumption(electricityUrl),
		fetchConsumption(gasUrl)
	]);

	const electricityReadings = electricityData.map((reading) => {
		const date = new Date(reading.interval_start);
		const consumption = reading.consumption;
		const cost = consumption * ELECTRICITY_UNIT_RATE + ELECTRICITY_STANDING_CHARGE;
		return { date, consumption, cost };
	});

	const gasReadings = gasData.map((reading) => {
		const date = new Date(reading.interval_start);
		const consumption_m3 = reading.consumption;
		const consumption_kwh = consumption_m3 * GAS_M3_TO_KWH;
		const cost = consumption_kwh * GAS_UNIT_RATE + GAS_STANDING_CHARGE;
		return { date, consumption_m3, consumption_kwh, cost };
	});

	const mergedData: Record<string, any> = {};

	electricityReadings.forEach((electricity) => {
		const dateStr = electricity.date.toISOString().split('T')[0];
		if (!mergedData[dateStr]) {
			mergedData[dateStr] = { date: electricity.date };
		}
		mergedData[dateStr].electricity_consumption = electricity.consumption;
		mergedData[dateStr].electricity_cost = electricity.cost;
	});

	gasReadings.forEach((gas) => {
		const dateStr = gas.date.toISOString().split('T')[0];
		if (!mergedData[dateStr]) {
			mergedData[dateStr] = { date: gas.date };
		}
		mergedData[dateStr].gas_consumption_m3 = gas.consumption_m3;
		mergedData[dateStr].gas_consumption_kwh = gas.consumption_kwh;
		mergedData[dateStr].gas_cost = gas.cost;
	});

	const startDate = periodFrom.split('T')[0];
	const endDate = periodTo.split('T')[0];
	const weatherUrl = `https://archive-api.open-meteo.com/v1/archive?latitude=${LATITUDE}&longitude=${LONGITUDE}&start_date=${startDate}&end_date=${endDate}&daily=temperature_2m_mean&timezone=Europe/London`;

	const weatherResponse = await fetch(weatherUrl);
	if (!weatherResponse.ok) {
		throw new Error(`Weather API returned ${weatherResponse.status}`);
	}

	const weatherData = await weatherResponse.json();
	const weatherReadings = weatherData.daily.time.map((dateString: string, index: number) => ({
		date: new Date(dateString),
		temperature: weatherData.daily.temperature_2m_mean[index]
	}));

	weatherReadings.forEach((weather) => {
		const dateStr = weather.date.toISOString().split('T')[0];
		if (!mergedData[dateStr]) {
			mergedData[dateStr] = { date: weather.date };
		}
		mergedData[dateStr].temperature = weather.temperature;
	});

	const mergedDataArray = Object.values(mergedData).map((item) => {
		item.total_cost = (item.electricity_cost || 0) + (item.gas_cost || 0);
		return item;
	});

	return { readings: mergedDataArray };
};

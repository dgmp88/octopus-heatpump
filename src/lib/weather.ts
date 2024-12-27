export interface WeatherData {
	hourly: {
		time: string[];
		temperature_2m: number[];
		apparent_temperature: number[];
		relative_humidity_2m: number[];
		precipitation: number[];
	};
}

export async function fetchWeatherRange(startDate: string, endDate: string) {
	// We'll need to get these from config/env
	const LAT = 51.5074;
	const LONG = -0.1278;

	const url =
		`https://api.open-meteo.com/v1/forecast?` +
		`latitude=${LAT}&longitude=${LONG}` +
		`&hourly=temperature_2m,precipitation,apparent_temperature,relative_humidity_2m` +
		`&start_date=${startDate}&end_date=${endDate}`;

	const response = await fetch(url);
	const weatherData: WeatherData = await response.json();
	return weatherData;
}

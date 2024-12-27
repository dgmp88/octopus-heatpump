type OpenMeteoResponse = {
	hourly: {
		time: string[];
		temperature_2m: number[];
		apparent_temperature: number[];
		relative_humidity_2m: number[];
		precipitation: number[];
	};
};

export type WeatherData = {
	timestamp: string[]; // dates
	temperature: number[];
	apparentTemperature: number[];
	humidity: number[];
	precipitation: number[];
};

export async function fetchWeatherRange(
	startDate: string,
	endDate: string,
	weekly: boolean
): Promise<WeatherData> {
	// We'll need to get these from config/env
	const LAT = 51.5074;
	const LONG = -0.1278;

	const url =
		`https://api.open-meteo.com/v1/forecast?` +
		`latitude=${LAT}&longitude=${LONG}` +
		`&hourly=temperature_2m,precipitation,apparent_temperature,relative_humidity_2m` +
		`&start_date=${startDate}&end_date=${endDate}`;

	const response = await fetch(url);
	const weatherData: OpenMeteoResponse = await response.json();

	// Parse to a format that the charts can use
	const parsed: WeatherData = {
		timestamp: weatherData.hourly.time.map((time) =>
			weekly
				? new Date(time).toLocaleDateString()
				: new Date(time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
		),
		temperature: weatherData.hourly.temperature_2m,
		precipitation: weatherData.hourly.precipitation,
		apparentTemperature: weatherData.hourly.apparent_temperature,
		humidity: weatherData.hourly.relative_humidity_2m
	};

	return parsed;
}

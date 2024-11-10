<script lang="ts">
	import { onMount } from 'svelte';
	import Chart from 'chart.js/auto';
	import { createWeatherChart } from '$lib/charts';

	let { selectedDate, weekly, availableDates } = $props<{
		selectedDate: string;
		weekly: boolean;
		availableDates: string[];
	}>();

	let chart: Chart;

	interface WeatherData {
		hourly: {
			time: string[];
			temperature_2m: number[];
			apparent_temperature: number[];
			relative_humidity_2m: number[];
			precipitation: number[];
		};
	}

	async function fetchWeatherRange(startDate: string, endDate: string) {
		// We'll need to get these from config/env
		const LAT = 51.5074;
		const LONG = -0.1278;

		const url =
			`https://api.open-meteo.com/v1/forecast?` +
			`latitude=${LAT}&longitude=${LONG}` +
			`&hourly=temperature_2m,precipitation,apparent_temperature,relative_humidity_2m` +
			`&start_date=${startDate}&end_date=${endDate}`;

		const response = await fetch(url);
		return (await response.json()) as WeatherData;
	}

	async function updateChart() {
		let weatherData: WeatherData;

		if (weekly) {
			// Get data for the whole range
			const startDate = availableDates[0];
			const endDate = availableDates[availableDates.length - 1];
			weatherData = await fetchWeatherRange(startDate, endDate);
		} else {
			// Get data just for selected date
			weatherData = await fetchWeatherRange(selectedDate, selectedDate);
		}

		const data = {
			labels: weatherData.hourly.time.map((time) =>
				weekly
					? new Date(time).toLocaleDateString()
					: new Date(time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
			),
			temperature: weatherData.hourly.temperature_2m,
			precipitation: weatherData.hourly.precipitation,
			apparent_temperature: weatherData.hourly.apparent_temperature,
			relative_humidity: weatherData.hourly.relative_humidity_2m
		};

		if (chart) {
			chart.destroy();
		}

		chart = createWeatherChart('weather', data);
	}

	$effect(() => {
		updateChart();
	});

	onMount(() => {
		updateChart();
	});
</script>

<h1>Weather</h1>
<div style="width: 100%">
	<canvas id="weather"></canvas>
</div>

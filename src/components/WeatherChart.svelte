<script lang="ts">
	import { fetchWeatherRange } from '$lib/weather';
	import Chart from 'chart.js/auto';
	import { onMount } from 'svelte';

	let { selectedDate, weekly, availableDates } = $props<{
		selectedDate: string;
		weekly: boolean;
		availableDates: string[];
	}>();

	let chart: Chart;

	const elementId = 'weather';

	function createWeatherChart(weatherData: WeatherData) {
		if (chart) {
			chart.destroy();
		}

		const ctx = document.getElementById(elementId) as HTMLCanvasElement;

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

		chart = new Chart(ctx, {
			type: 'line',
			data: {
				labels: data.labels,
				datasets: [
					{
						label: 'Temperature (°C)',
						data: data.temperature,
						borderColor: 'rgba(255, 99, 132, 0.3)',
						yAxisID: 'y'
					},
					{
						label: 'Perceived Temperature (°C)',
						data: data.apparent_temperature,
						borderColor: 'rgb(54, 162, 235)',
						yAxisID: 'y1'
					}
				]
			},
			options: {
				responsive: true,
				scales: {
					y: {
						type: 'linear',
						display: true,
						position: 'left',
						title: {
							display: true,
							text: 'Temperature (°C)'
						}
					},
					y1: {
						type: 'linear',
						display: true,
						position: 'right',
						title: {
							display: true,
							text: 'Perceived Temperature (°C)'
						},
						min: 0
					}
				}
			}
		});
	}

	$effect(() => {
		let startDate, endDate;
		if (weekly) {
			// Get data for the whole range
			startDate = availableDates[0];
			endDate = availableDates[availableDates.length - 1];
		} else {
			// Get data for the selected date
			startDate = selectedDate;
			endDate = selectedDate;
		}

		fetchWeatherRange(startDate, endDate).then((weatherData) => {
			createWeatherChart(weatherData);
		});
	});
</script>

<h1>Weather</h1>
<div style="width: 100%">
	<canvas id={elementId}></canvas>
</div>

<script lang="ts">
	import type { PageData } from './$types';
	import { onMount, onDestroy } from 'svelte';
	import { Chart } from 'chart.js';

	let { data }: { data: PageData } = $props();
	let chart: Chart;

	onMount(() => {
		const ctx = document.getElementById('usageChart') as HTMLCanvasElement;

		chart = new Chart(ctx, {
			type: 'line',
			data: {
				labels: data.readings.map((reading) => new Date(reading.date).toLocaleDateString()),
				datasets: [
					{
						label: 'Total Cost (£)',
						data: data.readings.map((reading) => reading.total_cost),
						borderColor: 'rgb(75, 192, 192)',
						yAxisID: 'y1',
						tension: 0.1
					},
					{
						label: 'Temperature (°C)',
						data: data.readings.map((reading) => reading.temperature),
						borderColor: 'rgb(255, 99, 132)',
						yAxisID: 'y2',
						tension: 0.1
					}
				]
			},
			options: {
				scales: {
					y1: {
						type: 'linear',
						position: 'left',
						beginAtZero: true,
						title: {
							display: true,
							text: 'Cost (£)'
						}
					},
					y2: {
						type: 'linear',
						position: 'right',
						beginAtZero: true,
						grid: {
							drawOnChartArea: false
						},
						title: {
							display: true,
							text: 'Temperature (°C)'
						}
					}
				},
				plugins: {
					tooltip: {
						mode: 'index',
						intersect: false
					},
					legend: {
						position: 'top'
					}
				},
				interaction: {
					mode: 'nearest',
					axis: 'x',
					intersect: false
				}
			}
		});
	});

	onDestroy(() => {
		if (chart) {
			chart.destroy();
		}
	});
</script>

<canvas id="usageChart"></canvas>

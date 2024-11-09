<script lang="ts">
	import type { PageData } from './$types';

	import { onMount } from 'svelte';
	import Chart from 'chart.js/auto';
	import { calculateDailyCost } from '$lib/calc';
	let { data }: { data: PageData } = $props();

	const { sortedReadings } = data;
	const dailyReadings = calculateDailyCost(sortedReadings);

	function formatDate(date: string) {
		return new Date(date).toLocaleDateString('en-GB');
	}

	onMount(async () => {
		const xData = dailyReadings.map((row) => formatDate(row.date));
		const yCost = dailyReadings.map((row) => row.cost);
		const yConsumption = dailyReadings.map((row) => row.consumptionKwh);

		const ctx = document.getElementById('cost') as HTMLCanvasElement;
		new Chart(ctx, {
			type: 'bar',
			data: {
				labels: xData,
				datasets: [
					{
						label: 'Cost (£)',
						data: yCost,
						borderRadius: 100,
						borderWidth: 2,
						yAxisID: 'y'
					},
					{
						label: 'Consumption (Kwh)',
						data: yConsumption,
						borderRadius: 100,
						borderWidth: 2,
						yAxisID: 'y1'
					}
				]
			},

			options: {
				responsive: true,
				scales: {
					x: {
						title: {
							display: true,
							text: 'Date'
						}
					},
					y: {
						beginAtZero: true,
						title: {
							display: true,
							text: 'Cost (£)'
						}
					},
					y1: {
						beginAtZero: true,
						position: 'right',
						title: {
							display: true,
							text: 'Consumption (KWh)'
						}
					}
				}
			}
		});
	});
</script>

<div class="hero bg-base-200 min-h-screen">
	<div class="hero-content w-3/4 min-w-96 max-w-[40rem] text-center">
		<div class="w-full">
			<h1 class="pb-10 text-5xl font-bold">Electricity Usage</h1>
			<div style="width: 100%"><canvas id="cost"></canvas></div>
			<div style="width: 100%"><canvas id="consumption"></canvas></div>

			<button class="btn btn-primary">Get Started</button>
		</div>
	</div>
</div>

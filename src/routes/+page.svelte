<script lang="ts">
	import type { DailyResult } from '$lib/types';
	import type { PageData } from './$types';

	import { onMount } from 'svelte';
	import Chart from 'chart.js/auto';
	import { calculateDailyCost } from '$lib/calc';
	let { data }: { data: PageData } = $props();

	const { sortedReadings } = data;
	const dailyReadings = calculateDailyCost(sortedReadings);

	let loading = true;
	let error: null | any = null;

	function formatDate(date: string) {
		return new Date(date).toLocaleDateString('en-GB');
	}

	function initConsumptionChart() {
		const ctx = document.getElementById('consumption') as HTMLCanvasElement;

		new Chart(ctx, {
			type: 'bar',
			data: {
				labels: dailyReadings.map((row) => formatDate(row.date)),
				datasets: [
					{
						label: 'Consumption (KWh)',
						data: dailyReadings.map((row) => row.consumptionKwh),
						borderRadius: 100
					}
				]
			},

			options: {
				scales: {
					x: {
						title: {
							display: true,
							text: 'Date'
						}
					},
					y: {
						beginAtZero: true
					}
				}
			}
		});
	}

	function initCostChart() {
		const ctx = document.getElementById('cost') as HTMLCanvasElement;

		new Chart(ctx, {
			type: 'bar',
			data: {
				labels: dailyReadings.map((row) => formatDate(row.date)),
				datasets: [
					{
						label: 'Cost (£)',
						data: dailyReadings.map((row) => row.cost),

						borderRadius: 100
					}
				]
			}
		});
	}

	onMount(async () => {
		try {
			const response = await fetch('/api/usage');
			const jsonData = await response.json();

			if (!response.ok) {
				throw new Error(jsonData.details || 'Failed to fetch data');
			}

			data = jsonData;
			console.log(data);
			initCostChart();
			initConsumptionChart();
		} catch (e) {
			error = e.message;
		} finally {
			loading = false;
		}
	});
</script>

<main class="mx-auto max-w-4xl p-6">
	<h1 class="mb-8 text-4xl font-bold tracking-tight text-gray-900">Weekly Electricity Usage</h1>

	<div style="width: 100%"><canvas id="cost"></canvas></div>
	<div style="width: 100%"><canvas id="consumption"></canvas></div>
</main>

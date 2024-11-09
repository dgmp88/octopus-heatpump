<script lang="ts">
	import type { PageData } from './$types';
	import { onMount } from 'svelte';
	import { calculateDailyCost, getRateForHour } from '$lib/calc';
	import { createChart } from './chart';
	import type Chart from 'chart.js/auto';
	import type { ConsumptionResult } from '$lib/types';
	import WeatherChart from '../components/WeatherChart.svelte';

	let { data }: { data: PageData } = $props();
	let weekly: boolean = $state(false);
	let chart: Chart;

	const { sortedReadings } = data;
	const dailyReadings = calculateDailyCost(sortedReadings);

	// Get all available dates
	const availableDates = [
		...new Set(
			sortedReadings.map((reading) => new Date(reading.interval_start).toISOString().split('T')[0])
		)
	].sort();

	// Start with most recent date
	let selectedDate = $state(availableDates[availableDates.length - 1]);
	let currentIndex = $derived(availableDates.indexOf(selectedDate));

	function getReadingsForDate(date: string) {
		return sortedReadings.filter((reading) => reading.interval_start.startsWith(date));
	}

	function formatDate(date: string) {
		return new Date(date).toLocaleDateString('en-GB');
	}

	function formatHour(dateTime: string) {
		return new Date(dateTime).getHours();
	}

	function calculateHourlyCost(reading: ConsumptionResult) {
		const hour = new Date(reading.interval_start).getHours();
		const rate = getRateForHour(hour);
		return reading.consumption * rate;
	}

	function previousDay() {
		if (currentIndex > 0) {
			selectedDate = availableDates[currentIndex - 1];
		}
	}

	function nextDay() {
		if (currentIndex < availableDates.length - 1) {
			selectedDate = availableDates[currentIndex + 1];
		}
	}

	function updateChart() {
		if (chart) {
			chart.destroy();
		}

		const data = weekly
			? {
					xLabels: dailyReadings.map((row) => formatDate(row.date)),
					costs: dailyReadings.map((row) => row.cost),
					consumption: dailyReadings.map((row) => row.consumptionKwh)
				}
			: {
					xLabels: getReadingsForDate(selectedDate).map((row) => formatHour(row.interval_start)),
					costs: getReadingsForDate(selectedDate).map((row) => calculateHourlyCost(row)),
					consumption: getReadingsForDate(selectedDate).map((row) => row.consumption)
				};

		chart = createChart('cost', data, !weekly);
	}

	$effect(() => {
		updateChart();
	});

	onMount(() => {
		updateChart();
	});
</script>

<main class="bg-base-200 min-h-screen px-3 py-10">
	<div class="mx-auto w-full max-w-[50rem] text-center">
		<h1 class="pb-8 text-3xl font-bold">⚡ Electricity Usage ⚡</h1>
		<div class="flex flex-col items-center gap-2 pb-3">
			<div class="w-36">
				<label class="label">
					<span class="label-text">Day</span>
					<input type="checkbox" class="toggle" bind:checked={weekly} />
					<span class="label-text">Week</span>
				</label>
			</div>
			{#if !weekly}
				<div class="flex items-center justify-between gap-2">
					<button class="btn btn-primary btn-xs" onclick={previousDay} disabled={currentIndex === 0}
						>←</button
					>
					<span>{formatDate(selectedDate)}</span>
					<button
						class="btn btn-primary btn-xs"
						onclick={nextDay}
						disabled={currentIndex === availableDates.length - 1}>→</button
					>
				</div>
				<div class="stats shadow">
					<div class="stat">
						<div class="stat-title text-sm">Total Cost</div>
						<div class="stat-value text-xl">£{dailyReadings[currentIndex].cost.toFixed(2)}</div>
					</div>
					<div class="stat">
						<div class="stat-title text-sm">Total Usage</div>
						<div class="stat-value text-xl">
							{dailyReadings[currentIndex].consumptionKwh.toFixed(2)} kWh
						</div>
					</div>
				</div>
			{/if}
		</div>

		<div class="relative w-full"><canvas id="cost"></canvas></div>
		<WeatherChart {selectedDate} {weekly} {availableDates} />
	</div>
</main>

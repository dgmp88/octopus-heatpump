<script lang="ts">
	import type { DailyResult } from '$lib/types';
	import { onMount } from 'svelte';

	let data: DailyResult[] = [];
	let loading = true;
	let error = null;

	onMount(async () => {
		try {
			const response = await fetch('/api/usage');
			const jsonData = await response.json();

			if (!response.ok) {
				throw new Error(jsonData.details || 'Failed to fetch data');
			}

			data = jsonData;
		} catch (e) {
			error = e.message;
		} finally {
			loading = false;
		}
	});

	function formatCurrency(amount: number) {
		return new Intl.NumberFormat('en-GB', {
			style: 'currency',
			currency: 'GBP',
			minimumFractionDigits: 2
		}).format(amount);
	}
</script>

<main class="mx-auto max-w-4xl p-6">
	<h1 class="mb-8 text-4xl font-bold tracking-tight text-gray-900">Weekly Electricity Usage</h1>

	{#if loading}
		<p class="text-gray-600">Loading...</p>
	{:else if error}
		<div class="mb-4 border-l-4 border-red-500 bg-red-50 p-4">
			<p class="text-red-700">Error: {error}</p>
		</div>
	{:else}
		<div class="overflow-hidden rounded-lg border border-gray-200 shadow-lg">
			<table class="w-full border-collapse bg-white">
				<thead>
					<tr class="bg-gray-50">
						<th class="border-b border-gray-200 p-4 text-left text-sm font-semibold text-gray-900">
							Date
						</th>
						<th class="border-b border-gray-200 p-4 text-right text-sm font-semibold text-gray-900">
							Usage (kWh)
						</th>
						<th class="border-b border-gray-200 p-4 text-right text-sm font-semibold text-gray-900">
							Cost
						</th>
					</tr>
				</thead>
				<tbody class="divide-y divide-gray-200">
					{#each data as { date, consumptionKwh, cost }, i}
						<tr class={i % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
							<td class="p-4 text-sm text-gray-900">
								{date}
							</td>
							<td class="p-4 text-right text-sm font-medium text-gray-900">
								{consumptionKwh.toFixed(1)}
							</td>
							<td class="p-4 text-right text-sm font-medium text-gray-900">
								{formatCurrency(cost)}
							</td>
						</tr>
					{/each}
				</tbody>
			</table>
		</div>
	{/if}
</main>

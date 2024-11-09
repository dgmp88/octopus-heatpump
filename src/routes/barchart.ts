import Chart, { type ChartOptions } from 'chart.js/auto';

type ChartDatum = {
	x: number | string | Date;
	y: number | string | Date;
};

type ChartInput = {
	id: string;
	data: ChartDatum[];
	ylabel: string;
	xlabel: string;
};

export function barchart(inputs: ChartInput) {
	const ctx = document.getElementById(inputs.id) as HTMLCanvasElement;

	new Chart(ctx, {
		type: 'bar',
		data: {
			labels: inputs.data.map((row) => row.x),
			datasets: [
				{
					label: inputs.ylabel,
					data: inputs.data.map((row) => row.y),
					borderRadius: 100,
					borderWidth: 2
				}
			]
		},

		options: {
			responsive: true,
			scales: {
				x: {
					title: {
						display: true,
						text: inputs.xlabel
					}
				},
				y: {
					beginAtZero: true
				}
			}
		}
	});
}

import Chart from 'chart.js/auto';
import annotationPlugin from 'chartjs-plugin-annotation';

Chart.register(annotationPlugin);

function generateTariffAnnotations() {
	const tariffPeriods = [
		{ start: 4, end: 7, type: 'low' },
		{ start: 13, end: 16, type: 'low' },
		{ start: 16, end: 19, type: 'peak' },
		{ start: 22, end: 24, type: 'low' }
	];

	const boxes = tariffPeriods.map(({ start, end, type }) => {
		const color =
			type === 'peak'
				? 'rgba(255, 99, 132, 0.3)' // red
				: 'rgba(75, 192, 192, 0.3)'; // green

		const data = {
			type: 'box',
			xMin: start - 0.5,
			xMax: end - 0.5,
			yMin: 0,
			yMax: 'max',
			backgroundColor: color,
			borderWidth: 0,
			drawTime: 'beforeDatasetsDraw'
		};

		const name = `${type}${start}-${end}`;

		return [name, data];
	});

	return Object.fromEntries(boxes);
}

// Could go in a separate utils file
export function createChart(
	elementId: string,
	data: {
		xLabels: string[] | number[];
		costs: number[];
		consumption: number[];
	},
	isHourly: boolean = false
) {
	const ctx = document.getElementById(elementId) as HTMLCanvasElement;

	const annotations = isHourly ? generateTariffAnnotations() : {};
	const xLabels = data.xLabels.map((label) => {
		if (isHourly) {
			return `${label}:00`;
		}
		return label;
	});

	return new Chart(ctx, {
		type: 'bar',
		data: {
			labels: xLabels,
			datasets: [
				{
					label: 'Cost (£)',
					data: data.costs,
					borderRadius: 100,
					borderWidth: 0,
					yAxisID: 'y',

					backgroundColor: 'rgba(255, 99, 132, 1.0)'
				},
				{
					label: 'Consumption (Kwh)',
					data: data.consumption,
					borderRadius: 100,
					borderWidth: 0,
					yAxisID: 'y1',
					backgroundColor: 'rgba(255, 255, 64)'
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
			},
			plugins: {
				annotation: {
					annotations
				}
			}
		}
	});
}

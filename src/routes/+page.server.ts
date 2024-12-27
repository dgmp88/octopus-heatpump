import { getAllReadings } from '$lib/octopus';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async () => {
	const now = new Date();
	//  Set now to 12am
	now.setHours(0, 0, 0, 0);
	const sevenDaysAgo = new Date(now);
	sevenDaysAgo.setDate(now.getDate() - 7);

	console.log('From', sevenDaysAgo.toISOString(), 'To', now.toISOString());

	const readings = await getAllReadings(sevenDaysAgo, now);

	return { readings };
};

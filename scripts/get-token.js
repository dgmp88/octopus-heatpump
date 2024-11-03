// scripts/get-token.js
import { loadEnv } from 'vite';
import fs from 'fs/promises';
import path from 'path';

// Load environment variables using Vite's built-in functionality
const env = loadEnv('', process.cwd(), '');
const APIKey = env.OCTOPUS_API_KEY;

if (!APIKey) {
	console.error('Please set OCTOPUS_API_KEY in your .env file');
	process.exit(1);
}

const query = `
  mutation ObtainKrakenToken($input: ObtainJSONWebTokenInput!) {
    obtainKrakenToken(input: $input) {
      token
      refreshToken
    }
  }
`;

async function getToken() {
	try {
		const response = await fetch('https://api.octopus.energy/v1/graphql/', {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json'
			},
			body: JSON.stringify({
				query,
				variables: {
					input: {
						APIKey
					}
				}
			})
		});

		const data = await response.json();

		if (data.data?.obtainKrakenToken?.token) {
			const token = data.data.obtainKrakenToken.token;

			// Update the .env file
			const envPath = path.join(process.cwd(), '.env');
			const envContent = await fs.readFile(envPath, 'utf-8');
			const updatedContent = envContent.includes('OCTOPUS_TOKEN=')
				? envContent.replace(/OCTOPUS_TOKEN=.*/, `OCTOPUS_TOKEN=${token}`)
				: envContent + `\nOCTOPUS_TOKEN=${token}`;

			await fs.writeFile(envPath, updatedContent);
			console.log('Token obtained and stored in .env file');
			console.log('Token:', token);
		} else {
			console.error('Failed to get token:', data);
		}
	} catch (error) {
		console.error('Error getting token:', error);
	}
}

getToken();

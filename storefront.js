import { createStorefrontApiClient } from '@shopify/storefront-api-client';

export const client = createStorefrontApiClient({
	storeDomain: 'home-assignment-96.myshopify.com',
	apiVersion: '2024-04',
	publicAccessToken: process.env.STOREFRONT_ACCESS_TOKEN,
});

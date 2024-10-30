import { client } from './storefront.js';

export async function getCustomerData(customerAccessToken) {
	const queryCustomer = `
      query {
          customer(customerAccessToken: "${customerAccessToken}") {
              id
              firstName
              lastName
              email
          }
      }
  `;

	try {
		const { data, errors } = await client.request(queryCustomer);

		if (errors) {
			if (Array.isArray(errors)) {
				throw new Error(
					'Error fetching customer data: ' + errors.map((error) => error.message).join(', ')
				);
			} else {
				throw new Error('Error fetching customer data: ' + JSON.stringify(errors));
			}
		}

		return data.customer;
	} catch (error) {
		console.error('Error fetching customer data:', error);
		throw new Error('Could not fetch customer data');
	}
}

import { join } from 'path';
import { readFileSync } from 'fs';
import express from 'express';
import serveStatic from 'serve-static';
import cors from 'cors';
import db from './db.js';
import shopify from './shopify.js';
import webhooks from './webhooks.js';
import { getSessionsByShop, handleAuth } from './session.js';
import { getCustomerData } from './routes.js';

const PORT = parseInt(process.env.BACKEND_PORT || process.env.PORT, 10);

const STATIC_PATH =
	process.env.NODE_ENV === 'production'
		? `${process.cwd()}/frontend/dist`
		: `${process.cwd()}/frontend/`;

const app = express();

// CORS middleware
app.use(
	cors({
		origin: '*',
		credentials: true,
		methods: ['GET', 'POST', 'OPTIONS'],
	})
);

app.options('*', cors());

app.use(express.json());

// Set up Shopify authentication and webhook handling
app.get(shopify.config.auth.path, shopify.auth.begin());
app.get(shopify.config.auth.callbackPath, shopify.auth.callback(), handleAuth);
app.post(
	shopify.config.webhooks.path,
	// @ts-ignore
	shopify.processWebhooks({ webhookHandlers: webhooks })
);

/*
Route for checkout request
*/
app.post('/api/save-cart', async (req, res) => {
	const { customer_id, variant_ids } = req.body;
	console.log('HERE customerId', customer_id);
	console.log('HERE variant_ids', variant_ids);

	if (!customer_id || !variant_ids) {
		return res.status(400).json({ error: 'Parameters is required' });
	}

	try {
		const [result] = await db.execute(
			`INSERT INTO saved_carts (customer_id, cart_data) 
			 VALUES (?, ?) 
			 ON DUPLICATE KEY UPDATE cart_data = VALUES(cart_data), updated_at = CURRENT_TIMESTAMP`,
			[customer_id, JSON.stringify(variant_ids)]
		);

		res.status(201).json({ message: 'Cart saved successfully!' });
	} catch (error) {
		console.error('Error saving cart:', error);
		res.status(500).json({ message: 'Error saving cart' });
	}
});

/*
Route for request from liquid component
*/
app.post('/api/save-cart-proxy', async (req, res) => {
	try {
		console.log('Incoming request body:', req.body);

		const { customer_id, variant_ids } = req.body;

		if (!customer_id || !Array.isArray(variant_ids)) {
			return res.status(400).json({ message: 'Customer ID and variant IDs are required' });
		}

		let formData = {
			items: variant_ids.map((id) => ({
				id: id,
				quantity: 1,
			})),
		};

		const itemsToAdd = variant_ids.map((id) => ({ id, quantity: 1 }));

		const response = await fetch('https://home-assignment-96.myshopify.com/cart/add.js', {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json',
			},
			body: JSON.stringify(formData),
		});

		if (!response.ok) {
			const errorText = await response.text();
			console.error('Error response from Shopify:', errorText);
			throw new Error('Failed to add items to the cart');
		}

		const result = await response.json();
		console.log('Cart updated successfully:', result);
		res.status(200).json({ message: 'Cart saved successfully', cart: result });
	} catch (error) {
		console.error('Error saving cart:', error);
		res.status(500).json({ message: 'Error saving cart' });
	}
});

/*
Test routes for getting user data
*/
app.get('/api/session', async (req, res) => {
	return await getSessionsByShop(req, res);
});

app.post('/api/get-customer', async (req, res) => {
	const { token } = req.body;
	try {
		const customerData = await getCustomerData(token);
		if (customerData) {
			res.status(200).json(customerData);
		} else {
			res.status(404).json({ message: 'Customer not found' });
		}
	} catch (error) {
		res.status(500).json({ error: error.message });
	}
});

// All endpoints after this point will require an active session
app.use('/api/*', shopify.validateAuthenticatedSession());

app.use(serveStatic(STATIC_PATH, { index: false }));

app.use('/*', shopify.ensureInstalledOnShop(), async (_req, res) => {
	return res.set('Content-Type', 'text/html').send(readFileSync(join(STATIC_PATH, 'index.html')));
});

app.listen(PORT, () => {
	console.log(`Server is running on port ${PORT}`);
});

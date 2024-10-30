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
app.get('/api/retrieve-cart-proxy', async (req, res) => {
	const { customer_id } = req.query;

	if (!customer_id) {
		return res.status(400).json({ error: 'Customer ID is required' });
	}

	try {
		const [rows] = await db.execute(`SELECT cart_data FROM saved_carts WHERE customer_id = ?`, [
			customer_id,
		]);

		if (rows.length === 0) {
			return res.status(404).json({ message: 'Cart not found' });
		}

		const cartData = rows[0].cart_data;
		res.status(200).json({ cart: cartData });
	} catch (error) {
		console.error('Error retrieving cart:', error);
		res.status(500).json({ message: 'Error retrieving cart' });
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

import { join } from 'path';
import { readFileSync } from 'fs';
import express from 'express';
import serveStatic from 'serve-static';
import cors from 'cors';

import shopify from './shopify.js';
import webhooks from './webhooks.js';
import { getCurrentSessionId, getSessionsByShop, handleAuth } from './session.js';

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

// Set up Shopify authentication and webhook handling
app.get(shopify.config.auth.path, shopify.auth.begin());
app.get(shopify.config.auth.callbackPath, shopify.auth.callback(), handleAuth);
app.post(
	shopify.config.webhooks.path,
	// @ts-ignore
	shopify.processWebhooks({ webhookHandlers: webhooks })
);

app.get('/api/get-saved-cart', async (req, res) => {
	try {
		const [rows] = await db.execute('SELECT * FROM my_products_db WHERE user_id = ?', [
			req.user.id,
		]);
		res.json(rows);
	} catch (error) {
		console.error(error);
		res.status(500).json({ message: 'Error retrieving saved cart' });
	}
});

app.post('/api/save-cart', async (req, res) => {
	const data = req.body;
	console.log(data, 'HERE IS DATA');

	// if (!req.user || !req.user.id) {
	// 	return res.status(401).json({ message: 'Unauthorized: User not found' });
	// }

	try {
		const [result] = await db.execute(
			'INSERT INTO my_products_db (user_id, cart_data) VALUES (?, ?)',
			[req.user.id, JSON.stringify(data)]
		);
		res.status(201).json({ message: 'Data created successfully!', id: result.insertId });
	} catch (error) {
		console.error(error);
		res.status(500).json({ message: 'Error saving cart' });
	}
});

app.get('/api/session', async (req, res) => {
	// if (!shop) {
	// 	return res.status(400).json({ error: 'Shop parameter is required' });
	// }
	return await getSessionsByShop(req, res);
});

// All endpoints after this point will require an active session
app.use('/api/*', shopify.validateAuthenticatedSession());

app.use(express.json());

app.use(serveStatic(STATIC_PATH, { index: false }));

app.use('/*', shopify.ensureInstalledOnShop(), async (_req, res) => {
	return res.set('Content-Type', 'text/html').send(readFileSync(join(STATIC_PATH, 'index.html')));
});

app.listen(PORT, () => {
	console.log(`Server is running on port ${PORT}`);
});

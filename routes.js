// import express from 'express';
// import db from './db.js';
// import { getSessionFromStorage } from './session.js';

// const router = express.Router();

// router.get('/get-saved-cart', async (req, res) => {
// 	try {
// 		const [rows] = await db.execute('SELECT * FROM my_products_db WHERE user_id = ?', [
// 			req.user.id,
// 		]);
// 		res.json(rows);
// 	} catch (error) {
// 		console.error(error);
// 		res.status(500).json({ message: 'Error retrieving saved cart' });
// 	}
// });

// router.post('/save-cart', async (req, res) => {
// 	const data = req.body;
// 	console.log(data, 'HERE IS DATA');

// 	if (!req.user || !req.user.id) {
// 		return res.status(401).json({ message: 'Unauthorized: User not found' });
// 	}

// 	try {
// 		const [result] = await db.execute(
// 			'INSERT INTO my_products_db (user_id, cart_data) VALUES (?, ?)',
// 			[req.user.id, JSON.stringify(data)]
// 		);
// 		res.status(201).json({ message: 'Data created successfully!', id: result.insertId });
// 	} catch (error) {
// 		console.error(error);
// 		res.status(500).json({ message: 'Error saving cart' });
// 	}
// });

// app.get('/session-id', async (req, res) => {
// 	try {
// 		const session = await getSessionFromStorage(req, res);
// 		if (!session) {
// 			return res.status(404).json({ error: 'Session not found' });
// 		}

// 		// Assuming the session object contains the user ID or session ID you need
// 		const userId = session.id; // Adjust this depending on your session structure
// 		res.json({ userId }); // Respond with the user ID
// 	} catch (error) {
// 		console.error('Error fetching session ID:', error);
// 		res.status(500).json({ error: 'Internal Server Error' });
// 	}
// });

// export default router;

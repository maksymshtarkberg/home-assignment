import shopify from './shopify.js';

export async function handleAuth(req, res) {
	const { shop, code } = req.query;
	console.log('Received shop:', shop);
	console.log('Received code:', code);

	if (!shop || !code) {
		return res.status(400).send('Missing required parameters');
	}

	const session = await shopify.api.session.getCurrentId({
		isOnline: true,
		rawRequest: req,
		rawResponse: res,
	});

	if (session) {
		await shopify.config.sessionStorage.storeSession(session);
	}

	res.redirect('/');
}

export async function getSessionsByShop(req, res) {
	try {
		const { shop } = req.query;
		if (!shop) {
			return res.status(400).json({ error: 'Shop parameter is required' });
		}

		const sessions = await shopify.config.sessionStorage.findSessionsByShop(shop);

		if (!sessions || sessions.length === 0) {
			return res.status(404).json({ error: 'No sessions found for the specified shop' });
		}

		return res.json(sessions);
	} catch (error) {
		console.error('Error fetching sessions by shop:', error);
		return res.status(500).json({ error: 'Internal server error' });
	}
}

async function getSessionId(req, res) {
	// return shopify.api.session.getCurrentId({
	// 	isOnline: false,
	// 	rawRequest: req,
	// 	rawResponse: res,
	// });
	return shopify.sessionStorage;
}

export async function getCurrentSessionId(req, res) {
	try {
		const sessionId = await getSessionId(req, res);
		// if (!sessionId) {
		// 	return res.status(400).json({ error: 'Session ID is required' });
		// }

		// const session = await shopify.config.sessionStorage.loadSession(sessionId);
		// if (!session) {
		// 	return res.status(404).json({ error: 'Session not found' });
		// }

		return res.json(sessionId);
	} catch (error) {
		console.error('Error fetching session:', error);
		return res.status(500).json({ error: 'Internal server error' });
	}
}

export async function getOfflineSessionFromStorage(domain) {
	const sessionId = shopify.api.session.getOfflineId(domain);
	return shopify.config.sessionStorage.loadSession(sessionId);
}

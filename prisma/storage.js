import prisma from '../prisma/index.js';

export class PrismaSessionStorage {
	async storeSession(session) {
		try {
			await prisma.session.upsert({
				where: { id: session.id },
				update: {
					shop: session.shop,
					state: session.state,
					isOnline: session.isOnline,
					scope: session.scope,
					expires: session.expires ? new Date(session.expires) : null,
					accessToken: session.accessToken,
					userId: BigInt(session.userId) || null,
				},
				create: {
					id: session.id,
					shop: session.shop,
					state: session.state,
					isOnline: session.isOnline,
					scope: session.scope,
					expires: session.expires ? new Date(session.expires) : null,
					accessToken: session.accessToken,
					userId: BigInt(session.userId) || null,
				},
			});
			return true;
		} catch (error) {
			console.error('Error storing session:', error);
			return false;
		}
	}

	async findSessionsByShop(shop) {
		try {
			const sessions = await prisma.session.findMany({
				where: { shop },
			});
			return sessions.map((session) => convertToShopifySession(session));
		} catch (error) {
			console.error('Error finding sessions by shop:', error);
			return [];
		}
	}

	async loadSession(id) {
		try {
			const session = await prisma.session.findUnique({
				where: { id },
			});
			return session ? convertToShopifySession(session) : undefined;
		} catch (error) {
			console.error('Error loading session:', error);
			return undefined;
		}
	}

	async deleteSessions(shop) {
		try {
			await prisma.session.deleteMany({
				where: { shop },
			});
			return true;
		} catch (error) {
			console.error('Error deleting sessions:', error);
			return false;
		}
	}

	convertToShopifySession(sessionData) {
		return {
			id: sessionData.id,
			shop: sessionData.shop,
			state: sessionData.state,
			isOnline: sessionData.isOnline,
			scope: sessionData.scope,
			expires: sessionData.expires ? new Date(sessionData.expires) : null,
			accessToken: sessionData.accessToken,
			userId: sessionData.userId ? BigInt(sessionData.userId) : null,
		};
	}
}

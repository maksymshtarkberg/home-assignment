import mysql from 'mysql2/promise';

const db = await mysql.createConnection({
	host: 'localhost',
	port: 3306,
	user: 'root',
	password: 'XSp.9>e4',
	database: 'my_products_db',
});

export default db;

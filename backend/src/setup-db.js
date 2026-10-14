import "dotenv/config";
import mysql from "mysql2/promise";
const connection = await mysql.createConnection({ host:process.env.MYSQL_HOST||"localhost", port:Number(process.env.MYSQL_PORT)||3306, user:process.env.MYSQL_USER||"root", password:process.env.MYSQL_PASSWORD||"" });
const database = (process.env.MYSQL_DATABASE || "astrospacial").replace(/[^a-zA-Z0-9_]/g, "");
await connection.query(`CREATE DATABASE IF NOT EXISTS \`${database}\` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci`);
console.log(`Database '${database}' is ready.`);
await connection.end();

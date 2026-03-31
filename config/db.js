const mysql = require("mysql2/promise");
require("dotenv").config();
//use pool cause reuse connects and the connection limit is 10
const pool = mysql.createPool({
  host:     process.env.DB_HOST,
  user:     process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  port:     process.env.DB_PORT || 3306,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
});
//so basically creating table of users if it does not exist already in authdb, this will run when the server starts
const initDB = async () => {
  const createTable = `
    CREATE TABLE IF NOT EXISTS users (
      id          INT AUTO_INCREMENT PRIMARY KEY,
      name        VARCHAR(100)  NOT NULL,
      email       VARCHAR(150)  NOT NULL UNIQUE,
      password    VARCHAR(255)  NOT NULL,
      created_at  TIMESTAMP     DEFAULT CURRENT_TIMESTAMP,
      updated_at  TIMESTAMP     DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
    );
  `;
  try {
    await pool.query(createTable);
    console.log("MySQL connected & users table ready");
  } catch (error) {
    console.error(" MySQL init error:", error.message);
    process.exit(1);
  }
};

module.exports = { pool, initDB };
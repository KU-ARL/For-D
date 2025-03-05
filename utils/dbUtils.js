const mysql = require('mysql2/promise');
require('dotenv').config();

const pool = mysql.createPool({
  host: process.env.DB_HOST,         // DB 호스트
  user: process.env.DB_USER,         // DB 사용자
  password: process.env.DB_PASS,     // DB 비밀번호
  database: process.env.DB_NAME,     // DB 이름
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});

module.exports = pool;

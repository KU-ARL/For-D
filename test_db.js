const db = require('./db');

async function testConnection() {
  try {
    const [rows] = await db.query("SELECT 1");
    console.log("✅ MySQL 연결 성공!", rows);
  } catch (error) {
    console.error("❌ MySQL 연결 실패:", error);
  }
}

testConnection();

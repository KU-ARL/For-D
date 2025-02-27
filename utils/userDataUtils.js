const mysql = require('mysql2/promise');

const pool = mysql.createPool({
  host: process.env.DB_HOST,         // DB 호스트
  user: process.env.DB_USER,        // DB 사용자
  password: process.env.DB_PASS,// DB 비밀번호
  database: process.env.DB_NAME,    // DB 이름
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});

/**
 * 카카오 로그인으로 받은 사용자 정보를 DB에 저장합니다.
 * (이미 존재하면 업데이트)
 */
async function saveUser(userInfo) {
  const { name, account_email, gender, phone_number, profile_image, profile_nickname } = userInfo;
  const query = `
    INSERT INTO users (name, email, gender, phone_number, profile_image, profile_nickname, social_login_type, social_login_id)
    VALUES (?, ?, ?, ?, ?, ?, 'kakao', ?)
    ON DUPLICATE KEY UPDATE 
      name = VALUES(name),
      gender = VALUES(gender),
      phone_number = VALUES(phone_number),
      profile_image = VALUES(profile_image),
      profile_nickname = VALUES(profile_nickname)
  `;
  const params = [name, account_email, gender, phone_number, profile_image, profile_nickname, account_email];
  
  try {
    const [result] = await pool.execute(query, params);
    return result;
  } catch (error) {
    console.error('Error saving user:', error);
    throw error;
  }
}

/**
 * 이메일을 기준으로 사용자 정보를 조회합니다.
 */
async function getUserByEmail(email) {
  const query = 'SELECT * FROM users WHERE email = ?';
  try {
    const [rows] = await pool.execute(query, [email]);
    return rows[0];
  } catch (error) {
    console.error('Error fetching user:', error);
    throw error;
  }
}

module.exports = { saveUser, getUserByEmail };

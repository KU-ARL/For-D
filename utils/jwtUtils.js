const jwt = require('jsonwebtoken');
const pool = require('./dbUtils');

  // userId와 JWT 생성 키, 만료시간 1시간으로 토큰 생성
async function generateAndStoreJwt(userId) {
  const token = jwt.sign({ user_id: userId }, process.env.JWT_SECRET, { expiresIn: '1h' });

  const query = `INSERT INTO jwt_tokens (user_id, token) VALUES (?, ?)`;
  const params = [userId, token];

  try {
    await pool.execute(query, params);
    return token;
  } catch (err) {
    console.error('Error saving JWT token:', err);
    throw err;
  }
}


// 토큰을 통해 로그인 상태 검증
function verifyJwt(req, res, next) {
  console.log(req)
  console.log(req.cookies)
  const token = req.cookies.jwt_token || (req.headers.authorization && req.headers.authorization.split(' ')[1]);
  if (!token) {
    return res.status(401).json({ error: 'Token not provided' });
  }

  jwt.verify(token, process.env.JWT_SECRET, (err, decoded) => {
    if (err) {
      return res.status(401).json({ error: 'Invalid token' });
    }
    req.user = decoded; // decoded에는 { user_id, iat, exp }가 포함됨
    next(); // api 호출한 곳에서 다음 작업을 진행하도록 허용
  });
}


module.exports = { generateAndStoreJwt, verifyJwt };

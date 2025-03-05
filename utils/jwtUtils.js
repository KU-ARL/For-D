const jwt = require('jsonwebtoken');
const pool = require('./dbUtils');

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


function verifyJwt(req, res, next) {
  const token =
    req.cookies.jwt_token ||
    (req.headers.authorization && req.headers.authorization.split(' ')[1]);
  if (!token) {
    return res.status(401).json({ error: 'Token not provided' });
  }

  jwt.verify(token, process.env.JWT_SECRET, (err, decoded) => {
    if (err) {
      return res.status(401).json({ error: 'Invalid token' });
    }
    req.user = decoded; // decoded에는 { user_id, iat, exp }가 포함됨
    next();
  });
}


module.exports = { generateAndStoreJwt, verifyJwt };

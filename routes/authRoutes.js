const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const db = require('../db');
const router = express.Router();

const SECRET_KEY = process.env.JWT_SECRET;
const REFRESH_SECRET = process.env.REFRESH_SECRET;

// ✅ 회원가입 API
router.post('/register', async (req, res) => {
  const { email, password } = req.body;

  try {
    // 이메일 중복 검사
    const [existingUser] = await db.query('SELECT * FROM users WHERE email = ?', [email]);
    if (existingUser.length > 0) {
      return res.status(400).json({ message: '이미 사용 중인 이메일입니다.' });
    }

    // 비밀번호 해싱
    const hashedPassword = await bcrypt.hash(password, 10);
    
    // 사용자 저장
    await db.query('INSERT INTO users (email, password) VALUES (?, ?)', [email, hashedPassword]);

    res.status(201).json({ message: '회원가입 성공' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: '서버 오류' });
  }
});

// ✅ 로그인 API
router.post('/login', async (req, res) => {
  const { email, password } = req.body;

  try {
    // 사용자 조회
    const [user] = await db.query('SELECT * FROM users WHERE email = ?', [email]);
    if (user.length === 0) {
      return res.status(400).json({ message: '이메일 또는 비밀번호가 잘못되었습니다.' });
    }

    // 비밀번호 검증
    const isMatch = await bcrypt.compare(password, user[0].password);
    if (!isMatch) {
      return res.status(400).json({ message: '이메일 또는 비밀번호가 잘못되었습니다.' });
    }

    // JWT 토큰 생성
    const accessToken = jwt.sign({ userId: user[0].id, email: user[0].email }, SECRET_KEY, { expiresIn: '15m' });
    const refreshToken = jwt.sign({ userId: user[0].id }, REFRESH_SECRET, { expiresIn: '7d' });

    // 리프레시 토큰을 DB에 저장
    await db.query('UPDATE users SET refresh_token = ? WHERE id = ?', [refreshToken, user[0].id]);

    // 쿠키로 리프레시 토큰 전달
    res.cookie('refreshToken', refreshToken, {
      httpOnly: true,
      secure: true,
      sameSite: 'Strict'
    });

    res.json({ accessToken });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: '서버 오류' });
  }
});

// ✅ 토큰 갱신 API
router.post('/refresh-token', async (req, res) => {
  const { refreshToken } = req.cookies;
  if (!refreshToken) return res.status(403).json({ message: '리프레시 토큰이 없습니다.' });

  try {
    // DB에서 리프레시 토큰 확인
    const [user] = await db.query('SELECT * FROM users WHERE refresh_token = ?', [refreshToken]);
    if (user.length === 0) return res.status(403).json({ message: '유효하지 않은 리프레시 토큰' });

    // 리프레시 토큰 검증
    jwt.verify(refreshToken, REFRESH_SECRET, (err, decoded) => {
      if (err) return res.status(403).json({ message: '리프레시 토큰이 유효하지 않습니다.' });

      // 새 액세스 토큰 발급
      const newAccessToken = jwt.sign({ userId: user[0].id, email: user[0].email }, SECRET_KEY, { expiresIn: '15m' });
      res.json({ accessToken: newAccessToken });
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: '서버 오류' });
  }
});

module.exports = router;

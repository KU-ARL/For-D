require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const cookieParser = require('cookie-parser');
const path = require('path');
const authRoutes = require('./routes/authRoutes');

const passport = require('passport');
const session = require('express-session');
const KakaoStrategy = require('passport-kakao').Strategy;
const mysql = require('mysql2/promise');
const jwt = require('jsonwebtoken');

const app = express();

// ✅ 정적 파일 서빙 (index.html 포함)
app.use(express.static(path.join(__dirname, 'public')));

// ✅ 정적 파일 서빙 (index.html 포함)
app.use(express.static(path.join(__dirname, 'resources')));

// ✅ 기본 루트 경로에서 index.html 제공
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', '/startpage.html'));
});

// MySQL 연결
const db = mysql.createPool({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASS,
    database: process.env.DB_NAME,
  });


app.use(express.json());


app.use(
    cors({
        origin: ["http://localhost:5000", "http://127.0.0.1:5000"], // CORS 오류 해결
        credentials: true,
    })
);

app.use(cookieParser());


// ✅ CSP 정책 수정
app.use(
    helmet({
        contentSecurityPolicy: {
            directives: {
                defaultSrc: ["'self'"],
                scriptSrc: ["'self'", "'unsafe-inline'"],
                connectSrc: ["'self'", "http://localhost:5000"], // API 요청 허용
            },
        },
    })
);


const paymentRoutes = require("./routes/paymentRoutes");






// ✅ 결제 API 라우트
app.use("/api/payment", paymentRoutes);

// ✅ 로그인 API 라우트
app.use('/api/auth', authRoutes);




// 세션 설정
app.use(session({
    secret: process.env.JWT_SECRET,
    resave: false,
    saveUninitialized: false
  }));
  
  app.use(passport.initialize());
  app.use(passport.session());
  

  // Passport 카카오 로그인 설정
  passport.use(new KakaoStrategy({
    clientID: process.env.KAKAO_CLIENT_ID,
    clientSecret: process.env.KAKAO_CLIENT_SECRET,
    callbackURL: process.env.KAKAO_REDIRECT_URI
  }, async (accessToken, refreshToken, profile, done) => {
    try {
      const { id, kakao_account } = profile;
      const email = kakao_account?.account_email || "gyuho1215@test.com";
      const name = kakao_account?.profile_nickname || "카카오 사용자";
      const gender = kakao_account?.gender || "Other";  // 남(male) / 여(female) / 기타(Other)
      
      // MySQL에 사용자 정보 저장
      const [user] = await db.query(`
        SELECT * FROM users WHERE social_login_type = 'kakao' AND social_login_id = ?
      `, [id]);
  
      let userId;
      
      if (user.length === 0) {
        // 새로운 사용자 가입
        const [result] = await db.query(`
          INSERT INTO users (name, email, gender, social_login_type, social_login_id, created_at, updated_at)
          VALUES (?, ?, ?, ?, ?, NOW(), NOW())
        `, [name, email, gender, 'kakao', id]);
  
        userId = result.insertId;
      } else {
        userId = user[0].id;
      }
  
      const token = jwt.sign({ id: userId }, process.env.JWT_SECRET, { expiresIn: '1h' });
  
      return done(null, { token, userId, name, email });
    } catch (error) {
      return done(error, null);
    }
  }));

  passport.serializeUser((user, done) => {
    console.log("Serializing user:", user); // 로그 추가
    done(null, user.userId); // user 객체에서 userId만 저장
  });
  
  passport.deserializeUser(async (id, done) => {
    try {
      const [user] = await db.query("SELECT id, name, email, gender FROM users WHERE id = ?", [id]);
  
      if (user.length === 0) {
        return done(null, false);
      }
  
      console.log("Deserialized user:", user[0]); // 로그 추가
      done(null, user[0]);
    } catch (error) {
      done(error, null);
    }
  });
  
  
  // 로그인 라우트
  app.get('/auth/kakao', passport.authenticate('kakao'));
  
  // 로그인 콜백
  app.get('/auth/kakao/callback', passport.authenticate('kakao', { failureRedirect: '/' }), (req, res) => {
    res.json({ token: req.user.token, message: '카카오 로그인 성공' });
  });
  
  // 사용자 정보 확인 (JWT 필요)
  app.get('/profile', async (req, res) => {
    try {
      const token = req.headers.authorization?.split(' ')[1];
      if (!token) return res.status(401).json({ message: '토큰이 필요합니다' });
  
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      const [user] = await db.query('SELECT id, name, email, gender FROM users WHERE id = ?', [decoded.id]);
  
      if (user.length === 0) return res.status(404).json({ message: '사용자를 찾을 수 없습니다' });
  
      res.json(user[0]);
    } catch (error) {
      res.status(401).json({ message: '유효하지 않은 토큰' });
    }
  });

const PORT = process.env.PORT || 5000;
app.listen(PORT, '0.0.0.0', () => console.log(`✅ Server running on http://0.0.0.0:${PORT}`));


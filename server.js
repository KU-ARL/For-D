require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const cookieParser = require('cookie-parser');
const path = require('path');
const authRoutes = require('./routes/authRoutes');

const app = express();

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



// ✅ 정적 파일 서빙 (index.html 포함)
app.use(express.static(path.join(__dirname, 'public')));

// ✅ 기본 루트 경로에서 index.html 제공
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', '/login/login.html'));
});

app.use('/api/auth', authRoutes);

const PORT = process.env.PORT || 5000;
app.listen(PORT, '0.0.0.0', () => console.log(`✅ Server running on http://0.0.0.0:${PORT}`));


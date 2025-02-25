require('dotenv').config();
const express = require('express');
const session = require('express-session');
const axios = require('axios');
const path = require('path');

const app = express();
const port = process.env.PORT;

const authUtils = require('./utils/kakoOauthUtils');
const dbUtils = require('./utils/userDataUtils');

// 세션 미들웨어 설정
app.use(session({
    secret: 'your_secret_key', // 비밀키는 임의로 설정
    resave: false,
    saveUninitialized: true
  }));



// ✅ 정적 파일 서빙 (HTML, CSS, JS)
app.use(express.static(path.join(__dirname, 'public')));

// ✅ 정적 파일 서빙 (index.html 포함)
app.use(express.static(path.join(__dirname, 'resources')));

// ✅ 정적 파일 서빙 (utils 모듈)
app.use(express.static(path.join(__dirname, 'utils')));

// ✅ 기본 루트 경로에서 index.html 제공
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'startpage.html'));
});

// 카카오 로그인 시작: 클라이언트를 카카오 인증 페이지로 리다이렉트
app.get('/auth/kakao', (req, res) => {

    const KAKAO_CLIENT_ID = process.env.KAKAO_CLIENT_ID; // 카카오 개발자 콘솔에서 발급받은 Client ID
    const KAKAO_CLIENT_SECRET = process.env.KAKAO_CLIENT_SECRET; // (필요시) 클라이언트 시크릿
    const KAKAO_REDIRECT_URI = process.env.KAKAO_REDIRECT_URI;

    const kakaoAuthUrl = `https://kauth.kakao.com/oauth/authorize?client_id=${KAKAO_CLIENT_ID}&redirect_uri=${KAKAO_REDIRECT_URI}&response_type=code&prompt=login`;  // prompt=login이 있어야 매번 id/pw 입력력
    res.redirect(kakaoAuthUrl);

});

// 카카오 인증 후 리다이렉트 받을 콜백 라우트
app.get('/auth/kakao/callback', async (req, res) => {
    const { code } = req.query;

    if (!code) {
        return res.status(400).send('Authorization code not provided.');
    }

    try {
        // authUtils의 로직을 호출하여 카카오 사용자 정보를 받아옴
        const { userInfo, accessToken } = await authUtils.getKakaoUserInfo(code);
    
        req.session.accessToken = accessToken; // 받은 액세스 토큰을 세션에 저장
        req.session.email = userInfo.account_email; // 세션에 이메일 저장 (식별용)

        // DB에 사용자 정보 저장 (새로운 사용자이면 INSERT, 기존이면 UPDATE)
        await dbUtils.saveUser({
            name: userInfo.name,
            account_email: userInfo.account_email,
            gender: userInfo.gender,
            phone_number: userInfo.phone_number,
            profile_image: userInfo.profile_image,
            profile_nickname: userInfo.profile_nickname
        });
    
        // 마이페이지로 리다이렉트
        res.redirect('/menupage.html');
    } catch (error) {
      console.error(error);
      res.status(500).send('인증 과정 중 오류가 발생하였습니다.');
    }
});

// API 엔드포인트: 세션에 저장된 이메일을 기준으로 DB에서 사용자 정보 조회
app.get('/api/user', async (req, res) => {
    try {
      const email = req.session.email;
      if (!email) {
        return res.status(401).json({ error: 'Not logged in' });
      }
      const user = await dbUtils.getUserByEmail(email);
      res.json(user);
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: 'Error fetching user data' });
    }
  });


  app.get('/auth/kakao/logout', async (req, res) => {
    try {
      const accessToken = req.session.accessToken;
      if (!accessToken) {
        return res.send('현재 로그인 정보가 없습니다.');
      }
      
      // 카카오 로그아웃 API 호출
      await axios.post('https://kapi.kakao.com/v1/user/logout', null, {
        headers: {
          'Authorization': `Bearer ${accessToken}`
        }
      });
      
      // 세션 초기화
      req.session.destroy();
      
      res.send('카카오 로그아웃이 완료되었습니다.');
    } catch (error) {
      console.error('Logout error:', error.response ? error.response.data : error.message);
      res.status(500).send('로그아웃 처리 중 오류가 발생하였습니다.');
    }
  });
  
  

app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});

require('dotenv').config();
const express = require('express');
const path = require('path');
const cookieParser = require('cookie-parser');
const app = express();
const port = process.env.PORT;



// ✅ 정적 파일 서빙
app.use(express.static(path.join(__dirname, 'public')));
app.use(express.static(path.join(__dirname, 'resources')));
app.use(express.static(path.join(__dirname, 'utils')));

// ✅ JSON 데이터 파싱
app.use(express.json()); // JSON 요청 본문 파싱
app.use(express.urlencoded({ extended: true })); // URL-encoded 데이터 파싱



// ✅ Utils 함수 불러오기기
const authUtils = require('./utils/kakoOauthUtils');
const userDataUtils = require('./utils/userDataUtils');
const jwtUtils = require('./utils/jwtUtils');
const itemsUtils = require('./utils/itemsUtils');
const cartUtils = require('./utils/cartUtils');

// ✅ 클라이언트 쿠키 읽기
app.use(cookieParser());



// ✅ 기본 루트 경로에서 index.html 제공
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', '/startpage/startpage.html'));
});

// 카카오 로그인 시작: 클라이언트를 카카오 인증 페이지로 리다이렉트
app.get('/auth/kakao', (req, res) => {

    const KAKAO_CLIENT_ID = process.env.KAKAO_CLIENT_ID;
    const KAKAO_CLIENT_SECRET = process.env.KAKAO_CLIENT_SECRET;
    const KAKAO_REDIRECT_URI = process.env.KAKAO_REDIRECT_URI;

    const kakaoAuthUrl = `https://kauth.kakao.com/oauth/authorize?client_id=${KAKAO_CLIENT_ID}&redirect_uri=${KAKAO_REDIRECT_URI}&response_type=code&prompt=login`;  // prompt=login이 있어야 매번 id/pw 입력
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
        const { userInfo, accessToken } = await authUtils.getKakaoUserInfo(code);  // 카카오 계정에 접근하는 엑세스 토큰은 일단 받아만 둠.
    
        // DB에 사용자 정보 저장 (새로운 사용자이면 INSERT, 기존이면 UPDATE)
        await userDataUtils.saveUser({
            name: userInfo.name,
            account_email: userInfo.account_email,
            gender: userInfo.gender,
            phone_number: userInfo.phone_number,
            profile_image: userInfo.profile_image,
            profile_nickname: userInfo.profile_nickname
        });



        // DB에서 사용자를 조회하여 id 획득 (users 테이블과 연결된 기준)
        const userRecord = await userDataUtils.getUserByEmail(userInfo.account_email);
        if (!userRecord) {
          return res.status(500).send("사용자 정보를 찾을 수 없습니다.");
        }
    
        // 사용자 id를 이용하여 JWT 발행 및 DB 저장
        const token = await jwtUtils.generateAndStoreJwt(userRecord.id);
    
        // JWT를 httpOnly 쿠키에 저장
        res.cookie('jwt_token', token, { httpOnly: true, maxAge: 3600000 });

    
        // 마이페이지로 리다이렉트
        res.redirect('/menupage/menupage.html');


    } catch (error) {
      console.error(error);
      res.status(500).send('인증 과정 중 오류가 발생하였습니다.');
    }
});



// API 엔드포인트: JWT 토큰을 검증한 후, DB에서 사용자 정보 조회
app.get('/api/user', jwtUtils.verifyJwt, async (req, res) => {
  try {
    const userRecord = await userDataUtils.getUserById(req.user.user_id);
    if (!userRecord) {
      return res.status(404).json({ error: 'User not found' });
    }
    res.json(userRecord);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error fetching user data' });
  }
});

// 로그아웃 엔드포인트: 쿠키 제거
app.get('/auth/logout', jwtUtils.verifyJwt, async (req, res) => {
  try {
    res.clearCookie('jwt_token');
    res.send('로그아웃이 완료되었습니다.');
  } catch (error) {
    console.error('Logout error:', error.response ? error.response.data : error.message);
    res.status(500).send('로그아웃 처리 중 오류가 발생하였습니다.');
  }
});

app.get('/api/check-token', (req, res) => {
  const token =
    req.cookies.jwt_token ||
    (req.headers.authorization && req.headers.authorization.split(' ')[1]);
  res.json({ token });
});


// 상품 목록 조회 API
app.get('/api/items', async (req, res) => {
  try {
    console.log("api items 호출 성공")
    // items 테이블에서 전체 상품 정보를 가져옵니다.
    const item_json = await itemsUtils.getItems();
    res.json(item_json);  // JSON 형태로 응답
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: '서버 에러' });
  }
});

// 단일 상품 상세 정보 API
app.get('/api/items/:itemId', async (req, res) => {
  try {
    const itemId = req.params.itemId;
    console.log("api item detail 호출 성공, itemId:", itemId);
    const item = await itemsUtils.getItemById(itemId);
    if (!item) {
      return res.status(404).json({ message: '상품을 찾을 수 없습니다.' });
    }
    res.json(item);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: '서버 에러' });
  }
});


// 단일 상품 옵션 정보 API
app.get('/api/items/:itemId/options', async (req, res) => {
  try {
    const itemId = req.params.itemId;
    console.log("api item options 호출 성공, itemId:", itemId);
    const options = await itemsUtils.getItemOptions(itemId);
    res.json(options);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: '서버 에러' });
  }
});


// 🛒 장바구니 추가 API
app.post('/api/cart', jwtUtils.verifyJwt, async (req, res) => {
  try {
      console.log("장바구니 추가 요청:", req.body);
      const { user_id, item_id, options, quantity } = req.body;

      // 장바구니에 상품 추가
      const result = await cartUtils.addToCart(user_id, item_id, options, quantity);
      res.json(result);
  } catch (error) {
      console.error(error);
      res.status(500).json({ message: '장바구니 추가 중 오류 발생' });
  }
});

// 🛒 장바구니 조회 API
app.get('/api/cart', jwtUtils.verifyJwt, async (req, res) => {
  try {
      const user_id = req.user.user_id;
      const cartItems = await cartUtils.getCart(user_id);
      res.json(cartItems);
  } catch (error) {
      console.error(error);
      res.status(500).json({ message: '장바구니 조회 중 오류 발생' });
  }
});


// 🛒 장바구니에서 상품 불러오기 API
app.get('/api/cart/get', jwtUtils.verifyJwt, async (req, res) => {
  try {
      console.log("/api/cart/get\n")
      const user_id = req.user.user_id;
      const cartItems = await cartUtils.getCart(user_id);
      res.json(cartItems);
  } catch (error) {
      console.error(error);
      res.status(500).json({ message: '장바구니 조회 중 오류 발생' });
  }
});


// 🛒 장바구니에서 상품 삭제 API
app.delete('/api/cart/:cartId', jwtUtils.verifyJwt, async (req, res) => {
  try {
      const user_id = req.user.user_id;
      const cart_id = req.params.cartId;
      const result = await cartUtils.removeFromCart(user_id, cart_id);
      res.json(result);
  } catch (error) {
      console.error(error);
      res.status(500).json({ message: '장바구니 삭제 중 오류 발생' });
  }
});

// 🛒 장바구니 수량 업데이트 API
app.patch('/api/cart/:cartId', jwtUtils.verifyJwt, async (req, res) => {
  try {
      const user_id = req.user.user_id;
      const cart_id = req.params.cartId;
      const { quantity } = req.body;
      const result = await cartUtils.updateCartQuantity(user_id, cart_id, quantity);
      res.json(result);
  } catch (error) {
      console.error(error);
      res.status(500).json({ message: '장바구니 수량 업데이트 중 오류 발생' });
  }
});


const host = '0.0.0.0';  // 모든 네트워크에서 접근 가능
app.listen(port, host, () => {
  console.log(`Server is running on http://${host}:${port}`);
});
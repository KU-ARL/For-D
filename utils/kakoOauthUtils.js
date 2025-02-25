const axios = require('axios');

const KAKAO_CLIENT_ID = process.env.KAKAO_CLIENT_ID; // 카카오 개발자 콘솔에서 발급받은 Client ID
const KAKAO_CLIENT_SECRET = process.env.KAKAO_CLIENT_SECRET; // (필요시) 클라이언트 시크릿
const KAKAO_REDIRECT_URI = process.env.KAKAO_REDIRECT_URI;

async function getKakaoUserInfo(code) {
  try {
    // 1. 인가 코드(code)로 액세스 토큰 요청
    const tokenUrl = 'https://kauth.kakao.com/oauth/token';
    const tokenResponse = await axios.post(tokenUrl, null, {
      params: {
        grant_type: 'authorization_code',
        client_id: KAKAO_CLIENT_ID,
        client_secret: KAKAO_CLIENT_SECRET, // 클라이언트 시크릿 사용 시
        redirect_uri: KAKAO_REDIRECT_URI,
        code: code
      },
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded'
      }
    });

    const accessToken = tokenResponse.data.access_token; // 카카오에서 보내준 엑세스 토큰 저장장
    
    // 2. 액세스 토큰으로 카카오 사용자 정보 요청
    const userResponse = await axios.get('https://kapi.kakao.com/v2/user/me', {
      headers: {
        'Authorization': `Bearer ${accessToken}`
      }
    });
    

    // 엑세스 토큰을 통해 얻어온 사용자 정보보
    const kakaoAccount = userResponse.data.kakao_account;
    const profile = kakaoAccount.profile || {};
    
    // 받아온 데이터 반환 (필드명이 요구사항에 맞게 조정됨)
    return {
        userInfo: {
          name: profile.nickname || '',
          gender: kakaoAccount.gender || '',
          account_email: kakaoAccount.email || '',
          phone_number: kakaoAccount.phone_number || '',
          profile_image: profile.profile_image_url || '',
          profile_nickname: profile.nickname || ''
        },
        accessToken
      };
  } catch (error) {
    console.error('Error fetching Kakao user info:', error.response ? error.response.data : error.message);
    throw error;
  }
}

module.exports = { getKakaoUserInfo };

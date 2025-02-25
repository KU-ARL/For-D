document.addEventListener('DOMContentLoaded', () => {
    const kakaoLoginEl = document.getElementById('kakao_login');
    if (kakaoLoginEl) {
      kakaoLoginEl.addEventListener('click', (event) => {
        event.preventDefault();
        // 서버의 카카오 로그인 시작 엔드포인트로 리다이렉션
        window.location.href = '/auth/kakao';
      });
    }
  });
  
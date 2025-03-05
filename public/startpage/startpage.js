document.addEventListener('DOMContentLoaded', () => {
    // 로그인 상태를 확인하기 위해 /api/check-token 호출
    fetch('/api/check-token')
    .then(response => response.json())
    .then(data => {
      if (data.token) {
        window.location.href = '/menupage/menupage.html';
      }
    })
    .catch(error => {
      console.error('Error checking token:', error);
    });

    
    const kakaoLoginEl = document.getElementById('kakao_login');
    if (kakaoLoginEl) {
      kakaoLoginEl.addEventListener('click', (event) => {
        event.preventDefault();
        // 서버의 카카오 로그인 시작 엔드포인트로 리다이렉션
        window.location.href = '/auth/kakao';
      });
    }
  });
  
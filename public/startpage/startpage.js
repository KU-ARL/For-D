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

    
    // 카카오 로그인 버튼 클릭 이벤트 추가
    const kakaoLoginBtn = document.getElementById('kakao_login');
    kakaoLoginBtn.addEventListener('click', (event) => {
      event.preventDefault();
      // 서버의 카카오 로그인 시작 엔드포인트로 리다이렉션
      window.location.href = '/auth/kakao';
    });

    // 네이버 로그인 버튼 클릭 이벤트 추가
    const naverLoginBtn = document.getElementById('naver_login');
    naverLoginBtn.addEventListener('click', (event) => {
      event.preventDefault();
      alert("네이버 로그인 구현 필요!");
    });
    
  });
  
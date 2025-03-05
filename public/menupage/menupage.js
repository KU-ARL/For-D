document.addEventListener('DOMContentLoaded', function() {
    const authButton = document.getElementById('mypage-btn');
  
    // 토큰 존재 여부 확인을 위해 /api/check-token 호출
    fetch('/api/check-token')
      .then(response => response.json())
      .then(data => {
        const token = data.token;
        if (token) {
          // 토큰이 있으면 로그인 상태: 버튼을 "마이페이지"으로 표시하고 로그아웃 로직 실행
          authButton.textContent = "마이페이지";
          authButton.addEventListener('click', () => {
            window.location.href = '/mypage/mypage.html';
          });
        } else {
          // 토큰이 없으면 비로그인 상태: 버튼을 "로그인"으로 표시하고 로그인 페이지로 이동
          authButton.textContent = "로그인";
          authButton.addEventListener('click', () => {
            window.location.href = '/startpage/startpage.html';
          });
        }
      })
      .catch(error => {
        console.error('Error checking token:', error);
        // 오류가 발생한 경우에도 로그인 버튼으로 처리할 수 있습니다.
        authButton.textContent = "로그인";
        authButton.addEventListener('click', () => {
          window.location.href = '/startpage/startpage.html';
        });
      });
  
  });
  
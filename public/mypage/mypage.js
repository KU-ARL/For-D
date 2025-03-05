document.addEventListener('DOMContentLoaded', function() {
  const authButton = document.getElementById('logout-btn');

  // 토큰 존재 여부 확인을 위해 /api/check-token 호출
  fetch('/api/check-token')
    .then(response => response.json())
    .then(data => {
      const token = data.token;
      if (token) {
        // 토큰이 있으면 로그인 상태: 버튼을 "로그아웃"으로 표시하고 로그아웃 로직 실행
        authButton.textContent = "로그아웃";
        authButton.addEventListener('click', () => {
          fetch('/auth/logout')
            .then(response => {
              if (response.ok) {
                window.location.href = '/';
              } else {
                alert('로그아웃에 실패했습니다.');
              }
            })
            .catch(error => {
              console.error('Logout error:', error);
              alert('로그아웃 중 오류가 발생했습니다.');
            });
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

  // 사용자 정보 요청 (토큰이 있어야 정상적으로 정보가 반환됩니다)
  fetch('/api/user')
    .then(response => {
      if (!response.ok) {
        throw new Error('Not logged in or error fetching user data');
      }
      return response.json();
    })
    .then(user => {
      document.getElementById('name').textContent = user.name || '';
      document.getElementById('email').textContent = user.email || '';
      document.getElementById('gender').textContent = user.gender || '';
      document.getElementById('phone-number').textContent = user.phone_number || '';
      document.getElementById('profile-nickname').textContent = user.profile_nickname || '';
      if (user.profile_image) {
        document.getElementById('profile-image').src = user.profile_image;
      } else {
        document.getElementById('profile-image').style.display = 'none';
      }
    })
    .catch(error => {
      console.error('Error fetching user info:', error);
      const userInfoContainer = document.querySelector('.user-info');
      userInfoContainer.innerHTML = '<p>로그인되지 않았습니다. 로그인 후 이용해 주세요.</p>';
    });
});

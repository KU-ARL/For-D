// public/js/logoutUtil.js
export function setupLogoutButton(buttonId, redirectUrl = '/') {
    const logoutBtn = document.getElementById(buttonId);
    if (logoutBtn) {
      logoutBtn.addEventListener('click', () => {
        fetch('/auth/kakao/logout')
          .then(response => {
            if (response.ok) {
              window.location.href = redirectUrl;
            } else {
              alert('로그아웃에 실패했습니다.');
            }
          })
          .catch(error => {
            console.error('Logout error:', error);
            alert('로그아웃 중 오류가 발생했습니다.');
          });
      });
    }
  }
  
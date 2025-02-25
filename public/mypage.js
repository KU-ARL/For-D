// public/js/mypage.js
document.addEventListener('DOMContentLoaded', function() {
    fetch('/api/user')
      .then(response => {
        if (!response.ok) {
          throw new Error('Not logged in or error fetching user data');
        }
        return response.json();
      })
      .then(user => {
        console.log(user);
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
        console.error('Error:', error);
        // 로그인하지 않았거나 데이터를 불러오지 못한 경우 적절한 처리를 할 수 있습니다.
      });
  });
  
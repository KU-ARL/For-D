const API_URL = "http://localhost:5000/api/auth"; // 백엔드 서버 주소

document.addEventListener("DOMContentLoaded", () => {
    const loginBtn = document.getElementById("login-btn");
    const registerBtn = document.getElementById("register-btn");

    if (loginBtn) {
        loginBtn.addEventListener("click", login);
    }
    
    if (registerBtn) {
        registerBtn.addEventListener("click", register);
    }
});

// 로그인 요청
async function login() {
    const email = document.getElementById("login-email").value;
    const password = document.getElementById("login-password").value;

    const response = await fetch(`${API_URL}/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password })
    });

    const data = await response.json();

    if (response.ok) {
        alert("로그인 성공!");
        localStorage.setItem("accessToken", data.accessToken);
        window.location.href = "/pay/pay.html";
    } else {
        alert(data.message);
    }
}

// 회원가입 요청
async function register() {
    const email = document.getElementById("register-email").value;
    const password = document.getElementById("register-password").value;

    const response = await fetch(`${API_URL}/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password })
    });

    const data = await response.json();

    if (response.ok) {
        alert("회원가입 성공! 로그인 해주세요.");
        window.location.href = "login.html"; // 회원가입 후 로그인 페이지로 이동
    } else {
        alert(data.message);
    }
}

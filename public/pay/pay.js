document.addEventListener("DOMContentLoaded", () => {
    const kakaopayBtn = document.getElementById("kakaopay-btn");

    kakaopayBtn.addEventListener("click", async () => {
        const amount = document.getElementById("amount").value;

        const response = await fetch("/api/payment/kakaopay", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ amount })
        });

        const data = await response.json();

        if (data.next_redirect_pc_url) {
            window.location.href = data.next_redirect_pc_url; // 카카오페이 결제 페이지로 이동
        } else {
            alert("결제 요청 실패: " + data.message);
        }
    });
});

const express = require("express");
const router = express.Router();
const axios = require("axios");

const KAKAO_PAY_HOST = "https://kapi.kakao.com/v1/payment";
const CID = process.env.KAKAO_PAY_CID; // ✅ 환경변수에서 CID 가져오기
const ADMIN_KEY = process.env.KAKAO_ADMIN_KEY; // 카카오페이 Admin Key

// ✅ 1. 카카오페이 결제 요청 API
router.post("/kakaopay", async (req, res) => {
    const { amount } = req.body;

    console.log("api 호출");

    try {
        const response = await axios.post(`${KAKAO_PAY_HOST}/ready`, null, {
            headers: {
                Authorization: `KakaoAK ${ADMIN_KEY}`,
                "Content-Type": "application/x-www-form-urlencoded"
            },
            params: {
                cid: CID,
                partner_order_id: "order_1234",
                partner_user_id: "user_5678",
                item_name: "테스트 상품",
                quantity: 1,
                total_amount: amount,
                vat_amount: 1000,
                tax_free_amount: 0,
                approval_url: "http://localhost:5000/api/payment/kakaopay/success",
                cancel_url: "http://localhost:5000/api/payment/kakaopay/cancel",
                fail_url: "http://localhost:5000/api/payment/kakaopay/fail"
            }
        });

        req.session.tid = response.data.tid;

        res.json({ next_redirect_pc_url: response.data.next_redirect_pc_url });
    } catch (error) {
        res.status(500).json({ message: "결제 요청 실패", error: error.response.data });
    }
});

// ✅ 2. 결제 승인 API
router.get("/kakaopay/success", async (req, res) => {
    const { pg_token } = req.query;
    const tid = req.session.tid;

    try {
        const response = await axios.post(`${KAKAO_PAY_HOST}/approve`, null, {
            headers: {
                Authorization: `KakaoAK ${ADMIN_KEY}`,
                "Content-Type": "application/x-www-form-urlencoded"
            },
            params: {
                cid: CID,
                tid: tid, // 결제 요청 시 받아온 tid
                partner_order_id: "order_1234",
                partner_user_id: "user_5678",
                pg_token: pg_token
            }
        });

        res.send("✅ 결제 성공! 🎉 주문이 완료되었습니다.");
    } catch (error) {
        res.status(500).json({ message: "결제 승인 실패", error: error.response.data });
    }
});

// ✅ 3. 결제 취소 API
router.get("/kakaopay/cancel", (req, res) => {
    res.send("⚠️ 결제가 취소되었습니다.");
});

// ✅ 4. 결제 실패 API
router.get("/kakaopay/fail", (req, res) => {
    res.send("❌ 결제에 실패하였습니다.");
});

module.exports = router;

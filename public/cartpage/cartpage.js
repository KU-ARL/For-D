document.addEventListener('DOMContentLoaded', async () => {
    await loadCartItems();
});

async function loadCartItems() {
    const cartContainer = document.querySelector(".item-list");
    cartContainer.innerHTML = ""; // 기존 내용 초기화

    try {
        const userResponse = await fetch('/api/user');
        if (!userResponse.ok) {
            cartContainer.innerHTML = "<p>로그인이 필요합니다.</p>";
            return;
        }

        const user = await userResponse.json();
        const cartResponse = await fetch('/api/cart/get', {
            headers: { 'Authorization': `Bearer ${user.token}` }
        });

        if (!cartResponse.ok) {
            cartContainer.innerHTML = "<p>장바구니를 불러오는데 실패했습니다.</p>";
            return;
        }

        const cartItems = await cartResponse.json();

        if (cartItems.length === 0) {
            cartContainer.innerHTML = "<p>장바구니가 비어 있습니다.</p>";
            return;
        }

        cartItems.forEach(item => {
            const cartItemElement = createCartItemElement(item);
            cartContainer.appendChild(cartItemElement);
        });

        updateSummary(cartItems);

    } catch (error) {
        console.error("장바구니 불러오기 오류:", error);
        cartContainer.innerHTML = "<p>오류가 발생했습니다.</p>";
    }
}


// 장바구니 아이템 요소 생성
function createCartItemElement(item) {
    const cartItemDiv = document.createElement("div");
    cartItemDiv.classList.add("cart-item");

    // ✅ 상품 이미지 (왼쪽)
    const img = document.createElement("img");
    img.classList.add("item-img");
    img.src = item.image_url || "https://ifh.cc/g/YNOJmL.jpg";
    img.alt = item.name;

    // ✅ 상품 정보 & 옵션을 감쌀 컨테이너 (오른쪽)
    const itemContent = document.createElement("div");
    itemContent.classList.add("item-content");

    // ✅ 상품명, 가격, 수량을 한 줄로 정렬할 헤더
    const itemHeader = document.createElement("div");
    itemHeader.classList.add("item-header");

    // 상품 정보 (이름 + 가격)
    const itemInfo = document.createElement("div");
    itemInfo.classList.add("item-info");

    const nameEl = document.createElement("p");
    nameEl.textContent = item.name;

    const finalPrice = +item.price + (+item.total_extra_price || 0);
    const totalItemPrice = finalPrice * item.quantity;

    const priceEl = document.createElement("p");
    priceEl.textContent = `${totalItemPrice.toLocaleString()} 원`;

    itemInfo.appendChild(nameEl);
    itemInfo.appendChild(priceEl);

    // ✅ 수량 조절 & 삭제 버튼 컨테이너
    const itemActions = document.createElement("div");
    itemActions.classList.add("item-actions");

    const quantityDiv = document.createElement("div");
    quantityDiv.classList.add("item-quantity");

    const minusButton = document.createElement("button");
    minusButton.textContent = "-";
    minusButton.addEventListener("click", () => updateQuantity(item.cart_id, item.quantity - 1));

    const quantityInput = document.createElement("input");
    quantityInput.classList.add("item-quantity-count");
    quantityInput.type = "text";
    quantityInput.value = item.quantity;
    quantityInput.readOnly = true;

    const plusButton = document.createElement("button");
    plusButton.textContent = "+";
    plusButton.addEventListener("click", () => updateQuantity(item.cart_id, item.quantity + 1));

    quantityDiv.appendChild(minusButton);
    quantityDiv.appendChild(quantityInput);
    quantityDiv.appendChild(plusButton);

    const removeButton = document.createElement("button");
    removeButton.classList.add("remove-btn");
    removeButton.textContent = "X";
    removeButton.addEventListener("click", () => removeFromCart(item.cart_id));

    // 요소 조합
    itemHeader.appendChild(itemInfo);
    itemActions.appendChild(quantityDiv);
    itemActions.appendChild(removeButton);
    itemHeader.appendChild(itemActions);

    // ✅ 옵션 리스트 (상품 아래에 표시)
    const optionList = document.createElement("ul");
    optionList.classList.add("item-options");

    if (item.options && item.options.length > 0) {
        item.options.forEach(option => {
            const optionItem = document.createElement("li");
            optionItem.textContent = `${option.option_name}: ${option.option_value} ${option.extra_price > 0 ? `(+${option.extra_price}원)` : ""}`;
            optionList.appendChild(optionItem);
        });
    }

    // 최종 DOM 구조 추가
    itemContent.appendChild(itemHeader);
    itemContent.appendChild(optionList); // ✅ 옵션을 아래에 정렬
    cartItemDiv.appendChild(img);
    cartItemDiv.appendChild(itemContent);

    return cartItemDiv;
}



// 장바구니에서 아이템 제거
async function removeFromCart(cartId) {
    try {
        const response = await fetch(`/api/cart/${cartId}`, {
            method: "DELETE",
            headers: { "Authorization": `Bearer ${localStorage.getItem("token")}` }
        });

        if (!response.ok) throw new Error("장바구니에서 제거 실패");

        await loadCartItems(); // 장바구니 다시 불러오기
    } catch (error) {
        console.error("장바구니 제거 오류:", error);
    }
}

// 장바구니 수량 업데이트
async function updateQuantity(cartId, newQuantity) {
    if (newQuantity < 1) return;

    try {
        const response = await fetch(`/api/cart/${cartId}`, {
            method: "PATCH",
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${localStorage.getItem("token")}`
            },
            body: JSON.stringify({ quantity: newQuantity })
        });

        if (!response.ok) throw new Error("수량 업데이트 실패");

        await loadCartItems(); // 장바구니 다시 불러오기
    } catch (error) {
        console.error("수량 업데이트 오류:", error);
    }
}

// 총합 계산
function updateSummary(cartItems) {
    let totalPrice = 0;
    cartItems.forEach(item => {
        const finalPrice = +item.price + (+item.total_extra_price || 0);  // ✅ 옵션 가격 포함
        totalPrice += finalPrice * item.quantity;
    });

    document.querySelector(".cart-summary .price-row2 span").textContent = `${totalPrice.toLocaleString()} 원`;
}

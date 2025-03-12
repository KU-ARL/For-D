const pool = require('./dbUtils');

// 🛒 장바구니에 상품 추가 (DB 저장)
async function addToCart(user_id, item_id, options, quantity) {
    try {
        let cartId = null;

        // ✅ 1. 동일한 상품 + 옵션 조합이 있는지 확인
        const [existingCartItems] = await pool.execute(
            `SELECT id FROM cart WHERE user_id = ? AND item_id = ?`,
            [user_id, item_id]
        );

        for (const cartItem of existingCartItems) {
            const [existingOptions] = await pool.execute(
                `SELECT option_id, value_id FROM cart_options WHERE cart_id = ? ORDER BY option_id`,
                [cartItem.id]
            );

            // 옵션을 비교 (모든 옵션이 동일하면 같은 장바구니 품목으로 취급)
            if (compareOptions(existingOptions, options)) {
                cartId = cartItem.id;
                break;
            }
        }

        if (cartId) {
            // ✅ 동일한 상품 + 옵션 조합이 존재하면 수량만 업데이트
            await pool.execute(`UPDATE cart SET quantity = quantity + ? WHERE id = ?`, [quantity, cartId]);
        } else {
            // ✅ 2. 새로운 품목으로 장바구니에 추가
            const [result] = await pool.execute(
                `INSERT INTO cart (user_id, item_id, quantity) VALUES (?, ?, ?)`,
                [user_id, item_id, quantity]
            );
            cartId = result.insertId;

            // 옵션 추가 (value_id가 있는 경우만 추가)
            for (const option of options) {
                if (option.value_id) {
                    await pool.execute(
                        `INSERT INTO cart_options (cart_id, option_id, value_id) VALUES (?, ?, ?)`,
                        [cartId, option.option_id, option.value_id]
                    );
                }
            }
        }

        return { message: '장바구니에 추가되었습니다!' };
    } catch (error) {
        console.error('Error adding to cart:', error);
        throw error;
    }
}

// ✅ 옵션 배열 비교 함수 (장바구니에서 같은 옵션 조합인지 확인)
function compareOptions(existingOptions, newOptions) {
    if (existingOptions.length !== newOptions.length) return false;

    // 기존 옵션과 새로운 옵션을 정렬하여 비교 (option_id 기준)
    existingOptions.sort((a, b) => a.option_id - b.option_id);
    newOptions.sort((a, b) => a.option_id - b.option_id);

    return existingOptions.every((opt, index) => 
        opt.option_id === newOptions[index].option_id && 
        opt.value_id === newOptions[index].value_id
    );
}


// 🛒 유저의 장바구니 조회
async function getCart(user_id) {
    try {
        const query = `
            SELECT c.id AS cart_id, c.item_id, i.name, i.price, c.quantity, i.image_url,
                   COALESCE((
                        SELECT SUM(ov.extra_price)
                        FROM cart_options co
                        JOIN option_values ov ON co.value_id = ov.id
                        WHERE co.cart_id = c.id
                   ), 0) AS total_extra_price
            FROM cart c
            JOIN items i ON c.item_id = i.id
            WHERE c.user_id = ?
            GROUP BY c.id;
        `;

        const [rows] = await pool.execute(query, [user_id]);

        // ✅ 옵션 정보를 추가로 가져오기
        for (let item of rows) {
            const optionQuery = `
                SELECT o.name AS option_name, ov.value AS option_value, ov.extra_price
                FROM cart_options co
                JOIN item_options o ON co.option_id = o.id
                JOIN option_values ov ON co.value_id = ov.id
                WHERE co.cart_id = ?;
            `;
            const [optionRows] = await pool.execute(optionQuery, [item.cart_id]);

            item.options = optionRows.length > 0 ? optionRows : [];  // ✅ 옵션이 없으면 빈 배열 추가
        }

        return rows;
    } catch (error) {
        console.error('Error retrieving cart:', error);
        throw error;
    }
}




// 🛒 장바구니에서 상품 제거
async function removeFromCart(user_id, cart_id) {
    try {
        await pool.execute(`DELETE FROM cart WHERE id = ? AND user_id = ?`, [cart_id, user_id]);
        await pool.execute(`DELETE FROM cart_options WHERE cart_id = ?`, [cart_id]);
        return { message: '장바구니에서 제거되었습니다.' };
    } catch (error) {
        console.error('Error removing from cart:', error);
        throw error;
    }
}

// 🛒 장바구니 수량 업데이트
async function updateCartQuantity(user_id, cart_id, quantity) {
    try {
        if (quantity <= 0) {
            return await removeFromCart(user_id, cart_id);
        }

        await pool.execute(`UPDATE cart SET quantity = ? WHERE id = ? AND user_id = ?`, [quantity, cart_id, user_id]);
        return { message: '장바구니 수량이 업데이트되었습니다.' };
    } catch (error) {
        console.error('Error updating cart quantity:', error);
        throw error;
    }
}

module.exports = { addToCart, getCart, removeFromCart, updateCartQuantity };

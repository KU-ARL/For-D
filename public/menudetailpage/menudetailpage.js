document.addEventListener('DOMContentLoaded', async () => {
  // URL 쿼리스트링에서 itemId 가져오기
  const params = new URLSearchParams(window.location.search);
  const itemId = params.get('itemId');
  if (!itemId) {
    console.error('itemId가 전달되지 않았습니다.');
    return;
  }

  // 1. 상품 기본 정보 가져오기
  try {
    const response = await fetch(`/api/items/${itemId}`);
    if (!response.ok) throw new Error('메뉴 정보를 불러오는데 실패했습니다.');
    const item = await response.json();
    renderMenuDetail(item);
  } catch (error) {
    console.error(error);
    document.getElementById('menu-detail').textContent = '메뉴 정보를 불러오는데 실패했습니다.';
  }

  // 2. 상품 옵션 그룹 정보 가져오기
  try {
    const optResponse = await fetch(`/api/items/${itemId}/options`);
    if (!optResponse.ok) throw new Error('옵션 정보를 불러오는데 실패했습니다.');
    const optionGroups = await optResponse.json();
    console.log(optionGroups)
    renderOptionDropdowns(optionGroups);
  } catch (error) {
    console.error(error);
    document.getElementById('menu-options').textContent = '옵션 정보를 불러오는데 실패했습니다.';
  }


  // 로그인 여부 확인
  const user = await checkUserLogin();

  // "장바구니 추가" 버튼 가져오기
  const addToCartButton = document.getElementById('addToCartButton');
  addToCartButton.addEventListener('click', async () => {
    if (!validateRequiredOptions()) {
      alert('필수 항목을 선택해주세요!');
      return;
    }

    if (user) {
      await addToCartDB(user.id);
    } else {
      addToCartLocal();
    }
  });
  
});


///// ---------------- 상세 정보 생성 함수 정의 ---------------- /////

// 상품 상세 정보를 렌더링하는 함수
function renderMenuDetail(item) {
  const detailContainer = document.getElementById('menu-detail');
  const imageUrl = item.image_url ? item.image_url : 'https://ifh.cc/g/YNOJmL.jpg';
  const originInfo = item.origin_info ? item.origin_info : "";
  
  const html = `
    <div class="menu-detail-card">
      <img src="${imageUrl}" alt="${item.name}" class="detail-image">
      <div class="detail-info">
        <h2 class="detail-name">${item.name}</h2>
        <p class="detail-price">${item.price}원</p>
        <p class="detail-origin">${originInfo}</p>
      </div>
    </div>
  `;
  detailContainer.innerHTML = html;
}


///// ---------------- 옵션 박스 생성 함수 ---------------- /////


// 중복된 옵션 그룹들을 그룹화하는 함수
function groupOptionGroups(rawGroups) {
  const grouped = {};
  rawGroups.forEach(item => {
    const groupId = item.id;
    if (!grouped[groupId]) {
      // 그룹이 처음 나오면 새 객체 생성
      grouped[groupId] = {
        id: item.id,
        name: item.name,
        is_required: item.is_required,
        option_type: item.option_type,
        choices: []
      };
    }
    // 각 객체의 choices 배열이 있다면 합칩니다.
    if (item.choices && item.choices.length > 0) {
      grouped[groupId].choices = grouped[groupId].choices.concat(item.choices);
    }
  });
  return Object.values(grouped);
}

// 옵션 그룹들을 렌더링
function renderOptionDropdowns(rawOptionGroups) {
  // 먼저 그룹화 처리
  const optionGroups = groupOptionGroups(rawOptionGroups);
  const optionsContainer = document.getElementById('menu-options');
  optionsContainer.innerHTML = ''; // 기존 내용 초기화
  optionGroups.forEach(group => {
    const dropdownElem = createDropdown(group);
    optionsContainer.appendChild(dropdownElem);
  });
}

// 드롭다운 UI를 생성하는 함수 (각 그룹당 하나의 드롭다운 박스)
function createDropdown(optionGroup) {
  // 옵션 그룹 컨테이너
  const groupDiv = document.createElement('div');
  groupDiv.classList.add('option-group');
  groupDiv.dataset.isRequired = optionGroup.is_required; // ✅ 필수 여부 저장

  // 그룹 라벨: 옵션명과 필수/선택 여부 표시
  const label = document.createElement('div');
  label.classList.add('dropdown-label');
  label.textContent = optionGroup.name + (optionGroup.is_required ? ' (필수)' : ' (선택)');
  groupDiv.appendChild(label);

  // 드롭다운 컨테이너
  const dropdown = document.createElement('div');
  dropdown.classList.add('dropdown');

  // 드롭다운 버튼
  const dropbtn = document.createElement('button');
  dropbtn.classList.add('dropbtn');

  // 버튼 기본 텍스트
  const contentSpan = document.createElement('span');
  contentSpan.classList.add('dropbtn_content');

  // ✅ 선택 옵션인 경우 "괜찮아요!" 기본값 추가
  if (optionGroup.is_required === 0) {
    contentSpan.textContent = '옵션을 선택해주세요!';
  } else {
    contentSpan.textContent = '반드시 선택해주세요!';
  }
  dropbtn.appendChild(contentSpan);

  // 오른쪽 드롭다운 화살표 아이콘
  const clickSpan = document.createElement('span');
  clickSpan.classList.add('dropbtn_click');
  clickSpan.textContent = '▼';  // 기본 역삼각형 기호
  dropbtn.appendChild(clickSpan);

  // 드롭다운 내용 영역 (모든 선택지를 포함)
  const dropdownContent = document.createElement('div');
  dropdownContent.classList.add('dropdown-content');

  // ✅ dropbtn 클릭 이벤트 수정 (이제 정상 동작)
  dropbtn.addEventListener('click', (e) => {
    e.stopPropagation();
    document.querySelectorAll('.dropdown-content').forEach(content => {
      if (content !== dropdownContent) content.classList.remove('show'); // 다른 드롭다운 닫기
    });
    dropdownContent.classList.toggle('show');
  });

  // 선택한 옵션을 저장하는 hidden input (value_id 저장)
  const selectedValueInput = document.createElement('input');
  selectedValueInput.type = 'hidden';
  selectedValueInput.classList.add('selected-value');
  selectedValueInput.dataset.optionId = optionGroup.id; // 해당 옵션 그룹의 ID 저장

  // ✅ 선택 옵션이면 기본값을 null로 설정
  if (optionGroup.is_required === 0) {
    selectedValueInput.value = null;
  }

  // ✅ 선택 옵션의 경우 "괜찮아요!" 추가 (기본적으로 null 값)
  if (optionGroup.is_required === 0) {
    const defaultChoiceDiv = document.createElement('div');
    defaultChoiceDiv.textContent = "괜찮아요!";
    defaultChoiceDiv.dataset.valueId = null; // value_id를 null로 설정
    defaultChoiceDiv.dataset.optionId = optionGroup.id;

    defaultChoiceDiv.addEventListener('click', (e) => {
      e.stopPropagation();
      contentSpan.textContent = "괜찮아요!";
      selectedValueInput.value = null; // 선택하지 않은 상태 유지
      dropdownContent.classList.remove('show');
    });

    dropdownContent.appendChild(defaultChoiceDiv);
  }

  // 옵션 그룹의 모든 선택지를 추가 (한 드롭다운 내에 여러 선택지)
  optionGroup.choices.forEach(choice => {
    const choiceDiv = document.createElement('div');
    choiceDiv.textContent = choice.value + (choice.extra_price > 0 ? ` (+${choice.extra_price}원)` : '');
    choiceDiv.dataset.valueId = choice.id; // ✅ value_id 저장
    choiceDiv.dataset.optionId = optionGroup.id; // ✅ option_id 저장

    // 선택지 클릭 시 드롭다운 닫고 버튼 텍스트 및 value_id 업데이트
    choiceDiv.addEventListener('click', (e) => {
      e.stopPropagation();
      contentSpan.textContent = choice.value + (choice.extra_price > 0 ? ` (+${choice.extra_price}원)` : '');
      selectedValueInput.value = choice.id; // ✅ 선택된 value_id 저장
      dropdownContent.classList.remove('show');
    });

    dropdownContent.appendChild(choiceDiv);
  });

  dropdown.appendChild(dropbtn);
  dropdown.appendChild(dropdownContent);
  groupDiv.appendChild(dropdown);
  groupDiv.appendChild(selectedValueInput); // ✅ 선택된 옵션의 value_id를 저장할 hidden input 추가
  return groupDiv;
}



// 전역 클릭 시 모든 드롭다운 닫기
window.onclick = (e) => {
  const dropdowns = document.getElementsByClassName('dropdown-content');
  for (let i = 0; i < dropdowns.length; i++) {
    dropdowns[i].classList.remove('show');
  }
};

async function checkUserLogin() {
  try {
    const tokenResponse = await fetch('/api/check-token');
    const { token } = await tokenResponse.json();
    
    if (!token) return null;

    // JWT 토큰이 있는 경우, 유저 정보 요청
    const userResponse = await fetch('/api/user', {
      headers: { 'Authorization': `Bearer ${token}` }
    });

    if (!userResponse.ok) return null;

    return await userResponse.json(); // 로그인된 사용자 정보 반환
  } catch (error) {
    console.error('로그인 확인 중 오류 발생:', error);
    return null;
  }
}


// 🛒 로그인 상태 - DB에 저장
async function addToCartDB(userId) {
  const params = new URLSearchParams(window.location.search);
  const itemId = params.get('itemId');
  if (!itemId) {
    alert("상품 정보가 올바르지 않습니다.");
    return;
  }

  // 선택된 옵션 가져오기 (value_id 포함)
  const selectedOptions = [];
  document.querySelectorAll('.selected-value').forEach(input => {
    if (input.value) {
      selectedOptions.push({
        option_id: parseInt(input.dataset.optionId),
        value_id: parseInt(input.value) // ✅ value_id 사용
      });
    }
  });

  const cartData = {
    user_id: userId,
    item_id: parseInt(itemId),
    options: selectedOptions,
    quantity: 1
  };

  try {
    const response = await fetch('/api/cart', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(cartData)
    });

    if (!response.ok) throw new Error('장바구니 저장 실패');
    
    alert("장바구니에 추가되었습니다!");
  } catch (error) {
    console.error(error);
    alert("장바구니 추가 중 오류 발생");
  }
}


// 🛒 비로그인 상태 - LocalStorage 저장
function addToCartLocal() {
  const params = new URLSearchParams(window.location.search);
  const itemId = params.get('itemId');

  if (!itemId) {
    alert("상품 정보가 올바르지 않습니다.");
    return;
  }

  const selectedOptions = getSelectedOptions();

  const cartItem = {
    item_id: parseInt(itemId),
    options: selectedOptions,
    quantity: 1
  };

  let cart = JSON.parse(localStorage.getItem("cart")) || [];
  const existingItem = cart.find(item => item.item_id === cartItem.item_id);
  
  if (existingItem) {
    existingItem.quantity += 1;
  } else {
    cart.push(cartItem);
  }

  localStorage.setItem("cart", JSON.stringify(cart));
  alert("장바구니에 담았습니다!");
}

// 선택한 옵션 가져오기
function getSelectedOptions() {
  const selectedOptions = [];
  document.querySelectorAll('.dropdown .dropbtn_content').forEach((el, index) => {
    const optionValue = el.textContent.trim();
    if (optionValue !== "옵션을 선택해주세요!") {
      selectedOptions.push({
        option_id: index + 1,  
        value: optionValue
      });
    }
  });
  return selectedOptions;
}


// ✅ 필수 옵션이 선택되었는지 검사하는 함수
function validateRequiredOptions() {
  let allRequiredSelected = true;
  
  document.querySelectorAll('.option-group').forEach(group => {
    const isRequired = group.dataset.isRequired == 1; // 필수 여부 확인
    const selectedValue = group.querySelector('.selected-value').value; // 선택된 값 가져오기
    
    console.log(group.dataset.isRequired)
    console.log(selectedValue)


    if (isRequired && !selectedValue) {
      allRequiredSelected = false;
    }
  });

  return allRequiredSelected;
}



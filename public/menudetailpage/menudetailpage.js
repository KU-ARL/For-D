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
});


///// ---------------- 상세 정보 생성 함수 정의 ---------------- /////

// 상품 상세 정보를 렌더링하는 함수
function renderMenuDetail(item) {
  const detailContainer = document.getElementById('menu-detail');
  const html = `
    <div class="menu-detail-card">
      <img src="${item.image_url}" alt="${item.name}" class="detail-image">
      <div class="detail-info">
        <h2 class="detail-name">${item.name}</h2>
        <p class="detail-price">${item.price}원</p>
        <p class="detail-origin">${item.origin_info}</p>
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
  contentSpan.textContent = '옵션을 선택해주세요!';
  dropbtn.appendChild(contentSpan);

  // 오른쪽 드롭다운 화살표 아이콘
  const clickSpan = document.createElement('span');
  clickSpan.classList.add('dropbtn_click');
  clickSpan.textContent = '▼';  // 기본 역삼각형 기호
  dropbtn.appendChild(clickSpan);  

  // 드롭다운 버튼 클릭 시 옵션 목록 토글
  dropbtn.addEventListener('click', (e) => {
    e.stopPropagation();
    dropdownContent.classList.toggle('show');
  });
  dropdown.appendChild(dropbtn);

  // 드롭다운 내용 영역 (모든 선택지를 포함)
  const dropdownContent = document.createElement('div');
  dropdownContent.classList.add('dropdown-content');

  // 옵션 그룹의 모든 선택지를 추가 (한 드롭다운 내에 여러 선택지)
  optionGroup.choices.forEach(choice => {
    const choiceDiv = document.createElement('div');
    choiceDiv.textContent = choice.value + (choice.extra_price > 0 ? ` (+${choice.extra_price}원)` : '');
    // 선택지 클릭 시 드롭다운 닫고 버튼 텍스트 업데이트
    choiceDiv.addEventListener('click', (e) => {
      e.stopPropagation();
      contentSpan.textContent = choice.value + (choice.extra_price > 0 ? ` (+${choice.extra_price}원)` : '');
      dropdownContent.classList.remove('show');
      
      /////////////////////////////////////////////////////////////////////////////////////////////
      // ------------------ 선택한 옵션을 기억해서 장바구니로 넣는 로직 추가 예정 ------------------ //
      /////////////////////////////////////////////////////////////////////////////////////////////
      
    });
    dropdownContent.appendChild(choiceDiv);
  });

  dropdown.appendChild(dropdownContent);
  groupDiv.appendChild(dropdown);
  return groupDiv;
}

// 전역 클릭 시 모든 드롭다운 닫기
window.onclick = (e) => {
  const dropdowns = document.getElementsByClassName('dropdown-content');
  for (let i = 0; i < dropdowns.length; i++) {
    dropdowns[i].classList.remove('show');
  }
};

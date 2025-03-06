document.addEventListener('DOMContentLoaded', function() {
    const authButton = document.getElementById('mypage-btn');
  
    // 토큰 존재 여부 확인을 위해 /api/check-token 호출
    fetch('/api/check-token')
      .then(response => response.json())
      .then(data => {
        const token = data.token;
        if (token) {
          // 토큰이 있으면 로그인 상태: 버튼을 "마이페이지"으로 표시하고 로그아웃 로직 실행
          authButton.textContent = "마이페이지";
          authButton.addEventListener('click', () => {
            window.location.href = '/mypage/mypage.html';
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
  
  });
  

  // --------------- 상품 리스트 생성 ---------------
document.addEventListener('DOMContentLoaded', async () => {
    const menuGrid = document.querySelector('.menu-grid');
    const navList = document.querySelector('.nav-list');
  
    // 전체 상품 데이터를 보관할 배열
    let allItems = [];
  
    // (1) 서버에서 모든 상품 정보를 가져오는 함수
    async function fetchAllItems() {
      const response = await fetch('/api/items');
      if (!response.ok) {
        throw new Error('상품 데이터를 가져오는데 실패했습니다.');
      }
      // DB에서 가져온 상품 리스트 (배열)
      allItems = await response.json();
    }
  
    // (2) 특정 카테고리의 상품만 화면에 렌더링하는 함수
    function renderItemsByCategory(categoryCode) {
      // 기존에 표시된 아이템들을 비웁니다.
      menuGrid.innerHTML = '';
  
      // categoryCode가 "best" 등 특정값인 경우를 제외하고, 
      // "전체 보기" 기능도 넣으려면 조건 로직을 추가할 수도 있습니다.
      // 여기서는 'best'가 DB의 category_code 중 하나라고 가정합니다.
      const filteredItems = allItems.filter(item => item.category_code === categoryCode);
  
      // 필터된 아이템들을 순회하며 DOM 요소를 생성합니다.
      filteredItems.forEach(item => {
        itemDiv = createMenuItemElement(item);
  
        // menuGrid에 최종 삽입
        menuGrid.appendChild(itemDiv);
      });
    }
  
    try {
      // 페이지가 로드되면, 먼저 모든 상품을 한번 불러옵니다.
      await fetchAllItems();
  
      // (3) 기본 카테고리(예: "sandwich")를 먼저 표시하거나,
      //     원하는 카테고리를 초기 화면으로 설정할 수 있습니다.
      renderItemsByCategory('sandwich');
  
      // (4) nav-list의 li 클릭 이벤트를 등록하여,
      //     해당 카테고리에 맞는 상품을 렌더링하도록 합니다.
      navList.addEventListener('click', (event) => {
        // 클릭된 요소가 li인지 확인
        if (event.target.tagName === 'LI') {
          const category = event.target.dataset.category;
          renderItemsByCategory(category);
        }
      });
    } catch (error) {
      console.error('에러 발생:', error);
    }
  });
  

  function createMenuItemElement(item) {
    // 1) 카드 컨테이너
    const itemDiv = document.createElement('div');
    itemDiv.classList.add('menu-item');
  
    // 2) 클릭 시 상세 페이지로 이동
    //    예: /menuDetail/menuDetail.html?itemId=상품ID
    itemDiv.addEventListener('click', () => {
      window.location.href = `/menudetailpage/menudetailpage.html?itemId=${item.id}`;
    });
    // 커서가 포인터로 보이도록 (hover 시 손 모양)
    itemDiv.style.cursor = 'pointer';
  
    // 이미지
    const img = document.createElement('img');
    img.classList.add('item-image');
    img.src = item.image_url || '/images/default.png';
    img.alt = item.name;
  
    // 이름/가격 한 줄
    const infoLine = document.createElement('div');
    infoLine.classList.add('item-info-line');
  
    const nameEl = document.createElement('span');
    nameEl.classList.add('item-name');
    nameEl.textContent = item.name;
  
    const priceEl = document.createElement('span');
    priceEl.classList.add('item-price');
    priceEl.textContent = `${item.price}`;
  
    infoLine.appendChild(nameEl);
    infoLine.appendChild(priceEl);
  
    // 원산지/설명
    const originEl = document.createElement('div');
    originEl.classList.add('item-origin');
    originEl.textContent = item.origin_info;
  
    // DOM 트리에 삽입
    itemDiv.appendChild(img);
    itemDiv.appendChild(infoLine);
    itemDiv.appendChild(originEl);
  
    return itemDiv;
  }
  
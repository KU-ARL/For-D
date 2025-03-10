document.addEventListener('DOMContentLoaded', function() {
    const mypageBtn = document.getElementById('mypage-btn');
  
    // 토큰 존재 여부 확인을 위해 /api/check-token 호출
    fetch('/api/check-token')
      .then(response => response.json())
      .then(data => {
        const token = data.token;
        if (token) {
          // 토큰이 있으면 로그인 상태: 버튼을 "마이페이지"으로 표시하고 마이페이지로 이동
          mypageBtn.textContent = "마이페이지";
          mypageBtn.addEventListener('click', () => {
            window.location.href = '/mypage/mypage.html';
          });
        } else {
          // 토큰이 없으면 비로그인 상태: 버튼을 "로그인"으로 표시하고 로그인 페이지로 이동
          mypageBtn.textContent = "로그인";
          mypageBtn.addEventListener('click', () => {
            window.location.href = '/startpage/startpage.html';
          });
        }
      })
      .catch(error => {
        console.error('Error checking token:', error);
        // 오류가 발생해서 잘 모르겠으면 그냥 로그인 하라고 하자
        mypageBtn.textContent = "로그인";
        mypageBtn.addEventListener('click', () => {
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
  

    ///// ---------------- 생성 함수 2개 정의 ---------------- /////

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
  
      // ----------- categoryCode에에 "best"를 추가해서 추천 메뉴 생성 가능
      // ----------- 필터링 하지 않고 allItems 그대로 생성하면 전체 보기 생성 가능

      const filteredItems = allItems.filter(item => item.category_code === categoryCode);
  
      // 필터된 아이템들을 순회하며 DOM 요소를 생성
      filteredItems.forEach(item => {
        itemDiv = createMenuItemElement(item);
  
        // menuGrid에 최종 삽입
        menuGrid.appendChild(itemDiv);
      });
    }
  

    ///// ---------------- 생성 함수 2개로 실제 생성 ---------------- /////
    try {
      // 페이지가 로드되면, 먼저 모든 상품을 한번 불러옵니다.
      await fetchAllItems();
  
      // (3) 기본 카테고리를 설정해서 먼저 노출시킬 카테고리 변경 가능
      renderItemsByCategory('포케/샐러드');
  
      // (4) nav-list의 li 클릭 이벤트 추가, 해당 메뉴 등장
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
    itemDiv.addEventListener('click', () => {
      window.location.href = `/menudetailpage/menudetailpage.html?itemId=${item.id}`;
    });
    itemDiv.style.cursor = 'pointer';
  
    // 이미지
    const img = document.createElement('img');
    img.classList.add('item-image');
    img.src = item.image_url || 'https://ifh.cc/g/YNOJmL.jpg'; // 혹시나 사진 누락되면 대체 이미지
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
  
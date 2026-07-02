// Supabase 클라이언트 직접 초기화 (CDN을 통해 전역 로드된 supabase 객체 사용)
const supabaseUrl = 'https://zdgdxruhkcetvrmajypo.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InpkZ2R4cnVoa2NldHZybWFqeXBvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODI5NDQ2MDEsImV4cCI6MjA5ODUyMDYwMX0.eubSdBmN32A5aKY7JAGkDeCr6RKwYU2Yj-USmeb4rJs';
const supabaseClient = supabase.createClient(supabaseUrl, supabaseKey);

// 로그인 유저 상태 변수
let currentUser = null;

// 정적 고양이 이미지 목록 (새롭게 추가된 26개 파일 전체 반영)
const catImages = [
  '1.jpg', '2.jpg', '3.jpg', '4.jpg', '5.jpg', '6.jpg', '7.jpg', '8.jpg',
  '10.jpg', '11.jpg', '12.jpg', '13.jpg', '14.jpg', '15.jpg', '16.jpg',
  '17.jpeg', '18.jpg', '19.jpeg', '20.jpg',
  '51.jpg', '52.gif', '53.jpg', '54.gif', '55.gif', '56.gif', '57.gif'
];

// 가중치 확률에 기반한 무작위 이미지 선택 함수 (51번 이상은 1/10 확률 적용)
function getRandomCatImage() {
  // 각 파일의 가중치를 계산하는 헬퍼 함수
  const getWeight = (filename) => {
    const match = filename.match(/^(\d+)/);
    if (match) {
      const num = parseInt(match[1], 10);
      if (num >= 51) {
        return 0.1; // 51번 이상은 가중치 1/10 적용
      }
    }
    return 1.0; // 50번 이하는 가중치 1.0 (일반 확률)
  };

  // 1. 전체 가중치 합산
  let totalWeight = 0;
  for (const img of catImages) {
    totalWeight += getWeight(img);
  }

  // 2. 누적 가중치 영역에서 랜덤 값 생성
  let random = Math.random() * totalWeight;

  // 3. 랜덤 값에 매칭되는 이미지 반환
  for (const img of catImages) {
    const weight = getWeight(img);
    if (random < weight) {
      return img;
    }
    random -= weight;
  }
  return catImages[0]; // 예외 처리용 fallback
}

// DOM 요소 취득
// DOM 요소 취득
const canvasArea = document.getElementById('canvas-area');
const guestMenu = document.getElementById('guest-menu');
const userMenu = document.getElementById('user-menu');
const userDisplay = document.getElementById('user-display');
const statusText = document.getElementById('status-text');
const catCountEl = document.getElementById('cat-count');

const logoutBtn = document.getElementById('logout-btn');

// 햄버거 토글용 요소 취득
const menuToggleBtn = document.getElementById('menu-toggle');
const header = document.getElementById('header');

// Supabase Auth 세션 상태 변경 실시간 리스너 바인딩
supabaseClient.auth.onAuthStateChange((event, session) => {
  if (session) {
    currentUser = session.user;
    updateAuthUI(true, currentUser.email);
  } else {
    currentUser = null;
    updateAuthUI(false);
  }
});

// 1. 회원가입 및 로그인 UI 갱신 함수
function updateAuthUI(isLoggedIn, email = '') {
  if (isLoggedIn) {
    guestMenu.style.display = 'none';
    userMenu.style.display = 'flex';
    userDisplay.textContent = email;
    statusText.textContent = 'Online';
    statusText.className = 'status-online';
    
    // 로그인에 성공하면 기존 고양이 소환 내역을 화면에 불러옵니다.
    loadHistory();
  } else {
    guestMenu.style.display = 'flex';
    userMenu.style.display = 'none';
    statusText.textContent = 'Guest Mode';
    statusText.className = 'status-offline';
    catCountEl.textContent = '0';
    clearCanvasCats();
  }
}

// 햄버거 메뉴 닫기 헬퍼 함수
function closeMenu() {
  menuToggleBtn.classList.remove('active');
  header.classList.remove('active');
}

// 햄버거 버튼 클릭 토글 이벤트
menuToggleBtn.addEventListener('click', (e) => {
  e.stopPropagation();
  menuToggleBtn.classList.toggle('active');
  header.classList.toggle('active');
});

// 메뉴 외부 바디 클릭 시 자동으로 메뉴 닫기
document.addEventListener('click', (e) => {
  if (!header.contains(e.target) && !menuToggleBtn.contains(e.target)) {
    closeMenu();
  }
});

// 캔버스 내 생성된 고양이 이미지 제거
function clearCanvasCats() {
  const spawnedCats = document.querySelectorAll('.cat-spawn');
  spawnedCats.forEach(cat => cat.remove());
}

// 4. 로그아웃 이벤트 핸들러
logoutBtn.addEventListener('click', async () => {
  await supabaseClient.auth.signOut();
  closeMenu();
});

// 폭죽 파티클 효과 생성 함수
function createConfetti(x, y, isDelete = false) {
  const colors = isDelete 
    ? ['#ff5a5f', '#ff7a00', '#ffb3b5', '#ffd700', '#ffffff'] // 삭제 시
    : ['#ff914d', '#ffbe7a', '#ffe4b5', '#ffffff', '#ffd700']; // 소환 시
  const particleCount = 14;

  for (let i = 0; i < particleCount; i++) {
    const particle = document.createElement('div');
    particle.className = 'particle';

    const randomColor = colors[Math.floor(Math.random() * colors.length)];
    particle.style.setProperty('--color', randomColor);

    const angle = Math.random() * Math.PI * 2;
    const velocity = 25 + Math.random() * 65; 
    const dx = `${Math.cos(angle) * velocity}px`;
    const dy = `${Math.sin(angle) * velocity}px`;

    particle.style.setProperty('--dx', dx);
    particle.style.setProperty('--dy', dy);
    
    const size = 4 + Math.random() * 4;
    particle.style.width = `${size}px`;
    particle.style.height = `${size}px`;

    particle.style.left = `${x}px`;
    particle.style.top = `${y}px`;

    canvasArea.appendChild(particle);

    setTimeout(() => {
      particle.remove();
    }, 450);
  }
}

// 5. 캔버스 클릭 시 고양이 생성 이벤트 핸들러
canvasArea.addEventListener('click', async (event) => {
  if (event.target.classList.contains('cat-spawn')) {
    return;
  }

  closeMenu();

  const rect = canvasArea.getBoundingClientRect();
  const x = event.clientX - rect.left;
  const y = event.clientY - rect.top;

  // 가중치 확률 기반 무작위 이미지 선택
  const selectedImage = getRandomCatImage();
  const imagePath = `images/${selectedImage}`; // 루트 images 폴더의 파일 가리킴

  // 로그인 상태일 때만 Supabase DB 적재
  if (currentUser) {
    try {
      const { data, error } = await supabaseClient
        .from('cat_logs')
        .insert([
          {
            user_id: currentUser.id,
            image_path: imagePath,
            pos_x: parseInt(x, 10),
            pos_y: parseInt(y, 10)
          }
        ])
        .select();

      if (error) {
        console.error('DB 인서트 오류:', error.message);
        alert(`로그 저장 실패: ${error.message}`);
        return;
      }

      renderCat(imagePath, x, y, data[0].id);
      updateCatCount();
    } catch (err) {
      console.error(err);
    }
  } else {
    // 비로그인 상태일 때는 DB 없이 로컬 렌더링만 진행
    renderCat(imagePath, x, y, null);
    updateCatCount();
  }
});

// 6. 화면에 고양이 그리기 및 개별 삭제 이벤트 연결
function renderCat(imagePath, x, y, logId) {
  createConfetti(x, y, false);

  const img = document.createElement('img');
  img.src = imagePath;
  img.className = 'cat-spawn';
  img.style.left = `${x}px`;
  img.style.top = `${y}px`;
  img.dataset.logId = logId;

  // 고양이를 다시 클릭하면 삭제
  img.addEventListener('click', async (e) => {
    e.stopPropagation();

    closeMenu();

    const currentLogId = img.dataset.logId;

    const imgX = parseInt(img.style.left, 10);
    const imgY = parseInt(img.style.top, 10);
    createConfetti(imgX, imgY, true);

    // 즉시 제거
    img.remove();
    updateCatCount();

    // DB에 기록이 있었고 로그인 상태면 삭제 쿼리 비동기 수행
    if (currentLogId && currentLogId !== 'null' && currentUser) {
      try {
        const { error } = await supabaseClient
          .from('cat_logs')
          .delete()
          .eq('id', currentLogId)
          .eq('user_id', currentUser.id);

        if (error) {
          console.warn(`원격 DB 로그 삭제 실패: ${error.message}`);
        }
      } catch (err) {
        console.error(err);
      }
    }
  });

  canvasArea.appendChild(img);
}

// 7. 총 고양이 수 카운터 업데이트
function updateCatCount() {
  const count = document.querySelectorAll('.cat-spawn').length;
  catCountEl.textContent = count;
}

// 8. DB로부터 이전 생성 히스토리 전체 불러와 캔버스에 복원
async function loadHistory() {
  if (!currentUser) return;

  try {
    const { data, error } = await supabaseClient
      .from('cat_logs')
      .select('*')
      .eq('user_id', currentUser.id)
      .order('created_at', { ascending: true });

    if (error) {
      console.error('히스토리 불러오기 실패:', error.message);
      return;
    }

    clearCanvasCats();
    data.forEach(log => {
      renderCat(log.image_path, log.pos_x, log.pos_y, log.id);
    });
    updateCatCount();
  } catch (err) {
    console.error('히스토리 로드 에러:', err);
  }
}

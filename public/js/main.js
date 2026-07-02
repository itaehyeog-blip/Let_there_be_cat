// API 통신을 위한 토큰 관리
let token = localStorage.getItem('cat_app_token') || null;
let loggedInUser = localStorage.getItem('cat_app_user') ? JSON.parse(localStorage.getItem('cat_app_user')) : null;

// DOM 요소 취득
const canvasArea = document.getElementById('canvas-area');
const guestMenu = document.getElementById('guest-menu');
const userMenu = document.getElementById('user-menu');
const userDisplay = document.getElementById('user-display');
const statusText = document.getElementById('status-text');
const catCountEl = document.getElementById('cat-count');

const emailInput = document.getElementById('auth-email');
const passwordInput = document.getElementById('auth-password');
const loginBtn = document.getElementById('login-btn');
const registerBtn = document.getElementById('register-btn');
const logoutBtn = document.getElementById('logout-btn');

// 햄버거 토글용 요소 취득
const menuToggleBtn = document.getElementById('menu-toggle');
const header = document.getElementById('header');

// 초기 상태 업데이트
updateAuthUI();

// 1. 회원가입 및 로그인 UI 갱신 함수
function updateAuthUI() {
  if (token && loggedInUser) {
    guestMenu.style.display = 'none';
    userMenu.style.display = 'flex';
    userDisplay.textContent = loggedInUser.email;
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

// 2. 회원가입 이벤트 핸들러
registerBtn.addEventListener('click', async () => {
  const email = emailInput.value.trim();
  const password = passwordInput.value;

  if (!email || !password) {
    alert('이메일과 비밀번호를 모두 입력해 주세요.');
    return;
  }

  try {
    const response = await fetch('/api/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password })
    });

    const data = await response.json();
    if (response.ok) {
      alert(data.message || '회원가입에 성공했습니다! 로그인해 주세요.');
      closeMenu();
    } else {
      alert(`회원가입 실패: ${data.error}`);
    }
  } catch (error) {
    console.error('회원가입 통신 에러:', error);
    alert('서버와의 통신 오류가 발생했습니다.');
  }
});

// 3. 로그인 이벤트 핸들러
loginBtn.addEventListener('click', async () => {
  const email = emailInput.value.trim();
  const password = passwordInput.value;

  if (!email || !password) {
    alert('이메일과 비밀번호를 모두 입력해 주세요.');
    return;
  }

  try {
    const response = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password })
    });

    const data = await response.json();
    if (response.ok) {
      token = data.token;
      loggedInUser = data.user;
      localStorage.setItem('cat_app_token', token);
      localStorage.setItem('cat_app_user', JSON.stringify(loggedInUser));

      // 입력란 비우기
      emailInput.value = '';
      passwordInput.value = '';

      updateAuthUI();
      closeMenu();
    } else {
      alert(`로그인 실패: ${data.error}`);
    }
  } catch (error) {
    console.error('로그인 통신 에러:', error);
    alert('로그인 처리 중 에러가 발생했습니다.');
  }
});

// 4. 로그아웃 이벤트 핸들러
logoutBtn.addEventListener('click', () => {
  token = null;
  loggedInUser = null;
  localStorage.removeItem('cat_app_token');
  localStorage.removeItem('cat_app_user');
  updateAuthUI();
  closeMenu();
});

// 5. 캔버스 클릭 시 고양이 생성 이벤트 핸들러
canvasArea.addEventListener('click', async (event) => {
  // 이미 생성된 고양이 자체를 누른 경우에는 통과 (삭제 이벤트가 대신 처리함)
  if (event.target.classList.contains('cat-spawn')) {
    return;
  }

  // 메뉴가 열려있다면 닫아줍니다.
  closeMenu();

  // 클릭 좌표 획득 (캔버스 기준)
  const rect = canvasArea.getBoundingClientRect();
  const x = event.clientX - rect.left;
  const y = event.clientY - rect.top;

  const headers = {
    'Content-Type': 'application/json'
  };
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  try {
    const response = await fetch('/api/cat/spawn', {
      method: 'POST',
      headers: headers,
      body: JSON.stringify({ x, y })
    });

    const data = await response.json();
    if (response.ok && data.success) {
      renderCat(data.imagePath, x, y, data.logId);
      updateCatCount();
    } else {
      alert(`소환 실패: ${data.error}`);
    }
  } catch (error) {
    console.error('고양이 생성 중 에러:', error);
  }
});

// 폭죽 파티클 효과 생성 함수
function createConfetti(x, y, isDelete = false) {
  const colors = isDelete 
    ? ['#ff5a5f', '#ff7a00', '#ffb3b5', '#ffd700', '#ffffff'] // 삭제 시 (붉은 톤)
    : ['#ff914d', '#ffbe7a', '#ffe4b5', '#ffffff', '#ffd700']; // 소환 시 (주황 톤)
  const particleCount = 14;

  for (let i = 0; i < particleCount; i++) {
    const particle = document.createElement('div');
    particle.className = 'particle';

    const randomColor = colors[Math.floor(Math.random() * colors.length)];
    particle.style.setProperty('--color', randomColor);

    // 사방으로 퍼지게 무작위 각도와 거리 계산
    const angle = Math.random() * Math.PI * 2;
    const velocity = 25 + Math.random() * 65; 
    const dx = `${Math.cos(angle) * velocity}px`;
    const dy = `${Math.sin(angle) * velocity}px`;

    particle.style.setProperty('--dx', dx);
    particle.style.setProperty('--dy', dy);
    
    // 조각 크기를 다양하게 조절 (4px ~ 8px)
    const size = 4 + Math.random() * 4;
    particle.style.width = `${size}px`;
    particle.style.height = `${size}px`;

    particle.style.left = `${x}px`;
    particle.style.top = `${y}px`;

    canvasArea.appendChild(particle);

    // 애니메이션 종료(0.45초) 후 요소 제거
    setTimeout(() => {
      particle.remove();
    }, 450);
  }
}

// 6. 화면에 고양이 그리기 및 개별 삭제 이벤트 연결
function renderCat(imagePath, x, y, logId) {
  // 소환 시 폭죽 이펙트 터뜨리기
  createConfetti(x, y, false);

  const img = document.createElement('img');
  img.src = imagePath;
  img.className = 'cat-spawn';
  img.style.left = `${x}px`;
  img.style.top = `${y}px`;
  img.dataset.logId = logId;

  // 고양이를 다시 클릭하면 삭제
  img.addEventListener('click', async (e) => {
    e.stopPropagation(); // 부모 캔버스 클릭 이벤트 버블링 차단 (중요!)

    // 메뉴가 열려있다면 닫아줍니다.
    closeMenu();

    const currentLogId = img.dataset.logId;

    // 삭제 시 폭죽 이펙트 터뜨리기
    const imgX = parseInt(img.style.left, 10);
    const imgY = parseInt(img.style.top, 10);
    createConfetti(imgX, imgY, true);

    // [중요] 딜레이 없이 즉시 화면에서 이미지 엘리먼트 제거
    img.remove();
    updateCatCount();

    // 백그라운드에서 DB 기록 비동기 삭제 수행
    const headers = {};
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    try {
      const response = await fetch(`/api/cat/${currentLogId}`, {
        method: 'DELETE',
        headers: headers
      });

      const data = await response.json();
      if (!response.ok || !data.success) {
        console.warn(`서버 DB 로그 삭제 경고: ${data.error}`);
      }
    } catch (error) {
      console.error('고양이 DB 삭제 통신 에러:', error);
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
  try {
    const response = await fetch('/api/cat/history', {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });

    if (response.ok) {
      const history = await response.json();
      clearCanvasCats();
      history.forEach(log => {
        renderCat(log.image_path, log.pos_x, log.pos_y, log.id);
      });
      updateCatCount();
    }
  } catch (error) {
    console.error('히스토리 로드 실패:', error);
  }
}


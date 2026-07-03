// Supabase 클라이언트 직접 초기화 (CDN을 통해 전역 로드된 supabase 객체 사용)
const supabaseUrl = 'https://zdgdxruhkcetvrmajypo.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InpkZ2R4cnVoa2NldHZybWFqeXBvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODI5NDQ2MDEsImV4cCI6MjA5ODUyMDYwMX0.eubSdBmN32A5aKY7JAGkDeCr6RKwYU2Yj-USmeb4rJs';
const supabaseClient = supabase.createClient(supabaseUrl, supabaseKey);

// 로그인 유저 상태 변수
let currentUser = null;

// Matter.js 물리 엔진 별칭 설정
const { Engine, World, Bodies, Composite, Runner } = Matter;

// 물리 시뮬레이션 상태 변수
let isGravityMode = false;
let engine = null;
let world = null;
let runner = null;
const bodiesMap = new Map(); // key: img 요소, value: Matter.js Body
let boundaries = []; // 바닥 및 좌우 벽 bodies

// 정적 고양이 이미지 목록 (새롭게 추가된 26개 파일 전체 반영)
const catImages = [
  '1.jpg', '2.jpg', '3.jpg', '4.jpg', '5.jpg', '6.jpg', '7.jpg', '8.jpg',
  '10.jpg', '11.jpg', '12.jpg', '13.jpg', '14.jpg', '15.jpg', '16.jpg',
  '17.jpeg', '18.jpg', '19.jpeg', '20.jpg',
  '31.gif', '32.gif', '33.gif', '34.gif',
  '51.jpg', '52.gif', '53.jpg'
];

// 확률 등급별 그룹 분할 정의
const catGroup1 = catImages.filter(img => {
  const num = parseInt(img.match(/^(\d+)/)[1], 10);
  return num >= 1 && num <= 20;
});
const catGroup2 = catImages.filter(img => {
  const num = parseInt(img.match(/^(\d+)/)[1], 10);
  return num >= 31 && num <= 34;
});
const catGroup3 = catImages.filter(img => {
  const num = parseInt(img.match(/^(\d+)/)[1], 10);
  return num >= 51 && num <= 53;
});

// 각 그룹별 개별 셔플백 주머니 상태 변수
let catBag1 = [];
let catBag2 = [];
let catBag3 = [];

// 피셔-예이츠 셔플 유틸리티 함수
function shuffleArray(array) {
  const arr = [...array];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    const temp = arr[i];
    arr[i] = arr[j];
    arr[j] = temp;
  }
  return arr;
}

// 3-주머니 셔플백 기반 이미지 무작위 선택 함수
function getRandomCatImage() {
  // 1. 그룹 선택 (가중치 합: 1.0 + 0.5 + 0.1 = 1.6)
  const rand = Math.random() * 1.6;

  if (rand < 1.0) {
    // 1~20번 그룹 (확률 1.0/1.6 ≒ 62.5%)
    if (catBag1.length === 0) {
      catBag1 = shuffleArray(catGroup1);
    }
    return catBag1.pop();
  } else if (rand < 1.5) {
    // 31~34번 그룹 (확률 0.5/1.6 ≒ 31.25%)
    if (catBag2.length === 0) {
      catBag2 = shuffleArray(catGroup2);
    }
    return catBag2.pop();
  } else {
    // 51~53번 그룹 (확률 0.1/1.6 ≒ 6.25%)
    if (catBag3.length === 0) {
      catBag3 = shuffleArray(catGroup3);
    }
    return catBag3.pop();
  }
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

// 중력 모드 토글 스위치 요소 취득
const gravityToggle = document.getElementById('gravity-toggle');

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

// 캔버스 내 생성된 고양이 이미지 및 물리 바디 전체 제거
function clearCanvasCats() {
  const spawnedCats = document.querySelectorAll('.cat-spawn');
  spawnedCats.forEach(cat => {
    // 물리 엔진에서 바디 제거
    const body = bodiesMap.get(cat);
    if (body && world) {
      Composite.remove(world, body);
    }
    cat.remove();
  });
  bodiesMap.clear();
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

  // 고양이 이미지 엘리먼트 생성 및 배치
  const img = document.createElement('img');
  img.src = imagePath;
  img.className = 'cat-spawn';
  img.style.left = `${x}px`;
  img.style.top = `${y}px`;
  img.dataset.logId = logId;

  // 중력 모드가 활성화되어 있다면 트랜지션 방지 클래스 추가
  if (isGravityMode) {
    img.classList.add('gravity-active');
  }

  // Matter.js 물리 엔진 바디 생성 (고양이 크기 120px * 120px)
  if (world) {
    const body = Bodies.rectangle(x, y, 120, 120, {
      restitution: 0.5, // 튕김 정도
      friction: 0.1,    // 마찰력
      density: 0.001,   // 밀도
      isStatic: !isGravityMode // 중력 모드가 꺼져있으면 고정(Static) 상태
    });

    bodiesMap.set(img, body);
    Composite.add(world, body);
  }

  // 고양이를 다시 클릭하면 삭제
  img.addEventListener('click', async (e) => {
    e.stopPropagation();

    closeMenu();

    const currentLogId = img.dataset.logId;

    // 물리 엔진 및 좌표 맵에서 제거
    const body = bodiesMap.get(img);
    if (body && world) {
      Composite.remove(world, body);
      bodiesMap.delete(img);
    }

    const imgX = parseInt(img.style.left, 10);
    const imgY = parseInt(img.style.top, 10);
    createConfetti(imgX, imgY, true);

    // DOM 제거
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

// ==========================================
// 9. Matter.js 물리 시뮬레이터 구동 및 관리
// ==========================================

// 물리 엔진 초기화 함수
function initPhysics() {
  engine = Engine.create({
    gravity: { y: 0 } // 초기 중력은 0 (정적 상태)
  });
  world = engine.world;
  runner = Runner.create();

  // 경계 상자(바닥 및 벽) 생성
  createBoundaries();

  // 물리 엔진 실행
  Runner.run(runner, engine);

  // 시뮬레이터 비주얼 동기화 프레임 루프 기동
  updateVisuals();
}

// 화면 영역 기반 경계 상자(바닥 및 벽) 갱신/생성 함수
function createBoundaries() {
  if (!world) return;

  // 기존 경계벽 제거
  if (boundaries.length > 0) {
    Composite.remove(world, boundaries);
    boundaries = [];
  }

  const width = canvasArea.clientWidth;
  const height = canvasArea.clientHeight;
  const thickness = 100; // 충분히 두껍게 설정하여 고양이가 뚫고 나가지 못하게 함

  // 바닥 (y축 위치는 캔버스 바닥면 + 두께 절반)
  const ground = Bodies.rectangle(
    width / 2,
    height + thickness / 2,
    width * 2,
    thickness,
    { isStatic: true }
  );

  // 왼쪽 벽
  const leftWall = Bodies.rectangle(
    -thickness / 2,
    height / 2,
    thickness,
    height * 2,
    { isStatic: true }
  );

  // 오른쪽 벽
  const rightWall = Bodies.rectangle(
    width + thickness / 2,
    height / 2,
    thickness,
    height * 2,
    { isStatic: true }
  );

  boundaries = [ground, leftWall, rightWall];
  Composite.add(world, boundaries);
}

// 매 프레임 물리엔진 바디 위치를 실제 DOM 고양이에 매핑하는 루프 함수
function updateVisuals() {
  bodiesMap.forEach((body, img) => {
    if (isGravityMode) {
      // 중력 모드가 활성화되었을 때만 물리 엔진의 좌표와 회전각 매핑
      const x = body.position.x;
      const y = body.position.y;
      const angle = body.angle * (180 / Math.PI); // Radian -> Degree 변환

      img.style.left = `${x}px`;
      img.style.top = `${y}px`;
      img.style.transform = `translate(-50%, -50%) rotate(${angle}deg)`;
    } else {
      // 중력 모드가 꺼졌을 때는 회전 각도 복구 및 기본 중앙 스케일 렌더링 유지
      img.style.transform = `translate(-50%, -50%) scale(1)`;
    }
  });

  requestAnimationFrame(updateVisuals);
}

// 중력 모드 토글 이벤트 처리
if (gravityToggle) {
  gravityToggle.addEventListener('change', (e) => {
    isGravityMode = e.target.checked;

    if (isGravityMode) {
      // 중력 모드 ON
      world.gravity.y = 1.0; // 지구 중력 수준 설정

      bodiesMap.forEach((body, img) => {
        img.classList.add('gravity-active');
        Matter.Body.setStatic(body, false); // 물리 연산 활성화
        
        // 켜지는 순간 살짝의 불규칙한 회전 및 탄성 효과를 주어 쏟아지게 함
        Matter.Body.setAngularVelocity(body, (Math.random() - 0.5) * 0.1);
      });
    } else {
      // 중력 모드 OFF
      world.gravity.y = 0;

      bodiesMap.forEach((body, img) => {
        img.classList.remove('gravity-active');
        Matter.Body.setStatic(body, true); // 정적 고정

        // 멈춘 자리에서 점진적으로 서서히 각도 회복 및 속도 완전 정지
        Matter.Body.setAngle(body, 0);
        Matter.Body.setVelocity(body, { x: 0, y: 0 });
        Matter.Body.setAngularVelocity(body, 0);
      });
    }
  });
}

// 브라우저 윈도우 크기 리사이즈 시 경계벽 동적 갱신
window.addEventListener('resize', createBoundaries);

// 스크립트 로드 완료 시 물리 엔진 기동
initPhysics();

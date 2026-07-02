// Supabase 클라이언트 초기화
const supabaseUrl = 'https://zdgdxruhkcetvrmajypo.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InpkZ2R4cnVoa2NldHZybWFqeXBvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODI5NDQ2MDEsImV4cCI6MjA5ODUyMDYwMX0.eubSdBmN32A5aKY7JAGkDeCr6RKwYU2Yj-USmeb4rJs';
const supabaseClient = supabase.createClient(supabaseUrl, supabaseKey);

// DOM 요소 취득
const emailInput = document.getElementById('email');
const passwordInput = document.getElementById('password');
const loginSubmitBtn = document.getElementById('login-submit-btn');

// 페이지 로드 시 이미 로그인 상태면 메인으로 튕겨냅니다.
supabaseClient.auth.getSession().then(({ data: { session } }) => {
  if (session) {
    location.href = 'index.html';
  }
});

// 로그인 처리 함수
loginSubmitBtn.addEventListener('click', async () => {
  const email = emailInput.value.trim();
  const password = passwordInput.value;

  if (!email || !password) {
    alert('이메일과 비밀번호를 모두 입력해 주세요.');
    return;
  }

  try {
    const { data, error } = await supabaseClient.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      alert(`로그인 실패: ${error.message}`);
    } else {
      // 로그인 성공 시 메인 화면으로 리다이렉트
      location.href = 'index.html';
    }
  } catch (err) {
    console.error('로그인 오류:', err);
    alert('서버 통신 오류가 발생했습니다.');
  }
});

// 엔터 키 지원
passwordInput.addEventListener('keypress', (e) => {
  if (e.key === 'Enter') {
    loginSubmitBtn.click();
  }
});

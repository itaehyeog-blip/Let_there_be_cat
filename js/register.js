// Supabase 클라이언트 초기화
const supabaseUrl = 'https://zdgdxruhkcetvrmajypo.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InpkZ2R4cnVoa2NldHZybWFqeXBvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODI5NDQ2MDEsImV4cCI6MjA5ODUyMDYwMX0.eubSdBmN32A5aKY7JAGkDeCr6RKwYU2Yj-USmeb4rJs';
const supabaseClient = supabase.createClient(supabaseUrl, supabaseKey);

// DOM 요소 취득
const emailInput = document.getElementById('email');
const passwordInput = document.getElementById('password');
const passwordConfirmInput = document.getElementById('password-confirm');
const registerSubmitBtn = document.getElementById('register-submit-btn');

// 회원가입 처리 함수
registerSubmitBtn.addEventListener('click', async () => {
  const email = emailInput.value.trim();
  const password = passwordInput.value;
  const passwordConfirm = passwordConfirmInput.value;

  if (!email || !password || !passwordConfirm) {
    alert('모든 필수 항목을 입력해 주세요.');
    return;
  }

  if (password !== passwordConfirm) {
    alert('비밀번호와 비밀번호 확인이 일치하지 않습니다.');
    return;
  }

  if (password.length < 6) {
    alert('비밀번호는 최소 6자 이상이어야 합니다.');
    return;
  }

  try {
    const { data, error } = await supabaseClient.auth.signUp({
      email,
      password,
    });

    if (error) {
      alert(`회원가입 실패: ${error.message}`);
    } else {
      alert('회원가입에 성공했습니다! 즉시 로그인이 가능합니다.');
      // 가입 성공 시 로그인 페이지로 이동
      location.href = 'login.html';
    }
  } catch (err) {
    console.error('회원가입 오류:', err);
    alert('서버 통신 오류가 발생했습니다.');
  }
});

// 엔터 키 지원
passwordConfirmInput.addEventListener('keypress', (e) => {
  if (e.key === 'Enter') {
    registerSubmitBtn.click();
  }
});

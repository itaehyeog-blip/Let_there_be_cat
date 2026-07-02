const express = require('express');
const router = express.Router();
const supabase = require('../config/supabase');

// 1. 회원가입 API (POST /api/auth/register)
router.post('/register', async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ error: '이메일과 비밀번호를 입력해주세요.' });
  }

  // Supabase Auth 회원가입 호출 (자동으로 해싱 적용되어 저장됨)
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
  });

  if (error) {
    return res.status(400).json({ error: error.message });
  }

  res.status(201).json({
    message: '회원가입 요청 성공! 이메일을 사용 중이시라면 가입이 완료됩니다.',
    data
  });
});

// 2. 로그인 API (POST /api/auth/login)
router.post('/login', async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ error: '이메일과 비밀번호를 입력해주세요.' });
  }

  // Supabase Auth 비밀번호 로그인 호출
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error) {
    return res.status(400).json({ error: error.message });
  }

  // 로그인에 성공하면 프론트엔드가 사용할 access_token(JWT)과 사용자 정보 전달
  res.json({
    message: '로그인 성공',
    token: data.session.access_token,
    user: data.user
  });
});

module.exports = router;

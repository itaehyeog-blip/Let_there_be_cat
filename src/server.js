const express = require('express');
const path = require('path');
require('dotenv').config();

const authRouter = require('./routes/auth');
const catRouter = require('./routes/cat');

const app = express();
const PORT = process.env.PORT || 3000;

// Body Parser Middleware (JSON 바디 분석 지원)
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// 프론트엔드 정적 파일 서빙
app.use(express.static(path.join(__dirname, '../public')));

// API 라우터 바인딩
app.use('/api/auth', authRouter);
app.use('/api/cat', catRouter);

// 기본 라우트 (index.html 제공)
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '../public/index.html'));
});

// 서버 구동
app.listen(PORT, () => {
  console.log(`==================================================`);
  console.log(`🐱 고양이 이미지 생성 서비스 서버가 실행되었습니다.`);
  console.log(`🌐 주소: http://localhost:${PORT}`);
  console.log(`==================================================`);
});

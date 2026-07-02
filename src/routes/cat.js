const express = require('express');
const router = express.Router();
const fs = require('fs');
const path = require('path');
const supabase = require('../config/supabase');

// Supabase 토큰 인증을 검증하는 미들웨어 (비로그인 허용형)
async function checkAuth(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader) {
    req.user = null;
    return next();
  }

  const token = authHeader.split(' ')[1];
  if (!token || token === 'null' || token === 'undefined') {
    req.user = null;
    return next();
  }

  // Supabase Auth로 토큰 유효성 및 사용자 조회
  const { data: { user }, error } = await supabase.auth.getUser(token);

  if (error || !user) {
    req.user = null;
  } else {
    req.user = user; // 로그인 사용자 정보 주입
  }
  next();
}

// 1. 랜덤 고양이 생성 및 DB 로그 저장 API (POST /api/cat/spawn)
router.post('/spawn', checkAuth, async (req, res) => {
  const { x, y } = req.body;

  if (x === undefined || y === undefined) {
    return res.status(400).json({ error: '마우스 클릭 위치 좌표(x, y)가 필요합니다.' });
  }

  // 고양이 이미지 폴더 경로
  const catImagesDir = path.join(__dirname, '../../public/images/cats');

  // 폴더 내 고양이 파일들을 읽어옴
  fs.readdir(catImagesDir, async (err, files) => {
    if (err || !files || files.length === 0) {
      return res.status(500).json({ error: '고양이 이미지 에셋이 존재하지 않거나 읽을 수 없습니다.' });
    }

    // 랜덤 이미지 파일 선택
    const randomIndex = Math.floor(Math.random() * files.length);
    const selectedImage = files[randomIndex];
    const imagePath = `/images/cats/${selectedImage}`;

    // 로그인된 사용자는 DB에 저장
    if (req.user) {
      const { data, error } = await supabase
        .from('cat_logs')
        .insert([
          {
            user_id: req.user.id,
            image_path: imagePath,
            pos_x: parseInt(x, 10),
            pos_y: parseInt(y, 10)
          }
        ])
        .select();

      if (error) {
        return res.status(400).json({ error: error.message });
      }

      res.json({
        success: true,
        imagePath,
        logId: data[0].id
      });
    } else {
      // 비로그인 상태일 때는 DB 저장을 건너뛰고 이미지 정보만 리턴
      res.json({
        success: true,
        imagePath,
        logId: null
      });
    }
  });
});

// 2. 고양이 삭제 및 DB 로그 제거 API (DELETE /api/cat/:id)
router.delete('/:id', checkAuth, async (req, res) => {
  const { id } = req.params;

  // 비로그인 시 생성된 고양이(logId가 null인 경우)는 DB 삭제 없이 성공 리턴
  if (!id || id === 'null' || id === 'undefined') {
    return res.json({
      success: true,
      message: '로컬에서 고양이가 삭제되었습니다. (비로그인)'
    });
  }

  if (!req.user) {
    return res.status(401).json({ error: '로그인되지 않은 유저는 DB에서 로그를 삭제할 수 없습니다.' });
  }

  // Supabase DB delete 실행 (보안을 위해 user_id 조건 추가)
  const { error } = await supabase
    .from('cat_logs')
    .delete()
    .eq('id', id)
    .eq('user_id', req.user.id);

  if (error) {
    return res.status(400).json({ error: error.message });
  }

  res.json({
    success: true,
    message: '고양이 기록이 정상적으로 삭제되었습니다.'
  });
});

// 3. 사용자별 고양이 생성 히스토리 전체 조회 API (GET /api/cat/history)
router.get('/history', checkAuth, async (req, res) => {
  if (!req.user) {
    return res.json([]); // 비로그인 시 히스토리는 빈 배열 리턴
  }

  const { data, error } = await supabase
    .from('cat_logs')
    .select('*')
    .eq('user_id', req.user.id)
    .order('created_at', { ascending: true });

  if (error) {
    return res.status(400).json({ error: error.message });
  }

  res.json(data);
});

module.exports = router;


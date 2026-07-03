# 🐱 Let there be cat (고양이가 있으라)

> 마우스 클릭으로 화면 가득 고양이를 소환하고, 나만의 고양이 컬렉션을 저장해 보세요!  
> **[Let there be cat 웹사이트 바로가기](https://itaehyeog-blip.github.io/Let_there_be_cat/)**

<br>

<p align="center">
  <img src="https://img.shields.io/badge/HTML5-E34F26?style=flat-square&logo=html5&logoColor=white"/>
  <img src="https://img.shields.io/badge/CSS3-1572B6?style=flat-square&logo=css3&logoColor=white"/>
  <img src="https://img.shields.io/badge/JavaScript-F7DF1E?style=flat-square&logo=javascript&logoColor=black"/>
  <img src="https://img.shields.io/badge/Supabase-3ECF8E?style=flat-square&logo=supabase&logoColor=white"/>
  <img src="https://img.shields.io/badge/GitHub_Pages-222222?style=flat-square&logo=github&logoColor=white"/>
</p>

---

## ✨ 핵심 기능 (Features)

### 1. 🖱️ 클릭 & 소환 (Click-to-Spawn)
- 화면의 빈 공간을 클릭하면 **마우스 포인터 정중앙**에 귀여운 고양이가 폭죽 파티클 효과와 함께 소환됩니다.
- 소환된 고양이를 다시 클릭하면 파동 리플 효과와 함께 **뿅 하고 사라집니다**.

### 2. 👝 3개 등급별 독립 셔플백 (Shuffle Bag) 시스템
단순 무작위 랜덤이 아닌, 등급별 독립 셔플백 구조를 채택하여 **그룹 내 모든 고양이가 한 번씩 골고루 등장**하며 편중을 방지합니다.
- **그룹 1 (1~20번 고양이, 19종)**: 가중치 `1.0` (소환 확률 62.5%)
- **그룹 2 (31~34번 고양이, 4종)**: 가중치 `0.5` (소환 확률 31.25% - 움짤)
- **그룹 3 (51~53번 고양이, 3종)**: 가중치 `0.1` (소환 확률 6.25% - 고?양이)

### 3. 🔑 Supabase 연동 및 게스트 모드 (Authentication & DB)
- **게스트 모드**: 로그인 없이도 자유롭게 고양이를 스폰하고 삭제할 수 있습니다.
- **실시간 저장 및 동기화**: 가입 및 로그인(`Supabase Auth`)을 하면 현재 화면의 모든 고양이 리스트와 좌표 정보가 `Supabase DB`에 안전하게 자동 저장되며, 재접속 시에도 그대로 복원됩니다.

### 4. 🎨 오렌지 & 크림 파스텔 테마 (Pastel Aesthetics)
- 포근하고 밝은 **크림 오렌지 및 코코아 브라운** 조합의 프리미엄 파스텔 테마입니다.
- 화면을 넓고 깔끔하게 활용할 수 있도록 회원가입/로그인 메뉴는 **우측 상단 햄버거 토글 버튼** 내부 슬라이드 서랍에 숨겨져 있습니다.

---

## 🛠️ 기술 스택 (Tech Stack)

| 구분 | 기술 이름 | 상세 |
| :--- | :--- | :--- |
| **Frontend** | HTML5, CSS3, ES6 JavaScript | Vanilla 웹 표준 스택 |
| **Database & Auth** | Supabase (PostgreSQL) | 실시간 유저 인증 및 고양이 데이터 동기화 |
| **Hosting** | GitHub Pages | 클라이언트 사이드 정적 웹 호스팅 |

---

## 📂 프로젝트 구조 (Directory Structure)

```text
Let_there_be_cat/
├── css/
│   └── style.css      # 메인 레이아웃 및 뿅 애니메이션, 파티클 CSS
├── js/
│   ├── main.js        # 3-주머니 셔플백 로직, 캔버스 클릭 제어
│   ├── login.js       # 로그인 및 리다이렉션 로직
│   └── register.js    # 회원가입 및 입력값 유효성 검증
├── images/            # 고양이 이미지 에셋 풀 (1~53번)
├── index.html         # 메인 웹페이지
├── login.html         # 로그인 전용 웹페이지
├── register.html      # 회원가입 전용 웹페이지
└── README.md          # 프로젝트 설명서 (본 파일)
```

---

## 🎮 시작하기 (Getting Started)

본 프로젝트는 백엔드 서버 없이 동작하는 정적 클라이언트 애플리케이션으로, 로컬에서 브라우저로 바로 실행 가능합니다.

1. **저장소 복사**
   ```bash
   git clone https://github.com/itaehyeog-blip/Let_there_be_cat.git
   ```
2. **Supabase 연동 설정**  
   `js/main.js`, `js/login.js`, `js/register.js` 상단에 본인의 Supabase `URL`과 `ANON_KEY`를 설정합니다.
   ```javascript
   const supabaseUrl = 'https://your-project.supabase.co';
   const supabaseKey = 'your-anon-key';
   ```
3. **로컬 실행**  
   VS Code의 `Live Server` 플러그인을 활용하거나, `index.html` 파일을 더블 클릭하여 즉시 실행합니다.

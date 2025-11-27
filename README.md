# EPITEXT Frontend

탁본 복원 관리 시스템의 프론트엔드 애플리케이션입니다.

## 기술 스택

- **React 18** - UI 라이브러리
- **Vite** - 빌드 도구
- **Tailwind CSS** - 스타일링
- **D3.js** - 데이터 시각화 라이브러리
- **JavaScript (JSX)** - 프로그래밍 언어

## 시작하기

### 설치

```bash
npm install
```

### 개발 서버 실행

```bash
npm run dev
```

개발 서버가 실행되면 브라우저에서 `http://localhost:5173`으로 접속할 수 있습니다.

### 빌드

```bash
npm run build
```

### 미리보기

```bash
npm run preview
```

## 프로젝트 구조

```
src/
├── components/
│   ├── Sidebar.jsx              # 사이드바 네비게이션
│   ├── TableRow.jsx             # 테이블 행 컴포넌트
│   └── ReasoningCluster.jsx     # AI 복원 유추 근거 시각화 컴포넌트 (D3.js)
├── pages/
│   ├── ListPage.jsx             # 탁본 목록 페이지
│   ├── DetailPage.jsx           # 탁본 상세 정보 페이지
│   └── UploadPopup.jsx          # 탁본 업로드 팝업
├── App.jsx                      # 메인 앱 컴포넌트 (라우팅)
├── main.jsx                     # 진입점
└── index.css                    # 전역 스타일
```

## 주요 기능

### 목록 및 네비게이션

- **사이드바 네비게이션**: 데이터 관리, 탁본 데이터 메뉴
- **탁본 목록 페이지**: 전체 기록, 복원 진행중, 복원 완료 상태별 조회
- **상태 표시**: 처리중, 우수, 양호, 보통, 미흡 등 상태 표시
- **체크박스 선택**: 개별 및 전체 선택 기능
- **액션 버튼**: 최종 결과 및 복원 시각화 버튼

### 상세 정보 및 AI 복원

- **탁본 상세 정보**: 탁본 정보, 복원 대상 분포, 검수 현황 카드
- **AI 복원 대상 검수**: 한자별 복원 후보 추천 및 신뢰도 표시
- **유추 근거 시각화**: ReasoningCluster 컴포넌트를 통한 복원 과정 시각화
  - 획 일치도와 문맥 일치도 모델의 추천 과정
  - 최종 신뢰도 계산 및 표시
  - 인터랙티브 애니메이션 (D3.js 기반)

## 디자인 시스템

### 색상

#### 주요 색상

- **Primary Orange**: `#ee7542` - 사이드바 활성 메뉴, 복원 대상 분포 그래프, 주요 버튼
- **Secondary**: `#344D64` - 검수 현황 그래프, AI 복원 대상 검수, ReasoningCluster 노드
- **Light Orange**: `#FCE3D9` - 복원 대상 분포 그래프 배경
- **Light Secondary**: `#CCD2D8` - 검수 필요 영역, 비활성 버튼 배경

#### 텍스트 색상

- **Text Dark**: `#2a2a3a` - 주요 텍스트
- **Dark Gray**: `#484a64` - 테이블 헤더, 보조 텍스트
- **Gray4**: `#7F85A3` - 보조 텍스트, 설명 텍스트
- **Sidebar Text**: `#a18e7c` - 사이드바 섹션 라벨

#### 배경 및 테두리

- **Background**: `#F8F8FA` - 페이지 배경
- **Card Background**: `#F6F7FE` - 카드 배경, 테이블 헤더 배경
- **Border**: `#EBEDF8` - 테두리, 구분선
- **Checkbox Border**: `#c0c5dc` - 체크박스 테두리, ReasoningCluster 링크
- **Sidebar Background**: `#e2ddda` - 사이드바 배경
- **Table Header**: `#EEEEEE` - 테이블 헤더 배경

#### 상태 색상

- **우수**: `#50D192` (초록색)
- **양호**: `#FCDB65` (노란색)
- **미흡**: `#F87563` (빨간색)
- **처리중**: `#484A64` (다크 그레이)

### 폰트

- **UI 요소**: Pretendard (기본), Noto Sans KR, Noto Sans JP
- **한자 텍스트**: Noto Serif KR, HanaMinB, Batang, serif
  - 한자 복원 텍스트는 serif 폰트를 우선 사용하여 옛 문헌의 느낌 유지

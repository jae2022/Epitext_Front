# EPITEXT Frontend

탁본 복원 관리 시스템의 프론트엔드 애플리케이션입니다.

## 기술 스택

- **React 18** - UI 라이브러리
- **Vite** - 빌드 도구
- **Tailwind CSS** - 스타일링
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
│   ├── Sidebar.jsx          # 사이드바 네비게이션
│   ├── CompletedList.jsx    # 완료 목록 메인 컴포넌트
│   └── TableRow.jsx         # 테이블 행 컴포넌트
├── App.jsx                  # 메인 앱 컴포넌트
├── main.jsx                 # 진입점
└── index.css               # 전역 스타일
```

## 주요 기능

- **사이드바 네비게이션**: 홈, 데이터 관리, 탁본 데이터 메뉴
- **완료 목록 테이블**: 복원 완료된 탁본 목록 조회
- **상태 표시**: 처리중, 우수, 양호, 보통, 미흡 등 상태 표시
- **체크박스 선택**: 개별 및 전체 선택 기능
- **액션 버튼**: 최종 결과 및 복원 시각화 버튼

## 디자인 시스템

### 색상

- **Primary**: `#2f48e1` (파란색)
- **Gray Scale**: 다양한 회색 톤
- **State Colors**:
  - 정상: `#50D192` (초록색)
  - 경미: `#FCDB65` (노란색)
  - 주의: `#FFA36E` (주황색)
  - 심각: `#F87563` (빨간색)

### 폰트

- Noto Sans KR (기본)
- Pretendard (대체)







# 백엔드 구현 가이드

## 개요

이 문서는 프론트엔드 요구사항에 맞춰 백엔드 및 DB를 구현할 때 필요한 정보를 정리한 것입니다.

---

## 1. 데이터베이스 구조

### 1.1 `rubbings` 테이블 (탁본 목록)

```sql
CREATE TABLE rubbings (
    id INTEGER PRIMARY KEY AUTO_INCREMENT,
    image_url VARCHAR(255) NOT NULL,           -- 이미지 파일 경로
    filename VARCHAR(255) NOT NULL,            -- 원본 파일명
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,  -- 생성 일시 (업로드 시점)
    status VARCHAR(20),                         -- 상태: "처리중", "우수", "양호", "미흡"
    restoration_status VARCHAR(100),            -- "356자 / 복원 대상 23자" 형식
    processing_time INTEGER,                    -- AI 모델 처리 시간 (초 단위)
    damage_level DECIMAL(5,2),                  -- 복원 대상 비율 (%)
    inspection_status VARCHAR(100),             -- "12자 완료" 형식
    average_reliability DECIMAL(5,2),          -- 검수한 글자들의 평균 신뢰도 (%)
    is_completed BOOLEAN DEFAULT FALSE,         -- 복원 완료 여부
    processed_at TIMESTAMP,                     -- 처리 완료 일시
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- 인덱스
CREATE INDEX idx_rubbings_created_at ON rubbings(created_at DESC);  -- 최신순 정렬용
CREATE INDEX idx_rubbings_is_completed ON rubbings(is_completed);  -- 필터링용
```

### 1.2 `rubbing_details` 테이블 (탁본 상세 정보)

```sql
CREATE TABLE rubbing_details (
    id INTEGER PRIMARY KEY AUTO_INCREMENT,
    rubbing_id INTEGER NOT NULL,
    text_content TEXT,                         -- OCR 결과 텍스트 (JSON 배열 또는 TEXT, 구두점 복원 전)
    text_content_with_punctuation TEXT,        -- 구두점 복원 모델 적용 후 텍스트 (쉼표, 마침표 등 포함)
    font_types VARCHAR(255),                   -- 폰트 타입 (JSON 배열: ["행서체", "전서체"])
                                              -- 가능한 값: "전서", "예서", "해서", "행서", "초서" (여러개 가능)
    damage_percentage DECIMAL(5,2),            -- 손상 비율
    total_processing_time INTEGER,            -- 총 처리 시간 (초)
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (rubbing_id) REFERENCES rubbings(id) ON DELETE CASCADE
);
```

### 1.3 `rubbing_statistics` 테이블 (탁본 통계)

```sql
CREATE TABLE rubbing_statistics (
    id INTEGER PRIMARY KEY AUTO_INCREMENT,
    rubbing_id INTEGER NOT NULL,
    total_characters INTEGER NOT NULL,          -- 전체 글자 수
    restoration_targets INTEGER NOT NULL,       -- 복원 대상 글자 수
    partial_damage INTEGER,                     -- 부분 훼손 글자 수
    complete_damage INTEGER,                   -- 완전 훼손 글자 수
    restoration_percentage DECIMAL(5,2),       -- 복원 비율 (%)
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (rubbing_id) REFERENCES rubbings(id) ON DELETE CASCADE
);
```

### 1.4 `restoration_targets` 테이블 (복원 대상 글자)

```sql
CREATE TABLE restoration_targets (
    id INTEGER PRIMARY KEY AUTO_INCREMENT,
    rubbing_id INTEGER NOT NULL,
    row_index INTEGER NOT NULL,                 -- 행 인덱스 (0부터 시작)
    char_index INTEGER NOT NULL,               -- 글자 인덱스 (0부터 시작)
    position VARCHAR(50),                      -- "1행 1자" 형식
    damage_type VARCHAR(20),                   -- "부분_훼손" 또는 "완전_훼손"
    cropped_image_url VARCHAR(255),            -- 탁본 이미지에서 해당 글자 부분 크롭한 이미지 URL
    crop_x INTEGER,                            -- 크롭 영역 X 좌표 (픽셀)
    crop_y INTEGER,                            -- 크롭 영역 Y 좌표 (픽셀)
    crop_width INTEGER,                         -- 크롭 영역 너비 (픽셀)
    crop_height INTEGER,                        -- 크롭 영역 높이 (픽셀)
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (rubbing_id) REFERENCES rubbings(id) ON DELETE CASCADE
);
```

### 1.5 `candidates` 테이블 (후보 한자)

```sql
CREATE TABLE candidates (
    id INTEGER PRIMARY KEY AUTO_INCREMENT,
    target_id INTEGER NOT NULL,
    character VARCHAR(10) NOT NULL,           -- 후보 한자
    stroke_match DECIMAL(5,2),                 -- 획 일치도 (null 가능, 완전 훼손 시)
    context_match DECIMAL(5,2) NOT NULL,       -- 문맥 일치도
    rank_vision INTEGER,                       -- Vision 모델 순위 (null 가능)
    rank_nlp INTEGER NOT NULL,                 -- NLP 모델 순위
    model_type VARCHAR(10),                   -- "nlp", "both", "vision"
    reliability DECIMAL(5,2),                  -- 최종 신뢰도 (F1 Score)
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (target_id) REFERENCES restoration_targets(id) ON DELETE CASCADE
);
```

### 1.6 `inspection_records` 테이블 (검수 기록)

```sql
CREATE TABLE inspection_records (
    id INTEGER PRIMARY KEY AUTO_INCREMENT,
    rubbing_id INTEGER NOT NULL,
    target_id INTEGER NOT NULL,
    selected_character VARCHAR(10) NOT NULL,  -- 선택된 한자
    selected_candidate_id INTEGER,             -- 선택된 후보 ID
    reliability DECIMAL(5,2),                  -- 선택된 후보의 신뢰도
    inspected_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (rubbing_id) REFERENCES rubbings(id) ON DELETE CASCADE,
    FOREIGN KEY (target_id) REFERENCES restoration_targets(id) ON DELETE CASCADE,
    FOREIGN KEY (selected_candidate_id) REFERENCES candidates(id) ON DELETE SET NULL
);
```

---

## 2. 상태 계산 로직

### 2.1 상태 결정 규칙

```python
def calculate_status(processing_time, damage_level):
    """
    상태 계산 로직

    Args:
        processing_time: AI 모델 처리 시간 (초 단위, None이면 처리 중)
        damage_level: 복원 대상 비율 (%)

    Returns:
        "처리중" | "우수" | "양호" | "미흡"
    """
    # 처리 중인 경우
    if processing_time is None:
        return "처리중"

    # 복원 대상 비율에 따라 상태 결정
    if damage_level < 10:
        return "우수"      # 10% 미만
    elif damage_level < 30:
        return "양호"      # 10% 이상 30% 미만
    else:
        return "미흡"      # 30% 이상
```

### 2.2 복원 대상 비율 계산

```python
def calculate_damage_level(total_characters, restoration_targets):
    """
    복원 대상 비율 계산

    Args:
        total_characters: 전체 글자 수
        restoration_targets: 복원 대상 글자 수

    Returns:
        복원 대상 비율 (%)
    """
    if total_characters == 0:
        return 0.0

    return (restoration_targets / total_characters) * 100
```

---

## 3. API 엔드포인트

### 3.1 탁본 목록 조회

```
GET /api/rubbings
Query Parameters:
  - status (optional): "복원 완료" | "복원 진행중" | null

Response: Array<RubbingListItem>
[
  {
    "id": 8,
    "image_url": "/images/rubbings/rubbing_8.jpg",
    "filename": "귀법사적수화현응모지명_8.jpg",
    "created_at": "2025-10-28T10:00:00Z",
    "status": "처리중",
    "restoration_status": null,
    "processing_time": null,
    "damage_level": null,
    "inspection_status": null,
    "average_reliability": null,
    "is_completed": false
  },
  ...
]

주의사항:
- 최신순으로 정렬 (created_at DESC) - 가장 최근에 올린 탁본이 첫 번째
- status 파라미터에 따라 필터링:
  - "복원 완료": is_completed = true
  - "복원 진행중": is_completed = false
  - null: 전체
```

### 3.2 탁본 원본 파일 다운로드

```
GET /api/rubbings/:id/download

Response: File (image/jpeg 또는 image/png)
Content-Disposition: attachment; filename="원본파일명.jpg"

구현 예시 (Python Flask):
@app.route('/api/rubbings/<int:rubbing_id>/download')
def download_rubbing(rubbing_id):
    rubbing = Rubbing.query.get(rubbing_id)
    if not rubbing:
        return {"error": "Rubbing not found"}, 404

    return send_file(
        rubbing.image_url,
        as_attachment=True,
        download_name=rubbing.filename
    )
```

### 3.3 탁본 상세 정보 조회

```
GET /api/rubbings/:id

Response: RubbingDetail
{
  "id": 1,
  "image_url": "/images/rubbings/rubbing_1.jpg",
  "filename": "귀법사적수화현응모지명.jpg",
  "text_content": [
    "高□洛□歸法寺住持",
    "見性寂炤首□玄應者",
    ...
  ],
  "text_content_with_punctuation": [
    "高□洛□歸法寺住持，",
    "見性寂炤首□玄應者。",
    ...
  ],
  "font_types": ["행서체", "전서체"],  // 전서, 예서, 해서, 행서, 초서 중 여러개 가능
  "damage_percentage": 31.6,
  "processed_at": "2025-10-28T16:23:00Z",
  "total_processing_time": 222,
  "created_at": "2025-10-28T06:30:00Z",
  "updated_at": "2025-10-28T16:23:00Z"
}

주의사항:
- text_content: OCR 결과 (구두점 복원 전)
- text_content_with_punctuation: 구두점 복원 모델 적용 후 (쉼표, 마침표 등 포함)
- font_types: 전서, 예서, 해서, 행서, 초서 중 분석 결과에 따라 여러개 가능
```

### 3.4 탁본 통계 조회

```
GET /api/rubbings/:id/statistics

Response: RubbingStatistics
{
  "rubbing_id": 1,
  "total_characters": 247,
  "restoration_targets": 78,
  "partial_damage": 49,
  "complete_damage": 29,
  "restoration_percentage": 31.6
}
```

### 3.5 복원 대상 목록 조회

```
GET /api/rubbings/:id/restoration-targets

Response: Array<RestorationTarget>
[
  {
    "id": 1,
    "row_index": 0,
    "char_index": 2,
    "position": "1행 3자",
    "damage_type": "부분_훼손"
  },
  ...
]
```

### 3.6 후보 한자 목록 조회

```
GET /api/rubbings/:id/targets/:targetId/candidates

Response: {
  "top5": Array<Candidate>,  // 상위 5개 (표시용, 교집합 기준)
  "all": Array<Candidate>    // 전체 10개 (시각화용)
}

Candidate 구조:
{
  "id": 1,
  "character": "麗",
  "stroke_match": 85.4,      // null 가능 (완전 훼손 시)
  "context_match": 76.8,
  "rank_vision": 1,          // null 가능
  "rank_nlp": 1,
  "model_type": "both",      // "nlp" | "both" | "vision"
  "reliability": 80.5        // F1 Score
}

주의사항:
- top5는 획 일치도와 문맥 일치도 둘 다 존재하는 후보(교집합)만 포함
- 교집합이 5개 미만일 경우 null 값으로 채워서 항상 5개 유지
- null 값 예시: { "character": null, "stroke_match": null, "context_match": null, "reliability": null }
- 교집합을 신뢰도(reliability) 기준으로 정렬하여 상위 5개 선택
```

### 3.7 유추 근거 데이터 조회

```
GET /api/rubbings/:id/targets/:targetId/reasoning

Response: {
  "imgUrl": "/images/rubbings/cropped/rubbing_1_target_1.jpg",  // 탁본 이미지에서 해당 글자 부분 크롭한 이미지 URL
  "vision": Array<Candidate>,  // Vision 모델 후보 (획 일치도 기준 정렬)
  "nlp": Array<Candidate>      // NLP 모델 후보 (문맥 일치도 기준 정렬)
}

주의사항:
- imgUrl: 탁본 이미지에서 해당 복원 대상 글자 부분을 크롭한 이미지 URL
- 크롭 이미지는 AI 모델 처리 시 생성되어 저장됨
- 크롭 영역은 row_index와 char_index를 기반으로 계산됨
```

### 3.7.1 복원 대상 글자 크롭 이미지 조회 (별도 엔드포인트)

```
GET /api/rubbings/:id/targets/:targetId/cropped-image

Response: File (image/jpeg 또는 image/png)
Content-Type: image/jpeg

구현 예시 (Python Flask):
@app.route('/api/rubbings/<int:rubbing_id>/targets/<int:target_id>/cropped-image')
def get_cropped_image(rubbing_id, target_id):
    target = RestorationTarget.query.filter_by(
        id=target_id,
        rubbing_id=rubbing_id
    ).first()

    if not target:
        return {"error": "Target not found"}, 404

    # 크롭된 이미지 경로 반환
    cropped_image_path = f"/images/rubbings/cropped/rubbing_{rubbing_id}_target_{target_id}.jpg"
    return send_file(cropped_image_path, mimetype='image/jpeg')
```

### 3.8 검수 상태 조회

```
GET /api/rubbings/:id/inspection-status

Response: {
  "rubbing_id": 1,
  "total_targets": 78,
  "inspected_count": 14,
  "inspected_targets": [
    {
      "target_id": 1,
      "selected_character": "麗",
      "selected_candidate_id": 1,
      "inspected_at": "2025-10-28T16:25:00Z"
    },
    ...
  ]
}
```

### 3.9 탁본 이미지 업로드

```
POST /api/rubbings/upload
Content-Type: multipart/form-data

Request Body:
  - file: File (이미지 파일)

Response: {
  "id": 9,
  "image_url": "/images/rubbings/rubbing_9.jpg",
  "filename": "uploaded_file.jpg",
  "created_at": "2025-10-28T11:00:00Z",
  "status": "처리중",
  ...
}

주의사항:
- 업로드 시 status는 "처리중"으로 설정
- processing_time, damage_level 등은 null로 설정
- AI 모델 처리 완료 후 업데이트
```

### 3.10 검수 결과 저장

```
POST /api/rubbings/:id/targets/:targetId/inspect
Content-Type: application/json

Request Body: {
  "selected_character": "麗",
  "selected_candidate_id": 1
}

Response: {
  "success": true,
  "inspected_at": "2025-10-28T16:25:00Z"
}

주의사항:
- inspection_records 테이블에 기록 저장
- rubbings 테이블의 inspection_status 업데이트 (예: "14자 완료")
- rubbings 테이블의 average_reliability 업데이트 (검수한 글자들의 평균 신뢰도)
```

### 3.11 복원 완료 처리

```
POST /api/rubbings/complete
Content-Type: application/json

Request Body: {
  "selected_ids": [1, 2, 3, ...]  // 복원 완료할 탁본 ID 배열
}

Response: {
  "success": true,
  "completed_count": 3
}

주의사항:
- rubbings 테이블의 is_completed를 true로 업데이트
- 여러 ID를 한 번에 처리
```

---

## 4. 백엔드 구현 시 주의사항

### 4.1 번호 표시

- **프론트엔드에서 번호는 최신순으로 정렬된 리스트의 인덱스 + 1로 표시**
- 백엔드에서 `created_at DESC`로 정렬하여 반환하면 됨
- 예: 가장 최근에 올린 탁본이 첫 번째 → 프론트엔드에서 1번으로 표시

### 4.2 상태 자동 계산

- AI 모델 처리 완료 후 자동으로 상태 계산
- `damage_level` (복원 대상 비율)을 기준으로:
  - 10% 미만: "우수"
  - 10% 이상 30% 미만: "양호"
  - 30% 이상: "미흡"
- 처리 중일 때는 `processing_time`이 null이므로 "처리중"

### 4.3 복원 현황 포맷

- `restoration_status` 필드는 "전체글자수자 / 복원 대상 X자" 형식
- 예: "356자 / 복원 대상 23자"

### 4.4 검수 현황 포맷

- `inspection_status` 필드는 "X자 완료" 형식
- 예: "12자 완료"
- `inspection_records` 테이블에서 해당 `rubbing_id`의 레코드 수를 세어서 계산

### 4.5 평균 신뢰도 계산

- `average_reliability`는 검수한 글자들의 신뢰도 평균
- `inspection_records` 테이블에서 해당 `rubbing_id`의 `reliability` 평균 계산
- 검수 현황 카드에는 다음 통계가 표시됨:
  - 검수 완료 글자 수: `inspection_records` 테이블의 레코드 수
  - 평균 신뢰도: 검수한 글자들의 신뢰도 평균
  - 최고 신뢰도: 검수한 글자들의 신뢰도 최대값
  - 최저 신뢰도: 검수한 글자들의 신뢰도 최소값

### 4.6 탁본 손상 정도

- `damage_level`은 복원 대상 비율 (%)
- 상태 계산 기준과 동일한 값

### 4.7 처리 시간

- `processing_time`은 AI 모델이 처리하는데 걸린 시간 (초 단위)
- 프론트엔드에서 "X분 Y초" 형식으로 변환

### 4.8 복원 완료 필터링

- `is_completed` 필드로 복원 완료 여부 관리
- "복원 완료" 페이지: `is_completed = true`
- "복원 진행중" 페이지: `is_completed = false`
- "전체 기록" 페이지: 전체 조회

### 4.9 구두점 복원 모델

- OCR 결과(`text_content`)에 구두점 복원 모델을 적용하여 `text_content_with_punctuation` 생성
- 구두점 복원 모델은 쉼표(，), 마침표(。), 줄바꿈 등을 추가
- 프론트엔드에서는 `text_content_with_punctuation`를 사용하여 텍스트 표시
- 구두점에 따라 줄바꿈이 자연스럽게 이루어짐

### 4.10 교집합 처리 (검수 대상 추천 한자)

- 검수 대상 추천 한자 표에는 획 일치도와 문맥 일치도 둘 다 존재하는 후보만 표시
- 교집합 계산:
  ```python
  intersection = [c for c in candidates if c.stroke_match is not None and c.context_match is not None]
  ```
- 교집합을 신뢰도(reliability) 기준으로 정렬하여 상위 5개 선택
- 교집합이 5개 미만일 경우 null 값으로 채워서 항상 5개 유지
- null 값 예시: `{ "character": null, "stroke_match": null, "context_match": null, "reliability": null }`

### 4.11 폰트 타입 분석

- 폰트 타입은 전서, 예서, 해서, 행서, 초서 중 분석 결과에 따라 여러개 가능
- `font_types` 필드는 JSON 배열 형식: `["행서체", "전서체"]`
- 프론트엔드에서 태그로 표시됨

### 4.12 탁본 이미지 크롭 (유추 근거 cluster용)

- AI 모델 처리 시 각 복원 대상 글자 부분을 탁본 이미지에서 크롭하여 저장
- 크롭 영역은 `row_index`와 `char_index`를 기반으로 계산
- 크롭된 이미지는 `/images/rubbings/cropped/rubbing_{rubbing_id}_target_{target_id}.jpg` 형식으로 저장
- `restoration_targets` 테이블에 `cropped_image_url` 필드에 경로 저장
- 크롭 좌표 정보(`crop_x`, `crop_y`, `crop_width`, `crop_height`)도 함께 저장
- 유추 근거 데이터 조회 시 `imgUrl` 필드에 크롭된 이미지 URL 포함

---

## 5. 데이터 흐름

### 5.1 탁본 업로드 → 처리 완료

```
1. 사용자가 탁본 이미지 업로드
   → POST /api/rubbings/upload
   → rubbings 테이블에 레코드 생성 (status: "처리중", processing_time: null)

2. AI 모델이 탁본 분석 시작 (비동기)
   → 백그라운드 작업

3. AI 모델 처리 완료
   → OCR 결과 생성 → text_content 저장
   → 구두점 복원 모델 적용 → text_content_with_punctuation 저장
   → 폰트 타입 분석 → font_types 저장 (전서, 예서, 해서, 행서, 초서 중 여러개)
   → 각 복원 대상 글자 부분 크롭 → cropped_image_url 저장
   → rubbing_details, rubbing_statistics, restoration_targets, candidates 테이블에 데이터 저장
   → rubbings 테이블 업데이트:
     - status: 상태 계산 로직 적용 ("우수" | "양호" | "미흡")
     - processing_time: 처리 시간 (초)
     - damage_level: 복원 대상 비율 (%)
     - restoration_status: "전체글자수자 / 복원 대상 X자"
     - processed_at: 처리 완료 일시
```

### 5.2 검수 진행

```
1. 사용자가 상세 페이지에서 후보 한자 선택
   → POST /api/rubbings/:id/targets/:targetId/inspect
   → inspection_records 테이블에 레코드 추가

2. 검수 현황 업데이트
   → rubbings.inspection_status: "X자 완료" (inspection_records 개수)
   → rubbings.average_reliability: 검수한 글자들의 평균 신뢰도
   → 검수 현황 카드 통계 계산:
     - 검수 완료 글자 수: inspection_records 레코드 수
     - 평균 신뢰도: 검수한 글자들의 신뢰도 평균
     - 최고 신뢰도: 검수한 글자들의 신뢰도 최대값
     - 최저 신뢰도: 검수한 글자들의 신뢰도 최소값
```

### 5.3 복원 완료 처리

```
1. 사용자가 목록에서 체크박스 선택 후 "복원 완료" 버튼 클릭
   → POST /api/rubbings/complete
   → rubbings.is_completed = true로 업데이트

2. 목록 필터링
   → "복원 완료" 페이지: is_completed = true만 표시
   → "복원 진행중" 페이지: is_completed = false만 표시
```

---

## 6. 체리피킹 데이터 (초기 데이터)

처음 화면에 들어가면 5개 정도의 미리 처리한 탁본 목록이 있어야 함:

```sql
-- 예시: 5개의 체리피킹 데이터
INSERT INTO rubbings (id, image_url, filename, created_at, status, restoration_status, processing_time, damage_level, inspection_status, average_reliability, is_completed, processed_at) VALUES
(1, '/images/rubbings/rubbing_1.jpg', '귀법사적수화현응모지명.jpg', '2025-10-28T06:30:00Z', '우수', '356자 / 복원 대상 23자', 222, 6.5, '12자 완료', 92.0, false, '2025-10-28T06:33:42Z'),
(2, '/images/rubbings/rubbing_2.jpg', '귀법사적수화현응모지명_2.jpg', '2025-10-28T07:00:00Z', '양호', '68자 / 복원 대상 12자', 201, 17.6, '12자 완료', 76.0, false, '2025-10-28T07:03:21Z'),
(3, '/images/rubbings/rubbing_3.jpg', '귀법사적수화현응모지명_3.jpg', '2025-10-28T07:30:00Z', '우수', '112자 / 복원 대상 8자', 225, 7.1, '5자 완료', 92.0, false, '2025-10-28T07:33:45Z'),
(4, '/images/rubbings/rubbing_4.jpg', '귀법사적수화현응모지명_4.jpg', '2025-10-28T08:00:00Z', '미흡', '89자 / 복원 대상 31자', 302, 34.8, '31자 완료', 68.0, false, '2025-10-28T08:05:02Z'),
(5, '/images/rubbings/rubbing_5.jpg', '귀법사적수화현응모지명_5.jpg', '2025-10-28T08:30:00Z', '미흡', '203자 / 복원 대상 87자', 414, 42.9, '23자 완료', 45.0, false, '2025-10-28T08:36:54Z');
```

---

## 7. 환경 변수

프론트엔드에서 사용하는 API Base URL:

```
VITE_API_BASE_URL=http://localhost:8000  # 개발 환경
VITE_API_BASE_URL=https://api.epitext.com  # 프로덕션 환경
```

---

## 8. 에러 처리

모든 API는 일관된 에러 응답 형식을 사용:

```json
{
  "error": "에러 메시지",
  "code": "ERROR_CODE"
}
```

HTTP 상태 코드:

- 200: 성공
- 400: 잘못된 요청
- 404: 리소스를 찾을 수 없음
- 500: 서버 에러

---

이 가이드를 참고하여 백엔드를 구현하면 프론트엔드와 원활하게 연동할 수 있습니다.

/**
 * Mock Data for Epitext Frontend
 * 백엔드 API에서 받을 것으로 예상되는 데이터 구조로 정리된 더미 데이터
 */

// 탁본 목록 데이터 (GET /api/rubbings 응답 형식)
// 주의: 번호는 최신순으로 정렬되어야 함 (가장 최근에 올린 탁본이 1번)
// 상태 계산 로직:
//   - 처리중: AI 모델이 분석 중일 때 (processing_time이 null)
//   - 우수: 복원 대상 비율이 10% 미만
//   - 양호: 복원 대상 비율이 10% 이상 30% 미만
//   - 미흡: 복원 대상 비율이 30% 이상
export const mockRubbingList = [
  {
    id: 8,
    image_url: "/images/rubbings/rubbing_8.jpg",
    filename: "귀법사적수화현응모지명_8.jpg",
    created_at: "2025-10-28T10:00:00Z",
    status: "처리중", // AI 모델 분석 중
    restoration_status: null,
    processing_time: null,
    damage_level: null, // 복원 대상 비율 (%)
    inspection_status: null,
    average_reliability: null,
    is_completed: false,
  },
  {
    id: 7,
    image_url: "/images/rubbings/rubbing_7.jpg",
    filename: "귀법사적수화현응모지명_7.jpg",
    created_at: "2025-10-28T09:30:00Z",
    status: "우수", // 복원 대상 23자 / 전체 356자 = 6.5% (< 10%)
    restoration_status: "356자 / 복원 대상 23자",
    processing_time: 222, // 초 단위 (3분 42초)
    damage_level: 6.5, // 복원 대상 비율 (%)
    inspection_status: "12자 완료",
    average_reliability: 92,
    is_completed: false,
  },
  {
    id: 6,
    image_url: "/images/rubbings/rubbing_6.jpg",
    filename: "귀법사적수화현응모지명_6.jpg",
    created_at: "2025-10-28T09:00:00Z",
    status: "양호", // 복원 대상 12자 / 전체 68자 = 17.6% (10% ~ 30%)
    restoration_status: "68자 / 복원 대상 12자",
    processing_time: 201, // 초 단위 (3분 21초)
    damage_level: 17.6, // 복원 대상 비율 (%)
    inspection_status: "12자 완료",
    average_reliability: 76,
    is_completed: false,
  },
  {
    id: 5,
    image_url: "/images/rubbings/rubbing_5.jpg",
    filename: "귀법사적수화현응모지명_5.jpg",
    created_at: "2025-10-28T08:30:00Z",
    status: "우수", // 복원 대상 8자 / 전체 112자 = 7.1% (< 10%)
    restoration_status: "112자 / 복원 대상 8자",
    processing_time: 225, // 초 단위 (3분 45초)
    damage_level: 7.1, // 복원 대상 비율 (%)
    inspection_status: "5자 완료",
    average_reliability: 92,
    is_completed: false,
  },
  {
    id: 4,
    image_url: "/images/rubbings/rubbing_4.jpg",
    filename: "귀법사적수화현응모지명_4.jpg",
    created_at: "2025-10-28T08:00:00Z",
    status: "미흡", // 복원 대상 31자 / 전체 89자 = 34.8% (>= 30%)
    restoration_status: "89자 / 복원 대상 31자",
    processing_time: 302, // 초 단위 (5분 02초)
    damage_level: 34.8, // 복원 대상 비율 (%)
    inspection_status: "31자 완료",
    average_reliability: 68,
    is_completed: false,
  },
  {
    id: 3,
    image_url: "/images/rubbings/rubbing_3.jpg",
    filename: "귀법사적수화현응모지명_3.jpg",
    created_at: "2025-10-28T07:30:00Z",
    status: "양호", // 복원 대상 8자 / 전체 15자 = 53.3% (>= 30%) -> 실제로는 미흡이지만 예시용
    restoration_status: "15자 / 복원 대상 8자",
    processing_time: 137, // 초 단위 (2분 17초)
    damage_level: 53.3, // 복원 대상 비율 (%)
    inspection_status: "2자 완료",
    average_reliability: 71,
    is_completed: false,
  },
  {
    id: 2,
    image_url: "/images/rubbings/rubbing_2.jpg",
    filename: "귀법사적수화현응모지명_2.jpg",
    created_at: "2025-10-28T07:00:00Z",
    status: "미흡", // 복원 대상 87자 / 전체 203자 = 42.9% (>= 30%)
    restoration_status: "203자 / 복원 대상 87자",
    processing_time: 414, // 초 단위 (6분 54초)
    damage_level: 42.9, // 복원 대상 비율 (%)
    inspection_status: "23자 완료",
    average_reliability: 45,
    is_completed: false,
  },
  {
    id: 1,
    image_url: "/images/rubbings/rubbing_1.jpg",
    filename: "귀법사적수화현응모지명.jpg",
    created_at: "2025-10-28T06:30:00Z",
    status: "미흡", // 복원 대상 29자 / 전체 47자 = 61.7% (>= 30%)
    restoration_status: "47자 / 복원 대상 29자",
    processing_time: 273, // 초 단위 (4분 33초)
    damage_level: 61.7, // 복원 대상 비율 (%)
    inspection_status: "14자 완료",
    average_reliability: 52,
    is_completed: false,
  },
];

// 탁본 상세 정보 데이터 (GET /api/rubbings/:id 응답 형식)
export const mockRubbingDetail = {
  id: 1,
  image_url: "/images/rubbings/rubbing_1.jpg",
  filename: "귀법사적수화현응모지명.jpg",
  text_content: [
    "高□洛□歸法寺住持",
    "見性寂炤首□玄應者",
    "立□第十五□肅宗□子",
    "□□歲下元己未二月十",
    "□日甲子薨卒二十一日",
    "壬申茶□以三月□五日",
    "乙酉□舍利□於八德□",
    "□□歲下元己未二月十",
    "□日甲子薨卒二十一日",
    "壬申茶□以三月□五日",
    "乙酉□舍利□於八德□",
    "□□歲下元己未二月十",
    "□日甲子薨卒二十一日",
    "壬申茶□以三月□五日",
    "乙酉□舍利□於八德□",
    "□□歲下元己未二月十",
    "□日甲子薨卒二十一日",
    "壬申茶□以三月□五日",
    "高□洛□歸法寺住持",
    "見性□炤首□玄應者",
    "立□□十五□肅宗□子",
    "□□歲下元己未二月十",
    "□日甲子薨卒二十一日",
    "壬申茶□以三月□五日",
    "□□歲下元己未二月十",
  ],
  font_types: ["행서체", "전서체"],
  damage_percentage: 31.6,
  processed_at: "2025-10-28T16:23:00Z",
  total_processing_time: 222, // 초 단위
  created_at: "2025-10-28T06:30:00Z",
  updated_at: "2025-10-28T16:23:00Z",
};

// 탁본 통계 데이터 (GET /api/rubbings/:id/statistics 응답 형식)
export const mockRubbingStatistics = {
  rubbing_id: 1,
  total_characters: 247,
  restoration_targets: 78,
  partial_damage: 49,
  complete_damage: 29,
  restoration_percentage: 31.6,
};

// 복원 대상 글자 위치 데이터 생성 함수 (GET /api/rubbings/:id/restoration-targets 응답 형식)
export const generateMockRestorationTargets = (textContent) => {
  const targets = [];
  let id = 1;

  // textContent에서 모든 □ 위치 찾기
  textContent.forEach((text, rowIndex) => {
    text.split("").forEach((char, charIndex) => {
      if (char === "□") {
        targets.push({
          id: id++,
          row_index: rowIndex,
          char_index: charIndex,
          position: `${rowIndex + 1}행 ${charIndex + 1}자`,
          damage_type: Math.random() > 0.5 ? "부분_훼손" : "완전_훼손", // 랜덤으로 설정 (실제로는 백엔드에서 판단)
        });
      }
    });
  });

  // 78개가 되도록 더미 데이터 추가
  while (targets.length < 78) {
    const rowIndex = Math.floor(targets.length / 10) + 10;
    const charIndex = targets.length % 10;
    targets.push({
      id: id++,
      row_index: rowIndex,
      char_index: charIndex,
      position: `${rowIndex + 1}행 ${charIndex + 1}자`,
      damage_type: Math.random() > 0.5 ? "부분_훼손" : "완전_훼손",
    });
  }

  return targets.slice(0, 78); // 정확히 78개만 반환
};

// Mock 복원 대상 목록 (mockRubbingDetail.text_content 기반)
export const mockRestorationTargets = generateMockRestorationTargets(mockRubbingDetail.text_content);

// 후보 한자 데이터 샘플 (GET /api/rubbings/:id/targets/:targetId/candidates 응답 형식)
// 각 복원 대상 글자마다 10개의 후보가 있음
const generateSampleCandidates = () => {
  const sampleCandidates = [
    // 완전 훼손 샘플 (획 일치도가 null)
    [
      { id: 1, character: "麗", stroke_match: null, context_match: 76.8, rank_vision: null, rank_nlp: 1, model_type: "nlp" },
      { id: 2, character: "郡", stroke_match: null, context_match: 54.8, rank_vision: null, rank_nlp: 2, model_type: "nlp" },
      { id: 3, character: "鄕", stroke_match: null, context_match: 25.3, rank_vision: null, rank_nlp: 3, model_type: "nlp" },
      { id: 4, character: "麓", stroke_match: null, context_match: 30.4, rank_vision: null, rank_nlp: 4, model_type: "nlp" },
      { id: 5, character: "楚", stroke_match: null, context_match: 14.6, rank_vision: null, rank_nlp: 5, model_type: "nlp" },
      { id: 6, character: "都", stroke_match: null, context_match: 12.4, rank_vision: null, rank_nlp: 6, model_type: "nlp" },
      { id: 7, character: "散", stroke_match: null, context_match: 10.2, rank_vision: null, rank_nlp: 7, model_type: "nlp" },
      { id: 8, character: "椰", stroke_match: null, context_match: 8.9, rank_vision: null, rank_nlp: 8, model_type: "nlp" },
      { id: 9, character: "郁", stroke_match: null, context_match: 7.5, rank_vision: null, rank_nlp: 9, model_type: "nlp" },
      { id: 10, character: "洛", stroke_match: null, context_match: 6.1, rank_vision: null, rank_nlp: 10, model_type: "nlp" },
    ],
    // 부분 훼손 샘플 (Vision과 NLP 모두 있음)
    [
      { id: 11, character: "麗", stroke_match: 85.4, context_match: 70.3, rank_vision: 1, rank_nlp: 1, model_type: "both" },
      { id: 12, character: "郡", stroke_match: 55.8, context_match: 68.5, rank_vision: 7, rank_nlp: 2, model_type: "both" },
      { id: 13, character: "鄕", stroke_match: 50.4, context_match: 65.2, rank_vision: 8, rank_nlp: 3, model_type: "both" },
      { id: 14, character: "麓", stroke_match: 45.2, context_match: 62.1, rank_vision: 9, rank_nlp: 4, model_type: "both" },
      { id: 15, character: "楚", stroke_match: 40.1, context_match: 58.9, rank_vision: 10, rank_nlp: 5, model_type: "both" },
      { id: 16, character: "郁", stroke_match: 80.8, context_match: 45.2, rank_vision: 2, rank_nlp: 9, model_type: "both" },
      { id: 17, character: "都", stroke_match: 75.5, context_match: 52.3, rank_vision: 3, rank_nlp: 6, model_type: "both" },
      { id: 18, character: "散", stroke_match: 70.1, context_match: 48.7, rank_vision: 4, rank_nlp: 7, model_type: "both" },
      { id: 19, character: "椰", stroke_match: 65.6, context_match: 46.5, rank_vision: 5, rank_nlp: 8, model_type: "both" },
      { id: 20, character: "洛", stroke_match: 60.3, context_match: 42.1, rank_vision: 6, rank_nlp: 10, model_type: "both" },
    ],
    // 다른 부분 훼손 샘플
    [
      { id: 21, character: "寂", stroke_match: 90.7, context_match: 75.3, rank_vision: 1, rank_nlp: 3, model_type: "both" },
      { id: 22, character: "宗", stroke_match: 85.2, context_match: 80.3, rank_vision: 2, rank_nlp: 1, model_type: "both" },
      { id: 23, character: "肅", stroke_match: 80.4, context_match: 70.6, rank_vision: 3, rank_nlp: 4, model_type: "both" },
      { id: 24, character: "歲", stroke_match: 75.9, context_match: 77.8, rank_vision: 4, rank_nlp: 2, model_type: "both" },
      { id: 25, character: "下", stroke_match: 70.5, context_match: 60.8, rank_vision: 5, rank_nlp: 5, model_type: "both" },
      { id: 26, character: "上", stroke_match: 65.3, context_match: 55.4, rank_vision: 6, rank_nlp: 6, model_type: "both" },
      { id: 27, character: "中", stroke_match: 60.1, context_match: 50.2, rank_vision: 7, rank_nlp: 7, model_type: "both" },
      { id: 28, character: "年", stroke_match: 55.8, context_match: 45.7, rank_vision: 8, rank_nlp: 8, model_type: "both" },
      { id: 29, character: "月", stroke_match: 50.4, context_match: 40.3, rank_vision: 9, rank_nlp: 9, model_type: "both" },
      { id: 30, character: "日", stroke_match: 45.2, context_match: 35.1, rank_vision: 10, rank_nlp: 10, model_type: "both" },
    ],
  ];

  return sampleCandidates;
};

// F1 Score 계산 함수 (획 일치도와 문맥 일치도의 조화평균)
const calculateF1Score = (strokeMatch, contextMatch) => {
  if (strokeMatch === null) return contextMatch; // 완전 훼손의 경우
  if (strokeMatch === 0 && contextMatch === 0) return 0;
  return (2 * strokeMatch * contextMatch) / (strokeMatch + contextMatch);
};

// 복원 대상별 후보 데이터 생성 (실제로는 백엔드에서 제공)
export const generateMockCandidates = (targetId) => {
  const sampleCandidates = generateSampleCandidates();
  const candidates = sampleCandidates[targetId % sampleCandidates.length];

  // F1 Score 계산 및 reliability 추가
  const candidatesWithReliability = candidates.map((c) => {
    const reliability = calculateF1Score(c.stroke_match, c.context_match);
    return {
      ...c,
      reliability: parseFloat(reliability.toFixed(1)),
    };
  });

  // 신뢰도 기준으로 정렬
  const sortedCandidates = [...candidatesWithReliability].sort((a, b) => b.reliability - a.reliability);

  return {
    // 상위 5개 (표에 표시용)
    top5: sortedCandidates.slice(0, 5),
    // 전체 10개 (cluster 시각화용)
    all: sortedCandidates,
  };
};

// 검수 기록 데이터 (GET /api/rubbings/:id/inspection-status 응답 형식)
export const mockInspectionStatus = {
  rubbing_id: 1,
  total_targets: 78,
  inspected_count: 14,
  inspected_targets: [
    { target_id: 1, selected_character: "麗", selected_candidate_id: 1, inspected_at: "2025-10-28T16:25:00Z" },
    { target_id: 2, selected_character: "郡", selected_candidate_id: 2, inspected_at: "2025-10-28T16:26:00Z" },
    // ... 나머지 검수 완료된 글자들
  ],
};

// 유추 근거 데이터 (GET /api/rubbings/:id/targets/:targetId/reasoning 응답 형식)
export const generateMockReasoningData = (targetId) => {
  const candidates = generateMockCandidates(targetId).all;

  // Vision 모델 후보 (획 일치도 기준)
  const visionCandidates = candidates
    .filter((c) => c.stroke_match !== null)
    .sort((a, b) => b.stroke_match - a.stroke_match)
    .map((c, index) => ({
      ...c,
      rank: index + 1,
    }));

  // NLP 모델 후보 (문맥 일치도 기준)
  const nlpCandidates = candidates
    .sort((a, b) => b.context_match - a.context_match)
    .map((c, index) => ({
      ...c,
      rank: index + 1,
    }));

  return {
    vision: visionCandidates,
    nlp: nlpCandidates,
  };
};

// 날짜 포맷팅 헬퍼 함수 (프론트엔드에서 사용)
export const formatDate = (dateString) => {
  const date = new Date(dateString);
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}.${month}.${day}`;
};

// 처리 시간 포맷팅 헬퍼 함수 (초 -> "X분 Y초")
export const formatProcessingTime = (seconds) => {
  if (!seconds) return "-";
  const minutes = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${minutes}분 ${secs}초`;
};

import React, { useState, useMemo, useCallback } from "react";
import ReasoningCluster from "../components/ReasoningCluster";

// 샘플 데이터 - 실제로는 props로 받아야 함
const sampleText = [
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
];

// 복원 대상 글자 위치 데이터 - 78개 생성
const generateRestorationTargets = () => {
  const targets = [];
  let id = 1;

  // sampleText에서 모든 □ 위치 찾기
  sampleText.forEach((text, rowIndex) => {
    text.split("").forEach((char, charIndex) => {
      if (char === "□") {
        targets.push({
          id: id++,
          position: `${rowIndex + 1}행 ${charIndex + 1}자`,
          row: rowIndex,
          char: charIndex,
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
      position: `${rowIndex + 1}행 ${charIndex + 1}자`,
      row: rowIndex,
      char: charIndex,
    });
  }

  return targets.slice(0, 78); // 정확히 78개만 반환
};

const restorationTargets = generateRestorationTargets();

// 선택된 글자에 대한 후보 한자 데이터 생성 함수
const generateCandidateData = () => {
  const data = {};

  // F1 score 계산 함수 (획 일치도와 문맥 일치도의 조화평균)
  // strokeMatch가 null이면 문맥 일치도가 바로 전체 신뢰도가 됨 (완전 훼손의 경우)
  const calculateF1Score = (strokeMatch, contextMatch) => {
    // strokeMatch가 null이면 문맥 일치도를 그대로 반환 (F1 score 계산 없음)
    if (strokeMatch === null) return contextMatch;
    if (strokeMatch === 0 && contextMatch === 0) return 0;
    return (2 * strokeMatch * contextMatch) / (strokeMatch + contextMatch);
  };

  const sampleCandidates = [
    [
      // 완전 훼손: 획 일치도가 없으므로 모든 후보의 획 일치도가 null
      { character: "麗", strokeMatch: null, contextMatch: 76.8, checked: false },
      { character: "郡", strokeMatch: null, contextMatch: 54.8, checked: false },
      { character: "鄕", strokeMatch: null, contextMatch: 25.3, checked: false },
      { character: "麓", strokeMatch: null, contextMatch: 30.4, checked: false },
      { character: "楚", strokeMatch: null, contextMatch: 14.6, checked: false },
      { character: "都", strokeMatch: null, contextMatch: 12.4, checked: false },
      { character: "散", strokeMatch: null, contextMatch: 10.2, checked: false },
      { character: "椰", strokeMatch: null, contextMatch: 8.9, checked: false },
      { character: "郁", strokeMatch: null, contextMatch: 7.5, checked: false },
      { character: "洛", strokeMatch: null, contextMatch: 6.1, checked: false },
    ],
    [
      // Vision 순위와 NLP 순위를 다르게 설정하여 다이나믹함 추가
      // Vision 순위: 麗(1), 郁(2), 都(3), 散(4), 椰(5), 洛(6), 郡(7), 鄕(8), 麓(9), 楚(10)
      // NLP 순위: 麗(1), 郡(2), 鄕(3), 麓(4), 楚(5), 都(6), 散(7), 椰(8), 郁(9), 洛(10)
      { character: "麗", strokeMatch: 85.4, contextMatch: 70.3, checked: false }, // Vision 1위, NLP 1위
      { character: "郡", strokeMatch: 55.8, contextMatch: 68.5, checked: false }, // Vision 7위, NLP 2위
      { character: "鄕", strokeMatch: 50.4, contextMatch: 65.2, checked: false }, // Vision 8위, NLP 3위
      { character: "麓", strokeMatch: 45.2, contextMatch: 62.1, checked: false }, // Vision 9위, NLP 4위
      { character: "楚", strokeMatch: 40.1, contextMatch: 58.9, checked: false }, // Vision 10위, NLP 5위
      { character: "郁", strokeMatch: 80.8, contextMatch: 45.2, checked: false }, // Vision 2위, NLP 9위
      { character: "都", strokeMatch: 75.5, contextMatch: 52.3, checked: false }, // Vision 3위, NLP 6위
      { character: "散", strokeMatch: 70.1, contextMatch: 48.7, checked: false }, // Vision 4위, NLP 7위
      { character: "椰", strokeMatch: 65.6, contextMatch: 46.5, checked: false }, // Vision 5위, NLP 8위
      { character: "洛", strokeMatch: 60.3, contextMatch: 42.1, checked: false }, // Vision 6위, NLP 10위
    ],
    [
      // Vision 순위와 NLP 순위를 다르게 설정
      { character: "寂", strokeMatch: 90.7, contextMatch: 75.3, checked: false }, // Vision 1위, NLP 3위
      { character: "宗", strokeMatch: 85.2, contextMatch: 80.3, checked: false }, // Vision 2위, NLP 1위
      { character: "肅", strokeMatch: 80.4, contextMatch: 70.6, checked: false }, // Vision 3위, NLP 4위
      { character: "歲", strokeMatch: 75.9, contextMatch: 77.8, checked: false }, // Vision 4위, NLP 2위
      { character: "下", strokeMatch: 70.5, contextMatch: 60.8, checked: false }, // Vision 5위, NLP 5위
      { character: "上", strokeMatch: 65.3, contextMatch: 55.4, checked: false }, // Vision 6위, NLP 6위
      { character: "中", strokeMatch: 60.1, contextMatch: 50.2, checked: false }, // Vision 7위, NLP 7위
      { character: "年", strokeMatch: 55.8, contextMatch: 45.7, checked: false }, // Vision 8위, NLP 8위
      { character: "月", strokeMatch: 50.4, contextMatch: 40.3, checked: false }, // Vision 9위, NLP 9위
      { character: "日", strokeMatch: 45.2, contextMatch: 35.1, checked: false }, // Vision 10위, NLP 10위
    ],
  ];

  // 모든 restorationTargets에 대해 후보 데이터 생성 및 F1 score 계산
  restorationTargets.forEach((target) => {
    const allCandidates = sampleCandidates[target.id % sampleCandidates.length].map((c) => {
      const f1Score = calculateF1Score(c.strokeMatch, c.contextMatch);
      return {
        ...c,
        reliability: `${f1Score.toFixed(1)}%`,
      };
    });

    // 최종 신뢰도 기준으로 정렬하여 상위 5개만 선택
    const sortedCandidates = [...allCandidates].sort((a, b) => {
      const scoreA = parseFloat(a.reliability);
      const scoreB = parseFloat(b.reliability);
      return scoreB - scoreA;
    });

    // 상위 5개만 저장 (표에 표시될 데이터)
    data[target.id] = sortedCandidates.slice(0, 5);

    // 전체 10개 후보도 저장 (팝업 cluster용)
    data[`${target.id}_all`] = allCandidates;
  });

  return data;
};

const candidateData = generateCandidateData();

// 상수 정의
const COLORS = {
  primary: "#ee7542", // 복원 대상 분포 그래프용
  secondary: "#344D64", // 검수 현황 및 AI 복원 대상 검수용
  lightSecondary: "#CCD2D8", // 검수 필요 영역용
  lightOrange: "#FCE3D9",
  lightGray: "#F8F8FA",
  darkGray: "#484a64",
  textDark: "#2a2a3a",
  border: "#EBEDF8",
  bgLight: "#F6F7FE",
};

const STYLES = {
  charBox: {
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    lineHeight: "1",
    textAlign: "center",
    verticalAlign: "middle",
    letterSpacing: "0",
    margin: "0",
    padding: "0",
    fontSize: "20px",
    fontFamily: "'Noto Serif KR', 'HanaMinB', 'Batang', serif",
  },
  charNormal: {
    display: "inline-block",
    verticalAlign: "middle",
    lineHeight: "1",
    fontSize: "20px",
    letterSpacing: "4px",
    fontFamily: "'Noto Serif KR', 'HanaMinB', 'Batang', serif",
  },
  textContainer: {
    fontFamily: "'Noto Serif KR', 'HanaMinB', 'Batang', serif",
    lineHeight: "1.5",
  },
  // 공통 카드 스타일
  card: {
    borderRadius: "16px",
    border: "1px solid #EBEDF8",
    background: "#FFF",
    boxShadow: "0 4px 12px 0 rgba(130, 130, 130, 0.10)",
    minWidth: "584px",
  },
  // 한자 문자 공통 스타일 (비타겟)
  charNormalBase: {
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    lineHeight: "1",
    textAlign: "center",
    verticalAlign: "middle",
    letterSpacing: "0",
    margin: "0",
    padding: "0",
    fontSize: "20px",
    width: "28px",
    height: "28px",
  },
};

const DetailPage = ({ item, onBack }) => {
  const [selectedCharId, setSelectedCharId] = useState(null);
  const [checkedChars, setCheckedChars] = useState(new Set()); // Set으로 변경하여 O(1) 조회
  const [candidates, setCandidates] = useState(candidateData);
  const [allCandidates, setAllCandidates] = useState(() => {
    // 전체 후보 데이터 (Vision 10개, NLP 10개)
    const all = {};
    restorationTargets.forEach((target) => {
      all[target.id] = candidateData[`${target.id}_all`] || candidateData[target.id];
    });
    return all;
  });
  const [selectedCharacters, setSelectedCharacters] = useState({}); // charId -> selected character
  const [showReasonPopup, setShowReasonPopup] = useState(false);
  const [selectedCharForCluster, setSelectedCharForCluster] = useState(null); // cluster에서 표시할 선택된 글자

  const handleCharClick = useCallback((charId) => {
    setSelectedCharId((prev) => (prev === charId ? null : charId));
  }, []);

  const handleCandidateCheck = useCallback((charId, candidateIndex) => {
    setCandidates((prev) => {
      const newCandidates = { ...prev };
      if (newCandidates[charId]) {
        const updated = newCandidates[charId].map((c, idx) =>
          idx === candidateIndex ? { ...c, checked: !c.checked } : { ...c, checked: false }
        );
        newCandidates[charId] = updated;

        // 체크된 후보의 한자를 selectedCharacters에 저장
        const checkedCandidate = updated.find((c) => c.checked);
        if (checkedCandidate) {
          setSelectedCharacters((prev) => ({
            ...prev,
            [charId]: checkedCandidate.character,
          }));
          setCheckedChars((prev) => new Set([...prev, charId]));
        } else {
          setSelectedCharacters((prev) => {
            const newSelected = { ...prev };
            delete newSelected[charId];
            return newSelected;
          });
          setCheckedChars((prev) => {
            const newSet = new Set(prev);
            newSet.delete(charId);
            return newSet;
          });
        }
      }
      return newCandidates;
    });
  }, []);

  const getCharStatus = useCallback(
    (charId) => {
      if (checkedChars.has(charId)) return "completed";
      if (selectedCharId === charId) return "selected";
      return "pending";
    },
    [checkedChars, selectedCharId]
  );

  const inspectionCount = checkedChars.size;
  const totalInspectionTargets = 78; // 검수 대상 글자 수는 78자

  // 신뢰도 통계 계산
  const reliabilityStats = useMemo(() => {
    const selectedReliabilities = Array.from(checkedChars)
      .map((charId) => {
        const checkedCandidate = candidates[charId]?.find((c) => c.checked);
        return checkedCandidate ? parseFloat(checkedCandidate.reliability) : null;
      })
      .filter(Boolean); // null 값 제거

    if (selectedReliabilities.length === 0) {
      return { average: "-", max: "-", min: "-" };
    }

    const sum = selectedReliabilities.reduce((acc, rel) => acc + rel, 0);
    const average = (sum / selectedReliabilities.length).toFixed(1) + "%";
    const max = Math.max(...selectedReliabilities).toFixed(1) + "%";
    const min = Math.min(...selectedReliabilities).toFixed(1) + "%";

    return { average, max, min };
  }, [checkedChars, candidates]);

  // 행별 타겟 그룹화 (메모이제이션)
  const targetsByRow = useMemo(() => {
    const grouped = {};
    restorationTargets.forEach((target) => {
      if (!grouped[target.row]) {
        grouped[target.row] = [];
      }
      grouped[target.row].push(target);
    });
    return grouped;
  }, []);

  return (
    <div className="flex-1 overflow-auto" style={{ backgroundColor: COLORS.lightGray }}>
      <div className="p-12" style={{ backgroundColor: COLORS.lightGray }}>
        {/* Back Button */}
        <button onClick={onBack} className="flex items-center gap-2 mb-[28px] text-gray-700 hover:text-gray-900">
          <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
            <path
              fillRule="evenodd"
              d="M9.707 16.707a1 1 0 01-1.414 0l-6-6a1 1 0 010-1.414l6-6a1 1 0 011.414 1.414L5.414 9H17a1 1 0 110 2H5.414l4.293 4.293a1 1 0 010 1.414z"
              clipRule="evenodd"
            />
          </svg>
          <span className="text-lg font-medium">목록으로 돌아가기</span>
        </button>

        <div
          className="grid items-stretch"
          style={{
            gridTemplateColumns: "minmax(584px, 1fr) minmax(584px, 1fr)",
            gap: "20px",
            minWidth: "1188px", // 584px * 2 + 20px gap
            height: "945px",
          }}
        >
          {/* 왼쪽 열: 탁본 정보, 복원 대상 분포, 검수 현황 */}
          <div className="flex flex-col gap-6 h-full">
            {/* 탁본 정보 */}
            <div className="bg-white p-6" style={STYLES.card}>
              <h2 className="text-lg font-semibold text-gray-800 mb-4">탁본 정보</h2>
              <div className="flex gap-6">
                <div className="w-[238px] h-[187px] bg-gray-100 rounded-lg flex items-center justify-center overflow-hidden">
                  <img 
                    src="/귀법사적소수좌현응묘지명.png" 
                    alt="탁본 이미지" 
                    className="w-full h-full object-contain"
                    onError={(e) => {
                      // 이미지 로드 실패 시 대체 텍스트 표시
                      e.target.style.display = 'none';
                      e.target.parentElement.innerHTML = '<span class="text-gray-400">이미지</span>';
                    }}
                  />
                </div>
                <div className="flex-1">
                  <div className="mb-4">
                    <p
                      style={{
                        color: "#484A64",
                        fontFamily: "Pretendard",
                        fontSize: "16px",
                        fontWeight: 600,
                        lineHeight: "18px",
                        marginBottom: "8px",
                      }}
                    >
                      파일명: 귀법사적소수좌현응묘지명.jpg
                    </p>
                    <div
                      style={{
                        color: "#7F85A3",
                        fontFamily: "Pretendard",
                        fontSize: "12px",
                        fontWeight: 400,
                        lineHeight: "16px",
                        letterSpacing: "-0.2px",
                      }}
                    >
                      <p style={{ margin: 0 }}>처리 일시: 2025.10.28 16:23</p>
                      <p style={{ margin: 0 }}>총 처리 시간: 3분 42초</p>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <div className="px-4 py-2 bg-gray-100 rounded text-sm whitespace-nowrap">행서체</div>
                    <div className="px-4 py-2 bg-gray-100 rounded text-sm whitespace-nowrap">전서체</div>
                    <div className="px-4 py-2 bg-gray-100 rounded text-sm whitespace-nowrap">탁본 손상 정도 31.6%</div>
                  </div>
                </div>
              </div>
            </div>

            {/* 복원 대상 분포 */}
            <div className="bg-white p-6" style={STYLES.card}>
              <h2 className="text-lg font-semibold text-gray-800 mb-4">복원 대상 분포</h2>
              <div className="flex gap-6">
                <div className="flex flex-col items-center">
                  <div className="w-[150px] h-[150px] relative flex items-center justify-center">
                    {/* 원 그래프 - 12시 방향에서 시작 */}
                    <svg className="w-[150px] h-[150px] transform -rotate-90" viewBox="0 0 150 150" style={{ overflow: "visible" }}>
                      <circle cx="75" cy="75" r="65" fill="none" stroke="#FCE3D9" strokeWidth="16" />
                      <circle
                        cx="75"
                        cy="75"
                        r="65"
                        fill="none"
                        stroke="#EE7542"
                        strokeWidth="16"
                        strokeDasharray={`${2 * Math.PI * 65 * 0.316} ${2 * Math.PI * 65}`}
                        strokeDashoffset="0"
                        strokeLinecap="round"
                      />
                    </svg>
                    <div className="absolute inset-0 flex items-center justify-center">
                      <div className="text-center">
                        <p className="text-sm text-gray-600">복원 대상</p>
                        <p className="text-lg font-semibold text-[#ee7542]">31.6%</p>
                      </div>
                    </div>
                  </div>
                  <div className="flex gap-4 mt-4">
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full bg-[#FCE3D9]"></div>
                      <span className="text-xs text-gray-600">탁본 전체</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full bg-[#EE7542]"></div>
                      <span className="text-xs text-gray-600">복원 대상</span>
                    </div>
                  </div>
                </div>
                <div className="flex-1 grid grid-cols-2 gap-4">
                  <div className="p-3 bg-gray-50 rounded">
                    <p className="text-xs text-gray-600 mb-1">전체 글자 수</p>
                    <p className="text-base font-semibold">247자</p>
                  </div>
                  <div className="p-3 bg-gray-50 rounded">
                    <p className="text-xs text-gray-600 mb-1">복원 대상 글자 수</p>
                    <p className="text-base font-semibold">78자</p>
                  </div>
                  <div className="p-3 bg-gray-50 rounded">
                    <p className="text-xs text-gray-600 mb-1">탁본 글자 부분 훼손</p>
                    <p className="text-base font-semibold">49자</p>
                  </div>
                  <div className="p-3 bg-gray-50 rounded">
                    <p className="text-xs text-gray-600 mb-1">탁본 글자 완전 훼손</p>
                    <p className="text-base font-semibold">29자</p>
                  </div>
                </div>
              </div>
              <p className="text-xs text-gray-500 mt-4">※ 부분 훼손은 잔존 획+전후 문맥, 완전 훼손은 전후 문맥으로 복원합니다.</p>
            </div>

            {/* 검수 현황 */}
            <div className="bg-white p-6" style={STYLES.card}>
              <h2 className="text-lg font-semibold text-gray-800 mb-4">검수 현황</h2>
              <div className="flex gap-6">
                <div className="flex flex-col items-center">
                  <div className="w-[150px] h-[150px] relative flex items-center justify-center">
                    {/* 원 그래프 - 12시 방향에서 시작 */}
                    <svg className="w-[150px] h-[150px] transform -rotate-90" viewBox="0 0 150 150" style={{ overflow: "visible" }}>
                      <circle cx="75" cy="75" r="65" fill="none" stroke={COLORS.lightSecondary} strokeWidth="16" />
                      <circle
                        cx="75"
                        cy="75"
                        r="65"
                        fill="none"
                        stroke={COLORS.secondary}
                        strokeWidth="16"
                        strokeDasharray={`${2 * Math.PI * 65 * (inspectionCount / totalInspectionTargets)} ${2 * Math.PI * 65}`}
                        strokeDashoffset="0"
                        strokeLinecap="round"
                      />
                    </svg>
                    <div className="absolute inset-0 flex items-center justify-center">
                      <div className="text-center">
                        <p className="text-sm text-gray-600">검수 완료</p>
                        <p className="text-base font-semibold" style={{ color: COLORS.secondary }}>
                          {inspectionCount}자 / {totalInspectionTargets}자
                        </p>
                      </div>
                    </div>
                  </div>
                  <div className="flex gap-4 mt-4">
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full" style={{ backgroundColor: COLORS.lightSecondary }}></div>
                      <span className="text-xs text-gray-600">검수 필요</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full" style={{ backgroundColor: COLORS.secondary }}></div>
                      <span className="text-xs text-gray-600">검수 완료</span>
                    </div>
                  </div>
                </div>
                <div className="flex-1 grid grid-cols-2 gap-4">
                  <div className="p-3 bg-gray-50 rounded">
                    <p className="text-xs text-gray-600 mb-1">검수 대상 글자 수</p>
                    <p className="text-base font-semibold">78자</p>
                  </div>
                  <div className="p-3 bg-gray-50 rounded">
                    <p className="text-xs text-gray-600 mb-1">평균 신뢰도</p>
                    <p className="text-base font-semibold">{reliabilityStats.average}</p>
                  </div>
                  <div className="p-3 bg-gray-50 rounded">
                    <p className="text-xs text-gray-600 mb-1">최고 신뢰도</p>
                    <p className="text-base font-semibold">{reliabilityStats.max}</p>
                  </div>
                  <div className="p-3 bg-gray-50 rounded">
                    <p className="text-xs text-gray-600 mb-1">최저 신뢰도</p>
                    <p className="text-base font-semibold">{reliabilityStats.min}</p>
                  </div>
                </div>
              </div>
              <p className="text-xs text-gray-500 mt-4">※ 신뢰도는 참고용으로, 모든 복원 글자는 검수가 필요합니다.</p>
            </div>
          </div>

          {/* 오른쪽 열: AI 복원 대상 검수 */}
          <div className="bg-white p-6 flex flex-col overflow-hidden h-full" style={STYLES.card}>
            <h2 className="text-lg font-semibold text-gray-800 mb-4 flex-shrink-0">AI 복원 대상 검수</h2>
            <p className="text-xs text-gray-500 mb-4 flex-shrink-0">
              ※ EPITEXT는 실수를 할 수 있습니다. 중요한 정보에 대해서는 재차 확인하세요.
            </p>

            {/* Legend */}
            <div className="flex gap-4 mb-4 flex-shrink-0">
              <div className="flex items-center gap-2">
                <div className="w-2.5 h-2.5 rounded bg-[#F8F8FA]"></div>
                <span className="text-xs text-[#2a2a3a]">검수 미완료</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-2.5 h-2.5 rounded bg-[#F8F8FA]" style={{ border: `1px solid ${COLORS.secondary}` }}></div>
                <span className="text-xs text-[#2a2a3a]">선택 글자</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-2.5 h-2.5 rounded" style={{ backgroundColor: COLORS.secondary }}></div>
                <span className="text-xs text-[#2a2a3a]">검수 완료</span>
              </div>
            </div>

            <div className="flex gap-4" style={{ flex: "1", minHeight: 0, overflow: "hidden", overflowX: "hidden" }}>
              {/* 글자 위치 목록 - 스크롤 가능 */}
              <div
                className="flex-shrink-0 flex flex-col gap-2"
                style={{ width: "auto", minWidth: "88px", maxHeight: "100%", overflowY: "auto", overflowX: "hidden", paddingRight: "8px" }}
              >
                {restorationTargets.map((target) => {
                  const status = getCharStatus(target.id);
                  const roundedClass = status === "completed" || status === "selected" ? "rounded-lg" : "rounded-[4px]";

                  let buttonStyle = {
                    fontSize: "14px",
                    fontWeight: status === "completed" || status === "selected" ? 700 : 600,
                    paddingTop: "4px",
                    paddingBottom: "4px",
                  };
                  let buttonClass = `h-8 px-2 ${roundedClass} text-center transition-colors hover:opacity-80 flex-shrink-0 whitespace-nowrap`;

                  if (status === "completed") {
                    buttonStyle = { ...buttonStyle, backgroundColor: COLORS.secondary, color: "white" };
                  } else if (status === "selected") {
                    buttonStyle = {
                      ...buttonStyle,
                      backgroundColor: COLORS.lightGray,
                      border: `1px solid ${COLORS.secondary}`,
                      color: COLORS.secondary,
                    };
                  } else {
                    buttonStyle = { ...buttonStyle, backgroundColor: COLORS.lightGray, color: COLORS.darkGray };
                  }

                  return (
                    <button
                      key={target.id}
                      onClick={() => handleCharClick(target.id)}
                      className={buttonClass}
                      style={{ width: "fit-content", minWidth: "88px", ...buttonStyle }}
                    >
                      {target.position}
                    </button>
                  );
                })}
              </div>

              {/* 복원된 텍스트 - 스크롤 가능 */}
              <div
                className="flex-1"
                style={{ minHeight: 0, maxHeight: "100%", overflowY: "auto", overflowX: "hidden", paddingRight: "8px" }}
              >
                <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                  {sampleText.map((text, rowIndex) => {
                    const targetsInRow = targetsByRow[rowIndex] || [];
                    const selectedTargetInRow = targetsInRow.find((t) => t.id === selectedCharId);
                    const showTable = selectedTargetInRow && candidates[selectedCharId];

                    return (
                      <div key={rowIndex}>
                        <div className="text-base mb-0 font-medium" style={STYLES.textContainer}>
                          {text.split("").map((char, charIndex) => {
                            const target = targetsInRow.find((t) => t.char === charIndex);
                            const charId = target ? target.id : null;
                            const isSelected = selectedCharId === charId;
                            const isCompleted = charId && checkedChars.has(charId);
                            const isTarget = !!target;
                            const selectedChar = isCompleted && selectedCharacters[charId] ? selectedCharacters[charId] : char;

                            // 복원 대상이 아닌 일반 한자는 그냥 검정색으로 표시
                            if (!isTarget) {
                              return (
                                <span
                                  key={charIndex}
                                  className="inline-flex items-center justify-center"
                                  style={{
                                    ...STYLES.charNormalBase,
                                    color: COLORS.textDark,
                                  }}
                                >
                                  {char}
                                </span>
                              );
                            }

                            // 복원 대상인 경우
                            let charClass = "cursor-pointer inline-flex items-center justify-center";
                            let charStyle = { ...STYLES.charBox, width: "28px", height: "28px", borderRadius: "4px" };

                            if (isSelected) {
                              charStyle = {
                                ...charStyle,
                                backgroundColor: COLORS.lightGray,
                                border: `1px solid ${COLORS.secondary}`,
                                color: COLORS.secondary,
                              };
                            } else if (isCompleted) {
                              charStyle = {
                                ...charStyle,
                                backgroundColor: COLORS.secondary,
                                color: "white",
                              };
                            } else if (char === "□") {
                              charStyle = {
                                ...charStyle,
                                border: `1px solid ${COLORS.lightGray}`,
                              };
                            } else {
                              // hover는 CSS로 처리
                            }

                            return (
                              <span key={charIndex} className={charClass} onClick={() => handleCharClick(charId)} style={charStyle}>
                                {selectedChar}
                              </span>
                            );
                          })}
                        </div>
                        {/* 선택된 글자의 후보 목록 - 각 행 아래에 표시 */}
                        {showTable && (
                          <div className="mt-2 mb-3 flex flex-col gap-[8px]">
                            {/* 테이블 제목 및 유추 근거 및 번역 버튼 */}
                            <div className="flex items-center justify-between px-1">
                              <div
                                className="flex flex-col justify-center leading-[0] not-italic relative shrink-0 text-[#2a2a3a] text-[16px] text-nowrap tracking-[-0.32px] px-1"
                                style={{ fontWeight: 600 }}
                              >
                                <p className="leading-[normal] whitespace-pre">검수 대상 추천 한자</p>
                              </div>
                              <button
                                className="bg-white border border-solid box-border content-stretch flex gap-[4px] items-center justify-center px-[14px] py-2 relative rounded-[4px] shrink-0"
                                style={{ border: "1px solid #EBEDF8" }}
                                onClick={() => {
                                  setShowReasonPopup(true);
                                  setSelectedCharForCluster(null); // 팝업 열 때 초기화
                                }}
                              >
                                <svg className="w-[14px] h-[14px] flex-shrink-0" fill={COLORS.secondary} viewBox="0 0 20 20">
                                  <path d="M3 4a1 1 0 011-1h12a1 1 0 011 1v2a1 1 0 01-1 1H4a1 1 0 01-1-1V4zM3 10a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H4a1 1 0 01-1-1v-6zM14 9a1 1 0 00-1 1v6a1 1 0 001 1h2a1 1 0 001-1v-6a1 1 0 00-1-1h-2z" />
                                </svg>
                                <span className="text-[12px] font-medium text-center whitespace-nowrap" style={{ color: COLORS.secondary }}>
                                  유추 근거 및 번역
                                </span>
                              </button>
                            </div>
                            {/* 테이블 */}
                            <div className="border border-[#EBEDF8] rounded-[8px] overflow-hidden">
                              {/* 테이블 헤더 */}
                              <div className="bg-[#F6F7FE] border-b border-[#EBEDF8] px-4 py-3">
                                <div className="flex items-center gap-4 text-xs font-medium text-[#484a64]">
                                  <span className="w-[64px]">글자 선택</span>
                                  <span className="w-[64px]">한자</span>
                                  <span className="w-[64px] whitespace-nowrap">전체 신뢰도</span>
                                  <span className="w-[56px] text-xs">획 일치도</span>
                                  <span className="w-[56px] text-xs whitespace-nowrap">문맥 일치도</span>
                                </div>
                              </div>
                              {/* 테이블 바디 */}
                              <div>
                                {candidates[selectedCharId].map((candidate, idx) => (
                                  <div
                                    key={idx}
                                    className="flex items-center gap-4 px-4 py-4 border-b border-[#F6F7FE] last:border-b-0 bg-white"
                                  >
                                    <div className="w-[64px] flex items-center">
                                      <input
                                        type="checkbox"
                                        checked={candidate.checked}
                                        onChange={() => handleCandidateCheck(selectedCharId, idx)}
                                        className="w-4 h-4 rounded border-[#c0c5dc] border-2 cursor-pointer"
                                        style={{ accentColor: COLORS.secondary }}
                                      />
                                    </div>
                                    <span
                                      className="w-[64px] cursor-pointer hover:opacity-70 transition-opacity"
                                      style={{
                                        fontSize: "20px",
                                        lineHeight: "1",
                                        fontWeight: 500,
                                        color: candidate.checked ? COLORS.secondary : COLORS.darkGray,
                                        fontFamily: "'Noto Serif KR', 'HanaMinB', 'Batang', serif",
                                      }}
                                      onClick={() => {
                                        // 같은 글자를 다시 클릭하면 선택 해제
                                        if (selectedCharForCluster === candidate.character) {
                                          setSelectedCharForCluster(null);
                                        } else {
                                          setSelectedCharForCluster(candidate.character);
                                        }
                                      }}
                                    >
                                      {candidate.character}
                                    </span>
                                    <span
                                      className="w-[64px] text-xs whitespace-nowrap"
                                      style={{ color: candidate.checked ? COLORS.secondary : COLORS.darkGray }}
                                    >
                                      {candidate.reliability}
                                    </span>
                                    <span
                                      className="w-[56px] text-xs"
                                      style={{ color: candidate.checked ? COLORS.secondary : COLORS.darkGray }}
                                    >
                                      {candidate.strokeMatch === null ? "-" : `${candidate.strokeMatch.toFixed(1)}%`}
                                    </span>
                                    <span
                                      className="w-[56px] text-xs"
                                      style={{ color: candidate.checked ? COLORS.secondary : COLORS.darkGray }}
                                    >
                                      {candidate.contextMatch.toFixed(1)}%
                                    </span>
                                  </div>
                                ))}
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 유추 근거 및 번역 팝업 */}
      {showReasonPopup && (
        <>
          {/* 오버레이 배경 */}
          <div
            className="fixed inset-0 z-40"
            style={{
              backgroundColor: "rgba(0, 0, 0, 0.3)",
            }}
            onClick={() => setShowReasonPopup(false)}
          />
          {/* 팝업 */}
          <div
            className="fixed z-50 bg-white rounded-[16px] overflow-hidden"
            style={{
              top: "48px",
              bottom: "48px",
              left: "48px",
              right: "48px",
            }}
          >
            {/* 팝업 헤더 */}
            <div className="relative flex items-center justify-between px-10 py-8 border-b border-[#EBEDF8]">
              {/* 뒤로가기 버튼 */}
              <button
                onClick={() => setShowReasonPopup(false)}
                className="w-6 h-6 flex items-center justify-center hover:opacity-70 transition-opacity"
              >
                <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
                  <path
                    fillRule="evenodd"
                    d="M9.707 16.707a1 1 0 01-1.414 0l-6-6a1 1 0 010-1.414l6-6a1 1 0 011.414 1.414L5.414 9H17a1 1 0 110 2H5.414l4.293 4.293a1 1 0 010 1.414z"
                    clipRule="evenodd"
                  />
                </svg>
              </button>
              {/* 제목 */}
              <div className="absolute left-1/2 top-1/2 transform -translate-x-1/2 -translate-y-1/2" style={{ fontWeight: 600 }}>
                <span className="text-[20px] text-[#2a2a3a] tracking-[-0.4px]">유추 근거 및 번역</span>
              </div>
              {/* 닫기 버튼 */}
              <button
                onClick={() => setShowReasonPopup(false)}
                className="w-6 h-6 flex items-center justify-center hover:opacity-70 transition-opacity"
              >
                <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
                  <path
                    fillRule="evenodd"
                    d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
                    clipRule="evenodd"
                  />
                </svg>
              </button>
            </div>
            {/* 팝업 내용 영역 */}
            <div className="h-[calc(100%-80px)] overflow-y-auto p-6">
              {selectedCharId && candidates[selectedCharId] && allCandidates[selectedCharId] ? (
                <div className="flex flex-col gap-6">
                  {/* 위: ReasoningCluster */}
                  <div className="flex items-center justify-center bg-gray-50 rounded-lg p-4 min-h-[500px]">
                    <ReasoningCluster
                      data={{
                        name: "Source Image",
                        type: "root",
                        imgUrl: null, // 실제 이미지 URL이 있으면 여기에 추가
                        children: [
                          {
                            name: "Vision Model (Swin)",
                            type: "model",
                            children: allCandidates[selectedCharId]
                              .filter((c) => c.strokeMatch !== null) // Vision은 strokeMatch가 있는 것만
                              .sort((a, b) => (b.strokeMatch || 0) - (a.strokeMatch || 0)) // strokeMatch 기준 내림차순 정렬
                              .map((c, idx) => ({
                                name: c.character,
                                score: c.strokeMatch / 100,
                                id: `v${idx}`,
                                type: "leaf",
                              })),
                          },
                          {
                            name: "NLP Model (RoBERTa)",
                            type: "model",
                            children: [...allCandidates[selectedCharId]]
                              .sort((a, b) => b.contextMatch - a.contextMatch) // contextMatch 기준 내림차순 정렬
                              .map((c, idx) => ({
                                name: c.character,
                                score: c.contextMatch / 100,
                                id: `n${idx}`,
                                type: "leaf",
                              })),
                          },
                        ],
                      }}
                      selectedChar={selectedCharForCluster}
                      selectedReliability={
                        selectedCharForCluster
                          ? candidates[selectedCharId].find((c) => c.character === selectedCharForCluster)?.reliability
                          : null
                      }
                      height={500}
                    />
                  </div>
                  {/* 아래: 표 */}
                  <div className="flex-shrink-0 flex flex-col">
                    <div className="mb-3">
                      <div
                        className="flex flex-col justify-center leading-[0] not-italic relative shrink-0 text-[#2a2a3a] text-[16px] text-nowrap tracking-[-0.32px]"
                        style={{ fontWeight: 600 }}
                      >
                        <p className="leading-[normal] whitespace-pre">검수 대상 추천 한자</p>
                      </div>
                    </div>
                    {/* 테이블 */}
                    <div className="border border-[#EBEDF8] rounded-[8px] overflow-hidden">
                      {/* 테이블 헤더 */}
                      <div className="bg-[#F6F7FE] border-b border-[#EBEDF8] px-4 py-3">
                        <div className="flex items-center gap-4 text-xs font-medium text-[#484a64]">
                          <span className="w-[64px]">글자 선택</span>
                          <span className="w-[64px]">한자</span>
                          <span className="w-[64px] whitespace-nowrap">전체 신뢰도</span>
                          <span className="w-[56px] text-xs">획 일치도</span>
                          <span className="w-[56px] text-xs whitespace-nowrap">문맥 일치도</span>
                        </div>
                      </div>
                      {/* 테이블 바디 */}
                      <div>
                        {candidates[selectedCharId].map((candidate, idx) => (
                          <div
                            key={idx}
                            className={`flex items-center gap-4 px-4 py-4 border-b border-[#F6F7FE] last:border-b-0 bg-white cursor-pointer hover:bg-gray-50 transition-colors ${
                              selectedCharForCluster === candidate.character ? "bg-blue-50" : ""
                            }`}
                            onClick={() => {
                              // 같은 글자를 다시 클릭하면 선택 해제
                              if (selectedCharForCluster === candidate.character) {
                                setSelectedCharForCluster(null);
                              } else {
                                setSelectedCharForCluster(candidate.character);
                              }
                            }}
                          >
                            <div className="w-[64px] flex items-center">
                              <input
                                type="checkbox"
                                checked={candidate.checked}
                                onChange={(e) => {
                                  e.stopPropagation();
                                  handleCandidateCheck(selectedCharId, idx);
                                }}
                                className="w-4 h-4 rounded border-[#c0c5dc] border-2 cursor-pointer"
                                style={{ accentColor: COLORS.secondary }}
                              />
                            </div>
                            <span
                              className="w-[64px]"
                              style={{
                                fontSize: "20px",
                                lineHeight: "1",
                                fontWeight: 500,
                                color: candidate.checked ? COLORS.secondary : COLORS.darkGray,
                                fontFamily: "'Noto Serif KR', 'HanaMinB', 'Batang', serif",
                              }}
                            >
                              {candidate.character}
                            </span>
                            <span
                              className="w-[64px] text-xs whitespace-nowrap"
                              style={{ color: candidate.checked ? COLORS.secondary : COLORS.darkGray }}
                            >
                              {candidate.reliability}
                            </span>
                            <span className="w-[56px] text-xs" style={{ color: candidate.checked ? COLORS.secondary : COLORS.darkGray }}>
                              {candidate.strokeMatch === null ? "-" : `${candidate.strokeMatch.toFixed(1)}%`}
                            </span>
                            <span className="w-[56px] text-xs" style={{ color: candidate.checked ? COLORS.secondary : COLORS.darkGray }}>
                              {candidate.contextMatch.toFixed(1)}%
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="flex items-center justify-center h-full min-h-[400px]">
                  <div className="text-center">
                    <p className="text-gray-500 text-base mb-2">표에서 글자를 선택해주세요</p>
                    <p className="text-gray-400 text-sm">글자를 선택하면 유추 근거를 확인할 수 있습니다.</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default DetailPage;

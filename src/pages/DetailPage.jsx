import React, { useState, useMemo, useCallback } from "react";
import ReasoningCluster from "../components/ReasoningCluster";
import {
  mockRubbingDetail,
  mockRubbingStatistics,
  mockRestorationTargets,
  generateMockCandidates,
  formatDate,
  formatProcessingTime,
} from "../mocks/mockData";

// 복원 대상 글자 위치 데이터 생성 (mockRestorationTargets를 사용하되, 기존 형식과 호환되도록 변환)
const generateRestorationTargets = () => {
  // mockRestorationTargets를 기존 형식으로 변환
  return mockRestorationTargets.map((target) => ({
    id: target.id,
    position: target.position,
    row: target.row_index,
    char: target.char_index,
  }));
};

const restorationTargets = generateRestorationTargets();

// 후보 데이터 생성 (mockData의 generateMockCandidates 사용)
// 교집합 처리: 획 일치도와 문맥 일치도 둘 다 존재하는 후보만 표시
// 교집합이 5개 미만일 경우 null로 채워서 항상 5개 유지
const generateCandidateData = () => {
  const data = {};
  restorationTargets.forEach((target) => {
    const candidates = generateMockCandidates(target.id);
    
    // 전체 후보 데이터 (시각화용)
    data[`${target.id}_all`] = candidates.all.map((c) => ({
      character: c.character,
      strokeMatch: c.stroke_match,
      contextMatch: c.context_match,
      reliability: `${c.reliability}%`,
      checked: false,
    }));
    
    // 교집합 계산: 획 일치도와 문맥 일치도 둘 다 존재하는 후보
    const intersection = candidates.all.filter(
      (c) => c.stroke_match !== null && c.context_match !== null
    );
    
    // 교집합을 신뢰도 기준으로 정렬
    const sortedIntersection = [...intersection].sort((a, b) => b.reliability - a.reliability);
    
    // 상위 5개 선택 (5개 미만이면 null로 채움)
    const top5Intersection = [];
    for (let i = 0; i < 5; i++) {
      if (i < sortedIntersection.length) {
        top5Intersection.push({
          character: sortedIntersection[i].character,
          strokeMatch: sortedIntersection[i].stroke_match,
          contextMatch: sortedIntersection[i].context_match,
          reliability: `${sortedIntersection[i].reliability}%`,
          checked: false,
        });
      } else {
        // null로 채움
        top5Intersection.push({
          character: null,
          strokeMatch: null,
          contextMatch: null,
          reliability: null,
          checked: false,
        });
      }
    }
    
    data[target.id] = top5Intersection;
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
  // Mock 데이터 사용 (실제로는 props나 API에서 받아옴)
  // 구두점 복원 모델 적용된 텍스트 사용 (쉼표, 마침표 등 포함)
  const sampleText = mockRubbingDetail.text_content_with_punctuation || mockRubbingDetail.text_content;
  const rubbingDetail = mockRubbingDetail;
  const statistics = mockRubbingStatistics;

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
  const totalInspectionTargets = statistics.restoration_targets; // 검수 대상 글자 수

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
                  {rubbingDetail.image_url ? (
                    <img src={rubbingDetail.image_url} alt={rubbingDetail.filename} className="w-full h-full object-cover" />
                  ) : (
                    <span className="text-gray-400">이미지</span>
                  )}
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
                      파일명: {rubbingDetail.filename}
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
                      <p style={{ margin: 0 }}>
                        처리 일시:{" "}
                        {rubbingDetail.processed_at
                          ? `${formatDate(rubbingDetail.processed_at)} ${new Date(rubbingDetail.processed_at).toLocaleTimeString("ko-KR", {
                              hour: "2-digit",
                              minute: "2-digit",
                            })}`
                          : "-"}
                      </p>
                      <p style={{ margin: 0 }}>총 처리 시간: {formatProcessingTime(rubbingDetail.total_processing_time)}</p>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    {rubbingDetail.font_types.map((font, index) => (
                      <div key={index} className="px-4 py-2 bg-gray-100 rounded text-sm whitespace-nowrap">
                        {font}
                      </div>
                    ))}
                    <div className="px-4 py-2 bg-gray-100 rounded text-sm whitespace-nowrap">
                      탁본 손상 정도 {rubbingDetail.damage_percentage}%
                    </div>
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
                        strokeDasharray={`${2 * Math.PI * 65 * (statistics.restoration_percentage / 100)} ${2 * Math.PI * 65}`}
                        strokeDashoffset="0"
                        strokeLinecap="round"
                      />
                    </svg>
                    <div className="absolute inset-0 flex items-center justify-center">
                      <div className="text-center">
                        <p className="text-sm text-gray-600">복원 대상</p>
                        <p className="text-lg font-semibold text-[#ee7542]">{statistics.restoration_percentage}%</p>
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
                    <p className="text-base font-semibold">{statistics.total_characters}자</p>
                  </div>
                  <div className="p-3 bg-gray-50 rounded">
                    <p className="text-xs text-gray-600 mb-1">복원 대상 글자 수</p>
                    <p className="text-base font-semibold">{statistics.restoration_targets}자</p>
                  </div>
                  <div className="p-3 bg-gray-50 rounded">
                    <p className="text-xs text-gray-600 mb-1">탁본 글자 부분 훼손</p>
                    <p className="text-base font-semibold">{statistics.partial_damage}자</p>
                  </div>
                  <div className="p-3 bg-gray-50 rounded">
                    <p className="text-xs text-gray-600 mb-1">탁본 글자 완전 훼손</p>
                    <p className="text-base font-semibold">{statistics.complete_damage}자</p>
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
                                {candidates[selectedCharId].map((candidate, idx) => {
                                  // null 값 처리 (교집합이 5개 미만일 때)
                                  if (candidate.character === null) {
                                    return (
                                      <div
                                        key={idx}
                                        className="flex items-center gap-4 px-4 py-4 border-b border-[#F6F7FE] last:border-b-0 bg-gray-50"
                                      >
                                        <div className="w-[64px] flex items-center">
                                          <div className="w-4 h-4"></div>
                                        </div>
                                        <span className="w-[64px] text-gray-400" style={{ fontSize: "20px", lineHeight: "1" }}>
                                          -
                                        </span>
                                        <span className="w-[64px] text-xs text-gray-400">-</span>
                                        <span className="w-[56px] text-xs text-gray-400">-</span>
                                        <span className="w-[56px] text-xs text-gray-400">-</span>
                                      </div>
                                    );
                                  }
                                  
                                  return (
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
                                        {candidate.contextMatch === null ? "-" : `${candidate.contextMatch.toFixed(1)}%`}
                                      </span>
                                    </div>
                                  );
                                })}
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
              height: "968px",
              left: "500px", // 왼쪽 카드 중앙: 160px (사이드바) + 48px (padding) + 292px (카드 너비 584px의 절반)
              right: "48px", // AI 복원 대상 검수 카드 오른쪽 끝과 정렬 (padding과 동일)
              top: "50%",
              transform: "translateY(-50%)",
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
                        imgUrl: `/images/rubbings/cropped/rubbing_${rubbingDetail.id}_target_${selectedCharId}.jpg`, // 탁본 이미지에서 해당 글자 부분 크롭한 이미지 URL (백엔드에서 제공)
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
                              {candidate.contextMatch === null ? "-" : `${candidate.contextMatch.toFixed(1)}%`}
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

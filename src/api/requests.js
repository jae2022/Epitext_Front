import apiClient from "./client";
import { mockRubbingList, formatDate, formatProcessingTime } from "../mocks/mockData";

/**
 * 탁본 목록 조회
 * @param {string|null} status - 필터링할 상태 ("복원 완료", "복원 진행중" 등)
 * @returns {Promise} 탁본 목록 데이터
 */
export const getRubbingList = async (status = null) => {
  // TODO: 백엔드 API 연결 시 주석 해제
  // try {
  //   const params = status ? { status } : {};
  //   const response = await apiClient.get("/api/rubbings", { params });
  //   return response.data;
  // } catch (error) {
  //   console.error("Failed to fetch rubbings:", error);
  //   throw error;
  // }

  // 더미 데이터로 테스트 (1초 딜레이 시뮬레이션)
  return new Promise((resolve) => {
    setTimeout(() => {
      // Mock 데이터를 프론트엔드에서 사용하는 형식으로 변환
      // 최신순으로 정렬 (가장 최근에 올린 탁본이 1번이 되도록)
      const sortedList = [...mockRubbingList].sort((a, b) => 
        new Date(b.created_at) - new Date(a.created_at)
      );
      
      const formattedData = sortedList.map((item) => ({
        id: item.id,
        status: item.status,
        date: formatDate(item.created_at),
        restorationStatus: item.restoration_status || "-",
        processingTime: formatProcessingTime(item.processing_time),
        damageLevel: item.damage_level ? `${item.damage_level}%` : "-",
        inspectionStatus: item.inspection_status || "-",
        reliability: item.average_reliability ? `${item.average_reliability}%` : "-",
        is_completed: item.is_completed, // 원본 데이터의 is_completed 필드 유지
        image_url: item.image_url, // 다운로드용
        filename: item.filename, // 다운로드용
      }));

      // status 필터링 (필요한 경우)
      const filteredData = status
        ? formattedData.filter((item) => {
            if (status === "복원 완료") {
              // is_completed가 true인 항목만
              return item.is_completed === true;
            } else if (status === "복원 진행중") {
              // is_completed가 false인 모든 항목 (처리중, 우수, 양호, 미흡 등 모두 포함)
              return item.is_completed === false;
            }
            return true;
          })
        : formattedData;

      resolve(filteredData);
    }, 1000); // 1초 딜레이
  });
};

// 하위 호환성을 위한 별칭 (deprecated)
export const getRubbings = getRubbingList;


import axios from "axios";
import { mockRubbingList, formatDate, formatProcessingTime } from "../mocks/mockData";

// API Base URL (환경 변수에서 가져오거나 기본값 사용)
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:8000";

// Axios 인스턴스 생성
const apiClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30000,
  headers: {
    "Content-Type": "application/json",
  },
});

// 요청 인터셉터 (인증 토큰 추가 등)
apiClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("authToken");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// 응답 인터셉터 (에러 처리)
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // 인증 에러 처리
      console.error("Authentication error");
    }
    return Promise.reject(error);
  }
);

/**
 * 탁본 목록 조회
 * @param {string|null} status - 필터링할 상태 ("복원 완료", "복원 진행중" 등)
 * @returns {Promise} 탁본 목록 데이터
 */
export const getRubbings = async (status = null) => {
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
      const formattedData = mockRubbingList.map((item) => ({
        id: item.id,
        status: item.status,
        date: formatDate(item.created_at),
        restorationStatus: item.restoration_status || "-",
        processingTime: formatProcessingTime(item.processing_time),
        damageLevel: item.damage_level ? `${item.damage_level}%` : "-",
        inspectionStatus: item.inspection_status || "-",
        reliability: item.average_reliability ? `${item.average_reliability}%` : "-",
        is_completed: item.is_completed, // 원본 데이터의 is_completed 필드 유지
      }));

      // status 필터링 (필요한 경우)
      const filteredData = status
        ? formattedData.filter((item) => {
            if (status === "복원 완료") {
              // is_completed가 true인 항목만 (또는 status가 "처리중"이 아닌 완료된 항목)
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


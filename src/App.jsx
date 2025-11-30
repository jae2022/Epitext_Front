import React, { useState, useEffect } from "react";
import ListPage from "./pages/ListPage";
import UploadPopup from "./pages/UploadPopup";
import DetailPage from "./pages/DetailPage";
import Sidebar from "./components/Sidebar";
import { getRubbingList, completeRubbings, uploadRubbing } from "./api/requests";

function App() {
  const [showUploadPopup, setShowUploadPopup] = useState(false);
  const [activeMenu, setActiveMenu] = useState("전체 기록");
  const [selectedItem, setSelectedItem] = useState(null);
  const [initialData, setInitialData] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  // API에서 데이터 가져오기
  useEffect(() => {
    const fetchData = async () => {
      try {
        setIsLoading(true);
        const status = activeMenu === "복원 완료" ? "복원 완료" : activeMenu === "복원 진행중" ? "복원 진행중" : null;
        const data = await getRubbingList(status);
        setInitialData(data);
        setError(null);
      } catch (err) {
        console.error("데이터 로딩 실패:", err);
        setError("데이터를 불러오는데 실패했습니다.");
        // 에러 발생 시 빈 배열로 설정
        setInitialData([]);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [activeMenu]);

  // 샘플 데이터 (state로 관리) - 더 이상 사용하지 않음
  const [sampleData] = useState([
    {
      id: 8,
      status: "처리중",
      date: "2025.10.28",
      restorationStatus: "-",
      processingTime: "-",
      damageLevel: "-",
      inspectionStatus: "-",
      reliability: "-",
    },
    {
      id: 7,
      status: "우수",
      date: "2025.10.28",
      restorationStatus: "356자 / 복원 대상 23자",
      processingTime: "3분 42초",
      damageLevel: "20%",
      inspectionStatus: "12자 완료",
      reliability: "92%",
    },
    {
      id: 6,
      status: "양호",
      date: "2025.10.28",
      restorationStatus: "68자 / 복원 대상 12자",
      processingTime: "3분 21초",
      damageLevel: "35%",
      inspectionStatus: "12자 완료",
      reliability: "76%",
    },
    {
      id: 5,
      status: "우수",
      date: "2025.10.28",
      restorationStatus: "112자 / 복원 대상 8자",
      processingTime: "3분 45초",
      damageLevel: "15%",
      inspectionStatus: "5자 완료",
      reliability: "92%",
    },
    {
      id: 4,
      status: "우수",
      date: "2025.10.28",
      restorationStatus: "89자 / 복원 대상 31자",
      processingTime: "5분 02초",
      damageLevel: "41%",
      inspectionStatus: "31자 완료",
      reliability: "68%",
    },
    {
      id: 3,
      status: "양호",
      date: "2025.10.28",
      restorationStatus: "15자 / 복원 대상 8자",
      processingTime: "2분 17초",
      damageLevel: "41%",
      inspectionStatus: "2자 완료",
      reliability: "71%",
    },
    {
      id: 2,
      status: "미흡",
      date: "2025.10.28",
      restorationStatus: "203자 / 복원 대상 87자",
      processingTime: "6분 54초",
      damageLevel: "70%",
      inspectionStatus: "23자 완료",
      reliability: "45%",
    },
    {
      id: 1,
      status: "미흡",
      date: "2025.10.28",
      restorationStatus: "47자 / 복원 대상 29자",
      processingTime: "4분 33초",
      damageLevel: "63%",
      inspectionStatus: "14자 완료",
      reliability: "52%",
    },
  ]);

  // 메뉴 변경 핸들러 - DetailPage가 열려있으면 닫고 ListPage로 이동
  const handleMenuChange = (menu) => {
    setActiveMenu(menu);
    setSelectedItem(null); // DetailPage가 열려있으면 닫기
  };

  // 필터링된 데이터 (API에서 이미 필터링된 데이터를 받아오므로 그대로 사용)
  const getFilteredData = () => {
    return initialData;
  };

  // 복원 완료 처리
  const handleComplete = async (selectedIds) => {
    try {
      await completeRubbings(selectedIds);
      // 데이터 새로고침
      const status = activeMenu === "복원 완료" ? "복원 완료" : activeMenu === "복원 진행중" ? "복원 진행중" : null;
      const data = await getRubbingList(status);
      setInitialData(data);
    } catch (err) {
      console.error("복원 완료 처리 실패:", err);
      alert("복원 완료 처리에 실패했습니다.");
    }
  };

  // 업로드 완료 처리
  const handleUploadComplete = async (uploadData) => {
    try {
      const file = uploadData.file;
      if (!file) {
        alert("파일을 선택해주세요.");
        return;
      }

      await uploadRubbing(file);
      setShowUploadPopup(false);

      // 데이터 새로고침
      const status = activeMenu === "복원 완료" ? "복원 완료" : activeMenu === "복원 진행중" ? "복원 진행중" : null;
      const data = await getRubbingList(status);
      setInitialData(data);
    } catch (err) {
      console.error("업로드 실패:", err);
      alert("파일 업로드에 실패했습니다.");
    }
  };

  return (
    <div className="flex h-screen w-screen bg-white overflow-hidden">
      <Sidebar activeMenu={activeMenu} setActiveMenu={handleMenuChange} />
      {selectedItem ? (
        <DetailPage item={selectedItem} onBack={() => setSelectedItem(null)} />
      ) : (
        <>
          {isLoading ? (
            <div className="flex-1 flex items-center justify-center">
              <div className="text-gray-500">로딩 중...</div>
            </div>
          ) : error ? (
            <div className="flex-1 flex items-center justify-center">
              <div className="text-red-500">{error}</div>
            </div>
          ) : (
            <ListPage
              onUploadClick={() => setShowUploadPopup(true)}
              tableData={getFilteredData()}
              completedIds={[]} // API에서 is_completed로 관리하므로 더 이상 필요 없음
              onComplete={handleComplete}
              onViewDetail={(item) => setSelectedItem(item)}
            />
          )}
          {showUploadPopup && <UploadPopup onClose={() => setShowUploadPopup(false)} onComplete={handleUploadComplete} />}
        </>
      )}
    </div>
  );
}

export default App;

import React, { useState, useEffect } from "react";
import ListPage from "./pages/ListPage";
import UploadPopup from "./pages/UploadPopup";
import DetailPage from "./pages/DetailPage";
import Sidebar from "./components/Sidebar";
import { getRubbings } from "./api/requests";
import { formatDate } from "./mocks/mockData";

function App() {
  const [showUploadPopup, setShowUploadPopup] = useState(false);
  const [activeMenu, setActiveMenu] = useState("전체 기록");
  const [completedIds, setCompletedIds] = useState([]);
  const [selectedItem, setSelectedItem] = useState(null);
  const [initialData, setInitialData] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  // 탁본 목록 데이터 로드
  useEffect(() => {
    const loadRubbings = async () => {
      setIsLoading(true);
      try {
        // activeMenu에 따라 status 파라미터 설정
        let status = null;
        if (activeMenu === "복원 완료") {
          status = "복원 완료";
        } else if (activeMenu === "복원 진행중") {
          status = "복원 진행중";
        }

        const data = await getRubbings(status);
        setInitialData(data);
      } catch (error) {
        console.error("Failed to load rubbings:", error);
      } finally {
        setIsLoading(false);
      }
    };

    loadRubbings();
  }, [activeMenu]);

  // 메뉴 변경 핸들러 - DetailPage가 열려있으면 닫고 ListPage로 이동
  const handleMenuChange = (menu) => {
    setActiveMenu(menu);
    setSelectedItem(null); // DetailPage가 열려있으면 닫기
  };

  // 필터링된 데이터 (복원 완료/진행중은 API에서 필터링되지만, completedIds로 추가 필터링)
  const getFilteredData = () => {
    if (activeMenu === "복원 완료") {
      return initialData.filter((item) => completedIds.includes(item.id));
    } else if (activeMenu === "복원 진행중") {
      return initialData.filter((item) => !completedIds.includes(item.id));
    }
    return initialData;
  };

  // 복원 완료 처리
  const handleComplete = (selectedIds) => {
    setCompletedIds((prev) => [...prev, ...selectedIds]);
  };

  // 업로드 완료 처리 (새 항목 추가)
  const handleUploadComplete = (uploadData) => {
    // 새로운 ID 생성 (기존 최대 ID + 1)
    setInitialData((prevData) => {
      const maxId = prevData.length > 0 ? Math.max(...prevData.map((item) => item.id)) : 0;
      const newId = maxId + 1;

      // 새 항목 생성 (백엔드 응답 형식과 유사하게)
      const newItem = {
        id: newId,
        status: "처리중",
        date: uploadData.uploadDate || formatDate(new Date().toISOString()),
        restorationStatus: "-",
        processingTime: "-",
        damageLevel: "-",
        inspectionStatus: "-",
        reliability: "-",
      };

      // 새 항목을 맨 앞에 추가
      return [newItem, ...prevData];
    });

    setShowUploadPopup(false);
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
              <div className="text-gray-600">로딩 중...</div>
            </div>
          ) : (
            <ListPage
              onUploadClick={() => setShowUploadPopup(true)}
              tableData={getFilteredData()}
              completedIds={completedIds}
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

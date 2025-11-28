import React, { useState, useMemo } from "react";
import ListPage from "./pages/ListPage";
import UploadPopup from "./pages/UploadPopup";
import DetailPage from "./pages/DetailPage";
import Sidebar from "./components/Sidebar";
import { mockRubbingList, formatDate, formatProcessingTime } from "./mocks/mockData";

function App() {
  const [showUploadPopup, setShowUploadPopup] = useState(false);
  const [activeMenu, setActiveMenu] = useState("전체 기록");
  const [completedIds, setCompletedIds] = useState([]);
  const [selectedItem, setSelectedItem] = useState(null);

  // Mock 데이터를 프론트엔드에서 사용하는 형식으로 변환
  const [initialData, setInitialData] = useState(
    mockRubbingList.map((item) => ({
      id: item.id,
      status: item.status,
      date: formatDate(item.created_at),
      restorationStatus: item.restoration_status || "-",
      processingTime: formatProcessingTime(item.processing_time),
      damageLevel: item.damage_level ? `${item.damage_level}%` : "-",
      inspectionStatus: item.inspection_status || "-",
      reliability: item.average_reliability ? `${item.average_reliability}%` : "-",
    }))
  );

  // 메뉴 변경 핸들러 - DetailPage가 열려있으면 닫고 ListPage로 이동
  const handleMenuChange = (menu) => {
    setActiveMenu(menu);
    setSelectedItem(null); // DetailPage가 열려있으면 닫기
  };

  // 필터링된 데이터
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
          <ListPage
            onUploadClick={() => setShowUploadPopup(true)}
            tableData={getFilteredData()}
            completedIds={completedIds}
            onComplete={handleComplete}
            onViewDetail={(item) => setSelectedItem(item)}
          />
          {showUploadPopup && <UploadPopup onClose={() => setShowUploadPopup(false)} onComplete={handleUploadComplete} />}
        </>
      )}
    </div>
  );
}

export default App;

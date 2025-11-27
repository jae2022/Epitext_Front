import React, { useState } from "react";
import ListPage from "./pages/ListPage";
import UploadPopup from "./pages/UploadPopup";
import DetailPage from "./pages/DetailPage";
import Sidebar from "./components/Sidebar";

function App() {
  const [showUploadPopup, setShowUploadPopup] = useState(false);
  const [activeMenu, setActiveMenu] = useState("전체 기록");
  const [completedIds, setCompletedIds] = useState([]);
  const [selectedItem, setSelectedItem] = useState(null);

  // 샘플 데이터 (state로 관리)
  const [initialData, setInitialData] = useState([
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

      // 새 항목 생성
      const newItem = {
        id: newId,
        status: "처리중",
        date: uploadData.uploadDate,
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

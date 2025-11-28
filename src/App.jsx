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

  // 메뉴 변경 핸들러 - DetailPage가 열려있으면 닫고 ListPage로 이동
  const handleMenuChange = (menu) => {
    setActiveMenu(menu);
    setSelectedItem(null); // DetailPage가 열려있으면 닫기
  };

  // 복원 완료 처리
  const handleComplete = (selectedIds) => {
    setCompletedIds((prev) => [...prev, ...selectedIds]);
  };

  // 업로드 완료 처리 (새 항목 추가)
  const handleUploadComplete = (uploadData) => {
    // TODO: 실제로는 API를 통해 새 항목을 추가해야 함
    // 현재는 ListPage가 자체적으로 데이터를 관리하므로 여기서는 팝업만 닫음
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
            completedIds={completedIds}
            onComplete={handleComplete}
            onViewDetail={(item) => setSelectedItem(item)}
            activeMenu={activeMenu}
          />
          {showUploadPopup && <UploadPopup onClose={() => setShowUploadPopup(false)} onComplete={handleUploadComplete} />}
        </>
      )}
    </div>
  );
}

export default App;

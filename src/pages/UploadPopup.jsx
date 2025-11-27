import React, { useState, useRef } from "react";

const UploadPopup = ({ onClose, onComplete }) => {
  const [uploadState, setUploadState] = useState("preset"); // 'preset', 'loading', 'complete'
  const [uploadProgress, setUploadProgress] = useState(0);
  const [timeRemaining, setTimeRemaining] = useState(0);
  const [uploadedFile, setUploadedFile] = useState(null);
  const fileInputRef = useRef(null);
  const dragAreaRef = useRef(null);

  // 드래그 앤 드롭 핸들러
  const handleDragOver = (e) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    const files = Array.from(e.dataTransfer.files).filter((file) => file.type.startsWith("image/"));
    if (files.length > 0) {
      handleFiles(files);
    }
  };

  // 파일 선택 핸들러
  const handleFileSelect = (e) => {
    const files = Array.from(e.target.files).filter((file) => file.type.startsWith("image/"));
    if (files.length > 0) {
      handleFiles(files);
    }
  };

  // 파일 추가 버튼 클릭
  const handleAddButtonClick = () => {
    fileInputRef.current?.click();
  };

  // 파일 처리 및 업로드 시작
  const handleFiles = (files) => {
    if (files.length > 0) {
      const file = files[0]; // 첫 번째 파일만 사용
      setUploadedFile(file);
      startUpload();
    }
  };

  // 업로드 시뮬레이션
  const startUpload = () => {
    setUploadState("loading");
    setUploadProgress(0);
    setTimeRemaining(10);

    const interval = setInterval(() => {
      setUploadProgress((prev) => {
        if (prev >= 100) {
          clearInterval(interval);
          setUploadState("complete");
          return 100;
        }
        return prev + 2;
      });

      setTimeRemaining((prev) => {
        if (prev <= 0) {
          return 0;
        }
        return Math.max(0, prev - 0.2);
      });
    }, 200);
  };

  // 취소 버튼
  const handleCancel = () => {
    setUploadState("preset");
    setUploadProgress(0);
    setTimeRemaining(0);
    setUploadedFile(null);
  };

  // 파일 삭제 (X 버튼)
  const handleDeleteFile = () => {
    setUploadState("preset");
    setUploadProgress(0);
    setTimeRemaining(0);
    setUploadedFile(null);
  };

  // 완료 버튼 클릭
  const handleFinish = () => {
    if (uploadState === "complete" && uploadedFile && onComplete) {
      // 현재 날짜를 YYYY.MM.DD 형식으로 생성
      const now = new Date();
      const year = now.getFullYear();
      const month = String(now.getMonth() + 1).padStart(2, "0");
      const day = String(now.getDate()).padStart(2, "0");
      const dateString = `${year}.${month}.${day}`;

      // 새 항목 추가
      onComplete({
        fileName: uploadedFile.name,
        uploadDate: dateString,
      });
    }
    onClose();
  };

  return (
    <>
      {/* 오버레이 */}
      <div className="fixed inset-0 bg-black bg-opacity-30 z-40" onClick={onClose} />

      {/* 팝업 */}
      <div className="fixed right-[32px] top-[59px] w-[500px] h-[822px] bg-white rounded-[16px] z-50 overflow-hidden shadow-lg">
        {/* 헤더 */}
        <div className="relative h-[88px] border-b border-[#ebedf8]">
          <button onClick={onClose} className="absolute left-[40px] top-[32px] w-6 h-6">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
              <path d="M15 18L9 12L15 6" stroke="#2A2A3A" strokeWidth="2" strokeLinecap="round" />
            </svg>
          </button>

          <h2 className="absolute left-1/2 top-[46px] transform -translate-x-1/2 -translate-y-1/2 text-[20px] font-semibold text-[#2a2a3a]">
            탁본 이미지 업로드
          </h2>

          <button onClick={onClose} className="absolute right-[40px] top-[34px] w-6 h-6">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
              <path d="M18 6L6 18M6 6L18 18" stroke="#2A2A3A" strokeWidth="2" strokeLinecap="round" />
            </svg>
          </button>
        </div>

        {/* 컨텐츠 */}
        <div className="p-[40px] flex flex-col h-[calc(100%-88px)]">
          <div className="flex-1">
            {/* Preset 상태: 드래그 앤 드롭 영역 */}
            {uploadState === "preset" && (
              <>
                <div
                  ref={dragAreaRef}
                  onDragOver={handleDragOver}
                  onDrop={handleDrop}
                  className="border-2 border-dashed border-[#c0c5dc] rounded-[8px] h-[200px] flex flex-col items-center justify-center mb-4 cursor-pointer hover:border-[#7f85a3] transition-colors"
                  onClick={handleAddButtonClick}
                >
                  <div className="w-[72px] h-[72px] mb-4">
                    <svg width="72" height="72" viewBox="0 0 72 72" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path
                        d="M36 12L48 24H42V48H30V24H24L36 12Z"
                        fill="#C0C5DC"
                        stroke="#C0C5DC"
                        strokeWidth="1"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                      <path d="M24 24H48M36 12V48" stroke="#C0C5DC" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  </div>
                  <p className="text-[16px] font-medium text-[#2a2a3a]">이미지 끌어다 놓기</p>
                </div>

                {/* 숨겨진 파일 입력 */}
                <input ref={fileInputRef} type="file" accept="image/*" multiple onChange={handleFileSelect} className="hidden" />

                {/* 추가 버튼 */}
                <div className="flex justify-center mb-[283px]">
                  <button onClick={handleAddButtonClick} className="w-6 h-6 hover:opacity-70 transition-opacity">
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <circle cx="12" cy="12" r="10" stroke="#2A2A3A" strokeWidth="2" />
                      <path d="M12 8V16M8 12H16" stroke="#2A2A3A" strokeWidth="2" strokeLinecap="round" />
                    </svg>
                  </button>
                </div>
              </>
            )}

            {/* Loading 상태: 업로드 진행 바 */}
            {uploadState === "loading" && (
              <div className="border border-[#c0c5dc] rounded-[8px] h-[80px] relative mb-4 overflow-hidden">
                {/* 진행 바 배경 (gray3 색으로 채워짐) */}
                <div className="bg-gray-3 h-full rounded-l-[8px] transition-all duration-300" style={{ width: `${uploadProgress}%` }} />
                {/* 텍스트 및 버튼 */}
                <div className="absolute inset-0 flex items-center justify-between px-6">
                  <div className="flex flex-col">
                    <p className="text-[14px] font-semibold text-[#2a2a3a]">Uploading...</p>
                    <p className="text-[12px] font-semibold text-[#7f85a3]">
                      {Math.round(uploadProgress)}%・{Math.ceil(timeRemaining)}초 남음
                    </p>
                  </div>
                  <button onClick={handleCancel} className="w-6 h-6 hover:opacity-70 transition-opacity flex-shrink-0">
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <circle cx="12" cy="12" r="10" stroke="#2A2A3A" strokeWidth="2" />
                      <path d="M15 9L9 15M9 9L15 15" stroke="#2A2A3A" strokeWidth="2" strokeLinecap="round" />
                    </svg>
                  </button>
                </div>
              </div>
            )}

            {/* Complete 상태: 업로드 완료 표시 */}
            {uploadState === "complete" && uploadedFile && (
              <div className="border border-[#c0c5dc] rounded-[8px] h-[80px] relative mb-4 flex items-center justify-between px-6">
                <div className="flex flex-col">
                  <p className="text-[14px] font-semibold text-[#2a2a3a]">{uploadedFile.name}</p>
                  <p className="text-[12px] font-semibold text-[#7f85a3]">Upload Completed</p>
                </div>
                <button onClick={handleDeleteFile} className="w-6 h-6 hover:opacity-70 transition-opacity flex-shrink-0">
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <circle cx="12" cy="12" r="10" stroke="#2A2A3A" strokeWidth="2" />
                    <path d="M15 9L9 15M9 9L15 15" stroke="#2A2A3A" strokeWidth="2" strokeLinecap="round" />
                  </svg>
                </button>
              </div>
            )}
          </div>

          {/* 완료 버튼 - 하단 고정 */}
          <button
            onClick={handleFinish}
            className="w-full h-[48px] bg-[#ee7542] rounded-[6px] flex items-center justify-center hover:bg-[#d66438] transition-colors mt-auto"
          >
            <span className="text-white text-[16px] font-bold">완료</span>
          </button>
        </div>
      </div>
    </>
  );
};

export default UploadPopup;

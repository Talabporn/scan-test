import React, { useEffect, useRef, useState } from "react";
import { BrowserMultiFormatReader } from "@zxing/browser";
import "../styles/BarcodeScanner.css";

const BarcodeScanner = () => {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const [scannedCode, setScannedCode] = useState<string | null>(null);
  const [scannedCounts, setScannedCounts] = useState<{ [key: string]: number }>({});
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // URL ลิงก์เสียงที่ใช้จากแหล่งภายนอก
  const beep = new Audio("https://actions.google.com/sounds/v1/alarms/beep_short.ogg");

  useEffect(() => {
    const codeReader = new BrowserMultiFormatReader();

    if (videoRef.current) {
      codeReader.decodeFromVideoDevice(undefined, videoRef.current, (result, err) => {
        if (result) {
          const code = result.getText();
          setScannedCode(code);

          // อัปเดตจำนวนการสแกน
          setScannedCounts(prevCounts => {
            const newCounts = { ...prevCounts };
            newCounts[code] = newCounts[code] ? newCounts[code] + 1 : 1;
            return newCounts;
          });

          // เล่นเสียง beep
          beep.currentTime = 0; // รีเซ็ตเวลาเสียงก่อนที่จะเล่นใหม่
          beep.play().catch((err) => console.error('ไม่สามารถเล่นเสียงได้:', err));

          // ล้างข้อผิดพลาด (ถ้ามี)
          setErrorMessage(null);
        } else if (err) {
          // กรองข้อผิดพลาดที่ไม่ต้องการแสดง
          if (err.message && err.message.includes("NotFoundException")) {
            return; // ถ้าพบข้อผิดพลาดนี้ให้ไม่แสดง
          }

          console.error('Error decoding barcode:', err);
          setErrorMessage("ไม่สามารถสแกนบาร์โค้ดได้ โปรดลองใหม่อีกครั้ง");
        }
      });
    }

    // Cleanup เมื่อ component ถูก unmount
    return () => {
      const stream = videoRef.current?.srcObject as MediaStream;
      stream?.getTracks().forEach(track => track.stop());
    };
  }, []);

  return (
    <div className="barcode-scanner">
      <h2>สแกนบาร์โค้ด</h2>

      {/* แสดงกล้อง */}
      <video ref={videoRef} width="400" autoPlay playsInline />
      
      {/* แสดงข้อความ error ถ้ามี */}
      {errorMessage && <p className="error-message">{errorMessage}</p>}

      {/* แสดงผลรหัสที่สแกนได้ */}
      <div>
        <p>รหัสที่สแกนได้: {scannedCode || "กรุณาสแกนบาร์โค้ด"}</p>

        {/* ตารางแสดงรหัสที่สแกน */}
        <table>
          <thead>
            <tr>
              <th>รหัส</th>
              <th>จำนวน</th>
            </tr>
          </thead>
          <tbody>
            {Object.entries(scannedCounts).length === 0 ? (
              <tr>
                <td colSpan={2}>ยังไม่มีข้อมูลการสแกน</td>
              </tr>
            ) : (
              Object.entries(scannedCounts).map(([code, count]) => (
                <tr key={code}>
                  <td>{code}</td>
                  <td>{count}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default BarcodeScanner;

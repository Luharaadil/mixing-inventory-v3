
import React, { useState, useEffect, useRef, useCallback } from 'react';
import ReactDOM from 'react-dom/client';

// ==========================================
// 1. TYPES & CONSTANTS
// ==========================================
export interface InventoryItem {
  name: string;
  qty: number;
  location: string;
  scanTime: string;
  qty1?: number;
  qty2?: number;
  qty3?: number;
  qty4?: number;
  qty5?: number;
}

export interface InventoryMap {
  [code: string]: InventoryItem;
}

export interface AppSettings {
  decimals: number;
  minLen: number;
  maxLen: number;
  filenameFormat: string;
}

export type ScanMode = 'barcode' | 'ocr';
export type Language = 'zh-TW' | 'en' | 'hi';

declare global {
  interface Window {
    Html5Qrcode: any;
    Tesseract: any;
  }
}

export const SYSTEM_CONFIG = {
  API_URL: "https://script.google.com/macros/s/AKfycbxN5It2eczVQ1oL0uE9cjEC8sqKITOMKJdl9_jMx7Z7taFNdEMb5LdyjErhARNHno4JXA/exec",
  SHEET_URL: "https://docs.google.com/spreadsheets/d/1_85YEZSQFARb7HgA2hfNOj4bxoptdjqQfAqq3Y0uY9o/edit?gid=0#gid=0"
};

export const DEFAULT_SETTINGS: AppSettings = {
  decimals: 2,
  minLen: 4,
  maxLen: 50,
  filenameFormat: "USER_YYYYMMDDHHmmss"
};

export const TRANSLATIONS = {
  'zh-TW': {
    appTitle: "Mixing Inventory v2",
    user: "人員 (User)",
    cycleCount: "盤點 (No.)",
    count1: "1️⃣ 盤點 1 (H欄)",
    count2: "2️⃣ 盤點 2 (I欄)",
    count3: "3️⃣ 盤點 3 (J欄)",
    count4: "4️⃣ 盤點 4 (K欄)",
    count5: "5️⃣ 盤點 5 (L欄)",
    modeBarcode: "條碼/QR",
    modeBarcodeSub: "Barcode & QR",
    modeOCR: "文字識別",
    modeOCRSub: "OCR Text",
    clear: "清除",
    settings: "設定",
    flash: "補光燈",
    flashOff: "關閉補光燈",
    export: "匯出",
    openSheet: "開啟試算表",
    upload: "上傳資料",
    tableCode: "唯一碼 (Code)",
    tableLoc: "儲位",
    tableName: "品名",
    tableQty: "平均",
    tableAct: "操作",
    noData: "暫無資料 (No Data)",
    confirmCode: "1️⃣ 確認條碼 (Code):",
    confirmName: "2️⃣ 品名 (Name):",
    confirmQty: "3️⃣ 數量 (Qty):",
    confirmLoc: "4️⃣ 儲位 (Location):",
    tooShort: "❌ 太短 (Min: ",
    tooLong: "❌ 太長 (Max: ",
    deleteConfirm: "刪除項目 (Delete): ",
    clearAllConfirm: "清除所有資料? (Clear All?)",
    uploadConfirm: "上傳至雲端?\n\n⚠️ 保護機制已啟動：空白或 0 的欄位將不會發送至雲端，避免覆寫 Excel 既有資料。\n\n是否繼續？",
    uploadSuccess: "✅ 上傳成功",
    uploadFail: "❌ 上傳失敗: ",
    exportSuccess: "✅ 匯出完成",
    settingsTitle: "⚙️ 系統設定",
    decLabel: "小數點位數 (Decimal):",
    minLabel: "最少辨識字元 (Min):",
    maxLabel: "最大辨識字元 (Max):",
    fileFmtLabel: "匯出檔名格式:",
    save: "儲存",
    cancel: "取消",
    scannerStart: "👆 點擊畫面開始掃描",
    ocrProcessing: "處理中...",
    ocrReady: "✅ 識別就緒",
    ocrWait: "👀 掃描中... 請對準文字",
    langSelect: "選擇語言 (Select Language)",
    editPrompt: "輸入數值 (Enter Value):",
    scanDetected: "🔍 已偵測：",
    scanConfirm: "(再次點擊畫面確認)"
  },
  'en': {
    appTitle: "Mixing Inventory v2",
    user: "User",
    cycleCount: "Cycle Count",
    count1: "1️⃣ Count 1 (Col H)",
    count2: "2️⃣ Count 2 (Col I)",
    count3: "3️⃣ Count 3 (Col J)",
    count4: "4️⃣ Count 4 (Col K)",
    count5: "5️⃣ Count 5 (Col L)",
    modeBarcode: "Barcode/QR",
    modeBarcodeSub: "Scan Code",
    modeOCR: "OCR Text",
    modeOCRSub: "Recognize Text",
    clear: "Clear",
    settings: "Settings",
    flash: "Flash",
    flashOff: "Flash Off",
    export: "Export",
    openSheet: "Open Sheet",
    upload: "Upload Data",
    tableCode: "Code",
    tableLoc: "Loc",
    tableName: "Name",
    tableQty: "Avg",
    tableAct: "Action",
    noData: "No Data",
    confirmCode: "1️⃣ Confirm Code:",
    confirmName: "2️⃣ Name:",
    confirmQty: "3️⃣ Quantity:",
    confirmLoc: "4️⃣ Location:",
    tooShort: "❌ Too short (Min: ",
    tooLong: "❌ Too long (Max: ",
    deleteConfirm: "Delete Item: ",
    clearAllConfirm: "Clear All Data?",
    uploadConfirm: "Upload to cloud?\n\n⚠️ Protection: Empty or zero fields will NOT overwrite existing cloud data.\n\nContinue?",
    uploadSuccess: "✅ Upload Success",
    uploadFail: "❌ Upload Failed: ",
    exportSuccess: "✅ Export Done",
    settingsTitle: "⚙️ Settings",
    decLabel: "Decimals:",
    minLabel: "Min Length:",
    maxLabel: "Max Length:",
    fileFmtLabel: "Filename Format:",
    save: "Save",
    cancel: "Cancel",
    scannerStart: "👆 Tap to Start Scan",
    ocrProcessing: "Processing...",
    ocrReady: "✅ Ready",
    ocrWait: "👀 Scanning...",
    langSelect: "Select Language",
    editPrompt: "Enter Value:",
    scanDetected: "🔍 Detected: ",
    scanConfirm: "(Tap again to confirm)"
  },
  'hi': {
    appTitle: "मिक्सिंग इन्वेंटरी",
    user: "उपयोगकर्ता (User)",
    cycleCount: "साइकिल गिनती (No.)",
    count1: "1️⃣ गिनती 1 (Col H)",
    count2: "2️⃣ गिनती 2 (Col I)",
    count3: "3️⃣ गिनती 3 (Col J)",
    count4: "4️⃣ गिनती 4 (Col K)",
    count5: "5️⃣ गिनती 5 (Col L)",
    modeBarcode: "बारकोड/QR",
    modeBarcodeSub: "Scan Code",
    modeOCR: "OCR Text",
    modeOCRSub: "Recognize Text",
    clear: "साफ़ करें",
    settings: "सेटिंग्स",
    flash: "फ्लैश",
    flashOff: "फ्लैश बंद",
    export: "निर्यात",
    openSheet: "शीट खोलें",
    upload: "डेटा अपलोड",
    tableCode: "कोड",
    tableLoc: "स्थान",
    tableName: "नाम",
    tableQty: "औसत",
    tableAct: "क्रिया",
    noData: "कोई डेटा नहीं",
    confirmCode: "1️⃣ कोड पुष्टि:",
    confirmName: "2️⃣ नाम:",
    confirmQty: "3️⃣ मात्रा:",
    confirmLoc: "4️⃣ स्थान:",
    tooShort: "❌ छोटा (Min: ",
    tooLong: "❌ लंबा (Max: ",
    deleteConfirm: "हटाएं: ",
    clearAllConfirm: "सारा डेटा साफ़ करें?",
    uploadConfirm: "क्लाउड पर अपलोड करें?\n\n⚠️ सुरक्षा: खाली या शून्य फ़ील्ड क्लाउड डेटा को अधिलेखित नहीं करेंगे।\n\nजारी रखें?",
    uploadSuccess: "✅ सफल",
    uploadFail: "❌ विफल: ",
    exportSuccess: "✅ निर्यात पूर्ण",
    settingsTitle: "⚙️ सेटिंग्स",
    decLabel: "दशमलव:",
    minLabel: "न्यूनतम लंबाई:",
    maxLabel: "अधिकतम लंबाई:",
    fileFmtLabel: "फाइल नाम:",
    save: "सहेजें",
    cancel: "रद्द करें",
    scannerStart: "👆 शुरू करें",
    ocrProcessing: "प्रक्रिया...",
    ocrReady: "✅ तैयार",
    ocrWait: "👀 स्कैनिंग...",
    langSelect: "भाषा चुनें",
    editPrompt: "मान दर्ज करें:",
    scanDetected: "🔍 पता चला: ",
    scanConfirm: "(पुष्टि के लिए टैप करें)"
  }
};

// ==========================================
// 2. HELPER FUNCTIONS
// ==========================================
const playBeep = () => {
    try {
        const AudioContext = window.AudioContext || (window as any).webkitAudioContext;
        if (!AudioContext) return;
        const ctx = new AudioContext();
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.type = "sine"; 
        osc.frequency.setValueAtTime(1500, ctx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(800, ctx.currentTime + 0.1);
        gain.gain.setValueAtTime(0.1, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.1);
        osc.start(ctx.currentTime);
        osc.stop(ctx.currentTime + 0.15);
        setTimeout(() => { if (ctx.state !== 'closed') ctx.close(); }, 200);
    } catch (e) {}
};

const calculateAvg = (item: Partial<InventoryItem>) => {
  const vals = [item.qty1, item.qty2, item.qty3, item.qty4, item.qty5]
    .map(v => typeof v === 'number' ? v : parseFloat(v as any))
    .filter(v => !isNaN(v) && v !== undefined && v !== null);
  return vals.length > 0 ? vals.reduce((a, b) => a + b, 0) / vals.length : 0;
};

// ==========================================
// 3. COMPONENTS
// ==========================================

// --- Scanner Component with Flashlight Control ---
interface ScannerProps {
  mode: ScanMode;
  onScan: (text: string) => void;
  isScanning: boolean;
  onToggleScan: (active: boolean) => void;
  triggerFlash: boolean;
  onFlashAvailability: (avail: boolean) => void;
  language: Language;
  minLen: number;
  maxLen: number;
}

const Scanner: React.FC<ScannerProps> = ({ 
  mode, onScan, isScanning, onToggleScan,
  triggerFlash, onFlashAvailability,
  language, minLen, maxLen
}) => {
  const barcodeScannerRef = useRef<any>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [streamTrack, setStreamTrack] = useState<MediaStreamTrack | null>(null);
  const ocrIntervalRef = useRef<number | null>(null);
  const [ocrQuality, setOcrQuality] = useState(false);
  const [ocrText, setOcrText] = useState(TRANSLATIONS[language].ocrWait);
  const [tempCode, setTempCode] = useState<string | null>(null);

  const t = TRANSLATIONS[language];

  // --- Flashlight Control Logic ---
  useEffect(() => {
    const applyFlash = async () => {
        if (!window.isSecureContext) return;
        if (mode === 'ocr' && streamTrack) {
            try {
                const caps = streamTrack.getCapabilities() as any;
                if (caps.torch) await streamTrack.applyConstraints({ advanced: [{ torch: triggerFlash }] } as any);
            } catch (e) {}
        }
        if (mode === 'barcode' && barcodeScannerRef.current && isScanning) {
            try {
                await barcodeScannerRef.current.applyVideoConstraints({ advanced: [{ torch: triggerFlash }] });
            } catch (e) {}
        }
    };
    applyFlash();
  }, [triggerFlash, streamTrack, mode, isScanning]);

  const startBarcode = useCallback(async () => {
    if (!window.Html5Qrcode) return;
    const scanner = new window.Html5Qrcode("reader");
    barcodeScannerRef.current = scanner;
    try {
        await scanner.start(
            { facingMode: "environment" },
            { fps: 15, qrbox: { width: 250, height: 250 }, aspectRatio: 1.0 },
            (decodedText: string) => { if (tempCode !== decodedText) { setTempCode(decodedText); playBeep(); } },
            () => {}
        );
        try {
            const capabilities = await scanner.getRunningTrackCapabilities();
            onFlashAvailability(!!capabilities.torch);
        } catch (e) { onFlashAvailability(false); }
    } catch (e) { onToggleScan(false); }
  }, [onToggleScan, tempCode, onFlashAvailability]);

  const startOcr = useCallback(async () => {
    try {
        const stream = await navigator.mediaDevices.getUserMedia({ 
            video: { facingMode: "environment", width: { ideal: 3840 }, height: { ideal: 2160 } } 
        });
        if (videoRef.current) {
            videoRef.current.srcObject = stream;
            const track = stream.getVideoTracks()[0];
            setStreamTrack(track);
            try {
                const cap = track.getCapabilities() as any;
                onFlashAvailability(!!cap.torch);
            } catch (e) { onFlashAvailability(false); }
            ocrIntervalRef.current = window.setInterval(analyzeFrame, 300);
        }
    } catch (e) { onToggleScan(false); }
  }, [onToggleScan, onFlashAvailability]);

  const analyzeFrame = () => {
    if (!videoRef.current || !canvasRef.current) return;
    const v = videoRef.current;
    if (v.readyState !== 4) return;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d', { willReadFrequently: true });
    if (!ctx) return;
    canvas.width = v.videoWidth; canvas.height = v.videoHeight;
    const cropW = canvas.width * 0.9, cropH = canvas.height * 0.045;
    const cropX = (canvas.width - cropW) / 2, cropY = (canvas.height - cropH) / 2;
    ctx.drawImage(v, 0, 0);
    const data = ctx.getImageData(cropX, cropY, cropW, cropH).data;
    let sum = 0, count = 0;
    for (let i = 0; i < data.length; i += 80) {
        sum += (data[i] * 0.299 + data[i+1] * 0.587 + data[i+2] * 0.114); count++;
    }
    const mean = sum / count;
    let variance = 0;
    for (let i = 0; i < data.length; i += 80) {
        const gray = (data[i] * 0.299 + data[i+1] * 0.587 + data[i+2] * 0.114);
        variance += Math.pow(gray - mean, 2);
    }
    setOcrQuality(Math.sqrt(variance / count) > 40);
  };

  const captureOcr = async () => {
    if (!videoRef.current || !window.Tesseract) return;
    setOcrText(t.ocrProcessing);
    const v = videoRef.current;
    const canvas = document.createElement('canvas');
    canvas.width = v.videoWidth; canvas.height = v.videoHeight;
    canvas.getContext('2d')?.drawImage(v, 0, 0);
    const cropH = canvas.height * 0.045, cropY = (canvas.height - cropH) / 2;
    const cropCanvas = document.createElement('canvas');
    cropCanvas.width = canvas.width; cropCanvas.height = cropH;
    cropCanvas.getContext('2d')?.drawImage(canvas, 0, cropY, canvas.width, cropH, 0, 0, canvas.width, cropH);
    try {
        const { data: { text } } = await window.Tesseract.recognize(cropCanvas.toDataURL('image/jpeg'), 'eng', { tessedit_pageseg_mode: '7' });
        let cleanText = text.replace(/[^a-zA-Z0-9.-]/g, "").trim();
        if (cleanText.length >= minLen) { playBeep(); onScan(cleanText); setOcrText(t.ocrWait); }
        else { setOcrText("⚠️ Too short"); }
    } catch (e) { setOcrText(t.ocrWait); }
  };

  useEffect(() => {
    const stopCamera = async () => {
        if (barcodeScannerRef.current) {
            try { 
                await barcodeScannerRef.current.applyVideoConstraints({ advanced: [{ torch: false }] });
                await barcodeScannerRef.current.stop(); 
                barcodeScannerRef.current.clear(); 
            } catch(e) {}
            barcodeScannerRef.current = null;
        }
        if (streamTrack) { 
            try { await streamTrack.applyConstraints({ advanced: [{ torch: false }] } as any); } catch(e) {}
            streamTrack.stop(); setStreamTrack(null); 
        }
        if (ocrIntervalRef.current) { clearInterval(ocrIntervalRef.current); ocrIntervalRef.current = null; }
    };
    if (isScanning) { if (mode === 'barcode') startBarcode(); else startOcr(); }
    else { stopCamera(); }
    return () => { stopCamera(); };
  }, [isScanning, mode]);

  return (
    <div className="viewport" onClick={() => {
        if (!isScanning) onToggleScan(true);
        else if (mode === 'barcode' && tempCode) { if (confirm(`${t.scanDetected}\n${tempCode}`)) onScan(tempCode); else setTempCode(null); }
        else if (mode === 'ocr') captureOcr();
    }}>
        {mode === 'barcode' ? (
            <div id="reader" style={{display: isScanning ? 'block' : 'none'}}></div>
        ) : (
            <video ref={videoRef} autoPlay playsInline style={{display: isScanning ? 'block' : 'none', width:'100%', height:'100%', objectFit:'cover'}} />
        )}
        <canvas ref={canvasRef} className="hidden" />
        {isScanning && (
            <div className="absolute inset-0 pointer-events-none">
                {mode === 'barcode' ? (
                    <div id="center-guide" className={tempCode ? 'guide-success' : ''} style={{display:'block'}}></div>
                ) : (
                    <div className="scan-guide-overlay" style={{display:'block'}}>
                        <div className={`guide-box ${ocrQuality ? 'ready' : ''}`}><div className="guide-text">{ocrText}</div></div>
                    </div>
                )}
                <div className="camera-hint" style={{display:'flex'}}>
                    {tempCode ? `${t.scanDetected}\n${tempCode}\n${t.scanConfirm}` : t.scannerStart}
                </div>
            </div>
        )}
        {!isScanning && (
           <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/40 text-white pointer-events-none">
               <div className="text-5xl mb-2 opacity-80">{mode === 'barcode' ? '📷' : '📝'}</div>
               <div className="text-xl font-bold">{t.scannerStart}</div>
           </div>
        )}
    </div>
  );
};

// --- InventoryTable Component ---
interface InventoryTableProps {
  inventory: InventoryMap;
  settings: AppSettings;
  onEdit: (code: string) => void;
  onDelete: (code: string) => void;
  onUpdateField: (code: string, field: keyof InventoryItem) => void;
  checkIndex: number;
  language: Language;
}

const InventoryTable: React.FC<InventoryTableProps> = ({ inventory, settings, onEdit, onDelete, onUpdateField, checkIndex, language }) => {
  const items = (Object.entries(inventory) as [string, InventoryItem][]).reverse();
  const t = TRANSLATIONS[language];
  const renderQtyCell = (code: string, val: number | undefined, field: keyof InventoryItem, isActive: boolean) => {
    const hasValue = val !== undefined && val !== null && val !== 0;
    const isGField = field === 'qty';
    return (
      <td 
        key={field} 
        onClick={() => !isGField && onUpdateField(code, field)} 
        className={`px-2 py-2 text-center font-bold cursor-pointer border-r border-gray-200 ${isActive ? (hasValue ? 'text-green-600' : 'text-gray-400') : 'text-gray-300'} ${isGField ? 'bg-gray-100 cursor-not-allowed text-gray-800' : ''}`}
      >
        {hasValue ? val.toFixed(settings.decimals) : (isGField ? '0' : '-')}
      </td>
    );
  };
  return (
    <div className="bg-white rounded-lg shadow-md overflow-x-auto border border-gray-600">
      <table className="min-w-full text-black whitespace-nowrap text-sm">
        <thead className="bg-[#333] text-white">
          <tr>
            <th className="px-2 py-2 text-left">{t.tableCode}</th>
            <th className="px-2 py-2">{t.tableLoc}</th>
            <th className="px-2 py-2 text-left">{t.tableName}</th>
            <th className={checkIndex === 0 ? 'bg-[#444] text-yellow-400' : ''}>G</th>
            {['qty1','qty2','qty3','qty4','qty5'].map((f, i) => <th key={f} className={checkIndex === i+1 ? 'bg-[#444] text-yellow-400' : ''}>Q{i+1}</th>)}
            <th className="px-2 py-2">{t.tableAct}</th>
          </tr>
        </thead>
        <tbody>
          {items.map(([code, item]) => (
              <tr key={code} className="border-b hover:bg-blue-50">
                  <td className="px-2 py-2 font-mono text-blue-600 font-bold cursor-pointer" onClick={()=>onEdit(code)}>{code}</td>
                  <td className="px-2 py-2 text-center text-yellow-600 font-bold">{item.location || '-'}</td>
                  <td className="px-2 py-2 max-w-[100px] truncate">{item.name}</td>
                  {renderQtyCell(code, item.qty, 'qty', checkIndex === 0)}
                  {renderQtyCell(code, item.qty1, 'qty1', checkIndex === 1)}
                  {renderQtyCell(code, item.qty2, 'qty2', checkIndex === 2)}
                  {renderQtyCell(code, item.qty3, 'qty3', checkIndex === 3)}
                  {renderQtyCell(code, item.qty4, 'qty4', checkIndex === 4)}
                  {renderQtyCell(code, item.qty5, 'qty5', checkIndex === 5)}
                  <td className="px-2 py-2 text-center flex justify-center gap-2">
                      <button onClick={()=>onEdit(code)}>✏️</button><button onClick={()=>onDelete(code)}>🗑️</button>
                  </td>
              </tr>
          ))}
          {items.length === 0 && <tr><td colSpan={11} className="p-4 text-center text-gray-500 italic">{t.noData}</td></tr>}
        </tbody>
      </table>
    </div>
  );
};

// --- App Component ---
const App: React.FC = () => {
  const [user, setUser] = useState("Default");
  const [checkIndex, setCheckIndex] = useState(1);
  const [mode, setMode] = useState<ScanMode>('barcode');
  const [inventory, setInventory] = useState<InventoryMap>({});
  const [settings, setSettings] = useState<AppSettings>(DEFAULT_SETTINGS);
  const [isScanning, setIsScanning] = useState(false);
  const [flashOn, setFlashOn] = useState(false);
  const [isFlashAvail, setIsFlashAvail] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [language, setLanguage] = useState<Language>('zh-TW');

  const t = TRANSLATIONS[language];

  useEffect(() => {
    const savedUser = localStorage.getItem('currentUser') || "Default";
    setUser(savedUser);
    const savedLang = localStorage.getItem('appLanguage') as Language;
    if (savedLang) setLanguage(savedLang);
    const savedSettings = localStorage.getItem('appSettings');
    if (savedSettings) setSettings({...DEFAULT_SETTINGS, ...JSON.parse(savedSettings)});
    
    const savedIndex = localStorage.getItem('lastCheckIndex');
    if (savedIndex) {
      const idx = parseInt(savedIndex);
      setCheckIndex(idx === 0 ? 1 : idx);
    }
    
    setInventory(JSON.parse(localStorage.getItem(`inventory_${savedUser}`) || "{}"));
  }, []);

  const handleSaveItem = (code: string) => {
    setIsScanning(false);
    setTimeout(() => {
        let finalCode = (prompt(t.confirmCode, code) || "").trim();
        if (!finalCode) return;
        const item = inventory[finalCode];
        const name = prompt(t.confirmName, item?.name || finalCode.split('-')[0]) || "No Name";
        
        const targetIndex = checkIndex;
        const targetLabel = TRANSLATIONS[language][(`count${targetIndex}` as keyof typeof TRANSLATIONS['zh-TW'])];
        const qtyStr = prompt(`${t.confirmQty} (${targetLabel})`, "") || "0";
        const qty = parseFloat(qtyStr);
        
        // 修正：儲位 (Location) 欄位始終保持淨空待輸入狀態，強制使用者每次手動輸入
        const loc = (prompt(t.confirmLoc, "") || "").trim();
        const now = new Date().toISOString().replace('T', ' ').split('.')[0];
        
        const updatedItem: InventoryItem = {
            name, location: loc, scanTime: now,
            qty: 0,
            qty1: targetIndex === 1 ? qty : item?.qty1,
            qty2: targetIndex === 2 ? qty : item?.qty2,
            qty3: targetIndex === 3 ? qty : item?.qty3,
            qty4: targetIndex === 4 ? qty : item?.qty4,
            qty5: targetIndex === 5 ? qty : item?.qty5,
        };
        
        updatedItem.qty = calculateAvg(updatedItem);

        const newInv = { ...inventory, [finalCode]: updatedItem };
        setInventory(newInv);
        localStorage.setItem(`inventory_${user}`, JSON.stringify(newInv));
    }, 100);
  };

  const handleUpdateField = (code: string, field: keyof InventoryItem) => {
    if (field === 'qty') return;

    const item = inventory[code];
    if (!item) return;

    const v = prompt(t.editPrompt, String((item as any)[field] || ""));
    if (v === null) return;
    
    const nv = v.trim() === "" ? undefined : parseFloat(v);
    const updatedItem = { ...item, [field]: isNaN(nv as any) ? undefined : nv };
    updatedItem.qty = calculateAvg(updatedItem);
    
    const n = { ...inventory, [code]: updatedItem };
    setInventory(n);
    localStorage.setItem(`inventory_${user}`, JSON.stringify(n));
  };

  const handleUpload = async () => {
    if (Object.keys(inventory).length === 0) return alert(t.noData);
    if (!confirm(t.uploadConfirm)) return;
    setIsLoading(true);
    try {
        const payload: any = {};
        (Object.entries(inventory) as [string, InventoryItem][]).forEach(([k, item]) => {
            const clean: any = { name: item.name, location: item.location, scanTime: item.scanTime };
            const checkAndAdd = (key: string, val: any) => {
                const num = parseFloat(val);
                if (val !== undefined && val !== null && val !== "" && !isNaN(num) && num !== 0) {
                    clean[key] = String(num);
                }
            };
            checkAndAdd('qty', item.qty);
            checkAndAdd('qty1', item.qty1);
            checkAndAdd('qty2', item.qty2);
            checkAndAdd('qty3', item.qty3);
            checkAndAdd('qty4', item.qty4);
            checkAndAdd('qty5', item.qty5);
            payload[k] = clean;
        });
        const resp = await fetch(SYSTEM_CONFIG.API_URL, { 
            method: 'POST', 
            headers: { "Content-Type": "text/plain;charset=utf-8" },
            body: JSON.stringify({ user, items: payload }) 
        });
        const resultText = await resp.text();
        alert(`${t.uploadSuccess} (${resultText})`);
    } catch (e) { alert(t.uploadFail + e); }
    finally { setIsLoading(false); }
  };

  return (
    <div className="max-w-3xl mx-auto p-2 pb-10 min-h-screen text-white">
      {isLoading && <div className="fixed inset-0 bg-black/80 z-[300] flex flex-col items-center justify-center">
          <div className="w-12 h-12 border-4 border-t-blue-500 rounded-full animate-spin mb-4"></div>
          <div className="font-bold">Uploading...</div>
      </div>}
      <div className="flex justify-between items-center mb-4 pt-2">
        <h2 className="text-3xl font-bold">{t.appTitle}</h2>
        <button onClick={() => setIsSettingsOpen(true)} className="w-10 h-10 bg-[#333] border border-gray-600 rounded-full flex items-center justify-center text-xl shadow-lg">⚙️</button>
      </div>
      <div className="bg-[#2c3e50] p-3 rounded-lg border-2 border-[#007bff] mb-3 space-y-2 shadow-lg">
        <div className="flex items-center gap-2">
            <label className="w-24 text-sm font-bold text-[#5dade2]">{t.user}:</label>
            <input value={user} onChange={e=>setUser(e.target.value)} onBlur={e=>{localStorage.setItem('currentUser', e.target.value); setInventory(JSON.parse(localStorage.getItem(`inventory_${e.target.value}`) || "{}"));}} className="flex-1 p-2 rounded bg-white text-black font-bold text-lg" />
        </div>
        <div className="flex items-center gap-2 pt-1 border-t border-gray-600">
            <label className="w-24 text-sm font-bold text-[#f1c40f]">{t.cycleCount}:</label>
            <select value={checkIndex} onChange={e=>{const val=parseInt(e.target.value); setCheckIndex(val); localStorage.setItem('lastCheckIndex', val.toString());}} className="flex-1 p-2 rounded bg-[#333] text-white font-bold">
                <option value={1}>{t.count1}</option>
                <option value={2}>{t.count2}</option>
                <option value={3}>{t.count3}</option>
                <option value={4}>{t.count4}</option>
                <option value={5}>{t.count5}</option>
            </select>
        </div>
      </div>
      <div className="mode-switch mb-3">
        <button onClick={()=>setMode('barcode')} className={`mode-btn ${mode==='barcode'?'active':''}`}>{t.modeBarcode}<small>{t.modeBarcodeSub}</small></button>
        <button onClick={()=>setMode('ocr')} className={`mode-btn ${mode==='ocr'?'active':''}`}>{t.modeOCR}<small>{t.modeOCRSub}</small></button>
      </div>
      <Scanner mode={mode} onScan={handleSaveItem} isScanning={isScanning} onToggleScan={setIsScanning} triggerFlash={flashOn} onFlashAvailability={setIsFlashAvail} language={language} minLen={settings.minLen} maxLen={settings.maxLen} />
      <div className="grid grid-cols-2 gap-3 mb-3">
        <button onClick={() => {if(confirm(t.clearAllConfirm)) {setInventory({}); localStorage.setItem(`inventory_${user}`,"{}");}}} className="h-12 bg-gray-600 rounded-lg font-bold">🗑️ {t.clear}</button>
        <button onClick={() => setFlashOn(!flashOn)} className={`h-12 rounded-lg font-bold ${flashOn ? 'bg-white text-black' : 'bg-yellow-500 text-black'} ${!isFlashAvail ? 'opacity-30' : ''}`}>🔦 {flashOn ? t.flashOff : t.flash}</button>
      </div>
      <div className="grid grid-cols-2 gap-3 mb-3">
        <button onClick={() => {}} className="h-12 bg-green-600 rounded-lg font-bold opacity-50 cursor-not-allowed">📤 {t.export}</button>
        <button onClick={() => window.open(SYSTEM_CONFIG.SHEET_URL)} className="h-12 bg-purple-700 rounded-lg font-bold">📂 {t.openSheet}</button>
      </div>
      <button onClick={handleUpload} className="w-full bg-blue-600 h-16 rounded-lg font-bold text-xl mb-4 shadow-xl">☁️ {t.upload}</button>
      <InventoryTable inventory={inventory} settings={settings} onEdit={handleSaveItem} onDelete={c=>{if(confirm(t.deleteConfirm+c)){const n={...inventory}; delete n[c]; setInventory(n); localStorage.setItem(`inventory_${user}`,JSON.stringify(n));}}} onUpdateField={handleUpdateField} checkIndex={checkIndex} language={language} />
      {isSettingsOpen && (
        <div className="fixed inset-0 bg-black/90 z-50 flex items-center justify-center p-4">
          <div className="bg-[#333] border border-[#555] rounded-xl w-full max-w-md p-6">
            <h3 className="text-2xl font-bold text-[#17a2b8] mb-4 text-center">{t.settingsTitle}</h3>
            <div className="space-y-4">
                <div><label className="block text-sm mb-1">{t.langSelect}</label><select value={language} onChange={e=>{setLanguage(e.target.value as any); localStorage.setItem('appLanguage', e.target.value);}} className="w-full p-3 rounded bg-[#222] border border-[#555]"><option value="zh-TW">中文 (繁體)</option><option value="en">English</option><option value="hi">हिन्दी</option></select></div>
                <div className="grid grid-cols-2 gap-3">
                    <div><label className="text-xs">{t.minLabel}</label><input type="number" value={settings.minLen} onChange={e=>setSettings({...settings, minLen:parseInt(e.target.value)})} className="w-full p-2 bg-[#222] rounded" /></div>
                    <div><label className="text-xs">{t.decLabel}</label><input type="number" value={settings.decimals} onChange={e=>setSettings({...settings, decimals:parseInt(e.target.value)})} className="w-full p-2 bg-[#222] rounded" /></div>
                </div>
            </div>
            <div className="flex gap-3 mt-8">
                <button onClick={()=>setIsSettingsOpen(false)} className="flex-1 py-3 bg-gray-600 rounded-lg font-bold">{t.cancel}</button>
                <button onClick={()=>{localStorage.setItem('appSettings', JSON.stringify(settings)); setIsSettingsOpen(false);}} className="flex-1 py-3 bg-green-600 rounded-lg font-bold">{t.save}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

const root = ReactDOM.createRoot(document.getElementById('root')!);
root.render(<App />);

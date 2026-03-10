
import React, { useState, useEffect, useCallback } from 'react';
import { InventoryMap, AppSettings, ScanMode, InventoryItem, Language } from './types.ts';
import { DEFAULT_SETTINGS, SYSTEM_CONFIG, TRANSLATIONS } from './constants.ts';
import { Scanner } from './components/Scanner.tsx';
import { SettingsModal } from './components/SettingsModal.tsx';
import { InventoryTable } from './components/InventoryTable.tsx';

const App: React.FC = () => {
  // --- State ---
  const [user, setUser] = useState<string>("Default");
  // 將預設選取項從 0 (G) 改為 1 (Q1/H)
  const [checkIndex, setCheckIndex] = useState<number>(1); 
  const [mode, setMode] = useState<ScanMode>('barcode');
  const [inventory, setInventory] = useState<InventoryMap>({});
  const [settings, setSettings] = useState<AppSettings>(DEFAULT_SETTINGS);
  const [isScanning, setIsScanning] = useState(false);
  const [flashOn, setFlashOn] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [loadingText, setLoadingText] = useState("");
  const [authStatus, setAuthStatus] = useState<'pending' | 'authorized' | 'unauthorized'>('authorized');
  const [currentUserEmail, setCurrentUserEmail] = useState<string>("");
  const [language, setLanguage] = useState<Language>('zh-TW');
  const [isLangModalOpen, setIsLangModalOpen] = useState(false);

  const t = TRANSLATIONS[language];

  useEffect(() => {
    const savedUser = localStorage.getItem('currentUser') || "Default";
    setUser(savedUser);
    const savedLang = localStorage.getItem('appLanguage') as Language;
    if (savedLang && ['zh-TW', 'en', 'hi'].includes(savedLang)) setLanguage(savedLang);
    
    // 如果上次儲存的是 0，則強制轉為 1
    const savedIndex = localStorage.getItem('lastCheckIndex');
    if (savedIndex) {
      const idx = parseInt(savedIndex);
      setCheckIndex(idx === 0 ? 1 : idx);
    }
    
    const savedSettings = localStorage.getItem('appSettings');
    if (savedSettings) setSettings({...DEFAULT_SETTINGS, ...JSON.parse(savedSettings)});
    loadInventory(savedUser);
    checkPermission();
  }, []);

  const calculateAvg = (item: Partial<InventoryItem>) => {
    const vals = [item.qty1, item.qty2, item.qty3, item.qty4, item.qty5]
      .map(v => typeof v === 'number' ? v : parseFloat(v as any))
      .filter(v => !isNaN(v) && v !== undefined && v !== null);
    return vals.length > 0 ? vals.reduce((a, b) => a + b, 0) / vals.length : 0;
  };

  const checkPermission = async () => {
    try {
        const response = await fetch(SYSTEM_CONFIG.API_URL, {
            method: 'POST',
            headers: { "Content-Type": "text/plain;charset=utf-8" },
            body: JSON.stringify({ action: "checkAuth" })
        });
        const text = await response.text();
        try {
            const result = JSON.parse(text);
            if (result && result.email) setCurrentUserEmail(result.email);
        } catch (e) {}
    } catch (e) {}
  };

  const changeLanguage = (lang: Language) => {
      setLanguage(lang);
      localStorage.setItem('appLanguage', lang);
      setIsLangModalOpen(false);
  };

  const loadInventory = (userId: string) => {
    const data = localStorage.getItem(`inventory_${userId}`);
    setInventory(data ? JSON.parse(data) : {});
  };

  const handleUserChange = (newUser: string) => {
    const cleanUser = newUser.trim() || "Default";
    setUser(cleanUser);
    localStorage.setItem('currentUser', cleanUser);
    loadInventory(cleanUser);
  };
  
  const handleCheckIndexChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
      const val = parseInt(e.target.value);
      setCheckIndex(val);
      localStorage.setItem('lastCheckIndex', val.toString());
  };

  const handleSaveItem = (initialCode: string) => {
    setIsScanning(false);
    setTimeout(() => {
        let codeInput = prompt(t.confirmCode, initialCode);
        if (codeInput === null) return;
        let code = codeInput.replace(/[^a-zA-Z0-9.-]/g, "").trim();
        if (!code) return;
        if (code.length < settings.minLen) return alert(`${t.tooShort}${settings.minLen})`);

        const existingItem = inventory[code];
        const defaultName = existingItem ? existingItem.name : (code.split('-')[0] || "");
        const nameInput = prompt(t.confirmName, defaultName);
        if (nameInput === null) return;
        const name = nameInput.trim() || "No Name";

        // checkIndex 目前保證為 1-5，直接使用
        const targetIndex = checkIndex;
        const targetLabel = TRANSLATIONS[language][(`count${targetIndex}` as keyof typeof TRANSLATIONS['zh-TW'])];
        
        let currentStoredQty: number | undefined;
        if (existingItem) {
             currentStoredQty = (existingItem as any)[`qty${targetIndex}`];
        }
        const defaultQty = (currentStoredQty !== undefined && currentStoredQty !== 0) ? currentStoredQty.toString() : "";
        const qtyStr = prompt(`${t.confirmQty} (${targetLabel})`, defaultQty);
        if (qtyStr === null) return;
        let qty = parseFloat(qtyStr);
        if (isNaN(qty)) qty = 0;

        // 修正：儲位 (Location) 欄位始終保持淨空待輸入狀態，預設值為空，強制手動輸入
        let locationPrompt = prompt(t.confirmLoc, "");
        if (locationPrompt === null) return;
        const location = locationPrompt.trim();

        const d = new Date();
        const istTime = d.toISOString().replace(/T/, ' ').replace(/\..+/, '');

        const newItem: InventoryItem = {
            name: name,
            location: location,
            scanTime: istTime,
            qty: 0,
            qty1: (targetIndex === 1) ? qty : (existingItem?.qty1),
            qty2: (targetIndex === 2) ? qty : (existingItem?.qty2),
            qty3: (targetIndex === 3) ? qty : (existingItem?.qty3),
            qty4: (targetIndex === 4) ? qty : (existingItem?.qty4),
            qty5: (targetIndex === 5) ? qty : (existingItem?.qty5),
        };
        
        // 自動計算平均值
        newItem.qty = calculateAvg(newItem);

        const newInventory = { ...inventory, [code]: newItem };
        setInventory(newInventory);
        localStorage.setItem(`inventory_${user}`, JSON.stringify(newInventory));
    }, 100);
  };

  const handleUpdateQty = (code: string, field: keyof InventoryItem) => {
      if (field === 'qty') return; // G 欄位不可手動修改
      const item = inventory[code];
      if (!item) return;
      const currentVal = item[field];
      const displayVal = (currentVal !== undefined && currentVal !== 0) ? currentVal : "";
      const newValStr = prompt(`${t.editPrompt} (${field})`, String(displayVal));
      if (newValStr === null) return;
      let newVal = newValStr.trim() === "" ? 0 : parseFloat(newValStr);
      if (isNaN(newVal)) return alert("Invalid Number");

      const newItem = { ...item, [field]: newVal };
      newItem.qty = calculateAvg(newItem);
      const newInventory = { ...inventory, [code]: newItem };
      setInventory(newInventory);
      localStorage.setItem(`inventory_${user}`, JSON.stringify(newInventory));
  };

  const handleUpload = async () => {
    if (Object.keys(inventory).length === 0) return alert(t.noData);
    if (!confirm(t.uploadConfirm)) return;
    setIsLoading(true);
    try {
        const payload: any = {};
        (Object.entries(inventory) as [string, InventoryItem][]).forEach(([key, item]) => {
            const formatVal = (v: any) => (v === undefined || v === null || v === 0) ? "" : String(v);
            payload[key] = {
                name: item.name, location: item.location, scanTime: item.scanTime,
                qty: formatVal(item.qty), qty1: formatVal(item.qty1), qty2: formatVal(item.qty2),
                qty3: formatVal(item.qty3), qty4: formatVal(item.qty4), qty5: formatVal(item.qty5)
            };
        });
        const response = await fetch(SYSTEM_CONFIG.API_URL, {
            method: 'POST',
            headers: { "Content-Type": "text/plain;charset=utf-8" },
            body: JSON.stringify({ user, items: payload })
        });
        const text = await response.text();
        alert(t.uploadSuccess + " (" + text + ")");
    } catch (e) {
        alert(t.uploadFail + e);
    } finally {
        setIsLoading(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto p-2 pb-10 min-h-screen relative">
      {isLoading && <div className="fixed inset-0 bg-black/85 z-[300] flex flex-col items-center justify-center text-white"><div className="w-10 h-10 border-4 border-gray-200 border-t-red-600 rounded-full animate-spin mb-4"></div><div className="font-bold">Uploading...</div></div>}
      <div className="relative mb-3 pt-2">
          <h2 className="text-center text-3xl font-bold text-gray-100 mt-2">{t.appTitle}</h2>
          <button onClick={() => setIsLangModalOpen(true)} className="absolute top-1 right-2 w-10 h-10 bg-[#333] border border-gray-600 rounded-full flex items-center justify-center text-xl shadow-lg hover:bg-gray-700 z-20">⚙️</button>
      </div>
      <div className="flex flex-col gap-2 mb-3 bg-[#2c3e50] p-3 rounded-lg border-2 border-[#007bff] shadow-lg">
        <div className="flex items-center gap-2"><label className="font-bold text-[#5dade2] w-24">{t.user}:</label><input type="text" value={user} onChange={(e) => setUser(e.target.value)} onBlur={(e) => handleUserChange(e.target.value)} className="flex-1 p-2 rounded bg-white text-black text-lg font-bold" /></div>
        <div className="flex items-center gap-2 border-t border-gray-600 pt-2"><label className="font-bold text-[#f1c40f] w-24">{t.cycleCount}:</label><select value={checkIndex} onChange={handleCheckIndexChange} className="flex-1 p-2 rounded bg-[#333] text-white font-bold">
            {/* 移除 G 欄位選項，從 Q1 開始 */}
            <option value={1}>{t.count1}</option>
            <option value={2}>{t.count2}</option>
            <option value={3}>{t.count3}</option>
            <option value={4}>{t.count4}</option>
            <option value={5}>{t.count5}</option>
        </select></div>
      </div>
      <div className="mode-switch mb-3"><button onClick={() => setMode('barcode')} className={`mode-btn ${mode === 'barcode' ? 'active' : ''}`}>{t.modeBarcode}<small>{t.modeBarcodeSub}</small></button><button onClick={() => setMode('ocr')} className={`mode-btn ${mode === 'ocr' ? 'active' : ''}`}>{t.modeOCR}<small>{t.modeOCRSub}</small></button></div>
      <Scanner mode={mode} onScan={handleSaveItem} isScanning={isScanning} onToggleScan={setIsScanning} triggerFlash={flashOn} language={language} minLen={settings.minLen} maxLen={settings.maxLen} />
      <div className="grid grid-cols-2 gap-3 mb-3"><button onClick={() => {if(confirm(t.clearAllConfirm)){setInventory({});localStorage.setItem(`inventory_${user}`,"{}")}}} className="h-12 bg-gray-600 rounded-lg font-bold">🗑️ {t.clear}</button><button onClick={() => setIsSettingsOpen(true)} className="h-12 bg-[#17a2b8] rounded-lg font-bold">⚙️ {t.settings}</button></div>
      <div className="grid grid-cols-2 gap-3 mb-3"><button onClick={() => {}} className="h-12 bg-green-600 rounded-lg font-bold opacity-50 cursor-not-allowed">📤 {t.export}</button><button onClick={() => window.open(SYSTEM_CONFIG.SHEET_URL)} className="h-12 bg-[#6610f2] rounded-lg font-bold">📂 {t.openSheet}</button></div>
      <button onClick={handleUpload} className="w-full bg-[#007bff] h-16 rounded-lg font-bold text-xl mb-4 shadow-xl">☁️ {t.upload}</button>
      <InventoryTable inventory={inventory} settings={settings} onEdit={handleSaveItem} onDelete={c=>{if(confirm(t.deleteConfirm+c)){const n={...inventory};delete n[c];setInventory(n);localStorage.setItem(`inventory_${user}`,JSON.stringify(n))}}} onUpdateField={handleUpdateQty} checkIndex={checkIndex} language={language} />
      <SettingsModal isOpen={isSettingsOpen} onClose={() => setIsSettingsOpen(false)} settings={settings} onSave={s=>{setSettings(s);localStorage.setItem('appSettings',JSON.stringify(s));setIsSettingsOpen(false)}} language={language} onLanguageChange={changeLanguage} />
    </div>
  );
};

export default App;

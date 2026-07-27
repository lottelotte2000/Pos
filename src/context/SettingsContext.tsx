import React, { createContext, useState, useContext, ReactNode, useCallback, useEffect } from 'react';
import { ReceiptSettings, CustomerDisplaySettings, SoundSettings, PromptPayAccount, PosSettings } from '../types';

const INITIAL_RECEIPT_SETTINGS: ReceiptSettings = { storeName: 'ชื่อร้านค้าของคุณ', address: '', phone: '', thankYouMessage: 'ขอบคุณที่ใช้บริการ', promptPayId: '', promptPayName: '' };
const INITIAL_CUSTOMER_DISPLAY_SETTINGS: CustomerDisplaySettings = {
  welcomeMessage: "ยินดีต้อนรับ",
  secondaryMessage: "กรุณาตรวจสอบรายการสินค้า",
  idleImageUrl: "",
  thankYouTitle: "ขอบคุณที่ใช้บริการ",
  thankYouSubtitle: "หวังว่าท่านจะกลับมาอีกครั้ง!"
};
export const INITIAL_SOUND_SETTINGS: SoundSettings = {
  paymentSuccessSound: 'success.mp3',
  errorSound: 'error.mp3',
  emptyBarcodeSound: 'empty_barcode.mp3',
  productNotFoundSound: 'product_not_found.mp3',
  scanSuccessSound: 'empty_barcode.mp3',
};
export const INITIAL_POS_SETTINGS: PosSettings = {
  preventNegativeStock: false, // ค่าเริ่มต้น: ขายได้แม้สต็อกจะติดลบ
  // ปุ่มลัดเติมเงิน (แก้ไขได้) — เริ่มต้นกำไร 0 ให้ผู้ใช้ไปกรอกเอง
  topUpAmounts: [20, 50, 100, 200, 300, 500, 1000].map(cost => ({ cost, profit: 0 })),
};

interface SettingsContextType {
  receiptSettings: ReceiptSettings;
  setReceiptSettings: React.Dispatch<React.SetStateAction<ReceiptSettings>>;
  updateReceiptSettings: (settingsUpdate: Partial<ReceiptSettings>) => void;
  customerDisplaySettings: CustomerDisplaySettings;
  setCustomerDisplaySettings: React.Dispatch<React.SetStateAction<CustomerDisplaySettings>>;
  updateCustomerDisplaySettings: (settingsUpdate: Partial<CustomerDisplaySettings>) => void;
  soundSettings: SoundSettings;
  setSoundSettings: React.Dispatch<React.SetStateAction<SoundSettings>>;
  updateSoundSettings: (settingsUpdate: Partial<SoundSettings>) => void;
  posSettings: PosSettings;
  setPosSettings: React.Dispatch<React.SetStateAction<PosSettings>>;
  updatePosSettings: (settingsUpdate: Partial<PosSettings>) => void;
}

const SettingsContext = createContext<SettingsContextType | undefined>(undefined);

export const SettingsProvider = ({ children }: { children: ReactNode }) => {
  const [receiptSettings, setReceiptSettings] = useState<ReceiptSettings>(INITIAL_RECEIPT_SETTINGS);
  const [customerDisplaySettings, setCustomerDisplaySettings] = useState<CustomerDisplaySettings>(INITIAL_CUSTOMER_DISPLAY_SETTINGS);
  const [soundSettings, setSoundSettings] = useState<SoundSettings>(INITIAL_SOUND_SETTINGS);
  const [posSettings, setPosSettings] = useState<PosSettings>(INITIAL_POS_SETTINGS);

  // ✅ Migration: Convert legacy single PromptPay to Accounts list
  useEffect(() => {
    if (receiptSettings.promptPayId && (!receiptSettings.promptPayAccounts || receiptSettings.promptPayAccounts.length === 0)) {
      console.log("Migrating legacy PromptPay settings...");
      const newAccount: PromptPayAccount = {
        id: `pp-${Date.now()}`,
        name: receiptSettings.promptPayName || 'PrompPay หลัก',
        number: receiptSettings.promptPayId
      };
      setReceiptSettings(prev => ({
        ...prev,
        promptPayAccounts: [newAccount],
        promptPayId: undefined, // Clear legacy
        promptPayName: undefined
      }));
    }
  }, [receiptSettings.promptPayId, receiptSettings.promptPayAccounts, receiptSettings.promptPayName]);

  const updateReceiptSettings = useCallback((settingsUpdate: Partial<ReceiptSettings>) => {
    setReceiptSettings(prev => ({ ...INITIAL_RECEIPT_SETTINGS, ...prev, ...settingsUpdate }));
  }, []);

  const updateCustomerDisplaySettings = useCallback((settingsUpdate: Partial<CustomerDisplaySettings>) => {
    setCustomerDisplaySettings(prev => ({ ...INITIAL_CUSTOMER_DISPLAY_SETTINGS, ...prev, ...settingsUpdate }));
  }, []);

  const updateSoundSettings = useCallback((settingsUpdate: Partial<SoundSettings>) => {
    setSoundSettings(prev => ({ ...INITIAL_SOUND_SETTINGS, ...prev, ...settingsUpdate }));
  }, []);

  const updatePosSettings = useCallback((settingsUpdate: Partial<PosSettings>) => {
    setPosSettings(prev => ({ ...INITIAL_POS_SETTINGS, ...prev, ...settingsUpdate }));
  }, []);

  return (
    <SettingsContext.Provider value={{
      receiptSettings,
      setReceiptSettings,
      updateReceiptSettings,
      customerDisplaySettings,
      setCustomerDisplaySettings,
      updateCustomerDisplaySettings,
      soundSettings,
      setSoundSettings,
      updateSoundSettings,
      posSettings,
      setPosSettings,
      updatePosSettings
    }}>
      {children}
    </SettingsContext.Provider>
  );
};

export const useSettings = (): SettingsContextType => {
  const context = useContext(SettingsContext);
  if (context === undefined) throw new Error('useSettings must be used within a SettingsProvider');
  return context;
};
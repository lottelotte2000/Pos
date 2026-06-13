import React, { useState, useEffect, useRef, useCallback } from 'react';
import { X, AlertTriangle, DollarSign, CreditCard, Smartphone } from 'lucide-react';
import QRCode from 'qrcode';
import generatePayload from 'promptpay-qr';
import { useSettings } from '../../context/SettingsContext';
import { PromptPayAccount } from '../../types';

interface PaymentModalProps {
  total: number;
  onSetConfirmation: (cashReceived: number, paymentMethod: string) => void;
  onCancel: () => void;
  focusCashInput?: boolean;
  initialPaymentMethod?: string;
}

const paymentOptions = [
  { id: 'cash', name: 'เงินสด', icon: <DollarSign size={20} /> },
  { id: 'credit_card', name: 'บัตรเครดิต', icon: <CreditCard size={20} /> },
  { id: 'promptpay', name: 'พร้อมเพย์', icon: <Smartphone size={20} /> },
];

const PaymentModal: React.FC<PaymentModalProps> = ({
  total,
  onSetConfirmation,
  onCancel,
  focusCashInput,
  initialPaymentMethod,
}) => {
  const { receiptSettings, soundSettings } = useSettings();

  const [paymentMethod, setPaymentMethod] = useState<string>(initialPaymentMethod || 'cash');
  const [cashReceivedStr, setCashReceivedStr] = useState<string>('');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [qrCodeUrl, setQrCodeUrl] = useState<string | null>(null);
  const [activePromptPayAccount, setActivePromptPayAccount] = useState<PromptPayAccount | null>(null);

  const cashInputRef = useRef<HTMLInputElement>(null);
  const modalContainerRef = useRef<HTMLDivElement>(null);

  // Initialize Active Account
  useEffect(() => {
    if (receiptSettings.promptPayAccounts && receiptSettings.promptPayAccounts.length > 0) {
      // Default to first account if none selected yet, or if switching back to PromptPay
      if (!activePromptPayAccount) {
        setActivePromptPayAccount(receiptSettings.promptPayAccounts[0]);
      }
    }
  }, [receiptSettings.promptPayAccounts, paymentMethod, activePromptPayAccount]); // Re-check when settings/method change

  const generateQRCode = useCallback(async () => {
    try {
      const mobileNumber = activePromptPayAccount?.number || receiptSettings.promptPayId || '';
      const accountName = activePromptPayAccount?.name || receiptSettings.promptPayName || 'พร้อมเพย์';

      if (!mobileNumber) return;

      const payload = generatePayload(mobileNumber, { amount: total });
      const url = await QRCode.toDataURL(payload);
      setQrCodeUrl(url);

      localStorage.setItem('latest_qr_data', JSON.stringify({
        url,
        amount: total,
        name: accountName,
        timestamp: Date.now()
      }));

      if (window.electronAPI && window.electronAPI.sendCustomerDisplayAction) {
        window.electronAPI.sendCustomerDisplayAction({
          type: 'SHOW_QR',
          payload: { url, amount: total, name: accountName }
        });
      }

    } catch (err) {
      console.error('Error generating QR Code:', err);
      setErrorMessage('ไม่สามารถสร้าง QR Code ได้ (ตรวจสอบเบอร์โทร/เลขบัตร)');
    }
  }, [activePromptPayAccount, receiptSettings.promptPayId, receiptSettings.promptPayName, total]);



  // Generate QR Code
  useEffect(() => {
    if (paymentMethod === 'promptpay') {
      // Use active account if available, else fallback to legacy ID
      if (activePromptPayAccount || receiptSettings.promptPayId) {
        generateQRCode();
      }
    }
  }, [paymentMethod, total, activePromptPayAccount, receiptSettings.promptPayId, generateQRCode]); // Add generateQRCode dependency

  useEffect(() => {
    modalContainerRef.current?.focus();
    if (paymentMethod === 'cash' && focusCashInput && cashInputRef.current) {
      cashInputRef.current.focus();
    }

    // Cleanup: Clear QR when modal closes or unmounts
    return () => {
      localStorage.removeItem('latest_qr_data'); // ✅ ลบข้อมูลออกจาก Storage
      if (window.electronAPI && window.electronAPI.sendCustomerDisplayAction) {
        window.electronAPI.sendCustomerDisplayAction({ type: 'CLEAR_QR' });
      }
    };
  }, [paymentMethod, focusCashInput]);

  const handleConfirmPayment = () => {
    setErrorMessage(null);
    // ฟังก์ชันเล่นเสียงแจ้งเตือน
    const playSuccessSound = () => {
      try {
        const soundFile = soundSettings?.paymentSuccessSound || 'success.mp3';
        const audio = new Audio(`sounds/${soundFile}`);
        audio.volume = 0.5; // ลดความดังลงเล็กน้อยไม่ให้แสบหู
        audio.play().catch(err => console.error("Audio play failed:", err));
      } catch (error) {
        console.error("Could not create Audio object:", error);
      }
    };

    // ฟังก์ชันเล่นเสียง Error
    const playErrorSound = () => {
      try {
        const soundFile = soundSettings?.errorSound || 'error.mp3';
        const audio = new Audio(`sounds/${soundFile}`);
        audio.volume = 0.5;
        audio.play().catch(err => console.error("Audio play failed:", err));
      } catch (error) {
        console.error("Could not create Audio object:", error);
      }
    };

    if (paymentMethod === 'cash') {
      const cash = parseFloat(cashReceivedStr);
      if (isNaN(cash) || cash < 0) {
        setErrorMessage('จำนวนเงินที่รับมาไม่ถูกต้อง');
        playErrorSound();
        return;
      }
      if (cash < total) {
        setErrorMessage('จำนวนเงินที่รับมาน้อยกว่ายอดรวม');
        playErrorSound();
        return;
      }
      playSuccessSound();
      onSetConfirmation(cash, 'cash');
    } else {
      playSuccessSound();
      onSetConfirmation(total, paymentMethod);
    }
  };

  const isPaymentButtonDisabled = () => {
    if (paymentMethod === 'cash') {
      const cash = parseFloat(cashReceivedStr);
      return cashReceivedStr.trim() === '' || isNaN(cash) || cash < total;
    }
    // PromptPay / บัตรเครดิต: อนุญาตให้ยืนยันได้เสมอ (พนักงานยืนยันเมื่อรับเงินจริง)
    return false;
  };

  const calculatedChange = paymentMethod === 'cash' && !isNaN(parseFloat(cashReceivedStr)) && parseFloat(cashReceivedStr) >= total
    ? parseFloat(cashReceivedStr) - total
    : null;

  const handleKeyDown = (event: React.KeyboardEvent<HTMLDivElement>) => {
    if (event.key === 'Enter') {
      event.preventDefault();
      if (!isPaymentButtonDisabled()) {
        handleConfirmPayment();
      }
    } else if (event.key === 'Escape') {
      event.preventDefault();
      onCancel();
    }
  };

  return (
    <div className="fixed inset-0 bg-black/90 backdrop-blur-sm flex justify-center items-center z-[200] p-4 animate-fade-in">
      <div
        ref={modalContainerRef}
        tabIndex={-1}
        onKeyDown={handleKeyDown}
        className="bg-slate-900/90 backdrop-blur-2xl border border-white/10 p-8 rounded-3xl shadow-glass w-full max-w-2xl focus:outline-none transform transition-all animate-slide-up"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex justify-between items-center mb-8">
          <div>
            <h2 className="text-3xl font-bold text-white tracking-tight">ชำระเงิน</h2>
            <p className="text-slate-400 text-sm mt-1">กรุณาเลือกวิธีการชำระเงิน</p>
          </div>
          <button onClick={onCancel} className="p-2 rounded-full hover:bg-white/10 text-slate-400 hover:text-white transition-colors">
            <X size={28} />
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Left Column: Payment Methods & Details */}
          <div className="space-y-6">
            <div className="bg-primary-600/20 border border-primary-500/30 rounded-2xl p-6 text-center relative overflow-hidden group">
              <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity transform group-hover:scale-110">
                <DollarSign size={100} />
              </div>
              <span className="text-slate-300 block mb-2 font-medium">ยอดรวมที่ต้องชำระ</span>
              <span className="text-5xl font-bold text-white tracking-tight">{total.toFixed(2)}</span>
              <span className="text-primary-300 text-lg ml-2">฿</span>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-400 mb-3 uppercase tracking-wider">ช่องทางการชำระเงิน</label>
              <div className="grid grid-cols-3 gap-3">
                {paymentOptions.map(option => (
                  <button
                    key={option.id}
                    onClick={() => setPaymentMethod(option.id)}
                    className={`flex flex-col items-center justify-center p-4 rounded-xl border transition-all duration-200 ${paymentMethod === option.id
                      ? 'bg-primary-600 text-white border-primary-500 shadow-lg shadow-primary-500/30 ring-2 ring-primary-400/50'
                      : 'bg-white/5 text-slate-400 border-white/5 hover:bg-white/10 hover:text-slate-200 hover:border-white/10'
                      }`}
                  >
                    <div className={`mb-2 p-2 rounded-full ${paymentMethod === option.id ? 'bg-white/20' : 'bg-black/20'}`}>
                      {option.icon}
                    </div>
                    <span className="text-xs font-semibold">{option.name}</span>
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Right Column: Dynamic Content based on Selection */}
          <div className="bg-black/20 rounded-2xl p-6 border border-white/5 flex flex-col justify-between">
            <div>
              {paymentMethod === 'cash' && (
                <div className="animate-fade-in">
                  <label htmlFor="cashReceived" className="block text-sm font-medium text-slate-300 mb-2">รับเงินมา (บาท)</label>
                  <div className="relative">
                    <input
                      ref={cashInputRef}
                      type="text"
                      inputMode="decimal"
                      id="cashReceived"
                      value={cashReceivedStr}
                      onChange={(e) => setCashReceivedStr(e.target.value)}
                      placeholder="0.00"
                      className="w-full bg-slate-800 border-2 border-slate-600 rounded-xl px-4 py-4 text-3xl font-bold text-white placeholder-slate-600 focus:outline-none focus:border-primary-500 focus:ring-4 focus:ring-primary-500/20 transition-all text-right"
                    />
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 text-xl font-semibold">฿</span>
                  </div>

                  {calculatedChange !== null && (
                    <div className="mt-6 p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex flex-col items-center animate-slide-up">
                      <span className="text-emerald-400 text-sm font-medium uppercase tracking-wide">เงินทอน</span>
                      <div className="text-4xl font-bold text-emerald-400 tracking-tight mt-1">
                        {calculatedChange.toFixed(2)} <span className="text-lg">฿</span>
                      </div>
                    </div>
                  )}

                  {/* Quick Cash Buttons */}
                  <div className="grid grid-cols-4 gap-2 mt-4">
                    {[100, 500, 1000].map(amount => (
                      <button
                        key={amount}
                        onClick={() => setCashReceivedStr(amount.toString())}
                        className="py-2 rounded-lg bg-white/5 hover:bg-white/10 text-slate-300 text-xs font-medium transition-colors border border-white/5"
                      >
                        {amount}
                      </button>
                    ))}
                    <button onClick={() => setCashReceivedStr(total.toFixed(2))} className="py-2 rounded-lg bg-primary-500/20 hover:bg-primary-500/30 text-primary-300 text-xs font-medium transition-colors border border-primary-500/20">
                      พอดี
                    </button>
                  </div>
                </div>
              )}

              {paymentMethod === 'promptpay' && (
                <div className="flex flex-col items-center justify-center h-full animate-fade-in text-center">

                  {/* Account Selector if > 1 */}
                  {receiptSettings.promptPayAccounts && receiptSettings.promptPayAccounts.length > 1 && (
                    <div className="mb-4 w-full px-2">
                      <label className="block text-xs text-slate-400 mb-2 text-left">เลือกบัญชีรับเงิน</label>
                      <div className="grid grid-cols-2 gap-2">
                        {receiptSettings.promptPayAccounts.map(acc => (
                          <button
                            key={acc.id}
                            onClick={() => setActivePromptPayAccount(acc)}
                            className={`p-2 rounded-lg text-sm transition-all border ${activePromptPayAccount?.id === acc.id ? 'bg-primary-600 border-primary-500 text-white shadow-md' : 'bg-white/5 border-white/10 text-slate-400 hover:bg-white/10'}`}
                          >
                            <div className="font-semibold truncate">{acc.name}</div>
                            <div className="text-xs opacity-70 truncate font-mono">{acc.number}</div>
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  {(activePromptPayAccount || receiptSettings.promptPayId) ? (
                    <>
                      <div className="bg-white p-4 rounded-xl shadow-lg mb-4">
                        <img src={qrCodeUrl || ''} alt="PromptPay QR Code" className="w-48 h-48 object-contain mix-blend-multiply" />
                      </div>
                      <p className="font-bold text-white text-lg">
                        {activePromptPayAccount ? activePromptPayAccount.name : (receiptSettings.promptPayName || 'พร้อมเพย์')}
                      </p>
                      <p className="text-sm text-primary-300 font-mono tracking-wider">
                        {activePromptPayAccount ? activePromptPayAccount.number : receiptSettings.promptPayId}
                      </p>
                      <p className="text-xs text-slate-500 mt-4 max-w-[200px]">สแกนเพื่อชำระเงินยอด {total.toFixed(2)} บาท</p>
                    </>
                  ) : (
                    <div className="py-8">
                      <AlertTriangle className="mx-auto h-12 w-12 text-amber-500 mb-3" />
                      <p className="text-amber-500 font-medium">ไม่พบ PromptPay ID</p>
                      <p className="text-xs text-slate-400 mt-1">ตั้งค่าที่เมนูตั้งค่า</p>
                    </div>
                  )}
                </div>
              )}

              {paymentMethod === 'credit_card' && (
                <div className="flex flex-col items-center justify-center h-full animate-fade-in py-8 text-center px-4">
                  <div className="w-20 h-20 bg-primary-500/20 rounded-full flex items-center justify-center mb-4">
                    <CreditCard size={40} className="text-primary-400" />
                  </div>
                  <h3 className="text-white font-semibold text-lg">บัตรเครดิต</h3>
                  <p className="text-slate-400 text-sm mt-2">กรุณาดำเนินการผ่านเครื่องรูดบัตร (EDC)</p>
                  <p className="text-slate-500 text-xs mt-4">เมื่อทำรายการสำเร็จ กดปุ่ม "บันทึกข้อมูล" ด้านล่าง</p>
                </div>
              )}
            </div>

            <div className="mt-auto pt-6">
              {errorMessage && (
                <div className="mb-4 p-3 bg-red-500/20 border border-red-500/20 text-red-200 rounded-xl text-sm flex items-center gap-2 animate-shake">
                  <AlertTriangle size={18} className="flex-shrink-0" />
                  {errorMessage}
                </div>
              )}

              <div className="flex flex-col gap-3">
                <button
                  onClick={handleConfirmPayment}
                  disabled={isPaymentButtonDisabled()}
                  className="w-full btn-primary py-3.5 text-lg shadow-xl shadow-primary-600/20"
                >
                  {paymentMethod === 'cash' ? 'ยืนยันการรับเงิน' : 'บันทึกข้อมูลการชำระ'}
                </button>
                <button onClick={onCancel} className="w-full py-3 rounded-xl text-slate-400 hover:text-white hover:bg-white/5 transition-colors text-sm font-medium">
                  ยกเลิก
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PaymentModal;
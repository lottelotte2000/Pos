import React, { useRef } from 'react';
import { Transaction } from '../../types';
import { Printer, X, Receipt as ReceiptIcon } from 'lucide-react';
import { useSettings } from '../../context/SettingsContext';

interface ReceiptProps {
  transaction?: Transaction | null;
  onClose: () => void;
}

const paymentMethodDisplayNames: { [key: string]: string } = {
  cash: 'เงินสด',
  credit_card: 'บัตรเครดิต',
  promptpay: 'พร้อมเพย์',
  transfer: 'โอนเงิน',
};

const Receipt: React.FC<ReceiptProps> = ({ transaction, onClose }) => {
  const { receiptSettings } = useSettings();
  const {
    storeName = 'ร้านค้าของคุณ',
    address = '',
    phone = '',
    thankYouMessage = 'ขอบคุณที่ใช้บริการ',
  } = receiptSettings || {};

  const receiptPrintContentRef = useRef<HTMLDivElement>(null);

  if (!transaction || !transaction.id || !transaction.date) {
    return null;
  }

  const date = new Date(transaction.date);
  const formattedDate = `${date.toLocaleDateString('th-TH')} ${date.toLocaleTimeString('th-TH')}`;
  const displayPaymentMethod = paymentMethodDisplayNames[transaction.paymentMethod] || transaction.paymentMethod;

  const handlePrintWithIframe = () => {
    if (!receiptPrintContentRef.current) return;

    const printContents = receiptPrintContentRef.current.innerHTML;
    const printStyles = `
      @import url('https://fonts.googleapis.com/css2?family=Sarabun:wght@400;700&display=swap');
      body {
        margin: 0; padding: 0; font-family: 'Sarabun', sans-serif;
        font-size: 9pt; line-height: 1.4; color: #000;
        background: #fff;
      }
      .receipt-container { width: 72mm; margin: 0 auto; padding: 2mm; }
      .text-center { text-align: center; }
      .text-right { text-align: right; }
      .text-left { text-align: left; }
      .font-bold { font-weight: bold; }
      .store-name { font-size: 14pt; margin-bottom: 2mm; }
      .text-sm { font-size: 8pt; color: #333; }
      .divider { border-top: 1px dashed #000; margin: 3mm 0; }
      .divider-solid { border-top: 1px solid #000; margin: 3mm 0; }
      .items-table { width: 100%; border-collapse: collapse; margin: 2mm 0; }
      .items-table th { text-align: left; border-bottom: 1px solid #000; padding-bottom: 1mm; font-size: 8.5pt; }
      .items-table td { padding: 1mm 0; vertical-align: top; font-size: 8.5pt; }
      .item-name { width: 45%; }
      .item-qty { text-align: center; width: 15%; }
      .item-price { text-align: right; width: 20%; }
      .item-total { text-align: right; width: 20%; }
      .summary-row { display: flex; justify-content: space-between; margin-bottom: 1mm; font-size: 9pt; }
      .grand-total { font-size: 12pt; font-weight: bold; margin: 2mm 0; }
      .footer { margin-top: 5mm; text-align: center; font-size: 8.5pt; }
    `;

    const iframe = document.createElement('iframe');
    iframe.style.cssText = 'height:0;width:0;position:absolute;visibility:hidden;';
    iframe.setAttribute('srcdoc', `<html><head><title>Print Receipt</title><style>${printStyles}</style></head><body><div class="receipt-container">${printContents}</div></body></html>`);
    document.body.appendChild(iframe);

    iframe.onload = function () {
      try {
        iframe.contentWindow?.focus();
        iframe.contentWindow?.print();
      } catch (error) {
        console.error("Print error:", error);
      } finally {
        setTimeout(() => document.body.removeChild(iframe), 1000);
      }
    };
  };

  return (
    <div className="fixed inset-0 bg-black/90 backdrop-blur-sm flex items-center justify-center z-[100] p-4 animate-fade-in" onClick={onClose}>
      <div
        className="bg-slate-900 border border-white/10 rounded-2xl shadow-2xl w-full max-w-4xl h-[90vh] flex flex-col md:flex-row overflow-hidden animate-scale-in"
        onClick={e => e.stopPropagation()}
      >
        {/* Left Side: Actions & Details */}
        <div className="flex-1 p-6 md:p-8 flex flex-col border-b md:border-b-0 md:border-r border-white/10">
          <div className="flex justify-between items-start mb-6">
            <h2 className="text-2xl font-bold text-white flex items-center gap-3">
              <div className="p-3 bg-primary-500/20 rounded-xl">
                <ReceiptIcon className="h-6 w-6 text-primary-400" />
              </div>
              ใบเสร็จรับเงิน
            </h2>
            <button onClick={onClose} className="text-slate-400 hover:text-white transition-colors p-2 hover:bg-white/5 rounded-full">
              <X size={24} />
            </button>
          </div>

          <div className="space-y-6 flex-grow ">
            <div className="card bg-white/5 border border-white/5 p-4 rounded-xl space-y-3">
              <h3 className="text-sm font-semibold text-slate-300 uppercase tracking-wider">ข้อมูลรายการ</h3>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-xs text-slate-500 mb-1">เลขที่รายการ</p>
                  <p className="text-white font-mono">{transaction.id}</p>
                </div>
                <div>
                  <p className="text-xs text-slate-500 mb-1">วันที่</p>
                  <p className="text-white">{formattedDate}</p>
                </div>
                <div>
                  <p className="text-xs text-slate-500 mb-1">วิธีชำระเงิน</p>
                  <span className="px-2 py-1 rounded bg-primary-500/20 text-primary-300 text-xs border border-primary-500/30">
                    {displayPaymentMethod}
                  </span>
                </div>
                <div>
                  <p className="text-xs text-slate-500 mb-1">พนักงานขาย</p>
                  <p className="text-white">{transaction.cashierName}</p>
                </div>
              </div>
            </div>

            <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/20">
              <div className="flex justify-between items-center">
                <span className="text-emerald-400 font-medium">ยอดเงินรวมทั้งสิ้น</span>
                <span className="text-2xl font-bold text-emerald-400">฿{(transaction.totalAmount || 0).toFixed(2)}</span>
              </div>
            </div>
          </div>

          <div className="mt-6 flex flex-col gap-3">
            <button
              onClick={handlePrintWithIframe}
              className="btn btn-primary w-full py-4 text-lg shadow-lg shadow-primary-500/20 flex justify-center items-center gap-2"
            >
              <Printer className="h-5 w-5" />
              พิมพ์ใบเสร็จ
            </button>
            <button
              onClick={onClose}
              className="btn btn-secondary w-full justify-center"
            >
              ปิดหน้าต่าง
            </button>
          </div>
        </div>

        {/* Right Side: Paper Preview */}
        <div className="flex-1 bg-slate-950/50 p-8 flex items-center justify-center overflow-auto custom-scrollbar">
          <div className="relative shadow-2xl animate-slide-up-fade">
            {/* Realistic Paper Effect */}
            <div className="bg-white text-black w-[350px] min-h-[500px] p-6 rounded-sm relative z-10" style={{ boxShadow: '0 0 20px rgba(0,0,0,0.3)' }}>
              {/* Print Content Wrapper */}
              <div ref={receiptPrintContentRef}>
                {/* Header */}
                <div className="text-center mb-4">
                  <h3 className="text-xl font-bold mb-1">{storeName}</h3>
                  {address && (
                    <div className="flex items-center justify-center gap-1 text-xs text-gray-600 mb-0.5">
                      <span>{address}</span>
                    </div>
                  )}
                  {phone && (
                    <div className="flex items-center justify-center gap-1 text-xs text-gray-600">
                      <Phone size={10} className="inline" /> <span>{phone}</span>
                    </div>
                  )}
                </div>

                <div className="text-center border-t border-b border-dashed border-gray-300 py-2 mb-4">
                  <h4 className="font-bold text-sm">ใบเสร็จรับเงิน / ใบกำกับภาษีอย่างย่อ</h4>
                  <p className="text-[10px] text-gray-500 mt-1">TAX INV (ABB) / RECEIPT</p>
                </div>

                <div className="mb-3 text-[11px] leading-tight">
                  <div className="flex justify-between"><span>เลขที่:</span> <span className="font-mono">{transaction.id}</span></div>
                  <div className="flex justify-between"><span>วันที่:</span> <span>{formattedDate}</span></div>
                  <div className="flex justify-between"><span>พนักงาน:</span> <span>{transaction.cashierName}</span></div>
                </div>

                <table className="w-full text-[11px] mb-4">
                  <thead>
                    <tr className="border-b border-gray-800">
                      <th className="text-left py-1">รายการ</th>
                      <th className="text-center w-8">จำนวน</th>
                      <th className="text-right w-12">รวม</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-dashed divide-gray-200">
                    {Array.isArray(transaction.items) && transaction.items.map((item, idx) => (
                      <tr key={idx}>
                        <td className="py-1 pr-1">{item.name}</td>
                        <td className="text-center align-top py-1">{item.quantity}</td>
                        <td className="text-right align-top py-1">{(item.subtotal || item.price * item.quantity).toFixed(2)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>

                <div className="border-t border-gray-800 pt-2 mb-4 space-y-1 text-xs">
                  {/* Subtotals if needed, keeping it simple for now as per POS standard */}
                  <div className="flex justify-between font-bold text-sm pt-1 border-b border-dashed border-gray-300 pb-2">
                    <span>ยอดรวมสุทธิ</span>
                    <span>{(transaction.totalAmount || 0).toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between pt-1 text-[11px]">
                    <span>ชำระโดย:</span>
                    <span>{displayPaymentMethod}</span>
                  </div>
                  {transaction.paymentMethod === 'cash' && (
                    <>
                      <div className="flex justify-between text-[11px]">
                        <span>รับเงินสด:</span>
                        <span>{(transaction.cashReceived || 0).toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between text-[11px]">
                        <span>เงินทอน:</span>
                        <span>{(transaction.changeAmount || 0).toFixed(2)}</span>
                      </div>
                    </>
                  )}
                </div>

                <div className="text-center text-[10px] text-gray-500 mt-6">
                  <p>{thankYouMessage}</p>
                  <p className="mt-1 font-mono text-[8px]">POS V5 System</p>
                </div>
              </div>
            </div>

            {/* Paper bottom visual effect (simple fold shadow) */}
            <div className="absolute -bottom-2 inset-x-2 h-4 bg-white/50 blur-sm rounded-b-lg -z-10"></div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Receipt;


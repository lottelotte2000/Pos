import React, { useCallback, useMemo, useState } from 'react';
import { Transaction } from '../../types';
import { Printer, X, Receipt as ReceiptIcon } from 'lucide-react';
import { useSettings } from '../../context/SettingsContext';
import { formatMoney } from '../../utils/formatMoney';
import {
  PAYMENT_METHOD_NAMES,
  buildReceiptHtml,
  formatReceiptDate,
  printHtml,
  resolvePaperWidth,
} from '../../utils/receiptHtml';

interface ReceiptProps {
  transaction?: Transaction | null;
  onClose: () => void;
}

const MM_TO_PX = 96 / 25.4;
const PREVIEW_WIDTH_PX = 330; // on-screen width of the paper preview

const Receipt: React.FC<ReceiptProps> = ({ transaction, onClose }) => {
  const { receiptSettings } = useSettings();
  const [previewHeight, setPreviewHeight] = useState(600);

  const isValid = !!(transaction && transaction.id && transaction.date);

  // One HTML document for both the preview and the printer.
  const receiptHtml = useMemo(
    () => (isValid && transaction ? buildReceiptHtml(transaction, receiptSettings || {}) : ''),
    [isValid, transaction, receiptSettings]
  );

  const paperWidthPx = Number(resolvePaperWidth(receiptSettings?.paperWidth)) * MM_TO_PX;
  const previewScale = PREVIEW_WIDTH_PX / paperWidthPx;

  const measurePreview = useCallback((event: React.SyntheticEvent<HTMLIFrameElement>) => {
    const doc = event.currentTarget.contentDocument;
    if (!doc) return;
    const update = () => setPreviewHeight(Math.ceil(doc.body.getBoundingClientRect().height));
    update();
    doc.fonts?.ready.then(update).catch(() => undefined);
  }, []);

  if (!isValid || !transaction) {
    return null;
  }

  const formattedDate = formatReceiptDate(transaction.date);
  const displayPaymentMethod = PAYMENT_METHOD_NAMES[transaction.paymentMethod] || transaction.paymentMethod;

  const handlePrint = () => printHtml(receiptHtml);

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
                <span className="text-2xl font-bold text-emerald-400">฿{formatMoney(transaction.totalAmount)}</span>
              </div>
            </div>
          </div>

          <div className="mt-6 flex flex-col gap-3">
            <button
              onClick={handlePrint}
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

        {/* Right Side: Paper Preview (same HTML that gets printed) */}
        <div className="flex-1 bg-slate-950/50 p-8 flex items-start justify-center overflow-auto custom-scrollbar">
          <div
            className="relative bg-white rounded-sm overflow-hidden shrink-0 my-auto animate-slide-up-fade"
            style={{
              width: paperWidthPx * previewScale,
              height: previewHeight * previewScale,
              boxShadow: '0 0 20px rgba(0,0,0,0.3)',
            }}
          >
            <iframe
              title="ตัวอย่างใบเสร็จ"
              srcDoc={receiptHtml}
              onLoad={measurePreview}
              scrolling="no"
              style={{
                width: paperWidthPx,
                height: previewHeight,
                border: 0,
                transform: `scale(${previewScale})`,
                transformOrigin: 'top left',
                pointerEvents: 'none',
              }}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default Receipt;


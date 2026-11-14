import { CartItem } from '../types';
import { formatMoney } from './formatMoney';

/**
 * Builds the receipt as one self-contained HTML document.
 *
 * The same HTML is used for the on-screen preview (inside an iframe) and for
 * printing, so what the cashier sees is exactly what comes out of the printer.
 * It deliberately does NOT rely on Tailwind classes: the print iframe has no
 * access to the app's stylesheet, which is why the old printout lost its
 * columns and spacing.
 */

export type PaperWidth = '58' | '80';

export interface ReceiptPrintData {
  id?: string;
  date: string | Date;
  items: CartItem[];
  totalAmount: number;
  paymentMethod?: string;
  cashierName?: string;
  cashReceived?: number;
  changeAmount?: number;
}

export interface ReceiptPrintSettings {
  storeName?: string;
  address?: string;
  phone?: string;
  thankYouMessage?: string;
  paperWidth?: PaperWidth;
}

export const PAYMENT_METHOD_NAMES: Record<string, string> = {
  cash: 'เงินสด',
  credit_card: 'บัตรเครดิต',
  promptpay: 'พร้อมเพย์',
  transfer: 'โอนเงิน',
};

// Thermal paper is wider than what the print head can reach:
// 58 mm paper prints about 48 mm, 80 mm paper prints about 72 mm.
const PRINTABLE_WIDTH_MM: Record<PaperWidth, number> = { '58': 48, '80': 72 };

export const resolvePaperWidth = (value?: string): PaperWidth => (value === '80' ? '80' : '58');

const escapeHtml = (value: unknown): string =>
  String(value ?? '').replace(/[&<>"']/g, ch => (
    { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[ch] as string
  ));

export const formatReceiptDate = (value: string | Date): string => {
  const date = new Date(value);
  return `${date.toLocaleDateString('th-TH')} ${date.toLocaleTimeString('th-TH')}`;
};

const row = (label: string, value: string, className = ''): string =>
  `<div class="row ${className}"><span class="label">${label}</span><span class="value">${value}</span></div>`;

export function buildReceiptHtml(data: ReceiptPrintData, settings: ReceiptPrintSettings = {}): string {
  const paper = resolvePaperWidth(settings.paperWidth);
  const contentWidthMm = PRINTABLE_WIDTH_MM[paper];

  const storeName = settings.storeName || 'ร้านค้าของคุณ';
  const thankYou = settings.thankYouMessage || 'ขอบคุณที่ใช้บริการ';
  const paymentName = data.paymentMethod
    ? PAYMENT_METHOD_NAMES[data.paymentMethod] || data.paymentMethod
    : '';

  const items = Array.isArray(data.items) ? data.items : [];
  const itemRows = items.map(item => {
    const lineTotal = item.subtotal ?? item.price * item.quantity;
    return `<tr>
        <td class="name">${escapeHtml(item.name)}</td>
        <td class="qty">${escapeHtml(item.quantity)}</td>
        <td class="amount">${formatMoney(lineTotal)}</td>
      </tr>`;
  }).join('');

  const meta = [
    data.id ? row('เลขที่:', `<span class="mono">${escapeHtml(data.id)}</span>`) : '',
    row('วันที่:', escapeHtml(formatReceiptDate(data.date))),
    data.cashierName ? row('พนักงาน:', escapeHtml(data.cashierName)) : '',
  ].join('');

  const payment = [
    paymentName ? row('ชำระโดย:', escapeHtml(paymentName)) : '',
    data.paymentMethod === 'cash' ? row('รับเงินสด:', formatMoney(data.cashReceived)) : '',
    data.paymentMethod === 'cash' ? row('เงินทอน:', formatMoney(data.changeAmount)) : '',
  ].join('');

  const css = `
    @page { margin: 0; }
    * { box-sizing: border-box; }
    html, body { margin: 0; padding: 0; background: #fff; }
    body {
      font-family: Tahoma, 'Leelawadee UI', 'Noto Sans Thai', 'Sarabun', sans-serif;
      font-size: 12px; line-height: 1.35; color: #000;
      -webkit-print-color-adjust: exact; print-color-adjust: exact;
    }
    .receipt { width: ${contentWidthMm}mm; margin: 0 auto; padding: 2mm 0 5mm; }
    .center { text-align: center; }
    .store { font-size: 16px; font-weight: bold; line-height: 1.25; overflow-wrap: anywhere; }
    .sub { font-size: 11px; overflow-wrap: anywhere; }
    .pre { white-space: pre-line; }
    .nobr { white-space: nowrap; }
    .title { border-top: 1px dashed #000; border-bottom: 1px dashed #000; padding: 1.5mm 0; margin: 2mm 0; }
    .title .th { font-weight: bold; }
    .title .en { font-size: 10px; }
    .row { display: flex; justify-content: space-between; align-items: baseline; gap: 2mm; }
    .row .label { flex: none; }
    .row .value { text-align: right; min-width: 0; overflow-wrap: anywhere; }
    .meta { font-size: 11px; margin-bottom: 1.5mm; }
    .mono { font-family: Consolas, 'Courier New', monospace; }
    table.items { width: 100%; border-collapse: collapse; }
    table.items th { font-size: 11px; font-weight: bold; padding: 1mm 0; border-bottom: 1px solid #000; }
    table.items td { padding: 1mm 0; vertical-align: top; border-bottom: 1px dashed #999; }
    table.items tr:last-child td { border-bottom: none; }
    table.items .name { text-align: left; width: 100%; overflow-wrap: anywhere; }
    table.items .qty { text-align: center; width: 1%; white-space: nowrap; padding-left: 1.5mm; padding-right: 1.5mm; }
    table.items .amount { text-align: right; width: 1%; white-space: nowrap; }
    .totals { border-top: 1px solid #000; margin-top: 1mm; padding-top: 1.5mm; }
    .grand { font-size: 15px; font-weight: bold; padding-bottom: 1.5mm; margin-bottom: 1.5mm; border-bottom: 1px dashed #000; }
    .payment { font-size: 11px; }
    .footer { margin-top: 4mm; font-size: 11px; }
    .footer .brand { font-size: 9px; margin-top: 1mm; }
  `;

  return `<!DOCTYPE html>
<html lang="th">
<head>
<meta charset="utf-8">
<title>ใบเสร็จ ${escapeHtml(data.id || '')}</title>
<style>${css}</style>
</head>
<body>
  <div class="receipt">
    <div class="center">
      <div class="store">${escapeHtml(storeName)}</div>
      ${settings.address ? `<div class="sub pre">${escapeHtml(settings.address)}</div>` : ''}
      ${settings.phone ? `<div class="sub">โทร ${escapeHtml(settings.phone)}</div>` : ''}
    </div>

    <div class="title center">
      <div class="th"><span class="nobr">ใบเสร็จรับเงิน /</span> <span class="nobr">ใบกำกับภาษีอย่างย่อ</span></div>
      <div class="en">TAX INV (ABB) / RECEIPT</div>
    </div>

    <div class="meta">${meta}</div>

    <table class="items">
      <thead>
        <tr><th class="name">รายการ</th><th class="qty">จำนวน</th><th class="amount">รวม</th></tr>
      </thead>
      <tbody>${itemRows}</tbody>
    </table>

    <div class="totals">
      ${row('ยอดรวมสุทธิ', formatMoney(data.totalAmount), 'grand')}
      <div class="payment">${payment}</div>
    </div>

    <div class="footer center">
      <div class="pre">${escapeHtml(thankYou)}</div>
      <div class="brand">POS V5 System</div>
    </div>
  </div>
</body>
</html>`;
}

/**
 * Prints an HTML document through a hidden iframe, after its fonts are ready.
 */
export function printHtml(html: string): void {
  const iframe = document.createElement('iframe');
  iframe.setAttribute('aria-hidden', 'true');
  iframe.style.cssText = 'position:fixed;right:0;bottom:0;width:0;height:0;border:0;visibility:hidden;';

  let removed = false;
  const remove = () => {
    if (removed) return;
    removed = true;
    iframe.remove();
  };

  iframe.onload = async () => {
    const win = iframe.contentWindow;
    if (!win) return remove();
    try {
      await win.document.fonts?.ready;
      win.addEventListener('afterprint', () => setTimeout(remove, 500));
      win.focus();
      win.print();
    } catch (error) {
      console.error('Print error:', error);
      remove();
    } finally {
      // Safety net in case 'afterprint' never fires.
      setTimeout(remove, 60_000);
    }
  };

  iframe.srcdoc = html;
  document.body.appendChild(iframe);
}

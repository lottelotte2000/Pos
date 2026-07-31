import React, { useEffect, useRef, useState } from 'react';
import { ShoppingCart, CheckCircle, Gift, Banknote, Smartphone, CreditCard, Wifi } from 'lucide-react';
import { useCart } from '../context/CartContext';
import { useSettings } from '../context/SettingsContext';
import { useTheme } from '../context/ThemeContext';
import { DragonBallPowerUp } from '../components/common/DragonBallEffects';
import { CartItem, CartTab } from '../types';

// ─── Theme palette (รองรับโหมดมืด/สว่าง) ──────────────────────────────────────
type Pal = ReturnType<typeof getPal>;
function getPal(mode: 'dark' | 'light') {
  if (mode === 'light') {
    // จอลูกค้า: พื้นขาว ตัวอักษรดำ คอนทราสต์สูง (ให้ลูกค้าอ่านง่าย ไม่กลืนกัน)
    return {
      pageBg: '#ffffff',
      panel: '#ffffff',
      panelBorder: '#c8d0dc',
      row: '#eef2f8',
      rowBorder: '#d3dbe6',
      divider: '#d3dbe6',
      ink: '#0a0d12',       // ตัวอักษรหลัก = ดำ
      sub: '#1a2331',       // รอง = เข้มมาก
      muted: '#38424f',     // เทาเข้ม (เดิม #64748b กลืน → เข้มขึ้น)
      faint: '#525d6c',     // เลขลำดับ/หน่วย อ่านออกชัด (เดิม #94a3b8)
      thumbBg: '#eef2f8',
      thumbBorder: '#d3dbe6',
      glowOpacity: 0.03,
    };
  }
  return {
    pageBg: '#070b14',
    panel: 'rgba(0,0,0,0.35)',
    panelBorder: 'rgba(255,255,255,0.07)',
    row: 'rgba(255,255,255,0.04)',
    rowBorder: 'rgba(255,255,255,0.05)',
    divider: 'rgba(255,255,255,0.06)',
    ink: '#ffffff',
    sub: '#cbd5e1',
    muted: '#64748b',
    faint: '#475569',
    thumbBg: 'rgba(255,255,255,0.04)',
    thumbBorder: 'rgba(255,255,255,0.08)',
    glowOpacity: 0.1,
  };
}
// จอลูกค้าใช้สีตามโหมดมืด/สว่างของแอป (ให้สีเดียวกับหน้าหลัก)
const usePal = (): Pal => getPal(useTheme().mode);

// ─── Helpers ─────────────────────────────────────────────────────────────────

const LiveClock: React.FC = () => {
  const p = usePal();
  const [time, setTime] = useState(new Date());
  useEffect(() => {
    const t = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(t);
  }, []);
  return (
    <span className="font-mono text-lg tracking-widest" style={{ color: p.muted }}>
      {time.toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
    </span>
  );
};

const pmInfo = (method?: string) => {
  switch (method) {
    case 'cash':        return { label: 'เงินสด',      icon: <Banknote   size={22} />, color: '#10b981' };
    case 'promptpay':   return { label: 'พร้อมเพย์',   icon: <Smartphone size={22} />, color: '#3b82f6' };
    case 'credit_card': return { label: 'บัตรเครดิต', icon: <CreditCard size={22} />, color: '#a855f7' };
    default:            return { label: 'โอนเงิน',     icon: <Wifi       size={22} />, color: '#3b82f6' };
  }
};

// ─── Screens ──────────────────────────────────────────────────────────────────

/* Idle */
const IdleScreen: React.FC = () => {
  const { customerDisplaySettings } = useSettings();
  const p = usePal();
  return (
    <div className="flex flex-col items-center justify-center h-full text-center animate-fade-in px-12">
      {customerDisplaySettings?.idleImageUrl ? (
        <img
          src={customerDisplaySettings.idleImageUrl}
          alt="Promotion"
          className="max-w-full max-h-[70%] object-contain rounded-3xl shadow-2xl"
        />
      ) : (
        <>
          {/* Glow orb behind icon */}
          <div className="relative mb-12">
            <div
              className="absolute rounded-full blur-3xl opacity-25 pointer-events-none"
              style={{ inset: '-60%', backgroundColor: '#6366f1' }}
            />
            <div
              className="relative w-44 h-44 rounded-full flex items-center justify-center"
              style={{
                background: 'linear-gradient(135deg, rgba(99,102,241,0.25) 0%, rgba(139,92,246,0.25) 100%)',
                border: '1.5px solid rgba(99,102,241,0.35)',
                boxShadow: '0 0 60px rgba(99,102,241,0.2)',
              }}
            >
              <ShoppingCart size={76} style={{ color: '#818cf8' }} />
            </div>
          </div>

          <h1
            className="font-black tracking-tight mb-5"
            style={{ color: p.ink, fontSize: '5.5rem', lineHeight: 1, textShadow: '0 0 60px rgba(99,102,241,0.4)' }}
          >
            {customerDisplaySettings?.welcomeMessage || 'ยินดีต้อนรับ'}
          </h1>
          <p className="text-3xl font-light max-w-2xl" style={{ color: p.muted }}>
            {customerDisplaySettings?.secondaryMessage || 'พนักงานจะสแกนสินค้าให้คุณในไม่ช้า'}
          </p>
        </>
      )}
    </div>
  );
};

/* Active Cart */
const ActiveCartScreen: React.FC<{ items: CartItem[]; total: number }> = ({ items, total }) => {
  const scrollRef = useRef<HTMLDivElement>(null);
  const p = usePal();
  const totalQty = items.reduce((s, i) => s + i.quantity, 0);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' });
  }, [items]);

  return (
    <div className="flex gap-5 h-full">

      {/* ── Item list ── */}
      <div
        className="flex-1 flex flex-col overflow-hidden"
        style={{ background: p.panel, borderRadius: 24, border: `1px solid ${p.panelBorder}`, backdropFilter: 'blur(12px)' }}
      >
        {/* Column header */}
        <div
          className="flex-shrink-0 grid text-base font-semibold uppercase tracking-widest px-6 py-4"
          style={{ color: p.muted, borderBottom: `1px solid ${p.divider}`, gridTemplateColumns: '2.5rem 1fr auto' }}
        >
          <span>#</span>
          <span>สินค้า</span>
          <span>ราคา</span>
        </div>

        {/* Rows — min-h-0 เพื่อให้ scroll ภายในแทนที่จะดันช่องยอดรวมหลุด */}
        <div ref={scrollRef} className="flex-1 min-h-0 overflow-y-auto p-4 space-y-2 custom-scrollbar">
          {items.map((item, idx) => (
            <div
              key={`${item.id}-${idx}`}
              className="grid items-center gap-4 px-4 py-3 rounded-2xl animate-fade-in"
              style={{ gridTemplateColumns: '2.5rem auto 1fr auto', background: p.row, border: `1px solid ${p.rowBorder}` }}
            >
              {/* Row number */}
              <span className="text-lg font-bold text-center" style={{ color: p.faint }}>{idx + 1}</span>

              {/* Thumbnail */}
              {item.imageUrl ? (
                <img
                  src={item.imageUrl}
                  alt={item.name}
                  className="w-14 h-14 object-cover rounded-xl"
                  style={{ border: `1px solid ${p.thumbBorder}` }}
                />
              ) : (
                <div className="w-14 h-14 rounded-xl flex items-center justify-center" style={{ background: p.thumbBg }}>
                  <ShoppingCart size={20} style={{ color: p.faint }} />
                </div>
              )}

              {/* Name + price per unit */}
              <div className="min-w-0">
                <p className="text-2xl font-semibold truncate" style={{ color: p.ink }}>{item.name}</p>
                <p className="text-base mt-0.5" style={{ color: '#6366f1' }}>
                  {item.quantity} × ฿{item.price.toFixed(2)}
                </p>
              </div>

              {/* Subtotal */}
              <p className="text-3xl font-bold whitespace-nowrap" style={{ color: p.ink }}>
                ฿{(item.price * item.quantity).toFixed(2)}
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* ── Right panel ── */}
      <div className="w-72 flex-shrink-0 flex flex-col gap-4">

        {/* Item count */}
        <div className="flex-shrink-0 p-6 rounded-2xl text-center" style={{ background: p.panel, border: `1px solid ${p.panelBorder}` }}>
          <p className="text-lg mb-1" style={{ color: p.muted }}>จำนวน</p>
          <p className="font-black" style={{ color: p.ink, fontSize: '4rem', lineHeight: 1 }}>{totalQty}</p>
          <p className="text-base mt-1" style={{ color: p.faint }}>ชิ้น</p>
        </div>

        {/* Total — ใช้สีธีมหลัก (var --color-primary) โซลิด ตัวเลขขาว ให้ลูกค้าเห็นชัดที่สุด และสีตรงกับหน้าหลัก */}
        <div
          className="flex-1 rounded-2xl flex flex-col items-center justify-center text-center p-8"
          style={{
            background: 'var(--color-primary-600)',
            border: '2px solid var(--color-primary-300)',
            boxShadow: '0 12px 45px -6px var(--color-primary-500)',
          }}
        >
          <p className="text-2xl font-semibold mb-3 text-white" style={{ opacity: 0.92 }}>ยอดรวม</p>
          <p className="font-black leading-none text-white" style={{ fontSize: '4.75rem', textShadow: '0 3px 24px rgba(0,0,0,0.45)' }}>
            ฿{total.toFixed(2)}
          </p>
          <div className="w-16 h-1.5 rounded-full mt-5 bg-white/60" />
        </div>
      </div>
    </div>
  );
};

/* Confirming Payment */
const ConfirmingPaymentScreen: React.FC<{ tabData: CartTab }> = ({ tabData }) => {
  const pm = pmInfo(tabData.paymentMethod);
  const p = usePal();
  return (
    <div className="flex flex-col items-center justify-center h-full text-center p-8 animate-fade-in">

      {/* Payment method badge */}
      <div
        className="flex items-center gap-3 px-7 py-3 rounded-full text-xl font-semibold mb-8"
        style={{ background: `${pm.color}18`, border: `1px solid ${pm.color}55`, color: pm.color }}
      >
        {pm.icon}
        {pm.label}
      </div>

      <p className="text-2xl font-medium mb-3" style={{ color: p.muted }}>ยอดที่ต้องชำระ</p>
      <p className="font-black mb-10" style={{ color: p.ink, fontSize: '8rem', lineHeight: 1, textShadow: '0 0 60px rgba(59,130,246,0.25)' }}>
        ฿{tabData.total.toFixed(2)}
      </p>

      {tabData.paymentMethod === 'cash' && tabData.cashReceived != null && (
        <div className="w-full max-w-md space-y-3">
          <div className="flex justify-between items-center px-6 py-4 rounded-2xl" style={{ background: p.row, border: `1px solid ${p.panelBorder}` }}>
            <span className="text-xl" style={{ color: p.muted }}>รับเงินสด</span>
            <span className="text-2xl font-bold" style={{ color: p.ink }}>฿{tabData.cashReceived.toFixed(2)}</span>
          </div>
          <div className="flex justify-between items-center px-6 py-5 rounded-2xl" style={{ background: 'rgba(16,185,129,0.1)', border: '1px solid rgba(16,185,129,0.3)' }}>
            <span className="text-xl" style={{ color: p.sub }}>เงินทอน</span>
            <span className="font-black text-emerald-500" style={{ fontSize: '3rem', lineHeight: 1 }}>
              ฿{tabData.changeAmount?.toFixed(2) ?? '0.00'}
            </span>
          </div>
        </div>
      )}
    </div>
  );
};

/* Completed */
const CompletedScreen: React.FC<{ tabData: CartTab }> = ({ tabData }) => {
  const { customerDisplaySettings } = useSettings();
  const p = usePal();
  return (
    <div className="flex flex-col items-center justify-center h-full text-center p-8 animate-scale-in">
      {/* เอฟเฟกต์พลังธีม Dragon Ball ตอนชำระเงินเสร็จ (แสดงเฉพาะธีมนี้) */}
      <DragonBallPowerUp />

      {/* Success icon with glow */}
      <div className="relative mb-10">
        <div className="absolute rounded-full blur-3xl opacity-30 pointer-events-none" style={{ inset: '-70%', backgroundColor: '#10b981' }} />
        <div
          className="relative w-40 h-40 rounded-full flex items-center justify-center"
          style={{ background: 'rgba(16,185,129,0.15)', border: '2px solid rgba(16,185,129,0.4)', boxShadow: '0 0 60px rgba(16,185,129,0.2)' }}
        >
          <CheckCircle size={80} style={{ color: '#34d399' }} strokeWidth={1.5} />
        </div>
      </div>

      <h1 className="font-black tracking-tight mb-3" style={{ color: p.ink, fontSize: '6rem', lineHeight: 1, textShadow: '0 0 40px rgba(16,185,129,0.3)' }}>
        {customerDisplaySettings?.thankYouTitle || 'ขอบคุณ!'}
      </h1>
      <p className="text-2xl flex items-center gap-2 mb-10" style={{ color: '#6366f1' }}>
        <Gift size={22} />
        {customerDisplaySettings?.thankYouSubtitle || 'หวังว่าจะได้พบกันอีกครั้ง'}
      </p>

      {/* Summary */}
      <div className="w-full max-w-md space-y-3">
        <div className="flex justify-between items-center px-6 py-4 rounded-2xl" style={{ background: p.row, border: `1px solid ${p.panelBorder}` }}>
          <span className="text-xl" style={{ color: p.muted }}>ยอดรวมสุทธิ</span>
          <span className="text-3xl font-bold" style={{ color: '#10b981' }}>฿{tabData.total.toFixed(2)}</span>
        </div>
        {tabData.paymentMethod === 'cash' && (
          <>
            <div className="flex justify-between items-center px-6 py-4 rounded-2xl" style={{ background: p.row, border: `1px solid ${p.rowBorder}` }}>
              <span className="text-xl" style={{ color: p.muted }}>รับเงินสด</span>
              <span className="text-2xl font-semibold" style={{ color: p.ink }}>
                ฿{tabData.cashReceived?.toFixed(2) ?? '0.00'}
              </span>
            </div>
            <div className="flex justify-between items-center px-6 py-6 rounded-2xl" style={{ background: 'rgba(16,185,129,0.1)', border: '1px solid rgba(16,185,129,0.3)' }}>
              <span className="text-2xl font-semibold" style={{ color: p.sub }}>เงินทอน</span>
              <span className="font-black text-emerald-500" style={{ fontSize: '3.5rem', lineHeight: 1 }}>
                ฿{tabData.changeAmount?.toFixed(2) ?? '0.00'}
              </span>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

/* QR Payment */
const QrScreen: React.FC<{ url: string; amount: number; name: string }> = ({ url, amount, name }) => {
  const p = usePal();
  return (
    <div className="flex flex-col items-center justify-center h-full text-center animate-fade-in gap-8">

      {/* QR card (always white for scan reliability) */}
      <div className="relative p-6 rounded-3xl" style={{ background: '#fff', boxShadow: '0 0 80px rgba(59,130,246,0.25)' }}>
        <div className="absolute inset-6 rounded-xl overflow-hidden pointer-events-none z-10">
          <div
            style={{
              position: 'absolute', left: 0, right: 0, height: 3,
              background: 'linear-gradient(to right, transparent, #3b82f6, transparent)',
              animation: 'qrScan 2.5s ease-in-out infinite',
            }}
          />
        </div>
        <img src={url} alt="PromptPay QR" className="w-72 h-72 object-contain relative z-0" style={{ mixBlendMode: 'multiply' }} />
      </div>

      {/* Account name */}
      <div>
        <p className="text-3xl font-bold mb-1" style={{ color: p.ink }}>{name}</p>
        <p className="text-xl font-medium tracking-wide" style={{ color: '#3b82f6' }}>สแกน QR เพื่อชำระเงิน</p>
      </div>

      {/* Amount */}
      <div className="px-14 py-6 rounded-2xl" style={{ background: 'rgba(59,130,246,0.12)', border: '1px solid rgba(59,130,246,0.3)' }}>
        <p className="text-lg mb-1 font-medium" style={{ color: p.muted }}>ยอดชำระ</p>
        <p className="font-black" style={{ color: p.ink, fontSize: '5rem', lineHeight: 1, textShadow: '0 0 40px rgba(59,130,246,0.3)' }}>
          ฿{amount.toFixed(2)}
        </p>
      </div>
    </div>
  );
};

// ─── Main Page ────────────────────────────────────────────────────────────────

const CustomerDisplayPage: React.FC = () => {
  const { getActiveTabData } = useCart();
  const { customerDisplaySettings } = useSettings();
  const p = usePal();
  const activeTab = getActiveTabData();

  const [qrData, setQrData] = useState<{ url: string; amount: number; name: string } | null>(null);

  useEffect(() => {
    const load = () => {
      try {
        const stored = localStorage.getItem('latest_qr_data');
        if (stored) {
          const parsed = JSON.parse(stored);
          if (Date.now() - parsed.timestamp < 1000 * 60 * 5) {
            setQrData(parsed);
          } else {
            localStorage.removeItem('latest_qr_data');
            setQrData(null);
          }
        } else {
          setQrData(null);
        }
      } catch {
        setQrData(null);
      }
    };

    load();
    const onStorage = (e: StorageEvent) => { if (e.key === 'latest_qr_data') load(); };
    window.addEventListener('storage', onStorage);
    const poll = setInterval(load, 1000);
    return () => { window.removeEventListener('storage', onStorage); clearInterval(poll); };
  }, []);

  const renderContent = () => {
    if (qrData) return <QrScreen url={qrData.url} amount={qrData.amount} name={qrData.name} />;
    if (!activeTab || activeTab.items.length === 0) return <IdleScreen />;
    if (activeTab.status === 'confirming_payment') return <ConfirmingPaymentScreen tabData={activeTab} />;
    if (activeTab.status === 'completed') return <CompletedScreen tabData={activeTab} />;
    return <ActiveCartScreen items={activeTab.items} total={activeTab.total} />;
  };

  return (
    <div
      className="h-screen flex flex-col overflow-hidden relative select-none"
      style={{ fontFamily: 'inherit' }}
    >
      {/* พื้นหลังทึบของจอลูกค้า — วางเป็นชั้นล่างสุด (ใต้เลเยอร์ตกแต่งธีม -z-10)
          เพื่อให้เอฟเฟกต์ตกแต่งของธีม (ดอกฮิบานะ/ดาบ/คลื่นน้ำ) โผล่ขึ้นมาเหนือพื้นหลังได้ */}
      <div className="fixed inset-0 -z-20" style={{ backgroundColor: p.pageBg }} aria-hidden />

      {/* Background ambient glow */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div
          className="absolute rounded-full blur-3xl"
          style={{ width: 600, height: 600, top: '-15%', left: '-10%', opacity: p.glowOpacity, background: 'radial-gradient(circle, #6366f1, transparent 70%)' }}
        />
        <div
          className="absolute rounded-full blur-3xl"
          style={{ width: 500, height: 500, bottom: '-10%', right: '-5%', opacity: p.glowOpacity * 0.8, background: 'radial-gradient(circle, #3b82f6, transparent 70%)' }}
        />
      </div>

      {/* Top bar */}
      <header
        className="flex-shrink-0 flex items-center justify-between px-8 py-4 relative z-10"
        style={{ borderBottom: `1px solid ${p.divider}` }}
      >
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: 'linear-gradient(135deg, #6366f1, #3b82f6)' }}>
            <ShoppingCart size={16} className="text-white" />
          </div>
          <span className="font-bold text-xl tracking-tight" style={{ color: p.ink }}>
            {customerDisplaySettings?.welcomeMessage?.split(' ')[0] || 'POS'}
          </span>
        </div>

        <LiveClock />
      </header>

      {/* Content */}
      <main className="flex-1 overflow-hidden relative z-10 p-6">
        {renderContent()}
      </main>

      {/* Inline keyframe for QR scan animation */}
      <style>{`
        @keyframes qrScan {
          0%   { top: 0; opacity: 0; }
          10%  { opacity: 1; }
          90%  { opacity: 1; }
          100% { top: calc(100% - 3px); opacity: 0; }
        }
      `}</style>
    </div>
  );
};

export default CustomerDisplayPage;

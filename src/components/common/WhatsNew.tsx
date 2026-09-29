import React, { useEffect, useState } from 'react';
import { X, Sparkles } from 'lucide-react';

// เวอร์ชันของ "โน้ตอัปเดต" ปัจจุบัน — เปลี่ยนค่านี้ทุกครั้งที่ออกเวอร์ชันใหม่
// ระบบจะโชว์หน้าต่างนี้ครั้งเดียวหลังอัปเดต (จนกว่าผู้ใช้จะกดปิด)
const WHATS_NEW_VERSION = '1.2.7';

const CHANGES: { icon: string; title: string; desc: string }[] = [
  {
    icon: '🧾',
    title: 'แก้หน้าใบเสร็จค้าง/เด้ง error',
    desc: 'ร้านที่ตั้งเบอร์โทรไว้ในใบเสร็จ เมื่อกดดูใบเสร็จในหน้าบิลขายจะเจอหน้าจอ error — ตอนนี้เปิดดูและพิมพ์ใบเสร็จได้ตามปกติแล้ว',
  },
  {
    icon: '💾',
    title: 'ข้อมูลการขายปลอดภัยขึ้น',
    desc: 'แก้ปัญหาจอลูกค้าอาจบันทึกข้อมูลเก่าทับบิลที่เพิ่งขายไป และป้องกันไม่ให้หน้าตั้งค่าเริ่มต้นล้างข้อมูลร้านที่ใช้งานอยู่แล้ว',
  },
  {
    icon: '💰',
    title: 'ยอดเงินและเงินทอนแม่นยำขึ้น',
    desc: 'ปัดยอดรวมและเงินทอนเป็นทศนิยม 2 ตำแหน่งเสมอ ไม่มีเศษสตางค์เพี้ยนเมื่อสินค้ามีราคาเป็นทศนิยม',
  },
  {
    icon: '🛡️',
    title: 'แก้บั๊กและเพิ่มความเสถียร',
    desc: 'นำเข้าผู้ใช้จากไฟล์แจ้งรายการที่ไม่สำเร็จให้เห็นชัดเจน, แจ้งเตือนอัปเดตแสดงข้อความถูกต้องและปลอดภัยขึ้น, และเก็บรหัสผ่านแบบเข้ารหัสเท่านั้น',
  },
];

export const WhatsNew: React.FC = () => {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    try {
      if (localStorage.getItem('whatsnew_seen') !== WHATS_NEW_VERSION) setOpen(true);
    } catch {
      /* ignore */
    }
  }, []);

  const close = () => {
    try {
      localStorage.setItem('whatsnew_seen', WHATS_NEW_VERSION);
    } catch {
      /* ignore */
    }
    setOpen(false);
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[80] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
      <div
        className="w-full max-w-md rounded-2xl shadow-2xl overflow-hidden animate-scale-up"
        style={{ backgroundColor: 'var(--color-bg-card)', border: '1px solid var(--color-border)' }}
      >
        {/* Header */}
        <div className="relative p-6 pb-4" style={{ borderBottom: '1px solid var(--color-border)' }}>
          <button
            onClick={close}
            aria-label="ปิด"
            className="absolute top-4 right-4 p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 transition-colors"
          >
            <X size={20} />
          </button>
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl" style={{ background: 'var(--color-primary-500)' }}>
              <Sparkles size={22} className="text-white" />
            </div>
            <div>
              <h2 className="text-xl font-bold" style={{ color: 'var(--color-text-main)' }}>มีอะไรใหม่</h2>
              <p className="text-sm font-medium" style={{ color: 'var(--color-primary-400)' }}>เวอร์ชัน {WHATS_NEW_VERSION}</p>
            </div>
          </div>
        </div>

        {/* Body */}
        <div className="p-6 space-y-4 max-h-[60vh] overflow-y-auto custom-scrollbar">
          {CHANGES.map((c, i) => (
            <div key={i} className="flex gap-3">
              <span className="text-2xl leading-none flex-shrink-0">{c.icon}</span>
              <div>
                <p className="font-semibold" style={{ color: 'var(--color-text-main)' }}>{c.title}</p>
                <p className="text-sm mt-0.5 leading-relaxed" style={{ color: 'var(--color-text-muted)' }}>{c.desc}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Footer */}
        <div className="p-4" style={{ borderTop: '1px solid var(--color-border)' }}>
          <button
            onClick={close}
            className="w-full py-3 rounded-xl font-bold text-white transition-transform active:scale-95"
            style={{ background: 'var(--color-primary-600)' }}
          >
            รับทราบ
          </button>
        </div>
      </div>
    </div>
  );
};

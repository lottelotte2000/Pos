import React, { useEffect, useState } from 'react';
import { useTheme } from '../../context/ThemeContext';

export const ThemeDecorations: React.FC = () => {
  const { theme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return null;

  if (theme === 'christmas') {
    return <ChristmasDecorations />;
  }

  if (theme === 'songkran') {
    return <SongkranDecorations />;
  }

  if (theme === 'newyear') {
    return <NewYearDecorations />;
  }

  if (theme === 'dragonball') {
    return <DragonBallDecorations />;
  }

  if (theme === 'demonslayer') {
    return <DemonSlayerDecorations />;
  }

  return null;
};

// ดอกฮิบานะ (spider lily) สีฟ้า — 6 กลีบโค้งกลับ + เกสรยาวโค้งออก
const DsSpiderLily: React.FC<{ size: number }> = ({ size }) => (
  <svg width={size} height={size} viewBox="0 0 100 100" style={{ overflow: 'visible' }}>
    <defs>
      <radialGradient id="ds-lily-grad" cx="50%" cy="45%" r="60%">
        <stop offset="0%" stopColor="#cffafe" />
        <stop offset="55%" stopColor="#22d3ee" />
        <stop offset="100%" stopColor="#2563eb" />
      </radialGradient>
    </defs>
    {[0, 60, 120, 180, 240, 300].map((a) => (
      <g key={a} transform={`rotate(${a} 50 50)`}>
        {/* กลีบดอกโค้งกลับ */}
        <path d="M50 50 C 40 34, 41 19, 50 9 C 59 19, 60 34, 50 50 Z" fill="url(#ds-lily-grad)" opacity="0.92" />
        {/* เกสรยาวโค้งออก + ปลายกลม */}
        <path d="M50 47 C 57 27, 67 17, 76 12" fill="none" stroke="#67e8f9" strokeWidth="1.6" strokeLinecap="round" />
        <circle cx="76" cy="12" r="2.3" fill="#ecfeff" />
      </g>
    ))}
    <circle cx="50" cy="50" r="3.6" fill="#0ea5e9" />
  </svg>
);

// ดาบคาตานะ (สมจริงตามกายวิภาคดาบญี่ปุ่นจริง) — ใบดาบโค้ง + hamon + ด้ามพัน ito
const DsKatana: React.FC<{ length: number }> = ({ length }) => (
  <svg width={length} height={length * 0.2} viewBox="0 0 300 60" style={{ overflow: 'visible' }}>
    <defs>
      <linearGradient id="ds-steel" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stopColor="#f0fdff" />
        <stop offset="32%" stopColor="#a5f3fc" />
        <stop offset="62%" stopColor="#22d3ee" />
        <stop offset="100%" stopColor="#0e7490" />
      </linearGradient>
      <linearGradient id="ds-tsuka" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stopColor="#1e293b" />
        <stop offset="100%" stopColor="#0b1120" />
      </linearGradient>
    </defs>

    {/* ใบดาบโค้ง (blade) ปลายแหลม kissaki */}
    <path
      d="M92 22 C 160 15, 240 11, 286 10 L 297 13 L 288 17 C 242 19, 165 30, 96 34 Z"
      fill="url(#ds-steel)" stroke="#0e7490" strokeWidth="0.6"
    />
    {/* สันดาบ (shinogi) เส้นสว่าง */}
    <path d="M96 26 C 165 20, 240 16, 288 13" fill="none" stroke="#ffffff" strokeWidth="0.7" opacity="0.7" />
    {/* ลายชุบคม (hamon) เป็นคลื่นตามคมดาบ */}
    <path d="M100 31 q 14 -2 26 -3 q 9 3 20 -1 q 15 -3 28 -4 q 10 3 21 -2 q 17 -2 30 -4"
          fill="none" stroke="#ecfeff" strokeWidth="0.9" opacity="0.5" />

    {/* ปลอกคอดาบ (habaki) */}
    <rect x="85" y="20" width="8" height="18" rx="1.5" fill="#cbd5e1" stroke="#64748b" strokeWidth="0.5" />

    {/* การ์ด (tsuba) วงรีขอบทอง */}
    <ellipse cx="81" cy="29" rx="5.5" ry="18" fill="#0f172a" stroke="#facc15" strokeWidth="1.2" />
    <ellipse cx="81" cy="29" rx="2" ry="8" fill="#1e293b" />

    {/* ด้ามจับ (tsuka) */}
    <rect x="12" y="21" width="66" height="16" rx="4" fill="url(#ds-tsuka)" />
    {/* ลายพันเชือกด้าม (ito) ทรงข้าวหลามตัด */}
    {Array.from({ length: 7 }).map((_, i) => {
      const x = 16 + i * 8.5;
      return (
        <g key={i} stroke="#0e7490" strokeWidth="1.7" opacity="0.92">
          <line x1={x} y1="21" x2={x + 6.5} y2="37" />
          <line x1={x + 6.5} y1="21" x2={x} y2="37" />
        </g>
      );
    })}
    {/* เมนุกิ (menuki) ประดับกลางด้าม */}
    <circle cx="45" cy="29" r="3" fill="#facc15" stroke="#b45309" strokeWidth="0.5" />
    {/* ปลอกคอด้าม (fuchi) + ปลอกท้ายด้าม (kashira) */}
    <rect x="76" y="20" width="4" height="18" rx="1" fill="#334155" />
    <rect x="7" y="20" width="6" height="18" rx="2" fill="#334155" stroke="#0b1120" strokeWidth="0.5" />
  </svg>
);

const DemonSlayerDecorations = () => {
  // กลีบวิสทีเรีย (สีม่วง/ชมพู) ร่วงลงพร้อมส่ายไปมา
  const petals = Array.from({ length: 28 }).map((_, i) => ({
    id: `petal-${i}`,
    left: `${Math.random() * 100}vw`,
    size: Math.random() * 10 + 8,
    delay: `${Math.random() * 8}s`,
    duration: `${Math.random() * 6 + 7}s`,
    pink: Math.random() > 0.5,
  }));

  // ประกายไฟ/หยดน้ำลอยขึ้นจากขอบล่าง
  const embers = Array.from({ length: 18 }).map((_, i) => ({
    id: `ember-${i}`,
    left: `${Math.random() * 100}vw`,
    size: Math.random() * 6 + 4,
    delay: `${Math.random() * 5}s`,
    duration: `${Math.random() * 3 + 4}s`,
    teal: Math.random() > 0.4,
  }));

  // คลื่นสายน้ำไหลวน (arc) ลอยเบาๆ ตามมุมจอ
  const waves = [
    { id: 'w1', top: '12%', left: '4%', scale: 1, delay: '0s', dur: '9s' },
    { id: 'w2', top: '62%', left: '82%', scale: 1.3, delay: '1.5s', dur: '11s' },
    { id: 'w3', top: '78%', left: '10%', scale: 0.9, delay: '3s', dur: '10s' },
  ];

  return (
    <div className="fixed inset-0 pointer-events-none -z-10 overflow-hidden">
      {/* ออร่าสายน้ำกลางจอ */}
      <div
        className="absolute rounded-full blur-3xl animate-pulse-slow"
        style={{ width: 700, height: 700, top: '-22%', left: '50%', transform: 'translateX(-50%)', background: 'radial-gradient(circle, rgba(20,184,166,0.18), transparent 70%)' }}
      />
      <div
        className="absolute rounded-full blur-3xl animate-pulse-slow"
        style={{ width: 520, height: 520, bottom: '-16%', right: '-8%', background: 'radial-gradient(circle, rgba(236,72,153,0.14), transparent 70%)', animationDelay: '1.2s' }}
      />

      {/* คลื่นสายน้ำไหลวน */}
      {waves.map((w) => (
        <svg
          key={w.id}
          className="ds-wave"
          width="220"
          height="120"
          viewBox="0 0 220 120"
          style={{ top: w.top, left: w.left, transform: `scale(${w.scale})`, animation: `ds-wave-drift ${w.dur} ease-in-out ${w.delay} infinite`, opacity: 0.6 }}
        >
          <path d="M4 70 C 40 30, 70 30, 100 60 S 170 90, 216 50" fill="none" stroke="#22d3ee" strokeWidth="4" strokeLinecap="round" />
          <path d="M4 90 C 44 56, 76 56, 108 82 S 176 108, 216 74" fill="none" stroke="#2dd4bf" strokeWidth="3" strokeLinecap="round" opacity="0.7" />
        </svg>
      ))}

      {/* กลีบวิสทีเรียร่วง */}
      {petals.map((p) => (
        <div
          key={p.id}
          className="ds-petal"
          style={{
            left: p.left,
            top: '-8vh',
            width: p.size,
            height: p.size * 1.4,
            borderRadius: '80% 0 80% 0',
            background: p.pink
              ? 'linear-gradient(135deg, #f9a8d4, #db2777)'
              : 'linear-gradient(135deg, #c4b5fd, #7c3aed)',
            boxShadow: '0 0 6px rgba(196,132,252,0.5)',
            animation: `ds-petal-fall ${p.duration} linear ${p.delay} infinite`,
          }}
        />
      ))}

      {/* ประกายไฟ/หยดน้ำลอยขึ้น */}
      {embers.map((e) => (
        <div
          key={e.id}
          className="absolute rounded-full"
          style={{
            left: e.left,
            bottom: '-2vh',
            width: e.size,
            height: e.size,
            background: e.teal ? '#22d3ee' : '#f472b6',
            boxShadow: `0 0 10px ${e.teal ? '#14b8a6' : '#ec4899'}`,
            animation: `ds-ember ${e.duration} ease-out ${e.delay} infinite`,
          }}
        />
      ))}

      {/* ดอกฮิบานะสีฟ้า ลอยเรืองแสงตามมุมจอ */}
      {[
        { top: '13%', left: '7%', size: 74, delay: '0s' },
        { top: '66%', left: '86%', size: 92, delay: '1.4s' },
        { top: '82%', left: '15%', size: 60, delay: '0.7s' },
        { top: '20%', left: '89%', size: 66, delay: '2s' },
      ].map((f, i) => (
        <div
          key={`lily-${i}`}
          className="absolute animate-float"
          style={{ top: f.top, left: f.left, animationDelay: f.delay, filter: 'drop-shadow(0 0 8px rgba(34,211,238,0.6))', opacity: 0.85 }}
        >
          <DsSpiderLily size={f.size} />
        </div>
      ))}

      {/* ดาบนิจิรินไขว้ มุมล่างขวา */}
      <div className="absolute" style={{ bottom: '9%', right: '6%', width: 260, height: 130, opacity: 0.82, filter: 'drop-shadow(0 0 10px rgba(34,211,238,0.5))' }}>
        <div className="absolute" style={{ top: 45, left: 0, transformOrigin: 'center', transform: 'rotate(-20deg)' }}><DsKatana length={260} /></div>
        <div className="absolute" style={{ top: 45, left: 0, transformOrigin: 'center', transform: 'rotate(20deg)' }}><DsKatana length={260} /></div>
      </div>

      {/* ดาบลอยเดี่ยว มุมบนซ้าย */}
      <div className="absolute animate-float" style={{ top: '30%', left: '3%', transform: 'rotate(-32deg)', opacity: 0.7, filter: 'drop-shadow(0 0 8px rgba(103,232,249,0.5))', animationDelay: '1.1s' }}>
        <DsKatana length={190} />
      </div>

      {/* ลายตารางฮาโอริ (checkered) มุมล่างซ้าย — สีเขียว/ดำ */}
      <div
        className="absolute bottom-0 left-0 opacity-[0.12]"
        style={{
          width: 180,
          height: 180,
          backgroundImage:
            'linear-gradient(45deg, #0f766e 25%, transparent 25%, transparent 75%, #0f766e 75%), linear-gradient(45deg, #0f766e 25%, transparent 25%, transparent 75%, #0f766e 75%)',
          backgroundSize: '36px 36px',
          backgroundPosition: '0 0, 18px 18px',
          maskImage: 'linear-gradient(to top right, black, transparent 70%)',
          WebkitMaskImage: 'linear-gradient(to top right, black, transparent 70%)',
        }}
      />
      {/* ลายตารางมุมบนขวา — สีชมพู/ขาว (โทนวิสทีเรีย) */}
      <div
        className="absolute top-0 right-0 opacity-[0.12]"
        style={{
          width: 180,
          height: 180,
          backgroundImage:
            'linear-gradient(45deg, #db2777 25%, transparent 25%, transparent 75%, #db2777 75%), linear-gradient(45deg, #db2777 25%, transparent 25%, transparent 75%, #db2777 75%)',
          backgroundSize: '36px 36px',
          backgroundPosition: '0 0, 18px 18px',
          maskImage: 'linear-gradient(to bottom left, black, transparent 70%)',
          WebkitMaskImage: 'linear-gradient(to bottom left, black, transparent 70%)',
        }}
      />
    </div>
  );
};

// พิกัดวางดาวบนลูกแก้ว (viewBox 100×100) เรียงแบบดราก้อนบอลจริง 1–7 ดาว
// อ้างอิงลายจริง: 3=สามเหลี่ยม, 4=สี่เหลี่ยม, 5=ลูกเต๋าห้า, 6=กริด 2×3, 7=แถว 2-3-2
const DB_STAR_LAYOUTS: Record<number, Array<[number, number]>> = {
  1: [[50, 50]],
  2: [[37, 37], [63, 63]],
  3: [[37, 35], [63, 35], [50, 65]],
  4: [[34, 34], [66, 34], [34, 66], [66, 66]],
  5: [[29, 31], [71, 31], [50, 50], [29, 69], [71, 69]],
  6: [[31, 26], [69, 26], [31, 50], [69, 50], [31, 74], [69, 74]],
  7: [[32, 27], [68, 27], [24, 50], [50, 50], [76, 50], [32, 73], [68, 73]],
};
// ดาวยิ่งเยอะยิ่งย่อรัศมี เพื่อให้อยู่ในลูกแก้วพอดีและไม่ชนกัน (viewBox = เต็มลูก)
const DB_STAR_RADIUS: Record<number, number> = { 1: 16, 2: 13, 3: 12, 4: 12, 5: 11, 6: 10, 7: 9.5 };

// สร้างพิกัดดาว 5 แฉกรอบจุดศูนย์กลาง (cx,cy) รัศมี r
function dbStarPoints(cx: number, cy: number, r: number): string {
  const pts: string[] = [];
  for (let i = 0; i < 10; i++) {
    const rad = i % 2 === 0 ? r : r * 0.42;
    const ang = (-90 + i * 36) * (Math.PI / 180);
    pts.push(`${(cx + rad * Math.cos(ang)).toFixed(2)},${(cy + rad * Math.sin(ang)).toFixed(2)}`);
  }
  return pts.join(' ');
}

const DragonBallDecorations = () => {
  // ลูกแก้วพลังเรืองแสง (energy orbs) — เอฟเฟกต์พลังทั่วไป ลอยเบาๆ
  // กระจายตามจุดยึดทั่วจอ (แทนสุ่มอิสระ) เพื่อไม่ให้ลูกแก้วซ้อนทับกัน
  const anchors: Array<[number, number]> = [
    [12, 20], [50, 14], [87, 22],
    [24, 60], [63, 55], [88, 70],
    [40, 84],
  ];
  const shuffledAnchors = [...anchors].sort(() => Math.random() - 0.5);
  const orbs = Array.from({ length: 7 }).map((_, i) => {
    const [ax, ay] = shuffledAnchors[i];
    return {
      id: i,
      left: `${ax + (Math.random() * 8 - 4)}vw`, // เยื้องรอบจุดยึด ±4vw
      top: `${ay + (Math.random() * 8 - 4)}vh`,  // เยื้องรอบจุดยึด ±4vh
      size: Math.random() * 28 + 40,
      delay: `${Math.random() * 4}s`,
      duration: `${Math.random() * 3 + 4}s`,
      stars: i + 1, // 1–7 ดาว (นัยถึงลูกแก้วทั้ง 7)
    };
  });

  // ประกายพลัง (sparkles) กระจายทั่วจอ
  const sparkles = Array.from({ length: 36 }).map((_, i) => ({
    id: `spk-${i}`,
    left: `${Math.random() * 100}vw`,
    top: `${Math.random() * 100}vh`,
    size: Math.random() * 12 + 8,
    delay: `${Math.random() * 3}s`,
  }));

  // ลูกไฟพลัง (ki comets) พุ่งผ่านจอเป็นระยะ
  const comets = Array.from({ length: 5 }).map((_, i) => ({
    id: `cmt-${i}`,
    top: `${5 + Math.random() * 55}vh`,
    duration: `${Math.random() * 3 + 5}s`,
    delay: `${i * 2.4 + Math.random() * 1.5}s`,
  }));

  return (
    <div className="fixed inset-0 pointer-events-none z-[0] overflow-hidden">
      {/* ลูกไฟพลังพุ่งผ่านจอ */}
      {comets.map((c) => (
        <div
          key={c.id}
          className="db-comet"
          style={{ top: c.top, left: 0, animation: `db-comet ${c.duration} linear ${c.delay} infinite` }}
        />
      ))}
      {/* ออร่าพลังกลางจอ */}
      <div
        className="absolute rounded-full blur-3xl animate-pulse-slow"
        style={{ width: 700, height: 700, top: '-20%', left: '50%', transform: 'translateX(-50%)', background: 'radial-gradient(circle, rgba(249,115,22,0.18), transparent 70%)' }}
      />
      <div
        className="absolute rounded-full blur-3xl animate-pulse-slow"
        style={{ width: 500, height: 500, bottom: '-15%', right: '-8%', background: 'radial-gradient(circle, rgba(250,204,21,0.14), transparent 70%)', animationDelay: '1.2s' }}
      />

      {/* ลูกแก้วพลังเรืองแสง (ชั้นนอกลอย / ชั้นใน .db-orb เด้ง-กระพริบตอน hover) */}
      {orbs.map((orb) => (
        <div
          key={orb.id}
          className="absolute animate-float"
          style={{ left: orb.left, top: orb.top, animationDuration: orb.duration, animationDelay: orb.delay }}
        >
          <div
            className="db-orb rounded-full flex items-center justify-center"
            style={{
              width: `${orb.size}px`,
              height: `${orb.size}px`,
              background: 'radial-gradient(circle at 35% 30%, #fde68a 0%, #f97316 55%, #c2410c 100%)',
              boxShadow: '0 0 24px 6px rgba(249,115,22,0.45), inset 0 0 10px rgba(255,255,255,0.35)',
            }}
          >
            {/* ดาว 5 แฉกสีแดง เรียงตามลายดราก้อนบอลจริง (1–7 ดาว) */}
            <svg
              viewBox="0 0 100 100"
              style={{ width: `${orb.size * 0.95}px`, height: `${orb.size * 0.95}px`, overflow: 'visible' }}
            >
              {(DB_STAR_LAYOUTS[orb.stars] || []).map(([cx, cy], s) => (
                <polygon
                  key={s}
                  points={dbStarPoints(cx, cy, DB_STAR_RADIUS[orb.stars] || 14)}
                  fill="#c1121f"
                  stroke="#7a0a12"
                  strokeWidth={1.4}
                  strokeLinejoin="round"
                />
              ))}
            </svg>
          </div>
        </div>
      ))}

      {/* ประกายพลัง */}
      {sparkles.map((s) => (
        <div
          key={s.id}
          className="absolute animate-pulse-slow"
          style={{ left: s.left, top: s.top, fontSize: `${s.size}px`, color: '#fbbf24', opacity: 0.5, animationDelay: s.delay, textShadow: '0 0 8px rgba(251,191,36,0.8)' }}
        >
          ✦
        </div>
      ))}
    </div>
  );
};

const ChristmasDecorations = () => {
  // Generate random snowflakes - SCALED UP to 100
  const snowflakes = Array.from({ length: 150 }).map((_, i) => ({
    id: i,
    left: `${Math.random() * 100}vw`,
    animationDuration: `${Math.random() * 15 + 10}s`,
    animationDelay: `${Math.random() * 10}s`,
    opacity: Math.random() * 0.2 + 0.1,
    size: Math.random() * 12 + 6,
  }));

  // Stars for twinkling background
  const stars = Array.from({ length: 50 }).map((_, i) => ({
    id: `star-${i}`,
    left: `${Math.random() * 100}vw`,
    top: `${Math.random() * 100}vh`,
    animationDelay: `${Math.random() * 3}s`,
    size: Math.random() * 3 + 1,
  }));

  return (
    <div className="fixed inset-0 pointer-events-none z-[0] overflow-hidden">
      {/* Stars */}
      {stars.map((star) => (
        <div
          key={star.id}
          className="absolute bg-white rounded-full animate-pulse-slow"
          style={{
            left: star.left,
            top: star.top,
            width: `${star.size}px`,
            height: `${star.size}px`,
            opacity: 0.3
          }}
        />
      ))}

      {/* Snowflakes */}
      {snowflakes.map((flake) => (
        <div
          key={flake.id}
          className="absolute text-white animate-fall"
          style={{
            left: flake.left,
            top: -20,
            fontSize: `${flake.size}px`,
            opacity: flake.opacity,
            animationDuration: flake.animationDuration,
            animationDelay: flake.animationDelay,
            textShadow: '0 0 5px rgba(255,255,255,0.8)'
          }}
        >
          ❄
        </div>
      ))}

      {/* Santa Flying - Bigger and slower */}
      <div className="absolute top-10 -right-40 animate-fly-santa text-8xl opacity-10 drop-shadow-2xl z-50">
        🎅🛷🦌✨
      </div>

      {/* Decorations */}
      <div className="absolute bottom-4 left-10 text-8xl animate-bounce-slow drop-shadow-2xl opacity-10">
        🦌
      </div>
      <div className="absolute bottom-4 right-10 text-8xl drop-shadow-2xl animate-pulse-slow opacity-10">
        🎄
      </div>
      <div className="absolute bottom-20 left-40 text-6xl animate-swing drop-shadow-2xl opacity-10 delay-1000">
        🔔
      </div>
      <div className="absolute top-20 right-20 text-6xl animate-swing drop-shadow-2xl opacity-10 delay-500 origin-top">
        🎁
      </div>
    </div>
  );
};

const SongkranDecorations = () => {
  // Generate random water drops - SCALED UP
  const drops = Array.from({ length: 120 }).map((_, i) => ({
    id: i,
    left: `${Math.random() * 100}vw`,
    animationDuration: `${Math.random() * 3 + 2}s`,
    animationDelay: `${Math.random() * 2}s`,
    size: Math.random() > 0.5 ? 24 : 16 // Varied size
  }));

  return (
    <div className="fixed inset-0 pointer-events-none z-[0] overflow-hidden">
      {/* Water Splashes / Drops */}
      {drops.map((drop) => (
        <div
          key={drop.id}
          className="absolute text-cyan-300 opacity-20 animate-rain"
          style={{
            left: drop.left,
            top: -30,
            fontSize: `${drop.size}px`,
            animationDuration: drop.animationDuration,
            animationDelay: drop.animationDelay,
          }}
        >
          💧
        </div>
      ))}

      {/* Big Splash Effect (Static large drops opacity) */}
      <div className="absolute top-1/4 left-1/4 text-9xl opacity-10 animate-pulse">💦</div>
      <div className="absolute top-3/4 right-1/4 text-9xl opacity-10 animate-pulse delay-700">💦</div>

      {/* Elements */}
      <div className="absolute bottom-10 left-10 text-8xl animate-wiggle drop-shadow-2xl opacity-10">
        🔫
      </div>
      <div className="absolute bottom-32 left-24 text-6xl animate-bounce delay-500 drop-shadow-xl opacity-10">
        🧴
      </div>

      <div className="absolute bottom-10 right-10 text-8xl animate-float drop-shadow-2xl opacity-10">
        🥣🌸
      </div>

      <div className="absolute bottom-16 left-1/2 -translate-x-1/2 text-9xl drop-shadow-2xl opacity-10">
        🛕
      </div>

      <div className="absolute top-0 right-10 text-7xl animate-swing origin-top drop-shadow-xl filter hue-rotate-15 opacity-10">
        🏵️
      </div>
      <div className="absolute top-0 left-10 text-7xl animate-swing origin-top drop-shadow-xl delay-1000 opacity-10">
        🏵️
      </div>
    </div>
  );
};

const NewYearDecorations = () => {
  // Extensive Confetti
  const confetti = Array.from({ length: 150 }).map((_, i) => ({
    id: i,
    left: `${Math.random() * 100}vw`,
    color: ['#FFD700', '#C0C0C0', '#F59E0B', '#FFFFFF', '#EC4899', '#3B82F6'][Math.floor(Math.random() * 6)],
    animationDuration: `${Math.random() * 4 + 3}s`,
    animationDelay: `${Math.random() * 5}s`,
    rotation: Math.random() * 360,
    width: Math.random() * 8 + 4,
    height: Math.random() * 12 + 6,
  }));

  return (
    <div className="fixed inset-0 pointer-events-none z-[0] overflow-hidden">
      {/* Fireworks simulated via CSS gradients - simplistic but effective */}
      <div className="absolute top-20 left-1/4 w-4 h-4 rounded-full bg-yellow-500 animate-ping opacity-30 duration-1000"></div>
      <div className="absolute top-40 right-1/4 w-6 h-6 rounded-full bg-pink-500 animate-ping opacity-30 delay-500 duration-1000"></div>
      <div className="absolute top-10 left-1/2 w-4 h-4 rounded-full bg-blue-500 animate-ping opacity-30 delay-200 duration-1000"></div>

      {confetti.map((c) => (
        <div
          key={c.id}
          className="absolute animate-fall-rotate shadow-sm opacity-30"
          style={{
            left: c.left,
            top: -20,
            backgroundColor: c.color,
            width: `${c.width}px`,
            height: `${c.height}px`,
            animationDuration: c.animationDuration,
            animationDelay: c.animationDelay,
            transform: `rotate(${c.rotation}deg)`
          }}
        />
      ))}

      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-[10rem] opacity-5 animate-pulse select-none pointer-events-none font-bold text-white tracking-widest">
        2026
      </div>

      <div className="absolute top-10 left-10 text-8xl animate-bounce text-yellow-500 drop-shadow-2xl opacity-20">
        🎉
      </div>
      <div className="absolute top-10 right-10 text-8xl animate-pulse delay-75 text-amber-400 drop-shadow-2xl opacity-20">
        🥂
      </div>
      <div className="absolute bottom-10 right-10 text-8xl animate-bounce delay-1000 text-white drop-shadow-2xl opacity-20">
        🎆
      </div>
    </div>
  );
};

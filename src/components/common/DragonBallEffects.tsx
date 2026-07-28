import React from 'react';
import { useTheme } from '../../context/ThemeContext';

/**
 * ออร่าพลังตอนชำระเงินสำเร็จ (เฉพาะธีม Dragon Ball)
 * เป็นออร่าเรืองแสงรอบขอบจอ + ประกายพลังลอยขึ้นจากขอบซ้าย-ขวา
 * ออกแบบให้ "ไม่บังตัวเลขตรงกลาง" — เอฟเฟกต์อยู่รอบขอบเท่านั้น
 * (งานต้นฉบับสไตล์พลัง ไม่มีตัวละคร/ทรัพย์สินลิขสิทธิ์)
 */
export const DragonBallPowerUp: React.FC = () => {
  const { theme } = useTheme();
  if (theme !== 'dragonball') return null;

  // ประกายพลังลอยขึ้นจากขอบซ้าย/ขวา (เว้นกลางจอไว้)
  const sparks = Array.from({ length: 20 }).map((_, i) => {
    const nearLeft = i % 2 === 0;
    const left = nearLeft ? Math.random() * 24 : 76 + Math.random() * 24;
    return {
      id: i,
      left: `${left}%`,
      size: Math.random() * 10 + 6,
      delay: `${Math.random() * 1}s`,
      dur: `${Math.random() * 0.8 + 1.1}s`,
      gold: Math.random() > 0.5,
    };
  });

  return (
    <div className="fixed inset-0 pointer-events-none z-[60] overflow-hidden">
      {/* ออร่าพลังรอบขอบจอ เต้นเป็นจังหวะ */}
      <div className="absolute inset-0" style={{ animation: 'db-aura-pulse 1.1s ease-in-out infinite' }} />

      {/* ประกายพลังลอยขึ้นจากขอบซ้าย-ขวา */}
      {sparks.map((s) => (
        <div
          key={s.id}
          className="absolute rounded-full"
          style={{
            left: s.left,
            bottom: '-24px',
            width: s.size,
            height: s.size,
            background: s.gold ? '#facc15' : '#fb923c',
            boxShadow: `0 0 12px ${s.gold ? '#facc15' : '#f97316'}`,
            animation: `db-rise ${s.dur} ease-out ${s.delay} infinite`,
          }}
        />
      ))}
    </div>
  );
};

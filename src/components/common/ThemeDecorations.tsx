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

  return null;
};

const DragonBallDecorations = () => {
  // ลูกแก้วพลังเรืองแสง (energy orbs) — เอฟเฟกต์พลังทั่วไป ลอยเบาๆ
  const orbs = Array.from({ length: 7 }).map((_, i) => ({
    id: i,
    left: `${8 + Math.random() * 84}vw`,
    top: `${10 + Math.random() * 78}vh`,
    size: Math.random() * 40 + 36,
    delay: `${Math.random() * 4}s`,
    duration: `${Math.random() * 3 + 4}s`,
    stars: i + 1, // 1–7 ดาว (นัยถึงลูกแก้วทั้ง 7)
  }));

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
            <span className="text-red-700 font-black leading-none" style={{ fontSize: `${orb.size * 0.32}px`, textShadow: '0 0 2px rgba(255,255,255,0.6)' }}>
              {'★'.repeat(Math.min(orb.stars, 3))}
            </span>
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

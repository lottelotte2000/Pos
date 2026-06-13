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

  return null;
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

import React, { useEffect, useState } from 'react';

interface SplashScreenProps {
  onComplete: () => void;
}

const SplashScreen: React.FC<SplashScreenProps> = ({ onComplete }) => {
  const [exiting, setExiting] = useState(false);

  useEffect(() => {
    // Časování sekvence:
    // 0s: Start
    // 3.5s: Začátek odchodu (fade out)
    // 4.5s: Konec (odstranění komponenty)
    
    const exitTimer = setTimeout(() => {
      setExiting(true);
    }, 3500);

    const completeTimer = setTimeout(() => {
      onComplete();
    }, 4500);

    return () => {
      clearTimeout(exitTimer);
      clearTimeout(completeTimer);
    };
  }, [onComplete]);

  return (
    <div 
      className={`fixed inset-0 z-[60] flex flex-col items-center justify-center bg-[#020305] transition-opacity duration-1000 ${
        exiting ? 'opacity-0 pointer-events-none' : 'opacity-100'
      }`}
    >
      {/* 1. Horní světelný efekt (God Rays) */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[500px] bg-gradient-radial from-gold-400/20 to-transparent opacity-0 animate-fade-in duration-1000 blur-[60px] pointer-events-none" />
      <div className="absolute top-[-100px] left-1/2 -translate-x-1/2 w-[2px] h-[300px] bg-gold-400/50 blur-sm rotate-45 pointer-events-none" />
      <div className="absolute top-[-100px] left-1/2 -translate-x-1/2 w-[2px] h-[300px] bg-gold-400/50 blur-sm -rotate-45 pointer-events-none" />

      {/* Kontejner pro texty */}
      <div className="relative z-10 text-center flex flex-col items-center space-y-2">
        
        {/* MY CARDS */}
        <div className="flex items-center gap-2 opacity-0 animate-slide-up-fade" style={{ animationDelay: '500ms', animationFillMode: 'forwards' }}>
          <span className="text-white font-serif text-3xl md:text-5xl tracking-widest font-bold">MY</span>
          <span className="text-gold-400 font-serif text-3xl md:text-5xl tracking-widest font-bold">CARDS</span>
        </div>

        {/* DARUJTE */}
        <div className="pt-2 opacity-0 animate-slide-up-fade" style={{ animationDelay: '1000ms', animationFillMode: 'forwards' }}>
           <h2 className="text-white font-display text-4xl md:text-6xl tracking-[0.1em] font-medium">
             DARUJTE
           </h2>
        </div>

        {/* Linka */}
        <div className="w-0 h-[1px] bg-gradient-to-r from-transparent via-gold-400 to-transparent my-4 animate-expand-width" style={{ animationDelay: '1500ms', animationFillMode: 'forwards' }}></div>

        {/* VZPOMÍNKY */}
        <div className="opacity-0 animate-slide-up-fade" style={{ animationDelay: '1800ms', animationFillMode: 'forwards' }}>
          <h1 className="text-transparent bg-clip-text bg-gradient-to-b from-gold-100 via-gold-300 to-gold-600 font-display text-5xl md:text-7xl font-bold tracking-wider text-glow">
            VZPOMÍNKY
          </h1>
        </div>

      </div>

      {/* Jemné částice v pozadí (simulace prachu ve světle) */}
      <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/stardust.png')] opacity-10 animate-pulse"></div>
    </div>
  );
};

export default SplashScreen;
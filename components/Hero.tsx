import React from 'react';
import { ChevronDown } from 'lucide-react';

const Hero: React.FC = () => {
  const scrollToEditor = () => {
    document.getElementById('editor')?.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <section className="relative w-full min-h-screen flex flex-col items-center justify-start overflow-hidden bg-navy-950 pt-32 pb-0">
      
      {/* Background Ambience */}
      <div className="absolute top-0 left-0 w-full h-full pointer-events-none">
         <div className="absolute top-[-20%] left-[20%] w-[60%] h-[60%] bg-gold-500/5 rounded-full blur-[120px] animate-pulse" style={{ animationDuration: '4s' }}></div>
         <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-blue-900/5 rounded-full blur-[100px]"></div>
         <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-[0.03]"></div>
      </div>

      <div className="container mx-auto px-4 relative z-10 flex flex-col items-center text-center">
        
        {/* Main Content */}
        <div className="mb-12 space-y-6 max-w-4xl">
          <div 
            className="inline-block border border-gold-500/20 bg-gold-500/5 backdrop-blur-sm rounded-full px-6 py-2 mb-4 opacity-0 animate-slide-up-fade"
            style={{ animationDelay: '0.2s', animationFillMode: 'forwards' }}
          >
             <span className="text-gold-400 text-xs font-bold tracking-[0.2em] uppercase">Originální dárek pro každého</span>
          </div>
          
          <h1 
            className="text-5xl md:text-7xl lg:text-8xl font-display font-bold text-white leading-tight tracking-tight opacity-0 animate-slide-up-fade"
            style={{ animationDelay: '0.4s', animationFillMode: 'forwards' }}
          >
            Darujte <br/>
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-gold-300 via-gold-400 to-gold-300 text-glow">Vzpomínky</span>
          </h1>
          
          <p 
            className="text-gray-400 text-lg md:text-xl font-light tracking-wide max-w-2xl mx-auto leading-relaxed opacity-0 animate-slide-up-fade"
            style={{ animationDelay: '0.6s', animationFillMode: 'forwards' }}
          >
            Překvapte rodinu i přátele balíčkem karet s vašimi společnými fotkami. Ideální k narozeninám, Vánocům nebo jen tak pro radost ze hry.
          </p>

          <div 
            className="flex flex-col md:flex-row gap-6 justify-center items-center pt-8 opacity-0 animate-slide-up-fade"
            style={{ animationDelay: '0.8s', animationFillMode: 'forwards' }}
          >
            <button 
              onClick={scrollToEditor}
              className="bg-gold-500 text-navy-950 px-12 py-4 font-bold tracking-[0.1em] text-sm uppercase hover:bg-gold-400 transition-all shadow-[0_0_30px_rgba(212,175,55,0.4)] hover:shadow-[0_0_50px_rgba(212,175,55,0.6)] hover:-translate-y-1 rounded-sm"
            >
              Navrhnout balíček
            </button>
          </div>
        </div>

      </div>

      {/* Full Width Hero Image */}
      <div 
        className="relative w-full mt-4 z-10 opacity-0 animate-fade-in"
        style={{ animationDelay: '1s', animationFillMode: 'forwards', animationDuration: '1.5s' }}
      >
           <img 
             src="https://web2.itnahodinu.cz/karty/a.jpeg" 
             alt="Vlastní karty - ukázka" 
             className="w-full h-auto object-cover opacity-100 mask-image-b-transparent min-h-[300px]"
           />
           
           {/* Gradient pro plynulý přechod do pozadí dole */}
           <div className="absolute inset-x-0 bottom-0 h-32 md:h-64 bg-gradient-to-t from-navy-950 via-navy-950/60 to-transparent"></div>
           
           {/* Jemný overlay */}
           <div className="absolute inset-0 bg-navy-900/10 mix-blend-overlay"></div>
      </div>

      {/* Scroll Indicator */}
      <div 
        className="absolute bottom-8 left-1/2 -translate-x-1/2 animate-bounce text-gold-500/50 z-20 opacity-0 animate-fade-in"
        style={{ animationDelay: '2s', animationFillMode: 'forwards' }}
      >
        <ChevronDown size={32} strokeWidth={1} />
      </div>
      
    </section>
  );
};

export default Hero;
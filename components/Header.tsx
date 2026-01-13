import React, { useState, useEffect } from 'react';
import { Menu, X, ShoppingBag } from 'lucide-react';

const Header: React.FC = () => {
  const [isScrolled, setIsScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <header className={`fixed top-0 w-full z-50 transition-all duration-500 border-b animate-fade-in-down ${isScrolled ? 'bg-navy-950/80 backdrop-blur-md border-white/5 py-3' : 'bg-transparent border-transparent py-6'}`}>
      <div className="container mx-auto px-6 flex justify-between items-center">
        
        {/* Left Nav */}
        <nav className="hidden md:flex gap-8 items-center w-1/3">
          <a href="#editor" className="text-gray-400 hover:text-gold-300 text-xs tracking-[0.2em] uppercase font-medium transition-colors">Vytvořit</a>
          <a href="#process" className="text-gray-400 hover:text-gold-300 text-xs tracking-[0.2em] uppercase font-medium transition-colors">Jak to funguje</a>
        </nav>

        {/* Logo - Centered */}
        <div className="w-1/3 flex justify-center">
          <div className="flex flex-col items-center group cursor-pointer">
            <h1 className="text-2xl font-display font-bold tracking-[0.15em] text-white group-hover:text-gold-400 transition-colors">
              MY<span className="text-gold-400">CARDS</span>
            </h1>
            <div className="h-[1px] w-12 bg-gold-500/50 mt-1 group-hover:w-24 transition-all duration-500"></div>
          </div>
        </div>

        {/* Right Nav / Actions */}
        <div className="w-1/3 flex justify-end items-center gap-6">
           <a href="#contact" className="hidden md:block text-gray-400 hover:text-gold-300 text-xs tracking-[0.2em] uppercase font-medium transition-colors">Kontakt</a>
           <button className="text-white hover:text-gold-400 transition-colors relative">
             <ShoppingBag size={20} strokeWidth={1.5} />
             <span className="absolute -top-1 -right-1 flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-gold-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-gold-500"></span>
              </span>
           </button>
           
           {/* Mobile Toggle */}
           <button 
            className="md:hidden text-white"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          >
            {mobileMenuOpen ? <X /> : <Menu />}
          </button>
        </div>

      </div>

      {/* Mobile Menu */}
      {mobileMenuOpen && (
        <div className="md:hidden absolute top-full left-0 w-full bg-navy-950 border-t border-white/10 p-8 flex flex-col gap-6 shadow-2xl animate-fade-in-down">
            <a href="#editor" className="text-white text-center text-lg font-display tracking-widest" onClick={() => setMobileMenuOpen(false)}>Vytvořit</a>
            <a href="#process" className="text-gray-400 text-center text-sm uppercase tracking-widest" onClick={() => setMobileMenuOpen(false)}>Jak to funguje</a>
            <a href="#contact" className="text-gray-400 text-center text-sm uppercase tracking-widest" onClick={() => setMobileMenuOpen(false)}>Kontakt</a>
        </div>
      )}
    </header>
  );
};

export default Header;
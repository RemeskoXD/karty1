import React from 'react';
import { Facebook, Twitter, Instagram, ShieldCheck } from 'lucide-react';

const Footer: React.FC = () => {
  return (
    <footer className="bg-navy-900 border-t border-white/10 pt-16 pb-8">
      <div className="container mx-auto px-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-12 mb-12">
          
          <div className="md:col-span-2">
            <div className="flex items-center gap-1 mb-6">
               <span className="text-xl font-bold tracking-widest text-white">MY</span>
               <span className="text-xl font-bold tracking-widest text-gold-500 font-serif">CARDS</span>
            </div>
            <p className="text-gray-400 max-w-sm mb-6">
              Přinášíme eleganci do světa karetních her. Každý balíček je unikátní umělecké dílo, vytvořené vámi, vyrobené mistry tisku.
            </p>
          </div>

          <div>
            <h4 className="text-white font-bold uppercase tracking-widest mb-6 text-sm">Rychlé odkazy</h4>
            <ul className="space-y-3">
              <li><a href="#" className="text-gray-400 hover:text-gold-500 transition-colors text-sm">Obchodní podmínky</a></li>
              <li><a href="#" className="text-gray-400 hover:text-gold-500 transition-colors text-sm">Ceník</a></li>
              <li><a href="#" className="text-gray-400 hover:text-gold-500 transition-colors text-sm">Doprava a platba</a></li>
              <li><a href="#" className="text-gray-400 hover:text-gold-500 transition-colors text-sm">Kontakt</a></li>
            </ul>
          </div>

          <div>
            <h4 className="text-white font-bold uppercase tracking-widest mb-6 text-sm">Kontakt</h4>
            <p className="text-gray-400 text-sm mb-2">info@mycards.cz</p>
            <p className="text-gray-400 text-sm mb-6">+420 123 456 789</p>
            <div className="flex gap-4">
              <a href="#" className="text-gray-400 hover:text-gold-500 transition-colors"><Facebook size={20} /></a>
              <a href="#" className="text-gray-400 hover:text-gold-500 transition-colors"><Twitter size={20} /></a>
              <a href="#" className="text-gray-400 hover:text-gold-500 transition-colors"><Instagram size={20} /></a>
            </div>
          </div>
        </div>

        <div className="border-t border-white/5 pt-8 flex flex-col md:flex-row justify-between items-center gap-4">
          <p className="text-gray-600 text-xs">© 2024 MyCards.cz. Všechna práva vyhrazena.</p>
          <div className="flex items-center gap-4">
             <a href="?mode=admin" className="flex items-center gap-1 text-gray-500 hover:text-gold-500 text-xs transition-colors cursor-pointer" title="Vstup pro správce">
                <ShieldCheck size={12} /> Administrace
             </a>
             <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-green-500"></div>
                <span className="text-gray-500 text-xs">Systém plně funkční</span>
             </div>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
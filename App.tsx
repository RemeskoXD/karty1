import React, { useState, useEffect } from 'react';
import Header from './components/Header';
import Hero from './components/Hero';
import CardEditor from './components/CardEditor';
import Footer from './components/Footer';
import AdminDashboard from './components/AdminDashboard';
import { Camera, Wand2, Truck } from 'lucide-react';

function App() {
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    // Kontrola URL parametrů místo hashe
    const checkMode = () => {
      const params = new URLSearchParams(window.location.search);
      const mode = params.get('mode');
      setIsAdmin(mode === 'admin');
    };
    
    checkMode();
  }, []);

  if (isAdmin) {
    return <AdminDashboard />;
  }

  return (
    <div className="min-h-screen bg-navy-950 text-white font-sans selection:bg-gold-500 selection:text-navy-900 overflow-x-hidden">
      <Header />
      <main>
        <Hero />
        
        {/* How it works Section - Visual Bridge */}
        <section id="process" className="py-24 bg-navy-900 relative border-t border-white/5">
           <div className="container mx-auto px-6">
              <div className="text-center mb-16 opacity-0 animate-slide-up-fade" style={{ animationDelay: '1.2s', animationFillMode: 'forwards' }}>
                 <h2 className="text-3xl font-display text-white mb-4">Jak to funguje?</h2>
                 <div className="w-24 h-1 bg-gold-500 mx-auto"></div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
                 {[
                    { icon: <Camera size={32} />, title: "Nahrajte Fotky", desc: "Vyberte oblíbené fotky z mobilu nebo počítače. Ořez vyřešíme.", delay: '1.4s' },
                    { icon: <Wand2 size={32} />, title: "Přidejte Text", desc: "Vymyslete vtipné popisky nebo nechte naši AI, ať vás inspiruje.", delay: '1.6s' },
                    { icon: <Truck size={32} />, title: "Rychlé Dodání", desc: "Do 3 dnů máte krásně zabalený balíček karet doma.", delay: '1.8s' }
                 ].map((step, i) => (
                    <div 
                      key={i} 
                      className="group relative p-8 bg-navy-800/50 border border-white/5 hover:border-gold-500/30 transition-all duration-500 hover:-translate-y-2 opacity-0 animate-slide-up-fade"
                      style={{ animationDelay: step.delay, animationFillMode: 'forwards' }}
                    >
                       <div className="absolute -top-6 left-1/2 -translate-x-1/2 w-12 h-12 bg-navy-950 border border-gold-500 rounded-full flex items-center justify-center text-gold-500 z-10 group-hover:scale-110 transition-transform shadow-[0_0_15px_rgba(212,175,55,0.3)]">
                          {step.icon}
                       </div>
                       <h3 className="mt-6 text-xl font-display text-white text-center mb-3 group-hover:text-gold-400 transition-colors">{step.title}</h3>
                       <p className="text-gray-400 text-center text-sm leading-relaxed">{step.desc}</p>
                    </div>
                 ))}
              </div>
           </div>
        </section>

        <CardEditor />
      </main>
      <Footer />
    </div>
  );
}

export default App;
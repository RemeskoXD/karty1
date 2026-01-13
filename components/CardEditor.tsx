import React, { useState, useEffect, useRef } from 'react';
import { CardConfig, Suit, Rank, GameType, GameConfig, CardStyle, OrderDetails, Order, CardBackConfig } from '../types';
import { generateDeck, GAME_VARIANTS, getRankLabel } from '../utils/deckBuilder';
import { generateCardText } from '../services/geminiService';
import { dbService } from '../services/database'; // NEW IMPORT
import CardPreview from './CardPreview';
import { 
  Loader2, Wand2, Upload, Trash2, Check, ArrowRight, ArrowLeft, 
  LayoutGrid, Edit3, Copy, Eraser, Save, Box, ShoppingCart, 
  CreditCard, Truck, User, MapPin, Phone, Mail, Image as ImageIcon, Smile, CheckCircle,
  Move, ZoomIn, Maximize, Repeat
} from 'lucide-react';

// Steps of the Order Wizard
type EditorStep = 'select-game' | 'select-style' | 'design-back' | 'edit-deck' | 'design-package' | 'checkout' | 'success';

// --- UTILS ---
const compressImage = (base64Str: string, maxWidth = 800, quality = 0.7): Promise<string> => {
  return new Promise((resolve) => {
    const img = new Image();
    img.src = base64Str;
    img.onload = () => {
      const canvas = document.createElement('canvas');
      let width = img.width;
      let height = img.height;

      if (width > maxWidth) {
        height = (maxWidth / width) * height;
        width = maxWidth;
      }

      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.drawImage(img, 0, 0, width, height);
        resolve(canvas.toDataURL('image/jpeg', quality));
      } else {
        resolve(base64Str); // Fallback
      }
    };
    img.onerror = () => resolve(base64Str); // Fallback on error
  });
};

const CardEditor: React.FC = () => {
  // --- STATE ---
  const [step, setStep] = useState<EditorStep>('select-game');
  
  // Data selections
  const [selectedGame, setSelectedGame] = useState<GameType | null>(null);
  const [selectedStyle, setSelectedStyle] = useState<CardStyle | null>(null);
  const [deck, setDeck] = useState<CardConfig[]>([]);
  const [backConfig, setBackConfig] = useState<CardBackConfig>({
    customImage: null,
    customText: '',
    borderColor: '#D4AF37',
    imageScale: 1,
    imageX: 0,
    imageY: 0,
    color: '#0F1623'
  });
  
  const [orderDetails, setOrderDetails] = useState<OrderDetails>({
    firstName: '', lastName: '', email: '', phone: '', street: '', city: '', zip: '',
    deliveryMethod: 'zasilkovna', paymentMethod: 'card', note: ''
  });

  // Editor State
  const [activeCardId, setActiveCardId] = useState<string | null>(null);
  const [isInitializing, setIsInitializing] = useState(true);
  const [isGeneratingAI, setIsGeneratingAI] = useState(false);
  const [isRemovingBg, setIsRemovingBg] = useState(false);
  const [isProcessingPayment, setIsProcessingPayment] = useState(false);
  const [isCompressing, setIsCompressing] = useState(false);

  // --- PERSISTENCE ---
  useEffect(() => {
    const savedDeck = localStorage.getItem('mycards-deck');
    const savedGame = localStorage.getItem('mycards-game');
    const savedStyle = localStorage.getItem('mycards-style');
    const savedBack = localStorage.getItem('mycards-back');
    const savedStep = localStorage.getItem('mycards-step');
    
    if (savedDeck && savedGame) {
      try {
        setDeck(JSON.parse(savedDeck));
        setSelectedGame(savedGame as GameType);
        if (savedStyle) setSelectedStyle(savedStyle as CardStyle);
        if (savedBack) setBackConfig(JSON.parse(savedBack));
        if (savedStep) setStep(savedStep as EditorStep);
        else setStep('edit-deck');
      } catch (e) {
        console.error("Failed to load saved state", e);
      }
    }
    setIsInitializing(false);
  }, []);

  useEffect(() => {
    if (!isInitializing && step !== 'success') {
      try {
        if (deck.length > 0) localStorage.setItem('mycards-deck', JSON.stringify(deck));
        if (selectedGame) localStorage.setItem('mycards-game', selectedGame);
        if (selectedStyle) localStorage.setItem('mycards-style', selectedStyle);
        localStorage.setItem('mycards-back', JSON.stringify(backConfig));
        localStorage.setItem('mycards-step', step);
      } catch (e) {
        console.warn("LocalStorage quota exceeded. Some progress might not be saved locally.");
      }
    }
  }, [deck, selectedGame, selectedStyle, backConfig, step, isInitializing]);

  // --- NAVIGATION HANDLERS ---

  const handleReset = () => {
    if (confirm("Opravdu chcete začít znovu? Přijdete o všechny úpravy a vrátíte se na začátek.")) {
      clearLocalStorage();
    }
  };

  const clearLocalStorage = () => {
    localStorage.removeItem('mycards-deck');
    localStorage.removeItem('mycards-game');
    localStorage.removeItem('mycards-style');
    localStorage.removeItem('mycards-back');
    localStorage.removeItem('mycards-step');
    setStep('select-game');
    setDeck([]);
    setSelectedGame(null);
    setSelectedStyle(null);
    setBackConfig({
        customImage: null,
        customText: '',
        borderColor: '#D4AF37',
        imageScale: 1,
        imageX: 0,
        imageY: 0,
        color: '#0F1623'
    });
    setActiveCardId(null);
    setOrderDetails({
      firstName: '', lastName: '', email: '', phone: '', street: '', city: '', zip: '',
      deliveryMethod: 'zasilkovna', paymentMethod: 'card', note: ''
    });
  };

  const goBack = () => {
    switch (step) {
      case 'select-style': setStep('select-game'); break;
      case 'design-back': setStep('select-style'); break;
      case 'edit-deck': 
         // If we have back design, go there, otherwise style
         setStep('design-back'); 
         break;
      case 'design-package': 
         if (selectedStyle === CardStyle.BackOnly) setStep('design-back');
         else setStep('edit-deck'); 
         break;
      case 'checkout': setStep('design-package'); break;
    }
  };

  const handleGameSelect = (type: GameType) => {
    setSelectedGame(type);
    setStep('select-style');
  };

  const handleStyleSelect = (style: CardStyle) => {
    setSelectedStyle(style);
    if (!selectedGame) return;
    
    // Generate deck if needed
    if (deck.length === 0) {
      const newDeck = generateDeck(selectedGame);
      setDeck(newDeck);
      if (newDeck.length > 0) setActiveCardId(newDeck[0].id);
    }
    // Always go to Design Back first
    setStep('design-back');
  };

  const handleBackDesignComplete = () => {
      if (selectedStyle === CardStyle.BackOnly) {
          setStep('design-package');
      } else {
          setStep('edit-deck');
      }
  };

  const handlePayment = async () => {
    setIsProcessingPayment(true);
    
    const newOrder: Order = {
      id: `ORD-${Math.floor(Math.random() * 1000000)}`,
      date: new Date().toISOString(),
      customer: orderDetails,
      gameType: selectedGame!,
      cardStyle: selectedStyle!,
      deck: deck,
      backConfig: backConfig,
      totalPrice: 499 + (orderDetails.deliveryMethod === 'zasilkovna' ? 79 : 99),
      status: 'new'
    };

    // Use DB Service
    const success = await dbService.saveOrder(newOrder);

    if (!success) {
      setIsProcessingPayment(false);
      // Alert is handled in dbService fallback or here if critical
      return;
    }

    setTimeout(() => {
      setIsProcessingPayment(false);
      setStep('success');
      localStorage.removeItem('mycards-deck');
      localStorage.removeItem('mycards-game');
      localStorage.removeItem('mycards-style');
      localStorage.removeItem('mycards-back');
      localStorage.removeItem('mycards-step');
    }, 1500);
  };

  // --- EDITOR LOGIC ---

  const activeCard = deck.find(c => c.id === activeCardId);

  const updateCard = (id: string, updates: Partial<CardConfig>) => {
    setDeck(prev => prev.map(c => c.id === id ? { ...c, ...updates } : c));
  };

  const updateBack = (updates: Partial<CardBackConfig>) => {
      setBackConfig(prev => ({ ...prev, ...updates }));
  };

  // Generic Image Upload with Compression
  const handleImageUpload = (
      e: React.ChangeEvent<HTMLInputElement>, 
      isBack: boolean = false
  ) => {
    const file = e.target.files?.[0];
    if (file) {
      setIsCompressing(true);
      const reader = new FileReader();
      reader.onloadend = async () => {
        const originalBase64 = reader.result as string;
        try {
          // Compress image to max 800px width and 0.7 quality
          const compressedBase64 = await compressImage(originalBase64);
          
          if (isBack) {
              updateBack({ customImage: compressedBase64, imageScale: 1, imageX: 0, imageY: 0 });
          } else if (activeCardId) {
              updateCard(activeCardId, { customImage: compressedBase64, isBackgroundRemoved: false, imageScale: 1, imageX: 0, imageY: 0 });
          }
        } catch (err) {
          console.error("Compression failed", err);
        } finally {
          setIsCompressing(false);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  // --- ACTION HANDLERS ---

  const handleGenerateText = async () => {
    if (!activeCard) return;
    setIsGeneratingAI(true);
    try {
      const text = await generateCardText(activeCard.suit, activeCard.rank);
      updateCard(activeCard.id, { customText: text });
    } catch (error) {
      console.error("Failed to generate text", error);
    } finally {
      setIsGeneratingAI(false);
    }
  };

  const handleRemoveBackground = () => {
    if (!activeCard) return;
    setIsRemovingBg(true);
    setTimeout(() => {
        updateCard(activeCard.id, { isBackgroundRemoved: !activeCard.isBackgroundRemoved });
        setIsRemovingBg(false);
    }, 1500);
  };

  const applyImageToRank = () => {
    if (!activeCard || !activeCard.customImage) return;
    
    if (confirm(`Opravdu chcete použít tento obrázek na všechny karty hodnoty ${getRankLabel(activeCard.rank, activeCard.gameType)}?`)) {
        const updates = {
            customImage: activeCard.customImage,
            imageScale: activeCard.imageScale,
            imageX: activeCard.imageX,
            imageY: activeCard.imageY,
            isBackgroundRemoved: activeCard.isBackgroundRemoved
        };
        
        setDeck(prev => prev.map(c => 
            (c.rank === activeCard.rank && c.id !== activeCard.id) 
            ? { ...c, ...updates } 
            : c
        ));
    }
  };

  const applyImageToSuit = () => {
    if (!activeCard || !activeCard.customImage) return;

    if (confirm(`Opravdu chcete použít tento obrázek na všechny karty barvy ${activeCard.suit}?`)) {
        const updates = {
            customImage: activeCard.customImage,
            imageScale: activeCard.imageScale,
            imageX: activeCard.imageX,
            imageY: activeCard.imageY,
            isBackgroundRemoved: activeCard.isBackgroundRemoved
        };
        
        setDeck(prev => prev.map(c => 
            (c.suit === activeCard.suit && c.id !== activeCard.id) 
            ? { ...c, ...updates } 
            : c
        ));
    }
  };

  // --- RENDER HELPERS ---
  const renderImageControls = (
      scale: number, 
      x: number, 
      y: number, 
      onUpdate: (u: { imageScale?: number, imageX?: number, imageY?: number }) => void
  ) => (
      <div className="bg-navy-950/50 rounded-xl p-4 border border-white/10 space-y-4">
          <p className="text-[10px] uppercase tracking-widest text-gray-500 font-bold mb-2">Pozice & Přiblížení</p>
          
          <div className="space-y-1">
             <div className="flex justify-between text-xs text-gray-400">
                <span className="flex items-center gap-1"><ZoomIn size={12}/> Zoom</span>
                <span>{Math.round(scale * 100)}%</span>
             </div>
             <input 
               type="range" min="1" max="3" step="0.1" value={scale} 
               onChange={(e) => onUpdate({ imageScale: parseFloat(e.target.value) })}
               className="w-full h-1 bg-navy-800 rounded-lg appearance-none cursor-pointer accent-gold-500"
             />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
                <div className="flex justify-between text-xs text-gray-400">
                    <span className="flex items-center gap-1"><Move size={12}/> Horizontálně</span>
                </div>
                <input 
                    type="range" min="-50" max="50" step="1" value={x} 
                    onChange={(e) => onUpdate({ imageX: parseInt(e.target.value) })}
                    className="w-full h-1 bg-navy-800 rounded-lg appearance-none cursor-pointer accent-gold-500"
                />
            </div>
            <div className="space-y-1">
                <div className="flex justify-between text-xs text-gray-400">
                    <span className="flex items-center gap-1"><Move size={12} className="rotate-90"/> Vertikálně</span>
                </div>
                <input 
                    type="range" min="-50" max="50" step="1" value={y} 
                    onChange={(e) => onUpdate({ imageY: parseInt(e.target.value) })}
                    className="w-full h-1 bg-navy-800 rounded-lg appearance-none cursor-pointer accent-gold-500"
                />
            </div>
          </div>
          
          <button 
            onClick={() => onUpdate({ imageScale: 1, imageX: 0, imageY: 0 })}
            className="text-[10px] text-gray-500 hover:text-white flex items-center gap-1 w-full justify-center pt-2 border-t border-white/5"
          >
             <Repeat size={10}/> Resetovat pozici
          </button>
      </div>
  );

  // --- RENDER STEPS ---

  // 1. GAME SELECTION
  const renderGameSelection = () => (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 animate-fade-in">
      {Object.values(GAME_VARIANTS).map((variant) => (
        <div 
          key={variant.id}
          onClick={() => handleGameSelect(variant.id as GameType)}
          className="group relative bg-navy-800 rounded-3xl p-8 border border-white/5 hover:border-gold-500 cursor-pointer transition-all duration-300 hover:-translate-y-2 hover:shadow-[0_0_30px_rgba(212,175,55,0.15)]"
        >
          <div className="absolute top-6 right-6 text-navy-900 bg-gold-500 font-bold text-xs px-3 py-1 rounded-full opacity-0 group-hover:opacity-100 transition-opacity">
            VYBRAT
          </div>
          <div className="w-16 h-16 bg-navy-950 rounded-2xl flex items-center justify-center mb-6 border border-white/10 group-hover:border-gold-500/50">
            <LayoutGrid className="text-gold-400 group-hover:scale-110 transition-transform" />
          </div>
          <h3 className="text-2xl font-display text-white mb-2">{variant.name}</h3>
          <p className="text-gray-400 text-sm mb-6 min-h-[40px]">{variant.description}</p>
          <div className="flex items-center gap-4 text-xs text-gray-500 uppercase tracking-wider">
            <span className="flex items-center gap-1"><Copy size={14}/> {variant.cardCount} karet</span>
            <span className="w-1 h-1 rounded-full bg-gray-600"></span>
            <span>{variant.dimensions.label}</span>
          </div>
        </div>
      ))}
    </div>
  );

  // 2. STYLE SELECTION
  const renderStyleSelection = () => (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 animate-fade-in">
      {[
        { id: CardStyle.BackOnly, label: 'RUB', desc: 'Vlastní fotka pouze na zadní straně karet. Líc je standardní.', icon: <ImageIcon /> },
        { id: CardStyle.BackAndFace, label: 'RUB + LÍCE', desc: 'Vlastní fotky na zadní straně i na všech hracích kartách.', icon: <LayoutGrid /> },
        { id: CardStyle.BackAndFaceFaces, label: 'RUB + OBLIČEJE', desc: 'Vaše tváře vložené do historických kostýmů králů a dam.', icon: <Smile /> },
        { id: CardStyle.CustomGame, label: 'VLASTNÍ HRA', desc: 'Prázdné karty. Navrhněte si úplně vše od nuly.', icon: <Edit3 /> },
      ].map((style) => (
        <div 
          key={style.id}
          onClick={() => handleStyleSelect(style.id as CardStyle)}
          className="bg-white group cursor-pointer rounded-2xl p-4 transition-all hover:scale-105 hover:shadow-2xl border-4 border-transparent hover:border-gold-500"
        >
           <div className="aspect-[3/4] bg-gray-100 rounded-xl mb-4 overflow-hidden relative flex items-center justify-center">
              <div className="text-gray-300 group-hover:text-gold-500 transition-colors transform scale-150">
                {style.icon}
              </div>
              <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-end justify-center p-4">
                 <span className="text-white font-bold uppercase tracking-widest text-sm">Vybrat</span>
              </div>
           </div>
           <h3 className="text-navy-900 font-bold text-center text-lg mb-1">{style.label}</h3>
           <p className="text-gray-500 text-center text-xs leading-relaxed">{style.desc}</p>
        </div>
      ))}
    </div>
  );

  // 3. BACK EDITOR
  const renderBackEditor = () => (
    <div className="flex flex-col xl:flex-row gap-8 items-start h-full animate-fade-in max-w-6xl mx-auto">
        {/* Left: Preview */}
        <div className="w-full xl:w-1/2 flex justify-center">
            <div className="w-[300px] md:w-[400px]">
                <CardPreview 
                    backConfig={backConfig} 
                    side="back" 
                    card={deck[0]} // Pass deck[0] just to get gameType for aspect ratio
                    className="pointer-events-none" 
                />
            </div>
        </div>
        
        {/* Right: Controls */}
        <div className="w-full xl:w-1/2 bg-navy-900 border border-gold-500/20 rounded-3xl p-6 md:p-8 shadow-2xl relative">
            <h2 className="text-3xl font-display text-white mb-2">Zadní strana</h2>
            <p className="text-gray-400 mb-6 text-sm">Tento design bude společný pro všechny karty v balíčku.</p>

            <div className="space-y-6">
                 {/* Upload */}
                 <div className="space-y-3">
                     <label className="text-xs uppercase tracking-widest text-gray-400 font-bold">Fotografie</label>
                     {!backConfig.customImage ? (
                       <div className="relative group w-full aspect-video rounded-xl border-2 border-dashed border-white/10 hover:border-gold-500/50 bg-black/20 hover:bg-black/40 transition-all flex flex-col items-center justify-center cursor-pointer overflow-hidden">
                          <input type="file" accept="image/*" onChange={(e) => handleImageUpload(e, true)} className="absolute inset-0 opacity-0 cursor-pointer z-20" />
                          {isCompressing ? <Loader2 className="animate-spin text-gold-500 mb-2"/> : <Upload className="text-gray-400 group-hover:text-gold-400 mb-2 transition-colors" />}
                          <span className="text-gray-400 text-sm group-hover:text-white">{isCompressing ? 'Zpracování...' : 'Nahrát fotku'}</span>
                       </div>
                     ) : (
                       <div className="space-y-4">
                           <div className="flex gap-4 items-center">
                              <div className="w-16 h-16 rounded-lg bg-black/50 border border-white/10 overflow-hidden shrink-0">
                                 <img src={backConfig.customImage} alt="Uploaded" className="w-full h-full object-cover" />
                              </div>
                              <div className="relative flex-1">
                                <input type="file" accept="image/*" onChange={(e) => handleImageUpload(e, true)} className="absolute inset-0 opacity-0 cursor-pointer z-10" />
                                <button className="w-full text-xs bg-white/5 hover:bg-white/10 text-white py-2 rounded-lg border border-white/10 transition-all flex items-center justify-center gap-2">
                                    {isCompressing && <Loader2 className="animate-spin w-3 h-3"/>}
                                    Změnit fotku
                                </button>
                              </div>
                           </div>
                           
                           {/* Positioning Controls */}
                           {renderImageControls(backConfig.imageScale, backConfig.imageX, backConfig.imageY, updateBack)}
                       </div>
                     )}
                 </div>

                 {/* Text */}
                 <div className="space-y-3">
                     <label className="text-xs uppercase tracking-widest text-gray-400 font-bold">Text (volitelný)</label>
                     <input type="text" value={backConfig.customText} onChange={(e) => updateBack({ customText: e.target.value })} placeholder="Např. Dovolená 2024" maxLength={20} className="w-full bg-navy-950 text-white border border-white/10 rounded-xl p-4 focus:border-gold-500 focus:outline-none focus:ring-1 focus:ring-gold-500 transition-all" />
                 </div>

                 <div className="pt-6 mt-6 border-t border-white/10 flex justify-end">
                     <button onClick={handleBackDesignComplete} disabled={isCompressing} className="bg-gold-500 hover:bg-gold-400 text-navy-900 font-bold py-3 px-6 rounded-lg flex items-center gap-2 transition-all shadow-lg shadow-gold-500/20 disabled:opacity-50">
                        {selectedStyle === CardStyle.BackOnly ? 'Dokončit a Zabalit' : 'Pokračovat na Líce'} <ArrowRight size={16}/>
                     </button>
                 </div>
            </div>
        </div>
    </div>
  );

  // 4. FACE EDITOR (Edit Deck)
  const renderEditor = () => (
    <div className="flex flex-col xl:flex-row gap-8 items-start h-full animate-fade-in">
      {/* LEFT: Deck Grid */}
      <div className="w-full xl:w-7/12 bg-navy-800/50 rounded-3xl border border-white/5 p-6 backdrop-blur-sm">
        <div className="flex justify-between items-center mb-6">
           <div>
             <h3 className="text-white font-display text-xl">
               Editor: Líce karet
             </h3>
             <p className="text-gray-400 text-xs mt-1">
               {deck.filter(c => c.customImage || c.customText).length} / {deck.length} karet upraveno
             </p>
           </div>
        </div>
        
        <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 gap-3 md:gap-4 max-h-[800px] overflow-y-auto pr-2 custom-scrollbar">
          {deck.map((c) => (
            <div key={c.id} className="relative">
               <CardPreview 
                  card={c} 
                  onClick={() => setActiveCardId(c.id)}
                  selected={activeCardId === c.id}
                  className="cursor-pointer"
               />
               {(c.customImage || c.customText) && (
                 <div className="absolute top-[-4px] right-[-4px] w-5 h-5 bg-green-500 rounded-full border-2 border-navy-900 z-20 flex items-center justify-center">
                    <Check size={10} className="text-navy-900 font-bold"/>
                 </div>
               )}
            </div>
          ))}
        </div>
      </div>

      {/* RIGHT: Detail Editor */}
      <div className="w-full xl:w-5/12 xl:sticky xl:top-24">
        {activeCard ? (
          <div className="bg-navy-900 border border-gold-500/20 rounded-3xl p-6 md:p-8 shadow-2xl relative overflow-hidden">
            <div className="absolute top-0 right-0 w-[300px] h-[300px] bg-gold-500/5 blur-[80px] rounded-full pointer-events-none"></div>

            <div className="flex justify-between items-start mb-6 relative z-10">
              <div>
                <h2 className="text-3xl font-display text-white">Upravit Kartu</h2>
                <p className="text-gold-400 font-serif text-lg mt-1">
                  {getRankLabel(activeCard.rank, activeCard.gameType)} - {activeCard.suit}
                </p>
              </div>
              <div className="w-16 hidden md:block">
                 <CardPreview card={activeCard} className="pointer-events-none" />
              </div>
            </div>

            <div className="space-y-6 relative z-10">
              {/* Upload */}
              <div className="space-y-3">
                 <label className="text-xs uppercase tracking-widest text-gray-400 font-bold">1. Fotografie</label>
                 {!activeCard.customImage ? (
                   <div className="relative group w-full aspect-video rounded-xl border-2 border-dashed border-white/10 hover:border-gold-500/50 bg-black/20 hover:bg-black/40 transition-all flex flex-col items-center justify-center cursor-pointer overflow-hidden">
                      <input type="file" accept="image/*" onChange={(e) => handleImageUpload(e)} className="absolute inset-0 opacity-0 cursor-pointer z-20" />
                      {isCompressing ? <Loader2 className="animate-spin text-gold-500 mb-2"/> : <Upload className="text-gray-400 group-hover:text-gold-400 mb-2 transition-colors" />}
                      <span className="text-gray-400 text-sm group-hover:text-white">{isCompressing ? 'Zpracování...' : 'Nahrát fotku'}</span>
                   </div>
                 ) : (
                   <div className="space-y-4">
                       <div className="flex gap-4 items-start">
                          <div className="w-24 h-24 rounded-lg bg-black/50 border border-white/10 overflow-hidden shrink-0 relative">
                             <img 
                               src={activeCard.customImage} 
                               alt="Uploaded" 
                               className={`w-full h-full object-cover ${activeCard.isBackgroundRemoved ? 'opacity-90' : ''}`} 
                             />
                          </div>
                          <div className="flex flex-col gap-2 w-full">
                             <div className="relative">
                                <input type="file" accept="image/*" onChange={(e) => handleImageUpload(e)} className="absolute inset-0 opacity-0 cursor-pointer z-10" />
                                <button className="w-full text-xs bg-white/5 hover:bg-white/10 text-white py-2 rounded-lg border border-white/10 transition-all flex items-center justify-center gap-2">
                                    {isCompressing && <Loader2 className="animate-spin w-3 h-3"/>}
                                    Změnit fotku
                                </button>
                             </div>
                             <button onClick={handleRemoveBackground} disabled={isRemovingBg} className={`w-full text-xs py-2 rounded-lg border transition-all flex items-center justify-center gap-2 ${activeCard.isBackgroundRemoved ? 'bg-red-500/10 border-red-500/30 text-red-400' : 'bg-gold-500/10 border-gold-500/30 text-gold-400'}`}>
                                {isRemovingBg ? <Loader2 className="animate-spin w-3 h-3"/> : <Eraser size={14}/>}
                                {activeCard.isBackgroundRemoved ? 'Vrátit pozadí' : 'Odstranit pozadí (AI)'}
                             </button>
                          </div>
                       </div>
                       
                       {/* Positioning Controls */}
                       {renderImageControls(activeCard.imageScale, activeCard.imageX, activeCard.imageY, (updates) => updateCard(activeCard.id, updates))}
                   </div>
                 )}
              </div>

              {/* Bulk Actions - Hide for Jokers */}
              {activeCard.customImage && activeCard.rank !== Rank.Joker && (
                <div className="p-4 bg-white/5 rounded-xl border border-white/5">
                   <p className="text-[10px] uppercase tracking-widest text-gray-500 mb-3 font-bold">Hromadné úpravy</p>
                   <div className="grid grid-cols-2 gap-2">
                      <button onClick={applyImageToRank} className="bg-navy-950 hover:bg-navy-800 text-gray-300 text-xs py-2 px-3 rounded-lg border border-white/10 transition-all text-left">
                         Na všechny <span className="text-gold-400">{getRankLabel(activeCard.rank, activeCard.gameType)}</span>
                      </button>
                      <button onClick={applyImageToSuit} className="bg-navy-950 hover:bg-navy-800 text-gray-300 text-xs py-2 px-3 rounded-lg border border-white/10 transition-all text-left">
                         Na celou barvu <span className="text-gold-400">{activeCard.suit}</span>
                      </button>
                   </div>
                </div>
              )}

              {/* Text */}
              <div className="space-y-3">
                 <div className="flex justify-between items-center">
                    <label className="text-xs uppercase tracking-widest text-gray-400 font-bold">2. Text</label>
                    <button onClick={handleGenerateText} disabled={isGeneratingAI} className="flex items-center gap-1 text-[10px] uppercase tracking-wider text-gold-500 hover:text-white transition-colors disabled:opacity-50">
                      {isGeneratingAI ? <Loader2 className="animate-spin w-3 h-3"/> : <Wand2 className="w-3 h-3"/>} AI Inspirace
                    </button>
                 </div>
                 <input type="text" value={activeCard.customText} onChange={(e) => updateCard(activeCard.id, { customText: e.target.value })} placeholder="Např. Všechno nejlepší..." maxLength={20} className="w-full bg-navy-950 text-white border border-white/10 rounded-xl p-4 focus:border-gold-500 focus:outline-none focus:ring-1 focus:ring-gold-500 transition-all" />
              </div>

              {/* Next Button */}
              <div className="pt-6 mt-6 border-t border-white/10 flex justify-end">
                 <button onClick={() => setStep('design-package')} className="bg-gold-500 hover:bg-gold-400 text-navy-900 font-bold py-3 px-6 rounded-lg flex items-center gap-2 transition-all shadow-lg shadow-gold-500/20">
                    Pokračovat k Balení <ArrowRight size={16}/>
                 </button>
              </div>
            </div>
          </div>
        ) : (
           <div className="h-full flex flex-col items-center justify-center p-12 bg-navy-800/30 rounded-3xl border border-white/5 border-dashed text-center">
              <div className="w-16 h-16 rounded-full bg-navy-800 flex items-center justify-center mb-4 text-gray-500"><Edit3 size={24}/></div>
              <h3 className="text-white font-display text-lg mb-2">Vyberte kartu</h3>
              <p className="text-gray-400 text-sm max-w-xs">Klikněte na libovolnou kartu vlevo pro nahrání fotky a úpravu textu.</p>
           </div>
        )}
      </div>
    </div>
  );

  // 5. PACKAGING MOCKUP
  const renderPackaging = () => (
    <div className="flex flex-col md:flex-row gap-12 items-center animate-fade-in">
       <div className="w-full md:w-1/2 flex justify-center py-12">
          {/* 3D Box Mockup (Pure CSS) */}
          <div className="relative group perspective-1000 w-64 h-96">
             <div className="relative w-full h-full preserve-3d transition-transform duration-700 transform group-hover:rotate-y-12 rotate-y-[-25deg] rotate-x-[10deg]">
                {/* Front Face */}
                <div className="absolute inset-0 bg-navy-900 border-2 border-gold-500/50 rounded-lg flex flex-col items-center justify-center p-8 backface-hidden shadow-[0_0_50px_rgba(0,0,0,0.5)]">
                   <div className="w-24 h-24 rounded-full bg-gold-500/10 flex items-center justify-center mb-6">
                      <span className="text-gold-500 font-display text-4xl font-bold">MC</span>
                   </div>
                   <h3 className="text-gold-400 font-display text-xl tracking-widest text-center">MY CARDS</h3>
                   <div className="h-[1px] w-12 bg-gold-500/50 my-4"></div>
                   <p className="text-gray-400 text-xs text-center uppercase tracking-widest">Originální edice</p>
                </div>
                {/* Side Face */}
                <div className="absolute top-0 right-0 w-16 h-full bg-navy-950 origin-right rotate-y-90 border border-white/10 flex items-center justify-center">
                   <span className="text-gold-500/50 font-bold rotate-90 whitespace-nowrap tracking-[0.5em] text-xs">MYCARDS.CZ</span>
                </div>
             </div>
             {/* Shadow */}
             <div className="absolute -bottom-12 left-0 w-full h-8 bg-black/50 blur-xl rounded-full transform rotate-x-[60deg]"></div>
          </div>
       </div>

       <div className="w-full md:w-1/2 space-y-8">
          <div>
            <h2 className="text-3xl font-display text-white mb-2">Vlastní Krabička</h2>
            <p className="text-gray-400">Vaše karty dorazí v luxusní krabičce se zlatou ražbou. Můžete přidat věnování na zadní stranu krabičky.</p>
          </div>
          
          <div className="space-y-4">
             <label className="text-xs uppercase tracking-widest text-gray-400 font-bold">Věnování (Max 50 znaků)</label>
             <input type="text" placeholder="Např. Pro dědečka k 60. narozeninám" className="w-full bg-navy-800 border border-white/10 rounded-xl p-4 text-white focus:border-gold-500 focus:outline-none" />
          </div>

          <div className="flex justify-end pt-8">
             <button onClick={() => setStep('checkout')} className="bg-gold-500 hover:bg-gold-400 text-navy-900 font-bold py-3 px-8 rounded-lg flex items-center gap-2 transition-all shadow-lg shadow-gold-500/20">
                K Objednávce <ArrowRight size={16}/>
             </button>
          </div>
       </div>
    </div>
  );

  // 6. CHECKOUT FORM
  const renderCheckout = () => (
    <div className="max-w-4xl mx-auto animate-fade-in">
       <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          
          {/* Form */}
          <div className="space-y-6">
             <h3 className="text-xl font-display text-white flex items-center gap-2"><User className="text-gold-500" size={20}/> Kontaktní údaje</h3>
             <div className="grid grid-cols-2 gap-4">
                <input type="text" placeholder="Jméno" className="bg-navy-800 border-white/10 rounded-lg p-3 text-white focus:border-gold-500 outline-none border" value={orderDetails.firstName} onChange={e => setOrderDetails({...orderDetails, firstName: e.target.value})} />
                <input type="text" placeholder="Příjmení" className="bg-navy-800 border-white/10 rounded-lg p-3 text-white focus:border-gold-500 outline-none border" value={orderDetails.lastName} onChange={e => setOrderDetails({...orderDetails, lastName: e.target.value})} />
             </div>
             <div className="grid grid-cols-2 gap-4">
                 <div className="relative">
                    <Mail className="absolute left-3 top-3.5 text-gray-500" size={16}/>
                    <input type="email" placeholder="E-mail" className="w-full bg-navy-800 border-white/10 rounded-lg p-3 pl-10 text-white focus:border-gold-500 outline-none border" value={orderDetails.email} onChange={e => setOrderDetails({...orderDetails, email: e.target.value})} />
                 </div>
                 <div className="relative">
                    <Phone className="absolute left-3 top-3.5 text-gray-500" size={16}/>
                    <input type="tel" placeholder="Telefon" className="w-full bg-navy-800 border-white/10 rounded-lg p-3 pl-10 text-white focus:border-gold-500 outline-none border" value={orderDetails.phone} onChange={e => setOrderDetails({...orderDetails, phone: e.target.value})} />
                 </div>
             </div>

             <h3 className="text-xl font-display text-white flex items-center gap-2 pt-4"><MapPin className="text-gold-500" size={20}/> Adresa doručení</h3>
             <input type="text" placeholder="Ulice a číslo popisné" className="w-full bg-navy-800 border-white/10 rounded-lg p-3 text-white focus:border-gold-500 outline-none border" value={orderDetails.street} onChange={e => setOrderDetails({...orderDetails, street: e.target.value})} />
             <div className="grid grid-cols-2 gap-4">
                <input type="text" placeholder="Město" className="bg-navy-800 border-white/10 rounded-lg p-3 text-white focus:border-gold-500 outline-none border" value={orderDetails.city} onChange={e => setOrderDetails({...orderDetails, city: e.target.value})} />
                <input type="text" placeholder="PSČ" className="bg-navy-800 border-white/10 rounded-lg p-3 text-white focus:border-gold-500 outline-none border" value={orderDetails.zip} onChange={e => setOrderDetails({...orderDetails, zip: e.target.value})} />
             </div>

             <h3 className="text-xl font-display text-white flex items-center gap-2 pt-4"><Truck className="text-gold-500" size={20}/> Doprava a Platba</h3>
             <div className="grid grid-cols-2 gap-4">
                <button onClick={() => setOrderDetails({...orderDetails, deliveryMethod: 'zasilkovna'})} className={`p-4 rounded-lg border flex flex-col items-center gap-2 transition-all ${orderDetails.deliveryMethod === 'zasilkovna' ? 'bg-gold-500/10 border-gold-500 text-gold-400' : 'bg-navy-800 border-white/10 text-gray-400'}`}>
                   <Truck size={24}/> <span className="text-sm font-bold">Zásilkovna (79 Kč)</span>
                </button>
                <button onClick={() => setOrderDetails({...orderDetails, deliveryMethod: 'ppl'})} className={`p-4 rounded-lg border flex flex-col items-center gap-2 transition-all ${orderDetails.deliveryMethod === 'ppl' ? 'bg-gold-500/10 border-gold-500 text-gold-400' : 'bg-navy-800 border-white/10 text-gray-400'}`}>
                   <Truck size={24}/> <span className="text-sm font-bold">Kurýr PPL (99 Kč)</span>
                </button>
             </div>
          </div>

          {/* Summary */}
          <div className="bg-navy-800/50 p-6 rounded-2xl border border-white/10 h-fit">
             <h3 className="text-xl font-display text-white mb-6 border-b border-white/10 pb-4">Rekapitulace</h3>
             
             <div className="space-y-4 mb-6">
                <div className="flex justify-between text-sm">
                   <span className="text-gray-400">Produkt</span>
                   <span className="text-white font-bold">{selectedGame ? GAME_VARIANTS[selectedGame].name : ''}</span>
                </div>
                <div className="flex justify-between text-sm">
                   <span className="text-gray-400">Styl</span>
                   <span className="text-white">
                      {selectedStyle === CardStyle.BackOnly ? 'Pouze Rub' : 
                       selectedStyle === CardStyle.BackAndFace ? 'Rub + Líce' :
                       selectedStyle === CardStyle.CustomGame ? 'Vlastní hra' : 'Rub + Obličeje'}
                   </span>
                </div>
                <div className="flex justify-between text-sm">
                   <span className="text-gray-400">Počet karet</span>
                   <span className="text-white">{deck.length} ks</span>
                </div>
                <div className="flex justify-between text-sm">
                   <span className="text-gray-400">Cena za balíček</span>
                   <span className="text-white">499 Kč</span>
                </div>
                <div className="flex justify-between text-sm">
                   <span className="text-gray-400">Doprava</span>
                   <span className="text-white">{orderDetails.deliveryMethod === 'zasilkovna' ? '79 Kč' : '99 Kč'}</span>
                </div>
             </div>

             <div className="flex justify-between items-center text-xl font-bold text-gold-400 pt-4 border-t border-white/10 mb-8">
                <span>Celkem</span>
                <span>{499 + (orderDetails.deliveryMethod === 'zasilkovna' ? 79 : 99)} Kč</span>
             </div>

             <button 
                onClick={handlePayment} 
                disabled={isProcessingPayment}
                className="w-full bg-green-600 hover:bg-green-500 text-white font-bold py-4 rounded-xl shadow-lg transition-all flex justify-center items-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed"
             >
                {isProcessingPayment ? <Loader2 className="animate-spin"/> : <CreditCard size={20}/>}
                {isProcessingPayment ? 'Zpracování...' : 'Zaplatit Kartou (Stripe)'}
             </button>
             <p className="text-center text-gray-500 text-xs mt-3 flex items-center justify-center gap-1"><Box size={12}/> Bezpečná platba SSL</p>
          </div>

       </div>
    </div>
  );

  // 7. SUCCESS
  const renderSuccess = () => (
    <div className="flex flex-col items-center justify-center min-h-[400px] text-center animate-fade-in">
       <div className="w-24 h-24 rounded-full bg-green-500/20 flex items-center justify-center mb-8 border border-green-500/50">
          <CheckCircle size={48} className="text-green-500" />
       </div>
       <h2 className="text-4xl font-display text-white mb-4">Objednávka přijata!</h2>
       <p className="text-gray-400 max-w-md mb-8">
         Děkujeme za objednávku. Na váš e-mail jsme odeslali potvrzení a rekapitulaci. Jakmile bude balíček vytištěn, dáme vám vědět.
       </p>
       <button onClick={() => setStep('select-game')} className="bg-gold-500 hover:bg-gold-400 text-navy-900 font-bold py-3 px-8 rounded-lg transition-all shadow-lg">
          Vytvořit další balíček
       </button>
    </div>
  );

  return (
    <div className="bg-navy-900 min-h-screen py-16 px-4 md:px-8" id="editor">
      <div className="max-w-[1400px] mx-auto">
        
        {/* Top Navigation Bar */}
        <div className="flex flex-col md:flex-row justify-between items-center mb-12 gap-6 relative">
           
           {/* Back Button */}
           <div className="w-full md:w-1/3 flex justify-start">
             {step !== 'select-game' && step !== 'success' && (
               <button onClick={goBack} className="text-gray-400 hover:text-white flex items-center gap-2 text-sm uppercase tracking-wider transition-colors">
                 <ArrowLeft size={16}/> Zpět
               </button>
             )}
           </div>

           {/* Title */}
           <div className="w-full md:w-1/3 text-center">
              <h2 className="text-3xl font-serif text-white">
                {step === 'select-game' && 'Výběr Hry'}
                {step === 'select-style' && 'Styl Karet'}
                {step === 'design-back' && 'Zadní Strana'}
                {step === 'edit-deck' && 'Líce Karet'}
                {step === 'design-package' && 'Balení'}
                {step === 'checkout' && 'Dokončení'}
                {step === 'success' && 'Hotovo'}
              </h2>
              {/* Progress Dots */}
              {step !== 'success' && (
                <div className="flex justify-center gap-2 mt-4">
                   {['select-game', 'select-style', 'design-back', 'edit-deck', 'design-package', 'checkout'].map((s, i) => (
                      <div key={s} className={`w-2 h-2 rounded-full transition-all ${
                         ['select-game', 'select-style', 'design-back', 'edit-deck', 'design-package', 'checkout'].indexOf(step) >= i 
                         ? 'bg-gold-500 w-4' 
                         : 'bg-navy-700'
                      }`}></div>
                   ))}
                </div>
              )}
           </div>

           {/* Reset Button */}
           <div className="w-full md:w-1/3 flex justify-end">
             {step !== 'select-game' && step !== 'success' && (
               <button onClick={handleReset} className="text-red-400/70 hover:text-red-400 flex items-center gap-2 text-xs uppercase tracking-wider transition-colors">
                 <Trash2 size={14}/> Začít znovu
               </button>
             )}
           </div>
        </div>

        {/* Dynamic Content */}
        <div className="min-h-[600px]">
           {step === 'select-game' && renderGameSelection()}
           {step === 'select-style' && renderStyleSelection()}
           {step === 'design-back' && renderBackEditor()}
           {step === 'edit-deck' && renderEditor()}
           {step === 'design-package' && renderPackaging()}
           {step === 'checkout' && renderCheckout()}
           {step === 'success' && renderSuccess()}
        </div>

      </div>
    </div>
  );
};

export default CardEditor;
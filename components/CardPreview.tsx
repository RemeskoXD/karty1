import React from 'react';
import { CardConfig, Suit, GameType, Rank, CardBackConfig } from '../types';
import { getSuitIcon } from './Icons';
import { getRankLabel } from '../utils/deckBuilder';

interface CardPreviewProps {
  card?: CardConfig;
  backConfig?: CardBackConfig;
  className?: string;
  onClick?: () => void;
  selected?: boolean;
  printMode?: boolean;
  side?: 'face' | 'back';
}

const CardPreview: React.FC<CardPreviewProps> = ({ 
  card, 
  backConfig,
  className = '', 
  onClick, 
  selected, 
  printMode = false,
  side = 'face'
}) => {
  // Determine if we are rendering Back or Face
  const isBack = side === 'back';
  
  // Safe accessors depending on what data we have
  const gameType = card?.gameType || GameType.PokerStandard; // Fallback for back preview
  
  // Aspect Ratio
  const getAspectRatioClass = () => {
    if (printMode) return 'w-full h-full';
    switch (gameType) {
      case GameType.MariasSingle:
      case GameType.MariasDouble:
        return 'aspect-[56/89]';
      case GameType.PokerStandard:
      case GameType.PokerBig:
        return 'aspect-[63/88]';
      case GameType.Canasta:
        return 'aspect-[57/88]';
      default:
        return 'aspect-[63/88]';
    }
  };

  // --- RENDER BACK ---
  if (isBack) {
    // Default Back Pattern if no custom image
    const defaultPattern = "radial-gradient(circle, #0F1623 0%, #05080F 100%)";
    const image = backConfig?.customImage;
    const scale = backConfig?.imageScale || 1;
    const x = backConfig?.imageX || 0;
    const y = backConfig?.imageY || 0;
    const borderColor = backConfig?.borderColor || '#D4AF37';
    const text = backConfig?.customText;

    const containerClasses = printMode 
      ? `relative w-full h-full overflow-hidden bg-white ${className}`
      : `relative group perspective-1000 w-full ${getAspectRatioClass()} transition-transform duration-300 ${selected ? 'scale-105 z-10' : 'hover:scale-[1.02]'} ${className}`;

    const innerClasses = printMode
      ? `w-full h-full relative border-[1px] border-gray-300 overflow-hidden`
      : `w-full h-full rounded-xl shadow-xl overflow-hidden relative border-[6px] transition-all duration-300 ${selected ? 'ring-4 ring-gold-500 ring-offset-2 ring-offset-navy-900' : ''}`;

    return (
      <div onClick={!printMode ? onClick : undefined} className={containerClasses}>
        <div className={innerClasses} style={{ borderColor: printMode ? '#000000' : borderColor, background: !image ? defaultPattern : 'white' }}>
           {image ? (
             <div className="absolute inset-0 overflow-hidden">
                <img 
                  src={image} 
                  alt="Card Back" 
                  className="w-full h-full object-cover transition-transform duration-100"
                  style={{ transform: `scale(${scale}) translate(${x}%, ${y}%)` }}
                />
             </div>
           ) : (
             <div className="absolute inset-0 flex items-center justify-center opacity-20">
                <div className="w-16 h-16 border-2 border-gold-500 transform rotate-45"></div>
             </div>
           )}
           
           {text && (
            <div className={`absolute top-1/2 left-0 right-0 -translate-y-1/2 z-30 flex justify-center`}>
              <span className={`bg-navy-900/90 backdrop-blur-sm px-3 py-1 text-gold-400 font-serif font-bold italic shadow-lg text-xs md:text-sm border-y border-gold-500 ${printMode ? 'border text-black bg-white' : ''}`}>
                {text}
              </span>
            </div>
           )}

           {/* Default Texture for back if no image */}
           {!image && !printMode && (
             <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-10"></div>
           )}
        </div>
      </div>
    );
  }

  // --- RENDER FACE ---
  if (!card) return null; // Safety check

  const isJoker = card.rank === Rank.Joker;
  const isRed = card.suit === Suit.Hearts || card.suit === Suit.Diamonds;
  const isJokerRed = isJoker && (card.suit === Suit.Hearts || card.suit === Suit.Diamonds);
  const isSingleHeaded = card.gameType === GameType.MariasSingle;
  const rankLabel = getRankLabel(card.rank, card.gameType);

  const containerClasses = printMode 
    ? `relative w-full h-full overflow-hidden bg-white ${className}`
    : `relative group perspective-1000 w-full ${getAspectRatioClass()} transition-transform duration-300 ${selected ? 'scale-105 z-10' : 'hover:scale-[1.02]'} ${className}`;

  const innerClasses = printMode
    ? `w-full h-full bg-white relative border-[1px] border-gray-300 overflow-hidden`
    : `w-full h-full rounded-xl bg-white shadow-xl overflow-hidden relative border-[6px] transition-all duration-300 ${selected ? 'ring-4 ring-gold-500 ring-offset-2 ring-offset-navy-900' : ''}`;

  return (
    <div onClick={!printMode ? onClick : undefined} className={containerClasses}>
      <div className={innerClasses} style={{ borderColor: printMode ? '#000000' : card.borderColor }}>
        {/* CORNERS */}
        <div className="absolute top-[5%] left-[5%] flex flex-col items-center z-20">
          {isJoker ? (
             <div className="flex flex-col items-center">
                <div className={`w-5 h-5 mb-1 ${isJokerRed ? 'text-red-600' : 'text-slate-900'}`}>
                   {getSuitIcon(card.suit, "w-full h-full", true)}
                </div>
                <span className={`text-[8px] md:text-[10px] font-bold font-sans tracking-tighter uppercase writing-mode-vertical ${isJokerRed ? 'text-red-600' : 'text-slate-900'}`} style={{ writingMode: 'vertical-rl', textOrientation: 'upright' }}>
                  JOKER
                </span>
             </div>
          ) : (
             <>
               <span className={`text-xl md:text-2xl font-bold font-serif leading-none ${isRed ? 'text-red-600' : 'text-slate-800'}`}>
                 {rankLabel}
               </span>
               <div className="w-4 h-4 md:w-5 md:h-5 mt-0.5">
                  {getSuitIcon(card.suit, "w-full h-full")}
               </div>
             </>
          )}
        </div>

        {!isSingleHeaded && (
          <div className="absolute bottom-[5%] right-[5%] flex flex-col items-center transform rotate-180 z-20">
            {isJoker ? (
               <div className="flex flex-col items-center">
                  <div className={`w-5 h-5 mb-1 ${isJokerRed ? 'text-red-600' : 'text-slate-900'}`}>
                     {getSuitIcon(card.suit, "w-full h-full", true)}
                  </div>
                  <span className={`text-[8px] md:text-[10px] font-bold font-sans tracking-tighter uppercase writing-mode-vertical ${isJokerRed ? 'text-red-600' : 'text-slate-900'}`} style={{ writingMode: 'vertical-rl', textOrientation: 'upright' }}>
                    JOKER
                  </span>
               </div>
            ) : (
               <>
                 <span className={`text-xl md:text-2xl font-bold font-serif leading-none ${isRed ? 'text-red-600' : 'text-slate-800'}`}>
                   {rankLabel}
                 </span>
                 <div className="w-4 h-4 md:w-5 md:h-5 mt-0.5">
                   {getSuitIcon(card.suit, "w-full h-full")}
                 </div>
               </>
            )}
          </div>
        )}

        {/* IMAGE AREA */}
        <div className="absolute inset-0 flex flex-col items-center justify-center overflow-hidden">
           {card.customImage ? (
             <div className="relative w-full h-full">
               {card.isBackgroundRemoved && !printMode && (
                 <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/az-subtle.png')] opacity-30 z-0"></div>
               )}

               {isSingleHeaded ? (
                 <img 
                   src={card.customImage} 
                   alt="Custom" 
                   className={`w-full h-full object-cover z-10 transition-transform duration-100 ${card.isBackgroundRemoved ? 'object-contain scale-90' : ''}`}
                   style={{ transform: `scale(${card.imageScale}) translate(${card.imageX}%, ${card.imageY}%)` }}
                 />
               ) : (
                 <>
                   <div className="absolute top-0 left-0 right-0 h-1/2 overflow-hidden z-10">
                      <img 
                        src={card.customImage} 
                        alt="Top" 
                        className={`w-full h-[200%] object-cover object-top transition-transform duration-100 ${card.isBackgroundRemoved ? 'object-contain' : ''}`}
                        style={{ transform: `scale(${card.imageScale}) translate(${card.imageX}%, ${card.imageY}%)` }}
                      />
                   </div>
                   <div className="absolute bottom-0 left-0 right-0 h-1/2 overflow-hidden transform rotate-180 z-10 border-t border-white/20">
                      <img 
                        src={card.customImage} 
                        alt="Bottom" 
                        className={`w-full h-[200%] object-cover object-top transition-transform duration-100 ${card.isBackgroundRemoved ? 'object-contain' : ''}`}
                        style={{ transform: `scale(${card.imageScale}) translate(${card.imageX}%, ${card.imageY}%)` }}
                      />
                   </div>
                 </>
               )}
             </div>
           ) : (
             <div className="text-gray-300 flex flex-col items-center p-4 text-center">
               {isJoker ? (
                 <div className={`w-24 h-24 opacity-20 ${isJokerRed ? 'text-red-600' : 'text-slate-900'}`}>
                    {getSuitIcon(card.suit, "w-full h-full", true)}
                 </div>
               ) : (
                 <span className="mb-2 text-3xl opacity-20">📷</span>
               )}
             </div>
           )}
        </div>

        {/* CUSTOM TEXT */}
        {card.customText && (
          <div className={`absolute left-0 right-0 z-30 flex justify-center ${isSingleHeaded ? 'bottom-[10%]' : 'top-1/2 -translate-y-1/2'}`}>
            <span 
              className={`bg-white/90 backdrop-blur-sm px-3 py-1 text-navy-900 font-serif font-bold italic shadow-lg text-xs md:text-sm border-y border-gold-400 ${printMode ? 'border text-black' : ''}`}
            >
              {card.customText}
            </span>
          </div>
        )}

        {!printMode && <div className="absolute inset-1 border border-gold-400 opacity-30 rounded-[8px] pointer-events-none z-40"></div>}
      </div>
    </div>
  );
};

export default CardPreview;
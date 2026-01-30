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
  showCenterMark?: boolean; // New prop for positioning help
}

const CardPreview: React.FC<CardPreviewProps> = ({ 
  card, 
  backConfig,
  className = '', 
  onClick, 
  selected, 
  printMode = false,
  side = 'face',
  showCenterMark = false
}) => {
  // Determine if we are rendering Back or Face
  const isBack = side === 'back';
  
  // Safe accessors depending on what data we have
  const gameType = card?.gameType || GameType.PokerStandard; // Fallback for back preview
  
  // Helper to force fresh image load during export to avoid CORS cache issues
  const processUrl = (url: string | null | undefined) => {
    if (!url) return undefined;
    if (printMode) {
      // Append timestamp to bypass cache and force browser to respect CORS headers
      const separator = url.includes('?') ? '&' : '?';
      return `${url}${separator}t=${Date.now()}`;
    }
    return url;
  };
  
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
    const defaultPattern = "radial-gradient(circle, #0F1623 0%, #05080F 100%)";
    const image = processUrl(backConfig?.customImage);
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
                  crossOrigin="anonymous"
                  className="w-full h-full object-cover transition-transform duration-100"
                  style={{ transform: `scale(${scale}) translate(${x}%, ${y}%)` }}
                />
                {showCenterMark && !printMode && (
                  <div className="absolute inset-0 pointer-events-none flex items-center justify-center z-20">
                    <div className="w-8 h-[1px] bg-gold-500/50 absolute"></div>
                    <div className="h-8 w-[1px] bg-gold-500/50 absolute"></div>
                    <div className="w-2 h-2 rounded-full border border-gold-500/50 absolute"></div>
                  </div>
                )}
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

           {!image && !printMode && (
             <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-10"></div>
           )}
        </div>
      </div>
    );
  }

  // --- RENDER FACE ---
  if (!card) return null;

  const isJoker = card.rank === Rank.Joker;
  const isRed = card.suit === Suit.Hearts || card.suit === Suit.Diamonds;
  const isJokerRed = isJoker && (card.suit === Suit.Hearts || card.suit === Suit.Diamonds);
  const isSingleHeaded = card.gameType === GameType.MariasSingle;
  const rankLabel = getRankLabel(card.rank, card.gameType);
  const hasTemplate = !!card.templateImage;

  // Process URLs for export
  const templateImageSrc = processUrl(card.templateImage);
  const customImageSrc = processUrl(card.customImage);

  // Determine if user image should be BEHIND the template (for Faces/Masks/Frames)
  // Logic: 
  // 1. If it's explicitly the 'obliceje' style.
  // 2. OR if it is MariasSingle game type (because high cards use PNG frames with transparency).
  const isMaskStyle = hasTemplate && (
    card.templateImage?.includes('RUB_a_LIC_obliceje') || 
    card.gameType === GameType.MariasSingle
  );

  const containerClasses = printMode 
    ? `relative w-full h-full overflow-hidden bg-white ${className}`
    : `relative group perspective-1000 w-full ${getAspectRatioClass()} transition-transform duration-300 ${selected ? 'scale-105 z-10' : 'hover:scale-[1.02]'} ${className}`;

  const innerClasses = printMode
    ? `w-full h-full bg-white relative border-[1px] border-gray-300 overflow-hidden`
    : `w-full h-full rounded-xl bg-white shadow-xl overflow-hidden relative border-[6px] transition-all duration-300 ${selected ? 'ring-4 ring-gold-500 ring-offset-2 ring-offset-navy-900' : ''}`;

  return (
    <div onClick={!printMode ? onClick : undefined} className={containerClasses}>
      <div className={innerClasses} style={{ borderColor: printMode ? '#000000' : card.borderColor }}>
        
        {/* CORNERS (Only show if no template image is present, or if it's not a full card design) */}
        {!hasTemplate && (
            <>
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
            </>
        )}

        {/* IMAGE AREA */}
        <div className="absolute inset-0 flex flex-col items-center justify-center overflow-hidden">
           
           {/* Layer 1: Template Image (Only if it is BACKGROUND/Bottom Layer - i.e. NOT a mask) */}
           {hasTemplate && !isMaskStyle && templateImageSrc && (
               <div className="absolute inset-0 z-0">
                   <img 
                    src={templateImageSrc} 
                    alt="Template" 
                    crossOrigin="anonymous"
                    className="w-full h-full object-cover" 
                   />
               </div>
           )}

           {/* Layer 2: User Custom Image */}
           {customImageSrc ? (
             <div className={`relative w-full h-full ${isMaskStyle ? 'z-0' : 'z-10'}`}>
               {card.isBackgroundRemoved && !printMode && (
                 <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/az-subtle.png')] opacity-30 z-0"></div>
               )}

               {isSingleHeaded ? (
                 <img 
                   src={customImageSrc} 
                   alt="Custom" 
                   crossOrigin="anonymous"
                   className={`w-full h-full object-cover z-10 transition-transform duration-100 ${card.isBackgroundRemoved ? 'object-contain scale-90' : ''}`}
                   style={{ transform: `scale(${card.imageScale}) translate(${card.imageX}%, ${card.imageY}%)` }}
                 />
               ) : (
                 <>
                   <div className="absolute top-0 left-0 right-0 h-1/2 overflow-hidden z-10">
                      <img 
                        src={customImageSrc} 
                        alt="Top" 
                        crossOrigin="anonymous"
                        className={`w-full h-[200%] object-cover object-top transition-transform duration-100 ${card.isBackgroundRemoved ? 'object-contain' : ''}`}
                        style={{ transform: `scale(${card.imageScale}) translate(${card.imageX}%, ${card.imageY}%)` }}
                      />
                   </div>
                   <div className="absolute bottom-0 left-0 right-0 h-1/2 overflow-hidden transform rotate-180 z-10 border-t border-white/20">
                      <img 
                        src={customImageSrc} 
                        alt="Bottom" 
                        crossOrigin="anonymous"
                        className={`w-full h-[200%] object-cover object-top transition-transform duration-100 ${card.isBackgroundRemoved ? 'object-contain' : ''}`}
                        style={{ transform: `scale(${card.imageScale}) translate(${card.imageX}%, ${card.imageY}%)` }}
                      />
                   </div>
                 </>
               )}
             </div>
           ) : (
             // Placeholder icon if no custom image AND no template
             !hasTemplate && (
                 <div className="text-gray-300 flex flex-col items-center p-4 text-center z-10">
                {isJoker ? (
                    <div className={`w-24 h-24 opacity-20 ${isJokerRed ? 'text-red-600' : 'text-slate-900'}`}>
                        {getSuitIcon(card.suit, "w-full h-full", true)}
                    </div>
                ) : (
                    <span className="mb-2 text-3xl opacity-20">📷</span>
                )}
                </div>
             )
           )}

           {/* Layer 3: Template Image (If it IS a mask/Face/Frame style - Render ON TOP) */}
           {hasTemplate && isMaskStyle && templateImageSrc && (
               <div className="absolute inset-0 z-20 pointer-events-none">
                   <img 
                    src={templateImageSrc} 
                    alt="Template" 
                    crossOrigin="anonymous"
                    className="w-full h-full object-cover" 
                   />
               </div>
           )}

           {/* Center Mark Overlay */}
           {showCenterMark && !printMode && card.customImage && (
              <div className="absolute inset-0 pointer-events-none flex items-center justify-center z-30">
                <div className="w-8 h-[1px] bg-gold-500/50 absolute"></div>
                <div className="h-8 w-[1px] bg-gold-500/50 absolute"></div>
                <div className="w-2 h-2 rounded-full border border-gold-500/50 absolute"></div>
              </div>
           )}
        </div>

        {/* CUSTOM TEXT */}
        {card.customText && (
          <div className={`absolute left-0 right-0 z-40 flex justify-center ${isSingleHeaded ? 'bottom-[10%]' : 'top-1/2 -translate-y-1/2'}`}>
            <span 
              className={`bg-white/90 backdrop-blur-sm px-3 py-1 text-navy-900 font-serif font-bold italic shadow-lg text-xs md:text-sm border-y border-gold-400 ${printMode ? 'border text-black' : ''}`}
            >
              {card.customText}
            </span>
          </div>
        )}

        {!printMode && <div className="absolute inset-1 border border-gold-400 opacity-30 rounded-[8px] pointer-events-none z-50"></div>}
      </div>
    </div>
  );
};

export default CardPreview;
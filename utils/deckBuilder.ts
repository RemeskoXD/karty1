import { GameType, CardConfig, Suit, Rank, GameConfig, CardStyle } from '../types';

export const GAME_VARIANTS: Record<GameType, GameConfig> = {
  [GameType.MariasSingle]: {
    id: GameType.MariasSingle,
    name: 'Mariášové Jednohlavé',
    description: 'Klasické české karty, 32 listů. Ideální na Prší nebo Mariáš.',
    cardCount: 32,
    dimensions: { width: 56, height: 89, label: '56 × 89 mm' },
    ranks: [Rank.Seven, Rank.Eight, Rank.Nine, Rank.Ten, Rank.Jack, Rank.Queen, Rank.King, Rank.Ace]
  },
  [GameType.MariasDouble]: {
    id: GameType.MariasDouble,
    name: 'Mariášové Dvouhlavé',
    description: 'Moderní verze mariášek, zrcadlový obraz. Nemusíte karty otáčet.',
    cardCount: 32,
    dimensions: { width: 56, height: 89, label: '56 × 89 mm' },
    ranks: [Rank.Seven, Rank.Eight, Rank.Nine, Rank.Ten, Rank.Jack, Rank.Queen, Rank.King, Rank.Ace]
  },
  [GameType.PokerStandard]: {
    id: GameType.PokerStandard,
    name: 'Poker Standard',
    description: 'Francouzské karty, 52 listů + Žolíci. Klasické indexy ve 4 rozích.',
    cardCount: 54,
    dimensions: { width: 63, height: 88, label: '63 × 88 mm' },
    ranks: [Rank.Two, Rank.Three, Rank.Four, Rank.Five, Rank.Six, Rank.Seven, Rank.Eight, Rank.Nine, Rank.Ten, Rank.Jack, Rank.Queen, Rank.King, Rank.Ace]
  },
  [GameType.PokerBig]: {
    id: GameType.PokerBig,
    name: 'Poker 4BIG Index',
    description: 'Francouzské karty s obřími indexy. Skvěle čitelné i potmě.',
    cardCount: 54,
    dimensions: { width: 63, height: 88, label: '63 × 88 mm' },
    ranks: [Rank.Two, Rank.Three, Rank.Four, Rank.Five, Rank.Six, Rank.Seven, Rank.Eight, Rank.Nine, Rank.Ten, Rank.Jack, Rank.Queen, Rank.King, Rank.Ace]
  },
  [GameType.Canasta]: {
    id: GameType.Canasta,
    name: 'Canasta / Žolíky',
    description: 'Dva balíčky po 54 kartách. Užší formát pro držení v ruce.',
    cardCount: 108, 
    dimensions: { width: 57, height: 88, label: '57 × 88 mm' },
    ranks: [Rank.Two, Rank.Three, Rank.Four, Rank.Five, Rank.Six, Rank.Seven, Rank.Eight, Rank.Nine, Rank.Ten, Rank.Jack, Rank.Queen, Rank.King, Rank.Ace]
  }
};

export const getGameShortCode = (gameType: GameType): string => {
    switch(gameType) {
        case GameType.MariasSingle: return 'M1H';
        case GameType.MariasDouble: return 'M2H';
        case GameType.PokerStandard: return 'PST';
        case GameType.PokerBig: return 'P4B';
        case GameType.Canasta: return 'CAN';
        default: return 'UKN';
    }
};

// 300 DPI calculation (1 mm = 11.811 px)
// Returns object with width and height in pixels
export const getPrintDimensions = (gameType: GameType): { width: number, height: number } => {
    const mm = GAME_VARIANTS[gameType].dimensions;
    const DPI_FACTOR = 11.811; 
    return {
        width: Math.round(mm.width * DPI_FACTOR),
        height: Math.round(mm.height * DPI_FACTOR)
    };
};

const getMariasFileName = (prefix: 'm1h' | 'm2h', rank: Rank, suit: Suit, version: string): string => {
    // Map Suits to Offset and Name
    let suitOffset = 0;
    let suitName = '';
    
    // Order in file list: Kule (01), Srdce (09), Zelene (17), Zaludy (25)
    switch(suit) {
        case Suit.Diamonds: suitOffset = 1; suitName = 'kule'; break;
        case Suit.Hearts: suitOffset = 9; suitName = 'srdce'; break;
        case Suit.Spades: suitOffset = 17; suitName = 'zelene'; break; // Piky = Zelené in Marias context logic
        case Suit.Clubs: suitOffset = 25; suitName = 'zaludy'; break;
    }

    // Map Ranks to Offset and Name
    // Order: 7, 8, 9, 10, Spodek, Svrsek, Kral, Eso
    let rankOffset = 0;
    let rankName = '';
    
    switch(rank) {
        case Rank.Seven: rankOffset = 0; rankName = '7'; break;
        case Rank.Eight: rankOffset = 1; rankName = '8'; break;
        case Rank.Nine: rankOffset = 2; rankName = '9'; break;
        case Rank.Ten: rankOffset = 3; rankName = '10'; break;
        case Rank.Jack: rankOffset = 4; rankName = 'spodek'; break;
        case Rank.Queen: rankOffset = 5; rankName = 'svrsek'; break;
        case Rank.King: rankOffset = 6; rankName = 'kral'; break;
        case Rank.Ace: rankOffset = 7; rankName = 'eso'; break;
    }

    const finalIndex = suitOffset + rankOffset;
    const paddedIndex = finalIndex.toString().padStart(2, '0');
    
    // Output format: m1h_v3_01_kule_7.png or m2h_v1_01_kule_7.png
    return `${prefix}_${version}_${paddedIndex}_${suitName}_${rankName}.png`;
};

const getPokerStandardFileName = (rank: Rank, suit: Suit, version: string): string => {
    // Based on pst_v1 screenshot structure
    let index = 0;
    let suitName = '';
    let rankName = '';

    // Mapping helper
    if (rank === Rank.Joker) {
        // 02 and 03 are Jokers
        index = (suit === Suit.Hearts || suit === Suit.Diamonds) ? 2 : 3;
        return `pst_${version}_${index.toString().padStart(2, '0')}_joker.png`;
    }

    switch(suit) {
        case Suit.Hearts: suitName = 'srdce'; break;
        case Suit.Diamonds: suitName = 'kara'; break; 
        case Suit.Spades: suitName = 'piky'; break;
        case Suit.Clubs: suitName = 'krize'; break;
    }

    switch(rank) {
        case Rank.Ace: rankName = 'eso'; break;
        case Rank.King: rankName = 'kral'; break;
        case Rank.Queen: rankName = 'dama'; break;
        case Rank.Jack: rankName = 'kluk'; break;
        default: rankName = rank; break;
    }

    const isV1 = version === 'v1';

    if (suit === Suit.Hearts) { 
        if (rank === Rank.Ace) index = 1;
        else if (rank === Rank.King) index = 4;
        else if (rank === Rank.Queen) index = 5;
        else if (rank === Rank.Jack) index = 6;
        else { const num = parseInt(rank); index = 26 - num; }
    } else if (suit === Suit.Diamonds) { 
        if (rank === Rank.Ace) index = 34;
        else if (rank === Rank.King) index = 7;
        else if (rank === Rank.Queen) index = 8;
        else if (rank === Rank.Jack) index = 9;
        else { const num = parseInt(rank); index = 35 - num; }
    } else if (suit === Suit.Spades) { 
        if (rank === Rank.Ace) index = 54;
        else if (rank === Rank.King) index = isV1 ? 10 : 13;
        else if (rank === Rank.Queen) index = isV1 ? 11 : 14;
        else if (rank === Rank.Jack) index = isV1 ? 12 : 15;
        else { const num = parseInt(rank); index = 55 - num; }
    } else if (suit === Suit.Clubs) { 
        if (rank === Rank.Ace) index = 44;
        else if (rank === Rank.King) index = isV1 ? 13 : 10;
        else if (rank === Rank.Queen) index = isV1 ? 14 : 11;
        else if (rank === Rank.Jack) index = isV1 ? 15 : 12;
        else { const num = parseInt(rank); index = 45 - num; }
    }

    return `pst_${version}_${index.toString().padStart(2, '0')}_${suitName}_${rankName}.png`;
};

const getPokerBigFileName = (rank: Rank, suit: Suit, version: string): string => {
    // Prefix 'p4b' based on file analysis
    let index = 0;
    let suitName = '';
    let rankName = '';

    if (rank === Rank.Joker) {
        index = (suit === Suit.Hearts || suit === Suit.Diamonds) ? 2 : 3;
        return `p4b_${version}_${index.toString().padStart(2, '0')}_joker.png`;
    }

    switch(suit) {
        case Suit.Hearts: suitName = 'srdce'; break;
        case Suit.Diamonds: suitName = 'kara'; break; 
        case Suit.Spades: suitName = 'piky'; break;
        case Suit.Clubs: suitName = 'krize'; break;
    }

    switch(rank) {
        case Rank.Ace: rankName = 'eso'; break;
        case Rank.King: rankName = 'kral'; break;
        case Rank.Queen: rankName = 'dama'; break;
        case Rank.Jack: rankName = 'kluk'; break;
        default: rankName = rank; break;
    }

    // Logic logic:
    // v1: Piky Faces are 10-12, Krize Faces are 13-15
    // v2/v3: Krize Faces are 10-12, Piky Faces are 13-15
    const isV1 = version === 'v1';

    if (suit === Suit.Hearts) { 
        if (rank === Rank.Ace) index = 1;
        else if (rank === Rank.King) index = 4;
        else if (rank === Rank.Queen) index = 5;
        else if (rank === Rank.Jack) index = 6;
        else { const num = parseInt(rank); index = 26 - num; }
    } else if (suit === Suit.Diamonds) { 
        if (rank === Rank.Ace) index = 34;
        else if (rank === Rank.King) index = 7;
        else if (rank === Rank.Queen) index = 8;
        else if (rank === Rank.Jack) index = 9;
        else { const num = parseInt(rank); index = 35 - num; }
    } else if (suit === Suit.Spades) { 
        if (rank === Rank.Ace) index = 54;
        else if (rank === Rank.King) index = isV1 ? 10 : 13;
        else if (rank === Rank.Queen) index = isV1 ? 11 : 14;
        else if (rank === Rank.Jack) index = isV1 ? 12 : 15;
        else { const num = parseInt(rank); index = 55 - num; }
    } else if (suit === Suit.Clubs) { 
        if (rank === Rank.Ace) index = 44;
        else if (rank === Rank.King) index = isV1 ? 13 : 10;
        else if (rank === Rank.Queen) index = isV1 ? 14 : 11;
        else if (rank === Rank.Jack) index = isV1 ? 15 : 12;
        else { const num = parseInt(rank); index = 45 - num; }
    }

    return `p4b_${version}_${index.toString().padStart(2, '0')}_${suitName}_${rankName}.png`;
};

export const generateDeck = (gameType: GameType, cardStyle: CardStyle): CardConfig[] => {
  const config = GAME_VARIANTS[gameType];
  const deck: CardConfig[] = [];
  const suits = Object.values(Suit);
  
  let idCounter = 1;

  // --- Marias Single (Jednohlavé) Configuration ---
  const isMariasSingle = gameType === GameType.MariasSingle;
  let mariasSingleBaseUrl = 'https://web2.itnahodinu.cz/karty/M1H/'; 
  let mariasSingleVersion = 'v1'; 
  
  if (isMariasSingle) {
      if (cardStyle === CardStyle.BackAndFaceFaces) {
          mariasSingleBaseUrl = 'https://web2.itnahodinu.cz/karty/M1H/RUB_a_LIC_obliceje/';
          mariasSingleVersion = 'v3';
      } else if (cardStyle === CardStyle.BackAndFace) {
          mariasSingleBaseUrl = 'https://web2.itnahodinu.cz/karty/M1H/RUB_a_LIC/';
          mariasSingleVersion = 'v2';
      }
  }

  // --- Marias Double (Dvouhlavé) Configuration ---
  const isMariasDouble = gameType === GameType.MariasDouble;
  const mariasDoubleBaseUrl = 'https://web2.itnahodinu.cz/karty/M2H/RUB/';
  const mariasDoubleVersion = 'v1';

  // --- Poker Standard Configuration ---
  const isPokerStandard = gameType === GameType.PokerStandard;
  let pokerBaseUrl = 'https://web2.itnahodinu.cz/karty/PST_a_CAN/RUB/';
  let pokerVersion = 'v1';

  if (isPokerStandard) {
      if (cardStyle === CardStyle.BackAndFace) {
          pokerBaseUrl = 'https://web2.itnahodinu.cz/karty/PST_a_CAN/RUB_a_LIC/';
          pokerVersion = 'v3';
      } else if (cardStyle === CardStyle.BackAndFaceFaces) {
          pokerBaseUrl = 'https://web2.itnahodinu.cz/karty/PST_a_CAN/RUB_a_LIC_figury/';
          pokerVersion = 'v2';
      }
  }

  // --- Poker Big Configuration ---
  const isPokerBig = gameType === GameType.PokerBig;
  let pokerBigBaseUrl = 'https://web2.itnahodinu.cz/karty/PST4BIG/RUB/';
  let pokerBigVersion = 'v1';

  if (isPokerBig) {
      if (cardStyle === CardStyle.BackAndFace) {
          pokerBigBaseUrl = 'https://web2.itnahodinu.cz/karty/PST4BIG/RUB_a_LIC/';
          pokerBigVersion = 'v3';
      } else if (cardStyle === CardStyle.BackAndFaceFaces) {
          pokerBigBaseUrl = 'https://web2.itnahodinu.cz/karty/PST4BIG/RUB_a_LIC_figury/';
          pokerBigVersion = 'v2';
      }
  }

  // 1. Generate Standard Cards
  suits.forEach(suit => {
    config.ranks.forEach(rank => {
      let templateImage: string | undefined = undefined;
      let isLocked = false;

      // Logic for Marias Single
      if (isMariasSingle) {
          if (cardStyle === CardStyle.BackAndFaceFaces) {
              const editableRanks = [Rank.Jack, Rank.Queen, Rank.King];
              if (!editableRanks.includes(rank)) {
                  isLocked = true;
              }
              templateImage = `${mariasSingleBaseUrl}${getMariasFileName('m1h', rank, suit, mariasSingleVersion)}`;
          } 
          else if (cardStyle === CardStyle.BackAndFace) {
              if (suit === Suit.Diamonds) {
                  if ([Rank.Eight, Rank.Nine, Rank.Ten].includes(rank)) {
                      isLocked = true;
                  }
              } else {
                  if ([Rank.Seven, Rank.Eight, Rank.Nine, Rank.Ten].includes(rank)) {
                      isLocked = true;
                  }
              }
              templateImage = `${mariasSingleBaseUrl}${getMariasFileName('m1h', rank, suit, mariasSingleVersion)}`;
          }
          else if (cardStyle !== CardStyle.CustomGame) {
              const lockedRanks = [Rank.Seven, Rank.Eight, Rank.Nine, Rank.Ten];
              if (lockedRanks.includes(rank)) {
                  isLocked = true;
              }
              templateImage = `${mariasSingleBaseUrl}${getMariasFileName('m1h', rank, suit, mariasSingleVersion)}`;
          }
      }

      // Logic for Marias Double
      if (isMariasDouble) {
          if (cardStyle === CardStyle.BackOnly) {
              isLocked = true;
              templateImage = `${mariasDoubleBaseUrl}${getMariasFileName('m2h', rank, suit, mariasDoubleVersion)}`;
          }
      }

      // Logic for Poker Standard
      if (isPokerStandard) {
          if (cardStyle === CardStyle.BackOnly) {
              isLocked = true;
              templateImage = `${pokerBaseUrl}${getPokerStandardFileName(rank, suit, pokerVersion)}`;
          } else if (cardStyle === CardStyle.BackAndFace) {
               isLocked = false; 
               templateImage = `${pokerBaseUrl}${getPokerStandardFileName(rank, suit, pokerVersion)}`;
          } else if (cardStyle === CardStyle.BackAndFaceFaces) {
               const editableRanks = [Rank.King, Rank.Queen, Rank.Jack];
               if (!editableRanks.includes(rank)) {
                   isLocked = true;
               }
               templateImage = `${pokerBaseUrl}${getPokerStandardFileName(rank, suit, pokerVersion)}`;
          }
      }

      // Logic for Poker Big
      if (isPokerBig) {
          if (cardStyle === CardStyle.BackOnly) {
              // Rub (BackOnly): v1 files, Locked
              isLocked = true;
              templateImage = `${pokerBigBaseUrl}${getPokerBigFileName(rank, suit, pokerBigVersion)}`;
          } else if (cardStyle === CardStyle.BackAndFace) {
              // Rub + Lice (BackAndFace): v3 files, Unlocked
              isLocked = false;
              templateImage = `${pokerBigBaseUrl}${getPokerBigFileName(rank, suit, pokerBigVersion)}`;
          } else if (cardStyle === CardStyle.BackAndFaceFaces) {
              // Rub + Obliceje (BackAndFaceFaces): v2 files, Locked except Faces
              const editableRanks = [Rank.King, Rank.Queen, Rank.Jack];
              if (!editableRanks.includes(rank)) {
                  isLocked = true;
              }
              templateImage = `${pokerBigBaseUrl}${getPokerBigFileName(rank, suit, pokerBigVersion)}`;
          }
      }

      deck.push({
        id: `card-${idCounter++}`,
        suit: suit,
        rank: rank,
        customImage: null,
        templateImage: templateImage,
        imageScale: 1,
        imageX: 0,
        imageY: 0,
        customText: '',
        borderColor: '#D4AF37',
        gameType: gameType,
        isLocked: isLocked
      });
    });
  });

  // 2. Add Jokers for Poker and Canasta
  const needsJokers = [GameType.PokerStandard, GameType.PokerBig, GameType.Canasta].includes(gameType);
  
  if (needsJokers) {
    let jokerLocked = false;
    let jokerTemplateRed: string | undefined = undefined;
    let jokerTemplateBlack: string | undefined = undefined;

    if (isPokerStandard) {
        if (cardStyle === CardStyle.BackOnly) {
            jokerLocked = true;
        } else if (cardStyle === CardStyle.BackAndFaceFaces) {
            jokerLocked = false;
        }
        if (cardStyle !== CardStyle.CustomGame) {
             jokerTemplateRed = `${pokerBaseUrl}${getPokerStandardFileName(Rank.Joker, Suit.Hearts, pokerVersion)}`;
             jokerTemplateBlack = `${pokerBaseUrl}${getPokerStandardFileName(Rank.Joker, Suit.Spades, pokerVersion)}`;
        }
    }

    if (isPokerBig) {
        if (cardStyle === CardStyle.BackOnly) {
            jokerLocked = true;
        } else if (cardStyle === CardStyle.BackAndFaceFaces) {
            jokerLocked = false; // Jokers editable in Faces style
        }
        if (cardStyle !== CardStyle.CustomGame) {
             jokerTemplateRed = `${pokerBigBaseUrl}${getPokerBigFileName(Rank.Joker, Suit.Hearts, pokerBigVersion)}`;
             jokerTemplateBlack = `${pokerBigBaseUrl}${getPokerBigFileName(Rank.Joker, Suit.Spades, pokerBigVersion)}`;
        }
    }

    // Red Joker
    deck.push({
      id: `card-joker-red-${idCounter++}`,
      suit: Suit.Hearts,
      rank: Rank.Joker,
      customImage: null,
      templateImage: jokerTemplateRed,
      imageScale: 1,
      imageX: 0,
      imageY: 0,
      customText: '',
      borderColor: '#D4AF37',
      gameType: gameType,
      isLocked: jokerLocked
    });
    // Black Joker
    deck.push({
      id: `card-joker-black-${idCounter++}`,
      suit: Suit.Spades,
      rank: Rank.Joker,
      customImage: null,
      templateImage: jokerTemplateBlack,
      imageScale: 1,
      imageX: 0,
      imageY: 0,
      customText: '',
      borderColor: '#D4AF37',
      gameType: gameType,
      isLocked: jokerLocked
    });
  }

  return deck;
};

export const getRankLabel = (rank: Rank, gameType: GameType): string => {
  if (rank === Rank.Joker) return 'JOKER';

  const isMarias = gameType === GameType.MariasSingle || gameType === GameType.MariasDouble;
  
  if (isMarias) {
    switch(rank) {
      case Rank.Jack: return 'Spodek';
      case Rank.Queen: return 'Svršek';
      case Rank.King: return 'Král';
      case Rank.Ace: return 'Eso';
      default: return rank;
    }
  } else {
    switch(rank) {
      case Rank.Jack: return 'J';
      case Rank.Queen: return 'Q';
      case Rank.King: return 'K';
      case Rank.Ace: return 'A';
      default: return rank;
    }
  }
};
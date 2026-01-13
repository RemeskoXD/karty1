import { GameType, CardConfig, Suit, Rank, GameConfig } from '../types';

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

export const generateDeck = (gameType: GameType): CardConfig[] => {
  const config = GAME_VARIANTS[gameType];
  const deck: CardConfig[] = [];
  const suits = Object.values(Suit);
  
  let idCounter = 1;

  // 1. Generate Standard Cards
  suits.forEach(suit => {
    config.ranks.forEach(rank => {
      deck.push({
        id: `card-${idCounter++}`,
        suit: suit,
        rank: rank,
        customImage: null,
        imageScale: 1,
        imageX: 0,
        imageY: 0,
        customText: '',
        borderColor: '#D4AF37',
        gameType: gameType
      });
    });
  });

  // 2. Add Jokers for Poker and Canasta
  const needsJokers = [GameType.PokerStandard, GameType.PokerBig, GameType.Canasta].includes(gameType);
  
  if (needsJokers) {
    // Red Joker
    deck.push({
      id: `card-joker-red-${idCounter++}`,
      suit: Suit.Hearts,
      rank: Rank.Joker,
      customImage: null,
      imageScale: 1,
      imageX: 0,
      imageY: 0,
      customText: '',
      borderColor: '#D4AF37',
      gameType: gameType
    });
    // Black Joker
    deck.push({
      id: `card-joker-black-${idCounter++}`,
      suit: Suit.Spades,
      rank: Rank.Joker,
      customImage: null,
      imageScale: 1,
      imageX: 0,
      imageY: 0,
      customText: '',
      borderColor: '#D4AF37',
      gameType: gameType
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
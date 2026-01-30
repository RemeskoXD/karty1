export enum Suit {
  Hearts = 'Srdce', // Červené
  Diamonds = 'Kule', // Koule/Bubny
  Clubs = 'Žaludy', // Kříže
  Spades = 'Listy'  // Piky/Zelené
}

export enum Rank {
  Two = '2',
  Three = '3',
  Four = '4',
  Five = '5',
  Six = '6',
  Seven = '7',
  Eight = '8',
  Nine = '9',
  Ten = '10',
  Jack = 'J', // U Mariáše Spodek
  Queen = 'Q', // U Mariáše Svršek
  King = 'K',
  Ace = 'A',
  Joker = 'JOKER'
}

export enum GameType {
  MariasSingle = 'marias-single', // Jednohlavé
  MariasDouble = 'marias-double', // Dvouhlavé
  PokerStandard = 'poker-standard',
  PokerBig = 'poker-big', // 2BIG / 4BIG
  Canasta = 'canasta'
}

export enum CardStyle {
  BackOnly = 'back-only', // Pouze Rub
  BackAndFace = 'back-face', // Rub + Líce
  BackAndFaceFaces = 'back-face-faces', // Rub + Líce (Obličeje)
  CustomGame = 'custom-game' // Vlastní hra
}

export interface GameConfig {
  id: GameType;
  name: string;
  description: string;
  cardCount: number;
  dimensions: { width: number; height: number; label: string };
  ranks: Rank[];
}

export interface CardConfig {
  id: string; // Unique UUID
  suit: Suit;
  rank: Rank;
  customImage: string | null;
  templateImage?: string; // URL to the static card background/frame
  isBackgroundRemoved?: boolean;
  imageScale: number;
  imageX: number;
  imageY: number;
  customText: string;
  borderColor: string;
  gameType: GameType;
  isLocked?: boolean; // New property to prevent editing specific cards
}

export interface CardBackConfig {
  customImage: string | null;
  customText: string;
  borderColor: string;
  imageScale: number;
  imageX: number;
  imageY: number;
  color: string; // Background color if no image
}

export interface OrderDetails {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  street: string;
  city: string;
  zip: string;
  deliveryMethod: 'zasilkovna' | 'posta' | 'ppl';
  paymentMethod: 'card' | 'transfer';
  note: string;
}

export type OrderStatus = 'new' | 'processing' | 'issue' | 'done' | 'cancelled' | 'deleted';

export interface Order {
  id: string;
  date: string; // ISO String
  customer: OrderDetails;
  gameType: GameType;
  cardStyle: CardStyle;
  deck: CardConfig[];
  backConfig: CardBackConfig;
  totalPrice: number;
  status: OrderStatus;
  deletedAt?: string | null; // ISO String when moved to trash
}

export type NavItem = {
  label: string;
  href: string;
};
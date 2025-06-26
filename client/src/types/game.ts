export interface Game {
  id: number;
  name: string;
  provider: string;
  category: string;
  subcategory?: string | null;
  isHot?: boolean;
  isNew?: boolean;
  imageUrl?: string | null;
  description?: string | null;
  minBet: string;
  maxBet: string;
  rtp?: string;
  volatility?: string;
  isActive?: boolean;
  isLive?: boolean;
  gameConfig?: any;
  createdAt?: Date;
}

export interface GameSession {
  id: number;
  userId: number;
  gameId: number;
  betAmount: string;
  winAmount: string;
  isWin: boolean;
  createdAt: Date;
}

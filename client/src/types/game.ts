export interface Game {
  id: number;
  name: string;
  provider: string;
  category: string;
  isHot?: boolean;
  isNew?: boolean;
  imageUrl?: string | null;
  description?: string | null;
  minBet: string;
  maxBet: string;
  isActive?: boolean;
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

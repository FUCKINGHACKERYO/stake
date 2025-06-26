import { 
  users, games, gameSessions, transactions, promotions, liveBets,
  type User, type InsertUser, type Game, type InsertGame, 
  type GameSession, type InsertGameSession, type Transaction, 
  type InsertTransaction, type Promotion, type InsertPromotion,
  type LiveBet, type InsertLiveBet
} from "@shared/schema";

export interface IStorage {
  // User methods
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  updateUserBalance(id: number, newBalance: number): Promise<User | undefined>;
  updateUserStats(id: number, wagered: number, won: number): Promise<User | undefined>;
  
  // Game methods
  getAllGames(): Promise<Game[]>;
  getGamesByCategory(category: string): Promise<Game[]>;
  getGame(id: number): Promise<Game | undefined>;
  createGame(game: InsertGame): Promise<Game>;
  
  // Game session methods
  createGameSession(session: InsertGameSession): Promise<GameSession>;
  getUserGameSessions(userId: number): Promise<GameSession[]>;
  getRecentSessions(limit?: number): Promise<GameSession[]>;
  
  // Transaction methods
  createTransaction(transaction: InsertTransaction): Promise<Transaction>;
  getUserTransactions(userId: number): Promise<Transaction[]>;
  
  // Promotion methods
  getActivePromotions(): Promise<Promotion[]>;
  createPromotion(promotion: InsertPromotion): Promise<Promotion>;
  
  // Live betting methods
  createLiveBet(bet: InsertLiveBet): Promise<LiveBet>;
  getActiveLiveBets(gameId: number): Promise<LiveBet[]>;
  updateLiveBet(id: number, updates: Partial<LiveBet>): Promise<LiveBet | undefined>;
}

export class MemStorage implements IStorage {
  private users: Map<number, User>;
  private games: Map<number, Game>;
  private gameSessions: Map<number, GameSession>;
  private transactions: Map<number, Transaction>;
  private promotions: Map<number, Promotion>;
  private liveBets: Map<number, LiveBet>;
  private currentUserId: number;
  private currentGameId: number;
  private currentSessionId: number;
  private currentTransactionId: number;
  private currentPromotionId: number;
  private currentLiveBetId: number;

  constructor() {
    this.users = new Map();
    this.games = new Map();
    this.gameSessions = new Map();
    this.transactions = new Map();
    this.promotions = new Map();
    this.liveBets = new Map();
    this.currentUserId = 1;
    this.currentGameId = 1;
    this.currentSessionId = 1;
    this.currentTransactionId = 1;
    this.currentPromotionId = 1;
    this.currentLiveBetId = 1;
    
    // Initialize with comprehensive data
    this.initializeGames();
    this.initializePromotions();
    this.initializeDemoUser();
  }

  private initializeGames() {
    const sampleGames: InsertGame[] = [
      // Stake Originals
      {
        name: "Plinko",
        provider: "Stake Originals",
        category: "originals",
        subcategory: "plinko",
        isHot: true,
        isNew: false,
        description: "Drop the ball and watch it bounce to your fortune!",
        minBet: "0.01",
        maxBet: "1000.00",
        rtp: "99.00",
        volatility: "medium",
        isLive: false,
        gameConfig: { rows: 16, risk: "low" }
      },
      {
        name: "Crash",
        provider: "Stake Originals",
        category: "originals",
        subcategory: "crash",
        isHot: true,
        isNew: false,
        description: "Watch the multiplier soar, but cash out before it crashes!",
        minBet: "0.01",
        maxBet: "1000.00",
        rtp: "99.00",
        volatility: "high",
        isLive: true,
        gameConfig: { maxMultiplier: 1000000 }
      },
      {
        name: "Dice",
        provider: "Stake Originals",
        category: "originals",
        subcategory: "dice",
        isHot: false,
        isNew: false,
        description: "Roll the dice and predict the outcome. Simple yet thrilling!",
        minBet: "0.01",
        maxBet: "1000.00",
        rtp: "99.00",
        volatility: "medium",
        isLive: false,
        gameConfig: { sides: 6, multiplier: 5.94 }
      },
      {
        name: "Mines",
        provider: "Stake Originals",
        category: "originals",
        subcategory: "mines",
        isHot: false,
        isNew: true,
        description: "Navigate the minefield and claim your treasure!",
        minBet: "0.01",
        maxBet: "1000.00",
        rtp: "99.00",
        volatility: "high",
        isLive: false,
        gameConfig: { gridSize: 25, mines: 3 }
      },
      {
        name: "Limbo",
        provider: "Stake Originals",
        category: "originals",
        subcategory: "limbo",
        isHot: false,
        isNew: false,
        description: "How high can you go? Set your target and see if you can reach it!",
        minBet: "0.01",
        maxBet: "1000.00",
        rtp: "99.00",
        volatility: "high",
        isLive: false,
        gameConfig: { maxMultiplier: 1000000 }
      },
      // Slots
      {
        name: "Gates of Olympus",
        provider: "Pragmatic Play",
        category: "slots",
        subcategory: "video_slots",
        isHot: true,
        isNew: false,
        description: "Legendary slot with cascading wins and multipliers",
        minBet: "0.20",
        maxBet: "125.00",
        rtp: "96.50",
        volatility: "high",
        isLive: false,
        gameConfig: { reels: 6, rows: 5, paylines: "all_ways" }
      },
      {
        name: "Sweet Bonanza",
        provider: "Pragmatic Play",
        category: "slots",
        subcategory: "video_slots",
        isHot: false,
        isNew: false,
        description: "Sweet treats and big wins with tumbling reels",
        minBet: "0.20",
        maxBet: "125.00",
        rtp: "96.48",
        volatility: "high",
        isLive: false,
        gameConfig: { reels: 6, rows: 5, paylines: "all_ways" }
      },
      {
        name: "The Dog House",
        provider: "Pragmatic Play",
        category: "slots",
        subcategory: "video_slots",
        isHot: false,
        isNew: false,
        description: "Unleash the hounds for massive wins!",
        minBet: "0.20",
        maxBet: "125.00",
        rtp: "96.51",
        volatility: "high",
        isLive: false,
        gameConfig: { reels: 5, rows: 3, paylines: 20 }
      },
      // Live Casino
      {
        name: "Crazy Time",
        provider: "Evolution Gaming",
        category: "live",
        subcategory: "game_shows",
        isHot: true,
        isNew: false,
        description: "The ultimate game show experience with 4 exciting bonus games",
        minBet: "0.10",
        maxBet: "500.00",
        rtp: "96.08",
        volatility: "high",
        isLive: true,
        gameConfig: { wheel_segments: 54, bonus_games: 4 }
      },
      {
        name: "Lightning Roulette",
        provider: "Evolution Gaming",
        category: "live",
        subcategory: "roulette",
        isHot: false,
        isNew: false,
        description: "European roulette with electrifying RNG multipliers",
        minBet: "0.20",
        maxBet: "25000.00",
        rtp: "97.30",
        volatility: "medium",
        isLive: true,
        gameConfig: { type: "european", lightning_numbers: 5 }
      },
      {
        name: "Blackjack Party",
        provider: "Evolution Gaming",
        category: "live",
        subcategory: "blackjack",
        isHot: false,
        isNew: false,
        description: "Fun blackjack with party atmosphere and side bets",
        minBet: "1.00",
        maxBet: "5000.00",
        rtp: "99.28",
        volatility: "low",
        isLive: true,
        gameConfig: { decks: 8, side_bets: true }
      }
    ];

    sampleGames.forEach(game => {
      this.createGame(game);
    });
  }

  private initializePromotions() {
    const promotions: InsertPromotion[] = [
      {
        title: "Welcome Bonus",
        description: "Get 200% bonus on your first deposit up to $2000",
        type: "welcome_bonus",
        value: "2000.00",
        minDeposit: "20.00",
        wagering: 40,
        isActive: true,
        validFrom: new Date(),
        validTo: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) // 30 days
      },
      {
        title: "Weekly Reload",
        description: "50% bonus every Monday up to $500",
        type: "reload_bonus",
        value: "500.00",
        minDeposit: "50.00",
        wagering: 25,
        isActive: true,
        validFrom: new Date(),
        validTo: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // 7 days
      },
      {
        title: "Daily Cashback",
        description: "Get 10% cashback on your daily losses",
        type: "cashback",
        value: "1000.00",
        wagering: 1,
        isActive: true,
        validFrom: new Date(),
        validTo: new Date(Date.now() + 24 * 60 * 60 * 1000) // 24 hours
      }
    ];

    promotions.forEach(promo => {
      this.createPromotion(promo);
    });
  }

  private initializeDemoUser() {
    const demoUser: InsertUser = {
      username: "demo_player",
      email: "demo@stake.com",
      password: "demo123"
    };
    this.createUser(demoUser);
  }

  // User methods
  async getUser(id: number): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.username === username,
    );
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = this.currentUserId++;
    const user: User = { 
      ...insertUser,
      id, 
      email: insertUser.email || null,
      balance: "1000.00",
      currency: "USD",
      isVerified: false,
      isVip: false,
      level: 1,
      experience: 0,
      totalWagered: "0.00",
      totalWon: "0.00",
      avatar: null,
      country: null,
      createdAt: new Date(),
      lastLogin: null
    };
    this.users.set(id, user);
    return user;
  }

  async updateUserBalance(id: number, newBalance: number): Promise<User | undefined> {
    const user = this.users.get(id);
    if (!user) return undefined;
    
    const updatedUser: User = {
      ...user,
      balance: newBalance.toFixed(2)
    };
    this.users.set(id, updatedUser);
    return updatedUser;
  }

  async updateUserStats(id: number, wagered: number, won: number): Promise<User | undefined> {
    const user = this.users.get(id);
    if (!user) return undefined;
    
    const currentWagered = parseFloat(user.totalWagered || "0");
    const currentWon = parseFloat(user.totalWon || "0");
    const currentExp = user.experience || 0;
    
    const updatedUser: User = {
      ...user,
      totalWagered: (currentWagered + wagered).toFixed(2),
      totalWon: (currentWon + won).toFixed(2),
      experience: currentExp + Math.floor(wagered)
    };
    this.users.set(id, updatedUser);
    return updatedUser;
  }

  // Game methods
  async getAllGames(): Promise<Game[]> {
    return Array.from(this.games.values()).filter(game => game.isActive);
  }

  async getGamesByCategory(category: string): Promise<Game[]> {
    return Array.from(this.games.values()).filter(
      game => game.isActive && (category === "all" || game.category === category)
    );
  }

  async getGame(id: number): Promise<Game | undefined> {
    return this.games.get(id);
  }

  async createGame(insertGame: InsertGame): Promise<Game> {
    const id = this.currentGameId++;
    const game: Game = {
      ...insertGame,
      id,
      subcategory: insertGame.subcategory || null,
      isHot: insertGame.isHot || false,
      isNew: insertGame.isNew || false,
      imageUrl: insertGame.imageUrl || null,
      description: insertGame.description || null,
      minBet: insertGame.minBet || "0.01",
      maxBet: insertGame.maxBet || "1000.00",
      rtp: insertGame.rtp || "96.00",
      volatility: insertGame.volatility || "medium",
      isActive: insertGame.isActive !== false,
      isLive: insertGame.isLive || false,
      gameConfig: insertGame.gameConfig || null,
      createdAt: new Date()
    };
    this.games.set(id, game);
    return game;
  }

  // Game session methods
  async createGameSession(insertSession: InsertGameSession): Promise<GameSession> {
    const id = this.currentSessionId++;
    const session: GameSession = {
      ...insertSession,
      id,
      winAmount: insertSession.winAmount || "0.00",
      multiplier: insertSession.multiplier || "0.0000",
      isWin: insertSession.isWin || false,
      gameData: insertSession.gameData || null,
      status: insertSession.status || "completed",
      createdAt: new Date()
    };
    this.gameSessions.set(id, session);
    return session;
  }

  async getUserGameSessions(userId: number): Promise<GameSession[]> {
    return Array.from(this.gameSessions.values()).filter(
      session => session.userId === userId
    );
  }

  async getRecentSessions(limit: number = 50): Promise<GameSession[]> {
    return Array.from(this.gameSessions.values())
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
      .slice(0, limit);
  }

  // Transaction methods
  async createTransaction(insertTransaction: InsertTransaction): Promise<Transaction> {
    const id = this.currentTransactionId++;
    const transaction: Transaction = {
      id,
      userId: insertTransaction.userId,
      type: insertTransaction.type,
      amount: insertTransaction.amount,
      currency: insertTransaction.currency || "USD",
      status: insertTransaction.status || "completed",
      description: insertTransaction.description || null,
      reference: insertTransaction.reference || null,
      createdAt: new Date()
    };
    this.transactions.set(id, transaction);
    return transaction;
  }

  async getUserTransactions(userId: number): Promise<Transaction[]> {
    return Array.from(this.transactions.values()).filter(
      transaction => transaction.userId === userId
    );
  }

  // Promotion methods
  async getActivePromotions(): Promise<Promotion[]> {
    const now = new Date();
    return Array.from(this.promotions.values()).filter(
      promotion => promotion.isActive && promotion.validFrom <= now && promotion.validTo >= now
    );
  }

  async createPromotion(insertPromotion: InsertPromotion): Promise<Promotion> {
    const id = this.currentPromotionId++;
    const promotion: Promotion = {
      ...insertPromotion,
      id,
      minDeposit: insertPromotion.minDeposit || null,
      wagering: insertPromotion.wagering || 1,
      isActive: insertPromotion.isActive !== false,
      createdAt: new Date()
    };
    this.promotions.set(id, promotion);
    return promotion;
  }

  // Live betting methods
  async createLiveBet(insertBet: InsertLiveBet): Promise<LiveBet> {
    const id = this.currentLiveBetId++;
    const bet: LiveBet = {
      ...insertBet,
      id,
      targetMultiplier: insertBet.targetMultiplier || null,
      actualMultiplier: insertBet.actualMultiplier || null,
      winAmount: insertBet.winAmount || "0.00",
      isActive: insertBet.isActive !== false,
      cashoutAt: insertBet.cashoutAt || null,
      createdAt: new Date()
    };
    this.liveBets.set(id, bet);
    return bet;
  }

  async getActiveLiveBets(gameId: number): Promise<LiveBet[]> {
    return Array.from(this.liveBets.values()).filter(
      bet => bet.gameId === gameId && bet.isActive
    );
  }

  async updateLiveBet(id: number, updates: Partial<LiveBet>): Promise<LiveBet | undefined> {
    const bet = this.liveBets.get(id);
    if (!bet) return undefined;
    
    const updatedBet: LiveBet = {
      ...bet,
      ...updates
    };
    this.liveBets.set(id, updatedBet);
    return updatedBet;
  }
}

export const storage = new MemStorage();

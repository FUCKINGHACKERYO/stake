import type { Express } from "express";
import { createServer, type Server } from "http";
import { WebSocketServer } from "ws";
import { storage } from "./storage";
import { 
  insertGameSessionSchema, 
  loginSchema, 
  registerSchema, 
  placeBetSchema,
  crashBetSchema 
} from "@shared/schema";
import { z } from "zod";

// Session management (simplified for demo)
const activeSessions = new Map<string, number>(); // sessionId -> userId
const DEMO_USER_ID = 1;

export async function registerRoutes(app: Express): Promise<Server> {
  // Authentication routes
  app.post("/api/auth/login", async (req, res) => {
    try {
      const { username, password } = loginSchema.parse(req.body);
      const user = await storage.getUserByUsername(username);
      
      if (!user || user.password !== password) {
        return res.status(401).json({ message: "Invalid credentials" });
      }
      
      // Create session (simplified)
      const sessionId = Math.random().toString(36).substr(2, 9);
      activeSessions.set(sessionId, user.id);
      
      res.json({ 
        user: { ...user, password: undefined }, 
        sessionId,
        message: "Login successful" 
      });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid login data", errors: error.errors });
      }
      res.status(500).json({ message: "Login failed" });
    }
  });

  app.post("/api/auth/register", async (req, res) => {
    try {
      const userData = registerSchema.parse(req.body);
      
      // Check if username exists
      const existingUser = await storage.getUserByUsername(userData.username);
      if (existingUser) {
        return res.status(409).json({ message: "Username already exists" });
      }
      
      const user = await storage.createUser(userData);
      const sessionId = Math.random().toString(36).substr(2, 9);
      activeSessions.set(sessionId, user.id);
      
      res.json({ 
        user: { ...user, password: undefined }, 
        sessionId,
        message: "Registration successful" 
      });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid registration data", errors: error.errors });
      }
      res.status(500).json({ message: "Registration failed" });
    }
  });

  // Game routes
  app.get("/api/games", async (req, res) => {
    try {
      const games = await storage.getAllGames();
      res.json(games);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch games" });
    }
  });

  app.get("/api/games/category/:category", async (req, res) => {
    try {
      const { category } = req.params;
      const games = await storage.getGamesByCategory(category);
      res.json(games);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch games by category" });
    }
  });

  app.get("/api/games/:id", async (req, res) => {
    try {
      const gameId = parseInt(req.params.id);
      const game = await storage.getGame(gameId);
      
      if (!game) {
        return res.status(404).json({ message: "Game not found" });
      }
      
      res.json(game);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch game" });
    }
  });

  // Betting routes with real mechanics
  app.post("/api/bet/place", async (req, res) => {
    try {
      const betData = placeBetSchema.parse(req.body);
      const userId = DEMO_USER_ID; // Simplified for demo
      
      const user = await storage.getUser(userId);
      const game = await storage.getGame(betData.gameId);
      
      if (!user || !game) {
        return res.status(404).json({ message: "User or game not found" });
      }
      
      const betAmount = parseFloat(betData.betAmount);
      const currentBalance = parseFloat(user.balance);
      
      if (betAmount > currentBalance) {
        return res.status(400).json({ message: "Insufficient balance" });
      }
      
      // Game-specific logic
      let result;
      switch (game.subcategory) {
        case "dice":
          result = playDice(betAmount, betData.gameData);
          break;
        case "plinko":
          result = playPlinko(betAmount, betData.gameData);
          break;
        case "mines":
          result = playMines(betAmount, betData.gameData);
          break;
        case "limbo":
          result = playLimbo(betAmount, betData.gameData);
          break;
        default:
          result = playSlot(betAmount);
      }
      
      // Update user balance
      const newBalance = currentBalance - betAmount + result.winAmount;
      await storage.updateUserBalance(userId, newBalance);
      await storage.updateUserStats(userId, betAmount, result.winAmount);
      
      // Create game session
      const session = await storage.createGameSession({
        userId,
        gameId: betData.gameId,
        betAmount: betData.betAmount,
        winAmount: result.winAmount.toFixed(2),
        multiplier: result.multiplier.toFixed(4),
        isWin: result.isWin,
        gameData: result.gameData
      });
      
      // Create transaction records
      await storage.createTransaction({
        userId,
        type: "bet",
        amount: `-${betAmount.toFixed(2)}`,
        description: `Bet on ${game.name}`
      });
      
      if (result.isWin) {
        await storage.createTransaction({
          userId,
          type: "win",
          amount: result.winAmount.toFixed(2),
          description: `Win from ${game.name}`
        });
      }
      
      res.json({
        session,
        result,
        newBalance: newBalance.toFixed(2),
        message: result.isWin ? "Congratulations! You won!" : "Better luck next time!"
      });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid bet data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to place bet" });
    }
  });

  // Crash game specific route
  app.post("/api/bet/crash", async (req, res) => {
    try {
      const betData = crashBetSchema.parse(req.body);
      const userId = DEMO_USER_ID;
      
      const user = await storage.getUser(userId);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      
      const betAmount = parseFloat(betData.betAmount);
      const currentBalance = parseFloat(user.balance);
      
      if (betAmount > currentBalance) {
        return res.status(400).json({ message: "Insufficient balance" });
      }
      
      // Create live bet
      const liveBet = await storage.createLiveBet({
        userId,
        gameId: betData.gameId,
        betAmount: betData.betAmount,
        targetMultiplier: betData.autoCashout?.toString() || null
      });
      
      res.json({
        liveBet,
        message: "Bet placed! Waiting for crash point..."
      });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid crash bet data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to place crash bet" });
    }
  });

  // User routes
  app.get("/api/user/balance", async (req, res) => {
    try {
      const user = await storage.getUser(DEMO_USER_ID);
      res.json({ 
        balance: user?.balance || "0.00",
        currency: user?.currency || "USD"
      });
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch balance" });
    }
  });

  app.get("/api/user/profile", async (req, res) => {
    try {
      const user = await storage.getUser(DEMO_USER_ID);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      
      res.json({ ...user, password: undefined });
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch profile" });
    }
  });

  app.get("/api/user/transactions", async (req, res) => {
    try {
      const transactions = await storage.getUserTransactions(DEMO_USER_ID);
      res.json(transactions);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch transactions" });
    }
  });

  app.get("/api/user/sessions", async (req, res) => {
    try {
      const sessions = await storage.getUserGameSessions(DEMO_USER_ID);
      res.json(sessions);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch game sessions" });
    }
  });

  // Promotions
  app.get("/api/promotions", async (req, res) => {
    try {
      const promotions = await storage.getActivePromotions();
      res.json(promotions);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch promotions" });
    }
  });

  // Live betting
  app.get("/api/live/bets/:gameId", async (req, res) => {
    try {
      const gameId = parseInt(req.params.gameId);
      const liveBets = await storage.getActiveLiveBets(gameId);
      res.json(liveBets);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch live bets" });
    }
  });

  // Recent sessions for live feed
  app.get("/api/live/sessions", async (req, res) => {
    try {
      const sessions = await storage.getRecentSessions(100);
      res.json(sessions);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch recent sessions" });
    }
  });

  const httpServer = createServer(app);
  
  // WebSocket for live features
  const wss = new WebSocketServer({ server: httpServer });
  
  wss.on('connection', (ws) => {
    // Send live updates for crash game, live bets, etc.
    const interval = setInterval(() => {
      if (ws.readyState === ws.OPEN) {
        ws.send(JSON.stringify({
          type: 'crash_update',
          multiplier: (Math.random() * 10 + 1).toFixed(2),
          timestamp: Date.now()
        }));
      }
    }, 1000);
    
    ws.on('close', () => {
      clearInterval(interval);
    });
  });
  
  return httpServer;
}

// Game logic functions
function playDice(betAmount: number, gameData: any) {
  const roll = Math.floor(Math.random() * 100) + 1;
  const target = gameData?.target || 50;
  const isOver = gameData?.isOver !== false;
  
  const isWin = isOver ? roll > target : roll < target;
  const multiplier = isWin ? (100 / (isOver ? 100 - target : target)) * 0.99 : 0;
  const winAmount = isWin ? betAmount * multiplier : 0;
  
  return {
    isWin,
    winAmount,
    multiplier,
    gameData: { roll, target, isOver }
  };
}

function playPlinko(betAmount: number, gameData: any) {
  const rows = gameData?.rows || 16;
  const risk = gameData?.risk || "low";
  
  // Simulate ball path
  let position = rows / 2;
  const path = [];
  
  for (let i = 0; i < rows; i++) {
    const direction = Math.random() > 0.5 ? 1 : -1;
    position += direction * 0.5;
    path.push(direction);
  }
  
  // Calculate multiplier based on final position
  const finalBucket = Math.floor(position);
  const multipliers = getRiskMultipliers(risk, rows);
  const multiplier = multipliers[Math.max(0, Math.min(finalBucket, multipliers.length - 1))] || 0;
  
  const winAmount = betAmount * multiplier;
  const isWin = multiplier > 1;
  
  return {
    isWin,
    winAmount,
    multiplier,
    gameData: { path, finalBucket, multipliers }
  };
}

function playMines(betAmount: number, gameData: any) {
  const minesCount = gameData?.mines || 3;
  const revealed = gameData?.revealed || [];
  
  if (revealed.length === 0) {
    // Initial bet, just return the setup
    return {
      isWin: false,
      winAmount: 0,
      multiplier: 1,
      gameData: { mines: minesCount, revealed: [], multiplier: 1 }
    };
  }
  
  // Check if hit a mine
  const totalCells = 25;
  const safeCells = totalCells - minesCount;
  const revealedCount = revealed.length;
  
  // Calculate current multiplier
  let currentMultiplier = 1;
  for (let i = 1; i <= revealedCount; i++) {
    currentMultiplier *= (safeCells - i + 1) / (totalCells - i + 1);
  }
  currentMultiplier = 1 / currentMultiplier;
  
  const winAmount = betAmount * currentMultiplier;
  
  return {
    isWin: true,
    winAmount,
    multiplier: currentMultiplier,
    gameData: { mines: minesCount, revealed, multiplier: currentMultiplier }
  };
}

function playLimbo(betAmount: number, gameData: any) {
  const target = gameData?.target || 2;
  const crash = Math.random() * 1000000;
  const isWin = crash >= target;
  const multiplier = isWin ? target * 0.99 : 0;
  const winAmount = isWin ? betAmount * multiplier : 0;
  
  return {
    isWin,
    winAmount,
    multiplier,
    gameData: { target, crash, result: crash.toFixed(2) }
  };
}

function playSlot(betAmount: number) {
  const rtp = 0.96;
  const isWin = Math.random() < 0.3; // 30% win rate
  const multiplier = isWin ? (Math.random() * 10 + 1) * rtp : 0;
  const winAmount = isWin ? betAmount * multiplier : 0;
  
  return {
    isWin,
    winAmount,
    multiplier,
    gameData: { symbols: generateSlotSymbols() }
  };
}

function generateSlotSymbols() {
  const symbols = ['🍒', '🍋', '🍊', '🍇', '💎', '⭐'];
  return Array(15).fill(0).map(() => symbols[Math.floor(Math.random() * symbols.length)]);
}

function getRiskMultipliers(risk: string, rows: number) {
  // Simplified multiplier tables for different risk levels
  const multiplierTables = {
    low: [1000, 130, 26, 9, 4, 2, 1.4, 1.1, 1, 1.1, 1.4, 2, 4, 9, 26, 130, 1000],
    medium: [8900, 88, 18, 6, 3, 1.3, 1, 0.5, 0.3, 0.5, 1, 1.3, 3, 6, 18, 88, 8900],
    high: [29000, 3900, 130, 26, 10, 5, 2, 1.2, 0.2, 1.2, 2, 5, 10, 26, 130, 3900, 29000]
  };
  
  return multiplierTables[risk as keyof typeof multiplierTables] || multiplierTables.low;
}

import { pgTable, text, serial, integer, boolean, decimal, timestamp, json } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  email: text("email").unique(),
  password: text("password").notNull(),
  balance: decimal("balance", { precision: 10, scale: 2 }).notNull().default("0.00"),
  currency: text("currency").notNull().default("USD"),
  isVerified: boolean("is_verified").default(false),
  isVip: boolean("is_vip").default(false),
  level: integer("level").default(1),
  experience: integer("experience").default(0),
  totalWagered: decimal("total_wagered", { precision: 12, scale: 2 }).default("0.00"),
  totalWon: decimal("total_won", { precision: 12, scale: 2 }).default("0.00"),
  avatar: text("avatar"),
  country: text("country"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  lastLogin: timestamp("last_login"),
});

export const games = pgTable("games", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  provider: text("provider").notNull(),
  category: text("category").notNull(), // slots, live, table, originals, sports
  subcategory: text("subcategory"), // crash, dice, plinko, blackjack, roulette, etc.
  isHot: boolean("is_hot").default(false),
  isNew: boolean("is_new").default(false),
  imageUrl: text("image_url"),
  description: text("description"),
  minBet: decimal("min_bet", { precision: 10, scale: 2 }).default("0.01"),
  maxBet: decimal("max_bet", { precision: 10, scale: 2 }).default("1000.00"),
  rtp: decimal("rtp", { precision: 5, scale: 2 }).default("96.00"), // Return to Player
  volatility: text("volatility").default("medium"), // low, medium, high
  isActive: boolean("is_active").default(true),
  isLive: boolean("is_live").default(false),
  gameConfig: json("game_config"), // Game-specific configuration
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const gameSessions = pgTable("game_sessions", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id).notNull(),
  gameId: integer("game_id").references(() => games.id).notNull(),
  betAmount: decimal("bet_amount", { precision: 10, scale: 2 }).notNull(),
  winAmount: decimal("win_amount", { precision: 10, scale: 2 }).default("0.00"),
  multiplier: decimal("multiplier", { precision: 8, scale: 4 }).default("0.0000"),
  isWin: boolean("is_win").default(false),
  gameData: json("game_data"), // Game-specific data (dice roll, crash point, etc.)
  status: text("status").default("completed"), // pending, completed, cancelled
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const transactions = pgTable("transactions", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id).notNull(),
  type: text("type").notNull(), // deposit, withdrawal, bet, win, bonus
  amount: decimal("amount", { precision: 10, scale: 2 }).notNull(),
  currency: text("currency").notNull().default("USD"),
  status: text("status").default("completed"), // pending, completed, failed
  description: text("description"),
  reference: text("reference"), // External reference (payment ID, etc.)
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const promotions = pgTable("promotions", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  description: text("description").notNull(),
  type: text("type").notNull(), // welcome_bonus, reload_bonus, cashback, free_spins
  value: decimal("value", { precision: 10, scale: 2 }).notNull(),
  minDeposit: decimal("min_deposit", { precision: 10, scale: 2 }),
  wagering: integer("wagering").default(1), // Wagering requirement multiplier
  isActive: boolean("is_active").default(true),
  validFrom: timestamp("valid_from").notNull(),
  validTo: timestamp("valid_to").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const liveBets = pgTable("live_bets", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id).notNull(),
  gameId: integer("game_id").references(() => games.id).notNull(),
  betAmount: decimal("bet_amount", { precision: 10, scale: 2 }).notNull(),
  targetMultiplier: decimal("target_multiplier", { precision: 8, scale: 4 }),
  actualMultiplier: decimal("actual_multiplier", { precision: 8, scale: 4 }),
  winAmount: decimal("win_amount", { precision: 10, scale: 2 }).default("0.00"),
  isActive: boolean("is_active").default(true),
  cashoutAt: timestamp("cashout_at"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  email: true,
  password: true,
});

export const insertGameSchema = createInsertSchema(games).omit({
  id: true,
  createdAt: true,
});

export const insertGameSessionSchema = createInsertSchema(gameSessions).omit({
  id: true,
  createdAt: true,
});

export const insertTransactionSchema = createInsertSchema(transactions).omit({
  id: true,
  createdAt: true,
});

export const insertPromotionSchema = createInsertSchema(promotions).omit({
  id: true,
  createdAt: true,
});

export const insertLiveBetSchema = createInsertSchema(liveBets).omit({
  id: true,
  createdAt: true,
});

// Authentication schemas
export const loginSchema = z.object({
  username: z.string().min(3).max(20),
  password: z.string().min(6),
});

export const registerSchema = z.object({
  username: z.string().min(3).max(20),
  email: z.string().email().optional(),
  password: z.string().min(6),
});

// Betting schemas
export const placeBetSchema = z.object({
  gameId: z.number(),
  betAmount: z.string().regex(/^\d+(\.\d{1,2})?$/),
  gameData: z.any().optional(),
});

export const crashBetSchema = z.object({
  gameId: z.number(),
  betAmount: z.string().regex(/^\d+(\.\d{1,2})?$/),
  autoCashout: z.number().optional(),
});

export type User = typeof users.$inferSelect;
export type InsertUser = z.infer<typeof insertUserSchema>;
export type Game = typeof games.$inferSelect;
export type InsertGame = z.infer<typeof insertGameSchema>;
export type GameSession = typeof gameSessions.$inferSelect;
export type InsertGameSession = z.infer<typeof insertGameSessionSchema>;
export type Transaction = typeof transactions.$inferSelect;
export type InsertTransaction = z.infer<typeof insertTransactionSchema>;
export type Promotion = typeof promotions.$inferSelect;
export type InsertPromotion = z.infer<typeof insertPromotionSchema>;
export type LiveBet = typeof liveBets.$inferSelect;
export type InsertLiveBet = z.infer<typeof insertLiveBetSchema>;

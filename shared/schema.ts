import { sql } from "drizzle-orm";
import { pgTable, text, varchar, integer, decimal, timestamp, boolean, jsonb } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const teams = pgTable("teams", {
  id: varchar("id").primaryKey(),
  name: text("name").notNull(),
  abbreviation: text("abbreviation").notNull(),
  city: text("city").notNull(),
  conference: text("conference").notNull(),
  division: text("division").notNull(),
  primaryColor: text("primary_color"),
  secondaryColor: text("secondary_color"),
});

export const games = pgTable("games", {
  id: varchar("id").primaryKey(),
  week: integer("week").notNull(),
  season: integer("season").notNull(),
  homeTeamId: varchar("home_team_id").notNull().references(() => teams.id),
  awayTeamId: varchar("away_team_id").notNull().references(() => teams.id),
  gameTime: timestamp("game_time").notNull(),
  homeScore: integer("home_score"),
  awayScore: integer("away_score"),
  gameStatus: text("game_status").notNull().default("scheduled"),
  isCompleted: boolean("is_completed").notNull().default(false),
  isPrimeTime: boolean("is_prime_time").notNull().default(false),
  isDivisional: boolean("is_divisional").notNull().default(false),
  hasPlayoffImplications: boolean("has_playoff_implications").notNull().default(false),
});

export const bettingOdds = pgTable("betting_odds", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  gameId: varchar("game_id").notNull().references(() => games.id),
  spreadHome: decimal("spread_home", { precision: 4, scale: 1 }),
  spreadAway: decimal("spread_away", { precision: 4, scale: 1 }),
  spreadOdds: integer("spread_odds"),
  totalPoints: decimal("total_points", { precision: 4, scale: 1 }),
  totalOdds: integer("total_odds"),
  homeMoneyline: integer("home_moneyline"),
  awayMoneyline: integer("away_moneyline"),
  lastUpdated: timestamp("last_updated").notNull().defaultNow(),
});

export const aiPredictions = pgTable("ai_predictions", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  gameId: varchar("game_id").notNull().references(() => games.id),
  predictedWinner: varchar("predicted_winner").notNull(),
  confidence: decimal("confidence", { precision: 5, scale: 2 }).notNull(),
  winProbability: decimal("win_probability", { precision: 5, scale: 3 }),
  analysis: text("analysis").notNull(),
  recommendedBet: text("recommended_bet"),
  keyFactors: jsonb("key_factors"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const expertAdvice = pgTable("expert_advice", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  gameId: varchar("game_id").notNull().references(() => games.id),
  source: text("source").notNull(),
  content: text("content").notNull(),
  recommendation: text("recommendation"),
  scrapedAt: timestamp("scraped_at").notNull().defaultNow(),
});

export const teamStats = pgTable("team_stats", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  teamId: varchar("team_id").notNull().references(() => teams.id),
  season: integer("season").notNull(),
  wins: integer("wins").notNull().default(0),
  losses: integer("losses").notNull().default(0),
  pointsFor: integer("points_for").notNull().default(0),
  pointsAgainst: integer("points_against").notNull().default(0),
  lastUpdated: timestamp("last_updated").notNull().defaultNow(),
});

// Insert schemas
export const insertTeamSchema = createInsertSchema(teams);
export const insertGameSchema = createInsertSchema(games);
export const insertBettingOddsSchema = createInsertSchema(bettingOdds).omit({ id: true, lastUpdated: true });
export const insertAiPredictionSchema = createInsertSchema(aiPredictions).omit({ id: true, createdAt: true });
export const insertExpertAdviceSchema = createInsertSchema(expertAdvice).omit({ id: true, scrapedAt: true });
export const insertTeamStatsSchema = createInsertSchema(teamStats).omit({ id: true, lastUpdated: true });

// Types
export type Team = typeof teams.$inferSelect;
export type Game = typeof games.$inferSelect;
export type BettingOdds = typeof bettingOdds.$inferSelect;
export type AiPrediction = typeof aiPredictions.$inferSelect;
export type ExpertAdvice = typeof expertAdvice.$inferSelect;
export type TeamStats = typeof teamStats.$inferSelect;

export type InsertTeam = z.infer<typeof insertTeamSchema>;
export type InsertGame = z.infer<typeof insertGameSchema>;
export type InsertBettingOdds = z.infer<typeof insertBettingOddsSchema>;
export type InsertAiPrediction = z.infer<typeof insertAiPredictionSchema>;
export type InsertExpertAdvice = z.infer<typeof insertExpertAdviceSchema>;
export type InsertTeamStats = z.infer<typeof insertTeamStatsSchema>;

// Extended types for API responses
export type GameWithDetails = Game & {
  homeTeam: Team;
  awayTeam: Team;
  homeTeamStats: TeamStats | null;
  awayTeamStats: TeamStats | null;
  odds: BettingOdds | null;
  aiPrediction: AiPrediction | null;
  expertAdvice: ExpertAdvice[];
};

// Enhanced data tables
export const redditSentiment = pgTable("reddit_sentiment", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  teamId: varchar("team_id").notNull().references(() => teams.id),
  gameId: varchar("game_id").references(() => games.id),
  sentiment: decimal("sentiment", { precision: 4, scale: 3 }).notNull(), // -1 to 1
  confidence: decimal("confidence", { precision: 4, scale: 3 }).notNull(),
  keyPhrases: jsonb("key_phrases").$type<string[]>(),
  trendingConcerns: jsonb("trending_concerns").$type<string[]>(),
  positiveNarratives: jsonb("positive_narratives").$type<string[]>(),
  postCount: integer("post_count").notNull().default(0),
  lastUpdated: timestamp("last_updated").notNull().defaultNow(),
});

export const weatherData = pgTable("weather_data", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  gameId: varchar("game_id").notNull().references(() => games.id),
  temperature: integer("temperature"),
  windSpeed: integer("wind_speed"),
  precipitation: integer("precipitation"),
  conditions: text("conditions"),
  domeGame: boolean("dome_game").notNull().default(false),
  lastUpdated: timestamp("last_updated").notNull().defaultNow(),
});

export const injuryReports = pgTable("injury_reports", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  teamId: varchar("team_id").notNull().references(() => teams.id),
  gameId: varchar("game_id").references(() => games.id),
  keyPlayersOut: jsonb("key_players_out").$type<string[]>(),
  keyPlayersQuestionable: jsonb("key_players_questionable").$type<string[]>(),
  impactRating: integer("impact_rating").notNull().default(1), // 1-5 scale
  lastUpdated: timestamp("last_updated").notNull().defaultNow(),
});

export const bettingIntelligence = pgTable("betting_intelligence", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  gameId: varchar("game_id").notNull().references(() => games.id),
  sharpMoney: text("sharp_money"), // 'home', 'away', 'neutral'
  publicBetting: integer("public_betting"), // percentage on favorite
  lineMovement: text("line_movement"),
  steamMoves: boolean("steam_moves").notNull().default(false),
  totalAction: text("total_action"), // 'heavy', 'moderate', 'light'
  lastUpdated: timestamp("last_updated").notNull().defaultNow(),
});

export const gameIntelligence = pgTable("game_intelligence", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  gameId: varchar("game_id").notNull().references(() => games.id),
  sentimentImpact: text("sentiment_impact"),
  weatherImpact: text("weather_impact"),
  coachingEdge: text("coaching_edge"),
  valuePlay: text("value_play"),
  riskFactors: jsonb("risk_factors").$type<string[]>(),
  confidenceFactors: jsonb("confidence_factors").$type<{
    dataQuality: number;
    modelConsensus: number;
    marketAlignment: number;
    historicalAccuracy: number;
  }>(),
  lastUpdated: timestamp("last_updated").notNull().defaultNow(),
});

export type WeekSummary = {
  week: number;
  season: number;
  totalGames: number;
  analyzedGames: number;
  highConfidence: number;
  upsetAlerts: number;
  avgConfidence: number;
  avgLineMovement: number;
};

// Enhanced type exports
export type RedditSentiment = typeof redditSentiment.$inferSelect;
export type WeatherData = typeof weatherData.$inferSelect;
export type InjuryReport = typeof injuryReports.$inferSelect;
export type BettingIntelligence = typeof bettingIntelligence.$inferSelect;
export type GameIntelligence = typeof gameIntelligence.$inferSelect;

export type InsertRedditSentiment = typeof redditSentiment.$inferInsert;
export type InsertWeatherData = typeof weatherData.$inferInsert;
export type InsertInjuryReport = typeof injuryReports.$inferInsert;
export type InsertBettingIntelligence = typeof bettingIntelligence.$inferInsert;
export type InsertGameIntelligence = typeof gameIntelligence.$inferInsert;

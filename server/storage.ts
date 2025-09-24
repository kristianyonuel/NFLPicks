import { 
  type Team, type InsertTeam,
  type Game, type InsertGame,
  type BettingOdds, type InsertBettingOdds,
  type AiPrediction, type InsertAiPrediction,
  type ExpertAdvice, type InsertExpertAdvice,
  type TeamStats, type InsertTeamStats,
  type GameWithDetails, type WeekSummary
} from "@shared/schema";
import { randomUUID } from "crypto";

export interface IStorage {
  // Teams
  getTeam(id: string): Promise<Team | undefined>;
  getTeamByAbbreviation(abbreviation: string): Promise<Team | undefined>;
  getAllTeams(): Promise<Team[]>;
  createTeam(team: InsertTeam): Promise<Team>;
  
  // Games
  getGame(id: string): Promise<Game | undefined>;
  getGamesByWeek(week: number, season: number): Promise<Game[]>;
  getGamesWithDetails(week: number, season: number, filters?: {
    highProbability?: boolean;
    divisional?: boolean;
    primeTime?: boolean;
    playoffImplications?: boolean;
  }): Promise<GameWithDetails[]>;
  createGame(game: InsertGame): Promise<Game>;
  updateGame(id: string, updates: Partial<Game>): Promise<Game | undefined>;
  
  // Betting Odds
  getBettingOdds(gameId: string): Promise<BettingOdds | undefined>;
  createBettingOdds(odds: InsertBettingOdds): Promise<BettingOdds>;
  updateBettingOdds(gameId: string, odds: Partial<BettingOdds>): Promise<BettingOdds | undefined>;
  
  // AI Predictions
  getAiPrediction(gameId: string): Promise<AiPrediction | undefined>;
  createAiPrediction(prediction: InsertAiPrediction): Promise<AiPrediction>;
  updateAiPrediction(gameId: string, prediction: Partial<AiPrediction>): Promise<AiPrediction | undefined>;
  
  // Expert Advice
  getExpertAdvice(gameId: string): Promise<ExpertAdvice[]>;
  createExpertAdvice(advice: InsertExpertAdvice): Promise<ExpertAdvice>;
  
  // Team Stats
  getTeamStats(teamId: string, season: number): Promise<TeamStats | undefined>;
  createTeamStats(stats: InsertTeamStats): Promise<TeamStats>;
  updateTeamStats(teamId: string, season: number, stats: Partial<TeamStats>): Promise<TeamStats | undefined>;
  
  // Analytics
  getWeekSummary(week: number, season: number): Promise<WeekSummary>;
}

export class MemStorage implements IStorage {
  private teams: Map<string, Team>;
  private games: Map<string, Game>;
  private bettingOdds: Map<string, BettingOdds>;
  private aiPredictions: Map<string, AiPrediction>;
  private expertAdvice: Map<string, ExpertAdvice[]>;
  private teamStats: Map<string, TeamStats>;

  constructor() {
    this.teams = new Map();
    this.games = new Map();
    this.bettingOdds = new Map();
    this.aiPredictions = new Map();
    this.expertAdvice = new Map();
    this.teamStats = new Map();

    // Initialize with current NFL teams and sample data
    this.initializeTeams();
    this.initializeSampleData();
    
    // Also generate data for current week automatically
    setTimeout(() => this.initializeCurrentWeekData(), 100);
  }  private initializeTeams() {
    const nflTeams = [
      { id: "DAL", name: "Cowboys", abbreviation: "DAL", city: "Dallas", conference: "NFC", division: "East", primaryColor: "#002244" as string | null, secondaryColor: "#869397" as string | null },
      { id: "WAS", name: "Commanders", abbreviation: "WAS", city: "Washington", conference: "NFC", division: "East", primaryColor: "#773141" as string | null, secondaryColor: "#FFB612" as string | null },
      { id: "CIN", name: "Bengals", abbreviation: "CIN", city: "Cincinnati", conference: "AFC", division: "North", primaryColor: "#FB4F14" as string | null, secondaryColor: "#000000" as string | null },
      { id: "PIT", name: "Steelers", abbreviation: "PIT", city: "Pittsburgh", conference: "AFC", division: "North", primaryColor: "#000000" as string | null, secondaryColor: "#FFB612" as string | null },
      { id: "KC", name: "Chiefs", abbreviation: "KC", city: "Kansas City", conference: "AFC", division: "West", primaryColor: "#E31837" as string | null, secondaryColor: "#FFB81C" as string | null },
      { id: "LV", name: "Raiders", abbreviation: "LV", city: "Las Vegas", conference: "AFC", division: "West", primaryColor: "#000000" as string | null, secondaryColor: "#A5ACAF" as string | null },
      { id: "MIA", name: "Dolphins", abbreviation: "MIA", city: "Miami", conference: "AFC", division: "East", primaryColor: "#008E97" as string | null, secondaryColor: "#FC4C02" as string | null },
      { id: "GB", name: "Packers", abbreviation: "GB", city: "Green Bay", conference: "NFC", division: "North", primaryColor: "#203731" as string | null, secondaryColor: "#FFB612" as string | null },
    ];

    nflTeams.forEach(team => this.teams.set(team.id, { ...team, primaryColor: team.primaryColor || null, secondaryColor: team.secondaryColor || null }));
  }

  private async initializeSampleData() {
    // Sample team stats for 2024 season
    const sampleStats = [
      { teamId: "DAL", season: 2024, wins: 8, losses: 4, pointsFor: 312, pointsAgainst: 278 },
      { teamId: "WAS", season: 2024, wins: 6, losses: 6, pointsFor: 289, pointsAgainst: 295 },
      { teamId: "CIN", season: 2024, wins: 7, losses: 5, pointsFor: 298, pointsAgainst: 285 },
      { teamId: "PIT", season: 2024, wins: 9, losses: 3, pointsFor: 276, pointsAgainst: 245 },
      { teamId: "KC", season: 2024, wins: 11, losses: 1, pointsFor: 345, pointsAgainst: 210 },
      { teamId: "LV", season: 2024, wins: 4, losses: 8, pointsFor: 234, pointsAgainst: 312 },
      { teamId: "MIA", season: 2024, wins: 5, losses: 7, pointsFor: 267, pointsAgainst: 289 },
      { teamId: "GB", season: 2024, wins: 8, losses: 4, pointsFor: 301, pointsAgainst: 256 },
    ];

    for (const stats of sampleStats) {
      await this.createTeamStats(stats);
    }
















  }

  private getCurrentNFLWeek(): { week: number; season: number } {
    const now = new Date();
    
    // NFL season dates - Week 1 typically starts on a Thursday
    // NFL weeks run Tuesday to Monday (games Thu/Sun/Mon, new week starts Tuesday)
    const season2024Start = new Date('2024-09-05'); // Week 1 started September 5, 2024 (Thursday)
    const season2025Start = new Date('2025-09-04'); // Estimated Week 1 start for 2025
    
    let seasonStart: Date;
    let season: number;
    
    if (now >= season2025Start) {
      seasonStart = season2025Start;
      season = 2025;
    } else if (now >= season2024Start) {
      seasonStart = season2024Start;
      season = 2024;
    } else {
      // Default to previous season
      seasonStart = new Date('2023-09-07');
      season = 2023;
    }
    
    // Calculate days since season start
    const daysSinceStart = Math.floor((now.getTime() - seasonStart.getTime()) / (24 * 60 * 60 * 1000));
    
    // NFL weeks: Thursday is day 0, Friday is day 1, ... Monday is day 4, Tuesday starts next week
    const weeksSinceStart = Math.floor(daysSinceStart / 7);
    let week = weeksSinceStart + 1;
    
    // Fine-tune based on day of week
    const dayOfWeek = now.getDay(); // 0=Sunday, 1=Monday, 2=Tuesday, etc.
    
    // If it's Tuesday (2) or Wednesday (3) and we're more than 3 days into a week period,
    // we should be in the next week
    if ((dayOfWeek === 2 || dayOfWeek === 3) && (daysSinceStart % 7) >= 4) {
      week += 1;
    }
    
    // NFL has 18 weeks in regular season, then playoffs
    week = Math.min(Math.max(week, 1), 18);
    
    return { week, season };
  }

  private async initializeCurrentWeekData() {
    const currentWeek = this.getCurrentNFLWeek();
    
    // Only generate if we don't already have data for current week
    const existingGames = await this.getGamesByWeek(currentWeek.week, currentWeek.season);
    if (existingGames.length === 0) {
      console.log(`🏈 Initializing data for current NFL Week ${currentWeek.week}, ${currentWeek.season}`);
      await this.generateMockWeekData(currentWeek.week, currentWeek.season);
    } else {
      console.log(`✅ Data already exists for current NFL Week ${currentWeek.week}, ${currentWeek.season}`);
    }
  }

  async getTeam(id: string): Promise<Team | undefined> {
    return this.teams.get(id);
  }

  async getTeamByAbbreviation(abbreviation: string): Promise<Team | undefined> {
    return Array.from(this.teams.values()).find(team => team.abbreviation === abbreviation);
  }

  async getAllTeams(): Promise<Team[]> {
    return Array.from(this.teams.values());
  }

  async createTeam(team: InsertTeam): Promise<Team> {
    const id = team.id || randomUUID();
    const newTeam: Team = { 
      ...team, 
      id,
      primaryColor: team.primaryColor ?? null,
      secondaryColor: team.secondaryColor ?? null
    };
    this.teams.set(id, newTeam);
    return newTeam;
  }

  async getGame(id: string): Promise<Game | undefined> {
    return this.games.get(id);
  }

  async getGamesByWeek(week: number, season: number): Promise<Game[]> {
    const existingGames = Array.from(this.games.values()).filter(
      game => game.week === week && game.season === season
    );
    
    // If no games exist for this week, generate mock data
    if (existingGames.length === 0 && week >= 1 && week <= 18 && season >= 2024) {
      await this.generateMockWeekData(week, season);
      return Array.from(this.games.values()).filter(
        game => game.week === week && game.season === season
      );
    }
    
    return existingGames;
  }

  private async generateMockWeekData(week: number, season: number) {
    const teams = Array.from(this.teams.values());
    const availableTeams = [...teams];
    
    // Generate 4 mock games for the week
    for (let i = 0; i < 4 && availableTeams.length >= 2; i++) {
      // Randomly select two teams
      const homeTeamIndex = Math.floor(Math.random() * availableTeams.length);
      const homeTeam = availableTeams.splice(homeTeamIndex, 1)[0];
      
      const awayTeamIndex = Math.floor(Math.random() * availableTeams.length);
      const awayTeam = availableTeams.splice(awayTeamIndex, 1)[0];
      
      // Calculate game date (typically Thursday, Sunday, or Monday)
      const gameDate = new Date(season, 8, 1); // Start of September
      gameDate.setDate(gameDate.getDate() + (week - 1) * 7 + (i === 0 ? 4 : i * 3)); // Spread across week
      
      const gameId = `mock-game-${week}-${season}-${i + 1}`;
      
      // Create mock game
      const mockGame = {
        id: gameId,
        week,
        season,
        homeTeamId: homeTeam.id,
        awayTeamId: awayTeam.id,
        gameTime: gameDate,
        gameStatus: "scheduled",
        isCompleted: false,
        isPrimeTime: i === 0 || i === 3, // First and last games are primetime
        isDivisional: homeTeam.division === awayTeam.division,
        hasPlayoffImplications: week > 10,
      };
      
      await this.createGame(mockGame);
      
      // Generate mock betting odds
      const spreadValue = (Math.random() * 12 - 6).toFixed(1); // -6 to +6
      const totalPoints = (38 + Math.random() * 16).toFixed(1); // 38-54 points
      
      await this.createBettingOdds({
        gameId,
        spreadHome: spreadValue,
        spreadAway: (-parseFloat(spreadValue)).toFixed(1),
        spreadOdds: -110,
        totalPoints,
        totalOdds: -110,
        homeMoneyline: parseFloat(spreadValue) > 0 ? -150 - Math.abs(parseFloat(spreadValue)) * 20 : 120 + Math.abs(parseFloat(spreadValue)) * 15,
        awayMoneyline: parseFloat(spreadValue) > 0 ? 120 + Math.abs(parseFloat(spreadValue)) * 15 : -150 - Math.abs(parseFloat(spreadValue)) * 20,
      });
      
      // Generate mock AI prediction
      const confidence = (55 + Math.random() * 35).toFixed(1); // 55-90% confidence
      const favoredTeam = parseFloat(spreadValue) > 0 ? awayTeam.id : homeTeam.id;
      
      await this.createAiPrediction({
        gameId,
        predictedWinner: favoredTeam,
        confidence,
        analysis: `AI analysis for ${homeTeam.name} vs ${awayTeam.name}. ${favoredTeam === homeTeam.id ? homeTeam.name : awayTeam.name} has the advantage in this matchup.`,
        recommendedBet: `${favoredTeam === homeTeam.id ? homeTeam.abbreviation : awayTeam.abbreviation} ${Math.abs(parseFloat(spreadValue)).toFixed(1)}`,
        keyFactors: ["Team strength", "Historical matchup", "Current form"],
      });
      
      // Generate mock expert advice
      await this.createExpertAdvice({
        gameId,
        source: "Mock Expert",
        content: `Mock analysis for Week ${week} matchup between ${homeTeam.name} and ${awayTeam.name}.`,
        recommendation: `${favoredTeam === homeTeam.id ? homeTeam.abbreviation : awayTeam.abbreviation} ${Math.abs(parseFloat(spreadValue)).toFixed(1)}`,
      });
    }
  }

  async getGamesWithDetails(week: number, season: number, filters?: {
    highProbability?: boolean;
    divisional?: boolean;
    primeTime?: boolean;
    playoffImplications?: boolean;
  }): Promise<GameWithDetails[]> {
    const games = await this.getGamesByWeek(week, season);
    const detailedGames: GameWithDetails[] = [];

    for (const game of games) {
      const homeTeam = await this.getTeam(game.homeTeamId);
      const awayTeam = await this.getTeam(game.awayTeamId);
      const homeTeamStats = await this.getTeamStats(game.homeTeamId, season) || null;
      const awayTeamStats = await this.getTeamStats(game.awayTeamId, season) || null;
      const odds = await this.getBettingOdds(game.id) || null;
      const aiPrediction = await this.getAiPrediction(game.id) || null;
      const expertAdvice = await this.getExpertAdvice(game.id);

      if (!homeTeam || !awayTeam) continue;

      const gameWithDetails: GameWithDetails = {
        ...game,
        homeTeam,
        awayTeam,
        homeTeamStats,
        awayTeamStats,
        odds,
        aiPrediction,
        expertAdvice,
      };

      // Apply filters
      if (filters?.highProbability && (!aiPrediction || Number(aiPrediction.confidence) < 70)) continue;
      if (filters?.divisional && !game.isDivisional) continue;
      if (filters?.primeTime && !game.isPrimeTime) continue;
      if (filters?.playoffImplications && !game.hasPlayoffImplications) continue;

      detailedGames.push(gameWithDetails);
    }

    return detailedGames;
  }

  async createGame(game: InsertGame): Promise<Game> {
    const id = game.id || randomUUID();
    const newGame: Game = { 
      ...game, 
      id,
      homeScore: game.homeScore ?? null,
      awayScore: game.awayScore ?? null,
      gameStatus: game.gameStatus || "scheduled",
      isCompleted: game.isCompleted ?? false,
      isPrimeTime: game.isPrimeTime ?? false,
      isDivisional: game.isDivisional ?? false,
      hasPlayoffImplications: game.hasPlayoffImplications ?? false
    };
    this.games.set(id, newGame);
    return newGame;
  }

  async updateGame(id: string, updates: Partial<Game>): Promise<Game | undefined> {
    const game = this.games.get(id);
    if (!game) return undefined;
    
    const updatedGame = { ...game, ...updates };
    this.games.set(id, updatedGame);
    return updatedGame;
  }

  async getBettingOdds(gameId: string): Promise<BettingOdds | undefined> {
    return this.bettingOdds.get(gameId);
  }

  async createBettingOdds(odds: InsertBettingOdds): Promise<BettingOdds> {
    const id = randomUUID();
    const newOdds: BettingOdds = { 
      ...odds,
      id, 
      spreadHome: odds.spreadHome ?? null,
      spreadAway: odds.spreadAway ?? null,
      spreadOdds: odds.spreadOdds ?? null,
      totalPoints: odds.totalPoints ?? null,
      totalOdds: odds.totalOdds ?? null,
      homeMoneyline: odds.homeMoneyline ?? null,
      awayMoneyline: odds.awayMoneyline ?? null,
      lastUpdated: new Date()
    };
    this.bettingOdds.set(odds.gameId, newOdds);
    return newOdds;
  }

  async updateBettingOdds(gameId: string, odds: Partial<BettingOdds>): Promise<BettingOdds | undefined> {
    const existingOdds = this.bettingOdds.get(gameId);
    if (!existingOdds) return undefined;
    
    const updatedOdds = { 
      ...existingOdds, 
      ...odds, 
      lastUpdated: new Date() 
    };
    this.bettingOdds.set(gameId, updatedOdds);
    return updatedOdds;
  }

  async getAiPrediction(gameId: string): Promise<AiPrediction | undefined> {
    return this.aiPredictions.get(gameId);
  }

  async createAiPrediction(prediction: InsertAiPrediction): Promise<AiPrediction> {
    const id = randomUUID();
    const newPrediction: AiPrediction = { 
      ...prediction,
      id,
      recommendedBet: prediction.recommendedBet ?? null,
      keyFactors: prediction.keyFactors ?? null,
      createdAt: new Date()
    };
    this.aiPredictions.set(prediction.gameId, newPrediction);
    return newPrediction;
  }

  async updateAiPrediction(gameId: string, prediction: Partial<AiPrediction>): Promise<AiPrediction | undefined> {
    const existingPrediction = this.aiPredictions.get(gameId);
    if (!existingPrediction) return undefined;
    
    const updatedPrediction = { ...existingPrediction, ...prediction };
    this.aiPredictions.set(gameId, updatedPrediction);
    return updatedPrediction;
  }

  async getExpertAdvice(gameId: string): Promise<ExpertAdvice[]> {
    return this.expertAdvice.get(gameId) || [];
  }

  async createExpertAdvice(advice: InsertExpertAdvice): Promise<ExpertAdvice> {
    const id = randomUUID();
    const newAdvice: ExpertAdvice = { 
      ...advice,
      id,
      recommendation: advice.recommendation ?? null,
      scrapedAt: new Date()
    };
    
    const existing = this.expertAdvice.get(advice.gameId) || [];
    existing.push(newAdvice);
    this.expertAdvice.set(advice.gameId, existing);
    
    return newAdvice;
  }

  async getTeamStats(teamId: string, season: number): Promise<TeamStats | undefined> {
    const key = `${teamId}-${season}`;
    return this.teamStats.get(key);
  }

  async createTeamStats(stats: InsertTeamStats): Promise<TeamStats> {
    const id = randomUUID();
    const newStats: TeamStats = { 
      ...stats,
      id,
      wins: stats.wins ?? 0,
      losses: stats.losses ?? 0,
      pointsFor: stats.pointsFor ?? 0,
      pointsAgainst: stats.pointsAgainst ?? 0,
      lastUpdated: new Date()
    };
    const key = `${stats.teamId}-${stats.season}`;
    this.teamStats.set(key, newStats);
    return newStats;
  }

  async updateTeamStats(teamId: string, season: number, stats: Partial<TeamStats>): Promise<TeamStats | undefined> {
    const key = `${teamId}-${season}`;
    const existingStats = this.teamStats.get(key);
    if (!existingStats) return undefined;
    
    const updatedStats = { 
      ...existingStats, 
      ...stats, 
      lastUpdated: new Date() 
    };
    this.teamStats.set(key, updatedStats);
    return updatedStats;
  }

  async getWeekSummary(week: number, season: number): Promise<WeekSummary> {
    const games = await this.getGamesByWeek(week, season);
    const predictions = await Promise.all(
      games.map(game => this.getAiPrediction(game.id))
    );
    
    const analyzedGames = predictions.filter(p => p !== undefined).length;
    const highConfidence = predictions.filter(p => p && Number(p.confidence) >= 70).length;
    const upsetAlerts = predictions.filter(p => p && Number(p.confidence) < 60).length;
    const avgConfidence = predictions.filter(p => p).reduce((sum, p) => sum + Number(p!.confidence), 0) / analyzedGames || 0;

    return {
      week,
      season,
      totalGames: games.length,
      analyzedGames,
      highConfidence,
      upsetAlerts,
      avgConfidence,
      avgLineMovement: -110, // Mock value for line movement
    };
  }
}

export const storage = new MemStorage();

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

    // Sample games for Week 4, 2024 (default dashboard week)
    const sampleGames = [
      {
        id: "game-week4-1",
        week: 4,
        season: 2024,
        homeTeamId: "DAL",
        awayTeamId: "WAS",
        gameTime: new Date("2024-09-29T20:20:00Z"),
        gameStatus: "scheduled",
        isCompleted: false,
        isPrimeTime: true,
        isDivisional: true,
        hasPlayoffImplications: true,
      },
      {
        id: "game-week4-2",
        week: 4,
        season: 2024,
        homeTeamId: "PIT",
        awayTeamId: "CIN",
        gameTime: new Date("2024-09-29T17:00:00Z"),
        gameStatus: "scheduled",
        isCompleted: false,
        isPrimeTime: false,
        isDivisional: true,
        hasPlayoffImplications: true,
      },
      {
        id: "game-week4-3",
        week: 4,
        season: 2024,
        homeTeamId: "KC",
        awayTeamId: "LV",
        gameTime: new Date("2024-09-29T13:00:00Z"),
        gameStatus: "scheduled",
        isCompleted: false,
        isPrimeTime: false,
        isDivisional: true,
        hasPlayoffImplications: false,
      },
      {
        id: "game-week4-4",
        week: 4,
        season: 2024,
        homeTeamId: "GB",
        awayTeamId: "MIA",
        gameTime: new Date("2024-09-30T20:15:00Z"),
        gameStatus: "scheduled",
        isCompleted: false,
        isPrimeTime: true,
        isDivisional: false,
        hasPlayoffImplications: false,
      }
    ];

    // Sample games for Week 12, 2024
    const week12Games = [
      {
        id: "game-1",
        week: 12,
        season: 2024,
        homeTeamId: "DAL",
        awayTeamId: "WAS",
        gameTime: new Date("2024-11-28T20:30:00Z"),
        gameStatus: "scheduled",
        isCompleted: false,
        isPrimeTime: true,
        isDivisional: true,
        hasPlayoffImplications: true,
      },
      {
        id: "game-2",
        week: 12,
        season: 2024,
        homeTeamId: "PIT",
        awayTeamId: "CIN",
        gameTime: new Date("2024-11-28T17:00:00Z"),
        gameStatus: "scheduled",
        isCompleted: false,
        isPrimeTime: false,
        isDivisional: true,
        hasPlayoffImplications: true,
      },
      {
        id: "game-3",
        week: 12,
        season: 2024,
        homeTeamId: "KC",
        awayTeamId: "LV",
        gameTime: new Date("2024-11-29T20:20:00Z"),
        gameStatus: "scheduled",
        isCompleted: false,
        isPrimeTime: true,
        isDivisional: true,
        hasPlayoffImplications: false,
      },
      {
        id: "game-4",
        week: 12,
        season: 2024,
        homeTeamId: "GB",
        awayTeamId: "MIA",
        gameTime: new Date("2024-11-28T13:00:00Z"),
        gameStatus: "scheduled",
        isCompleted: false,
        isPrimeTime: false,
        isDivisional: false,
        hasPlayoffImplications: false,
      }
    ];    // Create games for both weeks
    for (const game of sampleGames) {
      await this.createGame(game);
    }
    
    for (const game of week12Games) {
      await this.createGame(game);
    }

    // Sample betting odds for Week 4
    const week4Odds = [
      {
        gameId: "game-week4-1",
        spreadHome: "-6.5",
        spreadAway: "+6.5",
        spreadOdds: -110,
        totalPoints: "48.5",
        totalOdds: -110,
        homeMoneyline: -280,
        awayMoneyline: +230,
      },
      {
        gameId: "game-week4-2",
        spreadHome: "-4.0",
        spreadAway: "+4.0",
        spreadOdds: -115,
        totalPoints: "41.5",
        totalOdds: -105,
        homeMoneyline: -180,
        awayMoneyline: +150,
      },
      {
        gameId: "game-week4-3",
        spreadHome: "-9.5",
        spreadAway: "+9.5",
        spreadOdds: -110,
        totalPoints: "44.0",
        totalOdds: -110,
        homeMoneyline: -400,
        awayMoneyline: +320,
      },
      {
        gameId: "game-week4-4",
        spreadHome: "-3.5",
        spreadAway: "+3.5",
        spreadOdds: -110,
        totalPoints: "46.5",
        totalOdds: -110,
        homeMoneyline: -160,
        awayMoneyline: +135,
      }
    ];

    // Sample betting odds for Week 12
    const week12Odds = [
      {
        gameId: "game-1",
        spreadHome: "-7.5",
        spreadAway: "+7.5",
        spreadOdds: -110,
        totalPoints: "47.5",
        totalOdds: -110,
        homeMoneyline: -320,
        awayMoneyline: +260,
      },
      {
        gameId: "game-2",
        spreadHome: "-3.0",
        spreadAway: "+3.0",
        spreadOdds: -115,
        totalPoints: "42.5",
        totalOdds: -105,
        homeMoneyline: -150,
        awayMoneyline: +130,
      },
      {
        gameId: "game-3",
        spreadHome: "-10.5",
        spreadAway: "+10.5",
        spreadOdds: -110,
        totalPoints: "43.0",
        totalOdds: -110,
        homeMoneyline: -450,
        awayMoneyline: +350,
      },
      {
        gameId: "game-4",
        spreadHome: "-2.5",
        spreadAway: "+2.5",
        spreadOdds: -110,
        totalPoints: "45.0",
        totalOdds: -110,
        homeMoneyline: -125,
        awayMoneyline: +105,
      }
    ];

    // Create betting odds for both weeks
    for (const odds of week4Odds) {
      await this.createBettingOdds(odds);
    }
    
    for (const odds of week12Odds) {
      await this.createBettingOdds(odds);
    }

    // Sample AI predictions for Week 4
    const week4Predictions = [
      {
        gameId: "game-week4-1",
        predictedWinner: "DAL",
        confidence: "76.8",
        analysis: "Cowboys at home in early season form. Washington still finding their rhythm on offense with new coordinator.",
        recommendedBet: "Cowboys -6.5",
        keyFactors: ["Early season home advantage", "Offensive coordination", "Divisional familiarity"]
      },
      {
        gameId: "game-week4-2",
        predictedWinner: "PIT",
        confidence: "68.4",
        analysis: "Steelers defense looks strong early in season. Bengals offense still working out chemistry issues.",
        recommendedBet: "Under 41.5",
        keyFactors: ["Defensive strength", "Early season offense", "Divisional matchup"]
      },
      {
        gameId: "game-week4-3",
        predictedWinner: "KC",
        confidence: "88.2",
        analysis: "Chiefs dominating early season as expected. Raiders in rebuild mode with new coaching staff.",
        recommendedBet: "Chiefs -9.5",
        keyFactors: ["Championship pedigree", "Coaching advantage", "Talent disparity"]
      },
      {
        gameId: "game-week4-4",
        predictedWinner: "GB",
        confidence: "64.7",
        analysis: "Packers at home in primetime. Miami adapting to new system but still dangerous on offense.",
        recommendedBet: "Over 46.5",
        keyFactors: ["Primetime advantage", "Offensive systems", "September weather"]
      }
    ];

    // Sample AI predictions for Week 12
    const week12Predictions = [
      {
        gameId: "game-1",
        predictedWinner: "DAL",
        confidence: "78.5",
        analysis: "Cowboys dominate at home with superior offensive line play and defensive pressure. Washington's road struggles continue against divisional rivals.",
        recommendedBet: "Cowboys -7.5",
        keyFactors: ["Home field advantage", "Offensive line superiority", "Divisional rivalry history"]
      },
      {
        gameId: "game-2",
        predictedWinner: "PIT",
        confidence: "65.2",
        analysis: "Steelers defense creates problems for Bengals offense. Close divisional game with playoff implications for both teams.",
        recommendedBet: "Under 42.5",
        keyFactors: ["Defensive matchup", "Weather conditions", "Divisional game trends"]
      },
      {
        gameId: "game-3",
        predictedWinner: "KC",
        confidence: "85.3",
        analysis: "Chiefs at home are nearly unbeatable. Raiders struggling on both sides of the ball with key injuries mounting.",
        recommendedBet: "Chiefs -10.5",
        keyFactors: ["Home dominance", "Health advantage", "Coaching disparity"]
      },
      {
        gameId: "game-4",
        predictedWinner: "GB",
        confidence: "62.1",
        analysis: "Packers slight home favorite in what should be a competitive matchup. Miami's cold weather struggles could be a factor.",
        recommendedBet: "Packers -2.5",
        keyFactors: ["Weather conditions", "Home field advantage", "Recent form"]
      }
    ];

    // Create predictions for both weeks
    for (const prediction of week4Predictions) {
      await this.createAiPrediction(prediction);
    }
    
    for (const prediction of week12Predictions) {
      await this.createAiPrediction(prediction);
    }

    // Sample expert advice for Week 4
    const week4Advice = [
      {
        gameId: "game-week4-1",
        source: "ESPN Bet",
        content: "Cowboys looking strong early in the season. Home field advantage in September is always valuable in this division.",
        recommendation: "Cowboys -6.5"
      },
      {
        gameId: "game-week4-1",
        source: "The Action Network",
        content: "Washington has shown improvement but road divisional games are tough. Value on the home team early season.",
        recommendation: "Cowboys -6.5"
      },
      {
        gameId: "game-week4-2",
        source: "Sharp Football",
        content: "Pittsburgh defense looks elite early in season. Cincinnati offense still finding chemistry with new pieces.",
        recommendation: "Under 41.5"
      },
      {
        gameId: "game-week4-3",
        source: "ESPN Bet",
        content: "Chiefs are just better at every position. Raiders in full rebuild mode. Lay the points.",
        recommendation: "Chiefs -9.5"
      }
    ];

    // Sample expert advice for Week 12
    const week12Advice = [
      {
        gameId: "game-1",
        source: "ESPN Bet",
        content: "Cowboys have been dominant at home this season. Take the points and enjoy watching Dallas control this divisional matchup from start to finish.",
        recommendation: "Cowboys -7.5"
      },
      {
        gameId: "game-1",
        source: "The Action Network",
        content: "Sharp money coming in on Washington getting the points. Road dogs in divisional games have good value late in the season.",
        recommendation: "Commanders +7.5"
      },
      {
        gameId: "game-2",
        source: "Sharp Football",
        content: "Weather looks cold and windy in Pittsburgh. Both teams prefer to run the ball. Take the under in what should be a grind-it-out game.",
        recommendation: "Under 42.5"
      },
      {
        gameId: "game-3",
        source: "ESPN Bet",
        content: "Chiefs are 8-1 at home this season and Raiders are dealing with multiple injuries. This line should be higher.",
        recommendation: "Chiefs -10.5"
      }
    ];

    // Create expert advice for both weeks
    for (const advice of week4Advice) {
      await this.createExpertAdvice(advice);
    }
    
    for (const advice of week12Advice) {
      await this.createExpertAdvice(advice);
    }
  }

  private getCurrentNFLWeek(): { week: number; season: number } {
    const now = new Date();
    const year = now.getFullYear();
    
    // NFL season typically starts first Thursday after Labor Day (first Monday in September)
    // For 2024 season, Week 1 started September 5, 2024
    const season2024Start = new Date('2024-09-05');
    const season2025Start = new Date('2025-09-04'); // Estimated
    
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
    
    // Calculate weeks since season start
    const msPerWeek = 7 * 24 * 60 * 60 * 1000;
    const weeksSinceStart = Math.floor((now.getTime() - seasonStart.getTime()) / msPerWeek);
    
    // NFL has 18 weeks in regular season, then playoffs
    const week = Math.min(Math.max(weeksSinceStart + 1, 1), 18);
    
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

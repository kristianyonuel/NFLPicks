import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { nflApiService } from "./services/nfl-api";
import { bettingOddsService } from "./services/betting-odds";
import { analyzeGame, batchAnalyzeGames } from "./services/ai-analysis";
import { webScraperService } from "./services/web-scraper";
import { insertGameSchema, insertBettingOddsSchema, insertAiPredictionSchema, insertTeamStatsSchema } from "@shared/schema";
import cron from "node-cron";

// Calculate current NFL week based on current date
function getCurrentNFLWeek(): { week: number; season: number } {
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

export async function registerRoutes(app: Express): Promise<Server> {
  
  // Get current NFL week
  app.get("/api/current-week", async (req, res) => {
    try {
      const currentWeek = getCurrentNFLWeek();
      res.json(currentWeek);
    } catch (error) {
      res.status(500).json({ message: "Failed to calculate current week" });
    }
  });

  // Get teams
  app.get("/api/teams", async (req, res) => {
    try {
      const teams = await storage.getAllTeams();
      res.json(teams);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch teams" });
    }
  });

  // Get games for a specific week with optional filters
  app.get("/api/games/:week/:season", async (req, res) => {
    try {
      const week = parseInt(req.params.week);
      const season = parseInt(req.params.season);
      
      const filters = {
        highProbability: req.query.highProbability === "true",
        divisional: req.query.divisional === "true",
        primeTime: req.query.primeTime === "true",
        playoffImplications: req.query.playoffImplications === "true",
      };

      // Remove false filters
      Object.keys(filters).forEach(key => {
        if (!filters[key as keyof typeof filters]) {
          delete filters[key as keyof typeof filters];
        }
      });

      // Try to get games with details first, but fall back to simple games if teams aren't loaded
      let games: any[] = [];
      try {
        games = await storage.getGamesWithDetails(week, season, Object.keys(filters).length > 0 ? filters : undefined);
        
        // If no games returned but we expect some, try the simple method
        if (games.length === 0) {
          console.log(`⚠️ getGamesWithDetails returned 0 games, trying getGamesByWeek...`);
          const simpleGames = await storage.getGamesByWeek(week, season);
          console.log(`📊 getGamesByWeek returned ${simpleGames.length} games`);
          
          // Convert simple games to the expected format for the frontend
          games = simpleGames.map(game => ({
            ...game,
            homeTeam: { id: game.homeTeamId, abbreviation: game.homeTeamId, city: game.homeTeamId, name: game.homeTeamId },
            awayTeam: { id: game.awayTeamId, abbreviation: game.awayTeamId, city: game.awayTeamId, name: game.awayTeamId },
            homeTeamStats: null,
            awayTeamStats: null,
            odds: null,
            aiPrediction: null,
            expertAdvice: []
          }));
        }
      } catch (error) {
        console.error("Error fetching games:", error);
        games = [];
      }

      res.json(games);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch games" });
    }
  });

  // Debug endpoint for raw games
  app.get("/api/games-raw/:week/:season", async (req, res) => {
    try {
      const week = parseInt(req.params.week);
      const season = parseInt(req.params.season);
      const games = await storage.getGamesByWeek(week, season);
      res.json(games);
    } catch (error) {
      console.error("Error fetching raw games:", error);
      res.status(500).json({ error: "Failed to fetch raw games" });
    }
  });

  // Get week summary statistics
  app.get("/api/summary/:week/:season", async (req, res) => {
    try {
      const week = parseInt(req.params.week);
      const season = parseInt(req.params.season);
      
      const summary = await storage.getWeekSummary(week, season);
      res.json(summary);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch week summary" });
    }
  });

  // Refresh data for a specific week
  app.post("/api/refresh/:week/:season", async (req, res) => {
    const week = parseInt(req.params.week);
    const season = parseInt(req.params.season);
    
    console.log(`🔄 Starting refresh for Week ${week}, ${season} season`);
    
    let nflGames: any[] = [];
    let bettingOdds: any[] = [];
    let aiAnalyses: any[] = [];
    let expertAdvice: any[] = [];

    try {
      // 1. Fetch games from NFL API
      console.log("📊 Fetching NFL games...");
      try {
        nflGames = await nflApiService.getWeekGames(week, season);
        console.log(`✅ Fetched ${nflGames.length} games`);
        
        // First, create all teams referenced in the games
        const teamIds = new Set<string>();
        nflGames.forEach(game => {
          teamIds.add(game.homeTeamId);
          teamIds.add(game.awayTeamId);
        });
        
        console.log(`🏈 Creating ${teamIds.size} teams...`);
        const teamIdArray = Array.from(teamIds);
        for (const teamId of teamIdArray) {
          try {
            await storage.createTeam({
              id: teamId,
              abbreviation: teamId,
              city: teamId,
              name: teamId,
              conference: teamId.startsWith('A') ? 'AFC' : 'NFC', // Simple heuristic
              division: 'Unknown'
            });
          } catch (error) {
            // Team might already exist, that's okay
          }
        }
        
        // Store games
        console.log(`💾 Storing ${nflGames.length} games in database...`);
        for (const gameData of nflGames) {
          console.log(`Storing game: ${gameData.awayTeamId} @ ${gameData.homeTeamId}, ID: ${gameData.id}`);
          await storage.createGame(gameData);
        }
        
        // Verify games were stored
        const storedGames = await storage.getGamesByWeek(week, season);
        console.log(`✅ Verified: ${storedGames.length} games now stored for Week ${week}, ${season}`);
      } catch (error) {
        console.error("❌ NFL API failed:", error);
        return res.status(500).json({ message: "Failed to fetch NFL games" });
      }

      // 2. Fetch team stats
      console.log("📈 Fetching team stats...");
      try {
        const teamStats = await nflApiService.getTeamStats(season);
        console.log(`✅ Fetched stats for ${teamStats.length} teams`);
        
        for (const stats of teamStats) {
          await storage.createTeamStats(stats);
        }
      } catch (error) {
        console.error("⚠️ Team stats failed, continuing...", error);
      }

      // 3. Fetch betting odds (with timeout)
      console.log("💰 Fetching betting odds...");
      try {
        const gamesForOdds = nflGames.map(game => ({
          gameId: game.id,
          homeTeam: game.homeTeamId,
          awayTeam: game.awayTeamId
        }));

        // Set a timeout for betting odds
        const oddsPromise = bettingOddsService.getBatchOdds(gamesForOdds);
        const timeoutPromise = new Promise((_, reject) =>
          setTimeout(() => reject(new Error('Betting odds timeout')), 10000)
        );

        bettingOdds = await Promise.race([oddsPromise, timeoutPromise]) as any[];
        console.log(`✅ Fetched odds for ${bettingOdds.length} games`);
        
        for (const odds of bettingOdds) {
          await storage.createBettingOdds(odds);
        }
      } catch (error) {
        console.error("⚠️ Betting odds failed, continuing...", error);
      }

      // 4. Generate AI analysis (with timeout)
      console.log("🤖 Generating AI analysis...");
      try {
        const gamesWithDetails = await storage.getGamesWithDetails(week, season);
        const analysisInputs = gamesWithDetails.map(game => ({
          game,
          homeTeam: game.homeTeam,
          awayTeam: game.awayTeam,
          homeTeamStats: game.homeTeamStats,
          awayTeamStats: game.awayTeamStats,
          odds: game.odds
        }));

        // Set a timeout for AI analysis
        const aiPromise = batchAnalyzeGames(analysisInputs);
        const timeoutPromise = new Promise((_, reject) =>
          setTimeout(() => reject(new Error('AI analysis timeout')), 30000)
        );

        aiAnalyses = await Promise.race([aiPromise, timeoutPromise]) as any[];
        console.log(`✅ Generated ${aiAnalyses.length} AI analyses`);
        
        for (let i = 0; i < aiAnalyses.length; i++) {
          const analysis = aiAnalyses[i];
          const game = gamesWithDetails[i];
          
          await storage.createAiPrediction({
            gameId: game.id,
            predictedWinner: analysis.predictedWinner,
            confidence: analysis.confidence.toString(),
            analysis: analysis.analysis,
            recommendedBet: analysis.recommendedBet,
            keyFactors: analysis.keyFactors
          });
        }
      } catch (error) {
        console.error("⚠️ AI analysis failed, continuing...", error);
      }

      // 5. Generate expert advice
      console.log("📰 Generating expert advice...");
      try {
        const gamesForAdvice = nflGames.map(game => ({
          gameId: game.id,
          homeTeam: game.homeTeamId,
          awayTeam: game.awayTeamId
        }));

        // Use web scraper service to generate comprehensive expert advice
        expertAdvice = await webScraperService.batchScrapeAdvice(gamesForAdvice);
        console.log(`✅ Generated ${expertAdvice.length} expert tips`);
        
        // Store all expert advice
        for (const advice of expertAdvice) {
          await storage.createExpertAdvice(advice);
        }
      } catch (error) {
        console.error("⚠️ Expert advice generation failed, continuing...", error);
        expertAdvice = [];
      }

      console.log(`🎉 Refresh completed! Games: ${nflGames.length}, Odds: ${bettingOdds.length}, AI: ${aiAnalyses.length}`);

      res.json({ 
        message: "Data refreshed successfully",
        gamesUpdated: nflGames.length,
        oddsUpdated: bettingOdds.length,
        analysesGenerated: aiAnalyses.length,
        adviceScraped: expertAdvice.length
      });
    } catch (error) {
      console.error("❌ Refresh failed:", error);
      res.status(500).json({ 
        message: "Failed to refresh data", 
        error: error instanceof Error ? error.message : "Unknown error",
        gamesUpdated: nflGames.length,
        oddsUpdated: bettingOdds.length,
        analysesGenerated: aiAnalyses.length
      });
    }
  });

  // Get expert advice for a specific game
  app.get("/api/advice/:gameId", async (req, res) => {
    try {
      const gameId = req.params.gameId;
      const advice = await storage.getExpertAdvice(gameId);
      res.json(advice);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch expert advice" });
    }
  });

  // Search games by team name
  app.get("/api/search", async (req, res) => {
    try {
      const query = req.query.q as string;
      const week = parseInt(req.query.week as string);
      const season = parseInt(req.query.season as string);
      
      if (!query || !week || !season) {
        return res.status(400).json({ message: "Missing required parameters" });
      }

      const games = await storage.getGamesWithDetails(week, season);
      const filteredGames = games.filter(game => 
        game.homeTeam.name.toLowerCase().includes(query.toLowerCase()) ||
        game.awayTeam.name.toLowerCase().includes(query.toLowerCase()) ||
        game.homeTeam.abbreviation.toLowerCase().includes(query.toLowerCase()) ||
        game.awayTeam.abbreviation.toLowerCase().includes(query.toLowerCase())
      );

      res.json(filteredGames);
    } catch (error) {
      res.status(500).json({ message: "Failed to search games" });
    }
  });

  // Schedule automatic data updates
  // Update every hour during game days (Thursday, Sunday, Monday)
  cron.schedule("0 * * * 4,0,1", async () => {
    console.log("Running scheduled data update...");
    try {
      // Get current week and season (simplified logic)
      const now = new Date();
      const season = now.getFullYear();
      const week = Math.max(1, Math.min(18, Math.floor((now.getTime() - new Date(season, 8, 1).getTime()) / (7 * 24 * 60 * 60 * 1000)) + 1));
      
      // Fetch and update current week data
      const nflGames = await nflApiService.getWeekGames(week, season);
      for (const gameData of nflGames) {
        await storage.createGame(gameData);
      }

      console.log(`Updated ${nflGames.length} games for week ${week}`);
    } catch (error) {
      console.error("Scheduled update failed:", error);
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}

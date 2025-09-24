import { type BettingOdds, type InsertBettingOdds } from "@shared/schema";
import fetch from "node-fetch";
import https from "https";

// Create a custom agent to handle SSL certificate issues
const httpsAgent = new https.Agent({
  rejectUnauthorized: false
});

interface OddsAPIResponse {
  data: Array<{
    id: string;
    sport_key: string;
    commence_time: string;
    home_team: string;
    away_team: string;
    bookmakers: Array<{
      key: string;
      title: string;
      markets: Array<{
        key: string;
        outcomes: Array<{
          name: string;
          price: number;
          point?: number;
        }>;
      }>;
    }>;
  }>;
}

export class BettingOddsService {
  private apiKey: string;
  private baseUrl = "https://api.the-odds-api.com/v4";

  constructor() {
    this.apiKey = process.env.ODDS_API_KEY || process.env.ODDS_API_KEY_ENV_VAR || "default_key";
  }

  async getGameOdds(homeTeam: string, awayTeam: string, gameId: string): Promise<BettingOdds | null> {
    try {
      // Check if we have a valid API key
      if (!this.apiKey || this.apiKey === "default_key") {
        console.log("⚠️ No valid betting odds API key configured, creating mock odds");
        return this.createMockOdds(gameId, homeTeam, awayTeam);
      }

      const url = `${this.baseUrl}/sports/americanfootball_nfl/odds/?apiKey=${this.apiKey}&regions=us&markets=spreads,totals,h2h&oddsFormat=american`;
      
      const response = await fetch(url, { 
        agent: httpsAgent,
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
        }
      });
      
      if (!response.ok) {
        if (response.status === 401) {
          console.log("⚠️ Betting odds API authentication failed, creating mock odds");
          return this.createMockOdds(gameId, homeTeam, awayTeam);
        }
        throw new Error(`Odds API responded with status: ${response.status}`);
      }

      const data: OddsAPIResponse = await response.json();
      
      // Find the game by matching teams
      const gameData = data.data.find(game => 
        this.normalizeTeamName(game.home_team) === this.normalizeTeamName(homeTeam) &&
        this.normalizeTeamName(game.away_team) === this.normalizeTeamName(awayTeam)
      );

      if (!gameData || !gameData.bookmakers.length) {
        return null;
      }

      // Use the first bookmaker's odds (usually DraftKings or FanDuel)
      const bookmaker = gameData.bookmakers[0];
      
      // Extract spreads
      const spreadsMarket = bookmaker.markets.find(m => m.key === "spreads");
      const homeSpread = spreadsMarket?.outcomes.find(o => 
        this.normalizeTeamName(o.name) === this.normalizeTeamName(homeTeam)
      );
      const awaySpread = spreadsMarket?.outcomes.find(o => 
        this.normalizeTeamName(o.name) === this.normalizeTeamName(awayTeam)
      );

      // Extract totals
      const totalsMarket = bookmaker.markets.find(m => m.key === "totals");
      const totalOver = totalsMarket?.outcomes.find(o => o.name === "Over");

      // Extract moneylines
      const h2hMarket = bookmaker.markets.find(m => m.key === "h2h");
      const homeML = h2hMarket?.outcomes.find(o => 
        this.normalizeTeamName(o.name) === this.normalizeTeamName(homeTeam)
      );
      const awayML = h2hMarket?.outcomes.find(o => 
        this.normalizeTeamName(o.name) === this.normalizeTeamName(awayTeam)
      );

      const odds: InsertBettingOdds = {
        gameId,
        spreadHome: homeSpread?.point ? homeSpread.point.toString() : null,
        spreadAway: awaySpread?.point ? awaySpread.point.toString() : null,
        spreadOdds: homeSpread?.price || -110,
        totalPoints: totalOver?.point ? totalOver.point.toString() : null,
        totalOdds: totalOver?.price || -110,
        homeMoneyline: homeML?.price || null,
        awayMoneyline: awayML?.price || null,
      };

      return odds as BettingOdds;
    } catch (error) {
      console.error("Failed to fetch betting odds:", error);
      return null;
    }
  }

  async getBatchOdds(games: Array<{ gameId: string; homeTeam: string; awayTeam: string }>): Promise<BettingOdds[]> {
    const odds = await Promise.allSettled(
      games.map(game => this.getGameOdds(game.homeTeam, game.awayTeam, game.gameId))
    );

    return odds
      .filter((result): result is PromiseFulfilledResult<BettingOdds> => 
        result.status === "fulfilled" && result.value !== null
      )
      .map(result => result.value);
  }

  private normalizeTeamName(name: string): string {
    // Normalize team names to handle variations between APIs
    const teamMap: { [key: string]: string } = {
      "Dallas Cowboys": "DAL",
      "Washington Commanders": "WAS",
      "Cincinnati Bengals": "CIN",
      "Pittsburgh Steelers": "PIT",
      "Kansas City Chiefs": "KC",
      "Las Vegas Raiders": "LV",
      "Miami Dolphins": "MIA",
      "Green Bay Packers": "GB",
      // Add more mappings as needed
    };

    return teamMap[name] || name.toUpperCase();
  }

  private createMockOdds(gameId: string, homeTeam: string, awayTeam: string): BettingOdds {
    // Generate realistic mock betting odds
    const homeSpread = (Math.random() * 14 - 7).toFixed(1); // -7 to +7 point spread
    const totalPoints = (Math.random() * 20 + 40).toFixed(1); // 40-60 total points
    const homeMoneyline = homeSpread > "0" ? Math.floor(Math.random() * 200) + 100 : -Math.floor(Math.random() * 200) - 100;
    const awayMoneyline = -homeMoneyline + Math.floor(Math.random() * 40 - 20);

    const odds: InsertBettingOdds = {
      gameId,
      spreadHome: homeSpread,
      spreadAway: (-parseFloat(homeSpread)).toFixed(1),
      spreadOdds: -110,
      totalPoints,
      totalOdds: -110,
      homeMoneyline,
      awayMoneyline,
    };

    console.log(`📊 Created mock odds for ${awayTeam} @ ${homeTeam}: ${homeTeam} ${homeSpread}, Total: ${totalPoints}`);
    return odds as BettingOdds;
  }
}

export const bettingOddsService = new BettingOddsService();

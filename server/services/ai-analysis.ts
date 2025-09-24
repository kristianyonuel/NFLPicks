import OpenAI from "openai";
import { type Game, type Team, type BettingOdds, type TeamStats } from "@shared/schema";

const openai = new OpenAI({ 
  apiKey: process.env.OPENAI_API_KEY || process.env.OPENAI_API_KEY_ENV_VAR || "default_key"
});

export interface GameAnalysisInput {
  game: Game;
  homeTeam: Team;
  awayTeam: Team;
  homeTeamStats: TeamStats | null;
  awayTeamStats: TeamStats | null;
  odds: BettingOdds | null;
}

export interface GameAnalysisResult {
  predictedWinner: string;
  confidence: number;
  analysis: string;
  recommendedBet: string;
  keyFactors: string[];
}

export async function analyzeGame(input: GameAnalysisInput): Promise<GameAnalysisResult> {
  const { game, homeTeam, awayTeam, homeTeamStats, awayTeamStats, odds } = input;

  const prompt = `
Analyze this NFL game and provide a detailed prediction with betting recommendation.

Game Details:
- ${awayTeam.city} ${awayTeam.name} (${awayTeamStats?.wins || 0}-${awayTeamStats?.losses || 0}) @ ${homeTeam.city} ${homeTeam.name} (${homeTeamStats?.wins || 0}-${homeTeamStats?.losses || 0})
- Week ${game.week}, ${game.season} season
- Game Time: ${game.gameTime}
- Divisional Game: ${game.isDivisional ? 'Yes' : 'No'}
- Prime Time: ${game.isPrimeTime ? 'Yes' : 'No'}
- Playoff Implications: ${game.hasPlayoffImplications ? 'Yes' : 'No'}

Team Statistics:
Away Team (${awayTeam.abbreviation}):
- Record: ${awayTeamStats?.wins || 0}-${awayTeamStats?.losses || 0}
- Points For: ${awayTeamStats?.pointsFor || 0}
- Points Against: ${awayTeamStats?.pointsAgainst || 0}

Home Team (${homeTeam.abbreviation}):
- Record: ${homeTeamStats?.wins || 0}-${homeTeamStats?.losses || 0}
- Points For: ${homeTeamStats?.pointsFor || 0}
- Points Against: ${homeTeamStats?.pointsAgainst || 0}

${odds ? `Current Betting Lines:
- Spread: ${homeTeam.abbreviation} ${Number(odds.spreadHome) > 0 ? '+' : ''}${odds.spreadHome}
- Total Points: ${odds.totalPoints}
- Moneylines: ${awayTeam.abbreviation} ${odds.awayMoneyline}, ${homeTeam.abbreviation} ${odds.homeMoneyline}` : 'No betting lines available'}

Please provide a comprehensive analysis and prediction. Consider factors like:
- Team form and recent performance
- Head-to-head history
- Home field advantage
- Injury reports (general assessment)
- Weather conditions (if applicable)
- Motivational factors (divisional rivalry, playoff race, etc.)

Respond with JSON in this exact format:
{
  "predictedWinner": "team abbreviation (e.g., 'DAL')",
  "confidence": number between 50-95,
  "analysis": "detailed 2-3 sentence analysis of the key factors",
  "recommendedBet": "specific betting recommendation (e.g., 'Cowboys -7.5', 'Under 45.5')",
  "keyFactors": ["factor1", "factor2", "factor3"]
}
`;

  try {
    const response = await openai.chat.completions.create({
      model: "gpt-4",
      messages: [
        {
          role: "system",
          content: "You are an expert NFL analyst with deep knowledge of team statistics, betting markets, and game analysis. Provide accurate, data-driven predictions."
        },
        {
          role: "user",
          content: prompt
        }
      ],
      response_format: { type: "json_object" },
    });

    const result = JSON.parse(response.choices[0].message.content || "{}");
    
    return {
      predictedWinner: result.predictedWinner || homeTeam.abbreviation,
      confidence: Math.max(50, Math.min(95, result.confidence || 60)),
      analysis: result.analysis || "Analysis not available",
      recommendedBet: result.recommendedBet || "No recommendation",
      keyFactors: Array.isArray(result.keyFactors) ? result.keyFactors : ["General analysis"]
    };
  } catch (error) {
    console.error("AI analysis failed:", error);
    
    // Fallback analysis based on basic stats
    const homeAdvantage = 3; // Standard home field advantage
    const homeWinPct = homeTeamStats ? homeTeamStats.wins / (homeTeamStats.wins + homeTeamStats.losses) : 0.5;
    const awayWinPct = awayTeamStats ? awayTeamStats.wins / (awayTeamStats.wins + awayTeamStats.losses) : 0.5;
    
    const homeStrength = homeWinPct + (homeAdvantage / 100);
    const predictedWinner = homeStrength > awayWinPct ? homeTeam.abbreviation : awayTeam.abbreviation;
    const confidence = Math.min(95, Math.max(50, Math.abs(homeStrength - awayWinPct) * 100 + 55));

    return {
      predictedWinner,
      confidence,
      analysis: `Statistical analysis based on team records and home field advantage. ${predictedWinner === homeTeam.abbreviation ? 'Home team' : 'Away team'} favored.`,
      recommendedBet: odds ? `${predictedWinner} spread` : "No betting recommendation available",
      keyFactors: ["Team records", "Home field advantage", "Statistical modeling"]
    };
  }
}

export async function batchAnalyzeGames(games: GameAnalysisInput[]): Promise<GameAnalysisResult[]> {
  const results = await Promise.allSettled(
    games.map(game => analyzeGame(game))
  );

  return results.map((result, index) => {
    if (result.status === "fulfilled") {
      return result.value;
    } else {
      console.error(`Analysis failed for game ${games[index].game.id}:`, result.reason);
      return {
        predictedWinner: games[index].homeTeam.abbreviation,
        confidence: 55,
        analysis: "Analysis failed, using basic prediction",
        recommendedBet: "No recommendation",
        keyFactors: ["Basic analysis"]
      };
    }
  });
}

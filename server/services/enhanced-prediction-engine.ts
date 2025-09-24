import OpenAI from "openai";
import { type Game, type Team } from "@shared/schema";
import { redditAnalyzer } from "./reddit-sentiment";
import { dataCollector, type EnhancedGameAnalysisInput } from "./enhanced-data-collector";

const openai = new OpenAI({ 
  apiKey: process.env.OPENAI_API_KEY || "default_key"
});

export interface EnhancedPredictionResult {
  predictedWinner: string;
  confidence: number;
  winProbability: number;
  analysis: string;
  recommendedBet: string;
  keyFactors: string[];
  riskFactors: string[];
  sentimentImpact: string;
  weatherImpact: string;
  coachingEdge: string;
  valuePlay: string;
  confidenceFactors: {
    dataQuality: number;
    modelConsensus: number;
    marketAlignment: number;
    historicalAccuracy: number;
  };
}

export class EnhancedPredictionEngine {

  async generateEnhancedPrediction(game: Game, homeTeam: Team, awayTeam: Team): Promise<EnhancedPredictionResult> {
    
    // Collect all enhanced data sources
    const enhancedData = await dataCollector.collectEnhancedGameData(game, homeTeam, awayTeam);
    
    // Generate AI analysis with comprehensive data
    const aiAnalysis = await this.generateAIAnalysis(enhancedData);
    
    // Calculate composite confidence score
    const confidenceFactors = this.calculateConfidenceFactors(enhancedData);
    
    return {
      ...aiAnalysis,
      confidenceFactors
    };
  }

  private async generateAIAnalysis(data: EnhancedGameAnalysisInput): Promise<Omit<EnhancedPredictionResult, 'confidenceFactors'>> {
    
    const prompt = `
You are an expert NFL analyst with access to comprehensive game data. Analyze this matchup and provide a detailed prediction.

## GAME INFORMATION
${data.homeTeam.name} vs ${data.awayTeam.name}
Week ${data.game.week}, ${data.game.season}
${data.primeTimeGame ? 'PRIME TIME GAME' : 'Regular Game'}
${data.divisionalGame ? 'DIVISIONAL MATCHUP' : 'Inter-Conference Game'}

## HISTORICAL HEAD-TO-HEAD
- ${data.homeTeam.name} wins: ${data.headToHead.homeWins}
- ${data.awayTeam.name} wins: ${data.headToHead.awayWins}
- Recent trend favors: ${data.headToHead.recentTrend}
- Average point differential: ${data.headToHead.averagePointDifferential}
- Last meeting: ${data.headToHead.lastMeetingResult}

## TEAM MOMENTUM & FORM
### ${data.homeTeam.name}
- Last 4 games: ${data.homeTeamMomentum.last4Games.join('-')}
- Scoring trend: ${data.homeTeamMomentum.pointsPerGameTrend > 0 ? '+' : ''}${data.homeTeamMomentum.pointsPerGameTrend} PPG
- Offensive rating: ${data.homeTeamMomentum.offensiveRating}/100
- Defensive rating: ${data.homeTeamMomentum.defensiveRating}/100

### ${data.awayTeam.name}  
- Last 4 games: ${data.awayTeamMomentum.last4Games.join('-')}
- Scoring trend: ${data.awayTeamMomentum.pointsPerGameTrend > 0 ? '+' : ''}${data.awayTeamMomentum.pointsPerGameTrend} PPG
- Offensive rating: ${data.awayTeamMomentum.offensiveRating}/100
- Defensive rating: ${data.awayTeamMomentum.defensiveRating}/100

## INJURY REPORTS & TEAM HEALTH
### ${data.homeTeam.name}
- Key players OUT: ${data.homeInjuries.keyPlayersOut.join(', ') || 'None'}
- Key players QUESTIONABLE: ${data.homeInjuries.keyPlayersQuestionable.join(', ') || 'None'}
- Impact rating: ${data.homeInjuries.impactRating}/5

### ${data.awayTeam.name}
- Key players OUT: ${data.awayInjuries.keyPlayersOut.join(', ') || 'None'}  
- Key players QUESTIONABLE: ${data.awayInjuries.keyPlayersQuestionable.join(', ') || 'None'}
- Impact rating: ${data.awayInjuries.impactRating}/5

## WEATHER CONDITIONS
${data.weather.domeGame ? 'Indoor game (weather not a factor)' : 
`Temperature: ${data.weather.temperature}°F
Wind: ${data.weather.windSpeed} mph
Conditions: ${data.weather.conditions}
Precipitation: ${data.weather.precipitation}%`}

## PUBLIC SENTIMENT ANALYSIS
### ${data.homeTeam.name} Fan Sentiment
- Reddit sentiment: ${data.sentiment.home.redditSentiment > 0 ? 'Positive' : 'Negative'} (${data.sentiment.home.redditSentiment.toFixed(2)})
- Key fan concerns: ${data.sentiment.home.trendingConcerns.join(', ')}
- Positive narratives: ${data.sentiment.home.positiveNarratives.join(', ')}

### ${data.awayTeam.name} Fan Sentiment  
- Reddit sentiment: ${data.sentiment.away.redditSentiment > 0 ? 'Positive' : 'Negative'} (${data.sentiment.away.redditSentiment.toFixed(2)})
- Key fan concerns: ${data.sentiment.away.trendingConcerns.join(', ')}
- Positive narratives: ${data.sentiment.away.positiveNarratives.join(', ')}

## BETTING MARKET INTELLIGENCE
- Sharp money leaning: ${data.bettingIntel.sharpMoney}
- Public betting: ${data.bettingIntel.publicBetting}% on favorite
- Line movement: ${data.bettingIntel.lineMovement}
- Steam moves detected: ${data.bettingIntel.steamMoves ? 'YES' : 'NO'}
- Market activity: ${data.bettingIntel.totalAction}

## COACHING MATCHUP
### ${data.homeTeam.name} Coach: ${data.coaching.homeCoach.name}
- Record vs opponent: ${data.coaching.homeCoach.recordVsOpponent}
- Prime time record: ${data.coaching.homeCoach.primeTimeRecord}
- After bye week: ${data.coaching.homeCoach.afterByeWeekRecord}

### ${data.awayTeam.name} Coach: ${data.coaching.awayCoach.name}
- Record vs opponent: ${data.coaching.awayCoach.recordVsOpponent}  
- Road game record: ${data.coaching.awayCoach.roadGameRecord}
- Under pressure record: ${data.coaching.awayCoach.underPressureRecord}

## SITUATIONAL FACTORS
- Rest advantage: ${data.homeTeam.name} (${data.restDays.home} days) vs ${data.awayTeam.name} (${data.restDays.away} days)
- Travel distance: ${data.travelDistance} miles
- Playoff implications: ${data.playoffImplications ? 'HIGH STAKES' : 'Regular season game'}

Based on this comprehensive analysis, provide your prediction in this EXACT JSON format:
{
  "predictedWinner": "team abbreviation (e.g., DAL)",
  "confidence": number between 50-100,
  "winProbability": number between 0.5-1.0,
  "analysis": "detailed 2-3 paragraph analysis explaining your reasoning",
  "recommendedBet": "specific betting recommendation with reasoning",
  "keyFactors": ["factor 1", "factor 2", "factor 3"],
  "riskFactors": ["risk 1", "risk 2"],
  "sentimentImpact": "how fan/public sentiment affects the game",
  "weatherImpact": "how weather conditions impact the game",
  "coachingEdge": "which coach has the advantage and why",
  "valuePlay": "best betting value opportunity in this game"
}`;

    try {
      const completion = await openai.chat.completions.create({
        model: "gpt-4-turbo-preview",
        messages: [
          {
            role: "system", 
            content: "You are a professional NFL analyst. Always respond with valid JSON only, no additional text."
          },
          { role: "user", content: prompt }
        ],
        temperature: 0.3,
        max_tokens: 1500
      });

      const response = completion.choices[0]?.message?.content;
      if (!response) {
        throw new Error("No response from AI");
      }

      // Parse the JSON response
      const analysis = JSON.parse(response);
      
      return {
        predictedWinner: analysis.predictedWinner,
        confidence: analysis.confidence,
        winProbability: analysis.winProbability,
        analysis: analysis.analysis,
        recommendedBet: analysis.recommendedBet,
        keyFactors: analysis.keyFactors,
        riskFactors: analysis.riskFactors,
        sentimentImpact: analysis.sentimentImpact,
        weatherImpact: analysis.weatherImpact,
        coachingEdge: analysis.coachingEdge,
        valuePlay: analysis.valuePlay
      };

    } catch (error) {
      console.error("Error generating AI analysis:", error);
      
      // Fallback prediction
      return {
        predictedWinner: data.homeTeam.id,
        confidence: 55,
        winProbability: 0.55,
        analysis: "Home team favored in a close matchup. Analysis unavailable due to technical issues.",
        recommendedBet: "No recommendation available",
        keyFactors: ["Home field advantage"],
        riskFactors: ["Limited data available"],
        sentimentImpact: "Neutral impact",
        weatherImpact: "Minimal impact expected",
        coachingEdge: "Even matchup",
        valuePlay: "Monitor line movement"
      };
    }
  }

  private calculateConfidenceFactors(data: EnhancedGameAnalysisInput): EnhancedPredictionResult['confidenceFactors'] {
    
    // Data Quality Score (0-1)
    let dataQuality = 0.5; // Base score
    if (data.homeInjuries.impactRating <= 2 && data.awayInjuries.impactRating <= 2) dataQuality += 0.1;
    if (data.headToHead.homeWins + data.headToHead.awayWins >= 5) dataQuality += 0.1;
    if (data.sentiment.home.redditSentiment !== 0 && data.sentiment.away.redditSentiment !== 0) dataQuality += 0.1;
    if (!data.weather.domeGame && data.weather.temperature > 0) dataQuality += 0.1;
    dataQuality = Math.min(1, dataQuality);

    // Model Consensus Score (0-1) - how much different indicators agree
    const homeAdvantages = [
      data.headToHead.recentTrend === 'home',
      data.homeTeamMomentum.pointsPerGameTrend > data.awayTeamMomentum.pointsPerGameTrend,
      data.homeInjuries.impactRating < data.awayInjuries.impactRating,
      data.sentiment.home.redditSentiment > data.sentiment.away.redditSentiment,
      data.restDays.home >= data.restDays.away
    ];
    
    const consensus = homeAdvantages.filter(Boolean).length;
    const modelConsensus = Math.abs(consensus - 2.5) / 2.5; // How far from 50/50

    // Market Alignment Score (0-1) - how well our prediction aligns with betting markets
    const marketAlignment = data.bettingIntel.sharpMoney === 'neutral' ? 0.5 : 0.8;

    // Historical Accuracy (0-1) - placeholder for model's historical performance
    const historicalAccuracy = 0.68; // This would be calculated from backtesting

    return {
      dataQuality,
      modelConsensus,
      marketAlignment,
      historicalAccuracy
    };
  }
}

// Export singleton instance
export const enhancedPredictionEngine = new EnhancedPredictionEngine();
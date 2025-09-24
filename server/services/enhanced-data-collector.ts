import { type Game, type Team } from "@shared/schema";

// Enhanced data interfaces for better predictions
export interface HistoricalMatchup {
  homeWins: number;
  awayWins: number;
  averagePointDifferential: number;
  recentTrend: 'home' | 'away' | 'neutral';
  lastMeetingDate: string;
  lastMeetingResult: string;
}

export interface WeatherData {
  temperature: number;
  windSpeed: number;
  precipitation: number;
  conditions: string;
  domeGame: boolean;
}

export interface InjuryReport {
  teamId: string;
  keyPlayersOut: string[];
  keyPlayersQuestionable: string[];
  impactRating: 1 | 2 | 3 | 4 | 5; // 1 = minimal, 5 = severe impact
}

export interface TeamMomentum {
  teamId: string;
  last4Games: ('W' | 'L')[];
  pointsPerGameTrend: number; // positive = improving, negative = declining
  defensiveRating: number;
  offensiveRating: number;
  specialTeamsRating: number;
}

export interface SentimentData {
  teamId: string;
  redditSentiment: number; // -1 to 1
  mediaConfidence: number; // -1 to 1
  fanOptimism: number; // -1 to 1
  trendingConcerns: string[];
  positiveNarratives: string[];
}

export interface BettingIntelligence {
  gameId: string;
  sharpMoney: 'home' | 'away' | 'neutral';
  publicBetting: number; // percentage on favorite
  lineMovement: string;
  steamMoves: boolean;
  totalAction: 'heavy' | 'moderate' | 'light';
}

export interface CoachingFactors {
  homeCoach: {
    name: string;
    recordVsOpponent: string;
    primeTimeRecord: string;
    afterByeWeekRecord: string;
    playoffExperience: number;
  };
  awayCoach: {
    name: string;
    recordVsOpponent: string;
    roadGameRecord: string;
    underPressureRecord: string;
    adaptabilityRating: number;
  };
}

// Enhanced game analysis input with all new data sources
export interface EnhancedGameAnalysisInput {
  game: Game;
  homeTeam: Team;
  awayTeam: Team;
  
  // Historical data
  headToHead: HistoricalMatchup;
  
  // Environmental factors
  weather: WeatherData;
  
  // Team condition
  homeTeamMomentum: TeamMomentum;
  awayTeamMomentum: TeamMomentum;
  homeInjuries: InjuryReport;
  awayInjuries: InjuryReport;
  
  // Market intelligence
  sentiment: {
    home: SentimentData;
    away: SentimentData;
  };
  bettingIntel: BettingIntelligence;
  
  // Coaching analysis
  coaching: CoachingFactors;
  
  // Situational context
  restDays: {
    home: number;
    away: number;
  };
  travelDistance: number;
  divisionalGame: boolean;
  playoffImplications: boolean;
  primeTimeGame: boolean;
}

// Data collection service implementations
export class DataCollectorService {
  
  async getHistoricalMatchup(homeTeamId: string, awayTeamId: string): Promise<HistoricalMatchup> {
    // Implementation: Query historical game results between these teams
    // Could integrate with NFL API or maintain our own historical database
    return {
      homeWins: 0,
      awayWins: 0,
      averagePointDifferential: 0,
      recentTrend: 'neutral',
      lastMeetingDate: '',
      lastMeetingResult: ''
    };
  }

  async getWeatherData(gameDate: Date, stadium: string): Promise<WeatherData> {
    // Implementation: Weather API integration
    // Check if dome stadium, get forecast for game time
    return {
      temperature: 72,
      windSpeed: 5,
      precipitation: 0,
      conditions: 'Clear',
      domeGame: false
    };
  }

  async getInjuryReports(teamId: string): Promise<InjuryReport> {
    // Implementation: NFL injury report scraping or API
    return {
      teamId,
      keyPlayersOut: [],
      keyPlayersQuestionable: [],
      impactRating: 1
    };
  }

  async getTeamMomentum(teamId: string, currentWeek: number): Promise<TeamMomentum> {
    // Implementation: Calculate recent performance trends
    return {
      teamId,
      last4Games: ['W', 'L', 'W', 'W'],
      pointsPerGameTrend: 2.5,
      defensiveRating: 85,
      offensiveRating: 78,
      specialTeamsRating: 82
    };
  }

  async getRedditSentiment(teamId: string): Promise<SentimentData> {
    // Implementation: Reddit API + sentiment analysis
    const subredditMap: Record<string, string> = {
      'DAL': 'cowboys',
      'PHI': 'eagles',
      'WAS': 'commanders',
      'NYG': 'NYGiants',
      // ... add all teams
    };

    const subreddit = subredditMap[teamId];
    
    // Pseudo-implementation for Reddit scraping
    /*
    const posts = await reddit.getSubreddit(subreddit).getHot();
    const comments = posts.map(post => post.comments).flat();
    const sentiment = await analyzeSentiment(comments);
    */

    return {
      teamId,
      redditSentiment: 0.2, // Mock data
      mediaConfidence: 0.1,
      fanOptimism: 0.3,
      trendingConcerns: ['Injury to QB', 'Offensive line issues'],
      positiveNarratives: ['Strong defense', 'Home field advantage']
    };
  }

  async getBettingIntelligence(gameId: string): Promise<BettingIntelligence> {
    // Implementation: Track line movements across multiple sportsbooks
    // Monitor betting percentages and sharp money indicators
    return {
      gameId,
      sharpMoney: 'home',
      publicBetting: 65,
      lineMovement: 'Home team -3 to -3.5 (line moving away from public)',
      steamMoves: false,
      totalAction: 'moderate'
    };
  }

  async getCoachingFactors(homeTeamId: string, awayTeamId: string): Promise<CoachingFactors> {
    // Implementation: Coaching records and situational performance database
    return {
      homeCoach: {
        name: 'Mike McCarthy',
        recordVsOpponent: '2-1',
        primeTimeRecord: '12-8',
        afterByeWeekRecord: '3-2',
        playoffExperience: 8
      },
      awayCoach: {
        name: 'Dan Quinn',
        recordVsOpponent: '1-2',
        roadGameRecord: '15-12',
        underPressureRecord: '8-6',
        adaptabilityRating: 4
      }
    };
  }

  // Master method to collect all enhanced data for a game
  async collectEnhancedGameData(game: Game, homeTeam: Team, awayTeam: Team): Promise<EnhancedGameAnalysisInput> {
    const [
      headToHead,
      weather,
      homeTeamMomentum,
      awayTeamMomentum,
      homeInjuries,
      awayInjuries,
      homeSentiment,
      awaySentiment,
      bettingIntel,
      coaching
    ] = await Promise.all([
      this.getHistoricalMatchup(homeTeam.id, awayTeam.id),
      this.getWeatherData(game.gameTime, homeTeam.city + homeTeam.name),
      this.getTeamMomentum(homeTeam.id, game.week),
      this.getTeamMomentum(awayTeam.id, game.week),
      this.getInjuryReports(homeTeam.id),
      this.getInjuryReports(awayTeam.id),
      this.getRedditSentiment(homeTeam.id),
      this.getRedditSentiment(awayTeam.id),
      this.getBettingIntelligence(game.id),
      this.getCoachingFactors(homeTeam.id, awayTeam.id)
    ]);

    return {
      game,
      homeTeam,
      awayTeam,
      headToHead,
      weather,
      homeTeamMomentum,
      awayTeamMomentum,
      homeInjuries,
      awayInjuries,
      sentiment: {
        home: homeSentiment,
        away: awaySentiment
      },
      bettingIntel,
      coaching,
      restDays: {
        home: this.calculateRestDays(game.gameTime, homeTeam.id),
        away: this.calculateRestDays(game.gameTime, awayTeam.id)
      },
      travelDistance: this.calculateTravelDistance(homeTeam, awayTeam),
      divisionalGame: game.isDivisional,
      playoffImplications: game.hasPlayoffImplications,
      primeTimeGame: game.isPrimeTime
    };
  }

  private calculateRestDays(gameTime: Date, teamId: string): number {
    // Implementation: Look up team's last game and calculate rest days
    return 7; // Default 1 week rest
  }

  private calculateTravelDistance(homeTeam: Team, awayTeam: Team): number {
    // Implementation: Calculate miles between team cities
    return 1200; // Mock distance
  }
}

// Export singleton instance
export const dataCollector = new DataCollectorService();
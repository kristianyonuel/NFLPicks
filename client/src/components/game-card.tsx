import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Bot } from "lucide-react";
import type { GameWithDetails } from "@shared/schema";

interface GameCardProps {
  game: GameWithDetails;
  featured?: boolean;
}

export function GameCard({ game, featured = false }: GameCardProps) {
  const gameTime = new Date(game.gameTime);
  const timeString = gameTime.toLocaleDateString('en-US', { 
    weekday: 'short', 
    hour: 'numeric', 
    minute: '2-digit',
    hour12: true 
  });

  const getConfidenceClass = (confidence: number) => {
    if (confidence >= 70) return "probability-high";
    if (confidence >= 60) return "probability-medium";
    return "probability-low";
  };

  const getOddsClass = (odds: number) => {
    return odds > 0 ? "odds-positive" : "odds-negative";
  };

  const formatSpread = (spread: string | null, team: string) => {
    if (!spread) return "N/A";
    const num = parseFloat(spread);
    return `${team} ${num > 0 ? '+' : ''}${num}`;
  };

  const CardWrapper = featured ? 
    ({ children }: { children: React.ReactNode }) => (
      <div className="gradient-border" data-testid="game-card-featured">
        <div>{children}</div>
      </div>
    ) : 
    Card;

  return (
    <CardWrapper>
      <CardContent className={`p-6 ${!featured ? 'bg-card border-border' : ''}`}>
        <div className="flex items-center justify-between mb-4">
          <div className="flex gap-2">
            {game.isPrimeTime && (
              <Badge variant="default" className="bg-chart-2 text-white">
                Prime Time
              </Badge>
            )}
            {game.isDivisional && (
              <Badge variant="outline" className="border-chart-1 text-chart-1">
                Divisional
              </Badge>
            )}
            {game.hasPlayoffImplications && (
              <Badge variant="outline" className="border-chart-4 text-chart-4">
                Playoff Race
              </Badge>
            )}
          </div>
          <span className="text-sm text-muted-foreground" data-testid="text-game-time">
            {timeString}
          </span>
        </div>

        <div className="flex items-center justify-between mb-6">
          {/* Away Team */}
          <div className="flex items-center space-x-4">
            <div 
              className="team-logo"
              style={{ 
                backgroundColor: game.awayTeam.primaryColor || 'hsl(215, 25%, 27%)',
                color: game.awayTeam.secondaryColor || 'var(--foreground)'
              }}
              data-testid="logo-away-team"
            >
              {game.awayTeam.abbreviation}
            </div>
            <div>
              <h3 className="font-bold text-foreground" data-testid="text-away-team">
                {game.awayTeam.city} {game.awayTeam.name}
              </h3>
              <p className="text-sm text-muted-foreground" data-testid="text-away-record">
                {game.awayTeamStats ? `${game.awayTeamStats.wins}-${game.awayTeamStats.losses}` : 'N/A'}
              </p>
            </div>
          </div>

          <div className="text-center">
            <span className="text-2xl font-bold text-muted-foreground">@</span>
          </div>

          {/* Home Team */}
          <div className="flex items-center space-x-4">
            <div>
              <h3 className="font-bold text-foreground text-right" data-testid="text-home-team">
                {game.homeTeam.city} {game.homeTeam.name}
              </h3>
              <p className="text-sm text-muted-foreground text-right" data-testid="text-home-record">
                {game.homeTeamStats ? `${game.homeTeamStats.wins}-${game.homeTeamStats.losses}` : 'N/A'}
              </p>
            </div>
            <div 
              className="team-logo"
              style={{ 
                backgroundColor: game.homeTeam.primaryColor || 'hsl(215, 25%, 27%)',
                color: game.homeTeam.secondaryColor || 'var(--foreground)'
              }}
              data-testid="logo-home-team"
            >
              {game.homeTeam.abbreviation}
            </div>
          </div>
        </div>

        {/* AI Analysis */}
        {game.aiPrediction && (
          <div className="bg-muted rounded-lg p-4 mb-4">
            <div className="flex items-center justify-between mb-3">
              <span className="text-sm font-medium text-foreground flex items-center">
                <Bot className="mr-2 h-4 w-4 text-primary" />
                AI Analysis
              </span>
              <span 
                className={`${getConfidenceClass(Number(game.aiPrediction.confidence))} px-2 py-1 rounded text-white text-sm font-medium`}
                data-testid="text-ai-confidence"
              >
                {Number(game.aiPrediction.confidence).toFixed(0)}% Confidence
              </span>
            </div>
            <p className="text-sm text-muted-foreground mb-3" data-testid="text-ai-analysis">
              {game.aiPrediction.analysis}
            </p>
            <div className="text-sm">
              <span className="text-foreground font-medium">Prediction: </span>
              <span className="text-chart-1 font-medium" data-testid="text-ai-prediction">
                {game.aiPrediction.recommendedBet}
              </span>
            </div>
          </div>
        )}

        {/* Betting Odds */}
        {game.odds && (
          <div className="grid grid-cols-3 gap-4">
            <div className="text-center">
              <p className="text-xs text-muted-foreground mb-1">Spread</p>
              <p className="font-bold text-foreground" data-testid="text-spread">
                {formatSpread(game.odds.spreadHome, game.homeTeam.abbreviation)}
              </p>
              <p className={`text-xs ${getOddsClass(game.odds.spreadOdds || -110)}`} data-testid="text-spread-odds">
                {game.odds.spreadOdds || -110}
              </p>
            </div>
            <div className="text-center">
              <p className="text-xs text-muted-foreground mb-1">Total</p>
              <p className="font-bold text-foreground" data-testid="text-total">
                O/U {game.odds.totalPoints || 'N/A'}
              </p>
              <p className={`text-xs ${getOddsClass(game.odds.totalOdds || -110)}`} data-testid="text-total-odds">
                {game.odds.totalOdds || -110}
              </p>
            </div>
            <div className="text-center">
              <p className="text-xs text-muted-foreground mb-1">Moneyline</p>
              <p className={`font-bold ${getOddsClass(game.odds.awayMoneyline || 0)}`} data-testid="text-away-ml">
                {game.odds.awayMoneyline || 'N/A'}
              </p>
              <p className={`font-bold ${getOddsClass(game.odds.homeMoneyline || 0)}`} data-testid="text-home-ml">
                {game.odds.homeMoneyline || 'N/A'}
              </p>
            </div>
          </div>
        )}
      </CardContent>
    </CardWrapper>
  );
}

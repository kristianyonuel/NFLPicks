import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Users, ExternalLink } from "lucide-react";
import type { GameWithDetails } from "@shared/schema";

interface ExpertAnalysisProps {
  games: GameWithDetails[];
}

export function ExpertAnalysis({ games }: ExpertAnalysisProps) {
  // Sample scraped insights (in real app, this would come from the backend)
  const recentInsights = [
    {
      source: "ESPN Bet",
      time: "2 mins ago",
      content: "Cowboys dominate on both sides of the ball. Take the over in this high-scoring affair.",
      sourceColor: "text-primary"
    },
    {
      source: "The Action Network",
      time: "5 mins ago", 
      content: "Divisional games always play closer than expected. Bengals getting too many points here.",
      sourceColor: "text-chart-1"
    },
    {
      source: "Sharp Football",
      time: "8 mins ago",
      content: "Weather concerns for the Lambeau game. Look for under opportunities.",
      sourceColor: "text-chart-2"
    },
  ];

  // Calculate consensus data based on AI predictions
  const consensusData = games
    .filter(game => game.aiPrediction)
    .slice(0, 4)
    .map(game => {
      const confidence = Number(game.aiPrediction!.confidence);
      const recommendation = game.aiPrediction!.recommendedBet;
      
      return {
        recommendation,
        confidence,
        percentage: Math.min(95, Math.max(50, confidence))
      };
    });

  return (
    <Card className="bg-card border-border">
      <CardHeader className="p-6">
        <h3 className="text-lg font-semibold text-foreground flex items-center" data-testid="text-expert-analysis-title">
          <Users className="mr-2 h-5 w-5 text-primary" />
          Expert Consensus & Web Insights
        </h3>
      </CardHeader>
      
      <CardContent className="p-6 pt-0">
        <div className="grid grid-cols-2 gap-6">
          {/* Scraped Analysis */}
          <div>
            <h4 className="text-sm font-medium text-foreground mb-3" data-testid="text-latest-sites-title">
              Latest From Top Sites
            </h4>
            <div className="space-y-3">
              {recentInsights.map((insight, index) => (
                <div 
                  key={index} 
                  className="border border-border rounded-lg p-3"
                  data-testid={`insight-item-${index}`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className={`text-xs font-medium ${insight.sourceColor}`} data-testid={`text-insight-source-${index}`}>
                      {insight.source}
                    </span>
                    <div className="flex items-center space-x-1">
                      <span className="text-xs text-muted-foreground">
                        {insight.time}
                      </span>
                      <ExternalLink className="h-3 w-3 text-muted-foreground" />
                    </div>
                  </div>
                  <p className="text-sm text-muted-foreground" data-testid={`text-insight-content-${index}`}>
                    "{insight.content}"
                  </p>
                </div>
              ))}
            </div>
          </div>

          {/* Consensus Data */}
          <div>
            <h4 className="text-sm font-medium text-foreground mb-3" data-testid="text-expert-consensus-title">
              Expert Consensus
            </h4>
            <div className="space-y-4">
              {consensusData.map((item, index) => (
                <div key={index} className="flex items-center justify-between" data-testid={`consensus-item-${index}`}>
                  <span className="text-sm text-muted-foreground" data-testid={`text-consensus-recommendation-${index}`}>
                    {item.recommendation}
                  </span>
                  <div className="flex items-center space-x-2">
                    <Progress 
                      value={item.percentage} 
                      className="w-32"
                      data-testid={`progress-consensus-${index}`}
                    />
                    <span className="text-sm font-medium text-foreground w-10" data-testid={`text-consensus-percentage-${index}`}>
                      {item.percentage.toFixed(0)}%
                    </span>
                  </div>
                </div>
              ))}
              
              {consensusData.length === 0 && (
                <p className="text-sm text-muted-foreground text-center py-4" data-testid="text-no-consensus">
                  No consensus data available yet.
                </p>
              )}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

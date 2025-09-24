import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Progress } from "@/components/ui/progress";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { apiRequest } from "@/lib/queryClient";
import { 
  Brain, 
  TrendingUp, 
  TrendingDown,
  CloudRain, 
  Users, 
  AlertTriangle,
  Target,
  DollarSign,
  MessageSquare,
  ThermometerSun
} from "lucide-react";
import type { GameWithDetails } from "@shared/schema";

interface IntelligenceTabProps {
  games: GameWithDetails[];
}

interface GameIntelligence {
  game: any;
  teams: {
    home: any;
    away: any;
  };
  intelligence?: any;
  weather?: any;
  betting?: any;
  sentiment?: {
    home?: any;
    away?: any;
  };
  injuries?: {
    home?: any;
    away?: any;
  };
}

export function IntelligenceTab({ games }: IntelligenceTabProps) {
  const [selectedGameId, setSelectedGameId] = useState<string | null>(
    games.length > 0 ? games[0].id : null
  );
  
  const [enhancingGames, setEnhancingGames] = useState<Set<string>>(new Set());

  // Fetch detailed intelligence for selected game
  const { data: gameIntelligence, isLoading: intelligenceLoading } = useQuery({
    queryKey: ["gameIntelligence", selectedGameId],
    queryFn: async () => {
      if (!selectedGameId) return null;
      const response = await apiRequest("GET", `/api/intelligence/${selectedGameId}`);
      return response as unknown as GameIntelligence;
    },
    enabled: !!selectedGameId,
  });

  const handleEnhanceGame = async (gameId: string) => {
    try {
      setEnhancingGames(prev => new Set(Array.from(prev).concat(gameId)));
      
      await apiRequest("POST", `/api/enhance/${gameId}`);
      
      // Refresh the intelligence data
      // This will be handled automatically by React Query
      
    } catch (error) {
      console.error("Error enhancing game:", error);
    } finally {
      setEnhancingGames(prev => {
        const newSet = new Set(prev);
        newSet.delete(gameId);
        return newSet;
      });
    }
  };

  const handleBatchEnhance = async () => {
    try {
      setEnhancingGames(new Set(Array.from(games.map(g => g.id))));
      
      await apiRequest("POST", "/api/enhance/batch");
      
    } catch (error) {
      console.error("Error batch enhancing:", error);
    } finally {
      setEnhancingGames(new Set());
    }
  };

  if (games.length === 0) {
    return (
      <div className="text-center py-12">
        <Brain className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
        <h3 className="text-lg font-semibold text-muted-foreground mb-2">
          No games available
        </h3>
        <p className="text-sm text-muted-foreground">
          Games intelligence will appear here when games are loaded
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header with batch actions */}
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <Brain className="h-6 w-6" />
            Game Intelligence
          </h2>
          <p className="text-muted-foreground">
            Enhanced analysis using Reddit sentiment, weather data, betting intelligence, and more
          </p>
        </div>
        <Button 
          onClick={handleBatchEnhance}
          disabled={enhancingGames.size > 0}
          className="bg-blue-600 hover:bg-blue-700"
        >
          <TrendingUp className="h-4 w-4 mr-2" />
          {enhancingGames.size > 0 ? "Enhancing..." : "Enhance All Games"}
        </Button>
      </div>

      <div className="grid grid-cols-12 gap-6">
        {/* Game Selection Sidebar */}
        <div className="col-span-4 space-y-3">
          <h3 className="font-semibold text-lg">Select Game</h3>
          <div className="space-y-2 max-h-[600px] overflow-y-auto">
            {games.map((game) => (
              <Card
                key={game.id}
                className={`cursor-pointer transition-colors hover:bg-muted/50 ${
                  selectedGameId === game.id ? "ring-2 ring-primary" : ""
                }`}
                onClick={() => setSelectedGameId(game.id)}
              >
                <CardContent className="p-4">
                  <div className="flex items-center justify-between mb-2">
                    <div className="text-sm font-medium">
                      {game.awayTeam.abbreviation} @ {game.homeTeam.abbreviation}
                    </div>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleEnhanceGame(game.id);
                      }}
                      disabled={enhancingGames.has(game.id)}
                    >
                      {enhancingGames.has(game.id) ? "..." : <Brain className="h-3 w-3" />}
                    </Button>
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {new Date(game.gameTime).toLocaleDateString()}
                  </div>
                  {game.aiPrediction && (
                    <div className="mt-2">
                      <Badge variant="secondary" className="text-xs">
                        {game.aiPrediction.confidence}% confidence
                      </Badge>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        {/* Intelligence Details */}
        <div className="col-span-8">
          {intelligenceLoading ? (
            <div className="space-y-4">
              <Skeleton className="h-32" />
              <Skeleton className="h-24" />
              <Skeleton className="h-24" />
            </div>
          ) : gameIntelligence ? (
            <IntelligenceDetails intelligence={gameIntelligence} />
          ) : selectedGameId ? (
            <Card>
              <CardContent className="p-6">
                <div className="text-center py-8">
                  <AlertTriangle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="font-semibold mb-2">No Intelligence Data</h3>
                  <p className="text-muted-foreground mb-4">
                    This game hasn't been enhanced yet. Click "Enhance" to generate intelligence.
                  </p>
                  <Button 
                    onClick={() => handleEnhanceGame(selectedGameId)}
                    disabled={enhancingGames.has(selectedGameId)}
                  >
                    <Brain className="h-4 w-4 mr-2" />
                    Enhance This Game
                  </Button>
                </div>
              </CardContent>
            </Card>
          ) : null}
        </div>
      </div>
    </div>
  );
}

interface IntelligenceDetailsProps {
  intelligence: GameIntelligence;
}

function IntelligenceDetails({ intelligence }: IntelligenceDetailsProps) {
  const { game, teams, intelligence: gameIntel, weather, betting, sentiment, injuries } = intelligence;

  // Add safety checks for teams data
  if (!teams || !teams.home || !teams.away) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="text-center py-8">
            <AlertTriangle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="font-semibold mb-2">Missing Team Data</h3>
            <p className="text-muted-foreground">
              Team information is not available for this game.
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Check if we have any intelligence data at all
  const hasIntelligenceData = gameIntel || weather || betting || 
    (sentiment && (sentiment.home || sentiment.away)) ||
    (injuries && (injuries.home || injuries.away));

  if (!hasIntelligenceData) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="text-center py-8">
            <Brain className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="font-semibold mb-2">No Intelligence Data Generated</h3>
            <p className="text-muted-foreground mb-4">
              This game hasn't been analyzed yet. Generate enhanced intelligence to see:
            </p>
            <div className="text-sm text-muted-foreground mb-6 space-y-1">
              <div>• Reddit fan sentiment analysis</div>
              <div>• Weather impact predictions</div>
              <div>• Betting market intelligence</div>
              <div>• AI-powered game insights</div>
              <div>• Injury report analysis</div>
            </div>
            <p className="text-muted-foreground text-sm">
              Use the "Enhance" button in the game list to generate comprehensive analysis.
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Game Header */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>{teams.away.name} @ {teams.home.name}</span>
            <Badge variant="outline">
              {new Date(game.gameTime).toLocaleDateString()}
            </Badge>
          </CardTitle>
          <CardDescription>
            Enhanced Intelligence Analysis
          </CardDescription>
        </CardHeader>
      </Card>

      {/* Sentiment Analysis */}
      {(sentiment?.home || sentiment?.away) && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MessageSquare className="h-5 w-5" />
              Fan Sentiment Analysis
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-6">
              {sentiment?.home && (
                <div className="space-y-3">
                  <h4 className="font-semibold text-sm">{teams.home.name}</h4>
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>Overall Sentiment</span>
                      <Badge variant={sentiment.home.averageSentiment > 0.1 ? "default" : 
                                   sentiment.home.averageSentiment < -0.1 ? "destructive" : "secondary"}>
                        {sentiment.home.averageSentiment > 0.1 ? "Positive" : 
                         sentiment.home.averageSentiment < -0.1 ? "Negative" : "Neutral"}
                      </Badge>
                    </div>
                    <Progress 
                      value={(sentiment.home.averageSentiment + 1) * 50} 
                      className="h-2" 
                    />
                    <div className="text-xs text-muted-foreground">
                      {sentiment.home.totalPosts} posts analyzed
                    </div>
                  </div>
                </div>
              )}
              {sentiment?.away && (
                <div className="space-y-3">
                  <h4 className="font-semibold text-sm">{teams.away.name}</h4>
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>Overall Sentiment</span>
                      <Badge variant={sentiment.away.averageSentiment > 0.1 ? "default" : 
                                   sentiment.away.averageSentiment < -0.1 ? "destructive" : "secondary"}>
                        {sentiment.away.averageSentiment > 0.1 ? "Positive" : 
                         sentiment.away.averageSentiment < -0.1 ? "Negative" : "Neutral"}
                      </Badge>
                    </div>
                    <Progress 
                      value={(sentiment.away.averageSentiment + 1) * 50} 
                      className="h-2" 
                    />
                    <div className="text-xs text-muted-foreground">
                      {sentiment.away.totalPosts} posts analyzed
                    </div>
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Weather Impact */}
      {weather && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CloudRain className="h-5 w-5" />
              Weather Impact
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-3 gap-4">
              <div className="text-center">
                <ThermometerSun className="h-8 w-8 mx-auto mb-2 text-orange-500" />
                <div className="text-2xl font-bold">{weather.temperature}°F</div>
                <div className="text-sm text-muted-foreground">Temperature</div>
              </div>
              <div className="text-center">
                <CloudRain className="h-8 w-8 mx-auto mb-2 text-blue-500" />
                <div className="text-2xl font-bold">{weather.precipitationChance}%</div>
                <div className="text-sm text-muted-foreground">Rain Chance</div>
              </div>
              <div className="text-center">
                <div className="h-8 w-8 mx-auto mb-2 rounded-full bg-gray-200 flex items-center justify-center">
                  💨
                </div>
                <div className="text-2xl font-bold">{weather.windSpeed} mph</div>
                <div className="text-sm text-muted-foreground">Wind Speed</div>
              </div>
            </div>
            {weather.impact && (
              <Alert className="mt-4">
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>{weather.impact}</AlertDescription>
              </Alert>
            )}
          </CardContent>
        </Card>
      )}

      {/* Betting Intelligence */}
      {betting && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <DollarSign className="h-5 w-5" />
              Betting Intelligence
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-6">
              <div className="space-y-3">
                <h4 className="font-semibold">Line Movement</h4>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-sm">Opening Line:</span>
                    <span className="font-medium">{betting.openingSpread}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm">Current Line:</span>
                    <span className="font-medium">{betting.currentSpread}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm">Movement:</span>
                    <Badge variant={betting.lineMovement > 0 ? "default" : 
                                  betting.lineMovement < 0 ? "destructive" : "secondary"}>
                      {betting.lineMovement > 0 ? "+" : ""}{betting.lineMovement}
                    </Badge>
                  </div>
                </div>
              </div>
              <div className="space-y-3">
                <h4 className="font-semibold">Public Betting</h4>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-sm">Public %:</span>
                    <span className="font-medium">{betting.publicBettingPercentage}%</span>
                  </div>
                  <Progress value={betting.publicBettingPercentage} className="h-2" />
                  {betting.valuePlay && (
                    <Badge variant="default" className="text-xs">
                      Value Play Detected
                    </Badge>
                  )}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Key Intelligence Factors */}
      {gameIntel && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Target className="h-5 w-5" />
              Key Intelligence Factors
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-6">
              <div className="space-y-4">
                <div>
                  <h4 className="font-semibold text-sm mb-2">Coaching Edge</h4>
                  <p className="text-sm text-muted-foreground">{gameIntel.coachingEdge}</p>
                </div>
                <div>
                  <h4 className="font-semibold text-sm mb-2">Value Play</h4>
                  <p className="text-sm text-muted-foreground">{gameIntel.valuePlay}</p>
                </div>
              </div>
              <div className="space-y-4">
                <div>
                  <h4 className="font-semibold text-sm mb-2">Risk Factors</h4>
                  <div className="space-y-1">
                    {gameIntel.riskFactors.map((risk: string, index: number) => (
                      <Badge key={index} variant="outline" className="text-xs mr-1">
                        {risk}
                      </Badge>
                    ))}
                  </div>
                </div>
                <div>
                  <h4 className="font-semibold text-sm mb-2">Confidence Factors</h4>
                  <div className="space-y-1">
                    {gameIntel.confidenceFactors.map((factor: string, index: number) => (
                      <Badge key={index} variant="default" className="text-xs mr-1">
                        {factor}
                      </Badge>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Injury Reports */}
      {(injuries?.home || injuries?.away) && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              Injury Impact
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-6">
              {injuries?.home && (
                <div>
                  <h4 className="font-semibold text-sm mb-3">{teams.home.name}</h4>
                  <div className="space-y-2">
                    {injuries.home.keyInjuries?.map((injury: any, index: number) => (
                      <div key={index} className="flex justify-between items-center">
                        <span className="text-sm">{injury.player}</span>
                        <Badge 
                          variant={injury.status === 'OUT' ? 'destructive' : 
                                 injury.status === 'DOUBTFUL' ? 'secondary' : 'outline'}
                          className="text-xs"
                        >
                          {injury.status}
                        </Badge>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              {injuries?.away && (
                <div>
                  <h4 className="font-semibold text-sm mb-3">{teams.away.name}</h4>
                  <div className="space-y-2">
                    {injuries.away.keyInjuries?.map((injury: any, index: number) => (
                      <div key={index} className="flex justify-between items-center">
                        <span className="text-sm">{injury.player}</span>
                        <Badge 
                          variant={injury.status === 'OUT' ? 'destructive' : 
                                 injury.status === 'DOUBTFUL' ? 'secondary' : 'outline'}
                          className="text-xs"
                        >
                          {injury.status}
                        </Badge>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
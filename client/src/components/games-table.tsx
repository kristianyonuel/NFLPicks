import { useState } from "react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Eye, Download, ArrowUpDown } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import type { GameWithDetails, ExpertAdvice } from "@shared/schema";

interface GamesTableProps {
  games: GameWithDetails[];
}

export function GamesTable({ games }: GamesTableProps) {
  const [selectedGameId, setSelectedGameId] = useState<string | null>(null);

  const { data: expertAdvice = [] } = useQuery<ExpertAdvice[]>({
    queryKey: ["/api/advice", selectedGameId],
    enabled: !!selectedGameId,
  });

  const getConfidenceClass = (confidence: number) => {
    if (confidence >= 70) return "probability-high";
    if (confidence >= 60) return "probability-medium";
    return "probability-low";
  };

  const formatSpread = (game: GameWithDetails) => {
    if (!game.odds?.spreadHome) return "N/A";
    const spread = parseFloat(game.odds.spreadHome);
    return `${game.homeTeam.abbreviation} ${spread > 0 ? '+' : ''}${spread}`;
  };

  const handleExport = () => {
    const csvContent = [
      "Game,Time,Spread,Total,AI Prediction,Confidence",
      ...games.map(game => [
        `${game.awayTeam.abbreviation} @ ${game.homeTeam.abbreviation}`,
        new Date(game.gameTime).toLocaleString(),
        formatSpread(game),
        game.odds?.totalPoints || "N/A",
        game.aiPrediction?.recommendedBet || "N/A",
        game.aiPrediction ? `${Number(game.aiPrediction.confidence).toFixed(0)}%` : "N/A"
      ].join(","))
    ].join("\n");

    const blob = new Blob([csvContent], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "nfl-games-analysis.csv";
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <Card className="bg-card border-border overflow-hidden">
      <CardHeader className="px-6 py-4 border-b border-border">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold text-foreground" data-testid="text-table-title">
            All Week Games
          </h3>
          <div className="flex items-center space-x-2">
            <Button 
              size="sm" 
              variant="outline" 
              onClick={handleExport}
              className="bg-primary text-primary-foreground hover:bg-primary/90"
              data-testid="button-export"
            >
              <Download className="mr-2 h-4 w-4" />
              Export
            </Button>
            <Button 
              size="sm" 
              variant="outline"
              className="bg-secondary text-secondary-foreground hover:bg-secondary/90"
              data-testid="button-sort"
            >
              <ArrowUpDown className="mr-2 h-4 w-4" />
              Sort
            </Button>
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="p-0">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader className="bg-muted">
              <TableRow>
                <TableHead className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  Game
                </TableHead>
                <TableHead className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  Time
                </TableHead>
                <TableHead className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  Spread
                </TableHead>
                <TableHead className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  Total
                </TableHead>
                <TableHead className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  AI Prediction
                </TableHead>
                <TableHead className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  Confidence
                </TableHead>
                <TableHead className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  Expert Tips
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody className="divide-y divide-border">
              {games.map((game) => (
                <TableRow 
                  key={game.id} 
                  className="hover:bg-muted/50 transition-colors"
                  data-testid={`row-game-${game.id}`}
                >
                  <TableCell className="px-6 py-4">
                    <div className="flex items-center space-x-3">
                      <div className="flex items-center space-x-2">
                        <div 
                          className="w-8 h-8 bg-secondary rounded-full flex items-center justify-center text-xs font-bold"
                          style={{ 
                            backgroundColor: game.awayTeam.primaryColor || 'hsl(215, 25%, 27%)',
                            color: game.awayTeam.secondaryColor || 'var(--foreground)'
                          }}
                          data-testid={`logo-away-${game.id}`}
                        >
                          {game.awayTeam.abbreviation}
                        </div>
                        <span className="text-sm text-muted-foreground">@</span>
                        <div 
                          className="w-8 h-8 bg-secondary rounded-full flex items-center justify-center text-xs font-bold"
                          style={{ 
                            backgroundColor: game.homeTeam.primaryColor || 'hsl(215, 25%, 27%)',
                            color: game.homeTeam.secondaryColor || 'var(--foreground)'
                          }}
                          data-testid={`logo-home-${game.id}`}
                        >
                          {game.homeTeam.abbreviation}
                        </div>
                      </div>
                      <div>
                        <p className="text-sm font-medium text-foreground" data-testid={`text-matchup-${game.id}`}>
                          {game.awayTeam.name} @ {game.homeTeam.name}
                        </p>
                        <p className="text-xs text-muted-foreground" data-testid={`text-records-${game.id}`}>
                          {game.awayTeamStats ? `${game.awayTeamStats.wins}-${game.awayTeamStats.losses}` : 'N/A'} @ {game.homeTeamStats ? `${game.homeTeamStats.wins}-${game.homeTeamStats.losses}` : 'N/A'}
                        </p>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell className="px-6 py-4 text-sm text-muted-foreground" data-testid={`text-time-${game.id}`}>
                    {new Date(game.gameTime).toLocaleDateString('en-US', { 
                      weekday: 'short', 
                      hour: 'numeric', 
                      minute: '2-digit',
                      hour12: true 
                    })}
                  </TableCell>
                  <TableCell className="px-6 py-4">
                    <span className="text-sm font-medium text-foreground" data-testid={`text-spread-${game.id}`}>
                      {formatSpread(game)}
                    </span>
                    <span className="text-xs text-muted-foreground block" data-testid={`text-spread-odds-${game.id}`}>
                      {game.odds?.spreadOdds || -110}
                    </span>
                  </TableCell>
                  <TableCell className="px-6 py-4">
                    <span className="text-sm font-medium text-foreground" data-testid={`text-total-${game.id}`}>
                      {game.odds?.totalPoints || "N/A"}
                    </span>
                    <span className="text-xs text-muted-foreground block" data-testid={`text-total-odds-${game.id}`}>
                      {game.odds?.totalOdds || -110}
                    </span>
                  </TableCell>
                  <TableCell className="px-6 py-4">
                    <span className="text-sm font-medium text-chart-1" data-testid={`text-ai-pick-${game.id}`}>
                      {game.aiPrediction?.recommendedBet || "No prediction"}
                    </span>
                  </TableCell>
                  <TableCell className="px-6 py-4">
                    {game.aiPrediction && (
                      <Badge 
                        className={`${getConfidenceClass(Number(game.aiPrediction.confidence))} text-white text-xs font-medium`}
                        data-testid={`badge-confidence-${game.id}`}
                      >
                        {Number(game.aiPrediction.confidence).toFixed(0)}%
                      </Badge>
                    )}
                  </TableCell>
                  <TableCell className="px-6 py-4">
                    <Dialog>
                      <DialogTrigger asChild>
                        <Button 
                          variant="ghost" 
                          size="sm"
                          className="text-primary hover:text-primary/80"
                          onClick={() => setSelectedGameId(game.id)}
                          data-testid={`button-view-tips-${game.id}`}
                        >
                          <Eye className="mr-1 h-4 w-4" />
                          View Tips
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="bg-card border-border">
                        <DialogHeader>
                          <DialogTitle className="text-foreground">
                            Expert Analysis: {game.awayTeam.abbreviation} @ {game.homeTeam.abbreviation}
                          </DialogTitle>
                        </DialogHeader>
                        <div className="space-y-4 max-h-96 overflow-y-auto">
                          {expertAdvice.length > 0 ? expertAdvice.map((advice, index) => (
                            <div key={advice.id} className="border border-border rounded-lg p-3">
                              <div className="flex items-center justify-between mb-2">
                                <span className="text-xs font-medium text-primary" data-testid={`text-advice-source-${index}`}>
                                  {advice.source}
                                </span>
                                <span className="text-xs text-muted-foreground">
                                  {new Date(advice.scrapedAt).toLocaleTimeString()}
                                </span>
                              </div>
                              <p className="text-sm text-muted-foreground mb-2" data-testid={`text-advice-content-${index}`}>
                                {advice.content}
                              </p>
                              {advice.recommendation && (
                                <p className="text-sm font-medium text-chart-1" data-testid={`text-advice-recommendation-${index}`}>
                                  Recommendation: {advice.recommendation}
                                </p>
                              )}
                            </div>
                          )) : (
                            <p className="text-sm text-muted-foreground text-center py-4">
                              No expert advice available for this game yet.
                            </p>
                          )}
                        </div>
                      </DialogContent>
                    </Dialog>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
}

import { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { Sidebar } from "@/components/sidebar";
import { SummaryCards } from "@/components/summary-cards";
import { GameCard } from "@/components/game-card";
import { GamesTable } from "@/components/games-table";
import { ExpertAnalysis } from "@/components/expert-analysis";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { Search, RotateCcw } from "lucide-react";
import type { GameWithDetails, WeekSummary } from "@shared/schema";

// Calculate current NFL week based on current date
function getCurrentNFLWeek(): { week: number; season: number } {
  const now = new Date();
  
  // NFL season dates - Week 1 typically starts on a Thursday
  // NFL weeks run Tuesday to Monday (games Thu/Sun/Mon, new week starts Tuesday)
  const season2024Start = new Date('2024-09-05'); // Week 1 started September 5, 2024 (Thursday)
  const season2025Start = new Date('2025-09-04'); // Estimated Week 1 start for 2025
  
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
  
  // Calculate days since season start
  const daysSinceStart = Math.floor((now.getTime() - seasonStart.getTime()) / (24 * 60 * 60 * 1000));
  
  // NFL weeks: Thursday is day 0, Friday is day 1, ... Monday is day 4, Tuesday starts next week
  // Adjust for the fact that weeks start on Tuesday for scheduling purposes
  const weeksSinceStart = Math.floor(daysSinceStart / 7);
  let week = weeksSinceStart + 1;
  
  // Fine-tune based on day of week
  const dayOfWeek = now.getDay(); // 0=Sunday, 1=Monday, 2=Tuesday, etc.
  
  // If it's Tuesday (2) or Wednesday (3) and we're more than 3 days into a week period,
  // we should be in the next week
  if ((dayOfWeek === 2 || dayOfWeek === 3) && (daysSinceStart % 7) >= 4) {
    week += 1;
  }
  
  // NFL has 18 weeks in regular season, then playoffs
  week = Math.min(Math.max(week, 1), 18);
  
  return { week, season };
}

export default function Dashboard() {
  const currentNFL = getCurrentNFLWeek();
  const [selectedWeek, setSelectedWeek] = useState(currentNFL.week);
  const [selectedSeason] = useState(currentNFL.season);
  const [searchQuery, setSearchQuery] = useState("");
  const [filters, setFilters] = useState({
    highProbability: false,
    divisional: false,
    primeTime: false,
    playoffImplications: false,
  });
  const { toast } = useToast();

  // Fetch all games data without backend filters (we'll filter on frontend)
  const { data: allGames = [], isLoading: gamesLoading, refetch: refetchGames } = useQuery<GameWithDetails[]>({
    queryKey: ["/api/games", selectedWeek, selectedSeason],
    enabled: true,
  });

  // Fetch week summary
  const { data: summary, isLoading: summaryLoading } = useQuery<WeekSummary>({
    queryKey: ["/api/summary", selectedWeek, selectedSeason],
    enabled: true,
  });

  // Apply both search and filters on the frontend
  const filteredGames = useMemo(() => {
    let games = allGames;
    
    // Apply search filter first
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      games = games.filter(game => 
        game.homeTeam.name.toLowerCase().includes(query) ||
        game.awayTeam.name.toLowerCase().includes(query) ||
        game.homeTeam.abbreviation.toLowerCase().includes(query) ||
        game.awayTeam.abbreviation.toLowerCase().includes(query)
      );
    }
    
    // Apply other filters
    if (filters.highProbability) {
      games = games.filter(game => 
        game.aiPrediction && Number(game.aiPrediction.confidence) >= 70
      );
    }
    
    if (filters.divisional) {
      games = games.filter(game => game.isDivisional);
    }
    
    if (filters.primeTime) {
      games = games.filter(game => game.isPrimeTime);
    }
    
    if (filters.playoffImplications) {
      games = games.filter(game => game.hasPlayoffImplications);
    }
    
    return games;
  }, [allGames, searchQuery, filters]);

  // Get featured games (first 2 games)
  const featuredGames = filteredGames.slice(0, 2);

  // Handle refresh data
  const handleRefresh = async () => {
    try {
      const refreshButton = document.querySelector('[data-testid="button-refresh"]') as HTMLButtonElement;
      if (refreshButton) {
        const icon = refreshButton.querySelector('svg');
        if (icon) {
          icon.classList.add('animate-spin');
          setTimeout(() => icon.classList.remove('animate-spin'), 2000);
        }
      }

      await apiRequest("POST", `/api/refresh/${selectedWeek}/${selectedSeason}`);
      
      // Refetch all data
      refetchGames();
      
      toast({
        title: "Data Updated",
        description: "Successfully refreshed games, odds, and AI analysis",
      });
    } catch (error) {
      toast({
        title: "Update Failed",
        description: "Failed to refresh data. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleFilterChange = (filterKey: keyof typeof filters) => {
    setFilters(prev => ({
      ...prev,
      [filterKey]: !prev[filterKey]
    }));
  };

  if (gamesLoading || summaryLoading) {
    return (
      <div className="flex h-screen overflow-hidden bg-background">
        <div className="w-80 bg-card border-r border-border p-6">
          <Skeleton className="h-20 w-full mb-6" />
          <Skeleton className="h-40 w-full mb-6" />
          <Skeleton className="h-32 w-full" />
        </div>
        <div className="flex-1 p-6">
          <Skeleton className="h-16 w-full mb-8" />
          <div className="grid grid-cols-4 gap-6 mb-8">
            {Array(4).fill(0).map((_, i) => (
              <Skeleton key={i} className="h-32 w-full" />
            ))}
          </div>
          <div className="grid grid-cols-2 gap-6">
            <Skeleton className="h-64 w-full" />
            <Skeleton className="h-64 w-full" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen overflow-hidden bg-background text-foreground">
      <Sidebar
        selectedWeek={selectedWeek}
        onWeekChange={setSelectedWeek}
        summary={summary}
        filters={filters}
        onFilterChange={handleFilterChange}
        data-testid="sidebar-navigation"
      />

      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <header className="bg-card border-b border-border px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <h2 className="text-2xl font-bold text-foreground" data-testid="text-week-title">
                Week {selectedWeek} Analysis
              </h2>
              <Badge variant="default" className="bg-primary text-primary-foreground" data-testid="badge-game-count">
                {filteredGames.length} Games
              </Badge>
            </div>
            <div className="flex items-center space-x-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                <Input
                  type="text"
                  placeholder="Search teams or games..."
                  className="pl-10 w-64 bg-input border-border text-foreground"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  data-testid="input-search"
                />
              </div>
              <Button 
                onClick={handleRefresh}
                className="bg-primary text-primary-foreground hover:bg-primary/90"
                data-testid="button-refresh"
              >
                <RotateCcw className="mr-2 h-4 w-4" />
                Refresh Data
              </Button>
            </div>
          </div>
        </header>

        {/* Main Content */}
        <main className="flex-1 overflow-auto p-6">
          {/* Summary Cards */}
          <SummaryCards summary={summary} data-testid="summary-cards" />

          {/* Featured Games */}
          {featuredGames.length > 0 && (
            <div className="grid grid-cols-2 gap-6 mb-8">
              {featuredGames.map((game, index) => (
                <GameCard 
                  key={game.id} 
                  game={game} 
                  featured={true}
                  data-testid={`game-card-featured-${index}`}
                />
              ))}
            </div>
          )}

          {/* Games Table */}
          <GamesTable games={filteredGames} data-testid="games-table" />

          {/* Expert Analysis */}
          <div className="mt-8">
            <ExpertAnalysis games={filteredGames} data-testid="expert-analysis" />
          </div>

          {/* Empty State */}
          {filteredGames.length === 0 && !gamesLoading && (
            <div className="text-center py-12" data-testid="empty-state">
              <h3 className="text-lg font-semibold text-muted-foreground mb-2">
                No games found
              </h3>
              <p className="text-sm text-muted-foreground">
                Try adjusting your filters or search query
              </p>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}

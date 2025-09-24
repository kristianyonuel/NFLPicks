import { Card } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Volleyball } from "lucide-react";
import type { WeekSummary } from "@shared/schema";

interface SidebarProps {
  selectedWeek: number;
  onWeekChange: (week: number) => void;
  summary?: WeekSummary;
  filters: {
    highProbability: boolean;
    divisional: boolean;
    primeTime: boolean;
    playoffImplications: boolean;
  };
  onFilterChange: (filterKey: keyof SidebarProps['filters']) => void;
}

export function Sidebar({ selectedWeek, onWeekChange, summary, filters, onFilterChange }: SidebarProps) {
  const weeks = Array.from({ length: 18 }, (_, i) => i + 1);

  return (
    <div className="w-80 bg-card border-r border-border flex flex-col">
      {/* Header */}
      <div className="p-6 border-b border-border">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 bg-primary rounded-lg flex items-center justify-center">
            <Volleyball className="text-primary-foreground h-5 w-5" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-foreground" data-testid="text-app-title">
              NFL Analytics Pro
            </h1>
            <p className="text-sm text-muted-foreground">
              Game Analysis & Predictions
            </p>
          </div>
        </div>
      </div>

      {/* Week Selector */}
      <div className="p-6 border-b border-border">
        <Label className="block text-sm font-medium text-foreground mb-3">
          Select Week
        </Label>
        <Select 
          value={selectedWeek.toString()} 
          onValueChange={(value) => onWeekChange(parseInt(value))}
        >
          <SelectTrigger className="w-full bg-input border-border text-foreground" data-testid="select-week">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {weeks.map(week => (
              <SelectItem key={week} value={week.toString()}>
                Week {week} {week === selectedWeek ? "(Current)" : ""}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Quick Stats */}
      {summary && (
        <div className="p-6 border-b border-border">
          <h3 className="text-sm font-medium text-foreground mb-4" data-testid="text-overview-title">
            Week {summary.week} Overview
          </h3>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Total Games</span>
              <span className="text-sm font-medium text-foreground" data-testid="text-total-games">
                {summary.totalGames}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Games Analyzed</span>
              <span className="text-sm font-medium text-foreground" data-testid="text-analyzed-games">
                {summary.analyzedGames}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">High Confidence</span>
              <span className="text-sm font-medium text-chart-1" data-testid="text-high-confidence">
                {summary.highConfidence}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Upset Alerts</span>
              <span className="text-sm font-medium text-chart-2" data-testid="text-upset-alerts">
                {summary.upsetAlerts}
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Filter Options */}
      <div className="p-6 flex-1">
        <h3 className="text-sm font-medium text-foreground mb-4">Filters</h3>
        <div className="space-y-4">
          <div className="flex items-center space-x-2">
            <Checkbox
              id="high-probability"
              checked={filters.highProbability}
              onCheckedChange={() => onFilterChange('highProbability')}
              className="border-border bg-input"
              data-testid="checkbox-high-probability"
            />
            <Label htmlFor="high-probability" className="text-sm text-muted-foreground cursor-pointer">
              High Probability (&gt;70%)
            </Label>
          </div>
          <div className="flex items-center space-x-2">
            <Checkbox
              id="divisional"
              checked={filters.divisional}
              onCheckedChange={() => onFilterChange('divisional')}
              className="border-border bg-input"
              data-testid="checkbox-divisional"
            />
            <Label htmlFor="divisional" className="text-sm text-muted-foreground cursor-pointer">
              Divisional Games
            </Label>
          </div>
          <div className="flex items-center space-x-2">
            <Checkbox
              id="prime-time"
              checked={filters.primeTime}
              onCheckedChange={() => onFilterChange('primeTime')}
              className="border-border bg-input"
              data-testid="checkbox-prime-time"
            />
            <Label htmlFor="prime-time" className="text-sm text-muted-foreground cursor-pointer">
              Prime Time Games
            </Label>
          </div>
          <div className="flex items-center space-x-2">
            <Checkbox
              id="playoff-implications"
              checked={filters.playoffImplications}
              onCheckedChange={() => onFilterChange('playoffImplications')}
              className="border-border bg-input"
              data-testid="checkbox-playoff-implications"
            />
            <Label htmlFor="playoff-implications" className="text-sm text-muted-foreground cursor-pointer">
              Playoff Implications
            </Label>
          </div>
        </div>
      </div>
    </div>
  );
}

import { Card, CardContent } from "@/components/ui/card";
import { TrendingUp, Trophy, AlertTriangle, DollarSign } from "lucide-react";
import type { WeekSummary } from "@shared/schema";

interface SummaryCardsProps {
  summary?: WeekSummary;
}

export function SummaryCards({ summary }: SummaryCardsProps) {
  if (!summary) {
    return (
      <div className="grid grid-cols-4 gap-6 mb-8">
        {Array(4).fill(0).map((_, i) => (
          <Card key={i} className="bg-card border-border">
            <CardContent className="p-6">
              <div className="animate-pulse">
                <div className="h-12 w-12 bg-muted rounded-lg mb-4"></div>
                <div className="h-8 w-16 bg-muted rounded mb-1"></div>
                <div className="h-4 w-24 bg-muted rounded"></div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  const cards = [
    {
      icon: TrendingUp,
      value: `${summary.avgConfidence.toFixed(1)}%`,
      label: "Avg Win Probability",
      trend: "+5.2%",
      trendColor: "text-chart-1",
      iconBg: "bg-primary/10",
      iconColor: "text-primary",
    },
    {
      icon: Trophy,
      value: summary.highConfidence.toString(),
      label: "High Confidence Picks",
      trend: "Active",
      trendColor: "text-chart-1",
      iconBg: "bg-chart-1/10",
      iconColor: "text-chart-1",
    },
    {
      icon: AlertTriangle,
      value: summary.upsetAlerts.toString(),
      label: "Potential Upsets",
      trend: "Alert",
      trendColor: "text-chart-2",
      iconBg: "bg-chart-2/10",
      iconColor: "text-chart-2",
    },
    {
      icon: DollarSign,
      value: summary.avgLineMovement.toString(),
      label: "Avg Line Movement",
      trend: "+12.8%",
      trendColor: "text-chart-1",
      iconBg: "bg-chart-4/10",
      iconColor: "text-chart-4",
    },
  ];

  return (
    <div className="grid grid-cols-4 gap-6 mb-8">
      {cards.map((card, index) => (
        <Card key={index} className="bg-card border-border" data-testid={`card-summary-${index}`}>
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-4">
              <div className={`w-12 h-12 ${card.iconBg} rounded-lg flex items-center justify-center`}>
                <card.icon className={`${card.iconColor} h-6 w-6`} />
              </div>
              <span className={`text-sm ${card.trendColor} font-medium`}>
                {card.trend}
              </span>
            </div>
            <h3 className="text-2xl font-bold text-foreground mb-1" data-testid={`text-card-value-${index}`}>
              {card.value}
            </h3>
            <p className="text-sm text-muted-foreground" data-testid={`text-card-label-${index}`}>
              {card.label}
            </p>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

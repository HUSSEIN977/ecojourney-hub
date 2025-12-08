import { Car, Utensils, Zap, Award } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

interface QuickStatsCardProps {
  transportEmission: number;
  cookingEmission: number;
  energyEmission: number;
  totalPoints: number;
}

export function QuickStatsCard({
  transportEmission,
  cookingEmission,
  energyEmission,
  totalPoints,
}: QuickStatsCardProps) {
  const stats = [
    { icon: Car, label: "Transport", value: `${transportEmission.toFixed(1)}kg`, color: "text-eco-sky" },
    { icon: Utensils, label: "Cooking", value: `${cookingEmission.toFixed(1)}kg`, color: "text-eco-coral" },
    { icon: Zap, label: "Energy", value: `${energyEmission.toFixed(1)}kg`, color: "text-eco-sun" },
    { icon: Award, label: "Points", value: totalPoints.toString(), color: "text-secondary" },
  ];

  return (
    <div className="grid grid-cols-4 gap-2">
      {stats.map((stat) => (
        <Card key={stat.label} className="border-border/30">
          <CardContent className="p-3 text-center">
            <stat.icon className={`h-5 w-5 mx-auto mb-1 ${stat.color}`} />
            <p className="text-lg font-bold">{stat.value}</p>
            <p className="text-xs text-muted-foreground">{stat.label}</p>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

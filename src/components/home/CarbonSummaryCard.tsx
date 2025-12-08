import { Leaf, TrendingDown, TrendingUp } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

interface CarbonSummaryCardProps {
  todayEmission: number;
  yesterdayEmission: number;
}

export function CarbonSummaryCard({ todayEmission, yesterdayEmission }: CarbonSummaryCardProps) {
  const difference = yesterdayEmission - todayEmission;
  const percentChange = yesterdayEmission > 0 
    ? Math.abs((difference / yesterdayEmission) * 100).toFixed(1)
    : 0;
  const isImprovement = difference > 0;

  return (
    <Card className="gradient-forest text-primary-foreground overflow-hidden relative">
      <div className="absolute top-0 right-0 w-32 h-32 bg-accent/20 rounded-full -translate-y-1/2 translate-x-1/2" />
      <div className="absolute bottom-0 left-0 w-24 h-24 bg-accent/10 rounded-full translate-y-1/2 -translate-x-1/2" />
      
      <CardContent className="p-6 relative">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-primary-foreground/80 text-sm font-medium mb-1">
              Today's Carbon Footprint
            </p>
            <div className="flex items-baseline gap-2">
              <span className="text-4xl font-bold">{todayEmission.toFixed(1)}</span>
              <span className="text-lg text-primary-foreground/80">kg CO₂</span>
            </div>
          </div>
          <div className="h-12 w-12 rounded-2xl bg-primary-foreground/20 flex items-center justify-center">
            <Leaf className="h-6 w-6" />
          </div>
        </div>
        
        <div className="mt-4 flex items-center gap-2">
          {isImprovement ? (
            <TrendingDown className="h-4 w-4 text-accent" />
          ) : (
            <TrendingUp className="h-4 w-4 text-eco-coral" />
          )}
          <span className={`text-sm font-medium ${isImprovement ? "text-accent" : "text-eco-coral"}`}>
            {percentChange}% {isImprovement ? "less" : "more"} than yesterday
          </span>
        </div>
      </CardContent>
    </Card>
  );
}

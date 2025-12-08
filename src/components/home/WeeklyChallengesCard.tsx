import { Trophy, ChevronRight } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Link } from "react-router-dom";

interface Challenge {
  id: string;
  title: string;
  progress: number;
  target: number;
  completed: boolean;
}

interface WeeklyChallengesCardProps {
  challenges: Challenge[];
  totalCompleted: number;
  totalChallenges: number;
}

export function WeeklyChallengesCard({ 
  challenges, 
  totalCompleted, 
  totalChallenges 
}: WeeklyChallengesCardProps) {
  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-xl gradient-sunrise flex items-center justify-center">
              <Trophy className="h-4 w-4 text-secondary-foreground" />
            </div>
            <CardTitle className="text-base">Weekly Challenges</CardTitle>
          </div>
          <Link to="/rewards" className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors">
            View all
            <ChevronRight className="h-4 w-4" />
          </Link>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center gap-3">
          <div className="flex-1">
            <Progress value={(totalCompleted / totalChallenges) * 100} className="h-2" />
          </div>
          <span className="text-sm font-semibold text-primary">
            {totalCompleted}/{totalChallenges}
          </span>
        </div>
        
        <div className="space-y-3">
          {challenges.slice(0, 3).map((challenge) => (
            <div key={challenge.id} className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className={`h-2 w-2 rounded-full ${challenge.completed ? "bg-accent" : "bg-muted"}`} />
                <span className={`text-sm ${challenge.completed ? "text-muted-foreground line-through" : ""}`}>
                  {challenge.title}
                </span>
              </div>
              <span className="text-xs text-muted-foreground">
                {challenge.progress}/{challenge.target}
              </span>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

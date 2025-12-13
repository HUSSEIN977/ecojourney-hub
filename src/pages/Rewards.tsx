import { useState, useEffect } from "react";
import { AppLayout } from "@/components/layout/AppLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Trophy, Star, Award, Target, Leaf, Car, Flame, Zap, CheckCircle2, Lock } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";

interface Challenge {
  id: string;
  title: string;
  description: string;
  category: string;
  target_value: number;
  points_reward: number;
  progress: number;
  completed: boolean;
}

interface Achievement {
  id: string;
  badge_name: string;
  badge_description: string | null;
  earned_at: string;
}

const BADGE_DEFINITIONS = [
  { name: "First Step", description: "Log your first activity", icon: Leaf, color: "bg-primary" },
  { name: "Week Warrior", description: "Log activities for 7 consecutive days", icon: Target, color: "bg-accent" },
  { name: "Eco Champion", description: "Complete 10 challenges", icon: Trophy, color: "bg-secondary" },
  { name: "Carbon Cutter", description: "Reduce emissions by 50% in a week", icon: Star, color: "bg-primary" },
  { name: "Green Commuter", description: "Use eco transport 20 times", icon: Car, color: "bg-accent" },
  { name: "Energy Saver", description: "Keep energy use under 5kg for a week", icon: Zap, color: "bg-secondary" },
];

export default function Rewards() {
  const { user } = useAuth();
  const [challenges, setChallenges] = useState<Challenge[]>([]);
  const [achievements, setAchievements] = useState<Achievement[]>([]);
  const [totalPoints, setTotalPoints] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      if (!user) return;

      const [challengesRes, userChallengesRes, achievementsRes, profileRes] = await Promise.all([
        supabase.from("challenges").select("*").eq("is_active", true),
        supabase.from("user_challenges").select("*").eq("user_id", user.id),
        supabase.from("achievements").select("*").eq("user_id", user.id).order("earned_at", { ascending: false }),
        supabase.from("profiles").select("total_points").eq("user_id", user.id).maybeSingle(),
      ]);

      if (challengesRes.data) {
        const userProgressMap = new Map(
          userChallengesRes.data?.map(uc => [uc.challenge_id, { progress: uc.progress, completed: uc.completed }]) || []
        );

        setChallenges(challengesRes.data.map(c => {
          const userProgress = userProgressMap.get(c.id);
          return {
            ...c,
            progress: userProgress?.progress || 0,
            completed: userProgress?.completed || false,
          };
        }));
      }

      setAchievements(achievementsRes.data || []);
      setTotalPoints(profileRes.data?.total_points || 0);
      setLoading(false);
    };

    fetchData();
  }, [user]);

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case "transport": return <Car className="h-4 w-4" />;
      case "food": return <Flame className="h-4 w-4" />;
      case "energy": return <Zap className="h-4 w-4" />;
      default: return <Leaf className="h-4 w-4" />;
    }
  };

  const getCategoryColor = (category: string) => {
    switch (category) {
      case "transport": return "bg-primary/10 text-primary";
      case "food": return "bg-accent/10 text-accent";
      case "energy": return "bg-secondary/10 text-secondary-foreground";
      default: return "bg-muted text-muted-foreground";
    }
  };

  const earnedBadgeNames = new Set(achievements.map(a => a.badge_name));

  if (loading) {
    return (
      <AppLayout>
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full" />
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="space-y-6">
        {/* Header with Points */}
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold">Rewards</h1>
          <div className="flex items-center gap-2 bg-secondary/20 px-4 py-2 rounded-full">
            <Star className="h-5 w-5 text-secondary" />
            <span className="font-bold">{totalPoints} pts</span>
          </div>
        </div>

        {/* Weekly Challenges */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <div className="h-8 w-8 rounded-xl gradient-sunrise flex items-center justify-center">
                <Target className="h-4 w-4 text-secondary-foreground" />
              </div>
              Weekly Challenges
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {challenges.length > 0 ? (
              challenges.map((challenge) => (
                <div 
                  key={challenge.id} 
                  className={`p-4 rounded-xl border ${challenge.completed ? "bg-accent/5 border-accent/20" : "bg-card border-border"}`}
                >
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className={getCategoryColor(challenge.category)}>
                        {getCategoryIcon(challenge.category)}
                        <span className="ml-1 capitalize">{challenge.category}</span>
                      </Badge>
                      {challenge.completed && (
                        <CheckCircle2 className="h-5 w-5 text-accent" />
                      )}
                    </div>
                    <span className="text-sm font-semibold text-primary">+{challenge.points_reward} pts</span>
                  </div>
                  <h3 className="font-semibold mb-1">{challenge.title}</h3>
                  <p className="text-sm text-muted-foreground mb-3">{challenge.description}</p>
                  <div className="flex items-center gap-3">
                    <Progress 
                      value={(challenge.progress / challenge.target_value) * 100} 
                      className="flex-1 h-2"
                    />
                    <span className="text-sm font-medium">
                      {challenge.progress}/{challenge.target_value}
                    </span>
                  </div>
                </div>
              ))
            ) : (
              <p className="text-muted-foreground text-center py-4">No active challenges</p>
            )}
          </CardContent>
        </Card>

        {/* Achievements */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <div className="h-8 w-8 rounded-xl bg-primary/10 flex items-center justify-center">
                <Trophy className="h-4 w-4 text-primary" />
              </div>
              Achievements
              <Badge variant="secondary" className="ml-auto">
                {achievements.length}/{BADGE_DEFINITIONS.length}
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-3 gap-3">
              {BADGE_DEFINITIONS.map((badge) => {
                const isEarned = earnedBadgeNames.has(badge.name);
                const Icon = badge.icon;
                
                return (
                  <div 
                    key={badge.name}
                    className={`flex flex-col items-center p-3 rounded-xl text-center transition-all ${
                      isEarned 
                        ? "bg-gradient-to-br from-primary/10 to-accent/10 border border-primary/20" 
                        : "bg-muted/50 opacity-50"
                    }`}
                  >
                    <div className={`h-12 w-12 rounded-full flex items-center justify-center mb-2 ${
                      isEarned ? badge.color : "bg-muted"
                    }`}>
                      {isEarned ? (
                        <Icon className="h-6 w-6 text-primary-foreground" />
                      ) : (
                        <Lock className="h-5 w-5 text-muted-foreground" />
                      )}
                    </div>
                    <span className="text-xs font-medium">{badge.name}</span>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>

        {/* Recent Achievements */}
        {achievements.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <Award className="h-5 w-5 text-accent" />
                Recently Earned
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {achievements.slice(0, 5).map((achievement) => (
                <div key={achievement.id} className="flex items-center gap-3 p-3 rounded-lg bg-accent/5">
                  <div className="h-10 w-10 rounded-full bg-accent flex items-center justify-center">
                    <Trophy className="h-5 w-5 text-accent-foreground" />
                  </div>
                  <div className="flex-1">
                    <p className="font-medium">{achievement.badge_name}</p>
                    {achievement.badge_description && (
                      <p className="text-xs text-muted-foreground">{achievement.badge_description}</p>
                    )}
                  </div>
                  <span className="text-xs text-muted-foreground">
                    {new Date(achievement.earned_at).toLocaleDateString()}
                  </span>
                </div>
              ))}
            </CardContent>
          </Card>
        )}
      </div>
    </AppLayout>
  );
}

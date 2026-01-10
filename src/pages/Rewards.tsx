import { useState, useEffect } from "react";
import { AppLayout } from "@/components/layout/AppLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Trophy, Star, Award, Target, Leaf, Car, Flame, Zap, CheckCircle2, Lock, 
  Gift, History, TrendingUp, Sparkles, Coffee, TreePine, ShoppingBag, ArrowRight
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface Challenge {
  id: string;
  title: string;
  description: string;
  category: string;
  target_value: number;
  points_reward: number;
  progress: number;
  completed: boolean;
  joined: boolean;
}

interface Achievement {
  id: string;
  badge_name: string;
  badge_description: string | null;
  earned_at: string;
}

interface Reward {
  id: string;
  name: string;
  description: string | null;
  points_cost: number;
  category: string;
  image_url: string | null;
}

interface PointsHistoryItem {
  id: string;
  points: number;
  type: string;
  source: string;
  description: string | null;
  created_at: string;
}

interface ProfileData {
  total_points: number;
  current_streak: number;
  longest_streak: number;
}

const BADGE_DEFINITIONS = [
  { name: "First Step", description: "Log your first activity", icon: Leaf, color: "bg-primary" },
  { name: "Week Warrior", description: "Log activities for 7 consecutive days", icon: Target, color: "bg-accent" },
  { name: "Eco Champion", description: "Complete 10 challenges", icon: Trophy, color: "bg-secondary" },
  { name: "Carbon Cutter", description: "Reduce emissions by 50% in a week", icon: Star, color: "bg-primary" },
  { name: "Green Commuter", description: "Use eco transport 20 times", icon: Car, color: "bg-accent" },
  { name: "Energy Saver", description: "Keep energy use under 5kg for a week", icon: Zap, color: "bg-secondary" },
];

const getRewardIcon = (category: string) => {
  switch (category) {
    case "food": return Coffee;
    case "eco": return TreePine;
    case "shopping": return ShoppingBag;
    default: return Gift;
  }
};

export default function Rewards() {
  const { user } = useAuth();
  const [challenges, setChallenges] = useState<Challenge[]>([]);
  const [achievements, setAchievements] = useState<Achievement[]>([]);
  const [rewards, setRewards] = useState<Reward[]>([]);
  const [pointsHistory, setPointsHistory] = useState<PointsHistoryItem[]>([]);
  const [profile, setProfile] = useState<ProfileData>({ total_points: 0, current_streak: 0, longest_streak: 0 });
  const [loading, setLoading] = useState(true);
  const [redeemingId, setRedeemingId] = useState<string | null>(null);
  const [joiningId, setJoiningId] = useState<string | null>(null);

  const fetchData = async () => {
    if (!user) return;

    const [challengesRes, userChallengesRes, achievementsRes, profileRes, rewardsRes, historyRes] = await Promise.all([
      supabase.from("challenges").select("*").eq("is_active", true),
      supabase.from("user_challenges").select("*").eq("user_id", user.id),
      supabase.from("achievements").select("*").eq("user_id", user.id).order("earned_at", { ascending: false }),
      supabase.from("profiles").select("total_points, current_streak, longest_streak").eq("user_id", user.id).maybeSingle(),
      supabase.from("rewards").select("*").eq("is_active", true).order("points_cost", { ascending: true }),
      supabase.from("points_history").select("*").eq("user_id", user.id).order("created_at", { ascending: false }).limit(20),
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
          joined: userProgressMap.has(c.id),
        };
      }));
    }

    setAchievements(achievementsRes.data || []);
    setProfile({
      total_points: profileRes.data?.total_points || 0,
      current_streak: profileRes.data?.current_streak || 0,
      longest_streak: profileRes.data?.longest_streak || 0,
    });
    setRewards(rewardsRes.data || []);
    setPointsHistory(historyRes.data || []);
    setLoading(false);
  };

  useEffect(() => {
    fetchData();
  }, [user]);

  const handleJoinChallenge = async (challengeId: string) => {
    if (!user) return;
    setJoiningId(challengeId);

    const { error } = await supabase.from("user_challenges").insert({
      user_id: user.id,
      challenge_id: challengeId,
      progress: 0,
      completed: false,
    });

    if (error) {
      toast.error("Failed to join challenge");
    } else {
      toast.success("Challenge joined! Start logging activities to make progress.");
      fetchData();
    }
    setJoiningId(null);
  };

  const handleRedeemReward = async (reward: Reward) => {
    if (!user) return;
    if (profile.total_points < reward.points_cost) {
      toast.error("Not enough points to redeem this reward");
      return;
    }

    setRedeemingId(reward.id);

    // Generate a simple redemption code
    const redemptionCode = `TRACK2C-${Math.random().toString(36).substring(2, 8).toUpperCase()}`;

    // Insert redemption record
    const { error: redeemError } = await supabase.from("user_rewards").insert({
      user_id: user.id,
      reward_id: reward.id,
      points_spent: reward.points_cost,
      redemption_code: redemptionCode,
      status: "redeemed",
    });

    if (redeemError) {
      toast.error("Failed to redeem reward");
      setRedeemingId(null);
      return;
    }

    // Deduct points from profile
    const { error: pointsError } = await supabase
      .from("profiles")
      .update({ total_points: profile.total_points - reward.points_cost })
      .eq("user_id", user.id);

    if (pointsError) {
      toast.error("Failed to update points");
      setRedeemingId(null);
      return;
    }

    // Log to points history
    await supabase.from("points_history").insert({
      user_id: user.id,
      points: -reward.points_cost,
      type: "spent",
      source: "redemption",
      source_id: reward.id,
      description: `Redeemed: ${reward.name}`,
    });

    toast.success(
      <div className="space-y-1">
        <p className="font-semibold">Reward Redeemed! 🎉</p>
        <p className="text-sm">Code: <span className="font-mono">{redemptionCode}</span></p>
      </div>
    );
    
    fetchData();
    setRedeemingId(null);
  };

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
        {/* Header with Points & Streak */}
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold">Rewards</h1>
          <div className="flex items-center gap-3">
            {profile.current_streak > 0 && (
              <div className="flex items-center gap-1 bg-accent/20 px-3 py-1.5 rounded-full">
                <Flame className="h-4 w-4 text-accent" />
                <span className="text-sm font-semibold">{profile.current_streak}d</span>
              </div>
            )}
            <div className="flex items-center gap-2 bg-secondary/20 px-4 py-2 rounded-full">
              <Star className="h-5 w-5 text-secondary" />
              <span className="font-bold">{profile.total_points} pts</span>
            </div>
          </div>
        </div>

        {/* Tabs for different sections */}
        <Tabs defaultValue="challenges" className="w-full">
          <TabsList className="grid w-full grid-cols-4 h-auto">
            <TabsTrigger value="challenges" className="text-xs py-2">
              <Target className="h-4 w-4 mr-1" />
              Challenges
            </TabsTrigger>
            <TabsTrigger value="redeem" className="text-xs py-2">
              <Gift className="h-4 w-4 mr-1" />
              Redeem
            </TabsTrigger>
            <TabsTrigger value="badges" className="text-xs py-2">
              <Trophy className="h-4 w-4 mr-1" />
              Badges
            </TabsTrigger>
            <TabsTrigger value="history" className="text-xs py-2">
              <History className="h-4 w-4 mr-1" />
              History
            </TabsTrigger>
          </TabsList>

          {/* Challenges Tab */}
          <TabsContent value="challenges" className="space-y-4 mt-4">
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
                      className={`p-4 rounded-xl border transition-all ${
                        challenge.completed 
                          ? "bg-accent/5 border-accent/20" 
                          : challenge.joined 
                            ? "bg-card border-border" 
                            : "bg-muted/30 border-dashed border-muted-foreground/30"
                      }`}
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
                      
                      {challenge.joined ? (
                        <div className="flex items-center gap-3">
                          <Progress 
                            value={(challenge.progress / challenge.target_value) * 100} 
                            className="flex-1 h-2"
                          />
                          <span className="text-sm font-medium">
                            {challenge.progress}/{challenge.target_value}
                          </span>
                        </div>
                      ) : (
                        <Button 
                          onClick={() => handleJoinChallenge(challenge.id)}
                          disabled={joiningId === challenge.id}
                          size="sm"
                          className="w-full"
                        >
                          {joiningId === challenge.id ? (
                            <div className="animate-spin h-4 w-4 border-2 border-primary-foreground border-t-transparent rounded-full" />
                          ) : (
                            <>
                              <Sparkles className="h-4 w-4 mr-1" />
                              Join Challenge
                            </>
                          )}
                        </Button>
                      )}
                    </div>
                  ))
                ) : (
                  <p className="text-muted-foreground text-center py-4">No active challenges</p>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Redeem Tab */}
          <TabsContent value="redeem" className="space-y-4 mt-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base">
                  <div className="h-8 w-8 rounded-xl bg-primary/10 flex items-center justify-center">
                    <Gift className="h-4 w-4 text-primary" />
                  </div>
                  Available Rewards
                  <Badge variant="secondary" className="ml-auto">
                    {profile.total_points} pts available
                  </Badge>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {rewards.length > 0 ? (
                  rewards.map((reward) => {
                    const RewardIcon = getRewardIcon(reward.category);
                    const canAfford = profile.total_points >= reward.points_cost;
                    
                    return (
                      <div 
                        key={reward.id}
                        className={`p-4 rounded-xl border flex items-center gap-4 transition-all ${
                          canAfford ? "bg-card border-border hover:border-primary/30" : "bg-muted/30 border-muted opacity-60"
                        }`}
                      >
                        <div className={`h-12 w-12 rounded-xl flex items-center justify-center ${
                          canAfford ? "gradient-forest" : "bg-muted"
                        }`}>
                          <RewardIcon className={`h-6 w-6 ${canAfford ? "text-primary-foreground" : "text-muted-foreground"}`} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <h3 className="font-semibold truncate">{reward.name}</h3>
                          <p className="text-sm text-muted-foreground truncate">{reward.description}</p>
                        </div>
                        <div className="flex flex-col items-end gap-1">
                          <span className="text-sm font-bold text-primary">{reward.points_cost} pts</span>
                          <Button 
                            size="sm" 
                            variant={canAfford ? "default" : "outline"}
                            disabled={!canAfford || redeemingId === reward.id}
                            onClick={() => handleRedeemReward(reward)}
                          >
                            {redeemingId === reward.id ? (
                              <div className="animate-spin h-4 w-4 border-2 border-primary-foreground border-t-transparent rounded-full" />
                            ) : (
                              "Redeem"
                            )}
                          </Button>
                        </div>
                      </div>
                    );
                  })
                ) : (
                  <p className="text-muted-foreground text-center py-4">No rewards available</p>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Badges Tab */}
          <TabsContent value="badges" className="space-y-4 mt-4">
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
                        <span className="text-[10px] text-muted-foreground mt-1">{badge.description}</span>
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
          </TabsContent>

          {/* History Tab */}
          <TabsContent value="history" className="space-y-4 mt-4">
            {/* Stats Summary */}
            <div className="grid grid-cols-3 gap-3">
              <Card className="p-4 text-center">
                <Star className="h-6 w-6 text-secondary mx-auto mb-1" />
                <p className="text-2xl font-bold">{profile.total_points}</p>
                <p className="text-xs text-muted-foreground">Total Points</p>
              </Card>
              <Card className="p-4 text-center">
                <Flame className="h-6 w-6 text-accent mx-auto mb-1" />
                <p className="text-2xl font-bold">{profile.current_streak}</p>
                <p className="text-xs text-muted-foreground">Current Streak</p>
              </Card>
              <Card className="p-4 text-center">
                <TrendingUp className="h-6 w-6 text-primary mx-auto mb-1" />
                <p className="text-2xl font-bold">{profile.longest_streak}</p>
                <p className="text-xs text-muted-foreground">Best Streak</p>
              </Card>
            </div>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base">
                  <History className="h-5 w-5 text-muted-foreground" />
                  Points History
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {pointsHistory.length > 0 ? (
                  pointsHistory.map((item) => (
                    <div 
                      key={item.id} 
                      className="flex items-center justify-between p-3 rounded-lg bg-muted/30"
                    >
                      <div className="flex items-center gap-3">
                        <div className={`h-8 w-8 rounded-full flex items-center justify-center ${
                          item.type === "earned" ? "bg-accent/20" : "bg-destructive/20"
                        }`}>
                          {item.type === "earned" ? (
                            <ArrowRight className="h-4 w-4 text-accent rotate-[-45deg]" />
                          ) : (
                            <ArrowRight className="h-4 w-4 text-destructive rotate-[135deg]" />
                          )}
                        </div>
                        <div>
                          <p className="text-sm font-medium">{item.description || item.source}</p>
                          <p className="text-xs text-muted-foreground">
                            {new Date(item.created_at).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                      <span className={`font-semibold ${
                        item.type === "earned" ? "text-accent" : "text-destructive"
                      }`}>
                        {item.type === "earned" ? "+" : ""}{item.points}
                      </span>
                    </div>
                  ))
                ) : (
                  <p className="text-muted-foreground text-center py-4">No points history yet</p>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </AppLayout>
  );
}

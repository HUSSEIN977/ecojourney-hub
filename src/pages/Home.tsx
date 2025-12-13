import { useState, useEffect } from "react";
import { Plus } from "lucide-react";
import { AppLayout } from "@/components/layout/AppLayout";
import { CarbonSummaryCard } from "@/components/home/CarbonSummaryCard";
import { WeeklyChallengesCard } from "@/components/home/WeeklyChallengesCard";
import { QuickStatsCard } from "@/components/home/QuickStatsCard";
import { AddActivitySheet } from "@/components/activity/AddActivitySheet";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";

export default function Home() {
  const { user } = useAuth();
  const [profile, setProfile] = useState<any>(null);
  const [todayEmission, setTodayEmission] = useState(0);
  const [yesterdayEmission, setYesterdayEmission] = useState(0);
  const [stats, setStats] = useState({ transport: 0, cooking: 0, energy: 0 });
  const [challenges, setChallenges] = useState<any[]>([]);

  const fetchData = async () => {
    if (!user) return;
    
    const today = new Date().toISOString().split("T")[0];
    const yesterday = new Date(Date.now() - 86400000).toISOString().split("T")[0];

    const [profileRes, todayRes, yesterdayRes, challengesRes] = await Promise.all([
      supabase.from("profiles").select("*").eq("user_id", user.id).maybeSingle(),
      supabase.from("activities").select("co2_emission, category").eq("user_id", user.id).eq("activity_date", today),
      supabase.from("activities").select("co2_emission").eq("user_id", user.id).eq("activity_date", yesterday),
      supabase.from("challenges").select("*").eq("is_active", true).limit(5),
    ]);

    if (profileRes.data) setProfile(profileRes.data);
    
    const todayTotal = todayRes.data?.reduce((sum, a) => sum + Number(a.co2_emission), 0) || 0;
    setTodayEmission(todayTotal);
    
    const yestTotal = yesterdayRes.data?.reduce((sum, a) => sum + Number(a.co2_emission), 0) || 0;
    setYesterdayEmission(yestTotal);

    const transport = todayRes.data?.filter(a => a.category === "transport").reduce((sum, a) => sum + Number(a.co2_emission), 0) || 0;
    const cooking = todayRes.data?.filter(a => a.category === "cooking").reduce((sum, a) => sum + Number(a.co2_emission), 0) || 0;
    const energy = todayRes.data?.filter(a => a.category === "energy").reduce((sum, a) => sum + Number(a.co2_emission), 0) || 0;
    setStats({ transport, cooking, energy });

    if (challengesRes.data) {
      // Get user's challenge progress
      const { data: userChallengesData } = await supabase
        .from("user_challenges")
        .select("*")
        .eq("user_id", user.id);
      
      const userProgressMap = new Map(
        userChallengesData?.map(uc => [uc.challenge_id, { progress: uc.progress, completed: uc.completed }]) || []
      );
      
      setChallenges(challengesRes.data.map(c => {
        const userProgress = userProgressMap.get(c.id);
        return {
          id: c.id,
          title: c.title,
          progress: userProgress?.progress || 0,
          target: c.target_value,
          completed: userProgress?.completed || false
        };
      }));
    }
  };

  useEffect(() => { fetchData(); }, [user]);

  return (
    <AppLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">Hello, {profile?.first_name || "there"}!</h1>
            <p className="text-muted-foreground text-sm">Track your impact today</p>
          </div>
          <AddActivitySheet trigger={<Button variant="eco" size="icon" className="h-12 w-12 rounded-2xl"><Plus className="h-5 w-5" /></Button>} onActivityAdded={fetchData} />
        </div>
        <CarbonSummaryCard todayEmission={todayEmission} yesterdayEmission={yesterdayEmission} />
        <QuickStatsCard transportEmission={stats.transport} cookingEmission={stats.cooking} energyEmission={stats.energy} totalPoints={profile?.total_points || 0} />
        <WeeklyChallengesCard challenges={challenges} totalCompleted={challenges.filter(c => c.completed).length} totalChallenges={challenges.length} />
      </div>
    </AppLayout>
  );
}

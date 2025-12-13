import { useState, useEffect } from "react";
import { AppLayout } from "@/components/layout/AppLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BarChart3, TrendingDown, TrendingUp, Leaf, Car, Flame, Zap } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line } from "recharts";

interface Activity {
  activity_date: string;
  category: string;
  co2_emission: number;
}

export default function Analytics() {
  const { user } = useAuth();
  const [activities, setActivities] = useState<Activity[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchActivities = async () => {
      if (!user) return;
      
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      
      const { data } = await supabase
        .from("activities")
        .select("activity_date, category, co2_emission")
        .eq("user_id", user.id)
        .gte("activity_date", thirtyDaysAgo.toISOString().split("T")[0])
        .order("activity_date", { ascending: true });
      
      setActivities(data || []);
      setLoading(false);
    };
    
    fetchActivities();
  }, [user]);

  // Process data for charts
  const dailyData = activities.reduce((acc, activity) => {
    const date = activity.activity_date;
    const existing = acc.find(d => d.date === date);
    if (existing) {
      existing.emission += Number(activity.co2_emission);
    } else {
      acc.push({ date, emission: Number(activity.co2_emission) });
    }
    return acc;
  }, [] as { date: string; emission: number }[]);

  const categoryData = activities.reduce((acc, activity) => {
    const existing = acc.find(d => d.category === activity.category);
    if (existing) {
      existing.value += Number(activity.co2_emission);
    } else {
      acc.push({ category: activity.category, value: Number(activity.co2_emission) });
    }
    return acc;
  }, [] as { category: string; value: number }[]);

  const totalEmission = activities.reduce((sum, a) => sum + Number(a.co2_emission), 0);
  const avgDaily = dailyData.length > 0 ? totalEmission / dailyData.length : 0;

  const COLORS = ["hsl(var(--primary))", "hsl(var(--accent))", "hsl(var(--secondary))", "hsl(142, 76%, 36%)"];

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case "transport": return <Car className="h-4 w-4" />;
      case "cooking": return <Flame className="h-4 w-4" />;
      case "energy": return <Zap className="h-4 w-4" />;
      default: return <Leaf className="h-4 w-4" />;
    }
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
  };

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
        <h1 className="text-2xl font-bold">Analytics</h1>
        
        {/* Summary Stats */}
        <div className="grid grid-cols-2 gap-4">
          <Card>
            <CardContent className="pt-4">
              <div className="flex items-center gap-2 text-muted-foreground text-sm mb-1">
                <Leaf className="h-4 w-4" />
                Total (30 days)
              </div>
              <p className="text-2xl font-bold">{totalEmission.toFixed(1)} kg</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4">
              <div className="flex items-center gap-2 text-muted-foreground text-sm mb-1">
                <BarChart3 className="h-4 w-4" />
                Daily Average
              </div>
              <p className="text-2xl font-bold">{avgDaily.toFixed(1)} kg</p>
            </CardContent>
          </Card>
        </div>

        {/* Daily Trend Chart */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <TrendingDown className="h-5 w-5 text-primary" />
              Daily Emissions
            </CardTitle>
          </CardHeader>
          <CardContent>
            {dailyData.length > 0 ? (
              <ResponsiveContainer width="100%" height={200}>
                <LineChart data={dailyData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis 
                    dataKey="date" 
                    tickFormatter={formatDate}
                    tick={{ fontSize: 12, fill: "hsl(var(--muted-foreground))" }}
                  />
                  <YAxis 
                    tick={{ fontSize: 12, fill: "hsl(var(--muted-foreground))" }}
                    tickFormatter={(v) => `${v}kg`}
                  />
                  <Tooltip 
                    formatter={(value: number) => [`${value.toFixed(2)} kg`, "CO₂"]}
                    labelFormatter={formatDate}
                    contentStyle={{ 
                      backgroundColor: "hsl(var(--card))", 
                      border: "1px solid hsl(var(--border))",
                      borderRadius: "8px"
                    }}
                  />
                  <Line 
                    type="monotone" 
                    dataKey="emission" 
                    stroke="hsl(var(--primary))" 
                    strokeWidth={2}
                    dot={{ fill: "hsl(var(--primary))", strokeWidth: 0 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <p className="text-muted-foreground text-center py-8">No data available</p>
            )}
          </CardContent>
        </Card>

        {/* Category Breakdown */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <BarChart3 className="h-5 w-5 text-primary" />
              By Category
            </CardTitle>
          </CardHeader>
          <CardContent>
            {categoryData.length > 0 ? (
              <div className="flex items-center gap-4">
                <ResponsiveContainer width="50%" height={150}>
                  <PieChart>
                    <Pie
                      data={categoryData}
                      cx="50%"
                      cy="50%"
                      innerRadius={40}
                      outerRadius={60}
                      paddingAngle={2}
                      dataKey="value"
                    >
                      {categoryData.map((_, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                  </PieChart>
                </ResponsiveContainer>
                <div className="flex-1 space-y-2">
                  {categoryData.map((item, index) => (
                    <div key={item.category} className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div 
                          className="h-3 w-3 rounded-full" 
                          style={{ backgroundColor: COLORS[index % COLORS.length] }}
                        />
                        <span className="text-sm capitalize flex items-center gap-1">
                          {getCategoryIcon(item.category)}
                          {item.category}
                        </span>
                      </div>
                      <span className="text-sm font-medium">{item.value.toFixed(1)} kg</span>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <p className="text-muted-foreground text-center py-8">No data available</p>
            )}
          </CardContent>
        </Card>

        {/* Activity List */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Recent Activities</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3 max-h-64 overflow-y-auto">
              {activities.slice().reverse().slice(0, 15).map((activity, index) => (
                <div key={index} className="flex items-center justify-between py-2 border-b border-border last:border-0">
                  <div className="flex items-center gap-3">
                    <div className="h-8 w-8 rounded-lg bg-muted flex items-center justify-center">
                      {getCategoryIcon(activity.category)}
                    </div>
                    <div>
                      <p className="text-sm font-medium capitalize">{activity.category}</p>
                      <p className="text-xs text-muted-foreground">{formatDate(activity.activity_date)}</p>
                    </div>
                  </div>
                  <span className="text-sm font-semibold">{Number(activity.co2_emission).toFixed(2)} kg</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
}

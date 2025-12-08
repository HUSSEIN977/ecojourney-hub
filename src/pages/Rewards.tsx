import { AppLayout } from "@/components/layout/AppLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Trophy } from "lucide-react";

export default function Rewards() {
  return (
    <AppLayout>
      <div className="space-y-6">
        <h1 className="text-2xl font-bold">Rewards</h1>
        <Card>
          <CardHeader><CardTitle className="flex items-center gap-2"><Trophy className="h-5 w-5 text-secondary" />Weekly Challenges</CardTitle></CardHeader>
          <CardContent><p className="text-muted-foreground">Complete challenges to earn points and badges!</p></CardContent>
        </Card>
      </div>
    </AppLayout>
  );
}

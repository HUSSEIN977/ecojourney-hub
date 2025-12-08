import { AppLayout } from "@/components/layout/AppLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BarChart3 } from "lucide-react";

export default function Analytics() {
  return (
    <AppLayout>
      <div className="space-y-6">
        <h1 className="text-2xl font-bold">Analytics</h1>
        <Card>
          <CardHeader><CardTitle className="flex items-center gap-2"><BarChart3 className="h-5 w-5 text-primary" />Carbon Breakdown</CardTitle></CardHeader>
          <CardContent><p className="text-muted-foreground">Start logging activities to see your analytics here.</p></CardContent>
        </Card>
      </div>
    </AppLayout>
  );
}

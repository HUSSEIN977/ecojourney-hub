import { useState, useEffect } from "react";
import { AppLayout } from "@/components/layout/AppLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { User, LogOut, Trash2 } from "lucide-react";

export default function Profile() {
  const { user, signOut } = useAuth();
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (user) {
      supabase.from("profiles").select("*").eq("user_id", user.id).maybeSingle().then(({ data }) => setProfile(data));
    }
  }, [user]);

  const handleUpdate = async () => {
    if (!user || !profile) return;
    setLoading(true);
    const { error } = await supabase.from("profiles").update({ first_name: profile.first_name, last_name: profile.last_name, phone: profile.phone }).eq("user_id", user.id);
    setLoading(false);
    if (error) toast.error("Failed to update"); else toast.success("Profile updated!");
  };

  return (
    <AppLayout>
      <div className="space-y-6">
        <h1 className="text-2xl font-bold">Profile</h1>
        <Card>
          <CardHeader><CardTitle className="flex items-center gap-2"><User className="h-5 w-5" />Your Info</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div><Label>First Name</Label><Input value={profile?.first_name || ""} onChange={e => setProfile({...profile, first_name: e.target.value})} /></div>
              <div><Label>Last Name</Label><Input value={profile?.last_name || ""} onChange={e => setProfile({...profile, last_name: e.target.value})} /></div>
            </div>
            <div><Label>Username</Label><Input value={profile?.username || ""} disabled className="bg-muted" /></div>
            <div><Label>Phone</Label><Input value={profile?.phone || ""} onChange={e => setProfile({...profile, phone: e.target.value})} /></div>
            <Button onClick={handleUpdate} disabled={loading} className="w-full">{loading ? "Saving..." : "Save Changes"}</Button>
          </CardContent>
        </Card>
        <Button variant="outline" onClick={signOut} className="w-full"><LogOut className="h-4 w-4 mr-2" />Sign Out</Button>
      </div>
    </AppLayout>
  );
}

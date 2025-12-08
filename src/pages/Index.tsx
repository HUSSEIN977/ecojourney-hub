import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Leaf, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";

export default function Index() {
  const { user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => { if (user) navigate("/home"); }, [user, navigate]);

  return (
    <div className="min-h-screen gradient-hero flex flex-col items-center justify-center p-6 text-center">
      <div className="animate-fade-in space-y-6 max-w-md">
        <div className="inline-flex h-20 w-20 items-center justify-center rounded-3xl gradient-forest shadow-glow">
          <Leaf className="h-10 w-10 text-primary-foreground" />
        </div>
        <h1 className="text-4xl font-bold tracking-tight">EcoTrack</h1>
        <p className="text-lg text-muted-foreground">Track your daily carbon footprint, complete eco-challenges, and make a real difference for our planet.</p>
        <Button onClick={() => navigate("/auth")} variant="eco" size="xl" className="gap-2">Get Started <ArrowRight className="h-5 w-5" /></Button>
      </div>
    </div>
  );
}

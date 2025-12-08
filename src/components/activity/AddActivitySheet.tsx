import { useState } from "react";
import { Car, Utensils, Zap, ShoppingBag, Bus, Bike } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

const activityCategories = [
  { id: "transport", label: "Transport", icon: Car },
  { id: "cooking", label: "Cooking", icon: Utensils },
  { id: "energy", label: "Energy", icon: Zap },
  { id: "shopping", label: "Shopping", icon: ShoppingBag },
];

const transportTypes = [
  { id: "car", label: "Car", co2PerKm: 0.21 },
  { id: "bus", label: "Bus", co2PerKm: 0.089 },
  { id: "train", label: "Train", co2PerKm: 0.041 },
  { id: "bike", label: "Bike/Walk", co2PerKm: 0 },
];

const cookingTypes = [
  { id: "gas", label: "Gas Stove", co2PerHour: 0.5 },
  { id: "electric", label: "Electric Stove", co2PerHour: 0.3 },
  { id: "microwave", label: "Microwave", co2PerHour: 0.15 },
  { id: "oven", label: "Oven", co2PerHour: 0.8 },
];

interface AddActivitySheetProps {
  trigger: React.ReactNode;
  onActivityAdded: () => void;
}

export function AddActivitySheet({ trigger, onActivityAdded }: AddActivitySheetProps) {
  const [open, setOpen] = useState(false);
  const [category, setCategory] = useState<string>("");
  const [activityType, setActivityType] = useState<string>("");
  const [duration, setDuration] = useState<string>("");
  const [distance, setDistance] = useState<string>("");
  const [carModel, setCarModel] = useState<string>("");
  const [notes, setNotes] = useState<string>("");
  const [isLoading, setIsLoading] = useState(false);
  const { user } = useAuth();

  const calculateCO2 = (): number => {
    if (category === "transport" && activityType && distance) {
      const type = transportTypes.find((t) => t.id === activityType);
      return (type?.co2PerKm || 0) * parseFloat(distance);
    }
    if (category === "cooking" && activityType && duration) {
      const type = cookingTypes.find((t) => t.id === activityType);
      return (type?.co2PerHour || 0) * (parseFloat(duration) / 60);
    }
    if (category === "energy" && duration) {
      return parseFloat(duration) * 0.1;
    }
    if (category === "shopping") {
      return 2.5;
    }
    return 0;
  };

  const handleSubmit = async () => {
    if (!user || !category) return;
    
    setIsLoading(true);
    const co2 = calculateCO2();

    try {
      const { error } = await supabase.from("activities").insert({
        user_id: user.id,
        category,
        activity_type: activityType || category,
        duration_minutes: duration ? parseInt(duration) : null,
        distance_km: distance ? parseFloat(distance) : null,
        car_model: carModel || null,
        cooking_type: category === "cooking" ? activityType : null,
        co2_emission: co2,
        notes: notes || null,
      });

      if (error) throw error;

      toast.success("Activity logged!", {
        description: `${co2.toFixed(2)} kg CO₂ added to your daily footprint.`,
      });

      setOpen(false);
      resetForm();
      onActivityAdded();
    } catch (error) {
      console.error("Error adding activity:", error);
      toast.error("Failed to log activity");
    } finally {
      setIsLoading(false);
    }
  };

  const resetForm = () => {
    setCategory("");
    setActivityType("");
    setDuration("");
    setDistance("");
    setCarModel("");
    setNotes("");
  };

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>{trigger}</SheetTrigger>
      <SheetContent side="bottom" className="h-[85vh] rounded-t-3xl">
        <SheetHeader className="pb-4">
          <SheetTitle>Log Activity</SheetTitle>
        </SheetHeader>

        <div className="space-y-6 overflow-auto">
          <div>
            <Label className="mb-3 block">Category</Label>
            <div className="grid grid-cols-4 gap-2">
              {activityCategories.map((cat) => (
                <button
                  key={cat.id}
                  onClick={() => {
                    setCategory(cat.id);
                    setActivityType("");
                  }}
                  className={`flex flex-col items-center gap-2 p-4 rounded-xl border transition-all ${
                    category === cat.id
                      ? "border-primary bg-primary/10"
                      : "border-border hover:border-primary/50"
                  }`}
                >
                  <cat.icon className={`h-5 w-5 ${category === cat.id ? "text-primary" : "text-muted-foreground"}`} />
                  <span className="text-xs font-medium">{cat.label}</span>
                </button>
              ))}
            </div>
          </div>

          {category === "transport" && (
            <>
              <div>
                <Label className="mb-2 block">Transport Type</Label>
                <Select value={activityType} onValueChange={setActivityType}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select type" />
                  </SelectTrigger>
                  <SelectContent>
                    {transportTypes.map((type) => (
                      <SelectItem key={type.id} value={type.id}>
                        {type.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="mb-2 block">Distance (km)</Label>
                <Input
                  type="number"
                  value={distance}
                  onChange={(e) => setDistance(e.target.value)}
                  placeholder="e.g., 15"
                />
              </div>
              {activityType === "car" && (
                <div>
                  <Label className="mb-2 block">Car Model (optional)</Label>
                  <Input
                    value={carModel}
                    onChange={(e) => setCarModel(e.target.value)}
                    placeholder="e.g., Toyota Camry"
                  />
                </div>
              )}
            </>
          )}

          {category === "cooking" && (
            <>
              <div>
                <Label className="mb-2 block">Cooking Method</Label>
                <Select value={activityType} onValueChange={setActivityType}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select method" />
                  </SelectTrigger>
                  <SelectContent>
                    {cookingTypes.map((type) => (
                      <SelectItem key={type.id} value={type.id}>
                        {type.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="mb-2 block">Duration (minutes)</Label>
                <Input
                  type="number"
                  value={duration}
                  onChange={(e) => setDuration(e.target.value)}
                  placeholder="e.g., 30"
                />
              </div>
            </>
          )}

          {category === "energy" && (
            <div>
              <Label className="mb-2 block">Device Usage (minutes)</Label>
              <Input
                type="number"
                value={duration}
                onChange={(e) => setDuration(e.target.value)}
                placeholder="e.g., 60"
              />
            </div>
          )}

          {category === "shopping" && (
            <div>
              <Label className="mb-2 block">Notes</Label>
              <Input
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="What did you buy?"
              />
            </div>
          )}

          {category && (
            <div className="bg-muted rounded-xl p-4">
              <p className="text-sm text-muted-foreground">Estimated CO₂</p>
              <p className="text-2xl font-bold text-primary">
                {calculateCO2().toFixed(2)} kg
              </p>
            </div>
          )}

          <Button
            onClick={handleSubmit}
            disabled={!category || isLoading}
            className="w-full"
            variant="eco"
            size="lg"
          >
            {isLoading ? "Saving..." : "Log Activity"}
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
}

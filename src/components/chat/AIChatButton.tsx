import { useState } from "react";
import { MessageCircle, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { AIChatDialog } from "./AIChatDialog";

export function AIChatButton() {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      <Button
        onClick={() => setIsOpen(true)}
        variant="eco"
        size="icon"
        className="fixed bottom-24 right-4 z-40 h-14 w-14 rounded-full shadow-glow animate-float"
      >
        <MessageCircle className="h-6 w-6" />
      </Button>
      
      <AIChatDialog open={isOpen} onOpenChange={setIsOpen} />
    </>
  );
}

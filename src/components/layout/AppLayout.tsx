import { ReactNode } from "react";
import { BottomNav } from "./BottomNav";
import { AIChatButton } from "@/components/chat/AIChatButton";

interface AppLayoutProps {
  children: ReactNode;
}

export function AppLayout({ children }: AppLayoutProps) {
  return (
    <div className="min-h-screen bg-background pb-20">
      <main className="container max-w-lg mx-auto px-4 py-6">
        {children}
      </main>
      <AIChatButton />
      <BottomNav />
    </div>
  );
}

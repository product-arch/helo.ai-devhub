import { ReactNode } from "react";
import { AppSidebar } from "./AppSidebar";
import { cn } from "@/lib/utils";

interface DashboardLayoutProps {
  children: ReactNode;
}

export function DashboardLayout({ children }: DashboardLayoutProps) {
  return (
    <div className="min-h-screen bg-background">
      <AppSidebar />
      <main className={cn("ml-60 min-h-screen p-8 transition-all duration-200")}>
        {children}
      </main>
    </div>
  );
}

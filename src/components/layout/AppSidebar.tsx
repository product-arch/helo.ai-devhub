import { NavLink } from "@/components/NavLink";
import { useTheme } from "@/contexts/ThemeContext";
import { useApp } from "@/contexts/AppContext";
import { cn } from "@/lib/utils";
import { useParams, useNavigate } from "react-router-dom";
import {
  LayoutDashboard, Box, Key, Webhook, ScrollText, Settings,
  Moon, Sun, LogOut, ChevronLeft, ChevronRight, ArrowLeft, Users,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useState } from "react";

export function AppSidebar() {
  const { theme, toggleTheme } = useTheme();
  const { logout, apps } = useApp();
  const { appId } = useParams<{ appId: string }>();
  const navigate = useNavigate();
  const [collapsed, setCollapsed] = useState(false);

  const currentApp = apps.find((a) => a.id === appId);
  const prefix = `/apps/${appId}`;

  const navItems = [
    { title: "Overview", url: `${prefix}/overview`, icon: LayoutDashboard },
    { title: "Products", url: `${prefix}/products`, icon: Box },
    { title: "API Credentials", url: `${prefix}/credentials`, icon: Key },
    { title: "Webhooks", url: `${prefix}/webhooks`, icon: Webhook },
    { title: "Logs & Events", url: `${prefix}/logs`, icon: ScrollText },
    { title: "Settings", url: `${prefix}/settings`, icon: Settings },
    { title: "Users", url: `${prefix}/users`, icon: Users },
  ];

  const envColors: Record<string, string> = {
    production: "bg-success/10 text-success border-success/20",
    staging: "bg-warning/10 text-warning border-warning/20",
    development: "bg-primary/10 text-primary border-primary/20",
  };

  return (
    <aside className={cn("fixed left-0 top-0 h-screen bg-sidebar border-r border-sidebar-border flex flex-col transition-all duration-200", collapsed ? "w-16" : "w-60")}>
      {/* Header */}
      <div className="h-14 flex items-center justify-between px-4 border-b border-sidebar-border">
        {!collapsed && <span className="font-semibold text-sidebar-foreground tracking-tight">helo.ai</span>}
        <Button variant="ghost" size="icon" onClick={() => setCollapsed(!collapsed)} className="h-8 w-8 text-sidebar-foreground hover:bg-sidebar-accent">
          {collapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
        </Button>
      </div>

      {/* App context */}
      {!collapsed && currentApp && (
        <div className="px-4 py-3 border-b border-sidebar-border">
          <button onClick={() => navigate("/apps")} className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-sidebar-foreground mb-2 transition-colors">
            <ArrowLeft className="h-3 w-3" /> Back to Apps
          </button>
          <p className="text-sm font-medium text-sidebar-foreground truncate">{currentApp.name}</p>
          <Badge variant="outline" className={`mt-1 text-[10px] ${envColors[currentApp.environment] || ""}`}>
            {currentApp.environment}
          </Badge>
        </div>
      )}
      {collapsed && (
        <div className="px-2 py-2 border-b border-sidebar-border">
          <Button variant="ghost" size="icon" onClick={() => navigate("/apps")} className="h-8 w-8 text-sidebar-foreground hover:bg-sidebar-accent">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </div>
      )}

      {/* Navigation */}
      <nav className="flex-1 py-4 px-2 space-y-1 overflow-y-auto">
        {navItems.map((item) => (
          <NavLink
            key={item.url}
            to={item.url}
            className={cn("flex items-center gap-3 px-3 py-2 rounded-md text-sm text-sidebar-foreground hover:bg-sidebar-accent transition-colors", collapsed && "justify-center px-2")}
            activeClassName="bg-sidebar-accent text-sidebar-accent-foreground font-medium"
          >
            <item.icon className="h-4 w-4 shrink-0" />
            {!collapsed && <span>{item.title}</span>}
          </NavLink>
        ))}
      </nav>

      {/* Footer */}
      <div className="p-2 border-t border-sidebar-border space-y-1">
        <Button variant="ghost" size="icon" onClick={toggleTheme} className={cn("h-8 w-8 text-sidebar-foreground hover:bg-sidebar-accent", !collapsed && "self-start ml-1")}>
          {theme === "dark" ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
        </Button>
        <Button variant="ghost" size="sm" onClick={logout} className={cn("w-full justify-start gap-3 text-sidebar-foreground hover:bg-sidebar-accent", collapsed && "justify-center px-2")}>
          <LogOut className="h-4 w-4" />
          {!collapsed && <span>Sign out</span>}
        </Button>
      </div>
    </aside>
  );
}

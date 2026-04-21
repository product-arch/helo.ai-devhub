import { useTheme } from "@/contexts/ThemeContext";
import { Button } from "@/components/ui/button";
import { Moon, Sun, Shield, CheckCircle, Clock } from "lucide-react";

interface AuthLayoutProps {
  children: React.ReactNode;
}

export default function AuthLayout({ children }: AuthLayoutProps) {
  const { theme, toggleTheme } = useTheme();

  return (
    <div className="min-h-screen flex flex-col md:flex-row">
      {/* Left panel - branding */}
      <div className="hidden md:flex md:w-[480px] lg:w-[520px] geometric-bg flex-col justify-between p-10">
        <div className="inline-flex flex-col self-start bg-white/55 backdrop-blur-md ring-1 ring-white/60 shadow-[0_8px_32px_-8px_rgba(168,0,0,0.15)] rounded-2xl px-5 py-4">
          <h1 className="text-xl font-semibold tracking-tight font-mono text-[#a80000]">Helo.ai</h1>
          <p className="text-sm text-[#420000] mt-1 font-bold font-mono">Developer Console</p>
        </div>

        <div className="bg-white/55 backdrop-blur-md ring-1 ring-white/60 shadow-[0_8px_32px_-8px_rgba(168,0,0,0.15)] rounded-2xl px-5 py-5 space-y-4">
          <h2 className="text-base font-semibold text-[#420000] leading-snug font-mono">
            Secure access to messaging infrastructure
          </h2>
          <div className="h-px bg-[#EF1645]/20" />
          <div className="space-y-3">
            <div className="flex items-center gap-3 text-sm text-[#420000] font-mono">
              <Shield className="h-4 w-4 text-[#EF1645] shrink-0" />
              <span className="font-bold">256-bit TLS encryption</span>
            </div>
            <div className="flex items-center gap-3 text-sm text-[#420000] font-mono">
              <CheckCircle className="h-4 w-4 text-[#EF1645] shrink-0" />
              <span className="font-bold">SOC 2 Type II compliant</span>
            </div>
            <div className="flex items-center gap-3 text-sm text-[#420000] font-mono">
              <Clock className="h-4 w-4 text-[#EF1645] shrink-0" />
              <span className="font-bold">99.99% uptime SLA</span>
            </div>
          </div>
        </div>

        <div className="self-start rounded-full bg-white/55 backdrop-blur-md ring-1 ring-white/60 shadow-[0_8px_32px_-8px_rgba(168,0,0,0.15)] p-1">
          <Button
            variant="ghost"
            size="icon"
            onClick={toggleTheme}
            className="w-8 h-8 rounded-full text-[#420000] hover:text-[#a80000] hover:bg-white/50"
          >
            {theme === "dark" ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
          </Button>
        </div>
      </div>

      {/* Mobile header */}
      <div className="md:hidden geometric-bg geometric-bg--compact px-6 py-5 flex items-center justify-between">
        <div className="bg-white/55 backdrop-blur-md ring-1 ring-white/60 shadow-[0_8px_32px_-8px_rgba(168,0,0,0.15)] rounded-2xl px-4 py-2">
          <h1 className="text-lg font-semibold tracking-tight font-mono text-[#a80000]">Helo.ai</h1>
          <p className="text-xs font-bold font-mono text-[#420000]">Developer Console</p>
        </div>
        <div className="rounded-full bg-white/55 backdrop-blur-md ring-1 ring-white/60 shadow-[0_8px_32px_-8px_rgba(168,0,0,0.15)] p-1">
          <Button
            variant="ghost"
            size="icon"
            onClick={toggleTheme}
            className="w-8 h-8 rounded-full text-[#420000] hover:text-[#a80000] hover:bg-white/50"
          >
            {theme === "dark" ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
          </Button>
        </div>
      </div>

      {/* Right panel - form */}
      <div className="flex-1 flex items-center justify-center bg-background p-6 md:p-10">
        <div className="w-full max-w-sm">
          {children}
        </div>
      </div>
    </div>
  );
}

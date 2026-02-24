import { useTheme } from "@/contexts/ThemeContext";
import { Button } from "@/components/ui/button";
import { Moon, Sun, Shield, CheckCircle, Clock } from "lucide-react";
import DitherCanvas from "@/components/DitherCanvas";

interface AuthLayoutProps {
  children: React.ReactNode;
}

export default function AuthLayout({ children }: AuthLayoutProps) {
  const { theme, toggleTheme } = useTheme();

  return (
    <div className="min-h-screen flex flex-col md:flex-row">
      {/* Left panel - branding */}
      <div className="hidden md:flex md:w-[480px] lg:w-[520px] relative overflow-hidden text-white flex-col justify-between p-10">
        <DitherCanvas theme={theme} />

        <div className="relative z-10">
          <h1 className="text-xl font-semibold tracking-tight">helo.ai</h1>
          <p className="text-sm text-gray-400 mt-1">Developer Console</p>
        </div>

        <div className="relative z-10 space-y-6">
          <p className="text-sm text-gray-300 leading-relaxed">
            Secure access to messaging infrastructure
          </p>
          <div className="space-y-3">
            <div className="flex items-center gap-3 text-xs text-gray-400">
              <Shield className="h-4 w-4 text-gray-500 shrink-0" />
              <span>256-bit TLS encryption</span>
            </div>
            <div className="flex items-center gap-3 text-xs text-gray-400">
              <CheckCircle className="h-4 w-4 text-gray-500 shrink-0" />
              <span>SOC 2 Type II compliant</span>
            </div>
            <div className="flex items-center gap-3 text-xs text-gray-400">
              <Clock className="h-4 w-4 text-gray-500 shrink-0" />
              <span>99.99% uptime SLA</span>
            </div>
          </div>
        </div>

        <Button
          variant="ghost"
          size="icon"
          onClick={toggleTheme}
          className="relative z-10 w-8 h-8 text-gray-500 hover:text-gray-300 hover:bg-gray-800"
        >
          {theme === "dark" ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
        </Button>
      </div>

      {/* Mobile header */}
      <div className="md:hidden relative overflow-hidden px-6 py-5 flex items-center justify-between">
        <DitherCanvas theme={theme} />
        <div className="relative z-10">
          <h1 className="text-lg font-semibold text-white tracking-tight">helo.ai</h1>
          <p className="text-xs text-gray-400">Developer Console</p>
        </div>
        <Button
          variant="ghost"
          size="icon"
          onClick={toggleTheme}
          className="relative z-10 w-8 h-8 text-gray-500 hover:text-gray-300 hover:bg-gray-800"
        >
          {theme === "dark" ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
        </Button>
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

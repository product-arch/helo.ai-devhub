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
        <div>
          <h1 className="text-xl font-semibold tracking-tight font-mono text-[#a80000]">Helo.ai</h1>
          <p className="text-sm text-gray-600 mt-1 font-bold font-mono">Developer Console</p>
        </div>

        <div className="space-y-6">
          <p className="text-sm text-gray-700 leading-relaxed">
            Secure access to messaging infrastructure
          </p>
          <div className="space-y-3">
            <div className="flex items-center gap-3 text-xs text-gray-600">
              <Shield className="h-4 w-4 text-[#EF1645]/60 shrink-0" />
              <span className="font-bold text-[#420000] font-mono">256-bit TLS encryption</span>
            </div>
            <div className="flex items-center gap-3 text-xs text-[#520000] font-bold font-mono">
              <CheckCircle className="h-4 w-4 text-[#EF1645]/60 shrink-0" />
              <span className="text-[#420000] font-mono">SOC 2 Type II compliant</span>
            </div>
            <div className="flex items-center gap-3 text-xs text-[#420000] font-mono font-bold">
              <Clock className="h-4 w-4 text-[#EF1645]/60 shrink-0 font-extrabold font-mono" />
              <span>99.99% uptime SLA</span>
            </div>
          </div>
        </div>

        <Button
          variant="ghost"
          size="icon"
          onClick={toggleTheme}
          className="w-8 h-8 text-gray-600 hover:text-gray-900 hover:bg-pink-200/50"
        >
          {theme === "dark" ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
        </Button>
      </div>

      {/* Mobile header */}
      <div className="md:hidden geometric-bg geometric-bg--compact px-6 py-5 flex items-center justify-between">
        <div>
          <h1 className="text-lg font-semibold text-gray-900 tracking-tight">helo.ai</h1>
          <p className="text-xs text-gray-600">Developer Console</p>
        </div>
        <Button
          variant="ghost"
          size="icon"
          onClick={toggleTheme}
          className="w-8 h-8 text-gray-600 hover:text-gray-900 hover:bg-pink-200/50"
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

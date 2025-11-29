import { Link, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Gamepad2, AppWindow, Globe, Settings, Puzzle, Bot } from "lucide-react";
import updatesData from "@/jsons/updates.json";

const navItems = [
  { label: "Games", href: "/games", icon: Gamepad2 },
  { label: "Apps", href: "/apps", icon: AppWindow },
  { label: "Browser", href: "/browser", icon: Globe },
  { label: "Add-Ons", href: "/addons", icon: Puzzle },
  { label: "AI", href: "/ai", icon: Bot },
  { label: "Settings", href: "/settings", icon: Settings },
];

export const Navigation = () => {
  const location = useLocation();
  const activeTab = location.pathname.slice(1) || "home";
  
  // Get latest version from updates
  const latestUpdate = updatesData[0];
  const currentVersion = latestUpdate?.version || "V2 Prebeta";

  return (
    <nav className="fixed top-0 left-0 right-0 z-50">
      <div className="w-full px-2 sm:px-4 py-2 sm:py-4">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-2 sm:gap-0">
          {/* Logo with rounded container */}
          <div className="bg-card/50 backdrop-blur-md rounded-full px-6 py-3 border border-border/50">
            <Link to="/" className="flex items-center group">
              <span className="text-2xl font-bold text-foreground group-hover:text-primary/80 transition-colors">
                Hideout<span className="text-primary">.</span>
              </span>
            </Link>
          </div>

          {/* Navigation Tabs */}
          <div className="flex items-center gap-1 bg-card/50 backdrop-blur-md border border-border/50 rounded-full px-1 sm:px-2 py-1.5 shadow-subtle overflow-x-auto max-w-full">
            {navItems.map((item, index) => {
              const Icon = item.icon;
              return (
                <div key={item.label} className="flex items-center">
                  <Button
                    variant={activeTab === item.label.toLowerCase() ? "nav-active" : "nav"}
                    size="nav"
                    asChild
                  >
                    <Link to={item.href} className="relative flex items-center gap-1 sm:gap-2 whitespace-nowrap">
                      {Icon && <Icon className="w-4 h-4" />}
                      <span className="hidden sm:inline">{item.label}</span>
                      {activeTab === item.label.toLowerCase() && (
                        <div className="absolute inset-0 bg-gradient-to-r from-primary/20 to-primary/10 rounded-full blur-xl -z-10" />
                      )}
                    </Link>
                  </Button>
                  
                  {/* Separator line */}
                  {index < navItems.length - 1 && (
                    <div className="h-4 w-px bg-border/50 mx-1" />
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Gradient glow effect */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-px bg-gradient-to-r from-transparent via-primary/50 to-transparent" />
    </nav>
  );
};

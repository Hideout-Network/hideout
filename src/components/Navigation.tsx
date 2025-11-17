import { Link, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Gamepad2, AppWindow, Globe, HelpCircle, Settings, Puzzle } from "lucide-react";
import updatesData from "@/jsons/updates.json";

const navItems = [
  { label: "Games", href: "/games", icon: Gamepad2 },
  { label: "Apps", href: "/apps", icon: AppWindow },
  { label: "Browser", href: "/browser", icon: Globe },
  { label: "Add-Ons", href: "/addons", icon: Puzzle },
  { label: "Help", href: "/help", icon: HelpCircle },
  { label: "Settings", href: "/settings", icon: Settings },
];

export const Navigation = () => {
  const location = useLocation();
  const activeTab = location.pathname.slice(1) || "home";
  
  // Get latest version from updates
  const latestUpdate = updatesData[0];
  const currentVersion = latestUpdate?.version || "V2 Prebeta";

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 animate-slide-in-top">
      <div className="w-full px-4 py-4">
        <div className="flex items-center justify-between">
          {/* Logo with rounded container */}
          <Link to="/" className="bg-card/50 backdrop-blur-md rounded-2xl px-6 py-3 border border-border/50 hover:border-primary/30 transition-colors group">
            <div className="flex flex-col">
              <span className="text-2xl font-bold text-foreground">
                Hideout<span className="text-primary">.</span>
              </span>
              <Link 
                to="/changelog" 
                className="text-xs text-muted-foreground hover:text-primary transition-colors"
                onClick={(e) => e.stopPropagation()}
              >
                {currentVersion}
              </Link>
            </div>
          </Link>

          {/* Navigation Tabs */}
          <div className="flex items-center gap-1 bg-card/50 backdrop-blur-md border border-border/50 rounded-full px-2 py-1.5 shadow-subtle">
            {navItems.map((item, index) => {
              const Icon = item.icon;
              return (
                <div key={item.label} className="flex items-center">
                  <Button
                    variant={activeTab === item.label.toLowerCase() ? "nav-active" : "nav"}
                    size="nav"
                    asChild
                  >
                    <Link to={item.href} className="relative flex items-center gap-2">
                      {Icon && <Icon className="w-4 h-4" />}
                      {item.label}
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

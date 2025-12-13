import { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Gamepad2, AppWindow, Globe, Settings, Puzzle, Bot, Menu } from "lucide-react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
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
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  
  // Get latest version from updates
  const latestUpdate = updatesData[0];
  const currentVersion = latestUpdate?.version || "V2 Prebeta";

  return (
    <nav className="fixed top-0 left-0 right-0 z-50">
      <div className="w-full px-2 sm:px-4 py-2 sm:py-4">
        <div className="flex items-center justify-between">
          {/* Logo with rounded container */}
          <div className="bg-card/50 backdrop-blur-md rounded-full px-4 sm:px-6 py-3 border border-border/50 flex items-center gap-2">
            <Link to="/" className="flex items-center group">
              <span className="text-xl sm:text-2xl font-bold text-foreground group-hover:text-primary/80 transition-colors">
                Hideout<span className="text-primary">.</span>
              </span>
            </Link>
            <Link 
              to="/changelog" 
              className="text-[9px] px-2.5 py-0 bg-primary/20 text-primary rounded-full hover:bg-primary/30 hover:scale-105 transition-all leading-4"
            >
              {currentVersion}
            </Link>
          </div>

          {/* Desktop Navigation Tabs - Hidden on mobile */}
          <div className="hidden md:flex items-center gap-1 bg-card/50 backdrop-blur-md border border-border/50 rounded-full px-2 py-3 shadow-subtle">
            {navItems.map((item, index) => {
              const Icon = item.icon;
              return (
                <div key={item.label} className="flex items-center">
                  <Button
                    variant={activeTab === item.label.toLowerCase() ? "nav-active" : "nav"}
                    size="nav"
                    asChild
                  >
                    <Link to={item.href} className="relative flex items-center gap-2 whitespace-nowrap">
                      {Icon && <Icon className="w-4 h-4" />}
                      <span>{item.label}</span>
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

          {/* Mobile Menu Button */}
          <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
            <SheetTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="md:hidden bg-card/50 backdrop-blur-md border border-border/50 rounded-full w-12 h-12"
              >
                <Menu className="w-5 h-5" />
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="w-[280px] bg-background border-border">
              <SheetHeader>
                <SheetTitle className="text-left flex items-center gap-2">
                  <span className="text-xl font-bold text-foreground">
                    Hideout<span className="text-primary">.</span>
                  </span>
                  <span className="text-[9px] px-2 py-0.5 bg-primary/20 text-primary rounded-full">
                    {currentVersion}
                  </span>
                </SheetTitle>
              </SheetHeader>
              
              <div className="mt-8 flex flex-col gap-2">
                {navItems.map((item) => {
                  const Icon = item.icon;
                  const isActive = activeTab === item.label.toLowerCase();
                  
                  return (
                    <Link
                      key={item.label}
                      to={item.href}
                      onClick={() => setMobileMenuOpen(false)}
                      className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-all hover:scale-[1.02] ${
                        isActive 
                          ? "bg-primary text-primary-foreground" 
                          : "bg-muted/50 hover:bg-muted text-foreground"
                      }`}
                    >
                      <Icon className="w-5 h-5" />
                      <span className="font-medium">{item.label}</span>
                    </Link>
                  );
                })}
              </div>
              
              {/* Home link at bottom */}
              <div className="mt-6 pt-6 border-t border-border">
                <Link
                  to="/"
                  onClick={() => setMobileMenuOpen(false)}
                  className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-all hover:scale-[1.02] ${
                    activeTab === "home" 
                      ? "bg-primary text-primary-foreground" 
                      : "bg-muted/50 hover:bg-muted text-foreground"
                  }`}
                >
                  <span className="font-medium">🏠 Home</span>
                </Link>
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </div>

      {/* Gradient glow effect */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-px bg-gradient-to-r from-transparent via-primary/50 to-transparent" />
    </nav>
  );
};

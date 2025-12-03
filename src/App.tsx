import { useState, useEffect } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { ContextMenu } from "@/components/ContextMenu";
import { UpdateDialog } from "@/components/UpdateDialog";
import Index from "./pages/Index";
import Games from "./pages/Games";
import GamePlayer from "./pages/GamePlayer";
import Apps from "./pages/Apps";
import Help from "./pages/Help";
import Credits from "./pages/Credits";
import Settings from "./pages/Settings";
import Browser from "./pages/Browser";
import Changelog from "./pages/Changelog";
import Addons from "./pages/Addons";
import NotFound from "./pages/NotFound";
import { StarBackground } from "./components/StarBackground";
import { BatteryWarning } from "./components/BatteryWarning";

type ThemesData = {
  site: string;
  "main-theme": string;
  themes: Array<{
    id: string;
    name: string;
    themePath: string;
  }>;
};

const queryClient = new QueryClient();

const App = () => {
  const [contextMenu, setContextMenu] = useState<{ x: number; y: number; isOnBrowser: boolean } | null>(null);

  useEffect(() => {
    const handleContextMenu = (e: MouseEvent) => {
      e.preventDefault();
      const isOnBrowser = window.location.pathname === '/browser';
      setContextMenu({ x: e.clientX, y: e.clientY, isOnBrowser });
    };

    document.addEventListener('contextmenu', handleContextMenu);
    return () => document.removeEventListener('contextmenu', handleContextMenu);
  }, []);

  // Load all settings on app mount
  useEffect(() => {
    const loadSettings = async () => {
      try {
        // Fetch themes data from remote URL
        const response = await fetch('https://cdn.jsdelivr.net/gh/Hideout-Network/hideout-assets/themes/themes.json');
        const themesData: ThemesData = await response.json();

        // Clean up old theme storage - only use hideout_settings
        localStorage.removeItem('hideout_active_theme');
        localStorage.removeItem('hideout_theme');
        
        // Load settings from localStorage
        const savedSettings = localStorage.getItem('hideout_settings');
        let settings = {
          selectedTheme: themesData['main-theme'],
          fontSize: 'medium',
          reducedMotion: false,
          highContrast: false,
          performanceMode: false,
          showFPS: false,
        };
        
        if (savedSettings) {
          try {
            const parsed = JSON.parse(savedSettings);
            settings = { ...settings, ...parsed };
          } catch (e) {
            console.error('Failed to parse settings:', e);
          }
        }
        
        // Apply theme
        const theme = themesData.themes.find(t => t.id === settings.selectedTheme);
        if (theme) {
          const script = document.getElementById('theme-script');
          if (script) {
            script.remove();
          }
          
          const newScript = document.createElement('script');
          newScript.id = 'theme-script';
          newScript.src = `${themesData.site}${theme.themePath}`;
          newScript.async = true;
          document.head.appendChild(newScript);
        }
        
        // Apply fontSize
        document.documentElement.classList.remove('text-sm', 'text-base', 'text-lg');
        const sizeClass = settings.fontSize === 'small' ? 'text-sm' : settings.fontSize === 'large' ? 'text-lg' : 'text-base';
        document.documentElement.classList.add(sizeClass);
        
        // Apply reduced motion
        if (settings.reducedMotion) {
          document.documentElement.classList.add('reduce-motion');
        }
        
        // Apply high contrast
        if (settings.highContrast) {
          document.documentElement.classList.add('high-contrast');
        }
      } catch (error) {
        console.error('Failed to load themes:', error);
      }
    };
    
    loadSettings();
    
    // Reload settings on visibility change (when user returns to tab)
    const handleVisibilityChange = () => {
      if (!document.hidden) {
        loadSettings();
      }
    };
    
    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <StarBackground />
        <BatteryWarning />
        <Toaster />
        <Sonner />
        <UpdateDialog />
        <BrowserRouter>
          {contextMenu && (
            <ContextMenu
              x={contextMenu.x}
              y={contextMenu.y}
              isOnBrowser={contextMenu.isOnBrowser}
              onClose={() => setContextMenu(null)}
            />
          )}
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/games" element={<Games />} />
            <Route path="/game" element={<GamePlayer />} />
            <Route path="/apps" element={<Apps />} />
            <Route path="/browser" element={<Browser />} />
            <Route path="/addons" element={<Addons />} />
            <Route path="/help" element={<Help />} />
            <Route path="/credits" element={<Credits />} />
            <Route path="/settings" element={<Settings />} />
            <Route path="/changelog" element={<Changelog />} />
            {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </QueryClientProvider>
  );
};

export default App;

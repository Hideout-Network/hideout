import { useEffect } from "react";
import { useLocation, Link } from "react-router-dom";
import { GlobalChat } from "./GlobalChat";
import { Shield, Award, Bug, Plus } from "lucide-react";
import { SiGithub, SiDiscord } from "react-icons/si";
import informationData from "@/jsons/information.json";

export const GlobalElements = () => {
  const location = useLocation();

  // Handle prevent tab closing
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      const savedSettings = localStorage.getItem('hideout_settings');
      let preventTabClose = false; // Default to disabled
      
      if (savedSettings) {
        try {
          const settings = JSON.parse(savedSettings);
          preventTabClose = settings.preventTabClose === true;
        } catch (err) {
          console.error('Failed to parse settings:', err);
        }
      }
      
      if (preventTabClose) {
        e.preventDefault();
        // For older browsers
        e.returnValue = '';
        return '';
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, []);
  
  // Hide on browser page
  if (location.pathname === "/browser") {
    return null;
  }

  return (
    <>
      {/* Global Chat Button - Bottom Left */}
      <GlobalChat />

      {/* Footer - Bottom Right - Only show on home page */}
      {location.pathname === "/" && (
        <div className="fixed bottom-4 right-4 z-40">
          <div className="flex items-center gap-3 text-xs text-muted-foreground">
            <span>© 2025 Hideout Network</span>
            <span className="text-muted-foreground/50">•</span>
            <Link to="/privacy-policy" className="flex items-center gap-1 hover:text-primary transition-colors">
              <Shield className="w-3 h-3" />
              Privacy Policy
            </Link>
            <span className="text-muted-foreground/50">•</span>
            <Link to="/credits" className="flex items-center gap-1 hover:text-primary transition-colors">
              <Award className="w-3 h-3" />
              Credits
            </Link>
            <span className="text-muted-foreground/50">•</span>
            <a href="https://discord.gg/HkbVraQH89" target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 hover:text-primary transition-colors">
              <SiDiscord className="w-3 h-3" />
              Discord
            </a>
            <span className="text-muted-foreground/50">•</span>
            <a href={informationData.github} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 hover:text-primary transition-colors">
              <SiGithub className="w-3 h-3" />
              Github
            </a>
            <span className="text-muted-foreground/50">•</span>
            <a href="https://github.com/Hideout-Network/hideout/issues/new" target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 hover:text-primary transition-colors">
              <Plus className="w-3 h-3" />
              Request
            </a>
            <span className="text-muted-foreground/50">•</span>
            <a href="https://github.com/Hideout-Network/hideout/issues/new" target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 hover:text-primary transition-colors">
              <Bug className="w-3 h-3" />
              Report bug
            </a>
          </div>
        </div>
      )}
    </>
  );
};

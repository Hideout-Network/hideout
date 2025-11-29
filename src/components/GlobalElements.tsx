import { useLocation } from "react-router-dom";
import { GlobalChat } from "./GlobalChat";
import { Button } from "@/components/ui/button";
import { Menu, Bug, Plus } from "lucide-react";
import { SiGithub, SiDiscord } from "react-icons/si";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import informationData from "@/jsons/information.json";

export const GlobalElements = () => {
  const location = useLocation();
  
  // Hide on browser page
  if (location.pathname === "/browser") {
    return null;
  }

  return (
    <>
      {/* Global Chat Button - Bottom Left */}
      <GlobalChat />

      {/* FAB Menu - Bottom Right */}
      <div className="fixed bottom-4 right-4 z-50">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button size="icon" className="rounded-full h-12 w-12 shadow-lg">
              <Menu className="w-6 h-6" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent side="top" align="end" className="mb-2 bg-popover border border-border">
            <DropdownMenuItem onClick={() => window.open("https://github.com/Hideout-Network/hideout/issues/new", "_blank")} className="gap-2 cursor-pointer">
              <Bug className="w-4 h-4" />
              Report Bug
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => window.open("https://github.com/Hideout-Network/hideout/issues/new", "_blank")} className="gap-2 cursor-pointer">
              <Plus className="w-4 h-4" />
              Request
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => window.open(informationData.github, "_blank")} className="gap-2 cursor-pointer">
              <SiGithub className="w-4 h-4" />
              GitHub
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => window.open("https://discord.gg/HkbVraQH89", "_blank")} className="gap-2 cursor-pointer">
              <SiDiscord className="w-4 h-4" />
              Discord
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </>
  );
};

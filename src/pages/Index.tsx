import { Navigation } from "@/components/Navigation";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search } from "lucide-react";
import { SiGithub, SiDiscord } from "react-icons/si";
import { Link, useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";
import { ReportBugDialog } from "@/components/ReportBugDialog";
import { RequestGameDialog } from "@/components/RequestGameDialog";
import { GlobalChat } from "@/components/GlobalChat";
import { StarBackground } from "@/components/StarBackground";
import { usePageTitle } from "@/hooks/use-page-title";
import updatesData from "@/jsons/updates.json";
import informationData from "@/jsons/information.json";

const Index = () => {
  usePageTitle('Home');
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState("");
  
  // Get latest version from updates
  const latestUpdate = updatesData[0];
  const currentVersion = latestUpdate?.version || "V2 Prebeta";


  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      // Redirect to browser with search query
      const url = searchQuery.includes('.') && !searchQuery.includes(' ')
        ? (searchQuery.startsWith('http') ? searchQuery : `https://${searchQuery}`)
        : `https://www.google.com/search?q=${encodeURIComponent(searchQuery)}`;
      
      navigate('/browser', { state: { initialUrl: url } });
    }
  };
  return (
    <div className="min-h-screen bg-background relative">
      <StarBackground />
      <Navigation />
      <GlobalChat />

      {/* Main Content */}
      <div className="min-h-screen flex items-center justify-center px-4 sm:px-6 pt-24 sm:pt-0">
        <main className="relative text-center space-y-8 sm:space-y-12 animate-fade-in w-full max-w-3xl">
          {/* Big Hideout Text */}
          <div className="relative">
            <h1 className="text-6xl sm:text-9xl md:text-[12rem] font-bold tracking-tight">
              <span className="text-foreground">Hideout</span>
              <span className="text-primary">.</span>
            </h1>
            <Link 
              to="/changelog" 
              className="text-lg text-muted-foreground mt-2 hover:text-primary transition-colors inline-block cursor-pointer"
            >
              {currentVersion}
            </Link>
          </div>

          {/* Search Bar with Button Inside */}
          <form onSubmit={handleSearch} className="relative w-full">
            <Search className="absolute left-4 sm:left-6 top-1/2 -translate-y-1/2 w-5 h-5 sm:w-6 sm:h-6 text-muted-foreground z-10" />
            <Input 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="search anything" 
              className="w-full h-12 sm:h-16 pl-12 sm:pl-16 pr-24 sm:pr-32 text-base sm:text-lg bg-card border-border transition-colors rounded-2xl"
            />
            <button 
              type="submit"
              className="absolute right-2 top-1/2 -translate-y-1/2 h-8 sm:h-12 px-4 sm:px-6 bg-primary text-primary-foreground font-semibold rounded-xl hover:bg-primary/90 transition-colors text-sm sm:text-base"
            >
              Search
            </button>
          </form>
          
          {/* Action Buttons */}
          <div className="flex flex-wrap justify-center gap-2 sm:gap-3">
            <ReportBugDialog />
            <RequestGameDialog variant="outline" />
            <Button
              onClick={() => window.open(informationData.github, "_blank")}
              variant="outline"
              className="gap-2"
            >
              <SiGithub className="w-4 h-4" />
              GitHub
            </Button>
            <Button
              onClick={() => window.open("https://discord.gg/HkbVraQH89", "_blank")}
              variant="outline"
              className="gap-2"
            >
              <SiDiscord className="w-4 h-4" />
              Discord
            </Button>
          </div>

          {/* Footer */}
          <footer className="mt-24 text-center space-y-4 text-sm text-muted-foreground">
            <p>&copy; {new Date().getFullYear()} Hideout Network. All rights reserved.</p>
          </footer>
        </main>
      </div>
    </div>
  );
};

export default Index;

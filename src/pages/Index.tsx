import { Navigation } from "@/components/Navigation";
import { Input } from "@/components/ui/input";
import { Link, useNavigate } from "react-router-dom";
import { useState } from "react";
import { GridBackground } from "@/components/GridBackground";
import { HomeShortcuts } from "@/components/HomeShortcuts";
import { usePageTitle } from "@/hooks/use-page-title";
import updatesData from "@/jsons/updates.json";
import { ChevronDown } from "lucide-react";
import { Banner728x90, shouldShowAds } from "@/components/AdManager";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

type SearchEngine = "google" | "duckduckgo" | "bing" | "yahoo" | "yandex" | "brave";

const SEARCH_ENGINES: { id: SearchEngine; name: string; icon: React.ReactNode; searchUrl: string }[] = [
  { 
    id: "google", 
    name: "Google",
    icon: (
      <svg viewBox="0 0 24 24" className="w-5 h-5 sm:w-6 sm:h-6">
        <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
        <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
        <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
        <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
      </svg>
    ),
    searchUrl: "https://www.google.com/search?q="
  },
  { 
    id: "duckduckgo", 
    name: "DuckDuckGo",
    icon: (
      <svg viewBox="0 0 24 24" className="w-5 h-5 sm:w-6 sm:h-6" fill="#DE5833">
        <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8zm-2-9.5c.55 0 1-.45 1-1s-.45-1-1-1-1 .45-1 1 .45 1 1 1zm4 0c.55 0 1-.45 1-1s-.45-1-1-1-1 .45-1 1 .45 1 1 1z"/>
      </svg>
    ),
    searchUrl: "https://duckduckgo.com/?q="
  },
  { 
    id: "bing", 
    name: "Bing",
    icon: (
      <svg viewBox="0 0 24 24" className="w-5 h-5 sm:w-6 sm:h-6">
        <path fill="#008373" d="M5 3v16.5l4 2.5 8-4.5v-4l-6-2.25V3z"/>
        <path fill="#00A88E" d="M9 9.75l6 2.25v4l-6 3.5z"/>
      </svg>
    ),
    searchUrl: "https://www.bing.com/search?q="
  },
  { 
    id: "yahoo", 
    name: "Yahoo",
    icon: (
      <svg viewBox="0 0 24 24" className="w-5 h-5 sm:w-6 sm:h-6" fill="#6001D2">
        <path d="M12 22c5.523 0 10-4.477 10-10S17.523 2 12 2 2 6.477 2 12s4.477 10 10 10zM8.5 7l3.5 5 3.5-5h2l-4.5 6.5V17h-2v-3.5L6.5 7h2z"/>
      </svg>
    ),
    searchUrl: "https://search.yahoo.com/search?p="
  },
  { 
    id: "yandex", 
    name: "Yandex",
    icon: (
      <svg viewBox="0 0 24 24" className="w-5 h-5 sm:w-6 sm:h-6" fill="#FF0000">
        <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1.5 15h-2v-5.5L8 7h2.25l2.25 3.5L14.75 7H17l-3.5 4.5V17z"/>
      </svg>
    ),
    searchUrl: "https://yandex.com/search/?text="
  },
  { 
    id: "brave", 
    name: "Brave",
    icon: (
      <svg viewBox="0 0 24 24" className="w-5 h-5 sm:w-6 sm:h-6" fill="#FB542B">
        <path d="M12 2L3 7v7c0 5 4 9 9 9s9-4 9-9V7l-9-5zm0 2.18l7 3.89v6.93c0 3.87-3.13 7-7 7s-7-3.13-7-7V8.07l7-3.89z"/>
      </svg>
    ),
    searchUrl: "https://search.brave.com/search?q="
  },
];

const Index = () => {
  usePageTitle('Home');
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState("");
  const [searchEngine, setSearchEngine] = useState<SearchEngine>("google");
  
  // Get latest version from updates
  const latestUpdate = updatesData[0];
  const currentVersion = latestUpdate?.version || "V2 Prebeta";
  
  const currentEngine = SEARCH_ENGINES.find(e => e.id === searchEngine) || SEARCH_ENGINES[0];


  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      // Redirect to browser with search query
      const url = searchQuery.includes('.') && !searchQuery.includes(' ')
        ? (searchQuery.startsWith('http') ? searchQuery : `https://${searchQuery}`)
        : `${currentEngine.searchUrl}${encodeURIComponent(searchQuery)}`;
      
      navigate('/browser', { state: { initialUrl: url } });
    }
  };
  return (
    <div className="min-h-screen bg-background relative flex flex-col">
      <GridBackground />
      <Navigation />

      {/* Main Content - Centered */}
      <div className="flex-1 flex items-center justify-center px-4 sm:px-6">
        <main className="relative text-center space-y-6 sm:space-y-8 animate-fade-in w-full max-w-3xl">
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
            {/* Search Engine Dropdown on the left */}
            <div className="absolute left-2 sm:left-3 top-1/2 -translate-y-1/2 z-20">
              <DropdownMenu>
                <DropdownMenuTrigger className="flex items-center gap-1 p-1.5 sm:p-2 rounded-lg hover:bg-muted/50 transition-colors">
                  {currentEngine.icon}
                  <ChevronDown className="w-3 h-3 text-muted-foreground" />
                </DropdownMenuTrigger>
                <DropdownMenuContent align="start" className="bg-card border-border">
                  {SEARCH_ENGINES.map((engine) => (
                    <DropdownMenuItem 
                      key={engine.id}
                      onClick={() => setSearchEngine(engine.id)}
                      className={`flex items-center gap-2 cursor-pointer ${searchEngine === engine.id ? 'bg-accent' : ''}`}
                    >
                      {engine.icon}
                      <span>{engine.name}</span>
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
            <div className="relative">
              {/* Animated glowing border line that travels around */}
              <div className="search-border-glow-outer" />
              <div className="search-border-glow" />
              
              <Input 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder={`Search ${currentEngine.name} or type URL`}
                className="relative w-full h-12 sm:h-16 pl-14 sm:pl-16 pr-24 sm:pr-32 text-base sm:text-lg bg-card border-transparent transition-colors rounded-2xl z-10"
              />
            </div>
            <button 
              type="submit"
              className="absolute right-2 top-1/2 -translate-y-1/2 h-8 sm:h-12 px-4 sm:px-6 bg-primary text-primary-foreground font-semibold rounded-xl hover:bg-primary/90 transition-colors text-sm sm:text-base z-20"
            >
              Search
            </button>
          </form>

          {/* Shortcuts */}
          <HomeShortcuts />
        </main>
      </div>

      {/* Ad Banner */}
      {shouldShowAds() && (
        <div className="w-full flex justify-center py-2">
          <Banner728x90 />
        </div>
      )}

      {/* Footer - Center */}
      <footer className="py-4 text-center">
        <p className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
          &copy; {new Date().getFullYear()} Hideout Network
          <span>•</span>
          <Link 
            to="/privacy-policy" 
            className="hover:text-primary transition-colors"
          >
            Privacy Policy
          </Link>
          <span>•</span>
          <Link 
            to="/credits" 
            className="hover:text-primary transition-colors"
          >
            Credits
          </Link>
        </p>
      </footer>
    </div>
  );
};

export default Index;

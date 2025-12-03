import { useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import { Navigation } from "@/components/Navigation";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search, Heart, Maximize, Shuffle } from "lucide-react";
import { FPSCounter } from "@/components/FPSCounter";
import { GlobalChat } from "@/components/GlobalChat";
import { StarBackground } from "@/components/StarBackground";
import { usePageTitle } from "@/hooks/use-page-title";
import { GameLoader } from "@/components/GameLoader";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

const GAME_URLS = [
  "https://cdn.jsdelivr.net/gh/gn-math/assets@main/zones.json",
  "https://cdn.jsdelivr.net/gh/gn-math/assets@latest/zones.json",
  "https://raw.githubusercontent.com/gn-math/assets/main/zones.json"
];
const HIDEOUT_GAMES_URL = "https://hideout-network.github.io/hideout-assets/games/games.json";
const HTML_URL = "https://cdn.jsdelivr.net/gh/gn-math/html@main";
const COVER_URL = "https://cdn.jsdelivr.net/gh/gn-math/covers@main";

type Game = {
  id: number;
  name: string;
  url: string;
  cover: string;
};

const Games = () => {
  const [games, setGames] = useState<Game[]>([]);
  const [searchParams, setSearchParams] = useSearchParams();
  const gameParam = searchParams.get("game");
  const currentGameName = gameParam ? games.find(g => g.name.toLowerCase().replace(/\s+/g, '-') === gameParam)?.name : null;
  usePageTitle(currentGameName || 'Games');
  const [searchQuery, setSearchQuery] = useState("");
  const [currentGame, setCurrentGame] = useState<Game | null>(null);
  const [isFavorited, setIsFavorited] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [favorites, setFavorites] = useState<string[]>([]);
  const [showGameLoader, setShowGameLoader] = useState(false);
  const [showFPS, setShowFPS] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    const settings = localStorage.getItem('hideout_settings');
    if (settings) {
      const parsed = JSON.parse(settings);
      setShowFPS(parsed.showFPS || false);
    }

    // Load games with fallback URLs
    loadGames();
  }, []);

  const loadGames = async () => {
    let lastError = null;
    let originalGames: Game[] = [];
    let gitlabGames: Game[] = [];

    // Load original games
    for (let url of GAME_URLS) {
      try {
        const response = await fetch(url + "?t=" + Date.now());
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        
        const data = await response.json();
        const validGames = data.filter((g: Game) => g.id > 0 && !g.url.startsWith("http"));
        originalGames = validGames;
        break;
      } catch (error) {
        lastError = error;
        continue;
      }
    }

    // Load Hideout games
    try {
      const response = await fetch(HIDEOUT_GAMES_URL + "?t=" + Date.now());
      if (response.ok) {
        const data = await response.json();
        const site = data.site || "https://hideout-games.onrender.com/public";
        
        gitlabGames = data.games?.map((g: any, index: number) => ({
          id: originalGames.length + index + 1000,
          name: `${g.name} (Gitlab)`,
          url: `${site}${g.gamePath}`,
          cover: `${site}${g.iconPath}`
        })) || [];
      }
    } catch (error) {
      console.warn("Failed to load Hideout games:", error);
    }

    if (originalGames.length === 0 && gitlabGames.length === 0) {
      setLoadError(lastError?.message || 'Unknown error');
      setIsLoading(false);
      return;
    }

    // Combine and randomize all games
    const allGames = [...originalGames, ...gitlabGames];
    const randomizedGames = allGames.sort(() => Math.random() - 0.5);
    
    setGames(randomizedGames);
    setIsLoading(false);
  };

  useEffect(() => {
    if (gameParam && games.length > 0) {
      const foundGame = games.find(
        (g) => g.name.toLowerCase().replace(/\s+/g, '-') === gameParam
      );
      setCurrentGame(foundGame || null);
      setShowGameLoader(true);
    } else if (!gameParam) {
      setCurrentGame(null);
      setShowGameLoader(false);
    }
  }, [gameParam, games]);

  useEffect(() => {
    const loadFavorites = async () => {
      // Always load local favorites first
      const localFavs: string[] = JSON.parse(localStorage.getItem('hideout_game_favorites') || '[]');
      let merged = [...localFavs];

      const storedUser = localStorage.getItem('hideout_user') || sessionStorage.getItem('hideout_user');
      if (storedUser) {
        try {
          const user = JSON.parse(storedUser);
          const { data } = await (supabase as any)
            .from('user_data')
            .select('data')
            .eq('user_id', user.id)
            .eq('data_type', 'game_favorites')
            .maybeSingle();

          if (data && Array.isArray(data.data)) {
            merged = Array.from(new Set([...localFavs, ...data.data]));
          }
        } catch (error) {
          // ignore DB errors, keep local
        }
      }

      setFavorites(merged);
      localStorage.setItem('hideout_game_favorites', JSON.stringify(merged));
    };

    loadFavorites();
  }, []);

  useEffect(() => {
    const checkFavorite = async () => {
      if (!currentGame) return;

      const localFavs: string[] = JSON.parse(localStorage.getItem('hideout_game_favorites') || '[]');

      const storedUser = localStorage.getItem('hideout_user') || sessionStorage.getItem('hideout_user');
      if (!storedUser) {
        setIsFavorited(localFavs.includes(currentGame.name));
        return;
      }

      try {
        const user = JSON.parse(storedUser);
        const { data } = await (supabase as any)
          .from('user_data')
          .select('data')
          .eq('user_id', user.id)
          .eq('data_type', 'game_favorites')
          .maybeSingle();

        setIsFavorited(localFavs.includes(currentGame.name) || (data && Array.isArray(data.data) && data.data.includes(currentGame.name)));
      } catch (error) {
        setIsFavorited(localFavs.includes(currentGame.name));
      }
    };

    checkFavorite();
  }, [currentGame]);

  const handleGameClick = (gameName: string) => {
    const gameSlug = gameName.toLowerCase().replace(/\s+/g, '-');
    setSearchParams({ game: gameSlug });
  };

  const handleFullscreen = () => {
    const iframe = document.getElementById("game-iframe") as HTMLIFrameElement;
    if (iframe?.requestFullscreen) {
      iframe.requestFullscreen();
    }
  };

  const filteredGames = games
    .filter((game) => game.name.toLowerCase().includes(searchQuery.toLowerCase()))
    .sort((a, b) => {
      const aIsFavorite = favorites.includes(a.name);
      const bIsFavorite = favorites.includes(b.name);
      
      if (aIsFavorite && !bIsFavorite) return -1;
      if (!aIsFavorite && bIsFavorite) return 1;
      return 0;
    });

  // Sync favorites across pages/components and tabs
  useEffect(() => {
    const onFavUpdated = (e: any) => {
      const favs: string[] = e.detail?.favorites || [];
      setFavorites(favs);
      if (currentGame) setIsFavorited(favs.includes(currentGame.name));
    };
    const onStorage = (e: StorageEvent) => {
      if (e.key === 'hideout_game_favorites') {
        try {
          const favs = JSON.parse(e.newValue || '[]');
          setFavorites(favs);
          if (currentGame) setIsFavorited(favs.includes(currentGame.name));
        } catch {}
      }
    };
    window.addEventListener('hideout:favorites-updated', onFavUpdated as any);
    window.addEventListener('storage', onStorage);
    return () => {
      window.removeEventListener('hideout:favorites-updated', onFavUpdated as any);
      window.removeEventListener('storage', onStorage);
    };
  }, [currentGame?.name]);

  const handleFavorite = async (gameName?: string) => {
    const targetGame = gameName || currentGame?.name;
    if (!targetGame) return;

    const isFav = favorites.includes(targetGame);
    let newFavorites: string[];

    if (isFav) {
      newFavorites = favorites.filter(f => f !== targetGame);
    } else {
      newFavorites = [...favorites, targetGame];
    }

    // Always update localStorage
    setFavorites(newFavorites);
    localStorage.setItem('hideout_game_favorites', JSON.stringify(newFavorites));
    window.dispatchEvent(new CustomEvent('hideout:favorites-updated', { detail: { favorites: newFavorites } }));
    if (currentGame?.name === targetGame) setIsFavorited(!isFav);

    // If user is logged in, also update database
    const storedUser = localStorage.getItem('hideout_user') || sessionStorage.getItem('hideout_user');
    if (storedUser) {
      try {
        const user = JSON.parse(storedUser);

        // Save entire favorites array to user_data
        await (supabase as any)
          .from('user_data')
          .upsert({
            user_id: user.id,
            data_type: 'game_favorites',
            data: newFavorites
          }, {
            onConflict: 'user_id,data_type'
          });
      } catch (error) {
        console.error('Error syncing favorites to database:', error);
      }
    }
  };

  const handleMysteryGame = () => {
    if (games.length === 0) return;
    const randomGame = games[Math.floor(Math.random() * games.length)];
    handleGameClick(randomGame.name);
  };

  // Load game content when a game is selected
  useEffect(() => {
    if (!currentGame) return;

    const loadGameContent = async () => {
      const isGitlabGame = currentGame.name.includes('(Gitlab)');
      const iframe = document.getElementById('game-iframe') as HTMLIFrameElement;
      
      if (!iframe) return;

      if (isGitlabGame) {
        // For Gitlab games, just set the src directly
        iframe.src = currentGame.url;
      } else {
        // For original games, fetch HTML and write to iframe
        const gameUrl = currentGame.url
          .replace('{HTML_URL}', HTML_URL)
          .replace('{COVER_URL}', COVER_URL);

        try {
          const response = await fetch(gameUrl + "?t=" + Date.now());
          const html = await response.text();

          if (iframe.contentDocument) {
            iframe.contentDocument.open();
            iframe.contentDocument.write(html);
            iframe.contentDocument.close();
          }
        } catch (error) {
          toast({
            title: "Error",
            description: "Failed to load game: " + (error as Error).message,
            variant: "destructive"
          });
        }
      }
    };

    loadGameContent();
  }, [currentGame, toast]);

  // If a game is selected, show the game player
  if (currentGame) {
    return (
      <div className="min-h-screen bg-background">
        {showFPS && <FPSCounter />}
        <Navigation />
        <main className="pt-24 px-4 sm:px-6 pb-12 max-w-4xl mx-auto">
          <div className="space-y-3">
            {/* Game Title with Icon */}
            <div className="w-full bg-card rounded-lg border border-border p-4 flex items-center gap-4">
              <div className="w-12 h-12 rounded-lg overflow-hidden flex-shrink-0">
                <img 
                  src={currentGame.cover.replace('{COVER_URL}', COVER_URL).replace('{HTML_URL}', HTML_URL)} 
                  alt={currentGame.name} 
                  className="w-full h-full object-cover" 
                />
              </div>
              <h1 className="text-2xl sm:text-3xl font-bold text-foreground">{currentGame.name}</h1>
            </div>
            
            {/* Game Iframe */}
            <div className="w-full bg-card rounded-lg overflow-hidden border border-border relative" style={{ aspectRatio: '16/9' }}>
              {showGameLoader && (
                <GameLoader
                  gameName={currentGame.name}
                  gameImage={currentGame.cover.replace('{COVER_URL}', COVER_URL).replace('{HTML_URL}', HTML_URL)}
                  onLoadComplete={() => setShowGameLoader(false)}
                />
              )}
              <iframe
                id="game-iframe"
                className="w-full h-full"
                title={currentGame.name}
                allowFullScreen
              />
            </div>

            {/* Controls */}
            <div className="w-full bg-card/50 backdrop-blur-md rounded-lg border border-border/50 p-4 flex gap-3">
              <Button
                onClick={handleFullscreen}
                disabled={showGameLoader}
                className="gap-2 hover:scale-105 transition-transform disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Maximize className="w-4 h-4" />
                Fullscreen
              </Button>
              <Button
                onClick={() => handleFavorite()}
                className={`gap-2 transition-colors ${
                  isFavorited 
                    ? 'bg-red-600 hover:bg-red-700 text-white' 
                    : 'bg-red-500/80 hover:bg-red-600 text-white'
                }`}
              >
                <Heart className={`w-4 h-4 ${isFavorited ? 'fill-current' : ''}`} />
                {isFavorited ? 'Favorited' : 'Favorite'}
              </Button>
            </div>
          </div>
        </main>
      </div>
    );
  }

  // Show games listing
  if (isLoading) {
    return (
      <div className="min-h-screen bg-background relative">
        <StarBackground />
        <Navigation />
        <GlobalChat />
        <main className="pt-24 px-4 sm:px-6 pb-12 max-w-7xl mx-auto relative z-10">
          <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
            <div className="animate-spin rounded-full h-16 w-16 border-4 border-primary border-t-transparent" />
            <p className="text-muted-foreground text-lg">Loading games...</p>
          </div>
        </main>
      </div>
    );
  }

  if (loadError) {
    return (
      <div className="min-h-screen bg-background relative">
        <StarBackground />
        <Navigation />
        <GlobalChat />
        <main className="pt-24 px-4 sm:px-6 pb-12 max-w-7xl mx-auto relative z-10">
          <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
            <p className="text-red-500 text-lg">Failed to load games: {loadError}</p>
            <Button onClick={() => window.location.reload()}>Retry</Button>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background relative">
      <StarBackground />
      <Navigation />
      <GlobalChat />

      <main className="pt-24 px-4 sm:px-6 pb-12 max-w-7xl mx-auto relative z-10">
        {/* Header */}
        <div className="space-y-6 mb-12 animate-fade-in">
          <div>
            <h1 className="text-4xl font-bold text-foreground mb-2">Games</h1>
            <p className="text-muted-foreground text-lg">
              Discover and play amazing games
            </p>
          </div>

          {/* Search */}
          <div className="flex gap-3 flex-wrap">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
              <Input 
                placeholder="Search games..." 
                className="pl-10 bg-card border-border transition-colors"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>

            <Button onClick={handleMysteryGame} variant="outline" className="gap-2 bg-card border-primary/50 hover:bg-primary/10">
              <Shuffle className="w-4 h-4" />
              Feeling Lucky
            </Button>
          </div>
        </div>

        {/* Games Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3">
          {filteredGames.map((game, index) => {
            const isFav = favorites.includes(game.name);
            
            return (
              <div
                key={`${game.id}-${game.name}`}
                className="group relative bg-card rounded-lg overflow-hidden border border-border hover:border-primary/50 hover:scale-105 transition-all duration-200 cursor-pointer animate-fade-in"
                style={{ animationDelay: `${index * 20}ms` }}
              >
                <div 
                  onClick={() => handleGameClick(game.name)}
                  className="aspect-square relative overflow-hidden bg-gradient-to-br from-muted/50 to-muted"
                >
                  <img 
                    src={game.cover.replace('{COVER_URL}', COVER_URL).replace('{HTML_URL}', HTML_URL)} 
                    alt={game.name} 
                    loading="lazy"
                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-200" 
                    onError={(e) => {
                      const target = e.target as HTMLImageElement;
                      target.style.display = 'none';
                    }}
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                  
                  {/* Heart Icon */}
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleFavorite(game.name);
                    }}
                    className="absolute bottom-2 right-2 w-8 h-8 rounded-full bg-black/60 backdrop-blur-sm flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-200 hover:bg-red-500/90 hover:scale-110 z-10"
                  >
                    <Heart className={`w-4 h-4 transition-all ${isFav ? 'fill-red-500 text-red-500' : 'text-white'}`} />
                  </button>
                </div>
                <div className="p-3 min-h-[70px] flex items-center justify-center">
                  <h3 className="text-sm font-medium text-foreground group-hover:text-primary transition-colors line-clamp-2 text-center">
                    {game.name}
                  </h3>
                </div>
              </div>
            );
          })}
        </div>

        {/* No results */}
        {!isLoading && filteredGames.length === 0 && (
          <div className="text-center py-12">
            <p className="text-muted-foreground">No games found matching your search</p>
          </div>
        )}
      </main>
    </div>
  );
};

export default Games;

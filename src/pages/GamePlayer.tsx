import { useEffect, useState } from "react";
import { useSearchParams, Navigate, useNavigate } from "react-router-dom";
import { Navigation } from "@/components/Navigation";
import { Button } from "@/components/ui/button";
import { Maximize, Heart } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { GameLoader } from "@/components/GameLoader";
import { BatteryWarning } from "@/components/BatteryWarning";
import { FPSCounter } from "@/components/FPSCounter";
import { StarBackground } from "@/components/StarBackground";

const ZONES_URLS = [
  "https://cdn.jsdelivr.net/gh/gn-math/assets@main/zones.json",
  "https://cdn.jsdelivr.net/gh/gn-math/assets@latest/zones.json",
  "https://raw.githubusercontent.com/gn-math/assets/main/zones.json"
];
const HTML_URL = "https://cdn.jsdelivr.net/gh/gn-math/html@main";
const COVER_URL = "https://cdn.jsdelivr.net/gh/gn-math/covers@main";

type Game = {
  id: number;
  name: string;
  url: string;
  cover: string;
};

const GamePlayer = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const gameParam = searchParams.get("game");
  const [games, setGames] = useState<Game[]>([]);
  const [game, setGame] = useState<Game | null>(null);
  const [isFavorite, setIsFavorite] = useState(false);
  const [user, setUser] = useState<any>(null);
  const [showLoader, setShowLoader] = useState(true);
  const [gameLoaded, setGameLoaded] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showFPS, setShowFPS] = useState(false);

  useEffect(() => {
    const settings = JSON.parse(localStorage.getItem('hideout_settings') || '{}');
    setShowFPS(settings.showFPS || false);

    // Load games with fallback URLs
    loadGames();
  }, []);

  const loadGames = async () => {
    for (let url of ZONES_URLS) {
      try {
        const response = await fetch(url + "?t=" + Date.now());
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        
        const data = await response.json();
        const validGames = data.filter((g: Game) => g.id > 0 && !g.url.startsWith("http"));
        
        setGames(validGames);
        return;
      } catch (error) {
        continue;
      }
    }
  };

  useEffect(() => {
    const storedUser = localStorage.getItem('hideout_user') || sessionStorage.getItem('hideout_user');
    if (storedUser) {
      try {
        setUser(JSON.parse(storedUser));
      } catch {
        setUser(null);
      }
    }
  }, []);

  useEffect(() => {
    if (gameParam && games.length > 0) {
      const foundGame = games.find(
        (g) => g.name.toLowerCase().replace(/\s+/g, '-') === gameParam
      );
      
      // Only reset loader if the game actually changed
      const gameChanged = !game || foundGame?.name !== game.name;
      
      setGame(foundGame || null);
      
      if (gameChanged) {
        setShowLoader(true);
        setGameLoaded(false);
      }
      
      // Check if favorite and load game content
      if (foundGame) {
        checkFavoriteStatus(foundGame.name);
        loadGameContent(foundGame);
      }
    }
  }, [gameParam, games]);

  const loadGameContent = async (currentGame: Game) => {
    const gameUrl = currentGame.url
      .replace('{HTML_URL}', HTML_URL)
      .replace('{COVER_URL}', COVER_URL);

    try {
      const response = await fetch(gameUrl + "?t=" + Date.now());
      const html = await response.text();

      const iframe = document.getElementById('game-iframe') as HTMLIFrameElement;
      if (iframe?.contentDocument) {
        iframe.contentDocument.open();
        iframe.contentDocument.write(html);
        iframe.contentDocument.close();
      }
    } catch (error) {
      toast.error('Failed to load game: ' + (error as Error).message);
    }
  };

  const checkFavoriteStatus = async (gameName: string) => {
    const localFavorites = JSON.parse(localStorage.getItem('hideout_game_favorites') || '[]');
    setIsFavorite(localFavorites.includes(gameName));
  };

  // Sync favorites across app via custom event + storage
  useEffect(() => {
    const updateFromLocal = () => {
      if (game) {
        const favs = JSON.parse(localStorage.getItem('hideout_game_favorites') || '[]');
        setIsFavorite(favs.includes(game.name));
      }
    };
    const onFavUpdated = () => updateFromLocal();
    const onStorage = (e: StorageEvent) => {
      if (e.key === 'hideout_game_favorites') updateFromLocal();
    };
    window.addEventListener('hideout:favorites-updated', onFavUpdated as any);
    window.addEventListener('storage', onStorage);
    return () => {
      window.removeEventListener('hideout:favorites-updated', onFavUpdated as any);
      window.removeEventListener('storage', onStorage);
    };
  }, [game?.name]);

  const toggleFavorite = async () => {
    if (!game) return;

    const localFavorites = JSON.parse(localStorage.getItem('hideout_game_favorites') || '[]');
    const newIsFavorite = !isFavorite;

    if (newIsFavorite) {
      localFavorites.push(game.name);
      toast.success(`${game.name} added to favorites`);
    } else {
      const index = localFavorites.indexOf(game.name);
      if (index > -1) localFavorites.splice(index, 1);
      toast.success(`${game.name} removed from favorites`);
    }

    localStorage.setItem('hideout_game_favorites', JSON.stringify(localFavorites));
    setIsFavorite(newIsFavorite);
    window.dispatchEvent(new CustomEvent('hideout:favorites-updated', { detail: { favorites: localFavorites } }));

    // Sync to database if logged in - save to user_data table
    if (user) {
      try {
        await (supabase as any)
          .from('user_data')
          .upsert({
            user_id: user.id,
            data_type: 'game_favorites',
            data: localFavorites
          }, {
            onConflict: 'user_id,data_type'
          });
      } catch (error) {
        console.error('Error syncing favorites:', error);
      }
    }
  };

  const handleFullscreen = () => {
    const iframe = document.getElementById("game-iframe") as HTMLIFrameElement;
    if (iframe) {
      if (!isFullscreen) {
        if (iframe.requestFullscreen) {
          iframe.requestFullscreen();
          setIsFullscreen(true);
        }
      } else {
        if (document.exitFullscreen) {
          document.exitFullscreen();
          setIsFullscreen(false);
        }
      }
    }
  };

  const handleLoaderComplete = () => {
    setShowLoader(false);
    setGameLoaded(true);
  };

  // Listen for fullscreen changes
  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };
    
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
  }, []);

  if (!gameParam) {
    return <Navigate to="/games" replace />;
  }

  if (!game) {
    return (
      <div className="min-h-screen bg-background">
        <Navigation />
        <main className="pt-24 px-6 pb-12 max-w-7xl mx-auto">
          <div className="text-center py-12">
            <h1 className="text-4xl font-bold text-foreground mb-4">Game Not Found</h1>
            <p className="text-muted-foreground">The game you're looking for doesn't exist.</p>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background relative">
      <StarBackground />
      <BatteryWarning isGamePage={true} />
      <div className="absolute top-0 left-0 right-0 z-50">
        <Navigation />
      </div>
      <main className="pt-24 px-6 pb-12 max-w-7xl mx-auto relative z-10">
        {showLoader && game && !gameLoaded && (
          <GameLoader
            gameName={game.name}
            gameImage={game.cover.replace('{COVER_URL}', COVER_URL).replace('{HTML_URL}', HTML_URL)}
            onLoadComplete={handleLoaderComplete}
          />
        )}
        
        <div className="space-y-6">
          <div className="flex items-center gap-4">
            <Button
              variant="outline"
              size="sm"
              onClick={() => navigate('/games')}
              className="gap-2"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="m12 19-7-7 7-7"/>
                <path d="M19 12H5"/>
              </svg>
              Back to Games
            </Button>
          </div>
          
          <div className="flex items-center gap-4">
            <img 
              src={game.cover.replace('{COVER_URL}', COVER_URL).replace('{HTML_URL}', HTML_URL)} 
              alt={game.name} 
              className="w-12 h-12 rounded-lg" 
            />
            <h1 className="text-4xl font-bold text-foreground">{game.name}</h1>
          </div>
          
          <div className="w-full aspect-video bg-card rounded-lg overflow-hidden border border-border relative">
            {showFPS && <FPSCounter />}
            <iframe
              id="game-iframe"
              className="w-full h-full"
              title={game.name}
              allowFullScreen
            />
          </div>

          <div className="flex justify-center gap-4">
            <Button
              onClick={handleFullscreen}
              disabled={showLoader}
              className="gap-2 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300 hover:scale-105 hover:shadow-lg"
              size="lg"
            >
              <Maximize className="w-5 h-5" />
              {isFullscreen ? "Exit Fullscreen" : "Fullscreen"}
            </Button>
            <Button
              onClick={toggleFavorite}
              variant={isFavorite ? "default" : "outline"}
              className="gap-2 transition-all duration-300 hover:scale-105 hover:shadow-lg"
              size="lg"
            >
              <Heart className={`w-5 h-5 ${isFavorite ? 'fill-current' : ''}`} />
              {isFavorite ? "Favorited" : "Favorite"}
            </Button>
          </div>
        </div>
      </main>
    </div>
  );
};

export default GamePlayer;

import { useEffect, useState } from "react";
import { useSearchParams, Navigate } from "react-router-dom";
import { Navigation } from "@/components/Navigation";
import { Button } from "@/components/ui/button";
import { Maximize, Heart } from "lucide-react";
import gamesData from "@/data/games.json";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

type Game = {
  name: string;
  icon: string;
  popularity: string[];
  categories: string[];
  gameLink: string;
};

const games: Game[] = gamesData;

const GamePlayer = () => {
  const [searchParams] = useSearchParams();
  const gameParam = searchParams.get("game");
  const [game, setGame] = useState<Game | null>(null);
  const [isFavorite, setIsFavorite] = useState(false);
  const [user, setUser] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [loadingProgress, setLoadingProgress] = useState({ current: 0, total: 100 });

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
    if (gameParam) {
      const foundGame = games.find(
        (g) => g.name.toLowerCase().replace(/\s+/g, '-') === gameParam
      );
      setGame(foundGame || null);
      
      // Start loading progress
      setIsLoading(true);
      setLoadingProgress({ current: 0, total: 100 });
      const interval = setInterval(() => {
        setLoadingProgress(prev => {
          if (prev.current >= prev.total) {
            clearInterval(interval);
            setTimeout(() => setIsLoading(false), 300);
            return prev;
          }
          return { ...prev, current: Math.min(prev.current + 1, prev.total) };
        });
      }, 20);
      
      // Check if favorite
      if (foundGame) {
        checkFavoriteStatus(foundGame.name);
      }
      
      return () => clearInterval(interval);
    }
  }, [gameParam, user]);

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
      if (iframe.requestFullscreen) {
        iframe.requestFullscreen();
      }
    }
  };

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
    <div className="min-h-screen bg-background">
      <Navigation />
      <main className="pt-24 px-6 pb-12 max-w-7xl mx-auto">
        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-20">
            <div className="w-full max-w-md space-y-4">
              <div className="text-center">
                <h2 className="text-2xl font-bold text-foreground mb-2">Loading {game.name}</h2>
                <p className="text-muted-foreground">
                  {loadingProgress.current} / {loadingProgress.total}
                  {loadingProgress.current >= loadingProgress.total && " - Finalizing..."}
                </p>
              </div>
              <div className="w-full bg-muted rounded-full h-3 overflow-hidden">
                <div 
                  className="h-full bg-primary transition-all duration-300 ease-out"
                  style={{ width: `${(loadingProgress.current / loadingProgress.total) * 100}%` }}
                />
              </div>
            </div>
          </div>
        ) : (
          <div className="space-y-6">
            <h1 className="text-4xl font-bold text-foreground">{game.name}</h1>
            
            <div className="w-full aspect-video bg-card rounded-lg overflow-hidden border border-border">
              <iframe
                id="game-iframe"
                src={game.gameLink}
                className="w-full h-full"
                title={game.name}
                allowFullScreen
              />
            </div>

            <div className="flex justify-center gap-4">
              <Button
                onClick={handleFullscreen}
                className="gap-2"
                size="lg"
              >
                <Maximize className="w-5 h-5" />
                Fullscreen
              </Button>
              <Button
                onClick={toggleFavorite}
                variant={isFavorite ? "default" : "outline"}
                className="gap-2"
                size="lg"
              >
                <Heart className={`w-5 h-5 ${isFavorite ? 'fill-current' : ''}`} />
                {isFavorite ? "Favorited" : "Favorite"}
              </Button>
            </div>
          </div>
        )}
      </main>
    </div>
  );
};

export default GamePlayer;

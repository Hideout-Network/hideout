import { useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import { Navigation } from "@/components/Navigation";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Search, TrendingUp, Flame, Heart, Sparkles, Filter, Maximize } from "lucide-react";
import { GlobalChat } from "@/components/GlobalChat";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import gamesData from "@/data/games.json";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

type Game = {
  name: string;
  icon: string;
  popularity: string[];
  categories: string[];
  gameLink: string;
};

const games: Game[] = gamesData;

const getBadgeConfig = (popularity: string) => {
  switch (popularity) {
    case "hot":
      return { variant: "default" as const, icon: Flame, className: "bg-red-500/20 text-red-400 border-red-500/30" };
    case "trending":
      return { variant: "default" as const, icon: TrendingUp, className: "bg-blue-500/20 text-blue-400 border-blue-500/30" };
    case "popular":
      return { variant: "default" as const, icon: TrendingUp, className: "bg-green-500/20 text-green-400 border-green-500/30" };
    case "new":
      return { variant: "default" as const, icon: Sparkles, className: "bg-purple-500/20 text-purple-400 border-purple-500/30" };
    default:
      return { variant: "secondary" as const, icon: Heart, className: "" };
  }
};

const Games = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const gameParam = searchParams.get("game");
  const [searchQuery, setSearchQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [currentGame, setCurrentGame] = useState<Game | null>(null);
  const [isFavorited, setIsFavorited] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [loadingProgress, setLoadingProgress] = useState({ current: 0, total: 0 });
  const [iconsLoaded, setIconsLoaded] = useState<Record<string, boolean>>({});
  const [favorites, setFavorites] = useState<string[]>([]);
  const { toast } = useToast();

  useEffect(() => {
    if (gameParam) {
      const foundGame = games.find(
        (g) => g.name.toLowerCase().replace(/\s+/g, '-') === gameParam
      );
      setCurrentGame(foundGame || null);
      setIsLoading(false);
    } else {
      setCurrentGame(null);
      // Quick load without progress counter (reverted behavior)
      const loadIcons = async () => {
        setIsLoading(true);
        const loaded: Record<string, boolean> = {};
        games.forEach((game) => { if (game.icon) loaded[game.name] = true; });
        setIconsLoaded(loaded);
        setIsLoading(false);
      };

      loadIcons();
    }
  }, [gameParam]);

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
    .filter((game) => {
      const matchesSearch = game.name.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesCategory = categoryFilter === "all" || game.categories.includes(categoryFilter);
      return matchesSearch && matchesCategory;
    })
    .sort((a, b) => {
      const aIsFavorite = favorites.includes(a.name);
      const bIsFavorite = favorites.includes(b.name);
      
      if (aIsFavorite && !bIsFavorite) return -1;
      if (!aIsFavorite && bIsFavorite) return 1;
      
      const aIsHotOrPopular = a.popularity.includes("hot") || a.popularity.includes("popular");
      const bIsHotOrPopular = b.popularity.includes("hot") || b.popularity.includes("popular");
      if (aIsHotOrPopular && !bIsHotOrPopular) return -1;
      if (!aIsHotOrPopular && bIsHotOrPopular) return 1;
      return 0;
    });

  const allCategories = Array.from(new Set(games.flatMap(game => game.categories)));

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

  // If a game is selected, show the game player
  if (currentGame) {
    return (
      <div className="min-h-screen bg-background">
        <Navigation />
        <main className="pt-24 px-4 sm:px-6 pb-12 max-w-4xl mx-auto">
          <div className="space-y-3">
            {/* Game Title with Icon */}
            <div className="w-full bg-card rounded-lg border border-border p-4 flex items-center gap-4">
              <div className="w-12 h-12 rounded-lg overflow-hidden flex-shrink-0">
                <img src={currentGame.icon} alt={currentGame.name} className="w-full h-full object-cover" />
              </div>
              <h1 className="text-2xl sm:text-3xl font-bold text-foreground">{currentGame.name}</h1>
            </div>
            
            {/* Game Iframe */}
            <div className="w-full bg-card rounded-lg overflow-hidden border border-border" style={{ aspectRatio: '16/9' }}>
              <iframe
                id="game-iframe"
                src={currentGame.gameLink}
                className="w-full h-full"
                title={currentGame.name}
                allowFullScreen
              />
            </div>

            {/* Controls */}
            <div className="w-full bg-card rounded-lg border border-border p-4 flex gap-3">
              <Button
                onClick={handleFullscreen}
                className="gap-2 hover:scale-105 transition-transform"
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

            {/* Login Prompt Dialog - Removed since favorites work without login now */}
          </div>
        </main>
      </div>
    );
  }

  // Show games listing
  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <Navigation />
        <GlobalChat />
        <main className="pt-24 px-4 sm:px-6 pb-12 max-w-7xl mx-auto">
          <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
            <div className="animate-spin rounded-full h-16 w-16 border-4 border-primary border-t-transparent" />
            <p className="text-muted-foreground text-lg">
              Loading games...
            </p>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      <GlobalChat />

      <main className="pt-24 px-4 sm:px-6 pb-12 max-w-7xl mx-auto">
        {/* Header */}
        <div className="space-y-6 mb-12 animate-fade-in">
          <div>
            <h1 className="text-4xl font-bold text-foreground mb-2">Games</h1>
            <p className="text-muted-foreground text-lg">
              Discover and play amazing games
            </p>
          </div>

          {/* Search and Filters */}
          <div className="flex gap-3">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
              <Input 
                placeholder="Search games..." 
                className="pl-10 bg-card border-border transition-colors"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>

            {/* Category Filter */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" className="gap-2 bg-card border-border">
                  <Filter className="w-4 h-4" />
                  {categoryFilter === "all" ? "All" : categoryFilter}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="bg-card border-border z-50">
                <DropdownMenuItem onClick={() => setCategoryFilter("all")}>
                  All
                </DropdownMenuItem>
                {allCategories.map((category) => (
                  <DropdownMenuItem key={category} onClick={() => setCategoryFilter(category)}>
                    {category}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>

        {/* Games Grid - Poki style */}
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3">
          {filteredGames.map((game, index) => {
            const badgeInfo = game.popularity[0] ? getBadgeConfig(game.popularity[0]) : null;
            const BadgeIcon = badgeInfo?.icon;
            const isFav = favorites.includes(game.name);
            
            return (
              <div
                key={game.name}
                className="group relative bg-card rounded-lg overflow-hidden border border-border hover:border-primary/50 hover:scale-105 transition-all duration-200 cursor-pointer animate-fade-in"
                style={{ animationDelay: `${index * 20}ms` }}
              >
                <div 
                  onClick={() => handleGameClick(game.name)}
                  className="aspect-square relative overflow-hidden bg-gradient-to-br from-muted/50 to-muted"
                >
                  <img 
                    src={game.icon} 
                    alt={game.name} 
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
                <div 
                  onClick={() => handleGameClick(game.name)}
                  className="p-2"
                >
                  <h3 className="text-sm font-semibold truncate group-hover:text-primary transition-colors">
                    {game.name}
                  </h3>
                  <div className="flex items-center gap-2">
                    {badgeInfo && BadgeIcon && (
                      <div className={`${badgeInfo.className} px-1.5 py-0.5 rounded flex items-center gap-1 animate-pulse`}>
                        <BadgeIcon className="w-2.5 h-2.5" />
                        <span className="text-[10px] font-bold uppercase">{game.popularity[0]}</span>
                      </div>
                    )}
                    {game.categories[0] && (
                      <p className="text-xs text-muted-foreground truncate flex-1">
                        {game.categories[0]}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* No results */}
        {filteredGames.length === 0 && (
          <div className="text-center py-12">
            <p className="text-muted-foreground">No games found matching your filters</p>
          </div>
        )}
      </main>
    </div>
  );
};

export default Games;

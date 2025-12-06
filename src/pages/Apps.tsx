import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Navigation } from "@/components/Navigation";
import { Input } from "@/components/ui/input";
import { Search, Heart, Shuffle } from "lucide-react";
import { GlobalChat } from "@/components/GlobalChat";
import { RequestAppDialog } from "@/components/RequestAppDialog";
import { supabase } from "@/integrations/supabase/client";
import { usePageTitle } from "@/hooks/use-page-title";
import { GridBackground } from "@/components/GridBackground";
import { Button } from "@/components/ui/button";
import { Banner728x90, shouldShowAds } from "@/components/AdManager";
import appsData from "@/jsons/apps.json";

type App = {
  name: string;
  icon: string;
  description: string;
  link: string;
};

const apps: App[] = appsData as any;

const Apps = () => {
  usePageTitle('Apps');
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState("");
  const [favorites, setFavorites] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadFavorites = async () => {
      const storedUser = localStorage.getItem('hideout_user') || sessionStorage.getItem('hideout_user');
      if (!storedUser) {
        const localFavs = JSON.parse(localStorage.getItem('hideout_app_favorites') || '[]');
        setFavorites(localFavs);
      } else {
        try {
          const user = JSON.parse(storedUser);
          const { data } = await (supabase as any)
            .from('user_data')
            .select('data')
            .eq('user_id', user.id)
            .eq('data_type', 'app_favorites')
            .maybeSingle();

          if (data && Array.isArray(data.data)) {
            setFavorites(data.data);
            localStorage.setItem('hideout_app_favorites', JSON.stringify(data.data));
          } else {
            const localFavs = JSON.parse(localStorage.getItem('hideout_app_favorites') || '[]');
            setFavorites(localFavs);
          }
        } catch (error) {
          const localFavs = JSON.parse(localStorage.getItem('hideout_app_favorites') || '[]');
          setFavorites(localFavs);
        }
      }
    };

    const preloadImages = () => {
      const imageUrls = apps.map(app => app.icon);
      let loadedCount = 0;
      const totalImages = imageUrls.length;
      
      if (totalImages === 0) {
        setIsLoading(false);
        return;
      }

      imageUrls.forEach(url => {
        const img = new Image();
        img.onload = img.onerror = () => {
          loadedCount++;
          if (loadedCount >= totalImages) {
            setIsLoading(false);
          }
        };
        img.src = url;
      });

      // Fallback timeout in case images take too long
      setTimeout(() => setIsLoading(false), 10000);
    };

    loadFavorites();
    preloadImages();
  }, []);

  const handleFavorite = async (appName: string) => {
    const isFav = favorites.includes(appName);
    let newFavorites: string[];

    if (isFav) {
      newFavorites = favorites.filter(f => f !== appName);
    } else {
      newFavorites = [...favorites, appName];
    }

    setFavorites(newFavorites);
    localStorage.setItem('hideout_app_favorites', JSON.stringify(newFavorites));

    const storedUser = localStorage.getItem('hideout_user') || sessionStorage.getItem('hideout_user');
    if (storedUser) {
      try {
        const user = JSON.parse(storedUser);

        // Save entire favorites array to user_data
        await (supabase as any)
          .from('user_data')
          .upsert({
            user_id: user.id,
            data_type: 'app_favorites',
            data: newFavorites
          }, {
            onConflict: 'user_id,data_type'
          });
      } catch (error) {
        console.error('Error syncing favorites to database:', error);
      }
    }
  };

  const filteredApps = apps
    .filter((app) => app.name.toLowerCase().includes(searchQuery.toLowerCase()))
    .sort((a, b) => {
      const aIsFavorite = favorites.includes(a.name);
      const bIsFavorite = favorites.includes(b.name);
      
      if (aIsFavorite && !bIsFavorite) return -1;
      if (!aIsFavorite && bIsFavorite) return 1;
      return 0;
    });

  const handleFeelingLucky = () => {
    const randomApp = apps[Math.floor(Math.random() * apps.length)];
    window.location.href = `/browser?url=${encodeURIComponent(randomApp.link)}`;
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <Navigation />
        <GlobalChat />
        <main className="pt-24 px-4 sm:px-6 pb-12 max-w-7xl mx-auto">
          <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
            <div className="animate-spin rounded-full h-16 w-16 border-4 border-primary border-t-transparent" />
            <p className="text-muted-foreground text-lg">Loading apps...</p>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background relative">
      <GridBackground />
      <Navigation />
      <GlobalChat />

      <main className="pt-24 px-4 sm:px-6 pb-12 max-w-7xl mx-auto relative z-10">
        {/* Header */}
        <div className="space-y-6 mb-12 animate-fade-in">
          <div>
            <h1 className="text-4xl font-bold text-foreground mb-2">Apps</h1>
            <p className="text-muted-foreground text-lg">
              Discover useful applications
            </p>
          </div>

          {/* Search */}
          <div className="flex gap-3 flex-wrap">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
              <Input 
                placeholder="Search apps..." 
                className="pl-10 bg-card border-border transition-colors"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>

            <Button onClick={handleFeelingLucky} variant="outline" className="gap-2 bg-card border-primary/50 hover:bg-primary/10">
              <Shuffle className="w-4 h-4" />
              Feeling Lucky
            </Button>
          </div>
        </div>

        {/* Apps Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3">
          {filteredApps.map((app, index) => {
            const isFav = favorites.includes(app.name);
            
            return (
              <div
                key={app.name}
                className="group relative rounded-lg overflow-hidden cursor-pointer animate-fade-in"
                style={{ animationDelay: `${index * 20}ms` }}
              >
                <a
                  href={`/browser?url=${encodeURIComponent(app.link)}`}
                  className="block"
                >
                  <div className="aspect-square relative overflow-hidden bg-gradient-to-br from-muted/50 to-muted rounded-lg">
                    <img 
                      src={app.icon} 
                      alt={app.name} 
                      className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-200" 
                      onError={(e) => {
                        const target = e.target as HTMLImageElement;
                        target.style.display = 'none';
                      }}
                    />
                    
                    {/* Dark gradient overlay with app name - only visible on hover */}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-end p-3">
                      <h3 className="text-white font-semibold text-sm line-clamp-2 drop-shadow-lg">
                        {app.name}
                      </h3>
                    </div>
                    
                    {/* Heart Icon - Top Right */}
                    <button
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        handleFavorite(app.name);
                      }}
                      className={`absolute top-2 right-2 w-8 h-8 rounded-full bg-black/80 backdrop-blur-sm flex items-center justify-center transition-all duration-200 hover:bg-red-500/90 hover:scale-110 z-10 ${
                        isFav ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'
                      }`}
                    >
                      <Heart className={`w-4 h-4 transition-all ${isFav ? 'fill-red-500 text-red-500' : 'text-white'}`} />
                    </button>
                  </div>
                </a>
              </div>
            );
          })}
        </div>

        {/* Bottom Ad Banner */}
        {shouldShowAds() && (
          <div className="w-full flex justify-center mt-8">
            <Banner728x90 />
          </div>
        )}

        {/* No results */}
        {filteredApps.length === 0 && (
          <div className="text-center py-12">
            <p className="text-muted-foreground">No apps found matching your search</p>
          </div>
        )}
      </main>
    </div>
  );
};

export default Apps;
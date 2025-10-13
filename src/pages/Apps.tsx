import { useState, useEffect } from "react";
import { Navigation } from "@/components/Navigation";
import { Input } from "@/components/ui/input";
import { Search, Filter, Heart } from "lucide-react";
import { GlobalChat } from "@/components/GlobalChat";
import { supabase } from "@/integrations/supabase/client";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import appsData from "@/data/apps.json";

type App = {
  name: string;
  icon: string;
  category: string;
  description: string;
  link: string;
};

const apps: App[] = appsData as any;

const Apps = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [favorites, setFavorites] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadFavorites = async () => {
      const storedUser = localStorage.getItem('hideout_user') || sessionStorage.getItem('hideout_user');
      if (!storedUser) {
        // Load from localStorage if not logged in
        const localFavs = JSON.parse(localStorage.getItem('hideout_app_favorites') || '[]');
        setFavorites(localFavs);
        setIsLoading(false);
        return;
      }

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
          // Load from localStorage if no database data
          const localFavs = JSON.parse(localStorage.getItem('hideout_app_favorites') || '[]');
          setFavorites(localFavs);
        }
      } catch (error) {
        const localFavs = JSON.parse(localStorage.getItem('hideout_app_favorites') || '[]');
        setFavorites(localFavs);
      } finally {
        setIsLoading(false);
      }
    };

    // Show a very short loading state even if not logged in for visual consistency
    const timer = setTimeout(() => setIsLoading(false), 350);
    loadFavorites();
    return () => clearTimeout(timer);
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
    .filter((app) => {
      const matchesSearch = app.name.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesCategory = categoryFilter === "all" || app.category === categoryFilter;
      return matchesSearch && matchesCategory;
    })
    .sort((a, b) => {
      const aIsFavorite = favorites.includes(a.name);
      const bIsFavorite = favorites.includes(b.name);
      
      if (aIsFavorite && !bIsFavorite) return -1;
      if (!aIsFavorite && bIsFavorite) return 1;
      return 0;
    });

  const allCategories = Array.from(new Set(apps.map(app => app.category)));

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
    <div className="min-h-screen bg-background">
      <Navigation />
      <GlobalChat />

      <main className="pt-24 px-4 sm:px-6 pb-12 max-w-7xl mx-auto">
        {/* Header */}
        <div className="space-y-6 mb-12 animate-fade-in">
          <div>
            <h1 className="text-4xl font-bold text-foreground mb-2">Apps</h1>
            <p className="text-muted-foreground text-lg">
              Discover useful applications
            </p>
          </div>

          {/* Search and Filters */}
          <div className="flex gap-3">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
              <Input 
                placeholder="Search apps..." 
                className="pl-10 bg-card border-border"
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

        {/* Apps Grid - Poki style */}
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3">
          {filteredApps.map((app, index) => {
            const isFav = favorites.includes(app.name);
            
            return (
              <div
                key={app.name}
                className="group relative bg-card rounded-lg overflow-hidden border border-border hover:border-primary/50 hover:scale-105 transition-all duration-200 cursor-pointer animate-fade-in"
                style={{ animationDelay: `${index * 20}ms` }}
              >
                <a
                  href={`/browser?url=${encodeURIComponent(app.link)}`}
                  className="block"
                >
                  <div className="aspect-square relative overflow-hidden bg-gradient-to-br from-muted/50 to-muted">
                    <img 
                      src={app.icon} 
                      alt={app.name} 
                      className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-200" 
                      onError={(e) => {
                        const target = e.target as HTMLImageElement;
                        target.style.display = 'none';
                      }}
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                    
                    {/* Heart Icon - Bottom Right */}
                    <button
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        handleFavorite(app.name);
                      }}
                      className="absolute bottom-2 right-2 w-8 h-8 rounded-full bg-black/80 backdrop-blur-sm flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-200 hover:bg-red-500/90 hover:scale-110 z-10"
                    >
                      <Heart className={`w-4 h-4 transition-all ${isFav ? 'fill-red-500 text-red-500' : 'text-white'}`} />
                    </button>
                  </div>
                </a>
                
                <a
                  href={`/browser?url=${encodeURIComponent(app.link)}`}
                  className="block p-2"
                >
                  <h3 className="text-sm font-semibold truncate group-hover:text-primary transition-colors">
                    {app.name}
                  </h3>
                  <p className="text-xs text-muted-foreground truncate">
                    {app.category}
                  </p>
                </a>
              </div>
            );
          })}
        </div>

        {/* No results */}
        {filteredApps.length === 0 && (
          <div className="text-center py-12">
            <p className="text-muted-foreground">No apps found matching your filters</p>
          </div>
        )}
      </main>
    </div>
  );
};

export default Apps;
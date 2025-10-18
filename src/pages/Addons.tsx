import { useState, useEffect } from 'react';
import { ArrowLeft, Download, Check, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { usePageTitle } from '@/hooks/use-page-title';
import { toast } from 'sonner';
import { StarBackground } from '@/components/StarBackground';

type Addon = {
  id: string;
  name: string;
  author: string;
  version: string;
  description: string;
  icon: string;
  scriptUrl: string;
  rating?: number;
  users?: string;
};

import addonsDataImport from '@/data/addons/addons.json';

const addonsData: Addon[] = addonsDataImport;

const Addons = () => {
  usePageTitle('Add-Ons');
  const [searchQuery, setSearchQuery] = useState('');
  const [installedAddons, setInstalledAddons] = useState<string[]>([]);
  const [installingAddon, setInstallingAddon] = useState<string | null>(null);
  const [installProgress, setInstallProgress] = useState(0);

  useEffect(() => {
    const saved = localStorage.getItem('hideout_installed_addons');
    if (saved) {
      setInstalledAddons(JSON.parse(saved));
    }
  }, []);

  const filteredAddons = addonsData.filter(addon =>
    addon.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    addon.description.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const installedItems = filteredAddons.filter(addon => installedAddons.includes(addon.scriptUrl));
  const availableItems = filteredAddons.filter(addon => !installedAddons.includes(addon.scriptUrl));

  const handleInstall = async (addon: Addon) => {
    setInstallingAddon(addon.id);
    setInstallProgress(0);

    // Simulate download progress
    const interval = setInterval(() => {
      setInstallProgress(prev => {
        if (prev >= 100) {
          clearInterval(interval);
          return 100;
        }
        return prev + 10;
      });
    }, 100);

    // Wait for progress to complete
    await new Promise(resolve => setTimeout(resolve, 1100));

    const newInstalled = [...installedAddons, addon.scriptUrl];
    setInstalledAddons(newInstalled);
    localStorage.setItem('hideout_installed_addons', JSON.stringify(newInstalled));
    
    // Load the script
    const script = document.createElement('script');
    script.src = addon.scriptUrl;
    script.id = `addon-${addon.id}`;
    document.body.appendChild(script);

    toast.success(`${addon.name} installed successfully!`);
    setInstallingAddon(null);
    setInstallProgress(0);
  };

  const handleUninstall = (addon: Addon) => {
    const newInstalled = installedAddons.filter(url => url !== addon.scriptUrl);
    setInstalledAddons(newInstalled);
    localStorage.setItem('hideout_installed_addons', JSON.stringify(newInstalled));

    // Remove the script
    const script = document.getElementById(`addon-${addon.id}`);
    if (script) {
      script.remove();
    }

    toast.success(`${addon.name} uninstalled`);
  };

  return (
    <div className="min-h-screen bg-background relative">
      <StarBackground />
      
      {/* Header */}
      <header className="sticky top-0 z-50 bg-background/95 backdrop-blur border-b border-border">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center gap-4">
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={() => window.history.back()}
          >
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div className="flex-1">
            <h1 className="text-2xl font-bold">Add-Ons</h1>
          </div>
          <Input
            placeholder="Search add-ons..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="max-w-md"
          />
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 py-8 relative z-10">
        {/* Installed Add-ons Section */}
        {installedItems.length > 0 && (
          <section className="mb-12">
            <h2 className="text-xl font-bold mb-4">Installed</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {installedItems.map((addon) => (
                <Card key={addon.id} className="p-4 hover:border-primary/50 transition-colors">
                  <div className="flex gap-4">
                    <img
                      src={addon.icon}
                      alt={addon.name}
                      className="w-20 h-20 rounded-lg object-cover"
                    />
                    <div className="flex-1 min-w-0">
                      <h3 className="font-bold text-lg truncate">{addon.name}</h3>
                      <p className="text-xs text-muted-foreground">by {addon.author}</p>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleUninstall(addon)}
                        className="mt-2 border-red-500/50 text-red-500 hover:bg-red-500/10 hover:text-red-400"
                      >
                        Remove
                      </Button>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          </section>
        )}

        {/* Available Add-ons */}
        <section>
          <h2 className="text-xl font-bold mb-4">All Add-Ons</h2>
          
          {availableItems.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-muted-foreground">
                {searchQuery ? 'No add-ons found matching your search' : 'No add-ons available yet'}
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {availableItems.map((addon) => (
                <Card key={addon.id} className="overflow-hidden hover:border-primary/50 transition-all hover:shadow-lg">
                  <div className="aspect-video bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center">
                    <img
                      src={addon.icon}
                      alt={addon.name}
                      className="w-28 h-28 object-cover rounded-lg"
                    />
                  </div>
                  <div className="p-4 space-y-3">
                    <div>
                      <h3 className="font-bold text-lg line-clamp-1">{addon.name}</h3>
                      <p className="text-xs text-muted-foreground">by {addon.author}</p>
                    </div>
                    <p className="text-sm text-muted-foreground line-clamp-2 min-h-[2.5rem]">
                      {addon.description}
                    </p>
                    <div className="flex items-center justify-between text-xs text-muted-foreground">
                      <span>v{addon.version}</span>
                      {addon.users && <span>{addon.users} users</span>}
                    </div>
                    
                    {installingAddon === addon.id ? (
                      <div className="space-y-2">
                        <Progress value={installProgress} className="h-2" />
                        <p className="text-xs text-center text-muted-foreground">
                          Installing... {installProgress}%
                        </p>
                      </div>
                    ) : (
                      <Button
                        onClick={() => handleInstall(addon)}
                        className="w-full gap-2"
                      >
                        <Download className="w-4 h-4" />
                        Add
                      </Button>
                    )}
                  </div>
                </Card>
              ))}
            </div>
          )}
        </section>
      </main>
    </div>
  );
};

export default Addons;
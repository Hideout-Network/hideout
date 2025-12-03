import { useState, useEffect } from 'react';
import { ArrowLeft, Download, Check, Loader2, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { usePageTitle } from '@/hooks/use-page-title';
import { toast } from 'sonner';
import { StarBackground } from '@/components/StarBackground';

type Addon = {
  id: string;
  name: string;
  author: string;
  version: string;
  description: string;
  iconPath: string;
  scriptUrl: string;
  rating?: number;
  users?: string;
  fileSize?: string;
  isImported?: boolean;
};

type AddonsData = {
  site: string;
  addons: Addon[];
};

const Addons = () => {
  usePageTitle('Add-Ons');
  const [addonsData, setAddonsData] = useState<AddonsData | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [installedAddons, setInstalledAddons] = useState<string[]>([]);
  const [installingAddon, setInstallingAddon] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [importDialogOpen, setImportDialogOpen] = useState(false);
  const [importScript, setImportScript] = useState('');
  const [importedAddons, setImportedAddons] = useState<Addon[]>([]);

  useEffect(() => {
    const loadAddons = async () => {
      setIsLoading(true);
      try {
        // Fetch addons data from remote URL
        const response = await fetch('https://hideout-network.github.io/hideout-assets/addons/addons.json');
        const data = await response.json();
        setAddonsData(data);

        // Load installed addons from localStorage
        const saved = localStorage.getItem('hideout_installed_addons');
        if (saved) {
          setInstalledAddons(JSON.parse(saved));
        }

        // Load imported addons from localStorage
        const importedSaved = localStorage.getItem('imported_addons');
        if (importedSaved) {
          setImportedAddons(JSON.parse(importedSaved));
        }
      } catch (error) {
        console.error('Failed to load addons:', error);
        toast.error('Failed to load add-ons data');
      } finally {
        setIsLoading(false);
      }
    };
    loadAddons();
  }, []);

  if (isLoading || !addonsData) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="w-12 h-12 animate-spin text-primary" />
          <p className="text-muted-foreground">Loading add-ons...</p>
        </div>
      </div>
    );
  }

  const addons = addonsData.addons;
  const addonSite = addonsData.site;

  // Combine imported addons with regular addons
  const allAddons = [...addons, ...importedAddons];

  const filteredAddons = allAddons.filter(addon =>
    addon.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    addon.description.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const installedItems = filteredAddons.filter(addon => 
    addon.isImported || installedAddons.includes(addon.scriptUrl)
  );
  const availableItems = filteredAddons.filter(addon => 
    !addon.isImported && !installedAddons.includes(addon.scriptUrl)
  );

  const handleInstall = async (addon: Addon) => {
    setInstallingAddon(addon.id);

    try {
      const newInstalled = [...installedAddons, addon.scriptUrl];
      setInstalledAddons(newInstalled);
      localStorage.setItem('hideout_installed_addons', JSON.stringify(newInstalled));

      toast.success(`${addon.name} installed!`);
      setInstallingAddon(null);
    } catch (error) {
      toast.error(`Failed to install ${addon.name}`);
      setInstallingAddon(null);
    }
  };

  const handleUninstall = (addon: Addon) => {
    if (addon.isImported) {
      // Remove from imported addons
      const newImported = importedAddons.filter(a => a.id !== addon.id);
      setImportedAddons(newImported);
      localStorage.setItem('imported_addons', JSON.stringify(newImported));
    } else {
      const newInstalled = installedAddons.filter(url => url !== addon.scriptUrl);
      setInstalledAddons(newInstalled);
      localStorage.setItem('hideout_installed_addons', JSON.stringify(newInstalled));
    }

    // Remove the script
    const script = document.getElementById(`addon-${addon.id}`);
    if (script) {
      script.remove();
    }

    toast.success(`${addon.name} uninstalled`);
  };

  const handleImportAddon = () => {
    if (!importScript.trim()) {
      toast.error('Please enter a script');
      return;
    }

    const newAddon: Addon = {
      id: `imported-${Date.now()}`,
      name: `Imported Addon ${importedAddons.length + 1}`,
      author: 'User',
      version: '1.0.0',
      description: 'Custom imported addon',
      iconPath: '',
      scriptUrl: importScript.trim(),
      isImported: true,
    };

    const newImportedAddons = [...importedAddons, newAddon];
    setImportedAddons(newImportedAddons);
    localStorage.setItem('imported_addons', JSON.stringify(newImportedAddons));
    
    setImportScript('');
    setImportDialogOpen(false);
    toast.success('Addon imported successfully!');
  };

  return (
    <div className="min-h-screen bg-background relative">
      <StarBackground />
      
      {/* Header */}
      <header className="sticky top-0 z-50 bg-background/95 backdrop-blur border-b border-border">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4 flex flex-col sm:flex-row items-start sm:items-center gap-4">
          <div className="flex items-center gap-4 w-full sm:w-auto">
            <Button 
              variant="ghost" 
              size="icon" 
              onClick={() => window.history.back()}
            >
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <h1 className="text-2xl font-bold">Add-Ons</h1>
          </div>
          <div className="flex items-center gap-4 flex-1 w-full sm:w-auto">
            <Input
              placeholder="Search add-ons..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="flex-1 sm:max-w-md"
            />
            <Dialog open={importDialogOpen} onOpenChange={setImportDialogOpen}>
              <DialogTrigger asChild>
                <Button className="gap-2 whitespace-nowrap">
                  <Plus className="w-4 h-4" />
                  Import Addon
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl">
                <DialogHeader>
                  <DialogTitle>Import Custom Addon</DialogTitle>
                  <DialogDescription>
                    Paste your custom addon script below and click Import to add it to your installed addons.
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4 mt-4">
                  <Textarea
                    value={importScript}
                    onChange={(e) => setImportScript(e.target.value)}
                    placeholder="Paste your script code here..."
                    className="min-h-[300px] font-mono text-sm"
                  />
                  <Button 
                    onClick={handleImportAddon} 
                    className="w-full"
                    size="lg"
                  >
                    Import
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-8 relative z-10">
        {/* Installed Add-ons Section */}
        {installedItems.length > 0 && (
          <section className="mb-12 animate-fade-in">
            <h2 className="text-xl font-bold mb-4">Installed</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {installedItems.map((addon, index) => (
                <Card 
                  key={addon.id} 
                  className="p-4 hover:border-primary/50 transition-all hover:shadow-lg hover:scale-[1.02] animate-fade-in"
                  style={{ animationDelay: `${index * 50}ms` }}
                >
                  <div className="flex gap-4">
                    {!addon.isImported && (
                      <img
                        src={`${addonSite}${addon.iconPath}`}
                        alt={addon.name}
                        className="w-20 h-20 rounded-lg object-cover transition-transform hover:scale-105"
                      />
                    )}
                    <div className="flex-1 min-w-0">
                      <h3 className="font-bold text-lg truncate">
                        {addon.name}
                        {addon.isImported && (
                          <span className="ml-2 text-xs bg-primary/20 text-primary px-2 py-1 rounded">Imported</span>
                        )}
                      </h3>
                      <p className="text-xs text-muted-foreground">by {addon.author}</p>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleUninstall(addon)}
                        className="mt-2 border-red-500/50 text-red-500 hover:bg-red-500/10 hover:text-red-400 transition-all hover:scale-105"
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
              {availableItems.map((addon, index) => (
                <Card 
                  key={addon.id} 
                  className="overflow-hidden hover:border-primary/50 transition-all duration-300 hover:shadow-xl hover:shadow-primary/20 hover:scale-[1.02] animate-fade-in group"
                  style={{ animationDelay: `${index * 50}ms` }}
                >
                  <div className="aspect-video bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center overflow-hidden">
                    <img
                      src={`${addonSite}${addon.iconPath}`}
                      alt={addon.name}
                      className="w-28 h-28 object-cover rounded-lg transition-transform duration-300 group-hover:scale-110"
                    />
                  </div>
                  <div className="p-4 space-y-3">
                    <div>
                      <h3 className="font-bold text-lg line-clamp-1">{addon.name}</h3>
                      <p className="text-xs text-muted-foreground flex items-center gap-1">
                        by {addon.author}
                      </p>
                    </div>
                    <p className="text-sm text-muted-foreground line-clamp-2 min-h-[2.5rem]">
                      {addon.description}
                    </p>
                    <div className="flex items-center justify-between text-xs text-muted-foreground">
                      <span>v{addon.version}</span>
                      {addon.users && <span>{addon.users} users</span>}
                    </div>
                    
                    {installingAddon === addon.id ? (
                      <Button
                        disabled
                        className="w-full gap-2"
                      >
                        <Loader2 className="w-4 h-4 animate-spin" />
                        Installing...
                      </Button>
                    ) : (
                      <Button
                        onClick={() => handleInstall(addon)}
                        className="w-full gap-2 transition-all hover:scale-105"
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

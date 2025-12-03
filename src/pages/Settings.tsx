import { useState, useEffect } from "react";
import { useLocation, Link } from "react-router-dom";
import { Navigation } from "@/components/Navigation";
import { GlobalChat } from "@/components/GlobalChat";
import { Card } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { Settings, Bell, Palette, Database, Trash2, Globe, Zap, Activity } from "lucide-react";
import { toast } from "sonner";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { supabase } from "@/integrations/supabase/client";
import { usePageTitle } from "@/hooks/use-page-title";
import { StarBackground } from "@/components/StarBackground";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useThemeSystem } from "@/hooks/use-theme-system";

type SettingsData = {
  reducedMotion: boolean;
  fontSize: 'small' | 'medium' | 'large';
  highContrast: boolean;
  notificationsEnabled: boolean;
  generalNotifications: boolean;
  performanceMode: boolean;
  showFPS: boolean;
  disableUpdatePopups: boolean;
  incognitoMode: boolean;
  selectedTheme: string;
  aboutBlankFavicon?: string;
  aboutBlankTabName?: string;
};

const SettingsPage = () => {
  usePageTitle('Settings');
  const location = useLocation();
  const fromBrowser = (location.state as { fromBrowser?: boolean })?.fromBrowser;
  const [user, setUser] = useState<any>(null);
  const { themesData, currentThemeId, isLoading: themesLoading, changeTheme } = useThemeSystem();
  
  const [settings, setSettings] = useState<SettingsData>({
    reducedMotion: false,
    fontSize: 'medium',
    highContrast: false,
    notificationsEnabled: false,
    generalNotifications: true,
    performanceMode: false,
    showFPS: false,
    disableUpdatePopups: false,
    incognitoMode: false,
    selectedTheme: '',
    aboutBlankFavicon: '',
    aboutBlankTabName: 'Hideout',
  });
  
  const [clipboardEnabled, setClipboardEnabled] = useState(false);
  const [showClearDataDialog, setShowClearDataDialog] = useState(false);
  const [presets, setPresets] = useState<any[]>([]);
  const [loadingPresets, setLoadingPresets] = useState(false);

  useEffect(() => {
    // Load presets from hideout-network with their favicons
    const loadPresets = async () => {
      try {
        const response = await fetch('https://hideout-network.github.io/hideout-assets/about:blank/presets/presets.json');
        const data = await response.json();
        const baseUrl = 'https://hideout-network.github.io/hideout-assets/about:blank/presets';
        
        // Fetch all preset details to get favicons
        const presetsWithFavicons = await Promise.all(
          (data.presets || []).map(async (preset: any) => {
            try {
              const presetResponse = await fetch(`${baseUrl}${preset.presetPath}`);
              const presetData = await presetResponse.json();
              return { ...preset, favicon: presetData.favicon };
            } catch (error) {
              console.error(`Failed to load preset ${preset.id}:`, error);
              return preset;
            }
          })
        );
        
        setPresets(presetsWithFavicons);
      } catch (error) {
        console.error('Failed to load presets:', error);
      }
    };
    loadPresets();
  }, []);

  useEffect(() => {
    const loadSettings = async () => {
      // Load settings from localStorage
      const savedSettings = localStorage.getItem('hideout_settings');
      
      let loadedSettings: SettingsData = {
        reducedMotion: false,
        fontSize: 'medium',
        highContrast: false,
        notificationsEnabled: false,
        generalNotifications: true,
        performanceMode: false,
        showFPS: false,
        disableUpdatePopups: false,
        incognitoMode: false,
        selectedTheme: currentThemeId,
        aboutBlankFavicon: '',
        aboutBlankTabName: 'Hideout',
      };
      
      if (savedSettings) {
        try {
          const parsed = JSON.parse(savedSettings);
          loadedSettings = { ...loadedSettings, ...parsed };
        } catch (e) {
          console.error('Failed to parse settings:', e);
        }
      }

      // Check notification permission
      if ('Notification' in window) {
        loadedSettings.notificationsEnabled = Notification.permission === 'granted';
      }
      
      // Check clipboard permission
      if (navigator.permissions) {
        try {
          const permission = await navigator.permissions.query({ name: 'clipboard-write' as PermissionName });
          setClipboardEnabled(permission.state === 'granted');
        } catch {
          try {
            await navigator.clipboard.writeText('');
            setClipboardEnabled(true);
          } catch {
            setClipboardEnabled(false);
          }
        }
      }

      // Update state and apply settings
      setSettings(loadedSettings);
      applySettings(loadedSettings);
    };

    if (currentThemeId) {
      loadSettings();
    }
  }, [currentThemeId]);

  const applySettings = (newSettings: SettingsData) => {
    // Apply font size
    const root = document.documentElement;
    if (newSettings.fontSize === 'small') {
      root.style.fontSize = '14px';
    } else if (newSettings.fontSize === 'large') {
      root.style.fontSize = '18px';
    } else {
      root.style.fontSize = '16px';
    }

    // Apply reduced motion
    if (newSettings.reducedMotion) {
      // Disable all animations when reduced motion is enabled
      root.style.setProperty('--transition-smooth', 'none');
      root.style.setProperty('--transition-fast', 'none');
      root.classList.add('reduce-motion');
      
      // Add CSS to disable all animations
      const styleId = 'reduce-motion-style';
      let style = document.getElementById(styleId);
      if (!style) {
        style = document.createElement('style');
        style.id = styleId;
        document.head.appendChild(style);
      }
      style.textContent = `
        .reduce-motion *,
        .reduce-motion *::before,
        .reduce-motion *::after {
          animation-duration: 0.01ms !important;
          animation-iteration-count: 1 !important;
          transition-duration: 0.01ms !important;
          scroll-behavior: auto !important;
        }
      `;
    } else {
      root.style.setProperty('--transition-smooth', 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)');
      root.style.setProperty('--transition-fast', 'all 0.15s ease-out');
      root.classList.remove('reduce-motion');
      const style = document.getElementById('reduce-motion-style');
      if (style) style.remove();
    }

    // Apply performance mode
    if (newSettings.performanceMode) {
      root.classList.add('performance-mode');
    } else {
      root.classList.remove('performance-mode');
    }

    // Apply high contrast
    if (newSettings.highContrast) {
      root.classList.add('high-contrast');
    } else {
      root.classList.remove('high-contrast');
    }
  };

  const handleChange = (field: keyof SettingsData, value: any) => {
    const newSettings = { ...settings, [field]: value };
    setSettings(newSettings);
    
    // Save to localStorage immediately
    localStorage.setItem('hideout_settings', JSON.stringify(newSettings));
    
    // Apply settings immediately
    applySettings(newSettings);
    
    toast.success("Settings saved", { duration: 2000 });
  };

  const handleRequestNotifications = async () => {
    if ('Notification' in window) {
      const permission = await Notification.requestPermission();
      if (permission === 'granted') {
        setSettings(prev => ({ ...prev, notificationsEnabled: true }));
        toast.success("Notifications enabled!");
      } else {
        toast.error("Notification permission denied");
      }
    }
  };
  
  const handleRequestClipboard = async () => {
    try {
      await navigator.clipboard.writeText('Clipboard access granted!');
      setClipboardEnabled(true);
      toast.success('Clipboard permission granted');
    } catch {
      toast.error('Clipboard permission denied');
    }
  };
  
  const handleTestPopups = () => {
    const popup = window.open('about:blank', '_blank');
    if (popup) {
      popup.close();
      toast.success('Popups are enabled');
    } else {
      toast.error('Popups are blocked. Please enable them in your browser settings.');
    }
  };

  const handleClearLocalStorage = () => {
    const storedUser = localStorage.getItem('hideout_user') || sessionStorage.getItem('hideout_user');
    
    localStorage.clear();
    
    if (storedUser) {
      toast.info("Local storage cleared - you have been logged out", { duration: 5000 });
      window.location.href = '/';
    } else {
      toast.success("Local storage cleared successfully!", { duration: 5000 });
    }
  };

  const handleClearCookies = () => {
    const storedUser = localStorage.getItem('hideout_user') || sessionStorage.getItem('hideout_user');
    
    // Clear session storage
    sessionStorage.clear();
    
    // Clear cookies (if any)
    document.cookie.split(";").forEach((c) => {
      document.cookie = c.replace(/^ +/, "").replace(/=.*/, "=;expires=" + new Date().toUTCString() + ";path=/");
    });
    
    if (storedUser) {
      toast.info("Cookies cleared - you have been logged out", { duration: 5000 });
      window.location.href = '/';
    } else {
      toast.success("Cookies cleared successfully!", { duration: 5000 });
    }
  };

  const handleResetDefaults = () => {
    if (!themesData) return;

    const defaultSettings: SettingsData = {
      reducedMotion: false,
      fontSize: 'medium',
      highContrast: false,
      notificationsEnabled: settings.notificationsEnabled,
      generalNotifications: true,
      performanceMode: false,
      showFPS: false,
      disableUpdatePopups: false,
      incognitoMode: false,
      selectedTheme: themesData['main-theme'],
      aboutBlankFavicon: '',
      aboutBlankTabName: 'Hideout',
    };
    
    setSettings(defaultSettings);
    localStorage.setItem('hideout_settings', JSON.stringify(defaultSettings));
    applySettings(defaultSettings);
    toast.success("Settings reset to defaults", { duration: 5000 });
  };

  const handleThemeChange = (themeId: string) => {
    changeTheme(themeId);
    
    // Update settings state
    const newSettings = { ...settings, selectedTheme: themeId };
    setSettings(newSettings);
    localStorage.setItem('hideout_settings', JSON.stringify(newSettings));
    
    toast.success("Theme updated", { duration: 2000 });
  };

  const handleClearData = async () => {
    try {
      // Clear all localStorage
      localStorage.clear();
      
      // Clear all sessionStorage
      sessionStorage.clear();
      
      // Clear all cookies
      document.cookie.split(";").forEach((c) => {
        document.cookie = c
          .replace(/^ +/, "")
          .replace(/=.*/, "=;expires=" + new Date().toUTCString() + ";path=/");
      });
      
      // Clear IndexedDB databases
      if (window.indexedDB) {
        const databases = await window.indexedDB.databases();
        databases.forEach(db => {
          if (db.name) {
            window.indexedDB.deleteDatabase(db.name);
          }
        });
      }
      
      // Clear cache storage
      if ('caches' in window) {
        const cacheNames = await caches.keys();
        await Promise.all(cacheNames.map(name => caches.delete(name)));
      }
      
      toast.success("All data cleared successfully! Reloading...", { duration: 3000 });
      
      // Reload the page after a short delay
      setTimeout(() => {
        window.location.href = '/';
      }, 1500);
    } catch (error) {
      console.error('Error clearing data:', error);
      toast.error("Failed to clear all data. Please try again.");
    }
  };

  const handlePresetSelect = async (presetPath: string) => {
    setLoadingPresets(true);
    try {
      const baseUrl = 'https://hideout-network.github.io/hideout-assets/about:blank/presets';
      const response = await fetch(`${baseUrl}${presetPath}`);
      const presetData = await response.json();
      
      // Update settings with preset data
      const newSettings = {
        ...settings,
        aboutBlankFavicon: presetData.favicon || '',
        aboutBlankTabName: presetData.tabName || 'Hideout',
      };
      
      setSettings(newSettings);
      localStorage.setItem('hideout_settings', JSON.stringify(newSettings));
      
      toast.success("Preset applied successfully");
    } catch (error) {
      console.error('Failed to load preset:', error);
      toast.error("Failed to load preset");
    } finally {
      setLoadingPresets(false);
    }
  };

  if (themesLoading || !themesData) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin" />
          <p className="text-muted-foreground">Loading settings...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background relative">
      <StarBackground />
      <Navigation />
      <GlobalChat />

      <main className="pt-24 px-4 sm:px-6 pb-12 max-w-4xl mx-auto relative z-10">
        {fromBrowser && (
          <div className="mb-8 p-8 bg-card border border-border rounded-lg text-center animate-fade-in">
            <h2 className="text-2xl font-bold mb-2">🚧 Under Construction</h2>
            <p className="text-muted-foreground">Browser-specific settings are coming soon!</p>
          </div>
        )}
        
        {/* Header */}
        <div className="space-y-6 mb-12 animate-fade-in">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
              <Settings className="w-6 h-6 text-primary" />
            </div>
            <div>
              <h1 className="text-3xl sm:text-4xl font-bold text-foreground">Settings</h1>
              <p className="text-muted-foreground text-sm sm:text-base">Manage your preferences and account</p>
            </div>
          </div>
        </div>

        <div className="space-y-6">
          {/* Appearance Settings */}
          <Card className="p-4 sm:p-6 bg-card border-border">
            <div className="flex items-center gap-3 mb-4">
              <Palette className="w-5 h-5 text-primary" />
              <h2 className="text-lg sm:text-xl font-semibold">Appearance</h2>
            </div>
            <Separator className="mb-4" />
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Reduced Motion</Label>
                  <p className="text-sm text-muted-foreground">Minimize animations</p>
                </div>
                <Switch 
                  checked={settings.reducedMotion} 
                  onCheckedChange={(v) => handleChange('reducedMotion', v)} 
                />
              </div>
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>High Contrast</Label>
                  <p className="text-sm text-muted-foreground">Increase color contrast</p>
                </div>
                <Switch 
                  checked={settings.highContrast} 
                  onCheckedChange={(v) => handleChange('highContrast', v)} 
                />
              </div>
              <div className="space-y-2">
                <Label>Font Size</Label>
                <div className="flex gap-2">
                  {(['small', 'medium', 'large'] as const).map((size) => (
                    <Button
                      key={size}
                      variant={settings.fontSize === size ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => handleChange('fontSize', size)}
                      className="capitalize"
                    >
                      {size}
                    </Button>
                  ))}
                </div>
              </div>
              <div className="space-y-2">
                <Label>Theme</Label>
                <Select value={currentThemeId} onValueChange={handleThemeChange}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select a theme" />
                  </SelectTrigger>
                  <SelectContent className="max-h-60 overflow-y-auto custom-scrollbar">
                    {themesData.themes.map((theme) => (
                      <SelectItem key={theme.id} value={theme.id}>
                        {theme.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </Card>

          {/* Data Settings */}
          <Card className="p-4 sm:p-6 bg-card border-border">
            <div className="flex items-center gap-3 mb-4">
              <Database className="w-5 h-5 text-primary" />
              <h2 className="text-lg sm:text-xl font-semibold">Data & Storage</h2>
            </div>
            <Separator className="mb-4" />
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Clear Data</Label>
                  <p className="text-sm text-muted-foreground">Delete all local data, cookies, and cache</p>
                </div>
                <Button variant="destructive" size="sm" onClick={() => setShowClearDataDialog(true)} className="gap-2">
                  <Trash2 className="w-4 h-4" />
                  Clear Data
                </Button>
              </div>
            </div>
          </Card>

          {/* Permissions Settings */}
          <Card className="p-4 sm:p-6 bg-card border-border">
            <div className="flex items-center gap-3 mb-4">
              <Bell className="w-5 h-5 text-primary" />
              <h2 className="text-lg sm:text-xl font-semibold">Permissions</h2>
            </div>
            <Separator className="mb-4" />
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Notifications</Label>
                  <p className="text-sm text-muted-foreground">Allow site notifications</p>
                </div>
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={handleRequestNotifications}
                  disabled={settings.notificationsEnabled}
                >
                  {settings.notificationsEnabled ? 'Enabled' : 'Enable'}
                </Button>
              </div>
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Popups</Label>
                  <p className="text-sm text-muted-foreground">Allow opening new tabs/windows</p>
                </div>
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={handleTestPopups}
                >
                  Enable
                </Button>
              </div>
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Clipboard</Label>
                  <p className="text-sm text-muted-foreground">Allow copy and paste</p>
                </div>
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={handleRequestClipboard}
                  disabled={clipboardEnabled}
                >
                  {clipboardEnabled ? 'Enabled' : 'Enable'}
                </Button>
              </div>
            </div>
          </Card>

          {/* Browser Settings */}
          <Card className="p-4 sm:p-6 bg-card border-border">
            <div className="flex items-center gap-3 mb-4">
              <Globe className="w-5 h-5 text-primary" />
              <h2 className="text-lg sm:text-xl font-semibold">Browser Settings</h2>
            </div>
            <Separator className="mb-4" />
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Incognito Mode</Label>
                  <p className="text-sm text-muted-foreground">Don't save history or cookies</p>
                </div>
                <Switch 
                  checked={settings.incognitoMode} 
                  onCheckedChange={(v) => handleChange('incognitoMode', v)} 
                />
              </div>
            </div>
          </Card>

          {/* Performance Settings */}
          <Card className="p-4 sm:p-6 bg-card border-border">
            <div className="flex items-center gap-3 mb-4">
              <Zap className="w-5 h-5 text-primary" />
              <h2 className="text-lg sm:text-xl font-semibold">Performance</h2>
            </div>
            <Separator className="mb-4" />
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Performance Mode</Label>
                  <p className="text-sm text-muted-foreground">Disable animations for better performance</p>
                </div>
                <Switch 
                  checked={settings.performanceMode} 
                  onCheckedChange={(v) => handleChange('performanceMode', v)} 
                />
              </div>
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Show FPS Counter</Label>
                  <p className="text-sm text-muted-foreground">Display frames per second in games</p>
                </div>
                <Switch 
                  checked={settings.showFPS} 
                  onCheckedChange={(v) => handleChange('showFPS', v)} 
                />
              </div>
            </div>
          </Card>

          {/* Update Settings */}
          <Card className="p-4 sm:p-6 bg-card border-border">
            <div className="flex items-center gap-3 mb-4">
              <Activity className="w-5 h-5 text-primary" />
              <h2 className="text-lg sm:text-xl font-semibold">Updates</h2>
            </div>
            <Separator className="mb-4" />
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Disable Update Popups</Label>
                  <p className="text-sm text-muted-foreground">Don't show update notifications</p>
                </div>
                <Switch 
                  checked={settings.disableUpdatePopups} 
                  onCheckedChange={(v) => handleChange('disableUpdatePopups', v)} 
                />
              </div>
            </div>
          </Card>

          {/* About:blank Settings */}
          <Card className="p-4 sm:p-6 bg-card border-border">
            <div className="flex items-center gap-3 mb-4">
              <Globe className="w-5 h-5 text-primary" />
              <h2 className="text-lg sm:text-xl font-semibold">About:blank</h2>
            </div>
            <Separator className="mb-4" />
            <div className="space-y-4">
              {/* Presets Dropdown */}
              {presets.length > 0 && (
                <div className="space-y-2">
                  <Label>Presets</Label>
                  <Select 
                    onValueChange={handlePresetSelect}
                    disabled={loadingPresets}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Choose a preset..." />
                    </SelectTrigger>
                    <SelectContent className="max-h-60 overflow-y-auto bg-popover">
                      {presets.map((preset) => (
                        <SelectItem key={preset.id} value={preset.presetPath} className="flex items-center gap-2">
                          {preset.favicon && (
                            <img 
                              src={preset.favicon} 
                              alt="" 
                              className="w-4 h-4 mr-2 inline-block"
                              onError={(e) => e.currentTarget.style.display = 'none'}
                            />
                          )}
                          {preset.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}
              
              <div className="space-y-2">
                <Label>Favicon</Label>
                <div className="flex gap-2">
                  <Input
                    value={settings.aboutBlankFavicon || ''}
                    onChange={(e) => setSettings(prev => ({ ...prev, aboutBlankFavicon: e.target.value }))}
                    placeholder="Enter favicon URL..."
                    className="flex-1"
                  />
                  <Button 
                    variant="outline"
                    onClick={() => {
                      const newSettings = { ...settings };
                      localStorage.setItem('hideout_settings', JSON.stringify(newSettings));
                      toast.success("Favicon saved");
                    }}
                  >
                    Set
                  </Button>
                </div>
              </div>
              <div className="space-y-2">
                <Label>Tab Name</Label>
                <div className="flex gap-2">
                  <Input
                    value={settings.aboutBlankTabName || ''}
                    onChange={(e) => setSettings(prev => ({ ...prev, aboutBlankTabName: e.target.value }))}
                    placeholder="Enter tab name..."
                    className="flex-1"
                  />
                  <Button 
                    variant="outline"
                    onClick={() => {
                      const newSettings = { ...settings };
                      localStorage.setItem('hideout_settings', JSON.stringify(newSettings));
                      toast.success("Tab name saved");
                    }}
                  >
                    Set
                  </Button>
                </div>
              </div>
            </div>
          </Card>

          {/* Reset Button */}
          <div className="flex justify-end">
            <Button variant="outline" onClick={handleResetDefaults}>Reset to Defaults</Button>
          </div>
        </div>
      </main>

      {/* Clear Data Warning Dialog */}
      <AlertDialog open={showClearDataDialog} onOpenChange={setShowClearDataDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
            <AlertDialogDescription className="space-y-2">
              <p>This will permanently delete:</p>
              <ul className="list-disc list-inside space-y-1 text-sm">
                <li>All local storage data</li>
                <li>All cookies</li>
                <li>All session storage</li>
                <li>All cached data</li>
                <li>All IndexedDB databases</li>
              </ul>
              <p className="font-semibold text-destructive mt-4">
                This action cannot be undone. You will be logged out and the page will reload.
              </p>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleClearData}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Clear All Data
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default SettingsPage;

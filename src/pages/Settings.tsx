import { useState, useEffect } from "react";
import { useLocation } from "react-router-dom";
import { Navigation } from "@/components/Navigation";
import { GlobalChat } from "@/components/GlobalChat";
import { Card } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { Settings, Bell, Palette, Database, Trash2, Globe, Zap, Activity, MousePointer2, Search } from "lucide-react";
import { Slider } from "@/components/ui/slider";
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
import { GridBackground } from "@/components/GridBackground";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useThemeSystem } from "@/hooks/use-theme-system";
import { cn } from "@/lib/utils";

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
  customCursorEnabled?: boolean;
  cursorSmoothness?: number;
  cursorSize?: number;
};

type SettingsSection = 'appearance' | 'data' | 'permissions' | 'browser' | 'performance' | 'cursor' | 'updates' | 'aboutblank';

const SETTINGS_SECTIONS: { id: SettingsSection; label: string; icon: React.ReactNode }[] = [
  { id: 'appearance', label: 'Appearance', icon: <Palette className="w-4 h-4" /> },
  { id: 'data', label: 'Data & Storage', icon: <Database className="w-4 h-4" /> },
  { id: 'permissions', label: 'Permissions', icon: <Bell className="w-4 h-4" /> },
  { id: 'browser', label: 'Browser', icon: <Globe className="w-4 h-4" /> },
  { id: 'performance', label: 'Performance', icon: <Zap className="w-4 h-4" /> },
  { id: 'cursor', label: 'Custom Cursor', icon: <MousePointer2 className="w-4 h-4" /> },
  { id: 'updates', label: 'Updates', icon: <Activity className="w-4 h-4" /> },
  { id: 'aboutblank', label: 'About:blank', icon: <Globe className="w-4 h-4" /> },
];

const SettingsPage = () => {
  usePageTitle('Settings');
  const location = useLocation();
  const fromBrowser = (location.state as { fromBrowser?: boolean })?.fromBrowser;
  const [user, setUser] = useState<any>(null);
  const { themesData, currentThemeId, isLoading: themesLoading, changeTheme } = useThemeSystem();
  const [activeSection, setActiveSection] = useState<SettingsSection>('appearance');
  const [searchQuery, setSearchQuery] = useState('');
  
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
    customCursorEnabled: false,
    cursorSmoothness: 0.65,
    cursorSize: 36,
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
        customCursorEnabled: false,
        cursorSmoothness: 0.65,
        cursorSize: 36,
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
    
    // Dispatch event for cursor settings changes
    window.dispatchEvent(new Event('cursorSettingsChanged'));
    
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
      customCursorEnabled: false,
      cursorSmoothness: 0.65,
      cursorSize: 36,
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

  // Filter sections based on search
  const filteredSections = SETTINGS_SECTIONS.filter(section => 
    section.label.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (themesLoading || !themesData) {
    return (
      <div className="min-h-screen bg-background relative">
        <GridBackground />
        <Navigation />
        <div className="flex items-center justify-center min-h-[calc(100vh-6rem)]">
          <div className="flex flex-col items-center gap-4">
            <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin" />
            <p className="text-muted-foreground">Loading settings...</p>
          </div>
        </div>
      </div>
    );
  }

  const renderContent = () => {
    switch (activeSection) {
      case 'appearance':
        return (
          <div className="space-y-6">
            <div>
              <h2 className="text-2xl font-semibold mb-2">Appearance</h2>
              <p className="text-muted-foreground">Customize how Hideout looks</p>
            </div>
            <Separator />
            <div className="space-y-6">
              <div className="flex items-center justify-between py-3">
                <div className="space-y-0.5">
                  <Label className="text-base">Reduced Motion</Label>
                  <p className="text-sm text-muted-foreground">Minimize animations throughout the interface</p>
                </div>
                <Switch 
                  checked={settings.reducedMotion} 
                  onCheckedChange={(v) => handleChange('reducedMotion', v)} 
                />
              </div>
              <Separator />
              <div className="flex items-center justify-between py-3">
                <div className="space-y-0.5">
                  <Label className="text-base">High Contrast</Label>
                  <p className="text-sm text-muted-foreground">Increase color contrast for better visibility</p>
                </div>
                <Switch 
                  checked={settings.highContrast} 
                  onCheckedChange={(v) => handleChange('highContrast', v)} 
                />
              </div>
              <Separator />
              <div className="py-3">
                <div className="flex items-center justify-between mb-3">
                  <div className="space-y-0.5">
                    <Label className="text-base">Font Size</Label>
                    <p className="text-sm text-muted-foreground">Adjust the base font size</p>
                  </div>
                </div>
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
              <Separator />
              <div className="py-3">
                <div className="flex items-center justify-between mb-3">
                  <div className="space-y-0.5">
                    <Label className="text-base">Theme</Label>
                    <p className="text-sm text-muted-foreground">Choose your preferred color theme</p>
                  </div>
                </div>
                {(() => {
                  const effectiveThemeId = currentThemeId || themesData['main-theme'];
                  const selectedTheme = themesData.themes.find(t => t.id === effectiveThemeId);
                  return (
                    <Select 
                      value={effectiveThemeId} 
                      onValueChange={handleThemeChange}
                    >
                      <SelectTrigger className="w-full max-w-xs">
                        <SelectValue>
                          {selectedTheme?.name || 'Default Dark'}
                        </SelectValue>
                      </SelectTrigger>
                      <SelectContent className="max-h-60 overflow-y-auto custom-scrollbar bg-popover">
                        {themesData.themes.map((theme) => (
                          <SelectItem key={theme.id} value={theme.id}>
                            {theme.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  );
                })()}
              </div>
            </div>
          </div>
        );

      case 'data':
        return (
          <div className="space-y-6">
            <div>
              <h2 className="text-2xl font-semibold mb-2">Data & Storage</h2>
              <p className="text-muted-foreground">Manage your local data and storage</p>
            </div>
            <Separator />
            <div className="flex items-center justify-between py-3">
              <div className="space-y-0.5">
                <Label className="text-base">Clear All Data</Label>
                <p className="text-sm text-muted-foreground">Delete all local data, cookies, and cache. This action cannot be undone.</p>
              </div>
              <Button variant="destructive" size="sm" onClick={() => setShowClearDataDialog(true)} className="gap-2">
                <Trash2 className="w-4 h-4" />
                Clear Data
              </Button>
            </div>
          </div>
        );

      case 'permissions':
        return (
          <div className="space-y-6">
            <div>
              <h2 className="text-2xl font-semibold mb-2">Permissions</h2>
              <p className="text-muted-foreground">Manage browser permissions</p>
            </div>
            <Separator />
            <div className="space-y-6">
              <div className="flex items-center justify-between py-3">
                <div className="space-y-0.5">
                  <Label className="text-base">Notifications</Label>
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
              <Separator />
              <div className="flex items-center justify-between py-3">
                <div className="space-y-0.5">
                  <Label className="text-base">Popups</Label>
                  <p className="text-sm text-muted-foreground">Allow opening new tabs/windows</p>
                </div>
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={handleTestPopups}
                >
                  Test
                </Button>
              </div>
              <Separator />
              <div className="flex items-center justify-between py-3">
                <div className="space-y-0.5">
                  <Label className="text-base">Clipboard</Label>
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
          </div>
        );

      case 'browser':
        return (
          <div className="space-y-6">
            <div>
              <h2 className="text-2xl font-semibold mb-2">Browser Settings</h2>
              <p className="text-muted-foreground">Configure browser behavior</p>
            </div>
            <Separator />
            <div className="flex items-center justify-between py-3">
              <div className="space-y-0.5">
                <Label className="text-base">Incognito Mode</Label>
                <p className="text-sm text-muted-foreground">Don't save history or cookies in the browser</p>
              </div>
              <Switch 
                checked={settings.incognitoMode} 
                onCheckedChange={(v) => handleChange('incognitoMode', v)} 
              />
            </div>
          </div>
        );

      case 'performance':
        return (
          <div className="space-y-6">
            <div>
              <h2 className="text-2xl font-semibold mb-2">Performance</h2>
              <p className="text-muted-foreground">Optimize performance settings</p>
            </div>
            <Separator />
            <div className="space-y-6">
              <div className="flex items-center justify-between py-3">
                <div className="space-y-0.5">
                  <Label className="text-base">Performance Mode</Label>
                  <p className="text-sm text-muted-foreground">Disable animations for better performance on slower devices</p>
                </div>
                <Switch 
                  checked={settings.performanceMode} 
                  onCheckedChange={(v) => handleChange('performanceMode', v)} 
                />
              </div>
              <Separator />
              <div className="flex items-center justify-between py-3">
                <div className="space-y-0.5">
                  <Label className="text-base">Show FPS Counter</Label>
                  <p className="text-sm text-muted-foreground">Display frames per second in games</p>
                </div>
                <Switch 
                  checked={settings.showFPS} 
                  onCheckedChange={(v) => handleChange('showFPS', v)} 
                />
              </div>
            </div>
          </div>
        );

      case 'cursor':
        return (
          <div className="space-y-6">
            <div className="flex items-center gap-2">
              <h2 className="text-2xl font-semibold">Custom Cursor</h2>
              <span className="px-2.5 py-0.5 text-xs font-medium bg-primary/20 text-primary rounded-full">Experimental</span>
            </div>
            <p className="text-muted-foreground">Customize your cursor appearance</p>
            <Separator />
            <div className="space-y-6">
              <div className="flex items-center justify-between py-3">
                <div className="space-y-0.5">
                  <Label className="text-base">Enable Custom Cursor</Label>
                  <p className="text-sm text-muted-foreground">Replace default cursor with custom design</p>
                </div>
                <Switch 
                  checked={settings.customCursorEnabled || false} 
                  onCheckedChange={(v) => handleChange('customCursorEnabled', v)} 
                />
              </div>
              
              {settings.customCursorEnabled && (
                <>
                  <Separator />
                  <div className="py-3 space-y-4">
                    <div className="flex items-center justify-between">
                      <Label className="text-base">Smoothness</Label>
                      <span className="text-sm text-muted-foreground">
                        {Math.round((settings.cursorSmoothness || 0.65) * 100)}%
                      </span>
                    </div>
                    <Slider
                      value={[(settings.cursorSmoothness || 0.65) * 100]}
                      onValueChange={([v]) => handleChange('cursorSmoothness', v / 100)}
                      min={10}
                      max={100}
                      step={5}
                      className="w-full"
                    />
                    <p className="text-xs text-muted-foreground">Higher values make cursor follow faster</p>
                  </div>
                  <Separator />
                  <div className="py-3 space-y-4">
                    <div className="flex items-center justify-between">
                      <Label className="text-base">Cursor Size</Label>
                      <span className="text-sm text-muted-foreground">
                        {settings.cursorSize || 36}px
                      </span>
                    </div>
                    <Slider
                      value={[settings.cursorSize || 36]}
                      onValueChange={([v]) => handleChange('cursorSize', v)}
                      min={24}
                      max={64}
                      step={4}
                      className="w-full"
                    />
                    <p className="text-xs text-muted-foreground">Adjust the size of the cursor</p>
                  </div>
                </>
              )}
            </div>
          </div>
        );

      case 'updates':
        return (
          <div className="space-y-6">
            <div>
              <h2 className="text-2xl font-semibold mb-2">Updates</h2>
              <p className="text-muted-foreground">Configure update notifications</p>
            </div>
            <Separator />
            <div className="flex items-center justify-between py-3">
              <div className="space-y-0.5">
                <Label className="text-base">Disable Update Popups</Label>
                <p className="text-sm text-muted-foreground">Don't show update notifications when new versions are released</p>
              </div>
              <Switch 
                checked={settings.disableUpdatePopups} 
                onCheckedChange={(v) => handleChange('disableUpdatePopups', v)} 
              />
            </div>
          </div>
        );

      case 'aboutblank':
        return (
          <div className="space-y-6">
            <div>
              <h2 className="text-2xl font-semibold mb-2">About:blank</h2>
              <p className="text-muted-foreground">Customize the about:blank tab appearance</p>
            </div>
            <Separator />
            <div className="space-y-6">
              {/* Presets */}
              {presets.length > 0 && (
                <div className="py-3">
                  <div className="space-y-0.5 mb-3">
                    <Label className="text-base">Presets</Label>
                    <p className="text-sm text-muted-foreground">Quick apply a preset configuration</p>
                  </div>
                  <Select 
                    onValueChange={handlePresetSelect}
                    disabled={loadingPresets}
                  >
                    <SelectTrigger className="w-full max-w-xs">
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
              <Separator />
              {/* Favicon */}
              <div className="py-3">
                <div className="space-y-0.5 mb-3">
                  <Label className="text-base">Favicon</Label>
                  <p className="text-sm text-muted-foreground">Custom favicon URL for the tab</p>
                </div>
                <div className="flex gap-2">
                  <Input
                    value={settings.aboutBlankFavicon || ''}
                    onChange={(e) => setSettings(prev => ({ ...prev, aboutBlankFavicon: e.target.value }))}
                    placeholder="Enter favicon URL..."
                    className="flex-1 max-w-md"
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
              <Separator />
              {/* Tab Name */}
              <div className="py-3">
                <div className="space-y-0.5 mb-3">
                  <Label className="text-base">Tab Name</Label>
                  <p className="text-sm text-muted-foreground">Custom name displayed in the browser tab</p>
                </div>
                <div className="flex gap-2">
                  <Input
                    value={settings.aboutBlankTabName || ''}
                    onChange={(e) => setSettings(prev => ({ ...prev, aboutBlankTabName: e.target.value }))}
                    placeholder="Enter tab name..."
                    className="flex-1 max-w-md"
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
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-background relative">
      <GridBackground />
      <Navigation />
      <GlobalChat />

      <main className="pt-24 px-4 sm:px-6 pb-12 relative z-10">
        <div className="max-w-6xl mx-auto">
          {fromBrowser && (
            <div className="mb-8 p-8 bg-card border border-border rounded-lg text-center animate-fade-in">
              <h2 className="text-2xl font-bold mb-2">🚧 Under Construction</h2>
              <p className="text-muted-foreground">Browser-specific settings are coming soon!</p>
            </div>
          )}
          
          {/* Header */}
          <div className="mb-8 animate-fade-in">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                <Settings className="w-5 h-5 text-primary" />
              </div>
              <h1 className="text-3xl font-bold text-foreground">Settings</h1>
            </div>
            <p className="text-muted-foreground">Manage your preferences and account</p>
          </div>

          {/* Main Layout */}
          <div className="flex flex-col lg:flex-row gap-6">
            {/* Sidebar */}
            <div className="lg:w-64 flex-shrink-0">
              <Card className="sticky top-24 p-4 bg-card border-border">
                {/* Search */}
                <div className="relative mb-4">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    placeholder="Filter settings..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-9 bg-muted border-border"
                  />
                </div>
                
                {/* Navigation */}
                <nav className="space-y-1">
                  {filteredSections.map((section) => (
                    <button
                      key={section.id}
                      onClick={() => setActiveSection(section.id)}
                      className={cn(
                        "w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-left transition-colors",
                        activeSection === section.id
                          ? "bg-primary text-primary-foreground"
                          : "text-muted-foreground hover:bg-muted hover:text-foreground"
                      )}
                    >
                      {section.icon}
                      <span className="text-sm font-medium">{section.label}</span>
                    </button>
                  ))}
                </nav>

                {/* Reset Button */}
                <div className="pt-4 mt-4 border-t border-border">
                  <Button variant="outline" size="sm" onClick={handleResetDefaults} className="w-full">
                    Reset to Defaults
                  </Button>
                </div>
              </Card>
            </div>

            {/* Content */}
            <div className="flex-1 min-w-0">
              <Card className="p-6 sm:p-8 bg-card border-border">
                {renderContent()}
              </Card>
            </div>
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
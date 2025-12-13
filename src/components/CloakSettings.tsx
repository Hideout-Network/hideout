import { useState, useEffect } from "react";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { toast } from "sonner";

interface CloakSettingsProps {
  settings: any;
  setSettings: (fn: (prev: any) => any) => void;
  presets: any[];
  loadingPresets: boolean;
  handlePresetSelect: (presetPath: string) => void;
}

export const CloakSettings = ({
  settings,
  setSettings,
  presets,
  loadingPresets,
  handlePresetSelect,
}: CloakSettingsProps) => {
  const [blobFavicon, setBlobFavicon] = useState(settings.blobFavicon || '');
  const [blobTabName, setBlobTabName] = useState(settings.blobTabName || 'Hideout');
  const [dataFavicon, setDataFavicon] = useState(settings.dataFavicon || '');
  const [dataTabName, setDataTabName] = useState(settings.dataTabName || 'Hideout');
  const [activeTab, setActiveTab] = useState(settings.cloakActiveTab || 'aboutblank');

  // Load settings from localStorage on mount
  useEffect(() => {
    setBlobFavicon(settings.blobFavicon || '');
    setBlobTabName(settings.blobTabName || 'Hideout');
    setDataFavicon(settings.dataFavicon || '');
    setDataTabName(settings.dataTabName || 'Hideout');
    setActiveTab(settings.cloakActiveTab || 'aboutblank');
  }, [settings.blobFavicon, settings.blobTabName, settings.dataFavicon, settings.dataTabName, settings.cloakActiveTab]);

  const handleTabChange = (value: string) => {
    setActiveTab(value);
    const newSettings = { ...settings, cloakActiveTab: value };
    setSettings(() => newSettings);
    localStorage.setItem('hideout_settings', JSON.stringify(newSettings));
  };

  const handleOpenAboutBlank = () => {
    const favicon = settings.aboutBlankFavicon || '';
    const tabName = settings.aboutBlankTabName || 'Hideout';
    
    const popup = window.open('about:blank', '_blank');
    if (popup) {
      popup.document.write(`
        <!DOCTYPE html>
        <html>
          <head>
            <title>${tabName}</title>
            ${favicon ? `<link rel="icon" href="${favicon}">` : ''}
            <style>
              body, html {
                margin: 0;
                padding: 0;
                height: 100%;
                overflow: hidden;
              }
              iframe {
                width: 100%;
                height: 100%;
                border: none;
              }
            </style>
          </head>
          <body>
            <iframe src="${window.location.origin}"></iframe>
          </body>
        </html>
      `);
      popup.document.close();
      toast.success("Opened in about:blank tab");
    } else {
      toast.error("Popup blocked. Please allow popups for this site.");
    }
  };

  const handleOpenBlob = () => {
    const favicon = blobFavicon || settings.blobFavicon || '';
    const tabName = blobTabName || settings.blobTabName || 'Hideout';
    
    const htmlContent = `
      <!DOCTYPE html>
      <html>
        <head>
          <title>${tabName}</title>
          ${favicon ? `<link rel="icon" href="${favicon}">` : ''}
          <style>
            body, html {
              margin: 0;
              padding: 0;
              height: 100%;
              overflow: hidden;
            }
            iframe {
              width: 100%;
              height: 100%;
              border: none;
            }
          </style>
        </head>
        <body>
          <iframe src="${window.location.origin}"></iframe>
        </body>
      </html>
    `;

    const blob = new Blob([htmlContent], { type: "text/html" });
    const blobUrl = URL.createObjectURL(blob);
    const popup = window.open(blobUrl, "_blank");
    
    if (popup) {
      toast.success("Opened in blob URL tab");
    } else {
      toast.error("Popup blocked. Please allow popups for this site.");
    }
  };

  const handleBlobPresetSelect = (presetPath: string) => {
    // Use the same presets but apply to blob settings
    const baseUrl = 'https://hideout-network.github.io/hideout-assets/about:blank/presets';
    fetch(`${baseUrl}${presetPath}`)
      .then(res => res.json())
      .then(presetData => {
        setBlobFavicon(presetData.favicon || '');
        setBlobTabName(presetData.tabName || 'Hideout');
        
        const newSettings = {
          ...settings,
          blobFavicon: presetData.favicon || '',
          blobTabName: presetData.tabName || 'Hideout',
        };
        setSettings(() => newSettings);
        localStorage.setItem('hideout_settings', JSON.stringify(newSettings));
        toast.success("Blob preset applied successfully");
      })
      .catch(() => {
        toast.error("Failed to load preset");
      });
  };

  const handleOpenData = () => {
    const favicon = dataFavicon || settings.dataFavicon || '';
    const tabName = dataTabName || settings.dataTabName || 'Hideout';
    
    const faviconTag = favicon ? `<link rel="icon" href="${favicon}">` : '';
    const htmlContent = `<html><head><title>${tabName}</title>${faviconTag}<style>html,body{margin:0;height:100%;}iframe{border:none;width:100%;height:100%;}</style></head><body><iframe src="${window.location.origin}"></iframe></body></html>`;
    const dataUrl = `data:text/html,${encodeURIComponent(htmlContent)}`;
    
    const popup = window.open(dataUrl, "_blank");
    
    if (popup) {
      toast.success("Opened in data URL tab");
    } else {
      toast.error("Popup blocked. Please allow popups for this site.");
    }
  };

  const handleDataPresetSelect = (presetPath: string) => {
    const baseUrl = 'https://hideout-network.github.io/hideout-assets/about:blank/presets';
    fetch(`${baseUrl}${presetPath}`)
      .then(res => res.json())
      .then(presetData => {
        setDataFavicon(presetData.favicon || '');
        setDataTabName(presetData.tabName || 'Hideout');
        
        const newSettings = {
          ...settings,
          dataFavicon: presetData.favicon || '',
          dataTabName: presetData.tabName || 'Hideout',
        };
        setSettings(() => newSettings);
        localStorage.setItem('hideout_settings', JSON.stringify(newSettings));
        toast.success("Data preset applied successfully");
      })
      .catch(() => {
        toast.error("Failed to load preset");
      });
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-semibold mb-2">Cloak</h2>
        <p className="text-muted-foreground">Open Hideout in a cloaked tab to hide your activity</p>
      </div>
      <Separator />
      
      <Tabs value={activeTab} onValueChange={handleTabChange} className="w-full">
        <TabsList className="grid w-full grid-cols-3 max-w-md">
          <TabsTrigger value="aboutblank">About:blank</TabsTrigger>
          <TabsTrigger value="blob">Blob</TabsTrigger>
          <TabsTrigger value="data">Data</TabsTrigger>
        </TabsList>
        
        <TabsContent value="aboutblank" className="space-y-6 mt-6">
          <div className="p-4 rounded-lg bg-muted/50 border border-border">
            <p className="text-sm text-muted-foreground mb-3">
              Opens Hideout in an about:blank tab, making it appear as an empty tab in your browser history. You can also right-click anywhere on the site and select "Open in about:blank" to quickly open in cloak mode.
            </p>
            <Button onClick={handleOpenAboutBlank} className="w-full sm:w-auto">
              Open in About:blank
            </Button>
          </div>
          
          {/* Show in context menu toggle */}
          <div className="flex items-center space-x-3 py-3">
            <Checkbox
              id="aboutBlankContextMenu"
              checked={settings.showAboutBlankInContextMenu !== false}
              onCheckedChange={(checked) => {
                const newSettings = { ...settings, showAboutBlankInContextMenu: checked };
                setSettings(() => newSettings);
                localStorage.setItem('hideout_settings', JSON.stringify(newSettings));
                toast.success(checked ? "About:blank added to right-click menu" : "About:blank removed from right-click menu");
              }}
            />
            <Label htmlFor="aboutBlankContextMenu" className="text-sm cursor-pointer">
              Show "Open in About:blank" in right-click context menu
            </Label>
          </div>
          
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
        </TabsContent>
        
        <TabsContent value="blob" className="space-y-6 mt-6">
          <div className="p-4 rounded-lg bg-muted/50 border border-border">
            <p className="text-sm text-muted-foreground mb-3">
              Opens Hideout using a blob URL, which creates a temporary URL that doesn't show the real site address. You can also right-click anywhere on the site and select "Open in Blob" to quickly open in blob mode.
            </p>
            <Button onClick={handleOpenBlob} className="w-full sm:w-auto">
              Open in Blob URL
            </Button>
          </div>
          
          {/* Show in context menu toggle */}
          <div className="flex items-center space-x-3 py-3">
            <Checkbox
              id="blobContextMenu"
              checked={settings.showBlobInContextMenu !== false}
              onCheckedChange={(checked) => {
                const newSettings = { ...settings, showBlobInContextMenu: checked };
                setSettings(() => newSettings);
                localStorage.setItem('hideout_settings', JSON.stringify(newSettings));
                toast.success(checked ? "Blob added to right-click menu" : "Blob removed from right-click menu");
              }}
            />
            <Label htmlFor="blobContextMenu" className="text-sm cursor-pointer">
              Show "Open in Blob" in right-click context menu
            </Label>
          </div>
          
          {/* Blob Presets */}
          {presets.length > 0 && (
            <div className="py-3">
              <div className="space-y-0.5 mb-3">
                <Label className="text-base">Presets</Label>
                <p className="text-sm text-muted-foreground">Quick apply a preset configuration</p>
              </div>
              <Select 
                onValueChange={handleBlobPresetSelect}
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
          
          {/* Blob Favicon */}
          <div className="py-3">
            <div className="space-y-0.5 mb-3">
              <Label className="text-base">Favicon</Label>
              <p className="text-sm text-muted-foreground">Custom favicon URL for the blob tab</p>
            </div>
            <div className="flex gap-2">
              <Input
                value={blobFavicon}
                onChange={(e) => setBlobFavicon(e.target.value)}
                placeholder="Enter favicon URL..."
                className="flex-1 max-w-md"
              />
              <Button 
                variant="outline"
                onClick={() => {
                  const newSettings = { ...settings, blobFavicon };
                  setSettings(() => newSettings);
                  localStorage.setItem('hideout_settings', JSON.stringify(newSettings));
                  toast.success("Blob favicon saved");
                }}
              >
                Set
              </Button>
            </div>
          </div>
          <Separator />
          
          {/* Blob Tab Name */}
          <div className="py-3">
            <div className="space-y-0.5 mb-3">
              <Label className="text-base">Tab Name</Label>
              <p className="text-sm text-muted-foreground">Custom name displayed in the blob tab</p>
            </div>
            <div className="flex gap-2">
              <Input
                value={blobTabName}
                onChange={(e) => setBlobTabName(e.target.value)}
                placeholder="Enter tab name..."
                className="flex-1 max-w-md"
              />
              <Button 
                variant="outline"
                onClick={() => {
                  const newSettings = { ...settings, blobTabName };
                  setSettings(() => newSettings);
                  localStorage.setItem('hideout_settings', JSON.stringify(newSettings));
                  toast.success("Blob tab name saved");
                }}
              >
                Set
              </Button>
            </div>
          </div>
        </TabsContent>
        
        <TabsContent value="data" className="space-y-6 mt-6">
          <div className="p-4 rounded-lg bg-muted/50 border border-border">
            <p className="text-sm text-muted-foreground mb-3">
              Opens Hideout using a data URL, which embeds the page directly in the URL. You can also right-click anywhere on the site and select "Open in Data" to quickly open in data mode.
            </p>
            <Button onClick={handleOpenData} className="w-full sm:w-auto">
              Open in Data URL
            </Button>
          </div>
          
          {/* Show in context menu toggle */}
          <div className="flex items-center space-x-3 py-3">
          <Checkbox
              id="dataContextMenu"
              checked={settings.showDataInContextMenu === true}
              onCheckedChange={(checked) => {
                const newSettings = { ...settings, showDataInContextMenu: checked };
                setSettings(() => newSettings);
                localStorage.setItem('hideout_settings', JSON.stringify(newSettings));
                toast.success(checked ? "Data added to right-click menu" : "Data removed from right-click menu");
              }}
            />
            <Label htmlFor="dataContextMenu" className="text-sm cursor-pointer">
              Show "Open in Data" in right-click context menu
            </Label>
          </div>
          
          {/* Data Presets */}
          {presets.length > 0 && (
            <div className="py-3">
              <div className="space-y-0.5 mb-3">
                <Label className="text-base">Presets</Label>
                <p className="text-sm text-muted-foreground">Quick apply a preset configuration</p>
              </div>
              <Select 
                onValueChange={handleDataPresetSelect}
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
          
          {/* Data Favicon */}
          <div className="py-3">
            <div className="space-y-0.5 mb-3">
              <Label className="text-base">Favicon</Label>
              <p className="text-sm text-muted-foreground">Custom favicon URL for the data tab</p>
            </div>
            <div className="flex gap-2">
              <Input
                value={dataFavicon}
                onChange={(e) => setDataFavicon(e.target.value)}
                placeholder="Enter favicon URL..."
                className="flex-1 max-w-md"
              />
              <Button 
                variant="outline"
                onClick={() => {
                  const newSettings = { ...settings, dataFavicon };
                  setSettings(() => newSettings);
                  localStorage.setItem('hideout_settings', JSON.stringify(newSettings));
                  toast.success("Data favicon saved");
                }}
              >
                Set
              </Button>
            </div>
          </div>
          <Separator />
          
          {/* Data Tab Name */}
          <div className="py-3">
            <div className="space-y-0.5 mb-3">
              <Label className="text-base">Tab Name</Label>
              <p className="text-sm text-muted-foreground">Custom name displayed in the data tab</p>
            </div>
            <div className="flex gap-2">
              <Input
                value={dataTabName}
                onChange={(e) => setDataTabName(e.target.value)}
                placeholder="Enter tab name..."
                className="flex-1 max-w-md"
              />
              <Button 
                variant="outline"
                onClick={() => {
                  const newSettings = { ...settings, dataTabName };
                  setSettings(() => newSettings);
                  localStorage.setItem('hideout_settings', JSON.stringify(newSettings));
                  toast.success("Data tab name saved");
                }}
              >
                Set
              </Button>
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

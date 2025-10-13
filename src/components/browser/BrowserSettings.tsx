import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Settings } from "lucide-react";
import { toast } from "sonner";
import { useUserData } from "@/hooks/use-user-data";

export const BrowserSettings = () => {
  const { saveToAccount } = useUserData();
  const [homePage, setHomePage] = useState("hideout://newtab");
  const [usePreferredBrowser, setUsePreferredBrowser] = useState(true);

  useEffect(() => {
    const loadSettings = () => {
      const localSettings = localStorage.getItem('hideout_browser_settings');
      if (localSettings) {
        try {
          const parsed = JSON.parse(localSettings);
          setHomePage(parsed.homePage || "hideout://newtab");
          setUsePreferredBrowser(parsed.usePreferredBrowser ?? true);
        } catch (error) {
          console.error('Error loading browser settings:', error);
        }
      }
    };

    loadSettings();
  }, []);

  const handleSave = async () => {
    const settings = { 
      homePage, 
      usePreferredBrowser 
    };
    
    // Save to localStorage
    localStorage.setItem('hideout_browser_settings', JSON.stringify(settings));

    // Save to account (will auto-sync)
    await saveToAccount();

    toast.success("Settings saved successfully");
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/20 p-8">
      <div className="max-w-2xl mx-auto">
        <Card className="p-8 border-border/50 backdrop-blur-sm bg-card/80 animate-scale-in">
          <div className="flex items-center gap-3 mb-6">
            <Settings className="h-8 w-8 text-primary" />
            <h1 className="text-3xl font-bold">Browser Settings</h1>
          </div>
          
          <div className="space-y-6">
            {/* Home Page Setting */}
            <div className="space-y-3">
              <Label htmlFor="homepage" className="text-base font-semibold">
                Home Page
              </Label>
              <Input
                id="homepage"
                type="text"
                value={homePage}
                onChange={(e) => setHomePage(e.target.value)}
                disabled={usePreferredBrowser}
                placeholder="Enter URL or hideout:// page"
                className="bg-background"
              />
              <div className="flex items-center gap-2 mt-2">
                <Checkbox
                  id="use-preferred"
                  checked={usePreferredBrowser}
                  onCheckedChange={(checked) => setUsePreferredBrowser(checked as boolean)}
                />
                <Label htmlFor="use-preferred" className="text-sm cursor-pointer">
                  Use preferred browser as home page
                </Label>
              </div>
            </div>

            {/* More settings coming soon */}
            <div className="pt-4 border-t border-border">
              <p className="text-sm text-muted-foreground mb-2">Coming Soon:</p>
              <ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground">
                <li>Default search engine preferences</li>
                <li>Privacy & security settings</li>
                <li>Appearance customization</li>
                <li>Data management options</li>
              </ul>
            </div>

            <Button onClick={handleSave} className="w-full">
              Save Settings
            </Button>
          </div>
        </Card>
      </div>
    </div>
  );
};
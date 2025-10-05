import { Card } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Keyboard, Mouse, Bookmark, History, Shield, Zap, Lock, Globe } from "lucide-react";

export const BrowserHelp = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/20 p-8 overflow-y-auto">
      <div className="max-w-4xl mx-auto space-y-6 animate-fade-in">
        <div className="text-center space-y-3 mb-8">
          <h1 className="text-5xl font-bold bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
            Hideout Browser Help
          </h1>
          <p className="text-muted-foreground text-lg">
            Everything you need to know about using the Hideout Browser
          </p>
        </div>

        <Card className="p-6 border-border/50 backdrop-blur-sm bg-card/80 hover-scale">
          <div className="flex items-center gap-3 mb-4">
            <Globe className="h-6 w-6 text-primary" />
            <h2 className="text-2xl font-bold">What is Hideout Browser?</h2>
          </div>
          <p className="text-muted-foreground leading-relaxed">
            Hideout Browser is a secure, privacy-focused web browser built right into Hideout Network. 
            It allows you to browse the web with enhanced privacy protection and bypasses many network restrictions. 
            All your browsing data is saved locally and synchronized to your account when you're logged in.
          </p>
        </Card>

        <Card className="p-6 border-border/50 backdrop-blur-sm bg-card/80 hover-scale">
          <div className="flex items-center gap-3 mb-4">
            <Keyboard className="h-6 w-6 text-primary" />
            <h2 className="text-2xl font-bold">Keyboard Shortcuts</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <div className="flex justify-between p-2 rounded bg-muted/30">
                <span className="text-muted-foreground">New Tab</span>
                <kbd className="px-2 py-1 text-xs font-mono bg-background rounded border">Alt+T</kbd>
              </div>
              <div className="flex justify-between p-2 rounded bg-muted/30">
                <span className="text-muted-foreground">Close Tab</span>
                <kbd className="px-2 py-1 text-xs font-mono bg-background rounded border">Alt+W</kbd>
              </div>
              <div className="flex justify-between p-2 rounded bg-muted/30">
                <span className="text-muted-foreground">Reload Page</span>
                <kbd className="px-2 py-1 text-xs font-mono bg-background rounded border">Alt+R</kbd>
              </div>
              <div className="flex justify-between p-2 rounded bg-muted/30">
                <span className="text-muted-foreground">Focus URL Bar</span>
                <kbd className="px-2 py-1 text-xs font-mono bg-background rounded border">Alt+L</kbd>
              </div>
            </div>
            <div className="space-y-2">
              <div className="flex justify-between p-2 rounded bg-muted/30">
                <span className="text-muted-foreground">Go Back</span>
                <kbd className="px-2 py-1 text-xs font-mono bg-background rounded border">Alt+←</kbd>
              </div>
              <div className="flex justify-between p-2 rounded bg-muted/30">
                <span className="text-muted-foreground">Go Forward</span>
                <kbd className="px-2 py-1 text-xs font-mono bg-background rounded border">Alt+→</kbd>
              </div>
              <div className="flex justify-between p-2 rounded bg-muted/30">
                <span className="text-muted-foreground">Next Tab</span>
                <kbd className="px-2 py-1 text-xs font-mono bg-background rounded border">Alt+Tab</kbd>
              </div>
              <div className="flex justify-between p-2 rounded bg-muted/30">
                <span className="text-muted-foreground">Previous Tab</span>
                <kbd className="px-2 py-1 text-xs font-mono bg-background rounded border">Alt+Shift+Tab</kbd>
              </div>
            </div>
          </div>
        </Card>

        <Card className="p-6 border-border/50 backdrop-blur-sm bg-card/80 hover-scale">
          <div className="flex items-center gap-3 mb-4">
            <Mouse className="h-6 w-6 text-primary" />
            <h2 className="text-2xl font-bold">Tab Management</h2>
          </div>
          <div className="space-y-3 text-muted-foreground">
            <p><strong className="text-foreground">Right-click on any tab</strong> to access quick actions:</p>
            <ul className="list-disc list-inside space-y-1 ml-4">
              <li>Duplicate Tab - Create an exact copy of the current tab</li>
              <li>Pin/Unpin Tab - Keep important tabs locked and compact</li>
              <li>Close Tab - Close the selected tab</li>
              <li>Close Other Tabs - Close all tabs except the selected one</li>
              <li>Close Tabs to the Right - Close all tabs to the right of the selected tab</li>
            </ul>
            <p className="mt-3"><strong className="text-foreground">Tab Limits:</strong> You can have up to 10 tabs open at once. Tabs automatically shrink as you add more.</p>
          </div>
        </Card>

        <Card className="p-6 border-border/50 backdrop-blur-sm bg-card/80 hover-scale">
          <div className="flex items-center gap-3 mb-4">
            <Bookmark className="h-6 w-6 text-primary" />
            <h2 className="text-2xl font-bold">Bookmarks & History</h2>
          </div>
          <div className="space-y-3 text-muted-foreground">
            <p><strong className="text-foreground">Bookmarks:</strong> Click the star icon (⭐) in the navigation bar to bookmark the current page. Access your bookmarks from the three-dot menu.</p>
            <p><strong className="text-foreground">History:</strong> All pages you visit are automatically saved to your history. You can:</p>
            <ul className="list-disc list-inside space-y-1 ml-4">
              <li>View recent history in the three-dot menu</li>
              <li>Access full history at <code className="px-2 py-1 bg-muted rounded">hideout://history</code></li>
              <li>Search through your browsing history</li>
              <li>Clear history anytime from the menu</li>
            </ul>
          </div>
        </Card>

        <Card className="p-6 border-border/50 backdrop-blur-sm bg-card/80 hover-scale">
          <div className="flex items-center gap-3 mb-4">
            <Shield className="h-6 w-6 text-primary" />
            <h2 className="text-2xl font-bold">Privacy & Security</h2>
          </div>
          <div className="space-y-3 text-muted-foreground">
            <p><strong className="text-foreground">Proxy Protection:</strong> All web traffic goes through our secure proxy servers, hiding your real IP address and location.</p>
            <p><strong className="text-foreground">Data Storage:</strong></p>
            <ul className="list-disc list-inside space-y-1 ml-4">
              <li>Browsing data is saved to your device's local storage</li>
              <li>If logged in, data syncs to your Hideout account</li>
              <li>You can clear all browser data from the settings menu</li>
            </ul>
            <p><strong className="text-foreground">Important:</strong> While Hideout Browser provides privacy features, it's not 100% anonymous. Avoid using it for highly sensitive activities.</p>
          </div>
        </Card>

        <Card className="p-6 border-border/50 backdrop-blur-sm bg-card/80 hover-scale">
          <div className="flex items-center gap-3 mb-4">
            <Zap className="h-6 w-6 text-primary" />
            <h2 className="text-2xl font-bold">Features & Tools</h2>
          </div>
          <div className="space-y-3 text-muted-foreground">
            <p><strong className="text-foreground">Search Engines:</strong> Choose between Google, DuckDuckGo, or Bing from the dropdown next to the URL bar.</p>
            <p><strong className="text-foreground">Zoom Controls:</strong> Adjust page zoom from the three-dot menu (Zoom In, Zoom Out).</p>
            <p><strong className="text-foreground">Smart URL Bar:</strong></p>
            <ul className="list-disc list-inside space-y-1 ml-4">
              <li>Type a URL to navigate directly</li>
              <li>Type keywords to search with your selected engine</li>
              <li>Autocomplete suggestions from history and bookmarks</li>
            </ul>
            <p><strong className="text-foreground">Internal Pages:</strong> Access special browser pages:</p>
            <ul className="list-disc list-inside space-y-1 ml-4">
              <li><code className="px-2 py-1 bg-muted rounded">hideout://help</code> - This help page</li>
              <li><code className="px-2 py-1 bg-muted rounded">hideout://settings</code> - Browser settings</li>
              <li><code className="px-2 py-1 bg-muted rounded">hideout://history</code> - Full browsing history</li>
            </ul>
          </div>
        </Card>

        <Card className="p-6 border-border/50 backdrop-blur-sm bg-card/80 hover-scale">
          <div className="flex items-center gap-3 mb-4">
            <Lock className="h-6 w-6 text-primary" />
            <h2 className="text-2xl font-bold">Tips & Best Practices</h2>
          </div>
          <div className="space-y-2 text-muted-foreground">
            <ul className="list-disc list-inside space-y-2 ml-4">
              <li>Pin frequently used tabs to keep them always accessible</li>
              <li>Use keyboard shortcuts for faster navigation</li>
              <li>Regularly clear history and cookies if privacy is a concern</li>
              <li>Bookmark important pages for quick access</li>
              <li>Stay under the 10-tab limit for best performance</li>
              <li>Right-click links to open them in new tabs (when supported)</li>
            </ul>
          </div>
        </Card>

        <div className="text-center text-muted-foreground text-sm pt-4 pb-8">
          <Separator className="mb-4" />
          <p>Need more help? Contact support at <a href="mailto:hideout-network-buisness@hotmail.com" className="text-primary hover:underline">hideout-network-buisness@hotmail.com</a></p>
        </div>
      </div>
    </div>
  );
};

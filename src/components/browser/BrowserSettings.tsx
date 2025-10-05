import { Card } from "@/components/ui/card";
import { Settings, Wrench } from "lucide-react";

export const BrowserSettings = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/20 p-8 flex items-center justify-center">
      <Card className="p-12 max-w-2xl border-border/50 backdrop-blur-sm bg-card/80 text-center space-y-6 animate-scale-in">
        <div className="flex justify-center gap-4 mb-4">
          <Settings className="h-16 w-16 text-primary animate-spin" style={{ animationDuration: '3s' }} />
          <Wrench className="h-16 w-16 text-primary" />
        </div>
        
        <h1 className="text-5xl font-bold bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
          Browser Settings
        </h1>
        
        <div className="space-y-4">
          <p className="text-3xl font-semibold text-muted-foreground">
            Coming Soon
          </p>
          <p className="text-lg text-muted-foreground max-w-md mx-auto">
            We're working hard to bring you advanced browser customization options. 
            Stay tuned for updates!
          </p>
        </div>

        <div className="pt-6 space-y-2 text-sm text-muted-foreground">
          <p className="font-medium">Planned Features:</p>
          <ul className="list-disc list-inside space-y-1">
            <li>Default search engine preferences</li>
            <li>Privacy & security settings</li>
            <li>Appearance customization</li>
            <li>Data management options</li>
            <li>Advanced proxy configuration</li>
          </ul>
        </div>
      </Card>
    </div>
  );
};

import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { History, Trash2, Search, ExternalLink, Calendar } from "lucide-react";
import { useState } from "react";
import { Separator } from "@/components/ui/separator";

interface BrowserHistoryProps {
  history: { url: string; title: string; timestamp: number }[];
  onSelectUrl: (url: string) => void;
  onClearHistory: () => void;
}

export const BrowserHistory = ({ history, onSelectUrl, onClearHistory }: BrowserHistoryProps) => {
  const [searchQuery, setSearchQuery] = useState("");

  const filteredHistory = history.filter(item =>
    item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    item.url.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const groupedHistory: { [key: string]: typeof history } = {};
  filteredHistory.forEach(item => {
    const date = new Date(item.timestamp).toLocaleDateString();
    if (!groupedHistory[date]) {
      groupedHistory[date] = [];
    }
    groupedHistory[date].push(item);
  });

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/20 p-8 overflow-y-auto">
      <div className="max-w-5xl mx-auto space-y-6 animate-fade-in">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <History className="h-8 w-8 text-primary" />
            <h1 className="text-4xl font-bold bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
              Browsing History
            </h1>
          </div>
          {history.length > 0 && (
            <Button onClick={onClearHistory} variant="destructive" size="sm">
              <Trash2 className="h-4 w-4 mr-2" />
              Clear All History
            </Button>
          )}
        </div>

        <Card className="p-4 border-border/50 backdrop-blur-sm bg-card/80">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search history by title or URL..."
              className="pl-10"
            />
          </div>
        </Card>

        {history.length === 0 ? (
          <Card className="p-12 border-border/50 backdrop-blur-sm bg-card/80 text-center">
            <History className="h-16 w-16 text-muted-foreground mx-auto mb-4 opacity-50" />
            <h2 className="text-2xl font-bold text-muted-foreground mb-2">No History Yet</h2>
            <p className="text-muted-foreground">
              Pages you visit will appear here. Start browsing!
            </p>
          </Card>
        ) : filteredHistory.length === 0 ? (
          <Card className="p-12 border-border/50 backdrop-blur-sm bg-card/80 text-center">
            <Search className="h-16 w-16 text-muted-foreground mx-auto mb-4 opacity-50" />
            <h2 className="text-2xl font-bold text-muted-foreground mb-2">No Results Found</h2>
            <p className="text-muted-foreground">
              Try searching with different keywords
            </p>
          </Card>
        ) : (
          <div className="space-y-6">
            {Object.entries(groupedHistory).map(([date, items]) => (
              <Card key={date} className="p-6 border-border/50 backdrop-blur-sm bg-card/80 hover-scale">
                <div className="flex items-center gap-2 mb-4">
                  <Calendar className="h-5 w-5 text-primary" />
                  <h2 className="text-xl font-bold">{date}</h2>
                  <span className="text-sm text-muted-foreground">({items.length} {items.length === 1 ? 'page' : 'pages'})</span>
                </div>
                <Separator className="mb-4" />
                <div className="space-y-2">
                  {items.map((item, idx) => {
                    let hostname = "";
                    try {
                      hostname = new URL(item.url).hostname;
                    } catch {
                      hostname = item.url;
                    }
                    
                    const time = new Date(item.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

                    return (
                      <div
                        key={idx}
                        className="flex items-center gap-3 p-3 rounded-lg hover:bg-muted/50 transition-colors group cursor-pointer"
                        onClick={() => onSelectUrl(item.url)}
                      >
                        <img 
                          src={`https://www.google.com/s2/favicons?domain=${hostname}`} 
                          alt="" 
                          className="h-5 w-5 flex-shrink-0"
                          onError={(e) => { e.currentTarget.style.display = 'none'; }}
                        />
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <p className="font-medium text-foreground truncate group-hover:text-primary transition-colors">
                              {item.title}
                            </p>
                            <ExternalLink className="h-3 w-3 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0" />
                          </div>
                          <p className="text-sm text-muted-foreground truncate">{item.url}</p>
                        </div>
                        <span className="text-xs text-muted-foreground flex-shrink-0">{time}</span>
                      </div>
                    );
                  })}
                </div>
              </Card>
            ))}
          </div>
        )}

        <div className="text-center text-muted-foreground text-sm pt-4 pb-8">
          <p>Showing {filteredHistory.length} of {history.length} total {history.length === 1 ? 'page' : 'pages'}</p>
        </div>
      </div>
    </div>
  );
};

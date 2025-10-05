import { useState, useRef, useEffect } from "react";
import { ArrowLeft, ArrowRight, RotateCw, X, Plus, Home, Star, History, Download, Settings } from "lucide-react";
import { useNavigate, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator } from "@/components/ui/dropdown-menu";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface Tab {
  id: number;
  title: string;
  url: string;
  history: string[];
  historyIndex: number;
}

const Browser = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const initialUrl = (location.state as { initialUrl?: string })?.initialUrl;
  const [tabs, setTabs] = useState<Tab[]>([
    { id: 1, title: "New Tab", url: "", history: [], historyIndex: -1 }
  ]);
  const [activeTabId, setActiveTabId] = useState(1);
  const [urlInput, setUrlInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [bookmarks, setBookmarks] = useState<string[]>(() => {
    const saved = localStorage.getItem('browser_bookmarks');
    return saved ? JSON.parse(saved) : [];
  });
  const [browserHistory, setBrowserHistory] = useState<{url: string, title: string, timestamp: number}[]>(() => {
    const saved = localStorage.getItem('browser_history');
    return saved ? JSON.parse(saved) : [];
  });
  const [error, setError] = useState<string | null>(null);
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const nextTabId = useRef(2);

  const activeTab = tabs.find(t => t.id === activeTabId);

  useEffect(() => {
    if (activeTab) {
      setUrlInput(activeTab.url);
    }
  }, [activeTabId, activeTab?.url]);

  useEffect(() => {
    localStorage.setItem('browser_bookmarks', JSON.stringify(bookmarks));
  }, [bookmarks]);

  useEffect(() => {
    localStorage.setItem('browser_history', JSON.stringify(browserHistory));
  }, [browserHistory]);

  // Load initial URL from navigation state
  useEffect(() => {
    if (initialUrl && activeTab) {
      setUrlInput(initialUrl);
      loadUrl(initialUrl, activeTab.id);
    }
  }, []);

  const processUrl = (input: string): string => {
    if (!input) return "";
    
    // Check if it's a search query or URL
    if (!input.includes('.') || input.includes(' ')) {
      return `https://www.google.com/search?q=${encodeURIComponent(input)}`;
    }
    
    // Add https if no protocol
    if (!input.startsWith('http://') && !input.startsWith('https://')) {
      return `https://${input}`;
    }
    
    return input;
  };

  const loadUrl = async (url: string, tabId: number) => {
    if (!url) return;

    setLoading(true);
    setError(null);
    
    // Update tab immediately to show we're loading
    setTabs(prev => prev.map(tab => {
      if (tab.id === tabId) {
        const newHistory = tab.history.slice(0, tab.historyIndex + 1);
        newHistory.push(url);
        return {
          ...tab,
          url,
          title: "Loading...",
          history: newHistory,
          historyIndex: newHistory.length - 1
        };
      }
      return tab;
    }));

    // DON'T add to bookmarks - only add to history
    const hostname = new URL(url).hostname;
    setBrowserHistory(prev => {
      // Check if this URL is already in recent history to avoid duplicates
      const existing = prev.find(h => h.url === url);
      if (existing) return prev;
      
      return [{
        url,
        title: hostname,
        timestamp: Date.now()
      }, ...prev.slice(0, 99)];
    });

    // Load directly in iframe
    if (iframeRef.current) {
      iframeRef.current.src = url;
      
      iframeRef.current.onload = () => {
        try {
          const title = iframeRef.current?.contentDocument?.title || hostname;
          setTabs(prev => prev.map(tab => 
            tab.id === tabId ? { ...tab, title } : tab
          ));
          setLoading(false);
          setError(null);
        } catch (e) {
          setTabs(prev => prev.map(tab => 
            tab.id === tabId ? { ...tab, title: hostname } : tab
          ));
          setLoading(false);
        }
      };

      iframeRef.current.onerror = () => {
        setError(`Unable to load ${hostname}. This site blocks browser embedding.`);
        setLoading(false);
        toast.error(`${hostname} refused to connect`);
      };
    }
  };

  const handleNavigate = () => {
    const url = processUrl(urlInput);
    if (url && activeTab) {
      loadUrl(url, activeTab.id);
    }
  };

  const handleBack = () => {
    if (!activeTab || activeTab.historyIndex <= 0) return;
    
    const newIndex = activeTab.historyIndex - 1;
    const url = activeTab.history[newIndex];
    
    setTabs(prev => prev.map(tab => 
      tab.id === activeTabId ? { ...tab, historyIndex: newIndex, url } : tab
    ));
    
    loadUrl(url, activeTabId);
  };

  const handleForward = () => {
    if (!activeTab || activeTab.historyIndex >= activeTab.history.length - 1) return;
    
    const newIndex = activeTab.historyIndex + 1;
    const url = activeTab.history[newIndex];
    
    setTabs(prev => prev.map(tab => 
      tab.id === activeTabId ? { ...tab, historyIndex: newIndex, url } : tab
    ));
    
    loadUrl(url, activeTabId);
  };

  const handleReload = () => {
    if (activeTab?.url) {
      loadUrl(activeTab.url, activeTabId);
    }
  };

  const handleHome = () => {
    setUrlInput("");
    setTabs(prev => prev.map(tab => 
      tab.id === activeTabId ? { ...tab, url: "", title: "New Tab" } : tab
    ));
  };

  const addTab = () => {
    const newTab: Tab = {
      id: nextTabId.current++,
      title: "New Tab",
      url: "",
      history: [],
      historyIndex: -1
    };
    setTabs(prev => [...prev, newTab]);
    setActiveTabId(newTab.id);
  };

  const closeTab = (tabId: number) => {
    if (tabs.length === 1) return;
    
    setTabs(prev => {
      const filtered = prev.filter(t => t.id !== tabId);
      if (activeTabId === tabId && filtered.length > 0) {
        setActiveTabId(filtered[filtered.length - 1].id);
      }
      return filtered;
    });
  };

  const toggleBookmark = () => {
    if (!activeTab?.url) return;
    
    setBookmarks(prev => {
      if (prev.includes(activeTab.url)) {
        toast.success("Bookmark removed");
        return prev.filter(b => b !== activeTab.url);
      } else {
        toast.success("Bookmark added");
        return [...prev, activeTab.url];
      }
    });
  };

  const isBookmarked = activeTab?.url ? bookmarks.includes(activeTab.url) : false;

  const clearHistory = () => {
    setBrowserHistory([]);
    toast.success("History cleared");
  };

  const clearBookmarks = () => {
    setBookmarks([]);
    toast.success("Bookmarks cleared");
  };

  return (
    <div className="h-screen flex flex-col bg-background">
      {/* Tab Bar */}
      <div className="flex items-center gap-1 bg-card border-b border-border px-2 py-1">
        {tabs.map(tab => (
          <div
            key={tab.id}
            className={`flex items-center gap-2 px-4 py-2 rounded-t-lg cursor-pointer min-w-[200px] max-w-[200px] group ${
              activeTabId === tab.id ? 'bg-background' : 'bg-card hover:bg-muted'
            }`}
            onClick={() => setActiveTabId(tab.id)}
          >
            <span className="flex-1 truncate text-sm">{tab.title}</span>
            {tabs.length > 1 && (
              <Button
                variant="ghost"
                size="icon"
                className="h-5 w-5 opacity-0 group-hover:opacity-100"
                onClick={(e) => {
                  e.stopPropagation();
                  closeTab(tab.id);
                }}
              >
                <X className="h-3 w-3" />
              </Button>
            )}
          </div>
        ))}
        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={addTab}>
          <Plus className="h-4 w-4" />
        </Button>
      </div>

      {/* Navigation Bar */}
      <div className="flex items-center gap-2 bg-card border-b border-border px-3 py-2">
        <Button
          variant="ghost"
          size="icon"
          onClick={handleBack}
          disabled={!activeTab || activeTab.historyIndex <= 0}
        >
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          onClick={handleForward}
          disabled={!activeTab || activeTab.historyIndex >= activeTab.history.length - 1}
        >
          <ArrowRight className="h-4 w-4" />
        </Button>
        <Button variant="ghost" size="icon" onClick={handleReload} disabled={loading}>
          <RotateCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
        </Button>
        <Button variant="ghost" size="icon" onClick={handleHome}>
          <Home className="h-4 w-4" />
        </Button>
        
        <form onSubmit={(e) => { e.preventDefault(); handleNavigate(); }} className="flex-1 flex items-center gap-2">
          <Input
            value={urlInput}
            onChange={(e) => setUrlInput(e.target.value)}
            placeholder="Search Google or type a URL"
            className="flex-1"
          />
          <Button 
            variant="ghost" 
            size="icon"
            onClick={toggleBookmark}
            disabled={!activeTab?.url}
          >
            <Star className={`h-4 w-4 ${isBookmarked ? 'fill-primary' : ''}`} />
          </Button>
        </form>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon">
              <Settings className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-64">
            <DropdownMenuItem disabled className="font-semibold">
              Bookmarks
            </DropdownMenuItem>
            {bookmarks.length === 0 ? (
              <DropdownMenuItem disabled className="text-muted-foreground">
                No bookmarks yet
              </DropdownMenuItem>
            ) : (
              bookmarks.slice(0, 5).map((bookmark, i) => (
                <DropdownMenuItem 
                  key={i}
                  onClick={() => {
                    setUrlInput(bookmark);
                    activeTab && loadUrl(bookmark, activeTab.id);
                  }}
                >
                  <Star className="h-3 w-3 mr-2 fill-primary" />
                  {new URL(bookmark).hostname}
                </DropdownMenuItem>
              ))
            )}
            {bookmarks.length > 0 && (
              <DropdownMenuItem onClick={clearBookmarks} className="text-destructive">
                Clear all bookmarks
              </DropdownMenuItem>
            )}
            
            <DropdownMenuSeparator />
            
            <DropdownMenuItem disabled className="font-semibold">
              <History className="h-3 w-3 mr-2" />
              Recent History
            </DropdownMenuItem>
            {browserHistory.length === 0 ? (
              <DropdownMenuItem disabled className="text-muted-foreground">
                No history yet
              </DropdownMenuItem>
            ) : (
              browserHistory.slice(0, 5).map((item, i) => (
                <DropdownMenuItem 
                  key={i}
                  onClick={() => {
                    setUrlInput(item.url);
                    activeTab && loadUrl(item.url, activeTab.id);
                  }}
                >
                  {item.title}
                </DropdownMenuItem>
              ))
            )}
            {browserHistory.length > 0 && (
              <DropdownMenuItem onClick={clearHistory} className="text-destructive">
                Clear history
              </DropdownMenuItem>
            )}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* Content Area */}
      <div className="flex-1 bg-background relative">
        {error && (
          <div className="absolute top-0 left-0 right-0 bg-destructive/10 border-b border-destructive text-foreground p-4 z-10">
            <div className="flex items-center justify-center gap-2">
              <X className="h-4 w-4 text-destructive" />
              <p className="text-sm">
                {error} 
                <span className="ml-2 text-muted-foreground">
                  Sites like Google, YouTube, and many others block iframe access for security.
                </span>
              </p>
            </div>
          </div>
        )}
        {activeTab?.url ? (
          <iframe
            ref={iframeRef}
            src={activeTab.url}
            className="w-full h-full border-0"
            sandbox="allow-same-origin allow-scripts allow-popups allow-forms allow-downloads allow-top-navigation"
            title="Browser Content"
          />
        ) : (
          <div className="flex items-center justify-center h-full">
            <div className="text-center space-y-6 max-w-md">
              <h2 className="text-3xl font-semibold">New Tab</h2>
              <p className="text-muted-foreground">Search Google or enter a URL to browse the web</p>
              
              {bookmarks.length > 0 && (
                <div className="space-y-2">
                  <h3 className="text-sm font-semibold text-muted-foreground">Quick Access</h3>
                  <div className="grid grid-cols-2 gap-2">
                    {bookmarks.slice(0, 4).map((bookmark, i) => (
                      <Button
                        key={i}
                        variant="outline"
                        className="w-full"
                        onClick={() => {
                          setUrlInput(bookmark);
                          loadUrl(bookmark, activeTab.id);
                        }}
                      >
                        <Star className="h-3 w-3 mr-2 fill-primary" />
                        {new URL(bookmark).hostname}
                      </Button>
                    ))}
                  </div>
                </div>
              )}
              
              <Button 
                onClick={() => navigate('/')}
                variant="outline"
                className="mt-4"
              >
                <Home className="h-4 w-4 mr-2" />
                Back to Hideout
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Browser;

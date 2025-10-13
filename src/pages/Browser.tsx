import { useState, useRef, useEffect, useCallback } from "react";
import { X } from "lucide-react";
import { useNavigate, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { TabBar } from "@/components/browser/TabBar";
import { NavigationBar } from "@/components/browser/NavigationBar";
import { BrowserHelp } from "@/components/browser/BrowserHelp";
import { BrowserSettings } from "@/components/browser/BrowserSettings";
import { BrowserHistory } from "@/components/browser/BrowserHistory";
import { supabase } from "@/integrations/supabase/client";
import { GlobalChat } from "@/components/GlobalChat";
import { DevTools } from "@/components/DevTools";

// Browser configuration

interface Tab {
  id: number;
  title: string;
  url: string;
  proxiedUrl: string;
  proxiedHtml?: string;
  history: string[];
  historyIndex: number;
  pinned?: boolean;
}

const Browser = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const initialUrl = (location.state as { initialUrl?: string })?.initialUrl;
  
  const [tabs, setTabs] = useState<Tab[]>(() => {
    const saved = localStorage.getItem('hideout_browser_tabs');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        return parsed.length > 0 ? parsed : [{ id: 1, title: "New Tab", url: "", proxiedUrl: "", history: [], historyIndex: -1 }];
      } catch {
        return [{ id: 1, title: "New Tab", url: "", proxiedUrl: "", history: [], historyIndex: -1 }];
      }
    }
    return [{ id: 1, title: "New Tab", url: "", proxiedUrl: "", history: [], historyIndex: -1 }];
  });
  
  const [activeTabId, setActiveTabId] = useState(() => {
    const saved = localStorage.getItem('hideout_browser_tabs');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        return parsed[0]?.id || 1;
      } catch {
        return 1;
      }
    }
    return 1;
  });
  
  const [urlInput, setUrlInput] = useState("");
  const [engine, setEngine] = useState<"google" | "duckduckgo" | "bing" | "yahoo" | "yandex" | "brave">(() => {
    const saved = localStorage.getItem('hideout_browser_settings');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        return parsed.engine || "google";
      } catch {
        return "google";
      }
    }
    return "google";
  });
  
  const [loading, setLoading] = useState(false);
  const [bookmarks, setBookmarks] = useState<string[]>(() => {
    const saved = localStorage.getItem('hideout_browser_bookmarks');
    return saved ? JSON.parse(saved) : [];
  });
  const [browserHistory, setBrowserHistory] = useState<{url: string, title: string, timestamp: number}[]>(() => {
    const saved = localStorage.getItem('hideout_browser_history');
    return saved ? JSON.parse(saved) : [];
  });
  const [error, setError] = useState<string | null>(null);
  const [showMaxTabsDialog, setShowMaxTabsDialog] = useState(false);
  const [zoom, setZoom] = useState(1);
  const [closedTabs, setClosedTabs] = useState<Tab[]>([]);
  const [showDevTools, setShowDevTools] = useState(false);
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const nextTabId = useRef(2);
  const saveTimeoutRef = useRef<NodeJS.Timeout>();

  const activeTab = tabs.find(t => t.id === activeTabId);

  // Sync browser data to Supabase if user is logged in
  const syncToSupabase = useCallback(async () => {
    try {
      // Prefer Hideout account (custom users)
      const storedUser = localStorage.getItem('hideout_user') || sessionStorage.getItem('hideout_user');
      let accountId: string | null = null;
      if (storedUser) {
        try { accountId = JSON.parse(storedUser)?.id || null; } catch {}
      }

      if (!accountId) {
        const { data: { user } } = await supabase.auth.getUser();
        accountId = user?.id || null;
      }

      if (accountId) {
        const browserData = {
          tabs: JSON.stringify(tabs),
          bookmarks: JSON.stringify(bookmarks),
          history: JSON.stringify(browserHistory.slice(0, 500)),
          settings: JSON.stringify({ engine }),
          user_id: accountId,
          updated_at: new Date().toISOString()
        };
        localStorage.setItem(`hideout_browser_data_${accountId}`, JSON.stringify(browserData));
      }
    } catch (error) {
      console.error('Error syncing browser data:', error);
    }
  }, [tabs, bookmarks, browserHistory, engine]);

  // Debounced save to localStorage and Supabase
  const saveToLocalStorage = useCallback(() => {
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
    }
    saveTimeoutRef.current = setTimeout(async () => {
      localStorage.setItem('hideout_browser_tabs', JSON.stringify(tabs));
      localStorage.setItem('hideout_browser_bookmarks', JSON.stringify(bookmarks));
      localStorage.setItem('hideout_browser_history', JSON.stringify(browserHistory.slice(0, 500)));
      localStorage.setItem('hideout_browser_settings', JSON.stringify({ engine }));
      
      // Sync to Supabase
      await syncToSupabase();
    }, 1000);
  }, [tabs, bookmarks, browserHistory, engine, syncToSupabase]);

  useEffect(() => {
    if (activeTab) {
      setUrlInput(activeTab.url);
    }
  }, [activeTabId, activeTab?.url]);

  useEffect(() => {
    saveToLocalStorage();
  }, [tabs, bookmarks, browserHistory, engine, saveToLocalStorage]);

  // Load initial URL from navigation state or query params
  useEffect(() => {
    const urlParam = new URLSearchParams(window.location.search).get('url');
    const targetUrl = urlParam || initialUrl;
    
    if (targetUrl && activeTab && activeTab.url !== targetUrl) {
      const processedUrl = processUrl(targetUrl);
      setUrlInput(processedUrl);
      loadUrl(processedUrl, activeTab.id);
    }
  }, [initialUrl]);

  const processUrl = (input: string): string => {
    if (!input) return "";
    
    // Handle internal hideout:// pages
    if (input.startsWith('hideout://')) {
      return input;
    }
    
    // Check if it's a search query or URL
    if (!input.includes('.') || input.includes(' ')) {
      const q = encodeURIComponent(input);
      switch (engine) {
        case 'duckduckgo':
          return `https://duckduckgo.com/?q=${q}`;
        case 'bing':
          return `https://www.bing.com/search?q=${q}`;
        case 'yahoo':
          return `https://search.yahoo.com/search?p=${q}`;
        case 'yandex':
          return `https://yandex.com/search/?text=${q}`;
        case 'brave':
          return `https://search.brave.com/search?q=${q}`;
        default:
          return `https://www.google.com/search?q=${q}`;
      }
    }
    
    // Add https if no protocol
    if (!input.startsWith('http://') && !input.startsWith('https://')) {
      return `https://${input}`;
    }
    
    return input;
  };

  // Check if URL is an internal page
  const isInternalPage = (url: string): boolean => {
    return url.startsWith('hideout://');
  };

  // Check if showing new tab view
  const isNewTabView = (url: string): boolean => {
    return !url || url === 'hideout://newtab';
  };

  const loadUrl = async (url: string, tabId: number) => {
    if (!url) return;

    // Handle internal hideout:// pages
    if (isInternalPage(url)) {
      const pageName = url.replace('hideout://', '');
      
      // Special handling for newtab - clear URL to show new tab view
      if (url === 'hideout://newtab') {
        setTabs(prev => prev.map(tab => {
          if (tab.id === tabId) {
            return {
              ...tab,
              url: '',
              proxiedUrl: '',
              proxiedHtml: undefined,
              title: 'New Tab'
            };
          }
          return tab;
        }));
        setLoading(false);
        setError(null);
        return;
      }
      
      setTabs(prev => prev.map(tab => {
        if (tab.id === tabId) {
          const newHistory = tab.history.slice(0, tab.historyIndex + 1);
          newHistory.push(url);
          return {
            ...tab,
            url,
            proxiedUrl: url,
            proxiedHtml: undefined,
            title: `Hideout - ${pageName.charAt(0).toUpperCase() + pageName.slice(1)}`,
            history: newHistory,
            historyIndex: newHistory.length - 1
          };
        }
        return tab;
      }));
      setLoading(false);
      setError(null);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // Use edge function to pr0xy the site and return HTML (with auth attached)
      const hostname = new URL(url).hostname;

      const { data, error } = await supabase.functions.invoke('web-proxy', {
        body: { url }
      });

      if (error || !data?.success || !data?.html) {
        throw new Error((data as any)?.error || error?.message || 'Failed to load page via pr0xy');
      }

      // Update tab with srcDoc HTML
      setTabs(prev => prev.map(tab => {
        if (tab.id === tabId) {
          const newHistory = tab.history.slice(0, tab.historyIndex + 1);
          newHistory.push(url);
          return {
            ...tab,
            url,
            proxiedUrl: '',
            proxiedHtml: data.html,
            title: hostname,
            history: newHistory,
            historyIndex: newHistory.length - 1
          };
        }
        return tab;
      }));

      // Add to browser history (no duplicates)
      setBrowserHistory(prev => {
        const existing = prev.find(h => h.url === url);
        if (existing) return prev;
        return [{ url, title: hostname, timestamp: Date.now() }, ...prev.slice(0, 499)];
      });

      setLoading(false);
      setError(null);
    } catch (error: any) {
      console.error('Error loading URL:', error);
      setError(error.message || 'Failed to load page');
      setLoading(false);
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

  const handleStop = () => {
    try {
      iframeRef.current?.contentWindow?.stop();
    } catch (e) {}
    setLoading(false);
    toast.success("Loading stopped");
  };

  const handleHome = () => {
    // Load home page from account-specific settings first, then global settings, then fallback
    let homeUrl = '';
    try {
      const storedUser = localStorage.getItem('hideout_user') || sessionStorage.getItem('hideout_user');
      let userId: string | null = null;
      if (storedUser) {
        try { userId = JSON.parse(storedUser)?.id || null; } catch {}
      }

      let settings: any = null;
      if (userId) {
        const perUser = localStorage.getItem(`hideout_browser_settings_${userId}`);
        if (perUser) settings = JSON.parse(perUser);
      }
      if (!settings) {
        const saved = localStorage.getItem('hideout_browser_settings');
        if (saved) settings = JSON.parse(saved);
      }

      if (settings) {
        const { homePage, usePreferredBrowser } = settings;
        // If usePreferredBrowser is true or undefined, use engine
        // If false, use custom homePage
        if (usePreferredBrowser !== false) {
          // Use preferred browser (engine)
          const homePages = { 
            google: 'https://google.com', 
            duckduckgo: 'https://duckduckgo.com', 
            bing: 'https://bing.com',
            yahoo: 'https://yahoo.com',
            yandex: 'https://yandex.com',
            brave: 'https://search.brave.com'
          } as const;
          homeUrl = homePages[engine] || 'https://google.com';
        } else if (typeof homePage === 'string' && homePage.trim()) {
          homeUrl = homePage.trim();
        }
      }
    } catch {}

    if (!homeUrl) {
      const homePages = { 
        google: 'https://google.com', 
        duckduckgo: 'https://duckduckgo.com', 
        bing: 'https://bing.com',
        yahoo: 'https://yahoo.com',
        yandex: 'https://yandex.com',
        brave: 'https://search.brave.com'
      } as const;
      homeUrl = homePages[engine] || 'https://google.com';
    }

    setUrlInput(homeUrl);
    if (activeTab) {
      loadUrl(homeUrl, activeTab.id);
    }
  };

  const addTab = () => {
    if (tabs.length >= 5) {
      setShowMaxTabsDialog(true);
      return;
    }
    const newTab: Tab = {
      id: nextTabId.current++,
      title: "New Tab",
      url: "",
      proxiedUrl: "",
      proxiedHtml: undefined,
      history: [],
      historyIndex: -1
    };
    setTabs(prev => [...prev, newTab]);
    setActiveTabId(newTab.id);
  };

  const closeTab = (tabId: number) => {
    if (tabs.length === 1) return;
    
    const closedTab = tabs.find(t => t.id === tabId);
    if (closedTab) {
      setClosedTabs(prev => [closedTab, ...prev.slice(0, 9)]);
    }
    
    setTabs(prev => {
      const filtered = prev.filter(t => t.id !== tabId);
      if (activeTabId === tabId && filtered.length > 0) {
        setActiveTabId(filtered[filtered.length - 1].id);
      }
      return filtered;
    });
  };

  const duplicateTab = (tabId: number) => {
    const tab = tabs.find(t => t.id === tabId);
    if (!tab || tabs.length >= 5) {
      if (tabs.length >= 5) setShowMaxTabsDialog(true);
      return;
    }
    const newTab: Tab = {
      ...tab,
      id: nextTabId.current++
    };
    setTabs(prev => [...prev, newTab]);
    setActiveTabId(newTab.id);
  };

  const closeOtherTabs = (tabId: number) => {
    setTabs(prev => prev.filter(t => t.id === tabId));
    setActiveTabId(tabId);
  };

  const closeTabsToRight = (tabId: number) => {
    const index = tabs.findIndex(t => t.id === tabId);
    if (index === -1) return;
    setTabs(prev => prev.slice(0, index + 1));
  };

  const togglePinTab = (tabId: number) => {
    setTabs(prev => prev.map(tab =>
      tab.id === tabId ? { ...tab, pinned: !tab.pinned } : tab
    ));
  };

  const reopenClosedTab = () => {
    if (closedTabs.length === 0) return;
    const [tabToReopen, ...rest] = closedTabs;
    setClosedTabs(rest);
    const newTab = { ...tabToReopen, id: nextTabId.current++ };
    setTabs(prev => [...prev, newTab]);
    setActiveTabId(newTab.id);
  };

  const toggleBookmark = () => {
    if (!activeTab?.url) return;
    
    setBookmarks(prev => {
      const limited = prev.slice(0, 100);
      if (limited.includes(activeTab.url)) {
        toast.success("Bookmark removed");
        return limited.filter(b => b !== activeTab.url);
      } else {
        toast.success("Bookmark added");
        return [...limited, activeTab.url];
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

  const copyCurrentUrl = async () => {
    if (activeTab?.url) {
      await navigator.clipboard.writeText(activeTab.url);
      toast.success("URL copied");
    }
  };

  const handleClose = () => {
    navigate('/');
  };

  const handleSelectUrl = (url: string) => {
    setUrlInput(url);
    if (activeTab) {
      loadUrl(url, activeTab.id);
    }
  };

  const handleSettingsClick = () => {
    const url = "hideout://settings";
    setUrlInput(url);
    if (activeTab) {
      loadUrl(url, activeTab.id);
    }
  };

  const handleHelpClick = () => {
    const url = "hideout://help";
    setUrlInput(url);
    if (activeTab) {
      loadUrl(url, activeTab.id);
    }
  };

  const handleHistoryClick = () => {
    const url = "hideout://history";
    setUrlInput(url);
    if (activeTab) {
      loadUrl(url, activeTab.id);
    }
  };

  const handleZoomIn = () => {
    setZoom(prev => Math.min(prev + 0.1, 2));
  };

  const handleZoomOut = () => {
    setZoom(prev => Math.max(prev - 0.1, 0.5));
  };


  const closeAllTabs = () => {
    setTabs([{ id: nextTabId.current++, title: "New Tab", url: "", proxiedUrl: "", history: [], historyIndex: -1 }]);
    setActiveTabId(nextTabId.current - 1);
    setShowMaxTabsDialog(false);
    toast.success("All tabs closed");
  };

  // Keyboard shortcuts + DevTools toggle
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // F12 or Ctrl+Shift+I for DevTools
      if (e.key === 'F12' || (e.ctrlKey && e.shiftKey && e.key === 'I')) {
        e.preventDefault();
        setShowDevTools(prev => !prev);
        return;
      }

      if (e.altKey) {
        if (e.key === 't') {
          e.preventDefault();
          addTab();
        } else if (e.key === 'w') {
          e.preventDefault();
          if (activeTab) closeTab(activeTab.id);
        } else if (e.key === 'r') {
          e.preventDefault();
          handleReload();
        } else if (e.key === 'l') {
          e.preventDefault();
          const input = document.querySelector('input[type="text"]') as HTMLInputElement;
          input?.focus();
        } else if (e.key === 'ArrowLeft') {
          e.preventDefault();
          handleBack();
        } else if (e.key === 'ArrowRight') {
          e.preventDefault();
          handleForward();
        } else if (e.shiftKey && e.key === 'T') {
          e.preventDefault();
          reopenClosedTab();
        } else if (e.key === 'Tab') {
          e.preventDefault();
          const currentIndex = tabs.findIndex(t => t.id === activeTabId);
          if (e.shiftKey) {
            const prevIndex = currentIndex > 0 ? currentIndex - 1 : tabs.length - 1;
            setActiveTabId(tabs[prevIndex].id);
          } else {
            const nextIndex = currentIndex < tabs.length - 1 ? currentIndex + 1 : 0;
            setActiveTabId(tabs[nextIndex].id);
          }
        }
      }
    };

    const handleDevToolsToggle = () => {
      setShowDevTools(prev => !prev);
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('hideout:toggle-devtools', handleDevToolsToggle);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('hideout:toggle-devtools', handleDevToolsToggle);
    };
  }, [activeTab, tabs, activeTabId]);
  
  return (
    <div className="h-screen flex flex-col bg-background">
      <h1 className="sr-only">Web Pr0xy Browser</h1>
      
      {/* Tab bar with close button */}
      <div className="flex items-center border-b bg-muted/30 px-2 py-1">
        <div className="flex-1 min-w-0 overflow-x-auto scrollbar-hide">
          <TabBar
            tabs={tabs}
            activeTabId={activeTabId}
            onTabSelect={setActiveTabId}
            onTabClose={closeTab}
            onNewTab={addTab}
            onDuplicateTab={duplicateTab}
            onCloseOthers={closeOtherTabs}
            onCloseToRight={closeTabsToRight}
            onPinTab={togglePinTab}
          />
        </div>
        <Button
          variant="ghost"
          size="icon"
          onClick={handleClose}
          className="ml-2 h-8 w-8 flex-shrink-0 hover:bg-destructive/10 hover:text-destructive transition-colors"
        >
          <X className="h-4 w-4" />
        </Button>
      </div>


      <NavigationBar
        urlInput={urlInput}
        engine={engine}
        loading={loading}
        canGoBack={!!(activeTab && activeTab.historyIndex > 0)}
        canGoForward={!!(activeTab && activeTab.historyIndex < activeTab.history.length - 1)}
        isBookmarked={isBookmarked}
        hasUrl={!!activeTab?.url}
        bookmarks={bookmarks}
        history={browserHistory}
        onUrlChange={setUrlInput}
        onEngineChange={setEngine}
        onNavigate={handleNavigate}
        onBack={handleBack}
        onForward={handleForward}
        onReload={handleReload}
        onStop={handleStop}
        onHome={handleHome}
        onToggleBookmark={toggleBookmark}
        onCopyUrl={copyCurrentUrl}
        onOpenExternal={() => activeTab?.url && window.open(activeTab.url, '_blank')}
        onClearBookmarks={clearBookmarks}
        onClearHistory={clearHistory}
        onSelectUrl={handleSelectUrl}
        onSettingsClick={handleSettingsClick}
        onHelpClick={handleHelpClick}
        onZoomIn={handleZoomIn}
        onZoomOut={handleZoomOut}
        onHistoryClick={handleHistoryClick}
      />

      {/* Content Area */}
      <div className="flex-1 bg-background relative overflow-hidden">
        {loading && !isInternalPage(activeTab?.url || '') && (
          <div className="absolute top-0 left-0 right-0 h-1 bg-primary/20 z-10">
            <div className="h-full bg-primary animate-pulse" style={{ width: '70%' }} />
          </div>
        )}
        {error && (
          <div className="absolute top-0 left-0 right-0 bg-destructive/10 border-b border-destructive text-foreground p-4 z-10">
            <div className="flex items-center justify-center gap-2">
              <X className="h-4 w-4 text-destructive" />
              <p className="text-sm">
                {error} 
                <span className="ml-2 text-muted-foreground">
                  The site may be blocking pr0xy access or experiencing issues.
                </span>
              </p>
              <Button variant="outline" size="sm" onClick={handleReload} className="ml-4">
                Retry
              </Button>
            </div>
          </div>
        )}
        {!isNewTabView(activeTab?.url || '') ? (
          isInternalPage(activeTab?.url || '') ? (
            <div className="w-full h-full overflow-y-auto">
              {activeTab?.url === 'hideout://help' && <BrowserHelp />}
              {activeTab?.url === 'hideout://settings' && <BrowserSettings />}
              {activeTab?.url === 'hideout://history' && (
                <BrowserHistory 
                  history={browserHistory}
                  onSelectUrl={handleSelectUrl}
                  onClearHistory={clearHistory}
                />
              )}
            </div>
          ) : (
            <iframe
              ref={iframeRef}
              src={'about:blank'}
              srcDoc={activeTab?.proxiedHtml || undefined}
              className="w-full h-full border-0 transition-transform duration-200"
              style={{ transform: `scale(${zoom})`, transformOrigin: 'top left' }}
              sandbox="allow-same-origin allow-scripts allow-popups allow-forms allow-downloads allow-top-navigation allow-modals"
              referrerPolicy="no-referrer"
              title="Browser Content"
            />
          )
        ) : (
          <div className="flex items-center justify-center h-full animate-fade-in">
            <div className="text-center space-y-6 max-w-md px-4">
              <h2 className="text-3xl font-semibold">New Tab</h2>
              <p className="text-muted-foreground">Search {engine.charAt(0).toUpperCase() + engine.slice(1)} or enter a URL to browse the web</p>
              <div className="mt-6 p-4 bg-primary/10 rounded-lg">
                <p className="text-sm text-foreground">
                  Need help? Visit{" "}
                  <button
                    onClick={() => handleHelpClick()}
                    className="text-primary hover:underline font-semibold"
                  >
                    hideout://help
                  </button>
                </p>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* DevTools */}
      {showDevTools && <DevTools onClose={() => setShowDevTools(false)} />}

      <AlertDialog open={showMaxTabsDialog} onOpenChange={setShowMaxTabsDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Maximum Tabs Reached</AlertDialogTitle>
            <AlertDialogDescription>
              You've reached the maximum of 5 tabs. Close some tabs to save data and improve performance, or continue browsing with your current tabs.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Continue</AlertDialogCancel>
            <AlertDialogAction onClick={closeAllTabs}>Close All Tabs</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
      <GlobalChat />
    </div>
  );
};

export default Browser;

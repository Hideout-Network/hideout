import { ArrowLeft, ArrowRight, RotateCw, Home, Star, Copy, ExternalLink, Square, MoreVertical, ZoomIn, ZoomOut, Settings, HelpCircle, History } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator } from "@/components/ui/dropdown-menu";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { AutocompleteDropdown } from "./AutocompleteDropdown";
import { useState } from "react";

interface NavigationBarProps {
  urlInput: string;
  engine: "google" | "duckduckgo" | "bing";
  loading: boolean;
  canGoBack: boolean;
  canGoForward: boolean;
  isBookmarked: boolean;
  hasUrl: boolean;
  bookmarks: string[];
  history: { url: string; title: string; timestamp: number }[];
  onUrlChange: (url: string) => void;
  onEngineChange: (engine: "google" | "duckduckgo" | "bing") => void;
  onNavigate: () => void;
  onBack: () => void;
  onForward: () => void;
  onReload: () => void;
  onStop: () => void;
  onHome: () => void;
  onToggleBookmark: () => void;
  onCopyUrl: () => void;
  onOpenExternal: () => void;
  onClearBookmarks: () => void;
  onClearHistory: () => void;
  onSelectUrl: (url: string) => void;
  onSettingsClick: () => void;
  onHelpClick: () => void;
  onZoomIn: () => void;
  onZoomOut: () => void;
  onHistoryClick: () => void;
}

export const NavigationBar = ({
  urlInput,
  engine,
  loading,
  canGoBack,
  canGoForward,
  isBookmarked,
  hasUrl,
  bookmarks,
  history,
  onUrlChange,
  onEngineChange,
  onNavigate,
  onBack,
  onForward,
  onReload,
  onStop,
  onHome,
  onToggleBookmark,
  onCopyUrl,
  onOpenExternal,
  onClearBookmarks,
  onClearHistory,
  onSelectUrl,
  onSettingsClick,
  onHelpClick,
  onZoomIn,
  onZoomOut,
  onHistoryClick,
}: NavigationBarProps) => {
  const [showAutocomplete, setShowAutocomplete] = useState(false);

  return (
    <TooltipProvider>
      <div className="flex items-center gap-2 bg-card border-b border-border px-3 py-2">
        <Tooltip>
          <TooltipTrigger asChild>
            <Button variant="ghost" size="icon" onClick={onBack} disabled={!canGoBack}>
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </TooltipTrigger>
          <TooltipContent>Go Back (Alt+Left Arrow)</TooltipContent>
        </Tooltip>

        <Tooltip>
          <TooltipTrigger asChild>
            <Button variant="ghost" size="icon" onClick={onForward} disabled={!canGoForward}>
              <ArrowRight className="h-4 w-4" />
            </Button>
          </TooltipTrigger>
          <TooltipContent>Go Forward (Alt+Right Arrow)</TooltipContent>
        </Tooltip>

        <Tooltip>
          <TooltipTrigger asChild>
            <Button variant="ghost" size="icon" onClick={onReload} disabled={loading}>
              <RotateCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
            </Button>
          </TooltipTrigger>
          <TooltipContent>Reload Page (Alt+R)</TooltipContent>
        </Tooltip>

        <Tooltip>
          <TooltipTrigger asChild>
            <Button variant="ghost" size="icon" onClick={onStop}>
              <Square className="h-4 w-4" />
            </Button>
          </TooltipTrigger>
          <TooltipContent>Stop Loading</TooltipContent>
        </Tooltip>

        <Tooltip>
          <TooltipTrigger asChild>
            <Button variant="ghost" size="icon" onClick={onHome}>
              <Home className="h-4 w-4" />
            </Button>
          </TooltipTrigger>
          <TooltipContent>Home Page</TooltipContent>
        </Tooltip>

        <form onSubmit={(e) => { e.preventDefault(); onNavigate(); }} className="flex-1 flex items-center gap-2 relative">
          <Select value={engine} onValueChange={(v) => onEngineChange(v as any)}>
            <SelectTrigger className="w-[130px]">
              <SelectValue placeholder="Search engine" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="google">Google</SelectItem>
              <SelectItem value="duckduckgo">DuckDuckGo</SelectItem>
              <SelectItem value="bing">Bing</SelectItem>
            </SelectContent>
          </Select>
          <div className="flex-1 relative">
            <Input
              value={urlInput}
              onChange={(e) => onUrlChange(e.target.value)}
              onFocus={() => setShowAutocomplete(true)}
              onBlur={() => setTimeout(() => setShowAutocomplete(false), 200)}
              placeholder={`Search ${engine.charAt(0).toUpperCase() + engine.slice(1)} or type a URL`}
              className="w-full"
            />
            {showAutocomplete && urlInput && (
              <AutocompleteDropdown
                query={urlInput}
                bookmarks={bookmarks}
                history={history}
                onSelect={(url) => {
                  onSelectUrl(url);
                  setShowAutocomplete(false);
                }}
              />
            )}
          </div>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                onClick={onToggleBookmark}
                disabled={!hasUrl}
              >
                <Star className={`h-4 w-4 ${isBookmarked ? 'fill-primary' : ''}`} />
              </Button>
            </TooltipTrigger>
            <TooltipContent>{isBookmarked ? 'Remove Bookmark' : 'Add Bookmark'}</TooltipContent>
          </Tooltip>
        </form>

        <Tooltip>
          <TooltipTrigger asChild>
            <Button variant="ghost" size="icon" onClick={onCopyUrl} disabled={!hasUrl}>
              <Copy className="h-4 w-4" />
            </Button>
          </TooltipTrigger>
          <TooltipContent>Copy URL</TooltipContent>
        </Tooltip>

        <Tooltip>
          <TooltipTrigger asChild>
            <Button 
              variant="ghost" 
              size="icon" 
              onClick={() => {
                if (hasUrl) onOpenExternal();
              }}
              disabled={!hasUrl}
            >
              <ExternalLink className="h-4 w-4" />
            </Button>
          </TooltipTrigger>
          <TooltipContent>Open in New Window</TooltipContent>
        </Tooltip>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon">
              <MoreVertical className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-64">
            <DropdownMenuItem onClick={onSettingsClick}>
              <Settings className="h-4 w-4 mr-2" />
              Settings
            </DropdownMenuItem>
            <DropdownMenuItem onClick={onHelpClick}>
              <HelpCircle className="h-4 w-4 mr-2" />
              Help
            </DropdownMenuItem>
            <DropdownMenuItem onClick={onHistoryClick}>
              <History className="h-4 w-4 mr-2" />
              History
            </DropdownMenuItem>
            
            <DropdownMenuSeparator />
            
            <DropdownMenuItem onClick={onZoomIn}>
              <ZoomIn className="h-4 w-4 mr-2" />
              Zoom In
            </DropdownMenuItem>
            <DropdownMenuItem onClick={onZoomOut}>
              <ZoomOut className="h-4 w-4 mr-2" />
              Zoom Out
            </DropdownMenuItem>
            
            <DropdownMenuSeparator />
            
            <DropdownMenuItem disabled className="font-semibold">Bookmarks</DropdownMenuItem>
            {bookmarks.length === 0 ? (
              <DropdownMenuItem disabled className="text-muted-foreground">No bookmarks yet</DropdownMenuItem>
            ) : (
              bookmarks.slice(0, 5).map((bookmark, i) => (
                <DropdownMenuItem key={i} onClick={() => onSelectUrl(bookmark)}>
                  <Star className="h-3 w-3 mr-2 fill-primary" />
                  {new URL(bookmark).hostname}
                </DropdownMenuItem>
              ))
            )}
            {bookmarks.length > 0 && (
              <DropdownMenuItem onClick={onClearBookmarks} className="text-destructive">
                Clear all bookmarks
              </DropdownMenuItem>
            )}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </TooltipProvider>
  );
};

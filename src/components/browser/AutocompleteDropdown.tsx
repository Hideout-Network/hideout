import { Globe, Star, Clock } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";

interface AutocompleteDropdownProps {
  query: string;
  bookmarks: string[];
  history: { url: string; title: string; timestamp: number }[];
  onSelect: (url: string) => void;
}

const popularSites = [
  { url: "https://google.com", title: "Google" },
  { url: "https://youtube.com", title: "YouTube" },
  { url: "https://reddit.com", title: "Reddit" },
  { url: "https://twitter.com", title: "Twitter" },
  { url: "https://github.com", title: "GitHub" },
  { url: "https://stackoverflow.com", title: "Stack Overflow" },
];

export const AutocompleteDropdown = ({ query, bookmarks, history, onSelect }: AutocompleteDropdownProps) => {
  const lowerQuery = query.toLowerCase();
  
  const matchedBookmarks = bookmarks
    .filter(url => url.toLowerCase().includes(lowerQuery))
    .slice(0, 3)
    .map(url => ({
      url,
      title: new URL(url).hostname,
      type: 'bookmark' as const
    }));

  const matchedHistory = history
    .filter(item => 
      item.url.toLowerCase().includes(lowerQuery) || 
      item.title.toLowerCase().includes(lowerQuery)
    )
    .slice(0, 3)
    .map(item => ({
      ...item,
      type: 'history' as const
    }));

  const matchedPopular = popularSites
    .filter(site => 
      site.url.toLowerCase().includes(lowerQuery) || 
      site.title.toLowerCase().includes(lowerQuery)
    )
    .slice(0, 2)
    .map(site => ({
      ...site,
      type: 'popular' as const
    }));

  const allSuggestions = [...matchedBookmarks, ...matchedHistory, ...matchedPopular];

  if (allSuggestions.length === 0) return null;

  return (
    <div className="absolute top-full left-0 right-0 mt-1 bg-popover border border-border rounded-md shadow-lg z-50 animate-fade-in">
      <ScrollArea className="max-h-[300px]">
        {allSuggestions.map((suggestion, index) => (
          <div
            key={index}
            className="flex items-center gap-3 px-4 py-2 hover:bg-muted cursor-pointer transition-colors"
            onClick={() => onSelect(suggestion.url)}
          >
            {suggestion.type === 'bookmark' && <Star className="h-4 w-4 text-primary flex-shrink-0" />}
            {suggestion.type === 'history' && <Clock className="h-4 w-4 text-muted-foreground flex-shrink-0" />}
            {suggestion.type === 'popular' && <Globe className="h-4 w-4 text-muted-foreground flex-shrink-0" />}
            <div className="flex-1 min-w-0">
              <div className="text-sm font-medium truncate">{suggestion.title}</div>
              <div className="text-xs text-muted-foreground truncate">{suggestion.url}</div>
            </div>
          </div>
        ))}
      </ScrollArea>
    </div>
  );
};

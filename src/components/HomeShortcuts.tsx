import { useState, useEffect } from "react";
import { Plus, X } from "lucide-react";
import { useNavigate } from "react-router-dom";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";

type Shortcut = {
  id: string;
  name: string;
  url: string;
  icon?: string;
};

const DEFAULT_SHORTCUTS: Shortcut[] = [
  { id: "google", name: "Google", url: "https://google.com", icon: "https://www.google.com/favicon.ico" },
  { id: "youtube", name: "YouTube", url: "https://youtube.com", icon: "https://www.youtube.com/favicon.ico" },
  { id: "tiktok", name: "TikTok", url: "https://tiktok.com", icon: "https://www.tiktok.com/favicon.ico" },
  { id: "twitter", name: "Twitter", url: "https://twitter.com", icon: "https://abs.twimg.com/favicons/twitter.3.ico" },
  { id: "instagram", name: "Instagram", url: "https://instagram.com", icon: "https://www.google.com/s2/favicons?domain=instagram.com&sz=64" },
];

const STORAGE_KEY = "hideout_shortcuts";

export const HomeShortcuts = () => {
  const navigate = useNavigate();
  const [shortcuts, setShortcuts] = useState<Shortcut[]>([]);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [newShortcut, setNewShortcut] = useState({ name: "", url: "" });

  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        // Check if new default shortcuts need to be added (for existing users)
        const existingIds = parsed.map((s: Shortcut) => s.id);
        const missingDefaults = DEFAULT_SHORTCUTS.filter(d => !existingIds.includes(d.id));
        if (missingDefaults.length > 0) {
          const updated = [...parsed, ...missingDefaults];
          setShortcuts(updated);
          localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
        } else {
          setShortcuts(parsed);
        }
      } catch {
        setShortcuts(DEFAULT_SHORTCUTS);
        localStorage.setItem(STORAGE_KEY, JSON.stringify(DEFAULT_SHORTCUTS));
      }
    } else {
      setShortcuts(DEFAULT_SHORTCUTS);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(DEFAULT_SHORTCUTS));
    }
  }, []);

  const saveShortcuts = (newShortcuts: Shortcut[]) => {
    setShortcuts(newShortcuts);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(newShortcuts));
  };

  const handleAddShortcut = () => {
    if (!newShortcut.name.trim() || !newShortcut.url.trim()) return;

    let url = newShortcut.url.trim();
    if (!url.startsWith("http://") && !url.startsWith("https://")) {
      url = "https://" + url;
    }

    // Extract favicon from URL
    const domain = new URL(url).origin;
    const icon = `${domain}/favicon.ico`;

    const shortcut: Shortcut = {
      id: Date.now().toString(),
      name: newShortcut.name.trim(),
      url,
      icon,
    };

    saveShortcuts([...shortcuts, shortcut]);
    setNewShortcut({ name: "", url: "" });
    setIsAddDialogOpen(false);
  };

  const handleRemoveShortcut = (id: string) => {
    saveShortcuts(shortcuts.filter((s) => s.id !== id));
  };

  const handleShortcutClick = (url: string) => {
    navigate("/browser", { state: { initialUrl: url } });
  };

  const getFaviconUrl = (shortcut: Shortcut) => {
    if (shortcut.icon) return shortcut.icon;
    try {
      const domain = new URL(shortcut.url).hostname;
      return `https://www.google.com/s2/favicons?domain=${domain}&sz=64`;
    } catch {
      return null;
    }
  };

  return (
    <div className="flex flex-wrap justify-center gap-3 mt-4">
      {shortcuts.map((shortcut) => (
        <div
          key={shortcut.id}
          className="relative group"
        >
          <button
            onClick={() => handleShortcutClick(shortcut.url)}
            className="w-20 h-20 bg-card hover:bg-card/80 border border-border rounded-xl flex flex-col items-center justify-center gap-2 transition-all hover:scale-105 hover:border-primary/50"
          >
            <img
              src={getFaviconUrl(shortcut) || ""}
              alt={shortcut.name}
              className="w-8 h-8 rounded"
              onError={(e) => {
                const target = e.target as HTMLImageElement;
                target.style.display = "none";
              }}
            />
            <span className="text-xs text-foreground truncate w-full px-1 text-center">
              {shortcut.name}
            </span>
          </button>
          
          {/* Delete button on hover */}
          <button
            onClick={(e) => {
              e.stopPropagation();
              handleRemoveShortcut(shortcut.id);
            }}
            className="absolute -top-2 -right-2 w-6 h-6 bg-destructive rounded-full flex items-center justify-center text-destructive-foreground hover:bg-destructive/80 transition-all opacity-0 group-hover:opacity-100"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      ))}

      {/* Add Shortcut Button */}
      <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
        <DialogTrigger asChild>
          <button className="w-20 h-20 bg-card hover:bg-card/80 border border-border border-dashed rounded-xl flex flex-col items-center justify-center gap-2 transition-all hover:scale-105 hover:border-primary/50">
            <Plus className="w-6 h-6 text-muted-foreground" />
            <span className="text-xs text-muted-foreground">Add</span>
          </button>
        </DialogTrigger>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Shortcut</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 pt-4">
            <div className="space-y-2">
              <Label htmlFor="name">Name</Label>
              <Input
                id="name"
                placeholder="YouTube"
                value={newShortcut.name}
                onChange={(e) => setNewShortcut({ ...newShortcut, name: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="url">URL</Label>
              <Input
                id="url"
                placeholder="https://youtube.com"
                value={newShortcut.url}
                onChange={(e) => setNewShortcut({ ...newShortcut, url: e.target.value })}
              />
            </div>
            <Button onClick={handleAddShortcut} className="w-full">
              Add Shortcut
            </Button>
          </div>
        </DialogContent>
      </Dialog>

    </div>
  );
};

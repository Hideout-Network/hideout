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
  { id: "discord", name: "Discord", url: "https://discord.com", icon: "https://www.google.com/s2/favicons?domain=discord.com&sz=64" },
];

const STORAGE_KEY = "hideout_shortcuts";
const DELETED_STORAGE_KEY = "hideout_deleted_shortcuts";

export const HomeShortcuts = () => {
  const navigate = useNavigate();
  const [shortcuts, setShortcuts] = useState<Shortcut[]>([]);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [newShortcut, setNewShortcut] = useState({ name: "", url: "" });

  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    const deletedIds = JSON.parse(localStorage.getItem(DELETED_STORAGE_KEY) || '[]');
    
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        // Check if new default shortcuts need to be added (for existing users)
        // but exclude any that have been explicitly deleted
        const existingIds = parsed.map((s: Shortcut) => s.id);
        const missingDefaults = DEFAULT_SHORTCUTS.filter(d => 
          !existingIds.includes(d.id) && !deletedIds.includes(d.id)
        );
        if (missingDefaults.length > 0) {
          const updated = [...parsed, ...missingDefaults];
          setShortcuts(updated);
          localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
        } else {
          setShortcuts(parsed);
        }
      } catch {
        const filteredDefaults = DEFAULT_SHORTCUTS.filter(d => !deletedIds.includes(d.id));
        setShortcuts(filteredDefaults);
        localStorage.setItem(STORAGE_KEY, JSON.stringify(filteredDefaults));
      }
    } else {
      const filteredDefaults = DEFAULT_SHORTCUTS.filter(d => !deletedIds.includes(d.id));
      setShortcuts(filteredDefaults);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(filteredDefaults));
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
    // Track deleted shortcuts so they don't get re-added
    const deletedIds = JSON.parse(localStorage.getItem(DELETED_STORAGE_KEY) || '[]');
    if (DEFAULT_SHORTCUTS.some(s => s.id === id) && !deletedIds.includes(id)) {
      deletedIds.push(id);
      localStorage.setItem(DELETED_STORAGE_KEY, JSON.stringify(deletedIds));
    }
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
    <div className="flex items-center justify-center gap-8 mt-4">
      {shortcuts.map((shortcut) => (
        <div
          key={shortcut.id}
          className="relative group flex flex-col items-center gap-2"
        >
          <button
            onClick={() => handleShortcutClick(shortcut.url)}
            className="w-14 h-14 bg-muted/50 hover:bg-muted rounded-full flex items-center justify-center transition-all hover:scale-110"
          >
            <img
              src={getFaviconUrl(shortcut) || ""}
              alt={shortcut.name}
              className="w-7 h-7 rounded-sm"
              onError={(e) => {
                const target = e.target as HTMLImageElement;
                target.style.display = "none";
              }}
            />
          </button>
          <span className="text-sm text-muted-foreground">
            {shortcut.name}
          </span>
          
          {/* Delete button on hover */}
          <button
            onClick={(e) => {
              e.stopPropagation();
              handleRemoveShortcut(shortcut.id);
            }}
            className="absolute -top-1 -right-1 w-5 h-5 bg-destructive rounded-full flex items-center justify-center text-destructive-foreground hover:bg-destructive/80 transition-all opacity-0 group-hover:opacity-100"
          >
            <X className="w-3 h-3" />
          </button>
        </div>
      ))}

      {/* Add Shortcut Button */}
      <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
        <DialogTrigger asChild>
          <div className="flex flex-col items-center gap-2 cursor-pointer group">
            <div className="w-14 h-14 bg-muted/30 hover:bg-muted/50 rounded-full flex items-center justify-center transition-all group-hover:scale-110 border border-dashed border-muted-foreground/30">
              <Plus className="w-6 h-6 text-muted-foreground" />
            </div>
            <span className="text-sm text-muted-foreground">New</span>
          </div>
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

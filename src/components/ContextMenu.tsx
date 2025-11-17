import { useEffect, useState } from "react";
import { LogOut, Trash2, Save, Code, Puzzle } from "lucide-react";
import { useNavigate, useLocation } from "react-router-dom";
import { toast } from "sonner";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

type AddonsData = {
  site: string;
  addons: Array<{
    id: string;
    name: string;
    author: string;
    version: string;
    description: string;
    iconPath: string;
    scriptUrl: string;
  }>;
};

interface ContextMenuProps {
  x: number;
  y: number;
  onClose: () => void;
  isOnBrowser?: boolean;
}

export const ContextMenu = ({
  x,
  y,
  onClose,
  isOnBrowser,
}: ContextMenuProps) => {
  const navigate = useNavigate();
  const location = useLocation();
  const [showLogoutDialog, setShowLogoutDialog] = useState(false);
  const [user, setUser] = useState<any>(null);
  const [addonsData, setAddonsData] = useState<AddonsData | null>(null);
  const [installedAddons, setInstalledAddons] = useState<any[]>([]);
  const [executedAddons, setExecutedAddons] = useState<Record<string, boolean>>({});
  const [showAddonSubmenu, setShowAddonSubmenu] = useState(false);
  const [hoveredAddonId, setHoveredAddonId] = useState<string | null>(null);

  const isGamePage = location.pathname.startsWith("/games");

  useEffect(() => {
    const storedUser =
      localStorage.getItem("hideout_user") ||
      sessionStorage.getItem("hideout_user");
    if (storedUser) {
      try {
        setUser(JSON.parse(storedUser));
      } catch {
        setUser(null);
      }
    }

    // Fetch addons data and load installed addons
    const loadAddons = async () => {
      try {
        const response = await fetch('https://hideout-network.github.io/hideout-assets/addons/addons.json');
        const data: AddonsData = await response.json();
        setAddonsData(data);

        const installed = localStorage.getItem("hideout_installed_addons");
        if (installed) {
          const scriptUrls = JSON.parse(installed);
          const installedAddonsData = data.addons.filter((addon) =>
            scriptUrls.includes(addon.scriptUrl)
          );
          setInstalledAddons(installedAddonsData);
        }
      } catch (error) {
        console.error("Failed to load addons:", error);
      }
    };
    loadAddons();
  }, []);

  const handleOpenInAboutBlank = () => {
    const currentUrl = window.location.href;
    const aboutBlankWindow = window.open("about:blank", "_blank");
    if (aboutBlankWindow) {
      aboutBlankWindow.document.write(`
        <!DOCTYPE html>
        <html>
          <head>
            <title>Hideout</title>
            <style>
              * { margin: 0; padding: 0; box-sizing: border-box; }
              html, body { width: 100%; height: 100%; overflow: hidden; }
              iframe { width: 100%; height: 100%; border: none; }
            </style>
          </head>
          <body>
            <iframe src="${currentUrl}"></iframe>
          </body>
        </html>
      `);
      aboutBlankWindow.document.close();
    }
    onClose();
  };

  const handleDeleteCookies = () => {
    document.cookie.split(";").forEach((c) => {
      document.cookie = c
        .replace(/^ +/, "")
        .replace(/=.*/, "=;expires=" + new Date().toUTCString() + ";path=/");
    });
    toast.success("Cookies deleted");
    onClose();
  };

  const handleDeleteLocalStorage = () => {
    const confirmDelete = window.confirm(
      "This will delete all local storage data. Are you sure?"
    );
    if (confirmDelete) {
      localStorage.clear();
      toast.success("Local storage cleared");
      onClose();
    }
  };

  const handleSaveToAccount = async () => {
    if (!user) {
      toast.error("Please login to save data to your account");
      return;
    }

    try {
      toast.success("Account features have been removed");
    } catch (error) {
      console.error("Error:", error);
      toast.error("Failed to save data");
    }
    onClose();
  };

  const handleLogout = () => {
    if (!user) return;
    setShowLogoutDialog(true);
  };

  const confirmLogout = async () => {
    try {
      // Clear chat username
      localStorage.removeItem("hideout_chat_username");
      
      toast.success("Logged out successfully");
      setShowLogoutDialog(false);
      onClose();
      navigate("/");
    } catch (error) {
      console.error("Logout error:", error);
      toast.error("Logout failed");
    }
  };

  const handleInspect = () => {
    // Dispatch event to open DevTools
    window.dispatchEvent(new CustomEvent("hideout:toggle-devtools"));
    onClose();
  };

  const handleRunAddon = async (addon: any, inIframe: boolean = false) => {
    if (!addonsData) return;

    const fullScriptUrl = `${addonsData.site}${addon.scriptUrl}`;
    const idAttr = "data-hideout-addon";
    const isExecuted = !!executedAddons[addon.scriptUrl];

    const removeScriptsFromRoot = (root: Document | null) => {
      if (!root) return 0;
      const removed: string[] = [];
      Array.from(root.querySelectorAll(`script[${idAttr}="${encodeURIComponent(addon.scriptUrl)}"]`)).forEach((s) => {
        s.remove();
        removed.push("ok");
      });
      return removed.length;
    };

    if (isExecuted) {
      // Unexecute: remove scripts we inserted
      try {
        // Remove from main document
        const removedMain = removeScriptsFromRoot(document);
        // Remove from iframe if present
        let removedIframe = 0;
        if (inIframe && isGamePage) {
          const iframe = document.getElementById("game-iframe") as HTMLIFrameElement | null;
          if (iframe && iframe.contentWindow && iframe.contentWindow.document) {
            removedIframe = removeScriptsFromRoot(iframe.contentWindow.document);
          }
        }

        setExecutedAddons((prev) => {
          const copy = { ...prev };
          delete copy[addon.scriptUrl];
          return copy;
        });
        toast.success("Addon unexecuted");
      } catch (error) {
        console.error("Unexecute error:", error);
        toast.error("Failed to unexecute addon");
      } finally {
        onClose();
      }
      return;
    }

    // Execute
    try {
      if (inIframe && isGamePage) {
        const iframe = document.getElementById("game-iframe") as HTMLIFrameElement | null;
        if (iframe && iframe.contentWindow && iframe.contentWindow.document) {
          try {
            const script = iframe.contentWindow.document.createElement("script");
            script.src = fullScriptUrl;
            script.setAttribute(idAttr, encodeURIComponent(addon.scriptUrl));
            iframe.contentWindow.document.body.appendChild(script);
            setExecutedAddons((prev) => ({ ...prev, [addon.scriptUrl]: true }));
            toast.success("Addon executed");
          } catch (error) {
            toast.error("Cannot inject into cross-origin iframe");
            console.warn("Cross-origin iframe access blocked:", error);
          }
        } else {
          toast.error("No game iframe found");
        }
      } else {
        const script = document.createElement("script");
        script.src = fullScriptUrl;
        script.setAttribute(idAttr, encodeURIComponent(addon.scriptUrl));
        script.onload = () => {
          setExecutedAddons((prev) => ({ ...prev, [addon.scriptUrl]: true }));
          toast.success("Addon executed");
        };
        script.onerror = () => {
          console.error("Failed to load addon from:", fullScriptUrl);
          toast.error("Failed to run addon");
        };
        document.body.appendChild(script);
      }
    } catch (error) {
      console.error("Execute error:", error);
      toast.error("Failed to run addon");
    } finally {
      onClose();
    }
  };
  
  return (
    <>
      <div className="fixed inset-0 z-[9998]" onClick={onClose} />
      <div
        className="fixed z-[9999] bg-card border border-border rounded-lg shadow-2xl py-1 min-w-[220px] backdrop-blur-xl"
        style={{ top: y, left: x }}
      >
        <button
          onClick={handleOpenInAboutBlank}
          className="w-full px-4 py-2.5 text-left text-sm hover:bg-muted/50 flex items-center gap-3 transition-colors"
        >
          <Code className="w-4 h-4" />
          Open in about:blank
        </button>

        <div className="my-1 border-t border-border" />

        <div className="relative">
          <button
            onMouseEnter={() => setShowAddonSubmenu(true)}
            onMouseLeave={() => setShowAddonSubmenu(false)}
            disabled={installedAddons.length === 0}
            className={`w-full px-4 py-2.5 text-left text-sm flex items-center justify-between gap-3 transition-colors ${
              installedAddons.length > 0
                ? "hover:bg-muted/50"
                : "opacity-50 cursor-not-allowed"
            }`}
          >
            <div className="flex items-center gap-3">
              <Puzzle className="w-4 h-4" />
              Add-ons
            </div>
            <span className="text-xs">›</span>
          </button>

          {showAddonSubmenu && installedAddons.length > 0 && addonsData && (
            <div
              onMouseEnter={() => setShowAddonSubmenu(true)}
              onMouseLeave={() => {
                setShowAddonSubmenu(false);
                setHoveredAddonId(null);
              }}
              className="absolute left-full -top-1 -ml-1 bg-card border border-border rounded-lg shadow-2xl min-w-[200px] max-h-[300px] backdrop-blur-xl z-[10000]"
            >
              <div className="py-1 max-h-[300px] overflow-y-auto">
                {installedAddons.map((addon) => (
                  <div
                    key={addon.id}
                    className="relative"
                    onMouseEnter={() => setHoveredAddonId(addon.id)}
                    onMouseLeave={() => setHoveredAddonId(null)}
                  >
                    <button className="w-full px-4 py-2.5 text-left text-sm hover:bg-muted/50 flex items-center justify-between gap-3 transition-colors">
                      <div className="flex items-center gap-3">
                        <img
                          src={`${addonsData.site}${addon.iconPath}`}
                          alt=""
                          className="w-4 h-4 rounded"
                        />
                        <span className="truncate">{addon.name}</span>
                      </div>
                      <span className="text-xs">›</span>
                    </button>

                    {hoveredAddonId === addon.id && (
                      <div
                        className="fixed left-[12.1rem] top-0 bg-card border border-border rounded-lg shadow-2xl py-1 min-w-[160px] backdrop-blur-xl z-[10001]"
                      >
                        <button
                          onClick={() => handleRunAddon(addon, false)}
                          className="w-full px-4 py-2.5 text-left text-sm hover:bg-muted/50 transition-colors"
                        >
                          {executedAddons[addon.scriptUrl] ? "Unexecute" : "Execute"}
                        </button>

                        {/* Execute in iframe remains disabled - clicking main Execute can toggle unexecute */}
                        <button
                          disabled
                          title="Comming soon..."
                          className="w-full px-4 py-2.5 text-left text-sm opacity-50 cursor-not-allowed"
                        >
                          Execute in iframe
                        </button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="my-1 border-t border-border" />

        <button
          onClick={handleSaveToAccount}
          disabled={!user}
          className={`w-full px-4 py-2.5 text-left text-sm flex items-center gap-3 transition-colors ${
            user ? "hover:bg-muted/50" : "opacity-50 cursor-not-allowed"
          }`}
        >
          <Save className="w-4 h-4" />
          Save to account
        </button>

        {isOnBrowser && (
          <>
            <div className="my-1 border-t border-border" />
            <button
              onClick={handleInspect}
              className="w-full px-4 py-2.5 text-left text-sm hover:bg-muted/50 flex items-center gap-3 transition-colors"
            >
              <Code className="w-4 h-4" />
              Inspect
            </button>
          </>
        )}

        <div className="my-1 border-t border-border" />

        <button
          onClick={handleLogout}
          disabled={!user}
          className={`w-full px-4 py-2.5 text-left text-sm flex items-center gap-3 transition-colors ${
            user
              ? "hover:bg-destructive/10 hover:text-destructive"
              : "opacity-50 cursor-not-allowed"
          }`}
        >
          <LogOut className="w-4 h-4" />
          Logout
        </button>
      </div>

      <AlertDialog open={showLogoutDialog} onOpenChange={setShowLogoutDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirm Logout</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to logout? This action could be accidental.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmLogout}>
              Logout
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};

import { useEffect, useState } from "react";
import { Trash2, Code, Puzzle } from "lucide-react";
import { useNavigate, useLocation } from "react-router-dom";
import { toast } from "sonner";

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
  const [addonsData, setAddonsData] = useState<AddonsData | null>(null);
  const [installedAddons, setInstalledAddons] = useState<any[]>([]);
  const [executedAddons, setExecutedAddons] = useState<Record<string, boolean>>({});
  const [showAddonSubmenu, setShowAddonSubmenu] = useState(false);
  const [hoveredAddonId, setHoveredAddonId] = useState<string | null>(null);
  const [cloakSettings, setCloakSettings] = useState({
    showAboutBlankInContextMenu: true,
    showBlobInContextMenu: true,
    showDataInContextMenu: false,
  });

  const isGamePage = location.pathname.startsWith("/games");

  useEffect(() => {
    // Load cloak settings from localStorage
    const savedSettings = localStorage.getItem('hideout_settings');
    if (savedSettings) {
      try {
        const settings = JSON.parse(savedSettings);
        setCloakSettings({
          showAboutBlankInContextMenu: settings.showAboutBlankInContextMenu !== false,
          showBlobInContextMenu: settings.showBlobInContextMenu !== false,
          showDataInContextMenu: settings.showDataInContextMenu === true,
        });
      } catch (e) {
        console.error('Failed to parse settings:', e);
      }
    }
  }, []);

  useEffect(() => {
    // Fetch addons data and load installed addons
    const loadAddons = async () => {
      try {
        const response = await fetch('https://hideout-network.github.io/hideout-assets/addons/addons.json');
        const data: AddonsData = await response.json();
        setAddonsData(data);

        const installed = localStorage.getItem("hideout_installed_addons");
        const imported = localStorage.getItem("imported_addons");
        
        let installedAddonsData: any[] = [];
        
        if (installed) {
          const scriptUrls = JSON.parse(installed);
          installedAddonsData = data.addons.filter((addon) =>
            scriptUrls.includes(addon.scriptUrl)
          );
        }
        
        if (imported) {
          const importedAddonsData = JSON.parse(imported);
          installedAddonsData = [...installedAddonsData, ...importedAddonsData];
        }
        
        setInstalledAddons(installedAddonsData);
      } catch (error) {
        console.error("Failed to load addons:", error);
      }
    };
    loadAddons();
  }, []);

  const handleOpenInAboutBlank = () => {
    const currentUrl = window.location.href;
    
    // Load settings from localStorage
    const savedSettings = localStorage.getItem('hideout_settings');
    let favicon = '';
    let tabName = 'Hideout';
    
    if (savedSettings) {
      try {
        const settings = JSON.parse(savedSettings);
        favicon = settings.aboutBlankFavicon || '';
        tabName = settings.aboutBlankTabName || 'Hideout';
      } catch (e) {
        console.error('Failed to parse settings:', e);
      }
    }
    
    const aboutBlankWindow = window.open("about:blank", "_blank");
    if (aboutBlankWindow) {
      aboutBlankWindow.document.write(`
        <!DOCTYPE html>
        <html>
          <head>
            <title>${tabName}</title>
            ${favicon ? `<link rel="icon" href="${favicon}" type="image/x-icon">` : ''}
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

  const handleOpenInBlob = () => {
    const currentUrl = window.location.href;
    
    // Load settings from localStorage
    const savedSettings = localStorage.getItem('hideout_settings');
    let favicon = '';
    let tabName = 'Hideout';
    
    if (savedSettings) {
      try {
        const settings = JSON.parse(savedSettings);
        favicon = settings.blobFavicon || '';
        tabName = settings.blobTabName || 'Hideout';
      } catch (e) {
        console.error('Failed to parse settings:', e);
      }
    }
    
    const htmlContent = `
      <!DOCTYPE html>
      <html>
        <head>
          <title>${tabName}</title>
          ${favicon ? `<link rel="icon" href="${favicon}" type="image/x-icon">` : ''}
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
    `;

    const blob = new Blob([htmlContent], { type: "text/html" });
    const blobUrl = URL.createObjectURL(blob);
    window.open(blobUrl, "_blank");
    onClose();
  };

  const handleOpenInData = () => {
    const currentUrl = window.location.href;
    
    // Load settings from localStorage
    const savedSettings = localStorage.getItem('hideout_settings');
    let favicon = '';
    let tabName = 'Hideout';
    
    if (savedSettings) {
      try {
        const settings = JSON.parse(savedSettings);
        favicon = settings.dataFavicon || '';
        tabName = settings.dataTabName || 'Hideout';
      } catch (e) {
        console.error('Failed to parse settings:', e);
      }
    }
    
    const faviconTag = favicon ? `<link rel="icon" href="${favicon}" type="image/x-icon">` : '';
    const htmlContent = `<html><head><title>${tabName}</title>${faviconTag}<style>html,body{margin:0;height:100%;}iframe{border:none;width:100%;height:100%;}</style></head><body><iframe src="${currentUrl}"></iframe></body></html>`;
    const dataUrl = `data:text/html,${encodeURIComponent(htmlContent)}`;
    
    window.open(dataUrl, "_blank");
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


  const handleInspect = () => {
    // Dispatch event to open DevTools
    window.dispatchEvent(new CustomEvent("hideout:toggle-devtools"));
    onClose();
  };

  const handleRunAddon = async (addon: any, inIframe: boolean = false) => {
    const isImported = addon.isImported;
    const fullScriptUrl = isImported ? '' : (addonsData ? `${addonsData.site}${addon.scriptUrl}` : addon.scriptUrl);
    const idAttr = "data-hideout-addon";
    const addonKey = isImported ? addon.id : addon.scriptUrl;
    const isExecuted = !!executedAddons[addonKey];

    const removeScriptsFromRoot = (root: Document | null) => {
      if (!root) return 0;
      const removed: string[] = [];
      Array.from(root.querySelectorAll(`script[${idAttr}="${encodeURIComponent(addonKey)}"]`)).forEach((s) => {
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
          delete copy[addonKey];
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
            if (isImported) {
              script.textContent = addon.scriptUrl;
            } else {
              script.src = fullScriptUrl;
            }
            script.setAttribute(idAttr, encodeURIComponent(addonKey));
            iframe.contentWindow.document.body.appendChild(script);
            setExecutedAddons((prev) => ({ ...prev, [addonKey]: true }));
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
        script.setAttribute(idAttr, encodeURIComponent(addonKey));
        
        if (isImported) {
          script.textContent = addon.scriptUrl;
          document.body.appendChild(script);
          setExecutedAddons((prev) => ({ ...prev, [addonKey]: true }));
          toast.success("Addon executed");
        } else {
          script.src = fullScriptUrl;
          script.onload = () => {
            setExecutedAddons((prev) => ({ ...prev, [addonKey]: true }));
            toast.success("Addon executed");
          };
          script.onerror = () => {
            console.error("Failed to load addon from:", fullScriptUrl);
            toast.error("Failed to run addon");
          };
          document.body.appendChild(script);
        }
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
        {cloakSettings.showAboutBlankInContextMenu && (
          <button
            onClick={handleOpenInAboutBlank}
            className="w-full px-4 py-2.5 text-left text-sm hover:bg-muted/50 flex items-center gap-3 transition-colors"
          >
            <Code className="w-4 h-4" />
            Open in about:blank
          </button>
        )}

        {cloakSettings.showBlobInContextMenu && (
          <button
            onClick={handleOpenInBlob}
            className="w-full px-4 py-2.5 text-left text-sm hover:bg-muted/50 flex items-center gap-3 transition-colors"
          >
            <Code className="w-4 h-4" />
            Open in Blob
          </button>
        )}

        {cloakSettings.showDataInContextMenu && (
          <button
            onClick={handleOpenInData}
            className="w-full px-4 py-2.5 text-left text-sm hover:bg-muted/50 flex items-center gap-3 transition-colors"
          >
            <Code className="w-4 h-4" />
            Open in Data
          </button>
        )}

        {(cloakSettings.showAboutBlankInContextMenu || cloakSettings.showBlobInContextMenu || cloakSettings.showDataInContextMenu) && (
          <div className="my-1 border-t border-border" />
        )}

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
                         {!addon.isImported && addonsData && (
                           <img
                             src={`${addonsData.site}${addon.iconPath}`}
                             alt=""
                             className="w-4 h-4 rounded"
                           />
                         )}
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
                          {executedAddons[addon.isImported ? addon.id : addon.scriptUrl] ? "Unexecute" : "Execute"}
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
      </div>
    </>
  );
};

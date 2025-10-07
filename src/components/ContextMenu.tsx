import { useEffect, useState } from "react";
import { LogOut, Trash2, Save, Code } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";

interface ContextMenuProps {
  x: number;
  y: number;
  onClose: () => void;
  isOnBrowser?: boolean;
}

export const ContextMenu = ({ x, y, onClose, isOnBrowser }: ContextMenuProps) => {
  const navigate = useNavigate();
  const [showLogoutDialog, setShowLogoutDialog] = useState(false);
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    const storedUser = localStorage.getItem('hideout_user') || sessionStorage.getItem('hideout_user');
    if (storedUser) {
      try {
        setUser(JSON.parse(storedUser));
      } catch {
        setUser(null);
      }
    }
  }, []);

  const handleOpenInAboutBlank = () => {
    const currentUrl = window.location.href;
    const aboutBlankWindow = window.open('about:blank', '_blank');
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
      document.cookie = c.replace(/^ +/, "").replace(/=.*/, "=;expires=" + new Date().toUTCString() + ";path=/");
    });
    toast.success("Cookies deleted");
    onClose();
  };

  const handleDeleteLocalStorage = () => {
    const confirmDelete = window.confirm("This will delete all local storage data. Are you sure?");
    if (confirmDelete) {
      localStorage.clear();
      toast.success("Local storage cleared");
      onClose();
    }
  };

  const handleSaveToAccount = () => {
    if (!user) {
      toast.error("Please login to save data to your account");
      return;
    }
    // The data is already being saved automatically by the browser component
    toast.success("Data saved to account");
    onClose();
  };

  const handleLogout = () => {
    if (!user) return;
    setShowLogoutDialog(true);
  };

  const confirmLogout = () => {
    localStorage.removeItem('hideout_user');
    sessionStorage.removeItem('hideout_user');
    toast.success("Logged out successfully");
    setShowLogoutDialog(false);
    onClose();
    navigate('/');
  };

  const handleInspect = () => {
    toast.info("Opening DevTools... (Press F12 or Alt+Shift+I)");
    onClose();
  };

  return (
    <>
      <div
        className="fixed inset-0 z-[9998]"
        onClick={onClose}
      />
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

        <button
          onClick={handleDeleteCookies}
          className="w-full px-4 py-2.5 text-left text-sm hover:bg-muted/50 flex items-center gap-3 transition-colors"
        >
          <Trash2 className="w-4 h-4" />
          Delete cookies
        </button>

        <button
          onClick={handleDeleteLocalStorage}
          className="w-full px-4 py-2.5 text-left text-sm hover:bg-muted/50 flex items-center gap-3 transition-colors"
        >
          <Trash2 className="w-4 h-4" />
          Delete local storage
        </button>

        <button
          onClick={handleSaveToAccount}
          disabled={!user}
          className={`w-full px-4 py-2.5 text-left text-sm flex items-center gap-3 transition-colors ${
            user ? 'hover:bg-muted/50' : 'opacity-50 cursor-not-allowed'
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
            user ? 'hover:bg-destructive/10 hover:text-destructive' : 'opacity-50 cursor-not-allowed'
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
            <AlertDialogAction onClick={confirmLogout}>Logout</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};

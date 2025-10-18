import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Navigation } from "@/components/Navigation";
import { GlobalChat } from "@/components/GlobalChat";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { useUserData } from "@/hooks/use-user-data";
import { supabase } from "@/integrations/supabase/client";
import { LogOut, Trash2, Key } from "lucide-react";
import { ChangePasswordDialog } from "@/components/ChangePasswordDialog";
import { usePageTitle } from "@/hooks/use-page-title";
import { StarBackground } from "@/components/StarBackground";
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

const Account = () => {
  usePageTitle('Account');
  const navigate = useNavigate();
  const { toast } = useToast();
  const { clearLocalData } = useUserData();
  const [user, setUser] = useState<any>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [showLogoutDialog, setShowLogoutDialog] = useState(false);
  const [showChangePasswordDialog, setShowChangePasswordDialog] = useState(false);

  useEffect(() => {
    const storedUser = localStorage.getItem('hideout_user') || sessionStorage.getItem('hideout_user');
    if (storedUser) {
      setUser(JSON.parse(storedUser));
    } else {
      navigate('/auth');
    }
  }, [navigate]);

  const handleLogout = async () => {
    if (!user) return;

    try {
      // Import the setLoggingOut function
      const { setLoggingOut } = await import('@/hooks/use-user-data');
      
      // Save current data to account before clearing
      const { saveToAccount } = useUserData();
      await saveToAccount();
      
      // Set flag to prevent auto-save during clear
      setLoggingOut(true);
      
      // Small delay to ensure save completes
      await new Promise(resolve => setTimeout(resolve, 100));
      
      // Clear all localStorage and cookies from browser (NOT database)
      clearLocalData();
      
      // Remove user session
      localStorage.removeItem('hideout_user');
      sessionStorage.removeItem('hideout_user');
      
      toast({
        title: "Logged Out",
        description: "Your data has been saved to your account",
      });
      
      navigate('/');
    } catch (error) {
      console.error('Logout error:', error);
      toast({
        title: "Error",
        description: "Failed to logout properly",
        variant: "destructive",
      });
    }
  };

  const handleDeleteAccount = async () => {
    if (!user) return;

    try {
      // Delete user from database (CASCADE will delete all related data)
      const { error: deleteError } = await supabase
        .from('users')
        .delete()
        .eq('id', user.id);

      if (deleteError) {
        console.error('Failed to delete user:', deleteError);
        throw new Error('Failed to delete account');
      }

      // Clear all local data
      clearLocalData();
      
      toast({ 
        title: 'Account Deleted', 
        description: 'Your account and all data have been permanently deleted',
        duration: 5000
      });
      
      setTimeout(() => navigate('/'), 500);
      
    } catch (error: any) {
      console.error('Delete account error:', error);
      toast({
        title: 'Error',
        description: error?.message || 'Failed to delete account. Please try again.',
        variant: 'destructive',
      });
    }
  };

  if (!user) {
    return null;
  }

  return (
    <div className="min-h-screen bg-background relative">
      <StarBackground />
      <Navigation />
      <GlobalChat />
      <main className="pt-24 px-4 sm:px-6 pb-12 max-w-2xl mx-auto relative z-10">
        <Card className="p-8 bg-card border-border">
          <div className="space-y-8">
            <div className="text-center">
              <h1 className="text-3xl font-bold text-foreground mb-2">My Account</h1>
              <p className="text-muted-foreground">Manage your Hideout Network account</p>
            </div>

            <div className="space-y-6">
              <div className="p-4 bg-background rounded-lg border border-border">
                <h3 className="text-sm font-medium text-muted-foreground mb-1">Username</h3>
                <p className="text-xl font-bold text-foreground">{user.username}</p>
                <p className="text-xs text-muted-foreground mt-2">
                  ⚠️ Usernames cannot be changed once created
                </p>
              </div>

              <div className="p-4 bg-background rounded-lg border border-border">
                <div className="flex items-center justify-between mb-1">
                  <h3 className="text-sm font-medium text-muted-foreground">Password</h3>
                </div>
                <p className="text-xl font-mono text-foreground">
                  ••••••••••••••••
                </p>
                <p className="text-xs text-muted-foreground mt-2">
                  Password is securely encrypted. Use "Change Password" to update.
                </p>
              </div>

              <div className="pt-4 space-y-3">
                <Button
                  variant="outline"
                  className="w-full gap-2"
                  onClick={() => setShowChangePasswordDialog(true)}
                >
                  <Key className="w-4 h-4" />
                  Change Password
                </Button>

                <Button
                  variant="outline"
                  className="w-full gap-2"
                  onClick={() => setShowLogoutDialog(true)}
                >
                  <LogOut className="w-4 h-4" />
                  Logout
                </Button>

                <Button
                  variant="destructive"
                  className="w-full gap-2"
                  onClick={() => setShowDeleteDialog(true)}
                >
                  <Trash2 className="w-4 h-4" />
                  Delete Account
                </Button>
              </div>

              <div className="p-4 bg-muted rounded-lg">
                <p className="text-sm text-muted-foreground">
                  <strong>Note:</strong> Accounts inactive for 2 weeks are automatically deleted to save storage space.
                </p>
              </div>
            </div>
          </div>
        </Card>

        {/* Logout Dialog */}
        <AlertDialog open={showLogoutDialog} onOpenChange={setShowLogoutDialog}>
          <AlertDialogContent className="bg-card border-border">
            <AlertDialogHeader>
              <AlertDialogTitle>Logout</AlertDialogTitle>
              <AlertDialogDescription>
                Make sure you remember your username and password before logging out.
                You will need them to log back in.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction onClick={handleLogout}>Logout</AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

        {/* Delete Account Dialog */}
        <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
          <AlertDialogContent className="bg-card border-border">
            <AlertDialogHeader>
              <AlertDialogTitle>Delete Account</AlertDialogTitle>
              <AlertDialogDescription>
                This action cannot be undone. This will permanently delete your account,
                all your game data, and favorites. Are you absolutely sure?
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction
                onClick={handleDeleteAccount}
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              >
                Delete Account
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

        {/* Change Password Dialog */}
        <ChangePasswordDialog
          open={showChangePasswordDialog}
          onOpenChange={setShowChangePasswordDialog}
          userId={user?.id}
          username={user?.username}
        />
      </main>
    </div>
  );
};

export default Account;
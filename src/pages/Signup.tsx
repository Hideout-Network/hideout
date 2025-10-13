import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Navigation } from "@/components/Navigation";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Eye, EyeOff } from "lucide-react";

const Signup = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showAgreement, setShowAgreement] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = () => {
    if (!username || !password) {
      toast({
        title: "Error",
        description: "Please fill in all fields",
        variant: "destructive",
      });
      return;
    }

    if (username.length < 3 || username.length > 20) {
      toast({
        title: "Error",
        description: "Username must be between 3 and 20 characters",
        variant: "destructive",
      });
      return;
    }

    if (!/^[a-zA-Z0-9_-]+$/.test(username)) {
      toast({
        title: "Error",
        description: "Username can only contain letters, numbers, hyphens, and underscores",
        variant: "destructive",
      });
      return;
    }

    if (password.length < 8) {
      toast({
        title: "Error",
        description: "Password must be at least 8 characters",
        variant: "destructive",
      });
      return;
    }

    setShowAgreement(true);
  };

  const handleAgree = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('auth-signup', {
        body: { username, password }
      });

      if (error) throw error;

      if (data.error) {
        toast({
          title: "Signup Failed",
          description: data.error,
          variant: "destructive",
        });
        setShowAgreement(false);
        return;
      }

      localStorage.setItem('hideout_user', JSON.stringify({ ...data.user, password }));

      toast({
        title: "Success",
        description: "Account created successfully!",
        duration: 5000,
      });

      navigate('/account');
    } catch (error) {
      console.error('Signup error:', error);
      toast({
        title: "Error",
        description: "An error occurred during signup",
        variant: "destructive",
      });
      setShowAgreement(false);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      <main className="pt-24 px-4 sm:px-6 pb-12 max-w-md mx-auto">
        <Card className="p-8 bg-card border-border">
          <div className="space-y-6">
            <div className="text-center">
              <h1 className="text-3xl font-bold text-foreground mb-2">Create Account</h1>
              <p className="text-muted-foreground">Join Hideout Network today</p>
            </div>

            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="username">Username (3-20 characters)</Label>
                <Input
                  id="username"
                  placeholder="Choose a username"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="bg-background border-border"
                  maxLength={20}
                />
                <p className="text-xs text-muted-foreground">
                  Only letters, numbers, hyphens, and underscores allowed
                </p>
                <p className="text-xs text-yellow-500">
                  ⚠️ Choose carefully - usernames cannot be changed later!
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="password">Password (min 8 characters)</Label>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    placeholder="Create a secure password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="bg-background border-border pr-10"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                <p className="text-xs text-yellow-500">
                  ⚠️ Keep your password safe! If you lose it, you cannot recover your account.
                </p>
              </div>

              <Button className="w-full" onClick={handleSubmit}>
                Create Account
              </Button>

              <div className="text-center">
                <button
                  onClick={() => navigate('/auth')}
                  className="text-sm text-primary hover:underline"
                >
                  Already have an account? Login
                </button>
              </div>
            </div>
          </div>
        </Card>

        <AlertDialog open={showAgreement} onOpenChange={setShowAgreement}>
          <AlertDialogContent className="bg-card border-border max-h-[80vh] overflow-y-auto">
            <AlertDialogHeader>
              <AlertDialogTitle>Terms of Service & Privacy Policy</AlertDialogTitle>
              <AlertDialogDescription className="text-left space-y-4">
                <div>
                  <h3 className="font-bold text-foreground mb-2">Terms of Service</h3>
                  <p className="text-sm">By creating an account, you agree to:</p>
                  <ul className="list-disc list-inside text-sm space-y-1 mt-2">
                    <li>Use the service responsibly and legally</li>
                    <li>Not share your account credentials with others</li>
                    <li>Accept that you are solely responsible for your account security</li>
                    <li className="text-yellow-500 font-medium">Accounts inactive for 2 weeks will be automatically deleted</li>
                    <li className="text-destructive font-medium">If you lose your password or account access, it is completely your fault and not ours. We cannot recover lost accounts.</li>
                  </ul>
                </div>

                <div>
                  <h3 className="font-bold text-foreground mb-2">Privacy Policy</h3>
                  <ul className="list-disc list-inside text-sm space-y-1">
                    <li>We only store your username and encrypted password</li>
                    <li>Your data is used solely for account authentication</li>
                    <li>We do not share your information with third parties</li>
                    <li>You can delete your account at any time</li>
                    <li>Inactive accounts are automatically deleted after 2 weeks</li>
                  </ul>
                </div>

                <p className="text-xs text-muted-foreground mt-4">
                  For more information, visit <a href="/terms" className="text-primary hover:underline">Terms of Service</a> and <a href="/privacy" className="text-primary hover:underline">Privacy Policy</a>.
                </p>
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <Button variant="outline" onClick={() => setShowAgreement(false)}>
                Cancel
              </Button>
              <Button onClick={handleAgree} disabled={isLoading}>
                {isLoading ? "Creating Account..." : "I Agree"}
              </Button>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </main>
    </div>
  );
};

export default Signup;
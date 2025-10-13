import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Navigation } from "@/components/Navigation";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { useToast } from "@/hooks/use-toast";
import { useUserData } from "@/hooks/use-user-data";
import { supabase } from "@/integrations/supabase/client";
import { Eye, EyeOff } from "lucide-react";

const Auth = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { loadFromAccount: loadData } = useUserData();
  const [isLogin, setIsLogin] = useState(true);
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleLogin = async () => {
    if (!username || !password) {
      toast({
        title: "Error",
        description: "Please fill in all fields",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('auth-login', {
        body: { username, password }
      });

      if (error) throw error;

      if (data.error) {
        toast({
          title: "Login Failed",
          description: data.error,
          variant: "destructive",
        });
        return;
      }

      const storageType = rememberMe ? localStorage : sessionStorage;
      storageType.setItem('hideout_user', JSON.stringify(data.user));

      // Load all user data from account
      await loadData();

      toast({
        title: "Success",
        description: "Logged in successfully! Your data has been loaded.",
        duration: 5000,
      });

      navigate('/account');
    } catch (error) {
      console.error('Login error:', error);
      toast({
        title: "Error",
        description: "An error occurred during login",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateAccount = () => {
    navigate('/signup');
  };

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      <main className="pt-24 px-4 sm:px-6 pb-12 max-w-md mx-auto">
        <Card className="p-8 bg-card border-border">
          <div className="space-y-6">
            <div className="text-center">
              <h1 className="text-3xl font-bold text-foreground mb-2">Login</h1>
              <p className="text-muted-foreground">Enter your credentials to access your account</p>
            </div>

            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="username">Username</Label>
                <Input
                  id="username"
                  placeholder="Enter your username"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="bg-background border-border"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    placeholder="Enter your password"
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
              </div>

              <div className="flex items-center space-x-2">
                <Checkbox 
                  id="remember" 
                  checked={rememberMe}
                  onCheckedChange={(checked) => setRememberMe(checked as boolean)}
                />
                <Label htmlFor="remember" className="text-sm text-muted-foreground cursor-pointer">
                  Remember me (save login data)
                </Label>
              </div>

              <Button 
                className="w-full" 
                onClick={handleLogin}
                disabled={isLoading}
              >
                {isLoading ? "Logging in..." : "Login"}
              </Button>

              <div className="text-center">
                <button
                  onClick={handleCreateAccount}
                  className="text-sm text-primary hover:underline"
                >
                  Create Account
                </button>
              </div>
            </div>
          </div>
        </Card>
      </main>
    </div>
  );
};

export default Auth;
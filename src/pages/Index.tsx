import { Navigation } from "@/components/Navigation";
import { Input } from "@/components/ui/input";
import { Search, MessageCircle, Mail, FileText, Shield } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";
import { ReportBugDialog } from "@/components/ReportBugDialog";
import { RequestGameDialog } from "@/components/RequestGameDialog";
import { GlobalChat } from "@/components/GlobalChat";
import versionData from "@/data/version.json";

const Index = () => {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    const storedUser = localStorage.getItem('hideout_user') || sessionStorage.getItem('hideout_user');
    if (storedUser) {
      const currentPath = window.location.pathname;
      if (currentPath === '/auth' || currentPath === '/signup') {
        navigate('/account');
      }
    }
  }, [navigate]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      // Redirect to browser with search query
      const url = searchQuery.includes('.') && !searchQuery.includes(' ')
        ? (searchQuery.startsWith('http') ? searchQuery : `https://${searchQuery}`)
        : `https://www.google.com/search?q=${encodeURIComponent(searchQuery)}`;
      
      navigate('/browser', { state: { initialUrl: url } });
    }
  };
  return (
    <div className="min-h-screen bg-background relative">
      <Navigation />
      <GlobalChat />

      {/* Main Content */}
      <div className="min-h-screen flex items-center justify-center px-6">
        <main className="relative text-center space-y-12 animate-fade-in w-full max-w-3xl">
          {/* Big Hideout Text */}
          <div className="relative">
            <h1 className="text-9xl md:text-[12rem] font-bold tracking-tight">
              <span className="text-foreground">Hideout</span>
              <span className="text-primary">.</span>
            </h1>
            <Link 
              to="/changelog" 
              className="text-lg text-muted-foreground mt-2 hover:text-primary transition-colors inline-block cursor-pointer"
            >
              {versionData.version}
            </Link>
          </div>

          {/* Search Bar with Button Inside */}
          <form onSubmit={handleSearch} className="relative w-full">
            <Search className="absolute left-6 top-1/2 -translate-y-1/2 w-6 h-6 text-muted-foreground z-10" />
            <Input 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="search anything" 
              className="w-full h-16 pl-16 pr-32 text-lg bg-card border-border transition-colors rounded-2xl"
            />
            <button 
              type="submit"
              className="absolute right-2 top-1/2 -translate-y-1/2 h-12 px-6 bg-primary text-primary-foreground font-semibold rounded-xl hover:bg-primary/90 transition-colors"
            >
              Search
            </button>
          </form>
          
          {/* Action Buttons */}
          <div className="flex justify-center gap-3">
            <ReportBugDialog />
            <RequestGameDialog />
          </div>

          {/* Footer */}
          <footer className="mt-24 text-center space-y-4 text-sm text-muted-foreground">
            <div className="flex justify-center gap-6 flex-wrap">
              <a 
                href="https://discord.gg/HkbVraQH89" 
                target="_blank" 
                rel="noopener noreferrer"
                className="flex items-center gap-2 hover:text-primary transition-colors"
              >
                <MessageCircle className="w-4 h-4" />
                Discord Server
              </a>
              <a 
                href="mailto:hideout-network-buisness@hotmail.com"
                className="flex items-center gap-2 hover:text-primary transition-colors"
              >
                <Mail className="w-4 h-4" />
                Support
              </a>
              <Link 
                to="/terms"
                className="flex items-center gap-2 hover:text-primary transition-colors"
              >
                <FileText className="w-4 h-4" />
                Terms of Service
              </Link>
              <Link 
                to="/privacy"
                className="flex items-center gap-2 hover:text-primary transition-colors"
              >
                <Shield className="w-4 h-4" />
                Privacy Policy
              </Link>
            </div>
            <p>&copy; {new Date().getFullYear()} Hideout Network. All rights reserved.</p>
          </footer>
        </main>
      </div>
    </div>
  );
};

export default Index;

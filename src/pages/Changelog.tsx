import { Navigation } from "@/components/Navigation";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { usePageTitle } from "@/hooks/use-page-title";
import updatesData from "@/jsons/updates.json";
import { Calendar } from "lucide-react";
import { SiGithub } from "react-icons/si";
import { StarBackground } from "@/components/StarBackground";

type Update = {
  updateNumber: number;
  version: string;
  updateDate: string;
  changes: string[];
  githubLink?: string;
};

const updates: Update[] = updatesData;

const Changelog = () => {
  usePageTitle('Changelog');
  // Sort by updateNumber descending (latest first)
  const sortedUpdates = [...updates].sort((a, b) => b.updateNumber - a.updateNumber);

  return (
    <div className="min-h-screen bg-background relative">
      <StarBackground />
      <Navigation />
      <main className="pt-24 px-4 sm:px-6 pb-12 max-w-4xl mx-auto relative z-10">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-foreground mb-2">
            Changelog
          </h1>
          <p className="text-muted-foreground">
            Track all updates and improvements to Hideout
          </p>
        </div>

        <div className="space-y-6">
          {sortedUpdates.map((update, index) => (
            <Card 
              key={update.updateNumber} 
              className="p-6 bg-card border-border hover:border-primary/50 transition-all duration-300 animate-fade-in hover:shadow-card"
              style={{ animationDelay: `${index * 100}ms` }}
            >
              <div className="flex items-start justify-between mb-4">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <h2 className="text-2xl font-bold text-foreground">
                      {update.version}
                    </h2>
                    <Badge variant="outline">Update #{update.updateNumber}</Badge>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Calendar className="w-4 h-4" />
                    <span>{new Date(update.updateDate).toLocaleDateString('en-US', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric'
                    })}</span>
                  </div>
                </div>
                {update.githubLink && (
                  <Button
                    onClick={() => window.open(update.githubLink, "_blank")}
                    variant="outline"
                    size="sm"
                    className="gap-2"
                  >
                    <SiGithub className="w-4 h-4" />
                    GitHub
                  </Button>
                )}
              </div>

              <div className="space-y-2 max-h-96 overflow-y-auto pr-2 custom-scrollbar">
                {update.changes.map((change, idx) => (
                  <div
                    key={idx}
                    className="flex items-start gap-3 text-sm text-foreground p-3 rounded-lg hover:bg-muted/50 transition-all duration-200 group border border-transparent hover:border-primary/20"
                  >
                    <span className="text-primary group-hover:scale-110 transition-transform">{change.split(' ')[0]}</span>
                    <span className="flex-1">{change.substring(change.indexOf(' ') + 1)}</span>
                  </div>
                ))}
              </div>
            </Card>
          ))}
        </div>
      </main>
    </div>
  );
};

export default Changelog;

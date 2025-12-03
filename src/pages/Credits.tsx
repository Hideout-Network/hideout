import { Navigation } from "@/components/Navigation";
import { Card } from "@/components/ui/card";
import { usePageTitle } from "@/hooks/use-page-title";
import { Users, Github } from "lucide-react";
import { GlobalChat } from "@/components/GlobalChat";
import { StarBackground } from "@/components/StarBackground";
import { Button } from "@/components/ui/button";

const contributors = [
  {
    name: "Thedogecraft",
    image: "/images/doge.jpg",
    github: "https://github.com/thedogecraft"
  },
  {
    name: "Sandwich",
    image: "/images/sandwich.jpg",
    github: "https://github.com/sandwichoriginal"
  },
  {
    name: "Gn Math",
    image: "/images/gn-math.png",
    github: "https://github.com/gn-math"
  }
];

const Credits = () => {
  usePageTitle('Credits');
  return (
    <div className="min-h-screen bg-background relative">
      <StarBackground />
      <Navigation />
      <GlobalChat />

      <main className="pt-24 px-6 pb-12 max-w-6xl mx-auto relative z-10">
        {/* Header */}
        <div className="space-y-6 mb-12 animate-fade-in text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-primary/10 mb-4">
            <Users className="w-8 h-8 text-primary" />
          </div>
          <h1 className="text-4xl font-bold text-foreground">Credits</h1>
          <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
            Special thanks to our amazing contributors who helped make this project possible.
          </p>
        </div>

        {/* Contributors Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {contributors.map((contributor, index) => (
            <Card 
              key={contributor.name}
              className="p-8 bg-card border-border hover:border-primary/50 transition-all animate-fade-in group"
              style={{ animationDelay: `${index * 100}ms` }}
            >
              <div className="flex flex-col items-center text-center space-y-4">
                {/* Profile Image */}
                <div className="relative">
                  <img
                    src={contributor.image}
                    alt={`${contributor.name} profile`}
                    className="w-32 h-32 rounded-full object-cover border-4 border-primary/20 group-hover:border-primary/50 transition-all group-hover:scale-105"
                  />
                </div>

                {/* Name */}
                <h3 className="text-xl font-bold text-foreground">
                  {contributor.name}
                </h3>

                {/* GitHub Link */}
                <a 
                  href={contributor.github}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full"
                >
                  <Button 
                    variant="outline" 
                    className="w-full gap-2 group-hover:border-primary/50"
                  >
                    <Github className="w-4 h-4" />
                    View GitHub
                  </Button>
                </a>
              </div>
            </Card>
          ))}
        </div>
      </main>
    </div>
  );
};

export default Credits;

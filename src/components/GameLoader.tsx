import { useEffect, useState } from "react";

interface GameLoaderProps {
  gameName: string;
  gameImage: string;
  onLoadComplete: () => void;
}

export const GameLoader = ({ gameName, gameImage, onLoadComplete }: GameLoaderProps) => {
  const [progress, setProgress] = useState(0);
  const [isFadingOut, setIsFadingOut] = useState(false);

  useEffect(() => {
    const duration = 8000; // 8 seconds
    const startTime = Date.now();

    const animate = () => {
      const elapsed = Date.now() - startTime;
      const newProgress = Math.min(elapsed / duration, 1);
      setProgress(newProgress);

      if (newProgress < 1) {
        requestAnimationFrame(animate);
      } else {
        // Start fade out after reaching 100%
        setTimeout(() => {
          setIsFadingOut(true);
          // Complete after fade animation
          setTimeout(() => {
            onLoadComplete();
          }, 800);
        }, 200);
      }
    };

    animate();
  }, [onLoadComplete]);

  const rotation = progress * 1080; // 3 full rotations

  return (
    <div
      className={`absolute inset-0 z-50 flex items-center justify-center transition-all duration-1000 rounded-lg overflow-hidden ${
        isFadingOut ? 'opacity-0 bg-primary' : 'bg-background'
      }`}
    >
      <div className="flex flex-col items-center gap-8">
        <div className="relative w-[320px] h-[320px]">
          {/* Game Image */}
          <img
            src={gameImage}
            alt={gameName}
            className="w-full h-full rounded-full object-cover absolute top-0 left-0 z-[1] border-[6px] border-border shadow-2xl"
            onError={(e) => {
              e.currentTarget.style.backgroundColor = 'hsl(var(--muted))';
            }}
          />

          {/* Rotating Lines */}
          <div 
            className="absolute -top-4 -left-4 w-[344px] h-[344px] z-[2]"
            style={{ 
              transform: `rotate(${rotation}deg)`,
              transition: 'none'
            }}
          >
            <svg
              className="w-full h-full overflow-visible"
              viewBox="0 0 344 344"
            >
              {/* Right Line */}
              <path
                d="M 172 8 A 164 164 0 0 1 336 172"
                fill="none"
                stroke="hsl(var(--primary))"
                strokeWidth="8"
                strokeLinecap="round"
                className="drop-shadow-[0_0_12px_hsl(var(--primary))]"
              />
              {/* Left Line */}
              <path
                d="M 172 336 A 164 164 0 0 1 8 172"
                fill="none"
                stroke="hsl(var(--primary))"
                strokeWidth="8"
                strokeLinecap="round"
                className="drop-shadow-[0_0_12px_hsl(var(--primary))]"
              />
            </svg>
          </div>
        </div>

        {/* Loading Notice */}
        <div className="text-muted-foreground text-sm text-center flex items-center gap-2 animate-fade-in">
          <span>Loading may take between 1-20 seconds</span>
          <span className="text-muted-foreground/50">•</span>
          <a href="/help" className="text-primary hover:underline">
            Need Help?
          </a>
        </div>
      </div>
    </div>
  );
};

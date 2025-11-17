import { useEffect, useState, useRef } from 'react';

export const FPSCounter = () => {
  const [fps, setFps] = useState(0);
  const frameCountRef = useRef(0);
  const lastTimeRef = useRef(performance.now());
  const animationRef = useRef<number>();

  useEffect(() => {
    const measureFPS = () => {
      frameCountRef.current++;
      const currentTime = performance.now();
      const elapsed = currentTime - lastTimeRef.current;

      if (elapsed >= 1000) {
        setFps(Math.round((frameCountRef.current * 1000) / elapsed));
        frameCountRef.current = 0;
        lastTimeRef.current = currentTime;
      }

      animationRef.current = requestAnimationFrame(measureFPS);
    };

    animationRef.current = requestAnimationFrame(measureFPS);

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, []);

  return (
    <div className="absolute top-2 left-2 z-[9999] bg-black/80 backdrop-blur-sm text-white px-3 py-1.5 rounded-lg text-sm font-mono border border-primary/30 pointer-events-none">
      {fps} FPS
    </div>
  );
};

import { useEffect, useState } from "react";

interface AnimatedBorderProps {
  className?: string;
}

export const AnimatedBorder = ({ className = "" }: AnimatedBorderProps) => {
  const [borderColor, setBorderColor] = useState("hsl(142, 76%, 36%)");

  useEffect(() => {
    const updateColor = () => {
      const root = document.documentElement;
      const primaryHue = getComputedStyle(root).getPropertyValue('--primary').trim();
      if (primaryHue) {
        setBorderColor(`hsl(${primaryHue})`);
      }
    };

    updateColor();

    const observer = new MutationObserver(updateColor);
    observer.observe(document.documentElement, { 
      attributes: true, 
      attributeFilter: ['class', 'style'] 
    });

    return () => observer.disconnect();
  }, []);

  return (
    <div 
      className={`absolute pointer-events-none z-20 ${className}`}
      style={{ inset: '-2px', borderRadius: '16px', overflow: 'hidden' }}
    >
      <svg 
        viewBox="0 0 504 54" 
        preserveAspectRatio="none"
        style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%' }}
      >
        <defs>
          <filter id="glow">
            <feGaussianBlur stdDeviation="2" result="coloredBlur"/>
            <feMerge>
              <feMergeNode in="coloredBlur"/>
              <feMergeNode in="SourceGraphic"/>
            </feMerge>
          </filter>
        </defs>
        <rect 
          x="2" 
          y="2" 
          width="500" 
          height="50" 
          rx="14" 
          ry="14" 
          fill="none" 
          stroke={borderColor}
          strokeWidth="3"
          strokeDasharray="280 1840"
          pathLength="2120"
          filter="url(#glow)"
        >
          <animate 
            attributeName="stroke-dashoffset" 
            from="0" 
            to="-2120" 
            dur="4s" 
            repeatCount="indefinite"
          />
        </rect>
      </svg>
    </div>
  );
};

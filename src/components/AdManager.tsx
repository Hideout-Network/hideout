import { useEffect, useRef } from 'react';

type AdConfig = {
  banner728x90: { key: string };
  banner160x600: { key: string };
  socialBar: string;
};

const AD_CONFIGS: Record<string, AdConfig> = {
  'www.usehideout.xyz': {
    banner728x90: { key: '246b6621dfa0cd52945f0b078b6e0675' },
    banner160x600: { key: '3b803b456069ef6e76185ce466ec645b' },
    socialBar: '//eventabsorbedrichard.com/10/09/af/1009af6830a75cb3a01abfe7e90d6a5d.js',
  },
  'usehideout.xyz': {
    banner728x90: { key: '246b6621dfa0cd52945f0b078b6e0675' },
    banner160x600: { key: '3b803b456069ef6e76185ce466ec645b' },
    socialBar: '//eventabsorbedrichard.com/10/09/af/1009af6830a75cb3a01abfe7e90d6a5d.js',
  },
  'hideout-now.lovable.app': {
    banner728x90: { key: '86a81d9a2c2c68b2d58df6db627edf20' },
    banner160x600: { key: '2109f3d989be1842cff906ee5042285b' },
    socialBar: '//eventabsorbedrichard.com/81/be/08/81be08761cb56f661f055429c4a52f35.js',
  },
};

const getAdConfig = (): AdConfig | null => {
  const hostname = window.location.hostname;
  return AD_CONFIGS[hostname] || null;
};

// Component for 728x90 banner
export const Banner728x90 = ({ className = '' }: { className?: string }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const config = getAdConfig();

  useEffect(() => {
    if (!config || !containerRef.current) return;

    const container = containerRef.current;
    container.innerHTML = '';

    // Set atOptions
    (window as any).atOptions = {
      key: config.banner728x90.key,
      format: 'iframe',
      height: 90,
      width: 728,
      params: {},
    };

    // Load the script
    const script = document.createElement('script');
    script.type = 'text/javascript';
    script.src = `//www.highperformanceformat.com/${config.banner728x90.key}/invoke.js`;
    container.appendChild(script);
  }, [config]);

  if (!config) return null;

  return (
    <div 
      ref={containerRef} 
      className={`flex justify-center items-center min-h-[90px] ${className}`}
    />
  );
};

// Component for 160x600 banner
export const Banner160x600 = ({ className = '' }: { className?: string }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const config = getAdConfig();

  useEffect(() => {
    if (!config || !containerRef.current) return;

    const container = containerRef.current;
    container.innerHTML = '';

    // Set atOptions
    (window as any).atOptions = {
      key: config.banner160x600.key,
      format: 'iframe',
      height: 600,
      width: 160,
      params: {},
    };

    // Load the script
    const script = document.createElement('script');
    script.type = 'text/javascript';
    script.src = `//www.highperformanceformat.com/${config.banner160x600.key}/invoke.js`;
    container.appendChild(script);
  }, [config]);

  if (!config) return null;

  return (
    <div 
      ref={containerRef} 
      className={`flex justify-center items-center min-h-[600px] ${className}`}
    />
  );
};

// Sticky bottom banner component - centered ad only, no full-width background
export const StickyBottomBanner = () => {
  const config = getAdConfig();
  
  if (!config) return null;

  return (
    <div className="fixed bottom-4 left-1/2 -translate-x-1/2 z-40 pointer-events-none">
      <div className="pointer-events-auto">
        <Banner728x90 />
      </div>
    </div>
  );
};

// Global social bar loader
export const GlobalAdsLoader = () => {
  const config = getAdConfig();

  useEffect(() => {
    if (!config) return;

    // Load social bar script
    const socialBarScript = document.createElement('script');
    socialBarScript.type = 'text/javascript';
    socialBarScript.src = config.socialBar;
    socialBarScript.async = true;
    document.body.appendChild(socialBarScript);

    return () => {
      if (socialBarScript.parentNode) {
        socialBarScript.parentNode.removeChild(socialBarScript);
      }
    };
  }, [config]);

  return null;
};

// Check if ads should be shown
export const shouldShowAds = (): boolean => {
  return getAdConfig() !== null;
};

import { useEffect, useRef } from 'react';

type AdConfig = {
  nativeBanner: { scriptSrc: string; containerId: string };
  socialBar: string;
};

const AD_CONFIGS: Record<string, AdConfig> = {
  'www.usehideout.xyz': {
    nativeBanner: { 
      scriptSrc: '//eventabsorbedrichard.com/97b0e31ff1e66d538cb3ac619c5026c7/invoke.js',
      containerId: 'container-97b0e31ff1e66d538cb3ac619c5026c7'
    },
    socialBar: '//eventabsorbedrichard.com/10/09/af/1009af6830a75cb3a01abfe7e90d6a5d.js',
  },
  'usehideout.xyz': {
    nativeBanner: { 
      scriptSrc: '//eventabsorbedrichard.com/97b0e31ff1e66d538cb3ac619c5026c7/invoke.js',
      containerId: 'container-97b0e31ff1e66d538cb3ac619c5026c7'
    },
    socialBar: '//eventabsorbedrichard.com/10/09/af/1009af6830a75cb3a01abfe7e90d6a5d.js',
  },
  'hideout-now.lovable.app': {
    nativeBanner: { 
      scriptSrc: '//eventabsorbedrichard.com/9d64edd0de06beae1d2e687411238f68/invoke.js',
      containerId: 'container-9d64edd0de06beae1d2e687411238f68'
    },
    socialBar: '//eventabsorbedrichard.com/81/be/08/81be08761cb56f661f055429c4a52f35.js',
  },
};

const getAdConfig = (): AdConfig | null => {
  const hostname = window.location.hostname;
  return AD_CONFIGS[hostname] || null;
};

// Native Banner Ad Component
export const NativeBanner = ({ className = '' }: { className?: string }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const config = getAdConfig();

  useEffect(() => {
    if (!config || !containerRef.current) return;

    const container = containerRef.current;
    container.innerHTML = '';

    // Create the container div for the ad
    const adContainer = document.createElement('div');
    adContainer.id = config.nativeBanner.containerId;
    container.appendChild(adContainer);

    // Load the script
    const script = document.createElement('script');
    script.async = true;
    script.setAttribute('data-cfasync', 'false');
    script.src = config.nativeBanner.scriptSrc;
    container.appendChild(script);
  }, [config]);

  if (!config) return null;

  return (
    <div 
      ref={containerRef} 
      className={`flex justify-center items-center ${className}`}
    />
  );
};

// Aliases for backward compatibility
export const Banner728x90 = NativeBanner;
export const Banner160x600 = NativeBanner;

// Sticky bottom banner component
export const StickyBottomBanner = () => {
  const config = getAdConfig();
  
  if (!config) return null;

  return (
    <div className="fixed bottom-4 left-1/2 -translate-x-1/2 z-40 pointer-events-none">
      <div className="pointer-events-auto">
        <NativeBanner />
      </div>
    </div>
  );
};

// Global social bar loader (popunder disabled)
export const GlobalAdsLoader = () => {
  return null;
};

// Check if ads should be shown
export const shouldShowAds = (): boolean => {
  return getAdConfig() !== null;
};

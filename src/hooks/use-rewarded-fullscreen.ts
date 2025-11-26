import { useCallback } from 'react';

declare global {
  interface Window {
    ezRewardedAds?: {
      cmd: Array<() => void>;
      requestWithOverlay: (
        callback: (result: { status: boolean; reward?: boolean; msg?: string }) => void,
        options: { cancel: string; header: string; body: string[]; accept: string },
        config: { rewardName: string; rewardOnNoFill: boolean }
      ) => void;
    };
  }
}

export const useRewardedFullscreen = () => {
  const enterFullscreen = useCallback((element?: HTMLElement) => {
    try {
      const targetElement = element || document.documentElement;
      if (targetElement.requestFullscreen) {
        targetElement.requestFullscreen();
      } else if ((targetElement as any).webkitRequestFullscreen) {
        (targetElement as any).webkitRequestFullscreen();
      } else if ((targetElement as any).mozRequestFullScreen) {
        (targetElement as any).mozRequestFullScreen();
      } else if ((targetElement as any).msRequestFullscreen) {
        (targetElement as any).msRequestFullscreen();
      }
    } catch (error) {
      console.error('Fullscreen request failed:', error);
    }
  }, []);

  const requestFullscreenWithAd = useCallback((element?: HTMLElement) => {
    try {
      if (!window.ezRewardedAds || !window.ezRewardedAds.cmd) {
        console.error('Ezoic Rewarded Ads API not initialized. Fullscreen will be blocked.');
        return;
      }

      window.ezRewardedAds.cmd.push(() => {
        try {
          window.ezRewardedAds!.requestWithOverlay(
            (result) => {
              try {
                if (result && result.status) {
                  if (result.reward) {
                    console.log('Rewarded ad completed successfully, granting fullscreen');
                    enterFullscreen(element);
                  } else {
                    console.log('User closed ad early or did not receive reward; fullscreen denied');
                  }
                } else {
                  console.error('Rewarded ad error or no fill:', result && result.msg);
                  if (result && result.status === false && result.msg) {
                    console.warn('Ad request returned failure message:', result.msg);
                  }
                  console.log('Ad failed to load/show; fullscreen denied');
                }
              } catch (callbackError) {
                console.error('Error in rewarded ad callback:', callbackError);
              }
            },
            {
              cancel: 'Cancel',
              header: 'Fullscreen',
              body: ['Watch an AD to Fullscreen!'],
              accept: 'Fullscreen'
            },
            {
              rewardName: 'Fullscreen',
              rewardOnNoFill: true
            }
          );
        } catch (requestError) {
          console.error('Error calling requestWithOverlay:', requestError);
        }
      });
    } catch (error) {
      console.error('Error triggering rewarded ad flow:', error);
    }
  }, [enterFullscreen]);

  return { requestFullscreenWithAd };
};

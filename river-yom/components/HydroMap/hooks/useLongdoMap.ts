import { useEffect, useRef, useState } from 'react';

export const useLongdoMap = (mapKey: string) => {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const [map, setMap] = useState<any>(null);
  const [hasError, setHasError] = useState(false);

  useEffect(() => {
    function initMap() {
      if (!window.longdo?.Map || !mapContainerRef.current) {
        setHasError(true);
        return;
      }

      try {
        setMap(new window.longdo.Map({
          placeholder: mapContainerRef.current,
          language: 'th',
        }));
      } catch {
        setHasError(true);
      }
    }

    if (window.longdo?.Map) {
      initMap();
      return;
    }

    const existingScript = document.querySelector<HTMLScriptElement>('#longdoMapScript');
    const script = existingScript ?? document.createElement('script');

    function handleError() {
      script.remove();
      setHasError(true);
    }

    script.addEventListener('load', initMap);
    script.addEventListener('error', handleError);
    if (!existingScript) {
      script.id = 'longdoMapScript';
      script.src = `https://api.longdo.com/map/?key=${mapKey}`;
      script.async = true;
      document.body.appendChild(script);
    }

    return () => {
      script.removeEventListener('load', initMap);
      script.removeEventListener('error', handleError);
    };
  }, [mapKey]);

  return { map, isReady: map !== null, hasError, mapContainerRef };
};

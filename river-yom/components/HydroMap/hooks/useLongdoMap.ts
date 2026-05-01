import { useEffect, useRef, useState } from 'react';

export const useLongdoMap = (mapKey: string) => {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const [map, setMap] = useState<any>(null);
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    if (document.querySelector('#longdoMapScript')) {
      initMap();
      return;
    }

    const script = document.createElement('script');
    script.id = 'longdoMapScript';
    script.src = `https://api.longdo.com/map/?key=${mapKey}`;
    script.async = true;
    document.body.appendChild(script);

    script.onload = () => {
      window.longdo = (window as any).longdo;
      initMap();
    };
  }, [mapKey]);

  const initMap = () => {
    if (!window.longdo?.Map || !mapContainerRef.current) return;
    const newMap = new window.longdo.Map({
      placeholder: mapContainerRef.current,
      language: 'th',
    });
    setMap(newMap);
    setIsReady(true);
  };

  return { map, isReady, mapContainerRef };
};
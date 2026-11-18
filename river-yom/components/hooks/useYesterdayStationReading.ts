import { useEffect, useState } from 'react';
import { API_URL } from '@/lib/utility';
import { thaiTodayYMD } from './useRasData';

interface StationReading {
  datetime: string;
  wl?: number | null;
  wl_upper?: number | null;
  wl_lower?: number | null;
  discharge?: number | null;
}

export function useYesterdayStationReading(type: 'tele' | 'flow' | 'gate', stationCode: string, currentTime?: string | null) {
  const today = thaiTodayYMD();
  const previousDay = new Date(`${today}T00:00:00Z`);
  previousDay.setUTCDate(previousDay.getUTCDate() - 1);
  const yesterday = previousDay.toISOString().slice(0, 10);
  const requestUrl = stationCode && currentTime?.slice(0, 10) === today
    ? `${API_URL}/api/daily/${type}/${yesterday}?sta_code=${encodeURIComponent(stationCode)}${type === 'gate' ? '&exact_day=1' : ''}`
    : null;

  const [reading, setReading] = useState<{ url: string; data: StationReading } | null>(null);

  useEffect(() => {
    if (!requestUrl) return;
    const controller = new AbortController();

    async function load() {
      if (!requestUrl) return;
      try {
        const response = await fetch(requestUrl, { signal: controller.signal });
        if (!response.ok) return;
        const { data } = await response.json();
        if (!controller.signal.aborted && data?.datetime?.slice(0, 10) === yesterday) {
          setReading({ url: requestUrl, data });
        }
      } catch {
        // The current reading can still be shown if the comparison is unavailable.
      }
    }

    void load();
    return () => controller.abort();
  }, [requestUrl, yesterday]);

  return reading?.url === requestUrl ? reading.data : undefined;
}

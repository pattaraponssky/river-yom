import { useEffect, useState } from 'react';
import { API_URL } from '@/lib/utility';
import type { StationInfo, RainDataItem, FlowDataItem, GateDataItem, TeleDataItem } from '../hydro';

interface MapReadings {
  flow: FlowDataItem[];
  rain: RainDataItem[];
  gate: GateDataItem[];
  tele: TeleDataItem[];
}

const emptyReadings: MapReadings = { flow: [], rain: [], gate: [], tele: [] };
const emptyInfo: Record<keyof MapReadings, StationInfo[]> = { flow: [], rain: [], gate: [], tele: [] };

export const useHydroData = () => {
  const [info, setInfo] = useState(emptyInfo);
  const [readings, setReadings] = useState(emptyReadings);

  useEffect(() => {
    const controller = new AbortController();

    async function load(path: string) {
      const response = await fetch(`${API_URL}/api/${path}`, { signal: controller.signal });
      if (!response.ok) throw new Error(`${path}: ${response.status}`);
      return (await response.json()).data;
    }

    const types = ['flow', 'rain', 'gate', 'tele'] as const;
    for (const type of types) {
      load(`${type}_info`)
        .then(rows => {
          if (!controller.signal.aborted && Array.isArray(rows)) {
            setInfo(current => ({ ...current, [type]: rows }));
          }
        })
        .catch(error => { if (!controller.signal.aborted) console.error(error); });
    }

    async function loadReadings() {
      try {
        const data = await load('map-station-readings');
        if (!types.every(type => Array.isArray(data?.[type]))) {
          throw new Error('Invalid map-station-readings response');
        }
        if (!controller.signal.aborted) setReadings(data);
      } catch {
        if (controller.signal.aborted) return;

        // Older API deployments can still supply readings without loading chart history.
        await Promise.allSettled(types.map(async type => {
          const rows = await load(`daily/${type}`);
          if (!controller.signal.aborted && Array.isArray(rows)) {
            setReadings(current => ({ ...current, [type]: rows }));
          }
        }));
      }
    }

    void loadReadings();
    return () => controller.abort();
  }, []);

  return {
    flowInfo: info.flow, gateInfo: info.gate, rainInfo: info.rain, teleInfo: info.tele,
    latestRainData: readings.rain, latestFlowData: readings.flow,
    latestGateData: readings.gate, latestTeleData: readings.tele,
  };
};

// src/components/HydroMap/types/hydro.ts
export interface HydroMapProps {
  mapKey: string;
  JsonPaths: string[];
  height?: string;
}

export interface RainDataItem { sta_code: string; date: string; wl?: string | null; volume?: string | null; rain_mm?: string | null; rainSeries?: string | null; }
export interface FlowDataItem { sta_code: string; date: string; wl?: string | null; discharge?: string | null; }
export interface GateDataItem { sta_code: string; date: string; wl_upper?: string | null; wl_lower?: string | null; discharge?: string | null; }

export interface StationInfo {
  sta_code: string;
  lat: string;
  long: string;
  sta_name: string;
  district: string;
  province: string;
}
// lib/gateConfig.ts

export interface GateConfig {
  id: string;
  label: string;
  maxHeight: number;  // ความสูงสูงสุดของบาน (เมตร)
  fieldName: string;  // field ใน API ที่เก็บค่า
  color?: string;
}

export interface GateStationConfig {
  sta_code: string;
  sta_name: string;
  gates: GateConfig[];
  wlUpperField?: string;
  wlLowerField?: string;
  visualMinLevel?: number;   // ระดับน้ำต่ำสุดที่ใช้แสดง (เช่น 15)
  visualMaxLevel?: number;   // ระดับน้ำสูงสุดที่ใช้แสดง (เช่น 26)
}

export const GATE_STATION_CONFIGS: Record<string, GateStationConfig> = {
  'tng': {
    sta_code: 'tng',
    sta_name: 'ปตร.ท่านางงาม',
    gates: [
      { id: 'gate1', label: 'บานที่ 1', maxHeight: 8.0, fieldName: 'gate1_height' },
      { id: 'gate2', label: 'บานที่ 2', maxHeight: 8.0, fieldName: 'gate2_height' },
      { id: 'gate3', label: 'บานที่ 3', maxHeight: 8.0, fieldName: 'gate3_height' },
      { id: 'gate4', label: 'บานที่ 4', maxHeight: 8.0, fieldName: 'gate4_height' },
      { id: 'gate5', label: 'บานที่ 5', maxHeight: 8.0, fieldName: 'gate5_height' }, 
    ],
    wlUpperField: 'wl_upper',
    wlLowerField: 'wl_lower',
    visualMinLevel: 29.5,   // ปรับได้ตามสถานี
    visualMaxLevel: 44.0,   // ปรับได้ตามสถานี
  },
  'wst': {
    sta_code: 'wst',
    sta_name: 'ปตร.วังสะตือ',
    gates: [
      { id: 'gate1', label: 'บานที่ 1', maxHeight: 7.0, fieldName: 'gate1_height' },
      { id: 'gate2', label: 'บานที่ 2', maxHeight: 7.0, fieldName: 'gate2_height' },
      { id: 'gate3', label: 'บานที่ 3', maxHeight: 7.0, fieldName: 'gate3_height' },
      { id: 'gate4', label: 'บานที่ 4', maxHeight: 7.0, fieldName: 'gate4_height' },
      { id: 'gate5', label: 'บานที่ 5', maxHeight: 7.0, fieldName: 'gate5_height' },
      { id: 'gate6', label: 'บานที่ 6', maxHeight: 7.0, fieldName: 'gate6_height' },
      { id: 'gate7', label: 'บานที่ 7', maxHeight: 7.0, fieldName: 'gate6_height' },
    ],
    wlUpperField: 'wl_upper',
    wlLowerField: 'wl_lower',
    visualMinLevel: 34,
    visualMaxLevel: 42,
  },
  'kpk': {
    sta_code: 'kpk',
    sta_name: 'ปตร.คลองปลากด',
    gates: [
      { id: 'gate1', label: 'บานที่ 1', maxHeight: 5.0, fieldName: 'gate1_height' },
    ],
    wlUpperField: 'wl_upper',
    wlLowerField: 'wl_lower',
    visualMinLevel: 34,
    visualMaxLevel: 42,
  },
};
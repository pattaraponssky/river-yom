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
}

// กำหนดแต่ละสถานี
export const GATE_STATION_CONFIGS: Record<string, GateStationConfig> = {
  'tng': {
    sta_code: 'tng',
    sta_name: 'ปตร.ท่านางงาม',
    gates: [
      { id: 'gate1', label: 'บานที่ 1', maxHeight: 6.0, fieldName: 'gate1_height', color: '#1565C0' },
      { id: 'gate2', label: 'บานที่ 2', maxHeight: 6.0, fieldName: 'gate2_height', color: '#1565C0' },
      { id: 'gate3', label: 'บานที่ 3', maxHeight: 6.0, fieldName: 'gate3_height', color: '#1565C0' },
      { id: 'gate4', label: 'บานที่ 4', maxHeight: 6.0, fieldName: 'gate4_height', color: '#1565C0' },
      { id: 'gate5', label: 'บานที่ 5', maxHeight: 6.0, fieldName: 'gate4_height', color: '#1565C0' },
    ],
    wlUpperField: 'wl_upper',
    wlLowerField: 'wl_lower',
  },
  'wst': {
    sta_code: 'wst',
    sta_name: 'ปตร.วังสะตือ',
    gates: [
        { id: 'gate1', label: 'บานที่ 1', maxHeight: 6.0, fieldName: 'gate1_height', color: '#1565C0' },
        { id: 'gate2', label: 'บานที่ 2', maxHeight: 6.0, fieldName: 'gate2_height', color: '#1565C0' },
        { id: 'gate3', label: 'บานที่ 3', maxHeight: 6.0, fieldName: 'gate3_height', color: '#1565C0' },
        { id: 'gate4', label: 'บานที่ 4', maxHeight: 6.0, fieldName: 'gate4_height', color: '#1565C0' },
        { id: 'gate5', label: 'บานที่ 5', maxHeight: 6.0, fieldName: 'gate5_height', color: '#1565C0' },
        { id: 'gate6', label: 'บานที่ 6', maxHeight: 6.0, fieldName: 'gate6_height', color: '#1565C0' },
    ],
    wlUpperField: 'wl_upper',
    wlLowerField: 'wl_lower',
  },
};
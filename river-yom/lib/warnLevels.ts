// lib/warnLevels.ts

export interface WarnLevel {
  normal: number;
  watch:  number;
  alert:  number;
  crisis: number;
}

// ─── Tele (สถานีโทรมาตร) ──────────────────────────────────────
export const TELE_WARN_LEVELS: Record<string, WarnLevel> = {
  "01": { normal: 41.0, watch: 43.0, alert: 45.0, crisis: 47.0 },
  "02": { normal: 42.0, watch: 44.0, alert: 46.0, crisis: 48.0 },
};

// ─── Gate (ประตูระบายน้ำ) ─────────────────────────────────────
export const GATE_WARN_LEVELS: Record<string, WarnLevel> = {
  kpk: { normal: 38.86, watch: 40.86, alert: 41.93, crisis: 43.00 },
  wst: { normal: 37.38, watch: 39.38, alert: 40.18, crisis: 40.98 },
  tng: { normal: 39.10, watch: 41.10, alert: 42.55, crisis: 44.00 },
};

// ─── Flow (น้ำท่า) ────────────────────────────────────────────
export const FLOW_WARN_LEVELS: Record<string, WarnLevel> = {
  "Y.4":  { normal: 47.87, watch: 49.87, alert: 50.68, crisis: 51.48 },
  "Y.15": { normal: 41.89, watch: 43.89, alert: 44.97, crisis: 46.05 },
  "Y.50": { normal: 37.56, watch: 39.56, alert: 40.17, crisis: 40.78 },
  // "Y.16": { normal: 2.00, watch: 2.16, alert: 2.28, crisis: 2.40 },
  // "Y.64": { normal: 1.10, watch: 1.20, alert: 1.35, crisis: 1.50 },
};


// ─── Rain (ฝน) ────────────────────────────────────────────────
export const RAIN_WARN_LEVELS: Record<string, WarnLevel> = {
  default: { normal: 0, watch: 35, alert: 60, crisis: 90 },
};

// ─── Helper: ดึงค่า warn level พร้อม fallback ────────────────
// ถ้าไม่มี sta_code ใน record จะคืน undefined
// ใช้ ?? เพื่อ fallback ไปที่ default ได้

export function getWarnLevel(
  levels: Record<string, WarnLevel>,
  staCode: string,
  fallbackKey = 'default'
): WarnLevel | undefined {
  return levels[staCode] ?? levels[fallbackKey];
}
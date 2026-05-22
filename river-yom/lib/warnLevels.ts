// lib/warnLevels.ts

export interface WarnLevel {
  normal: number;
  watch:  number;
  alert:  number;
  crisis: number;
}

// ─── Tele (สถานีโทรมาตร) ──────────────────────────────────────
export const TELE_WARN_LEVELS: Record<string, WarnLevel> = {
  "01": { normal: 1.0, watch: 3.0, alert: 5.0, crisis: 7.0 },
  "02": { normal: 2.0, watch: 4.0, alert: 6.0, crisis: 8.0 },
};

// ─── Gate (ประตูระบายน้ำ) ─────────────────────────────────────
export const GATE_WARN_LEVELS: Record<string, WarnLevel> = {
  tng: { normal: 2.0,  watch: 3.5,  alert: 4.5,  crisis: 5.5  },
  wst: { normal: 37.0, watch: 38.5, alert: 39.5, crisis: 40.5 },
  kpk: { normal: 1.0,  watch: 3.5,  alert: 6.5,  crisis: 8.5  },
};

// ─── Flow (น้ำท่า) ────────────────────────────────────────────
export const FLOW_WARN_LEVELS: Record<string, WarnLevel> = {
  "Y.15": { normal: 2.50, watch: 2.90, alert: 3.20, crisis: 3.50 },
  "Y.16": { normal: 2.00, watch: 2.16, alert: 2.28, crisis: 2.40 },
  "Y.4":  { normal: 1.50, watch: 1.60, alert: 1.70, crisis: 1.80 },
  "Y.50": { normal: 1.20, watch: 1.25, alert: 1.38, crisis: 1.50 },
  "Y.64": { normal: 1.10, watch: 1.20, alert: 1.35, crisis: 1.50 },
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
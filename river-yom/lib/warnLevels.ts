// lib/warnLevels.ts

export interface WarnLevel {
  normal: number;
  watch:  number;
  alert:  number;
  crisis: number;
}

// ─── Tele (สถานีโทรมาตร) ──────────────────────────────────────
// export const TELE_WARN_LEVELS: Record<string, WarnLevel> = {
//   "YR.01": { normal: 38.07, watch: 38.96, alert: 39.82, crisis: 40.67 },
//   "YR.02": { normal: 40.55, watch: 40.89, alert: 41.23, crisis: 41.57 },
//   "YR.03": { normal: 43.21, watch: 43.60, alert: 43.98, crisis: 44.37 },
//   "YR.04": { normal: 41.13, watch: 41.71, alert: 42.28, crisis: 42.86 },
//   "YR.05": { normal: 37.78, watch: 38.62, alert: 39.46, crisis: 40.30 },
//   "YR.06": { normal: 37.99, watch: 38.48, alert: 39.02, crisis: 39.55 },
// };

export const TELE_WARN_LEVELS: Record<string, WarnLevel> = {
  "YR.01": { normal: 39.66, watch: 39.67, alert: 40.17, crisis: 40.67 },
  "YR.02": { normal: 40.56, watch: 40.57, alert: 41.07, crisis: 41.57 },
  "YR.03": { normal: 43.36, watch: 43.37, alert: 43.87, crisis: 44.37 },
  "YR.04": { normal: 41.85, watch: 41.86, alert: 42.36, crisis: 42.86 },
  "YR.05": { normal: 39.29, watch: 39.30, alert: 39.80, crisis: 40.30 },
  "YR.06": { normal: 38.54, watch: 38.55, alert: 39.05, crisis: 39.55 },
};

// ─── Gate (ประตูระบายน้ำ) ─────────────────────────────────────
export const GATE_WARN_LEVELS: Record<string, WarnLevel> = {
  // kpk: { normal: 40.86, watch: 40.86, alert: 41.93, crisis: 43.00 },
  // wst: { normal: 39.38, watch: 39.38, alert: 40.18, crisis: 40.98 },
  // tng: { normal: 41.10, watch: 41.10, alert: 42.55, crisis: 44.00 },
  kpk: { normal: 40.86, watch: 40.86, alert: 41.93, crisis: 43.00 },
  wst: { normal: 39.38, watch: 39.38, alert: 40.18, crisis: 40.98 },
  tng: { normal: 41.10, watch: 41.10, alert: 42.55, crisis: 44.00 },
};

// ─── Flow (น้ำท่า) ────────────────────────────────────────────
export const FLOW_WARN_LEVELS: Record<string, WarnLevel> = {
  // "Y.4":  { normal: 49.86, watch: 49.87, alert: 50.68, crisis: 51.48 },
  // "Y.15": { normal: 43.88, watch: 43.89, alert: 44.97, crisis: 46.05 },
  // "Y.50": { normal: 39.55, watch: 39.56, alert: 40.17, crisis: 40.78 },
  //   'Y.16': { watch: 37.6 , alert: 38.4, crisis: 39.3,},
  // 'Y.64': { watch: 36.7 , alert: 37.3, crisis: 38.0,},
  // 'Y.51': { watch: 38.8 , alert: 40.4, crisis: 42.0,},
  // 'Y.17': { watch: 39.4 , alert: 40.6, crisis: 41.8,},
  'Y.16': { normal: 38.29, watch: 38.30 , alert: 38.80, crisis: 39.30,},
  'Y.64': { normal: 36.99, watch: 37.00 , alert: 37.50, crisis: 38.00,},
  'Y.51': { normal: 40.99, watch: 41.00 , alert: 41.50, crisis: 42.00,},
  'Y.17': { normal: 40.79, watch: 40.80 , alert: 41.30, crisis: 41.80,},
  "Y.4":  { normal: 50.47, watch: 50.48, alert: 50.98, crisis: 51.48 },
  "Y.15": { normal: 45.04, watch: 45.05, alert: 45.55, crisis: 46.05 },
  "Y.50": { normal: 39.77, watch: 39.78, alert: 40.28, crisis: 40.78 },
};

// ─── Rain (ฝน) ────────────────────────────────────────────────
export const RAIN_WARN_LEVELS: Record<string, WarnLevel> = {
  default: { normal: 0, watch: 35, alert: 60, crisis: 90 },
};

export function getWarnLevel(
  levels: Record<string, WarnLevel>,
  staCode: string,
  fallbackKey = 'default'
): WarnLevel | undefined {
  return levels[staCode] ?? levels[fallbackKey];
}
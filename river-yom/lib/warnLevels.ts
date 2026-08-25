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
  kpk: { normal: 40.86, watch: 40.86, alert: 41.93, crisis: 43.00 },
  wst: { normal: 39.38, watch: 39.38, alert: 40.18, crisis: 40.98 },
  tng: { normal: 41.10, watch: 41.10, alert: 42.55, crisis: 44.00 },
};

// ─── Flow (น้ำท่า) ────────────────────────────────────────────
export const FLOW_WARN_LEVELS: Record<string, WarnLevel> = {
  "Y.4":  { normal: 49.86, watch: 49.87, alert: 50.68, crisis: 51.48 },
  "Y.15": { normal: 43.88, watch: 43.89, alert: 44.97, crisis: 46.05 },
  "Y.50": { normal: 39.55, watch: 39.56, alert: 40.17, crisis: 40.78 },

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
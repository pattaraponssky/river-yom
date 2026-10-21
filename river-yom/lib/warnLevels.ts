// lib/warnLevels.ts
// แหล่งข้อมูลเกณฑ์เตือนภัย (warning thresholds) ที่ใช้ร่วมกันทั้งระบบ
// แก้ไขค่าที่ไฟล์นี้ไฟล์เดียว ส่วนอื่นดึงไปใช้ผ่าน import

export interface WarnLevel {
  normal: number;
  watch:  number;
  alert:  number;
  crisis: number;
}

export interface YAxisRange {
  min: number;
  max: number;
}

// ─── Tele (สถานีโทรมาตร) — ระดับน้ำ ──────────────────────────
export const TELE_WARN_LEVELS: Record<string, WarnLevel> = {
  "YR.01": { normal: 39.66, watch: 39.67, alert: 40.17, crisis: 40.67 },
  "YR.02": { normal: 40.56, watch: 40.57, alert: 41.07, crisis: 41.57 },
  "YR.03": { normal: 43.36, watch: 43.37, alert: 43.87, crisis: 44.37 },
  "YR.04": { normal: 41.85, watch: 41.86, alert: 42.36, crisis: 42.86 },
  "YR.05": { normal: 39.29, watch: 39.30, alert: 39.80, crisis: 40.30 },
  "YR.06": { normal: 38.54, watch: 38.55, alert: 39.05, crisis: 39.55 },
};

// ─── Gate (ประตูระบายน้ำ) — ระดับน้ำ ─────────────────────────
export const GATE_WARN_LEVELS: Record<string, WarnLevel> = {
  kpk: { normal: 40.86, watch: 40.86, alert: 41.93, crisis: 43.00 },
  wst: { normal: 39.38, watch: 39.38, alert: 40.18, crisis: 40.98 },
  tng: { normal: 41.10, watch: 41.10, alert: 42.55, crisis: 44.00 },
};

// ─── Flow (น้ำท่า) — ระดับน้ำ ────────────────────────────────
export const FLOW_WARN_LEVELS: Record<string, WarnLevel> = {
  'Y.16': { normal: 38.29, watch: 38.30, alert: 38.80, crisis: 39.30 },
  'Y.64': { normal: 36.99, watch: 37.00, alert: 37.50, crisis: 38.00 },
  'Y.51': { normal: 40.99, watch: 41.00, alert: 41.50, crisis: 42.00 },
  'Y.17': { normal: 40.79, watch: 40.80, alert: 41.30, crisis: 41.80 },
  "Y.4":  { normal: 50.47, watch: 50.48, alert: 50.98, crisis: 51.48 },
  "Y.15": { normal: 45.04, watch: 45.05, alert: 45.55, crisis: 46.05 },
  "Y.50": { normal: 39.77, watch: 39.78, alert: 40.28, crisis: 40.78 },
};

// ─── Flow (น้ำท่า) — อัตราการไหล (ลบ.ม./วินาที) ──────────────
export const FLOW_DISCHARGE_WARN_LEVELS: Record<string, WarnLevel> = {
  'Y.4':  { normal: 0, watch: 320, alert: 450, crisis: 600 },
  'Y.15': { normal: 0, watch: 250, alert: 400, crisis: 500 },
  'Y.50': { normal: 0, watch: 250, alert: 300, crisis: 350 },
  'Y.16': { normal: 0, watch: 180, alert: 220, crisis: 260 },
  'Y.64': { normal: 0, watch: 180, alert: 240, crisis: 300 },
  'Y.51': { normal: 0, watch: 530, alert: 800, crisis: 900 },
  'Y.17': { normal: 0, watch: 600, alert: 720, crisis: 850 },
};

// ─── Rain (ฝน) ────────────────────────────────────────────────
export const RAIN_WARN_LEVELS: Record<string, WarnLevel> = {
  default: { normal: 0, watch: 35, alert: 60, crisis: 90 },
};

// ─── รวมเกณฑ์ระดับน้ำทุกประเภท (Tele + Gate + Flow) ──────────
// ใช้เมื่อต้องการ lookup ด้วยรหัสสถานีที่ไม่รู้ประเภทล่วงหน้า
// (เช่น แผนผังที่แสดงทั้งสถานีโทรมาตร ประตูน้ำ และน้ำท่ารวมกัน)
export const WATER_LEVEL_WARN_LEVELS: Record<string, WarnLevel> = {
  ...TELE_WARN_LEVELS,
  ...GATE_WARN_LEVELS,
  ...FLOW_WARN_LEVELS,
};

// ─── ช่วงแกน Y ของกราฟระดับน้ำ ───────────────────────────────
export const TELE_WATER_LEVEL_Y_AXIS_RANGE: Record<string, YAxisRange> = {
  'YR.01': { min: 32, max: 42 },
  'YR.02': { min: 33, max: 43 },
  'YR.03': { min: 36, max: 46 },
  'YR.04': { min: 35, max: 44 },
  'YR.05': { min: 32, max: 42 },
  'YR.06': { min: 32, max: 41 },
};

export const FLOW_WATER_LEVEL_Y_AXIS_RANGE: Record<string, YAxisRange> = {
  'Y.4':  { min: 42, max: 53 },
  'Y.15': { min: 33, max: 48 },
  'Y.50': { min: 34, max: 44 },
  'Y.16': { min: 30, max: 42 },
  'Y.64': { min: 33, max: 43 },
  'Y.51': { min: 32, max: 44 },
  'Y.17': { min: 30, max: 42 },
};

export const GATE_WATER_LEVEL_Y_AXIS_RANGE: Record<string, YAxisRange> = {
  wst: { min: 32, max: 44 },
  tng: { min: 33, max: 43 },
  kpk: { min: 36, max: 44 },
};

export function getWarnLevel(
  levels: Record<string, WarnLevel>,
  staCode: string,
  fallbackKey = 'default'
): WarnLevel | undefined {
  return levels[staCode] ?? levels[fallbackKey];
}

// ─── สีตามระดับเตือนภัย (ใช้กับแผนผัง/แผนที่) ─────────────────
export const WARN_LEVEL_COLORS = {
  crisis: '#FF0000',   // วิกฤต
  alert:  'orange',    // เตือนภัย
  watch:  '#FFD700',   // เฝ้าระวัง
  normal: '#69fc00ff', // ปกติ
  unknown: '#9e9e9e',  // ไม่พบเกณฑ์
} as const;

export type WarnLevelColorKey = keyof typeof WARN_LEVEL_COLORS;

// คืนชื่อระดับ (crisis/alert/watch/normal) จากค่าระดับน้ำ เทียบกับเกณฑ์ที่ให้
export function getWarnLevelCategory(
  level: WarnLevel,
  value: number
): Exclude<WarnLevelColorKey, 'unknown'> {
  if (value > level.crisis) return 'crisis';
  if (value > level.alert)  return 'alert';
  if (value > level.watch)  return 'watch';
  return 'normal';
}

// คืนสีตามระดับน้ำ โดยดึงเกณฑ์จาก map ที่ส่งมา (คืนสี unknown ถ้าไม่พบเกณฑ์)
export function getWarnLevelColor(
  levels: Record<string, WarnLevel>,
  staCode: string,
  value: number
): string {
  const level = getWarnLevel(levels, staCode);
  if (!level) return WARN_LEVEL_COLORS.unknown;
  return WARN_LEVEL_COLORS[getWarnLevelCategory(level, value)];
}

// ─── Annotation builders ─────────────────────────────────────

type AnnotationSide = 'left' | 'right';

export interface WarningAnnotationOptions {
  unit?: string;          // หน่วยต่อท้าย เช่น 'ม.รทก.' หรือ 'ลบ.ม./วินาที'
  prefix?: string;        // ข้อความนำหน้า เช่น '>' สำหรับอัตราการไหล
  fontSize?: string;      // ขนาดตัวอักษร (default 11px)
  borderWidth?: number;   // ความหนาเส้น (default 2)
  offsetY?: number;       // ระยะขยับป้ายแนวตั้ง (default 10)
}

// สร้าง annotation 1 เส้น พร้อมจัดป้ายไม่ให้ทับกัน
// - ย่อข้อความให้สั้น
// - สลับ label ซ้าย/ขวา และเยื้องแนวตั้งด้วย offsetY
export function makeWarnAnnotation(
  y: number,
  color: string,
  text: string,
  side: AnnotationSide = 'right',
  offsetY = 0,
  opts: WarningAnnotationOptions = {},
): YAxisAnnotations {
  const { fontSize = '11px', borderWidth = 2 } = opts;
  return {
    y,
    borderColor: color,
    borderWidth,
    strokeDashArray: 8,
    label: {
      text,
      position: side,
      orientation: 'horizontal',
      offsetY,
      style: { fontSize, fontWeight: 'bold', color: '#fff', background: color, padding: { left: 4, right: 4 } },
    },
  };
}

// สร้าง annotation 3 เส้น (วิกฤต/เตือนภัย/เฝ้าระวัง) จากค่า WarnLevel
export function buildWarnAnnotations(
  level: WarnLevel,
  opts: WarningAnnotationOptions = {},
): ApexAnnotations {
  const { unit = 'ม.รทก.', prefix = '', offsetY = 10, ...rest } = opts;
  return {
    yaxis: [
      makeWarnAnnotation(level.crisis, '#FF0000', `วิกฤต ${prefix}${level.crisis} ${unit}`.trim(), 'right', -offsetY, rest),
      makeWarnAnnotation(level.alert, 'orange', `เตือนภัย ${prefix}${level.alert} ${unit}`.trim(), 'right', 0, rest),
      makeWarnAnnotation(level.watch, '#FFD700', `เฝ้าระวัง ${prefix}${level.watch} ${unit}`.trim(), 'right', offsetY, rest),
    ],
  };
}

// สร้าง annotations จาก record + รหัสสถานี โดยตรง (คืน { yaxis: [] } ถ้าไม่พบ)
export function buildWarnAnnotationsFor(
  levels: Record<string, WarnLevel>,
  staCode: string | undefined,
  opts: WarningAnnotationOptions = {},
): ApexAnnotations {
  const level = staCode ? getWarnLevel(levels, staCode) : undefined;
  return level ? buildWarnAnnotations(level, opts) : { yaxis: [] };
}

// hooks/useRasData.ts
import { useState, useEffect } from 'react';
import Papa from 'papaparse';
import { Path_URL } from '@/lib/utility';

// ─── Types ────────────────────────────────────────────────────

export interface WaterLevelPoint {
  river:        string;
  time:         string;   // "YYYY-MM-DDTHH:mm:ss" (ตามเวลาในไฟล์ CSV ไม่แปลง timezone)
  station:      string;
  elevation:    number;
  crossSection: number;
}

export interface ForecastSnapshot {
  date:   string;             // "YYYY-MM-DD" = วันที่รัน forecast นั้น (เวลาไทย)
  points: WaterLevelPoint[];
}

export interface RasData {
  today:    ForecastSnapshot | null;
  archive:  ForecastSnapshot[];        // เรียงจากเก่า → ใหม่
  loading:  boolean;
  error:    string | null;
}

// ─── Station mapping ──────────────────────────────────────────
export const STATION_MAPPING: Record<string, number> = {
  "YR.01": 72518,
  "YR.02": 4423,
  "YR.03": 22019,
  "YR.04": 6019,
  "YR.05": 54578,
  "YR.06": 6812,
  "Y.15": 93590,
  "Y.50": 54108,
};

const CROSS_TO_STATION = new Map<number, string>(
  Object.entries(STATION_MAPPING).map(([k, v]) => [v, k])
);

// ─── Time helpers ─────────────────────────────────────────────

/** "YYYY-MM-DDTHH:mm:ss" → timestamp ที่ถือเวลาตามไฟล์ CSV (ไม่แปลง timezone)
 *  ใช้ร่วมกับ ApexCharts ที่แสดงแกนเวลาแบบ UTC จะได้ตรงกับ CSV */
export function toTs(iso: string): number {
  const m = iso.match(/^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})/);
  if (!m) return NaN;
  return Date.UTC(+m[1], +m[2] - 1, +m[3], +m[4], +m[5]);
}

/** วันนี้ตามเวลาไทย "YYYY-MM-DD" */
export function thaiTodayYMD(): string {
  return new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Bangkok' }).format(new Date());
}

/** จุดเริ่ม forecast = 07:00 ของวันนี้ (เวลาไทย) */
export function forecastStartTs(): number {
  return toTs(`${thaiTodayYMD()}T07:00:00`);
}

/** สร้าง array ของวันที่ย้อนหลัง n วัน (เวลาไทย) รูปแบบ "YYYY-MM-DD" เรียง เก่า → ใหม่ */
function pastDates(n: number): string[] {
  const base = new Date(`${thaiTodayYMD()}T00:00:00Z`);
  return Array.from({ length: n }, (_, i) => {
    const d = new Date(base);
    d.setUTCDate(d.getUTCDate() - (i + 1));
    return d.toISOString().slice(0, 10);
  }).reverse();
}

// ─── CSV helpers ──────────────────────────────────────────────

/** แปลง "dd/mm/yyyy HH:mm" (พ.ศ. หรือ ค.ศ.) → "YYYY-MM-DDTHH:mm:00" */
function parseDateString(raw: string | undefined): string | null {
  if (!raw) return null;
  const [datePart, timePart] = raw.trim().split(/\s+/);
  if (!datePart || !timePart) return null;

  const [d, m, y] = datePart.split('/').map(Number);
  const [h, min]  = timePart.split(':').map(Number);
  if ([d, m, y, h, min].some(isNaN)) return null;

  const fullYear = y > 2500 ? y - 543 : y;
  return `${fullYear}-${String(m).padStart(2,'0')}-${String(d).padStart(2,'0')}T${String(h).padStart(2,'0')}:${String(min).padStart(2,'0')}:00`;
}

/** parse CSV text → WaterLevelPoint[] */
function parseCsv(csvText: string): WaterLevelPoint[] {
  const result = Papa.parse<Record<string, string>>(csvText, {
    header:          true,
    skipEmptyLines:  true,
    transformHeader: h => h.trim(),
    dynamicTyping:   false,
  });

  return result.data
    .map(row => {
      const time         = parseDateString(row['Date']);
      const crossSection = Number(row['Cross Section']?.trim());
      const elevation    = parseFloat(row['Water_Elevation']?.trim());
      const river        = (row['River'] ?? '').trim();

      // ทิ้งเฉพาะ row ที่ข้อมูลพื้นฐานไม่ครบ
      if (!time || isNaN(crossSection) || isNaN(elevation)) return null;

      // station เป็น '' ถ้า crossSection ไม่อยู่ใน mapping
      const station = CROSS_TO_STATION.get(crossSection) ?? '';

      return { time, station, elevation, crossSection, river };
    })
    .filter((p): p is WaterLevelPoint => p !== null);
}

/** ดึงและ parse CSV จาก URL เดียว (คืน null ถ้า fetch ล้มเหลว) */
async function fetchCsv(url: string): Promise<WaterLevelPoint[] | null> {
  try {
    const res = await fetch(url, { cache: 'no-store' });
    if (!res.ok) return null;
    return parseCsv(await res.text());
  } catch {
    return null;
  }
}

// ─── Hook ─────────────────────────────────────────────────────

/**
 * โหลด forecast CSV วันนี้ + archive ย้อนหลัง `archiveDays` วัน
 *
 * โครงสร้างไฟล์ที่คาดหวัง:
 *   /ras-output/output_ras.csv
 *   /ras-output/archive/output_ras_YYYY-MM-DD.csv
 */
export function useRasData(archiveDays = 3): RasData {
  const [today,   setToday]   = useState<ForecastSnapshot | null>(null);
  const [archive, setArchive] = useState<ForecastSnapshot[]>([]);
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      setLoading(true);
      setError(null);

      try {
        const todayStr = thaiTodayYMD();

        // โหลดทุกไฟล์พร้อมกัน
        const [todayPoints, ...archiveResults] = await Promise.all([
          fetchCsv(`${Path_URL}/ras-output/output_ras.csv`),
          ...pastDates(archiveDays).map(date =>
            fetchCsv(`${Path_URL}/ras-output/archive/output_ras_${date}.csv`)
              .then(points => ({ date, points }))
          ),
        ]);

        if (cancelled) return;
        setToday(todayPoints ? { date: todayStr, points: todayPoints } : null);

        setArchive(
          (archiveResults as { date: string; points: WaterLevelPoint[] | null }[])
            .filter(r => r.points !== null)
            .map(r => ({ date: r.date, points: r.points! }))
        );

      } catch (err: any) {
        if (!cancelled) setError(err.message ?? 'โหลดข้อมูลล้มเหลว');
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    load();
    return () => { cancelled = true; };
  }, [archiveDays]);

  return { today, archive, loading, error };
}
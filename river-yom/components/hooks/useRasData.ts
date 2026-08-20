// hooks/useRasData.ts
import { useState, useEffect } from 'react';
import Papa from 'papaparse';
import { Path_URL } from '@/lib/utility';

// ─── Types ────────────────────────────────────────────────────

export interface WaterLevelPoint {
  river: string;
  time:         string;   // ISO string
  station:      string;
  elevation:    number;
  crossSection: number;
}

export interface ForecastSnapshot {
  date:   string;             // "YYYY-MM-DD" = วันที่รัน forecast นั้น
  points: WaterLevelPoint[];
}

export interface RasData {
  /** ข้อมูลทั้งหมด (today + archive) รวมกัน */
  today:    ForecastSnapshot | null;
  archive:  ForecastSnapshot[];        // เรียงจากเก่า → ใหม่
  loading:  boolean;
  error:    string | null;
}

// ─── Station mapping ──────────────────────────────────────────
export const STATION_MAPPING: Record<string, number> = {
 "YR.01": 13590,
  "YR.02": 33751,
  "YR.03": 51151,
  "YR.04": 39509,
  "YR.05": 2611,
  "YR.06": 889,
  "Y.4": 94522,
  "Y.15": 41446,
  "Y.50": 54142,
};

const CROSS_TO_STATION = new Map<number, string>(
  Object.entries(STATION_MAPPING).map(([k, v]) => [v, k])
);
// ─── Helpers ──────────────────────────────────────────────────

/** แปลง "dd/mm/yyyy HH:mm" (พ.ศ. หรือ ค.ศ.) → ISO string */
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

      // station อาจเป็น '' ถ้า crossSection ไม่อยู่ใน mapping
      // → LongProfile ใช้ crossSection โดยตรง ไม่ต้องการ station
      // → chart/warning ที่ต้องการ station จะ filter เอาเฉพาะที่มีค่าอยู่แล้ว
      const station = CROSS_TO_STATION.get(crossSection) ?? '';

      return {
        time,
        station,
        elevation,
        crossSection,
        river,
      };
    })
    .filter((p): p is WaterLevelPoint => p !== null);
}

/** ดึงและ parse CSV จาก URL เดียว (คืน null ถ้า fetch ล้มเหลว) */
async function fetchCsv(url: string): Promise<WaterLevelPoint[] | null> {
  try {
    const res = await fetch(url);
    if (!res.ok) return null;
    return parseCsv(await res.text());
  } catch {
    return null;
  }
}

/** สร้าง array ของวันที่ย้อนหลัง n วัน รูปแบบ "YYYY-MM-DD" */
function pastDates(n: number): string[] {
  return Array.from({ length: n }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - (i + 1));   // -1, -2, -3 ...
    return d.toISOString().slice(0, 10);
  }).reverse();                          // เรียง เก่า → ใหม่
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
        const todayStr = new Date().toISOString().slice(0, 10);

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
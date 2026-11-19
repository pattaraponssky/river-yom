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
  archiveLoading: boolean;
  profile: WaterLevelPoint[] | null;
  profileError: boolean;
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

/** จุดเริ่ม forecast = 08:00 ของวันนี้ (เวลาไทย) */
export function forecastStartTs(): number {
  return toTs(`${thaiTodayYMD()}T08:00:00`);
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
function parseCsv(csvText: string, scope: "stations" | "full" | "profile"): WaterLevelPoint[] {
  const result = Papa.parse<Record<string, string>>(csvText, {
    header:          true,
    skipEmptyLines:  true,
    transformHeader: h => h.trim(),
    dynamicTyping:   false,
  });

  return result.data
    .map(row => {
      const crossSection = Number(row['Cross Section']?.trim());
      const elevation    = parseFloat(row['Water_Elevation']?.trim());
      const river        = (row['River'] ?? '').trim();

      if (!Number.isFinite(crossSection) || !Number.isFinite(elevation)) return null;
      const station = CROSS_TO_STATION.get(crossSection) ?? '';
      if (scope === 'stations' && !station) return null;
      if (scope === 'profile' && river !== 'YOM') return null;

      const time = parseDateString(row['Date']);
      if (!time) return null;
      return { time, station, elevation, crossSection, river };
    })
    .filter((p): p is WaterLevelPoint => p !== null);
}

async function fetchCsv(url: string, signal: AbortSignal, scope: 'stations' | 'full' | 'profile') {
  try {
    const res = await fetch(url, { cache: 'no-store', signal });
    if (!res.ok) return null;
    const points = parseCsv(await res.text(), scope);
    return points.length ? points : null;
  } catch {
    return null;
  }
}

const rasPath = `${Path_URL}/ras-output`;
const currentCsv = `${rasPath}/output_ras.csv`;
const stationCsv = (date: string) => `${rasPath}/archive/output_ras_stations_${date}.csv`;

export function useRasData(archiveDays = 3, loadProfile = false): RasData {
  const [today, setToday] = useState<ForecastSnapshot | null>(null);
  const [archive, setArchive] = useState<ForecastSnapshot[]>([]);
  const [loading, setLoading] = useState(true);
  const [archiveLoading, setArchiveLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [profile, setProfile] = useState<WaterLevelPoint[] | null>(null);
  const [profileError, setProfileError] = useState(false);

  useEffect(() => {
    const controller = new AbortController();
    const { signal } = controller;
    const date = thaiTodayYMD();

    setLoading(true);
    setArchiveLoading(true);
    setError(null);
    setToday(null);
    setArchive([]);
    setProfile(null);
    setProfileError(false);

    async function loadToday() {
      let points = await fetchCsv(stationCsv(date), signal, 'stations');
      if (signal.aborted) return;
      if (!points) {
        const full = await fetchCsv(currentCsv, signal, 'full');
        if (signal.aborted) return;
        points = full?.filter(point => point.station) ?? null;
        setProfile(full?.filter(point => point.river === 'YOM') ?? []);
        setProfileError(!full);
      }

      setToday(points?.length ? { date, points } : null);
      setError(points?.length ? null : 'ไม่พบข้อมูลพยากรณ์ของสถานีวันนี้');
      setLoading(false);
    }

    const todayRequest = loadToday();

    async function loadArchive() {
      const snapshots = await Promise.all(pastDates(archiveDays).map(async date => {
        let points = await fetchCsv(stationCsv(date), signal, 'stations');
        if (!points && !signal.aborted) await todayRequest;
        if (!points && !signal.aborted) {
          points = await fetchCsv(`${rasPath}/archive/output_ras_${date}.csv`, signal, 'stations');
        }
        return points ? { date, points } : null;
      }));
      if (!signal.aborted) {
        setArchive(snapshots.filter((snapshot): snapshot is ForecastSnapshot => snapshot !== null));
        setArchiveLoading(false);
      }
    }

    void loadArchive();
    return () => controller.abort();
  }, [archiveDays]);

  const needsProfile = loadProfile && !loading && profile === null;
  useEffect(() => {
    if (!needsProfile) return;

    const controller = new AbortController();
    fetchCsv(currentCsv, controller.signal, 'profile').then(points => {
      if (controller.signal.aborted) return;
      setProfile(points ?? []);
      setProfileError(!points);
    });
    return () => controller.abort();
  }, [needsProfile]);

  return { today, archive, loading, archiveLoading, error, profile, profileError };
}

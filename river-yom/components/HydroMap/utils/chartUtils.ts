// chartUtils.ts
// ไม่ import ApexCharts ที่ด้านบนเลย → ป้องกัน SSR error

import { API_URL } from '@/lib/utility';
import { formatReadingValue } from './readingUtils';

import {
  TELE_WARN_LEVELS,
  GATE_WARN_LEVELS,
  FLOW_WARN_LEVELS,
  WarnLevel,
  getWarnLevel,
  getBankLevel,
  makeWarnAnnotation,
} from '@/lib/warnLevels';

// เลือกชุดเกณฑ์เตือนภัยตามประเภทของกราฟ
const resolveWarnLevels = (type: string): Record<string, WarnLevel> => {
  if (type.startsWith('tele_')) return TELE_WARN_LEVELS;
  if (type.startsWith('gate_') || type === 'wl_upper' || type === 'wl_lower') return GATE_WARN_LEVELS;
  return FLOW_WARN_LEVELS;
};

// สร้าง annotation: ระดับตลิ่ง + เกณฑ์เตือนภัย (สำหรับกราฟระดับน้ำ)
const buildWaterLevelAnnotations = (
  type: string,
  code: string,
): ApexAnnotations => {
  // เฉพาะกราฟระดับน้ำ (wl) เท่านั้นจึงจะแสดงตลิ่ง/เกณฑ์
  const isWaterLevel =
    type === 'wl' || type === 'tele_wl' || type === 'wl_upper' || type === 'wl_lower';
  if (!isWaterLevel) return { yaxis: [] };

  const levels = resolveWarnLevels(type);
  const yaxis: YAxisAnnotations[] = [];

  const level = getWarnLevel(levels, code);
  if (level) {
    yaxis.push(makeWarnAnnotation(level.crisis, '#FF0000', ``, 'left', -12));
    yaxis.push(makeWarnAnnotation(level.alert, 'orange', ``, 'left', 0));
    yaxis.push(makeWarnAnnotation(level.watch, '#FFD700', ``, 'left', 12));
    // yaxis.push(makeWarnAnnotation(level.crisis, '#FF0000', `วิกฤต ${level.crisis}`, 'left', -12));
    // yaxis.push(makeWarnAnnotation(level.alert, 'orange', `เตือนภัย ${level.alert}`, 'left', 0));
    // yaxis.push(makeWarnAnnotation(level.watch, '#FFD700', `เฝ้าระวัง ${level.watch}`, 'left', 12));
  }

  const bank = getBankLevel(levels, code);
  if (bank != null) {
    yaxis.push(makeWarnAnnotation(bank, '#FF0000', `ระดับตลิ่ง ${formatReadingValue(bank)}`, 'right', 0, { borderWidth: 2 }));
    // yaxis.push(makeWarnAnnotation(bank, '#8e24aa',`ระดับตลิ่ง ${formatReadingValue(bank)}`, 'right', 0, { borderWidth: 2 }));
  }

  return { yaxis };
};

// สร้างช่วงแกน Y ของกราฟระดับน้ำ: max = max(ข้อมูล, ตลิ่ง+margin), min = min(ข้อมูล)
const buildWaterLevelYAxis = (
  type: string,
  code: string,
  seriesData: { x: number; y: number | null }[],
): { min?: number; max?: number } => {
  const isWaterLevel =
    type === 'wl' || type === 'tele_wl' || type === 'wl_upper' || type === 'wl_lower';
  if (!isWaterLevel) return {};

  const values = seriesData
    .map((d) => d.y)
    .filter((v): v is number => v != null && !isNaN(v));
  if (values.length === 0) return {};

  const levels = resolveWarnLevels(type);
  const bank = getBankLevel(levels, code);

  const dataMin = Math.min(...values);
  const dataMax = Math.max(...values);
  const max = bank != null && bank >= dataMax ? bank : dataMax + 0.5;

  return { min: dataMin, max };
};

// เก็บ instance ของ chart (จะใช้เฉพาะ client)
const chartsInstances: Record<string, Record<string, any>> = {};

// ──────────────────────────────────────────────────────────────
// ฟังก์ชันเตรียมข้อมูลกราฟ (เหมือนเดิมทุกอย่าง)
// ──────────────────────────────────────────────────────────────
function chartValue(value: string | number | null | undefined) {
  if (value == null || String(value).trim() === '') return null;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

const prepareChartDataForRain = (rawData: any[], targetStaCode: string) => {
  const filtered = rawData
    .filter((d) => String(d.sta_code) === targetStaCode)
    .sort((a, b) => new Date(a.datetime).getTime() - new Date(b.datetime).getTime());

  const rain_mmSeries = filtered.map((d) => ({
    x: new Date(d.datetime).getTime(),
    y: chartValue(d.rain_mm),
  }));

  let cumulative = 0;
  const rainSeries = filtered.map((d) => {
    const rain = parseFloat(d.rain_mm || '0') || 0;
    cumulative += rain;
    return { x: new Date(d.datetime).getTime(), y: parseFloat(cumulative.toFixed(2)) };
  });

  return { rain_mmSeries, rainSeries };
};

const prepareChartDataForFlow = (rawData: any[], targetStaCode: string) => {
  const filtered = rawData
    .filter((d) => String(d.sta_code) === targetStaCode)
    .sort((a, b) => new Date(a.datetime).getTime() - new Date(b.datetime).getTime());

  const dischargeSeries = filtered.map((d) => ({
    x: new Date(d.datetime).getTime(),
    y: chartValue(d.discharge),
  }));

  const wlSeries = filtered.map((d) => ({
    x: new Date(d.datetime).getTime(),
    y: chartValue(d.wl),
  }));

  return { dischargeSeries, wlSeries };
};

const prepareChartDataForGate = (rawData: any[], targetStaCode: string) => {
  const filtered = rawData
    .filter((d) => String(d.sta_code) === targetStaCode)
    .sort((a, b) => new Date(a.datetime).getTime() - new Date(b.datetime).getTime());

  const dischargeSeries = filtered.map((d) => ({
    x: new Date(d.datetime).getTime(),
    y: chartValue(d.discharge),
  }));

  const wl_upperSeries = filtered.map((d) => ({
    x: new Date(d.datetime).getTime(),
    y: chartValue(d.wl_upper),
  }));

  const wl_lowerSeries = filtered.map((d) => ({
    x: new Date(d.datetime).getTime(),
    y: chartValue(d.wl_lower),
  }));

  return { dischargeSeries, wl_upperSeries, wl_lowerSeries };
};

const prepareChartDataForTele = (rawData: any[], targetStaCode: string) => {
  const filtered = rawData
    .filter((d) => String(d.sta_code) === targetStaCode)
    .sort((a, b) => new Date(a.datetime).getTime() - new Date(b.datetime).getTime());

  const dischargeSeries = filtered.map((d) => ({
    x: new Date(d.datetime).getTime(),
    y: chartValue(d.discharge),
  }));

  const wlSeries = filtered.map((d) => ({
    x: new Date(d.datetime).getTime(),
    y: chartValue(d.wl),
  }));

  const rainSeries = filtered.map((d) => ({
    x: new Date(d.datetime).getTime(),
    y: chartValue(d.rain_mm),
  }));

  return { dischargeSeries, wlSeries, rainSeries };
};

const chartSources = {
  rain_mm: 'rain', rain_series: 'rain',
  discharge: 'flow', wl: 'flow',
  gate_discharge: 'gate', wl_upper: 'gate', wl_lower: 'gate',
  tele_discharge: 'tele', tele_wl: 'tele', tele_rain_mm: 'tele',
} as const;

type ChartType = keyof typeof chartSources;
type HistorySource = typeof chartSources[ChartType];
const historyCache = new Map<HistorySource, { expires: number; request: Promise<any[]> }>();
const activeRequests = new Map<string, symbol>();

function fetchHistory(source: HistorySource) {
  const cached = historyCache.get(source);
  if (cached && cached.expires > Date.now()) return cached.request;

  const request = fetch(`${API_URL}/api/${source}_data_last_14_days`)
    .then(async response => {
      if (!response.ok) throw new Error(`History request failed: ${response.status}`);
      const result = await response.json();
      if (Array.isArray(result.data)) return result.data;
      if (result.message === 'ไม่พบข้อมูลสถานีในช่วง 14 วันล่าสุด') return [];
      throw new Error('History unavailable');
    })
    .then(rows => {
      historyCache.set(source, { request, expires: Date.now() + 5 * 60 * 1000 });
      return rows;
    })
    .catch(error => {
      historyCache.delete(source);
      throw error;
    });

  historyCache.set(source, { request, expires: Infinity });
  return request;
}

export const renderChart = async (code: string, type: ChartType) => {
  if (typeof window === 'undefined' || !Object.hasOwn(chartSources, type)) return;

  const safeStaCode = code.replace(/\./g, '_');
  const element = document.getElementById(`chart-${type}-${safeStaCode}`);
  if (!element) return;

  const request = Symbol();
  activeRequests.set(code, request);
  const isCurrent = () => activeRequests.get(code) === request && element.isConnected;

  Object.values(chartsInstances[code] ?? {}).forEach(chart => chart.destroy());
  chartsInstances[code] = {};
  for (const chartType of Object.keys(chartSources)) {
    const chartElement = document.getElementById(`chart-${chartType}-${safeStaCode}`);
    if (chartElement) chartElement.style.display = 'none';
  }

  element.style.display = 'block';
  element.textContent = 'กำลังโหลดกราฟย้อนหลัง 14 วัน…';
  element.setAttribute('aria-live', 'polite');

  try {
    const [rows, { default: ApexCharts }] = await Promise.all([
      fetchHistory(chartSources[type]),
      import('apexcharts'),
    ]);
    if (!isCurrent()) return;

    let seriesData: { x: number; y: number | null }[] = [];
    let title = '';
    let color = '';
    let chartType: 'line' | 'bar' = 'line';

    switch (type) {
      case 'tele_discharge':
      case 'tele_wl':
      case 'tele_rain_mm': {
        const chartData = prepareChartDataForTele(rows, code);
        if (type === 'tele_discharge') {
          seriesData = chartData.dischargeSeries;
          title = 'อัตราการไหล (ลบ.ม./วินาที)';
          color = '#1e88e5';
        } else if (type === 'tele_wl') {
          seriesData = chartData.wlSeries;
          title = 'ระดับน้ำ (ม.รทก.)';
          color = '#e53935';
        } else {
          seriesData = chartData.rainSeries;
          title = 'ปริมาณน้ำฝน (มม.)';
          color = '#43a047';
          chartType = 'bar';
        }
        break;
      }

      case 'rain_mm':
      case 'rain_series': {
        const chartData = prepareChartDataForRain(rows, code);
        if (type === 'rain_mm') {
          seriesData = chartData.rain_mmSeries;
          title = 'ปริมาณน้ำฝน (มม.)';
          color = '#1e88e5';
          chartType = 'bar';
        } else {
          seriesData = chartData.rainSeries;
          title = 'ปริมาณน้ำฝนสะสม (มม.)';
          color = '#e53935';
        }
        break;
      }

      case 'discharge':
      case 'wl': {
        const chartData = prepareChartDataForFlow(rows, code);
        if (type === 'discharge') {
          seriesData = chartData.dischargeSeries;
          title = 'อัตราการไหล (ลบ.ม./วินาที)';
          color = '#1e88e5';
        } else {
          seriesData = chartData.wlSeries;
          title = 'ระดับน้ำ (ม.รทก.)';
          color = '#e53935';
        }
        break;
      }

      case 'gate_discharge':
      case 'wl_upper':
      case 'wl_lower': {
        const chartData = prepareChartDataForGate(rows, code);
        if (type === 'gate_discharge') {
          seriesData = chartData.dischargeSeries;
          title = 'อัตราการไหล (ลบ.ม./วินาที)';
          color = '#1e88e5';
        } else if (type === 'wl_upper') {
          seriesData = chartData.wl_upperSeries;
          title = 'ระดับน้ำเหนือ (ม.รทก.)';
          color = '#e53935';
        } else {
          seriesData = chartData.wl_lowerSeries;
          title = 'ระดับน้ำท้าย (ม.รทก.)';
          color = '#e53935';
        }
        break;
      }

      default:
        console.warn(`ไม่รองรับ type: ${type}`);
        return;
    }

    if (!seriesData.some(point => point.y != null)) {
      element.textContent = 'ไม่มีข้อมูลสำหรับกราฟย้อนหลัง 14 วัน';
      return;
    }
    element.textContent = '';

    // ช่วงแกน Y ของกราฟระดับน้ำ (ให้เห็นเส้นระดับตลิ่ง)
    const yAxisRange = buildWaterLevelYAxis(type, code, seriesData);

    // สร้างและ render chart
    const chart = new ApexCharts(element, {
      chart: {
        type: chartType,
        height: 220,
        fontFamily: 'Prompt, sans-serif',
        zoom: { enabled: false },
        toolbar: { show: false },
      },
      title: { text: title, align: 'center', style: { fontFamily: 'Prompt, sans-serif' } },
      series: [{ name: title, data: seriesData }],
      xaxis: {
        type: 'datetime',
        labels: { datetimeUTC: false, format: 'dd MMM', style: { fontFamily: 'Prompt, sans-serif' } },
      },
      yaxis: {
        min: yAxisRange.min,
        max: yAxisRange.max,
        labels: { formatter: formatReadingValue, style: { fontFamily: 'Prompt, sans-serif' } },
      },
      colors: [color],
      annotations: buildWaterLevelAnnotations(type, code),
      dataLabels: {
        enabled: true,
        formatter: (value: unknown) => value == null ? '' : formatReadingValue(value),
        offsetY: -20,
        style: { fontSize: '12px', fontFamily: 'Prompt, sans-serif', colors: ['#304758'] },
      },
      plotOptions: {
        bar: { borderRadius: 3, dataLabels: { position: 'top' } },
      },
      markers: { size: 5, colors: [color], strokeColors: '#fff', strokeWidth: 2 },
      tooltip: {
        y: { formatter: formatReadingValue },
        style: { fontFamily: 'Prompt, sans-serif' },
        x: {
          formatter: (val: number) =>
            new Date(val).toLocaleDateString('th-TH', {
              day: '2-digit',
              month: 'short',
              year: 'numeric',
            }),
        },
      },
    });

    chartsInstances[code][type] = chart;
    await chart.render();
  } catch {
    if (isCurrent()) {
      element.textContent = 'โหลดกราฟไม่สำเร็จ กดปุ่มกราฟเดิมเพื่อลองใหม่';
    }
  } finally {
    if (activeRequests.get(code) === request) activeRequests.delete(code);
  }
};

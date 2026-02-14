// chartUtils.ts
// ไม่ import ApexCharts ที่ด้านบนเลย → ป้องกัน SSR error

// เก็บ instance ของ chart (จะใช้เฉพาะ client)
const chartsInstances: Record<string, Record<string, any>> = {};

// ──────────────────────────────────────────────────────────────
// ฟังก์ชันเตรียมข้อมูลกราฟ (เหมือนเดิมทุกอย่าง)
// ──────────────────────────────────────────────────────────────
const prepareChartDataForRain = (rawData: any[], targetStaCode: string) => {
  const filtered = rawData
    .filter((d) => d.sta_code === targetStaCode)
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

  const rain_mmSeries = filtered.map((d) => ({
    x: new Date(d.date).getTime(),
    y: parseFloat(d.rain_mm || '0') || null,
  }));

  let cumulative = 0;
  const rainSeries = filtered.map((d) => {
    const rain = parseFloat(d.rain_mm || '0') || 0;
    cumulative += rain;
    return { x: new Date(d.date).getTime(), y: parseFloat(cumulative.toFixed(2)) };
  });

  return { rain_mmSeries, rainSeries };
};

const prepareChartDataForFlow = (rawData: any[], targetStaCode: string) => {
  const filtered = rawData
    .filter((d) => d.sta_code === targetStaCode)
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

  const dischargeSeries = filtered.map((d) => ({
    x: new Date(d.date).getTime(),
    y: parseFloat(d.discharge || '0') || null,
  }));

  const wlSeries = filtered.map((d) => ({
    x: new Date(d.date).getTime(),
    y: parseFloat(d.wl || '0') || null,
  }));

  return { dischargeSeries, wlSeries };
};

const prepareChartDataForGate = (rawData: any[], targetStaCode: string) => {
  const filtered = rawData
    .filter((d) => d.sta_code === targetStaCode)
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

  const dischargeSeries = filtered.map((d) => ({
    x: new Date(d.date).getTime(),
    y: parseFloat(d.discharge || '0') || null,
  }));

  const wl_upperSeries = filtered.map((d) => ({
    x: new Date(d.date).getTime(),
    y: parseFloat(d.wl_upper || '0') || null,
  }));

  const wl_lowerSeries = filtered.map((d) => ({
    x: new Date(d.date).getTime(),
    y: parseFloat(d.wl_lower || '0') || null,
  }));

  return { dischargeSeries, wl_upperSeries, wl_lowerSeries };
};

// ──────────────────────────────────────────────────────────────
// ฟังก์ชันหลัก renderChart (แก้ไขแล้ว)
// ──────────────────────────────────────────────────────────────
export const renderChart = async (
  code: string,
  type: 'rain_mm' | 'rain_series' | 'discharge' | 'wl' | 'gate_discharge' | 'wl_upper' | 'wl_lower'
) => {
  // ป้องกันการเรียกบน server
  if (typeof window === 'undefined') {
    console.warn('renderChart ถูกเรียกจาก server → ข้าม');
    return;
  }

  // โหลด ApexCharts แบบ dynamic เฉพาะ client (แก้ window is not defined)
  const ApexCharts = (await import('apexcharts')).default;

  const safeStaCode = code.replace(/\./g, '_');
  const chartId = `chart-${type}-${safeStaCode}`;
  const element = document.getElementById(chartId) as HTMLElement | null;

  if (!element) {
    console.warn(`ไม่พบ element ${chartId}`);
    return;
  }

  let seriesData: any[] = [];
  let title = '';
  let color = '';
  let chartType: 'line' | 'bar' = 'line';

  // ดึงข้อมูล 14 วันจาก window (คุณตั้งไว้ใน useEffect แล้ว)
  const rainData14d = (window as any).rainDataLast14d || [];
  const flowData14d = (window as any).flowDataLast14d || [];
  const gateData14d = (window as any).gateDataLast14d || [];

  switch (type) {
    case 'rain_mm':
    case 'rain_series': {
      const chartData = prepareChartDataForRain(rainData14d, code);
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
      const chartData = prepareChartDataForFlow(flowData14d, code);
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
      const chartData = prepareChartDataForGate(gateData14d, code);
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

  // ล้าง chart เก่าทั้งหมดของสถานีนี้
  if (!chartsInstances[code]) chartsInstances[code] = {};
  Object.values(chartsInstances[code]).forEach((chart) => chart?.destroy?.());
  chartsInstances[code] = {};

  // ซ่อนทุก div chart ของสถานีนี้
  ['rain_mm', 'rain_series', 'discharge', 'wl', 'gate_discharge', 'wl_upper', 'wl_lower'].forEach((t) => {
    const el = document.getElementById(`chart-${t}-${safeStaCode}`);
    if (el) el.style.display = 'none';
  });

  // แสดง div ที่ต้องการ
  element.style.display = 'block';

  // สร้างและ render chart
  const chart = new ApexCharts(element, {
    chart: {
      type: chartType,
      height: 220,
      zoom: { enabled: false },
      toolbar: { show: false },
    },
    title: { text: title, align: 'center' },
    series: [{ name: title, data: seriesData }],
    xaxis: {
      type: 'datetime',
      labels: { datetimeUTC: false, format: 'dd MMM' },
    },
    colors: [color],
    dataLabels: {
      enabled: true,
      offsetY: -20,
      style: { fontSize: '12px', colors: ['#304758'] },
    },
    plotOptions: {
      bar: { borderRadius: 3, dataLabels: { position: 'top' } },
    },
    markers: { size: 5, colors: [color], strokeColors: '#fff', strokeWidth: 2 },
    tooltip: {
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

  chart.render();
  chartsInstances[code][type] = chart;
};
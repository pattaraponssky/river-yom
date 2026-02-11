"use cilent";

import React, { useEffect, useRef, useState } from "react";
import { API_URL, formatThaiDay, Path_URL } from '@/lib/utility';
import { useThemeMode } from '@/contexts/ThemeContext';
import ApexCharts from 'apexcharts';

declare global {
  interface Window {
    longdo: any;
  }
}
export let longdo: any;
export let map: any;
export let chartId: string;

interface HydroMapProps {
  id: string;
  mapKey: string;
  JsonPaths: string[];
  topoJsonPaths?: string[]; 
  height?: string;
}

interface RainDataItem {
  sta_code: string;
  date: string;
  wl: string | null;
  volume: string | null;
  rain_mm: string | null;
  rainSeries: string | null;
  }

interface FlowDataItem {
  sta_code: string;
  date: string;
  wl: string | null;
  discharge: string | null;
  }

  interface GateDataItem {
  sta_code: string;
  date: string;
  wl_upper: string | null;
  wl_lower: string | null;
  discharge: string | null;
  }
  
  

const HydroMap: React.FC<HydroMapProps> = ({ mapKey, JsonPaths,height}) => {
  const { mode } = useThemeMode();
  const mapContainerRef = useRef<HTMLDivElement | null>(null);
  const [JsonDataList, setJsonDataList] = useState<any[]>([]);
  const [isMapReady, setIsMapReady] = useState<boolean>(false);

  const [flowInfo, setFlowInfo] = useState<any[]>([]);
  const [gateInfo, setGateInfo] = useState<any[]>([]);
  const [rainInfo, setRainInfo] = useState<any[]>([]);

  const [showFlowMarkers, setShowFlowMarkers] = useState(false);
  const [showGateMarkers, setShowGateMarkers] = useState(false);
  const [showRainMarkers, setShowRainMarkers] = useState(false);
  
  const flowMarkersRef = useRef<any[]>([]);
  const gateMarkersRef = useRef<any[]>([]);
  const rainMarkersRef = useRef<any[]>([]);

  const [flowData, setFlowData] = useState<any[]>([]);
  const [gateData, setGateData] = useState<any[]>([]);
  const [rainData, setRainData] = useState<any[]>([]);

  const [latestRainData, setLatestRainData] = useState<RainDataItem[]>([]);
  const [latestFlowData, setLatestFlowData] = useState<FlowDataItem[]>([]);
  const [latestGateData, setLatestGateData] = useState<GateDataItem[]>([]);

  const todayStr = new Date().toISOString().slice(0, 10); 

  const removeAllMarkers = () => {
    if (map) {
      flowMarkersRef.current.forEach(marker => map.Overlays.remove(marker));
      gateMarkersRef.current.forEach(marker => map.Overlays.remove(marker));
      rainMarkersRef.current.forEach(marker => map.Overlays.remove(marker));
      flowMarkersRef.current = [];
      gateMarkersRef.current = [];
      rainMarkersRef.current = [];
    }
  };

 useEffect(() => {
  if (!map) return;
  if (mode === 'dark') {
    map.enableFilter(longdo.Filter.Dark);
    console.log('เปิด Dark Map');
  } else {
    map.enableFilter(longdo.Filter.Light);
    console.log('เปิด Light Map');
  }
}, [mode, map]);


useEffect(() => {
  const loadMapScript = () => {
    if (!document.querySelector(`#longdoMapScript`)) {
      const script = document.createElement("script");
      script.src = `https://api.longdo.com/map/?key=${mapKey}`;
      script.id = "longdoMapScript";
      script.async = true;
      script.defer = true;
      document.body.appendChild(script);      script.onload = () => {
        console.log("โหลด Longdo map script สำเร็จ");
        if (window.longdo && window.longdo.Map) {
          longdo = window.longdo;
          map = new longdo.Map({
            placeholder: mapContainerRef.current,
            language: "th",
          });
          setIsMapReady(true);
        }
      };
      script.onerror = () => console.error("โหลด Longdo map script ผิดพลาด");
    } else {
      if (window.longdo && window.longdo.Map) {
        longdo = window.longdo;
        map = new longdo.Map({
          placeholder: mapContainerRef.current,
          language: "th",
        });
        setIsMapReady(true);
      }
    }
  };

  loadMapScript();
}, [mapKey]);

// โหลด GeoJSON ไฟล์ (เมื่อ JsonPaths เปลี่ยน)
useEffect(() => {
  const loadJsonFiles = async () => {
    try {
      const data = await Promise.all(JsonPaths.map(path => fetch(path).then(res => {
        if (!res.ok) throw new Error(`โหลดไฟล์ไม่สำเร็จ: ${path}`);
        return res.json();
      })));
      setJsonDataList(data);
    } catch (error) {
      console.error(error);
    }
  };
  loadJsonFiles();
}, [JsonPaths]);

useEffect(() => {
  if (!isMapReady) return;

  const fetchData = async () => {
    try {
      const [flowRes, rainRes, gateRes] = await Promise.allSettled([
        fetch(`${API_URL}/api/flow_info`).then(res => res.json()),
        fetch(`${API_URL}/api/rain_info`).then(res => res.json()),
        fetch(`${API_URL}/api/gate_info`).then(res => res.json()),
      ]);
      console.log("📡 กำลังดึงข้อมูล...");
      setFlowInfo(flowRes.status === "fulfilled" ? flowRes.value.data : []);
      setRainInfo(rainRes.status === "fulfilled" ? rainRes.value.data  : []);
      setGateInfo(gateRes.status === "fulfilled" ? gateRes.value.data  : []);
    } catch (error) {
      console.error(error);
    }
  };

  fetchData();
}, [isMapReady]);

useEffect(() => {
    const loadData = async () => {
      const [rainRes, flowRes, gateRes] = await Promise.all([
        fetch(`${API_URL}/api/rain_data_last_14_days`).then(res => res.json()),
        fetch(`${API_URL}/api/flow_data_last_14_days`).then(res => res.json()),
        fetch(`${API_URL}/api/gate_data_last_14_days`).then(res => res.json()),
      ]);
  
      if (rainRes.status === "success") {
        const rainData = rainRes.data;
        setRainData(rainData);
  
        // หาค่าฝนล่าสุด
        const rainMap = new Map<string, any>();
        rainData.forEach((item: { sta_code: string; date: string | number | Date; }) => {
          const existing = rainMap.get(item.sta_code);
          if (!existing || new Date(item.date) > new Date(existing.date)) {
            rainMap.set(item.sta_code, item);
          }
        });
        setLatestRainData(Array.from(rainMap.values()));
      }
  
      if (flowRes.status === "success") {
        const flowData = flowRes.data;
        setFlowData(flowData);
  
        // หาค่าการระบายน้ำล่าสุด
        const flowMap = new Map<string, any>();
        flowData.forEach((item: { sta_code: string; date: string | number | Date; }) => {
          const existing = flowMap.get(item.sta_code);
          if (!existing || new Date(item.date) > new Date(existing.date)) {
            flowMap.set(item.sta_code, item);
          }
        });
        setLatestFlowData(Array.from(flowMap.values()));
      }
    
      if (gateRes.status === "success") {
        const gateData = gateRes.data;
        setGateData(gateData);

        const gateMap = new Map<string, any>();
        gateData.forEach((item: { sta_code: string; date: string | number | Date; }) => {
          const existing = gateMap.get(item.sta_code);
          if (!existing || new Date(item.date) > new Date(existing.date)) {
            gateMap.set(item.sta_code, item);
          }
        });
        setLatestGateData(Array.from(gateMap.values()));
        console.log(latestGateData);
      }
    };
    loadData();
  }, []);
  
  useEffect(() => {
    (window as any).renderChart = renderChart;
     }, [flowData, rainData,  gateData]);
  
    const chartsInstances: Record<string, Record<string, ApexCharts>> = {};
    
    // เตรียมข้อมูลสำหรับ Rain
    const prepareChartDataForRain = (rawData: any[], targetStaCode: string) => {
      const filtered = rawData
        .filter(d => d.sta_code === targetStaCode)
        .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
    
      const rain_mmSeries = filtered.map(d => ({
        x: new Date(d.date).getTime(),
        y: parseFloat(d.rain_mm || null),
      }));
    
      let cumulative = 0;
      const rainSeries = filtered.map(d => {
        const rain = parseFloat(d.rain_mm);
        cumulative += isNaN(rain) ? 0 : rain;
        return { x: new Date(d.date).getTime(), y: parseFloat(cumulative.toFixed(2)) };
      });
    
      return { rain_mmSeries, rainSeries };
    };

    const prepareChartDataForFlow = (rawData: any[], targetStaCode: string) => {
      const filtered = rawData
        .filter(d => d.sta_code === targetStaCode)
        .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
      
  
      const dischargeSeries = filtered.map(d => ({
        x: new Date(d.date).getTime(),
        y: parseFloat(d.discharge || null),
      }));
  
      const wlSeries = filtered.map(d => ({
        x: new Date(d.date).getTime(),
        y: parseFloat(d.wl || null),
      }));
    
      return { dischargeSeries, wlSeries};
    };
    // เตรียมข้อมูลสำหรับ Reservoir

      const prepareChartDataForGate = (rawData: any[], targetStaCode: string) => {
        const filtered = rawData
          .filter(d => d.sta_code === targetStaCode)
          .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
        
    
        const dischargeSeries = filtered.map(d => ({
          x: new Date(d.date).getTime(),
          y: parseFloat(d.discharge || null),
        }));
    
        const wl_upperSeries = filtered.map(d => ({
          x: new Date(d.date).getTime(),
          y: parseFloat(d.wl_upper || null),
        }));

        const wl_lowerSeries = filtered.map(d => ({
          x: new Date(d.date).getTime(),
          y: parseFloat(d.wl_lower || null),
        }));
      
        return { dischargeSeries, wl_upperSeries, wl_lowerSeries};
      };
      
 
    const renderChart = (
      code: string,
      type: 'rain_mm' | 'rain_series' | 'discharge' | 'wl' | 'inflow' | 'outflow' | 'volume' | 'wl_sea' | 'wl_upper'| 'wl_lower' | 'gate_discharge'
    ) => {
      const safeStaCode = code.replace(/\./g, '_');
      const chartId = `chart-${type}-${safeStaCode}`;
      const element = document.getElementById(chartId) as HTMLElement;
      if (!element) {
        console.warn(`ไม่พบ element ${chartId}`);
        return;
      }
    
      let seriesData: any[] = [];
      let title = '';
      let color = '';
      let chartType: 'line' | 'bar' = 'line';
    
      switch(type) {
      case 'rain_mm':
      case 'rain_series': {
        const chartData = prepareChartDataForRain(rainData, code);
        if(type === 'rain_mm') {
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
        const chartData = prepareChartDataForFlow(flowData, code);
        if(type === 'discharge') {
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

      case 'wl_upper':
      case 'wl_lower': 
      case 'gate_discharge': { // ถ้าต้องการเฉพาะ discharge ของ gate
        const chartData = prepareChartDataForGate(gateData, code);
        if(type === 'wl_upper'){
          seriesData = chartData.wl_upperSeries;
          title = 'ระดับน้ำเหนือ (ม.รทก.)';
          color = '#e53935';
        } else if(type === 'wl_lower'){
          seriesData = chartData.wl_lowerSeries;
          title = 'ระดับน้ำท้าย (ม.รทก.)';
          color = '#e53935';
        } else { // gate_discharge
          seriesData = chartData.dischargeSeries;
          title = 'อัตราการไหล (ลบ.ม./วินาที)';
          color = '#1e88e5';
        }
        break;
      }

            default:
          console.warn(`ไม่รองรับ type ${type}`);
          return;
      }

      if (!chartsInstances[code]) chartsInstances[code] = {};
      Object.values(chartsInstances[code]).forEach(chart => chart.destroy());
      chartsInstances[code] = {};
    
      // ซ่อน div ทั้งหมดของ code นั้น
      ['rain_mm', 'rain_series', 'discharge', 'wl', 'inflow', 'outflow', 'volume','wl_sea','wl_upper','wl_lower','gate_discharge'].forEach(t => {
        const el = document.getElementById(`chart-${t}-${code}`) as HTMLElement;
        if (el) el.style.display = 'none';
      });
    
      // แสดง div ที่ต้องการ
      element.style.display = 'block';
    
      // สร้างกราฟ
      const chart = new ApexCharts(element, {
        chart: { type: chartType, height: 220, zoom: { enabled: false }, toolbar: { show: false } },
        title: { text: title },
        series: [{ name: title, data: seriesData }],
        xaxis: {
          type: 'datetime',
          labels: {
            datetimeUTC: false,
            format: 'dd MMM'
          }
        },
        colors: [color],
        dataLabels: {
          enabled: true,
          offsetY: -20,
          style: {
            fontSize: '12px',
            colors: ["#304758"]
          }
        },
        plotOptions: {
          bar: {
            borderRadius: 3,
            dataLabels: {
              position: 'top', // top, center, bottom
            },
          }
        },
        markers: {
          size: 5,             // ขนาดของ marker
          colors: [color],     // สีของ marker
          strokeColors: '#fff', // สีขอบของ marker
          strokeWidth: 2,      // ความหนาของขอบ
          shape: 'circle',     // หรือ 'square'
          hover: {
            size: 7,           // ขนาดเมื่อ hover
          }
        },
        tooltip: {
          x: {
            formatter: (val: string | number | Date) => {
                const date = new Date(val);
                return date.toLocaleDateString('th-TH', {
                  day: '2-digit',
                  month: 'short',
                  year: 'numeric',
                });
            },
          },
          // y: {
          //   formatter: (val: number) => `${Math.abs(val).toFixed(2).toLocaleString()} ${
          //     type === 'volume' ? 'ล้าน ลบ.ม.' : 'มม.'
          //   }`,
          // },
        },
      });
    
      chart.render();
      chartsInstances[code][type] = chart;
      
    };


    const createToggleMenu = (label: string, value: string, initialCheck: boolean, onChange: (checked: boolean) => void) => {
      return new longdo.MenuBar({
        button: [
          {
            label,
            value,
            type: longdo.ButtonType.Toggle,
            check: initialCheck,
          },
        ],
        label: '📌 แสดงข้อมูล',
        change: (toItem: { check: boolean }) => {
          onChange(!!toItem?.check);
        },
        
      });
    };

// ตั้งค่าแผนที่ตำแหน่ง zoom (แค่ครั้งแรกที่ map พร้อม)
useEffect(() => {
  if (!isMapReady) return;
  map.location({ lat: 16.750, lon: 100 }, true);
  map.zoom(11, true);
  map.Ui.Mouse.enableWheel(false);
  map.zoomRange({ min:8, max:17 });
  map.Ui.add(createToggleMenu('🚰 สถานีน้ำท่า', 'flow', true, setShowFlowMarkers));
  map.Ui.add(createToggleMenu('🌧️ สถานีน้ำฝน', 'rain', true, setShowRainMarkers));
  map.Ui.add(createToggleMenu('💧 ประตูระบายน้ำ', 'gate', true, setShowGateMarkers));
}, [isMapReady]);

// เพิ่ม GeoJSON + markers เมื่อ data พร้อม และ map พร้อม
useEffect(() => {
  if (!isMapReady) return;
  if (JsonDataList.length === 0) return;

  addGeoJsonPolygons();
  addGeoJsonLines();

}, [JsonDataList, isMapReady]);

useEffect(() => {
    if (!isMapReady) return;

    // Clear all existing markers first
    removeAllMarkers();

    // Re-add markers based on current visibility states
    if (showFlowMarkers) {
      addMarkersFromFlowData();
    }
    if (showRainMarkers) {
      addMarkersFromRainData();
    }
     if (showGateMarkers) {
      addMarkersFromGateData();
    }


    console.log('Map loading Success!!');

  }, [
    flowInfo,
    gateInfo,
    rainInfo,
    latestFlowData, // Use latestData directly for re-render if it changes
    latestGateData,
    latestRainData,
    isMapReady,
    showFlowMarkers,
    showGateMarkers,
    showRainMarkers,
  ]);

  const addGeoJsonPolygons = () => {
    if (!map) {
      console.error("แผนที่ยังไม่ถูกสร้างขึ้น");
      return;
    }

    let newPolygons: any[] = []; // เก็บ Polygon ที่สร้างขึ้น

    JsonDataList.forEach((geoJsonData) => {
      if (geoJsonData && geoJsonData.features) {
        geoJsonData.features.forEach((feature: any) => {
          const { MBASIN_T, AREA_SQKM } = feature.properties;
          const geometryType = feature.geometry.type;
          const coordinates = feature.geometry.coordinates;

          let polygonCoordinates: any[] = [];

          if (geometryType === "Polygon") {
            polygonCoordinates = coordinates[0].map((coord: any) => ({
              lat: coord[1], // ค่าละติจูด
              lon: coord[0], // ค่าลองจิจูด
            }));
          } else if (geometryType === "MultiPolygon") {
            coordinates.forEach((polygon: any) => {
              polygonCoordinates = polygon[0].map((coord: any) => ({
                lat: coord[1], // ค่าละติจูด
                lon: coord[0], // ค่าลองจิจูด
              }));

              // เพิ่มแต่ละ Polygon แยกกัน
              const multiPolygon = new longdo.Polygon(polygonCoordinates, {
                // title: `ขอบเขตพื้นที่ลุ่มน้ำ`,
                // detail: `<b>ขนาดพื้นที่:</b> ${AREA_SQKM} ตร.กม.<br>
                //           <b>แม่น้ำ:</b> ${MBASIN_T}`,
                lineWidth: 3,
                lineColor: 'rgba(0, 0, 0, 0.5)',
                fillColor: "rgba(0, 255, 255,0.01)",
                visibleRange: { min: 0, max: 12 },
              });

              map.Overlays.add(multiPolygon);
              newPolygons.push(multiPolygon);
            });
          }

          // ถ้าเป็น Polygon ปกติ (ไม่ใช่ MultiPolygon)
          if (polygonCoordinates.length > 0) {
            const polygon = new longdo.Polygon(polygonCoordinates, {
              title: `พื้นที่: ${MBASIN_T}`,
              detail: `<b>ขนาดพื้นที่:</b> ${AREA_SQKM}  ตร.กม.`,
              lineColor: "black",
              lineWidth: 2,
              fillColor: "rgba(0, 255, 255,0.01)",
              visibleRange: { min: 0, max: 12 },
            });

            map.Overlays.add(polygon);
            newPolygons.push(polygon);
          }
        });
      }
    });

    console.log("✅ Polygon ถูกเพิ่มลงในแผนที่เรียบร้อย");
  };

  const addGeoJsonLines = () => {
    if (!map) {
      console.error("แผนที่ยังไม่ถูกสร้างขึ้น");
      return;
    }

    let newPolylines: any[] = []; // เก็บเส้นที่สร้างขึ้น

    JsonDataList.forEach((geoJsonData) => {
      if (geoJsonData && geoJsonData.features) {
        geoJsonData.features.forEach((feature: any) => {
          const { name_en } = feature.properties;
          const geometryType = feature.geometry.type;
          const coordinates = feature.geometry.coordinates;

          let lineCoordinates: any[] = [];

          if (geometryType === "LineString") {
            lineCoordinates = coordinates.map((coord: any) => ({
              lat: coord[1], // ละติจูด
              lon: coord[0], // ลองจิจูด
            }));
          } else if (geometryType === "MultiLineString") {
            coordinates.forEach((line: any) => {
              const polylineCoords = line.map((coord: any) => ({
                lat: coord[1],
                lon: coord[0],
              }));

              // เพิ่มแต่ละเส้น MultiLineString แยกกัน
              const multiPolyline = new longdo.Polyline(polylineCoords, {
                title: `แม่น้ำ: ${name_en}`,
                lineWidth: 3, // ความหนาของเส้น
                lineColor: "blue", // สีเส้น
                lineStyle: longdo.LineStyle.Solid, // รูปแบบเส้น (Solid = เส้นทึบ)
              });

              map.Overlays.add(multiPolyline);
              newPolylines.push(multiPolyline);
            });
          }

          // ถ้าเป็น LineString ปกติ (ไม่ใช่ MultiLineString)
          if (lineCoordinates.length > 0) {
            const polyline = new longdo.Polyline(lineCoordinates, {
              title: `แม่น้ำ: ${name_en}`,
              lineWidth: 3,
              lineColor: "blue",
              lineStyle: longdo.LineStyle.Solid,
            });

            map.Overlays.add(polyline);
            newPolylines.push(polyline);
          }
        });
      }
    });

    console.log("✅ เพิ่มเส้นแม่น้ำลงในแผนที่เรียบร้อย");
  };

    const latestDataMapFlow =
    Array.isArray(latestFlowData) && latestFlowData.length > 0
        ? new Map(latestFlowData.map((d) => [d.sta_code, d]))
        : new Map();


        const addMarkersFromFlowData = () => {
          if (!map) return;
        
          flowMarkersRef.current = [];
        
          flowInfo.forEach((data) => {
            const { lat, long, sta_name, district, province, sta_code } = data;
            const position = { lat: parseFloat(lat), lon: parseFloat(long) };
            const latest = latestDataMapFlow.get(sta_code);
        
            const latestDateStr = latest?.date ? new Date(latest.date).toISOString().slice(0, 10) : null;
            const isToday = latestDateStr === todayStr;
        
            const discharge = isToday && latest?.discharge != null && parseFloat(latest.discharge) !== 0
              ? parseFloat(latest.discharge).toFixed(2)
              : "-";
        
            const wl = isToday && latest?.wl != null && parseFloat(latest.wl) !== 0
              ? parseFloat(latest.wl).toFixed(2)
              : "-";
        
            if (position.lat && position.lon) {
              const marker = new longdo.Marker(position, {
                title: `<img src="${Path_URL}images/icons/flow_station_icon.png" style="width:25px; height:25px; vertical-align:middle; margin-right:5px" /> 
                    <span style="font-size:1.1rem; font-weight:bold; vertical-align:middle;">${sta_name} อ.${district} จ.${province}</span>`,
                detail: `
                    <div style="font-size: 1rem;">
                      <b>ข้อมูลประจำวันที่ ${formatThaiDay(todayStr)}</b>
                    </div>
                    <div style="font-size: 0.9rem; line-height: 1.4rem;">
                      <div><b>รหัสสถานี:</b> <span style="color: #4caf50; font-weight: bold;"> ${sta_code || "-"}</span></div>
                    </div>
                    <div style="font-size: 0.9rem; line-height: 1.4rem;">
                      <div><b>📉 อัตราการไหล:</b> <span style="color: #1e88e5; font-weight: bold;">${discharge} ลบ.ม./วินาที</span></div>
                    </div>
                    <div style="font-size: 0.9rem; line-height: 1.4rem;">
                      <div><b>📈 ระดับน้ำ:</b> <span style="color: #e53935; font-weight: bold;">${wl} ม.รทก.</span></div>
                    </div>
        
                    <button onclick="window.renderChart('${sta_code}', 'discharge')" 
                        style="background-color: #1e88e5; color: white; padding: 4px 10px; border: none; border-radius: 6px; font-size: 0.9rem; cursor: pointer; transition: background-color 0.2s;">
                        📉 อัตราการไหล
                    </button>
        
                    <button onclick="window.renderChart('${sta_code}', 'wl')" 
                        style="background-color: #e53935; color: white; padding: 4px 10px; border: none; border-radius: 6px; font-size: 0.9rem; cursor: pointer; transition: background-color 0.2s;">
                        📈 ระดับน้ำ
                    </button>
        
                    <br>
                    <div id="chart-discharge-${sta_code.replace(/\./g, '_')}" style="display:none;"></div>
                    <div id="chart-wl-${sta_code.replace(/\./g, '_')}" style="display:none;"></div>
                `,
                icon: {
                  html: `<div style="text-align:center;">
                      <img src="${Path_URL}images/icons/flow_station_icon.png" style="width:24px; height:24px; display:block; margin:0 auto;" />
                      <div style="background-color: rgba(255, 255, 255, 0.4); padding:2px; border-radius:5px; font-size: 12px; margin-top: 2px;width:80px;">
                            ${sta_name}

                      </div></div>`
                },
                size: { width: 450, height: 'auto' },
              });
        
              map.Overlays.add(marker);
              flowMarkersRef.current.push(marker);
            }
          });
          console.log("✅ เพิ่ม markers จาก Flow data");
        };
        
    const latestDataMapGate =
    Array.isArray(latestGateData) && latestGateData.length > 0
        ? new Map(latestGateData.map((d) => [d.sta_code, d]))
        : new Map();


        const addMarkersFromGateData = () => {
          if (!map) return;
        
          gateMarkersRef.current = [];
        
          gateInfo.forEach((data) => {
            const { lat, long, sta_name, district, province, sta_code } = data;
            const position = { lat: parseFloat(lat), lon: parseFloat(long) };
            const latest = latestDataMapGate.get(sta_code);
        
            const latestDateStr = latest?.date ? new Date(latest.date).toISOString().slice(0, 10) : null;
            const isToday = latestDateStr === todayStr;
        
            const discharge = isToday && latest?.discharge != null && parseFloat(latest.discharge) !== 0
              ? parseFloat(latest.discharge).toFixed(2)
              : "-";

            const wl_upper = isToday && latest?.wl_upper != null && parseFloat(latest.wl_upper) !== 0
              ? parseFloat(latest.wl_upper).toFixed(2)
              : "-";

            const wl_lower = isToday && latest?.wl_lower != null && parseFloat(latest.wl_lower) !== 0
              ? parseFloat(latest.wl_lower).toFixed(2)
              : "-";
        
            if (position.lat && position.lon) {
              const marker = new longdo.Marker(position, {
                title: `<img src="${Path_URL}images/icons/gate_icon.png" style="width:25px; height:25px; vertical-align:middle; margin-right:5px" /> 
                    <span style="font-size:1.1rem; font-weight:bold; vertical-align:middle;">${sta_name} อ.${district} จ.${province}</span>`,
                detail: `
                    <div style="font-size: 1rem;">
                      <b>ข้อมูลประจำวันที่ ${formatThaiDay(todayStr)}</b>
                  </div>
                  <div style="font-size: 0.9rem; line-height: 1.4rem;">
                    <div><b>รหัสสถานี:</b> <span style="color: #4caf50; font-weight: bold;"> ${sta_code || "-"}</span></div>
                  </div>
                    <div style="font-size: 0.9rem; line-height: 1.4rem;">
                    <div><b>📉 อัตราการไหล:</b> <span style="color: #1e88e5; font-weight: bold;">${discharge || "-"} ลบ.ม./วินาที</span></div>
                  </div>
                  <div style="font-size: 0.9rem; line-height: 1.4rem;">
                      <div><b>📈 ระดับน้ำเหนือ:</b> <span style="color: #e53935; font-weight: bold;">${wl_upper || "-"} ม.รทก. </span></div>
                  </div>
                    <div style="font-size: 0.9rem; line-height: 1.4rem;">
                      <div><b>📈 ระดับน้ำท้าย:</b> <span style="color: #e53935; font-weight: bold;">${wl_lower || "-"} ม.รทก. </span></div>
                  </div>
      
                    <button 
                      onclick="window.renderChart('${sta_code}', 'gate_discharge')" 
                      style="background-color: #1e88e5; color: white; padding: 4px 10px; border: none; border-radius: 6px; font-size: 0.9rem; cursor: pointer; transition: background-color 0.2s;">
                      📉 อัตราการไหล
                    </button>
      
                    <button 
                      onclick="window.renderChart('${sta_code}', 'wl_upper')" 
                      style="background-color: #e53935; color: white; padding: 4px 10px; border: none; border-radius: 6px; font-size: 0.9rem; cursor: pointer; transition: background-color 0.2s;">
                      📈 ระดับน้ำเหนือ
                    </button>
      
                    <button 
                      onclick="window.renderChart('${sta_code}', 'wl_lower')" 
                      style="background-color: #e53935; color: white; padding: 4px 10px; border: none; border-radius: 6px; font-size: 0.9rem; cursor: pointer; transition: background-color 0.2s;">
                      📈 ระดับน้ำท้าย
                    </button>
                
                  <br>
                  <div id="chart-gate_discharge-${sta_code.replace(/\./g, '_')}" style="display:none;"></div>
                  <div id="chart-wl_upper-${sta_code.replace(/\./g, '_')}" style="display:none;"></div>
                  <div id="chart-wl_lower-${sta_code.replace(/\./g, '_')}" style="display:none;"></div>
                `,
                icon: {
                  html: `<div style="text-align:center;">
                      <img src="${Path_URL}images/icons/gate_icon.png" style="width:24px; height:24px; display:block; margin:0 auto;" />
                      <div style="background-color: rgba(255, 255, 255, 0.4); padding:2px; border-radius:5px; font-size: 12px; margin-top: 2px;width:80px;">
                            ${sta_code}

                      </div></div>`
                },
                size: { width: 550, height: 'auto' },
              });
        
              map.Overlays.add(marker);
              gateMarkersRef.current.push(marker);
            }
          });
          console.log("✅ เพิ่ม markers จาก Gate data");
        };

    const latestDataMapRain =
              Array.isArray(latestRainData) && latestRainData.length > 0
                ? new Map(latestRainData.map((d) => [d.sta_code, d]))
                : new Map();
  
    const addMarkersFromRainData = () => {
       if (!map || !showRainMarkers) return; 
    
        rainMarkersRef.current = [];
        
      rainInfo.forEach((data) => {
        const { lat, long, name, district, province, sta_code } = data;
        const position = { lat: parseFloat(lat), lon: parseFloat(long) };
        const latest = latestDataMapRain.get(sta_code);

        const latestDateStr = latest?.date ? new Date(latest.date).toISOString().slice(0, 10) : null;
        const isToday = latestDateStr === todayStr;

        // const rain_mm = latest?.rain_mm != null ? parseFloat(latest.rain_mm).toFixed(2) : "-";
        const rain_mm = isToday && latest?.rain_mm != null && parseFloat(latest.rain_mm) !== 0
        ? parseFloat(latest.rain_mm).toFixed(2)
        : "-";


        if (position.lat && position.lon) {
          const marker = new longdo.Marker(position, {
            title: `<img src="${Path_URL}images/icons/rain_station_icon.png" style="width:25px; height:25px; vertical-align:middle; margin-right:5px" /> 
              <span style="font-size:1.1rem; font-weight:bold; vertical-align:middle;">${name} อ.${district} จ.${province}</span>`,
            detail: `
              <div style="font-size: 1rem;">
                <b>
                ข้อมูลประจำวันที่
                  ${formatThaiDay(todayStr)}
                <b>
              </div>
                <div style="font-size: 0.9rem; line-height: 1.4rem;">
                <div><b>รหัสสถานี:</b> <span style="color: #4caf50; font-weight: bold;"> ${sta_code || "-"}</span></div>
             </div>
              <div style="font-size: 0.9rem; line-height: 1.4rem;">
                <div><b>📉 ปริมาณน้ำฝน:</b> <span style="color: #1e88e5; font-weight: bold;">${rain_mm || "-"} มม.</span></div>
             </div>
                <button 
                  onclick="window.renderChart('${sta_code}', 'rain_mm')" 
                  style="background-color: #1e88e5; color: white; padding: 4px 10px; border: none; border-radius: 6px; font-size: 0.9rem; cursor: pointer; transition: background-color 0.2s;">
                  📈 ปริมาณน้ำฝน
                </button>
  
                <button 
                  onclick="window.renderChart('${sta_code}', 'rain_series')" 
                  style="background-color: #e53935; color: white; padding: 4px 10px; border: none; border-radius: 6px; font-size: 0.9rem; cursor: pointer; transition: background-color 0.2s;">
                  📉 ปริมาณน้ำฝนสะสม
                </button>
  
              </div>
              <!-- Container ของกราฟ -->
              <br>
              <div id="chart-rain_mm-${sta_code}" style="display:none;"></div>
              <div id="chart-rain_series-${sta_code}" style="display:none;"></div>
            `,
            icon: {
              html: `<div style="text-align:center;">
                <img src="${Path_URL}images/icons/${parseFloat(data.rain_mm) > 0 ? 'rain_station_icon.png' : 'sun_station_icon.png'}" style="width:24px; height:24px; display:block; margin:0 auto;" />
                <div style="background-color: rgba(255, 255, 255, 0.4); padding:2px; border-radius:5px; font-size: 12px; margin-top: 2px;width:80px;">
                  ${data.sta_code}
                </div>
              </div>`
            },
            size: { width: 450, height: 'auto' },
          });
          
          map.Overlays.add(marker);
          rainMarkersRef.current.push(marker)
        }
      });
      console.log("✅ เพิ่ม markers จาก Rain data");
    };

  return (
    <div
      ref={mapContainerRef}
      style={{ width: "100%", height: height || "85vh" }}
    >
    </div>
  );
};

export default HydroMap;


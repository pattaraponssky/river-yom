import React, { useEffect, useRef, useState } from "react";
import { API_URL, formatThaiDay, Path_URL } from "@/lib/utility";
import { alpha, Avatar, Box, Grid, List, ListItem, ListItemAvatar, ListItemText, Typography, useTheme } from "@mui/material";
import ApexCharts from 'apexcharts';

declare global {
  interface Window {
    longdo: any;
  }
}
export let longdo: any;
export let map: any;
export let chartId: string;

interface LongdoMapProps {
  id: string;
  mapKey: string;
  stationType: string;
  JsonPaths: string[];
  height?: string;
}

// Define currentDate with the current date
const currentDate = new Date();
const formattedDate = currentDate.toLocaleDateString('th-TH', {
  weekday: 'long', // แสดงวันในสัปดาห์ เช่น จันทร์
  year: 'numeric', 
  month: 'long', 
  day: 'numeric'
});
interface GateDataItem {
  sta_code: string;
  date: string;
  wl: string | null;
  discharge: string | null;
}

const GateMap: React.FC<LongdoMapProps> = ({mapKey, stationType, JsonPaths ,height }) => {
  
  const mapContainerRef = useRef<HTMLDivElement | null>(null);
  const [JsonDataList, setJsonDataList] = useState<any[]>([]);
  const [isMapReady, setIsMapReady] = useState<boolean>(false);
  const [, setMarkers] = useState<any[]>([]);
  const [gateData, setGateData] = useState<any[]>([]);
  const [gateApiData, setGateApiData] = useState<GateDataItem[]>([]);
  const [latestGateData, setLatestGateData] = useState<GateDataItem[]>([]);
  const todayStr = new Date().toISOString().slice(0, 10); 
  const theme = useTheme();
  const primary = theme.palette.primary.main;
  
  useEffect(() => {
    const loadMapScript = () => {
      if (!document.querySelector(`#longdoMapScript`)) {
        const script = document.createElement("script");
        script.src = `https://api.longdo.com/map/?key=${mapKey}`;
        script.id = "longdoMapScript";
        script.async = true;
        script.defer = true;
        document.body.appendChild(script);

        script.onload = () => {
          console.log("สคริปต์ Longdo โหลดเสร็จแล้ว");
          if (window.longdo && window.longdo.Map) {
            setIsMapReady(true);
          } else {
            console.error("ไม่พบข้อมูล longdo ใน window");
          }
        };

        script.onerror = () => {
          console.error("เกิดข้อผิดพลาดในการโหลดสคริปต์ Longdo");
        };
      } else {
        if (window.longdo && window.longdo.Map) {
          setIsMapReady(true);
        }
      }
    };

    loadMapScript();
  }, [mapKey]);

  // เมื่อแผนที่โหลดเสร็จ ให้เริ่มต้นใช้งานแผนที่
  useEffect(() => {
    if (isMapReady && mapContainerRef.current) {
      console.log("แผนที่ Longdo พร้อมใช้งานแล้ว");
      initializeMap();
    }
  }, [isMapReady]);

  useEffect(() => {
    fetch(`${API_URL}/api/gate_data_last_14_days`)
      .then(res => res.json())
      .then(result => {
        if (result.status === 'success') {
          const rawData: GateDataItem[] = result.data;
  
          // เก็บข้อมูลทั้งหมด
          setGateApiData(rawData);
  
          // สร้าง Map เพื่อเก็บเฉพาะรายการล่าสุดต่อ sta_code
          const latestDataMap = new Map<string, GateDataItem>();
  
          rawData.forEach(item => {
            const existing = latestDataMap.get(item.sta_code);
            if (!existing || new Date(item.date) > new Date(existing.date)) {
              latestDataMap.set(item.sta_code, item);
            }
          });
  
          const latestData = Array.from(latestDataMap.values());
          setLatestGateData(latestData);
        }
      });
  }, []);
  

  useEffect(() => {
    if (isMapReady) {
      const fetchData = async () => {
        console.log("📡 กำลังดึงข้อมูล...");
  
        try {
          let apiUrl = "";
          apiUrl = `${API_URL}/api/gate_info`;
  
          if (!apiUrl) return;
  
          const response = await fetch(apiUrl);
          if (!response.ok) throw new Error("❌ โหลดข้อมูลไม่สำเร็จ");
  
          const result = await response.json();
          console.log(`✅ ดึงข้อมูลจาก ${stationType}:`, result);
  
      
          setGateData(result.data || []);
  
        } catch (error) {
          console.error("❌ เกิดข้อผิดพลาดขณะดึงข้อมูล:", error);
        }
      };
  
      fetchData();
    }
  }, [isMapReady, stationType]);
  
  
  // เมื่อข้อมูลพร้อมแล้ว ค่อยเพิ่ม markers
  useEffect(() => {
    if (isMapReady) {
      console.log("กำลังเพิ่ม markers...");
      map.location({ lat: 16.750, lon: 100 }, true);
      map.zoom(10, true);
      console.log("🌍 แผนที่พร้อมแล้ว กำลังเพิ่ม markers...");    
      console.log("🏞️ gateData:", gateData);
      const addMarkers = async () => {
        try {
          if (gateData.length > 0) await addMarkersFromGateData();
      
          await addTopoJsonMarkers();
          await addGeoJsonPolygons();
          await addGeoJsonLines();
        } catch (error) {
          console.error("เกิดข้อผิดพลาดขณะเพิ่ม markers:", error);
        }
      };
  
      addMarkers();
  
      map.Event.bind('click', function () {
        var mouseLocation = map.location(longdo.LocationMode.Pointer);
        console.log(`Latitude: ${mouseLocation.lat}, Longitude: ${mouseLocation.lon}`);
      });
    }
  }, [isMapReady, gateData]); // รอให้ข้อมูลทั้งหมดพร้อมก่อน
  
  

  // โหลดไฟล์ GeoJSON
  useEffect(() => {
    const loadJsonFiles = async () => {
      try {
        console.log("เริ่มโหลดไฟล์ GeoJSON...");
        const JsonDataListPromises = JsonPaths.map(async (path) => {
          const response = await fetch(path);
          if (!response.ok) throw new Error(`โหลดไฟล์ไม่สำเร็จ: ${path}`);
          return response.json();
        });

        const JsonDataList = await Promise.all(JsonDataListPromises);
        setJsonDataList(JsonDataList);
        console.log("โหลดไฟล์ GeoJSON สำเร็จ:", JsonDataList);
      } catch (error) {
        console.error("เกิดข้อผิดพลาดในการโหลด GeoJSON:", error);
      }
    };

    loadJsonFiles();
  }, [JsonPaths]);

  // ฟังก์ชันสร้างแผนที่
  const initializeMap = () => {
    if (!window.longdo) {
      console.error("แผนที่ไม่พร้อมหรือไม่พบข้อมูล longdo");
      return;
    }
  
    longdo = window.longdo;
    map = new longdo.Map({
      placeholder: mapContainerRef.current,
      language: "th",
    });
  };
const prepareChartDataForGate = (rawData: any[], targetStaCode: string) => {
      const filtered = rawData
        .filter(d => d.sta_code === targetStaCode)
        .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
      
  
      const dischargeSeries = filtered.map(d => ({
        x: new Date(d.date).getTime(),
        y: parseFloat(d.discharge),
      }));
  
      const wlUpperSeries = filtered.map(d => ({
        x: new Date(d.date).getTime(),
        y: parseFloat(d.wl_upper),
      }));

      const wlLowerSeries = filtered.map(d => ({
        x: new Date(d.date).getTime(),
        y: parseFloat(d.wl_lower),
      }));
    
      return { dischargeSeries, wlLowerSeries, wlUpperSeries};
    };



  const chartsInstances: Record<string, Record<string, ApexCharts>> = {};

  const renderChartPart = (sta_code: string, type: 'discharge' | 'wl_upper' | 'wl_lower') => {
    const safeStaCode = sta_code.replace(/\./g, '_');
    const chartId = `chart-${type}-${safeStaCode}`;
    const element = document.getElementById(chartId) as HTMLElement;
    if (!element) {
      console.warn(`ไม่พบ element ${chartId}`);
      return;
    }
  
    // เตรียมข้อมูล
    const raw = gateApiData.filter((d: any) => d.sta_code === sta_code);
    const chartData = prepareChartDataForGate(raw, sta_code);
    let seriesData = [];
    let title = '';
    let color = '';
    let types = ''; // กำหนดค่าเริ่มต้นเป็น 'line'
    switch (type) {
        case 'discharge':
            seriesData = chartData.dischargeSeries;
            title = 'อัตราการไหล (ลบ.ม./วินาที)';
            color = '#1e88e5';
            types = 'line';
          break;
        case 'wl_upper':
            seriesData = chartData.wlUpperSeries;
            title = 'ระดับน้ำเหนือ (ม.รทก.)';
            color = '#e53935';
            types = 'line';
          break;
        case 'wl_lower':
            seriesData = chartData.wlLowerSeries;
            title = 'ระดับน้ำท้าย (ม.รทก.)';
            color = '#e53935';
            types = 'line';
          break;
      }


  
    // ✅ ลบกราฟทั้งหมดก่อนสร้างใหม่
    if (chartsInstances[sta_code]) {
      Object.values(chartsInstances[sta_code]).forEach(chart => chart.destroy());
    }
    chartsInstances[sta_code] = {}; // ✅ เคลียร์ object
  
    // ✅ ซ่อนทุก div
    ['discharge', 'wl_upper', 'wl_lower'].forEach(t => {
      const el = document.querySelector(`[id="chart-${t}-${sta_code}"]`) as HTMLElement;
      if (el) el.style.display = 'none';
    });
  
    // ✅ แสดง div ของกราฟที่ต้องการ
    element.style.display = 'block';
  
    // ✅ สร้างกราฟใหม่
    const chart = new ApexCharts(element, {
      chart: { type: types, height: 200 ,Zoom: { enabled: false }},
      title: { text: title },
      series: [{ name: title, data: seriesData }],
      xaxis: { type: 'datetime' },
      colors: [color],
      dataLabels: {
        enabled: true,
        offsetY: -10,
        style: {
          fontSize: '12px',
          colors: ["#304758"]
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
      plotOptions: {
        bar: {
          borderRadius: 3,
          dataLabels: {
            position: 'top', // top, center, bottom
          },
        }
      },
      tooltip: {
        x: { format: 'dd MMM yyyy' },
        y: {
          formatter: (val: number) => `${Math.abs(val).toFixed(2).toLocaleString()} มม.`,
        },
      },
    });
  
    chart.render();
  
    chartsInstances[sta_code][type] = chart;
  };
  
  useEffect(() => {
    (window as any).renderChartPart = renderChartPart;
  }, [gateApiData]);
  

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
                title: `<span style="font-size:1.1rem; font-weight:bold; vertical-align:middle;"> ขอบเขตพื้นที่ลุ่มน้ำท่าจีน </span>`,
                detail: `<span style="font-size:0.9rem; vertical-align:middle;"><b>ขนาดพื้นที่:</b> ${AREA_SQKM.toFixed(2)} ตร.กม.<br></span> 
                          <span style="font-size:0.9rem; vertical-align:middle;"><b>แม่น้ำ:</b> ${MBASIN_T}<br></span> `,
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

  // ฟังก์ชันเพิ่ม Marker จาก GeoJSON
  

  const addTopoJsonMarkers = () => {
    if (!map) {
      console.error("Map ยังไม่ถูกสร้างขึ้น");
      return;
    }
  
    JsonDataList.forEach((geoJsonData) => {
      if (!geoJsonData?.features) return;
  
      geoJsonData.features.forEach((feature: any) => {
        // เช็คให้ครบถ้วน
        if (!feature?.geometry?.coordinates) {
          console.warn("Feature ไม่มี coordinates:", feature);
          return;
        }
  
        const coords = feature.geometry.coordinates;
  
        // ถ้าเป็น Point → coordinates เป็น [lon, lat]
        if (feature.geometry.type === "Point") {
          if (!Array.isArray(coords) || coords.length < 2) {
            console.warn("Point coordinates ไม่ถูกต้อง:", coords);
            return;
          }
  
          const marker = new longdo.Marker(
            { lat: coords[1], lon: coords[0] },
            {
              title: `พื้นที่: ${feature.properties?.MBASIN_T || "ไม่ระบุ"}`,
              detail: `<b>ขนาดพื้นที่:</b> ${feature.properties?.AREA_SQKM?.toFixed(2) || "ไม่ระบุ"} ตร.กม.`,
            }
          );
  
          map.Overlays.add(marker);
  
          marker.onclick = () => {
            marker.popup(`<b>พื้นที่:</b> ${feature.properties?.MBASIN_T || "ไม่ระบุ"}<br><b>ขนาดพื้นที่:</b> ${feature.properties?.AREA_SQKM?.toFixed(2) || "ไม่ระบุ"} ตร.กม.`);
          };
        }
  
        else if (feature.geometry.type === "Polygon" || feature.geometry.type === "MultiPolygon") {
          console.log(`ข้ามการสร้าง marker สำหรับ ${feature.geometry.type}: ${feature.properties?.MBASIN_T}`);
        }
      });
    });
  
      console.log("✅ เพิ่ม Marker จาก TopoJSON เรียบร้อย");
    };

  const latestDataMap =
  Array.isArray(latestGateData) && latestGateData.length > 0
    ? new Map(latestGateData.map((d) => [d.sta_code, d]))
    : new Map();


  const addMarkersFromGateData = () => {
    if (!map) return;

    let newMarkers: any[] = [];

    gateData.forEach((data) => {
      const { lat, long, sta_name,  district, province, sta_code } = data;
      const position = { lat: parseFloat(lat), lon: parseFloat(long) };
      const latest = latestDataMap.get(sta_code);
  
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
            <span style="font-family: 'Prompt', sans-serif; font-size:1.1rem; font-weight:bold; vertical-align:middle;">${sta_name} อ.${district} จ.${province}</span>`,
          detail: `
            <div style="font-family: 'Prompt', sans-serif; font-size: 1rem;">
                <b>ข้อมูลประจำวันที่ ${formatThaiDay(todayStr)}</b>
            </div>
            <div style="font-family: 'Prompt', sans-serif; font-size: 0.9rem; line-height: 1.4rem;">
              <div><b>รหัสสถานี:</b> <span style="color: #4caf50; font-weight: bold;"> ${sta_code || "-"}</span></div>
            </div>
              <div style="font-family: 'Prompt', sans-serif; font-size: 0.9rem; line-height: 1.4rem;">
              <div><b>📉 อัตราการไหล:</b> <span style="color: #1e88e5; font-weight: bold;">${discharge || "-"} ลบ.ม./วินาที</span></div>
            </div>
            <div style="font-family: 'Prompt', sans-serif; font-size: 0.9rem; line-height: 1.4rem;">
                <div><b>📈 ระดับน้ำเหนือ:</b> <span style="color: #e53935; font-weight: bold;">${wl_upper || "-"} ม.รทก. </span></div>
            </div>
              <div style="font-family: 'Prompt', sans-serif; font-size: 0.9rem; line-height: 1.4rem;">
                <div><b>📈 ระดับน้ำท้าย:</b> <span style="color: #e53935; font-weight: bold;">${wl_lower || "-"} ม.รทก. </span></div>
            </div>

              <button 
                onclick="window.renderChartPart('${sta_code}', 'discharge')" 
                style="font-family: 'Prompt', sans-serif; background-color: #1e88e5; color: white; padding: 4px 10px; border: none; border-radius: 6px; font-size: 0.9rem; cursor: pointer; transition: background-color 0.2s;">
                📉 อัตราการไหล
              </button>

              <button 
                onclick="window.renderChartPart('${sta_code}', 'wl_upper')" 
                style="font-family: 'Prompt', sans-serif; background-color: #e53935; color: white; padding: 4px 10px; border: none; border-radius: 6px; font-size: 0.9rem; cursor: pointer; transition: background-color 0.2s;">
                📈 ระดับน้ำเหนือ
              </button>

              <button 
                onclick="window.renderChartPart('${sta_code}', 'wl_lower')" 
                style="font-family: 'Prompt', sans-serif; background-color: #e53935; color: white; padding: 4px 10px; border: none; border-radius: 6px; font-size: 0.9rem; cursor: pointer; transition: background-color 0.2s;">
                📈 ระดับน้ำท้าย
              </button>

              <a href="/gate?tab=0&station=${sta_code}" 
                style="font-family: 'Prompt', sans-serif; padding: 4px 10px;  background-color: #1976d2; color: white; border-radius: 6px; text-decoration: none; font-size: 0.9rem; display: inline-block; margin-top: 8px; cursor: pointer; transition: background-color 0.2s;">
                 ข้อมูลเพิ่มเติม
              </a>
         
            <br>
            <div id="chart-discharge-${sta_code.replace(/\./g, '_')}" style="display:none;"></div>
            <div id="chart-wl_upper_${sta_code.replace(/\./g, '_')}" style="display:none;"></div>
            <div id="chart-wl_lower_${sta_code.replace(/\./g, '_')}" style="display:none;"></div>
          `,
          icon: { html: `<div style="text-align:center;">
                <img src="${Path_URL}images/icons/gate_icon.png" style="width:24px; height:24px;" />
                <div style="background-color: rgba(255, 255, 255, 0.4); padding:2px; border-radius:5px; font-size: 12px; margin-top: 2px;width:30px;">
                ${sta_code}</div></div>`
                },
          size: { width: 550, height: 'auto' },
        });
        
        map.Overlays.add(marker);
        newMarkers.push(marker);     
      }
    });

    setMarkers(newMarkers);
    console.log("✅ เพิ่ม markers จาก Gate data");
  };

  const handleListItemClick = (item: any, type: "gate") => {
    console.log("Markers: ", item); // ตรวจสอบข้อมูลที่ส่งเข้ามา
  
    const { lat, long } = item;
    const position = { lat: parseFloat(lat), lon: parseFloat(long) };
    if (!position.lat || !position.lon) return;
  
    let title = "";
    let detail = "";
    let icon = "";
  
      title = `<img src="${Path_URL}images/icons/gate_icon.png" style="width:25px; height:25px; vertical-align:middle; margin-right:5px" />
        <span style="font-family: 'Prompt', sans-serif; font-size:1.1rem; font-weight:bold; vertical-align:middle;">${item.sta_name} อ.${item.district} จ.${item.province}</span>`;
      detail = `
           <div style="font-family: 'Prompt', sans-serif; font-size: 1rem;">
                         <b>ข้อมูลประจำวันที่ ${formatThaiDay(todayStr)}</b>
          </div>
            <div style="font-family: 'Prompt', sans-serif; font-size: 0.9rem; line-height: 1.4rem;">
              <div><b>รหัสสถานี:</b> <span style="color: #4caf50; font-weight: bold;"> ${item.sta_code || "-"}</span></div>
            </div>
              <div style="font-family: 'Prompt', sans-serif; font-size: 0.9rem; line-height: 1.4rem;">
              <div><b>📉 อัตราการไหล:</b> <span style="color: #1e88e5; font-weight: bold;">${item.discharge || "-"} ลบ.ม./วินาที </span></div>
            </div>
              <div style="font-family: 'Prompt', sans-serif; font-size: 0.9rem; line-height: 1.4rem;">
                <div><b>📈 ระดับน้ำเหนือ:</b> <span style="color: #e53935; font-weight: bold;">${item.wl_upper || "-"} ม.รทก.</span></div>
            </div>
              <div style="font-family: 'Prompt', sans-serif; font-size: 0.9rem; line-height: 1.4rem;">
                <div><b>📈 ระดับน้ำท้าย:</b> <span style="color: #e53935; font-weight: bold;">${item.wl_lower || "-"} ม.รทก.</span></div>
            </div>
            
              <button 
                onclick="window.renderChartPart('${item.sta_code}', 'discharge')" 
                style="font-family: 'Prompt', sans-serif; background-color: #1e88e5; color: white; padding: 4px 10px; border: none; border-radius: 6px; font-size: 0.9rem; cursor: pointer; transition: background-color 0.2s;">
                📉 อัตราการไหล
              </button>

              <button 
                onclick="window.renderChartPart('${item.sta_code}', 'wl_upper')" 
                style="font-family: 'Prompt', sans-serif; background-color: #e53935; color: white; padding: 4px 10px; border: none; border-radius: 6px; font-size: 0.9rem; cursor: pointer; transition: background-color 0.2s;">
                📈 ระดับน้ำเหนือ
              </button>

              <button 
                onclick="window.renderChartPart('${item.sta_code}', 'wl_lower')" 
                style="font-family: 'Prompt', sans-serif; background-color: #e53935; color: white; padding: 4px 10px; border: none; border-radius: 6px; font-size: 0.9rem; cursor: pointer; transition: background-color 0.2s;">
                📈 ระดับน้ำท้าย
              </button>

              <a href="/gate?tab=0&station=${item.sta_code}" 
                style="padding: 4px 10px;  font-family: 'Prompt', sans-serif; background-color: #1976d2; color: white; border-radius: 6px; text-decoration: none; font-size: 0.9rem; display: inline-block; margin-top: 8px; cursor: pointer; transition: background-color 0.2s;">
                 ข้อมูลเพิ่มเติม
              </a>
            
            <!-- Container ของกราฟ -->
            <br>
            <div id="chart-discharge-${item.sta_code.replace(/\./g, '_')}" style="display:none;"></div>
            <div id="chart-wl_upper-${item.sta_code.replace(/\./g, '_')}" style="display:none;"></div>
            <div id="chart-wl_lower-${item.sta_code.replace(/\./g, '_')}" style="display:none;"></div>
      `;
      icon = `${Path_URL}images/icons/gate_icon.png`;
      
    const marker = new longdo.Popup(position, {
      title,
      detail: `${detail}`,
      icon: {
        html: `<div style="text-align:center;">
          <img src="${icon}" style="width:24px; height:24px;" />
          <div style="background-color: rgba(255, 255, 255, 0.4); padding:2px; border-radius:5px; font-size: 12px; margin-top: 2px;width:30px;">
          ${type === "gate" ? `${item.sta_code}` : item.sta_name}</div></div>`
      },
      size: { width: 550, height: 'auto' },
      
    });

    // เพิ่ม Marker ไปยังแผนที่
    map.Overlays.add(marker);
  
  };
  
  return (
    <Grid container spacing={2}>
      <Grid size={{ xs: 12, sm: 12, md: 8 }}>
        <Box 
          ref={mapContainerRef}
          style={{ width: "100%", height: height || "600px" }}>
        </Box>
      </Grid>
      <Grid size={{ xs: 12, sm: 12, md: 4 }}>
      <Typography variant="h6" sx={{fontFamily:"Prompt",marginBottom: "1rem", 
        textAlign:"center",
        fontWeight: 600,
        color:"#28378B",
        bgcolor:"rgb(234, 234, 234)",
        borderRadius:"50px",
        }}>
      {formattedDate}
      </Typography>
      <List sx={{ maxHeight: "70vh", overflowY: "auto" }}>
        {stationType === "gate" && gateData.length > 0 ? (
          (() => {
         
            return gateData.map((item, index) => {
              const latest = latestDataMap.get(item.sta_code);
              const discharge = latest?.discharge != null && parseFloat(latest.discharge) !== 0
              ? parseFloat(latest.discharge).toFixed(2)
              : "-";
              const wl_upper = latest?.wl_upper != null && parseFloat(latest.wl_upper) !== 0
              ? parseFloat(latest.wl_upper).toFixed(2)
              : "-";
              const wl_lower = latest?.wl_lower != null && parseFloat(latest.wl_lower) !== 0
              ? parseFloat(latest.wl_lower).toFixed(2)
              : "-";

    
              return (
                <ListItem
                  key={item.sta_code}
                  sx={{
                    padding: "2px",
                    borderRadius:"20px",
                    margin:"2px",
                    background: `linear-gradient(135deg, ${alpha(primary, 0.25)}, ${alpha(primary, 0.05)})`,
                    "&:hover": { backgroundColor: "#e0e0e0", cursor: "pointer" },
                  }}
                  onClick={() => handleListItemClick({...item,discharge,wl_upper,wl_lower}, "gate")}
                >
                  <ListItemAvatar sx={{ marginInline: "10px" }}>
                    <Avatar src={`${Path_URL}images/icons/gate_icon.png`} />
                  </ListItemAvatar>
                  <ListItemText>
                        <Typography sx={{ fontFamily:"Prompt", fontWeight: "bold", color: "text.primary" }}>
                          {`สถานีวัดน้ำท่า${item.sta_name}`}
                        </Typography>
                        <Typography variant="body2" sx={{ fontFamily:"Prompt", color: "text.primary" }}>
                          <span style={{ color: "rgb(46, 58, 108)", fontWeight: "bold", fontSize: "0.9rem" }}>
                          ตำบล{item.tambon} อำเภอ{item.district} จังหวัด{item.province}
                          </span>
                        </Typography>
                        <Typography variant="body2" sx={{ fontFamily:"Prompt", color: "text.primary" }}>
                          <b>รหัสสถานี:</b>{" "}
                          <span style={{ color: "#4caf50", fontWeight: "bold", fontSize: "0.9rem" }}>
                          {item.sta_code}
                          </span>{" "} 
                        </Typography>                     
       
                        <Typography variant="body2" sx={{ fontFamily:"Prompt", color: "text.primary" }}>
                          <b>อัตราการไหล:</b>{" "}
                          <span style={{ color: "#64b5f6", fontWeight: "bold", fontSize: "0.9rem" }}>
                            {discharge}
                          </span>{" "}
                          ลบ.ม./วินาที
                        </Typography>
                        <Typography variant="body2" sx={{ fontFamily:"Prompt", color: "text.primary" }}>
                        <b>ระดับน้ำเหนือ:</b>{" "}
                          <span style={{ color: "#e53935", fontWeight: "bold", fontSize: "0.9rem" }}>
                            {wl_upper}
                          </span>{" "}
                          ม.รทก.
                        </Typography>
                         <Typography variant="body2" sx={{ fontFamily:"Prompt", color: "text.primary" }}>
                        <b>ระดับน้ำท้าย:</b>{" "}
                          <span style={{ color: "#e53935", fontWeight: "bold", fontSize: "0.9rem" }}>
                            {wl_lower}
                          </span>{" "}
                          ม.รทก.
                        </Typography>
                      </ListItemText>
                </ListItem>
              );
            });
          })()
        ) : (
          <Typography variant="body1" color="textSecondary">
            กำลังโหลดข้อมูล...
          </Typography>
        )}
      </List>
      </Grid>
    </Grid>
  );
};

export default GateMap;


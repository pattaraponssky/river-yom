import React, { useEffect, useRef, useState } from "react";
import { API_URL, formatThaiDay, Path_URL } from "@/lib/utility";
import { Avatar, Box, Grid, List, ListItem, ListItemAvatar, ListItemText, Typography } from "@mui/material";
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
interface RainDataItem {
  sta_code: string;
  date: string;
  wl: string | null;
  volume: string | null;
  rain_mm: string | null;
  rainSeries: string | null;
}

const RainMap: React.FC<LongdoMapProps> = ({mapKey, stationType, JsonPaths ,height }) => {
  const mapContainerRef = useRef<HTMLDivElement | null>(null);
  const [JsonDataList, setJsonDataList] = useState<any[]>([]);
  const [isMapReady, setIsMapReady] = useState<boolean>(false);
  const [, setMarkers] = useState<any[]>([]);
  const [rainData, setRainData] = useState<any[]>([]);
  const [rainApiData, setRainApiData] = useState<RainDataItem[]>([]);
  const [latestRainData, setLatestRainData] = useState<RainDataItem[]>([]);
  const todayStr = new Date().toISOString().slice(0, 10); 
  
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
    fetch(`${API_URL}/api/rain_data_last_14_days`)
      .then(res => res.json())
      .then(result => {
        if (result.status === 'success') {
          const rawData: RainDataItem[] = result.data;
  
          // เก็บข้อมูลทั้งหมด
          setRainApiData(rawData);
  
          // สร้าง Map เพื่อเก็บเฉพาะรายการล่าสุดต่อ sta_code
          const latestDataMap = new Map<string, RainDataItem>();
  
          rawData.forEach(item => {
            const existing = latestDataMap.get(item.sta_code);
            if (!existing || new Date(item.date) > new Date(existing.date)) {
              latestDataMap.set(item.sta_code, item);
            }
          });
  
          const latestData = Array.from(latestDataMap.values());
          setLatestRainData(latestData);
        }
      });
  }, []);
  

  useEffect(() => {
    if (isMapReady) {
      const fetchData = async () => {
        console.log("📡 กำลังดึงข้อมูล...");
  
        try {
          let apiUrl = "";
          apiUrl = `${API_URL}/api/rain_info`;
  
          if (!apiUrl) return;
  
          const response = await fetch(apiUrl);
          if (!response.ok) throw new Error("❌ โหลดข้อมูลไม่สำเร็จ");
  
          const result = await response.json();
          console.log(`✅ ดึงข้อมูลจาก ${stationType}:`, result);
  
      
          setRainData(result.data || []);
  
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
      map.zoom(9, true);
      console.log("🌍 แผนที่พร้อมแล้ว กำลังเพิ่ม markers...");    
      console.log("🏞️ rainData:", rainData);
      const addMarkers = async () => {
        try {
          if (rainData.length > 0) await addMarkersFromRainData();
      
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
  }, [isMapReady, rainData]); // รอให้ข้อมูลทั้งหมดพร้อมก่อน
  
  

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

  // ฟังก์ชันเตรียมข้อมูลสำหรับกราฟ
  const prepareChartDataForRain = (rawData: any[], targetStaCode: string) => {
    const filtered = rawData
      .filter(d => d.sta_code === targetStaCode)
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

    const rain_mmSeries = filtered.map(d => ({
      x: new Date(d.date).getTime(),
      y: parseFloat(d.rain_mm),
    }));

    let cumulative = 0;

    const rainSeries = filtered.map(d => {
        const rain = parseFloat(d.rain_mm);
        cumulative += isNaN(rain) ? 0 : rain;
        return {
          x: new Date(d.date).getTime(), // สำหรับแสดงบนกราฟ
          y: parseFloat(cumulative.toFixed(2)),
        };
      });

    return { rain_mmSeries, rainSeries};
  };



  const chartsInstances: Record<string, Record<string, ApexCharts>> = {};

  const renderChartPart = (sta_code: string, type: 'rain_mm' | 'rain_series') => {
    const chartId = `chart-${type}-${sta_code}`;
    const element = document.querySelector(`#${chartId}`) as HTMLElement;
    if (!element) {
      console.warn(`ไม่พบ element ${chartId}`);
      return;
    }
  
    // เตรียมข้อมูล
    const raw = rainApiData.filter((d: any) => d.sta_code === sta_code);
    const chartData = prepareChartDataForRain(raw, sta_code);
    let seriesData = [];
    let title = '';
    let color = '';
    let types = ''; // กำหนดค่าเริ่มต้นเป็น 'line'
    switch (type) {
        case 'rain_mm':
            seriesData = chartData.rain_mmSeries;
            title = 'ปริมาณน้ำฝน (มม.)';
            color = '#1e88e5';
            types = 'bar';
          break;
        case 'rain_series':
            seriesData = chartData.rainSeries;
            title = 'ปริมาณน้ำฝนสะสม (มม.)';
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
    ['rain_mm', 'rainSeries'].forEach(t => {
      const el = document.querySelector(`#chart-${t}-${sta_code}`) as HTMLElement;
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
        offsetY: -20,
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
  }, [rainApiData]);
  

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
      geoJsonData.features.forEach((feature: any) => {
        const { MBASIN_T, AREA_SQKM } = feature.properties;
        const coordinates = feature.geometry.coordinates[0];

        const marker = new longdo.Marker(
          { lat: coordinates[1], lon: coordinates[0] },
          {
            title: `พื้นที่: ${MBASIN_T}`,
            detail: `<b>ขนาดพื้นที่:</b> ${AREA_SQKM} ตร.กม.`,
          }
        );

        map.Overlays.add(marker);
        marker.onclick = () => {
          console.log(`แสดงข้อมูล Marker: ${MBASIN_T}`);
          marker.popup(`<b>พื้นที่:</b> ${MBASIN_T} <br> <b>ขนาดพื้นที่:</b> ${AREA_SQKM} ตร.กม.`);
        };
      });
    });

    console.log("✅ เพิ่ม Marker จาก TopoJSON เรียบร้อย");
  };

  const latestDataMap =
            Array.isArray(latestRainData) && latestRainData.length > 0
              ? new Map(latestRainData.map((d) => [d.sta_code, d]))
              : new Map();

  const addMarkersFromRainData = () => {
    if (!map) return;

    let newMarkers: any[] = [];

    rainData.forEach((data) => {
      const { lat, long, name, district, province, sta_code } = data;
      const position = { lat: parseFloat(lat), lon: parseFloat(long) };
      const latest = latestDataMap.get(sta_code);

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
                onclick="window.renderChartPart('${sta_code}', 'rain_mm')" 
                style="background-color: #1e88e5; color: white; padding: 4px 10px; border: none; border-radius: 6px; font-size: 0.9rem; cursor: pointer; transition: background-color 0.2s;">
                📈 ปริมาณน้ำฝน
              </button>

              <button 
                onclick="window.renderChartPart('${sta_code}', 'rain_series')" 
                style="background-color: #e53935; color: white; padding: 4px 10px; border: none; border-radius: 6px; font-size: 0.9rem; cursor: pointer; transition: background-color 0.2s;">
                📉 ปริมาณน้ำฝนสะสม
              </button>

              <a href="/rain?tab=0&station=${sta_code}" 
                style="padding: 4px 10px;  background-color: #1976d2; color: white; border-radius: 6px; text-decoration: none; font-size: 0.9rem; display: inline-block; margin-top: 8px; cursor: pointer; transition: background-color 0.2s;">
                 ข้อมูลเพิ่มเติม
              </a>
            </div>
            <!-- Container ของกราฟ -->
            <br>
            <div id="chart-rain_mm-${sta_code}" style="display:none;"></div>
            <div id="chart-rain_series-${sta_code}" style="display:none;"></div>
          `,
          icon: {
            html: `<div style="text-align:center;">
              <img src="${Path_URL}images/icons/${parseFloat(data.rain_mm) > 0 ? 'rain_station_icon.png' : 'sun_station_icon.png'}" style="width:24px; height:24px;" />
              <div style="background-color: rgba(255, 255, 255, 0.4); padding:2px; border-radius:5px; font-size: 12px; margin-top: 2px;width:80px;">
                ${data.sta_code}
              </div>
            </div>`
          },
          size: { width: 450, height: 'auto' },
        });
        
        map.Overlays.add(marker);
        newMarkers.push(marker);     
      }
    });

    setMarkers(newMarkers);
    console.log("✅ เพิ่ม markers จาก Rain data");
  };

  const handleListItemClick = (item: any,type: "rain" ) => {
    console.log("Markers: ", item); // ตรวจสอบข้อมูลที่ส่งเข้ามา
  
    const { lat, long } = item;
    const position = { lat: parseFloat(lat), lon: parseFloat(long) };
    if (!position.lat || !position.lon) return;
  
    let title = "";
    let detail = "";
    let icon = "";
  
      title = `<img src="${Path_URL}images/icons/rain_station_icon.png" style="width:25px; height:25px; vertical-align:middle; margin-right:5px" />
        <span style="font-size:1.1rem; font-weight:bold; vertical-align:middle;">${item.name} อ.${item.district} จ.${item.province}</span>`;
  
      detail = `
            <div style="font-size: 1rem;">
                <b>ข้อมูลประจำวันที่ ${formatThaiDay(todayStr)}</b>
            </div>
                <div style="font-size: 0.9rem; line-height: 1.4rem;">
              <div><b>รหัสสถานี:</b> <span style="color: #4caf50; font-weight: bold;"> ${item.sta_code || "-"}</span></div>
           </div>
              <div style="font-size: 0.9rem; line-height: 1.4rem;">
              <div><b>📉 ปริมาณน้ำฝน:</b> <span style="color: #1e88e5; font-weight: bold;">${item.rain_mm || "-"} มม.</span></div>
           </div>
            <div style="margin-top: 10px; gap: 5px;">
              <button 
                onclick="window.renderChartPart('${item.sta_code}', 'rain_mm')" 
                style="background-color: #1e88e5; color: white; padding: 4px 10px; border: none; border-radius: 6px; font-size: 0.9rem; cursor: pointer; transition: background-color 0.2s;">
                📉 ปริมาณน้ำฝน
              </button>

              <button 
                onclick="window.renderChartPart('${item.sta_code}', 'rain_series')" 
                style="background-color: #e53935; color: white; padding: 4px 10px; border: none; border-radius: 6px; font-size: 0.9rem; cursor: pointer; transition: background-color 0.2s;">
                📈 ปริมาณน้ำฝนสะสม
              </button>

              <a href="/rain?tab=0&station=${item.sta_code}" 
                style="padding: 4px 10px;  background-color: #1976d2; color: white; border-radius: 6px; text-decoration: none; font-size: 0.9rem; display: inline-block; margin-top: 8px; cursor: pointer; transition: background-color 0.2s;">
                 ข้อมูลเพิ่มเติม
              </a>
            </div>
            <!-- Container ของกราฟ -->
            <br>
            <div id="chart-rain_mm-${item.sta_code}" style="display:none;"></div>
            <div id="chart-rain_series-${item.sta_code}" style="display:none;"></div>
      `;
      icon = `${Path_URL}images/icons/${parseFloat(item.rain_mm) > 0 ? 'rain_station_icon.png' : 'sun_station_icon.png'}`;
      
    const marker = new longdo.Popup(position, {
      title,
      detail: `${detail}`,
      icon: {
        html: `<div style="text-align:center;">
          <img src="${icon}" style="width:24px; height:24px;" />
          <div style="background-color: rgba(255, 255, 255, 0.4); padding:2px; border-radius:5px; font-size: 12px; margin-top: 2px;width:80px;">
          ${type === "rain" ? `${item.sta_code}` : item.name}</div></div>`
      },
      size: { width: 450, height: 'auto' },
      
    });

    // เพิ่ม Marker ไปยังแผนที่
    map.Overlays.add(marker);
  
  };
  
  
  const FontStyle = {
    fontFamily: "Prompt",

  }

  return (
    <Grid container spacing={2}>
      <Grid size={{xs:12, sm:12, md:8}}>
        <Box 
          ref={mapContainerRef}
          style={{ width: "100%", height: height || "600px" }}>
        </Box>
      </Grid>
      <Grid size={{xs:12, sm:12, md:4}}>
      <Typography variant="h6" sx={{...FontStyle,marginBottom: "1rem", 
        textAlign:"center",
        fontWeight: 600,
        color:"#28378B",
        bgcolor:"rgb(234, 234, 234)",
        borderRadius:"50px",
        }}>
      {formattedDate}
      </Typography>
      <List sx={{ maxHeight: "70vh", overflowY: "auto" }}>
        {stationType === "rain" && rainData.length > 0 ? (
          (() => {
      
            return rainData.map((item, index) => {
              const latest = latestDataMap.get(item.sta_code);
              const rain_mm = latest?.rain_mm != null ? parseFloat(latest.rain_mm).toFixed(2) : "-";
    
              return (
                 <ListItem
                  key={item.sta_code}
                  sx={{
                    padding: "2px",
                    borderRadius:"20px",
                    margin:"2px",
                    backgroundColor: index % 2 === 0 ? "rgb(250, 250, 250)" : "rgb(240, 240, 240)",
                    "&:hover": { backgroundColor: "#e0e0e0", cursor: "pointer" },
                  }}
                  onClick={() => handleListItemClick({...item,rain_mm}, "rain")}
                > 
                  <ListItemAvatar sx={{ marginInline: "10px" }}>
                    <Avatar src={`${Path_URL}images/icons/${parseFloat(rain_mm) > 0 ? 'rain_station_icon.png' : 'sun_station_icon.png'}`} />
                  </ListItemAvatar>
                  <ListItemText
                    secondary={
                      <>
                        <Typography sx={{ ...FontStyle, fontWeight: "bold", color: "#333" }}>
                          {`สถานี${item.name}`}
                        </Typography>
                  

                        <Typography variant="body2" sx={{ ...FontStyle, color: "text.primary" }}>
                          <span style={{ color: "rgb(46, 58, 108)", fontWeight: "bold", fontSize: "0.9rem" }}>
                          ตำบล{item.tambon} อำเภอ{item.district} จังหวัด{item.province}
                          </span>
                        </Typography>
                        <Typography variant="body2" sx={{ ...FontStyle, color: "text.primary" }}>
                          <b>รหัสสถานี:</b>{" "}
                          <span style={{ color: "#4caf50", fontWeight: "bold", fontSize: "0.9rem" }}>
                          {item.sta_code}
                          </span>{" "} 
                        </Typography>

                        <Typography variant="body2" sx={{ ...FontStyle, color: "text.primary" }}>
                          <b>หน่วยงาน:</b>{" "}
                          <span style={{ color: "#e53935", fontWeight: "bold", fontSize: "0.9rem" }}>
                          {item.owner}
                          </span>{" "}
                        </Typography>
       
       
                        <Typography variant="body2" sx={{ ...FontStyle, color: "text.primary" }}>
                          <b>ปริมาณน้ำฝน:</b>{" "}
                          <span style={{ color: "#64b5f6", fontWeight: "bold", fontSize: "0.9rem" }}>
                            {rain_mm}
                          </span>{" "}
                          มม.
                        </Typography>
                      </>
                    }
                  />
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

export default RainMap;


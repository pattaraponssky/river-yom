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
  interface ReservoirDataItem {
  res_code: string;
  date: string;
  wl: string | null;
  volume: string | null;
  inflow: string | null;
  outflow: string | null;
  }

  const ReservoirMap: React.FC<LongdoMapProps> = ({mapKey, stationType, JsonPaths ,height }) => {
  const mapContainerRef = useRef<HTMLDivElement | null>(null);
  const [JsonDataList, setJsonDataList] = useState<any[]>([]);
  const [isMapReady, setIsMapReady] = useState<boolean>(false);
  const [, setMarkers] = useState<any[]>([]);
  const [reservoirData, setReservoirData] = useState<any[]>([]);
  const [reservoirApiData, setReservoirApiData] = useState<ReservoirDataItem[]>([]);
  const [latestReservoirData, setLatestReservoirData] = useState<ReservoirDataItem[]>([]);
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
    fetch(`${API_URL}/api/reservoir_data_last_14_days`)
      .then(res => res.json())
      .then(result => {
        if (result.status === 'success') {
          const rawData: ReservoirDataItem[] = result.data;

          // เก็บข้อมูลทั้งหมด
          setReservoirApiData(rawData);

          // สร้าง Map เพื่อเก็บเฉพาะรายการล่าสุดต่อ res_code
          const latestDataMap = new Map<string, ReservoirDataItem>();

          rawData.forEach(item => {
            const existing = latestDataMap.get(item.res_code);
            if (!existing || new Date(item.date) > new Date(existing.date)) {
              latestDataMap.set(item.res_code, item);
            }
          });

          const latestData = Array.from(latestDataMap.values());
          setLatestReservoirData(latestData);
        }
      });
  }, []);


  useEffect(() => {
    if (isMapReady) {
      const fetchData = async () => {
        console.log("📡 กำลังดึงข้อมูล...");

        try {
          let apiUrl = "";
          apiUrl = `${API_URL}/api/reservoir_info`;

          if (!apiUrl) return;

          const response = await fetch(apiUrl);
          if (!response.ok) throw new Error("❌ โหลดข้อมูลไม่สำเร็จ");

          const result = await response.json();
          console.log(`✅ ดึงข้อมูลจาก ${stationType}:`, result);

      
          setReservoirData(result.data || []);

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
      console.log("🏞️ reservoirData:", reservoirData);
      const addMarkers = async () => {
        try {
          if (reservoirData.length > 0) await addMarkersFromReservoirData();
      
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
  }, [isMapReady, reservoirData]); // รอให้ข้อมูลทั้งหมดพร้อมก่อน

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
  const prepareChartDataForReservoir = (rawData: any[], targetResCode: string) => {
    const filtered = rawData
      .filter(d => d.res_code === targetResCode)
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

    const inflowSeries = filtered.map(d => ({
      x: new Date(d.date).getTime(),
      y: parseFloat(d.inflow),
    }));

    const outflowSeries = filtered.map(d => ({
      x: new Date(d.date).getTime(),
      y: parseFloat(d.outflow),
    }));

    const volumeSeries = filtered.map(d => ({
      x: new Date(d.date).getTime(),
      y: parseFloat(d.volume),
    }));

    return { inflowSeries, outflowSeries, volumeSeries };
  };



  const chartsInstances: Record<string, Record<string, ApexCharts>> = {};

  const renderChartPart = (res_code: string, type: 'inflow' | 'outflow' | 'volume') => {
    const chartId = `chart-${type}-${res_code}`;
    const element = document.querySelector(`#${chartId}`) as HTMLElement;
    if (!element) {
      console.warn(`ไม่พบ element ${chartId}`);
      return;
    }

    // เตรียมข้อมูล
    const raw = reservoirApiData.filter((d: any) => d.res_code === res_code);
    const chartData = prepareChartDataForReservoir(raw, res_code);
    let seriesData = [];
    let title = '';
    let color = '';
    let types = ''; 
    switch (type) {
      case 'inflow':
        seriesData = chartData.inflowSeries;
        title = 'ปริมาณน้ำไหลเข้าอ่างฯ (ล้าน ลบ.ม.)';
        color = '#1e88e5';
        types = 'line'; // ✅ แก้ไข type ให้ตรงกับกราฟ
        break;
      case 'outflow':
        seriesData = chartData.outflowSeries;
        title = 'ปริมาณน้ำระบายออกอ่างฯ (ล้าน ลบ.ม.)';
        color = '#e53935';
        types = 'line'; 
        break;
      case 'volume':
        seriesData = chartData.volumeSeries;
        title = 'ปริมาณน้ำในอ่างฯ (ล้าน ลบ.ม.)';
        color = '#43a047';
        types = 'line'; 
        break;
    }

    // ✅ ลบกราฟทั้งหมดก่อนสร้างใหม่
    if (chartsInstances[res_code]) {
      Object.values(chartsInstances[res_code]).forEach(chart => chart.destroy());
    }
    chartsInstances[res_code] = {}; // ✅ เคลียร์ object

    // ✅ ซ่อนทุก div
    ['inflow', 'outflow', 'volume'].forEach(t => {
      const el = document.querySelector(`#chart-${t}-${res_code}`) as HTMLElement;
      if (el) el.style.display = 'none';
    });

    // ✅ แสดง div ของกราฟที่ต้องการ
    element.style.display = 'block';

    // ✅ สร้างกราฟใหม่
    const chart = new ApexCharts(element, {
      chart: { type: types, height: 215 ,toolbar: { show: false },zoom:{enabled:false ,allowMouseWheelZoom: false,  },},
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
          formatter: (val: number) => `${Math.abs(val).toFixed(2).toLocaleString()} ล้าน ลบ.ม.`,
        },
      },
    });

    chart.render();
    chartsInstances[res_code][type] = chart;
  };

  useEffect(() => {
    (window as any).renderChartPart = renderChartPart;
  }, [reservoirApiData]);


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
  Array.isArray(latestReservoirData) && latestReservoirData.length > 0
    ? new Map(latestReservoirData.map((d) => [d.res_code, d]))
    : new Map();

  const addMarkersFromReservoirData = () => {
    if (!map) return;

    let newMarkers: any[] = [];
    reservoirData.forEach((data) => {
      const { lat, long, res_name, district, province, res_code } = data;
      const position = { lat: parseFloat(lat), lon: parseFloat(long) };

      const latest = latestDataMap.get(res_code);

      const latestDateStr = latest?.date ? new Date(latest.date).toISOString().slice(0, 10) : null;
      const isToday = latestDateStr === todayStr;
      

      const volume = isToday && latest?.volume != null && parseFloat(latest.volume) !== 0
      ? parseFloat(latest.volume).toFixed(2)
      : "-";

      const inflow = isToday && latest?.inflow != null && parseFloat(latest.inflow) !== 0
      ? parseFloat(latest.inflow).toFixed(2)
      : "-";

      const outflow = isToday && latest?.outflow != null && parseFloat(latest.outflow) !== 0
      ? parseFloat(latest.outflow).toFixed(2)
      : "-";
    
      if (position.lat && position.lon) {
         const marker = new longdo.Marker(position, {
          title: `<img src="${Path_URL}images/icons/reservoir_icon.png" style="width:25px; height:2res_name5px; vertical-align:middle; margin-right:5px" /> 
            <span style="font-size:1.1rem; font-weight:bold; vertical-align:middle;">อ่างเก็บน้ำ${res_name} อ.${district} จ.${province}</span>`,
          detail: `
            <div style="font-size: 1rem;">
                <b>ข้อมูลประจำวันที่ ${formatThaiDay(todayStr)}</b>
            </div>
            </span>
              <div style="font-size: 0.9rem; line-height: 1.4rem;">
                <div><b>🏞️ ปริมาณน้ำ:</b> <span style="color: #43a047; font-weight: bold;">${volume || "-"} ล้าน ลบ.ม.</span></div>
                <div><b>📉 ปริมาณน้ำไหลเข้า:</b> <span style="color: #1e88e5; font-weight: bold;">${inflow || "-"} ล้าน ลบ.ม.</span></div>
                <div><b>📈 ปริมาณน้ำระบาย:</b> <span style="color: #e53935; font-weight: bold;">${outflow || "-"} ล้าน ลบ.ม.</span></div>
              </div>
          <div style="margin-top: 10px; gap: 5px;">
              <button 
                onclick="window.renderChartPart('${res_code}', 'volume')"
                style="background-color: #43a047; color: white; padding: 4px 10px; border: none; border-radius: 6px; font-size: 0.9rem; cursor: pointer; transition: background-color 0.2s;">
                🏞️ ปริมาณน้ำ
              </button>

              <button 
                onclick="window.renderChartPart('${res_code}', 'inflow')" 
                style="background-color: #1e88e5; color: white; padding: 4px 10px; border: none; border-radius: 6px; font-size: 0.9rem; cursor: pointer; transition: background-color 0.2s;">
                📉 น้ำไหลเข้า
              </button>

              <button 
                onclick="window.renderChartPart('${res_code}', 'outflow')" 
                style="background-color: #e53935; color: white; padding: 4px 10px; border: none; border-radius: 6px; font-size: 0.9rem; cursor: pointer; transition: background-color 0.2s;">
                📈 น้ำระบาย
              </button>

              <a href="/reservoir?tab=0&station=${res_code}" 
                style="padding: 4px 10px;  background-color: #1976d2; color: white; border-radius: 6px; text-decoration: none; font-size: 0.9rem; display: inline-block; margin-top: 8px; cursor: pointer; transition: background-color 0.2s;">
                ข้อมูลเพิ่มเติม
              </a>
            </div>
            <!-- Container ของกราฟ -->
            <br>
            <div id="chart-inflow-${res_code}" style="display:none;"></div>
            <div id="chart-outflow-${res_code}" style="display:none;"></div>
            <div id="chart-volume-${res_code}" style="display:none;"></div>
          `,
          icon: {
            html: `<div style="text-align:center;">
              <img src="${Path_URL}images/icons/reservoir_icon.png" style="width:24px; height:24px;" />
              <div style="background-color: rgba(255, 255, 255, 0.4); padding:2px; border-radius:5px; font-size: 12px; margin-top: 2px;width:80px;">
                อ่าง${res_name}
              </div>
            </div>`
          }
          ,            
          size: { width: 450},
        });
        
        map.Overlays.add(marker);
        newMarkers.push(marker);     
      }
    });

    setMarkers(newMarkers);
    console.log("✅ เพิ่ม markers จาก Reservoir data");
  };

  const handleListItemClick = (item: any,type: "reservoir") => {
    console.log("Markers: ", item); // ตรวจสอบข้อมูลที่ส่งเข้ามา

    const { lat, long } = item;
    const position = { lat: parseFloat(lat), lon: parseFloat(long) };
    if (!position.lat || !position.lon) return;

    let title = "";
    let detail = "";
    let icon = "";

      title = `<img src="${Path_URL}images/icons/reservoir_icon.png" style="width:25px; height:25px; vertical-align:middle; margin-right:5px" />
        <span style="font-size:1.1rem; font-weight:bold; vertical-align:middle;">อ่างเก็บน้ำ ${item.res_name} อ.${item.district} จ.${item.province}</span>`;

      detail = `
          <div style="font-size: 1rem;">
            <b>
            ข้อมูลประจำวันที่
            ${latestDataMap.get(item.res_code)?.date ? new Date(latestDataMap.get(item.res_code)?.date).toLocaleDateString("th-TH", {
              year: "numeric",
              month: "long",
              day: "numeric",
            }) : "-"}
            <b>  
          </div>
          </span>
            <div style="font-size: 0.9rem; line-height: 1.4rem;">
              <div><b>🏞️ ปริมาณน้ำ:</b> <span style="color: #43a047; font-weight: bold;">${item.volume || "-"} ล้าน ลบ.ม.</span></div>
              <div><b>📉 ปริมาณน้ำไหลเข้า:</b> <span style="color: #1e88e5; font-weight: bold;">${item.inflow || "-"} ล้าน ลบ.ม.</span></div>
              <div><b>📈 ปริมาณน้ำระบาย:</b> <span style="color: #e53935; font-weight: bold;">${item.outflow || "-"} ล้าน ลบ.ม.</span></div>
          </div>
        <div style="margin-top: 10px; gap: 5px;">
          <button 
            onclick="window.renderChartPart('${item.res_code}', 'volume')" 
            style="background-color: #43a047; color: white; padding: 4px 10px; border: none; border-radius: 6px; font-size: 0.9rem; cursor: pointer; transition: background-color 0.2s;">
            🏞️ ปริมาณน้ำ
          </button>

          <button 
            onclick="window.renderChartPart('${item.res_code}', 'inflow')" 
            style="background-color: #1e88e5; color: white; padding: 4px 10px; border: none; border-radius: 6px; font-size: 0.9rem; cursor: pointer; transition: background-color 0.2s;">
            📉 น้ำไหลเข้า
          </button>

          <button 
            onclick="window.renderChartPart('${item.res_code}', 'outflow')" 
            style="background-color: #e53935; color: white; padding: 4px 10px; border: none; border-radius: 6px; font-size: 0.9rem; cursor: pointer; transition: background-color 0.2s;">
            📈 น้ำระบาย
          </button>

          <a href="/reservoir?tab=0&station=${item.res_code}" 
            style="padding: 4px 10px;  background-color: #1976d2; color: white; border-radius: 6px; text-decoration: none; font-size: 0.9rem; display: inline-block; margin-top: 8px; cursor: pointer; transition: background-color 0.2s;">
             ข้อมูลเพิ่มเติม
          </a>
        </div>
        <!-- Container ของกราฟ -->
        <br>
        <div id="chart-inflow-${item.res_code}" style="display:none;"></div>
        <div id="chart-outflow-${item.res_code}" style="display:none;"></div>
        <div id="chart-volume-${item.res_code}" style="display:none;"></div>
      `;
      icon = `${Path_URL}images/icons/reservoir_icon.png`;
      
    const marker = new longdo.Popup(position, {
      title,
      detail: `${detail}`,
      icon: {
        html: `<div style="text-align:center;">
          <img src="${icon}" style="width:24px; height:24px;" />
           <div style="background-color: rgba(255, 255, 255, 0.4); padding:2px; border-radius:5px; font-size: 12px; margin-top: 2px;width:80px;">
          ${type === "reservoir" ? `อ่าง${item.res_name}` : item.sta_code}</div></div>`
      },
      size: { width: 450, height: 'auto' },
      
    });

    // เพิ่ม Marker ไปยังแผนที่
    map.Overlays.add(marker);

  };

  return (
    <Grid container spacing={2}>
      <Grid size={{xs:12, sm:12, md:8}}>
        <Box 
          ref={mapContainerRef}
          style={{ width: "100%", height: height || "600px" }}>
        </Box>
      </Grid>
      <Grid size={{xs:12, sm:12, md:4}}>
      <Typography variant="h6" sx={{fontFamily:"Prompt" ,marginBottom: "1rem", 
        textAlign:"center",
        fontWeight: 600,
        color:"#28378B",
        bgcolor:"rgb(234, 234, 234)",
        borderRadius:"50px",
        }}>
      {formattedDate}
      </Typography>
      <List sx={{ maxHeight: "70vh", overflowY: "auto" }}>
        {stationType === "reservoir" && reservoirData.length > 0 ? (
          (() => {
            return reservoirData.map((item, index) => {
              const latest = latestDataMap.get(item.res_code);
              const volume = latest?.volume != null ? parseFloat(latest.volume).toFixed(2) : "-";
              const inflow = latest?.inflow != null ? parseFloat(latest.inflow).toFixed(2) : "-";
              const outflow = latest?.outflow != null ? parseFloat(latest.outflow).toFixed(2) : "-";
                
              return (
                <ListItem
                  key={item.res_code}
                  sx={{
                    padding: "2px",
                    borderRadius:"20px",
                    margin:"2px",
                    backgroundColor: index % 2 === 0 ? "rgb(250, 250, 250)" : "rgb(240, 240, 240)",
                    "&:hover": { backgroundColor: "#e0e0e0", cursor: "pointer" },
                  }}
                  onClick={() =>
                    handleListItemClick(
                      {
                        ...item,
                        volume,   // ใส่ค่าที่คำนวณไว้
                        inflow,
                        outflow,
                      },
                      "reservoir"
                    )
                  }
                >
                  <ListItemAvatar sx={{ marginInline: "10px" }}>
                    <Avatar src={`${Path_URL}images/icons/reservoir_icon.png`} />
                  </ListItemAvatar>
                  <ListItemText>
                   
                        <Typography sx={{ fontFamily:"Prompt" , fontWeight: "bold", color: "#333" }}>
                          {`อ่างเก็บน้ำ${item.res_name}`}
                        </Typography>
                
                        <Typography variant="body2" sx={{ fontFamily:"Prompt" , color: "text.primary" }}>
                          <span style={{ color: "rgb(46, 58, 108)", fontWeight: "bold", fontSize: "0.9rem" }}>
                          ตำบล{item.tambon} อำเภอ{item.district} จังหวัด{item.province}
                          </span>
                        </Typography>
                        <Typography variant="body2" sx={{ fontFamily:"Prompt" , color: "text.primary" }}>
                          <b>ปริมาณน้ำ:</b>{" "}
                          <span style={{ color: "#43a047", fontWeight: "bold", fontSize: "0.9rem" }}>
                            {volume}
                          </span>{" "}
                          ล้าน ลบ.ม.
                        </Typography>

                        <Typography variant="body2" sx={{ fontFamily:"Prompt" , color: "text.primary" }}>
                          <b>ปริมาณน้ำเข้าอ่างฯ:</b>{" "}
                          <span style={{ color: "#64b5f6", fontWeight: "bold", fontSize: "0.9rem" }}>
                            {inflow}
                          </span>{" "}
                          ล้าน ลบ.ม.
                          {"  "}
                        </Typography>
                        <Typography variant="body2" sx={{ fontFamily:"Prompt" , color: "text.primary" }}>
                          <b>ปริมาณน้ำระบาย:</b>{" "}
                          <span style={{ color: "#e53935", fontWeight: "bold", fontSize: "0.9rem" }}>
                            {outflow}
                          </span>{" "}
                          ล้าน ลบ.ม.
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

  export default ReservoirMap;


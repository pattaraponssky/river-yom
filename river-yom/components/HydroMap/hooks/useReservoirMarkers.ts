import { useEffect, useRef } from 'react';
import { Path_URL } from '@/lib/utility';
import { formatThaiDay } from '@/lib/utility';
import { ReservoirInfo, ReservoirDataItem } from '../hydro';   // ← เปลี่ยน type ให้ตรง

// ฟังก์ชันช่วยสร้าง marker สำหรับอ่างเก็บน้ำ (Reservoir)
const addReservoirMarkers = (
  map: any,
  reservoirInfo: ReservoirInfo[],
  latestReservoirData: ReservoirDataItem[],
  markersRef: React.MutableRefObject<any[]>
) => {
  if (!map || !reservoirInfo?.length) return;

  const todayStr = new Date().toISOString().slice(0, 10);
  const latestMap = new Map<string, ReservoirDataItem>(
    latestReservoirData.map((item) => [item.res_code, item])
  );

  reservoirInfo.forEach((station) => {
    const { res_code, res_name, district, province, lat, long } = station;
    const position = { lat: parseFloat(lat), lon: parseFloat(long) };

    if (isNaN(position.lat) || isNaN(position.lon)) return;

    const latest = latestMap.get(res_code);
    let isToday = false;
    if (latest?.datetime) {
      const parsedDate = new Date(latest.datetime);
      if (!isNaN(parsedDate.getTime())) {
        isToday = parsedDate.toISOString().slice(0, 10) === todayStr;
      }
    }

    // ค่า Volume, Inflow, Outflow
    const volume = isToday && latest?.volume != null 
      ? parseFloat(latest.volume).toLocaleString() 
      : '-';

    const inflow = isToday && latest?.inflow != null && parseFloat(latest.inflow) !== 0
      ? parseFloat(latest.inflow).toFixed(2)
      : '-';

    const outflow = isToday && latest?.outflow != null && parseFloat(latest.outflow) !== 0
      ? parseFloat(latest.outflow).toFixed(2)
      : '-';


    const marker = new window.longdo.Marker(position, {
      title: `<img src="${Path_URL}/images/icons/reservoir_icon.png" style="width:25px;height:25px;vertical-align:middle;margin-right:5px" /> 
              <span style="font-size:1.1rem;font-weight:bold;vertical-align:middle;">${res_code} - ${res_name}  อ.${district} จ.${province}</span>`,

      detail: `
        <div style="font-size:1rem;">
          <b>ข้อมูลประจำวันที่ ${formatThaiDay(todayStr)}</b>
        </div>
        <div style="font-size:0.9rem;line-height:1.4rem;">
          <div><b>รหัสสถานี:</b> <span style="color:#4caf50;font-weight:bold;">${res_code || '-'}</span></div>
          <div><b>📊 ปริมาณน้ำในอ่าง:</b> <span style="color:#4caf50;font-weight:bold;">${volume} ล้าน ลบ.ม.</span></div>
          <div><b>📉  น้ำไหลเข้า:</b> <span style="color:#1e88e5;font-weight:bold;">${inflow} ลบ.ม./วินาที</span></div>
          <div><b>📈  น้ำไหลออก:</b> <span style="color:#e53935;font-weight:bold;">${outflow} ลบ.ม./วินาที</span></div>
        </div>

        <button onclick="window.renderChart('${res_code}', 'volume')"
                style="background:#4caf50;color:white;padding:4px 10px;border:none;border-radius:6px;font-size:0.9rem;cursor:pointer;margin:4px 2px;">
          📊 ปริมาณน้ำในอ่าง
        </button>

        <button onclick="window.renderChart('${res_code}', 'inflow')"
                style="background:#1e88e5;color:white;padding:4px 10px;border:none;border-radius:6px;font-size:0.9rem;cursor:pointer;margin:4px 2px;">
          📉  น้ำไหลเข้า
        </button>

        <button onclick="window.renderChart('${res_code}', 'outflow')"
                style="background:#e53935;color:white;padding:4px 10px;border:none;border-radius:6px;font-size:0.9rem;cursor:pointer;margin:4px 2px;">
          📈  น้ำไหลออก
        </button>
     
        <br/>
        <div id="chart-volume-${res_code}" style="display:none; width:100%; height:220px;"></div>
        <div id="chart-inflow-${res_code}" style="display:none; width:100%; height:220px;"></div>
        <div id="chart-outflow-${res_code}" style="display:none; width:100%; height:220px;"></div>
      `,

      icon: {
        html: `
          <div style="text-align:center;">
            <img src="${Path_URL}/images/icons/reservoir_icon.png" style="width:24px;height:24px;display:block;margin:0 auto;" />
            <div style="background:rgba(255,255,255,0.4);padding:2px;border-radius:5px;font-size:12px;margin-top:2px;width:80px;">
              ${res_code}
            </div>
          </div>
        `,
      },

      size: { width: 480, height: 'auto' },
    });

    map.Overlays.add(marker);
    markersRef.current.push(marker);
  });

  console.log(`เพิ่ม Reservoir markers จำนวน ${markersRef.current.length} ตัว`);
};

// ลบ marker ทั้งหมด (ใช้ร่วมกับ flow ได้)
const removeMarkers = (map: any, markersRef: React.MutableRefObject<any[]>) => {
  if (!map) return;
  markersRef.current.forEach((marker) => {
    map.Overlays.remove(marker);
  });
  markersRef.current = [];
};

export const useReservoirMarkers = (
  map: any,
  reservoirInfo: ReservoirInfo[],
  latestReservoirData: ReservoirDataItem[],
  visible: boolean
) => {
  const markersRef = useRef<any[]>([]);

  useEffect(() => {
    if (!map) return;

    // ลบ marker เก่าทั้งหมดก่อน
    removeMarkers(map, markersRef);

    if (visible) {
      addReservoirMarkers(map, reservoirInfo, latestReservoirData, markersRef);
    }

    // cleanup
    return () => {
      removeMarkers(map, markersRef);
    };
  }, [map, reservoirInfo, latestReservoirData, visible]);

  return markersRef;
};
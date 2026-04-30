import { useEffect, useRef } from 'react';
import { Path_URL } from '@/lib/utility';
import { formatThaiDay } from '@/lib/utility';
import { StationInfo, TeleDataItem } from '../hydro';


// ฟังก์ชันช่วยสร้าง marker สำหรับสถานีน้ำท่า (tele)
const addTeleMarkers = (
  map: any,
  teleInfo: StationInfo[],
  latestTeleData: TeleDataItem[],
  markersRef: React.MutableRefObject<any[]>
) => {
  if (!map || !teleInfo?.length) return;

  const todayStr = new Date().toISOString().slice(0, 10);
  const latestMap = new Map<string, TeleDataItem>(
    latestTeleData.map((item) => [item.sta_code, item])
  );

  teleInfo.forEach((station) => {
    const { sta_code, sta_name, district, province, lat, long } = station;
    const position = { lat: parseFloat(lat), lon: parseFloat(long) };

    if (isNaN(position.lat) || isNaN(position.lon)) return;

    const latest = latestMap.get(sta_code);
    const isToday = latest && new Date(latest.date).toISOString().slice(0, 10) === todayStr;

    const discharge = isToday && latest?.discharge != null && parseFloat(latest.discharge) !== 0
      ? parseFloat(latest.discharge).toFixed(2)
      : '-';

    const wl = isToday && latest?.wl != null && parseFloat(latest.wl) !== 0
      ? parseFloat(latest.wl).toFixed(2)
      : '-';

    const rain_mm = isToday && latest?.rain_mm != null && parseFloat(latest.rain_mm) !== 0
      ? parseFloat(latest.rain_mm).toFixed(2)
      : '-';

    const safeStaCode = sta_code.replace(/\./g, '_');

    const marker = new window.longdo.Marker(position, {
      title: `<img src="${Path_URL}images/icons/tele_station_icon.png" style="width:25px;height:25px;vertical-align:middle;margin-right:5px" /> 
              <span style="font-size:1.1rem;font-weight:bold;vertical-align:middle;">${sta_code} - ${sta_name}  อ.${district} จ.${province}</span>`,

      detail: `
        <div style="font-size:1rem;">
          <b>ข้อมูลประจำวันที่ ${formatThaiDay(todayStr)}</b>
        </div>
        <div style="font-size:0.9rem;line-height:1.4rem;">
          <div><b>รหัสสถานี:</b> <span style="color:#4caf50;font-weight:bold;">${sta_code || '-'}</span></div>
          <div><b>📉 อัตราการไหล:</b> <span style="color:#1e88e5;font-weight:bold;">${discharge} ลบ.ม./วินาที</span></div>
          <div><b>📈 ระดับน้ำ:</b> <span style="color:#e53935;font-weight:bold;">${wl} ม.รทก.</span></div>
          <div><b>🌧️ ปริมาณน้ำฝน:</b> <span style="color:#1e88e5;font-weight:bold;">${rain_mm} มม.</span></div>
        </div>

        <button onclick="window.renderChart('${sta_code}', 'discharge')"
                style="background:#1e88e5;color:white;padding:4px 10px;border:none;border-radius:6px;font-size:0.9rem;cursor:pointer;margin:4px 2px;">
          📉 อัตราการไหล
        </button>

        <button onclick="window.renderChart('${sta_code}', 'wl')"
                style="background:#e53935;color:white;padding:4px 10px;border:none;border-radius:6px;font-size:0.9rem;cursor:pointer;margin:4px 2px;">
          📈 ระดับน้ำ
        </button>

         <button onclick="window.renderChart('${sta_code}', 'rain_mm')"
                style="background:#1e88e5;color:white;padding:4px 10px;border:none;border-radius:6px;font-size:0.9rem;cursor:pointer;margin:4px 2px;">
          📈 ปริมาณน้ำฝน
        </button>

        <a href="/tele?tab=0&station=${sta_code}" 
            style="padding: 4px 10px; background-color: #1976d2; color: white; border-radius: 6px; text-decoration: none; font-size: 0.9rem; display: inline-block; margin-top: 8px; cursor: pointer; transition: background-color 0.2s;">
                ข้อมูลเพิ่มเติม
        </a>
        <br/>
        <div id="chart-discharge-${safeStaCode}" style="display:none; width:100%; height:220px;"></div>
        <div id="chart-wl-${safeStaCode}" style="display:none; width:100%; height:220px;"></div>
        <div id="chart-rain_mm-${safeStaCode}" style="display:none; width:100%; height:220px;"></div>
      `,

      icon: {
        html: `
          <div style="text-align:center;">
            <img src="${Path_URL}images/icons/tele_station_icon.png" style="width:24px;height:24px;display:block;margin:0 auto;" />
            <div style="background:rgba(255,255,255,0.4);padding:2px;border-radius:5px;font-size:12px;margin-top:2px;width:80px;">
              ${sta_code}
            </div>
          </div>
        `,
      },

      size: { width: 520, height: 'auto' },
    });

    map.Overlays.add(marker);
    markersRef.current.push(marker);
  });

  console.log(`เพิ่ม Tele markers จำนวน ${markersRef.current.length} ตัว`);
};

// ลบ marker ทั้งหมดใน array นี้
const removeMarkers = (map: any, markersRef: React.MutableRefObject<any[]>) => {
  if (!map) return;
  markersRef.current.forEach((marker) => {
    map.Overlays.remove(marker);
  });
  markersRef.current = [];
};

export const useTeleMarkers = (
  map: any,
  teleInfo: StationInfo[],
  latestTeleData: TeleDataItem[],
  visible: boolean
) => {
  const markersRef = useRef<any[]>([]);

  useEffect(() => {
    if (!map) return;

    // ลบ marker เก่าทั้งหมดก่อน
    removeMarkers(map, markersRef);

    if (visible) {
      addTeleMarkers(map, teleInfo, latestTeleData, markersRef);
    }

    // cleanup เมื่อ unmount หรือเปลี่ยน dependency
    return () => {
      removeMarkers(map, markersRef);
    };
  }, [map, teleInfo, latestTeleData, visible]);

  return markersRef;
};
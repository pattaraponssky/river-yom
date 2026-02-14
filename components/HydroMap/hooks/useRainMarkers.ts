import { useEffect, useRef } from 'react';
import { Path_URL } from '@/lib/utility';
import { formatThaiDay } from '@/lib/utility';
import { StationInfo, RainDataItem } from '../hydro';


const addRainMarkers = (
  map: any,
  rainInfo: StationInfo[],
  latestRainData: RainDataItem[],
  markersRef: React.MutableRefObject<any[]>
) => {
  if (!map || !rainInfo?.length) return;

  const todayStr = new Date().toISOString().slice(0, 10);
  const latestMap = new Map<string, RainDataItem>(
    latestRainData.map((item) => [item.sta_code, item])
  );

  rainInfo.forEach((station) => {
    const { sta_code, district, province, lat, long } = station;
    const position = { lat: parseFloat(lat), lon: parseFloat(long) };

    if (isNaN(position.lat) || isNaN(position.lon)) return;

    const latest = latestMap.get(sta_code);
    const isToday = latest && new Date(latest.date).toISOString().slice(0, 10) === todayStr;

    const rain_mm = isToday && latest?.rain_mm != null && parseFloat(latest.rain_mm) !== 0
      ? parseFloat(latest.rain_mm).toFixed(2)
      : '-';

    // เปลี่ยนไอคอนตามว่ามีฝนหรือไม่ (ตัวอย่าง logic เดิม)
    const iconFile = parseFloat(rain_mm) > 0 ? 'rain_station_icon.png' : 'sun_station_icon.png';

    const safeStaCode = sta_code.replace(/\./g, '_');

    const marker = new window.longdo.Marker(position, {
      title: `<img src="${Path_URL}images/icons/rain_station_icon.png" style="width:25px;height:25px;vertical-align:middle;margin-right:5px" /> 
              <span style="font-size:1.1rem;font-weight:bold;vertical-align:middle;">${name} อ.${district} จ.${province}</span>`,

      detail: `
        <div style="font-size:1rem;">
          <b>ข้อมูลประจำวันที่ ${formatThaiDay(todayStr)}</b>
        </div>
        <div style="font-size:0.9rem;line-height:1.4rem;">
          <div><b>รหัสสถานี:</b> <span style="color:#4caf50;font-weight:bold;">${sta_code || '-'}</span></div>
          <div><b>📉 ปริมาณน้ำฝน:</b> <span style="color:#1e88e5;font-weight:bold;">${rain_mm} มม.</span></div>
        </div>

        <button onclick="window.renderChart('${sta_code}', 'rain_mm')"
                style="background:#1e88e5;color:white;padding:4px 10px;border:none;border-radius:6px;font-size:0.9rem;cursor:pointer;margin:4px 2px;">
          📈 ปริมาณน้ำฝน
        </button>

        <button onclick="window.renderChart('${sta_code}', 'rain_series')"
                style="background:#e53935;color:white;padding:4px 10px;border:none;border-radius:6px;font-size:0.9rem;cursor:pointer;margin:4px 2px;">
          📉 ปริมาณน้ำฝนสะสม
        </button>
        <a href="/rain?tab=0&station=${sta_code}" 
            style="padding: 4px 10px; background-color: #1976d2; color: white; border-radius: 6px; text-decoration: none; font-size: 0.9rem; display: inline-block; margin-top: 8px; cursor: pointer; transition: background-color 0.2s;">
                ข้อมูลเพิ่มเติม
        </a>
        <br/>
        <div id="chart-rain_mm-${safeStaCode}" style="display:none; width:100%; height:220px;"></div>
        <div id="chart-rain_series-${safeStaCode}" style="display:none; width:100%; height:220px;"></div>
      `,

      icon: {
        html: `
          <div style="text-align:center;">
            <img src="${Path_URL}images/icons/${iconFile}" style="width:24px;height:24px;display:block;margin:0 auto;" />
            <div style="background:rgba(255,255,255,0.4);padding:2px;border-radius:5px;font-size:12px;margin-top:2px;width:80px;">
              ${sta_code}
            </div>
          </div>
        `,
      },

      size: { width: 450, height: 'auto' },
    });

    map.Overlays.add(marker);
    markersRef.current.push(marker);
  });

  console.log(`เพิ่ม Rain markers จำนวน ${markersRef.current.length} ตัว`);
};

const removeMarkers = (map: any, markersRef: React.MutableRefObject<any[]>) => {
  if (!map) return;
  markersRef.current.forEach((marker) => map.Overlays.remove(marker));
  markersRef.current = [];
};

export const useRainMarkers = (
  map: any,
  rainInfo: StationInfo[],
  latestRainData: RainDataItem[],
  visible: boolean
) => {
  const markersRef = useRef<any[]>([]);

  useEffect(() => {
    if (!map) return;

    removeMarkers(map, markersRef);

    if (visible) {
      addRainMarkers(map, rainInfo, latestRainData, markersRef);
    }

    return () => {
      removeMarkers(map, markersRef);
    };
  }, [map, rainInfo, latestRainData, visible]);

  return markersRef;
};
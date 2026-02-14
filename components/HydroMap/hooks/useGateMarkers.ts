
import { useEffect, useRef } from 'react';
import { Path_URL } from '@/lib/utility';
import { formatThaiDay } from '@/lib/utility';
import { StationInfo, GateDataItem } from '../hydro';


const addGateMarkers = (
  map: any,
  gateInfo: StationInfo[],
  latestGateData: GateDataItem[],
  markersRef: React.MutableRefObject<any[]>
) => {
  if (!map || !gateInfo?.length) return;

  const todayStr = new Date().toISOString().slice(0, 10);
  const latestMap = new Map<string, GateDataItem>(
    latestGateData.map((item) => [item.sta_code, item])
  );

  gateInfo.forEach((station) => {
    const { sta_code, sta_name, district, province, lat, long } = station;
    const position = { lat: parseFloat(lat), lon: parseFloat(long) };

    if (isNaN(position.lat) || isNaN(position.lon)) return;

    const latest = latestMap.get(sta_code);
    const isToday = latest && new Date(latest.date).toISOString().slice(0, 10) === todayStr;

    const discharge = isToday && latest?.discharge != null && parseFloat(latest.discharge) !== 0
      ? parseFloat(latest.discharge).toFixed(2)
      : '-';

    const wl_upper = isToday && latest?.wl_upper != null && parseFloat(latest.wl_upper) !== 0
      ? parseFloat(latest.wl_upper).toFixed(2)
      : '-';

    const wl_lower = isToday && latest?.wl_lower != null && parseFloat(latest.wl_lower) !== 0
      ? parseFloat(latest.wl_lower).toFixed(2)
      : '-';

    const safeStaCode = sta_code.replace(/\./g, '_');

    const marker = new window.longdo.Marker(position, {
      title: `<img src="${Path_URL}images/icons/gate_icon.png" style="width:25px;height:25px;vertical-align:middle;margin-right:5px" /> 
              <span style="font-size:1.1rem;font-weight:bold;vertical-align:middle;">${sta_name} อ.${district} จ.${province}</span>`,

      detail: `
        <div style="font-size:1rem;">
          <b>ข้อมูลประจำวันที่ ${formatThaiDay(todayStr)}</b>
        </div>
        <div style="font-size:0.9rem;line-height:1.4rem;">
          <div><b>รหัสสถานี:</b> <span style="color:#4caf50;font-weight:bold;">${sta_code || '-'}</span></div>
          <div><b>📉 อัตราการไหล:</b> <span style="color:#1e88e5;font-weight:bold;">${discharge} ลบ.ม./วินาที</span></div>
          <div><b>📈 ระดับน้ำเหนือ:</b> <span style="color:#e53935;font-weight:bold;">${wl_upper} ม.รทก.</span></div>
          <div><b>📈 ระดับน้ำท้าย:</b> <span style="color:#e53935;font-weight:bold;">${wl_lower} ม.รทก.</span></div>
        </div>

        <button onclick="window.renderChart('${sta_code}', 'gate_discharge')"
                style="background:#1e88e5;color:white;padding:4px 10px;border:none;border-radius:6px;font-size:0.9rem;cursor:pointer;margin:4px 2px;">
          📉 อัตราการไหล
        </button>

        <button onclick="window.renderChart('${sta_code}', 'wl_upper')"
                style="background:#e53935;color:white;padding:4px 10px;border:none;border-radius:6px;font-size:0.9rem;cursor:pointer;margin:4px 2px;">
          📈 ระดับน้ำเหนือ
        </button>

        <button onclick="window.renderChart('${sta_code}', 'wl_lower')"
                style="background:#e53935;color:white;padding:4px 10px;border:none;border-radius:6px;font-size:0.9rem;cursor:pointer;margin:4px 2px;">
          📈 ระดับน้ำท้าย
        </button>

        <br/>
        <div id="chart-gate_discharge-${safeStaCode}" style="display:none; width:100%; height:220px;"></div>
        <div id="chart-wl_upper-${safeStaCode}" style="display:none; width:100%; height:220px;"></div>
        <div id="chart-wl_lower-${safeStaCode}" style="display:none; width:100%; height:220px;"></div>
      `,

      icon: {
        html: `
          <div style="text-align:center;">
            <img src="${Path_URL}images/icons/gate_icon.png" style="width:24px;height:24px;display:block;margin:0 auto;" />
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

  console.log(`เพิ่ม Gate markers จำนวน ${markersRef.current.length} ตัว`);
};

const removeMarkers = (map: any, markersRef: React.MutableRefObject<any[]>) => {
  if (!map) return;
  markersRef.current.forEach((marker) => map.Overlays.remove(marker));
  markersRef.current = [];
};

export const useGateMarkers = (
  map: any,
  gateInfo: StationInfo[],
  latestGateData: GateDataItem[],
  visible: boolean
) => {
  const markersRef = useRef<any[]>([]);

  useEffect(() => {
    if (!map) return;

    removeMarkers(map, markersRef);

    if (visible) {
      addGateMarkers(map, gateInfo, latestGateData, markersRef);
    }

    return () => {
      removeMarkers(map, markersRef);
    };
  }, [map, gateInfo, latestGateData, visible]);

  return markersRef;
};
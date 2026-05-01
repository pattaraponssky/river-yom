// hooks/useGeoJsonRenderer.ts
import { useEffect, useRef } from 'react';

export const useGeoJsonRenderer = (map: any, jsonDataList: any[]) => {
  const overlaysRef = useRef<any[]>([]); // เก็บ Polygon + Polyline เพื่อลบได้

  const clearOverlays = () => {
    if (!map) return;
    overlaysRef.current.forEach(overlay => map.Overlays.remove(overlay));
    overlaysRef.current = [];
  };

  // hooks/useGeoJsonRenderer.ts (เวอร์ชันแก้ไข + ทนทานกว่า)

const addGeoJsonOverlays = () => {
  if (!map || jsonDataList.length === 0) return;

  clearOverlays();

  jsonDataList.forEach((geojson, fileIndex) => {
    if (!geojson?.features) {
      console.warn(`ไฟล์ GeoJSON ${fileIndex} ไม่มี features`);
      return;
    }

    geojson.features.forEach((feature: any, featIndex: number) => {
      const props = feature.properties || {};
      const geom = feature.geometry;

      if (!geom?.type || !geom.coordinates) {
        console.warn(`Feature ${featIndex} ในไฟล์ ${fileIndex} ไม่มี geometry`);
        return;
      }

    //   console.log(`Processing feature ${featIndex} type: ${geom.type}`);

      // ─── POLYGON / MULTIPOLYGON ────────────────────────────────
      if (geom.type === 'Polygon' || geom.type === 'MultiPolygon') {
        let rings: any[] = [];

        if (geom.type === 'Polygon') {
          rings = geom.coordinates; // [[[lon,lat], ...]] → array of rings
        } else if (geom.type === 'MultiPolygon') {
          rings = geom.coordinates.flat(); // [[[lon,lat],...], ...] → flat เป็น rings ทั้งหมด
        }

        rings.forEach((ring: any, ringIndex: number) => {
          if (!Array.isArray(ring) || ring.length === 0) {
            console.warn(`Ring ${ringIndex} ไม่ใช่ array หรือว่าง`);
            return;
          }

          // ตรวจสอบว่า ring เป็น array ของ [lon, lat] จริง ๆ
          if (typeof ring[0] === 'number') {
            console.error(`พบ ring ที่เป็น number แทน array:`, ring);
            return;
          }

          const locations = ring.map((coord: [number, number], i: number) => {
            if (!Array.isArray(coord) || coord.length < 2) {
              console.warn(`Coordinate ไม่ถูกต้องที่ index ${i}:`, coord);
              return null;
            }
            const [lon, lat] = coord;
            return { lon, lat };
          }).filter(Boolean); // ลบ null ออก

          if (locations.length < 3) {
            console.warn(`Ring มีจุดน้อยกว่า 3 จุด ไม่สามารถสร้าง Polygon ได้`);
            return;
          }

          const polygon = new window.longdo.Polygon(locations, {
            title: props.MBASIN_T || props.name || props.NAME_T || 'พื้นที่',
            detail: props.AREA_SQKM ? `พื้นที่: ${props.AREA_SQKM} ตร.กม.` : undefined,
            lineWidth: 2,
            lineColor: 'rgba(0, 100, 10, 0.8)',
            fillColor: 'rgba(100, 200, 255, 0.08)',
          });

          map.Overlays.add(polygon);
          overlaysRef.current.push(polygon);
        });
      }

      // ─── LINESTRING / MULTILINESTRING ──────────────────────────
      else if (geom.type === 'LineString' || geom.type === 'MultiLineString') {
        let lines: any[] = [];

        if (geom.type === 'LineString') {
          lines = [geom.coordinates]; // [[lon,lat], ...] → array of 1 line
        } else {
          lines = geom.coordinates; // [[[lon,lat],...], ...]
        }

        lines.forEach((line: any, lineIndex: number) => {
          if (!Array.isArray(line)) {
            console.warn(`Line ${lineIndex} ไม่ใช่ array`);
            return;
          }

          const locations = line.map((coord: [number, number], i: number) => {
            if (!Array.isArray(coord) || coord.length < 2) {
              console.warn(`Coordinate ใน LineString ไม่ถูกต้องที่ index ${i}`);
              return null;
            }
            const [lon, lat] = coord;
            return { lon, lat };
          }).filter(Boolean);

          if (locations.length < 2) return;

          const polyline = new window.longdo.Polyline(locations, {
            title: props.name_en || props.NAME_T || props.river_name || 'แม่น้ำ/เส้นทาง',
            lineWidth: 3,
            lineColor: '#1e88e5',
            lineStyle: window.longdo.LineStyle.Solid,
          });

          map.Overlays.add(polyline);
          overlaysRef.current.push(polyline);
        });
      }

      else {
        console.warn(`ไม่รองรับ geometry type: ${geom.type}`);
      }
    });
  });

  console.log(`เพิ่ม overlays ทั้งหมด ${overlaysRef.current.length} ชิ้น`);
};

  useEffect(() => {
    if (!map) return;

    addGeoJsonOverlays();

    return () => {
      clearOverlays();
    };
  }, [map, jsonDataList]);

  return { clearOverlays };
};
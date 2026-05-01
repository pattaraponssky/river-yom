import { useEffect, useState } from 'react';

export const useGeoJsonLoader = (jsonPaths: string[]) => {
  const [jsonDataList, setJsonDataList] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!jsonPaths || jsonPaths.length === 0) return;

    const loadGeoJsonFiles = async () => {
      setLoading(true);
      setError(null);

      try {
        const promises = jsonPaths.map(async (path) => {
          const response = await fetch(path);
          if (!response.ok) {
            throw new Error(`โหลด GeoJSON ไม่สำเร็จ: ${path} (status ${response.status})`);
          }
          return response.json();
        });

        const results = await Promise.all(promises);
        setJsonDataList(results);
        console.log(`โหลด GeoJSON สำเร็จทั้งหมด ${results.length} ไฟล์`);
      } catch (err: any) {
        console.error('เกิดข้อผิดพลาดในการโหลด GeoJSON:', err);
        setError(err.message || 'ไม่สามารถโหลดไฟล์ GeoJSON ได้');
      } finally {
        setLoading(false);
      }
    };

    loadGeoJsonFiles();
  }, [jsonPaths]);

  return {
    jsonDataList,
    loading,
    error,
  };
};
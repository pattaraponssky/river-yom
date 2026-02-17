'use client';

import React, { useEffect, useState } from 'react';
import { useThemeMode } from '@/contexts/ThemeContext';
import { useFlowMarkers } from '@/components/HydroMap/hooks/useFlowMarkers';
import { useGateMarkers } from '@/components/HydroMap/hooks/useGateMarkers';
import { useGeoJsonLoader } from '@/components/HydroMap/hooks/useGeoJsonLoader';
import { useHydroData } from '@/components/HydroMap/hooks/useHydroData';
import { useLongdoMap } from '@/components/HydroMap/hooks/useLongdoMap';
import { useRainMarkers } from '@/components/HydroMap/hooks/useRainMarkers';
import { useGeoJsonRenderer } from '@/components/HydroMap/hooks/useGeoJsonRenderer';

import { renderChart } from '@/components/HydroMap/utils/chartUtils';
import { createToggleMenu } from '@/components/HydroMap/utils/markerUtils';
import { HydroMapProps } from '@/components/HydroMap/hydro';

const HydroMap: React.FC<HydroMapProps> = ({ mapKey, JsonPaths, height }) => {
  const { mode } = useThemeMode();
  const { map, isReady, mapContainerRef } = useLongdoMap(mapKey);

  const hydroData = useHydroData();
  const { jsonDataList } = useGeoJsonLoader(JsonPaths); // ← เอา jsonDataList มาใช้ตรงนี้

  // ส่ง jsonDataList (ข้อมูล GeoJSON ที่โหลดแล้ว) เข้า renderer
  useGeoJsonRenderer(map, jsonDataList); // ← แก้จาก JsonPaths เป็น jsonDataList

  const [showFlow, setShowFlow] = useState(false);
  const [showGate, setShowGate] = useState(false);
  const [showRain, setShowRain] = useState(false);

  // ตั้งค่า window.renderChart
  useEffect(() => {
    (window as any).renderChart = renderChart;
  }, []);

  // เปลี่ยน theme โหมดมืด/สว่าง
  useEffect(() => {
    if (!map) return;
    map.enableFilter(mode === 'dark' ? window.longdo.Filter.Dark : window.longdo.Filter.Light);
  }, [mode, map]);

  // ตั้งค่า UI Toggle + ตำแหน่งเริ่มต้น + zoom
  useEffect(() => {
    if (!isReady || !map) return;

    map.Ui.add(createToggleMenu('🚰 สถานีน้ำท่า', 'flow', true, setShowFlow));
    map.Ui.add(createToggleMenu('🌧️ สถานีน้ำฝน', 'rain', true, setShowRain));
    map.Ui.add(createToggleMenu('💧 ประตูระบายน้ำ', 'gate', true, setShowGate));

    map.location({ lat: 16.750, lon: 100 }, true);
    map.zoom(11, true);
    map.Ui.Mouse.enableWheel(false);
    map.zoomRange({ min: 8, max: 17 });
  }, [isReady, map]);

  // Markers
  useFlowMarkers(map, hydroData.flowInfo, hydroData.latestFlowData, showFlow);
  useGateMarkers(map, hydroData.gateInfo, hydroData.latestGateData, showGate);
  useRainMarkers(map, hydroData.rainInfo, hydroData.latestRainData, showRain);

  return (
    <div
      ref={mapContainerRef}
      style={{ width: '100%', height: height || '85vh' }}
    />
  );
};

export default HydroMap;
import { useEffect, useState } from 'react';
import { API_URL } from '@/lib/utility';
import { StationInfo, RainDataItem, FlowDataItem, GateDataItem } from '../hydro';

export const useHydroData = () => {
  const [flowInfo, setFlowInfo] = useState<StationInfo[]>([]);
  const [gateInfo, setGateInfo] = useState<StationInfo[]>([]);
  const [rainInfo, setRainInfo] = useState<StationInfo[]>([]);

  const [latestRainData, setLatestRainData] = useState<RainDataItem[]>([]);
  const [latestFlowData, setLatestFlowData] = useState<FlowDataItem[]>([]);
  const [latestGateData, setLatestGateData] = useState<GateDataItem[]>([]);

  const [rainData14d, setRainData14d] = useState<RainDataItem[]>([]);
  const [flowData14d, setFlowData14d] = useState<FlowDataItem[]>([]);
  const [gateData14d, setGateData14d] = useState<GateDataItem[]>([]);

  useEffect(() => {
    const fetchAll = async () => {
      const [info, data14d] = await Promise.all([
        Promise.allSettled([
          fetch(`${API_URL}/api/flow_info`).then(r => r.json()),
          fetch(`${API_URL}/api/rain_info`).then(r => r.json()),
          fetch(`${API_URL}/api/gate_info`).then(r => r.json()),
        ]),
        Promise.allSettled([
          fetch(`${API_URL}/api/rain_data_last_14_days`).then(r => r.json()),
          fetch(`${API_URL}/api/flow_data_last_14_days`).then(r => r.json()),
          fetch(`${API_URL}/api/gate_data_last_14_days`).then(r => r.json()),
        ]),
      ]);

      // info
      setFlowInfo(info[0].status === 'fulfilled' ? info[0].value.data : []);
      setRainInfo(info[1].status === 'fulfilled' ? info[1].value.data : []);
      setGateInfo(info[2].status === 'fulfilled' ? info[2].value.data : []);

      // 14 days + latest
      if (data14d[0].status === 'fulfilled' && data14d[0].value.status === 'success') {
        const data = data14d[0].value.data;
        setRainData14d(data);
        setLatestRainData(getLatest(data));
      }
      if (data14d[1].status === 'fulfilled' && data14d[1].value.status === 'success') {
        const data = data14d[1].value.data;
        setFlowData14d(data);
        setLatestFlowData(getLatest(data));
      }
      if (data14d[2].status === 'fulfilled' && data14d[2].value.status === 'success') {
        const data = data14d[2].value.data;
        setGateData14d(data);
        setLatestGateData(getLatest(data));
      }
    };

    fetchAll();
  }, []);

    useEffect(() => {
    if (rainData14d.length > 0) {
        (window as any).rainDataLast14d = rainData14d;
        console.log(`window.rainDataLast14d อัปเดตแล้ว (${rainData14d.length} รายการ)`);
    }
    }, [rainData14d]);

    useEffect(() => {
    if (flowData14d.length > 0) {
        (window as any).flowDataLast14d = flowData14d;
        console.log(`window.flowDataLast14d อัปเดตแล้ว (${flowData14d.length} รายการ)`);
    }
    }, [flowData14d]);

    useEffect(() => {
    if (gateData14d.length > 0) {
        (window as any).gateDataLast14d = gateData14d;
        console.log(`window.gateDataLast14d อัปเดตแล้ว (${gateData14d.length} รายการ)`);
    }
    }, [gateData14d]);

  const getLatest = <T extends { sta_code: string; date: string }>(arr: T[]) => {
    const map = new Map<string, T>();
    arr.forEach(item => {
      const exist = map.get(item.sta_code);
      if (!exist || new Date(item.date) > new Date(exist.date)) map.set(item.sta_code, item);
    });
    return Array.from(map.values());
  };

  return {
    flowInfo, gateInfo, rainInfo,
    latestRainData, latestFlowData, latestGateData,
    rainData14d, flowData14d, gateData14d,
  };
};
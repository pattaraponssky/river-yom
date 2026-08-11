'use client';

import React, { useState, useEffect, useMemo } from 'react';
import {
  Container,
  Box,
  Grid,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Card,
  CardContent,
  CardHeader,
  Divider,
  Typography,
  ToggleButton,
  ToggleButtonGroup,
  Button,
  useTheme,
  SelectChangeEvent,
} from '@mui/material';
import GateChart from '@/components/Data/GateChartData';
import GateExportTable from '@/components/Data/GateTableData';
import CenteredLoading from '@/components/Layout/CenteredLoading';
import { API_URL, Path_URL } from '@/lib/utility';
import { titleStyle, textStyle, HeaderCellStyle, fontInfo } from '@/theme/style';

interface DataGateProps {
  propsSelectedStation?: string;
}

type DataMode = 'daily' | 'hourly';

const MODE_LABELS: Record<DataMode, string> = {
  hourly: 'รายชั่วโมง',
  daily: 'รายวัน',
};

const DataGate: React.FC<DataGateProps> = ({ propsSelectedStation }) => {
  const queryParams = new URLSearchParams(location.search);
  const stationFromURL = queryParams.get('station') || 'tng';
  const theme = useTheme();
  const isDark = theme.palette.mode === 'dark';

  const [mode, setMode] = useState<DataMode>('daily');
  const [stations, setStations] = useState<any[]>([]);
  const [selectedStation, setSelectedStation] = useState<string | null>(null);
  const [availableYears, setAvailableYears] = useState<string[]>([]);
  const [startYear, setStartYear] = useState<string>('');
  const [endYear, setEndYear] = useState<string>('');

  const [chartData1, setChartData1] = useState<any>(null); // discharge
  const [chartData2, setChartData2] = useState<any>(null); // wl_upper
  const [chartData3, setChartData3] = useState<any>(null); // wl_lower

  const [wlUpperGroupedData, setWlUpperGroupedData] = useState<{ [year: string]: [number, number][] }>({});
  const [wlLowerGroupedData, setWlLowerGroupedData] = useState<{ [year: string]: [number, number][] }>({});
  const [dischargeGroupedData, setDischargeGroupedData] = useState<{ [year: string]: [number, number][] }>({});

  const [isSubmitted, setIsSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [yearError, setYearError] = useState<string>('');
  const [initialLoad, setInitialLoad] = useState(false);
  const [allAvailableYears, setAllAvailableYears] = useState<string[]>([]);

  // ตั้งค่าสถานีจาก props หรือ URL
  useEffect(() => {
    if (propsSelectedStation) {
      setSelectedStation(propsSelectedStation);
    } else {
      setSelectedStation(stationFromURL);
    }
  }, [propsSelectedStation, stationFromURL]);

  // โหลดข้อมูลครั้งแรกอัตโนมัติเมื่อมีสถานี + ปีครบ
  useEffect(() => {
    if (!initialLoad && selectedStation && startYear && endYear) {
      fetchGateData(startYear, endYear);
      setIsSubmitted(true);
      setInitialLoad(true);
    }
  }, [selectedStation, startYear, endYear, initialLoad]);

  // รีเซ็ตเมื่อเปลี่ยนสถานีหรือโหมด
  useEffect(() => {
    if (selectedStation) {
      setIsSubmitted(false);
      setYearError('');
      setStartYear('');
      setEndYear('');
      setAvailableYears([]);
      setAllAvailableYears([]);
      setChartData1(null);
      setChartData2(null);
      setChartData3(null);
      setWlUpperGroupedData({});
      setWlLowerGroupedData({});
      setDischargeGroupedData({});
      setInitialLoad(false);
    }
  }, [selectedStation, mode]);

  // โหลดรายชื่อสถานี
  useEffect(() => {
    fetch(`${API_URL}/api/gate_info`)
      .then((r) => r.json())
      .then((d) => setStations(d.data || []))
      .catch(console.error);
  }, []);

  // โหลดปีที่มีข้อมูลของสถานี
  useEffect(() => {
    if (!selectedStation) return;

    fetch(`${API_URL}/api/gate_years?sta_code=${selectedStation}`)
      .then((r) => r.json())
      .then((d) => {
        const years = (d.data || []).sort((a: string, b: string) => +a - +b);
        setAvailableYears(years);

        if (years.length > 0) {
          const end = years[years.length - 1];
          const start = years[years.length - 1] || end;
          setStartYear(start);
          setEndYear(end);
          setInitialLoad(false);
        }
      })
      .catch(console.error);
  }, [selectedStation, mode]);

  const fetchGateData = async (start: string, end: string) => {
    const endpoint = mode === 'daily' ? 'gate_data' : 'gate_hourly_data'; // ปรับชื่อ endpoint ตามจริง
    const res = await fetch(
      `${API_URL}/api/${endpoint}/${selectedStation}?startYear=${start}&endYear=${end}`
    );
    const data = await res.json();

    if (!data?.data?.length) {
      setWlUpperGroupedData({});
      setWlLowerGroupedData({});
      setDischargeGroupedData({});
      setChartData1(null);
      setChartData2(null);
      setChartData3(null);
      return;
    }

    const BASE_YEAR = 2000;
    const rawData = data.data;

    const wlUpperTable: { [year: string]: [number, number][] } = {};
    const wlLowerTable: { [year: string]: [number, number][] } = {};
    const dischargeTable: { [year: string]: [number, number][] } = {};

    const wlUpperSeriesMap = new Map<string, [number, number][]>();
    const wlLowerSeriesMap = new Map<string, [number, number][]>();
    const dischargeSeriesMap = new Map<string, [number, number][]>();

    rawData.forEach((item: any) => {
      const date = new Date(item.datetime);
      if (isNaN(date.getTime())) return;

      const originalYear = date.getFullYear().toString();
      const month = date.getMonth();
      const day = date.getDate();
      const hours = date.getHours();
      const minutes = date.getMinutes();
      const seconds = mode === 'daily' ? Math.floor(Math.random() * 60) : date.getSeconds();

      const chartTimestamp = new Date(BASE_YEAR, month, day, hours, minutes, seconds).getTime();

      // wl_upper
      if (item.wl_upper != null) {
        const value = parseFloat(item.wl_upper);
        if (!wlUpperTable[originalYear]) wlUpperTable[originalYear] = [];
        wlUpperTable[originalYear].push([date.getTime(), value]);

        if (!wlUpperSeriesMap.has(originalYear)) wlUpperSeriesMap.set(originalYear, []);
        wlUpperSeriesMap.get(originalYear)!.push([chartTimestamp, value]);
      }

      // wl_lower
      if (item.wl_lower != null) {
        const value = parseFloat(item.wl_lower);
        if (!wlLowerTable[originalYear]) wlLowerTable[originalYear] = [];
        wlLowerTable[originalYear].push([date.getTime(), value]);

        if (!wlLowerSeriesMap.has(originalYear)) wlLowerSeriesMap.set(originalYear, []);
        wlLowerSeriesMap.get(originalYear)!.push([chartTimestamp, value]);
      }

      // discharge
      if (item.discharge != null) {
        const value = parseFloat(item.discharge);
        if (!dischargeTable[originalYear]) dischargeTable[originalYear] = [];
        dischargeTable[originalYear].push([date.getTime(), value]);

        if (!dischargeSeriesMap.has(originalYear)) dischargeSeriesMap.set(originalYear, []);
        dischargeSeriesMap.get(originalYear)!.push([chartTimestamp, value]);
      }
    });

    setWlUpperGroupedData(wlUpperTable);
    setWlLowerGroupedData(wlLowerTable);
    setDischargeGroupedData(dischargeTable);

    const years = Array.from(
      new Set([
        ...wlUpperSeriesMap.keys(),
        ...wlLowerSeriesMap.keys(),
        ...dischargeSeriesMap.keys(),
      ])
    ).sort();

    const createSeries = (map: Map<string, [number, number][]>, prefix: string) =>
      years
        .filter((year) => map.has(year))
        .map((year) => ({
          name: `${prefix}ปี ${Number(year) + 543}`,
          type: 'line' as const,
          data: map.get(year)!.sort((a, b) => a[0] - b[0]),
          marker: { enabled: false },
          lineWidth: 1.5,
        }));

    setChartData2({ series: createSeries(wlUpperSeriesMap, 'ระดับน้ำตอนบน ') });
    setChartData3({ series: createSeries(wlLowerSeriesMap, 'ระดับน้ำตอนล่าง ') });
    setChartData1({ series: createSeries(dischargeSeriesMap, 'อัตราการไหล ') });

    setAllAvailableYears(years);
  };

  const handleShowData = async () => {
    if (!selectedStation) {
      setYearError('กรุณาเลือกสถานี');
      return;
    }
    if (!startYear || !endYear) {
      setYearError('กรุณาเลือกปีเริ่มต้นและปีสิ้นสุด');
      return;
    }

    const start = parseInt(startYear);
    const end = parseInt(endYear);

    if (start > end) {
      setYearError('ปีสิ้นสุดต้องไม่น้อยกว่าปีเริ่มต้น');
      return;
    }
    if (end - start > 5) {
      setYearError('เลือกได้สูงสุด 5 ปีเท่านั้น');
      return;
    }

    setYearError('');
    setLoading(true);

    try {
      await fetchGateData(startYear, endYear);
      setIsSubmitted(true);
    } catch (err) {
      setYearError('เกิดข้อผิดพลาดในการโหลดข้อมูล');
    } finally {
      setLoading(false);
    }
  };

  const availableYearsTable = useMemo(() => {
    if (!allAvailableYears.length || !startYear || !endYear) return ['ทั้งหมด'];

    const filtered = allAvailableYears.filter(
      (y) => Number(y) >= Number(startYear) && Number(y) <= Number(endYear)
    );

    return ['ทั้งหมด', ...filtered];
  }, [allAvailableYears, startYear, endYear]);

  if (!stations.length) return <CenteredLoading />;

  const station = selectedStation
    ? stations.find((s) => s.sta_code === selectedStation)
    : null;

  return (
    <Container component="main" sx={{ minWidth: '100%', py: 2 }}>
      <Grid container spacing={3}>
        {/* รูปสถานี */}
        <Grid size={{ xs: 12, md: 5 }}>
          <Box sx={{ display: 'flex', justifyContent: 'center' }}>
            <img
              src={
                station
                  ? `${Path_URL}images/gate/${station.sta_code}.jpg`
                  : `${Path_URL}images/default_img.png`
              }
              alt="Station"
              style={{
                width: '100%',
                height: '100%',
                objectFit: 'cover',
                borderRadius: '10px',
                boxShadow: '0px 3px 6px rgba(0, 0, 0, 0.56)',
              }}
              onError={(e) => (e.currentTarget.src = `${Path_URL}images/default_img.png`)}
            />
          </Box>
        </Grid>

        {/* ตัวเลือก */}
        <Grid size={{ xs: 12, md: 7 }}>
          <Grid container spacing={2} alignItems="center">
            {/* โหมดข้อมูล */}
            <Grid size={{ xs: 12 }}>
              <Typography sx={{ ...textStyle, mb: 0.5, color: 'text.secondary' }}>
                รูปแบบข้อมูล
              </Typography>
              <ToggleButtonGroup
                value={mode}
                exclusive
                onChange={(_, v) => v && setMode(v as DataMode)}
                size="medium"
                sx={{ flexWrap: 'wrap', gap: 0.5 }}
              >
                {(Object.keys(MODE_LABELS) as DataMode[]).map((m) => (
                  <ToggleButton
                    key={m}
                    value={m}
                    sx={{
                      fontFamily: 'Prompt',
                      px: 2,
                      '&.Mui-selected': {
                        bgcolor: 'primary.main',
                        color: 'white',
                        '&:hover': { bgcolor: 'primary.dark' },
                      },
                    }}
                  >
                    {MODE_LABELS[m]}
                  </ToggleButton>
                ))}
              </ToggleButtonGroup>
            </Grid>

            {/* เลือกสถานี */}
            <Grid size={{ xs: 12, md: 5 }}>
              <FormControl fullWidth>
                <InputLabel sx={{ fontFamily: 'Prompt' }}>เลือกประตูระบายน้ำ</InputLabel>
                <Select
                  value={selectedStation || ''}
                  label="เลือกประตูระบายน้ำ"
                  onChange={(e) => setSelectedStation(e.target.value)}
                  sx={fontInfo}
                >
                  {stations.map((s) => (
                    <MenuItem key={s.sta_code} value={s.sta_code}>
                      {s.sta_name} ({s.sta_code})
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>

            {/* ปีเริ่มต้น */}
            <Grid size={{ xs: 12, md: 2 }}>
              <FormControl fullWidth>
                <InputLabel sx={{ fontFamily: 'Prompt' }}>ปีเริ่มต้น</InputLabel>
                <Select
                  value={startYear}
                  label="ปีเริ่มต้น"
                  onChange={(e) => setStartYear(e.target.value)}
                  sx={fontInfo}
                >
                  {availableYears
                    .filter(
                      (y) =>
                        !endYear ||
                        (parseInt(y) <= parseInt(endYear) &&
                          parseInt(endYear) - parseInt(y) <= 5)
                    )
                    .map((y) => (
                      <MenuItem key={y} value={y}>
                        {+y + 543}
                      </MenuItem>
                    ))}
                </Select>
              </FormControl>
            </Grid>

            {/* ปีสิ้นสุด */}
            <Grid size={{ xs: 12, md: 2 }}>
              <FormControl fullWidth>
                <InputLabel sx={{ fontFamily: 'Prompt' }}>ปีสิ้นสุด</InputLabel>
                <Select
                  value={endYear}
                  label="ปีสิ้นสุด"
                  onChange={(e) => setEndYear(e.target.value)}
                  sx={fontInfo}
                >
                  {availableYears
                    .filter(
                      (y) =>
                        !startYear ||
                        (parseInt(y) >= parseInt(startYear) &&
                          parseInt(y) - parseInt(startYear) <= 5)
                    )
                    .map((y) => (
                      <MenuItem key={y} value={y}>
                        {+y + 543}
                      </MenuItem>
                    ))}
                </Select>
              </FormControl>
            </Grid>

            {/* ปุ่มแสดงผล */}
            <Grid size={{ xs: 12, md: 3 }}>
              <Button
                variant="contained"
                color="primary"
                fullWidth
                sx={{ height: '56px', ...titleStyle }}
                onClick={handleShowData}
                disabled={loading}
              >
                {loading ? 'กำลังโหลด...' : 'แสดงผล'}
              </Button>
            </Grid>
          </Grid>

          {yearError && (
            <Typography color="error" sx={{ mt: 2, ...textStyle, ml: 2 }}>
              {yearError}
            </Typography>
          )}

          {/* ข้อมูลสถานี */}
          {station && (
            <Grid size={{ xs: 12 }} sx={{ mt: 3 }}>
              <Card>
                <CardHeader
                  sx={HeaderCellStyle}
                  title={`${station.sta_name} (${station.sta_code})`}
                />
                <Divider />
                <CardContent>
                  <Grid container spacing={2}>
                    <Grid size={{ xs: 6, sm: 4 }}>
                      <Typography sx={fontInfo}>
                        <strong>ตำบล:</strong> {station.tambon}
                      </Typography>
                    </Grid>
                    <Grid size={{ xs: 6, sm: 4 }}>
                      <Typography sx={fontInfo}>
                        <strong>อำเภอ:</strong> {station.district}
                      </Typography>
                    </Grid>
                    <Grid size={{ xs: 6, sm: 4 }}>
                      <Typography sx={fontInfo}>
                        <strong>จังหวัด:</strong> {station.province}
                      </Typography>
                    </Grid>
                    <Grid size={{ xs: 6, sm: 4 }}>
                      <Typography sx={fontInfo}>
                        <strong>Lat:</strong> {Number(station.lat).toFixed(3)}
                      </Typography>
                    </Grid>
                    <Grid size={{ xs: 6, sm: 4 }}>
                      <Typography sx={fontInfo}>
                        <strong>Lon:</strong> {Number(station.long).toFixed(3)}
                      </Typography>
                    </Grid>
                  </Grid>
                </CardContent>
              </Card>
            </Grid>
          )}
        </Grid>
      </Grid>

      <Divider sx={{ my: 4 }} />

      {/* แสดงผลเมื่อกดแสดงผล */}
      {isSubmitted && !yearError && chartData1 && chartData2 && chartData3 && (
        <Box sx={{ mt: 4 }}>
          <Typography sx={{ fontWeight: 'bold', ...titleStyle, mb: 3 }}>
            กราฟข้อมูลประตูน้ำ ({mode === 'daily' ? 'รายวัน' : 'รายชั่วโมง'}) สถานี{' '}
            <span style={{ color: 'red' }}>{station?.sta_code}</span>
            {' '}ปี พ.ศ. {parseInt(startYear) + 543} - {parseInt(endYear) + 543}
          </Typography>

          <GateChart
            data={chartData2}
            isDark={isDark}
            mode={mode}
            type="wl_upper"
            sta_code={selectedStation ?? ''}
          />
          <GateChart
            data={chartData3}
            isDark={isDark}
            mode={mode}
            type="wl_lower"
            sta_code={selectedStation ?? ''}
          />
          <GateChart
            data={chartData1}
            isDark={isDark}
            mode={mode}
            type="discharge"
          />

          <GateExportTable
            mode={mode}
            dischargeGroupedData={dischargeGroupedData}
            wlUpperGroupedData={wlUpperGroupedData}
            wlLowerGroupedData={wlLowerGroupedData}
            availableYears={availableYearsTable}
          />
        </Box>
      )}

      {!isSubmitted && selectedStation && (
        <Box sx={{ textAlign: 'center', mt: 10 }}>
          <Typography sx={{ fontFamily: 'Prompt', fontSize: '1.3rem', color: '#555' }}>
            กรุณาเลือกสถานี ช่วงปี และกดปุ่ม{' '}
            <strong style={{ color: '#01579b' }}>"แสดงผล"</strong>
          </Typography>
        </Box>
      )}
    </Container>
  );
};

export default DataGate;
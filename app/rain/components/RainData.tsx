// app/rain/components/RainData.tsx
import React, { useState, useEffect, useMemo } from "react";
import {
  Container, Box, Grid, FormControl, InputLabel, Select, MenuItem,
  Card, CardContent, CardHeader, Divider, Typography, Button, useTheme,
  ToggleButton, ToggleButtonGroup,
} from "@mui/material";
import RainChart from "@/components/Data/RainChartData";
import RainExportTable from "@/components/Data/RainTableData";
import CenteredLoading from "@/components/Layout/CenteredLoading";
import { API_URL, Path_URL } from "@/lib/utility";
import { fontInfo, titleStyle, textStyle, HeaderCellStyle } from "@/theme/style";

type DataMode = "hourly" | "daily" | "monthly" | "yearly";

interface DataRainStationProps {
  propsSelectedStation?: string;
}

const MODE_LABELS: Record<DataMode, string> = {
  hourly:  "รายชั่วโมง",
  daily:   "รายวัน",
  monthly: "รายเดือน",
  yearly:  "รายปี",
};

const DataRainStation: React.FC<DataRainStationProps> = ({ propsSelectedStation }) => {
  const queryParams     = new URLSearchParams(location.search);
  const stationFromURL  = queryParams.get("station") || "380012";
  const theme           = useTheme();
  const isDark          = theme.palette.mode === "dark";

  const [mode, setMode]                   = useState<DataMode>("daily");
  const [stations, setStations]           = useState<any[]>([]);
  const [selectedStation, setSelectedStation] = useState<string | null>(null);
  const [availableYears, setAvailableYears]   = useState<string[]>([]);
  const [startYear, setStartYear]         = useState<string>("");
  const [endYear, setEndYear]             = useState<string>("");

  // chart data
  const [chartDataBar, setChartDataBar]   = useState<any>(null); // ฝนรายช่วง
  const [chartDataSum, setChartDataSum]   = useState<any>(null); // ฝนสะสม

  // table data
  const [rainGroupedData, setRainGroupedData] = useState<{ [year: string]: [number, number][] }>({});
  const [allAvailableYears, setAllAvailableYears] = useState<string[]>([]);

  const [isSubmitted, setIsSubmitted] = useState(false);
  const [loading, setLoading]         = useState(false);
  const [yearError, setYearError]     = useState<string>("");
  const [initialLoad, setInitialLoad] = useState(false);

  // ─── init station ────────────────────────────────────────────
  useEffect(() => {
    setSelectedStation(propsSelectedStation || stationFromURL);
  }, [propsSelectedStation, stationFromURL]);

  // ─── reset เมื่อเปลี่ยนสถานี/mode ───────────────────────────
  useEffect(() => {
    if (!selectedStation) return;
    setIsSubmitted(false);
    setYearError("");
    setStartYear("");
    setEndYear("");
    setAvailableYears([]);
    setAllAvailableYears([]);
    setChartDataBar(null);
    setChartDataSum(null);
    setRainGroupedData({});
    setInitialLoad(false);
  }, [selectedStation, mode]);

  // ─── โหลดสถานี ───────────────────────────────────────────────
  useEffect(() => {
    fetch(`${API_URL}/api/rain_info`)
      .then(r => r.json())
      .then(d => setStations(d.data || []))
      .catch(console.error);
  }, []);

  // ─── โหลดปีที่มีข้อมูล ───────────────────────────────────────
  useEffect(() => {
    if (!selectedStation) return;

    // ทุก mode ดึงปีจาก rain_years (รายวัน) เป็น base
    fetch(`${API_URL}/api/rain_years?sta_code=${selectedStation}`)
      .then(r => r.json())
      .then(d => {
        const years = (d.data || []).sort((a: string, b: string) => +a - +b);
        setAvailableYears(years);
        if (years.length > 0) {
          const last = years[years.length - 1];
          setEndYear(last);
          // รายปีและรายเดือน → default เลือกหลายปี
          setStartYear(
            mode === "yearly"
              ? years[0]
              : mode === "monthly"
              ? (years[years.length - 3] || years[0])
              : last
          );
          setInitialLoad(false);
        }
      })
      .catch(console.error);
  }, [selectedStation, mode]);

  // ─── auto load ───────────────────────────────────────────────
  useEffect(() => {
    if (!initialLoad && selectedStation && startYear && endYear) {
      fetchData(startYear, endYear);
      setIsSubmitted(true);
      setInitialLoad(true);
    }
  }, [selectedStation, startYear, endYear, initialLoad]);

  // ─── fetch + transform ───────────────────────────────────────
  const fetchData = async (start: string, end: string) => {
    setLoading(true);
    try {
      let url = "";

      if (mode === "hourly") {
        url = `${API_URL}/api/rain_hourly_data/${selectedStation}?startYear=${start}&endYear=${end}`;
      } else if (mode === "daily") {
        url = `${API_URL}/api/rain_data/${selectedStation}?startYear=${start}&endYear=${end}`;
      } else if (mode === "monthly") {
        url = `${API_URL}/api/rain_monthly/${selectedStation}?startYear=${start}&endYear=${end}`;
      } else {
        url = `${API_URL}/api/rain_yearly/${selectedStation}?startYear=${start}&endYear=${end}`;
      }

      const res  = await fetch(url);
      const json = await res.json();

      if (!json?.data?.length) {
        setChartDataBar(null);
        setChartDataSum(null);
        setRainGroupedData({});
        return;
      }

      if (mode === "monthly") {
        transformMonthly(json.data, start, end);
      } else if (mode === "yearly") {
        transformYearly(json.data);
      } else {
        transformDailyOrHourly(json.data, mode);
      }

    } catch (e) {
      setYearError("เกิดข้อผิดพลาดในการโหลดข้อมูล");
    } finally {
      setLoading(false);
    }
  };

  // ─── Transform: รายวัน / รายชั่วโมง ──────────────────────────
  const transformDailyOrHourly = (rawData: any[], m: DataMode) => {
    const BASE_YEAR  = 2000;
    const dateField  = m === "hourly" ? "datetime" : "date";
    const grouped: { [year: string]: [number, number][] } = {};
    const groupedDataTable: { [year: string]: [number, number][] } = {};
  
    rawData.forEach((item: any, idx: number) => {
      if (item.rain_mm === null) return;
      const d    = new Date(item[dateField]);
      const year = d.getFullYear().toString();
      const val  = parseFloat(item.rain_mm);

      const originalYear = d.getFullYear().toString();
      if (!groupedDataTable[originalYear]) groupedDataTable[originalYear] = [];
      groupedDataTable[originalYear].push([d.getTime(), val]);

       const base = new Date(
        BASE_YEAR,
        d.getMonth(),
        d.getDate(),
        d.getHours(),
        d.getMinutes(),
        0
      ).getTime();

      const ts = base + idx;

      if (!grouped[year]) grouped[year] = [];
      grouped[year].push([ts, val]);
    });

    setRainGroupedData(groupedDataTable);
    buildCharts(grouped, "bar");
    setAllAvailableYears(Object.keys(grouped).sort());
  };

  // ─── Transform: รายเดือน ─────────────────────────────────────
  // คาดว่า API ส่ง { year, month, rain_mm }
  // ถ้ายังไม่มี endpoint → aggregate จาก daily
  const transformMonthly = async (rawData: any[], start: string, end: string) => {
    const BASE_YEAR = 2000;

    // ถ้า API ส่งมาเป็น monthly สำเร็จรูป
    if (rawData[0]?.month !== undefined) {
      const grouped: { [year: string]: [number, number][] } = {};
      const groupedDataTable: { [year: string]: [number, number][] } = {};

      rawData.forEach((item: any, idx: number) => {
        const year = String(item.year);
        const val  = parseFloat(item.rain_mm ?? 0);
        // ใช้วันที่ 15 ของเดือนเพื่อ plot
        const ts   = new Date(BASE_YEAR, item.month - 1, 15).getTime() + idx;
        const realTs = new Date(item.year, item.month - 1, 15).getTime();
        
        if (!groupedDataTable[year]) groupedDataTable[year] = [];
        groupedDataTable[year].push([realTs, val]);
        
        if (!grouped[year]) grouped[year] = [];
        grouped[year].push([ts, val]);
      });

      // sort แต่ละปีตามเดือน
      Object.keys(grouped).forEach(y => {
        grouped[y].sort((a, b) => a[0] - b[0]);
      });

      setRainGroupedData(groupedDataTable);
      buildCharts(grouped, "bar");
      setAllAvailableYears(Object.keys(grouped).sort());
      return;
    }

    const grouped: { [year: string]: { [month: number]: number } } = {};
      rawData.forEach((item: any, idx: number) => {
        if (item.rain_mm === null) return;
        const d     = new Date(item.date ?? item.datetime);
        const year  = d.getFullYear().toString();
        const month = d.getMonth(); // 0-11
        const val   = parseFloat(item.rain_mm);
        if (!grouped[year]) grouped[year] = {};
        grouped[year][month] = (grouped[year][month] || 0) + val + idx;;
      });

    const result: { [year: string]: [number, number][] } = {};
      Object.entries(grouped).forEach(([year, months]) => {
        result[year] = Object.entries(months)
          .map(([m, v]) => [new Date(BASE_YEAR, +m, 15).getTime(), +v.toFixed(2)] as [number, number])
          .sort((a, b) => a[0] - b[0]);
      });

    setRainGroupedData(result);
    buildCharts(result, "bar");
    setAllAvailableYears(Object.keys(result).sort());
  };

  // ─── Transform: รายปี ────────────────────────────────────────
  const transformYearly = (rawData: any[]) => {

    // รวมเป็น series เดียว (ไม่แยกปี เพราะแกน X คือปี)
    const points: [number, number][] = rawData.map((item: any) => {
      const year = parseInt(item.year ?? item.date?.slice(0, 4));
      const ts   = new Date(year, 6, 1).getTime(); // กลางปี
      return [ts, parseFloat(item.rain_mm ?? 0)] as [number, number];
    }).sort((a, b) => a[0] - b[0]);

    const grouped = { all: points };
    setRainGroupedData(grouped as any);

    // chart แบบ bar เดียว
    setChartDataBar({
      series: [{
        name: "ปริมาณฝนรายปี",
        type: "bar",
        data: points,
      }],
    });

    // สะสม
    let sum = 0;
    const sumPoints = points.map(([ts, v]) => {
      sum += v;
      return [ts, +sum.toFixed(2)] as [number, number];
    });
    setChartDataSum({ series: [{ name: "ฝนสะสมรายปี", type: "line", data: sumPoints }] });

    setAllAvailableYears(rawData.map((r: any) => String(r.year ?? r.date?.slice(0, 4))).sort());
  };

  // ─── Build charts จาก grouped data ──────────────────────────
  const buildCharts = (grouped: { [year: string]: [number, number][] }, chartType: "bar" | "line") => {
    const years = Object.keys(grouped).sort();

    const barSeries = years.map(year => ({
      name: `พ.ศ. ${Number(year) + 543}`,
      type: chartType,
      data: grouped[year],
    }));
    setChartDataBar({ series: barSeries });

    // cumulative
    const sumSeries = years.map(year => {
      let sum = 0;
      return {
        name: `พ.ศ. ${Number(year) + 543}`,
        type: "line" as const,
        data: grouped[year].map(([ts, v]) => {
          sum += v;
          return [ts, +sum.toFixed(2)] as [number, number];
        }),
      };
    });
    setChartDataSum({ series: sumSeries });
    setAllAvailableYears(years);
  };

  // ─── handleShowData ──────────────────────────────────────────
  const handleShowData = async () => {
    if (!selectedStation) { setYearError("กรุณาเลือกสถานี"); return; }
    if (!startYear || !endYear) { setYearError("กรุณาเลือกปี"); return; }

    const s = parseInt(startYear), e = parseInt(endYear);
    if (s > e)      { setYearError("ปีเริ่มต้นต้องไม่เกินปีสิ้นสุด"); return; }

    const maxRange = mode === "yearly" ? 30 : mode === "monthly" ? 10 : 5;
    if (e - s > maxRange) {
      setYearError(`เลือกได้สูงสุด ${maxRange} ปี`);
      return;
    }

    setYearError("");
    setLoading(true);
    try {
      await fetchData(startYear, endYear);
      setIsSubmitted(true);
    } finally {
      setLoading(false);
    }
  };

  const availableYearsTable = useMemo(() => {
    if (!allAvailableYears.length || !startYear || !endYear) return ["ทั้งหมด"];
    return ["ทั้งหมด", ...allAvailableYears.filter(
      y => Number(y) >= Number(startYear) && Number(y) <= Number(endYear)
    )];
  }, [allAvailableYears, startYear, endYear]);

  if (!stations.length) return <CenteredLoading />;
  const station = selectedStation ? stations.find(s => s.sta_code === selectedStation) : null;

  // max ปีที่เลือกได้ตาม mode
  const maxRange = mode === "yearly" ? 30 : mode === "monthly" ? 10 : 5;

  return (
    <Container component="main" sx={{ minWidth: "100%" }}>
      <Grid container spacing={2}>
        {/* รูปสถานี */}
        <Grid size={{ xs: 12, sm: 12, md: 4 }}>
          <Box sx={{ display: "flex", justifyContent: "center", alignItems: "center", height: "100%" }}>
            <img
              src={station ? `${Path_URL}images/rain_station/${station.sta_code}.jpg` : `${Path_URL}images/default_img.png`}
              alt="Station"
              style={{ width: "100%", objectFit: "cover", borderRadius: "10px", boxShadow: "0px 3px 6px rgba(0,0,0,0.56)" }}
              onError={e => (e.currentTarget.src = `${Path_URL}images/default_img.png`)}
            />
          </Box>
        </Grid>

        {/* Controls */}
        <Grid size={{ xs: 12, sm: 12, md: 8 }}>
          <Grid container spacing={2} alignItems="center">

            {/* ─── Mode Toggle ─── */}
            <Grid size={{ xs: 12 }}>
              <Typography sx={{ ...textStyle, mb: 0.5, color: "text.secondary" }}>
                รูปแบบข้อมูล
              </Typography>
              <ToggleButtonGroup
                value={mode}
                exclusive
                onChange={(_, v) => v && setMode(v as DataMode)}
                size="medium"
                sx={{ flexWrap: "wrap", gap: 0.5 }}
              >
                {(Object.keys(MODE_LABELS) as DataMode[]).map(m => (
                  <ToggleButton
                    key={m}
                    value={m}
                    sx={{
                      fontFamily: "Prompt",
                      px: 2,
                      "&.Mui-selected": {
                        bgcolor: "primary.main",
                        color: "white",
                        "&:hover": { bgcolor: "primary.dark" },
                      },
                    }}
                  >
                    {MODE_LABELS[m]}
                  </ToggleButton>
                ))}
              </ToggleButtonGroup>
            </Grid>

            {/* สถานี */}
            <Grid size={{ xs: 12, md: 4.5 }}>
              <FormControl fullWidth>
                <InputLabel sx={{ fontFamily: "Prompt" }}>เลือกสถานีฝน</InputLabel>
                <Select
                  value={selectedStation || ""}
                  label="เลือกสถานีฝน"
                  onChange={e => setSelectedStation(e.target.value)}
                  sx={fontInfo}
                >
                  {stations.map(s => (
                    <MenuItem key={s.sta_code} value={s.sta_code} sx={fontInfo}>
                      {s.name} ({s.sta_code})
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>

            {/* ปีเริ่มต้น */}
            <Grid size={{ xs: 12, md: 2.5 }}>
              <FormControl fullWidth>
                <InputLabel sx={{ fontFamily: "Prompt" }}>ปีเริ่มต้น</InputLabel>
                <Select value={startYear} label="ปีเริ่มต้น" onChange={e => setStartYear(e.target.value)} sx={fontInfo}>
                  {availableYears
                    .filter(y => !endYear || (parseInt(y) <= parseInt(endYear) && parseInt(endYear) - parseInt(y) <= maxRange))
                    .map(y => <MenuItem key={y} value={y}>{+y + 543}</MenuItem>)}
                </Select>
              </FormControl>
            </Grid>

            {/* ปีสิ้นสุด */}
            <Grid size={{ xs: 12, md: 2.5 }}>
              <FormControl fullWidth>
                <InputLabel sx={{ fontFamily: "Prompt" }}>ปีสิ้นสุด</InputLabel>
                <Select value={endYear} label="ปีสิ้นสุด" onChange={e => setEndYear(e.target.value)} sx={fontInfo}>
                  {availableYears
                    .filter(y => !startYear || (parseInt(y) >= parseInt(startYear) && parseInt(y) - parseInt(startYear) <= maxRange))
                    .map(y => <MenuItem key={y} value={y}>{+y + 543}</MenuItem>)}
                </Select>
              </FormControl>
            </Grid>

            {/* ปุ่มแสดงผล */}
            <Grid size={{ xs: 12, md: 2.5 }}>
              <Button
                variant="contained"
                color="primary"
                fullWidth
                sx={{ height: "56px", ...titleStyle }}
                onClick={handleShowData}
                disabled={loading}
              >
                {loading ? "กำลังโหลด..." : "แสดงผล"}
              </Button>
            </Grid>

            {yearError && (
              <Grid size={{ xs: 12 }}>
                <Typography color="error" sx={{ ...textStyle, ml: 1 }}>{yearError}</Typography>
              </Grid>
            )}

            {/* ข้อมูลสถานี */}
            {station && (
              <Grid size={{ xs: 12 }}>
                <Card>
                  <CardHeader sx={HeaderCellStyle} title={
                    <Typography sx={{ fontWeight: "bold", ...titleStyle }}>
                      {station.name} ({station.sta_code})
                    </Typography>
                  } />
                  <Divider />
                  <CardContent>
                    <Grid container spacing={2}>
                      <Grid size={{ xs: 6, sm: 4 }}><Typography sx={fontInfo}><strong>ตำบล:</strong> {station.tambon}</Typography></Grid>
                      <Grid size={{ xs: 6, sm: 4 }}><Typography sx={fontInfo}><strong>อำเภอ:</strong> {station.district}</Typography></Grid>
                      <Grid size={{ xs: 6, sm: 4 }}><Typography sx={fontInfo}><strong>จังหวัด:</strong> {station.province}</Typography></Grid>
                      <Grid size={{ xs: 6, sm: 4 }}><Typography sx={fontInfo}><strong>Latitude:</strong> {Number(station.lat).toFixed(3)}</Typography></Grid>
                      <Grid size={{ xs: 6, sm: 4 }}><Typography sx={fontInfo}><strong>Longitude:</strong> {Number(station.long).toFixed(3)}</Typography></Grid>
                      <Grid size={{ xs: 6, sm: 4 }}><Typography sx={fontInfo}><strong>หน่วยงาน:</strong> {station.owner}</Typography></Grid>
                    </Grid>
                  </CardContent>
                </Card>
              </Grid>
            )}
          </Grid>
        </Grid>
      </Grid>

      <Divider sx={{ my: 3 }} />

      {/* ─── Charts + Table ───────────────────────────────────── */}
      {isSubmitted && !yearError && chartDataBar && (
        <Box sx={{ mt: 2 }}>
          <Typography sx={{ fontWeight: "bold", ...titleStyle, mb: 2 }}>
            ปริมาณฝน{MODE_LABELS[mode]} สถานี{" "}
            <span style={{ color: "red" }}>{station?.sta_code} - {station?.name}</span>
            {" "}ปี พ.ศ. {parseInt(startYear) + 543}
            {startYear !== endYear && ` - ${parseInt(endYear) + 543}`}
          </Typography>

          {/* กราฟฝน */}
          <RainChart
            data={chartDataBar}
            type={mode === "yearly" ? "rain_yearly" : mode === "monthly" ? "rain_monthly" : "rain"}
            sta_code={station?.sta_code}
            sta_name={station?.name}
            isDark={isDark}
            mode={mode}
          />

          {/* กราฟสะสม (ไม่แสดงในโหมดรายปี) */}
          {chartDataSum && mode !== "yearly" && (
            <RainChart
              data={chartDataSum}
              type={mode === "monthly" ? "rain_sum_monthly" : "rain_sum"}
              sta_code={station?.sta_code}
              sta_name={station?.name}
              isDark={isDark}
              mode={mode}
            />
          )}

          {/* ตาราง */}
          <RainExportTable
            rain_mmGroupedData={rainGroupedData}
            availableYears={availableYearsTable}
            sta_code={station?.sta_code}
            sta_name={station?.name}
            mode={mode}
          />
        </Box>
      )}

      {!isSubmitted && selectedStation && (
        <Box sx={{ textAlign: "center", mt: 10 }}>
          <Typography sx={{ fontFamily: "Prompt", fontSize: "1.3rem", color: "#555" }}>
            กรุณาเลือกสถานี ช่วงปี และกดปุ่ม{" "}
            <strong style={{ color: "#01579b" }}>"แสดงผล"</strong>
          </Typography>
        </Box>
      )}
    </Container>
  );
};

export default DataRainStation;
import React, { useState, useEffect } from "react";
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
} from "@mui/material";
import TeleChart from "@/app/tele/components/TeleChartData";
import TeleExportTable from "@/app/tele/components/TeleTableData";
import CenteredLoading from "@/components/Layout/CenteredLoading";
import { API_URL, Path_URL } from "@/lib/utility";
import { titleStyle, textStyle, fontInfo } from "@/theme/style";
import { HeaderCellStyle } from '../../../theme/style';
import CameraViewer from "@/components/Data/CameraViewer";
import { STATION_CAMERAS } from "@/lib/cameraConfig";

type DataMode = "daily" | "hourly";

const MODE_LABELS: Record<DataMode, string> = {
  hourly:  "รายชั่วโมง",
  daily:   "รายวัน",
};

const DataTele: React.FC<{ propsSelectedStation?: string }> = ({ propsSelectedStation }) => {
  
  const queryParams = new URLSearchParams(location.search);
  const stationFromURL = queryParams.get("station") || "YR.01";
  const theme = useTheme();
  const isDark = theme.palette.mode === "dark";
  const [mode, setMode] = useState<DataMode>("daily");
  const [stations, setStations] = useState<any[]>([]);
  const [selectedStation, setSelectedStation] = useState<string | null>(null);
  const [availableYears, setAvailableYears] = useState<string[]>([]);
  const [startYear, setStartYear] = useState<string>("");
  const [endYear, setEndYear] = useState<string>("");

  const [chartDataWL, setChartDataWL] = useState<any>(null);
  const [chartDataDischarge, setChartDataDischarge] = useState<any>(null);
  const [chartDataRain, setChartDataRain]   = useState<any>(null); // ฝนรายช่วง
  const [chartDataRainSum, setChartDataRainSum]   = useState<any>(null); // ฝนสะสม

  const [wlGroupedData, setWlGroupedData] = useState<{ [year: string]: [number, number][] }>({});
  const [dischargeGroupedData, setDischargeGroupedData] = useState<{ [year: string]: [number, number][] }>({});
  const [rainGroupedData, setRainGroupedData] = useState<{ [year: string]: [number, number][] }>({});

  const [isSubmitted, setIsSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [yearError, setYearError] = useState<string>("");

  const [initialLoad, setInitialLoad] = useState(false);


  useEffect(() => {
      if (propsSelectedStation) {
        setSelectedStation(propsSelectedStation);
      } else {
        setSelectedStation(stationFromURL);
      }
    }, [propsSelectedStation, stationFromURL]);

  useEffect(() => {
    if (!initialLoad && selectedStation && startYear && endYear) {
      fetchTeleData(startYear, endYear);
      setIsSubmitted(true);
      setInitialLoad(true); // ป้องกันไม่ให้ทำซ้ำ
    }
  }, [selectedStation, startYear, endYear, initialLoad]);

  // รีเซ็ตเมื่อเปลี่ยนสถานีหรือโหมด
  useEffect(() => {
    if (selectedStation) {
      setIsSubmitted(false);
      setYearError("");
      setStartYear("");
      setEndYear("");
      setAvailableYears([]);
      setChartDataWL(null);
      setChartDataDischarge(null);
      setChartDataRain(null);
      setChartDataRainSum(null);
      setWlGroupedData({});
      setDischargeGroupedData({});
      setRainGroupedData({});
      setInitialLoad(false);
    }
  }, [selectedStation, mode]);

  // โหลดรายชื่อสถานี
  useEffect(() => {
    fetch(`${API_URL}/api/tele_info`)
      .then(r => r.json())
      .then(d => setStations(d.data || []))
      .catch(console.error);
  }, []);

  useEffect(() => {
    if (!selectedStation) return;
    const endpoint = mode === "daily" ? "tele_years" : "tele_hourly_years";
    fetch(`${API_URL}/api/${endpoint}?sta_code=${selectedStation}`)
      .then(r => r.json())
      .then(d => {
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

  const fetchTeleData = async (start: string, end: string) => {
    const endpoint = mode === "daily" ? "tele_data" : "tele_hourly_data";
    const dateField = mode === "daily" ? "date" : "datetime";

    const res = await fetch(`${API_URL}/api/${endpoint}/${selectedStation}?startYear=${start}&endYear=${end}`);
    const data = await res.json();

    if (!data?.data?.length) {
      setWlGroupedData({});
      setDischargeGroupedData({});
      setRainGroupedData({});
      setChartDataWL(null);
      setChartDataDischarge(null);
      setChartDataRain(null);
      setChartDataRainSum(null);
      return;
    }

    const BASE_YEAR = 2000;
    const rawData = data.data;

    // สำหรับตาราง (ใช้ timestamp จริง)
    const wlTable: { [year: string]: [number, number][] } = {};
    const dischargeTable: { [year: string]: [number, number][] } = {};
    const rainTable: { [year: string]: [number, number][] } = {};

    const wlSeriesMap = new Map<string, [number, number][]>();
    const dischargeSeriesMap = new Map<string, [number, number][]>();
    const rainSeriesMap = new Map<string, [number, number][]>();

    rawData.forEach((item: any) => {
      const datetime = new Date(item[dateField]);
      if (isNaN(datetime.getTime())) return;

      const originalYear = datetime.getFullYear().toString();
      const month = datetime.getMonth();
      const day = datetime.getDate();
      const hours = datetime.getHours();
      const minutes = datetime.getMinutes();
      const seconds = mode === "daily" ? Math.floor(Math.random() * 60) : datetime.getSeconds();

      const chartTimestamp = new Date(BASE_YEAR, month, day, hours, minutes, seconds).getTime();

      // ระดับน้ำ
      if (item.wl != null) {
        const value = parseFloat(item.wl);

        if (!wlTable[originalYear]) wlTable[originalYear] = [];
        wlTable[originalYear].push([datetime.getTime(), value]);

        // กราฟ
        if (!wlSeriesMap.has(originalYear)) wlSeriesMap.set(originalYear, []);
        wlSeriesMap.get(originalYear)!.push([chartTimestamp, value]);
      }

      // อัตราการไหล
      if (item.discharge != null) {
        const value = parseFloat(item.discharge);

        if (!dischargeTable[originalYear]) dischargeTable[originalYear] = [];
        dischargeTable[originalYear].push([datetime.getTime(), value]);

        if (!dischargeSeriesMap.has(originalYear)) dischargeSeriesMap.set(originalYear, []);
        dischargeSeriesMap.get(originalYear)!.push([chartTimestamp, value]);
      }

      // ปริมาณน้ำฝน
      if (item.rain_mm != null) {
        const value = parseFloat(item.rain_mm);

        if (!rainTable[originalYear]) rainTable[originalYear] = [];
        rainTable[originalYear].push([datetime.getTime(), value]);

        if (!rainSeriesMap.has(originalYear)) rainSeriesMap.set(originalYear, []);
        rainSeriesMap.get(originalYear)!.push([chartTimestamp, value]);
      }
    });

    // อัปเดตตาราง
    setWlGroupedData(wlTable);
    setDischargeGroupedData(dischargeTable);
    setRainGroupedData(rainTable);

    // ดึงปีทั้งหมด
    const years = Array.from(new Set([
      ...wlSeriesMap.keys(),
      ...dischargeSeriesMap.keys(),
      ...rainSeriesMap.keys(),
    ])).sort();

    // ฟังก์ชันสร้าง series สำหรับกราฟ
    const createSeries = (map: Map<string, [number, number][]>, prefix: string) =>
      years
        .filter(year => map.has(year))
        .map(year => ({
          name: `${prefix}ปี ${Number(year) + 543}`,
          type: "line" as const,
          data: map.get(year)!.sort((a, b) => a[0] - b[0]),
          marker: { enabled: false },
          lineWidth: 1.5,
        }));

    setChartDataWL({
      series: createSeries(wlSeriesMap, "ระดับน้ำ "),
    });

    const dischargeSeries = createSeries(dischargeSeriesMap, "อัตราการไหล ");
    setChartDataDischarge(dischargeSeries.length > 0 ? { series: dischargeSeries } : null);

    // กราฟปริมาณน้ำฝนรายช่วง (แท่ง) แยกตามปี
    const rainSeries = years
      .filter(year => rainSeriesMap.has(year))
      .map(year => ({
        name: `ปริมาณฝน ปี ${Number(year) + 543}`,
        type: "bar" as const,
        data: rainSeriesMap.get(year)!.sort((a, b) => a[0] - b[0]),
      }));
    setChartDataRain(rainSeries.length > 0 ? { series: rainSeries } : null);

    // กราฟปริมาณน้ำฝนสะสม (เส้น) สะสมแยกตามปี รีเซ็ตทุกต้นปี
    const rainSumSeries = years
      .filter(year => rainSeriesMap.has(year))
      .map(year => {
        let sum = 0;
        const sorted = [...rainSeriesMap.get(year)!].sort((a, b) => a[0] - b[0]);
        return {
          name: `ฝนสะสม ปี ${Number(year) + 543}`,
          type: "line" as const,
          data: sorted.map(([ts, v]) => {
            sum += v;
            return [ts, +sum.toFixed(2)] as [number, number];
          }),
          marker: { enabled: false },
          lineWidth: 1.5,
        };
      });
    setChartDataRainSum(rainSumSeries.length > 0 ? { series: rainSumSeries } : null);
  };

  // ปุ่มแสดงผล
  const handleShowData = async () => {
    if (!selectedStation) {
      setYearError("กรุณาเลือกสถานี");
      return;
    }
    if (!startYear || !endYear) {
      setYearError("กรุณาเลือกปีเริ่มต้นและปีสิ้นสุด");
      return;
    }

    const start = parseInt(startYear);
    const end = parseInt(endYear);

    if (start > end) {
      setYearError("ปีสิ้นสุดต้องไม่น้อยกว่าปีเริ่มต้น");
      return;
    }
    if (end - start > 5) {
      setYearError("เลือกได้สูงสุด 5 ปีเท่านั้น");
      return;
    }

    setYearError("");
    setLoading(true);

    try {
      await fetchTeleData(startYear, endYear);
      setIsSubmitted(true);
    } catch (err) {
      setYearError("เกิดข้อผิดพลาดในการโหลดข้อมูล");
    } finally {
      setLoading(false);
    }
  };



  const handleModeChange = (_: any, newMode: DataMode | null) => {
    if (newMode) setMode(newMode);
  };

  if (!stations.length) return <CenteredLoading />;

  const station = selectedStation ? stations.find(s => s.sta_code === selectedStation) : null;

  return (
    <Container component="main" sx={{ minWidth: "100%", py: 2 }}>
      <Grid container spacing={3}>
        {/* รูปสถานี */}
        <Grid size={{xs:12,md:5}}>

          <Box sx={{ display: "flex", justifyContent: "center" }}>
            <img
              src={station ? `${Path_URL}/images/tele/${station.sta_code}.jpg` : `${Path_URL}/images/images/default_img.png`}
              alt="Station"
              style={{
                width: "100%",
                height: "100%",
                objectFit: "cover",
                borderRadius: "10px",
                boxShadow: "0px 3px 6px rgba(0, 0, 0, 0.56)"
              }}
              onError={(e) => (e.currentTarget.src = `${Path_URL}/images/default_img.png`)}
            />
          </Box>
        </Grid>

        {/* ตัวเลือก */}
        <Grid size={{xs:12,md:7}}>
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

            <Grid size={{xs:12,md:5}}>
              <FormControl fullWidth>
                <InputLabel sx={{ fontFamily: "Prompt" }}>เลือกสถานี</InputLabel>
                <Select value={selectedStation || ""} label="เลือกสถานี" onChange={e => setSelectedStation(e.target.value)} sx={fontInfo}>
                  {stations.map(s => (
                    <MenuItem key={s.sta_code} value={s.sta_code}>
                      {s.sta_name} ({s.sta_code})
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>

            {/* ปีเริ่มต้น */}
            <Grid size={{xs:12,md:2}}>
              <FormControl fullWidth>
                <InputLabel sx={{ fontFamily: "Prompt" }}>ปีเริ่มต้น</InputLabel>
                <Select value={startYear} label="ปีเริ่มต้น" onChange={e => setStartYear(e.target.value)} sx={fontInfo}>
                  {availableYears
                    .filter(y => !endYear || (parseInt(y) <= parseInt(endYear) && parseInt(endYear) - parseInt(y) <= 5))
                    .map(y => (
                      <MenuItem key={y} value={y}>{+y + 543}</MenuItem>
                    ))}
                </Select>
              </FormControl>
            </Grid>

            {/* ปีสิ้นสุด */}
            <Grid size={{xs:12,md:2}}>
              <FormControl fullWidth>
                <InputLabel sx={{ fontFamily: "Prompt" }}>ปีสิ้นสุด</InputLabel>
                <Select value={endYear} label="ปีสิ้นสุด"  onChange={e => setEndYear(e.target.value)} sx={fontInfo}>
                  {availableYears
                    .filter(y => !startYear || (parseInt(y) >= parseInt(startYear) && parseInt(y) - parseInt(startYear) <= 5))
                    .map(y => (
                      <MenuItem key={y} value={y}>{+y + 543}</MenuItem>
                    ))}
                </Select>
              </FormControl>
            </Grid>

            <Grid size={{xs:12,md:3}}>
              <Button
                variant="contained"
                color="primary"
                fullWidth
                sx={{ height: "56px",...titleStyle }}
                onClick={handleShowData}
                disabled={loading}
              >
                {loading ? "กำลังโหลด..." : "แสดงผล"}
              </Button>
            </Grid>
          </Grid>

          {yearError && (
            <Typography color="error" sx={{ mt: 2,...textStyle, ml: 2 }}>
              {yearError}
            </Typography>
          )}

          {/* ข้อมูลสถานี */}
          {station && (
            <Grid size={{xs:12}} sx={{ mt: 3 }}>
              <Card>
                <CardHeader sx={HeaderCellStyle} title={`${station.sta_name} (${station.sta_code})`} />
                <Divider />
                <CardContent>
                  <Grid container spacing={2}>
                    <Grid size={{xs:6,sm:4}}><Typography sx={fontInfo}><strong>ตำบล:</strong> {station.tambon}</Typography></Grid>
                    <Grid size={{xs:6,sm:4}}><Typography sx={fontInfo}><strong>อำเภอ:</strong> {station.district}</Typography></Grid>
                    <Grid size={{xs:6,sm:4}}><Typography sx={fontInfo}><strong>จังหวัด:</strong> {station.province}</Typography></Grid>
                    <Grid size={{xs:6,sm:4}}><Typography sx={fontInfo}><strong>แม่น้ำ:</strong> {station.river}</Typography></Grid>
                    <Grid size={{xs:6,sm:4}}><Typography sx={fontInfo}><strong>Lat:</strong> {Number(station.lat).toFixed(3)}</Typography></Grid>
                    <Grid size={{xs:6,sm:4}}><Typography sx={fontInfo}><strong>Lon:</strong> {Number(station.long).toFixed(3)}</Typography></Grid>
                  </Grid>
                </CardContent>
              </Card>
            </Grid>
          )}
        </Grid>
      </Grid>

      <Divider sx={{ my: 4 }} />

      {/* แสดงผลเฉพาะเมื่อกดแสดงผล */}
      {isSubmitted && !yearError && chartDataWL && (
        <Box sx={{ mt: 4 }}>
          <Typography sx={{ fontWeight: "bold", ...titleStyle, mb: 3 }}>
            กราฟข้อมูลน้ำ ({mode === "daily" ? "รายวัน" : "รายชั่วโมง"}) สถานี{" "}
            <span style={{ color: "red" }}>{station?.sta_code}</span>
            {" "}ปี พ.ศ. {parseInt(startYear) + 543} - {parseInt(endYear) + 543}
          </Typography>

          <TeleChart data={chartDataWL} type="wl" sta_code={selectedStation ?? ""} sta_name={station.sta_name} mode={mode} isDark={isDark} />
          {chartDataDischarge && (
            <TeleChart data={chartDataDischarge} type="discharge" sta_code={selectedStation ?? ""} sta_name={station.sta_name} mode={mode} />
          )}
          {chartDataRain && (
            <TeleChart data={chartDataRain} type="rain" sta_code={selectedStation ?? ""} sta_name={station.sta_name} mode={mode} isDark={isDark} />
          )}
          {chartDataRainSum && (
            <TeleChart data={chartDataRainSum} type="rain_sum" sta_code={selectedStation ?? ""} sta_name={station.sta_name} mode={mode} isDark={isDark} />
          )}

          <TeleExportTable
            wlGroupedData={wlGroupedData}
            dischargeGroupedData={dischargeGroupedData}
            rain_mmGroupedData={rainGroupedData}
            mode={mode}
            sta_name={station.sta_name}
            sta_code={station.sta_code}
          />
        </Box>
      )}

      {!isSubmitted && selectedStation && (
        <Box sx={{ textAlign: "center", mt: 10 }}>
          <Typography sx={{ fontFamily: "Prompt", fontSize: "1.3rem", color: "#555" }}>
            กรุณาเลือกสถานี ช่วงปี และกดปุ่ม <strong style={{ color: "#01579b" }}>"แสดงผล"</strong>
          </Typography>
        </Box>
      )}
    </Container>
  );
};

export default DataTele;
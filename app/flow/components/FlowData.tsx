
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
} from "@mui/material";
import FlowChart from "@/components/data/FlowChartData";
import FlowExportTable from "@/components/data/FlowTableData";
import CenteredLoading from "@/components/layout/CenteredLoading";
import { API_URL, Path_URL } from "@/lib/utility";
import { titleStyle, textStyle } from "@/theme/style";
import { HeaderCellStyle } from '../../../theme/style';

type DataMode = "daily" | "hourly";

const fontInfo = {
  fontFamily: "Prompt",
  fontSize: { md: "1.1rem", xs: "0.9rem" },
};

const DataFlowCombined: React.FC<{ propsSelectedStation?: string }> = ({ propsSelectedStation }) => {
  const queryParams = new URLSearchParams(location.search);
  const stationFromURL = queryParams.get("station") || "T.10";

  const [mode, setMode] = useState<DataMode>("daily");
  const [stations, setStations] = useState<any[]>([]);
  const [selectedStation, setSelectedStation] = useState<string | null>(null);
  const [availableYears, setAvailableYears] = useState<string[]>([]);
  const [startYear, setStartYear] = useState<string>("");
  const [endYear, setEndYear] = useState<string>("");

  const [chartDataWL, setChartDataWL] = useState<any>(null);
  const [chartDataDischarge, setChartDataDischarge] = useState<any>(null);

  const [wlGroupedData, setWlGroupedData] = useState<{ [year: string]: [number, number][] }>({});
  const [dischargeGroupedData, setDischargeGroupedData] = useState<{ [year: string]: [number, number][] }>({});

  const [isSubmitted, setIsSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [yearError, setYearError] = useState<string>("");

  const [initialLoad, setInitialLoad] = useState(false);

  // ตั้งค่าสถานีเริ่มต้น
  useEffect(() => {
    setSelectedStation(propsSelectedStation || stationFromURL);
  }, [propsSelectedStation, stationFromURL]);

  useEffect(() => {
    if (!initialLoad && selectedStation && startYear && endYear) {
      fetchFlowData(startYear, endYear);
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
      setWlGroupedData({});
      setDischargeGroupedData({});
      setInitialLoad(false);
    }
  }, [selectedStation, mode]);

  // โหลดรายชื่อสถานี
  useEffect(() => {
    fetch(`${API_URL}/api/flow_info`)
      .then(r => r.json())
      .then(d => setStations(d.data || []))
      .catch(console.error);
  }, []);

  // ดึงปีที่มีข้อมูลตามโหมดทันทีเมื่อเปลี่ยนสถานี
  useEffect(() => {
    if (!selectedStation) return;
    const endpoint = mode === "daily" ? "flow_years" : "flow_hourly_years";
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

  const fetchFlowData = async (start: string, end: string) => {
    const endpoint = mode === "daily" ? "flow_data" : "flow_hourly_data";
    const dateField = mode === "daily" ? "date" : "datetime";

    const res = await fetch(`${API_URL}/api/${endpoint}/${selectedStation}?startYear=${start}&endYear=${end}`);
    const data = await res.json();

    if (!data?.data?.length) {
      setWlGroupedData({});
      setDischargeGroupedData({});
      setChartDataWL(null);
      setChartDataDischarge(null);
      return;
    }

    const BASE_YEAR = 2000;
    const rawData = data.data;

    // สำหรับตาราง (ใช้ timestamp จริง)
    const wlTable: { [year: string]: [number, number][] } = {};
    const dischargeTable: { [year: string]: [number, number][] } = {};

    // สำหรับกราฟ (ใช้ปี 2000)
    const wlSeriesMap = new Map<string, [number, number][]>();
    const dischargeSeriesMap = new Map<string, [number, number][]>();

    rawData.forEach((item: any) => {
      const date = new Date(item[dateField]);
      if (isNaN(date.getTime())) return;

      const originalYear = date.getFullYear().toString();
      const month = date.getMonth();
      const day = date.getDate();
      const hours = date.getHours();
      const minutes = date.getMinutes();
      const seconds = mode === "daily" ? Math.floor(Math.random() * 60) : date.getSeconds();

      const chartTimestamp = new Date(BASE_YEAR, month, day, hours, minutes, seconds).getTime();

      // ระดับน้ำ
      if (item.wl != null) {
        const value = parseFloat(item.wl);

        if (!wlTable[originalYear]) wlTable[originalYear] = [];
        wlTable[originalYear].push([date.getTime(), value]);

        // กราฟ
        if (!wlSeriesMap.has(originalYear)) wlSeriesMap.set(originalYear, []);
        wlSeriesMap.get(originalYear)!.push([chartTimestamp, value]);
      }

      // อัตราการไหล
      if (item.discharge != null) {
        const value = parseFloat(item.discharge);

        if (!dischargeTable[originalYear]) dischargeTable[originalYear] = [];
        dischargeTable[originalYear].push([date.getTime(), value]);

        if (!dischargeSeriesMap.has(originalYear)) dischargeSeriesMap.set(originalYear, []);
        dischargeSeriesMap.get(originalYear)!.push([chartTimestamp, value]);
      }
    });

    // อัปเดตตาราง
    setWlGroupedData(wlTable);
    setDischargeGroupedData(dischargeTable);

    // ดึงปีทั้งหมด
    const years = Array.from(new Set([...wlSeriesMap.keys(), ...dischargeSeriesMap.keys()])).sort();

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
      await fetchFlowData(startYear, endYear);
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
      {/* Toggle โหมด รายวัน/รายชั่วโมง */}
      <Box sx={{ display: "flex", justifyContent: "center", my: 3 }}>
        <ToggleButtonGroup
          value={mode}
          exclusive
          onChange={handleModeChange}
          color="primary"
          sx={{
            "& .MuiToggleButton-root": {
              py: 1.5,
              px: 4,
              fontSize: { xs: "1rem", sm: "1.2rem" },
              fontWeight: 600,
              fontFamily: "'Prompt', sans-serif",
              borderRadius: "12px !important",
            },
          }}
        >
          <ToggleButton value="daily">ข้อมูลรายวัน</ToggleButton>
          <ToggleButton value="hourly">ข้อมูลรายชั่วโมง</ToggleButton>
        </ToggleButtonGroup>
      </Box>

      <Grid container spacing={3}>
        {/* รูปสถานี */}
        <Grid size={{xs:12,md:4}}>
          <Box sx={{ display: "flex", justifyContent: "center" }}>
            <img
              src={station ? `${Path_URL}images/flow_station/${station.sta_code}.png` : `${Path_URL}images/default_img.png`}
              alt="Station"
              style={{
                width: "100%",
                height: "100%",
                objectFit: "cover",
                borderRadius: "10px",
                boxShadow: "0px 3px 6px rgba(0, 0, 0, 0.56)"
              }}
              onError={(e) => (e.currentTarget.src = `${Path_URL}images/default_img.png`)}
            />
          </Box>
        </Grid>

        {/* ตัวเลือก */}
        <Grid size={{xs:12,md:8}}>
          <Grid container spacing={2} alignItems="center">
            <Grid size={{xs:12,md:6}}>
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

            <Grid size={{xs:12,md:2}}>
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

          <FlowChart data={chartDataWL} type="wl" sta_code={selectedStation ?? ""} mode={mode} />
          {chartDataDischarge && (
            <FlowChart data={chartDataDischarge} type="discharge" sta_code={selectedStation ?? ""} mode={mode} />
          )}

          <FlowExportTable
            wlGroupedData={wlGroupedData}
            dischargeGroupedData={dischargeGroupedData}
            mode={mode}
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

export default DataFlowCombined;
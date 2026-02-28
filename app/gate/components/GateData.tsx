
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
  SelectChangeEvent,
  Button,
  useTheme,
} from "@mui/material";
import GateChart from "@/components/Data/GateChartData";
import GateExportTable from "@/components/Data/GateTableData";
import CenteredLoading from "@/components/Layout/CenteredLoading";
import { API_URL, Path_URL } from "@/lib/utility";
import { titleStyle, textStyle, HeaderCellStyle } from "@/theme/style";
import { fontInfo } from "@/theme/style";
import { useState, useEffect, useMemo } from "react";


interface DataGateStationProps {
    propsSelectedStation?: string;
  }

const DataGateStation: React.FC<DataGateStationProps> = ({propsSelectedStation}) => {
  const queryParams = new URLSearchParams(location.search);
  const stationFromURL = queryParams.get("station") || "Y.506";
  const theme = useTheme();
  const isDark = theme.palette.mode === "dark";
  const [stations, setStations] = useState<any[]>([]); // เก็บข้อมูลสถานี
  const [selectedStation, setSelectedStation] = useState<string | null>('Y.506'); // สถานีที่เลือก
  const [availableYears, setAvailableYears] = useState<string[]>([]);
  const [allAvailableYears, setAllAvailableYears] = useState<string[]>([]);
  const [startYear, setStartYear] = useState<string>("");
  const [endYear, setEndYear] = useState<string>("");
  const [chartData1, setChartData1] = useState<any>(null); // สำหรับ chartOptions
  const [chartData2, setChartData2] = useState<any>(null); // สำหรับ chartOptions2
  const [chartData3, setChartData3] = useState<any>(null); // สำหรับ chartOptions2
  const [, setLoading] = useState(false);
 
  const [wlUpperGroupedData, setWlUpperGroupedData] = useState<{ [year: string]: [number, number][] }>({});
  const [wlLowerGroupedData, setWlLowerGroupedData] = useState<{ [year: string]: [number, number][] }>({});
  const [dischargeGroupedData, setDischargeGroupedData] = useState<{ [year: string]: [number, number][] }>({});

  const [isSubmitted, setIsSubmitted] = useState(false);
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
        fetchGateData(startYear, endYear);
        setIsSubmitted(true);
        setInitialLoad(true); // ป้องกันไม่ให้ทำซ้ำ
      }
    }, [selectedStation, startYear, endYear, initialLoad]);
  

  // รีเซ็ตทุกอย่างเมื่อเปลี่ยนสถานี
  useEffect(() => {
    if (selectedStation) {
      setIsSubmitted(false);
      setYearError("");
      setStartYear("");
      setEndYear("");
      setAvailableYears([]);        // ล้างปี
      setAllAvailableYears([]);
      setChartData1(null);
      setChartData2(null);
      setChartData3(null);
      setWlUpperGroupedData({});
      setWlLowerGroupedData({});
      setDischargeGroupedData({});
      setInitialLoad(false);
    }
  }, [selectedStation]);

  // ดึงรายชื่อสถานี
  useEffect(() => {
    fetch(`${API_URL}/api/gate_info`)
      .then((res) => res.json())
      .then((data) => setStations(data.data))
      .catch((err) => console.error(err));
  }, []);

  useEffect(() => {
  if (selectedStation) {
    fetch(`${API_URL}/api/gate_years?sta_code=${selectedStation}`)
      .then((res) => res.json())
      .then((data) => {
        const years = (data.data || []).sort((a: string, b: string) => +a - +b);
        setAvailableYears(years);

        // ตั้งค่าเริ่มต้นเป็น 2 ปีล่าสุด (แต่ยังไม่โหลดข้อมูล)
        if (years.length > 0) {
          const end = years[years.length - 1];
          const start = years[years.length - 1] || end;
          setStartYear(start);
          setEndYear(end);
        }
      })
      .catch((err) => {
        console.error("Error fetching years:", err);
        setAvailableYears([]);
      });
  }
}, [selectedStation]);

  // ฟังก์ชันหลัก: กดปุ่มแสดงผล → ถึงจะโหลดทุกอย่าง
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
      await fetchGateData(startYear, endYear);
      setIsSubmitted(true);
    } catch (err) {
      setYearError("เกิดข้อผิดพลาดในการโหลดข้อมูล");
    } finally {
      setLoading(false);
    }
  };

  // ฟังก์ชันดึงข้อมูลกราฟ (แยกออกมาเพื่อ reuse)
  const fetchGateData = async (start: string, end: string) => {
    const apiUrl = `${API_URL}/api/gate_data/${selectedStation}?startYear=${start}&endYear=${end}`;
    const res = await fetch(apiUrl);
    const data = await res.json();

    if (!data || !Array.isArray(data.data)) return;

    const BASE_YEAR = 2000;
    const rawData = data.data;

    const groupByYear = (key: 'wl_upper' | 'wl_lower' | 'discharge') => {
      const grouped: { [year: string]: [number, number][] } = {};
      rawData.forEach((item: any) => {
        if (item[key] === null) return;
        const date = new Date(item.date);
        const year = date.getFullYear();
        const value = parseFloat(item[key]);
        const randomSeconds = Math.floor(Math.random() * 60);
        const newTimestamp = (date.getTime() - date.getSeconds() * 1000) + randomSeconds * 1000;

        if (!grouped[year]) grouped[year] = [];
        grouped[year].push([newTimestamp, value]);
      });
      return grouped;
    };

    const wlUpperGrouped = groupByYear('wl_upper');
    const wlLowerGrouped = groupByYear('wl_lower');
    const dischargeGrouped = groupByYear('discharge');

    setWlUpperGroupedData(wlUpperGrouped);
    setWlLowerGroupedData(wlLowerGrouped);
    setDischargeGroupedData(dischargeGrouped);

    const convertDate = (date: number) => {
      const d = new Date(date);
      const randomSeconds = Math.floor(Math.random() * 60);
      return new Date(BASE_YEAR, d.getMonth(), d.getDate(), d.getHours(), d.getMinutes(), randomSeconds).getTime();
    };

    const createSeries = (grouped: any, prefix: string) =>
      Object.entries(grouped).map(([year, points]: [string, any]) => ({
        name: `${prefix}ปี ${year}`,
        type: 'line',
        data: (points as [number, number][]).map(([t, v]) => [convertDate(t), v]).sort((a, b) => a[0] - b[0]),
      }));

    setChartData1({ series: createSeries(dischargeGrouped, "อัตราการไหลปี ") });
    setChartData2({ series: createSeries(wlUpperGrouped, "ระดับน้ำตอนบน ปี ") });
    setChartData3({ series: createSeries(wlLowerGrouped, "ระดับน้ำตอนล่าง ปี ") });

    const actualYears = Object.keys(dischargeGrouped).sort();
    setAllAvailableYears(actualYears);
  };

  const availableYearsTable = useMemo(() => {
        if (!allAvailableYears.length || !startYear || !endYear) return ["ทั้งหมด"];
      
        const filtered = allAvailableYears.filter(
          (y) => Number(y) >= Number(startYear) && Number(y) <= Number(endYear)
        );
        
        return ["ทั้งหมด", ...filtered];
      }, [allAvailableYears, startYear, endYear]);


  const handleStationSelect = (event: SelectChangeEvent<string>) => {
    console.log(event);  // เช็ค event ว่ามีหรือไม่
    setSelectedStation(event.target.value as string);
  };
  
  const handleStartYearChange = (event: SelectChangeEvent<string>) => {
    setStartYear(event.target.value);
  };
  
  const handleEndYearChange = (event: SelectChangeEvent<string>) => {
    setEndYear(event.target.value);
  };
  

  if (!stations.length) return <CenteredLoading />;

  // เลือกสถานีที่ผู้ใช้เลือกจาก dropdown
  const station = selectedStation ? stations.find((s) => s.sta_code === selectedStation) : null;
  return (
    <Container component="main" sx={{ minWidth: "100%" }}>
      <Grid container spacing={2}>
        {/* ซ้าย: รูปภาพของสถานี */}
        <Grid size={{ xs: 12, md: 4, sm: 12 }}>
          <Box sx={{ display: "flex", justifyContent: "center", alignItems: "center", height: "100%" }}>
            <img
              src={
                station
                  ? `${Path_URL}images/gate/${station.sta_code}.jpg`
                  : `${Path_URL}images/default_img.png`
              }
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
  
        {/* ขวา: รายละเอียดข้อมูลสถานีและกราฟ */}
        <Grid size={{ xs: 12, md: 8, sm: 12 }}>
          <Grid container spacing={3}>
            {/* Dropdown สถานี */}
            <Grid size={{xs:12,md:4.5}}>
              <FormControl fullWidth>
                <InputLabel sx={{ fontFamily: "Prompt" }}>เลือกสถานี</InputLabel>
                <Select value={selectedStation || ""} label="เลือกสถานี" onChange={handleStationSelect} sx={fontInfo}>
                  {stations.map((s: any) => (
                    <MenuItem key={s.sta_code} value={s.sta_code}>
                      {s.sta_name} ({s.sta_code})
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>

            {/* ปีเริ่มต้น */}
            <Grid size={{xs:12,md:2.5}}>
              <FormControl fullWidth>
                <InputLabel sx={{ fontFamily: "Prompt" }}>ปีเริ่มต้น</InputLabel>
                <Select value={startYear} label="ปีเริ่มต้น" onChange={handleStartYearChange} sx={fontInfo}>
                  {availableYears
                    .filter(y => !endYear || parseInt(y) >= parseInt(endYear) - 5)
                    .map(y => (
                      <MenuItem key={y} value={y}>{+y + 543}</MenuItem>
                    ))}
                </Select>
              </FormControl>
            </Grid>

            {/* ปีสิ้นสุด */}
            <Grid size={{xs:12,md:2.5}}>
              <FormControl fullWidth>
                <InputLabel sx={{ fontFamily: "Prompt" }}>ปีสิ้นสุด</InputLabel>
                <Select value={endYear} label="ปีสิ้นสุด" onChange={handleEndYearChange} sx={fontInfo}>
                  {availableYears
                    .filter((y) => {
                      if (!startYear) return true;
                      const start = parseInt(startYear);
                      const end = parseInt(y);
                      return end >= start && end - start <= 5;   // ต้องไม่เกิน 5 ปี และ end >= start
                    })
                    .map((y) => (
                      <MenuItem key={y} value={y}>{+y + 543}</MenuItem>
                    ))}
                </Select>
              </FormControl>
            </Grid>

            {/* ปุ่มแสดงผล */}
            <Grid size={{xs:12,md:2.5}}>
              <Button
                variant="contained"
                color="primary"
                fullWidth
                sx={{ height: "56px",...titleStyle }}
                onClick={handleShowData}
              >
                แสดงผล
              </Button>
            </Grid>


          {/* แสดงข้อผิดพลาด */}
          {yearError && (
            <Typography color="error" sx={{ width:"100%",textAlign:"center",mt: 2, ...textStyle }}>
              {yearError}
            </Typography>
          )}
  
            {/* ข้อมูลสถานี */}
            {station && (
              <Grid size={{ xs: 12 }}>
                <Card sx={{ marginTop: 2 }}>
                  <CardHeader
                    sx={HeaderCellStyle}
                    title={
                      <Typography sx={{ fontWeight: "bold", ...titleStyle }}>
                         {station.sta_name} ({station.sta_code})
                      </Typography>
                    }
                  />
                  <Divider />
                  <CardContent>
                    <Grid container spacing={2}>
                      <Grid size={{xs:6, sm:4}}><Typography sx={fontInfo}><strong>ตำบล:</strong> {station.tambon}</Typography></Grid>
                      <Grid size={{xs:6, sm:4}}><Typography sx={fontInfo}><strong>อำเภอ:</strong> {station.district}</Typography></Grid>
                      <Grid size={{xs:6, sm:4}}><Typography sx={fontInfo}><strong>จังหวัด:</strong> {station.province}</Typography></Grid>
                      <Grid size={{xs:6, sm:4}}><Typography sx={fontInfo}><strong>Latitude:</strong> {Number(station.lat).toFixed(3)}</Typography></Grid>
                      <Grid size={{xs:6, sm:4}}><Typography sx={fontInfo}><strong>Longitude:</strong> {Number(station.long).toFixed(3)}</Typography></Grid>
                    </Grid>
                  </CardContent>
                </Card>
              </Grid>
            )}
          </Grid>
        </Grid>
      </Grid>

      <Divider sx={{ my: 3 }} />
      {/* แสดงผลเฉพาะเมื่อกดปุ่ม "แสดงผล" และไม่มี error */}
      {isSubmitted && !yearError && chartData1 && chartData2 && chartData3 && (
        <Box sx={{ marginTop: 4 }}>
          <Typography sx={{ fontWeight: "bold", ...titleStyle, mb: 3 }}>
            กราฟแสดงสถิติข้อมูลของสถานี{" "}
            <span style={{ color: "red" }}>{station?.sta_code}</span>
            {" "}ปี พ.ศ. {parseInt(startYear) + 543} - {parseInt(endYear) + 543}
          </Typography>

          <GateChart data={chartData2} isDark={isDark} type="wl_upper" sta_code={selectedStation ?? ''} />
          <GateChart data={chartData3} isDark={isDark} type="wl_lower" sta_code={selectedStation ?? ''} />
          <GateChart data={chartData1} isDark={isDark} type="discharge" />

          <GateExportTable
            dischargeGroupedData={dischargeGroupedData}
            wlUpperGroupedData={wlUpperGroupedData}
            wlLowerGroupedData={wlLowerGroupedData}
            availableYears={availableYearsTable}
          />
        </Box>
      )}

      {/* ข้อความเมื่อยังไม่กดแสดงผล */}
      {!isSubmitted && selectedStation && (
        <Box sx={{ textAlign: "center", mt: 10 }}>
          <Typography sx={{ fontFamily: "Prompt", fontSize: "1.3rem", color: "#555" }}>
            กรุณาเลือกสถานี ช่วงปี และกดปุ่ม <strong style={{ color: "#01579b" }}>"แสดงผล"</strong>
          </Typography>
        </Box>
      )}
    </Container>
  );
}
  
export default DataGateStation;

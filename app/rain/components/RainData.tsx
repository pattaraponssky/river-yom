import React, { useState, useEffect, useMemo } from "react";
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
} from "@mui/material";
import RainChart from "@/components/data/RainChartData";
import RainExportTable from "@/components/data/RainTableData";
import CenteredLoading from "@/components/layout/CenteredLoading";
import { API_URL, Path_URL } from "@/lib/utility";
import { fontInfo, titleStyle, textStyle, HeaderCellStyle } from "@/theme/style";

interface DataRainStationProps {
    propsSelectedStation?: string;
  }

const DataRainStation: React.FC<DataRainStationProps> = ({ propsSelectedStation }) => {
  const queryParams = new URLSearchParams(location.search);
  const stationFromURL = queryParams.get("station") || "690151";

  const [stations, setStations] = useState<any[]>([]);
  const [selectedStation, setSelectedStation] = useState<string | null>(null);
  const [availableYears, setAvailableYears] = useState<string[]>([]);
  const [startYear, setStartYear] = useState<string>("");
  const [endYear, setEndYear] = useState<string>("");

  const [chartData1, setChartData1] = useState<any>(null);
  const [chartData2, setChartData2] = useState<any>(null);
  const [rainGroupedData, setRainGroupedData] = useState<{ [year: string]: [number, number][] }>({});
  const [allAvailableYears, setAllAvailableYears] = useState<string[]>([]);

  const [isSubmitted, setIsSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [yearError, setYearError] = useState<string>("");

  const [initialLoad, setInitialLoad] = useState(false);
  // ตั้งค่าสถานีเริ่มต้น
  useEffect(() => {
    if (propsSelectedStation) {
      setSelectedStation(propsSelectedStation);
    } else {
      setSelectedStation(stationFromURL);
    }
  }, [propsSelectedStation, stationFromURL]);

  useEffect(() => {
    if (!initialLoad && selectedStation && startYear && endYear) {
      fetchRainData(startYear, endYear);
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
      setAvailableYears([]);
      setAllAvailableYears([]);
      setChartData1(null);
      setChartData2(null);
      setRainGroupedData({});
      setInitialLoad(false);
    }
  }, [selectedStation]);

  // ดึงข้อมูลสถานีฝน
  useEffect(() => {
    fetch(`${API_URL}/api/rain_info`)
      .then(res => res.json())
      .then(data => setStations(data.data))
      .catch(err => console.error(err));
  }, []);

  // ดึงปีที่มีข้อมูลทันทีเมื่อเปลี่ยนสถานี
  useEffect(() => {
    if (selectedStation) {
      fetch(`${API_URL}/api/rain_years?sta_code=${selectedStation}`)
        .then(res => res.json())
        .then(data => {
          const years = (data.data || []).sort((a: string, b: string) => +a - +b);
          setAvailableYears(years);

          if (years.length > 0) {
            const end = years[years.length - 1];
            const start = years[years.length - 1] || end;
            setStartYear(start);
            setEndYear(end);
          }
        })
        .catch(err => {
          console.error("Error fetching rain years:", err);
          setAvailableYears([]);
        });
    }
  }, [selectedStation]);

  // ฟังก์ชันโหลดข้อมูลฝน (เรียกเฉพาะตอนกดแสดงผล)
  const fetchRainData = async (start: string, end: string) => {
    const apiUrl = `${API_URL}/api/rain_data/${selectedStation}?startYear=${start}&endYear=${end}`;
    const res = await fetch(apiUrl);
    const data = await res.json();

    if (!data || !Array.isArray(data.data)) return;

    const BASE_YEAR = 2000;
    const rawData = data.data;

    const groupByYear = (): { [year: string]: [number, number][] } => {
      const grouped: { [year: string]: [number, number][] } = {};
      rawData.forEach((item: any) => {
        if (item.rain_mm === null) return;
        const date = new Date(item.date);
        const year = date.getFullYear();
        const value = parseFloat(item.rain_mm);

        const randomSeconds = Math.floor(Math.random() * 60);
        const newTimestamp = (date.getTime() - (date.getSeconds() * 1000)) + (randomSeconds * 1000);

        if (!grouped[year]) grouped[year] = [];
        grouped[year].push([newTimestamp, value]);
      });
      return grouped;
    };

    const rainGrouped = groupByYear();
    setRainGroupedData(rainGrouped);

    const convertDate = (date: number) => {
      const d = new Date(date);
      const randomSeconds = Math.floor(Math.random() * 60);
      return new Date(BASE_YEAR, d.getMonth(), d.getDate(), d.getHours(), d.getMinutes(), randomSeconds).getTime();
    };

    // กราฟแท่งฝนรายวัน
    const rainSeries = Object.entries(rainGrouped).map(([year, data]) => ({
      name: `พ.ศ. ${Number(year) + 543}`,
      type: 'bar' as const,
      data: (data as [number, number][]).map(([t, v]) => [convertDate(t), v]).sort((a, b) => a[0] - b[0]),
    }));

    // กราฟสะสม
    const cumulativeGrouped: Record<string, { time: number; value: number }[]> = {};
    rawData.forEach((item: any) => {
      if (item.rain_mm === null) return;
      const d = new Date(item.date);
      const buddhistYear = (d.getFullYear() + 543).toString();
      const value = parseFloat(item.rain_mm);
      const normalizedTime = new Date(BASE_YEAR, d.getMonth(), d.getDate()).getTime();

      if (!cumulativeGrouped[buddhistYear]) cumulativeGrouped[buddhistYear] = [];
      cumulativeGrouped[buddhistYear].push({ time: normalizedTime, value });
    });

    const cumulativeSeries = Object.entries(cumulativeGrouped).map(([year, entries]) => {
      let sum = 0;
      const data = entries
        .sort((a, b) => a.time - b.time)
        .map(({ time, value }) => {
          sum += value;
          return [time, parseFloat(sum.toFixed(2))] as [number, number];
        });

      return { name: `พ.ศ. ${year}`, type: 'line' as const, data };
    });

    setChartData1({ series: rainSeries });
    setChartData2({ series: cumulativeSeries });

    const years = Object.keys(rainGrouped).sort();
    setAllAvailableYears(years);
  };

  // ปุ่มแสดงผล
  const handleShowData = async () => {
    if (!selectedStation) {
      setYearError("กรุณาเลือกสถานีฝน");
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
      await fetchRainData(startYear, endYear);
      setIsSubmitted(true);
    } catch (err) {
      setYearError("เกิดข้อผิดพลาดในการโหลดข้อมูล");
    } finally {
      setLoading(false);
    }
  };

  const availableYearsTable = useMemo(() => {
      if (!allAvailableYears.length || !startYear || !endYear) return ["ทั้งหมด"];
    
      const filtered = allAvailableYears.filter(
        (y) => Number(y) >= Number(startYear) && Number(y) <= Number(endYear)
      );
      
      return ["ทั้งหมด", ...filtered];
    }, [allAvailableYears, startYear, endYear]);
  
  
  const handleStationSelect = (event: SelectChangeEvent<string>) => {
    setSelectedStation(event.target.value as string);
  };
  
  const handleStartYearChange = (event: SelectChangeEvent<string>) => {
    setStartYear(event.target.value);
  };
  
  const handleEndYearChange = (event: SelectChangeEvent<string>) => {
    setEndYear(event.target.value);
  };
  
  // ถ้ายังไม่ได้รับข้อมูลจาก API ให้แสดงข้อความ Loading
  if (!stations.length) return <CenteredLoading />;

  // เลือกสถานีที่ผู้ใช้เลือกจาก dropdown
  const station = selectedStation ? stations.find((s) => s.sta_code === selectedStation) : null;

  return (
    <Container component="main" sx={{ minWidth: "100%" }}>
      <Grid container spacing={2}>
        {/* ซ้าย: รูปภาพของสถานี */}
        <Grid size={{xs:12, sm:12, md:4}}>
          <Box sx={{ display: "flex", justifyContent: "center", alignItems: "center", height: "100%" }}>
            <img
              src={
                station
                  ? `${Path_URL}images/rain_station/${station.sta_code}.png`
                  : `${Path_URL}images/rain_station/${station.sta_code}.jpg`
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
        <Grid size={{xs:12, sm:12, md:8}}>
          <Grid container spacing={3} alignItems="center">
            <Grid size={{xs:12, sm:12, md:4.5}}>
              <FormControl fullWidth>
                <InputLabel sx={{ fontFamily: "Prompt" }}>เลือกสถานีฝน</InputLabel>
                <Select value={selectedStation || ""} label="เลือกสถานีฝน" onChange={handleStationSelect} sx={fontInfo}>
                  {stations.map((s: any) => (
                    <MenuItem key={s.sta_code} value={s.sta_code}>
                      {s.name} ({s.sta_code})
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>

            {/* ปีเริ่มต้น - จำกัด 5 ปี */}
            <Grid size={{xs:12, sm:12, md:2.5}}>
              <FormControl fullWidth>
                <InputLabel sx={{ fontFamily: "Prompt" }}>ปีเริ่มต้น</InputLabel>
                <Select value={startYear} label="ปีเริ่มต้น" onChange={handleStartYearChange} sx={fontInfo}>
                  {availableYears
                    .filter(y => !endYear || (parseInt(y) <= parseInt(endYear) && parseInt(endYear) - parseInt(y) <= 5))
                    .map(y => (
                      <MenuItem key={y} value={y}>{+y + 543}</MenuItem>
                    ))}
                </Select>
              </FormControl>
            </Grid>

            {/* ปีสิ้นสุด - จำกัด 5 ปี */}
            <Grid size={{xs:12, sm:12, md:2.5}}>
              <FormControl fullWidth>
                <InputLabel sx={{ fontFamily: "Prompt" }}>ปีสิ้นสุด</InputLabel>
                <Select value={endYear} label="ปีสิ้นสุด" onChange={handleEndYearChange} sx={fontInfo}>
                  {availableYears
                    .filter(y => !startYear || (parseInt(y) >= parseInt(startYear) && parseInt(y) - parseInt(startYear) <= 5))
                    .map(y => (
                      <MenuItem key={y} value={y}>{+y + 543}</MenuItem>
                    ))}
                </Select>
              </FormControl>
            </Grid>

            <Grid size={{xs:12, sm:12, md:2.5}}>
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
              <Typography color="error" sx={{ mt: 2, ...textStyle, ml: 2 }}>
                {yearError}
              </Typography>
            )}
            </Grid>
           
  
            {/* ข้อมูลสถานี */}
            {station && (
              <Grid size={{xs:12}}>
                <Card sx={{ marginTop: 2 }}>
                  <CardHeader
                    sx={HeaderCellStyle}
                    title={
                      <Typography sx={{ fontWeight: "bold", ...titleStyle }}>
                        {station.name} ({station.sta_code})
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
                      <Grid size={{xs:6, sm:4}}><Typography sx={fontInfo}><strong>หน่วยงาน:</strong> {station.owner}</Typography></Grid>
                    </Grid>
                  </CardContent>
                </Card>
              </Grid>
            )}
          </Grid>
        </Grid>
            
      <Divider sx={{ my: 3 }} />
        {isSubmitted && !yearError && chartData1 && chartData2 && (
          <Box sx={{ mt: 4 }}>
            <Typography sx={{ fontWeight: "bold", ...titleStyle, mb: 3 }}>
              กราฟปริมาณฝนสถานี <span style={{ color: "red" }}>{station?.sta_code} - {station?.name}</span>
              {" "}ปี พ.ศ. {parseInt(startYear) + 543} - {parseInt(endYear) + 543}
            </Typography>

            <RainChart data={chartData1} type="rain" />
            <RainChart data={chartData2} type="rain_sum" />

            <RainExportTable
              rain_mmGroupedData={rainGroupedData}
              availableYears={availableYearsTable}
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
}
  
export default DataRainStation;

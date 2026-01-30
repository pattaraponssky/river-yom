

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
  useTheme,
} from "@mui/material";
import ReservoirChart from "@/components/data/ReservoirChartData";
import ReservoirExportTable from "@/components/data/ReservoirTableData";
import CenteredLoading from "@/components/layout/CenteredLoading";
import { API_URL, Path_URL } from "@/lib/utility";
import { fontInfo, titleStyle, textStyle, HeaderCellStyle } from "@/theme/style";

interface DataReservoirStationProps {
    propsSelectedStation?: string;
  }

const DataReservoirStation: React.FC<DataReservoirStationProps> = ({ propsSelectedStation }) => {
  const queryParams = new URLSearchParams(location.search);
  const stationFromURL = queryParams.get("station") || "ks";
  const theme = useTheme();
  const isDark = theme.palette.mode === "dark";

  const [stations, setStations] = useState<any[]>([]);
  const [selectedStation, setSelectedStation] = useState<string | null>(null);
  const [availableYears, setAvailableYears] = useState<string[]>([]);
  const [startYear, setStartYear] = useState<string>("");
  const [endYear, setEndYear] = useState<string>("");

  const [chartData1, setChartData1] = useState<any>(null);
  const [chartData2, setChartData2] = useState<any>(null);
  const [chartData3, setChartData3] = useState<any>(null);

  const [volumeGroupedData, setVolumeGroupedData] = useState<{ [year: string]: [number, number | null][] }>({});
  const [inflowGroupedData, setInflowGroupedData] = useState<{ [year: string]: [number, number | null][] }>({});
  const [outflowGroupedData, setOutflowGroupedData] = useState<{ [year: string]: [number, number | null][] }>({});
  const [allAvailableYears, setAllAvailableYears] = useState<string[]>([]);

  const [isSubmitted, setIsSubmitted] = useState(false);
  const [, setLoading] = useState(false);
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
      fetchReservoirData(startYear, endYear);
      setIsSubmitted(true);
      setInitialLoad(true); // ป้องกันไม่ให้ทำซ้ำ
    }
  }, [selectedStation, startYear, endYear, initialLoad]);

  // รีเซ็ตเมื่อเปลี่ยนสถานี
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
      setChartData3(null);
      setVolumeGroupedData({});
      setInflowGroupedData({});
      setOutflowGroupedData({});
      setInitialLoad(false);
    }
  }, [selectedStation]);

  // ดึงรายชื่ออ่างเก็บน้ำ
  useEffect(() => {
    fetch(`${API_URL}/api/reservoir_info`)
      .then(res => res.json())
      .then(data => setStations(data.data))
      .catch(err => console.error(err));
  }, []);

  // ดึงปีที่มีข้อมูลทันทีเมื่อเปลี่ยนสถานี (ให้ dropdown ปีใช้งานได้ทันที)
  useEffect(() => {
    if (selectedStation) {
      fetch(`${API_URL}/api/reservoir_years?res_code=${selectedStation}`)
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
          console.error("Error fetching years:", err);
          setAvailableYears([]);
        });
    }
  }, [selectedStation]);


  // ฟังก์ชันโหลดข้อมูล (เรียกเฉพาะตอนกดปุ่มแสดงผล)
  const fetchReservoirData = async (start: string, end: string) => {
    const apiUrl = `${API_URL}/api/reservoir_data/${selectedStation}?startYear=${start}&endYear=${end}`;
    const res = await fetch(apiUrl);
    const data = await res.json();

    if (!data || !Array.isArray(data.data)) return;

    const BASE_YEAR = 2000;
    const rawData = data.data;
    

    const groupByYear = (key: 'inflow' | 'outflow' | 'volume') => {
      const grouped: { [year: string]: [number, number | null][] } = {};
      rawData.forEach((item: any) => {
        // const rawValue = sanitizeValue(item[key]);
        const rawValue = (item[key]);
        const date = new Date(item.date);
        const year = date.getFullYear();

        const timestamp = date.getTime();

        if (!grouped[year]) grouped[year] = [];
        grouped[year].push([timestamp, rawValue]);
      });
      return grouped;
    };

    const volumeGrouped = groupByYear('volume');
    const inflowGrouped = groupByYear('inflow');
    const outflowGrouped = groupByYear('outflow');

    setVolumeGroupedData(volumeGrouped);
    setInflowGroupedData(inflowGrouped);
    setOutflowGroupedData(outflowGrouped);

    const convertDate = (date: number) => {
      const d = new Date(date);
      const randomSeconds = Math.floor(Math.random() * 60);
      return new Date(BASE_YEAR, d.getMonth(), d.getDate(), d.getHours(), d.getMinutes(), randomSeconds).getTime();
    };

    const createSeries = (grouped: any) =>
      Object.entries(grouped).map(([year, points]: [string, any]) => ({
        name: `พ.ศ. ${Number(year) + 543}`,
        type: 'line',
        data: (points as [number, number][]).map(([t, v]) => [convertDate(t), v]).sort((a, b) => a[0] - b[0]),
      }));

    setChartData1({ series: createSeries(volumeGrouped) });
    setChartData2({ series: createSeries(inflowGrouped) });
    setChartData3({ series: createSeries(outflowGrouped) });

    const years = Object.keys(volumeGrouped).sort();
    setAllAvailableYears(years);
  };

  const handleShowData = async () => {
    if (!selectedStation) {
      setYearError("กรุณาเลือกอ่างเก็บน้ำ");
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
      await fetchReservoirData(startYear, endYear);
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

  const handleStationSelect = (e: SelectChangeEvent<string>) => {
    setSelectedStation(e.target.value as string);
  };

  const handleStartYearChange = (e: SelectChangeEvent<string>) => {
    setStartYear(e.target.value);
  };

  const handleEndYearChange = (e: SelectChangeEvent<string>) => {
    setEndYear(e.target.value);
  };

  if (!stations.length) return <CenteredLoading />;

  const station = selectedStation ? stations.find(s => s.res_code === selectedStation) : null;
  return (
    <Container component="main" sx={{ minWidth: "100%" }}>
      <Grid container spacing={2}>
        {/* ซ้าย: รูปภาพของอ่างเก็บน้ำ */}
        <Grid size={{xs:12, sm:12, md:4}}>
          <Box sx={{ display: "flex", justifyContent: "center", alignItems: "center", height: "100%" }}>
            <img
              src={
                station
                  ? `${Path_URL}images/reservoir/${station.res_code}.jpg`
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
  
        {/* ขวา: รายละเอียดข้อมูลอ่างเก็บน้ำและกราฟ */}
        <Grid size={{xs:12, sm:12, md:8}}>
          <Grid container spacing={3}>
            {/* Dropdown สถานี */}
            <Grid size={{xs:12, sm:12, md:4.5}}>
               <FormControl fullWidth>
                <InputLabel sx={{ fontFamily: "Prompt" }}>เลือกอ่างเก็บน้ำ</InputLabel>
                <Select value={selectedStation !== null ? String(selectedStation) : ""} label="เลือกอ่างเก็บน้ำ" onChange={handleStationSelect}  sx={fontInfo}>
                  {stations.map((dam: any) => (
                    <MenuItem key={dam.res_code} value={dam.res_code} sx={fontInfo}>
                      อ่างเก็บน้ำ{dam.res_name}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>

            {/* ปีเริ่มต้น */}
            <Grid size={{xs:12, sm:12, md:2.5}}>
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
            <Grid size={{xs:12, sm:12, md:2.5}}>
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
            <Grid size={{xs:12, sm:12, md:2.5}}>
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
  
            {/* ข้อมูลอ่างเก็บน้ำ */}
            {station && (
              <Grid size={{xs:12}}>
                <Card>
                  <CardHeader
                    sx={HeaderCellStyle}
                    title={
                      <Typography sx={{ fontWeight: "bold", ...titleStyle }}>
                        อ่างเก็บน้ำ{station.res_name} ({station.rid_code})
                      </Typography>
                    }
                  />
                  <Divider />
                  <CardContent>
                    <Grid container spacing={2}>
                      <Grid size={{xs:6,sm:4}}><Typography sx={fontInfo}><strong>ตำบล:</strong> {station.tambon || '-'}</Typography></Grid>
                      <Grid size={{xs:6,sm:4}}><Typography sx={fontInfo}><strong>อำเภอ:</strong> {station.district || '-'}</Typography></Grid>
                      <Grid size={{xs:6,sm:4}}><Typography sx={fontInfo}><strong>จังหวัด:</strong> {station.province || '-'}</Typography></Grid>
                      <Grid size={{xs:6,sm:4}}><Typography sx={fontInfo}><strong>Latitude:</strong> {Number(station.lat || '-').toFixed(3)}</Typography></Grid>
                      <Grid size={{xs:6,sm:4}}><Typography sx={fontInfo}><strong>Longitude:</strong> {Number(station.long || '-').toFixed(3)}</Typography></Grid>
                      <Grid size={{xs:6,sm:4}}><Typography sx={fontInfo}><strong>ขนาดอ่างเก็บน้ำฯ:</strong> {station.size || '-'}</Typography></Grid>
                      <Grid size={{xs:6,sm:4}}><Typography sx={fontInfo}><strong>หน่วยงานเจ้าของ:</strong> {station.owner || '-'}</Typography></Grid>
                      <Grid size={{xs:6,sm:4}}><Typography sx={fontInfo}><strong>พื้นที่รับน้ำ:</strong> {station.da_km2 || '-'} ตร.กม. </Typography></Grid>
                      <Grid size={{xs:6,sm:4}}><Typography sx={fontInfo}><strong>เก็บกักสูงสุด:</strong> {station.maxvol || '-'} ล้าน ลบ.ม.</Typography></Grid>
                      <Grid size={{xs:6,sm:4}}><Typography sx={fontInfo}><strong>เก็บกักปกติ:</strong> {station.nhvol || '-'} ล้าน ลบ.ม.</Typography></Grid>
                      <Grid size={{xs:6,sm:4}}><Typography sx={fontInfo}><strong>เก็บกักต่ำสุด:</strong> {station.minvol || '-'} ล้าน ลบ.ม.</Typography></Grid>
                      <Grid size={{xs:6,sm:4}}><Typography sx={fontInfo}><strong>น้ำไหลเข้าอ่างรายปีเฉลี่ย:</strong> {station.inflow_avg } ล้าน ลบ.ม.</Typography></Grid>
                    </Grid>
                  </CardContent>
                </Card>
              </Grid>
            )}
          </Grid>
        </Grid>
      </Grid>
  
      <Divider sx={{ my: 3 }} />
        {isSubmitted && !yearError && chartData1 && chartData2 && chartData3 && (
        <Box sx={{ marginTop: 4 }}>
          <Typography sx={{ fontWeight: "bold", ...titleStyle, mb: 3 }}>
            กราฟแสดงสถิติข้อมูลของสถานี{" "}
            <span style={{ color: "red" }}>{station?.sta_code}</span>
            {" "}ปี พ.ศ. {parseInt(startYear) + 543} - {parseInt(endYear) + 543}
          </Typography>

          <ReservoirChart data={chartData1} type="main" resCode={selectedStation ?? 'ks'} isDark={isDark}/>
          <ReservoirChart data={chartData2} type="inflow" isDark={isDark}/>
          <ReservoirChart data={chartData3} type="outflow" isDark={isDark}/>

          <ReservoirExportTable
            volumeGroupedData={volumeGroupedData}
            inflowGroupedData={inflowGroupedData}
            outflowGroupedData={outflowGroupedData}
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
  
export default DataReservoirStation;


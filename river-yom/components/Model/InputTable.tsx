import { useState, useEffect, useCallback } from "react";
import {
  Table, TableHead, TableBody, TableCell, TableRow,
  TextField, Button, Typography,
  CircularProgress,
  Box,
  Divider,
  Paper,
  Stack,
} from "@mui/material";
import { BeachAccess, WaterDrop } from "@mui/icons-material";
import axios from "axios";
import { API_URL, Model_URL } from "@/lib/utility";

// กำหนด Endpoint สำหรับ API ใหม่
const MODEL_INPUT_API = `${API_URL}/api/model_input_data`;
const UPDATE_FROM_MAIN_API = `${API_URL}/api/model_input_data/update-from-main`; // Endpoint ใหม่

interface ModelInputItem {
  sta_code: string;
  data_type: string;
  date: string;
  value: number | string;
}

const defaultRows = [
  // { station_id: '390220', name: "ศูนย์อุทกวิทยาและบริหารน้ำภาคเหนือตอนล่าง", type: "rain_rid", values: Array(7).fill(0) },
  // { station_id: 'KRMT', name: "ทต.บ้านโตนด", type: "rain_rid", values: Array(7).fill(0) },
  // { station_id: 'LKBU', name: "อบต.ลานกระบือ", type: "rain_rid", values: Array(7).fill(0) },
  // { station_id: 'YOM007', name: "กงไกรลาศ", type: "rain_rid", values: Array(7).fill(0) },
  // { station_id: 'YOM008', name: "บางระกำ", type: "rain_rid", values: Array(7).fill(0) },
  // { station_id: '380012', name: "สกษ.พิจิตร", type: "rain_rid", values: Array(7).fill(0) },
  { station_id: '120160', name: "P.7A", type: "rain_rid", values: Array(7).fill(0) },
  { station_id: 'tng', name: "ปตร.ท่านางงาม", type: "rain_rid", values: Array(8).fill(0) },
  { station_id: 'wst', name: "ปตร.วังสะตือ", type: "rain_rid", values: Array(8).fill(0) },
  { station_id: 'YR.01', name: "สะพานชุมแสงสงคราม", type: "rain_rid", values: Array(8).fill(0) },
  { station_id: 'YR.02', name: "สะพานบ้านห้วงกระได", type: "rain_rid", values: Array(8).fill(0) },
  { station_id: 'YR.03', name: "สะพานวัดทุ่งอ้ายโห้", type: "rain_rid", values: Array(8).fill(0) },
  { station_id: 'YR.04', name: "สะพานข้ามคลองกรุงกรัก", type: "rain_rid", values: Array(8).fill(0) },
  { station_id: 'YR.05', name: "สะพานท่านางงาม", type: "rain_rid", values: Array(8).fill(0) },
  { station_id: 'YR.06', name: "สะพานข้ามคลองห้วยคต", type: "rain_rid", values: Array(8).fill(0) },

  { station_id: 'tng', name: "ปตร.ท่านางงาม", type: "flow", values: Array(8).fill(0) },
  { station_id: 'wst', name: "ปตร.วังสะตือ", type: "flow", values: Array(8).fill(0) },
  { station_id: 'Y.15', name: "บ้านกง", type: "flow", values: Array(8).fill(0) },
  { station_id: 'Y.16', name: "บางระกำ", type: "flow", values: Array(8).fill(0) },
  { station_id: 'Y.17', name: "Y.17", type: "flow", values: Array(8).fill(0) },
  { station_id: 'Y.4', name: "ในเมือง", type: "flow", values: Array(8).fill(0) },
  { station_id: 'Y.50', name: "บ้านท่านางงาม", type: "flow", values: Array(8).fill(0) },
  { station_id: 'Y.51', name: "Y.51", type: "flow", values: Array(8).fill(0) },
  { station_id: 'Y.64', name: "บางระกำ", type: "flow", values: Array(8).fill(0) },
];

const HeaderCellStyle = {
  position: "sticky",
  top: 0,
  zIndex: 2,
  border: "1px solid #ddd",
  fontFamily: "Prompt",
  fontWeight: "bold",
  textAlign: "center",
  backgroundColor: "rgb(1, 87, 155)",
  color: "white",
  fontSize: { xs: "0.8rem", sm: "0.8rem", md: "0.9rem" },
  whiteSpace: "nowrap",
};

const getCellStyle = (index: number, isError: boolean) => ({
  padding: { xs: "3px", md: "5px" },
  backgroundColor: isError ? '#FF7C80' : (index % 2 === 0 ? '#FAFAFA' : '#FFF'),
  textAlign: "center",
  fontFamily: "Prompt",
  fontSize: { xs: "0.75rem", sm: "0.8rem", md: "0.9rem" },
  whiteSpace: "nowrap",
});

// Helper function to get dates in YYYY-MM-DD format
const getDates = (startOffset: number, endOffset: number) => {
    const dates: string[] = [];
    const today = new Date();
    for (let i = startOffset; i <= endOffset; i++) {
        const d = new Date(today);
        d.setDate(d.getDate() + i);
        dates.push(d.toISOString().split('T')[0]);
    }
    return dates;
};

const generateDates = (startDayOffset: number, endDayOffset: number) => {
    const dates: string[] = [];
    const today = new Date();

    for (let i = startDayOffset; i <= endDayOffset; i++) {
      const d = new Date(today);
      d.setDate(d.getDate() + i);
      const formatted = d.toLocaleDateString("th-TH", {
        day: "2-digit",
        month: "short",
        year: "2-digit",
      });
      dates.push(formatted);
    }
    return dates;
  };

export default function RainInputTable() {
  const [rows, setRows] = useState(defaultRows);
  const [messages, setMessages] = useState<{ [key: string]: string }>({});
  const [buttonLoading, setButtonLoading] = useState<{ [key: string]: boolean }>({});
  const [initialDataLoading, setInitialDataLoading] = useState(true);
  const [rainDataLoaded, setRainDataLoaded] = useState(false);
  const [flowDataLoaded, setFlowDataLoaded] = useState(false);

  // Coefficients for SB-XX calculations (ไม่เปลี่ยนแปลง)
  const sbCoefficients = {
    'SB-01': { '690151': 0.008663, '690171': 0.100290, '040052': 0.153813, '040062': 0.737233 },
    'SB-02': { '690151': 0.132497, '690171': 0.867503 },
    'SB-03': { '690171': 0.397491, '040052': 0.602509 },
    'SB-04': { '690171': 0.994784, '040052': 0.005216 },
    'SB-05': { '690171': 0.096386, '040052': 0.893483, '040062': 0.010130 },
  };

  const cardData = [
    { title: "1. ดาวน์โหลดกริดฝนพยากรณ์ (กรมอุตุนิยมวิทยา)", description: "ดาวน์โหลดข้อมูลกริดฝนพยากรณ์ล่าสุดเพื่อใช้เป็นข้อมูลนำเข้า", color: "#1976d2", icon: <BeachAccess />, url: `${Model_URL}/hec_api/download_rain_grid.php` },
    { title: "2. เตรียมข้อมูลแบบจำลองจากตารางข้อมูลน้ำฝน-น้ำท่า", description: "สร้างไฟล์ข้อมูลนำเข้าแบบจำลอง (Hec-Dss) จากค่าที่กรอกในตาราง", color: "#1976d2", icon: <WaterDrop />, url: `${Model_URL}/hec_api/write_input_manual.php` },
  ];

  // (processRainData และ processFlowData ไม่เปลี่ยนแปลง)
  const processRainData = () => {
    // Define a type for the dynamic object keys
    const sb_daily_values: { [key: string]: { [key: string]: number } } = {};
    const rainRows = rows.filter(row => row.type === 'rain_rid');
    const dates = getDates(-7, -1); // Last 7 days

    const sbKeys = Object.keys(sbCoefficients);

    for (const sbKey of sbKeys) {
        sb_daily_values[sbKey] = {};
        for (let i = 0; i < dates.length; i++) {
        let totalRainfall = 0;
        // You should cast sbCoefficients to an appropriate type
        const coefficients = sbCoefficients[sbKey as keyof typeof sbCoefficients];
        for (const station_id in coefficients) {
            const coefficient = coefficients[station_id as keyof typeof coefficients];
            const rainStationRow = rainRows.find(row => row.station_id === station_id);
            if (rainStationRow) {
            const rainValue = rainStationRow.values[i] || 0; // i is the index from 0 to 6
            totalRainfall += rainValue * coefficient;
            }
        }
        sb_daily_values[sbKey][dates[i]] = totalRainfall;
        }
    }
    return sb_daily_values;
  };

  const processFlowData = () => {
      const flowData = [];
      const flowRows = rows.filter(row => row.type === 'flow');
      const dates = getDates(-7, 0); // Last 7 days + Today

      for (let i = 0; i < dates.length; i++) {
          const formattedDate = dates[i];

          for (const flowRow of flowRows) {
              const discharge = flowRow.values[i]; // i is the index from 0 to 7
              flowData.push({
                  sta_code: flowRow.station_id,
                  date: formattedDate,
                  discharge: discharge
              });
          }
      }
      return {
          status: "success",
          data: flowData
      };
  };

  // (handleRunPhpFile ไม่เปลี่ยนแปลง)
  const handleRunPhpFile = async (index: number, url: string) => {
    setButtonLoading((prev) => ({ ...prev, [index]: true }));

    if (index === 0) { // First button: Download rain grid
      try {
        const response = await axios.post(url);
        if (response.data.error) {
          setMessages((prev) => ({ ...prev, [index]: "❌ Run Error" }));
        } else {
          setMessages((prev) => ({ ...prev, [index]: "✅ Run Success" }));
        }
      } catch (error: unknown) {
        setMessages((prev) => ({ ...prev, [index]: "❌ Error executing PHP script: " + (error instanceof Error ? error.message : String(error)) }));
      } finally {
        setButtonLoading((prev) => ({ ...prev, [index]: false }));
      }
    } else if (index === 1) { // Second button: Prepare model data
      try {
        const sb_daily_values = processRainData();
        const data3 = processFlowData(); // Use the new function to get data from state

        // Fetch data2
        const resData2 = await axios.get(`${Model_URL}/hec_api/filter_rain_grid_api.php`);
        const data2 = resData2.data;

        const postData = {
          sb_daily_values: sb_daily_values,
          data3: data3,
          data2: data2,
        };

        const response = await axios.post(url, postData, {
          headers: {
            'Content-Type': 'application/json',
          },
        });

        if (response.data.error) {
          setMessages((prev) => ({ ...prev, [index]: "❌ Run Error: " + response.data.error }));
        } else {
          setMessages((prev) => ({ ...prev, [index]: "✅ Run Success" }));
        }
      } catch (error: unknown) {
        setMessages((prev) => ({ ...prev, [index]: "❌ Error executing PHP script: " + (error instanceof Error ? error.message : String(error)) }));
      } finally {
        setButtonLoading((prev) => ({ ...prev, [index]: false }));
      }
    }
  };

  // --- FUNCTION: Save data to new Input Table API (Manual Entry) ---
  const handleSaveData = async () => {
    setButtonLoading((prev) => ({ ...prev, save: true }));
    setMessages((prev) => ({ ...prev, save: "กำลังบันทึกข้อมูล..." }));

    try {
      const postData = rows.flatMap(row => {
        const isFlow = row.type === 'flow';
        const startOffset = isFlow ? -7 : -7;
        const endOffset = isFlow ? 0 : -1;
        const dates = getDates(startOffset, endOffset);
        
        return Array.from({ length: row.values.length }).map((_, index) => {
          return {
            sta_code: row.station_id,
            date: dates[index],
            data_type: isFlow ? 'flow' : 'rain',
            value: row.values[index],
          };
        });
      });

      // *** DEBUGGING STEP: Log data sent to API ***
      console.log("Data sent to API:", postData);
      
      const response = await axios.post(MODEL_INPUT_API, postData);
      
      // *** DEBUGGING STEP: Log API Response ***
      console.log("API Response (Save):", response.data);

      if (response.data.status === 'success') {
        setMessages((prev) => ({ ...prev, save: "✅ บันทึกข้อมูลสำเร็จ!" }));
      } else {
        setMessages((prev) => ({ ...prev, save: "❌ บันทึกข้อมูลล้มเหลว: " + (response.data.message || 'Unknown Error') }));
      }

    } catch (error: unknown) {
      setMessages((prev) => ({ ...prev, save: "❌ Error: " + (error instanceof Error ? error.message : String(error)) }));
      console.error("Save Data Error:", error);
    } finally {
      setButtonLoading((prev) => ({ ...prev, save: false }));
    }
  };
  // --- END handleSaveData ---
  
  // --- FUNCTION: Handle manual sync button click ---
  const handleSyncAndReload = () => {
      setButtonLoading((prev) => ({ ...prev, update: true }));
      setMessages((prev) => ({ ...prev, update: "กำลังดึงข้อมูลหลักเพื่อซิงค์และโหลดตาราง..." }));
      loadData(); 
  };
  // --- END handleSyncAndReload ---


  const handleChange = (rowIdx: number, dayIdx: number, value: string) => {
    const newRows = [...rows];
    let val = parseFloat(value);
    if (isNaN(val) || val < 0) val = 0;

    const targetRow = newRows[rowIdx]; // rowIdx ที่ส่งเข้ามาคือ actualRowIndex อยู่แล้ว จึงใช้ rowIdx ตรงๆ ได้เลย
    if (targetRow) {
      targetRow.values[dayIdx] = val;
      setRows(newRows);
    }
  };
  // Encapsulate loadData logic in a useCallback hook for use in useEffect and handleUpdateFromMain
  const loadData = useCallback(async () => {
    // Check if it's an initial load or a button reload
    const isManualSync = buttonLoading.update;

    try {
      if (!isManualSync) {
        setInitialDataLoading(true);
      }
      setRainDataLoaded(false);
      setFlowDataLoaded(false);
      
      // --- STEP 1: Synchronize data from main sources before reading (POST) ---
      try {
          const syncResponse = await axios.post(UPDATE_FROM_MAIN_API);
          const syncMsg = `✅ [Sync Success] ${syncResponse.data.message}`;
          setMessages((prev) => ({ ...prev, update: syncMsg }));
      } catch (error: unknown) {
          const detail = axios.isAxiosError(error)
            ? (error.response?.data?.message || error.message)
            : (error instanceof Error ? error.message : String(error));
          const errMsg = "❌ [Sync Error]: ไม่สามารถซิงค์จากข้อมูลหลักได้ " + detail;
          // Show sync error but continue to load existing data
          setMessages((prev) => ({ ...prev, update: errMsg }));
          console.error("Sync failed, loading existing data:", error);
      }
      // --- END STEP 1 ---

      // 2. กำหนดช่วงวันที่ที่ต้องการ (เหมือนเดิม)
      const rainDateKeys = getDates(-7, -1);
      const flowDateKeys = getDates(-7, 0);
      
      let modelInputData: ModelInputItem[] = [];
      const hasDataLoaded = { rain: false, flow: false };

      // 3. ดึงข้อมูลจากตาราง Model Input Data (API GET)
      const resInputData = await axios.get(MODEL_INPUT_API);
      if (resInputData.data && resInputData.data.status === 'success' && Array.isArray(resInputData.data.data)) {
          modelInputData = resInputData.data.data;
      }

      const inputDataMap = new Map();
      modelInputData.forEach((data: ModelInputItem) => {
          const key = `${data.sta_code}_${data.data_type}_${data.date}`;
          inputDataMap.set(key, data.value);
          // ตรวจสอบว่ามีข้อมูลจาก API ใหม่หรือไม่
          if (data.data_type === 'rain') hasDataLoaded.rain = true;
          if (data.data_type === 'flow') hasDataLoaded.flow = true;
      });

      // 4. สร้าง New Rows จากข้อมูลที่ดึงมา (เหมือนเดิม)
      const newRows = defaultRows.map(row => {
          const values = Array(row.type === "rain_rid" ? 7 : 8).fill(0);
          const isFlow = row.type === 'flow';
          const dateKeys = isFlow ? flowDateKeys : rainDateKeys;
          const dataType = isFlow ? 'flow' : 'rain';
          let rowHasData = false;

          dateKeys.forEach((dateKey, index) => {
              const key = `${row.station_id}_${dataType}_${dateKey}`;
              const inputValue = inputDataMap.get(key);

              if (inputValue !== undefined) {
                  const val = parseFloat(inputValue);
                  if (!isNaN(val)) {
                      values[index] = val;
                      rowHasData = true;
                  }
              }
          });
          return { ...row, values, hasDataLoaded: rowHasData };
      });
      
      // 5. ตั้งค่า State
      setRows(newRows);
      setRainDataLoaded(hasDataLoaded.rain);
      setFlowDataLoaded(hasDataLoaded.flow);
      
    } catch (err) {
      console.error("❌ ดึงข้อมูลจาก API Input ล้มเหลว:", err);
      setRainDataLoaded(false);
      setFlowDataLoaded(false);
    } finally {
      if (!isManualSync) {
        setInitialDataLoading(false);
      }
      if (isManualSync) {
         setButtonLoading((prev) => ({ ...prev, update: false }));
      }
    }
  }, [buttonLoading.update]); // buttonLoading.update เป็น dependency เพื่อให้ loadData สามารถเข้าถึงสถานะการโหลดล่าสุดของปุ่มได้
  
  // --- useEffect to load data initially ---
  useEffect(() => {
    loadData();
  }, [loadData]); // loadData is a dependency

  const allRainfallRows = rows.filter(row => row.type === 'rain_rid' || row.type === 'rain_project');
  const flowRows = rows.filter(row => row.type === 'flow');

  const renderTable = (tableRows: (typeof defaultRows[number] & { hasDataLoaded?: boolean })[], title: string, startDayOffset: number, endDayOffset: number, isTableDataLoaded: boolean) => (
    <Box sx={{ my: { xs: 2, md: 3 } }}>
      <Box sx={{ display: "flex", flexDirection: { xs: "column", sm: "row" }, justifyContent: "space-between", alignItems: { xs: "flex-start", sm: "center" }, gap: 1, mb: 1.5 }}>
        <Typography variant="h6" sx={{ fontWeight: "bold", fontFamily: "Prompt", fontSize: { xs: "0.9rem", md: "1rem" } }}>
          {title}
        </Typography>
        <Box sx={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap' }}>
          <Typography sx={{ fontFamily: 'Prompt', fontWeight: "bold", fontSize: { xs: "0.72rem", md: "0.8rem" }, mr: 0.75 }}>พื้นหลังสีแดง (</Typography>
          <Box sx={{ width: 16, height: 16, backgroundColor: '#FF7C80', mr: 0.75, borderRadius: 0.5 }} />
          <Typography sx={{ fontFamily: 'Prompt', fontWeight: "bold", fontSize: { xs: "0.72rem", md: "0.8rem" } }}>) คือไม่สามารถดึงข้อมูลได้</Typography>
        </Box>
      </Box>
      <Paper variant="outlined" sx={{ borderRadius: 2 }}>
        <Box sx={{ overflowX: 'auto' }}>
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell sx={{ ...HeaderCellStyle, minWidth: { md: "200px", xs: "120px" }, textAlign: 'left' }}>สถานี</TableCell>
                {generateDates(startDayOffset, endDayOffset).map((dateStr, i) => (
                  <TableCell key={i} sx={HeaderCellStyle}>{dateStr}</TableCell>
                ))}
              </TableRow>
            </TableHead>
            <TableBody>
             {tableRows.map((row, rowIdx) => {
                const numberOfCells = endDayOffset - startDayOffset + 1;
                const startIndexInValues = 0;

                const isRowInError = !row.hasDataLoaded && !isTableDataLoaded; 

                // เดิม: หาแค่ station_id → ชนกันได้
                // ใหม่: ต้อง match ทั้ง station_id และ type
                const actualRowIndex = rows.findIndex(
                  r => r.station_id === row.station_id && r.type === row.type
                );

                return (
                  <TableRow key={`${row.station_id}-${row.type}`}>
                    <TableCell sx={getCellStyle(rowIdx, isRowInError)}>{row.station_id} ({row.name})</TableCell>
                    {Array.from({ length: numberOfCells }).map((_, colIdx) => {
                      const valueToShow = row.values[startIndexInValues + colIdx];
                      return (
                        <TableCell key={colIdx} sx={getCellStyle(rowIdx, isRowInError)}>
                          <TextField
                            type="number"
                            variant="outlined"
                            size="small"
                            value={valueToShow !== undefined ? valueToShow.toFixed(2) : '0.00'}
                            inputProps={{ min: 0, step: 0.01 }}
                            onKeyDown={(e) => {
                              if (e.key === '-' || e.key === 'e') e.preventDefault();
                            }}
                            onChange={(e) =>
                              handleChange(actualRowIndex, startIndexInValues + colIdx, e.target.value)
                            }
                            sx={{
                              width: { xs: 64, md: 80 },
                              '& .MuiInputBase-input': {
                                py: 0.5,
                                px: 0.5,
                                textAlign: 'center',
                                fontSize: { xs: '0.72rem', md: '0.82rem' },
                              },
                            }}
                          />
                        </TableCell>
                      );
                    })}
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </Box>
      </Paper>
    </Box>
  );

  if (initialDataLoading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '50vh', gap: 2 }}>
        <CircularProgress />
        <Typography sx={{ fontFamily: "Prompt" }}>กำลังโหลดข้อมูล (รวมการซิงค์ข้อมูลหลัก)...</Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ p: 1 }}>
      {/* ตารางข้อมูลปริมาณน้ำฝนตรวจวัด (Rainfall Data - Observed) */}
      {renderTable(allRainfallRows, "ข้อมูลปริมาณน้ำฝนตรวจวัด (ย้อนหลัง 7 วัน)", -7, -1, rainDataLoaded)}

      <Divider sx={{ my: 4 }} />

      {/* ตารางปริมาณน้ำท่า (Water Flow Data) */}
      {renderTable(flowRows, "ข้อมูลน้ำท่าตรวจวัด (ย้อนหลัง 7 วันและวันปัจจุบัน)", -7, 0, flowDataLoaded)}


      {/* กลุ่มปุ่มบันทึก/อัปเดตข้อมูลเข้าตาราง Input */}
      <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' }, gap: 2, my: 2 }}>
        {/* ปุ่มซิงค์และโหลดข้อมูลหลัก */}
        <Paper variant="outlined" sx={{ p: 1.5, borderRadius: 2, display: 'flex', flexDirection: 'column', gap: 1 }}>
          <Box>
            <Typography sx={{ fontFamily: 'Prompt', fontWeight: 600, fontSize: { xs: '0.85rem', md: '0.9rem' } }}>
              ซิงค์ข้อมูลจากแหล่งข้อมูลหลัก
            </Typography>
            <Typography sx={{ fontFamily: 'Prompt', fontSize: '0.75rem', color: 'text.secondary' }}>
              ดึงข้อมูลน้ำฝน-น้ำท่าล่าสุดจากฐานข้อมูลหลักมาใส่ในตาราง
            </Typography>
          </Box>
          <Button
            variant="contained"
            color="primary"
            sx={{ fontFamily: "Prompt", width: "100%" }}
            onClick={handleSyncAndReload}
            disabled={buttonLoading.update}
          >
            {buttonLoading.update ? <CircularProgress size={22} color="inherit" /> : "ซิงค์และโหลดข้อมูลล่าสุด"}
          </Button>
          {messages.update && (
            <Typography
              sx={{
                fontFamily: "Prompt",
                fontSize: "0.75rem",
                color: messages.update.includes("Error") || messages.update.includes("❌") ? "error.main" : "info.main",
              }}
            >
              {messages.update}
            </Typography>
          )}
        </Paper>

        {/* ปุ่มบันทึกข้อมูลที่แก้ไขด้วยมือ */}
        <Paper variant="outlined" sx={{ p: 1.5, borderRadius: 2, display: 'flex', flexDirection: 'column', gap: 1 }}>
          <Box>
            <Typography sx={{ fontFamily: 'Prompt', fontWeight: 600, fontSize: { xs: '0.85rem', md: '0.9rem' } }}>
              บันทึกข้อมูลที่แก้ไขด้วยมือ
            </Typography>
            <Typography sx={{ fontFamily: 'Prompt', fontSize: '0.75rem', color: 'text.secondary' }}>
              บันทึกค่าที่แก้ไขในตารางลงฐานข้อมูล Model Input
            </Typography>
          </Box>
          <Button
            variant="contained"
            color="success"
            sx={{ fontFamily: "Prompt", width: "100%" }}
            onClick={handleSaveData}
            disabled={buttonLoading.save}
          >
            {buttonLoading.save ? <CircularProgress size={22} color="inherit" /> : "บันทึกข้อมูลที่แก้ไขด้วยมือ"}
          </Button>
          {messages.save && (
            <Typography
              sx={{
                fontFamily: "Prompt",
                fontSize: "0.75rem",
                color: messages.save.includes("❌") ? "error.main" : "success.main",
              }}
            >
              {messages.save}
            </Typography>
          )}
        </Paper>
      </Box>

      <Divider sx={{ my: 3 }} />

      <Typography variant="h6" sx={{ fontWeight: "bold", fontFamily: "Prompt", mb: 1.5, fontSize: { xs: "0.95rem", md: "1rem" } }}>
        ขั้นตอนการเตรียมข้อมูลน้ำฝน-น้ำท่า สำหรับแบบจำลอง (Hec-Dss)
      </Typography>

      <Stack spacing={1.25}>
        {cardData.slice(0, 2).map((card, index) => (
          <Paper
            key={index}
            variant="outlined"
            sx={{
              p: 1.5,
              borderRadius: 2,
              display: 'flex',
              flexDirection: { xs: 'column', sm: 'row' },
              alignItems: { xs: 'stretch', sm: 'center' },
              gap: 1.5,
            }}
          >
            <Box sx={{ flex: 1, minWidth: 0, display: 'flex', gap: 1.25 }}>
              <Box sx={{ color: card.color, display: 'flex', mt: 0.25 }}>{card.icon}</Box>
              <Box>
                <Typography sx={{ fontFamily: 'Prompt', fontWeight: 600, fontSize: { xs: '0.85rem', md: '0.9rem' } }}>
                  {card.title}
                </Typography>
                <Typography sx={{ fontFamily: 'Prompt', fontSize: '0.75rem', color: 'text.secondary', mt: 0.25 }}>
                  {card.description}
                </Typography>
                {messages[index] && (
                  <Typography
                    sx={{
                      fontFamily: 'Prompt',
                      fontSize: '0.75rem',
                      mt: 0.5,
                      color: messages[index].includes("❌") || messages[index].includes("Error") ? 'error.main' : 'success.main',
                    }}
                  >
                    {messages[index]}
                  </Typography>
                )}
              </Box>
            </Box>

            <Button
              variant="contained"
              sx={{ fontFamily: 'Prompt', minWidth: { xs: '100%', sm: 120 }, backgroundColor: card.color }}
              onClick={() => handleRunPhpFile(index, card.url)}
              disabled={buttonLoading[index]}
            >
              {buttonLoading[index] ? <CircularProgress size={22} color="inherit" /> : "รันคำสั่ง"}
            </Button>
          </Paper>
        ))}
      </Stack>
    </Box>
  );
}

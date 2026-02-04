import { useState, useEffect, useCallback } from "react";
import {
  Table, TableHead, TableBody, TableCell, TableRow,
  TextField, Button, Typography,
  CardContent,
  Grid,
  Card,
  CircularProgress,
  Box,
  Divider
} from "@mui/material";
import { BeachAccess, WaterDrop } from "@mui/icons-material";
import axios from "axios";
import { API_URL, Model_URL } from "@/lib/utility";

// กำหนด Endpoint สำหรับ API ใหม่
const MODEL_INPUT_API = `${API_URL}/api/model_input_data`;
const UPDATE_FROM_MAIN_API = `${API_URL}/api/model_input_data/update-from-main`; // Endpoint ใหม่

const defaultRows = [
  { station_id: '040052', name: "ทต.หันคา", type: "rain_rid", values: Array(7).fill(0) },
  { station_id: '040062', name: "ทต.วัดสิงห์", type: "rain_rid", values: Array(7).fill(0) },
  { station_id: '600013', name: "สุพรรณบุรี", type: "rain_rid", values: Array(7).fill(0) },
  { station_id: '600023', name: "สกษ.อู่ทอง", type: "rain_rid", values: Array(7).fill(0) },
  { station_id: '530012', name: "สมุทรสงคราม", type: "rain_rid", values: Array(7).fill(0) },
  { station_id: '230052', name: "นครปฐม", type: "rain_rid", values: Array(7).fill(0) },
  { station_id: '690171', name: "T.7 บ้านทัพคล้าย", type: "rain_rid", values: Array(7).fill(0) },
  { station_id: '690151', name: "C.30 บ้านสมอทอง", type: "rain_rid", values: Array(7).fill(0) },

  { station_id: 'C.54', name: "ปตร.พลเทพ", type: "flow", values: Array(8).fill(0) },
  { station_id: 'T.18', name: "ปตร.ท่าโบสถ์", type: "flow", values: Array(8).fill(0) },
  { station_id: 'T.17', name: "ปตร.ชลมาร์คพิจารณ์", type: "flow", values: Array(8).fill(0) },
  { station_id: 'T.16', name: "ปตร.โพธิ์พระยา", type: "flow", values: Array(8).fill(0) },
  { station_id: 'BYH', name: "ปตร.บางยี่หน", type: "flow", values: Array(8).fill(0) },
  { station_id: 'PBL', name: "ปตร.พระยาบรรลือ", type: "flow", values: Array(8).fill(0) },
  { station_id: 'PPM', name: "ปตร.พระพิพล", type: "flow", values: Array(8).fill(0) },
  { station_id: 'KTB', name: "ปตร.กระทุ่มแบน", type: "flow", values: Array(8).fill(0) },
  { station_id: 'MHC', name: "ปตร.คลองมหาชัย", type: "flow", values: Array(8).fill(0) },
  { station_id: 'MSW', name: "ปตร.มหาสวัสดิ์", type: "flow", values: Array(8).fill(0) },
  { station_id: 'KYG', name: "ปตร.คลองโยง", type: "flow", values: Array(8).fill(0) },
  { station_id: 'BPL', name: "ปตร.กระเสียว-สุพรรณ", type: "flow", values: Array(8).fill(0) },
  { station_id: 'PTL', name: "ปตร.เภาทะลาย", type: "flow", values: Array(8).fill(0) },
  { station_id: 'SPN', name: "ปตร.สองพี่น้อง", type: "flow", values: Array(8).fill(0) },
  { station_id: 'BBP', name: "ปตร.บางปลา", type: "flow", values: Array(8).fill(0) },
];

const HeaderCellStyle = {
  top: { xs: 115, md: 60 },
  border: "1px solid #ddd",
  fontFamily: "Prompt",
  fontWeight: "bold",
  textAlign: "center",
  backgroundColor: "rgb(1, 87, 155)",
  color: "white",
  fontSize: { xs: "0.8rem", sm: "0.8rem", md: "0.9rem" },
};

const getCellStyle = (index: number, isError: boolean) => ({
  padding: "5px",
  backgroundColor: isError ? '#FF7C80' : (index % 2 === 0 ? '#FAFAFA' : '#FFF'),
  textAlign: "center",
  fontFamily: "Prompt",
  fontSize: { xs: "0.8rem", sm: "0.8rem", md: "0.9rem" },
});

// Helper function to get dates in YYYY-MM-DD format
const getDates = (startOffset: number, endOffset: number) => {
    const dates: string[] = [];
    const today = new Date();
    for (let i = startOffset; i <= endOffset; i++) {
        const d = new Date(today);
        d.setDate(d.getDate() + i);
        // ใช้ ISOString และ split เพื่อให้ได้ YYYY-MM-DD ที่แน่นอน ไม่ขึ้นกับ Timezone ของเครื่อง
        dates.push(d.toISOString().split('T')[0]);
    }
    return dates;
};

// Helper function to generate display dates
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
    'SB-06': { '600013': 0.593401, '690171': 0.013694, '040052': 0.392904 },
    'SB-07': { '600023': 0.220773, '690171': 0.779227 },
    'SB-08': { '600013': 0.073420, '600023': 0.705110, '690171': 0.147377, '040052': 0.074092 },
    'SB-09': { '600023': 0.978914, '230052': 0.021086 },
    'SB-10': { '600013': 0.528361, '600023': 0.260375, '230052': 0.211264 },
    'SB-11': { '600013': 0.000012, '530012': 0.311614, '230052': 0.688374 },
  };

  const cardData = [
    { title: "1.ดาวน์โหลดกริดฝนพยากรณ์ (กรมอุตุนิยมวิทยา)", color: "#1976d2", icon: <BeachAccess />, url: `${Model_URL}/hec_api/dowload_rain_grid.php` },
    { title: "2.เตรียมข้อมูลแบบจำลองจากตารางข้อมูลน้ำฝน-น้ำท่า", color: "#1976d2", icon: <WaterDrop />, url: `${Model_URL}/hec_api/write_input_manual.php` },
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
      } catch (error: any) {
        setMessages((prev) => ({ ...prev, [index]: "❌ Error executing PHP script: " + (error.message || error) }));
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
      } catch (error: any) {
        setMessages((prev) => ({ ...prev, [index]: "❌ Error executing PHP script: " + (error.message || error) }));
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

    } catch (error: any) {
      setMessages((prev) => ({ ...prev, save: "❌ Error: " + (error.message || error.toString()) }));
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
    
    // Find the actual row index in the 'rows' state from the mapped index
    const actualRowIndex = rows.findIndex(row => row.station_id === newRows[rowIdx].station_id);

    if (actualRowIndex !== -1) {
      newRows[actualRowIndex].values[dayIdx] = val;
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
      } catch (error: any) {
          const errMsg = "❌ [Sync Error]: ไม่สามารถซิงค์จากข้อมูลหลักได้ " + (error.response?.data?.message || error.message || error.toString());
          // Show sync error but continue to load existing data
          setMessages((prev) => ({ ...prev, update: errMsg }));
          console.error("Sync failed, loading existing data:", error);
      }
      // --- END STEP 1 ---

      // 2. กำหนดช่วงวันที่ที่ต้องการ (เหมือนเดิม)
      const rainDateKeys = getDates(-7, -1);
      const flowDateKeys = getDates(-7, 0);
      
      let modelInputData: any[] = [];
      let hasDataLoaded = { rain: false, flow: false };

      // 3. ดึงข้อมูลจากตาราง Model Input Data (API GET)
      const resInputData = await axios.get(MODEL_INPUT_API);
      if (resInputData.data && resInputData.data.status === 'success' && Array.isArray(resInputData.data.data)) {
          modelInputData = resInputData.data.data;
      }

      const inputDataMap = new Map();
      modelInputData.forEach((data: any) => {
          const key = `${data.sta_code}_${data.data_type}_${data.date}`;
          inputDataMap.set(key, data.value);
          // ตรวจสอบว่ามีข้อมูลจาก API ใหม่หรือไม่
          if (data.data_type === 'rain') hasDataLoaded.rain = true;
          if (data.data_type === 'flow') hasDataLoaded.flow = true;
      });

      // 4. สร้าง New Rows จากข้อมูลที่ดึงมา (เหมือนเดิม)
      const newRows = defaultRows.map(row => {
          let values = Array(row.type === "rain_rid" ? 7 : 8).fill(0);
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
    <Box sx={{ my: 4 ,overflowX: 'auto'}}>
      <Box sx={{ display: "flex", flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
        <Typography variant="h6" sx={{ fontWeight: "bold", fontFamily: "Prompt", mb: 2 }}>
          {title}
        </Typography>
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
          <Typography sx={{ fontFamily: 'Prompt', fontWeight: "bold", mr: 1 }}>พื้นหลังสีแดง (</Typography>
          <Box sx={{ width: 25, height: 25, backgroundColor: '#FF7C80', mr: 1 }} />
          <Typography sx={{ fontFamily: 'Prompt', fontWeight: "bold", mr: 2 }}>) คือไม่สามารถดึงข้อมูลได้</Typography>
        </Box>
      </Box>
      <Table>
        <TableHead>
          <TableRow>
            <TableCell sx={{ ...HeaderCellStyle, minWidth: { md: "200px", xs: "100px" } }}>สถานี</TableCell>
            {generateDates(startDayOffset, endDayOffset).map((dateStr, i) => (
              <TableCell key={i} sx={HeaderCellStyle}>{dateStr}</TableCell>
            ))}
          </TableRow>
        </TableHead>
        <TableBody>
          {tableRows.map((row, rowIdx) => {
            const numberOfCells = endDayOffset - startDayOffset + 1;
            let startIndexInValues = 0;

            const isRowInError = !row.hasDataLoaded && !isTableDataLoaded; 
            return (
              <TableRow key={row.station_id}>
                <TableCell sx={getCellStyle(rowIdx, isRowInError)}>{row.name}</TableCell>
                {Array.from({ length: numberOfCells }).map((_, colIdx) => {
                  const valueToShow = row.values[startIndexInValues + colIdx];
                  const actualRowIndex = rows.findIndex(r => r.station_id === row.station_id);
                  return (
                    <TableCell key={colIdx} sx={getCellStyle(rowIdx, isRowInError)}>
                      <TextField
                        type="number"
                        variant="outlined"
                        size="small"
                        value={valueToShow !== undefined ? valueToShow.toFixed(2) : '0.00'}
                        inputProps={{ min: 0 }}
                        onKeyDown={(e) => {
                          if (e.key === '-' || e.key === 'e') e.preventDefault();
                        }}
                        onChange={(e) =>
                          handleChange(actualRowIndex, startIndexInValues + colIdx, e.target.value)
                        }
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
  );

  if (initialDataLoading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
        <CircularProgress />
        <Typography sx={{ fontFamily: "Prompt", ml: 2 }}>กำลังโหลดข้อมูล (รวมการซิงค์ข้อมูลหลัก)...</Typography>
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
      <Box sx={{ display: 'flex', flexDirection: { xs: 'column', md: 'row' }, gap: 4, justifyContent: 'center', alignItems: 'flex-start', my: 4 }}>
        
        {/* ปุ่มซิงค์และโหลดข้อมูลหลัก */}
        <Box sx={{ display: 'flex', flexDirection: 'column', textAlign: "center", minWidth: 250 }}>
          <Button
              variant="contained"
              color="primary"
              size="large"
              sx={{ fontFamily: "Prompt", width: "100%", mb: 1 }}
              onClick={handleSyncAndReload} 
              disabled={buttonLoading.update}
              >
              {buttonLoading.update ? <CircularProgress size={24} color="inherit" /> : "🔄 ซิงค์และโหลดข้อมูลล่าสุด"}
          </Button>
          <Typography
              variant="body1"
              sx={{
                textAlign: "center",
                marginTop: 1,
                fontFamily: "Prompt",
                fontSize: { xs: "0.8rem", md: "0.9rem" },
                color: messages.update?.includes("Error") || messages.update?.includes("❌") ? "red" : "blue",
              }}
              >
              {messages.update}
          </Typography>
        </Box>

        {/* ปุ่มบันทึกข้อมูลที่แก้ไขด้วยมือ */}
        <Box sx={{ display: 'flex', flexDirection: 'column', textAlign: "center", minWidth: 250 }}>
          <Button
              variant="contained"
              color="success"
              size="large"
              sx={{ fontFamily: "Prompt", width: "100%", mt: { xs: 2, md: 0 } }}
              onClick={handleSaveData}
              disabled={buttonLoading.save}
              >
              {buttonLoading.save ? <CircularProgress size={24} color="inherit" /> : "💾 บันทึกข้อมูลที่แก้ไขด้วยมือ"}
              
          </Button>
          <Typography
              variant="body1"
              sx={{
                textAlign: "center",
                marginTop: 1,
                fontFamily: "Prompt",
                fontSize: { xs: "0.8rem", md: "0.9rem" },
                color: messages.save?.includes("❌") ? "red" : "green",
              }}
              >
            {messages.save}
          </Typography>
        </Box>
      </Box>
      <Divider sx={{ my: 4 }} />

      <Typography variant="h6" sx={{ fontWeight: "bold", fontFamily: "Prompt", mb: 2 }}>
        ขั้นตอนการเตรียมข้อมูลน้ำฝน-น้ำท่า สำหรับแบบจำลอง (Hec-Dss)
      </Typography>

      <Grid container spacing={2}>
        {cardData.slice(0, 2).map((card, index) => (
          <Grid size={{ xs: 12, sm: 6, lg: 6 }} key={index}>
            <Card sx={{ borderRadius: 2 }}>
              <CardContent>
                <Typography
                  variant="h6"
                  color="textSecondary"
                  gutterBottom
                  sx={{ fontFamily: "Prompt" }}
                >
                  {card.icon} {card.title}
                </Typography>

                <Button
                  variant="contained"
                  sx={{ marginTop: 2, width: "100%", backgroundColor: card.color }}
                  onClick={() => handleRunPhpFile(index, card.url)}
                  disabled={buttonLoading[index]}
                >
                  {buttonLoading[index] ? (
                    <CircularProgress size={24} color="inherit" />
                  ) : (
                    "รันคำสั่ง"
                  )}
                </Button>

                <Typography
                  variant="body1"
                  sx={{
                    textAlign: "center",
                    marginTop: 2,
                    fontFamily: "Prompt",
                    color: messages[index]?.includes("Error") ? "red" : "green",
                  }}
                >
                  {messages[index]}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>
    </Box>
  );
}

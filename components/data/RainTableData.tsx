import React, { useState, useMemo } from 'react';
import {
  Box,
  Button,
  FormControl,
  InputLabel,
  Menu,
  MenuItem,
  Select,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  useTheme,
} from '@mui/material';
import ArrowDropDownIcon from '@mui/icons-material/ArrowDropDown';
import DownloadIcon from '@mui/icons-material/Download';
import TextSnippetIcon from '@mui/icons-material/TextSnippet';
import TableChartIcon from '@mui/icons-material/TableChart';
import * as XLSX from 'xlsx';
import { saveAs } from 'file-saver';
import { textStyle } from '../../theme/style';
import { getCellStyle, HeaderCellStyle } from '../../theme/style';
interface GroupedData {
  [year: string]: [number, number | null][]; // รองรับ null
}

interface Props {
  rain_mmGroupedData: GroupedData;
  availableYears: string[];
}

const RainExportTable: React.FC<Props> = ({
  rain_mmGroupedData,
  availableYears,
}) => {
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [selectedYear, setSelectedYear] = useState("ทั้งหมด");
  const theme = useTheme();
  const open = Boolean(anchorEl);
  const handleClick = (event: React.MouseEvent<HTMLButtonElement>) => setAnchorEl(event.currentTarget);
  const handleClose = () => setAnchorEl(null);

  // คำนวณข้อมูลทั้งหมด + คำนวณสะสม + เติม null + เรียงตามเวลา
  const allDataRows = useMemo(() => {
    const result: {
      timestamp: number;
      rain_mm: number | null;
      rain_cumulative: number | null;
    }[] = [];

    const yearsToProcess = selectedYear === "ทั้งหมด"
      ? Object.keys(rain_mmGroupedData).sort()
      : [selectedYear];

    let cumulativeSum = 0; // รีเซ็ตสะสมเมื่อเปลี่ยนปี (ถ้าต้องการสะสมต่อเนื่องหลายปี ให้เอาไว้ด้านนอก)

    yearsToProcess.forEach(year => {
      const data = rain_mmGroupedData[year] || [];

      // เรียงข้อมูลตาม timestamp ก่อน (ป้องกันข้อมูลไม่เรียง)
      const sortedData = data.sort((a, b) => a[0] - b[0]);

      sortedData.forEach(([timestamp, value]) => {
        const rain_mm = value !== null && value !== undefined ? Number(value.toFixed(2)) : null;

        if (rain_mm !== null) {
          cumulativeSum += rain_mm;
        }
        // ถ้าเป็น null ให้สะสมค้างไว้ (ไม่เพิ่ม แต่ไม่รีเซ็ต)
        const cumulative = rain_mm !== null ? Number(cumulativeSum.toFixed(2)) : null;

        result.push({
          timestamp,
          rain_mm,
          rain_cumulative: cumulative,
        });
      });
    });

    // ถ้าต้องการให้สะสมต่อเนื่องหลายปี → อย่าย้าย cumulativeSum เข้า loop ปี
    // ถ้าต้องการรีเซ็ตทุกปี → ใส่ cumulativeSum = 0 ไว้ใน loop ปี (แบบปัจจุบัน)

    return result;
  }, [rain_mmGroupedData, selectedYear]);

  // Format วันที่ไทย
  const formatThaiDate = (timestamp: number) => {
    return new Date(timestamp).toLocaleDateString('th-TH', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    });
  };

  // Export Functions
  const exportToXLSX = () => {
    const data = allDataRows.map(r => ({
      วันที่: formatThaiDate(r.timestamp),
      'ปริมาณน้ำฝน (มม.)': r.rain_mm !== null ? r.rain_mm : '',
      'ปริมาณน้ำฝนสะสม (มม.)': r.rain_cumulative !== null ? r.rain_cumulative : '',
    }));

    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Rain Data');
    const buf = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
    saveAs(new Blob([buf]), 'rain_data.xlsx');
  };

  const exportToCSV = () => {
    const headers = ['วันที่', 'ปริมาณน้ำฝน (มม.)', 'ปริมาณน้ำฝนสะสม (มม.)'];
    const rows = allDataRows.map(r => [
      formatThaiDate(r.timestamp),
      r.rain_mm !== null ? r.rain_mm.toFixed(2) : '',
      r.rain_cumulative !== null ? r.rain_cumulative.toFixed(2) : '',
    ]);

    const content = '\uFEFF' + headers.join(',') + '\n' + rows.map(r => r.join(',')).join('\n');
    saveAs(new Blob([content], { type: 'text/csv;charset=utf-8' }), 'rain_data.csv');
  };

  const exportToTXT = () => {
    const headers = ['วันที่', 'ปริมาณน้ำฝน (มม.)', 'ปริมาณน้ำฝนสะสม (มม.)'];
    const rows = allDataRows.map(r => [
      formatThaiDate(r.timestamp),
      r.rain_mm !== null ? r.rain_mm.toFixed(2) : '-',
      r.rain_cumulative !== null ? r.rain_cumulative.toFixed(2) : '-',
    ]);

    const content = '\uFEFF' + headers.join('\t') + '\n' + rows.map(r => r.join('\t')).join('\n');
    saveAs(new Blob([content], { type: 'text/plain;charset=utf-8' }), 'rain_data.txt');
  };

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2, flexWrap: 'wrap', gap: 2 }}>
        <FormControl size="small" sx={{ minWidth: 150 }}>
          <InputLabel sx={{ fontFamily: "Prompt" }}>เลือกปี</InputLabel>
          <Select
            value={selectedYear}
            label="เลือกปี"
            onChange={(e) => setSelectedYear(e.target.value)}
            sx={{ fontFamily: "Prompt" }}
          >
            {availableYears.map(year => (
              <MenuItem key={year} value={year} sx={{ fontFamily: "Prompt" }}>
                {year === "ทั้งหมด" ? "ทั้งหมด" : `พ.ศ. ${Number(year) + 543}`}
              </MenuItem>
            ))}
          </Select>
        </FormControl>

        <Button
          variant="contained"
          color="success"
          endIcon={<ArrowDropDownIcon />}
          onClick={handleClick}
          sx={{ borderRadius: '8px', textTransform: 'none', px: 3, ...textStyle }}
        >
          Export File
        </Button>

        <Menu anchorEl={anchorEl} open={open} onClose={handleClose}>
          <MenuItem onClick={() => { exportToXLSX(); handleClose(); }} sx={{ fontFamily: "Prompt" }}>
            <TableChartIcon sx={{ mr: 1 }} /> Export XLSX
          </MenuItem>
          <MenuItem onClick={() => { exportToCSV(); handleClose(); }} sx={{ fontFamily: "Prompt" }}>
            <DownloadIcon sx={{ mr: 1 }} /> Export CSV
          </MenuItem>
          <MenuItem onClick={() => { exportToTXT(); handleClose(); }} sx={{ fontFamily: "Prompt" }}>
            <TextSnippetIcon sx={{ mr: 1 }} /> Export TXT
          </MenuItem>
        </Menu>
      </Box>

      <Box sx={{ maxHeight: '70vh', overflow: 'auto', border: '1px solid #ddd', borderRadius: 1 }}>
        <Table size="small" stickyHeader>
          <TableHead>
            <TableRow>
              <TableCell sx={HeaderCellStyle(theme)}>วันที่</TableCell>
              <TableCell sx={HeaderCellStyle(theme)}>ปริมาณน้ำฝน (มม.)</TableCell>
              <TableCell sx={HeaderCellStyle(theme)}>ปริมาณน้ำฝนสะสม (มม.)</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {allDataRows.length === 0 ? (
              <TableRow>
                <TableCell colSpan={3} sx={{ py: 4, ...getCellStyle(0, theme) }}>
                  ไม่มีข้อมูลสำหรับปีที่เลือก
                </TableCell>
              </TableRow>
            ) : (
              allDataRows.map((row, idx) => (
                <TableRow key={row.timestamp}>
                  <TableCell sx={getCellStyle(idx, theme)}>{formatThaiDate(row.timestamp)}</TableCell>
                  <TableCell sx={getCellStyle(idx, theme)}>
                    {row.rain_mm !== null ? row.rain_mm.toFixed(2) : '-'}
                  </TableCell>
                  <TableCell sx={getCellStyle(idx, theme)}>
                    {row.rain_cumulative !== null ? row.rain_cumulative.toFixed(2) : '-'}
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </Box>
    </Box>
  );
};

export default RainExportTable;
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
} from '@mui/material';
import ArrowDropDownIcon from '@mui/icons-material/ArrowDropDown';
import DownloadIcon from '@mui/icons-material/Download';
import TextSnippetIcon from '@mui/icons-material/TextSnippet';
import TableChartIcon from '@mui/icons-material/TableChart';
import * as XLSX from 'xlsx';
import { saveAs } from 'file-saver';
import { textStyle } from '../../theme/style';

const HeaderCellStyle = {
  whiteSpace: "nowrap",
  border: "1px solid #ddd",
  fontFamily: "Noto Sans Thai",
  fontWeight: "bold",
  textAlign: "center",
  backgroundColor: "rgb(1, 87, 155)",
  color: "white",
  fontSize: { xs: "0.8rem", sm: "1rem", md: "1.1rem" },
  padding: "8px",
};

const getCellStyle = (index: number) => ({
  whiteSpace: "nowrap",
  border: "1px solid #ddd",
  padding: "5px",
  backgroundColor: index % 2 === 0 ? "#FAFAFA" : "#FFF",
  textAlign: "center",
  fontFamily: "Noto Sans Thai",
  fontSize: { xs: "0.8rem", sm: "0.9rem", md: "1rem" },
});

interface GroupedData {
  [year: string]: [number, number | null][]; // รองรับ null
}

interface Props {
  dischargeGroupedData: GroupedData;
  wlUpperGroupedData?: GroupedData;
  wlLowerGroupedData?: GroupedData;
  availableYears: string[];
}

const GateExportTable: React.FC<Props> = ({
  dischargeGroupedData,
  wlUpperGroupedData = {},
  wlLowerGroupedData = {},
  availableYears,
}) => {
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [selectedYear, setSelectedYear] = useState("ทั้งหมด");

  const open = Boolean(anchorEl);
  const handleClick = (event: React.MouseEvent<HTMLButtonElement>) => setAnchorEl(event.currentTarget);
  const handleClose = () => setAnchorEl(null);

  // รวมข้อมูลทุกวัน + เติม null + เรียงตาม timestamp
  const allDataRows = useMemo(() => {
    const map = new Map<number, {
      timestamp: number;
      discharge: number | null;
      wlUpper: number | null;
      wlLower: number | null;
    }>();

    const yearsToProcess = selectedYear === "ทั้งหมด"
      ? Object.keys(dischargeGroupedData)
      : [selectedYear];

    yearsToProcess.forEach(year => {
      const dischargeData = dischargeGroupedData[year] || [];
      const upperMap = new Map((wlUpperGroupedData[year] || []).map(([t, v]) => [t, v]));
      const lowerMap = new Map((wlLowerGroupedData[year] || []).map(([t, v]) => [t, v]));

      dischargeData.forEach(([ts, discharge]) => {
        if (!map.has(ts)) {
          map.set(ts, {
            timestamp: ts,
            discharge: null,
            wlUpper: null,
            wlLower: null,
          });
        }
        const row = map.get(ts)!;
        row.discharge = discharge !== null ? Number(discharge.toFixed(3)) : null;
        row.wlUpper = upperMap.get(ts) ?? null;
        row.wlLower = lowerMap.get(ts) ?? null;
      });
    });

    return Array.from(map.values()).sort((a, b) => a.timestamp - b.timestamp);
  }, [dischargeGroupedData, wlUpperGroupedData, wlLowerGroupedData, selectedYear]);

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
      'อัตราการไหล (ลบ.ม./วินาที)': r.discharge !== null ? r.discharge.toFixed(3) : '',
      'ระดับน้ำเหนือ ปตร. (ม.รทก.)': r.wlUpper !== null ? r.wlUpper.toFixed(3) : '',
      'ระดับน้ำท้าย ปตร. (ม.รทก.)': r.wlLower !== null ? r.wlLower.toFixed(3) : '',
    }));

    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Gate Data');
    const buf = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
    saveAs(new Blob([buf]), 'gate_data.xlsx');
  };

  const exportToCSV = () => {
    const headers = ['วันที่', 'อัตราการไหล (ลบ.ม./วินาที)', 'ระดับน้ำเหนือ ปตร. (ม.รทก.)', 'ระดับน้ำท้าย ปตร. (ม.รทก.)'];
    const rows = allDataRows.map(r => [
      formatThaiDate(r.timestamp),
      r.discharge !== null ? r.discharge.toFixed(3) : '',
      r.wlUpper !== null ? r.wlUpper.toFixed(3) : '',
      r.wlLower !== null ? r.wlLower.toFixed(3) : '',
    ]);

    const content = '\uFEFF' + headers.join(',') + '\n' + rows.map(r => r.join(',')).join('\n');
    saveAs(new Blob([content], { type: 'text/csv;charset=utf-8' }), 'gate_data.csv');
  };

  const exportToTXT = () => {
    const headers = ['วันที่', 'อัตราการไหล (ลบ.ม./วินาที)', 'ระดับน้ำเหนือ ปตร. (ม.รทก.)', 'ระดับน้ำท้าย ปตร. (ม.รทก.)'];
    const rows = allDataRows.map(r => [
      formatThaiDate(r.timestamp),
      r.discharge !== null ? r.discharge.toFixed(3) : '-',
      r.wlUpper !== null ? r.wlUpper.toFixed(3) : '-',
      r.wlLower !== null ? r.wlLower.toFixed(3) : '-',
    ]);

    const content = '\uFEFF' + headers.join('\t') + '\n' + rows.map(r => r.join('\t')).join('\n');
    saveAs(new Blob([content], { type: 'text/plain;charset=utf-8' }), 'gate_data.txt');
  };

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2, flexWrap: 'wrap', gap: 2 }}>
        <FormControl size="small" sx={{ minWidth: 150 }}>
          <InputLabel sx={{ fontFamily: "Noto Sans Thai" }}>เลือกปี</InputLabel>
          <Select
            value={selectedYear}
            label="เลือกปี"
            onChange={(e) => setSelectedYear(e.target.value)}
            sx={{ fontFamily: "Noto Sans Thai" }}
          >
            {availableYears.map(year => (
              <MenuItem key={year} value={year} sx={{ fontFamily: "Noto Sans Thai" }}>
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
          <MenuItem onClick={() => { exportToXLSX(); handleClose(); }} sx={{ fontFamily: "Noto Sans Thai" }}>
            <TableChartIcon sx={{ mr: 1 }} /> Export XLSX
          </MenuItem>
          <MenuItem onClick={() => { exportToCSV(); handleClose(); }} sx={{ fontFamily: "Noto Sans Thai" }}>
            <DownloadIcon sx={{ mr: 1 }} /> Export CSV
          </MenuItem>
          <MenuItem onClick={() => { exportToTXT(); handleClose(); }} sx={{ fontFamily: "Noto Sans Thai" }}>
            <TextSnippetIcon sx={{ mr: 1 }} /> Export TXT
          </MenuItem>
        </Menu>
      </Box>

      <Box sx={{ maxHeight: '70vh', overflow: 'auto', border: '1px solid #ddd', borderRadius: 1 }}>
        <Table size="small" stickyHeader>
          <TableHead>
            <TableRow>
              <TableCell sx={HeaderCellStyle}>วันที่</TableCell>
              <TableCell sx={HeaderCellStyle}>อัตราการไหล (ลบ.ม./วินาที)</TableCell>
              <TableCell sx={HeaderCellStyle}>ระดับน้ำเหนือ ปตร. (ม.รทก.)</TableCell>
              <TableCell sx={HeaderCellStyle}>ระดับน้ำท้าย ปตร. (ม.รทก.)</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {allDataRows.length === 0 ? (
              <TableRow>
                <TableCell colSpan={4} sx={{ py: 4, ...getCellStyle(0) }}>
                  ไม่มีข้อมูลสำหรับปีที่เลือก
                </TableCell>
              </TableRow>
            ) : (
              allDataRows.map((row, idx) => (
                <TableRow key={row.timestamp}>
                  <TableCell sx={getCellStyle(idx)}>{formatThaiDate(row.timestamp)}</TableCell>
                  <TableCell sx={getCellStyle(idx)}>
                    {row.discharge !== null ? row.discharge.toFixed(3) : '-'}
                  </TableCell>
                  <TableCell sx={getCellStyle(idx)}>
                    {row.wlUpper !== null ? row.wlUpper.toFixed(3) : '-'}
                  </TableCell>
                  <TableCell sx={getCellStyle(idx)}>
                    {row.wlLower !== null ? row.wlLower.toFixed(3) : '-'}
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

export default GateExportTable;
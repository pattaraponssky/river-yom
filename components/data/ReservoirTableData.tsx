import React, { useState, useMemo } from 'react';
import { Box, Button, FormControl, InputLabel, Menu, MenuItem, Select, Table, TableBody, TableCell, TableHead, TableRow } from '@mui/material';
import ArrowDropDownIcon from '@mui/icons-material/ArrowDropDown';
import DownloadIcon from '@mui/icons-material/Download';
import TextSnippetIcon from '@mui/icons-material/TextSnippet';
import TableChartIcon from '@mui/icons-material/TableChart';
import ListAltIcon from '@mui/icons-material/ListAlt';
import * as XLSX from 'xlsx';
import { saveAs } from 'file-saver';
import { textStyle } from '../../theme/style';
import { getCellStyle, HeaderCellStyle } from '../../theme/style';

const menuStyle = {
  fontFamily: "Prompt",
  fontSize: "1rem",
};

interface GroupedData {
  [year: string]: [number, number | null][]; // รองรับ null
}

interface Props {
  volumeGroupedData: GroupedData;
  inflowGroupedData?: GroupedData;
  outflowGroupedData?: GroupedData;
  availableYears: string[];
}

const ReservoirExportTable: React.FC<Props> = ({
  volumeGroupedData,
  inflowGroupedData = {},
  outflowGroupedData = {},
  availableYears,
}) => {
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [selectedYear, setSelectedYear] = useState("ทั้งหมด");

  const handleClick = (event: React.MouseEvent<HTMLButtonElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => setAnchorEl(null);

  const allDataRows = useMemo(() => {
    const rows: { date: number; volume: number | null; inflow: number | null; outflow: number | null }[] = [];

    const years = selectedYear === "ทั้งหมด"
      ? Object.keys(volumeGroupedData).sort()
      : [selectedYear];

    years.forEach(year => {
      const volumeData = volumeGroupedData[year] || [];
      const inflowMap = new Map((inflowGroupedData[year] || []).map(([t, v]) => [t, v]));
      const outflowMap = new Map((outflowGroupedData[year] || []).map(([t, v]) => [t, v]));

      volumeData.forEach(([date, volume]) => {
        rows.push({
          date,
          volume,
          inflow: inflowMap.get(date) ?? null,
          outflow: outflowMap.get(date) ?? null,
        });
      });
    });

    // เรียงตามวันที่จริง (สำคัญมาก!)
    return rows.sort((a, b) => a.date - b.date);
  }, [volumeGroupedData, inflowGroupedData, outflowGroupedData, selectedYear]);

  // ฟังก์ชัน format วันที่ไทย
  const formatThaiDate = (timestamp: number) => {
    return new Date(timestamp).toLocaleDateString('th-TH', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    });
  };

  // Export functions (เหมือนเดิม แต่ใช้ allDataRows ที่ผ่าน useMemo แล้ว)
  const exportToTXT = () => {
    const headers = ['วันที่', 'ปริมาณน้ำ (ล้าน ลบ.ม.)', 'น้ำไหลเข้า (ล้าน ลบ.ม.)', 'น้ำระบายออก (ล้าน ลบ.ม.)'];
    const rows = allDataRows.map(r => [
      formatThaiDate(r.date),
      r.volume !== null ? r.volume.toFixed(2) : '',
      r.inflow !== null ? r.inflow.toFixed(2) : '',
      r.outflow !== null ? r.outflow.toFixed(2) : '',
    ]);

    const content = '\uFEFF' + headers.join('\t') + '\n' + rows.map(r => r.join('\t')).join('\n');
    const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
    saveAs(blob, 'reservoir_data.txt');
  };

  const exportToCSV = () => {
    const headers = ['วันที่', 'ปริมาณน้ำ (ล้าน ลบ.ม.)', 'น้ำไหลเข้า (ล้าน ลบ.ม.)', 'น้ำระบายออก (ล้าน ลบ.ม.)'];
    const rows = allDataRows.map(r => [
      formatThaiDate(r.date),
      r.volume !== null ? r.volume.toFixed(2) : '',
      r.inflow !== null ? r.inflow.toFixed(2) : '',
      r.outflow !== null ? r.outflow.toFixed(2) : '',
    ]);

    const csv = '\uFEFF' + headers.join(',') + '\n' + rows.map(r => r.join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' });
    saveAs(blob, 'reservoir_data.csv');
  };

  const exportToXLSX = () => {
    const data = allDataRows.map(r => ({
      วันที่: formatThaiDate(r.date),
      'ปริมาณน้ำ (ล้าน ลบ.ม.)': r.volume !== null ? r.volume.toFixed(2) : '',
      'น้ำไหลเข้า (ล้าน ลบ.ม.)': r.inflow !== null ? r.inflow.toFixed(2) : '',
      'น้ำระบายออก (ล้าน ลบ.ม.)': r.outflow !== null ? r.outflow.toFixed(2) : '',
    }));

    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'ข้อมูลอ่างเก็บน้ำ');
    const buf = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
    saveAs(new Blob([buf]), 'reservoir_data.xlsx');
  };

  const exportToXLS = () => {
    const data = allDataRows.map(r => ({
      วันที่: formatThaiDate(r.date),
      'ปริมาณน้ำ (ล้าน ลบ.ม.)': r.volume !== null ? r.volume.toFixed(2) : '',
      'น้ำไหลเข้า (ล้าน ลบ.ม.)': r.inflow !== null ? r.inflow.toFixed(2) : '',
      'น้ำระบายออก (ล้าน ลบ.ม.)': r.outflow !== null ? r.outflow.toFixed(2) : '',
    }));

    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'ข้อมูลอ่างเก็บน้ำ');
    const buf = XLSX.write(wb, { bookType: 'xls', type: 'array' });
    saveAs(new Blob([buf]), 'reservoir_data.xls');
  };

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2, flexWrap: 'wrap', gap: 2 }}>
        <FormControl size="small" sx={{ minWidth: 120 }}>
          <InputLabel sx={{ fontFamily: "Prompt" }}>เลือกปี</InputLabel>
          <Select
            value={selectedYear}
            label="เลือกปี"
            onChange={(e) => setSelectedYear(e.target.value)}
            sx={{ fontFamily: "Prompt" }}
          >
            {availableYears.map((year) => (
              <MenuItem key={year} value={year} sx={{ fontFamily: "Prompt" }}>
                {year === "ทั้งหมด" ? "ทั้งหมด" : `${Number(year) + 543}`}
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
        <Menu anchorEl={anchorEl} open={Boolean(anchorEl)} onClose={handleClose}>
          <MenuItem onClick={() => { exportToXLS(); handleClose(); }} sx={menuStyle}>
            <ListAltIcon sx={{ mr: 1 }} /> Export XLS
          </MenuItem>
          <MenuItem onClick={() => { exportToXLSX(); handleClose(); }} sx={menuStyle}>
            <TableChartIcon sx={{ mr: 1 }} /> Export XLSX
          </MenuItem>
          <MenuItem onClick={() => { exportToCSV(); handleClose(); }} sx={menuStyle}>
            <DownloadIcon sx={{ mr: 1 }} /> Export CSV
          </MenuItem>
          <MenuItem onClick={() => { exportToTXT(); handleClose(); }} sx={menuStyle}>
            <TextSnippetIcon sx={{ mr: 1 }} /> Export TXT
          </MenuItem>
        </Menu>
      </Box>

      {/* ตาราง */}
      <Box sx={{ maxHeight: '70vh', overflow: 'auto', border: '1px solid #ddd', borderRadius: 1 }}>
        <Table size="small" stickyHeader>
          <TableHead>
            <TableRow>
              <TableCell sx={HeaderCellStyle}>วันที่</TableCell>
              <TableCell sx={HeaderCellStyle}>ปริมาณน้ำ (ล้าน ลบ.ม.)</TableCell>
              <TableCell sx={HeaderCellStyle}>น้ำไหลเข้า (ล้าน ลบ.ม.)</TableCell>
              <TableCell sx={HeaderCellStyle}>น้ำระบายออก (ล้าน ลบ.ม.)</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {allDataRows.length === 0 ? (
              <TableRow>
                <TableCell colSpan={4} align="center" sx={{ py: 4, fontFamily: "Prompt" }}>
                  ไม่พบข้อมูล
                </TableCell>
              </TableRow>
            ) : (
              allDataRows.map((row, idx) => (
                <TableRow key={`${row.date}-${idx}`}>
                  <TableCell sx={getCellStyle(idx)}>{formatThaiDate(row.date)}</TableCell>
                  <TableCell sx={getCellStyle(idx)}>
                    {row.volume !== null ? row.volume.toFixed(2) : '-'}
                  </TableCell>
                  <TableCell sx={getCellStyle(idx)}>
                    {row.inflow !== null ? row.inflow.toFixed(2) : '-'}
                  </TableCell>
                  <TableCell sx={getCellStyle(idx)}>
                    {row.outflow !== null ? row.outflow.toFixed(2) : '-'}
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

export default ReservoirExportTable;
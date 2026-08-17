'use client';

import '@/app/globals.css';
import { Container, Grid, Box, Typography } from '@mui/material';
import { BoxStyle} from '@/theme/style';
import FloatingMenu from '@/components/Dashboard/FloatingMenu';
import ImageComponent from '../../components/Image';
import PdfViewer from '../../components/PdfViewer';
import { reportMenus } from '@/lib/menuFloating';
import { API_URL, formatThaiDay } from '@/lib/utility';

export default function Report() {
    return (
    <>
        <Container maxWidth="xl" sx={{ py: 2 }}>
      <Typography id="card-daily" gutterBottom sx={{ fontWeight: 'bold', color: 'primary.main',textAlign:{md:"left",xs:"center"},fontSize:{ md:24 , xs:19 }}}>
        รายงานสถานการณ์น้ำจากสำนักงานชลประทานที่ 3 วันที่ {formatThaiDay(Date())}
      </Typography>
        <Box sx={BoxStyle} id="dams-report">
        <Grid container spacing={1}>
            <Grid size={{xs:12, md:6}}>
                <ImageComponent src={`${API_URL}/report_rid03/3dams.jpg`} alt="สภาพน้ำเขื่อนภูมิพล เขื่อนสิริกิต์ และเขื่อแควน้อยฯ" title={'สภาพน้ำในเขื่อนประจำวัน'} />
            </Grid>
            <Grid size={{xs:12, md:6}} id="rid3-report">
                <ImageComponent src={`${API_URL}/report_rid03/onepages.jpg`} alt="สถานการณ์น้ำ สำนักงานชลประทานที่ 3" title={'สถานการณ์น้ำ สำนักงานชลประทานที่ 3'} />
            </Grid>
            </Grid>
            <Grid container spacing={1}>
            <Grid size={{xs:12, md:12}}>
                <ImageComponent src={`${API_URL}/report_rid03/dailyreport.jpg`} alt="สรุปสถานการณ์น้ำและการเฝ้าระวัง" title={'สรุปสถานการณ์น้ำและการเฝ้าระวัง'} />
            </Grid>
            </Grid>
        </Box>
            <Box sx={BoxStyle} id="diagrams-report">
                <PdfViewer src={`${API_URL}/report_rid03/report.pdf`} title="รายงานสถานการณ์น้ำประจำวัน สำนักงานชลประทานที่ 3" />
            </Box>
            <Box sx={BoxStyle}>
                <PdfViewer src={`${API_URL}/report_rid03/rpt.pdf`} title="รายงานสถานการณ์น้ำประจำวัน สำนักงานชลประทานที่ 3" />
            </Box>
        <FloatingMenu menus={reportMenus} />
        </Container>
    </>
    );
    }
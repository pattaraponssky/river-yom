'use client';

import '@/app/globals.css';
import { Container, Grid, Box } from '@mui/material';
import { BoxStyle} from '@/theme/style';
import FloatingMenu from '@/components/Dashboard/FloatingMenu';
import ImageComponent from '../../components/Image';
import PdfViewer from '../../components/PdfViewer';

export default function Report() {
    return (
    <>
        <Container maxWidth="xl" sx={{ py: 2 }}>
        <Box sx={BoxStyle} id="diagrams-report">
        <Grid container spacing={1}>
            <Grid size={{xs:12, md:6}}>
                <ImageComponent src="http://irrigation.rid.go.th/rid3/water/images/3dams.jpg" alt="สภาพน้ำเขื่อนภูมิพล เขื่อนสิริกิต์ และเขื่อแควน้อยฯ" title={'สภาพน้ำในเขื่อนประจำวัน'} />
            </Grid>
            <Grid size={{xs:12, md:6}}>
                <ImageComponent src="http://irrigation.rid.go.th/rid3/water/images/onepages.jpg" alt="สถานการณ์น้ำ สำนักงานชลประทานที่ 3" title={'สถานการณ์น้ำ สำนักงานชลประทานที่ 3'} />
            </Grid>
            </Grid>
            <Grid container spacing={1}>
            <Grid size={{xs:12, md:12}}>
                <ImageComponent src="http://irrigation.rid.go.th/rid3/water/images/dailyreport.jpg" alt="สรุปสถานการณ์น้ำและการเฝ้าระวัง" title={'สรุปสถานการณ์น้ำและการเฝ้าระวัง'} />
            </Grid>
            </Grid>
        </Box>
            <Box sx={BoxStyle}>
                <PdfViewer src="http://irrigation.rid.go.th/rid3/water/report.pdf" title="รายงานสถานการณ์น้ำประจำวัน สำนักงานชลประทานที่ 3" />
            </Box>
            <Box sx={BoxStyle}>
                <PdfViewer src="http://irrigation.rid.go.th/rid3/water/rpt050269.pdf" title="รายงานสถานการณ์น้ำประจำวัน สำนักงานชลประทานที่ 3" />
            </Box>
        <FloatingMenu/>
        </Container>
    </>
    );
    }
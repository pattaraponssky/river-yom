'use client';

import { Box, Typography, Container, Paper, Divider } from "@mui/material";
import { titleStyle, textStyle } from "@/theme/style";
import ImageComponent from '../../components/Image';
import { Path_URL } from "@/lib/utility";

export default function AboutUsPage() {
  return (
    <Container maxWidth="lg" sx={{ py: { xs: 4, md: 8 } }}>
      <Paper
        elevation={3}
        sx={{
          p: { xs: 3, md: 6 },
          borderRadius: 3,
          bgcolor: "background.paper",
        }}
      >
        <Typography
          variant="h3"
          component="h1"
          sx={{
            textAlign: "center",
            mb: 4,
            fontWeight: "bold",
            color: "primary.main",
          }}
        >
          เกี่ยวกับเรา
        </Typography>

        {/* ความเป็นมาของโครงการ */}
        <Typography
          variant="h5"
          component="h2"
          sx={{ mb: 2, fontWeight: "bold", color: "text.primary" }}
        >
          1. ความเป็นมาของโครงการ
        </Typography>

        <Typography
          variant="body1"
          sx={{
            ...textStyle,
            mb: 2,
            lineHeight: 1.8,
            textAlign: "justify",
          }}
        >
          ในสถานการณ์ปัจจุบันการติดตามและเฝ้าระวังสถานการณ์ทรัพยากรน้ำยังคงประสบข้อจำกัดสำคัญ ทั้งในด้านความรวดเร็ว ความแม่นยำ และความต่อเนื่องของข้อมูล ซึ่งส่งผลกระทบโดยตรงต่อการวิเคราะห์สถานการณ์ การพยากรณ์แนวโน้ม และการตัดสินใจในการบริหารจัดการทรัพยากรน้ำ ทำให้ไม่สามารถดำเนินการได้อย่างทันท่วงที โดยเฉพาะในภาวะที่สภาพภูมิอากาศแปรปรวนสูง และภัยพิบัติทางธรรมชาติรุนแรงขึ้น
        </Typography>

        <Typography
          variant="body1"
          sx={{
            ...textStyle,
            mb: 2,
            lineHeight: 1.8,
            textAlign: "justify",
          }}
        >
          พื้นที่ฝั่งขวาของแม่น้ำยมในเขตอำเภอบางระกำ จังหวัดพิษณุโลก เป็นพื้นที่ราบลุ่มต่ำนอกเขตชลประทาน มีคลองธรรมชาติจำนวนมาก ในช่วงฤดูฝนมักรับน้ำหลากจากจังหวัดกำแพงเพชร อย่างไรก็ตาม การพัฒนาแหล่งน้ำและโครงสร้างพื้นฐานชลประทานยังไม่สมบูรณ์ ประกอบกับขาดระบบเฝ้าระวังที่มีประสิทธิภาพ ส่งผลให้การบริหารจัดการน้ำในพื้นที่ดำเนินการได้อย่างยากลำบาก
        </Typography>

        <Typography
          variant="body1"
          sx={{
            ...textStyle,
            mb: 3,
            lineHeight: 1.8,
            textAlign: "justify",
          }}
        >
          เพื่อแก้ไขปัญหาดังกล่าว การติดตั้ง<strong>ระบบติดตามสถานการณ์น้ำระยะไกลแบบอัตโนมัติ</strong> จึงเป็นเครื่องมือจำเป็นที่ช่วยตรวจวัดและรายงานข้อมูลแบบเรียลไทม์ (Real-Time) ด้วยความแม่นยำสูง สนับสนุนภารกิจของสำนักงานชลประทานที่ 3 ในการวิเคราะห์แนวโน้ม ประเมินความเสี่ยง จัดทำแผนบริหารจัดการน้ำ ลดความเสี่ยงจากอุทกภัย ภัยแล้ง และปัญหาขาดแคลนน้ำ รวมถึงเสริมสร้างความมั่นคงด้านทรัพยากรน้ำอย่างยั่งยืน
        </Typography>

        <Divider sx={{ my: 3 }} />

        {/* วัตถุประสงค์ */}
        <Typography
          variant="h5"
          component="h2"
          sx={{ mb: 2, fontWeight: "bold", color: "text.primary" }}
        >
          2. วัตถุประสงค์ของโครงการ
        </Typography>

        <Box component="ol" sx={{ mb: 2, pl: 4 }}>
          <Typography component="li" variant="body1" sx={{ ...textStyle, mb: 1.5 }}>
            พัฒนาระบบตรวจวัด/ติดตามสถานการณ์น้ำ ในพื้นที่ลุ่มน้ำยมตอนล่างอย่างครอบคลุมและต่อเนื่อง
          </Typography>
          <Typography component="li" variant="body1" sx={{ ...textStyle, mb: 1.5 }}>
            พัฒนาระบบฐานข้อมูล รวมถึงโปรแกรมประยุกต์สำหรับแสดงผลข้อมูลสถานการณ์น้ำ เพื่อเพิ่มศักยภาพการวิเคราะห์ ประมวลผลข้อมูล และการตัดสินใจเชิงนโยบายของผู้บริหารอย่างมีประสิทธิภาพ
          </Typography>
          <Typography component="li" variant="body1" sx={{ ...textStyle }}>
            ยกระดับประสิทธิภาพการบริหารจัดการทรัพยากรน้ำอย่างยั่งยืนในพื้นที่ลุ่มน้ำยมฝั่งขวา ให้เกิดประโยชน์สูงสุดต่อประชาชนและภาคเกษตรกรรม
          </Typography>
        </Box>

        <Divider sx={{ my: 3 }} />

        {/* พื้นที่เป้าหมาย */}
        <Typography
          variant="h5"
          component="h2"
          sx={{ mb: 2, fontWeight: "bold", color: "text.primary" }}
        >
          3. พื้นที่เป้าหมาย
        </Typography>

        <Typography
          variant="body1"
          sx={{
            ...textStyle,
            mb: 3,
            lineHeight: 1.8,
            textAlign: "justify",
          }}
        >
          โครงการติดตั้งสถานีสนามทั้ง 6 จุด ในเขตอำเภอบางระกำ จังหวัดพิษณุโลก ดังนี้
        </Typography>

        <Box component="ol" sx={{ pl: 4, mb: 3 }}>
          {[
            "1. สะพานชุมแสงสงคราม ต.ชุมแสงสงคราม (แม่น้ำยม ท้าย ปตร.วังสะตือ)",
            "2. สะพานบ้านห้วงกระได ต.บางระกำ (คลองหนองเหล็ก)",
            "3. สะพานวัดทุ่งอ้ายโห้ ต.ชุมแสงสงคราม (คลองกลุกกลัก)",
            "4. สะพานข้ามคลองกรุงกรัก (บ้านยางแขวนอู่) ต.บางระกำ",
            "5. สะพานท่านางงาม ต.ท่านางงาม (แม่น้ำยม ก่อน ปตร.ท่านางงาม)",
            "6. สะพานข้ามคลองคด (ถนนพิษณุโลก-นครสวรรค์) ต.บ่อทอง",
          ].map((item, index) => (
            <Typography
              key={index}
              component="li"
              variant="body1"
              sx={{ ...textStyle, mb: 1, lineHeight: 1.8 }}
            >
              {item}
            </Typography>
          ))}
        </Box>

        {/* เพิ่มรูปแผนที่ */}
        <Box sx={{ my: 4, textAlign: "center" }}>
          <ImageComponent
            src={`${Path_URL}/images/สถานีติดตั้ง.jpg`}
            alt="แผนที่ตำแหน่งสถานีติดตั้งโครงการ"
            title="แผนที่ตำแหน่งสถานีวัดน้ำ 6 จุด ในอำเภอบางระกำ จังหวัดพิษณุโลก"
          />
        </Box>

        <Divider sx={{ my: 4 }} />

        {/* ขอบเขตการดำเนินงาน */}
        <Typography
          variant="h5"
          component="h2"
          sx={{ mb: 2, fontWeight: "bold", color: "text.primary" }}
        >
          4. ขอบเขตการดำเนินงานด้านวิชาการ
        </Typography>

        <Typography
          variant="body1"
          sx={{
            ...textStyle,
            mb: 2,
            lineHeight: 1.8,
            textAlign: "justify",
          }}
        >
          ขอบเขตงานหลักประกอบด้วย 3 กิจกรรมสำคัญ ได้แก่
        </Typography>

        <Box component="ol" sx={{ pl: 4, mb: 3 }}>
          <Typography component="li" variant="body1" sx={{ ...textStyle, mb: 1.5, fontWeight: "bold" }}>
            1. งานศึกษาและพัฒนาระบบตรวจวัด เพื่อการติดตามและบริหารจัดการน้ำ
          </Typography>
          <Typography component="li" variant="body1" sx={{ ...textStyle, mb: 1.5, fontWeight: "bold" }}>
            2. งานศึกษาและออกแบบระบบในการช่วยสนับสนุนการตัดสินใจในการบริหารจัดการน้ำ
          </Typography>
          <Typography component="li" variant="body1" sx={{ ...textStyle, fontWeight: "bold" }}>
            3. งานพัฒนาและออกแบบระบบฐานข้อมูล รวมถึงโปรแกรมประยุกต์สำหรับแสดงผลข้อมูลสถานการณ์น้ำ (Dashboard แบบ Web-based )
          </Typography>
        </Box>

        <Typography
          variant="body1"
          sx={{
            ...textStyle,
            mb: 3,
            lineHeight: 1.8,
            textAlign: "justify",
            fontStyle: "italic",
          }}
        >
          นอกจากนี้ ยังมีการถ่ายทอดความรู้การใช้งานระบบและบำรุงรักษาให้เจ้าหน้าที่กรมชลประทานอย่างน้อย 1 ครั้ง (ไม่ต่ำกว่า 10 คน ครั้งละไม่ต่ำกว่า 2 วัน)
        </Typography>

        <Divider sx={{ my: 4 }} />

      </Paper>
    </Container>
  );
}
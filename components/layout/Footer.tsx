import React, { useEffect, useState } from "react";
import { Box, Typography, Container, Grid, Link } from "@mui/material";
import {LocationOn  } from "@mui/icons-material";
import { API_URL } from '@/lib/utility';
import { textStyle } from '../../theme/style';
import { Path_URL } from '../../lib/utility';



const Footer: React.FC = () => {
    const [contact, setContact] = useState("");
    const [address, setAddress] = useState("");
  
    const fetchAboutUs = async () => {
      try {
        const res = await fetch(`${API_URL}/aboutus`);
        const data = await res.json();
        setContact(data.contact || "");
        setAddress(data.address || "");
      } catch (err) {
        console.error("Error fetching About Us:", err);
      }
    };
  
    useEffect(() => {
      fetchAboutUs();
    }, []);
    
  return (
    <Box
      component="footer"
      sx={{
        fontFamily: "Prompt",
        // background: "linear-gradient(to bottom, #adf6fe, #1976D2)", // ไล่สีจากฟ้าอ่อน (บน) ไปเข้ม (ล่าง)
        backgroundImage: `url(${Path_URL}images/bg_footer.jpg)`, // ใส่ภาพพื้นหลัง
        color: "#fff", // เปลี่ยนสีตัวอักษรให้เป็นสีขาวเพื่อให้ตัดกับพื้นหลัง
        padding: "1rem 0",
        textAlign: "center",
        mt: "auto",
      }}
    >
      <Container maxWidth="lg">
        <Grid container spacing={3}>
          {/* Left Section - Address */}
          <Grid size={{xs:12, md:6}}>
            {/* Header with Icon */}
            <Typography variant="h6" sx={{ ...textStyle, fontWeight: "600" ,color:"#333"}} gutterBottom>
              <LocationOn sx={{ verticalAlign: "middle", marginRight: "8px",   }} /> กรมชลประทาน
            </Typography>
            <Typography variant="body1" sx={{...textStyle,color:"#333"}}>
              {address}
            </Typography>
          </Grid>

          {/* Right Section - Contact */}
          <Grid size={{xs:12, md:6}}>
            {/* Header with Icon */}
            {/* <Typography variant="h6" sx={{ ...textStyle, fontWeight: "600" }} gutterBottom>
              <Web sx={{ verticalAlign: "middle", marginRight: "8px" }} /> ช่องทางติดต่อ
            </Typography> */}

            <Typography variant="body1" sx={textStyle}>
              <Link
                href="http://www.rid.go.th"
                target="_blank"
                rel="noopener noreferrer"
       
                sx={{ verticalAlign: "middle", marginRight: "8px" ,fontWeight: 600, color:"#333", textDecoration: "none" }}
              >
                🌐 www.rid.go.th
              </Link>
            </Typography>
            <Typography variant="body1" gutterBottom sx={{...textStyle,color:"#333"}}>
              {contact}
            </Typography>
            <Typography variant="body2" sx={{ marginTop: "1rem" ,color:"#333" }}>
              &copy; {new Date().getFullYear()} กรมชลประทาน. All rights reserved.
            </Typography>
          </Grid>
        </Grid>
      </Container>
    </Box>
  );
};

export default Footer;


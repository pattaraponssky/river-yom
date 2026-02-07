import { Typography } from "@mui/material";
import React, { useRef } from "react";
import { titleStyle } from "../theme/style";

interface ImageProps {
  src: string;
  alt: string;
  title: string;
  width?: string | number | { xs?: string | number, sm?: string | number, md?: string | number };
  height?: string | number | { xs?: string | number, sm?: string | number, md?: string | number };
}

const ImageComponent: React.FC<ImageProps> = ({ src, alt, title, width, height }) => {
  const dialogRef = useRef<HTMLDialogElement>(null);

  const openDialog = () => {
    if (dialogRef.current) {
      dialogRef.current.showModal();
    }
  };

  const closeDialog = (e: React.MouseEvent<HTMLDialogElement>) => {
    if (e.target === dialogRef.current) {
      dialogRef.current?.close();
    }
  };

  // Function to get the correct style value based on the screen size (simple logic for demonstration)
  const getStyleValue = (value: string | number | { xs?: string | number, sm?: string | number, md?: string | number } | undefined): string | number | undefined => {
    if (typeof value === 'object' && value !== null) {
      return value.xs ?? value.sm ?? value.md;
    }
    return value;
  };

  const dynamicWidth = getStyleValue(width);
  const dynamicHeight = getStyleValue(height);

  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", padding: "10px", fontFamily: "Prompt", maxWidth: "100%" }}>
      <Typography sx={{ marginBottom: {md:"1rem", xs:"0.6"}, fontWeight: 600, ...titleStyle}}>
        {title}
      </Typography>
     <img
        src={src}
        alt={alt}
        loading="eager"
        decoding="sync"
        onClick={openDialog}
        style={{
          maxWidth: "100%",
          width: dynamicWidth ? dynamicWidth : "100%",
          height: dynamicHeight ? dynamicHeight : "auto",
          objectFit: "contain",       // แทน cover ถ้าอยากให้ไม่ครอป
          cursor: "zoom-in",
          transform: "translateZ(0)",     // บังคับ render ด้วย GPU → ภาพคมขึ้น
        }}
      />

      {/* Dialog แสดงภาพขยาย */}
      <dialog ref={dialogRef} onClick={closeDialog} 
      style={{ 
          border: "none", background: "rgba(0, 0, 0, 0.1)",
          maxWidth: "95vw",
          maxHeight: "95vh",
          margin: "auto", // สำคัญมาก! ทำให้ dialog อยู่กึ่งกลางอัตโนมัติ
          alignItems: "center",
          justifyContent: "center",
       }}>
        <img
          src={src}
          alt={alt}
             style={{
            maxWidth: "95vw",
            height: "auto",
            maxHeight: "95vh",
            objectFit: "contain",
            borderRadius: "8px",
          }}
        />
      </dialog>
    </div>
  );
};

export default ImageComponent;
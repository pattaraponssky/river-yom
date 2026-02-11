export const textStyle = {
  fontFamily: "Prompt",
  fontSize: { md: "1rem", xs: "0.75rem" },
};

export const titleStyle = {
  fontFamily: "Prompt",
  fontSize: { md: "1.2rem", xs: "0.95rem" },
  textAlign:{ md:"start",xs:"center"}
};

export const BoxStyle = (theme: any) => ({
  margin: "auto",
  borderRadius: "10px",
  boxShadow: 3,
  marginBottom: { md: "20px", xs: "10px" },
  padding: { md: "20px", xs: "5px" },
  backgroundColor:
    theme.palette.mode === "dark"
      ? theme.palette.background.paper
      : "#fff",
});

export const fontTitle = {
  fontFamily: "Prompt",
  fontSize: {md:"1.2rem", xs:"1rem"},
  fontWeight: 600,
};

export const fontInfo = {
  fontFamily: "Prompt",
  fontSize:{md: "1.1rem", xs: "0.9rem"},
};

export const HeaderCellStyle = (theme: any) => ({
  whiteSpace: "nowrap",
  border: `1px solid ${theme.palette.divider}`,
  fontWeight: "bold",
  textAlign: "center",
  backgroundColor: theme.palette.mode === 'dark' ? '#01579B' : 'rgb(1, 87, 155)',
  color: theme.palette.mode === 'dark' ? '#e0e7ff' : 'white',
  fontSize: { xs: "0.8rem", sm: "0.9rem", md: "0.95rem" },
  fontFamily: "Prompt",

});


export const getCellStyle = (index: number) => (theme: any) => ({
  whiteSpace: "nowrap",
  border: `1px solid ${theme.palette.divider}`,
  padding: "5px",
  backgroundColor: index % 2 === 0
    ? (theme.palette.mode === 'dark' ? '#1e293b' : '#FAFAFA')
    : (theme.palette.mode === 'dark' ? '#111827' : '#FFF'),
  textAlign: "center",
  fontFamily: "Prompt",
  fontSize: { xs: "0.8rem", sm: "0.9rem", md: "0.9rem" },
  color: theme.palette.text.primary,
});

export const getCellDiffStyle = (index: number,fontColor:any) => (theme: any) => ({

    border: `1px solid ${theme.palette.divider}`,
    backgroundColor: index % 2 === 0
        ? (theme.palette.mode === 'dark' ? '#1e293b' : '#FAFAFA')
        : (theme.palette.mode === 'dark' ? '#111827' : '#FFF'),
    color: fontColor || "black",
    textAlign: "center",
    fontFamily: "Prompt",
    wordWrap: "break-word",
    whiteSpace: "normal",
    overflow: "hidden",
    textOverflow: "ellipsis",
    fontSize: { xs: "0.8rem", sm: "0.9rem", md: "1rem" },
    padding: "5px",
  });

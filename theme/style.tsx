export const textStyle = {
  fontFamily: "Prompt",
  fontSize: { md: "1rem", xs: "0.75rem" },
};

export const titleStyle = {
  fontFamily: "Prompt",
  fontSize: { md: "1.2rem", xs: "0.95rem" },
  textAlign:{ md:"start",xs:"center"}
};

export const BoxStyle = {
  margin: "auto",
  borderRadius: "10px",
  boxShadow: 3,
  marginBottom: {md:"20px", xs:"10px"},
  padding: {md:"20px", xs:"5px"},
};

export const fontInfo = {
  fontFamily: "Prompt",
  fontSize:{md: "1.1rem", xs: "0.9rem"},
};


export const HeaderCellStyle = {
  position: "sticky",
  // top: { xs: 115, md: 60 },
  border: "1px solid #ddd",
  fontFamily: "Prompt",
  fontWeight: "bold",
  textAlign: "center",
  backgroundColor: "rgb(1, 87, 155)",
  color: "white",
  fontSize: { xs: "0.8rem", sm: "0.8rem", md: "1rem" },
};

export const getCellStyle = (index: number) => ({
  border: "1px solid #ddd",
  padding: "5px",
  backgroundColor: index % 2 === 0 ? "#FAFAFA" : "#FFF",
  textAlign: "center",
  fontFamily: "Prompt",
  fontSize: { xs: "0.7rem", sm: "0.8rem", md: "1rem" },
});

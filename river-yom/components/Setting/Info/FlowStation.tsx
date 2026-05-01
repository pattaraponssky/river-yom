// components/Setting/Info/FlowStation.tsx
import React, { useEffect } from "react";
import { Snackbar, Alert } from "@mui/material";
import { StationTable } from "./StationTable";
import { useStationCRUD } from "./useStationCRUD";

const InfoFlowStation: React.FC = () => {
  const { stations, snackbar, fetchAll, handleAdd, handleEdit, handleDelete, closeSnackbar } =
    useStationCRUD({ endpoint: "/api/flow_info", idField: "sta_code" });

  useEffect(() => { fetchAll(); }, [fetchAll]);

  return (
    <>
      <StationTable
        stations={stations}
        title="เพิ่มสถานีวัดน้ำท่า"
        addLabel="เพิ่มสถานี"
        idField="sta_code"
        requiredFields={["sta_code", "sta_name"]}
        onAdd={handleAdd}
        onEdit={handleEdit}
        onDelete={handleDelete}
      />
      <Snackbar open={snackbar.open} autoHideDuration={5000} onClose={closeSnackbar}
        anchorOrigin={{ vertical: "bottom", horizontal: "center" }}>
        <Alert severity={snackbar.severity} variant="filled" onClose={closeSnackbar}>
          {snackbar.message}
        </Alert>
      </Snackbar>
    </>
  );
};

export default InfoFlowStation;
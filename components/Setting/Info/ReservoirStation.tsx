// components/Setting/Info/ReservoirStation.tsx
import React, { useEffect } from "react";
import { Snackbar, Alert } from "@mui/material";
import { StationTable } from "./StationTable";
import { useStationCRUD } from "./useStationCRUD";

const InfoDamStation: React.FC = () => {
  const { stations, snackbar, fetchAll, handleAdd, handleEdit, handleDelete, closeSnackbar } =
    useStationCRUD({ endpoint: "/api/reservoir_info", idField: "res_code", credentials: true });

  useEffect(() => { fetchAll(); }, [fetchAll]);

  return (
    <>
      <StationTable
        stations={stations}
        title="เพิ่มอ่างเก็บน้ำ"
        addLabel="เพิ่มอ่างเก็บน้ำ"
        idField="res_code"
        requiredFields={["res_code", "res_name"]}
        onAdd={handleAdd}
        onEdit={handleEdit}
        onDelete={handleDelete}
        credentials
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

export default InfoDamStation;
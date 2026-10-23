// components/Setting/Info/SeaStation.tsx
import React, { useEffect } from "react";
import { Snackbar, Alert } from "@mui/material";
import { StationTable } from "./StationTable";
import { useStationCRUD } from "./useStationCRUD";
import { SEA_STATION_CONFIG } from "./stationInfoConfig";

const InfoSeaStation: React.FC = () => {
  const { stations, snackbar, fetchAll, handleAdd, handleEdit, handleDelete, closeSnackbar } =
    useStationCRUD({ endpoint: "/api/sea_info", idField: "sta_code" });

  useEffect(() => { fetchAll(); }, [fetchAll]);

  return (
    <>
      <StationTable
        stations={stations}
        config={SEA_STATION_CONFIG}
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

export default InfoSeaStation;
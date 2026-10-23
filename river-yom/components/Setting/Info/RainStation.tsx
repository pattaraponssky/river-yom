// components/Setting/Info/RainStation.tsx
import React, { useEffect } from "react";
import { Snackbar, Alert } from "@mui/material";
import { StationTable } from "./StationTable";
import { useStationCRUD } from "./useStationCRUD";
import { RAIN_STATION_CONFIG } from "./stationInfoConfig";

const InfoRainStation: React.FC = () => {
  const { stations, snackbar, fetchAll, handleAdd, handleEdit, handleDelete, closeSnackbar } =
    useStationCRUD({ endpoint: "/api/rain_info", idField: "sta_code" });

  useEffect(() => { fetchAll(); }, [fetchAll]);

  return (
    <>
      <StationTable
        stations={stations}
        config={RAIN_STATION_CONFIG}
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

export default InfoRainStation;
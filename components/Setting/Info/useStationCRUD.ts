// components/Setting/Info/useStationCRUD.ts
import { useState, useCallback } from "react";
import { API_URL } from "@/lib/utility";
import { apiRequest } from "@/lib/api";

interface UseCRUDOptions {
  endpoint: string;       // เช่น "/api/rain_info"
  idField: string;        // เช่น "sta_code"
  credentials?: boolean;
}

export function useStationCRUD({ endpoint, idField, credentials = false }: UseCRUDOptions) {
  const [stations, setStations] = useState<any[]>([]);
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: "",
    severity: "success" as "success" | "error",
  });

  const fetchAll = useCallback(async () => {
    try {
      const res  = await apiRequest(`${API_URL}${endpoint}`);
      const data = await res.json();
      setStations(Array.isArray(data) ? data : data?.data ?? []);
    } catch {
      showSnackbar("โหลดข้อมูลล้มเหลว", "error");
    }
  }, [endpoint]);

  const handleAdd = useCallback(async (newData: any) => {
    try {
      await apiRequest(`${API_URL}${endpoint}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: credentials ? "include" : "same-origin",
        body: JSON.stringify(newData),
      });
      await fetchAll();
      showSnackbar("เพิ่มข้อมูลสำเร็จ", "success");
    } catch {
      showSnackbar("เพิ่มข้อมูลล้มเหลว", "error");
    }
  }, [endpoint, credentials, fetchAll]);

  const handleEdit = useCallback(async (editData: any) => {
    try {
      await apiRequest(`${API_URL}${endpoint}/${editData[idField]}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        credentials: credentials ? "include" : "same-origin",
        body: JSON.stringify(editData),
      });
      setStations(prev =>
        prev.map(s => s[idField] === editData[idField] ? editData : s)
      );
      showSnackbar("แก้ไขข้อมูลสำเร็จ", "success");
    } catch {
      showSnackbar("แก้ไขข้อมูลล้มเหลว", "error");
    }
  }, [endpoint, idField, credentials]);

  const handleDelete = useCallback(async (id: string) => {
    try {
      await apiRequest(`${API_URL}${endpoint}/${id}`, {
        method: "DELETE",
        credentials: credentials ? "include" : "same-origin",
      });
      setStations(prev => prev.filter(s => s[idField] !== id));
      showSnackbar("ลบข้อมูลสำเร็จ", "success");
    } catch {
      showSnackbar("ลบข้อมูลล้มเหลว", "error");
    }
  }, [endpoint, idField, credentials]);

  const showSnackbar = (message: string, severity: "success" | "error") => {
    setSnackbar({ open: true, message, severity });
  };

  const closeSnackbar = () => setSnackbar(prev => ({ ...prev, open: false }));

  return {
    stations,
    snackbar,
    fetchAll,
    handleAdd,
    handleEdit,
    handleDelete,
    closeSnackbar,
  };
}
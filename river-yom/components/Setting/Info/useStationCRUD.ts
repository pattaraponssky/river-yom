// components/Setting/Info/useStationCRUD.ts
import { useState, useCallback } from "react";
import { API_URL } from "@/lib/utility";
import { apiRequest } from "@/lib/api";

type StationRecord = Record<string, unknown>;

interface UseCRUDOptions {
  endpoint: string;
  idField: string;
  credentials?: boolean;
}

interface ApiErrorBody {
  message?: string;
  messages?: Record<string, string>;
}

const getErrorMessage = async (res: Response, fallback: string) => {
  const body = (await res.json().catch(() => null)) as ApiErrorBody | null;
  return body?.messages?.error ?? body?.message ?? fallback;
};

export function useStationCRUD({ endpoint, idField, credentials = false }: UseCRUDOptions) {
  const [stations, setStations] = useState<StationRecord[]>([]);
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: "",
    severity: "success" as "success" | "error",
  });

  const showSnackbar = (message: string, severity: "success" | "error") => {
    setSnackbar({ open: true, message, severity });
  };

  const fetchAll = useCallback(async () => {
    try {
      const res = await apiRequest(`${API_URL}${endpoint}`);
      if (!res.ok) throw new Error("โหลดข้อมูลล้มเหลว");
      const data = await res.json();
      setStations(Array.isArray(data) ? data : data?.data ?? []);
    } catch {
      showSnackbar("โหลดข้อมูลล้มเหลว", "error");
    }
  }, [endpoint]);

  const handleAdd = useCallback(async (newData: StationRecord) => {
    try {
      const res = await apiRequest(`${API_URL}${endpoint}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: credentials ? "include" : "same-origin",
        body: JSON.stringify(newData),
      });

      if (!res.ok) {
        throw new Error(await getErrorMessage(res, "เพิ่มข้อมูลล้มเหลว"));
      }

      await fetchAll();
      showSnackbar("เพิ่มข้อมูลสำเร็จ", "success");
    } catch (error: unknown) {
      showSnackbar(error instanceof Error ? error.message : "เพิ่มข้อมูลล้มเหลว", "error");
    }
  }, [endpoint, credentials, fetchAll]);

  const handleEdit = useCallback(async (editData: StationRecord) => {
    try {
      const res = await apiRequest(`${API_URL}${endpoint}/${editData[idField]}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        credentials: credentials ? "include" : "same-origin",
        body: JSON.stringify(editData),
      });

      if (!res.ok) {
        throw new Error(await getErrorMessage(res, "แก้ไขข้อมูลล้มเหลว"));
      }

      setStations(prev =>
        prev.map(station => station[idField] === editData[idField] ? { ...station, ...editData } : station)
      );
      showSnackbar("แก้ไขข้อมูลสำเร็จ", "success");
    } catch (error: unknown) {
      showSnackbar(error instanceof Error ? error.message : "แก้ไขข้อมูลล้มเหลว", "error");
    }
  }, [endpoint, idField, credentials]);

  const handleDelete = useCallback(async (id: string) => {
    try {
      const res = await apiRequest(`${API_URL}${endpoint}/${id}`, {
        method: "DELETE",
        credentials: credentials ? "include" : "same-origin",
      });

      if (!res.ok) {
        throw new Error(await getErrorMessage(res, "ลบข้อมูลล้มเหลว"));
      }

      setStations(prev => prev.filter(station => station[idField] !== id));
      showSnackbar("ลบข้อมูลสำเร็จ", "success");
    } catch (error: unknown) {
      showSnackbar(error instanceof Error ? error.message : "ลบข้อมูลล้มเหลว", "error");
    }
  }, [endpoint, idField, credentials]);

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

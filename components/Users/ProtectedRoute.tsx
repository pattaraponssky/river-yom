import React from "react";
import { Navigate, Outlet } from "react-router-dom";

interface ProtectedRouteProps {
  allowedLevels: number[]; // ระบุ id_level ที่อนุญาตเข้าถึงได้
  userLevel: number | null; // รับ userLevel จาก props
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ allowedLevels, userLevel }) => {
    if (userLevel === null || userLevel === undefined || userLevel === 0) {
        return <Navigate to="/dashboard" replace />;
      }

  if (!allowedLevels.includes(userLevel)) {
    // ถ้า userLevel ไม่ตรงกับ allowedLevels ให้ redirect
    return <Navigate to="/dashboard" replace />;
  }

  // มีสิทธิ์เข้าถึง
  return <Outlet />;
};

export default ProtectedRoute;

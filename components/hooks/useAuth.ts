import { API_URL } from "@/lib/utility";
import { useState, useEffect } from "react";

interface User {
    iduser_level?: number; // Made optional to handle cases where it might not exist
    username: string;
    email: string;
  }

export function useAuth() {
    const [currentUser, setCurrentUser] = useState<User | null>(null);
  
    useEffect(() => {
      const storedUser = localStorage.getItem("user");
      if (storedUser) {
        try {
          const parsedUser = JSON.parse(storedUser);
          setCurrentUser(parsedUser);
        } catch (error) {
          console.error("Error parsing user from localStorage", error);
        }
      }
    }, []);
  
    const handleLogout = async () => {
      try {
        const response = await fetch(`${API_URL}/user/logout`, {
          method: 'POST',
          credentials: 'include',
        });
    
        console.log('Logout response status:', response.status);
    
        if (!response.ok) {
          const text = await response.text();
          console.error('Logout failed response:', text);
          throw new Error('Logout failed');
        }
    
        // const data = await response.json();
        // alert(data.message || 'Logout successful');
    
        // ล้างข้อมูลผู้ใช้ที่เก็บใน localStorage และ state
        localStorage.removeItem("user");
        setCurrentUser(null);
    
        // redirect ไปหน้า login หรือ home ที่เหมาะสม
        window.location.href = '/dashboard'; // ปรับ URL ตามที่ต้องการ
    
      } catch (error) {
        console.error('Error during logout:', error);
        // alert('Logout ล้มเหลว กรุณาลองใหม่');
      }
    };
    
    

    return { currentUser, setCurrentUser, handleLogout };
  }
  
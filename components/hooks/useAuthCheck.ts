import { API_URL } from "@/lib/utility";
import { useEffect, useState } from "react";



const useAuthCheck = () => {
  const [loading, setLoading] = useState(true);
  const [authenticated, setAuthenticated] = useState(false);
  
  useEffect(() => {
    const checkAuth = async () => {
      try {
        const res = await fetch(`${API_URL}/api/check_auth`, {
          method: "GET",
          credentials: "include",
          headers: {
            'Accept': 'application/json',
          },
        });

        if (res.ok) {
          setAuthenticated(true);
        } else {
          setAuthenticated(false);
          throw new Error("Unauthorized");
        }
      } catch (err) {
        console.warn("🚫 Token invalid or expired:", err);
        localStorage.removeItem("user");
        setAuthenticated(false);
        // redirect ไปหน้า login เพราะ token หมดอายุ/ไม่ถูกต้อง
      } finally {
        setLoading(false);
      }
    };
    checkAuth();
  }, []); 

  return { loading, authenticated };
};

export default useAuthCheck;

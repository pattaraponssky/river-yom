
////// API PATHS //////
export const API_URL = process.env.NEXT_PUBLIC_API_URL;
if (!API_URL) throw new Error('NEXT_PUBLIC_API_URL is not set');
export const Path_URL = "./../"; // For Dev
export const Model_URL = "https://swocthachin.rid.go.th/swoc-model";
export const Forecast_URL = "https://swocthachin.rid.go.th/swoc-model/Ras_data"
///////////////////////

export const nowThaiDate = () => {
  const daysOfWeek = ["อาทิตย์", "จันทร์", "อังคาร", "พุธ", "พฤหัสบดี", "ศุกร์", "เสาร์"];
  const monthsOfYear = ["มกราคม", "กุมภาพันธ์", "มีนาคม", "เมษายน", "พฤษภาคม", "มิถุนายน", "กรกฎาคม", "สิงหาคม", "กันยายน", "ตุลาคม", "พฤศจิกายน", "ธันวาคม"];
  const today = new Date();
  const dayOfWeek = daysOfWeek[today.getDay()];
  const dayOfMonth = today.getDate();
  const month = monthsOfYear[today.getMonth()];
  const year = today.getFullYear() + 543; // เพิ่ม 543 สำหรับปีพุทธศักราช
  

  return `${dayOfWeek}ที่ ${dayOfMonth} ${month} ${year}`;
};

  export const formatThaiDay = (time: string): string => {
  const date = new Date(time);
  const yearBE = date.getFullYear() + 543; // แปลงเป็น พ.ศ.

  // เดือนชื่อเต็ม
  // const monthNamesThai = [
  //   "มกราคม", "กุมภาพันธ์", "มีนาคม", "เมษายน", "พฤษภาคม", "มิถุนายน",
  //   "กรกฎาคม", "สิงหาคม", "กันยายน", "ตุลาคม", "พฤศจิกายน", "ธันวาคม"
  // ];

  const monthNamesThai = [
    "ม.ค.", "ก.พ.", "มี.ค.", "เม.ย.", "พ.ค.", "มิ.ย.",
    "ก.ค.", "ส.ค.", "ก.ย.", "ต.ค.", "พ.ย.", "ธ.ค."
  ];

  const month = monthNamesThai[date.getMonth()];
  const day = date.getDate().toString().padStart(2, '0');

  return `${day} ${month} ${yearBE}`;
};

/**
 * แปลงวันที่เวลาแบบ ISO string หรือ string ธรรมดา ให้เป็นรูปแบบภาษาไทย
 * เช่น "2025-11-17T09:00:00" → "17 พ.ย. 2568 09:00 น."
 * รองรับทั้งแบบมี T และไม่มี T
 */
export const formatThaiDateTime = (dateTimeStr: string | null | undefined): string => {
  if (!dateTimeStr) {
    return "–"; // หรือ "ไม่มีข้อมูล"
  }

  try {
    // แก้เคสพิเศษ เช่น "2025-11-17T00007:00" → ทำให้เป็น "2025-11-17T00:07:00"
    let normalized = dateTimeStr
      .trim()
      .replace(/T0+(\d{2})(\d{2}):?(\d{2})?$/, (match, h, m, s = "00") => {
        return `T${h.padStart(2, "0")}:${m.padStart(2, "0")}:${s.padStart(2, "0")}`;
      });

    // ถ้าไม่มี T ให้เพิ่มเอง (กรณี "2025-11-17 09:00")
    if (!normalized.includes("T") && normalized.includes(" ")) {
      normalized = normalized.replace(" ", "T");
    }

    const date = new Date(normalized);

    if (isNaN(date.getTime())) {
      console.warn("วันที่ไม่ถูกต้อง:", dateTimeStr);
      return "วันที่ไม่ถูกต้อง";
    }

    // แปลงเป็นภาษาไทย
    const thaiDate = date.toLocaleDateString("th-TH", {
      day: "numeric",
      month: "short",
      year: "2-digit", // พ.ศ. 2 หลัก เช่น 68
    });

    const thaiTime = date.toLocaleTimeString("th-TH", {
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
    });

    return `${thaiDate} ${thaiTime} น.`;
  } catch (err) {
    console.error("Error formatting date:", dateTimeStr, err);
    return "รูปแบบวันที่ไม่ถูกต้อง";
  }
};
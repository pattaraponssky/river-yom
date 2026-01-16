
////// API PATHS //////
export const API_URL = "http://localhost:8080";
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
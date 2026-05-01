// lib/sanitize.ts
export function sanitizeInput(value: string): string {
  return value
    .replace(/[<>]/g, '')           // ป้องกัน XSS เบื้องต้น
    .trim()
    .slice(0, 500);                 // จำกัดความยาว
}

export function sanitizeNumber(value: string): number | null {
  const n = parseFloat(value);
  return isNaN(n) ? null : n;
}

// ใช้ใน StationTable form
// onChange={e => setNewFeature((prev: any) => ({
//   ...prev,
//   [key]: sanitizeInput(e.target.value)
// }))}
const readingDateFormat = new Intl.DateTimeFormat('th-TH', {
  timeZone: 'Asia/Bangkok',
  day: 'numeric',
  month: 'short',
  year: 'numeric',
  hour: '2-digit',
  minute: '2-digit',
  hourCycle: 'h23',
});

export function formatReadingTime(value?: string | null) {
  if (!value) return 'ไม่มีข้อมูลล่าสุด';
  const timestamp = value.trim().replace(' ', 'T');
  const hasOffset = /(?:Z|[+-]\d{2}:?\d{2})$/i.test(timestamp);
  const date = new Date(hasOffset ? timestamp : `${timestamp}+07:00`);
  return Number.isFinite(date.getTime())
    ? `ข้อมูลล่าสุด ${readingDateFormat.format(date)} น.`
    : 'ไม่มีข้อมูลล่าสุด';
}

export function readingNumber(value: unknown): number | null {
  if (typeof value !== 'number' && (typeof value !== 'string' || value.trim() === '')) return null;
  const number = Number(value);
  return Number.isFinite(number) ? number : null;
}

export function formatReadingValue(value: unknown) {
  return readingNumber(value)?.toFixed(2) ?? '-';
}

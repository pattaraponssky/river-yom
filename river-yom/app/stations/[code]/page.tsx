// app/stations/[code]/page.tsx
import { API_URL } from '@/lib/utility';
import StationDetailClient from './StationDetailClient';

// จำเป็นเพราะโปรเจกต์นี้ตั้ง output: 'export' (static export)
// ต้องบอก Next.js ล่วงหน้าว่ามี sta_code ไหนบ้างที่ต้อง pre-render
export async function generateStaticParams() {
  try {
    const res = await fetch(`${API_URL}/api/stations`, { cache: 'no-store' });

    if (!res.ok) {
      console.warn('generateStaticParams (stations): API not ok', res.status);
      return [{ code: 'YR.01' }];
    }

    const json = await res.json();
    const items = json.data || [];

    if (!items.length) {
      return [{ code: 'YR.01' }];
    }

    return items.map((item: any) => ({
      code: String(item.sta_code),
    }));
  } catch (e) {
    console.error('generateStaticParams (stations) failed:', e);
    return [{ code: 'YR.01' }];
  }
}

interface PageProps {
  params: Promise<{ code: string }>;
}

export default async function StationDetailPage({ params }: PageProps) {
  const { code } = await params;
  return <StationDetailClient staCode={decodeURIComponent(code)} />;
}
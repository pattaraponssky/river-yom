// app/stations/[code]/equipment/new/page.tsx
import { API_URL } from '@/lib/utility';
import EquipmentFormClient from '@/components/Equipment/EquipmentFormClient';

export async function generateStaticParams() {
  try {
    const res = await fetch(`${API_URL}/api/stations`, { cache: 'no-store' });
    if (!res.ok) return [{ code: 'YR.01' }];
    const json = await res.json();
    const items = json.data || [];
    if (!items.length) return [{ code: 'YR.01' }];
    return items.map((item: any) => ({ code: String(item.sta_code) }));
  } catch (e) {
    console.error('generateStaticParams (equipment/new) failed:', e);
    return [{ code: 'YR.01' }];
  }
}

interface PageProps {
  params: Promise<{ code: string }>;
}

export default async function NewEquipmentPage({ params }: PageProps) {
  const { code } = await params;
  return <EquipmentFormClient mode="create" staCode={decodeURIComponent(code)} />;
}
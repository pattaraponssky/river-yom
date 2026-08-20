// app/stations/[code]/equipment/[id]/edit/page.tsx
import { API_URL } from '@/lib/utility';
import EquipmentFormClient from '@/components/Equipment/EquipmentFormClient';

// จำเป็นเพราะ output: 'export' — path นี้มี 2 dynamic segments (code, id)
// ต้องคืนคู่ {code, id} ให้ครบทุกอุปกรณ์ที่มีจริง
export async function generateStaticParams() {
  try {
    const res = await fetch(`${API_URL}/api/equipments`, { cache: 'no-store' });
    if (!res.ok) return [{ code: 'YR.01', id: '1' }];
    const json = await res.json();
    const items = json.data || [];
    if (!items.length) return [{ code: 'YR.01', id: '1' }];
    return items.map((item: any) => ({
      code: String(item.sta_code),
      id: String(item.id),
    }));
  } catch (e) {
    console.error('generateStaticParams (equipment/[id]/edit) failed:', e);
    return [{ code: 'YR.01', id: '1' }];
  }
}

interface PageProps {
  params: Promise<{ code: string; id: string }>;
}

export default async function EditEquipmentPage({ params }: PageProps) {
  const { code, id } = await params;
  return (
    <EquipmentFormClient
      mode="edit"
      staCode={decodeURIComponent(code)}
      equipmentId={id}
    />
  );
}
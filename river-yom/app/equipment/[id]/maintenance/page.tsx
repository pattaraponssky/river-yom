// app/equipment/[id]/maintenance/page.tsx
import { API_URL } from '@/lib/utility';
import MaintenanceClient from './MaintenanceClient';

// ⚠️ static export ต้องรู้ล่วงหน้าว่ามี id อะไรบ้าง
export async function generateStaticParams() {
  try {
    const res = await fetch(`${API_URL}/api/equipments`);
    const json = await res.json();
    const items = json.data || [];
    return items.map((item: any) => ({ id: String(item.id) }));
  } catch (e) {
    console.error('generateStaticParams failed:', e);
    return []; // build ผ่านได้แม้ fetch พลาด แต่จะไม่มีหน้า id ไหน pre-render เลย
  }
}

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function EquipmentMaintenancePage({ params }: PageProps) {
  const { id } = await params;
  return <MaintenanceClient id={id} />;
}
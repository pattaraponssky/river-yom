// app/equipment/[id]/maintenance/page.tsx
import { API_URL } from '@/lib/utility';
import MaintenanceClient from './MaintenanceClient';

export async function generateStaticParams() {
  try {
    const res = await fetch(`${API_URL}/api/equipments`, {
      cache: 'no-store',
    });

    if (!res.ok) {
      console.warn('generateStaticParams: API not ok', res.status);
      return [{ id: '1' }];
    }

    const json = await res.json();
    const items = json.data || [];

    if (!items.length) {
      return [{ id: '1' }];
    }

    return items.map((item: any) => ({
      id: String(item.id),
    }));
  } catch (e) {
    console.error('generateStaticParams failed:', e);
    return [{ id: '1' }];
  }
}

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function EquipmentMaintenancePage({ params }: PageProps) {
  const { id } = await params;
  return <MaintenanceClient id={id} />;
}
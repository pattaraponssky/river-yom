// app/stations/[code]/equipment/new/page.tsx

import EquipmentFormClient from '@/components/Equipment/EquipmentFormClient';
import { KNOWN_STATION_CODES } from '@/lib/StationCodes';

export async function generateStaticParams() {
  return KNOWN_STATION_CODES.map(code => ({ code }));
}

interface PageProps {
  params: Promise<{ code: string }>;
}

export default async function NewEquipmentPage({ params }: PageProps) {
  const { code } = await params;
  return <EquipmentFormClient mode="create" staCode={decodeURIComponent(code)} />;
}
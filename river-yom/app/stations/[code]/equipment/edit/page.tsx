// app/stations/[code]/equipment/edit/page.tsx
import { Suspense } from 'react';

import EquipmentEditQueryWrapper from '@/components/Equipment/EquipmentEditQueryWrapper';
import { KNOWN_STATION_CODES } from '@/lib/StationCodes';

export async function generateStaticParams() {
  return KNOWN_STATION_CODES.map(code => ({ code }));
}

interface PageProps {
  params: Promise<{ code: string }>;
}

export default async function EditEquipmentPage({ params }: PageProps) {
  const { code } = await params;
  return (
    <Suspense fallback={null}>
      <EquipmentEditQueryWrapper staCode={decodeURIComponent(code)} />
    </Suspense>
  );
}
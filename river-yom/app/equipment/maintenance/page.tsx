// app/equipment/maintenance/page.tsx
import { Suspense } from 'react';
import MaintenanceQueryWrapper from '@/components/Equipment/MaintenanceQueryWrapper';

export default function MaintenancePage() {
  return (
    <Suspense fallback={null}>
      <MaintenanceQueryWrapper />
    </Suspense>
  );
}
// app/equipment/edit/page.tsx
import { Suspense } from 'react';
import EquipmentEditQueryWrapper from '@/components/Equipment/EquipmentEditQueryWrapper';

export default function EditEquipmentFlatPage() {
  return (
    <Suspense fallback={null}>
      <EquipmentEditQueryWrapper />
    </Suspense>
  );
}
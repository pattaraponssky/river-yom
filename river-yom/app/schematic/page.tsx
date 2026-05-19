'use client';

import dynamic from 'next/dynamic';

const WaterSchematicSimple = dynamic(
  () => import('@/app/schematic/components/WaterSchematicSimple'),
  {
    ssr: false,
    loading: () => <div>Loading...</div>,
  }
);

export default function Page() {
  return <WaterSchematicSimple />;
}
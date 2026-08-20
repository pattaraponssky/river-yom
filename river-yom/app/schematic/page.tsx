'use client';

import dynamic from 'next/dynamic';

const WaterSchematicSimple = dynamic(
  () => import('@/app/schematic/components/WaterSchematicSimple'),
  {
    ssr: false,
    loading: () => (
      <div
        style={{
          minHeight: '100vh',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          fontFamily: 'Prompt, sans-serif',
          fontSize: '1rem',
        }}
      >
        Loading...
      </div>
    ),
  }
);

export default function Page() {
  return <WaterSchematicSimple />;
}
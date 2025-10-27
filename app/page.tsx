'use client';

import dynamic from 'next/dynamic';

const GlobularClusterVisualization = dynamic(
  () => import('@/components/GlobularClusterVisualization'),
  { ssr: false }
);

export default function CosmosVisualization() {
  return (
    <div className="m-0 p-0 w-screen h-screen overflow-hidden">
      <GlobularClusterVisualization />
    </div>
  );
}

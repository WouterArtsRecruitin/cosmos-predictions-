'use client';

import dynamic from 'next/dynamic';

const CosmosPortal = dynamic(
  () => import('@/components/CosmosPortal'),
  { ssr: false }
);

export default function HomePage() {
  return (
    <div className="m-0 p-0 w-screen h-screen overflow-hidden">
      <CosmosPortal />
    </div>
  );
}

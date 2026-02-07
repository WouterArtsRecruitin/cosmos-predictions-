'use client';

import dynamic from 'next/dynamic';

const CosmosNav = dynamic(() => import('./CosmosNav'), { ssr: false });

export default function NavWrapper() {
  return <CosmosNav />;
}

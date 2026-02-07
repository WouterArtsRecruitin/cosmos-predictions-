'use client';

import { useState, useEffect } from 'react';
import { usePathname } from 'next/navigation';

interface NavItem {
  href: string;
  label: string;
  icon: string;
  description: string;
}

const NAV_ITEMS: NavItem[] = [
  { href: '/', label: 'Home', icon: '✦', description: 'Globular Cluster' },
  { href: '/particles', label: 'Particles', icon: '◈', description: '3D Gesture Systeem' },
  { href: '/cosmos', label: 'Cosmos', icon: '⊛', description: 'Sterrenhoop' },
  { href: '/predictions', label: 'Voorspel', icon: '☍', description: 'AI Predictions' },
];

export default function CosmosNav() {
  const pathname = usePathname();
  const [isOpen, setIsOpen] = useState(false);
  const [isVisible, setIsVisible] = useState(false);

  // Delay visibility for entrance animation
  useEffect(() => {
    const timer = setTimeout(() => setIsVisible(true), 500);
    return () => clearTimeout(timer);
  }, []);

  // Close on route change
  useEffect(() => {
    setIsOpen(false);
  }, [pathname]);

  // Close on escape
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setIsOpen(false);
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, []);

  return (
    <div
      className={`fixed bottom-6 left-1/2 -translate-x-1/2 z-50 transition-all duration-700 ${
        isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
      }`}
    >
      {/* Expanded nav panel */}
      <div
        className={`absolute bottom-full left-1/2 -translate-x-1/2 mb-3 transition-all duration-300 ease-out ${
          isOpen
            ? 'opacity-100 scale-100 translate-y-0 pointer-events-auto'
            : 'opacity-0 scale-95 translate-y-2 pointer-events-none'
        }`}
      >
        <div className="bg-black/60 backdrop-blur-2xl border border-white/10 rounded-2xl p-2 shadow-2xl shadow-black/50">
          <div className="flex gap-1.5">
            {NAV_ITEMS.map((item) => {
              const isActive = pathname === item.href;
              return (
                <a
                  key={item.href}
                  href={item.href}
                  className={`group flex flex-col items-center gap-1 px-4 py-3 rounded-xl transition-all duration-200 min-w-[80px] ${
                    isActive
                      ? 'bg-white/10 border border-white/20'
                      : 'hover:bg-white/5 border border-transparent'
                  }`}
                >
                  <span className={`text-xl transition-transform duration-200 group-hover:scale-110 ${
                    isActive ? '' : 'grayscale-[30%]'
                  }`}>
                    {item.icon}
                  </span>
                  <span className={`text-[11px] font-medium ${
                    isActive ? 'text-white/90' : 'text-white/50 group-hover:text-white/70'
                  }`}>
                    {item.label}
                  </span>
                  <span className="text-[9px] text-white/30">{item.description}</span>
                </a>
              );
            })}
          </div>
        </div>
      </div>

      {/* Floating toggle button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`group relative flex items-center gap-2 px-5 py-2.5 rounded-full transition-all duration-300 ${
          isOpen
            ? 'bg-white/15 backdrop-blur-2xl border border-white/25 shadow-lg shadow-white/5'
            : 'bg-black/40 backdrop-blur-2xl border border-white/10 hover:bg-black/50 hover:border-white/15'
        }`}
      >
        {/* Animated dots */}
        <div className="flex gap-1">
          {[0, 1, 2].map((i) => (
            <div
              key={i}
              className={`w-1 h-1 rounded-full transition-all duration-300 ${
                isOpen
                  ? 'bg-white/70'
                  : 'bg-white/40 group-hover:bg-white/60'
              }`}
              style={{
                transform: isOpen ? `rotate(${i * 120}deg) translateX(3px)` : 'none',
                transitionDelay: `${i * 50}ms`,
              }}
            />
          ))}
        </div>
        <span className={`text-xs transition-colors duration-300 ${
          isOpen ? 'text-white/80' : 'text-white/40 group-hover:text-white/60'
        }`}>
          {isOpen ? 'Sluiten' : 'Navigatie'}
        </span>

        {/* Current page indicator */}
        <span className="text-sm">
          {NAV_ITEMS.find(item => item.href === pathname)?.icon || '✦'}
        </span>
      </button>
    </div>
  );
}

'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import * as THREE from 'three';

const TOTAL_STARS = 55000;
const CORE_RADIUS = 15;
const HALO_RADIUS = 45;

export default function CosmosPortal() {
  const canvasRef = useRef<HTMLDivElement>(null);
  const [question, setQuestion] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [activeCard, setActiveCard] = useState<string | null>(null);
  const mouseRef = useRef({ x: 0, y: 0 });

  // Entrance animation
  useEffect(() => {
    const timer = setTimeout(() => setMounted(true), 100);
    return () => clearTimeout(timer);
  }, []);

  // Track mouse for parallax
  useEffect(() => {
    const handleMove = (e: MouseEvent) => {
      mouseRef.current.x = (e.clientX / window.innerWidth - 0.5) * 2;
      mouseRef.current.y = (e.clientY / window.innerHeight - 0.5) * 2;
    };
    window.addEventListener('mousemove', handleMove);
    return () => window.removeEventListener('mousemove', handleMove);
  }, []);

  // Three.js background
  useEffect(() => {
    if (!canvasRef.current) return;
    const container = canvasRef.current;

    // ── Same setup as original GlobularClusterVisualization ──
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x000000);

    const camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 0.1, 1000);
    camera.position.set(0, 0, 90);
    camera.lookAt(0, 0, 0);

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    container.appendChild(renderer.domElement);

    // ── Star colors (matching original stellar types) ──
    const clusterColors: Record<string, [number, number, number]> = {
      blueGiant: [0.62, 0.73, 0.95],
      brightBlue: [0.55, 0.68, 0.92],
      mainSequence: [0.88, 0.87, 0.78],
      paleYellow: [0.96, 0.91, 0.68],
      deepOrange: [0.95, 0.72, 0.45],
      amber: [0.98, 0.65, 0.35],
      redDwarf: [0.92, 0.52, 0.38],
      deepRed: [0.85, 0.45, 0.35],
      darkRed: [0.78, 0.38, 0.32],
      faintBlue: [0.58, 0.62, 0.72],
      fadedOrange: [0.82, 0.68, 0.52],
      dimYellow: [0.85, 0.78, 0.58],
      neutralGray: [0.70, 0.72, 0.75],
    };

    function pickColor(region: string, rng: number): [number, number, number] {
      const v = (Math.random() - 0.5) * 0.08;
      let base: [number, number, number];
      if (region === 'core') {
        if (rng < 0.05) base = clusterColors.blueGiant;
        else if (rng < 0.12) base = clusterColors.brightBlue;
        else if (rng < 0.25) base = clusterColors.paleYellow;
        else if (rng < 0.40) base = clusterColors.mainSequence;
        else if (rng < 0.60) base = clusterColors.deepOrange;
        else if (rng < 0.75) base = clusterColors.amber;
        else if (rng < 0.88) base = clusterColors.redDwarf;
        else if (rng < 0.95) base = clusterColors.deepRed;
        else base = clusterColors.darkRed;
      } else {
        if (rng < 0.08) base = clusterColors.faintBlue;
        else if (rng < 0.25) base = clusterColors.fadedOrange;
        else if (rng < 0.45) base = clusterColors.dimYellow;
        else if (rng < 0.70) base = clusterColors.redDwarf;
        else if (rng < 0.85) base = clusterColors.darkRed;
        else base = clusterColors.neutralGray;
      }
      return [
        Math.max(0, Math.min(1, base[0] + v)),
        Math.max(0, Math.min(1, base[1] + v * 0.7)),
        Math.max(0, Math.min(1, base[2] + v * 0.5)),
      ];
    }

    // ── Generate globular cluster (same distribution as original) ──
    const positions = new Float32Array(TOTAL_STARS * 3);
    const colors = new Float32Array(TOTAL_STARS * 3);
    const sizes = new Float32Array(TOTAL_STARS);
    const alphas = new Float32Array(TOTAL_STARS);

    const coreCount = Math.floor(TOTAL_STARS * 0.2);

    for (let i = 0; i < TOTAL_STARS; i++) {
      const i3 = i * 3;
      const isCore = i < coreCount;
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(2 * Math.random() - 1);
      let r: number;

      if (isCore) {
        r = Math.pow(Math.random(), 0.5) * CORE_RADIUS;
      } else {
        r = CORE_RADIUS + Math.pow(Math.random(), 1.2) * (HALO_RADIUS - CORE_RADIUS);
      }

      positions[i3] = r * Math.sin(phi) * Math.cos(theta);
      positions[i3 + 1] = r * Math.sin(phi) * Math.sin(theta);
      positions[i3 + 2] = r * Math.cos(phi);

      const rng = Math.random();
      const region = isCore ? 'core' : 'halo';
      const [cr, cg, cb] = pickColor(region, rng);
      colors[i3] = cr;
      colors[i3 + 1] = cg;
      colors[i3 + 2] = cb;

      // Same size ranges as original (tiny values, big basePointSize in shader)
      if (isCore) {
        sizes[i] = 0.003 + Math.pow(Math.random(), 1.5) * 0.015;
        alphas[i] = 0.3 + Math.random() * 0.4;
      } else {
        sizes[i] = 0.001 + Math.pow(Math.random(), 2.2) * 0.008;
        alphas[i] = 0.12 + Math.random() * 0.22;
      }

      // Distance-based brightness falloff
      const distRatio = r / HALO_RADIUS;
      alphas[i] *= (1.2 - distRatio * 0.4);
    }

    const starGeometry = new THREE.BufferGeometry();
    starGeometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
    starGeometry.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3));
    starGeometry.setAttribute('size', new THREE.Float32BufferAttribute(sizes, 1));
    starGeometry.setAttribute('alpha', new THREE.Float32BufferAttribute(alphas, 1));

    // Same shader as original GlobularClusterVisualization
    const starMaterial = new THREE.ShaderMaterial({
      uniforms: {},
      vertexShader: `
        attribute float size;
        attribute float alpha;
        attribute vec3 color;
        varying vec3 vColor;
        varying float vAlpha;

        void main() {
          vColor = color;
          vAlpha = alpha;
          vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
          gl_PointSize = size * 200.0 * (400.0 / -mvPosition.z);
          gl_Position = projectionMatrix * mvPosition;
        }
      `,
      fragmentShader: `
        varying vec3 vColor;
        varying float vAlpha;

        void main() {
          vec2 center = gl_PointCoord - 0.5;
          float dist = length(center);
          float alpha = 1.0 - smoothstep(0.0, 0.5, dist);
          alpha *= vAlpha;
          if (alpha < 0.08) discard;
          gl_FragColor = vec4(vColor * vAlpha, alpha);
        }
      `,
      transparent: true,
      depthWrite: false,
      blending: THREE.NormalBlending,
    });

    const stars = new THREE.Points(starGeometry, starMaterial);
    scene.add(stars);

    // ── Animation ──
    let animId: number;

    const animate = () => {
      animId = requestAnimationFrame(animate);

      // Slow auto-rotation (same speed as original)
      stars.rotation.y += 0.00015;
      stars.rotation.x += 0.00015 * 0.2;

      // Subtle mouse parallax on camera
      const mx = mouseRef.current.x;
      const my = mouseRef.current.y;
      camera.position.x += (mx * 3 - camera.position.x) * 0.015;
      camera.position.y += (-my * 2 - camera.position.y) * 0.015;
      camera.lookAt(0, 0, 0);

      renderer.render(scene, camera);
    };
    animate();

    const handleResize = () => {
      camera.aspect = window.innerWidth / window.innerHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(window.innerWidth, window.innerHeight);
    };
    window.addEventListener('resize', handleResize);

    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener('resize', handleResize);
      starGeometry.dispose();
      starMaterial.dispose();
      renderer.dispose();
      if (container.contains(renderer.domElement)) container.removeChild(renderer.domElement);
    };
  }, []);

  const handleSubmit = useCallback((e: React.FormEvent) => {
    e.preventDefault();
    if (!question.trim() || question.trim().length < 10) return;
    setIsSubmitting(true);
    window.location.href = `/predictions?q=${encodeURIComponent(question.trim())}`;
  }, [question]);

  const experiences = [
    {
      id: 'particles',
      href: '/particles',
      title: 'Particle Studio',
      description: 'Interactief 3D deeltjessysteem met handgebaren',
      icon: '◈',
      gradient: 'from-violet-500/20 to-fuchsia-500/20',
      border: 'border-violet-500/20 hover:border-violet-400/40',
      glow: 'group-hover:shadow-violet-500/20',
    },
    {
      id: 'cosmos',
      href: '/cosmos',
      title: 'Sterrenhoop',
      description: '55.000 sterren in een globular cluster',
      icon: '✦',
      gradient: 'from-amber-500/20 to-orange-500/20',
      border: 'border-amber-500/20 hover:border-amber-400/40',
      glow: 'group-hover:shadow-amber-500/20',
    },
  ];

  return (
    <div className="w-screen h-screen relative overflow-hidden">
      {/* Three.js background */}
      <div ref={canvasRef} className="absolute inset-0" />

      {/* Radial gradient overlay for depth */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_0%,rgba(2,2,16,0.4)_50%,rgba(2,2,16,0.85)_100%)]" />

      {/* Content */}
      <div className="relative z-10 h-full flex flex-col items-center justify-center px-6">

        {/* Hero section */}
        <div className={`text-center mb-10 transition-all duration-1000 ${
          mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-6'
        }`}>
          <div className="mb-4">
            <span className="text-white/20 text-sm tracking-[0.4em] uppercase">
              Cosmos Predictions
            </span>
          </div>
          <h1 className="text-4xl md:text-6xl font-extralight text-white/90 tracking-tight leading-tight mb-4">
            Vraag de kosmos
            <br />
            <span className="bg-gradient-to-r from-blue-300 via-purple-300 to-pink-300 bg-clip-text text-transparent">
              over jouw toekomst
            </span>
          </h1>
          <p className="text-white/35 text-sm md:text-base max-w-md mx-auto font-light leading-relaxed">
            AI-gestuurde toekomstscenario&apos;s op basis van jouw vragen,
            gevisualiseerd in het universum.
          </p>
        </div>

        {/* Prediction form */}
        <form
          onSubmit={handleSubmit}
          className={`w-full max-w-lg mb-12 transition-all duration-1000 delay-200 ${
            mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-6'
          }`}
        >
          <div className="relative group">
            <div className="absolute -inset-0.5 bg-gradient-to-r from-blue-500/20 via-purple-500/20 to-pink-500/20 rounded-2xl blur-lg opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
            <div className="relative bg-white/[0.04] backdrop-blur-2xl border border-white/[0.08] rounded-2xl p-1.5">
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  value={question}
                  onChange={(e) => setQuestion(e.target.value)}
                  placeholder="Stel je vraag aan de kosmos..."
                  className="flex-1 bg-transparent px-4 py-3.5 text-white/80 text-sm placeholder:text-white/20 focus:outline-none"
                  disabled={isSubmitting}
                />
                <button
                  type="submit"
                  disabled={isSubmitting || question.trim().length < 10}
                  className={`px-6 py-3 rounded-xl text-sm font-medium transition-all duration-300 ${
                    question.trim().length >= 10
                      ? 'bg-white/10 text-white/80 hover:bg-white/15 border border-white/10 hover:border-white/20'
                      : 'bg-white/[0.03] text-white/15 border border-white/[0.05] cursor-not-allowed'
                  }`}
                >
                  {isSubmitting ? (
                    <div className="w-4 h-4 border-2 border-white/20 border-t-white/60 rounded-full animate-spin" />
                  ) : (
                    'Voorspel'
                  )}
                </button>
              </div>
            </div>
          </div>
          <p className={`text-center text-[11px] mt-2.5 transition-colors ${
            question.length > 0 && question.length < 10
              ? 'text-white/30'
              : 'text-white/10'
          }`}>
            Minimaal 10 karakters
          </p>
        </form>

        {/* Experience cards */}
        <div className={`flex gap-4 transition-all duration-1000 delay-400 ${
          mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-6'
        }`}>
          {experiences.map((exp) => (
            <a
              key={exp.id}
              href={exp.href}
              onMouseEnter={() => setActiveCard(exp.id)}
              onMouseLeave={() => setActiveCard(null)}
              className={`group relative flex items-center gap-4 px-5 py-4 rounded-xl
                bg-white/[0.02] backdrop-blur-xl border ${exp.border}
                transition-all duration-300 hover:bg-white/[0.04]
                shadow-lg shadow-transparent ${exp.glow}`}
            >
              {/* Gradient background on hover */}
              <div className={`absolute inset-0 rounded-xl bg-gradient-to-br ${exp.gradient} opacity-0 group-hover:opacity-100 transition-opacity duration-300`} />

              <div className="relative">
                <span className={`text-2xl transition-transform duration-300 inline-block ${
                  activeCard === exp.id ? 'scale-110' : ''
                }`}>
                  {exp.icon}
                </span>
              </div>
              <div className="relative">
                <div className="text-white/80 text-sm font-medium">{exp.title}</div>
                <div className="text-white/30 text-xs">{exp.description}</div>
              </div>
              <svg
                width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"
                className="relative text-white/20 group-hover:text-white/50 transition-all duration-300 group-hover:translate-x-0.5 ml-2"
              >
                <polyline points="9 18 15 12 9 6" />
              </svg>
            </a>
          ))}
        </div>
      </div>

      {/* Subtle corner accents */}
      <div className={`absolute top-8 left-8 transition-all duration-1000 delay-700 ${
        mounted ? 'opacity-100' : 'opacity-0'
      }`}>
        <div className="w-8 h-[1px] bg-gradient-to-r from-white/10 to-transparent" />
        <div className="w-[1px] h-8 bg-gradient-to-b from-white/10 to-transparent" />
      </div>
      <div className={`absolute top-8 right-8 transition-all duration-1000 delay-700 ${
        mounted ? 'opacity-100' : 'opacity-0'
      }`}>
        <div className="w-8 h-[1px] bg-gradient-to-l from-white/10 to-transparent ml-auto" />
        <div className="w-[1px] h-8 bg-gradient-to-b from-white/10 to-transparent ml-auto" />
      </div>
    </div>
  );
}

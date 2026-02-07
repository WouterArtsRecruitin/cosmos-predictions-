'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import * as THREE from 'three';

const STAR_COUNT = 8000;
const NEBULA_COUNT = 2000;

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

    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x020210);

    const camera = new THREE.PerspectiveCamera(50, window.innerWidth / window.innerHeight, 0.1, 200);
    camera.position.set(0, 0, 30);

    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    container.appendChild(renderer.domElement);

    // ── Star field ──
    const starGeometry = new THREE.BufferGeometry();
    const starPositions = new Float32Array(STAR_COUNT * 3);
    const starColors = new Float32Array(STAR_COUNT * 3);
    const starSizes = new Float32Array(STAR_COUNT);

    for (let i = 0; i < STAR_COUNT; i++) {
      const i3 = i * 3;
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(2 * Math.random() - 1);
      const r = 20 + Math.random() * 60;

      starPositions[i3] = r * Math.sin(phi) * Math.cos(theta);
      starPositions[i3 + 1] = r * Math.sin(phi) * Math.sin(theta);
      starPositions[i3 + 2] = r * Math.cos(phi) - 30;

      // Warm whites and subtle blues
      const temp = Math.random();
      if (temp < 0.6) {
        starColors[i3] = 0.85 + Math.random() * 0.15;
        starColors[i3 + 1] = 0.85 + Math.random() * 0.12;
        starColors[i3 + 2] = 0.9 + Math.random() * 0.1;
      } else if (temp < 0.85) {
        starColors[i3] = 0.6 + Math.random() * 0.15;
        starColors[i3 + 1] = 0.7 + Math.random() * 0.15;
        starColors[i3 + 2] = 0.95;
      } else {
        starColors[i3] = 0.95;
        starColors[i3 + 1] = 0.8 + Math.random() * 0.1;
        starColors[i3 + 2] = 0.5 + Math.random() * 0.2;
      }

      starSizes[i] = 0.3 + Math.random() * 1.2;
    }

    starGeometry.setAttribute('position', new THREE.Float32BufferAttribute(starPositions, 3));
    starGeometry.setAttribute('color', new THREE.Float32BufferAttribute(starColors, 3));
    starGeometry.setAttribute('size', new THREE.Float32BufferAttribute(starSizes, 1));

    const starMaterial = new THREE.ShaderMaterial({
      uniforms: {
        uTime: { value: 0 },
        uPixelRatio: { value: Math.min(window.devicePixelRatio, 2) },
      },
      vertexShader: `
        uniform float uTime;
        uniform float uPixelRatio;
        attribute float size;
        attribute vec3 color;
        varying vec3 vColor;
        varying float vAlpha;

        void main() {
          vColor = color;
          vec4 mvPos = modelViewMatrix * vec4(position, 1.0);
          float dist = -mvPos.z;
          gl_PointSize = size * uPixelRatio * (80.0 / dist);
          gl_Position = projectionMatrix * mvPos;
          float twinkle = 0.7 + 0.3 * sin(uTime * 1.5 + position.x * 10.0 + position.y * 7.0);
          vAlpha = smoothstep(100.0, 10.0, dist) * twinkle;
        }
      `,
      fragmentShader: `
        varying vec3 vColor;
        varying float vAlpha;

        void main() {
          float d = length(gl_PointCoord - 0.5);
          float alpha = 1.0 - smoothstep(0.0, 0.5, d);
          alpha *= alpha * vAlpha;
          if (alpha < 0.01) discard;
          float core = exp(-d * 10.0) * 0.3;
          gl_FragColor = vec4(vColor + core, alpha);
        }
      `,
      transparent: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
    });

    const stars = new THREE.Points(starGeometry, starMaterial);
    scene.add(stars);

    // ── Central nebula glow ──
    const nebulaGeometry = new THREE.BufferGeometry();
    const nebulaPositions = new Float32Array(NEBULA_COUNT * 3);
    const nebulaSizes = new Float32Array(NEBULA_COUNT);
    const nebulaRandoms = new Float32Array(NEBULA_COUNT);

    for (let i = 0; i < NEBULA_COUNT; i++) {
      const i3 = i * 3;
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(2 * Math.random() - 1);
      const r = Math.pow(Math.random(), 0.6) * 12;

      nebulaPositions[i3] = r * Math.sin(phi) * Math.cos(theta);
      nebulaPositions[i3 + 1] = r * Math.sin(phi) * Math.sin(theta) * 0.6;
      nebulaPositions[i3 + 2] = r * Math.cos(phi) * 0.4;

      nebulaSizes[i] = 2.0 + Math.random() * 6.0;
      nebulaRandoms[i] = Math.random();
    }

    nebulaGeometry.setAttribute('position', new THREE.Float32BufferAttribute(nebulaPositions, 3));
    nebulaGeometry.setAttribute('size', new THREE.Float32BufferAttribute(nebulaSizes, 1));
    nebulaGeometry.setAttribute('aRandom', new THREE.Float32BufferAttribute(nebulaRandoms, 1));

    const nebulaMaterial = new THREE.ShaderMaterial({
      uniforms: {
        uTime: { value: 0 },
        uPixelRatio: { value: Math.min(window.devicePixelRatio, 2) },
      },
      vertexShader: `
        uniform float uTime;
        uniform float uPixelRatio;
        attribute float size;
        attribute float aRandom;
        varying float vAlpha;
        varying float vRandom;

        void main() {
          vRandom = aRandom;
          vec3 pos = position;
          pos.x += sin(uTime * 0.15 + aRandom * 6.28) * 0.3;
          pos.y += cos(uTime * 0.12 + aRandom * 4.71) * 0.2;

          vec4 mvPos = modelViewMatrix * vec4(pos, 1.0);
          float dist = -mvPos.z;
          gl_PointSize = size * uPixelRatio * (80.0 / dist);
          gl_Position = projectionMatrix * mvPos;
          vAlpha = smoothstep(60.0, 5.0, dist) * 0.06;
        }
      `,
      fragmentShader: `
        varying float vAlpha;
        varying float vRandom;

        void main() {
          float d = length(gl_PointCoord - 0.5);
          float alpha = 1.0 - smoothstep(0.0, 0.5, d);
          alpha *= vAlpha;
          if (alpha < 0.002) discard;

          // Purple/blue nebula tones
          vec3 color = mix(
            vec3(0.15, 0.08, 0.35),
            vec3(0.08, 0.15, 0.4),
            vRandom
          );
          color += vec3(0.1, 0.02, 0.08) * (1.0 - d);

          gl_FragColor = vec4(color, alpha);
        }
      `,
      transparent: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
    });

    const nebula = new THREE.Points(nebulaGeometry, nebulaMaterial);
    scene.add(nebula);

    // ── Animation ──
    const clock = new THREE.Clock();
    let animId: number;

    const animate = () => {
      animId = requestAnimationFrame(animate);
      const elapsed = clock.getElapsedTime();

      starMaterial.uniforms.uTime.value = elapsed;
      nebulaMaterial.uniforms.uTime.value = elapsed;

      // Parallax from mouse
      const mx = mouseRef.current.x;
      const my = mouseRef.current.y;
      camera.position.x += (mx * 2 - camera.position.x) * 0.02;
      camera.position.y += (-my * 1.5 - camera.position.y) * 0.02;
      camera.lookAt(0, 0, 0);

      stars.rotation.y += 0.00008;
      nebula.rotation.y += 0.0002;
      nebula.rotation.z += 0.00005;

      renderer.render(scene, camera);
    };
    animate();

    const handleResize = () => {
      camera.aspect = window.innerWidth / window.innerHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(window.innerWidth, window.innerHeight);
      const pr = Math.min(window.devicePixelRatio, 2);
      starMaterial.uniforms.uPixelRatio.value = pr;
      nebulaMaterial.uniforms.uPixelRatio.value = pr;
    };
    window.addEventListener('resize', handleResize);

    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener('resize', handleResize);
      starGeometry.dispose();
      starMaterial.dispose();
      nebulaGeometry.dispose();
      nebulaMaterial.dispose();
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

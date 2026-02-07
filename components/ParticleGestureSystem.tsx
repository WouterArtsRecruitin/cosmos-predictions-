'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import * as THREE from 'three';
import { useHandGesture, GestureState } from '@/hooks/useHandGesture';
import { PARTICLE_TEMPLATES, PRESET_COLORS, ParticleTemplate } from '@/lib/particleTemplates';

const PARTICLE_COUNT = 25000;
const BASE_SCALE = 3.0;
const LERP_SPEED = 0.03;

export default function ParticleGestureSystem() {
  const containerRef = useRef<HTMLDivElement>(null);
  const sceneRef = useRef<THREE.Scene | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const particlesRef = useRef<THREE.Points | null>(null);
  const animationIdRef = useRef<number | null>(null);
  const currentPositionsRef = useRef<Float32Array | null>(null);
  const targetPositionsRef = useRef<Float32Array | null>(null);
  const basePositionsRef = useRef<Float32Array | null>(null);
  const velocitiesRef = useRef<Float32Array | null>(null);
  const materialRef = useRef<THREE.ShaderMaterial | null>(null);

  const [cameraEnabled, setCameraEnabled] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState<string>('cosmos');
  const [selectedColor, setSelectedColor] = useState(PRESET_COLORS[0]);
  const [customColor, setCustomColor] = useState('#FFD700');
  const [showPanel, setShowPanel] = useState(true);
  const [isLoading, setIsLoading] = useState(true);
  const [gestureInfo, setGestureInfo] = useState('');

  const gestureScaleRef = useRef(1.0);
  const gestureRotXRef = useRef(0);
  const gestureRotYRef = useRef(0);

  const gesture = useHandGesture(cameraEnabled);

  // Generate new target positions when template changes
  const generateTemplate = useCallback((templateId: string, scale: number) => {
    const template = PARTICLE_TEMPLATES.find(t => t.id === templateId);
    if (!template) return;

    const positions = template.generate(PARTICLE_COUNT, scale);
    targetPositionsRef.current = positions;
    basePositionsRef.current = new Float32Array(positions);
  }, []);

  // Update particle color
  const updateColor = useCallback((rgb: number[]) => {
    if (materialRef.current) {
      materialRef.current.uniforms.uColor.value.set(rgb[0], rgb[1], rgb[2]);
    }
  }, []);

  // Handle template change
  const handleTemplateChange = useCallback((templateId: string) => {
    setSelectedTemplate(templateId);
    generateTemplate(templateId, BASE_SCALE);
  }, [generateTemplate]);

  // Handle preset color change
  const handleColorChange = useCallback((color: typeof PRESET_COLORS[0]) => {
    setSelectedColor(color);
    setCustomColor(color.hex);
    updateColor(color.rgb);
  }, [updateColor]);

  // Handle custom color input
  const handleCustomColorChange = useCallback((hex: string) => {
    setCustomColor(hex);
    const c = new THREE.Color(hex);
    const rgb = [c.r, c.g, c.b];
    setSelectedColor({ name: 'Custom', hex, rgb });
    updateColor(rgb);
  }, [updateColor]);

  // Main Three.js setup
  useEffect(() => {
    if (!containerRef.current) return;

    const container = containerRef.current;

    // Scene
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x030308);
    scene.fog = new THREE.FogExp2(0x030308, 0.012);
    sceneRef.current = scene;

    // Camera
    const camera = new THREE.PerspectiveCamera(
      60,
      window.innerWidth / window.innerHeight,
      0.1,
      500
    );
    camera.position.set(0, 0, 8);
    camera.lookAt(0, 0, 0);
    cameraRef.current = camera;

    // Renderer
    const renderer = new THREE.WebGLRenderer({
      antialias: true,
      alpha: true,
      powerPreference: 'high-performance',
    });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    container.appendChild(renderer.domElement);
    rendererRef.current = renderer;

    // Generate initial positions
    const initialPositions = PARTICLE_TEMPLATES[0].generate(PARTICLE_COUNT, BASE_SCALE);
    currentPositionsRef.current = new Float32Array(initialPositions);
    targetPositionsRef.current = new Float32Array(initialPositions);
    basePositionsRef.current = new Float32Array(initialPositions);
    velocitiesRef.current = new Float32Array(PARTICLE_COUNT * 3);

    // Geometry
    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute('position', new THREE.Float32BufferAttribute(currentPositionsRef.current, 3));

    // Per-particle random values for visual variation
    const randoms = new Float32Array(PARTICLE_COUNT);
    const sizes = new Float32Array(PARTICLE_COUNT);
    for (let i = 0; i < PARTICLE_COUNT; i++) {
      randoms[i] = Math.random();
      sizes[i] = 0.5 + Math.random() * 1.5;
    }
    geometry.setAttribute('aRandom', new THREE.Float32BufferAttribute(randoms, 1));
    geometry.setAttribute('aSize', new THREE.Float32BufferAttribute(sizes, 1));

    // Shader Material
    const material = new THREE.ShaderMaterial({
      uniforms: {
        uTime: { value: 0 },
        uColor: { value: new THREE.Vector3(PRESET_COLORS[0].rgb[0], PRESET_COLORS[0].rgb[1], PRESET_COLORS[0].rgb[2]) },
        uScale: { value: 1.0 },
        uPixelRatio: { value: Math.min(window.devicePixelRatio, 2) },
      },
      vertexShader: `
        uniform float uTime;
        uniform float uScale;
        uniform float uPixelRatio;
        attribute float aRandom;
        attribute float aSize;
        varying float vAlpha;
        varying float vRandom;
        varying float vDist;

        void main() {
          vec3 pos = position;

          // Subtle floating animation
          float floatOffset = aRandom * 6.28318;
          pos.x += sin(uTime * 0.3 + floatOffset) * 0.02;
          pos.y += cos(uTime * 0.25 + floatOffset * 1.3) * 0.02;
          pos.z += sin(uTime * 0.2 + floatOffset * 0.7) * 0.02;

          vec4 mvPosition = modelViewMatrix * vec4(pos, 1.0);
          float dist = -mvPosition.z;

          gl_PointSize = aSize * uScale * uPixelRatio * (120.0 / dist);
          gl_PointSize = max(gl_PointSize, 0.5);
          gl_Position = projectionMatrix * mvPosition;

          vAlpha = smoothstep(50.0, 2.0, dist) * (0.4 + aRandom * 0.6);
          vRandom = aRandom;
          vDist = dist;
        }
      `,
      fragmentShader: `
        uniform vec3 uColor;
        uniform float uTime;
        varying float vAlpha;
        varying float vRandom;
        varying float vDist;

        void main() {
          vec2 center = gl_PointCoord - 0.5;
          float dist = length(center);

          // Soft circular particle
          float alpha = 1.0 - smoothstep(0.0, 0.5, dist);
          alpha *= alpha; // sharper falloff
          alpha *= vAlpha;

          // Subtle color variation per particle
          vec3 color = uColor;
          color += vec3(
            sin(vRandom * 6.28) * 0.12,
            cos(vRandom * 4.71) * 0.08,
            sin(vRandom * 3.14) * 0.15
          );

          // Twinkle
          float twinkle = 0.85 + 0.15 * sin(uTime * 2.0 + vRandom * 50.0);
          alpha *= twinkle;

          if (alpha < 0.02) discard;

          // Glow core
          float core = exp(-dist * 8.0) * 0.4;
          color += core;

          gl_FragColor = vec4(color, alpha);
        }
      `,
      transparent: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
    });

    materialRef.current = material;

    const particles = new THREE.Points(geometry, material);
    scene.add(particles);
    particlesRef.current = particles;

    // Subtle ambient particles (background dust)
    const dustCount = 3000;
    const dustGeometry = new THREE.BufferGeometry();
    const dustPositions = new Float32Array(dustCount * 3);
    for (let i = 0; i < dustCount; i++) {
      dustPositions[i * 3] = (Math.random() - 0.5) * 30;
      dustPositions[i * 3 + 1] = (Math.random() - 0.5) * 30;
      dustPositions[i * 3 + 2] = (Math.random() - 0.5) * 30;
    }
    dustGeometry.setAttribute('position', new THREE.Float32BufferAttribute(dustPositions, 3));

    const dustMaterial = new THREE.PointsMaterial({
      size: 0.015,
      color: 0x334466,
      transparent: true,
      opacity: 0.3,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
    });
    const dust = new THREE.Points(dustGeometry, dustMaterial);
    scene.add(dust);

    setIsLoading(false);

    // Mouse interaction state
    let isDragging = false;
    let lastMouse = { x: 0, y: 0 };
    let autoRotate = true;
    let autoRotateTimeout: NodeJS.Timeout | null = null;

    const handleMouseDown = (e: MouseEvent) => {
      isDragging = true;
      autoRotate = false;
      lastMouse = { x: e.clientX, y: e.clientY };
      if (autoRotateTimeout) clearTimeout(autoRotateTimeout);
    };

    const handleMouseMove = (e: MouseEvent) => {
      if (!isDragging) return;
      const dx = e.clientX - lastMouse.x;
      const dy = e.clientY - lastMouse.y;
      particles.rotation.y += dx * 0.005;
      particles.rotation.x += dy * 0.005;
      dust.rotation.y += dx * 0.002;
      dust.rotation.x += dy * 0.002;
      lastMouse = { x: e.clientX, y: e.clientY };
    };

    const handleMouseUp = () => {
      isDragging = false;
      autoRotateTimeout = setTimeout(() => { autoRotate = true; }, 2000);
    };

    const handleWheel = (e: WheelEvent) => {
      e.preventDefault();
      camera.position.z = Math.max(3, Math.min(20, camera.position.z + e.deltaY * 0.01));
    };

    const handleResize = () => {
      camera.aspect = window.innerWidth / window.innerHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(window.innerWidth, window.innerHeight);
      material.uniforms.uPixelRatio.value = Math.min(window.devicePixelRatio, 2);
    };

    container.addEventListener('mousedown', handleMouseDown);
    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
    container.addEventListener('wheel', handleWheel, { passive: false });
    window.addEventListener('resize', handleResize);

    // Touch events
    let lastTouchDist = 0;
    container.addEventListener('touchstart', (e) => {
      if (e.touches.length === 1) {
        isDragging = true;
        autoRotate = false;
        lastMouse = { x: e.touches[0].clientX, y: e.touches[0].clientY };
        if (autoRotateTimeout) clearTimeout(autoRotateTimeout);
      } else if (e.touches.length === 2) {
        const dx = e.touches[0].clientX - e.touches[1].clientX;
        const dy = e.touches[0].clientY - e.touches[1].clientY;
        lastTouchDist = Math.sqrt(dx * dx + dy * dy);
      }
    }, { passive: true });

    container.addEventListener('touchmove', (e) => {
      if (e.touches.length === 1 && isDragging) {
        const dx = e.touches[0].clientX - lastMouse.x;
        const dy = e.touches[0].clientY - lastMouse.y;
        particles.rotation.y += dx * 0.005;
        particles.rotation.x += dy * 0.005;
        lastMouse = { x: e.touches[0].clientX, y: e.touches[0].clientY };
      } else if (e.touches.length === 2) {
        const dx = e.touches[0].clientX - e.touches[1].clientX;
        const dy = e.touches[0].clientY - e.touches[1].clientY;
        const dist = Math.sqrt(dx * dx + dy * dy);
        const delta = lastTouchDist - dist;
        camera.position.z = Math.max(3, Math.min(20, camera.position.z + delta * 0.02));
        lastTouchDist = dist;
      }
    }, { passive: true });

    container.addEventListener('touchend', () => {
      isDragging = false;
      autoRotateTimeout = setTimeout(() => { autoRotate = true; }, 2000);
    }, { passive: true });

    // Animation loop
    const clock = new THREE.Clock();

    const animate = () => {
      animationIdRef.current = requestAnimationFrame(animate);
      const elapsed = clock.getElapsedTime();

      material.uniforms.uTime.value = elapsed;

      // Lerp positions toward target
      const current = currentPositionsRef.current;
      const target = targetPositionsRef.current;
      const base = basePositionsRef.current;
      const vel = velocitiesRef.current;

      if (current && target && base && vel) {
        const gestureScale = gestureScaleRef.current;

        for (let i = 0; i < PARTICLE_COUNT * 3; i++) {
          // Scale the base positions by gesture
          const scaledTarget = target[i] * gestureScale;

          // Smooth spring-like lerp with velocity
          const diff = scaledTarget - current[i];
          vel[i] += diff * LERP_SPEED;
          vel[i] *= 0.92; // damping
          current[i] += vel[i];
        }

        const posAttr = particles.geometry.getAttribute('position');
        (posAttr as THREE.BufferAttribute).set(current);
        posAttr.needsUpdate = true;
      }

      // Apply gesture-based rotation
      if (gesture.handsDetected > 0) {
        const targetRotY = (gesture.centerX - 0.5) * Math.PI * 0.5;
        const targetRotX = (gesture.centerY - 0.5) * Math.PI * 0.3;
        gestureRotYRef.current += (targetRotY - gestureRotYRef.current) * 0.05;
        gestureRotXRef.current += (targetRotX - gestureRotXRef.current) * 0.05;
      }

      // Auto rotation
      if (autoRotate && !isDragging && gesture.handsDetected === 0) {
        particles.rotation.y += 0.001;
        particles.rotation.x += 0.0002;
        dust.rotation.y -= 0.0003;
      }

      // Apply gesture scale
      material.uniforms.uScale.value = gestureScaleRef.current;

      renderer.render(scene, camera);
    };

    animate();

    return () => {
      if (animationIdRef.current) cancelAnimationFrame(animationIdRef.current);
      if (autoRotateTimeout) clearTimeout(autoRotateTimeout);

      container.removeEventListener('mousedown', handleMouseDown);
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
      container.removeEventListener('wheel', handleWheel);
      window.removeEventListener('resize', handleResize);

      geometry.dispose();
      material.dispose();
      dustGeometry.dispose();
      dustMaterial.dispose();
      renderer.dispose();
      if (container.contains(renderer.domElement)) {
        container.removeChild(renderer.domElement);
      }
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // React to gesture state changes
  useEffect(() => {
    if (!gesture.isActive || gesture.handsDetected === 0) {
      gestureScaleRef.current += (1.0 - gestureScaleRef.current) * 0.05;
      setGestureInfo('');
      return;
    }

    gestureScaleRef.current += (gesture.scale - gestureScaleRef.current) * 0.1;

    if (gesture.handsDetected === 2) {
      const pct = Math.round(gesture.distance * 100);
      const openPct = Math.round(gesture.averageOpenness * 100);
      setGestureInfo(`Handen: ${pct}% afstand • ${openPct}% open`);
    } else {
      const hand = gesture.leftHand ? 'Links' : 'Rechts';
      const openPct = Math.round((gesture.leftHand ? gesture.leftOpenness : gesture.rightOpenness) * 100);
      setGestureInfo(`${hand}: ${openPct}% open`);
    }
  }, [gesture]);

  // React to template changes
  useEffect(() => {
    generateTemplate(selectedTemplate, BASE_SCALE);
  }, [selectedTemplate, generateTemplate]);

  return (
    <div className="w-screen h-screen relative overflow-hidden bg-[#030308]">
      {/* Three.js canvas container */}
      <div
        ref={containerRef}
        className="absolute inset-0"
        style={{ cursor: 'grab' }}
      />

      {/* Loading state */}
      {isLoading && (
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="text-white/60 text-lg font-light animate-pulse">
            Deeltjes laden...
          </div>
        </div>
      )}

      {/* Top bar */}
      <div className="absolute top-0 left-0 right-0 z-10 pointer-events-none">
        <div className="flex items-center justify-between px-5 py-4">
          {/* Title */}
          <div className="pointer-events-auto">
            <h1 className="text-white/90 text-lg font-light tracking-wider">
              Cosmos Particles
            </h1>
            <p className="text-white/40 text-xs mt-0.5">
              Interactief 3D deeltjessysteem
            </p>
          </div>

          {/* Controls */}
          <div className="flex items-center gap-3 pointer-events-auto">
            {/* Camera toggle */}
            <button
              onClick={() => setCameraEnabled(!cameraEnabled)}
              className={`
                px-4 py-2 rounded-lg text-xs font-medium transition-all duration-300
                backdrop-blur-xl border
                ${cameraEnabled
                  ? 'bg-emerald-500/20 border-emerald-500/40 text-emerald-300 shadow-lg shadow-emerald-500/10'
                  : 'bg-white/5 border-white/10 text-white/60 hover:bg-white/10 hover:border-white/20'
                }
              `}
            >
              {cameraEnabled ? '● Camera Aan' : '○ Camera Uit'}
            </button>

            {/* Panel toggle */}
            <button
              onClick={() => setShowPanel(!showPanel)}
              className={`
                w-9 h-9 rounded-lg flex items-center justify-center
                backdrop-blur-xl border transition-all duration-300
                ${showPanel
                  ? 'bg-white/10 border-white/20 text-white/80'
                  : 'bg-white/5 border-white/10 text-white/40 hover:bg-white/10'
                }
              `}
            >
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                <rect x="1" y="2" width="6" height="5" rx="1" stroke="currentColor" strokeWidth="1.5" />
                <rect x="9" y="2" width="6" height="5" rx="1" stroke="currentColor" strokeWidth="1.5" />
                <rect x="1" y="9" width="6" height="5" rx="1" stroke="currentColor" strokeWidth="1.5" />
                <rect x="9" y="9" width="6" height="5" rx="1" stroke="currentColor" strokeWidth="1.5" />
              </svg>
            </button>
          </div>
        </div>
      </div>

      {/* Side panel */}
      <div
        className={`
          absolute top-20 right-4 z-20 w-64 transition-all duration-500 ease-out
          ${showPanel ? 'translate-x-0 opacity-100' : 'translate-x-72 opacity-0 pointer-events-none'}
        `}
      >
        {/* Templates */}
        <div className="bg-black/40 backdrop-blur-2xl border border-white/10 rounded-xl p-4 mb-3">
          <h3 className="text-white/70 text-xs font-medium uppercase tracking-wider mb-3">
            Vorm
          </h3>
          <div className="grid grid-cols-3 gap-2">
            {PARTICLE_TEMPLATES.map((template) => (
              <button
                key={template.id}
                onClick={() => handleTemplateChange(template.id)}
                className={`
                  flex flex-col items-center gap-1 p-2 rounded-lg transition-all duration-200
                  ${selectedTemplate === template.id
                    ? 'bg-white/15 border border-white/30 shadow-lg'
                    : 'bg-white/5 border border-transparent hover:bg-white/10 hover:border-white/15'
                  }
                `}
              >
                <span className="text-lg">{template.icon}</span>
                <span className="text-[10px] text-white/60">{template.name}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Colors */}
        <div className="bg-black/40 backdrop-blur-2xl border border-white/10 rounded-xl p-4 mb-3">
          <h3 className="text-white/70 text-xs font-medium uppercase tracking-wider mb-3">
            Kleur
          </h3>
          <div className="grid grid-cols-4 gap-2 mb-3">
            {PRESET_COLORS.map((color) => (
              <button
                key={color.hex}
                onClick={() => handleColorChange(color)}
                className={`
                  w-full aspect-square rounded-lg transition-all duration-200 relative
                  ${selectedColor.hex === color.hex
                    ? 'ring-2 ring-white/50 ring-offset-1 ring-offset-black/50 scale-110'
                    : 'hover:scale-105'
                  }
                `}
                style={{ backgroundColor: color.hex }}
                title={color.name}
              />
            ))}
          </div>
          {/* Custom color picker */}
          <div className="flex items-center gap-2">
            <input
              type="color"
              value={customColor}
              onChange={(e) => handleCustomColorChange(e.target.value)}
              className="w-8 h-8 rounded-lg cursor-pointer bg-transparent border border-white/10"
            />
            <input
              type="text"
              value={customColor}
              onChange={(e) => {
                if (/^#[0-9A-Fa-f]{6}$/.test(e.target.value)) {
                  handleCustomColorChange(e.target.value);
                }
                setCustomColor(e.target.value);
              }}
              className="flex-1 bg-white/5 border border-white/10 rounded-lg px-3 py-1.5 text-xs text-white/70 font-mono"
              placeholder="#FFD700"
            />
          </div>
        </div>

        {/* Gesture info */}
        {cameraEnabled && (
          <div className="bg-black/40 backdrop-blur-2xl border border-white/10 rounded-xl p-4">
            <h3 className="text-white/70 text-xs font-medium uppercase tracking-wider mb-2">
              Gebaar Detectie
            </h3>
            <div className="flex items-center gap-2 mb-2">
              <div className={`w-2 h-2 rounded-full ${gesture.isActive ? 'bg-emerald-400 animate-pulse' : 'bg-gray-600'}`} />
              <span className="text-xs text-white/50">
                {gesture.isActive ? 'Actief' : 'Initialiseren...'}
              </span>
            </div>
            {gesture.handsDetected > 0 && (
              <>
                <div className="text-xs text-white/40 mb-2">
                  {gesture.handsDetected} hand{gesture.handsDetected > 1 ? 'en' : ''} gedetecteerd
                </div>
                {/* Scale indicator */}
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between text-[10px] text-white/40">
                    <span>Schaal</span>
                    <span>{Math.round(gestureScaleRef.current * 100)}%</span>
                  </div>
                  <div className="w-full h-1.5 bg-white/5 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-blue-500 to-purple-500 rounded-full transition-all duration-200"
                      style={{ width: `${Math.min(100, gestureScaleRef.current * 50)}%` }}
                    />
                  </div>
                </div>
              </>
            )}
            {gesture.handsDetected === 0 && gesture.isActive && (
              <p className="text-[10px] text-white/30 leading-relaxed">
                Beweeg je handen voor de camera. Spreid je handen om de deeltjes te vergroten. Sluit je vuisten om ze samen te trekken.
              </p>
            )}
          </div>
        )}
      </div>

      {/* Bottom status bar */}
      <div className="absolute bottom-0 left-0 right-0 z-10 pointer-events-none">
        <div className="flex items-center justify-between px-5 py-4">
          <div className="text-white/30 text-xs">
            {PARTICLE_COUNT.toLocaleString()} deeltjes • {
              PARTICLE_TEMPLATES.find(t => t.id === selectedTemplate)?.name
            }
          </div>

          {gestureInfo && (
            <div className="bg-black/40 backdrop-blur-xl border border-white/10 rounded-full px-3 py-1.5">
              <span className="text-white/50 text-xs">{gestureInfo}</span>
            </div>
          )}

          <div className="text-white/30 text-xs">
            Drag om te roteren • Scroll om te zoomen
          </div>
        </div>
      </div>

      {/* Back to home link */}
      <a
        href="/"
        className="absolute top-5 left-5 z-30 text-white/30 hover:text-white/60 transition-colors text-xs flex items-center gap-1.5"
      >
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <polyline points="15 18 9 12 15 6" />
        </svg>
        Terug
      </a>
    </div>
  );
}

'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import * as THREE from 'three';

interface Star {
  position: { x: number; y: number; z: number; region: string; distanceFromCenter: number };
  color: THREE.Color;
  size: number;
  brightness: number;
  starType: string;
  shapeType: string;
  region: string;
}

interface StarGroups {
  tiny: Star[];
  medium: Star[];
  round: Star[];
}

const TOTAL_STARS = 55000;
const CORE_RADIUS = 15;
const HALO_RADIUS = 45;
const ROTATION_SPEED = 0.00015;

export default function GlobularClusterVisualization() {
  const containerRef = useRef<HTMLDivElement>(null);
  const sceneRef = useRef<THREE.Scene | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const starSystemsRef = useRef<THREE.Points[]>([]);
  const animationIdRef = useRef<number | null>(null);

  const [isLoading, setIsLoading] = useState(true);
  const [isDragging, setIsDragging] = useState(false);
  const [autoRotate, setAutoRotate] = useState(true);
  const lastMousePosRef = useRef({ x: 0, y: 0 });
  const autoRotateTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const getClusterColor = useCallback((type: string, variation: number): THREE.Color => {
    const colors: Record<string, [number, number, number]> = {
      // Heldere blauwe reuzen (O/B type)
      blueGiant: [0.62, 0.73, 0.95],
      brightBlue: [0.55, 0.68, 0.92],

      // Witte/gele hoofdreeks sterren (A/F type)
      mainSequence: [0.88, 0.87, 0.78],
      warmWhite: [0.92, 0.89, 0.75],
      paleYellow: [0.96, 0.91, 0.68],

      // Oranje sterren (K type)
      deepOrange: [0.95, 0.72, 0.45],
      paleOrange: [0.92, 0.78, 0.58],
      amber: [0.98, 0.65, 0.35],

      // Rode sterren (M type - rode dwergen)
      redDwarf: [0.92, 0.52, 0.38],
      deepRed: [0.85, 0.45, 0.35],
      darkRed: [0.78, 0.38, 0.32],

      // Gedimde/oude sterren
      fadedOrange: [0.82, 0.68, 0.52],
      dimYellow: [0.85, 0.78, 0.58],
      neutralGray: [0.70, 0.72, 0.75],

      // Subtiele tinten voor achtergrond sterren
      faintBlue: [0.58, 0.62, 0.72],
      dustyRose: [0.75, 0.58, 0.55]
    };

    const baseColor = colors[type] || [1.0, 1.0, 1.0];
    return new THREE.Color(
      Math.max(0, Math.min(1, baseColor[0] + variation)),
      Math.max(0, Math.min(1, baseColor[1] + variation * 0.7)),
      Math.max(0, Math.min(1, baseColor[2] + variation * 0.5))
    );
  }, []);

  const generateGlobularCluster = useCallback((
    totalStars: number,
    coreRadius: number,
    haloRadius: number
  ) => {
    const points: { x: number; y: number; z: number; region: string; distanceFromCenter: number }[] = [];
    const coreStars = Math.floor(totalStars * 0.2);
    const haloStars = totalStars - coreStars;

    for (let i = 0; i < coreStars; i++) {
      const r = Math.pow(Math.random(), 0.5) * coreRadius;
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(2 * Math.random() - 1);

      const x = r * Math.sin(phi) * Math.cos(theta);
      const y = r * Math.sin(phi) * Math.sin(theta);
      const z = r * Math.cos(phi);

      points.push({ x, y, z, region: 'core', distanceFromCenter: r });
    }

    for (let i = 0; i < haloStars; i++) {
      const r = coreRadius + Math.pow(Math.random(), 1.2) * (haloRadius - coreRadius);
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(2 * Math.random() - 1);

      const x = r * Math.sin(phi) * Math.cos(theta);
      const y = r * Math.sin(phi) * Math.sin(theta);
      const z = r * Math.cos(phi);

      points.push({ x, y, z, region: 'halo', distanceFromCenter: r });
    }

    return points;
  }, []);

  const generateStarCatalog = useCallback((): Star[] => {
    const stars: Star[] = [];
    const positions = generateGlobularCluster(TOTAL_STARS, CORE_RADIUS, HALO_RADIUS);

    positions.forEach((pos) => {
      const distanceRatio = pos.distanceFromCenter / HALO_RADIUS;
      let color: THREE.Color, size: number, starType: string, brightness: number;
      const random = Math.random();

      if (pos.region === 'core') {
        // Kern: mix van alle stertypen, realistischer verdeling
        if (random < 0.05) {
          // Zeldzame blauwe reuzen (helderste sterren)
          color = getClusterColor('blueGiant', Math.random() * 0.1 - 0.05);
          size = 0.006 + Math.pow(Math.random(), 1.3) * 0.018;
          starType = 'blueGiant';
          brightness = 0.7 + Math.random() * 0.3;
        } else if (random < 0.12) {
          // Heldere blauwe sterren
          color = getClusterColor('brightBlue', Math.random() * 0.08 - 0.04);
          size = 0.005 + Math.pow(Math.random(), 1.5) * 0.015;
          starType = 'brightBlue';
          brightness = 0.6 + Math.random() * 0.25;
        } else if (random < 0.25) {
          // Gele/witte hoofdreeks (zonachtige sterren)
          color = getClusterColor('paleYellow', Math.random() * 0.1 - 0.05);
          size = 0.004 + Math.pow(Math.random(), 1.6) * 0.013;
          starType = 'paleYellow';
          brightness = 0.45 + Math.random() * 0.3;
        } else if (random < 0.40) {
          // Witte hoofdreeks sterren
          color = getClusterColor('mainSequence', Math.random() * 0.08 - 0.04);
          size = 0.003 + Math.pow(Math.random(), 1.7) * 0.012;
          starType = 'mainSequence';
          brightness = 0.4 + Math.random() * 0.3;
        } else if (random < 0.60) {
          // Oranje sterren (veel voorkomend in oude clusters)
          color = getClusterColor('deepOrange', Math.random() * 0.1 - 0.05);
          size = 0.003 + Math.pow(Math.random(), 1.6) * 0.013;
          starType = 'deepOrange';
          brightness = 0.35 + Math.random() * 0.3;
        } else if (random < 0.75) {
          // Amber/goudkleurige sterren
          color = getClusterColor('amber', Math.random() * 0.09 - 0.045);
          size = 0.003 + Math.pow(Math.random(), 1.7) * 0.011;
          starType = 'amber';
          brightness = 0.32 + Math.random() * 0.28;
        } else if (random < 0.88) {
          // Rode dwergen (meest voorkomend)
          color = getClusterColor('redDwarf', Math.random() * 0.08 - 0.04);
          size = 0.002 + Math.pow(Math.random(), 2.0) * 0.010;
          starType = 'redDwarf';
          brightness = 0.28 + Math.random() * 0.25;
        } else if (random < 0.95) {
          // Diep rode sterren
          color = getClusterColor('deepRed', Math.random() * 0.07 - 0.035);
          size = 0.002 + Math.pow(Math.random(), 2.1) * 0.009;
          starType = 'deepRed';
          brightness = 0.22 + Math.random() * 0.22;
        } else {
          // Donkere rode dwergen
          color = getClusterColor('darkRed', Math.random() * 0.06 - 0.03);
          size = 0.002 + Math.pow(Math.random(), 2.2) * 0.008;
          starType = 'darkRed';
          brightness = 0.18 + Math.random() * 0.20;
        }
      } else {
        // Halo: voornamelijk oudere, zwakkere sterren
        if (random < 0.08) {
          // Enkele blauwe stragglers
          color = getClusterColor('faintBlue', Math.random() * 0.08 - 0.04);
          size = 0.002 + Math.pow(Math.random(), 2.2) * 0.008;
          starType = 'faintBlue';
          brightness = 0.25 + Math.random() * 0.20;
        } else if (random < 0.25) {
          // Gedimde oranje sterren
          color = getClusterColor('fadedOrange', Math.random() * 0.07 - 0.035);
          size = 0.002 + Math.pow(Math.random(), 2.3) * 0.008;
          starType = 'fadedOrange';
          brightness = 0.20 + Math.random() * 0.22;
        } else if (random < 0.45) {
          // Gedimde gele sterren
          color = getClusterColor('dimYellow', Math.random() * 0.08 - 0.04);
          size = 0.002 + Math.pow(Math.random(), 2.2) * 0.009;
          starType = 'dimYellow';
          brightness = 0.22 + Math.random() * 0.24;
        } else if (random < 0.70) {
          // Rode dwergen (dominant in halo)
          color = getClusterColor('redDwarf', Math.random() * 0.07 - 0.035);
          size = 0.002 + Math.pow(Math.random(), 2.4) * 0.007;
          starType = 'redDwarf';
          brightness = 0.18 + Math.random() * 0.20;
        } else if (random < 0.85) {
          // Donkere rode sterren
          color = getClusterColor('darkRed', Math.random() * 0.06 - 0.03);
          size = 0.001 + Math.pow(Math.random(), 2.5) * 0.007;
          starType = 'darkRed';
          brightness = 0.15 + Math.random() * 0.18;
        } else {
          // Zwakke grijze sterren
          color = getClusterColor('neutralGray', Math.random() * 0.06 - 0.03);
          size = 0.001 + Math.pow(Math.random(), 2.5) * 0.006;
          starType = 'neutralGray';
          brightness = 0.12 + Math.random() * 0.15;
        }
      }

      brightness *= (1.2 - distanceRatio * 0.4);
      brightness = Math.max(0.1, Math.min(1.8, brightness));

      let shapeType = 'dot';
      if (brightness > 0.9) {
        shapeType = Math.random() < 0.8 ? 'dot' : 'round';
      }

      stars.push({
        position: pos,
        color: color,
        size: size,
        brightness: brightness,
        starType: starType,
        shapeType: shapeType,
        region: pos.region
      });
    });

    return stars;
  }, [generateGlobularCluster, getClusterColor]);

  const createStarSystem = useCallback((stars: Star[], basePointSize: number): THREE.Points | null => {
    if (stars.length === 0) return null;

    const geometry = new THREE.BufferGeometry();
    const positions: number[] = [];
    const colors: number[] = [];
    const sizes: number[] = [];
    const alphas: number[] = [];

    stars.forEach(star => {
      positions.push(star.position.x, star.position.y, star.position.z);
      colors.push(star.color.r, star.color.g, star.color.b);
      sizes.push(star.size);
      alphas.push(star.brightness);
    });

    geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
    geometry.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3));
    geometry.setAttribute('size', new THREE.Float32BufferAttribute(sizes, 1));
    geometry.setAttribute('alpha', new THREE.Float32BufferAttribute(alphas, 1));

    const material = new THREE.ShaderMaterial({
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
          gl_PointSize = size * ${basePointSize.toFixed(1)} * (400.0 / -mvPosition.z);
          gl_Position = projectionMatrix * mvPosition;
        }
      `,
      fragmentShader: `
        varying vec3 vColor;
        varying float vAlpha;

        void main() {
          vec2 uv = gl_PointCoord;
          vec2 center = uv - 0.5;
          float dist = length(center);

          float alpha = 1.0 - smoothstep(0.0, 0.5, dist);
          alpha *= vAlpha;

          if (alpha < 0.08) discard;
          gl_FragColor = vec4(vColor * vAlpha, alpha);
        }
      `,
      transparent: true,
      depthWrite: false,
      blending: THREE.NormalBlending
    });

    return new THREE.Points(geometry, material);
  }, []);

  const handleMouseDown = useCallback((e: MouseEvent) => {
    setIsDragging(true);
    setAutoRotate(false);
    lastMousePosRef.current = { x: e.clientX, y: e.clientY };

    if (autoRotateTimeoutRef.current) {
      clearTimeout(autoRotateTimeoutRef.current);
    }
  }, []);

  const handleMouseMove = useCallback((e: MouseEvent) => {
    if (!isDragging) return;

    const deltaX = e.clientX - lastMousePosRef.current.x;
    const deltaY = e.clientY - lastMousePosRef.current.y;

    starSystemsRef.current.forEach(system => {
      system.rotation.y += deltaX * 0.005;
      system.rotation.x += deltaY * 0.005;
    });

    lastMousePosRef.current = { x: e.clientX, y: e.clientY };
  }, [isDragging]);

  const handleMouseUp = useCallback(() => {
    setIsDragging(false);

    autoRotateTimeoutRef.current = setTimeout(() => {
      setAutoRotate(true);
    }, 2000);
  }, []);

  const handleWheel = useCallback((e: WheelEvent) => {
    e.preventDefault();
    const camera = cameraRef.current;
    if (!camera) return;

    const zoomSpeed = 0.08;
    const minDistance = 40;
    const maxDistance = 200;
    camera.position.z = Math.max(minDistance, Math.min(maxDistance, camera.position.z + e.deltaY * zoomSpeed));
  }, []);

  const handleResize = useCallback(() => {
    const camera = cameraRef.current;
    const renderer = rendererRef.current;
    if (!camera || !renderer) return;

    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
  }, []);

  useEffect(() => {
    if (!containerRef.current) return;

    // Initialize scene
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x000000);
    sceneRef.current = scene;

    // Initialize camera
    const camera = new THREE.PerspectiveCamera(
      45,
      window.innerWidth / window.innerHeight,
      0.1,
      1000
    );
    camera.position.set(0, 0, 90);
    camera.lookAt(0, 0, 0);
    cameraRef.current = camera;

    // Initialize renderer
    const renderer = new THREE.WebGLRenderer({
      antialias: true,
      alpha: true
    });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    containerRef.current.appendChild(renderer.domElement);
    rendererRef.current = renderer;

    // Generate stars
    const starCatalog = generateStarCatalog();
    console.log(`Generated ${starCatalog.length} stars`);

    const starGroups: StarGroups = {
      tiny: starCatalog.filter(s => s.shapeType === 'dot' && s.size < 0.06),
      medium: starCatalog.filter(s => s.shapeType === 'dot' && s.size >= 0.06),
      round: starCatalog.filter(s => s.shapeType === 'round')
    };

    const systems = [
      createStarSystem(starGroups.tiny, 200),
      createStarSystem(starGroups.medium, 180),
      createStarSystem(starGroups.round, 160)
    ].filter((s): s is THREE.Points => s !== null);

    console.log(`Created ${systems.length} star systems`);
    systems.forEach(system => scene.add(system));
    starSystemsRef.current = systems;

    setIsLoading(false);

    // Animation loop
    const animate = () => {
      animationIdRef.current = requestAnimationFrame(animate);

      if (autoRotate && !isDragging) {
        starSystemsRef.current.forEach(system => {
          system.rotation.y += ROTATION_SPEED;
          system.rotation.x += ROTATION_SPEED * 0.2;
        });
      }

      renderer.render(scene, camera);
    };
    animate();

    // Event listeners
    const container = containerRef.current;
    container.addEventListener('mousedown', handleMouseDown as EventListener);
    window.addEventListener('mousemove', handleMouseMove as EventListener);
    window.addEventListener('mouseup', handleMouseUp);
    container.addEventListener('wheel', handleWheel as EventListener, { passive: false });
    window.addEventListener('resize', handleResize);

    // Cleanup
    return () => {
      if (animationIdRef.current) {
        cancelAnimationFrame(animationIdRef.current);
      }

      container.removeEventListener('mousedown', handleMouseDown as EventListener);
      window.removeEventListener('mousemove', handleMouseMove as EventListener);
      window.removeEventListener('mouseup', handleMouseUp);
      container.removeEventListener('wheel', handleWheel as EventListener);
      window.removeEventListener('resize', handleResize);

      if (autoRotateTimeoutRef.current) {
        clearTimeout(autoRotateTimeoutRef.current);
      }

      starSystemsRef.current.forEach(system => {
        system.geometry.dispose();
        if (system.material instanceof THREE.Material) {
          system.material.dispose();
        }
      });

      renderer.dispose();
      container.removeChild(renderer.domElement);
    };
  }, [
    generateStarCatalog,
    createStarSystem,
    handleMouseDown,
    handleMouseMove,
    handleMouseUp,
    handleWheel,
    handleResize,
    autoRotate,
    isDragging
  ]);

  return (
    <div
      ref={containerRef}
      className="w-screen h-screen relative overflow-hidden"
      style={{ cursor: isDragging ? 'grabbing' : 'grab' }}
    >
      {isLoading && (
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 text-white/60 text-lg font-light">
          Laden van de sterrenhoop...
        </div>
      )}

      {!isLoading && (
        <>
          <div className="absolute bottom-[15%] left-1/2 transform -translate-x-1/2 text-center space-y-2 pointer-events-none">
            <div className="text-white/60 text-sm opacity-60">✦</div>
            <div className="text-white/85 text-lg font-light">Globular Cluster</div>
            <div className="text-white/50 text-sm">
              Een sferische sterrenhoop • Drag om te verkennen • Scroll om te zoomen
            </div>
          </div>

          <div className="absolute top-5 right-5 bg-black/30 backdrop-blur-lg border border-white/10 rounded-lg px-3 py-2 flex items-center gap-2 pointer-events-none">
            <div
              className={`w-1.5 h-1.5 rounded-full transition-colors ${
                autoRotate ? 'bg-green-400' : 'bg-gray-500'
              }`}
            />
            <span className="text-white/60 text-xs">
              {autoRotate ? 'Auto-rotatie' : 'Handmatig'}
            </span>
          </div>

          <div className="absolute bottom-5 left-5 text-white/40 text-xs font-light pointer-events-none">
            55.000 sterren • Realistische cluster
          </div>
        </>
      )}
    </div>
  );
}

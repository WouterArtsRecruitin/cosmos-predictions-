'use client';

import { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';

export default function GlobularCluster() {
  const containerRef = useRef<HTMLDivElement>(null);
  const sceneRef = useRef<THREE.Scene | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const starSystemsRef = useRef<THREE.Points[]>([]);
  const animationIdRef = useRef<number | null>(null);
  
  const [isDragging, setIsDragging] = useState(false);
  const [autoRotate, setAutoRotate] = useState(true);
  const [lastMousePos, setLastMousePos] = useState({ x: 0, y: 0 });
  const [isLoaded, setIsLoaded] = useState(false);

  const rotationSpeedRef = useRef(0.00015);

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

    // Generate star catalog
    const starCatalog = generateStarCatalog();

    // Create textures
    const textures = {
      tiny: createTexture('tiny'),
      medium: createTexture('medium'),
      brightRound: createTexture('brightRound'),
      brightCross: createTexture('brightCross')
    };

    // Separate stars by type
    const starGroups = {
      tiny: starCatalog.filter(s => s.shapeType === 'dot' && s.size < 0.06),
      medium: starCatalog.filter(s => s.shapeType === 'dot' && s.size >= 0.06),
      round: starCatalog.filter(s => s.shapeType === 'round'),
      cross: starCatalog.filter(s => s.shapeType === 'cross')
    };

    // Create star systems
    const systems = [
      createStarSystem(starGroups.tiny, textures.tiny, 200),
      createStarSystem(starGroups.medium, textures.medium, 180),
      createStarSystem(starGroups.round, textures.brightRound, 160),
      createStarSystem(starGroups.cross, textures.brightCross, 140)
    ].filter((s): s is THREE.Points => s !== null);

    systems.forEach(system => scene.add(system));
    starSystemsRef.current = systems;

    setIsLoaded(true);

    // Animation loop
    const animate = () => {
      animationIdRef.current = requestAnimationFrame(animate);
      
      if (autoRotate && !isDragging) {
        systems.forEach(system => {
          system.rotation.y += rotationSpeedRef.current;
          system.rotation.x += rotationSpeedRef.current * 0.2;
        });
      }
      
      renderer.render(scene, camera);
    };
    animate();

    // Handle resize
    const handleResize = () => {
      if (!cameraRef.current || !rendererRef.current) return;
      cameraRef.current.aspect = window.innerWidth / window.innerHeight;
      cameraRef.current.updateProjectionMatrix();
      rendererRef.current.setSize(window.innerWidth, window.innerHeight);
    };
    window.addEventListener('resize', handleResize);

    // Cleanup
    return () => {
      window.removeEventListener('resize', handleResize);
      if (animationIdRef.current) {
        cancelAnimationFrame(animationIdRef.current);
      }
      if (containerRef.current && renderer.domElement) {
        containerRef.current.removeChild(renderer.domElement);
      }
      renderer.dispose();
      systems.forEach(system => {
        system.geometry.dispose();
        if (Array.isArray(system.material)) {
          system.material.forEach(m => m.dispose());
        } else {
          system.material.dispose();
        }
      });
      Object.values(textures).forEach(t => t.dispose());
    };
  }, [autoRotate, isDragging]);

  const handleMouseDown = (e: React.MouseEvent) => {
    setIsDragging(true);
    setAutoRotate(false);
    setLastMousePos({ x: e.clientX, y: e.clientY });
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (isDragging && starSystemsRef.current.length > 0) {
      const deltaX = e.clientX - lastMousePos.x;
      const deltaY = e.clientY - lastMousePos.y;
      
      starSystemsRef.current.forEach(system => {
        system.rotation.y += deltaX * 0.005;
        system.rotation.x += deltaY * 0.005;
      });
      
      setLastMousePos({ x: e.clientX, y: e.clientY });
    }
  };

  const handleMouseUp = () => {
    setIsDragging(false);
    setTimeout(() => setAutoRotate(true), 2000);
  };

  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    if (cameraRef.current) {
      const minDistance = 40;
      const maxDistance = 200;
      cameraRef.current.position.z = Math.max(
        minDistance,
        Math.min(maxDistance, cameraRef.current.position.z + e.deltaY * 0.08)
      );
    }
  };

  return (
    <div 
      ref={containerRef}
      className={`w-screen h-screen relative overflow-hidden bg-black ${isDragging ? 'cursor-grabbing' : 'cursor-grab'}`}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
      onWheel={handleWheel}
    >
      {isLoaded && (
        <>
          {/* Welcome text */}
          <div className="absolute bottom-[15%] left-1/2 -translate-x-1/2 text-white/85 text-lg font-light text-center tracking-wide pointer-events-none z-50">
            <div className="mb-2 opacity-60 text-sm">✦</div>
            <div>Globular Cluster</div>
            <div className="text-sm opacity-50 mt-2">
              Een sferische sterrenhoop • Drag om te verkennen • Scroll om te zoomen
            </div>
          </div>

          {/* Status indicator */}
          <div className="absolute top-5 right-5 bg-black/30 backdrop-blur-lg border border-white/8 rounded-lg px-3 py-2 text-white/60 text-xs flex items-center gap-2 pointer-events-none z-50">
            <div className={`w-1.5 h-1.5 rounded-full transition-colors ${autoRotate ? 'bg-green-400' : 'bg-gray-500'}`} />
            <span>{autoRotate ? 'Auto-rotatie' : 'Handmatig'}</span>
          </div>

          {/* Star count */}
          <div className="absolute bottom-5 left-5 text-white/40 text-xs font-light pointer-events-none z-50">
            55.000 sterren • Realistische cluster
          </div>
        </>
      )}
    </div>
  );
}

// Helper functions (same logic as HTML version)

interface StarData {
  position: { x: number; y: number; z: number };
  color: THREE.Color;
  size: number;
  brightness: number;
  starType: string;
  shapeType: string;
  region: string;
}

function generateGlobularCluster(totalStars: number, coreRadius: number, haloRadius: number) {
  const points: { x: number; y: number; z: number; region: string; distanceFromCenter: number }[] = [];
  const coreStars = Math.floor(totalStars * 0.2);
  const haloStars = totalStars - coreStars;

  // Core stars
  for (let i = 0; i < coreStars; i++) {
    const r = Math.pow(Math.random(), 0.5) * coreRadius;
    const theta = Math.random() * Math.PI * 2;
    const phi = Math.acos(2 * Math.random() - 1);
    
    const x = r * Math.sin(phi) * Math.cos(theta);
    const y = r * Math.sin(phi) * Math.sin(theta);
    const z = r * Math.cos(phi);
    
    points.push({ x, y, z, region: 'core', distanceFromCenter: r });
  }

  // Halo stars
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
}

function getClusterColor(type: string, variation: number): THREE.Color {
  const colors: Record<string, [number, number, number]> = {
    mainSequence: [0.94, 0.91, 0.84],
    coolWhite: [0.90, 0.92, 0.95],
    warmWhite: [0.96, 0.93, 0.82],
    subtleBlue: [0.85, 0.90, 0.98],
    lightPurple: [0.90, 0.86, 0.95],
    subtleOrange: [0.95, 0.86, 0.72],
    deepOrange: [0.92, 0.78, 0.65],
    faintRed: [0.89, 0.82, 0.78],
    faintPink: [0.92, 0.89, 0.91],
    neutralGray: [0.88, 0.88, 0.90]
  };
  
  const baseColor = colors[type] || [1.0, 1.0, 1.0];
  return new THREE.Color(
    Math.max(0, Math.min(1, baseColor[0] + variation)),
    Math.max(0, Math.min(1, baseColor[1] + variation * 0.7)),
    Math.max(0, Math.min(1, baseColor[2] + variation * 0.5))
  );
}

function generateStarCatalog(): StarData[] {
  const stars: StarData[] = [];
  const coreRadius = 15;
  const haloRadius = 45;
  const positions = generateGlobularCluster(55000, coreRadius, haloRadius);
  
  positions.forEach((pos) => {
    const distanceRatio = pos.distanceFromCenter / haloRadius;
    
    let color: THREE.Color, size: number, starType: string, brightness: number;
    const random = Math.random();
    
    if (pos.region === 'core') {
      if (random < 0.35) {
        color = getClusterColor('mainSequence', Math.random() * 0.12 - 0.06);
        size = 0.003 + Math.pow(Math.random(), 1.8) * 0.012;
        starType = 'mainSequence';
        brightness = 0.35 + Math.random() * 0.35;
      } else if (random < 0.55) {
        color = getClusterColor('subtleOrange', Math.random() * 0.1 - 0.05);
        size = 0.004 + Math.pow(Math.random(), 1.5) * 0.015;
        starType = 'subtleOrange';
        brightness = 0.4 + Math.random() * 0.35;
      } else if (random < 0.70) {
        color = getClusterColor('warmWhite', Math.random() * 0.08 - 0.04);
        size = 0.003 + Math.pow(Math.random(), 1.8) * 0.012;
        starType = 'warmWhite';
        brightness = 0.35 + Math.random() * 0.3;
      } else if (random < 0.80) {
        color = getClusterColor('deepOrange', Math.random() * 0.08 - 0.04);
        size = 0.003 + Math.pow(Math.random(), 1.7) * 0.012;
        starType = 'deepOrange';
        brightness = 0.28 + Math.random() * 0.32;
      } else if (random < 0.88) {
        color = getClusterColor('faintRed', Math.random() * 0.07 - 0.035);
        size = 0.002 + Math.pow(Math.random(), 1.8) * 0.012;
        starType = 'faintRed';
        brightness = 0.26 + Math.random() * 0.30;
      } else if (random < 0.92) {
        color = getClusterColor('coolWhite', Math.random() * 0.06 - 0.03);
        size = 0.002 + Math.pow(Math.random(), 2.0) * 0.009;
        starType = 'coolWhite';
        brightness = 0.28 + Math.random() * 0.28;
      } else if (random < 0.94) {
        color = getClusterColor('subtleBlue', Math.random() * 0.06 - 0.03);
        size = 0.002 + Math.pow(Math.random(), 2.0) * 0.010;
        starType = 'subtleBlue';
        brightness = 0.24 + Math.random() * 0.28;
      } else if (random < 0.97) {
        color = getClusterColor('lightPurple', Math.random() * 0.05 - 0.025);
        size = 0.002 + Math.pow(Math.random(), 1.9) * 0.009;
        starType = 'lightPurple';
        brightness = 0.22 + Math.random() * 0.26;
      } else {
        color = getClusterColor('faintPink', Math.random() * 0.04 - 0.02);
        size = 0.002 + Math.pow(Math.random(), 1.9) * 0.009;
        starType = 'faintPink';
        brightness = 0.2 + Math.random() * 0.23;
      }
    } else {
      // Halo stars
      if (random < 0.40) {
        color = getClusterColor('neutralGray', Math.random() * 0.08 - 0.04);
        size = 0.002 + Math.pow(Math.random(), 2.5) * 0.007;
        starType = 'neutralGray';
        brightness = 0.18 + Math.random() * 0.22;
      } else if (random < 0.65) {
        color = getClusterColor('mainSequence', Math.random() * 0.09 - 0.045);
        size = 0.002 + Math.pow(Math.random(), 2.1) * 0.009;
        starType = 'mainSequence';
        brightness = 0.2 + Math.random() * 0.28;
      } else if (random < 0.78) {
        color = getClusterColor('coolWhite', Math.random() * 0.07 - 0.035);
        size = 0.002 + Math.pow(Math.random(), 1.9) * 0.008;
        starType = 'coolWhite';
        brightness = 0.22 + Math.random() * 0.25;
      } else if (random < 0.88) {
        color = getClusterColor('warmWhite', Math.random() * 0.06 - 0.03);
        size = 0.002 + Math.pow(Math.random(), 2.3) * 0.007;
        starType = 'warmWhite';
        brightness = 0.2 + Math.random() * 0.24;
      } else if (random < 0.91) {
        color = getClusterColor('subtleOrange', Math.random() * 0.05 - 0.025);
        size = 0.002 + Math.pow(Math.random(), 2.4) * 0.006;
        starType = 'subtleOrange';
        brightness = 0.18 + Math.random() * 0.22;
      } else if (random < 0.94) {
        color = getClusterColor('deepOrange', Math.random() * 0.04 - 0.02);
        size = 0.002 + Math.pow(Math.random(), 2.3) * 0.007;
        starType = 'deepOrange';
        brightness = 0.16 + Math.random() * 0.24;
      } else if (random < 0.97) {
        color = getClusterColor('faintRed', Math.random() * 0.03 - 0.015);
        size = 0.002 + Math.pow(Math.random(), 2.5) * 0.006;
        starType = 'faintRed';
        brightness = 0.14 + Math.random() * 0.22;
      } else if (random < 0.975) {
        color = getClusterColor('subtleBlue', Math.random() * 0.05 - 0.025);
        size = 0.001 + Math.pow(Math.random(), 2.4) * 0.006;
        starType = 'subtleBlue';
        brightness = 0.16 + Math.random() * 0.22;
      } else if (random < 0.99) {
        color = getClusterColor('lightPurple', Math.random() * 0.04 - 0.02);
        size = 0.001 + Math.pow(Math.random(), 2.5) * 0.005;
        starType = 'lightPurple';
        brightness = 0.14 + Math.random() * 0.20;
      } else {
        color = getClusterColor('faintPink', Math.random() * 0.03 - 0.015);
        size = 0.001 + Math.pow(Math.random(), 2.8) * 0.004;
        starType = 'faintPink';
        brightness = 0.12 + Math.random() * 0.18;
      }
    }
    
    brightness *= (1.2 - distanceRatio * 0.4);
    brightness = Math.max(0.1, Math.min(1.8, brightness));
    
    let shapeType = 'dot';
    if (brightness > 1.2) {
      shapeType = Math.random() < 0.7 ? 'round' : 'cross';
    } else if (brightness > 0.9) {
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
}

function createTexture(type: string): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d')!;
  
  switch(type) {
    case 'tiny':
      canvas.width = 4;
      canvas.height = 4;
      const tinyGrad = ctx.createRadialGradient(2, 2, 0, 2, 2, 2);
      tinyGrad.addColorStop(0, 'rgba(255, 255, 255, 0.9)');
      tinyGrad.addColorStop(0.5, 'rgba(255, 255, 255, 0.4)');
      tinyGrad.addColorStop(1, 'rgba(255, 255, 255, 0)');
      ctx.fillStyle = tinyGrad;
      ctx.fillRect(0, 0, 4, 4);
      break;
      
    case 'medium':
      canvas.width = 8;
      canvas.height = 8;
      const medGrad = ctx.createRadialGradient(4, 4, 0, 4, 4, 4);
      medGrad.addColorStop(0, 'rgba(255, 255, 255, 0.8)');
      medGrad.addColorStop(0.5, 'rgba(255, 255, 255, 0.5)');
      medGrad.addColorStop(0.8, 'rgba(255, 255, 255, 0.2)');
      medGrad.addColorStop(1, 'rgba(255, 255, 255, 0)');
      ctx.fillStyle = medGrad;
      ctx.fillRect(0, 0, 8, 8);
      break;
      
    case 'brightRound':
      canvas.width = 32;
      canvas.height = 32;
      const brightGrad = ctx.createRadialGradient(16, 16, 0, 16, 16, 16);
      brightGrad.addColorStop(0, 'rgba(255, 255, 255, 1)');
      brightGrad.addColorStop(0.3, 'rgba(255, 255, 255, 0.95)');
      brightGrad.addColorStop(0.6, 'rgba(255, 255, 255, 0.5)');
      brightGrad.addColorStop(0.8, 'rgba(255, 255, 255, 0.2)');
      brightGrad.addColorStop(1, 'rgba(255, 255, 255, 0)');
      ctx.fillStyle = brightGrad;
      ctx.fillRect(0, 0, 32, 32);
      break;
      
    case 'brightCross':
      canvas.width = 32;
      canvas.height = 32;
      const center = 16;
      
      const horizGrad = ctx.createLinearGradient(0, center, 32, center);
      horizGrad.addColorStop(0, 'rgba(255, 255, 255, 0)');
      horizGrad.addColorStop(0.1, 'rgba(255, 255, 255, 0.3)');
      horizGrad.addColorStop(0.5, 'rgba(255, 255, 255, 1)');
      horizGrad.addColorStop(0.9, 'rgba(255, 255, 255, 0.3)');
      horizGrad.addColorStop(1, 'rgba(255, 255, 255, 0)');
      ctx.fillStyle = horizGrad;
      ctx.fillRect(0, center - 1.5, 32, 3);
      
      const vertGrad = ctx.createLinearGradient(center, 0, center, 32);
      vertGrad.addColorStop(0, 'rgba(255, 255, 255, 0)');
      vertGrad.addColorStop(0.1, 'rgba(255, 255, 255, 0.3)');
      vertGrad.addColorStop(0.5, 'rgba(255, 255, 255, 1)');
      vertGrad.addColorStop(0.9, 'rgba(255, 255, 255, 0.3)');
      vertGrad.addColorStop(1, 'rgba(255, 255, 255, 0)');
      ctx.fillStyle = vertGrad;
      ctx.fillRect(center - 1.5, 0, 3, 32);
      
      const centerGrad = ctx.createRadialGradient(center, center, 0, center, center, 8);
      centerGrad.addColorStop(0, 'rgba(255, 255, 255, 1)');
      centerGrad.addColorStop(0.5, 'rgba(255, 255, 255, 0.8)');
      centerGrad.addColorStop(1, 'rgba(255, 255, 255, 0)');
      ctx.fillStyle = centerGrad;
      ctx.fillRect(center - 8, center - 8, 16, 16);
      break;
  }
  
  return new THREE.CanvasTexture(canvas);
}

function createStarSystem(stars: StarData[], texture: THREE.CanvasTexture, basePointSize: number): THREE.Points | null {
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
    uniforms: {
      pointTexture: { value: texture }
    },
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
      uniform sampler2D pointTexture;
      varying vec3 vColor;
      varying float vAlpha;
      
      void main() {
        vec4 texColor = texture2D(pointTexture, gl_PointCoord);
        float alpha = texColor.a * vAlpha;
        if (alpha < 0.08) discard;
        gl_FragColor = vec4(vColor * vAlpha, alpha);
      }
    `,
    transparent: true,
    depthWrite: false,
    blending: THREE.NormalBlending
  });

  return new THREE.Points(geometry, material);
}

'use client';

import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import * as THREE from 'three';

export default function MatrixCosmosLanding() {
  const router = useRouter();
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const matrixColumnsRef = useRef<MatrixColumn[]>([]);
  const animationIdRef = useRef<number | null>(null);
  
  const [phase, setPhase] = useState<'matrix' | 'morphing' | 'cosmos'>('matrix');
  const [question, setQuestion] = useState('');
  const [showForm, setShowForm] = useState(false);

  // Three.js refs for cosmos
  const sceneRef = useRef<THREE.Scene | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const starSystemsRef = useRef<THREE.Points[]>([]);

  interface MatrixColumn {
    x: number;
    y: number;
    speed: number;
    chars: string[];
    opacity: number;
    targetOpacity: number;
  }

  // Matrix Phase
  useEffect(() => {
    if (!canvasRef.current || phase !== 'matrix') return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d')!;
    
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

    // Matrix characters
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789@#$%^&*()_+-=[]{}|;:,.<>?/~`';
    const fontSize = 16;
    const columns = Math.floor(canvas.width / fontSize);

    // Initialize columns
    const matrixColumns: MatrixColumn[] = [];
    for (let i = 0; i < columns; i++) {
      matrixColumns.push({
        x: i * fontSize,
        y: Math.random() * canvas.height - canvas.height,
        speed: 1 + Math.random() * 3,
        chars: Array(30).fill(0).map(() => chars[Math.floor(Math.random() * chars.length)]),
        opacity: 1,
        targetOpacity: 1
      });
    }
    matrixColumnsRef.current = matrixColumns;

    // Draw matrix rain
    function drawMatrix() {
      ctx.fillStyle = 'rgba(0, 0, 0, 0.05)';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      matrixColumnsRef.current.forEach((column) => {
        // Fade out during morphing phase
        if (column.opacity > column.targetOpacity) {
          column.opacity -= 0.02;
        }

        column.chars.forEach((char, idx) => {
          const y = column.y + idx * fontSize;
          
          if (y > 0 && y < canvas.height) {
            // Green with glow
            const brightness = 1 - (idx / column.chars.length) * 0.7;
            ctx.fillStyle = `rgba(0, 255, 65, ${brightness * column.opacity})`;
            ctx.font = `${fontSize}px monospace`;
            ctx.fillText(char, column.x, y);
          }
        });

        // Move column down
        column.y += column.speed;

        // Reset column when it goes off screen
        if (column.y > canvas.height) {
          column.y = -column.chars.length * fontSize;
          column.speed = 1 + Math.random() * 3;
        }
      });

      animationIdRef.current = requestAnimationFrame(drawMatrix);
    }

    drawMatrix();

    // Start morphing after 3 seconds
    const morphTimer = setTimeout(() => {
      setPhase('morphing');
      // Fade out matrix
      matrixColumnsRef.current.forEach(col => col.targetOpacity = 0);
      
      // Start cosmos after 2 seconds
      setTimeout(() => {
        setPhase('cosmos');
        // Show form after another 2 seconds
        setTimeout(() => setShowForm(true), 2000);
      }, 2000);
    }, 3000);

    return () => {
      clearTimeout(morphTimer);
      if (animationIdRef.current) {
        cancelAnimationFrame(animationIdRef.current);
      }
    };
  }, [phase]);

  // Cosmos Phase - Globular Cluster
  useEffect(() => {
    if (!containerRef.current || phase !== 'cosmos') return;

    // Three.js setup (simplified version of GlobularCluster)
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x000000);
    sceneRef.current = scene;

    const camera = new THREE.PerspectiveCamera(
      45,
      window.innerWidth / window.innerHeight,
      0.1,
      1000
    );
    camera.position.set(0, 0, 90);
    camera.lookAt(0, 0, 0);
    cameraRef.current = camera;

    const renderer = new THREE.WebGLRenderer({ 
      antialias: true,
      alpha: true
    });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    containerRef.current.appendChild(renderer.domElement);
    rendererRef.current = renderer;

    // Generate simplified star catalog (10k stars for performance)
    const starCatalog = generateSimplifiedStars(10000);

    // Create star system
    const geometry = new THREE.BufferGeometry();
    const positions: number[] = [];
    const colors: number[] = [];
    const sizes: number[] = [];

    starCatalog.forEach(star => {
      positions.push(star.x, star.y, star.z);
      colors.push(star.color.r, star.color.g, star.color.b);
      sizes.push(star.size);
    });

    geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
    geometry.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3));
    geometry.setAttribute('size', new THREE.Float32BufferAttribute(sizes, 1));

    // Create texture
    const texture = createStarTexture();

    const material = new THREE.ShaderMaterial({
      uniforms: {
        pointTexture: { value: texture }
      },
      vertexShader: `
        attribute float size;
        attribute vec3 color;
        varying vec3 vColor;
        
        void main() {
          vColor = color;
          vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
          gl_PointSize = size * 150.0 * (300.0 / -mvPosition.z);
          gl_Position = projectionMatrix * mvPosition;
        }
      `,
      fragmentShader: `
        uniform sampler2D pointTexture;
        varying vec3 vColor;
        
        void main() {
          vec4 texColor = texture2D(pointTexture, gl_PointCoord);
          if (texColor.a < 0.1) discard;
          gl_FragColor = vec4(vColor, texColor.a * 0.8);
        }
      `,
      transparent: true,
      depthWrite: false,
      blending: THREE.NormalBlending
    });

    const starSystem = new THREE.Points(geometry, material);
    scene.add(starSystem);
    starSystemsRef.current = [starSystem];

    // Animation loop
    function animate() {
      animationIdRef.current = requestAnimationFrame(animate);
      starSystem.rotation.y += 0.0002;
      starSystem.rotation.x += 0.00006;
      renderer.render(scene, camera);
    }
    animate();

    // Resize handler
    const handleResize = () => {
      camera.aspect = window.innerWidth / window.innerHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(window.innerWidth, window.innerHeight);
    };
    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      if (animationIdRef.current) {
        cancelAnimationFrame(animationIdRef.current);
      }
      if (containerRef.current && renderer.domElement.parentNode === containerRef.current) {
        containerRef.current.removeChild(renderer.domElement);
      }
      renderer.dispose();
      starSystem.geometry.dispose();
      if (Array.isArray(starSystem.material)) {
        starSystem.material.forEach(m => m.dispose());
      } else {
        starSystem.material.dispose();
      }
      texture.dispose();
    };
  }, [phase]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (question.trim()) {
      router.push(`/predictions?q=${encodeURIComponent(question)}`);
    }
  };

  return (
    <div className="relative w-screen h-screen overflow-hidden bg-black">
      {/* Matrix Phase */}
      {phase === 'matrix' && (
        <canvas
          ref={canvasRef}
          className="absolute inset-0 z-10"
        />
      )}

      {/* Morphing Phase */}
      {phase === 'morphing' && (
        <>
          <canvas
            ref={canvasRef}
            className="absolute inset-0 z-10 transition-opacity duration-2000"
            style={{ opacity: 0.3 }}
          />
          <div className="absolute inset-0 z-20 flex items-center justify-center">
            <div className="text-green-400 text-2xl font-mono animate-pulse">
              Morphing into cosmos...
            </div>
          </div>
        </>
      )}

      {/* Cosmos Phase */}
      {phase === 'cosmos' && (
        <>
          <div ref={containerRef} className="absolute inset-0 z-10" />
          
          {/* Prediction Form */}
          <div 
            className={`absolute inset-0 flex items-center justify-center z-50 transition-opacity duration-1000 ${
              showForm ? 'opacity-100' : 'opacity-0 pointer-events-none'
            }`}
          >
            <div className="max-w-2xl w-full px-6">
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="text-center space-y-3">
                  <h1 className="text-4xl md:text-5xl font-light text-white tracking-wide">
                    Vraag de kosmos
                  </h1>
                  <p className="text-lg text-white/60">
                    over jouw toekomst
                  </p>
                </div>

                <div className="relative">
                  <input
                    type="text"
                    value={question}
                    onChange={(e) => setQuestion(e.target.value)}
                    placeholder="Bijv: Wat zijn de kansen dat ik binnen 6 maanden een nieuwe baan vind?"
                    className="w-full px-6 py-4 bg-black/30 backdrop-blur-xl border border-white/10 rounded-2xl text-white placeholder:text-white/30 focus:outline-none focus:border-white/30 transition-colors text-lg"
                    autoFocus
                  />
                </div>

                <button
                  type="submit"
                  disabled={!question.trim()}
                  className="w-full px-6 py-4 bg-white/10 backdrop-blur-xl border border-white/20 rounded-2xl text-white font-light text-lg hover:bg-white/20 transition-all disabled:opacity-30 disabled:cursor-not-allowed disabled:hover:bg-white/10"
                >
                  Genereer voorspellingen
                </button>

                <p className="text-center text-sm text-white/40">
                  AI genereert 3 scenario&apos;s: optimistisch, realistisch en pessimistisch
                </p>
              </form>
            </div>
          </div>

          {/* Cosmos UI Overlays */}
          <div className="absolute bottom-[15%] left-1/2 -translate-x-1/2 text-white/85 text-lg font-light text-center tracking-wide pointer-events-none z-40">
            <div className="mb-2 opacity-60 text-sm">✦</div>
            <div>Globular Cluster</div>
            <div className="text-sm opacity-50 mt-2">
              Een sferische sterrenhoop
            </div>
          </div>

          <div className="absolute top-5 right-5 bg-black/30 backdrop-blur-lg border border-white/8 rounded-lg px-3 py-2 text-white/60 text-xs flex items-center gap-2 pointer-events-none z-40">
            <div className="w-1.5 h-1.5 rounded-full bg-green-400" />
            <span>Auto-rotatie</span>
          </div>
        </>
      )}
    </div>
  );
}

// Helper functions
function generateSimplifiedStars(count: number) {
  const stars: Array<{x: number, y: number, z: number, color: THREE.Color, size: number}> = [];
  const coreRadius = 15;
  const haloRadius = 45;

  for (let i = 0; i < count; i++) {
    const isCore = Math.random() < 0.2;
    const r = isCore 
      ? Math.pow(Math.random(), 0.5) * coreRadius
      : coreRadius + Math.pow(Math.random(), 1.2) * (haloRadius - coreRadius);
    
    const theta = Math.random() * Math.PI * 2;
    const phi = Math.acos(2 * Math.random() - 1);
    
    const x = r * Math.sin(phi) * Math.cos(theta);
    const y = r * Math.sin(phi) * Math.sin(theta);
    const z = r * Math.cos(phi);

    // Colors
    const colorRandom = Math.random();
    let color: THREE.Color;
    if (colorRandom < 0.6) {
      color = new THREE.Color(0.94, 0.91, 0.84); // Warm white
    } else if (colorRandom < 0.8) {
      color = new THREE.Color(0.95, 0.86, 0.72); // Orange
    } else if (colorRandom < 0.9) {
      color = new THREE.Color(0.90, 0.92, 0.95); // Cool white
    } else {
      color = new THREE.Color(0.85, 0.90, 0.98); // Blue
    }

    const size = 0.003 + Math.pow(Math.random(), 2) * 0.015;

    stars.push({ x, y, z, color, size });
  }

  return stars;
}

function createStarTexture(): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 16;
  canvas.height = 16;
  const ctx = canvas.getContext('2d')!;
  
  const gradient = ctx.createRadialGradient(8, 8, 0, 8, 8, 8);
  gradient.addColorStop(0, 'rgba(255, 255, 255, 1)');
  gradient.addColorStop(0.5, 'rgba(255, 255, 255, 0.5)');
  gradient.addColorStop(1, 'rgba(255, 255, 255, 0)');
  
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, 16, 16);
  
  return new THREE.CanvasTexture(canvas);
}

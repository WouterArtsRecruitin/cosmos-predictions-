'use client';

import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import * as THREE from 'three';

export default function SimpleCosmosLanding() {
  const router = useRouter();
  const containerRef = useRef<HTMLDivElement>(null);
  const animationIdRef = useRef<number | null>(null);
  
  const [question, setQuestion] = useState('');
  const [showForm, setShowForm] = useState(false);

  // Three.js refs
  const sceneRef = useRef<THREE.Scene | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const starSystemRef = useRef<THREE.Points | null>(null);

  // Cosmos Visualization
  useEffect(() => {
    if (!containerRef.current) return;

    // Three.js setup
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x000012);
    sceneRef.current = scene;

    const camera = new THREE.PerspectiveCamera(
      45,
      window.innerWidth / window.innerHeight,
      0.1,
      1000
    );
    camera.position.set(0, 0, 100);
    cameraRef.current = camera;

    const renderer = new THREE.WebGLRenderer({ 
      antialias: true,
      alpha: true
    });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    containerRef.current.appendChild(renderer.domElement);
    rendererRef.current = renderer;

    // Create globular cluster - dense spherical star distribution
    const starCount = 15000;
    const geometry = new THREE.BufferGeometry();
    const positions: number[] = [];
    const colors: number[] = [];
    const sizes: number[] = [];

    // Generate stars in globular cluster formation
    for (let i = 0; i < starCount; i++) {
      let radius, density;
      
      // Create dense core and sparse halo
      if (Math.random() < 0.3) {
        // Dense core (30% of stars)
        radius = Math.pow(Math.random(), 2) * 25;
        density = 1.0;
      } else if (Math.random() < 0.6) {
        // Medium density zone (30% of stars)
        radius = 25 + Math.pow(Math.random(), 1.5) * 35;
        density = 0.7;
      } else {
        // Sparse outer halo (40% of stars)
        radius = 60 + Math.pow(Math.random(), 0.8) * 40;
        density = 0.4;
      }
      
      // Spherical coordinates
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(2 * Math.random() - 1);
      
      const x = radius * Math.sin(phi) * Math.cos(theta);
      const y = radius * Math.sin(phi) * Math.sin(theta);
      const z = radius * Math.cos(phi);
      
      positions.push(x, y, z);

      // Realistic star colors based on stellar classification
      const colorRandom = Math.random();
      let r, g, b;
      
      if (colorRandom < 0.02) {
        // O-type: Blue giants (very rare)
        r = 0.6; g = 0.8; b = 1.0;
      } else if (colorRandom < 0.1) {
        // B-type: Blue-white (rare)
        r = 0.8; g = 0.9; b = 1.0;
      } else if (colorRandom < 0.2) {
        // A-type: White
        r = 1.0; g = 1.0; b = 1.0;
      } else if (colorRandom < 0.4) {
        // F-type: Yellow-white
        r = 1.0; g = 0.98; b = 0.9;
      } else if (colorRandom < 0.6) {
        // G-type: Yellow (like our Sun)
        r = 1.0; g = 0.95; b = 0.8;
      } else if (colorRandom < 0.8) {
        // K-type: Orange
        r = 1.0; g = 0.85; b = 0.6;
      } else {
        // M-type: Red dwarfs (most common)
        r = 1.0; g = 0.7; b = 0.4;
      }
      
      colors.push(r, g, b);

      // Size based on distance from center and stellar type
      const coreDistance = radius / 100;
      const baseSize = 0.5 + Math.random() * 1.5;
      const brightnessBoost = Math.max(0.3, 1 - coreDistance) * density;
      sizes.push(baseSize * brightnessBoost);
    }

    geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
    geometry.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3));
    geometry.setAttribute('size', new THREE.Float32BufferAttribute(sizes, 1));

    // Star material with shader
    const material = new THREE.ShaderMaterial({
      uniforms: {
        time: { value: 0 }
      },
      vertexShader: `
        attribute float size;
        attribute vec3 color;
        varying vec3 vColor;
        uniform float time;
        
        void main() {
          vColor = color;
          vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
          
          // Subtle pulsing
          float pulse = 1.0 + 0.1 * sin(time * 2.0 + position.x * 0.01);
          gl_PointSize = size * pulse * 100.0 * (300.0 / -mvPosition.z);
          gl_Position = projectionMatrix * mvPosition;
        }
      `,
      fragmentShader: `
        varying vec3 vColor;
        
        void main() {
          float dist = length(gl_PointCoord - vec2(0.5));
          if (dist > 0.5) discard;
          
          float alpha = 1.0 - smoothstep(0.0, 0.5, dist);
          gl_FragColor = vec4(vColor, alpha * 0.8);
        }
      `,
      transparent: true,
      vertexColors: true,
      blending: THREE.AdditiveBlending,
      depthWrite: false
    });

    const starSystem = new THREE.Points(geometry, material);
    scene.add(starSystem);
    starSystemRef.current = starSystem;

    // Mouse interaction
    let mouseX = 0, mouseY = 0;
    let targetRotationX = 0, targetRotationY = 0;
    let isMouseDown = false;

    const handleMouseMove = (event: MouseEvent) => {
      const deltaX = event.clientX - mouseX;
      const deltaY = event.clientY - mouseY;
      
      if (isMouseDown) {
        targetRotationY += deltaX * 0.003;
        targetRotationX += deltaY * 0.003;
        targetRotationX = Math.max(-Math.PI/3, Math.min(Math.PI/3, targetRotationX));
      }
      
      mouseX = event.clientX;
      mouseY = event.clientY;
    };

    const handleMouseDown = (event: MouseEvent) => {
      isMouseDown = true;
      mouseX = event.clientX;
      mouseY = event.clientY;
    };

    const handleMouseUp = () => {
      isMouseDown = false;
    };

    const handleWheel = (event: WheelEvent) => {
      const zoomFactor = event.deltaY > 0 ? 1.1 : 0.9;
      camera.position.multiplyScalar(zoomFactor);
      camera.position.clampLength(30, 200);
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mousedown', handleMouseDown);
    window.addEventListener('mouseup', handleMouseUp);
    window.addEventListener('wheel', handleWheel);

    // Show form after 1 second
    setTimeout(() => setShowForm(true), 2000);

    // Animation loop
    let time = 0;
    function animate() {
      animationIdRef.current = requestAnimationFrame(animate);
      time += 0.005;
      
      // Smooth rotation towards target
      starSystem.rotation.y += (targetRotationY - starSystem.rotation.y) * 0.05;
      starSystem.rotation.x += (targetRotationX - starSystem.rotation.x) * 0.05;
      
      // Gentle auto-rotation when not interacting
      if (!isMouseDown) {
        targetRotationY += 0.0003;
        targetRotationX += 0.0001;
      }
      
      // Update shader time for pulsing stars
      (material as any).uniforms.time.value = time;
      
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
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mousedown', handleMouseDown);
      window.removeEventListener('mouseup', handleMouseUp);
      window.removeEventListener('wheel', handleWheel);
      
      if (animationIdRef.current) {
        cancelAnimationFrame(animationIdRef.current);
      }
      if (containerRef.current && renderer.domElement.parentNode === containerRef.current) {
        containerRef.current.removeChild(renderer.domElement);
      }
      renderer.dispose();
      geometry.dispose();
      material.dispose();
    };
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (question.trim()) {
      router.push(`/predictions?q=${encodeURIComponent(question)}`);
    }
  };

  return (
    <div className="relative w-screen h-screen overflow-hidden bg-black">
      {/* Cosmos Background */}
      <div ref={containerRef} className="absolute inset-0" />
      
      {/* Subtle UI Overlay */}
      <div 
        className={`absolute inset-0 z-20 transition-all duration-3000 ${
          showForm ? 'opacity-100' : 'opacity-0 pointer-events-none'
        }`}
      >
        {/* Floating Question Input */}
        <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2">
          <form onSubmit={handleSubmit} className="space-y-3">
            <div className="text-center mb-6">
              <h1 className="text-2xl md:text-3xl font-light text-white/90 tracking-wide mb-2">
                Cosmos Predictions
              </h1>
              <p className="text-sm text-white/50 max-w-md mx-auto">
                Vraag de sterren over jouw toekomst
              </p>
            </div>

            <div className="w-96 max-w-[90vw] space-y-3">
              <input
                type="text"
                value={question}
                onChange={(e) => setQuestion(e.target.value)}
                placeholder="Wat houdt de toekomst voor mij in?"
                className="w-full px-4 py-3 bg-black/20 backdrop-blur-lg border border-white/10 rounded-lg text-white text-sm placeholder:text-white/30 focus:outline-none focus:border-white/30 focus:bg-black/30 transition-all"
                autoFocus
              />
              
              <button
                type="submit"
                disabled={!question.trim()}
                className="w-full px-4 py-3 bg-white/5 backdrop-blur-lg border border-white/15 rounded-lg text-white/90 text-sm font-light hover:bg-white/10 hover:border-white/25 transition-all disabled:opacity-30 disabled:cursor-not-allowed disabled:hover:bg-white/5"
              >
                Voorspel
              </button>
            </div>
          </form>
        </div>

        {/* Floating Info Labels */}
        <div className="absolute bottom-20 left-8 text-white/30 text-xs pointer-events-none">
          <div className="mb-1">Globular Cluster M13</div>
          <div className="text-white/20">15,000 sterren</div>
        </div>

        <div className="absolute top-8 right-8 text-white/30 text-xs text-right pointer-events-none">
          <div className="mb-1 flex items-center gap-2">
            <div className="w-1.5 h-1.5 rounded-full bg-blue-300/60 animate-pulse" />
            <span>AI Ready</span>
          </div>
          <div className="text-white/20">Claude 3.5</div>
        </div>

        <div className="absolute bottom-20 right-8 text-white/25 text-xs text-right pointer-events-none">
          <div>Auto-rotatie</div>
          <div className="text-white/15">0.0003 rad/frame</div>
        </div>
      </div>

      {/* Background instruction */}
      <div className="absolute bottom-8 left-1/2 -translate-x-1/2 text-white/20 text-xs text-center pointer-events-none z-10">
        <div>Scroll om in te zoomen • Sleep om te roteren</div>
      </div>
    </div>
  );
}
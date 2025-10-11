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
      60,
      window.innerWidth / window.innerHeight,
      0.1,
      2000
    );
    camera.position.set(0, 0, 80);
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
      if (Math.random() < 0.5) {
        // Dense core (50% of stars)
        radius = Math.pow(Math.random(), 1.2) * 15;
        density = 1.5;
      } else if (Math.random() < 0.8) {
        // Medium density zone (30% of stars)
        radius = 15 + Math.pow(Math.random(), 1.0) * 25;
        density = 1.0;
      } else {
        // Sparse outer halo (20% of stars)
        radius = 40 + Math.pow(Math.random(), 0.6) * 40;
        density = 0.8;
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
      const coreDistance = radius / 75;
      const baseSize = 1.0 + Math.random() * 2.5;
      const brightnessBoost = Math.max(0.5, 1.2 - coreDistance) * density;
      sizes.push(baseSize * brightnessBoost);
    }

    geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
    geometry.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3));
    geometry.setAttribute('size', new THREE.Float32BufferAttribute(sizes, 1));

    // Simple working material like the test
    const material = new THREE.PointsMaterial({
      color: 0xffffff,
      size: 3,
      sizeAttenuation: true,
      transparent: true,
      opacity: 0.8
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
      const zoomFactor = event.deltaY > 0 ? 1.05 : 0.95;
      camera.position.multiplyScalar(zoomFactor);
      camera.position.clampLength(20, 200);
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mousedown', handleMouseDown);
    window.addEventListener('mouseup', handleMouseUp);
    window.addEventListener('wheel', handleWheel);

    // Show form after 1 second
    setTimeout(() => setShowForm(true), 2000);

    // Animation loop
    function animate() {
      animationIdRef.current = requestAnimationFrame(animate);
      
      // Smooth rotation towards target
      starSystem.rotation.y += (targetRotationY - starSystem.rotation.y) * 0.05;
      starSystem.rotation.x += (targetRotationX - starSystem.rotation.x) * 0.05;
      
      // Gentle auto-rotation when not interacting
      if (!isMouseDown) {
        targetRotationY += 0.001;
      }
      
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
        {/* Minimal Question Input */}
        <div className="absolute bottom-20 left-1/2 -translate-x-1/2">
          <form onSubmit={handleSubmit} className="space-y-2">
            <div className="w-80 max-w-[85vw]">
              <input
                type="text"
                value={question}
                onChange={(e) => setQuestion(e.target.value)}
                placeholder="Vraag de cosmos over jouw toekomst..."
                className="w-full px-3 py-2 bg-black/15 backdrop-blur-md border border-white/5 rounded text-white text-sm placeholder:text-white/25 focus:outline-none focus:border-white/20 focus:bg-black/25 transition-all"
                autoFocus
              />
              
              <button
                type="submit"
                disabled={!question.trim()}
                className="w-full mt-2 px-3 py-2 bg-white/5 backdrop-blur-md border border-white/10 rounded text-white/80 text-xs font-light hover:bg-white/10 transition-all disabled:opacity-20 disabled:cursor-not-allowed"
              >
                Voorspel
              </button>
            </div>
          </form>
        </div>
      </div>

    </div>
  );
}
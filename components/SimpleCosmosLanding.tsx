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

    // Create stars
    const starCount = 8000;
    const geometry = new THREE.BufferGeometry();
    const positions: number[] = [];
    const colors: number[] = [];
    const sizes: number[] = [];

    // Generate star positions in spherical distribution
    for (let i = 0; i < starCount; i++) {
      // Clustered distribution
      const radius = 20 + Math.random() * 60;
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(2 * Math.random() - 1);
      
      const x = radius * Math.sin(phi) * Math.cos(theta);
      const y = radius * Math.sin(phi) * Math.sin(theta);
      const z = radius * Math.cos(phi);
      
      positions.push(x, y, z);

      // Star colors
      const temp = Math.random();
      if (temp < 0.7) {
        colors.push(0.9, 0.9, 1.0); // Blue-white
      } else if (temp < 0.9) {
        colors.push(1.0, 0.9, 0.7); // Yellow-white
      } else {
        colors.push(1.0, 0.7, 0.4); // Orange
      }

      sizes.push(0.5 + Math.random() * 2);
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

    // Show form after 1 second
    setTimeout(() => setShowForm(true), 1000);

    // Animation loop
    let time = 0;
    function animate() {
      animationIdRef.current = requestAnimationFrame(animate);
      time += 0.005;
      
      // Rotate stars slowly
      starSystem.rotation.y += 0.0003;
      starSystem.rotation.x += 0.0001;
      
      // Update shader time
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
      
      {/* Prediction Form */}
      <div 
        className={`absolute inset-0 flex items-center justify-center z-50 transition-all duration-2000 ${
          showForm ? 'opacity-100' : 'opacity-0 pointer-events-none'
        }`}
      >
        <div className="max-w-2xl w-full px-6">
          <form onSubmit={handleSubmit} className="space-y-8">
            <div className="text-center space-y-4">
              <div className="text-6xl mb-4">🌌</div>
              <h1 className="text-4xl md:text-6xl font-light text-white tracking-wide">
                Cosmos Predictions
              </h1>
              <p className="text-xl text-white/70 max-w-lg mx-auto leading-relaxed">
                Stel je vraag over de toekomst en ontvang AI-gegenereerde scenario's
              </p>
            </div>

            <div className="space-y-4">
              <input
                type="text"
                value={question}
                onChange={(e) => setQuestion(e.target.value)}
                placeholder="Bijv: Wat zijn de kansen dat ik binnen 6 maanden een nieuwe baan vind?"
                className="w-full px-8 py-5 bg-black/40 backdrop-blur-xl border border-white/20 rounded-2xl text-white placeholder:text-white/40 focus:outline-none focus:border-white/50 transition-colors text-lg"
                autoFocus
              />
              
              <button
                type="submit"
                disabled={!question.trim()}
                className="w-full px-8 py-5 bg-white/10 backdrop-blur-xl border border-white/30 rounded-2xl text-white font-light text-lg hover:bg-white/20 transition-all disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:bg-white/10"
              >
                ✨ Genereer Voorspellingen
              </button>
            </div>

            <p className="text-center text-sm text-white/50 leading-relaxed">
              AI genereert 3 scenario's: optimistisch, realistisch en pessimistisch
            </p>
          </form>
        </div>
      </div>

      {/* Cosmos Info */}
      <div className="absolute bottom-8 left-1/2 -translate-x-1/2 text-center text-white/60 pointer-events-none z-40">
        <div className="text-xs uppercase tracking-wider">8,000 stars</div>
        <div className="text-sm">Interactive Cosmos</div>
      </div>

      {/* Status indicator */}
      <div className="absolute top-6 right-6 bg-black/30 backdrop-blur-lg border border-white/10 rounded-lg px-4 py-2 text-white/50 text-xs flex items-center gap-2 pointer-events-none z-40">
        <div className="w-2 h-2 rounded-full bg-blue-400 animate-pulse" />
        <span>AI Ready</span>
      </div>
    </div>
  );
}
'use client';

import { useEffect, useRef } from 'react';
import * as THREE from 'three';

export default function CosmosBackground() {
  const containerRef = useRef<HTMLDivElement>(null);
  const animationIdRef = useRef<number | null>(null);

  useEffect(() => {
    if (!containerRef.current) return;

    // Three.js setup
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x000012);

    const camera = new THREE.PerspectiveCamera(
      45,
      window.innerWidth / window.innerHeight,
      0.1,
      1000
    );
    camera.position.set(0, 0, 120);

    const renderer = new THREE.WebGLRenderer({ 
      antialias: true,
      alpha: true
    });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    containerRef.current.appendChild(renderer.domElement);

    // Create globular cluster
    const starCount = 12000;
    const geometry = new THREE.BufferGeometry();
    const positions: number[] = [];
    const colors: number[] = [];
    const sizes: number[] = [];

    for (let i = 0; i < starCount; i++) {
      let radius, density;
      
      if (Math.random() < 0.3) {
        radius = Math.pow(Math.random(), 2) * 30;
        density = 1.0;
      } else if (Math.random() < 0.6) {
        radius = 30 + Math.pow(Math.random(), 1.5) * 40;
        density = 0.7;
      } else {
        radius = 70 + Math.pow(Math.random(), 0.8) * 50;
        density = 0.4;
      }
      
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(2 * Math.random() - 1);
      
      const x = radius * Math.sin(phi) * Math.cos(theta);
      const y = radius * Math.sin(phi) * Math.sin(theta);
      const z = radius * Math.cos(phi);
      
      positions.push(x, y, z);

      // Star colors
      const colorRandom = Math.random();
      let r, g, b;
      
      if (colorRandom < 0.02) {
        r = 0.6; g = 0.8; b = 1.0; // Blue
      } else if (colorRandom < 0.1) {
        r = 0.8; g = 0.9; b = 1.0; // Blue-white
      } else if (colorRandom < 0.3) {
        r = 1.0; g = 1.0; b = 1.0; // White
      } else if (colorRandom < 0.5) {
        r = 1.0; g = 0.95; b = 0.8; // Yellow-white
      } else if (colorRandom < 0.7) {
        r = 1.0; g = 0.85; b = 0.6; // Orange
      } else {
        r = 1.0; g = 0.7; b = 0.4; // Red
      }
      
      colors.push(r, g, b);

      const coreDistance = radius / 120;
      const baseSize = 0.3 + Math.random() * 1.2;
      const brightnessBoost = Math.max(0.3, 1 - coreDistance) * density;
      sizes.push(baseSize * brightnessBoost);
    }

    geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
    geometry.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3));
    geometry.setAttribute('size', new THREE.Float32BufferAttribute(sizes, 1));

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
          
          float pulse = 1.0 + 0.05 * sin(time + position.x * 0.01);
          gl_PointSize = size * pulse * 120.0 * (300.0 / -mvPosition.z);
          gl_Position = projectionMatrix * mvPosition;
        }
      `,
      fragmentShader: `
        varying vec3 vColor;
        
        void main() {
          float dist = length(gl_PointCoord - vec2(0.5));
          if (dist > 0.5) discard;
          
          float alpha = 1.0 - smoothstep(0.0, 0.5, dist);
          gl_FragColor = vec4(vColor, alpha * 0.6);
        }
      `,
      transparent: true,
      vertexColors: true,
      blending: THREE.AdditiveBlending,
      depthWrite: false
    });

    const starSystem = new THREE.Points(geometry, material);
    scene.add(starSystem);

    // Animation loop
    let time = 0;
    function animate() {
      animationIdRef.current = requestAnimationFrame(animate);
      time += 0.004;
      
      starSystem.rotation.y += 0.0002;
      starSystem.rotation.x += 0.00005;
      
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

  return <div ref={containerRef} className="absolute inset-0" />;
}
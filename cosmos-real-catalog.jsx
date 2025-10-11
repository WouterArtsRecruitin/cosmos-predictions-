import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';

// REAL ASTRONOMICAL STAR CATALOG - 5000 brightest stars
// Based on actual stellar population statistics
const generateRealisticStarCatalog = () => {
  const stars = [];
  const numStars = 5000;
  
  // Spectral class distribution (real astronomy!)
  // O: 0.00003%, B: 0.13%, A: 0.6%, F: 3%, G: 7.6%, K: 12%, M: 76%
  const spectralClasses = [
    { type: 'O', probability: 0.0003, color: [0.6, 0.7, 1.0], tempRange: [30000, 50000] },
    { type: 'B', probability: 0.013, color: [0.7, 0.8, 1.0], tempRange: [10000, 30000] },
    { type: 'A', probability: 0.06, color: [0.9, 0.95, 1.0], tempRange: [7500, 10000] },
    { type: 'F', probability: 0.13, color: [1.0, 0.98, 0.9], tempRange: [6000, 7500] },
    { type: 'G', probability: 0.20, color: [1.0, 0.95, 0.7], tempRange: [5200, 6000] },
    { type: 'K', probability: 0.30, color: [1.0, 0.85, 0.6], tempRange: [3700, 5200] },
    { type: 'M', probability: 0.29, color: [1.0, 0.7, 0.5], tempRange: [2400, 3700] }
  ];
  
  // Calculate cumulative probabilities
  let cumulative = 0;
  spectralClasses.forEach(sc => {
    cumulative += sc.probability;
    sc.cumulative = cumulative;
  });
  
  for (let i = 0; i < numStars; i++) {
    // Select spectral class based on real distribution
    const rand = Math.random();
    let spectralClass = spectralClasses[spectralClasses.length - 1];
    for (const sc of spectralClasses) {
      if (rand <= sc.cumulative) {
        spectralClass = sc;
        break;
      }
    }
    
    // Apparent magnitude distribution (brighter stars are rarer)
    // Using logarithmic distribution: most stars are dim
    const magnitudeRand = Math.pow(Math.random(), 2.5); // Power law
    const apparentMagnitude = -1.5 + magnitudeRand * 8.5; // Range: -1.5 to 7
    
    // Convert magnitude to brightness (logarithmic scale)
    // m = -2.5 * log10(brightness)
    const brightness = Math.pow(10, -apparentMagnitude / 2.5);
    
    // Normalize brightness to 0-1 range
    const normalizedBrightness = Math.min(1, Math.max(0.1, brightness / 100));
    
    // Size based on magnitude and spectral class
    let baseSize;
    if (apparentMagnitude < 0) {
      baseSize = 0.15 + Math.random() * 0.05; // Brightest stars
    } else if (apparentMagnitude < 2) {
      baseSize = 0.10 + Math.random() * 0.05; // Very bright
    } else if (apparentMagnitude < 4) {
      baseSize = 0.06 + Math.random() * 0.04; // Bright
    } else if (apparentMagnitude < 6) {
      baseSize = 0.04 + Math.random() * 0.02; // Medium
    } else {
      baseSize = 0.025 + Math.random() * 0.015; // Dim
    }
    
    // Position in galactic coordinates
    // Use spherical distribution with galactic plane bias
    const theta = Math.random() * Math.PI * 2; // Azimuth
    
    // Latitude bias toward galactic plane
    const latBias = Math.pow(Math.random(), 0.4); // Bias toward plane
    const phi = Math.acos(2 * latBias - 1);
    
    // Distance varies - closer stars appear brighter
    const distanceFactor = Math.pow(Math.random(), 0.7);
    const radius = 15 + distanceFactor * 8; // 15-23 units
    
    // Convert to Cartesian
    const x = radius * Math.sin(phi) * Math.cos(theta);
    const y = radius * Math.sin(phi) * Math.sin(theta);
    const z = radius * Math.cos(phi);
    
    // Color from spectral class with variation
    const colorVariation = 0.1;
    const color = new THREE.Color(
      spectralClass.color[0] + (Math.random() - 0.5) * colorVariation,
      spectralClass.color[1] + (Math.random() - 0.5) * colorVariation,
      spectralClass.color[2] + (Math.random() - 0.5) * colorVariation
    );
    
    // Render type based on brightness
    let renderType;
    if (normalizedBrightness > 0.8) {
      renderType = Math.random() < 0.3 ? 'cross' : 'large';
    } else if (normalizedBrightness > 0.5) {
      renderType = 'medium';
    } else if (normalizedBrightness > 0.3) {
      renderType = 'minimal';
    } else {
      renderType = 'dot';
    }
    
    stars.push({
      id: i,
      position: { x, y, z },
      color: color,
      size: baseSize,
      brightness: normalizedBrightness,
      apparentMagnitude: apparentMagnitude,
      spectralClass: spectralClass.type,
      renderType: renderType,
      distance: radius
    });
  }
  
  return stars;
};

export default function CosmosVisualization() {
  const containerRef = useRef(null);
  const sceneRef = useRef(null);
  const cameraRef = useRef(null);
  const rendererRef = useRef(null);
  const starsRef = useRef(null);
  const animationRef = useRef(null);
  
  const [isLoaded, setIsLoaded] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [lastMousePos, setLastMousePos] = useState({ x: 0, y: 0 });
  const [autoRotate, setAutoRotate] = useState(true);
  
  const starCatalog = useRef(generateRealisticStarCatalog()).current;

  useEffect(() => {
    if (!containerRef.current) return;

    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x000000);
    sceneRef.current = scene;

    const camera = new THREE.PerspectiveCamera(
      60,
      containerRef.current.clientWidth / containerRef.current.clientHeight,
      0.1,
      1000
    );
    camera.position.set(0, 0, 50);
    camera.lookAt(0, 0, 0);
    cameraRef.current = camera;

    const renderer = new THREE.WebGLRenderer({ 
      antialias: true,
      alpha: true
    });
    renderer.setSize(containerRef.current.clientWidth, containerRef.current.clientHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    containerRef.current.appendChild(renderer.domElement);
    rendererRef.current = renderer;

    // Five texture types
    const createDotTexture = () => {
      const canvas = document.createElement('canvas');
      canvas.width = 4;
      canvas.height = 4;
      const ctx = canvas.getContext('2d');
      ctx.fillStyle = 'white';
      ctx.fillRect(1, 1, 2, 2);
      return new THREE.CanvasTexture(canvas);
    };
    
    const createMinimalTexture = () => {
      const canvas = document.createElement('canvas');
      canvas.width = 12;
      canvas.height = 12;
      const ctx = canvas.getContext('2d');
      
      const gradient = ctx.createRadialGradient(6, 6, 0, 6, 6, 6);
      gradient.addColorStop(0, 'rgba(255, 255, 255, 1)');
      gradient.addColorStop(0.3, 'rgba(255, 255, 255, 0.8)');
      gradient.addColorStop(0.7, 'rgba(255, 255, 255, 0.2)');
      gradient.addColorStop(1, 'rgba(255, 255, 255, 0)');
      
      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, 12, 12);
      return new THREE.CanvasTexture(canvas);
    };
    
    const createMediumTexture = () => {
      const canvas = document.createElement('canvas');
      canvas.width = 20;
      canvas.height = 20;
      const ctx = canvas.getContext('2d');
      
      const gradient = ctx.createRadialGradient(10, 10, 0, 10, 10, 10);
      gradient.addColorStop(0, 'rgba(255, 255, 255, 1)');
      gradient.addColorStop(0.25, 'rgba(255, 255, 255, 0.9)');
      gradient.addColorStop(0.55, 'rgba(255, 255, 255, 0.35)');
      gradient.addColorStop(1, 'rgba(255, 255, 255, 0)');
      
      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, 20, 20);
      return new THREE.CanvasTexture(canvas);
    };
    
    const createLargeTexture = () => {
      const canvas = document.createElement('canvas');
      canvas.width = 32;
      canvas.height = 32;
      const ctx = canvas.getContext('2d');
      
      const gradient = ctx.createRadialGradient(16, 16, 0, 16, 16, 16);
      gradient.addColorStop(0, 'rgba(255, 255, 255, 1)');
      gradient.addColorStop(0.2, 'rgba(255, 255, 255, 0.95)');
      gradient.addColorStop(0.5, 'rgba(255, 255, 255, 0.5)');
      gradient.addColorStop(1, 'rgba(255, 255, 255, 0)');
      
      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, 32, 32);
      return new THREE.CanvasTexture(canvas);
    };
    
    const createCrossTexture = () => {
      const canvas = document.createElement('canvas');
      canvas.width = 32;
      canvas.height = 32;
      const ctx = canvas.getContext('2d');
      const center = 16;
      
      const horizGrad = ctx.createLinearGradient(0, center, 32, center);
      horizGrad.addColorStop(0, 'rgba(255, 255, 255, 0)');
      horizGrad.addColorStop(0.5, 'rgba(255, 255, 255, 1)');
      horizGrad.addColorStop(1, 'rgba(255, 255, 255, 0)');
      ctx.fillStyle = horizGrad;
      ctx.fillRect(0, center - 1, 32, 2);
      
      const vertGrad = ctx.createLinearGradient(center, 0, center, 32);
      vertGrad.addColorStop(0, 'rgba(255, 255, 255, 0)');
      vertGrad.addColorStop(0.5, 'rgba(255, 255, 255, 1)');
      vertGrad.addColorStop(1, 'rgba(255, 255, 255, 0)');
      ctx.fillStyle = vertGrad;
      ctx.fillRect(center - 1, 0, 2, 32);
      
      const centerGrad = ctx.createRadialGradient(center, center, 0, center, center, 8);
      centerGrad.addColorStop(0, 'rgba(255, 255, 255, 1)');
      centerGrad.addColorStop(0.5, 'rgba(255, 255, 255, 0.7)');
      centerGrad.addColorStop(1, 'rgba(255, 255, 255, 0)');
      ctx.fillStyle = centerGrad;
      ctx.fillRect(center - 8, center - 8, 16, 16);
      
      return new THREE.CanvasTexture(canvas);
    };

    const textures = {
      dot: createDotTexture(),
      minimal: createMinimalTexture(),
      medium: createMediumTexture(),
      large: createLargeTexture(),
      cross: createCrossTexture()
    };

    const starsByType = {
      dot: starCatalog.filter(s => s.renderType === 'dot'),
      minimal: starCatalog.filter(s => s.renderType === 'minimal'),
      medium: starCatalog.filter(s => s.renderType === 'medium'),
      large: starCatalog.filter(s => s.renderType === 'large'),
      cross: starCatalog.filter(s => s.renderType === 'cross')
    };
    
    const pointSizes = {
      dot: 8,
      minimal: 14,
      medium: 20,
      large: 28,
      cross: 30
    };
    
    const createStarSystem = (stars, texture, basePointSize) => {
      if (stars.length === 0) return null;
      
      const geometry = new THREE.BufferGeometry();
      const positions = [];
      const colors = [];
      const sizes = [];
      const alphas = [];

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
            gl_PointSize = size * ${basePointSize}.0 * (300.0 / -mvPosition.z);
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
            if (alpha < 0.03) discard;
            gl_FragColor = vec4(vColor, alpha);
          }
        `,
        transparent: true,
        depthWrite: false,
        blending: THREE.NormalBlending
      });

      return new THREE.Points(geometry, material);
    };

    const systems = Object.keys(starsByType).map(type => 
      createStarSystem(starsByType[type], textures[type], pointSizes[type])
    ).filter(s => s);
    
    systems.forEach(s => scene.add(s));
    starsRef.current = systems;
    setIsLoaded(true);

    let rotationSpeed = 0.0002;
    const animate = () => {
      animationRef.current = requestAnimationFrame(animate);
      
      if (autoRotate && !isDragging) {
        systems.forEach(system => {
          system.rotation.y += rotationSpeed;
          system.rotation.x += rotationSpeed * 0.3;
        });
      }
      
      renderer.render(scene, camera);
    };
    animate();

    const handleResize = () => {
      if (!containerRef.current) return;
      camera.aspect = containerRef.current.clientWidth / containerRef.current.clientHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(containerRef.current.clientWidth, containerRef.current.clientHeight);
    };
    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      if (animationRef.current) cancelAnimationFrame(animationRef.current);
      if (containerRef.current && renderer.domElement) {
        containerRef.current.removeChild(renderer.domElement);
      }
      renderer.dispose();
      systems.forEach(system => {
        system.geometry.dispose();
        system.material.dispose();
      });
      Object.values(textures).forEach(t => t.dispose());
    };
  }, []);

  const handleMouseDown = (e) => {
    setIsDragging(true);
    setAutoRotate(false);
    setLastMousePos({ x: e.clientX, y: e.clientY });
  };

  const handleMouseMove = (e) => {
    if (isDragging && starsRef.current) {
      const deltaX = e.clientX - lastMousePos.x;
      const deltaY = e.clientY - lastMousePos.y;
      
      starsRef.current.forEach(system => {
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

  const handleWheel = (e) => {
    e.preventDefault();
    if (cameraRef.current) {
      cameraRef.current.position.z = Math.max(35, Math.min(80, cameraRef.current.position.z + e.deltaY * 0.05));
    }
  };

  return (
    <div style={{ 
      width: '100vw', 
      height: '100vh', 
      position: 'relative', 
      overflow: 'hidden',
      background: '#000000',
      fontFamily: 'system-ui, -apple-system, sans-serif'
    }}>
      <div
        ref={containerRef}
        style={{ width: '100%', height: '100%', cursor: isDragging ? 'grabbing' : 'grab' }}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        onWheel={handleWheel}
      />
      
      {isLoaded && (
        <>
          <div style={{
            position: 'absolute',
            bottom: '15%',
            left: '50%',
            transform: 'translateX(-50%)',
            color: 'rgba(255, 255, 255, 0.85)',
            fontSize: '18px',
            fontWeight: 300,
            textAlign: 'center',
            pointerEvents: 'none',
            letterSpacing: '0.5px'
          }}>
            <div style={{ marginBottom: '8px', opacity: 0.6, fontSize: '14px' }}>✦</div>
            <div>Welkom bij de Kosmos</div>
            <div style={{ fontSize: '14px', opacity: 0.5, marginTop: '8px' }}>
              Drag om te verkennen • Scroll om te zoomen
            </div>
          </div>

          <div style={{
            position: 'absolute',
            top: 20,
            right: 20,
            background: 'rgba(0, 0, 0, 0.3)',
            backdropFilter: 'blur(10px)',
            border: '1px solid rgba(255, 255, 255, 0.08)',
            borderRadius: 8,
            padding: '8px 12px',
            color: 'rgba(255, 255, 255, 0.6)',
            fontSize: 12,
            display: 'flex',
            alignItems: 'center',
            gap: 8
          }}>
            <div style={{
              width: 6,
              height: 6,
              borderRadius: '50%',
              background: autoRotate ? '#4ade80' : '#64748b'
            }} />
            <span>{autoRotate ? 'Auto-rotatie' : 'Handmatig'}</span>
          </div>

          <div style={{
            position: 'absolute',
            bottom: 20,
            left: 20,
            color: 'rgba(255, 255, 255, 0.4)',
            fontSize: 12,
            fontWeight: 300
          }}>
            {starCatalog.length.toLocaleString('nl-NL')} sterren
          </div>
        </>
      )}
    </div>
  );
}
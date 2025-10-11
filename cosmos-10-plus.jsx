import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';

// Fibonacci sphere algorithm
const fibonacciSphere = (samples, radius) => {
  const points = [];
  const phi = Math.PI * (3 - Math.sqrt(5));
  
  for (let i = 0; i < samples; i++) {
    const y = 1 - (i / (samples - 1)) * 2;
    const radiusAtY = Math.sqrt(1 - y * y);
    const theta = phi * i;
    
    const x = Math.cos(theta) * radiusAtY;
    const z = Math.sin(theta) * radiusAtY;
    
    const jitter = 0.05;
    const finalRadius = radius * (1 + (Math.random() - 0.5) * jitter);
    
    points.push({
      x: x * finalRadius,
      y: y * finalRadius,
      z: z * finalRadius
    });
  }
  
  return points;
};

// POWER LAW distribution - BALANCED for visibility
const generateStarCatalog = () => {
  const stars = [];
  const baseRadius = 18;
  const positions = fibonacciSphere(1700, baseRadius); // Slightly less for cleaner look
  
  positions.forEach((pos) => {
    const distance = Math.sqrt(pos.x ** 2 + pos.y ** 2 + pos.z ** 2);
    
    // BALANCED POWER LAW: 90% tiny (but visible!), 8% medium, 2% bright
    const random = Math.random();
    const powerLaw = Math.pow(random, 2.5); // Less extreme than before
    
    let size, starType, shapeType;
    
    if (powerLaw < 0.90) {
      // 90% TINY but VISIBLE (2-3px when rendered)
      size = 0.05 + Math.random() * 0.03; // 0.05-0.08 (DOUBLED from v5!)
      starType = 'tiny';
      shapeType = 'dot';
    } else if (powerLaw < 0.98) {
      // 8% MEDIUM (3-5px)
      size = 0.08 + Math.random() * 0.02; // 0.08-0.10
      starType = 'medium';
      shapeType = 'dot';
    } else {
      // 2% BRIGHT (6-10px) - MIXED SHAPES
      size = 0.10 + Math.random() * 0.04; // 0.10-0.14
      starType = 'bright';
      shapeType = Math.random() < 0.6 ? 'round' : 'cross';
    }
    
    // Colors - high saturation
    const temp = Math.random();
    let color;
    
    if (temp < 0.05) {
      color = new THREE.Color(0.6, 0.7, 1.0); // Blue
    } else if (temp < 0.15) {
      color = new THREE.Color(0.75, 0.82, 1.0); // Blue-white
    } else if (temp < 0.70) {
      color = new THREE.Color(0.98, 0.98, 1.0); // White
    } else if (temp < 0.85) {
      color = new THREE.Color(1.0, 0.95, 0.85); // Warm white
    } else {
      color = new THREE.Color(1.0, 0.88, 0.70); // Orange
    }
    
    // Brightness with good visibility
    const centerDistance = distance / baseRadius;
    let brightness = 0.35 + (1 - centerDistance) * 0.45; // 0.35-0.80
    
    if (starType === 'bright') {
      brightness = Math.min(0.85, brightness * 1.1);
    } else if (starType === 'tiny') {
      brightness *= 0.9; // Only slight dimming
    }
    
    stars.push({
      position: pos,
      color: color,
      size: size,
      brightness: Math.min(0.85, brightness),
      starType: starType,
      shapeType: shapeType
    });
  });
  
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
  
  const starCatalog = useRef(generateStarCatalog()).current;

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

    // FOUR texture types - BALANCED SIZES
    
    // TINY: 6x6px solid dot with slight glow - VISIBLE
    const createTinyTexture = () => {
      const canvas = document.createElement('canvas');
      canvas.width = 6;
      canvas.height = 6;
      const ctx = canvas.getContext('2d');
      
      const gradient = ctx.createRadialGradient(3, 3, 0, 3, 3, 3);
      gradient.addColorStop(0, 'rgba(255, 255, 255, 1)');
      gradient.addColorStop(0.6, 'rgba(255, 255, 255, 0.8)');
      gradient.addColorStop(1, 'rgba(255, 255, 255, 0)');
      
      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, 6, 6);
      return new THREE.CanvasTexture(canvas);
    };
    
    // MEDIUM: 12x12px minimal glow
    const createMediumTexture = () => {
      const canvas = document.createElement('canvas');
      canvas.width = 12;
      canvas.height = 12;
      const ctx = canvas.getContext('2d');
      
      const gradient = ctx.createRadialGradient(6, 6, 0, 6, 6, 6);
      gradient.addColorStop(0, 'rgba(255, 255, 255, 1)');
      gradient.addColorStop(0.4, 'rgba(255, 255, 255, 0.9)');
      gradient.addColorStop(0.7, 'rgba(255, 255, 255, 0.3)');
      gradient.addColorStop(1, 'rgba(255, 255, 255, 0)');
      
      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, 12, 12);
      return new THREE.CanvasTexture(canvas);
    };
    
    // BRIGHT ROUND: 24x24px tight glow
    const createBrightRoundTexture = () => {
      const canvas = document.createElement('canvas');
      canvas.width = 24;
      canvas.height = 24;
      const ctx = canvas.getContext('2d');
      
      const gradient = ctx.createRadialGradient(12, 12, 0, 12, 12, 12);
      gradient.addColorStop(0, 'rgba(255, 255, 255, 1)');
      gradient.addColorStop(0.3, 'rgba(255, 255, 255, 0.9)');
      gradient.addColorStop(0.6, 'rgba(255, 255, 255, 0.3)');
      gradient.addColorStop(1, 'rgba(255, 255, 255, 0)');
      
      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, 24, 24);
      return new THREE.CanvasTexture(canvas);
    };
    
    // BRIGHT CROSS: 24x24px cross shape
    const createBrightCrossTexture = () => {
      const canvas = document.createElement('canvas');
      canvas.width = 24;
      canvas.height = 24;
      const ctx = canvas.getContext('2d');
      const center = 12;
      
      // Horizontal beam
      const horizGrad = ctx.createLinearGradient(0, center, 24, center);
      horizGrad.addColorStop(0, 'rgba(255, 255, 255, 0)');
      horizGrad.addColorStop(0.5, 'rgba(255, 255, 255, 1)');
      horizGrad.addColorStop(1, 'rgba(255, 255, 255, 0)');
      ctx.fillStyle = horizGrad;
      ctx.fillRect(0, center - 1, 24, 2);
      
      // Vertical beam
      const vertGrad = ctx.createLinearGradient(center, 0, center, 24);
      vertGrad.addColorStop(0, 'rgba(255, 255, 255, 0)');
      vertGrad.addColorStop(0.5, 'rgba(255, 255, 255, 1)');
      vertGrad.addColorStop(1, 'rgba(255, 255, 255, 0)');
      ctx.fillStyle = vertGrad;
      ctx.fillRect(center - 1, 0, 2, 24);
      
      // Center glow
      const centerGrad = ctx.createRadialGradient(center, center, 0, center, center, 6);
      centerGrad.addColorStop(0, 'rgba(255, 255, 255, 1)');
      centerGrad.addColorStop(0.6, 'rgba(255, 255, 255, 0.5)');
      centerGrad.addColorStop(1, 'rgba(255, 255, 255, 0)');
      ctx.fillStyle = centerGrad;
      ctx.fillRect(center - 6, center - 6, 12, 12);
      
      return new THREE.CanvasTexture(canvas);
    };

    const tinyTexture = createTinyTexture();
    const mediumTexture = createMediumTexture();
    const brightRoundTexture = createBrightRoundTexture();
    const brightCrossTexture = createBrightCrossTexture();

    // Separate stars by type
    const tinyStars = starCatalog.filter(s => s.starType === 'tiny');
    const mediumStars = starCatalog.filter(s => s.starType === 'medium');
    const brightRoundStars = starCatalog.filter(s => s.starType === 'bright' && s.shapeType === 'round');
    const brightCrossStars = starCatalog.filter(s => s.starType === 'bright' && s.shapeType === 'cross');
    
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
            if (alpha < 0.12) discard; // Balanced cutoff
            gl_FragColor = vec4(vColor, alpha);
          }
        `,
        transparent: true,
        depthWrite: false,
        blending: THREE.NormalBlending
      });

      return new THREE.Points(geometry, material);
    };

    // Create four systems with BALANCED point sizes
    const tinySystem = createStarSystem(tinyStars, tinyTexture, 14); // Small but visible
    const mediumSystem = createStarSystem(mediumStars, mediumTexture, 20); // Medium
    const brightRoundSystem = createStarSystem(brightRoundStars, brightRoundTexture, 30); // Bright round
    const brightCrossSystem = createStarSystem(brightCrossStars, brightCrossTexture, 30); // Bright cross

    const systems = [tinySystem, mediumSystem, brightRoundSystem, brightCrossSystem].filter(s => s);
    systems.forEach(s => scene.add(s));
    
    starsRef.current = systems;
    setIsLoaded(true);

    // Animation
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
      [tinyTexture, mediumTexture, brightRoundTexture, brightCrossTexture].forEach(t => t.dispose());
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
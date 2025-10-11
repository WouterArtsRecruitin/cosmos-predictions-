import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';

// Fibonacci sphere algorithm for uniform spherical distribution
const fibonacciSphere = (samples, radius) => {
  const points = [];
  const phi = Math.PI * (3 - Math.sqrt(5)); // Golden angle
  
  for (let i = 0; i < samples; i++) {
    const y = 1 - (i / (samples - 1)) * 2; // y goes from 1 to -1
    const radiusAtY = Math.sqrt(1 - y * y);
    const theta = phi * i;
    
    const x = Math.cos(theta) * radiusAtY;
    const z = Math.sin(theta) * radiusAtY;
    
    // Minimal jitter for natural look (5% instead of 10%)
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

// Generate star catalog - SIMPLIFIED, NO CLUSTERS
const generateStarCatalog = () => {
  const stars = [];
  const baseRadius = 18;
  
  // Pure spherical distribution - NO CLUSTERS
  const positions = fibonacciSphere(1500, baseRadius);
  
  // Assign properties to each star
  positions.forEach((pos, i) => {
    const distance = Math.sqrt(pos.x ** 2 + pos.y ** 2 + pos.z ** 2);
    
    // POWER LAW SIZE DISTRIBUTION for more extreme variation
    const random = Math.random();
    const powerLaw = Math.pow(random, 2.5); // Power law for realistic distribution
    
    let size, starType, shapeType;
    
    if (powerLaw < 0.92) {
      // 92% tiny stars
      size = 0.04 + Math.random() * 0.04; // 0.04-0.08 (slightly smaller)
      starType = 'tiny';
      shapeType = 'dot';
    } else if (powerLaw < 0.99) {
      // 7% medium stars
      size = 0.08 + Math.random() * 0.04; // 0.08-0.12
      starType = 'medium';
      shapeType = 'dot';
    } else {
      // 1% highlight stars with MIXED SHAPES
      size = 0.12 + Math.random() * 0.04; // 0.12-0.16
      starType = 'highlight';
      // 65% round, 35% cross
      shapeType = Math.random() < 0.65 ? 'round' : 'cross';
    }
    
    // Color temperature distribution - MORE SATURATED for pop
    const temp = Math.random();
    let color;
    
    if (temp < 0.05) {
      // Blue (rare, more saturated)
      color = new THREE.Color(0.65, 0.75, 0.95); // More blue pop
    } else if (temp < 0.15) {
      // Blue-white (more saturated)
      color = new THREE.Color(0.80, 0.85, 0.98);
    } else if (temp < 0.70) {
      // White (dominant, crisp white)
      color = new THREE.Color(0.92, 0.92, 0.95); // Brighter whites
    } else if (temp < 0.85) {
      // Warm white
      color = new THREE.Color(0.95, 0.90, 0.82);
    } else {
      // Orange (more saturated)
      color = new THREE.Color(0.98, 0.85, 0.70); // More orange pop
    }
    
    // Brightness: BALANCED with highlight boost
    const centerDistance = distance / baseRadius; // 0 = center, 1 = edge
    let brightness = 0.35 + (1 - centerDistance) * 0.45; // Range: 0.35-0.80
    
    // Adjust brightness by star type
    if (starType === 'highlight') {
      brightness = Math.min(0.85, brightness * 1.15); // Boost highlights
    } else if (starType === 'tiny') {
      brightness *= 0.9; // Slightly dim tiny stars
    }
    
    const finalBrightness = Math.min(0.85, brightness);
    
    stars.push({
      position: pos,
      color: color,
      size: size,
      brightness: finalBrightness,
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

    // Scene setup
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x000000);
    sceneRef.current = scene;

    // Camera setup
    const camera = new THREE.PerspectiveCamera(
      60,
      containerRef.current.clientWidth / containerRef.current.clientHeight,
      0.1,
      1000
    );
    camera.position.set(0, 0, 50);
    camera.lookAt(0, 0, 0);
    cameraRef.current = camera;

    // Renderer setup
    const renderer = new THREE.WebGLRenderer({ 
      antialias: true,
      alpha: true
    });
    renderer.setSize(containerRef.current.clientWidth, containerRef.current.clientHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    containerRef.current.appendChild(renderer.domElement);
    rendererRef.current = renderer;

    // Create SHARPER sprite textures
    
    // DOT texture for tiny/medium stars - sharper gradient
    const createDotTexture = () => {
      const canvas = document.createElement('canvas');
      canvas.width = 24;
      canvas.height = 24;
      const ctx = canvas.getContext('2d');
      
      const gradient = ctx.createRadialGradient(12, 12, 0, 12, 12, 12);
      gradient.addColorStop(0, 'rgba(255, 255, 255, 1)');
      gradient.addColorStop(0.20, 'rgba(255, 255, 255, 0.9)'); // Tighter
      gradient.addColorStop(0.45, 'rgba(255, 255, 255, 0.3)'); // Faster falloff
      gradient.addColorStop(1, 'rgba(255, 255, 255, 0)');
      
      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, 24, 24);
      
      return new THREE.CanvasTexture(canvas);
    };
    
    // ROUND GLOW texture for highlight rounds
    const createRoundHighlightTexture = () => {
      const canvas = document.createElement('canvas');
      canvas.width = 32;
      canvas.height = 32;
      const ctx = canvas.getContext('2d');
      
      const gradient = ctx.createRadialGradient(16, 16, 0, 16, 16, 16);
      gradient.addColorStop(0, 'rgba(255, 255, 255, 1)');
      gradient.addColorStop(0.25, 'rgba(255, 255, 255, 0.95)');
      gradient.addColorStop(0.50, 'rgba(255, 255, 255, 0.4)');
      gradient.addColorStop(1, 'rgba(255, 255, 255, 0)');
      
      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, 32, 32);
      
      return new THREE.CanvasTexture(canvas);
    };
    
    // CROSS texture for highlight crosses
    const createCrossTexture = () => {
      const canvas = document.createElement('canvas');
      canvas.width = 32;
      canvas.height = 32;
      const ctx = canvas.getContext('2d');
      const center = 16;
      
      // Horizontal beam
      const horizGrad = ctx.createLinearGradient(0, center, 32, center);
      horizGrad.addColorStop(0, 'rgba(255, 255, 255, 0)');
      horizGrad.addColorStop(0.5, 'rgba(255, 255, 255, 1)');
      horizGrad.addColorStop(1, 'rgba(255, 255, 255, 0)');
      ctx.fillStyle = horizGrad;
      ctx.fillRect(0, center - 1, 32, 2);
      
      // Vertical beam
      const vertGrad = ctx.createLinearGradient(center, 0, center, 32);
      vertGrad.addColorStop(0, 'rgba(255, 255, 255, 0)');
      vertGrad.addColorStop(0.5, 'rgba(255, 255, 255, 1)');
      vertGrad.addColorStop(1, 'rgba(255, 255, 255, 0)');
      ctx.fillStyle = vertGrad;
      ctx.fillRect(center - 1, 0, 2, 32);
      
      // Center glow
      const centerGrad = ctx.createRadialGradient(center, center, 0, center, center, 8);
      centerGrad.addColorStop(0, 'rgba(255, 255, 255, 1)');
      centerGrad.addColorStop(0.5, 'rgba(255, 255, 255, 0.6)');
      centerGrad.addColorStop(1, 'rgba(255, 255, 255, 0)');
      ctx.fillStyle = centerGrad;
      ctx.fillRect(center - 8, center - 8, 16, 16);
      
      return new THREE.CanvasTexture(canvas);
    };

    const dotTexture = createDotTexture();
    const roundHighlightTexture = createRoundHighlightTexture();
    const crossTexture = createCrossTexture();

    // Separate stars by shape type
    const dotStars = starCatalog.filter(s => s.shapeType === 'dot');
    const roundHighlightStars = starCatalog.filter(s => s.shapeType === 'round');
    const crossHighlightStars = starCatalog.filter(s => s.shapeType === 'cross');
    
    const createStarSystem = (stars, texture, basePointSize) => {
      if (stars.length === 0) return null;
      
      const starGeometry = new THREE.BufferGeometry();
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

      starGeometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
      starGeometry.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3));
      starGeometry.setAttribute('size', new THREE.Float32BufferAttribute(sizes, 1));
      starGeometry.setAttribute('alpha', new THREE.Float32BufferAttribute(alphas, 1));

      // SHARP shader material
      const starMaterial = new THREE.ShaderMaterial({
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
            
            // Point size calibrated per system
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
            
            // Balanced alpha cutoff
            float alpha = texColor.a * vAlpha;
            if (alpha < 0.05) discard;
            
            gl_FragColor = vec4(vColor, alpha);
          }
        `,
        transparent: true,
        depthWrite: false,
        blending: THREE.NormalBlending
      });

      return new THREE.Points(starGeometry, starMaterial);
    };

    // Create three systems with different point sizes
    const dotSystem = createStarSystem(dotStars, dotTexture, 20); // Tiny/medium dots
    const roundSystem = createStarSystem(roundHighlightStars, roundHighlightTexture, 28); // Round highlights
    const crossSystem = createStarSystem(crossHighlightStars, crossTexture, 28); // Cross highlights

    const starSystems = [dotSystem, roundSystem, crossSystem].filter(s => s);
    starSystems.forEach(system => scene.add(system));
    starsRef.current = starSystems;

    setIsLoaded(true);

    // Animation loop
    let rotationSpeed = 0.0002; // Slower rotation
    const animate = () => {
      animationRef.current = requestAnimationFrame(animate);
      
      if (autoRotate && !isDragging && starsRef.current) {
        starsRef.current.forEach(system => {
          system.rotation.y += rotationSpeed;
          system.rotation.x += rotationSpeed * 0.3;
        });
      }
      
      renderer.render(scene, camera);
    };
    animate();

    // Handle window resize
    const handleResize = () => {
      if (!containerRef.current) return;
      
      camera.aspect = containerRef.current.clientWidth / containerRef.current.clientHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(containerRef.current.clientWidth, containerRef.current.clientHeight);
    };
    window.addEventListener('resize', handleResize);

    // Cleanup
    return () => {
      window.removeEventListener('resize', handleResize);
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
      if (containerRef.current && renderer.domElement) {
        containerRef.current.removeChild(renderer.domElement);
      }
      renderer.dispose();
      starSystems.forEach(system => {
        system.geometry.dispose();
        system.material.dispose();
      });
      dotTexture.dispose();
      roundHighlightTexture.dispose();
      crossTexture.dispose();
    };
  }, []);

  // Mouse interaction for manual rotation
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
        style={{ 
          width: '100%', 
          height: '100%',
          cursor: isDragging ? 'grabbing' : 'grab'
        }}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        onWheel={handleWheel}
      />
      
      {/* Minimalist welcome message */}
      {isLoaded && (
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
          fontFamily: 'system-ui, -apple-system, sans-serif',
          letterSpacing: '0.5px'
        }}>
          <div style={{ marginBottom: '8px', opacity: 0.6, fontSize: '14px' }}>✦</div>
          <div>Welkom bij de Kosmos</div>
          <div style={{ fontSize: '14px', opacity: 0.5, marginTop: '8px' }}>
            Drag om te verkennen • Scroll om te zoomen
          </div>
        </div>
      )}

      {/* Minimal controls indicator */}
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

      {/* Star count */}
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
    </div>
  );
}
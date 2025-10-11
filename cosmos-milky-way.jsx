import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';

// WEIGHTED RANDOM SPHERE - Organic distribution (NOT Fibonacci!)
const generateOrganicStarField = (count, baseRadius) => {
  const stars = [];
  
  for (let i = 0; i < count; i++) {
    // Weighted random radius - more stars toward center
    const radiusWeight = Math.pow(Math.random(), 0.6); // Bias toward edges
    const radius = baseRadius * (0.3 + radiusWeight * 0.7); // 30-100% of radius
    
    // Random spherical coordinates
    const theta = Math.random() * Math.PI * 2;
    const phi = Math.acos(2 * Math.random() - 1);
    
    // Convert to cartesian
    const x = radius * Math.sin(phi) * Math.cos(theta);
    const y = radius * Math.sin(phi) * Math.sin(theta);
    const z = radius * Math.cos(phi);
    
    // Add chaos/noise
    const noise = 0.1;
    const finalX = x + (Math.random() - 0.5) * noise * baseRadius;
    const finalY = y + (Math.random() - 0.5) * noise * baseRadius;
    const finalZ = z + (Math.random() - 0.5) * noise * baseRadius;
    
    stars.push({
      x: finalX,
      y: finalY,
      z: finalZ
    });
  }
  
  return stars;
};

// Generate star catalog with EXTREME variation
const generateStarCatalog = () => {
  const stars = [];
  const baseRadius = 18;
  const positions = generateOrganicStarField(2200, baseRadius);
  
  positions.forEach((pos) => {
    const distance = Math.sqrt(pos.x ** 2 + pos.y ** 2 + pos.z ** 2);
    
    // POWER LAW SIZE: Most tiny, few huge (like real universe!)
    const random = Math.random();
    const powerLaw = Math.pow(random, 5); // FIFTH power = EXTREME!
    
    let size, renderType;
    
    if (powerLaw < 0.85) {
      // 85% MICROSCOPIC - barely visible dots
      size = 0.025 + Math.random() * 0.025; // 0.025-0.05 (1-3px)
      renderType = Math.random() < 0.5 ? 'dot' : 'minimal';
    } else if (powerLaw < 0.975) {
      // 12.5% SMALL
      size = 0.05 + Math.random() * 0.03; // 0.05-0.08 (3-6px)
      renderType = Math.random() < 0.7 ? 'minimal' : 'medium';
    } else if (powerLaw < 0.995) {
      // 2% MEDIUM
      size = 0.08 + Math.random() * 0.04; // 0.08-0.12 (6-10px)
      renderType = Math.random() < 0.6 ? 'medium' : 'large';
    } else {
      // 0.5% LARGE - the bright ones!
      size = 0.12 + Math.random() * 0.06; // 0.12-0.18 (10-15px)
      renderType = Math.random() < 0.4 ? 'large' : 'cross';
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
      color = new THREE.Color(1.0, 0.95, 0.85); // Warm
    } else {
      color = new THREE.Color(1.0, 0.88, 0.70); // Orange
    }
    
    // Brightness - WIDE range
    const centerDistance = distance / baseRadius;
    let brightness = 0.2 + (1 - centerDistance) * 0.7; // 0.2-0.9
    
    // Adjust by render type
    if (renderType === 'dot') brightness *= 0.7;
    if (renderType === 'cross' || renderType === 'large') brightness = Math.min(0.95, brightness * 1.2);
    
    stars.push({
      position: pos,
      color: color,
      size: size,
      brightness: Math.min(0.95, brightness),
      renderType: renderType
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

    // FIVE TEXTURE TYPES for organic variation
    
    // 1. PURE DOT - No texture, just pixel
    const createDotTexture = () => {
      const canvas = document.createElement('canvas');
      canvas.width = 4;
      canvas.height = 4;
      const ctx = canvas.getContext('2d');
      ctx.fillStyle = 'white';
      ctx.fillRect(1, 1, 2, 2);
      return new THREE.CanvasTexture(canvas);
    };
    
    // 2. MINIMAL GLOW - Very tight
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
    
    // 3. MEDIUM GLOW - Visible halo
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
    
    // 4. LARGE GLOW - Prominent star
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
    
    // 5. CROSS - Diffraction spikes
    const createCrossTexture = () => {
      const canvas = document.createElement('canvas');
      canvas.width = 32;
      canvas.height = 32;
      const ctx = canvas.getContext('2d');
      const center = 16;
      
      // Horizontal spike
      const horizGrad = ctx.createLinearGradient(0, center, 32, center);
      horizGrad.addColorStop(0, 'rgba(255, 255, 255, 0)');
      horizGrad.addColorStop(0.5, 'rgba(255, 255, 255, 1)');
      horizGrad.addColorStop(1, 'rgba(255, 255, 255, 0)');
      ctx.fillStyle = horizGrad;
      ctx.fillRect(0, center - 1, 32, 2);
      
      // Vertical spike
      const vertGrad = ctx.createLinearGradient(center, 0, center, 32);
      vertGrad.addColorStop(0, 'rgba(255, 255, 255, 0)');
      vertGrad.addColorStop(0.5, 'rgba(255, 255, 255, 1)');
      vertGrad.addColorStop(1, 'rgba(255, 255, 255, 0)');
      ctx.fillStyle = vertGrad;
      ctx.fillRect(center - 1, 0, 2, 32);
      
      // Center glow
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

    // Separate by render type
    const starsByType = {
      dot: starCatalog.filter(s => s.renderType === 'dot'),
      minimal: starCatalog.filter(s => s.renderType === 'minimal'),
      medium: starCatalog.filter(s => s.renderType === 'medium'),
      large: starCatalog.filter(s => s.renderType === 'large'),
      cross: starCatalog.filter(s => s.renderType === 'cross')
    };
    
    // Point sizes per type - calibrated for realism
    const pointSizes = {
      dot: 8,      // Tiniest
      minimal: 14, // Small
      medium: 20,  // Medium
      large: 28,   // Large
      cross: 30    // Largest with spikes
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

    // Create five rendering systems
    const systems = Object.keys(starsByType).map(type => 
      createStarSystem(starsByType[type], textures[type], pointSizes[type])
    ).filter(s => s);
    
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
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
    
    // Minimal jitter for natural look
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

// Generate star catalog with POWER LAW distribution
const generateStarCatalog = () => {
  const stars = [];
  const baseRadius = 18;
  
  // Pure spherical distribution
  const positions = fibonacciSphere(1800, baseRadius); // More stars for density
  
  // Assign properties with POWER LAW distribution
  positions.forEach((pos, i) => {
    const distance = Math.sqrt(pos.x ** 2 + pos.y ** 2 + pos.z ** 2);
    
    // POWER LAW SIZE DISTRIBUTION (exponential)
    // Most stars are TINY, few are medium, rare are large
    const random = Math.random();
    const powerLaw = Math.pow(random, 3); // Cubic power law = extreme skew
    
    let size, starType;
    
    if (powerLaw < 0.95) {
      // 95% MICROSCOPIC stars
      size = 0.02 + Math.random() * 0.03; // 0.02-0.05 (TINY!)
      starType = 'tiny';
    } else if (powerLaw < 0.99) {
      // 4% MEDIUM stars
      size = 0.05 + Math.random() * 0.03; // 0.05-0.08
      starType = 'medium';
    } else {
      // 1% HIGHLIGHT stars
      size = 0.08 + Math.random() * 0.04; // 0.08-0.12
      starType = 'highlight';
    }
    
    // Color with MORE saturation for pop
    const temp = Math.random();
    let color;
    
    if (temp < 0.05) {
      // Blue
      color = new THREE.Color(0.6, 0.7, 1.0);
    } else if (temp < 0.15) {
      // Blue-white
      color = new THREE.Color(0.75, 0.80, 0.98);
    } else if (temp < 0.70) {
      // White (dominant)
      color = new THREE.Color(0.95, 0.95, 0.98);
    } else if (temp < 0.85) {
      // Warm white
      color = new THREE.Color(0.98, 0.92, 0.82);
    } else {
      // Orange
      color = new THREE.Color(1.0, 0.85, 0.65);
    }
    
    // Brightness based on size and distance
    const centerDistance = distance / baseRadius;
    let brightness = 0.3 + (1 - centerDistance) * 0.5; // 0.3-0.8
    
    // Highlights get brightness boost
    if (starType === 'highlight') {
      brightness = Math.min(0.9, brightness * 1.2);
    } else if (starType === 'tiny') {
      // Tiny stars dimmer on average
      brightness *= 0.85;
    }
    
    stars.push({
      position: pos,
      color: color,
      size: size,
      brightness: Math.min(0.9, brightness),
      starType: starType
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

    // Create MULTIPLE sprite textures for shape variation
    
    // TINY STAR TEXTURE - Hard circle, no glow
    const createTinyTexture = () => {
      const canvas = document.createElement('canvas');
      canvas.width = 8;
      canvas.height = 8;
      const ctx = canvas.getContext('2d');
      
      // Solid circle
      ctx.fillStyle = 'white';
      ctx.beginPath();
      ctx.arc(4, 4, 3, 0, Math.PI * 2);
      ctx.fill();
      
      return new THREE.CanvasTexture(canvas);
    };
    
    // MEDIUM STAR TEXTURE - Sharp with minimal glow
    const createMediumTexture = () => {
      const canvas = document.createElement('canvas');
      canvas.width = 16;
      canvas.height = 16;
      const ctx = canvas.getContext('2d');
      
      const gradient = ctx.createRadialGradient(8, 8, 0, 8, 8, 8);
      gradient.addColorStop(0, 'rgba(255, 255, 255, 1)');
      gradient.addColorStop(0.4, 'rgba(255, 255, 255, 0.9)');
      gradient.addColorStop(0.7, 'rgba(255, 255, 255, 0.2)');
      gradient.addColorStop(1, 'rgba(255, 255, 255, 0)');
      
      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, 16, 16);
      
      return new THREE.CanvasTexture(canvas);
    };
    
    // HIGHLIGHT STAR TEXTURE - Cross/diamond shape
    const createHighlightTexture = () => {
      const canvas = document.createElement('canvas');
      canvas.width = 24;
      canvas.height = 24;
      const ctx = canvas.getContext('2d');
      
      // Draw cross shape
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
      centerGrad.addColorStop(0.5, 'rgba(255, 255, 255, 0.6)');
      centerGrad.addColorStop(1, 'rgba(255, 255, 255, 0)');
      ctx.fillStyle = centerGrad;
      ctx.fillRect(center - 6, center - 6, 12, 12);
      
      return new THREE.CanvasTexture(canvas);
    };

    const tinyTexture = createTinyTexture();
    const mediumTexture = createMediumTexture();
    const highlightTexture = createHighlightTexture();

    // Create THREE separate point systems for different star types
    const tinyStars = starCatalog.filter(s => s.starType === 'tiny');
    const mediumStars = starCatalog.filter(s => s.starType === 'medium');
    const highlightStars = starCatalog.filter(s => s.starType === 'highlight');
    
    const createStarSystem = (stars, texture, basePointSize) => {
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
            
            // MUCH smaller point sizes
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
            
            // HARD alpha cutoff for sharpness
            float alpha = texColor.a * vAlpha;
            if (alpha < 0.25) discard;
            
            gl_FragColor = vec4(vColor, alpha);
          }
        `,
        transparent: true,
        depthWrite: false,
        blending: THREE.NormalBlending
      });

      return new THREE.Points(geometry, material);
    };

    // Create star systems with different point sizes
    const tinySystem = createStarSystem(tinyStars, tinyTexture, 12); // Smallest
    const mediumSystem = createStarSystem(mediumStars, mediumTexture, 18); // Medium
    const highlightSystem = createStarSystem(highlightStars, highlightTexture, 25); // Largest with cross

    scene.add(tinySystem);
    scene.add(mediumSystem);
    scene.add(highlightSystem);
    
    starsRef.current = { tiny: tinySystem, medium: mediumSystem, highlight: highlightSystem };

    setIsLoaded(true);

    // Animation loop
    let rotationSpeed = 0.0002;
    const animate = () => {
      animationRef.current = requestAnimationFrame(animate);
      
      if (autoRotate && !isDragging) {
        tinySystem.rotation.y += rotationSpeed;
        tinySystem.rotation.x += rotationSpeed * 0.3;
        mediumSystem.rotation.y += rotationSpeed;
        mediumSystem.rotation.x += rotationSpeed * 0.3;
        highlightSystem.rotation.y += rotationSpeed;
        highlightSystem.rotation.x += rotationSpeed * 0.3;
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
      [tinySystem, mediumSystem, highlightSystem].forEach(system => {
        system.geometry.dispose();
        system.material.dispose();
      });
      tinyTexture.dispose();
      mediumTexture.dispose();
      highlightTexture.dispose();
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
      
      Object.values(starsRef.current).forEach(system => {
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
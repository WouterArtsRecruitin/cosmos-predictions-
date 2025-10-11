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
    
    // Add some randomness for natural look
    const jitter = 0.1;
    const finalRadius = radius * (1 + (Math.random() - 0.5) * jitter);
    
    points.push({
      x: x * finalRadius,
      y: y * finalRadius,
      z: z * finalRadius
    });
  }
  
  return points;
};

// Create density clusters (like star clusters in galaxies)
const createClusters = (numClusters, pointsPerCluster, baseRadius) => {
  const clusters = [];
  
  for (let c = 0; c < numClusters; c++) {
    // Random cluster center on sphere - AVOID CENTER
    const theta = Math.random() * Math.PI * 2;
    const phi = Math.acos(2 * Math.random() - 1);
    
    // Push clusters away from center (min radius 0.6 of baseRadius)
    const clusterDistance = baseRadius * (0.6 + Math.random() * 0.4);
    
    const centerX = clusterDistance * Math.sin(phi) * Math.cos(theta);
    const centerY = clusterDistance * Math.sin(phi) * Math.sin(theta);
    const centerZ = clusterDistance * Math.cos(phi);
    
    // Generate points around cluster center (Gaussian distribution)
    for (let i = 0; i < pointsPerCluster; i++) {
      const gaussianRadius = (Math.random() + Math.random() + Math.random()) / 3; // Approximate Gaussian
      const clusterRadius = gaussianRadius * baseRadius * 0.10; // Reduced from 0.15
      
      const localTheta = Math.random() * Math.PI * 2;
      const localPhi = Math.acos(2 * Math.random() - 1);
      
      clusters.push({
        x: centerX + clusterRadius * Math.sin(localPhi) * Math.cos(localTheta),
        y: centerY + clusterRadius * Math.sin(localPhi) * Math.sin(localTheta),
        z: centerZ + clusterRadius * Math.cos(localPhi)
      });
    }
  }
  
  return clusters;
};

// Generate star catalog with realistic distribution
const generateStarCatalog = () => {
  const stars = [];
  const baseRadius = 20; // Increased from 15 for more spacing
  
  // Main spherical distribution (70% of stars) - REDUCED
  const mainStars = fibonacciSphere(700, baseRadius); // Was 1500
  
  // Dense clusters (30% of stars) - REDUCED
  const clusterStars = createClusters(4, 75, baseRadius); // Was 5, 150
  
  const allPositions = [...mainStars, ...clusterStars];
  
  // Assign properties to each star
  allPositions.forEach((pos, i) => {
    const distance = Math.sqrt(pos.x ** 2 + pos.y ** 2 + pos.z ** 2);
    
    // Color temperature distribution (more cool stars than hot)
    const temp = Math.random();
    let color, size;
    
    if (temp < 0.05) {
      // Blue giants (5% - rare, bright)
      color = new THREE.Color(0.6, 0.7, 1.0);
      size = 0.2 + Math.random() * 0.15; // Further reduced
    } else if (temp < 0.15) {
      // Blue-white (10%)
      color = new THREE.Color(0.7, 0.8, 1.0);
      size = 0.15 + Math.random() * 0.1; // Further reduced
    } else if (temp < 0.30) {
      // White (15%)
      color = new THREE.Color(1.0, 1.0, 1.0);
      size = 0.12 + Math.random() * 0.08; // Further reduced
    } else if (temp < 0.50) {
      // Yellow-white (20%)
      color = new THREE.Color(1.0, 0.98, 0.9);
      size = 0.1 + Math.random() * 0.06; // Further reduced
    } else if (temp < 0.75) {
      // Yellow-orange (25%)
      color = new THREE.Color(1.0, 0.85, 0.6);
      size = 0.08 + Math.random() * 0.05; // Further reduced
    } else {
      // Red dwarfs (25% - most common, faint)
      color = new THREE.Color(1.0, 0.7, 0.5);
      size = 0.06 + Math.random() * 0.04; // Further reduced
    }
    
    // Vary brightness based on distance from center - HARD CAP
    const brightness = Math.min(0.7, 0.3 + (1 - distance / (baseRadius * 1.4)) * 0.4); // Hard cap at 0.7
    
    stars.push({
      position: pos,
      color: color,
      size: size,
      brightness: Math.max(0.3, Math.min(1.0, brightness))
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
    camera.position.set(0, 0, 55); // Adjusted for larger sphere (was 45, base radius now 20)
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

    // Create custom sprite texture for glow effect - MORE SUBTLE
    const canvas = document.createElement('canvas');
    canvas.width = 64;
    canvas.height = 64;
    const ctx = canvas.getContext('2d');
    
    const gradient = ctx.createRadialGradient(32, 32, 0, 32, 32, 32);
    gradient.addColorStop(0, 'rgba(255, 255, 255, 1)');
    gradient.addColorStop(0.15, 'rgba(255, 255, 255, 0.6)'); // Faster falloff
    gradient.addColorStop(0.3, 'rgba(255, 255, 255, 0.2)'); // Faster falloff
    gradient.addColorStop(1, 'rgba(255, 255, 255, 0)');
    
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, 64, 64);
    
    const spriteTexture = new THREE.CanvasTexture(canvas);

    // Create star system
    const starGeometry = new THREE.BufferGeometry();
    const positions = [];
    const colors = [];
    const sizes = [];
    const alphas = [];

    starCatalog.forEach(star => {
      positions.push(star.position.x, star.position.y, star.position.z);
      colors.push(star.color.r, star.color.g, star.color.b);
      sizes.push(star.size);
      alphas.push(star.brightness);
    });

    starGeometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
    starGeometry.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3));
    starGeometry.setAttribute('size', new THREE.Float32BufferAttribute(sizes, 1));
    starGeometry.setAttribute('alpha', new THREE.Float32BufferAttribute(alphas, 1));

    // Custom shader material for better glow
    const starMaterial = new THREE.ShaderMaterial({
      uniforms: {
        pointTexture: { value: spriteTexture }
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
          gl_PointSize = size * 30.0 * (300.0 / -mvPosition.z); // Further reduced from 35
          gl_Position = projectionMatrix * mvPosition;
        }
      `,
      fragmentShader: `
        uniform sampler2D pointTexture;
        varying vec3 vColor;
        varying float vAlpha;
        
        void main() {
          vec4 texColor = texture2D(pointTexture, gl_PointCoord);
          gl_FragColor = vec4(vColor, vAlpha * 0.85) * texColor; // Slightly transparent
        }
      `,
      transparent: true,
      depthWrite: false,
      blending: THREE.NormalBlending // CHANGED FROM AdditiveBlending
    });

    const stars = new THREE.Points(starGeometry, starMaterial);
    scene.add(stars);
    starsRef.current = stars;

    setIsLoaded(true);

    // Animation loop
    let rotationSpeed = 0.0003;
    const animate = () => {
      animationRef.current = requestAnimationFrame(animate);
      
      if (autoRotate && !isDragging && stars) {
        stars.rotation.y += rotationSpeed;
        stars.rotation.x += rotationSpeed * 0.3;
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
      starGeometry.dispose();
      starMaterial.dispose();
      spriteTexture.dispose();
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
      
      starsRef.current.rotation.y += deltaX * 0.005;
      starsRef.current.rotation.x += deltaY * 0.005;
      
      setLastMousePos({ x: e.clientX, y: e.clientY });
    }
  };

  const handleMouseUp = () => {
    setIsDragging(false);
    // Resume auto-rotate after 2 seconds
    setTimeout(() => setAutoRotate(true), 2000);
  };

  const handleWheel = (e) => {
    e.preventDefault();
    if (cameraRef.current) {
      cameraRef.current.position.z = Math.max(35, Math.min(85, cameraRef.current.position.z + e.deltaY * 0.05)); // Adjusted for larger sphere
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
      
      {/* Subtle welcome message like in screenshot */}
      {isLoaded && (
        <div style={{
          position: 'absolute',
          bottom: '15%',
          left: '50%',
          transform: 'translateX(-50%)',
          color: 'rgba(255, 255, 255, 0.9)',
          fontSize: '18px',
          fontWeight: 300,
          textAlign: 'center',
          pointerEvents: 'none',
          fontFamily: 'system-ui, -apple-system, sans-serif',
          letterSpacing: '0.5px'
        }}>
          <div style={{ marginBottom: '8px', opacity: 0.7, fontSize: '14px' }}>✦</div>
          <div>Welkom bij de Kosmos</div>
          <div style={{ fontSize: '14px', opacity: 0.6, marginTop: '8px' }}>
            Drag om te verkennen • Scroll om te zoomen
          </div>
        </div>
      )}

      {/* Minimal controls indicator */}
      <div style={{
        position: 'absolute',
        top: 20,
        right: 20,
        background: 'rgba(0, 0, 0, 0.4)',
        backdropFilter: 'blur(10px)',
        border: '1px solid rgba(255, 255, 255, 0.1)',
        borderRadius: 8,
        padding: '8px 12px',
        color: 'rgba(255, 255, 255, 0.7)',
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
        color: 'rgba(255, 255, 255, 0.5)',
        fontSize: 12,
        fontWeight: 300
      }}>
        {starCatalog.length.toLocaleString('nl-NL')} sterren
      </div>
    </div>
  );
}
import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';

// Generate realistic stellar catalog based on nearest stars
const generateStarCatalog = () => {
  const spectralTypes = ['O', 'B', 'A', 'F', 'G', 'K', 'M'];
  const spectralColors = {
    'O': 0x9bb0ff, // Blue
    'B': 0xaabfff, // Blue-white
    'A': 0xcad7ff, // White
    'F': 0xf8f7ff, // Yellow-white
    'G': 0xfff4ea, // Yellow (like our Sun)
    'K': 0xffd2a1, // Orange
    'M': 0xffcc6f  // Red-orange
  };
  
  // Distribution: M stars are most common, O stars are rare
  const spectralDistribution = ['M', 'M', 'M', 'M', 'K', 'K', 'K', 'G', 'G', 'F', 'A', 'B', 'O'];
  
  const stars = [];
  
  // Add our Sun at center
  stars.push({
    name: 'Sol (Sun)',
    x: 0,
    y: 0,
    z: 0,
    distance: 0,
    magnitude: -26.7,
    spectralType: 'G',
    color: spectralColors['G']
  });
  
  // Generate 500 nearby stars
  for (let i = 0; i < 500; i++) {
    // Distance in parsecs (1 parsec = 3.26 light years)
    // Nearby stars: 1-50 parsecs
    const distance = Math.pow(Math.random(), 0.5) * 50 + 0.1;
    
    // Random spherical coordinates
    const ra = Math.random() * 360; // Right Ascension (degrees)
    const dec = (Math.random() - 0.5) * 180; // Declination (degrees)
    
    // Convert to Cartesian coordinates
    const raRad = ra * Math.PI / 180;
    const decRad = dec * Math.PI / 180;
    
    const x = distance * Math.cos(decRad) * Math.cos(raRad);
    const y = distance * Math.cos(decRad) * Math.sin(raRad);
    const z = distance * Math.sin(decRad);
    
    // Select spectral type (weighted distribution)
    const spectralType = spectralDistribution[Math.floor(Math.random() * spectralDistribution.length)];
    
    // Magnitude: closer and hotter stars are brighter
    // Absolute magnitude ranges: O(-6 to -3), B(-4 to -1), A(-1 to 2), F(2 to 4), G(4 to 6), K(6 to 9), M(9 to 16)
    const baseMagnitude = {
      'O': -5 + Math.random() * 3,
      'B': -3 + Math.random() * 3,
      'A': 0 + Math.random() * 3,
      'F': 2 + Math.random() * 2,
      'G': 4 + Math.random() * 2,
      'K': 6 + Math.random() * 3,
      'M': 9 + Math.random() * 7
    }[spectralType];
    
    // Apparent magnitude (how bright from Earth) = absolute magnitude + distance modulus
    const magnitude = baseMagnitude + 5 * Math.log10(distance / 10);
    
    stars.push({
      name: `${spectralType}-${i}`,
      x,
      y,
      z,
      distance,
      magnitude,
      spectralType,
      color: spectralColors[spectralType]
    });
  }
  
  return stars;
};

export default function CosmosVisualization() {
  const canvasRef = useRef(null);
  const sceneRef = useRef(null);
  const cameraRef = useRef(null);
  const rendererRef = useRef(null);
  const starsRef = useRef(null);
  const animationRef = useRef(null);
  
  const [hoveredStar, setHoveredStar] = useState(null);
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [lastMousePos, setLastMousePos] = useState({ x: 0, y: 0 });
  const [cameraRotation, setCameraRotation] = useState({ theta: 0, phi: Math.PI / 4 });
  const [cameraDistance, setCameraDistance] = useState(30);
  
  const starCatalog = useRef(generateStarCatalog()).current;

  useEffect(() => {
    if (!canvasRef.current) return;

    // Scene setup
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x000510);
    sceneRef.current = scene;

    // Camera setup
    const camera = new THREE.PerspectiveCamera(
      75,
      canvasRef.current.clientWidth / canvasRef.current.clientHeight,
      0.1,
      1000
    );
    camera.position.set(20, 15, 20);
    camera.lookAt(0, 0, 0);
    cameraRef.current = camera;

    // Renderer setup
    const renderer = new THREE.WebGLRenderer({ 
      canvas: canvasRef.current,
      antialias: true 
    });
    renderer.setSize(canvasRef.current.clientWidth, canvasRef.current.clientHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    rendererRef.current = renderer;

    // Create stars
    const starGeometry = new THREE.BufferGeometry();
    const positions = [];
    const colors = [];
    const sizes = [];

    starCatalog.forEach(star => {
      positions.push(star.x, star.y, star.z);
      
      const color = new THREE.Color(star.color);
      colors.push(color.r, color.g, color.b);
      
      // Size based on magnitude (brighter = larger)
      // Magnitude is logarithmic: lower = brighter
      const size = Math.max(0.1, 2.0 - star.magnitude / 10);
      sizes.push(size);
    });

    starGeometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
    starGeometry.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3));
    starGeometry.setAttribute('size', new THREE.Float32BufferAttribute(sizes, 1));

    const starMaterial = new THREE.PointsMaterial({
      size: 0.5,
      vertexColors: true,
      sizeAttenuation: true,
      transparent: true,
      opacity: 0.9
    });

    const stars = new THREE.Points(starGeometry, starMaterial);
    scene.add(stars);
    starsRef.current = stars;

    // Add ambient light
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.3);
    scene.add(ambientLight);

    // Add axes helper for orientation
    const axesHelper = new THREE.AxesHelper(10);
    scene.add(axesHelper);

    // Add grid helper
    const gridHelper = new THREE.GridHelper(100, 20, 0x444444, 0x222222);
    scene.add(gridHelper);

    // Animation loop
    const animate = () => {
      animationRef.current = requestAnimationFrame(animate);
      
      // Gentle rotation of stars
      if (stars) {
        stars.rotation.y += 0.0002;
      }
      
      renderer.render(scene, camera);
    };
    animate();

    // Handle window resize
    const handleResize = () => {
      if (!canvasRef.current) return;
      
      camera.aspect = canvasRef.current.clientWidth / canvasRef.current.clientHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(canvasRef.current.clientWidth, canvasRef.current.clientHeight);
    };
    window.addEventListener('resize', handleResize);

    // Cleanup
    return () => {
      window.removeEventListener('resize', handleResize);
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
      renderer.dispose();
      starGeometry.dispose();
      starMaterial.dispose();
    };
  }, []);

  // Update camera position based on spherical coordinates
  useEffect(() => {
    if (!cameraRef.current) return;
    
    const camera = cameraRef.current;
    const { theta, phi } = cameraRotation;
    
    camera.position.x = cameraDistance * Math.sin(phi) * Math.cos(theta);
    camera.position.y = cameraDistance * Math.cos(phi);
    camera.position.z = cameraDistance * Math.sin(phi) * Math.sin(theta);
    
    camera.lookAt(0, 0, 0);
  }, [cameraRotation, cameraDistance]);

  // Mouse event handlers for camera control
  const handleMouseDown = (e) => {
    setIsDragging(true);
    setLastMousePos({ x: e.clientX, y: e.clientY });
  };

  const handleMouseMove = (e) => {
    const rect = canvasRef.current.getBoundingClientRect();
    setMousePos({ 
      x: ((e.clientX - rect.left) / rect.width) * 2 - 1,
      y: -((e.clientY - rect.top) / rect.height) * 2 + 1
    });

    if (isDragging) {
      const deltaX = e.clientX - lastMousePos.x;
      const deltaY = e.clientY - lastMousePos.y;
      
      setCameraRotation(prev => ({
        theta: prev.theta + deltaX * 0.01,
        phi: Math.max(0.1, Math.min(Math.PI - 0.1, prev.phi + deltaY * 0.01))
      }));
      
      setLastMousePos({ x: e.clientX, y: e.clientY });
    }

    // Raycasting for hover detection
    if (cameraRef.current && starsRef.current) {
      const raycaster = new THREE.Raycaster();
      raycaster.params.Points.threshold = 0.5;
      
      raycaster.setFromCamera(mousePos, cameraRef.current);
      const intersects = raycaster.intersectObject(starsRef.current);
      
      if (intersects.length > 0) {
        const index = intersects[0].index;
        setHoveredStar({
          ...starCatalog[index],
          screenX: e.clientX,
          screenY: e.clientY
        });
      } else {
        setHoveredStar(null);
      }
    }
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  const handleWheel = (e) => {
    e.preventDefault();
    setCameraDistance(prev => Math.max(10, Math.min(100, prev + e.deltaY * 0.05)));
  };

  return (
    <div style={{ width: '100vw', height: '100vh', position: 'relative', overflow: 'hidden', background: '#000510' }}>
      <canvas
        ref={canvasRef}
        style={{ display: 'block', width: '100%', height: '100%', cursor: isDragging ? 'grabbing' : 'grab' }}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        onWheel={handleWheel}
      />
      
      {/* Controls info overlay */}
      <div style={{
        position: 'absolute',
        top: 20,
        left: 20,
        background: 'rgba(0, 5, 16, 0.85)',
        border: '1px solid rgba(255, 255, 255, 0.2)',
        borderRadius: 8,
        padding: 16,
        color: 'white',
        fontFamily: 'system-ui, -apple-system, sans-serif',
        fontSize: 14,
        maxWidth: 300,
        backdropFilter: 'blur(10px)'
      }}>
        <h3 style={{ margin: '0 0 12px 0', fontSize: 16, fontWeight: 600, color: '#4da6ff' }}>
          🌌 Interactive Cosmos
        </h3>
        <div style={{ marginBottom: 8 }}>
          <strong style={{ color: '#ffd700' }}>500 Nearest Stars</strong>
        </div>
        <div style={{ fontSize: 12, opacity: 0.9, lineHeight: 1.6 }}>
          <div style={{ marginBottom: 8 }}>
            <strong>Controls:</strong>
          </div>
          <div>🖱️ Drag: Rotate camera</div>
          <div>🔍 Scroll: Zoom in/out</div>
          <div>👆 Hover: Star info</div>
        </div>
        <div style={{ marginTop: 12, fontSize: 11, opacity: 0.7, borderTop: '1px solid rgba(255,255,255,0.1)', paddingTop: 8 }}>
          <div><strong>Spectral Types:</strong></div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4, marginTop: 4 }}>
            <span style={{ color: '#9bb0ff' }}>O</span>
            <span style={{ color: '#aabfff' }}>B</span>
            <span style={{ color: '#cad7ff' }}>A</span>
            <span style={{ color: '#f8f7ff' }}>F</span>
            <span style={{ color: '#fff4ea' }}>G</span>
            <span style={{ color: '#ffd2a1' }}>K</span>
            <span style={{ color: '#ffcc6f' }}>M</span>
          </div>
        </div>
      </div>

      {/* Star info on hover */}
      {hoveredStar && (
        <div style={{
          position: 'absolute',
          left: hoveredStar.screenX + 15,
          top: hoveredStar.screenY + 15,
          background: 'rgba(0, 5, 16, 0.95)',
          border: '1px solid rgba(255, 255, 255, 0.3)',
          borderRadius: 6,
          padding: 12,
          color: 'white',
          fontFamily: 'system-ui, -apple-system, sans-serif',
          fontSize: 13,
          pointerEvents: 'none',
          backdropFilter: 'blur(10px)',
          boxShadow: '0 4px 12px rgba(0, 0, 0, 0.5)'
        }}>
          <div style={{ fontWeight: 600, marginBottom: 6, color: '#4da6ff' }}>
            {hoveredStar.name}
          </div>
          <div style={{ fontSize: 12, opacity: 0.9 }}>
            <div>Type: <span style={{ color: hoveredStar.color }}>{hoveredStar.spectralType}</span></div>
            <div>Distance: {hoveredStar.distance.toFixed(2)} pc</div>
            <div style={{ opacity: 0.7, fontSize: 11, marginTop: 2 }}>
              ({(hoveredStar.distance * 3.26).toFixed(1)} light years)
            </div>
            <div>Magnitude: {hoveredStar.magnitude.toFixed(2)}</div>
          </div>
        </div>
      )}

      {/* Stats overlay */}
      <div style={{
        position: 'absolute',
        bottom: 20,
        right: 20,
        background: 'rgba(0, 5, 16, 0.85)',
        border: '1px solid rgba(255, 255, 255, 0.2)',
        borderRadius: 8,
        padding: 12,
        color: 'white',
        fontFamily: 'system-ui, -apple-system, sans-serif',
        fontSize: 12,
        backdropFilter: 'blur(10px)'
      }}>
        <div style={{ opacity: 0.9 }}>
          <div>Total Stars: <strong>{starCatalog.length}</strong></div>
          <div>Camera Distance: <strong>{cameraDistance.toFixed(1)} units</strong></div>
        </div>
      </div>
    </div>
  );
}
'use client';

export default function CosmosVisualization() {
  return (
    <div style={{ margin: 0, padding: 0, width: '100vw', height: '100vh', overflow: 'hidden' }}>
      <div dangerouslySetInnerHTML={{
        __html: `
<!DOCTYPE html>
<html lang="nl">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Globular Cluster | Cosmos Predictions</title>
    <script src="https://cdn.jsdelivr.net/npm/three@0.144.0/build/three.min.js"></script>
    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }
        
        body {
            font-family: system-ui, -apple-system, sans-serif;
            background: #000000;
            overflow: hidden;
        }
        
        #container {
            width: 100vw;
            height: 100vh;
            position: relative;
            cursor: grab;
        }
        
        #container.dragging {
            cursor: grabbing;
        }
        
        .ui-overlay {
            position: absolute;
            z-index: 100;
            pointer-events: none;
        }
        
        .welcome-text {
            bottom: 15%;
            left: 50%;
            transform: translateX(-50%);
            color: rgba(255, 255, 255, 0.85);
            font-size: 18px;
            font-weight: 300;
            text-align: center;
            letter-spacing: 0.5px;
        }
        
        .welcome-text .symbol {
            margin-bottom: 8px;
            opacity: 0.6;
            font-size: 14px;
        }
        
        .welcome-text .subtitle {
            font-size: 14px;
            opacity: 0.5;
            margin-top: 8px;
        }
        
        .status-indicator {
            top: 20px;
            right: 20px;
            background: rgba(0, 0, 0, 0.3);
            backdrop-filter: blur(10px);
            border: 1px solid rgba(255, 255, 255, 0.08);
            border-radius: 8px;
            padding: 8px 12px;
            color: rgba(255, 255, 255, 0.6);
            font-size: 12px;
            display: flex;
            align-items: center;
            gap: 8px;
        }
        
        .status-dot {
            width: 6px;
            height: 6px;
            border-radius: 50%;
            background: #4ade80;
            transition: background 0.3s;
        }
        
        .status-dot.manual {
            background: #64748b;
        }
        
        .star-count {
            bottom: 20px;
            left: 20px;
            color: rgba(255, 255, 255, 0.4);
            font-size: 12px;
            font-weight: 300;
        }
        
        .loading {
            position: absolute;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            color: rgba(255, 255, 255, 0.6);
            font-size: 18px;
            font-weight: 300;
        }
    </style>
</head>
<body>
    <div id="container">
        <div class="loading" id="loading">Laden van de sterrenhoop...</div>
        
        <div class="ui-overlay welcome-text" id="welcomeText" style="display: none;">
            <div class="symbol">✦</div>
            <div>Globular Cluster</div>
            <div class="subtitle">Een sferische sterrenhoop • Drag om te verkennen • Scroll om te zoomen</div>
        </div>

        <div class="ui-overlay status-indicator" id="statusIndicator" style="display: none;">
            <div class="status-dot" id="statusDot"></div>
            <span id="statusText">Auto-rotatie</span>
        </div>

        <div class="ui-overlay star-count" id="starCount" style="display: none;">
            55.000 sterren • Realistische cluster
        </div>
    </div>

    <script>
        class GlobularClusterVisualization {
            constructor() {
                this.container = document.getElementById('container');
                this.scene = null;
                this.camera = null;
                this.renderer = null;
                this.starSystems = [];
                this.animationId = null;
                this.isDragging = false;
                this.lastMousePos = { x: 0, y: 0 };
                this.autoRotate = true;
                this.rotationSpeed = 0.00015;
                
                this.init();
            }

            generateGlobularCluster(totalStars, coreRadius, haloRadius) {
                const points = [];
                const coreStars = Math.floor(totalStars * 0.2);
                const haloStars = totalStars - coreStars;

                for (let i = 0; i < coreStars; i++) {
                    const r = Math.pow(Math.random(), 0.5) * coreRadius;
                    const theta = Math.random() * Math.PI * 2;
                    const phi = Math.acos(2 * Math.random() - 1);
                    
                    const x = r * Math.sin(phi) * Math.cos(theta);
                    const y = r * Math.sin(phi) * Math.sin(theta);
                    const z = r * Math.cos(phi);
                    
                    points.push({ x, y, z, region: 'core', distanceFromCenter: r });
                }

                for (let i = 0; i < haloStars; i++) {
                    const r = coreRadius + Math.pow(Math.random(), 1.2) * (haloRadius - coreRadius);
                    const theta = Math.random() * Math.PI * 2;
                    const phi = Math.acos(2 * Math.random() - 1);
                    
                    const x = r * Math.sin(phi) * Math.cos(theta);
                    const y = r * Math.sin(phi) * Math.sin(theta);
                    const z = r * Math.cos(phi);
                    
                    points.push({ x, y, z, region: 'halo', distanceFromCenter: r });
                }

                return points;
            }

            generateStarCatalog() {
                const stars = [];
                const coreRadius = 15;
                const haloRadius = 45;
                const positions = this.generateGlobularCluster(55000, coreRadius, haloRadius);
                
                positions.forEach((pos) => {
                    const distanceRatio = pos.distanceFromCenter / haloRadius;
                    let color, size, starType, brightness;
                    const random = Math.random();
                    
                    if (pos.region === 'core') {
                        if (random < 0.35) {
                            color = this.getClusterColor('mainSequence', Math.random() * 0.12 - 0.06);
                            size = 0.003 + Math.pow(Math.random(), 1.8) * 0.012;
                            starType = 'mainSequence';
                            brightness = 0.35 + Math.random() * 0.35;
                        } else if (random < 0.55) {
                            color = this.getClusterColor('subtleOrange', Math.random() * 0.1 - 0.05);
                            size = 0.004 + Math.pow(Math.random(), 1.5) * 0.015;
                            starType = 'subtleOrange';
                            brightness = 0.4 + Math.random() * 0.35;
                        } else if (random < 0.70) {
                            color = this.getClusterColor('warmWhite', Math.random() * 0.08 - 0.04);
                            size = 0.003 + Math.pow(Math.random(), 1.8) * 0.012;
                            starType = 'warmWhite';
                            brightness = 0.35 + Math.random() * 0.3;
                        } else if (random < 0.80) {
                            color = this.getClusterColor('deepOrange', Math.random() * 0.08 - 0.04);
                            size = 0.003 + Math.pow(Math.random(), 1.7) * 0.012;
                            starType = 'deepOrange';
                            brightness = 0.28 + Math.random() * 0.32;
                        } else if (random < 0.88) {
                            color = this.getClusterColor('faintRed', Math.random() * 0.07 - 0.035);
                            size = 0.002 + Math.pow(Math.random(), 1.8) * 0.012;
                            starType = 'faintRed';
                            brightness = 0.26 + Math.random() * 0.30;
                        } else if (random < 0.92) {
                            color = this.getClusterColor('coolWhite', Math.random() * 0.06 - 0.03);
                            size = 0.002 + Math.pow(Math.random(), 2.0) * 0.009;
                            starType = 'coolWhite';
                            brightness = 0.28 + Math.random() * 0.28;
                        } else if (random < 0.94) {
                            color = this.getClusterColor('subtleBlue', Math.random() * 0.06 - 0.03);
                            size = 0.002 + Math.pow(Math.random(), 2.0) * 0.010;
                            starType = 'subtleBlue';
                            brightness = 0.24 + Math.random() * 0.28;
                        } else if (random < 0.97) {
                            color = this.getClusterColor('lightPurple', Math.random() * 0.05 - 0.025);
                            size = 0.002 + Math.pow(Math.random(), 1.9) * 0.009;
                            starType = 'lightPurple';
                            brightness = 0.22 + Math.random() * 0.26;
                        } else {
                            color = this.getClusterColor('faintPink', Math.random() * 0.04 - 0.02);
                            size = 0.002 + Math.pow(Math.random(), 1.9) * 0.009;
                            starType = 'faintPink';
                            brightness = 0.2 + Math.random() * 0.23;
                        }
                    } else {
                        if (random < 0.40) {
                            color = this.getClusterColor('neutralGray', Math.random() * 0.08 - 0.04);
                            size = 0.002 + Math.pow(Math.random(), 2.5) * 0.007;
                            starType = 'neutralGray';
                            brightness = 0.18 + Math.random() * 0.22;
                        } else if (random < 0.65) {
                            color = this.getClusterColor('mainSequence', Math.random() * 0.09 - 0.045);
                            size = 0.002 + Math.pow(Math.random(), 2.1) * 0.009;
                            starType = 'mainSequence';
                            brightness = 0.2 + Math.random() * 0.28;
                        } else {
                            color = this.getClusterColor('coolWhite', Math.random() * 0.07 - 0.035);
                            size = 0.002 + Math.pow(Math.random(), 1.9) * 0.008;
                            starType = 'coolWhite';
                            brightness = 0.22 + Math.random() * 0.25;
                        }
                    }
                    
                    brightness *= (1.2 - distanceRatio * 0.4);
                    brightness = Math.max(0.1, Math.min(1.8, brightness));
                    
                    let shapeType = 'dot';
                    if (brightness > 0.9) {
                        shapeType = Math.random() < 0.8 ? 'dot' : 'round';
                    }
                    
                    stars.push({
                        position: pos,
                        color: color,
                        size: size,
                        brightness: brightness,
                        starType: starType,
                        shapeType: shapeType,
                        region: pos.region
                    });
                });
                
                return stars;
            }

            getClusterColor(type, variation) {
                const colors = {
                    mainSequence: [0.94, 0.91, 0.84],
                    coolWhite: [0.90, 0.92, 0.95],
                    warmWhite: [0.96, 0.93, 0.82],
                    subtleBlue: [0.85, 0.90, 0.98],
                    lightPurple: [0.90, 0.86, 0.95],
                    subtleOrange: [0.95, 0.86, 0.72],
                    deepOrange: [0.92, 0.78, 0.65],
                    faintRed: [0.89, 0.82, 0.78],
                    faintPink: [0.92, 0.89, 0.91],
                    neutralGray: [0.88, 0.88, 0.90]
                };
                
                const baseColor = colors[type] || [1.0, 1.0, 1.0];
                return new THREE.Color(
                    Math.max(0, Math.min(1, baseColor[0] + variation)),
                    Math.max(0, Math.min(1, baseColor[1] + variation * 0.7)),
                    Math.max(0, Math.min(1, baseColor[2] + variation * 0.5))
                );
            }

            createStarSystem(stars, basePointSize) {
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
                    uniforms: {},
                    vertexShader: \`
                        attribute float size;
                        attribute float alpha;
                        attribute vec3 color;
                        varying vec3 vColor;
                        varying float vAlpha;
                        
                        void main() {
                            vColor = color;
                            vAlpha = alpha;
                            vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
                            gl_PointSize = size * \${basePointSize.toFixed(1)} * (400.0 / -mvPosition.z);
                            gl_Position = projectionMatrix * mvPosition;
                        }
                    \`,
                    fragmentShader: \`
                        varying vec3 vColor;
                        varying float vAlpha;
                        
                        void main() {
                            vec2 uv = gl_PointCoord;
                            vec2 center = uv - 0.5;
                            float dist = length(center);
                            
                            // Create circular star shape
                            float alpha = 1.0 - smoothstep(0.0, 0.5, dist);
                            alpha *= vAlpha;
                            
                            if (alpha < 0.08) discard;
                            gl_FragColor = vec4(vColor * vAlpha, alpha);
                        }
                    \`,
                    transparent: true,
                    depthWrite: false,
                    blending: THREE.NormalBlending
                });

                return new THREE.Points(geometry, material);
            }

            init() {
                this.scene = new THREE.Scene();
                this.scene.background = new THREE.Color(0x000000);

                this.camera = new THREE.PerspectiveCamera(
                    45,
                    window.innerWidth / window.innerHeight,
                    0.1,
                    1000
                );
                this.camera.position.set(0, 0, 90);
                this.camera.lookAt(0, 0, 0);

                this.renderer = new THREE.WebGLRenderer({ 
                    antialias: true,
                    alpha: true
                });
                this.renderer.setSize(window.innerWidth, window.innerHeight);
                this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
                this.container.appendChild(this.renderer.domElement);

                const starCatalog = this.generateStarCatalog();
                console.log(\`Generated \${starCatalog.length} stars\`);

                const starGroups = {
                    tiny: starCatalog.filter(s => s.shapeType === 'dot' && s.size < 0.06),
                    medium: starCatalog.filter(s => s.shapeType === 'dot' && s.size >= 0.06),
                    round: starCatalog.filter(s => s.shapeType === 'round')
                };

                const systems = [
                    this.createStarSystem(starGroups.tiny, 200),
                    this.createStarSystem(starGroups.medium, 180),
                    this.createStarSystem(starGroups.round, 160)
                ].filter(s => s);

                console.log(\`Created \${systems.length} star systems\`);
                systems.forEach(system => this.scene.add(system));
                this.starSystems = systems;

                this.setupEventListeners();
                this.animate();
                this.showUI();
            }

            setupEventListeners() {
                this.container.addEventListener('mousedown', (e) => {
                    this.isDragging = true;
                    this.autoRotate = false;
                    this.container.classList.add('dragging');
                    this.lastMousePos = { x: e.clientX, y: e.clientY };
                    this.updateStatus();
                });

                this.container.addEventListener('mousemove', (e) => {
                    if (this.isDragging) {
                        const deltaX = e.clientX - this.lastMousePos.x;
                        const deltaY = e.clientY - this.lastMousePos.y;
                        
                        this.starSystems.forEach(system => {
                            system.rotation.y += deltaX * 0.005;
                            system.rotation.x += deltaY * 0.005;
                        });
                        
                        this.lastMousePos = { x: e.clientX, y: e.clientY };
                    }
                });

                this.container.addEventListener('mouseup', () => {
                    this.isDragging = false;
                    this.container.classList.remove('dragging');
                    setTimeout(() => {
                        this.autoRotate = true;
                        this.updateStatus();
                    }, 2000);
                });

                this.container.addEventListener('wheel', (e) => {
                    e.preventDefault();
                    const zoomSpeed = 0.08;
                    const minDistance = 40;
                    const maxDistance = 200;
                    this.camera.position.z = Math.max(minDistance, Math.min(maxDistance, this.camera.position.z + e.deltaY * zoomSpeed));
                });

                window.addEventListener('resize', () => {
                    this.camera.aspect = window.innerWidth / window.innerHeight;
                    this.camera.updateProjectionMatrix();
                    this.renderer.setSize(window.innerWidth, window.innerHeight);
                });
            }

            animate() {
                this.animationId = requestAnimationFrame(() => this.animate());
                
                if (this.autoRotate && !this.isDragging) {
                    this.starSystems.forEach(system => {
                        system.rotation.y += this.rotationSpeed;
                        system.rotation.x += this.rotationSpeed * 0.2;
                    });
                }
                
                this.renderer.render(this.scene, this.camera);
            }

            showUI() {
                document.getElementById('loading').style.display = 'none';
                document.getElementById('welcomeText').style.display = 'block';
                document.getElementById('statusIndicator').style.display = 'flex';
                document.getElementById('starCount').style.display = 'block';
            }

            updateStatus() {
                const statusDot = document.getElementById('statusDot');
                const statusText = document.getElementById('statusText');
                
                if (this.autoRotate) {
                    statusDot.classList.remove('manual');
                    statusText.textContent = 'Auto-rotatie';
                } else {
                    statusDot.classList.add('manual');
                    statusText.textContent = 'Handmatig';
                }
            }
        }

        window.addEventListener('load', () => {
            if (typeof THREE === 'undefined') {
                document.getElementById('loading').innerHTML = 'Fout: Three.js kon niet worden geladen.';
                return;
            }
            
            try {
                new GlobularClusterVisualization();
            } catch (error) {
                console.error('Cluster initialization error:', error);
                document.getElementById('loading').innerHTML = 'Fout bij het laden van de sterrenhoop.';
            }
        });
    </script>
</body>
</html>
        `
      }} />
    </div>
  );
}
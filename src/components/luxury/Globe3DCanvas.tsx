import React, { useRef, useMemo, useEffect, useState } from 'react';
import * as THREE from 'three';
import { motion, useScroll, useSpring, useTransform } from 'motion/react';

interface Globe3DCanvasProps {
  scrollProgressRef?: React.MutableRefObject<number>;
}

export const Globe3DCanvas: React.FC<Globe3DCanvasProps> = () => {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [activePhase, setActivePhase] = useState<number>(1);
  const [telemetryText, setTelemetryText] = useState({
    title: 'GLOBAL TELEMETRY ENGINE',
    coord: 'LAT 12.9716° N // LON 77.5946° E',
    status: 'INGESTING MULTI-MARKET SIGNALS',
    latency: '38ms'
  });

  // Track global page scroll progress with smooth spring interpolation
  const { scrollYProgress } = useScroll();
  const smoothProgress = useSpring(scrollYProgress, {
    stiffness: 80,
    damping: 24,
    restDelta: 0.0001
  });

  useEffect(() => {
    const unsubscribe = smoothProgress.on('change', (latest) => {
      if (latest < 0.25) {
        setActivePhase(1);
        setTelemetryText({
          title: 'GLOBAL TELEMETRY // ORBITAL VIEW',
          coord: 'INDIA RECONNAISSANCE // SUB-ORBITAL',
          status: 'INWARD MULTI-DIALECT SIGNAL ABSORPTION',
          latency: '24ms'
        });
      } else if (latest < 0.50) {
        setActivePhase(2);
        setTelemetryText({
          title: 'INDIA SUB-CONTINENT // DESCENT',
          coord: 'LAT 20.5937° N // LON 78.9629° E',
          status: 'FILTERING 7 REGIONAL VOICE MODELS',
          latency: '42ms'
        });
      } else if (latest < 0.75) {
        setActivePhase(3);
        setTelemetryText({
          title: 'KARNATAKA & SOUTH INDIA HOTSPOTS',
          coord: 'BENGALURU • HYDERABAD • CHENNAI',
          status: 'IDENTIFYING HIGH-INTENT PROPERTY DEMAND',
          latency: '68ms'
        });
      } else {
        setActivePhase(4);
        setTelemetryText({
          title: 'BANGALORE REAL ESTATE GRID // STREET LEVEL',
          coord: 'WHITEFIELD • ORR • INDIRANAGAR • CBD',
          status: 'NEURAL ROUTING & 15S INSTANT WHATSAPP DISPATCH',
          latency: '15ms'
        });
      }
    });

    return () => unsubscribe();
  }, [smoothProgress]);

  useEffect(() => {
    const container = containerRef.current;
    const canvas = canvasRef.current;
    if (!container || !canvas) return;

    // --- THREE.JS SCENE INITIALIZATION ---
    const scene = new THREE.Scene();
    scene.fog = new THREE.FogExp2(0x0a0a0a, 0.015);

    const camera = new THREE.PerspectiveCamera(
      45,
      container.clientWidth / container.clientHeight,
      0.1,
      1000
    );
    camera.position.set(0, 4, 28);

    const renderer = new THREE.WebGLRenderer({
      canvas,
      antialias: true,
      alpha: true,
      powerPreference: 'high-performance'
    });
    renderer.setSize(container.clientWidth, container.clientHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.1;

    // --- LIGHTING ---
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.35);
    scene.add(ambientLight);

    const goldPointLight = new THREE.PointLight(0xd4af37, 3.5, 60);
    goldPointLight.position.set(10, 15, 20);
    scene.add(goldPointLight);

    const cyanRimLight = new THREE.PointLight(0x38bdf8, 2.0, 50);
    cyanRimLight.position.set(-15, -10, -10);
    scene.add(cyanRimLight);

    // --- 1. MINIMALIST WIREFRAME & DOT MATRIX GLOBE ---
    const globeGroup = new THREE.Group();
    globeGroup.position.set(0, 0, 0);
    scene.add(globeGroup);

    // Dark base sphere with subtle obsidian reflection
    const sphereGeo = new THREE.SphereGeometry(6.5, 64, 64);
    const sphereMat = new THREE.MeshStandardMaterial({
      color: 0x0e0e12,
      roughness: 0.8,
      metalness: 0.3,
      wireframe: false
    });
    const baseSphere = new THREE.Mesh(sphereGeo, sphereMat);
    globeGroup.add(baseSphere);

    // Dotted wireframe overlay on globe
    const wireGeo = new THREE.WireframeGeometry(new THREE.SphereGeometry(6.53, 36, 36));
    const wireMat = new THREE.LineBasicMaterial({
      color: 0xd4af37,
      transparent: true,
      opacity: 0.12
    });
    const wireLines = new THREE.LineSegments(wireGeo, wireMat);
    globeGroup.add(wireLines);

    // Equator and Latitude ring accents
    const createRing = (radius: number, color: number, opacity: number, rotX: number, rotY: number) => {
      const ringGeo = new THREE.RingGeometry(radius - 0.02, radius + 0.02, 64);
      const ringMat = new THREE.MeshBasicMaterial({
        color,
        side: THREE.DoubleSide,
        transparent: true,
        opacity
      });
      const ring = new THREE.Mesh(ringGeo, ringMat);
      ring.rotation.x = rotX;
      ring.rotation.y = rotY;
      return ring;
    };

    const ring1 = createRing(8.2, 0xd4af37, 0.18, Math.PI / 2.3, 0.3);
    const ring2 = createRing(9.8, 0x38bdf8, 0.10, Math.PI / 3, 0.8);
    globeGroup.add(ring1);
    globeGroup.add(ring2);

    // Geographic coordinate conversion utility
    const latLongToVector3 = (lat: number, lon: number, radius: number) => {
      const phi = (90 - lat) * (Math.PI / 180);
      const theta = (lon + 180) * (Math.PI / 180);
      const x = -(radius * Math.sin(phi) * Math.cos(theta));
      const z = radius * Math.sin(phi) * Math.sin(theta);
      const y = radius * Math.cos(phi);
      return new THREE.Vector3(x, y, z);
    };

    // --- 2. INWARD-FLOWING PARTICLE SYSTEM (CHAMPAGNE GOLD ABSORPTION) ---
    const PARTICLE_COUNT = 1400;
    const particleGeo = new THREE.BufferGeometry();
    const particlePositions = new Float32Array(PARTICLE_COUNT * 3);
    const particleVelocities = new Float32Array(PARTICLE_COUNT * 3);
    const particleLifetimes = new Float32Array(PARTICLE_COUNT);

    const initParticle = (index: number) => {
      // Spawn on an expansive outer sphere (radius 18 to 35)
      const u = Math.random();
      const v = Math.random();
      const theta = u * 2.0 * Math.PI;
      const phi = Math.acos(2.0 * v - 1.0);
      const r = 18 + Math.random() * 20;

      const sinPhi = Math.sin(phi);
      const x = r * sinPhi * Math.cos(theta);
      const y = r * sinPhi * Math.sin(theta);
      const z = r * Math.cos(phi);

      particlePositions[index * 3] = x;
      particlePositions[index * 3 + 1] = y;
      particlePositions[index * 3 + 2] = z;

      // Inward velocity towards globe center (0, 0, 0)
      const speed = 0.035 + Math.random() * 0.045;
      const dir = new THREE.Vector3(-x, -y, -z).normalize().multiplyScalar(speed);
      particleVelocities[index * 3] = dir.x;
      particleVelocities[index * 3 + 1] = dir.y;
      particleVelocities[index * 3 + 2] = dir.z;

      particleLifetimes[index] = Math.random();
    };

    for (let i = 0; i < PARTICLE_COUNT; i++) {
      initParticle(i);
    }

    particleGeo.setAttribute('position', new THREE.BufferAttribute(particlePositions, 3));

    // Particle Material: Champagne Gold with custom point texture simulation
    const particleMat = new THREE.PointsMaterial({
      color: 0xd4af37,
      size: 0.16,
      transparent: true,
      opacity: 0.65,
      blending: THREE.AdditiveBlending,
      depthWrite: false
    });

    const particles = new THREE.Points(particleGeo, particleMat);
    scene.add(particles);

    // --- 3. BANGALORE REAL ESTATE CITY GRID (INSTANCED MESH) ---
    // Rendered at the micro-zoom target coordinates for Phase 4
    const cityGroup = new THREE.Group();
    // Position the city right around the Bangalore geographic coordinate spot
    const bglrTargetPos = latLongToVector3(12.9716, 77.5946, 6.55);
    cityGroup.position.copy(bglrTargetPos);
    cityGroup.lookAt(bglrTargetPos.clone().multiplyScalar(2)); // orient tangent to globe surface
    globeGroup.add(cityGroup);

    const GRID_SIZE = 14;
    const BUILDING_COUNT = GRID_SIZE * GRID_SIZE;
    const boxGeo = new THREE.BoxGeometry(0.08, 1, 0.08);
    // translate geometry so bottom sits at y = 0
    boxGeo.translate(0, 0.5, 0);

    const buildingMat = new THREE.MeshStandardMaterial({
      color: 0x121218,
      roughness: 0.4,
      metalness: 0.85
    });

    const instancedCity = new THREE.InstancedMesh(boxGeo, buildingMat, BUILDING_COUNT);
    const dummy = new THREE.Object3D();
    const buildingColors: THREE.Color[] = [];
    const goldColor = new THREE.Color(0xd4af37);
    const darkColor = new THREE.Color(0x181822);
    const cyanColor = new THREE.Color(0x0284c7);

    let bIdx = 0;
    const SPACING = 0.11;
    for (let gx = -GRID_SIZE / 2; gx < GRID_SIZE / 2; gx++) {
      for (let gz = -GRID_SIZE / 2; gz < GRID_SIZE / 2; gz++) {
        const distFromCenter = Math.sqrt(gx * gx + gz * gz);
        // Tall luxury skyscrapers in center (representing prime tech parks & high-rises)
        const heightScale = Math.max(0.15, (4.5 - distFromCenter * 0.45) * (0.4 + Math.random() * 0.8));
        
        dummy.position.set(gx * SPACING, 0, gz * SPACING);
        dummy.scale.set(1, heightScale * 0.4, 1);
        dummy.rotation.y = (Math.random() > 0.5 ? 0 : Math.PI / 2);
        dummy.updateMatrix();
        instancedCity.setMatrixAt(bIdx, dummy.matrix);

        // Highlight elite luxury buildings in Champagne Gold & Cyan
        const isLuxuryAsset = (distFromCenter < 2.5 && Math.random() > 0.4) || (gx === 0 && gz === 0);
        const col = isLuxuryAsset ? goldColor : Math.random() > 0.85 ? cyanColor : darkColor;
        instancedCity.setColorAt(bIdx, col);

        bIdx++;
      }
    }
    instancedCity.instanceMatrix.needsUpdate = true;
    if (instancedCity.instanceColor) instancedCity.instanceColor.needsUpdate = true;
    cityGroup.add(instancedCity);

    // Initial globe orientation centered on India towards camera
    globeGroup.rotation.y = 1.35;
    globeGroup.rotation.x = 0.25;

    // --- 4. ANIMATION LOOP & SCROLL CAMERA INTERPOLATION ---
    let animationFrameId: number;
    let clock = new THREE.Clock();

    const renderLoop = () => {
      const elapsedTime = clock.getElapsedTime();
      const currentScroll = smoothProgress.get(); // 0.0 to 1.0

      // Rotate globe gently when in orbital phases, stabilize as we zoom to street level
      const rotationSpeed = Math.max(0.0005, 0.003 * (1 - currentScroll * 1.1));
      globeGroup.rotation.y += rotationSpeed;

      // Animate Inward Particles
      const positions = particleGeo.attributes.position.array as Float32Array;
      for (let i = 0; i < PARTICLE_COUNT; i++) {
        positions[i * 3] += particleVelocities[i * 3];
        positions[i * 3 + 1] += particleVelocities[i * 3 + 1];
        positions[i * 3 + 2] += particleVelocities[i * 3 + 2];

        // Check distance from origin
        const px = positions[i * 3];
        const py = positions[i * 3 + 1];
        const pz = positions[i * 3 + 2];
        const dist = Math.sqrt(px * px + py * py + pz * pz);

        // Absorbed into globe surface
        if (dist < 6.5) {
          initParticle(i);
        }
      }
      particleGeo.attributes.position.needsUpdate = true;

      // 4-Phase Camera & Globe Transform Interpolation
      // Phase 1 (0.00 - 0.25): Orbital view, full globe, centered on India
      // Phase 2 (0.25 - 0.50): India Sub-continent Zoom
      // Phase 3 (0.50 - 0.75): Karnataka & South India Hotspots
      // Phase 4 (0.75 - 1.00): Bangalore Real Estate Grid (Street/Tower Level)

      if (currentScroll < 0.25) {
        // Phase 1
        const t = currentScroll / 0.25;
        camera.position.x = THREE.MathUtils.lerp(0, 1.2, t);
        camera.position.y = THREE.MathUtils.lerp(4.0, 3.2, t);
        camera.position.z = THREE.MathUtils.lerp(28, 21, t);
        camera.lookAt(0, 0, 0);

        // Full globe visible
        cityGroup.visible = false;
        wireLines.material.opacity = THREE.MathUtils.lerp(0.12, 0.20, t);
      } else if (currentScroll < 0.50) {
        // Phase 2: Zooming into India
        const t = (currentScroll - 0.25) / 0.25;
        camera.position.x = THREE.MathUtils.lerp(1.2, 2.5, t);
        camera.position.y = THREE.MathUtils.lerp(3.2, 2.0, t);
        camera.position.z = THREE.MathUtils.lerp(21, 13.5, t);
        
        // Orient towards Indian subcontinent coordinates
        const targetLook = new THREE.Vector3(1.2, 1.0, 0);
        camera.lookAt(targetLook);

        cityGroup.visible = false;
      } else if (currentScroll < 0.75) {
        // Phase 3: South India / Karnataka
        const t = (currentScroll - 0.50) / 0.25;
        camera.position.x = THREE.MathUtils.lerp(2.5, bglrTargetPos.x + 1.8, t);
        camera.position.y = THREE.MathUtils.lerp(2.0, bglrTargetPos.y + 1.2, t);
        camera.position.z = THREE.MathUtils.lerp(13.5, bglrTargetPos.z + 5.0, t);
        camera.lookAt(bglrTargetPos);

        cityGroup.visible = true;
        instancedCity.scale.setScalar(THREE.MathUtils.lerp(0.3, 1.0, t));
      } else {
        // Phase 4: Bangalore Real Estate Grid (Downtown/Tower level)
        const t = (currentScroll - 0.75) / 0.25;
        camera.position.x = THREE.MathUtils.lerp(bglrTargetPos.x + 1.8, bglrTargetPos.x + 0.6, t);
        camera.position.y = THREE.MathUtils.lerp(bglrTargetPos.y + 1.2, bglrTargetPos.y + 0.45, t);
        camera.position.z = THREE.MathUtils.lerp(bglrTargetPos.z + 5.0, bglrTargetPos.z + 1.4, t);
        
        const cityFocus = bglrTargetPos.clone().add(new THREE.Vector3(0, 0.2, 0));
        camera.lookAt(cityFocus);

        cityGroup.visible = true;
        instancedCity.scale.setScalar(1.0);

        // Pulse light on luxury buildings
        const pulse = 0.5 + 0.5 * Math.sin(elapsedTime * 3.5);
        goldPointLight.intensity = 3.5 + pulse * 2.0;
        goldPointLight.position.copy(bglrTargetPos).add(new THREE.Vector3(0, 1.5, 1));
      }

      renderer.render(scene, camera);
      animationFrameId = requestAnimationFrame(renderLoop);
    };

    animationFrameId = requestAnimationFrame(renderLoop);

    // --- RESIZE LISTENER ---
    const handleResize = () => {
      if (!container || !renderer) return;
      const width = container.clientWidth;
      const height = container.clientHeight;
      camera.aspect = width / height;
      camera.updateProjectionMatrix();
      renderer.setSize(width, height);
      renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    };

    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      cancelAnimationFrame(animationFrameId);
      renderer.dispose();
      sphereGeo.dispose();
      wireGeo.dispose();
      particleGeo.dispose();
      boxGeo.dispose();
    };
  }, [smoothProgress]);

  return (
    <div 
      ref={containerRef} 
      className="fixed inset-0 pointer-events-none z-0 overflow-hidden"
    >
      <canvas 
        ref={canvasRef} 
        className="w-full h-full block opacity-90 transition-opacity duration-700" 
      />
    </div>
  );
};

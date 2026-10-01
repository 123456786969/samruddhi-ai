import React, { useEffect, useRef } from 'react';
import * as THREE from 'three';

export const Earth3DBackground: React.FC = () => {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!containerRef.current) return;
    const container = containerRef.current;
    let animationFrameId: number;

    // --- 1. THREE.js SCENE & CAMERA SETUP ---
    const scene = new THREE.Scene();
    scene.fog = new THREE.FogExp2(0x010b08, 0.015);

    const camera = new THREE.PerspectiveCamera(
      45,
      window.innerWidth / window.innerHeight,
      0.1,
      1000
    );
    camera.position.set(0, 0, 9);

    const renderer = new THREE.WebGLRenderer({
      alpha: true,
      antialias: true,
      powerPreference: 'high-performance',
      precision: 'mediump'
    });
    renderer.setSize(window.innerWidth, window.innerHeight);
    // Cap pixel ratio to 1.5 to guarantee buttery 60-120fps across all GPUs without micro-stutter
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.5));
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.2;
    container.appendChild(renderer.domElement);

    // --- 2. HIGH-RES PROCEDURAL MAP TEXTURE GENERATOR ---
    const createEarthTexture = () => {
      const canvas = document.createElement('canvas');
      canvas.width = 2048;
      canvas.height = 1024;
      const ctx = canvas.getContext('2d');
      if (!ctx) return new THREE.CanvasTexture(canvas);

      // Deep dark tech space ocean background
      ctx.fillStyle = '#010c09';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Latitude / Longitude Tech Grid
      ctx.strokeStyle = 'rgba(0, 230, 118, 0.12)';
      ctx.lineWidth = 1;

      for (let x = 0; x < canvas.width; x += 64) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, canvas.height);
        ctx.stroke();
      }
      for (let y = 0; y < canvas.height; y += 64) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(canvas.width, y);
        ctx.stroke();
      }

      // Helper for continent landmasses
      const drawContinent = (cx: number, cy: number, rx: number, ry: number, color = 'rgba(0, 160, 120, 0.45)') => {
        ctx.fillStyle = color;
        ctx.beginPath();
        ctx.ellipse(cx, cy, rx, ry, 0, 0, Math.PI * 2);
        ctx.fill();
      };

      // World Continents
      drawContinent(1440, 360, 300, 180, 'rgba(0, 150, 110, 0.45)'); // Asia
      drawContinent(1120, 280, 140, 95, 'rgba(0, 140, 100, 0.4)');   // Europe
      drawContinent(1120, 490, 130, 190, 'rgba(0, 140, 100, 0.4)');  // Africa
      drawContinent(520, 320, 170, 150, 'rgba(0, 140, 100, 0.4)');   // N. America
      drawContinent(680, 580, 130, 190, 'rgba(0, 140, 100, 0.4)');   // S. America
      drawContinent(1720, 680, 120, 90, 'rgba(0, 140, 100, 0.4)');   // Australia

      // --- DETAILED HIGH-DEFINITION INDIA PENINSULA ---
      ctx.save();
      ctx.fillStyle = 'rgba(0, 200, 130, 0.85)';
      ctx.beginPath();
      // Northwest border (Gujarat / Rajasthan / Kashmir)
      ctx.moveTo(1395, 390);
      ctx.bezierCurveTo(1405, 340, 1435, 300, 1450, 290);
      // North & Himalayas
      ctx.lineTo(1510, 325);
      ctx.lineTo(1545, 360);
      // East coast down to Kanyakumari
      ctx.bezierCurveTo(1515, 415, 1480, 470, 1460, 515);
      // West coast back up
      ctx.bezierCurveTo(1438, 480, 1412, 440, 1400, 420);
      ctx.bezierCurveTo(1388, 400, 1390, 395, 1395, 390);
      ctx.closePath();
      ctx.fill();

      // Glowing Amber Radial Gradient over India
      const indiaGlow = ctx.createRadialGradient(1460, 420, 15, 1460, 420, 140);
      indiaGlow.addColorStop(0, 'rgba(255, 179, 0, 0.95)');
      indiaGlow.addColorStop(0.5, 'rgba(255, 140, 0, 0.55)');
      indiaGlow.addColorStop(1, 'rgba(0, 230, 118, 0)');
      ctx.fillStyle = indiaGlow;
      ctx.beginPath();
      ctx.arc(1460, 420, 140, 0, Math.PI * 2);
      ctx.fill();

      // Sharp Neon Emerald Border for India
      ctx.strokeStyle = '#00e676';
      ctx.lineWidth = 3;
      ctx.stroke();

      // Sri Lanka
      ctx.fillStyle = 'rgba(255, 179, 0, 0.9)';
      ctx.beginPath();
      ctx.ellipse(1472, 532, 10, 16, 0.2, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();

      // Tech Grid dots over land
      ctx.fillStyle = '#00e676';
      for (let i = 0; i < 600; i++) {
        const px = Math.random() * canvas.width;
        const py = Math.random() * canvas.height;
        ctx.beginPath();
        ctx.arc(px, py, 1.2, 0, Math.PI * 2);
        ctx.fill();
      }

      // --- MAJOR INDIAN REAL ESTATE METRO HUBS ---
      const indiaCities = [
        { name: 'BENGALURU', x: 1450, y: 475, core: true },
        { name: 'MUMBAI', x: 1412, y: 438, core: false },
        { name: 'DELHI-NCR', x: 1445, y: 355, core: false },
        { name: 'HYDERABAD', x: 1455, y: 445, core: false },
        { name: 'CHENNAI', x: 1465, y: 485, core: false },
        { name: 'KOLKATA', x: 1505, y: 412, core: false }
      ];

      indiaCities.forEach(city => {
        ctx.fillStyle = city.core ? '#ffffff' : '#ffb300';
        ctx.beginPath();
        ctx.arc(city.x, city.y, city.core ? 7 : 5.5, 0, Math.PI * 2);
        ctx.fill();

        ctx.strokeStyle = city.core ? '#ffb300' : '#00e676';
        ctx.lineWidth = 2.0;
        ctx.beginPath();
        ctx.arc(city.x, city.y, city.core ? 16 : 12, 0, Math.PI * 2);
        ctx.stroke();

        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 14px sans-serif';
        ctx.shadowColor = '#000000';
        ctx.shadowBlur = 5;
        ctx.fillText(city.name, city.x + 18, city.y + 5);
        ctx.shadowBlur = 0;
      });

      const texture = new THREE.CanvasTexture(canvas);
      texture.generateMipmaps = true;
      texture.minFilter = THREE.LinearMipmapLinearFilter;
      return texture;
    };

    const earthTexture = createEarthTexture();

    // --- 3. CREATING 3D GLOBE GROUP ---
    const globeGroup = new THREE.Group();
    scene.add(globeGroup);

    // Main Sphere
    const globeGeo = new THREE.SphereGeometry(3, 64, 64);
    const globeMat = new THREE.MeshStandardMaterial({
      map: earthTexture,
      roughness: 0.35,
      metalness: 0.3,
      emissive: new THREE.Color(0x002d24),
      emissiveIntensity: 0.75,
      transparent: true,
      opacity: 1.0
    });
    const globeMesh = new THREE.Mesh(globeGeo, globeMat);
    globeGroup.add(globeMesh);

    // Glowing Fibonacci Particle Constellation on Globe
    const globeParticleCount = 1400;
    const globeParticleGeo = new THREE.BufferGeometry();
    const globeParticlePositions = new Float32Array(globeParticleCount * 3);
    const globeParticleColors = new Float32Array(globeParticleCount * 3);

    const cEmerald = new THREE.Color(0x00e676);
    const cAmber = new THREE.Color(0xffb300);
    const cTeal = new THREE.Color(0x00bfa5);

    for (let i = 0; i < globeParticleCount; i++) {
      const phi = Math.acos(1 - 2 * (i + 0.5) / globeParticleCount);
      const theta = Math.PI * (1 + Math.sqrt(5)) * i;
      const r = 3.06;

      globeParticlePositions[i * 3] = r * Math.sin(phi) * Math.cos(theta);
      globeParticlePositions[i * 3 + 1] = r * Math.sin(phi) * Math.sin(theta);
      globeParticlePositions[i * 3 + 2] = r * Math.cos(phi);

      const color = i % 5 === 0 ? cAmber : (i % 2 === 0 ? cEmerald : cTeal);
      globeParticleColors[i * 3] = color.r;
      globeParticleColors[i * 3 + 1] = color.g;
      globeParticleColors[i * 3 + 2] = color.b;
    }

    globeParticleGeo.setAttribute('position', new THREE.BufferAttribute(globeParticlePositions, 3));
    globeParticleGeo.setAttribute('color', new THREE.BufferAttribute(globeParticleColors, 3));

    const globeParticleMat = new THREE.PointsMaterial({
      size: 0.08,
      vertexColors: true,
      transparent: true,
      opacity: 0.8,
      blending: THREE.AdditiveBlending
    });
    const globeParticlePoints = new THREE.Points(globeParticleGeo, globeParticleMat);
    globeGroup.add(globeParticlePoints);

    // Glowing Wireframe Outer Lattice
    const wireGeo = new THREE.SphereGeometry(3.08, 36, 36);
    const wireMat = new THREE.MeshBasicMaterial({
      color: 0x00e676,
      wireframe: true,
      transparent: true,
      opacity: 0.16
    });
    const wireMesh = new THREE.Mesh(wireGeo, wireMat);
    globeGroup.add(wireMesh);

    // Atmosphere Halo
    const atmosGeo = new THREE.SphereGeometry(3.28, 36, 36);
    const atmosMat = new THREE.MeshBasicMaterial({
      color: 0x00e676,
      side: THREE.BackSide,
      transparent: true,
      opacity: 0.22,
      blending: THREE.AdditiveBlending
    });
    const atmosMesh = new THREE.Mesh(atmosGeo, atmosMat);
    globeGroup.add(atmosMesh);

    // Two Glowing Orbital Rings
    const ringGeo1 = new THREE.RingGeometry(3.42, 3.46, 64);
    const ringMat1 = new THREE.MeshBasicMaterial({
      color: 0xffb300,
      side: THREE.DoubleSide,
      transparent: true,
      opacity: 0.45,
      blending: THREE.AdditiveBlending
    });
    const ringMesh1 = new THREE.Mesh(ringGeo1, ringMat1);
    ringMesh1.rotation.x = Math.PI / 2.3;
    globeGroup.add(ringMesh1);

    const ringGeo2 = new THREE.RingGeometry(3.7, 3.74, 64);
    const ringMat2 = new THREE.MeshBasicMaterial({
      color: 0x00e676,
      side: THREE.DoubleSide,
      transparent: true,
      opacity: 0.3,
      blending: THREE.AdditiveBlending
    });
    const ringMesh2 = new THREE.Mesh(ringGeo2, ringMat2);
    ringMesh2.rotation.x = Math.PI / 1.7;
    ringMesh2.rotation.y = 0.3;
    globeGroup.add(ringMesh2);

    // --- 3D FLIGHT ARCS BETWEEN INDIAN METROS ---
    const latLonToVector3 = (lat: number, lon: number, radius: number) => {
      const phi = (90 - lat) * (Math.PI / 180);
      const theta = (lon + 180) * (Math.PI / 180);
      return new THREE.Vector3(
        -radius * Math.sin(phi) * Math.cos(theta),
        radius * Math.cos(phi),
        radius * Math.sin(phi) * Math.sin(theta)
      );
    };

    const blr = latLonToVector3(12.97, 77.59, 3.03);
    const bom = latLonToVector3(19.07, 72.87, 3.03);
    const del = latLonToVector3(28.61, 77.20, 3.03);
    const hyd = latLonToVector3(17.38, 78.48, 3.03);
    const maa = latLonToVector3(13.08, 80.27, 3.03);

    const create3DArc = (v1: THREE.Vector3, v2: THREE.Vector3, colorHex: number) => {
      const mid = v1.clone().add(v2).multiplyScalar(0.5);
      const dist = v1.distanceTo(v2);
      mid.normalize().multiplyScalar(3.03 + dist * 0.25);

      const curve = new THREE.QuadraticBezierCurve3(v1, mid, v2);
      const points = curve.getPoints(36);
      const arcGeo = new THREE.BufferGeometry().setFromPoints(points);
      const arcMat = new THREE.LineBasicMaterial({
        color: colorHex,
        transparent: true,
        opacity: 0.85
      });
      return new THREE.Line(arcGeo, arcMat);
    };

    globeGroup.add(create3DArc(blr, bom, 0xffb300));
    globeGroup.add(create3DArc(blr, del, 0x00e676));
    globeGroup.add(create3DArc(blr, hyd, 0xffb300));
    globeGroup.add(create3DArc(blr, maa, 0x00e676));
    globeGroup.add(create3DArc(bom, del, 0x00e676));

    // Target rotation angles for India (x = 1450, y = 430)
    const TARGET_INDIA_Y = -1.33;
    const TARGET_INDIA_X = 0.28;

    globeGroup.rotation.y = TARGET_INDIA_Y;
    globeGroup.rotation.x = TARGET_INDIA_X;

    // --- 4. OPTIMIZED INSTANCED 3D URBAN CITY SKYLINE ---
    const cityGroup = new THREE.Group();
    cityGroup.position.set(0, -30, 0);
    scene.add(cityGroup);

    // City Floor Grid
    const gridHelper = new THREE.GridHelper(50, 30, 0x00e676, 0x003d33);
    gridHelper.position.y = -2;
    (gridHelper.material as THREE.Material).transparent = true;
    (gridHelper.material as THREE.Material).opacity = 0.35;
    cityGroup.add(gridHelper);

    // Instanced Mesh for Buildings (Massive performance boost vs individual meshes)
    const buildingCount = 60;
    const buildingGeo = new THREE.BoxGeometry(1, 1, 1);
    const buildingMat = new THREE.MeshStandardMaterial({
      color: 0x004d40,
      emissive: new THREE.Color(0x00382d),
      emissiveIntensity: 0.6,
      roughness: 0.3,
      metalness: 0.8,
      transparent: true,
      opacity: 0.95
    });

    const instancedBuildings = new THREE.InstancedMesh(buildingGeo, buildingMat, buildingCount);
    const dummy = new THREE.Object3D();

    for (let i = 0; i < buildingCount; i++) {
      const height = (Math.sin(i * 1.7) * 0.5 + 0.5) * 8 + 3;
      const width = ((i % 5) * 0.15) + 0.8;
      const depth = ((i % 4) * 0.18) + 0.8;
      const px = ((i % 8) - 4) * 4 + (Math.cos(i) * 1.5);
      const pz = (Math.floor(i / 8) - 4) * 4 + (Math.sin(i) * 1.5);

      dummy.position.set(px, height / 2 - 2, pz);
      dummy.scale.set(width, height, depth);
      dummy.updateMatrix();
      instancedBuildings.setMatrixAt(i, dummy.matrix);

      // Color accents on key towers
      if (i % 4 === 0) {
        instancedBuildings.setColorAt(i, new THREE.Color(0xffb300));
      } else if (i % 2 === 0) {
        instancedBuildings.setColorAt(i, new THREE.Color(0x00e676));
      } else {
        instancedBuildings.setColorAt(i, new THREE.Color(0x004d40));
      }
    }
    instancedBuildings.instanceMatrix.needsUpdate = true;
    if (instancedBuildings.instanceColor) instancedBuildings.instanceColor.needsUpdate = true;
    cityGroup.add(instancedBuildings);

    // --- 5. DATA PARTICLES COSMOS ---
    const particleCount = 450;
    const particleGeo = new THREE.BufferGeometry();
    const particlePositions = new Float32Array(particleCount * 3);

    for (let i = 0; i < particleCount * 3; i += 3) {
      particlePositions[i] = (Math.random() - 0.5) * 50;
      particlePositions[i + 1] = (Math.random() - 0.5) * 50;
      particlePositions[i + 2] = (Math.random() - 0.5) * 50;
    }

    particleGeo.setAttribute('position', new THREE.BufferAttribute(particlePositions, 3));
    const particleMat = new THREE.PointsMaterial({
      color: 0x00e676,
      size: 0.1,
      transparent: true,
      opacity: 0.6,
      blending: THREE.AdditiveBlending
    });
    const particleSystem = new THREE.Points(particleGeo, particleMat);
    scene.add(particleSystem);

    // --- 6. LIGHTING ---
    const ambientLight = new THREE.AmbientLight(0xffffff, 1.2);
    scene.add(ambientLight);

    const dirLight1 = new THREE.DirectionalLight(0xffb300, 2.2);
    dirLight1.position.set(12, 12, 12);
    scene.add(dirLight1);

    const dirLight2 = new THREE.DirectionalLight(0x00e676, 1.8);
    dirLight2.position.set(-12, -10, -12);
    scene.add(dirLight2);

    // --- 7. ULTRA-SMOOTH HARDWARE-SYNCED SCROLL & PARALLAX ---
    let targetScrollProgress = 0;
    let currentScrollProgress = 0;
    let targetMouseX = 0;
    let targetMouseY = 0;
    let currentMouseX = 0;
    let currentMouseY = 0;

    const updateScrollTarget = () => {
      const scrollY = window.scrollY || window.pageYOffset;
      const total = document.documentElement.scrollHeight - window.innerHeight;
      if (total > 0) {
        targetScrollProgress = Math.min(1, Math.max(0, scrollY / total));
      } else {
        targetScrollProgress = 0;
      }
    };

    const onScroll = () => {
      updateScrollTarget();
    };

    const onMouseMove = (e: MouseEvent) => {
      targetMouseX = (e.clientX / window.innerWidth - 0.5) * 2;
      targetMouseY = (e.clientY / window.innerHeight - 0.5) * 2;
    };

    const onResize = () => {
      camera.aspect = window.innerWidth / window.innerHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(window.innerWidth, window.innerHeight);
      renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.5));
      updateScrollTarget();
    };

    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('mousemove', onMouseMove, { passive: true });
    window.addEventListener('resize', onResize);
    updateScrollTarget();

    // --- 8. SILKY 60FPS RAF RENDER LOOP WITH SPRING DAMPING ---
    const clock = new THREE.Clock();

    const animate = () => {
      animationFrameId = requestAnimationFrame(animate);
      const delta = Math.min(clock.getDelta(), 0.1);
      const elapsedTime = clock.getElapsedTime();

      // Fluid Spring Lerp: Adapts with framerate delta to guarantee zero hitching
      const lerpSpeed = 1.0 - Math.exp(-9.0 * delta);
      currentScrollProgress += (targetScrollProgress - currentScrollProgress) * lerpSpeed;

      const mouseLerp = 1.0 - Math.exp(-6.0 * delta);
      currentMouseX += (targetMouseX - currentMouseX) * mouseLerp;
      currentMouseY += (targetMouseY - currentMouseY) * mouseLerp;

      // Ambient celestial rotations
      wireMesh.rotation.y = -elapsedTime * 0.04;
      ringMesh1.rotation.z = elapsedTime * 0.07;
      ringMesh2.rotation.z = -elapsedTime * 0.05;
      globeParticlePoints.rotation.y = elapsedTime * 0.03;
      particleSystem.rotation.y = elapsedTime * 0.015;

      let baseCamX = 0;
      let baseCamY = 0;
      let baseCamZ = 9.0;

      // STAGE 1: Outer Space Orbit -> India Focus (0.0 to 0.35)
      // STAGE 2: Atmosphere Entry & Telemetry Zoom (0.35 to 0.70)
      // STAGE 3: Smooth Flight into Smart City Cyberpunk Skyline (0.70 to 1.0)

      if (currentScrollProgress <= 0.35) {
        const p = currentScrollProgress / 0.35; // 0 to 1

        baseCamZ = THREE.MathUtils.lerp(9.0, 4.4, p);
        baseCamY = THREE.MathUtils.lerp(0.0, 0.25, p);
        baseCamX = THREE.MathUtils.lerp(0.0, -0.18, p);

        // Gentle idle orbital breathe
        const idleSpin = (1 - p) * Math.sin(elapsedTime * 0.25) * 0.08;
        globeGroup.rotation.y = THREE.MathUtils.lerp(TARGET_INDIA_Y + idleSpin, TARGET_INDIA_Y, p);
        globeGroup.rotation.x = THREE.MathUtils.lerp(0.22, TARGET_INDIA_X, p);

        globeGroup.position.set(0, 0, 0);
        globeGroup.scale.set(1, 1, 1);
        globeMat.opacity = 1.0;
        wireMat.opacity = 0.16;
        atmosMat.opacity = 0.22;
        ringMat1.opacity = 0.45;
        ringMat2.opacity = 0.3;

        cityGroup.position.y = -35;
        cityGroup.visible = false;
        globeGroup.visible = true;

      } else if (currentScrollProgress <= 0.70) {
        const p = (currentScrollProgress - 0.35) / 0.35; // 0 to 1
        cityGroup.visible = true;
        globeGroup.visible = true;

        baseCamZ = THREE.MathUtils.lerp(4.4, 2.4, p);
        baseCamY = THREE.MathUtils.lerp(0.25, 0.1, p);
        baseCamX = THREE.MathUtils.lerp(-0.18, 0.0, p);

        const globeScale = THREE.MathUtils.lerp(1.0, 2.4, p);
        globeGroup.scale.set(globeScale, globeScale, globeScale);
        globeGroup.position.y = THREE.MathUtils.lerp(0, -1.6, p);
        globeGroup.rotation.y = TARGET_INDIA_Y;
        globeGroup.rotation.x = TARGET_INDIA_X;

        // Smooth crossfade into urban horizon
        const fadeStart = 0.35;
        if (p > fadeStart) {
          const fadeP = (p - fadeStart) / (1 - fadeStart);
          const opacity = THREE.MathUtils.lerp(1.0, 0.0, fadeP);
          globeMat.opacity = opacity;
          wireMat.opacity = opacity * 0.16;
          atmosMat.opacity = opacity * 0.22;
          ringMat1.opacity = opacity * 0.45;
          ringMat2.opacity = opacity * 0.3;
          globeParticleMat.opacity = opacity * 0.8;
        } else {
          globeMat.opacity = 1.0;
          wireMat.opacity = 0.16;
          atmosMat.opacity = 0.22;
          ringMat1.opacity = 0.45;
          ringMat2.opacity = 0.3;
          globeParticleMat.opacity = 0.8;
        }

        cityGroup.position.y = THREE.MathUtils.lerp(-18, -1.0, p);

      } else {
        const p = (currentScrollProgress - 0.70) / 0.30; // 0 to 1
        globeGroup.visible = false;
        cityGroup.visible = true;

        baseCamZ = THREE.MathUtils.lerp(2.4, 5.6, p);
        baseCamY = THREE.MathUtils.lerp(0.1, 1.4, p);
        baseCamX = THREE.MathUtils.lerp(0.0, 0.15, p);

        cityGroup.position.y = -1.0;
        cityGroup.rotation.y = elapsedTime * 0.05 + p * Math.PI * 0.2;
      }

      // Parallax smooth lookAt
      camera.position.x = baseCamX + currentMouseX * 0.25;
      camera.position.y = baseCamY - currentMouseY * 0.2;
      camera.position.z = baseCamZ;
      camera.lookAt(0, 0, 0);

      renderer.render(scene, camera);
    };

    animate();

    return () => {
      cancelAnimationFrame(animationFrameId);
      window.removeEventListener('scroll', onScroll);
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('resize', onResize);

      if (container.contains(renderer.domElement)) {
        container.removeChild(renderer.domElement);
      }
      renderer.dispose();
      globeGeo.dispose();
      globeMat.dispose();
      earthTexture.dispose();
      globeParticleGeo.dispose();
      globeParticleMat.dispose();
      wireGeo.dispose();
      wireMat.dispose();
      atmosGeo.dispose();
      atmosMat.dispose();
      ringGeo1.dispose();
      ringMat1.dispose();
      ringGeo2.dispose();
      ringMat2.dispose();
      buildingGeo.dispose();
      buildingMat.dispose();
      instancedBuildings.dispose();
      particleGeo.dispose();
      particleMat.dispose();
    };
  }, []);

  return (
    <div
      ref={containerRef}
      className="fixed inset-0 pointer-events-none z-0 overflow-hidden"
      style={{
        background: 'radial-gradient(circle at 50% 35%, rgba(0, 50, 40, 0.3) 0%, rgba(1, 11, 8, 0.98) 100%)',
        willChange: 'transform'
      }}
    />
  );
};

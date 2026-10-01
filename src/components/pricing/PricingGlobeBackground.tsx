import React, { useEffect, useRef } from 'react';
import * as THREE from 'three';

export const PricingGlobeBackground: React.FC = () => {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!containerRef.current) return;

    const container = containerRef.current;
    let animationFrameId: number;

    // --- 1. THREE.js SCENE & CAMERA SETUP ---
    const scene = new THREE.Scene();
    scene.fog = new THREE.FogExp2(0x05080f, 0.015);

    const camera = new THREE.PerspectiveCamera(
      45,
      window.innerWidth / window.innerHeight,
      0.1,
      1000
    );
    camera.position.set(0, 0, 11);

    const renderer = new THREE.WebGLRenderer({
      alpha: true,
      antialias: true,
      powerPreference: 'high-performance'
    });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.2;
    container.appendChild(renderer.domElement);

    // --- 2. 3D GLOWING EMERALD GLOBE SPHERE GROUP ---
    const globeGroup = new THREE.Group();
    scene.add(globeGroup);

    // Outer Neon Particle Mesh Globe
    const globeRadius = 3.6;
    const particleCount = 1800;
    const globeParticleGeo = new THREE.BufferGeometry();
    const positions = new Float32Array(particleCount * 3);
    const colors = new Float32Array(particleCount * 3);

    const color1 = new THREE.Color(0x10b981); // Emerald 500
    const color2 = new THREE.Color(0x059669); // Emerald 600
    const color3 = new THREE.Color(0x34d399); // Emerald 400
    const colorGold = new THREE.Color(0xf59e0b); // Amber 500

    for (let i = 0; i < particleCount; i++) {
      // Fibonacci sphere distribution for uniform glowing mesh
      const phi = Math.acos(1 - 2 * (i + 0.5) / particleCount);
      const theta = Math.PI * (1 + Math.sqrt(5)) * i;

      const x = globeRadius * Math.sin(phi) * Math.cos(theta);
      const y = globeRadius * Math.sin(phi) * Math.sin(theta);
      const z = globeRadius * Math.cos(phi);

      positions[i * 3] = x;
      positions[i * 3 + 1] = y;
      positions[i * 3 + 2] = z;

      // Color variation
      let c = color1;
      if (i % 7 === 0) c = colorGold;
      else if (i % 3 === 0) c = color3;
      else if (i % 2 === 0) c = color2;

      colors[i * 3] = c.r;
      colors[i * 3 + 1] = c.g;
      colors[i * 3 + 2] = c.b;
    }

    globeParticleGeo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    globeParticleGeo.setAttribute('color', new THREE.BufferAttribute(colors, 3));

    const globeParticleMat = new THREE.PointsMaterial({
      size: 0.12,
      vertexColors: true,
      transparent: true,
      opacity: 0.75,
      blending: THREE.AdditiveBlending
    });

    const globePoints = new THREE.Points(globeParticleGeo, globeParticleMat);
    globeGroup.add(globePoints);

    // Glowing Wireframe Globe
    const wireGeo = new THREE.SphereGeometry(globeRadius, 28, 28);
    const wireMat = new THREE.MeshBasicMaterial({
      color: 0x059669,
      wireframe: true,
      transparent: true,
      opacity: 0.12
    });
    const wireMesh = new THREE.Mesh(wireGeo, wireMat);
    globeGroup.add(wireMesh);

    // Pulsing Core Sphere
    const coreGeo = new THREE.SphereGeometry(globeRadius * 0.94, 32, 32);
    const coreMat = new THREE.MeshStandardMaterial({
      color: 0x021f18,
      emissive: new THREE.Color(0x064e3b),
      emissiveIntensity: 0.8,
      roughness: 0.4,
      metalness: 0.8,
      transparent: true,
      opacity: 0.6
    });
    const coreMesh = new THREE.Mesh(coreGeo, coreMat);
    globeGroup.add(coreMesh);

    // Two Orbital Glowing Equatorial Rings
    const ringGeo1 = new THREE.RingGeometry(4.2, 4.28, 64);
    const ringMat1 = new THREE.MeshBasicMaterial({
      color: 0x10b981,
      side: THREE.DoubleSide,
      transparent: true,
      opacity: 0.4,
      blending: THREE.AdditiveBlending
    });
    const ring1 = new THREE.Mesh(ringGeo1, ringMat1);
    ring1.rotation.x = Math.PI / 2.3;
    ring1.rotation.y = 0.2;
    globeGroup.add(ring1);

    const ringGeo2 = new THREE.RingGeometry(4.6, 4.65, 64);
    const ringMat2 = new THREE.MeshBasicMaterial({
      color: 0xf59e0b,
      side: THREE.DoubleSide,
      transparent: true,
      opacity: 0.3,
      blending: THREE.AdditiveBlending
    });
    const ring2 = new THREE.Mesh(ringGeo2, ringMat2);
    ring2.rotation.x = Math.PI / 1.7;
    ring2.rotation.z = -0.4;
    globeGroup.add(ring2);

    // --- 3. FUTURISTIC PARTICLE MESH GRID BACKGROUND ---
    const gridCount = 1200;
    const gridGeo = new THREE.BufferGeometry();
    const gridPos = new Float32Array(gridCount * 3);

    for (let i = 0; i < gridCount * 3; i += 3) {
      gridPos[i] = (Math.random() - 0.5) * 50;
      gridPos[i + 1] = (Math.random() - 0.5) * 35;
      gridPos[i + 2] = (Math.random() - 0.5) * 35 - 5;
    }

    gridGeo.setAttribute('position', new THREE.BufferAttribute(gridPos, 3));
    const gridMat = new THREE.PointsMaterial({
      color: 0x10b981,
      size: 0.08,
      transparent: true,
      opacity: 0.4,
      blending: THREE.AdditiveBlending
    });
    const backgroundStars = new THREE.Points(gridGeo, gridMat);
    scene.add(backgroundStars);

    // Floor Mesh Plane Grid
    const floorGrid = new THREE.GridHelper(50, 40, 0x10b981, 0x064e3b);
    floorGrid.position.y = -6;
    floorGrid.material.transparent = true;
    floorGrid.material.opacity = 0.25;
    scene.add(floorGrid);

    // --- 4. LIGHTING ---
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.8);
    scene.add(ambientLight);

    const pointLightEmerald = new THREE.PointLight(0x10b981, 3.5, 30);
    pointLightEmerald.position.set(0, 0, 5);
    scene.add(pointLightEmerald);

    const pointLightAmber = new THREE.PointLight(0xf59e0b, 2.0, 25);
    pointLightAmber.position.set(6, 4, 3);
    scene.add(pointLightAmber);

    // --- 5. INTERACTIVE MOUSE PARALLAX & ANIMATION ---
    let mouseX = 0;
    let mouseY = 0;
    let targetMouseX = 0;
    let targetMouseY = 0;

    const handleMouseMove = (e: MouseEvent) => {
      targetMouseX = (e.clientX / window.innerWidth - 0.5) * 2;
      targetMouseY = (e.clientY / window.innerHeight - 0.5) * 2;
    };

    const handleResize = () => {
      camera.aspect = window.innerWidth / window.innerHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(window.innerWidth, window.innerHeight);
    };

    window.addEventListener('mousemove', handleMouseMove, { passive: true });
    window.addEventListener('resize', handleResize);

    const clock = new THREE.Clock();

    const animate = () => {
      animationFrameId = requestAnimationFrame(animate);
      const elapsedTime = clock.getElapsedTime();

      // Smooth mouse lerp
      mouseX += (targetMouseX - mouseX) * 0.05;
      mouseY += (targetMouseY - mouseY) * 0.05;

      // Rotate Globe & Rings
      globeGroup.rotation.y = elapsedTime * 0.08;
      globeGroup.rotation.x = Math.sin(elapsedTime * 0.15) * 0.1 + mouseY * 0.2;
      globeGroup.rotation.z = mouseX * 0.15;

      ring1.rotation.z = elapsedTime * 0.12;
      ring2.rotation.z = -elapsedTime * 0.09;

      // Gentle floating pulse
      globeGroup.position.y = Math.sin(elapsedTime * 0.8) * 0.2;

      // Ambient background particles drift
      backgroundStars.rotation.y = elapsedTime * 0.015;
      floorGrid.position.z = (elapsedTime * 0.8) % 1.25 - 6;

      // Parallax camera
      camera.position.x = mouseX * 0.5;
      camera.position.y = -mouseY * 0.35;
      camera.lookAt(0, 0, 0);

      renderer.render(scene, camera);
    };

    animate();

    return () => {
      cancelAnimationFrame(animationFrameId);
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('resize', handleResize);

      if (container.contains(renderer.domElement)) {
        container.removeChild(renderer.domElement);
      }
      renderer.dispose();
      globeParticleGeo.dispose();
      globeParticleMat.dispose();
      wireGeo.dispose();
      wireMat.dispose();
      coreGeo.dispose();
      coreMat.dispose();
      ringGeo1.dispose();
      ringMat1.dispose();
      ringGeo2.dispose();
      ringMat2.dispose();
      gridGeo.dispose();
      gridMat.dispose();
    };
  }, []);

  return (
    <div
      ref={containerRef}
      className="fixed inset-0 pointer-events-none z-0 overflow-hidden"
      style={{
        background: 'radial-gradient(circle at 50% 30%, #081a17 0%, #050d18 55%, #05080f 100%)'
      }}
    />
  );
};

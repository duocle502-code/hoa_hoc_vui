import React, { useEffect, useRef, useCallback } from 'react';
import * as THREE from 'three';
import { ApparatusType } from '../types';

export interface ReactionEffect {
  color: string;
  bubbles: boolean;
  precipitate: boolean;
  message: string;
}

interface LabCanvasProps {
  activeExperiment?: string;
  customReaction?: ReactionEffect | null;
  apparatusType?: ApparatusType;
  isHeating?: boolean;
  onReaction?: (data: any) => void;
}

export const LabCanvas: React.FC<LabCanvasProps> = ({
  activeExperiment,
  customReaction,
  apparatusType = 'beaker',
  isHeating = false,
  onReaction,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);

  const sceneRef = useRef<{
    scene: THREE.Scene;
    camera: THREE.PerspectiveCamera;
    renderer: THREE.WebGLRenderer;
    apparatus: THREE.Group;
    liquid: THREE.Mesh;
    bubbles: THREE.Group;
    sparks: THREE.Points;
    flame: THREE.Group;
    flameCore: THREE.Mesh;
    flameMid: THREE.Mesh;
    flameTip: THREE.Mesh;
    flameGlow: THREE.Mesh;
    table: THREE.Mesh;
    labFrame: THREE.Group;
    clock: THREE.Clock;
    mouse: THREE.Vector2;
    animFrame: number;
  } | null>(null);

  // ── Intro orbit: gentle auto-rotate ───────────────────────────────────────
  const isDragging = useRef(false);
  const lastMouse  = useRef({ x: 0, y: 0 });
  const cameraAngle = useRef({ theta: 0, phi: Math.PI / 6 });

  const createBubbles = useCallback((count: number, radius: number) => {
    if (!sceneRef.current) return;
    const { bubbles } = sceneRef.current;
    bubbles.clear();
    for (let i = 0; i < count; i++) {
      const r = 0.04 + Math.random() * 0.04;
      const geo = new THREE.SphereGeometry(r, 8, 8);
      const mat = new THREE.MeshPhysicalMaterial({
        color: 0xffffff,
        transparent: true,
        opacity: 0.35 + Math.random() * 0.2,
        roughness: 0,
        metalness: 0,
        transmission: 0.9,
        thickness: 0.3,
      });
      const mesh = new THREE.Mesh(geo, mat);
      mesh.position.set(
        (Math.random() - 0.5) * radius * 2,
        -0.9 + Math.random() * 0.6,
        (Math.random() - 0.5) * radius * 2
      );
      (mesh as any).__speed = 0.007 + Math.random() * 0.013;
      (mesh as any).__wobble = Math.random() * Math.PI * 2;
      bubbles.add(mesh);
    }
  }, []);

  useEffect(() => {
    if (!containerRef.current) return;
    const container = containerRef.current;
    const W = container.clientWidth;
    const H = container.clientHeight;

    // ── Scene ──────────────────────────────────────────────────────────────
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x060b18);
    scene.fog = new THREE.FogExp2(0x060b18, 0.055);

    // ── Camera ─────────────────────────────────────────────────────────────
    const camera = new THREE.PerspectiveCamera(55, W / H, 0.1, 200);
    camera.position.set(0, 2.8, 7.5);
    camera.lookAt(0, 0, 0);

    // ── Renderer ───────────────────────────────────────────────────────────
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false });
    renderer.setSize(W, H);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.4;
    container.appendChild(renderer.domElement);

    // ── Lights ─────────────────────────────────────────────────────────────
    const ambientLight = new THREE.AmbientLight(0x1a2540, 2.0);
    scene.add(ambientLight);

    // Key light — cool blue from top-left
    const keyLight = new THREE.DirectionalLight(0x88c0f8, 2.5);
    keyLight.position.set(-4, 8, 5);
    keyLight.castShadow = true;
    keyLight.shadow.mapSize.width = 2048;
    keyLight.shadow.mapSize.height = 2048;
    keyLight.shadow.camera.near = 0.5;
    keyLight.shadow.camera.far = 50;
    keyLight.shadow.camera.left = -10;
    keyLight.shadow.camera.right = 10;
    keyLight.shadow.camera.top = 10;
    keyLight.shadow.camera.bottom = -10;
    scene.add(keyLight);

    // Fill light — warm violet from right
    const fillLight = new THREE.DirectionalLight(0xc084fc, 1.2);
    fillLight.position.set(5, 4, -3);
    scene.add(fillLight);

    // Rim light — cyan backlight
    const rimLight = new THREE.DirectionalLight(0x22d3ee, 0.8);
    rimLight.position.set(0, -2, -6);
    scene.add(rimLight);

    // Neon point light underneath apparatus
    const neonGlow = new THREE.PointLight(0x7c3aed, 2.5, 5);
    neonGlow.position.set(0, -1.2, 0);
    scene.add(neonGlow);

    // ── Lab Table ──────────────────────────────────────────────────────────
    const tableGeo = new THREE.BoxGeometry(10, 0.18, 6);
    const tableMat = new THREE.MeshPhysicalMaterial({
      color: 0x111827,
      roughness: 0.15,
      metalness: 0.05,
      envMapIntensity: 1.0,
    });
    const table = new THREE.Mesh(tableGeo, tableMat);
    table.position.y = -1.7;
    table.receiveShadow = true;
    scene.add(table);

    // Table edge neon strip
    const edgeGeo = new THREE.BoxGeometry(10, 0.04, 0.04);
    const edgeMat = new THREE.MeshBasicMaterial({ color: 0x7c3aed });
    const edgeFront = new THREE.Mesh(edgeGeo, edgeMat);
    edgeFront.position.set(0, -1.61, 3);
    scene.add(edgeFront);
    const edgeBack = new THREE.Mesh(edgeGeo, edgeMat.clone());
    (edgeBack.material as THREE.MeshBasicMaterial).color.set(0x22d3ee);
    edgeBack.position.set(0, -1.61, -3);
    scene.add(edgeBack);

    // ── Grid Floor  ────────────────────────────────────────────────────────
    const gridHelper = new THREE.GridHelper(20, 30, 0x7c3aed, 0x1e293b);
    gridHelper.position.y = -2.5;
    scene.add(gridHelper);

    // ── Lab Frame / Back Wall ──────────────────────────────────────────────
    const labFrame = new THREE.Group();
    scene.add(labFrame);

    // Back wall
    const wallGeo = new THREE.PlaneGeometry(16, 9);
    const wallMat = new THREE.MeshPhysicalMaterial({
      color: 0x0d1424,
      roughness: 0.9,
      metalness: 0.1,
    });
    const wall = new THREE.Mesh(wallGeo, wallMat);
    wall.position.z = -5;
    wall.receiveShadow = true;
    labFrame.add(wall);

    // Wall neon lines (horizontal strips)
    [0.5, -0.5, 1.5, -1.5].forEach((y, i) => {
      const stripGeo = new THREE.BoxGeometry(14, 0.025, 0.01);
      const colors = [0x7c3aed, 0x22d3ee, 0x7c3aed, 0x22d3ee];
      const stripMat = new THREE.MeshBasicMaterial({ color: colors[i], transparent: true, opacity: 0.6 });
      const strip = new THREE.Mesh(stripGeo, stripMat);
      strip.position.set(0, y * 2.2, -4.98);
      scene.add(strip);
    });

    // ── Apparatus Group ────────────────────────────────────────────────────
    const apparatusGroup = new THREE.Group();
    scene.add(apparatusGroup);

    // Glass material — PBR physical
    const glassMat = new THREE.MeshPhysicalMaterial({
      color: 0xddeeff,
      transparent: true,
      opacity: 0.22,
      roughness: 0.0,
      metalness: 0.0,
      transmission: 0.96,
      thickness: 0.4,
      ior: 1.5,
      side: THREE.DoubleSide,
      envMapIntensity: 2.0,
    });

    // ── Liquid ─────────────────────────────────────────────────────────────
    const liquidMat = new THREE.MeshPhysicalMaterial({
      color: 0x4A90E2,
      transparent: true,
      opacity: 0.82,
      roughness: 0.05,
      metalness: 0.0,
      transmission: 0.2,
    });
    const liquid = new THREE.Mesh(new THREE.BufferGeometry(), liquidMat);
    scene.add(liquid);

    // ── Sparks / Particle System ────────────────────────────────────────────
    const sparkCount = 120;
    const sparkPos = new Float32Array(sparkCount * 3);
    for (let i = 0; i < sparkCount; i++) {
      sparkPos[i * 3]     = (Math.random() - 0.5) * 12;
      sparkPos[i * 3 + 1] = (Math.random() - 0.5) * 6 - 1;
      sparkPos[i * 3 + 2] = (Math.random() - 0.5) * 6 - 2;
    }
    const sparkGeo = new THREE.BufferGeometry();
    sparkGeo.setAttribute('position', new THREE.BufferAttribute(sparkPos, 3));
    const sparkMat = new THREE.PointsMaterial({
      color: 0x7c3aed, size: 0.035, transparent: true, opacity: 0.5, sizeAttenuation: true
    });
    const sparks = new THREE.Points(sparkGeo, sparkMat);
    scene.add(sparks);

    // ── Bubble Group ───────────────────────────────────────────────────────
    const bubbles = new THREE.Group();
    scene.add(bubbles);

    // ── Alcohol Lamp ───────────────────────────────────────────────────────
    const burnerGroup = new THREE.Group();
    burnerGroup.position.set(0, -1.62, 0);
    scene.add(burnerGroup);

    // Body (glass jar)
    const bodyGeo = new THREE.CylinderGeometry(0.28, 0.35, 0.7, 32);
    const bodyMat = new THREE.MeshPhysicalMaterial({
      color: 0xb3c8e8,
      transparent: true, opacity: 0.35, roughness: 0, transmission: 0.8, ior: 1.5
    });
    burnerGroup.add(new THREE.Mesh(bodyGeo, bodyMat));

    // Neck
    const neckGeo = new THREE.CylinderGeometry(0.08, 0.12, 0.18, 16);
    const neckMat = new THREE.MeshPhysicalMaterial({ color: 0x888888, roughness: 0.4, metalness: 0.5 });
    const neck = new THREE.Mesh(neckGeo, neckMat);
    neck.position.y = 0.44;
    burnerGroup.add(neck);

    // Base plate
    const basePlateGeo = new THREE.CylinderGeometry(0.38, 0.38, 0.04, 32);
    const basePlateMat = new THREE.MeshPhysicalMaterial({ color: 0x334155, roughness: 0.3, metalness: 0.7 });
    const basePlate = new THREE.Mesh(basePlateGeo, basePlateMat);
    basePlate.position.y = -0.37;
    burnerGroup.add(basePlate);

    // ── Flame (3 cone layers + glow disc) ─────────────────────────────────
    const flameGroup = new THREE.Group();
    flameGroup.position.set(0, -1.62 + 0.56, 0);
    scene.add(flameGroup);

    const makeFlame = (rTop: number, rBot: number, h: number, color: number, opacity: number) => {
      const geo = new THREE.ConeGeometry(rTop, h, 32);
      const mat = new THREE.MeshBasicMaterial({ color, transparent: true, opacity, depthWrite: false });
      const mesh = new THREE.Mesh(geo, mat);
      return mesh;
    };

    const flameOuter = makeFlame(0.0, 0.16, 0.65, 0xff4500, 0.65);
    const flameMid   = makeFlame(0.0, 0.10, 0.48, 0xff8c00, 0.78);
    const flameCore  = makeFlame(0.0, 0.055, 0.3, 0xffff66, 0.92);
    flameOuter.position.y = 0.32;
    flameMid.position.y   = 0.24;
    flameCore.position.y  = 0.15;

    // Glow disc below flame
    const glowGeo = new THREE.CircleGeometry(0.5, 32);
    const glowMat = new THREE.MeshBasicMaterial({
      color: 0xff5500, transparent: true, opacity: 0.18, side: THREE.DoubleSide, depthWrite: false
    });
    const flameGlow = new THREE.Mesh(glowGeo, glowMat);
    flameGlow.rotation.x = -Math.PI / 2;
    flameGlow.position.y = 0;

    flameGroup.add(flameOuter, flameMid, flameCore, flameGlow);
    flameGroup.visible = false;

    // ── Assemble scene refs ────────────────────────────────────────────────
    const clock = new THREE.Clock();
    const mouse = new THREE.Vector2();

    sceneRef.current = {
      scene, camera, renderer,
      apparatus: apparatusGroup,
      liquid, bubbles, sparks,
      flame: flameGroup,
      flameCore, flameMid,
      flameTip: flameOuter,
      flameGlow,
      table, labFrame,
      clock, mouse,
      animFrame: 0,
    };

    // ── Build apparatus geometry ───────────────────────────────────────────
    buildApparatus(apparatusGroup, glassMat, liquid, liquidMat, apparatusType);

    // ── Animation Loop ─────────────────────────────────────────────────────
    const animate = () => {
      if (!sceneRef.current) return;
      sceneRef.current.animFrame = requestAnimationFrame(animate);
      const t = clock.getElapsedTime();

      // Gentle auto-rotation
      if (!isDragging.current) {
        cameraAngle.current.theta += 0.003;
      }
      const r = 7.5;
      const theta = cameraAngle.current.theta;
      const phi   = cameraAngle.current.phi;
      camera.position.x = r * Math.sin(theta) * Math.cos(phi);
      camera.position.y = r * Math.sin(phi) + 1.5;
      camera.position.z = r * Math.cos(theta) * Math.cos(phi);
      camera.lookAt(0, 0.2, 0);

      // Apparatus gentle float
      apparatusGroup.position.y = Math.sin(t * 0.6) * 0.04;

      // Sparkle particles drift
      const positions = (sparks.geometry.attributes.position as THREE.BufferAttribute).array as Float32Array;
      for (let i = 0; i < sparkCount; i++) {
        positions[i * 3 + 1] += 0.003;
        if (positions[i * 3 + 1] > 4) positions[i * 3 + 1] = -3;
      }
      (sparks.geometry.attributes.position as THREE.BufferAttribute).needsUpdate = true;
      (sparkMat as THREE.PointsMaterial).opacity = 0.3 + Math.sin(t * 1.2) * 0.15;

      // Neon glow pulse
      neonGlow.intensity = 1.8 + Math.sin(t * 2.0) * 0.7;
      neonGlow.color.setHSL(0.75 + Math.sin(t * 0.5) * 0.08, 1, 0.6);

      // Bubble animation
      bubbles.children.forEach((b) => {
        const mesh = b as THREE.Mesh;
        const speed   = (mesh as any).__speed || 0.01;
        const wobble  = (mesh as any).__wobble || 0;
        mesh.position.y += speed;
        mesh.position.x += Math.sin(t + wobble) * 0.003;
        if (mesh.position.y > 0.6) {
          mesh.position.y = -0.9;
        }
      });

      // Flame animation
      if (flameGroup.visible) {
        const s1 = 1 + Math.sin(t * 14) * 0.09;
        const s2 = 1 + Math.cos(t * 18) * 0.07;
        flameOuter.scale.set(s1, 1 + Math.sin(t * 10) * 0.12, s1);
        flameMid.scale.set(s2, 1 + Math.cos(t * 13) * 0.14, s2);
        flameCore.scale.set(s1 * 0.9, 1 + Math.sin(t * 20) * 0.08, s1 * 0.9);
        flameOuter.position.y = 0.32 + Math.sin(t * 10) * 0.02;
        (flameGlow.material as THREE.MeshBasicMaterial).opacity = 0.12 + Math.sin(t * 5) * 0.08;
        neonGlow.color.set(0xff5500);
        neonGlow.intensity = 3.5 + Math.sin(t * 8) * 1.2;
      } else {
        neonGlow.color.setHSL(0.75, 1, 0.55);
      }

      renderer.render(scene, camera);
    };

    animate();

    // ── Mouse drag for camera orbit ────────────────────────────────────────
    const onMouseDown = (e: MouseEvent) => { isDragging.current = true; lastMouse.current = { x: e.clientX, y: e.clientY }; };
    const onMouseMove = (e: MouseEvent) => {
      if (!isDragging.current) return;
      const dx = e.clientX - lastMouse.current.x;
      const dy = e.clientY - lastMouse.current.y;
      cameraAngle.current.theta -= dx * 0.005;
      cameraAngle.current.phi   = Math.max(-0.1, Math.min(Math.PI / 2.2, cameraAngle.current.phi - dy * 0.004));
      lastMouse.current = { x: e.clientX, y: e.clientY };
    };
    const onMouseUp = () => { isDragging.current = false; };

    // Touch support
    const onTouchStart = (e: TouchEvent) => { isDragging.current = true; lastMouse.current = { x: e.touches[0].clientX, y: e.touches[0].clientY }; };
    const onTouchMove  = (e: TouchEvent) => {
      if (!isDragging.current) return;
      const dx = e.touches[0].clientX - lastMouse.current.x;
      const dy = e.touches[0].clientY - lastMouse.current.y;
      cameraAngle.current.theta -= dx * 0.005;
      cameraAngle.current.phi   = Math.max(-0.1, Math.min(Math.PI / 2.2, cameraAngle.current.phi - dy * 0.004));
      lastMouse.current = { x: e.touches[0].clientX, y: e.touches[0].clientY };
    };
    const onTouchEnd = () => { isDragging.current = false; };

    renderer.domElement.addEventListener('mousedown', onMouseDown);
    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('mouseup', onMouseUp);
    renderer.domElement.addEventListener('touchstart', onTouchStart, { passive: true });
    window.addEventListener('touchmove', onTouchMove, { passive: true });
    window.addEventListener('touchend', onTouchEnd);

    // ── Resize ─────────────────────────────────────────────────────────────
    const handleResize = () => {
      if (!containerRef.current || !sceneRef.current) return;
      const W2 = containerRef.current.clientWidth;
      const H2 = containerRef.current.clientHeight;
      sceneRef.current.camera.aspect = W2 / H2;
      sceneRef.current.camera.updateProjectionMatrix();
      sceneRef.current.renderer.setSize(W2, H2);
    };
    window.addEventListener('resize', handleResize);

    return () => {
      if (sceneRef.current) cancelAnimationFrame(sceneRef.current.animFrame);
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mouseup', onMouseUp);
      window.removeEventListener('touchmove', onTouchMove);
      window.removeEventListener('touchend', onTouchEnd);
      if (container && renderer.domElement) {
        try { container.removeChild(renderer.domElement); } catch (_) {}
      }
      renderer.dispose();
      sceneRef.current = null;
    };
  }, []);

  // ── Rebuild apparatus when type changes ──────────────────────────────────
  useEffect(() => {
    if (!sceneRef.current) return;
    const { apparatus, liquid } = sceneRef.current;
    const glassMat = new THREE.MeshPhysicalMaterial({
      color: 0xddeeff,
      transparent: true, opacity: 0.22,
      roughness: 0.0, metalness: 0.0,
      transmission: 0.96, thickness: 0.4, ior: 1.5,
      side: THREE.DoubleSide,
    });
    const liquidMat = liquid.material as THREE.MeshPhysicalMaterial;
    buildApparatus(apparatus, glassMat, liquid, liquidMat, apparatusType);
  }, [apparatusType]);

  // ── Heating ──────────────────────────────────────────────────────────────
  useEffect(() => {
    if (!sceneRef.current) return;
    const { flame } = sceneRef.current;
    flame.visible = isHeating;
    if (isHeating) {
      createBubbles(20, apparatusType === 'beaker' ? 0.85 : 0.32);
      onReaction?.({ status: 'heating', message: 'Đang đun nóng dung dịch...' });
    }
  }, [isHeating, apparatusType, createBubbles, onReaction]);

  // ── Custom Reaction ───────────────────────────────────────────────────────
  useEffect(() => {
    if (!sceneRef.current || !customReaction) return;
    const { liquid, bubbles } = sceneRef.current;
    try {
      (liquid.material as THREE.MeshPhysicalMaterial).color.setStyle(customReaction.color);
    } catch {
      (liquid.material as THREE.MeshPhysicalMaterial).color.setHex(0x4A90E2);
    }
    if (customReaction.bubbles) {
      createBubbles(25, apparatusType === 'beaker' ? 0.85 : 0.32);
    } else if (!isHeating) {
      bubbles.clear();
    }
    onReaction?.({ status: 'completed', message: customReaction.message });
  }, [customReaction, isHeating, apparatusType, createBubbles, onReaction]);

  // ── Legacy experiment ────────────────────────────────────────────────────
  useEffect(() => {
    if (!sceneRef.current || customReaction) return;
    const { liquid, bubbles } = sceneRef.current;
    if (activeExperiment === 'exp1') {
      (liquid.material as THREE.MeshPhysicalMaterial).color.setHex(0xff69b4);
      bubbles.clear();
      setTimeout(() => {
        (liquid.material as THREE.MeshPhysicalMaterial).color.setHex(0xffffff);
        onReaction?.({ status: 'completed', message: 'Phản ứng trung hòa hoàn tất!' });
      }, 3000);
    } else if (activeExperiment === 'exp2') {
      (liquid.material as THREE.MeshPhysicalMaterial).color.setHex(0x94a3b8);
      createBubbles(30, 0.85);
      onReaction?.({ status: 'reacting', message: 'Đang sủi bọt khí H₂...' });
    } else {
      (liquid.material as THREE.MeshPhysicalMaterial).color.setHex(0x4A90E2);
      if (!isHeating) bubbles.clear();
    }
  }, [activeExperiment, customReaction, isHeating, createBubbles, onReaction]);

  return (
    <div
      ref={containerRef}
      className="w-full h-full min-h-[420px] rounded-xl overflow-hidden cursor-grab active:cursor-grabbing"
      style={{ background: 'radial-gradient(ellipse at 50% 0%, #0d1a3a 0%, #060b18 100%)' }}
    />
  );
};

// ── Helper: build apparatus geometry ──────────────────────────────────────────
function buildApparatus(
  group: THREE.Group,
  glassMat: THREE.MeshPhysicalMaterial,
  liquid: THREE.Mesh,
  liquidMat: THREE.MeshPhysicalMaterial,
  type: ApparatusType,
) {
  group.clear();

  // Rim / label ring
  const ringGeo = new THREE.TorusGeometry(type === 'beaker' ? 1.01 : 0.41, 0.02, 8, 64);
  const ringMat = new THREE.MeshBasicMaterial({ color: type === 'test-tube' ? 0x22d3ee : 0x7c3aed });
  const ring = new THREE.Mesh(ringGeo, ringMat);
  ring.position.y = type === 'beaker' ? 1.26 : 1.26;
  group.add(ring);

  if (type === 'beaker') {
    // Cylinder walls
    const bodyGeo = new THREE.CylinderGeometry(1, 1, 2.5, 64, 1, true);
    group.add(new THREE.Mesh(bodyGeo, glassMat));
    // Bottom disc
    const botGeo = new THREE.CircleGeometry(1, 64);
    const bot = new THREE.Mesh(botGeo, glassMat);
    bot.rotation.x = -Math.PI / 2;
    bot.position.y = -1.25;
    group.add(bot);
    // Graduation lines
    for (let i = 0; i < 5; i++) {
      const lineGeo = new THREE.BoxGeometry(0.25, 0.015, 0.015);
      const lineMat = new THREE.MeshBasicMaterial({ color: 0x7c3aed, transparent: true, opacity: 0.7 });
      const line = new THREE.Mesh(lineGeo, lineMat);
      line.position.set(1.0, -0.9 + i * 0.42, 0);
      group.add(line);
    }
    // Liquid
    liquid.geometry = new THREE.CylinderGeometry(0.96, 0.96, 1.4, 64);
    liquid.position.set(0, -0.55, 0);
    liquidMat.opacity = 0.82;

  } else { // test-tube
    const bodyGeo = new THREE.CylinderGeometry(0.4, 0.4, 2.5, 64, 1, true);
    group.add(new THREE.Mesh(bodyGeo, glassMat));
    const capGeo = new THREE.SphereGeometry(0.4, 32, 32, 0, Math.PI * 2, Math.PI / 2, Math.PI / 2);
    const cap = new THREE.Mesh(capGeo, glassMat);
    cap.position.y = -1.25;
    group.add(cap);
    // Liquid
    liquid.geometry = new THREE.CylinderGeometry(0.37, 0.37, 1.6, 64);
    liquid.position.set(0, -0.4, 0);
    liquidMat.opacity = 0.88;
  }
}

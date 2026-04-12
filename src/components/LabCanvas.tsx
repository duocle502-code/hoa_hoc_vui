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

// ─────────────────────────────────────────────────────────────────────────────
// Helper: ease-in-out
// ─────────────────────────────────────────────────────────────────────────────
const easeInOut = (t: number) => t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t;

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
    liquidMat: THREE.MeshPhysicalMaterial;
    liquidTargetScale: { y: number };
    liquidFillAnim: { active: boolean; progress: number; targetColor: THREE.Color };
    bubbles: THREE.Group;
    smoke: THREE.Points;
    smokeMat: THREE.PointsMaterial;
    precipitate: THREE.Group;
    sparks: THREE.Points;
    sparkMat: THREE.PointsMaterial;
    flame: THREE.Group;
    flameOuter: THREE.Mesh;
    flameMid: THREE.Mesh;
    flameCore: THREE.Mesh;
    flameGlow: THREE.Mesh;
    neonGlow: THREE.PointLight;
    reactionGlow: THREE.PointLight;
    clock: THREE.Clock;
    animFrame: number;
    isEmpty: boolean;
  } | null>(null);

  // ── Camera orbit state (static until user drags) ──────────────────────────
  const isDragging     = useRef(false);
  const lastMouse      = useRef({ x: 0, y: 0 });
  const cameraAngle    = useRef({ theta: 0, phi: Math.PI / 8 }); // fixed default

  // ─────────────────────────────────────────────────────────────────────────
  // createBubbles
  // ─────────────────────────────────────────────────────────────────────────
  const createBubbles = useCallback((count: number, radius: number) => {
    if (!sceneRef.current) return;
    const { bubbles } = sceneRef.current;
    bubbles.clear();
    for (let i = 0; i < count; i++) {
      const r = 0.04 + Math.random() * 0.05;
      const geo = new THREE.SphereGeometry(r, 8, 8);
      const mat = new THREE.MeshPhysicalMaterial({
        color: 0xffffff,
        transparent: true,
        opacity: 0.30 + Math.random() * 0.25,
        roughness: 0,
        metalness: 0,
        transmission: 0.88,
        thickness: 0.25,
      });
      const mesh = new THREE.Mesh(geo, mat);
      mesh.position.set(
        (Math.random() - 0.5) * radius * 1.8,
        -0.85 + Math.random() * 0.5,
        (Math.random() - 0.5) * radius * 1.8
      );
      (mesh as any).__speed  = 0.008 + Math.random() * 0.014;
      (mesh as any).__wobble = Math.random() * Math.PI * 2;
      (mesh as any).__radius = radius;
      bubbles.add(mesh);
    }
  }, []);

  // ─────────────────────────────────────────────────────────────────────────
  // createPrecipitate — sinking white/colored particles
  // ─────────────────────────────────────────────────────────────────────────
  const createPrecipitate = useCallback((color: string, radius: number) => {
    if (!sceneRef.current) return;
    const { precipitate } = sceneRef.current;
    precipitate.clear();
    const c = new THREE.Color(color);
    for (let i = 0; i < 35; i++) {
      const size = 0.03 + Math.random() * 0.04;
      const geo  = new THREE.BoxGeometry(size, size, size);
      const mat  = new THREE.MeshPhysicalMaterial({
        color: c, roughness: 0.4, metalness: 0.1,
        transparent: true, opacity: 0.8,
      });
      const mesh = new THREE.Mesh(geo, mat);
      mesh.position.set(
        (Math.random() - 0.5) * radius * 1.6,
        0.3 + Math.random() * 0.6,
        (Math.random() - 0.5) * radius * 1.6
      );
      mesh.rotation.set(Math.random(), Math.random(), Math.random());
      (mesh as any).__sinkSpeed = 0.004 + Math.random() * 0.006;
      (mesh as any).__floor     = -0.9 + Math.random() * 0.15;
      precipitate.add(mesh);
    }
  }, []);

  // ─────────────────────────────────────────────────────────────────────────
  // triggerReaction — animate liquid fill + color flash + effects
  // ─────────────────────────────────────────────────────────────────────────
  const triggerReaction = useCallback((
    colorStr: string,
    showBubbles: boolean,
    showPrecipitate: boolean,
    radius: number,
  ) => {
    if (!sceneRef.current) return;
    const { liquid, liquidMat, liquidFillAnim, isEmpty } = sceneRef.current;

    // Make liquid visible
    liquid.visible = true;
    sceneRef.current.isEmpty = false;

    // Kick off fill animation
    const targetColor = new THREE.Color();
    try { targetColor.setStyle(colorStr); } catch { targetColor.setHex(0x4a90e2); }

    liquidFillAnim.active      = true;
    liquidFillAnim.progress    = isEmpty ? 0 : 0.5; // if already had liquid, start from mid
    liquidFillAnim.targetColor.copy(targetColor);

    // Reaction glow flash
    const { reactionGlow } = sceneRef.current;
    reactionGlow.color.copy(targetColor);
    reactionGlow.intensity = 6;

    // Effects
    if (showBubbles) createBubbles(22, radius);
    if (showPrecipitate) createPrecipitate(colorStr, radius);
  }, [createBubbles, createPrecipitate]);

  // ─────────────────────────────────────────────────────────────────────────
  // resetApparatus — clear liquid + effects
  // ─────────────────────────────────────────────────────────────────────────
  const resetApparatus = useCallback(() => {
    if (!sceneRef.current) return;
    const { liquid, bubbles, precipitate, smoke, reactionGlow, liquidFillAnim } = sceneRef.current;
    liquid.visible            = false;
    sceneRef.current.isEmpty  = true;
    liquidFillAnim.active     = false;
    liquidFillAnim.progress   = 0;
    bubbles.clear();
    precipitate.clear();
    // fade out smoke
    (smoke.material as THREE.PointsMaterial).opacity = 0;
    reactionGlow.intensity = 0;
  }, []);

  // ─────────────────────────────────────────────────────────────────────────
  // Main setup effect
  // ─────────────────────────────────────────────────────────────────────────
  useEffect(() => {
    if (!containerRef.current) return;
    const container = containerRef.current;
    const W = container.clientWidth;
    const H = container.clientHeight;

    // Scene
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x1e293b);
    scene.fog = new THREE.FogExp2(0x1e293b, 0.022);

    // Camera — fixed position, only moves on drag
    const camera = new THREE.PerspectiveCamera(52, W / H, 0.1, 200);
    const camR = 7.2;
    camera.position.set(0, 2.5, camR);
    camera.lookAt(0, 0.2, 0);

    // Renderer
    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(W, H);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type    = THREE.PCFSoftShadowMap;
    renderer.outputColorSpace  = THREE.SRGBColorSpace;
    renderer.toneMapping       = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.35;
    container.appendChild(renderer.domElement);

    // ── Lights ───────────────────────────────────────────────────────────────
    // Ambient — much brighter so scene looks lit
    scene.add(new THREE.AmbientLight(0xc8d8f0, 3.5));

    // Overhead white fill light (like lab ceiling)
    const ceilLight = new THREE.DirectionalLight(0xffffff, 2.0);
    ceilLight.position.set(0, 12, 0);
    scene.add(ceilLight);

    // Key light — cool blue from top-left
    const keyLight = new THREE.DirectionalLight(0xa5c8f8, 2.2);
    keyLight.position.set(-4, 8, 5);
    keyLight.castShadow = true;
    keyLight.shadow.mapSize.width  = 2048;
    keyLight.shadow.mapSize.height = 2048;
    keyLight.shadow.camera.near = 0.5;
    keyLight.shadow.camera.far  = 50;
    keyLight.shadow.camera.left   = -8;
    keyLight.shadow.camera.right  = 8;
    keyLight.shadow.camera.top    = 8;
    keyLight.shadow.camera.bottom = -8;
    scene.add(keyLight);

    // Front fill — warm white
    const fillLight = new THREE.DirectionalLight(0xfff4e0, 1.6);
    fillLight.position.set(3, 5, 8);
    scene.add(fillLight);

    // Side fill — violet accent
    const sideLight = new THREE.DirectionalLight(0xd8b4fe, 0.9);
    sideLight.position.set(5, 3, -3);
    scene.add(sideLight);

    const neonGlow = new THREE.PointLight(0x7c3aed, 1.5, 5);
    neonGlow.position.set(0, -1.2, 0);
    scene.add(neonGlow);

    // Reaction glow — starts at 0
    const reactionGlow = new THREE.PointLight(0x4a90e2, 0, 4);
    reactionGlow.position.set(0, 0, 0);
    scene.add(reactionGlow);

    // ── Lab Table ────────────────────────────────────────────────────────────
    const table = new THREE.Mesh(
      new THREE.BoxGeometry(10, 0.18, 6),
      new THREE.MeshPhysicalMaterial({ color: 0x334155, roughness: 0.2, metalness: 0.1 })
    );
    table.position.y = -1.7;
    table.receiveShadow = true;
    scene.add(table);

    // Neon edge strips on table
    const mkEdge = (color: number, z: number) => {
      const m = new THREE.Mesh(
        new THREE.BoxGeometry(10, 0.04, 0.04),
        new THREE.MeshBasicMaterial({ color })
      );
      m.position.set(0, -1.61, z);
      scene.add(m);
    };
    mkEdge(0x7c3aed,  3);
    mkEdge(0x22d3ee, -3);

    // Grid floor — lighter
    const grid = new THREE.GridHelper(20, 30, 0x7c3aed, 0x334155);
    grid.position.y = -2.5;
    scene.add(grid);

    // ── Back wall + neon strips ──────────────────────────────────────────────
    const wallMat = new THREE.MeshPhysicalMaterial({ color: 0x1e3a5f, roughness: 0.85, metalness: 0.05 });
    const wall = new THREE.Mesh(new THREE.PlaneGeometry(16, 9), wallMat);
    wall.position.z = -5;
    wall.receiveShadow = true;
    scene.add(wall);

    [0.5, -0.5, 1.5, -1.5].forEach((y, i) => {
      const colors = [0x7c3aed, 0x22d3ee, 0x7c3aed, 0x22d3ee];
      const sm = new THREE.Mesh(
        new THREE.BoxGeometry(14, 0.025, 0.01),
        new THREE.MeshBasicMaterial({ color: colors[i], transparent: true, opacity: 0.7 })
      );
      sm.position.set(0, y * 2.2, -4.98);
      scene.add(sm);
    });

    // ── Apparatus group ──────────────────────────────────────────────────────
    const apparatusGroup = new THREE.Group();
    scene.add(apparatusGroup);

    const glassMat = new THREE.MeshPhysicalMaterial({
      color: 0xddeeff,
      transparent: true, opacity: 0.20,
      roughness: 0.0, metalness: 0.0,
      transmission: 0.97, thickness: 0.4, ior: 1.5,
      side: THREE.DoubleSide,
    });

    // ── Liquid (hidden by default) ───────────────────────────────────────────
    const liquidMat = new THREE.MeshPhysicalMaterial({
      color: 0x4a90e2,
      transparent: true, opacity: 0,
      roughness: 0.05, metalness: 0.0,
      transmission: 0.15,
    });
    const liquid = new THREE.Mesh(new THREE.BufferGeometry(), liquidMat);
    liquid.visible = false;
    scene.add(liquid);

    // Fill animation state
    const liquidFillAnim = {
      active: false,
      progress: 0,
      targetColor: new THREE.Color(0x4a90e2),
    };

    // ── Sparks (ambient floating dust) ──────────────────────────────────────
    const SPARK_COUNT = 100;
    const sparkArr = new Float32Array(SPARK_COUNT * 3);
    for (let i = 0; i < SPARK_COUNT; i++) {
      sparkArr[i*3]   = (Math.random()-0.5)*12;
      sparkArr[i*3+1] = (Math.random()-0.5)*6 - 1;
      sparkArr[i*3+2] = (Math.random()-0.5)*6 - 2;
    }
    const sparkGeo = new THREE.BufferGeometry();
    sparkGeo.setAttribute('position', new THREE.BufferAttribute(sparkArr, 3));
    const sparkMat = new THREE.PointsMaterial({ color: 0x7c3aed, size: 0.03, transparent: true, opacity: 0.4, sizeAttenuation: true });
    const sparks = new THREE.Points(sparkGeo, sparkMat);
    scene.add(sparks);

    // ── Smoke particles (hidden until reaction) ──────────────────────────────
    const SMOKE_COUNT = 60;
    const smokeArr = new Float32Array(SMOKE_COUNT * 3);
    for (let i = 0; i < SMOKE_COUNT; i++) {
      smokeArr[i*3]   = (Math.random()-0.5)*1.4;
      smokeArr[i*3+1] = 1.0 + Math.random() * 2.0;
      smokeArr[i*3+2] = (Math.random()-0.5)*1.4;
    }
    const smokeGeo = new THREE.BufferGeometry();
    smokeGeo.setAttribute('position', new THREE.BufferAttribute(smokeArr, 3));
    const smokeMat = new THREE.PointsMaterial({ color: 0x94a3b8, size: 0.10, transparent: true, opacity: 0, sizeAttenuation: true });
    const smoke = new THREE.Points(smokeGeo, smokeMat);
    scene.add(smoke);

    // ── Bubbles group ────────────────────────────────────────────────────────
    const bubbles = new THREE.Group();
    scene.add(bubbles);

    // ── Precipitate group (sinking crystals) ─────────────────────────────────
    const precipitate = new THREE.Group();
    scene.add(precipitate);

    // ── Alcohol lamp ─────────────────────────────────────────────────────────
    const burner = new THREE.Group();
    burner.position.set(0, -1.62, 0);
    scene.add(burner);

    burner.add(new THREE.Mesh(
      new THREE.CylinderGeometry(0.28, 0.35, 0.7, 32),
      new THREE.MeshPhysicalMaterial({ color: 0xb3c8e8, transparent: true, opacity: 0.35, roughness: 0, transmission: 0.8, ior: 1.5 })
    ));
    const neck = new THREE.Mesh(
      new THREE.CylinderGeometry(0.08, 0.12, 0.18, 16),
      new THREE.MeshPhysicalMaterial({ color: 0x888888, roughness: 0.4, metalness: 0.5 })
    );
    neck.position.y = 0.44;
    burner.add(neck);
    const basePlate = new THREE.Mesh(
      new THREE.CylinderGeometry(0.38, 0.38, 0.04, 32),
      new THREE.MeshPhysicalMaterial({ color: 0x334155, roughness: 0.3, metalness: 0.7 })
    );
    basePlate.position.y = -0.37;
    burner.add(basePlate);

    // ── Flame layers ─────────────────────────────────────────────────────────
    const flameGroup = new THREE.Group();
    flameGroup.position.set(0, -1.62 + 0.56, 0);
    flameGroup.visible = false;
    scene.add(flameGroup);

    const mkCone = (h: number, r: number, color: number, opacity: number) => {
      const m = new THREE.Mesh(
        new THREE.ConeGeometry(r, h, 32),
        new THREE.MeshBasicMaterial({ color, transparent: true, opacity, depthWrite: false })
      );
      return m;
    };
    const flameOuter = mkCone(0.65, 0.16, 0xff4500, 0.65); flameOuter.position.y = 0.32;
    const flameMid   = mkCone(0.48, 0.10, 0xff8c00, 0.78); flameMid.position.y   = 0.24;
    const flameCore  = mkCone(0.30, 0.055, 0xffff66, 0.92); flameCore.position.y  = 0.15;
    const flameGlow  = new THREE.Mesh(
      new THREE.CircleGeometry(0.5, 32),
      new THREE.MeshBasicMaterial({ color: 0xff5500, transparent: true, opacity: 0.18, side: THREE.DoubleSide, depthWrite: false })
    );
    flameGlow.rotation.x = -Math.PI / 2;
    flameGroup.add(flameOuter, flameMid, flameCore, flameGlow);

    // ── Scene refs ───────────────────────────────────────────────────────────
    const clock = new THREE.Clock();
    sceneRef.current = {
      scene, camera, renderer,
      apparatus: apparatusGroup,
      liquid, liquidMat, liquidTargetScale: { y: 1 },
      liquidFillAnim,
      bubbles, smoke, smokeMat, precipitate,
      sparks, sparkMat,
      flame: flameGroup, flameOuter, flameMid, flameCore, flameGlow,
      neonGlow, reactionGlow,
      clock, animFrame: 0,
      isEmpty: true,
    };

    buildApparatus(apparatusGroup, glassMat, liquid, liquidMat, apparatusType);

    // ── Animation loop ───────────────────────────────────────────────────────
    const animate = () => {
      if (!sceneRef.current) return;
      sceneRef.current.animFrame = requestAnimationFrame(animate);
      const t = clock.getElapsedTime();

      // ── Camera orbit — only on drag ──
      if (isDragging.current) {
        const r2 = camR;
        const th = cameraAngle.current.theta;
        const ph = cameraAngle.current.phi;
        camera.position.x = r2 * Math.sin(th) * Math.cos(ph);
        camera.position.y = r2 * Math.sin(ph) + 1.5;
        camera.position.z = r2 * Math.cos(th) * Math.cos(ph);
        camera.lookAt(0, 0.2, 0);
      }

      // ── Apparatus gentle bob (very subtle) ──
      apparatusGroup.position.y = Math.sin(t * 0.7) * 0.025;

      // ── Liquid fill animation ──
      if (liquidFillAnim.active) {
        liquidFillAnim.progress = Math.min(liquidFillAnim.progress + 0.012, 1);
        const ease = easeInOut(liquidFillAnim.progress);

        // Scale liquid height from 0 → full
        liquid.scale.y = ease;
        liquid.position.y = (apparatusType === 'beaker' ? -0.55 : -0.4) - (1 - ease) * 0.7;
        liquidMat.opacity = ease * (apparatusType === 'beaker' ? 0.82 : 0.88);

        // Color lerp from transparent → target
        liquidMat.color.lerp(liquidFillAnim.targetColor, 0.06);

        if (liquidFillAnim.progress >= 1) {
          liquidFillAnim.active = false;
          liquid.scale.y = 1;
        }
      }

      // ── Reaction glow decay ──
      if (reactionGlow.intensity > 0) {
        reactionGlow.intensity = Math.max(0, reactionGlow.intensity - 0.08);
      }

      // ── Smoke drift (only when reactionGlow recently fired) ──
      const smokeOpacity = (smokeMat as THREE.PointsMaterial).opacity;
      if (smokeOpacity > 0) {
        const smokePos = (smoke.geometry.attributes.position as THREE.BufferAttribute).array as Float32Array;
        for (let i = 0; i < SMOKE_COUNT; i++) {
          smokePos[i*3+1] += 0.008;
          if (smokePos[i*3+1] > 4.5) smokePos[i*3+1] = 1.0 + Math.random() * 0.5;
          smokePos[i*3]   += Math.sin(t * 0.5 + i) * 0.002;
        }
        (smoke.geometry.attributes.position as THREE.BufferAttribute).needsUpdate = true;
        (smokeMat as THREE.PointsMaterial).opacity = Math.max(0, smokeOpacity - 0.003);
      }

      // ── Sparkle ambient particles ──
      const sparkPos = (sparks.geometry.attributes.position as THREE.BufferAttribute).array as Float32Array;
      for (let i = 0; i < SPARK_COUNT; i++) {
        sparkPos[i*3+1] += 0.002;
        if (sparkPos[i*3+1] > 4) sparkPos[i*3+1] = -3;
      }
      (sparks.geometry.attributes.position as THREE.BufferAttribute).needsUpdate = true;
      sparkMat.opacity = 0.2 + Math.sin(t * 0.8) * 0.1;

      // ── Neon pulse ──
      neonGlow.intensity = 1.5 + Math.sin(t * 1.8) * 0.5;
      if (!isHeating) neonGlow.color.setHSL(0.75 + Math.sin(t * 0.4) * 0.06, 1, 0.55);

      // ── Bubbles float up ──
      bubbles.children.forEach((b) => {
        const mesh = b as THREE.Mesh & { __speed: number; __wobble: number };
        mesh.position.y += mesh.__speed;
        mesh.position.x += Math.sin(t + mesh.__wobble) * 0.003;
        if (mesh.position.y > 0.7) mesh.position.y = -0.85;
      });

      // ── Precipitate sink ──
      precipitate.children.forEach((p) => {
        const mesh = p as THREE.Mesh & { __sinkSpeed: number; __floor: number };
        if (mesh.position.y > mesh.__floor) {
          mesh.position.y -= mesh.__sinkSpeed;
          mesh.rotation.x += 0.01;
          mesh.rotation.z += 0.007;
        }
      });

      // ── Flame animate ──
      if (flameGroup.visible) {
        const s1 = 1 + Math.sin(t * 14) * 0.09;
        flameOuter.scale.set(s1, 1 + Math.sin(t * 10) * 0.13, s1);
        flameMid.scale.set(s1*0.85, 1 + Math.cos(t * 13) * 0.15, s1*0.85);
        flameCore.scale.set(s1*0.7, 1 + Math.sin(t * 20) * 0.09, s1*0.7);
        flameOuter.position.y = 0.32 + Math.sin(t * 10) * 0.02;
        (flameGlow.material as THREE.MeshBasicMaterial).opacity = 0.11 + Math.sin(t * 5) * 0.07;
        neonGlow.color.set(0xff5500);
        neonGlow.intensity = 3.2 + Math.sin(t * 8) * 1.1;
      }

      renderer.render(scene, camera);
    };

    animate();

    // ── Mouse drag orbit ─────────────────────────────────────────────────────
    const syncCamera = () => {
      const r2 = camR;
      const th = cameraAngle.current.theta;
      const ph = cameraAngle.current.phi;
      camera.position.x = r2 * Math.sin(th) * Math.cos(ph);
      camera.position.y = r2 * Math.sin(ph) + 1.5;
      camera.position.z = r2 * Math.cos(th) * Math.cos(ph);
      camera.lookAt(0, 0.2, 0);
    };

    const onMouseDown = (e: MouseEvent) => {
      isDragging.current = true;
      lastMouse.current = { x: e.clientX, y: e.clientY };
    };
    const onMouseMove = (e: MouseEvent) => {
      if (!isDragging.current) return;
      const dx = e.clientX - lastMouse.current.x;
      const dy = e.clientY - lastMouse.current.y;
      cameraAngle.current.theta -= dx * 0.005;
      cameraAngle.current.phi = Math.max(-0.05, Math.min(Math.PI / 2.3,
        cameraAngle.current.phi - dy * 0.004));
      lastMouse.current = { x: e.clientX, y: e.clientY };
      syncCamera();
    };
    const onMouseUp = () => { isDragging.current = false; };

    const onTouchStart = (e: TouchEvent) => {
      isDragging.current = true;
      lastMouse.current = { x: e.touches[0].clientX, y: e.touches[0].clientY };
    };
    const onTouchMove = (e: TouchEvent) => {
      if (!isDragging.current) return;
      const dx = e.touches[0].clientX - lastMouse.current.x;
      const dy = e.touches[0].clientY - lastMouse.current.y;
      cameraAngle.current.theta -= dx * 0.005;
      cameraAngle.current.phi = Math.max(-0.05, Math.min(Math.PI / 2.3,
        cameraAngle.current.phi - dy * 0.004));
      lastMouse.current = { x: e.touches[0].clientX, y: e.touches[0].clientY };
      syncCamera();
    };
    const onTouchEnd = () => { isDragging.current = false; };

    renderer.domElement.addEventListener('mousedown', onMouseDown);
    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('mouseup', onMouseUp);
    renderer.domElement.addEventListener('touchstart', onTouchStart, { passive: true });
    window.addEventListener('touchmove', onTouchMove, { passive: true });
    window.addEventListener('touchend', onTouchEnd);

    // ── Resize ───────────────────────────────────────────────────────────────
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
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ── Rebuild when apparatus type changes ──────────────────────────────────
  useEffect(() => {
    if (!sceneRef.current) return;
    const { apparatus, liquid, liquidMat } = sceneRef.current;
    const glassMat = new THREE.MeshPhysicalMaterial({
      color: 0xddeeff,
      transparent: true, opacity: 0.20,
      roughness: 0.0, metalness: 0.0,
      transmission: 0.97, thickness: 0.4, ior: 1.5,
      side: THREE.DoubleSide,
    });
    buildApparatus(apparatus, glassMat, liquid, liquidMat, apparatusType);
    // also reset when apparatus changes
    resetApparatus();
  }, [apparatusType, resetApparatus]);

  // ── Heating ──────────────────────────────────────────────────────────────
  useEffect(() => {
    if (!sceneRef.current) return;
    const { flame, smokeMat: sm } = sceneRef.current;
    flame.visible = isHeating;
    if (isHeating) {
      createBubbles(18, apparatusType === 'beaker' ? 0.85 : 0.32);
      // Turn on smoke
      (sm as THREE.PointsMaterial).opacity = 0.35;
      onReaction?.({ status: 'heating', message: '🔥 Đang đun nóng dung dịch...' });
    } else {
      sceneRef.current.bubbles.clear();
    }
  }, [isHeating, apparatusType, createBubbles, onReaction]);

  // ── Custom Reaction ───────────────────────────────────────────────────────
  useEffect(() => {
    if (!sceneRef.current) return;

    // When customReaction is cleared (null) → reset the apparatus to empty
    if (!customReaction) {
      resetApparatus();
      return;
    }

    const radius = apparatusType === 'beaker' ? 0.85 : 0.32;

    triggerReaction(
      customReaction.color,
      customReaction.bubbles,
      customReaction.precipitate,
      radius,
    );

    // Activate smoke for all reactions
    (sceneRef.current.smokeMat as THREE.PointsMaterial).opacity = 0.45;

    onReaction?.({ status: 'completed', message: customReaction.message });
  }, [customReaction, apparatusType, triggerReaction, onReaction]);

  // ── Legacy experiments ────────────────────────────────────────────────────
  useEffect(() => {
    if (!sceneRef.current || customReaction) return;
    const radius = 0.85;
    if (activeExperiment === 'exp1') {
      triggerReaction('#ff69b4', false, false, radius);
      setTimeout(() => {
        if (!sceneRef.current) return;
        sceneRef.current.liquidFillAnim.targetColor.set('#ffffff');
        onReaction?.({ status: 'completed', message: 'Phản ứng trung hòa hoàn tất!' });
      }, 3000);
    } else if (activeExperiment === 'exp2') {
      triggerReaction('#94a3b8', true, false, radius);
      onReaction?.({ status: 'reacting', message: 'Đang sủi bọt khí H₂...' });
    } else if (!activeExperiment) {
      resetApparatus();
    }
  }, [activeExperiment, customReaction, triggerReaction, resetApparatus, onReaction]);

  return (
    <div
      ref={containerRef}
      className="w-full h-full min-h-[420px] rounded-xl overflow-hidden cursor-grab active:cursor-grabbing select-none"
      style={{ background: 'radial-gradient(ellipse at 50% 0%, #0d1a3a 0%, #060b18 100%)' }}
    />
  );
};

// ─────────────────────────────────────────────────────────────────────────────
// buildApparatus
// ─────────────────────────────────────────────────────────────────────────────
function buildApparatus(
  group: THREE.Group,
  glassMat: THREE.MeshPhysicalMaterial,
  liquid: THREE.Mesh,
  liquidMat: THREE.MeshPhysicalMaterial,
  type: ApparatusType,
) {
  group.clear();

  // Neon rim ring at top
  const ringRadius = type === 'beaker' ? 1.01 : 0.41;
  const ring = new THREE.Mesh(
    new THREE.TorusGeometry(ringRadius, 0.018, 8, 64),
    new THREE.MeshBasicMaterial({ color: type === 'test-tube' ? 0x22d3ee : 0x7c3aed })
  );
  ring.position.y = 1.26;
  group.add(ring);

  if (type === 'beaker') {
    // Walls
    group.add(new THREE.Mesh(new THREE.CylinderGeometry(1, 1, 2.5, 64, 1, true), glassMat));
    // Bottom
    const bot = new THREE.Mesh(new THREE.CircleGeometry(1, 64), glassMat);
    bot.rotation.x = -Math.PI / 2;
    bot.position.y = -1.25;
    group.add(bot);
    // Measurement lines
    for (let i = 0; i < 5; i++) {
      const line = new THREE.Mesh(
        new THREE.BoxGeometry(0.22, 0.013, 0.013),
        new THREE.MeshBasicMaterial({ color: 0x7c3aed, transparent: true, opacity: 0.65 })
      );
      line.position.set(1.0, -0.9 + i * 0.42, 0);
      group.add(line);
    }
    // Spout
    const spout = new THREE.Mesh(
      new THREE.CylinderGeometry(0.05, 0.08, 0.25, 8),
      glassMat
    );
    spout.position.set(0.95, 1.1, 0);
    spout.rotation.z = Math.PI / 4;
    group.add(spout);

    // Liquid geometry — hidden, scale.y=0 initially
    liquid.geometry = new THREE.CylinderGeometry(0.96, 0.96, 1.4, 64);
    liquid.position.set(0, -0.55, 0);
    liquid.scale.y = 0;
    liquidMat.opacity = 0;
    liquid.visible = false;

  } else {
    // Test-tube body
    group.add(new THREE.Mesh(new THREE.CylinderGeometry(0.4, 0.4, 2.5, 64, 1, true), glassMat));
    // Rounded bottom cap
    const cap = new THREE.Mesh(
      new THREE.SphereGeometry(0.4, 32, 32, 0, Math.PI * 2, Math.PI / 2, Math.PI / 2),
      glassMat
    );
    cap.position.y = -1.25;
    group.add(cap);

    // Liquid geometry — hidden, scale.y=0 initially
    liquid.geometry = new THREE.CylinderGeometry(0.37, 0.37, 1.6, 64);
    liquid.position.set(0, -0.4, 0);
    liquid.scale.y = 0;
    liquidMat.opacity = 0;
    liquid.visible = false;
  }
}

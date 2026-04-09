import React, { useEffect, useRef } from 'react';
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
  onReaction 
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const sceneRef = useRef<{
    scene: THREE.Scene;
    camera: THREE.PerspectiveCamera;
    renderer: THREE.WebGLRenderer;
    apparatus: THREE.Group;
    liquid: THREE.Mesh;
    bubbles: THREE.Group;
    bunsenBurner: THREE.Group;
    flame: THREE.Mesh;
    innerFlame: THREE.Mesh;
  } | null>(null);

  useEffect(() => {
    if (!containerRef.current) return;

    // Scene setup
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0xf1f5f9);

    const camera = new THREE.PerspectiveCamera(75, containerRef.current.clientWidth / containerRef.current.clientHeight, 0.1, 1000);
    camera.position.z = 6;
    camera.position.y = 2;
    camera.lookAt(0, 0, 0);

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(containerRef.current.clientWidth, containerRef.current.clientHeight);
    containerRef.current.appendChild(renderer.domElement);

    // Lights
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
    scene.add(ambientLight);

    const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
    directionalLight.position.set(5, 10, 7.5);
    scene.add(directionalLight);

    // Apparatus Group
    const apparatusGroup = new THREE.Group();
    scene.add(apparatusGroup);

    // Liquid
    const liquidMaterial = new THREE.MeshPhongMaterial({
      color: 0x4A90E2,
      transparent: true,
      opacity: 0.7,
    });
    const liquid = new THREE.Mesh(new THREE.BufferGeometry(), liquidMaterial);
    scene.add(liquid);

    // Bubbles Group
    const bubbles = new THREE.Group();
    scene.add(bubbles);

    // Bunsen Burner Group (Alcohol Lamp)
    const bunsenBurner = new THREE.Group();
    bunsenBurner.position.set(0, -2.8, 0);
    scene.add(bunsenBurner);

    // Load Alcohol Lamp Texture
    const loader = new THREE.TextureLoader();
    // Using a more realistic laboratory alcohol lamp image
    const burnerTexture = loader.load('https://img.icons8.com/fluency/512/alcohol-lamp.png');
    
    const burnerMaterial = new THREE.SpriteMaterial({ 
      map: burnerTexture,
      transparent: true,
      opacity: 0.9
    });
    const burnerSprite = new THREE.Sprite(burnerMaterial);
    burnerSprite.scale.set(2.5, 2.5, 1);
    bunsenBurner.add(burnerSprite);

    // Flame (3D overlay for extra effect)
    const flameGeo = new THREE.ConeGeometry(0.15, 0.5, 32);
    const flameMat = new THREE.MeshBasicMaterial({ 
      color: 0xff4500, 
      transparent: true, 
      opacity: 0.8 
    });
    const flame = new THREE.Mesh(flameGeo, flameMat);
    flame.position.y = 1.2;
    flame.visible = false;
    bunsenBurner.add(flame);

    // Inner flame
    const innerFlameGeo = new THREE.ConeGeometry(0.08, 0.3, 32);
    const innerFlameMat = new THREE.MeshBasicMaterial({ color: 0xffff00, transparent: true, opacity: 0.9 });
    const innerFlame = new THREE.Mesh(innerFlameGeo, innerFlameMat);
    innerFlame.position.y = 1.1;
    innerFlame.visible = false;
    bunsenBurner.add(innerFlame);

    sceneRef.current = { scene, camera, renderer, apparatus: apparatusGroup, liquid, bubbles, bunsenBurner, flame, innerFlame };

    const animate = () => {
      requestAnimationFrame(animate);
      apparatusGroup.rotation.y += 0.005;
      liquid.rotation.y += 0.005;

      // Animate bubbles
      bubbles.children.forEach((bubble) => {
        bubble.position.y += 0.02;
        if (bubble.position.y > 0.5) {
          bubble.position.y = -1;
        }
      });

      // Animate flame
      if (flame.visible) {
        const scale = 1 + Math.sin(Date.now() * 0.01) * 0.1;
        flame.scale.set(
          scale,
          1 + Math.cos(Date.now() * 0.015) * 0.2,
          scale
        );
        if (innerFlame) {
          innerFlame.visible = true;
          innerFlame.scale.set(
            scale * 0.8,
            1 + Math.sin(Date.now() * 0.02) * 0.1,
            scale * 0.8
          );
        }
      } else if (innerFlame) {
        innerFlame.visible = false;
      }

      renderer.render(scene, camera);
    };

    animate();

    const handleResize = () => {
      if (!containerRef.current || !sceneRef.current) return;
      const { camera, renderer } = sceneRef.current;
      camera.aspect = containerRef.current.clientWidth / containerRef.current.clientHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(containerRef.current.clientWidth, containerRef.current.clientHeight);
    };

    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      if (containerRef.current && renderer.domElement) {
        containerRef.current.removeChild(renderer.domElement);
      }
    };
  }, []);

  // Update Apparatus Geometry
  useEffect(() => {
    if (!sceneRef.current) return;
    const { apparatus, liquid } = sceneRef.current;
    apparatus.clear();

    const glassMat = new THREE.MeshPhongMaterial({
      color: 0xffffff,
      transparent: true,
      opacity: 0.3,
      side: THREE.DoubleSide,
    });

    if (apparatusType === 'beaker') {
      const beakerGeo = new THREE.CylinderGeometry(1, 1, 2.5, 32, 1, true);
      const beaker = new THREE.Mesh(beakerGeo, glassMat);
      apparatus.add(beaker);

      const bottomGeo = new THREE.CircleGeometry(1, 32);
      const bottom = new THREE.Mesh(bottomGeo, glassMat);
      bottom.rotation.x = -Math.PI / 2;
      bottom.position.y = -1.25;
      apparatus.add(bottom);

      liquid.geometry = new THREE.CylinderGeometry(0.95, 0.95, 1.5, 32);
      liquid.position.y = -0.5;
    } else if (apparatusType === 'test-tube') {
      const tubeGeo = new THREE.CylinderGeometry(0.4, 0.4, 2.5, 32, 1, true);
      const tube = new THREE.Mesh(tubeGeo, glassMat);
      apparatus.add(tube);

      const bottomGeo = new THREE.SphereGeometry(0.4, 32, 32, 0, Math.PI * 2, Math.PI / 2, Math.PI / 2);
      const bottom = new THREE.Mesh(bottomGeo, glassMat);
      bottom.position.y = -1.25;
      apparatus.add(bottom);

      liquid.geometry = new THREE.CylinderGeometry(0.38, 0.38, 1.8, 32);
      liquid.position.y = -0.3;
    }
  }, [apparatusType]);

  // Update Heating State
  useEffect(() => {
    if (!sceneRef.current) return;
    const { flame, innerFlame } = sceneRef.current;
    flame.visible = isHeating;
    if (innerFlame) innerFlame.visible = isHeating;
    if (isHeating) {
      createBubbles(15);
      onReaction?.({ status: 'heating', message: 'Đang đun nóng dung dịch...' });
    }
  }, [isHeating]);

  const createBubbles = (count: number) => {
    if (!sceneRef.current) return;
    const { bubbles } = sceneRef.current;
    bubbles.clear();
    const radius = apparatusType === 'beaker' ? 0.8 : 0.3;
    for (let i = 0; i < count; i++) {
      const geo = new THREE.SphereGeometry(0.05, 8, 8);
      const mat = new THREE.MeshPhongMaterial({ color: 0xffffff, transparent: true, opacity: 0.5 });
      const mesh = new THREE.Mesh(geo, mat);
      mesh.position.set(
        (Math.random() - 0.5) * radius * 2,
        (Math.random() - 0.5) * 1.5 - 0.5,
        (Math.random() - 0.5) * radius * 2
      );
      bubbles.add(mesh);
    }
  };

  // Handle custom reactions
  useEffect(() => {
    if (!sceneRef.current || !customReaction) return;
    const { liquid, bubbles } = sceneRef.current;

    // Update color
    try {
      (liquid.material as THREE.MeshPhongMaterial).color.setStyle(customReaction.color);
    } catch (e) {
      (liquid.material as THREE.MeshPhongMaterial).color.setHex(0x4A90E2);
    }

    // Update bubbles
    if (customReaction.bubbles) {
      createBubbles(20);
    } else if (!isHeating) {
      bubbles.clear();
    }

    onReaction?.({ status: 'completed', message: customReaction.message });
  }, [customReaction]);

  // Handle experiment changes (legacy support)
  useEffect(() => {
    if (!sceneRef.current || customReaction) return;
    const { liquid, bubbles } = sceneRef.current;

    if (activeExperiment === 'exp1') {
      (liquid.material as THREE.MeshPhongMaterial).color.setHex(0xff69b4); // Pink
      bubbles.clear();
      setTimeout(() => {
        (liquid.material as THREE.MeshPhongMaterial).color.setHex(0xffffff); // Clear
        onReaction?.({ status: 'completed', message: 'Phản ứng trung hòa hoàn tất!' });
      }, 3000);
    } else if (activeExperiment === 'exp2') {
      (liquid.material as THREE.MeshPhongMaterial).color.setHex(0x94a3b8); // Greyish
      createBubbles(30);
      onReaction?.({ status: 'reacting', message: 'Đang sủi bọt khí H2...' });
    } else {
      (liquid.material as THREE.MeshPhongMaterial).color.setHex(0x4A90E2);
      if (!isHeating) bubbles.clear();
    }
  }, [activeExperiment]);


  return <div ref={containerRef} className="w-full h-full min-h-[400px] rounded-xl overflow-hidden" />;
};

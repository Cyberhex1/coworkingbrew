import React, { useEffect, useRef } from 'react';
import * as THREE from 'three';
import { AvatarConfig, DeskConfig } from '../types';
import { buildVoxelAvatar, buildVoxelDesk, buildVoxelPet, VoxelAvatarInstance } from '../utils/voxelBuilder';
import { RotateCw } from 'lucide-react';

interface VoxelAvatarPreviewProps {
  avatar: AvatarConfig;
  desk: DeskConfig;
  category?: 'profile' | 'character' | 'wardrobe' | 'desk' | 'pet' | 'activity';
}

export const VoxelAvatarPreview: React.FC<VoxelAvatarPreviewProps> = ({ avatar, desk, category = 'character' }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const avatarInstanceRef = useRef<VoxelAvatarInstance | null>(null);
  const deskGroupRef = useRef<THREE.Group | null>(null);
  const rotationY = useRef<number>(0.4);
  const isDragging = useRef<boolean>(false);
  const lastMouseX = useRef<number>(0);

  useEffect(() => {
    if (!canvasRef.current || !containerRef.current) return;

    const width = 220;
    const height = 220;

    // Scene
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x1a162b);

    // Camera
    const aspect = width / height;
    const isCloseUp = category === 'character' || category === 'profile';
    const isPetMode = category === 'pet';
    const isDeskMode = category === 'desk';
    const d = isCloseUp ? 1.3 : isPetMode ? 0.9 : isDeskMode ? 1.7 : 1.5;

    const camera = new THREE.OrthographicCamera(-d * aspect, d * aspect, d, -d, 0.1, 50);
    if (isCloseUp) {
      camera.position.set(3.2, 2.5, 3.2);
      camera.lookAt(0, 0.9, 0);
    } else if (isPetMode) {
      camera.position.set(3.0, 2.2, 3.0);
      camera.lookAt(0, 0.25, 0);
    } else if (isDeskMode) {
      camera.position.set(3.8, 3.2, 3.8);
      camera.lookAt(0, 0.45, 0);
    } else {
      camera.position.set(4.0, 3.2, 4.0);
      camera.lookAt(0, 0.65, 0);
    }

    // Renderer
    const renderer = new THREE.WebGLRenderer({
      canvas: canvasRef.current,
      antialias: false,
    });
    renderer.setSize(width, height, false);
    renderer.shadowMap.enabled = true;

    // Lights
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.85);
    scene.add(ambientLight);

    const dirLight = new THREE.DirectionalLight(0xfffaed, 1.3);
    dirLight.position.set(4, 8, 4);
    dirLight.castShadow = true;
    scene.add(dirLight);

    const pointLight = new THREE.PointLight(0xa855f7, 0.9, 6);
    pointLight.position.set(-2, 2, 2);
    scene.add(pointLight);

    // Pivot Root
    const modelRoot = new THREE.Group();
    scene.add(modelRoot);

    // 1. DESK SETUP ONLY: show ONLY the desk, no avatar, no pet
    if (isDeskMode) {
      const deskGroup = buildVoxelDesk(desk, { includePet: false });
      deskGroup.position.set(0, 0, 0);
      modelRoot.add(deskGroup);
      deskGroupRef.current = deskGroup;
    }
    // 2. PET COMPANION ONLY: show ONLY the pet, no avatar, no desk
    else if (isPetMode) {
      if (desk.petType && desk.petType !== 'none') {
        const petGroup = buildVoxelPet(desk.petType, desk.petColor);
        petGroup.position.set(0, 0, 0);
        modelRoot.add(petGroup);
      }
    }
    // 3. AVATAR (Face, Wardrobe, Activity, Profile): show ONLY the avatar
    else {
      const avatarInstance = buildVoxelAvatar(avatar);
      avatarInstance.group.position.set(0, 0, 0);
      avatarInstance.group.rotation.y = 0;
      modelRoot.add(avatarInstance.group);
      avatarInstanceRef.current = avatarInstance;
    }

    // Floor pedestal
    const pedestalGeo = new THREE.CylinderGeometry(1.8, 1.8, 0.1, 24);
    const pedestalMat = new THREE.MeshStandardMaterial({ color: 0x2e1065, flatShading: true });
    const pedestal = new THREE.Mesh(pedestalGeo, pedestalMat);
    pedestal.position.set(0, -0.05, 0);
    pedestal.receiveShadow = true;
    modelRoot.add(pedestal);

    // Animation Loop
    let animId: number;
    let clock = new THREE.Clock();

    const animate = () => {
      animId = requestAnimationFrame(animate);
      const t = clock.getElapsedTime();

      if (!isDragging.current) {
        rotationY.current += 0.005;
      }
      modelRoot.rotation.y = rotationY.current;

      if (avatarInstanceRef.current) {
        const isSitting = category === 'desk';
        avatarInstanceRef.current.updateAnimation(t, false, isSitting, avatar.activity);
      }

      renderer.render(scene, camera);
    };

    animate();

    return () => {
      cancelAnimationFrame(animId);
      renderer.dispose();
    };
  }, [avatar, desk, category]);

  const handleMouseDown = (e: React.MouseEvent) => {
    isDragging.current = true;
    lastMouseX.current = e.clientX;
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging.current) return;
    const delta = e.clientX - lastMouseX.current;
    rotationY.current += delta * 0.02;
    lastMouseX.current = e.clientX;
  };

  const handleMouseUp = () => {
    isDragging.current = false;
  };

  return (
    <div
      ref={containerRef}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
      className="relative flex flex-col items-center justify-center cursor-grab active:cursor-grabbing group"
    >
      <canvas
        ref={canvasRef}
        className="w-[220px] h-[220px] rounded-2xl border border-purple-500/40 shadow-inner"
        style={{ imageRendering: 'pixelated' }}
      />
      <div className="absolute bottom-2 text-[10px] font-cozy text-purple-300/80 bg-purple-900/70 px-2 py-0.5 rounded-full border border-purple-700/40 flex items-center gap-1">
        <RotateCw className="w-2.5 h-2.5 animate-spin" style={{ animationDuration: '4s' }} />
        <span>Drag to rotate 3D</span>
      </div>
    </div>
  );
};

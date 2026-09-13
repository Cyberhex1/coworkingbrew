import * as THREE from 'three';
import { AvatarConfig, DeskConfig, CoWorkingRoom, TimeOfDay } from '../types';

// Helper to create box meshes with standard materials
export function createVoxelBox(
  width: number,
  height: number,
  depth: number,
  color: string | number,
  options?: {
    roughness?: number;
    metalness?: number;
    emissive?: string | number;
    emissiveIntensity?: number;
    transparent?: boolean;
    opacity?: number;
  }
): THREE.Mesh {
  const geometry = new THREE.BoxGeometry(width, height, depth);
  const material = new THREE.MeshStandardMaterial({
    color: new THREE.Color(color),
    roughness: options?.roughness ?? 0.75,
    metalness: options?.metalness ?? 0.1,
    emissive: options?.emissive ? new THREE.Color(options.emissive) : new THREE.Color(0x000000),
    emissiveIntensity: options?.emissiveIntensity ?? 0,
    transparent: options?.transparent ?? false,
    opacity: options?.opacity ?? 1,
    flatShading: true,
  });
  const mesh = new THREE.Mesh(geometry, material);
  mesh.castShadow = true;
  mesh.receiveShadow = true;
  return mesh;
}

// -------------------------------------------------------------
// 3D Nametag & Speech Bubble Sprite (High-DPI, Crystal Clear Contrast)
// -------------------------------------------------------------
export function create3DNametagSprite(
  name: string,
  task?: string,
  reaction?: string,
  isUser: boolean = false
): { sprite: THREE.Sprite; updateText: (n: string, t?: string, r?: string) => void } {
  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 256;
  const ctx = canvas.getContext('2d')!;

  const texture = new THREE.CanvasTexture(canvas);
  texture.minFilter = THREE.LinearFilter;
  texture.magFilter = THREE.LinearFilter;
  texture.generateMipmaps = false;

  const spriteMaterial = new THREE.SpriteMaterial({
    map: texture,
    transparent: true,
    depthTest: false,
    depthWrite: false,
  });

  const sprite = new THREE.Sprite(spriteMaterial);
  sprite.position.set(0, 2.35, 0);
  sprite.scale.set(3.6, 1.8, 1);
  sprite.renderOrder = 9999;
  sprite.visible = false; // Vector HTML overlay handles nametags with 100% crisp typography

  const draw = (currentName: string, currentTask?: string, currentReaction?: string) => {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    const centerX = canvas.width / 2;

    // 1. Draw Emoji reaction bubble if present (Floating top center)
    if (currentReaction) {
      ctx.save();
      ctx.shadowColor = 'rgba(168, 85, 247, 0.8)';
      ctx.shadowBlur = 16;
      ctx.fillStyle = '#1e113a';
      ctx.strokeStyle = '#c084fc';
      ctx.lineWidth = 4;
      ctx.beginPath();
      ctx.arc(centerX, 45, 36, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();

      ctx.shadowColor = 'transparent';
      ctx.font = '40px "Segoe UI Emoji", "Apple Color Emoji", sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(currentReaction, centerX, 47);
      ctx.restore();
    }

    // 2. Draw High-Contrast Name & Task Badge Container
    const boxY = currentReaction ? 95 : 105;
    const boxHeight = currentTask ? 120 : 85;

    ctx.font = 'bold 36px "Fredoka", "Inter", sans-serif';
    const nameMeasure = ctx.measureText(currentName || 'Player').width;
    const boxWidth = Math.max(340, Math.min(480, nameMeasure + 130));
    const boxX = centerX - boxWidth / 2;

    ctx.save();
    ctx.shadowColor = isUser ? 'rgba(56, 189, 248, 0.8)' : 'rgba(168, 85, 247, 0.7)';
    ctx.shadowBlur = 18;

    // Solid High-Contrast Background Badge
    ctx.fillStyle = isUser ? '#0b1329' : '#170c2c';
    ctx.strokeStyle = isUser ? '#38bdf8' : '#c084fc';
    ctx.lineWidth = 5;

    ctx.beginPath();
    ctx.roundRect(boxX, boxY, boxWidth, boxHeight, 22);
    ctx.fill();
    ctx.stroke();

    // User Avatar / Role Dot Indicator
    const dotX = boxX + 32;
    const dotY = boxY + (currentTask ? 38 : boxHeight / 2);
    ctx.beginPath();
    ctx.arc(dotX, dotY, 10, 0, Math.PI * 2);
    ctx.fillStyle = isUser ? '#38bdf8' : '#34d399';
    ctx.fill();
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 2.5;
    ctx.stroke();

    // Text: Name (Crystal clear white typography with black outline)
    ctx.shadowColor = 'transparent';
    ctx.font = 'bold 36px "Fredoka", "Inter", sans-serif';
    ctx.textAlign = 'left';
    ctx.textBaseline = 'middle';

    ctx.lineWidth = 6;
    ctx.strokeStyle = '#000000';
    ctx.strokeText(currentName || 'Player', boxX + 54, dotY);

    ctx.fillStyle = '#ffffff';
    ctx.fillText(currentName || 'Player', boxX + 54, dotY);

    if (isUser) {
      const youBadgeX = boxX + 54 + nameMeasure + 12;
      if (youBadgeX + 60 < boxX + boxWidth) {
        ctx.fillStyle = '#38bdf8';
        ctx.font = 'bold 20px "Fredoka", "Inter", sans-serif';
        ctx.fillText('YOU', youBadgeX, dotY);
      }
    }

    // Text: Task Badge Pill (at bottom of nametag if present)
    if (currentTask) {
      const taskPillY = boxY + 74;
      const taskPillHeight = 34;
      const taskPillWidth = boxWidth - 40;
      const taskPillX = boxX + 20;

      ctx.fillStyle = 'rgba(56, 189, 248, 0.2)';
      ctx.strokeStyle = 'rgba(56, 189, 248, 0.6)';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.roundRect(taskPillX, taskPillY, taskPillWidth, taskPillHeight, 10);
      ctx.fill();
      ctx.stroke();

      ctx.fillStyle = '#93c5fd';
      ctx.font = 'bold 20px "Fredoka", "Inter", sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';

      const truncated = currentTask.length > 22 ? currentTask.substring(0, 20) + '...' : currentTask;
      ctx.fillText(`⚡ ${truncated}`, centerX, taskPillY + taskPillHeight / 2);
    }

    ctx.restore();
    texture.needsUpdate = true;
  };

  draw(name, task, reaction);

  return {
    sprite,
    updateText: draw,
  };
}

// -------------------------------------------------------------
// 3D Voxel Avatar Builder
// -------------------------------------------------------------
export interface VoxelAvatarInstance {
  group: THREE.Group;
  head: THREE.Group;
  body: THREE.Group;
  leftArm: THREE.Group;
  rightArm: THREE.Group;
  leftLeg: THREE.Group;
  rightLeg: THREE.Group;
  tail?: THREE.Group;
  nametagSprite?: { sprite: THREE.Sprite; updateText: (n: string, t?: string, r?: string) => void };
  updateAnimation: (time: number, isWalking: boolean, isSitting: boolean, activity?: string) => void;
  updateNametag: (name: string, task?: string, reaction?: string) => void;
}

export function buildVoxelAvatar(
  config: AvatarConfig,
  displayName?: string,
  currentTask?: string,
  reaction?: string,
  isUser: boolean = false
): VoxelAvatarInstance {
  const group = new THREE.Group();

  // Root pivot
  const root = new THREE.Group();
  group.add(root);

  // 1. Head Group (Positioned at neck)
  const headGroup = new THREE.Group();
  headGroup.position.set(0, 1.35, 0);
  root.add(headGroup);

  // Head Base
  const headBase = createVoxelBox(0.7, 0.65, 0.65, config.skinColor);
  headGroup.add(headBase);

  // Face features (Eyes at +Z front)
  const eyeColor = config.eyeColor || '#222222';
  const leftEye = createVoxelBox(0.09, 0.09, 0.04, eyeColor);
  leftEye.position.set(-0.16, 0.02, 0.33);
  const rightEye = createVoxelBox(0.09, 0.09, 0.04, eyeColor);
  rightEye.position.set(0.16, 0.02, 0.33);
  headGroup.add(leftEye, rightEye);

  // Eye shines
  const leftShine = createVoxelBox(0.03, 0.03, 0.02, '#ffffff');
  leftShine.position.set(-0.18, 0.04, 0.355);
  const rightShine = createVoxelBox(0.03, 0.03, 0.02, '#ffffff');
  rightShine.position.set(0.14, 0.04, 0.355);
  headGroup.add(leftShine, rightShine);

  // Blush Cheeks
  const leftBlush = createVoxelBox(0.1, 0.05, 0.02, '#fb7185', { transparent: true, opacity: 0.8 });
  leftBlush.position.set(-0.22, -0.1, 0.335);
  const rightBlush = createVoxelBox(0.1, 0.05, 0.02, '#fb7185', { transparent: true, opacity: 0.8 });
  rightBlush.position.set(0.22, -0.1, 0.335);
  headGroup.add(leftBlush, rightBlush);

  // Hair Generation
  const hairColor = config.hairColor || '#4a2c11';
  const hairGroup = new THREE.Group();
  headGroup.add(hairGroup);

  // Hair Top Cap Base
  const hairTop = createVoxelBox(0.76, 0.22, 0.72, hairColor);
  hairTop.position.set(0, 0.26, -0.02);
  hairGroup.add(hairTop);

  // Hair Back Base
  const hairBack = createVoxelBox(0.76, 0.55, 0.2, hairColor);
  hairBack.position.set(0, 0.02, -0.28);
  hairGroup.add(hairBack);

  // Hair Style Specific 3D Voxel Models (All 8 Styles)
  if (config.hairStyle === 'short') {
    // 1. Classic Short & Side-Part Fade
    const hairL = createVoxelBox(0.14, 0.42, 0.65, hairColor);
    hairL.position.set(-0.35, 0.1, -0.02);
    const hairR = createVoxelBox(0.14, 0.42, 0.65, hairColor);
    hairR.position.set(0.35, 0.1, -0.02);
    const bangs = createVoxelBox(0.68, 0.15, 0.16, hairColor);
    bangs.position.set(0.02, 0.22, 0.28);
    const topCrop = createVoxelBox(0.72, 0.14, 0.66, hairColor);
    topCrop.position.set(0, 0.35, -0.02);
    hairGroup.add(hairL, hairR, bangs, topCrop);
  } else if (config.hairStyle === 'messy') {
    // 2. Messy Layered Curls
    const hairL = createVoxelBox(0.2, 0.55, 0.68, hairColor);
    hairL.position.set(-0.36, 0.04, 0.02);
    const hairR = createVoxelBox(0.2, 0.55, 0.68, hairColor);
    hairR.position.set(0.36, 0.04, 0.02);
    const curl1 = createVoxelBox(0.32, 0.2, 0.18, hairColor);
    curl1.position.set(-0.16, 0.2, 0.3);
    curl1.rotation.z = 0.15;
    const curl2 = createVoxelBox(0.34, 0.18, 0.18, hairColor);
    curl2.position.set(0.16, 0.22, 0.3);
    curl2.rotation.z = -0.2;
    const topTuft1 = createVoxelBox(0.25, 0.18, 0.25, hairColor);
    topTuft1.position.set(-0.12, 0.38, 0.08);
    topTuft1.rotation.z = 0.25;
    const topTuft2 = createVoxelBox(0.26, 0.2, 0.26, hairColor);
    topTuft2.position.set(0.14, 0.38, -0.06);
    topTuft2.rotation.z = -0.2;
    hairGroup.add(hairL, hairR, curl1, curl2, topTuft1, topTuft2);
  } else if (config.hairStyle === 'bob') {
    // 3. Sleek Chin-Length Cozy Bob
    const hairL = createVoxelBox(0.18, 0.62, 0.72, hairColor);
    hairL.position.set(-0.36, -0.04, 0.04);
    const hairR = createVoxelBox(0.18, 0.62, 0.72, hairColor);
    hairR.position.set(0.36, -0.04, 0.04);
    const curvedBangs = createVoxelBox(0.72, 0.18, 0.16, hairColor);
    curvedBangs.position.set(0, 0.18, 0.29);
    const backTuck = createVoxelBox(0.76, 0.65, 0.22, hairColor);
    backTuck.position.set(0, -0.04, -0.28);
    hairGroup.add(hairL, hairR, curvedBangs, backTuck);
  } else if (config.hairStyle === 'spiky') {
    // 4. Dynamic Spiky Anime Hair
    const hairL = createVoxelBox(0.14, 0.42, 0.6, hairColor);
    hairL.position.set(-0.35, 0.08, 0);
    const hairR = createVoxelBox(0.14, 0.42, 0.6, hairColor);
    hairR.position.set(0.35, 0.08, 0);
    const spike1 = createVoxelBox(0.2, 0.32, 0.2, hairColor);
    spike1.position.set(-0.2, 0.42, 0.1);
    spike1.rotation.z = 0.35;
    const spike2 = createVoxelBox(0.22, 0.36, 0.22, hairColor);
    spike2.position.set(0.08, 0.45, 0.12);
    spike2.rotation.z = -0.2;
    const spike3 = createVoxelBox(0.2, 0.28, 0.2, hairColor);
    spike3.position.set(0.24, 0.4, -0.05);
    spike3.rotation.z = -0.4;
    const spikeFront = createVoxelBox(0.24, 0.18, 0.18, hairColor);
    spikeFront.position.set(-0.06, 0.25, 0.3);
    spikeFront.rotation.x = -0.25;
    hairGroup.add(hairL, hairR, spike1, spike2, spike3, spikeFront);
  } else if (config.hairStyle === 'braids') {
    // 5. Twin Braids with Ribbons
    const bangs = createVoxelBox(0.7, 0.16, 0.16, hairColor);
    bangs.position.set(0, 0.2, 0.29);
    // Left Braid (3 segments + pink bow)
    const bL1 = createVoxelBox(0.15, 0.2, 0.15, hairColor);
    bL1.position.set(-0.36, 0.02, 0.16);
    const bL2 = createVoxelBox(0.14, 0.2, 0.14, hairColor);
    bL2.position.set(-0.36, -0.16, 0.16);
    const bL3 = createVoxelBox(0.12, 0.2, 0.12, hairColor);
    bL3.position.set(-0.36, -0.34, 0.16);
    const bowL = createVoxelBox(0.16, 0.08, 0.16, '#f472b6');
    bowL.position.set(-0.36, -0.44, 0.16);

    // Right Braid (3 segments + pink bow)
    const bR1 = createVoxelBox(0.15, 0.2, 0.15, hairColor);
    bR1.position.set(0.36, 0.02, 0.16);
    const bR2 = createVoxelBox(0.14, 0.2, 0.14, hairColor);
    bR2.position.set(0.36, -0.16, 0.16);
    const bR3 = createVoxelBox(0.12, 0.2, 0.12, hairColor);
    bR3.position.set(0.36, -0.34, 0.16);
    const bowR = createVoxelBox(0.16, 0.08, 0.16, '#f472b6');
    bowR.position.set(0.36, -0.44, 0.16);

    hairGroup.add(bangs, bL1, bL2, bL3, bowL, bR1, bR2, bR3, bowR);
  } else if (config.hairStyle === 'ponytail') {
    // 6. High Ponytail with Scrunchie
    const bangs = createVoxelBox(0.68, 0.16, 0.16, hairColor);
    bangs.position.set(0, 0.22, 0.29);
    const hairL = createVoxelBox(0.15, 0.45, 0.65, hairColor);
    hairL.position.set(-0.35, 0.06, -0.02);
    const hairR = createVoxelBox(0.15, 0.45, 0.65, hairColor);
    hairR.position.set(0.35, 0.06, -0.02);
    // Scrunchie & Ponytail
    const scrunchie = createVoxelBox(0.24, 0.12, 0.24, '#ec4899');
    scrunchie.position.set(0, 0.32, -0.38);
    const ponytail = createVoxelBox(0.22, 0.58, 0.22, hairColor);
    ponytail.position.set(0, 0.12, -0.48);
    ponytail.rotation.x = 0.35;
    hairGroup.add(bangs, hairL, hairR, scrunchie, ponytail);
  } else if (config.hairStyle === 'fringe') {
    // 7. Full Fringe Bangs & Long Straight Layers
    const fringeBangs = createVoxelBox(0.74, 0.22, 0.16, hairColor);
    fringeBangs.position.set(0, 0.18, 0.3);
    const hairL = createVoxelBox(0.18, 0.65, 0.65, hairColor);
    hairL.position.set(-0.35, -0.06, 0.02);
    const hairR = createVoxelBox(0.18, 0.65, 0.65, hairColor);
    hairR.position.set(0.35, -0.06, 0.02);
    const longBack = createVoxelBox(0.76, 0.75, 0.2, hairColor);
    longBack.position.set(0, -0.15, -0.28);
    hairGroup.add(fringeBangs, hairL, hairR, longBack);
  } else if (config.hairStyle === 'afro') {
    // 8. Voluminous Cloud Afro
    const afroMain = createVoxelBox(0.96, 0.78, 0.92, hairColor);
    afroMain.position.set(0, 0.28, -0.04);
    const afroL = createVoxelBox(0.24, 0.65, 0.75, hairColor);
    afroL.position.set(-0.46, 0.22, -0.04);
    const afroR = createVoxelBox(0.24, 0.65, 0.75, hairColor);
    afroR.position.set(0.46, 0.22, -0.04);
    const afroFront = createVoxelBox(0.85, 0.3, 0.24, hairColor);
    afroFront.position.set(0, 0.26, 0.32);
    hairGroup.add(afroMain, afroL, afroR, afroFront);
  }

  // Hats & Accessories
  if (config.hat === 'beanie') {
    const beanie = createVoxelBox(0.8, 0.28, 0.78, '#c084fc');
    beanie.position.set(0, 0.32, -0.02);
    const puff = createVoxelBox(0.18, 0.18, 0.18, '#ffffff');
    puff.position.set(0, 0.5, -0.05);
    headGroup.add(beanie, puff);
  } else if (config.hat === 'frog') {
    const frogHat = createVoxelBox(0.85, 0.22, 0.85, '#22c55e');
    frogHat.position.set(0, 0.32, 0);
    const eyeL = createVoxelBox(0.16, 0.16, 0.16, '#22c55e');
    eyeL.position.set(-0.25, 0.46, 0.15);
    const eyeR = createVoxelBox(0.16, 0.16, 0.16, '#22c55e');
    eyeR.position.set(0.25, 0.46, 0.15);
    const pupilL = createVoxelBox(0.06, 0.06, 0.04, '#111827');
    pupilL.position.set(-0.25, 0.46, 0.24);
    const pupilR = createVoxelBox(0.06, 0.06, 0.04, '#111827');
    pupilR.position.set(0.25, 0.46, 0.24);
    headGroup.add(frogHat, eyeL, eyeR, pupilL, pupilR);
  } else if (config.hat === 'wizard') {
    const brim = createVoxelBox(0.95, 0.08, 0.95, '#6366f1');
    brim.position.set(0, 0.32, 0);
    const cone1 = createVoxelBox(0.55, 0.3, 0.55, '#4f46e5');
    cone1.position.set(0, 0.48, 0);
    const cone2 = createVoxelBox(0.3, 0.35, 0.3, '#4338ca');
    cone2.position.set(0, 0.72, -0.05);
    cone2.rotation.x = -0.2;
    headGroup.add(brim, cone1, cone2);
  } else if (config.hat === 'crown') {
    const crown = createVoxelBox(0.78, 0.18, 0.78, '#f59e0b', { metalness: 0.7, roughness: 0.3 });
    crown.position.set(0, 0.36, 0);
    headGroup.add(crown);
  } else if (config.hat === 'headphones') {
    const band = createVoxelBox(0.78, 0.1, 0.2, '#1e293b');
    band.position.set(0, 0.38, 0);
    const earL = createVoxelBox(0.12, 0.25, 0.25, '#ec4899', { emissive: '#ec4899', emissiveIntensity: 0.3 });
    earL.position.set(-0.38, 0.05, 0);
    const earR = createVoxelBox(0.12, 0.25, 0.25, '#ec4899', { emissive: '#ec4899', emissiveIntensity: 0.3 });
    earR.position.set(0.38, 0.05, 0);
    headGroup.add(band, earL, earR);
  }

  // Glasses
  if (config.glasses === 'round' || config.glasses === 'square') {
    const frameL = createVoxelBox(0.2, 0.14, 0.04, '#1f2937');
    frameL.position.set(-0.16, 0.02, 0.34);
    const frameR = createVoxelBox(0.2, 0.14, 0.04, '#1f2937');
    frameR.position.set(0.16, 0.02, 0.34);
    const bridge = createVoxelBox(0.14, 0.04, 0.03, '#1f2937');
    bridge.position.set(0, 0.04, 0.34);
    headGroup.add(frameL, frameR, bridge);
  } else if (config.glasses === 'cyber') {
    const visor = createVoxelBox(0.68, 0.12, 0.08, '#06b6d4', {
      emissive: '#06b6d4',
      emissiveIntensity: 0.7,
      transparent: true,
      opacity: 0.9,
    });
    visor.position.set(0, 0.03, 0.34);
    headGroup.add(visor);
  }

  // 2. Torso / Body Group
  const bodyGroup = new THREE.Group();
  bodyGroup.position.set(0, 0.75, 0);
  root.add(bodyGroup);

  const clothColor = config.clothingColor || '#8b5cf6';
  const torso = createVoxelBox(0.55, 0.65, 0.38, clothColor);
  bodyGroup.add(torso);

  // 3. Limbs (Arms & Legs)
  const leftArm = new THREE.Group();
  leftArm.position.set(-0.38, 0.25, 0);
  const leftArmMesh = createVoxelBox(0.18, 0.55, 0.22, clothColor);
  leftArmMesh.position.set(0, -0.2, 0);
  const leftHandMesh = createVoxelBox(0.16, 0.15, 0.2, config.skinColor);
  leftHandMesh.position.set(0, -0.45, 0);
  leftArm.add(leftArmMesh, leftHandMesh);
  bodyGroup.add(leftArm);

  const rightArm = new THREE.Group();
  rightArm.position.set(0.38, 0.25, 0);
  const rightArmMesh = createVoxelBox(0.18, 0.55, 0.22, clothColor);
  rightArmMesh.position.set(0, -0.2, 0);
  const rightHandMesh = createVoxelBox(0.16, 0.15, 0.2, config.skinColor);
  rightHandMesh.position.set(0, -0.45, 0);
  rightArm.add(rightArmMesh, rightHandMesh);
  bodyGroup.add(rightArm);

  // Legs
  const leftLeg = new THREE.Group();
  leftLeg.position.set(-0.16, 0.42, 0);
  const leftPants = createVoxelBox(0.2, 0.42, 0.25, '#334155');
  leftPants.position.set(0, -0.2, 0);
  const leftShoe = createVoxelBox(0.22, 0.14, 0.3, '#1e293b');
  leftShoe.position.set(0, -0.38, 0.03);
  leftLeg.add(leftPants, leftShoe);
  root.add(leftLeg);

  const rightLeg = new THREE.Group();
  rightLeg.position.set(0.16, 0.42, 0);
  const rightPants = createVoxelBox(0.2, 0.42, 0.25, '#334155');
  rightPants.position.set(0, -0.2, 0);
  const rightShoe = createVoxelBox(0.22, 0.14, 0.3, '#1e293b');
  rightShoe.position.set(0, -0.38, 0.03);
  rightLeg.add(rightPants, rightShoe);
  root.add(rightLeg);

  // Tail
  let tailGroup: THREE.Group | undefined;
  if (config.tail && config.tail !== 'none') {
    tailGroup = new THREE.Group();
    tailGroup.position.set(0, -0.2, -0.2);
    const tailColor = config.tail === 'fox' ? '#f97316' : clothColor;
    const tailMesh = createVoxelBox(0.16, 0.38, 0.16, tailColor);
    tailMesh.position.set(0, 0.15, -0.15);
    tailMesh.rotation.x = -0.6;
    tailGroup.add(tailMesh);
    bodyGroup.add(tailGroup);
  }

  // 4. Integrated 3D Nametag & Speech Bubble Sprite (Child of Avatar Group for 0 Lag!)
  let nametagSpriteObj: { sprite: THREE.Sprite; updateText: (n: string, t?: string, r?: string) => void } | undefined;
  if (displayName) {
    nametagSpriteObj = create3DNametagSprite(displayName, currentTask, reaction, isUser);
    group.add(nametagSpriteObj.sprite);
  }

  // Animation Updater
  const updateAnimation = (time: number, isWalking: boolean, isSitting: boolean, activity?: string) => {
    if (isSitting) {
      // Sitting Pose: sitting in office chair, legs extending forward into under-desk space
      root.position.y = -0.2;
      leftLeg.position.set(-0.16, 0.25, 0.14);
      leftLeg.rotation.x = -Math.PI / 2.1;
      rightLeg.position.set(0.16, 0.25, 0.14);
      rightLeg.rotation.x = -Math.PI / 2.1;

      // Activity specific arm poses reaching forward onto desk keyboard
      if (activity === 'typing' || activity === 'coding') {
        const typeOffset = Math.sin(time * 14) * 0.1;
        leftArm.rotation.x = -1.25 + typeOffset;
        leftArm.rotation.y = 0.25;
        rightArm.rotation.x = -1.25 - typeOffset;
        rightArm.rotation.y = -0.25;
        headGroup.rotation.x = 0.12 + Math.sin(time * 3) * 0.02;
      } else if (activity === 'tea' || activity === 'coffee') {
        leftArm.rotation.x = -1.1;
        rightArm.rotation.x = -1.35 + Math.sin(time * 2) * 0.12;
        headGroup.rotation.x = 0.1;
      } else if (activity === 'reading' || activity === 'writing') {
        leftArm.rotation.x = -1.05;
        rightArm.rotation.x = -1.2 + Math.sin(time * 6) * 0.08;
        headGroup.rotation.x = 0.22;
      } else {
        leftArm.rotation.x = -0.95;
        rightArm.rotation.x = -0.95;
        headGroup.rotation.x = Math.sin(time * 2) * 0.04;
      }
    } else if (isWalking) {
      // Walk Cycle
      const walkFreq = 9;
      root.position.y = Math.abs(Math.sin(time * walkFreq)) * 0.08;
      leftLeg.position.set(-0.16, 0.42, 0);
      rightLeg.position.set(0.16, 0.42, 0);
      leftLeg.rotation.x = Math.sin(time * walkFreq) * 0.6;
      rightLeg.rotation.x = -Math.sin(time * walkFreq) * 0.6;
      leftArm.rotation.x = -Math.sin(time * walkFreq) * 0.6;
      rightArm.rotation.x = Math.sin(time * walkFreq) * 0.6;
      headGroup.rotation.y = Math.sin(time * walkFreq * 0.5) * 0.08;
    } else {
      // Idle Breathing
      root.position.y = 0;
      leftLeg.position.set(-0.16, 0.42, 0);
      rightLeg.position.set(0.16, 0.42, 0);
      leftLeg.rotation.set(0, 0, 0);
      rightLeg.rotation.set(0, 0, 0);
      leftArm.rotation.x = Math.sin(time * 2) * 0.05;
      rightArm.rotation.x = -Math.sin(time * 2) * 0.05;
      headGroup.rotation.x = Math.sin(time * 2) * 0.03;
      bodyGroup.position.y = 0.75 + Math.sin(time * 2) * 0.015;
    }

    if (tailGroup) {
      tailGroup.rotation.y = Math.sin(time * 4) * 0.3;
    }
  };

  const updateNametag = (name: string, task?: string, react?: string) => {
    if (nametagSpriteObj) {
      nametagSpriteObj.updateText(name, task, react);
    }
  };

  return {
    group,
    head: headGroup,
    body: bodyGroup,
    leftArm,
    rightArm,
    leftLeg,
    rightLeg,
    tail: tailGroup,
    nametagSprite: nametagSpriteObj,
    updateAnimation,
    updateNametag,
  };
}

// -------------------------------------------------------------
// 3D Voxel Modern Office Workstation Desk Builder
// Center of Desk Group is (0, 0, 0)
// Tabletop: z = 0, Ergonomic Chair: z = -0.42 (Facing +Z)
// -------------------------------------------------------------
export function buildVoxelDesk(
  deskConfig: DeskConfig,
  options: { includePet?: boolean } = { includePet: true }
): THREE.Group {
  const group = new THREE.Group();

  let deskColor = '#f1f5f9'; // Clean Modern Tech White / Ash
  if (deskConfig.deskStyle === 'walnut') deskColor = '#451a03';
  else if (deskConfig.deskStyle === 'sakura') deskColor = '#fbcfe8';
  else if (deskConfig.deskStyle === 'cyber') deskColor = '#0f172a';
  else if (deskConfig.deskStyle === 'crystal') deskColor = '#c7d2fe';
  else if (deskConfig.deskStyle === 'vintage') deskColor = '#78350f';

  // 1. Office Desk Tabletop (width 1.7, depth 0.95, height 0.08)
  const tabletop = createVoxelBox(1.7, 0.08, 0.95, deskColor, {
    roughness: 0.4,
    metalness: 0.1,
    emissive: deskConfig.deskStyle === 'cyber' ? '#6366f1' : '#000000',
    emissiveIntensity: deskConfig.deskStyle === 'cyber' ? 0.25 : 0,
  });
  tabletop.position.set(0, 0.74, 0);
  group.add(tabletop);

  // 2. Heavy-Duty Steel Frame & Legs
  const legColor = '#1e293b';
  const legPositions = [
    [-0.75, 0.35, -0.38],
    [0.75, 0.35, -0.38],
    [-0.75, 0.35, 0.38],
    [0.75, 0.35, 0.38],
  ];
  legPositions.forEach(([x, y, z]) => {
    const leg = createVoxelBox(0.08, 0.7, 0.08, legColor, { metalness: 0.8, roughness: 0.3 });
    leg.position.set(x, y, z);
    group.add(leg);
  });

  // Cross support beam
  const supportBeam = createVoxelBox(1.5, 0.06, 0.06, legColor, { metalness: 0.8, roughness: 0.3 });
  supportBeam.position.set(0, 0.3, 0.35);
  group.add(supportBeam);

  // 3. Under-Desk Rolling Filing Pedestal (2 Drawers with metal handles)
  const pedestal = new THREE.Group();
  pedestal.position.set(0.52, 0.34, 0);
  const pedBody = createVoxelBox(0.42, 0.6, 0.65, '#334155');
  const pedHandle1 = createVoxelBox(0.16, 0.03, 0.04, '#cbd5e1', { metalness: 0.9 });
  pedHandle1.position.set(0, 0.15, -0.33);
  const pedHandle2 = createVoxelBox(0.16, 0.03, 0.04, '#cbd5e1', { metalness: 0.9 });
  pedHandle2.position.set(0, -0.15, -0.33);
  pedestal.add(pedBody, pedHandle1, pedHandle2);
  group.add(pedestal);

  // 4. Acoustic Felt Modesty / Privacy Screen on Front Edge (z = 0.45)
  const privacyScreen = createVoxelBox(1.65, 0.42, 0.05, '#0d9488', { roughness: 0.9 });
  privacyScreen.position.set(0, 0.95, 0.44);
  group.add(privacyScreen);

  // 5. Ergonomic Desk Mat (in front of seated player)
  const deskMat = createVoxelBox(1.35, 0.015, 0.55, '#0f172a');
  deskMat.position.set(0, 0.785, -0.1);
  group.add(deskMat);

  // 6. Mechanical Keyboard & Mouse (at z = -0.16 right under avatar's hands)
  const keyboard = createVoxelBox(0.38, 0.025, 0.14, '#1e293b');
  keyboard.position.set(-0.06, 0.8, -0.16);
  // RGB Key glow line
  const keyGlow = createVoxelBox(0.34, 0.01, 0.1, '#38bdf8', { emissive: '#38bdf8', emissiveIntensity: 0.6 });
  keyGlow.position.set(-0.06, 0.815, -0.16);

  const mouse = createVoxelBox(0.07, 0.025, 0.1, '#1e293b');
  mouse.position.set(0.28, 0.8, -0.16);
  group.add(keyboard, keyGlow, mouse);

  // 7. Modern Office Dual Monitors (placed at z = 0.22, facing BACK at seated player at z = -0.42)
  // Main Landscape Monitor
  const stand1 = createVoxelBox(0.06, 0.28, 0.06, '#334155');
  stand1.position.set(-0.25, 0.92, 0.22);
  const monitorBezel1 = createVoxelBox(0.65, 0.42, 0.04, '#1e293b');
  monitorBezel1.position.set(-0.25, 1.16, 0.22);
  // Screen facing seated avatar (-Z)
  const screen1 = createVoxelBox(0.61, 0.38, 0.01, '#0284c7', {
    emissive: '#38bdf8',
    emissiveIntensity: 0.85,
  });
  screen1.position.set(-0.25, 1.16, 0.195);
  group.add(stand1, monitorBezel1, screen1);

  // Secondary Portrait Code / Chat Monitor (Angled slightly towards player)
  const stand2 = createVoxelBox(0.06, 0.28, 0.06, '#334155');
  stand2.position.set(0.34, 0.92, 0.18);
  const monitorBezel2 = createVoxelBox(0.34, 0.52, 0.04, '#1e293b');
  monitorBezel2.position.set(0.34, 1.2, 0.18);
  monitorBezel2.rotation.y = 0.22;
  const screen2 = createVoxelBox(0.3, 0.48, 0.01, '#7c3aed', {
    emissive: '#c084fc',
    emissiveIntensity: 0.85,
  });
  screen2.position.set(0.34, 1.2, 0.155);
  screen2.rotation.y = 0.22;
  group.add(stand2, monitorBezel2, screen2);

  // 8. Modern Ergonomic Mesh Office Chair (Positioned at z = -0.42, FACING +Z)
  const chair = new THREE.Group();
  chair.position.set(0, 0, -0.42);

  const seat = createVoxelBox(0.58, 0.08, 0.52, '#334155');
  seat.position.set(0, 0.44, 0);

  // Chair back is BEHIND the player at z = -0.26 (relative to chair center)
  const chairBack = createVoxelBox(0.54, 0.65, 0.08, '#1e293b');
  chairBack.position.set(0, 0.78, -0.24);

  const headrest = createVoxelBox(0.3, 0.14, 0.08, '#0f172a');
  headrest.position.set(0, 1.16, -0.26);

  const armrestL = createVoxelBox(0.08, 0.24, 0.35, '#0f172a');
  armrestL.position.set(-0.31, 0.58, 0);
  const armrestR = createVoxelBox(0.08, 0.24, 0.35, '#0f172a');
  armrestR.position.set(0.31, 0.58, 0);

  const chairStem = createVoxelBox(0.09, 0.42, 0.09, '#0f172a', { metalness: 0.8 });
  chairStem.position.set(0, 0.21, 0);

  const chairBase = createVoxelBox(0.55, 0.04, 0.55, '#0f172a');
  chairBase.position.set(0, 0.02, 0);

  chair.add(seat, chairBack, headrest, armrestL, armrestR, chairStem, chairBase);
  group.add(chair);

  // 9. Desk Accessories
  if (deskConfig.deskAccessory === 'mug') {
    const mug = createVoxelBox(0.12, 0.14, 0.12, '#22c55e');
    mug.position.set(0.58, 0.85, -0.12);
    const steam = createVoxelBox(0.04, 0.08, 0.04, '#f8fafc', { transparent: true, opacity: 0.6 });
    steam.position.set(0.58, 0.98, -0.12);
    group.add(mug, steam);
  } else if (deskConfig.deskAccessory === 'succulent' || deskConfig.deskAccessory === 'bonsai') {
    const pot = createVoxelBox(0.16, 0.12, 0.16, '#ea580c');
    pot.position.set(-0.6, 0.84, 0.15);
    const plant = createVoxelBox(0.22, 0.22, 0.22, '#16a34a');
    plant.position.set(-0.6, 0.98, 0.15);
    group.add(pot, plant);
  } else if (deskConfig.deskAccessory === 'mushroom_lamp' || deskConfig.deskAccessory === 'lava_lamp') {
    const lampStem = createVoxelBox(0.06, 0.28, 0.06, '#f59e0b');
    lampStem.position.set(-0.6, 0.9, 0.15);
    const lampCap = createVoxelBox(0.24, 0.14, 0.24, '#ef4444', {
      emissive: '#f87171',
      emissiveIntensity: 0.8,
    });
    lampCap.position.set(-0.6, 1.08, 0.15);
    group.add(lampStem, lampCap);
  }

  // 10. Companion Pet Beside Seated Avatar
  if (options.includePet !== false && deskConfig.petType && deskConfig.petType !== 'none') {
    const petGroup = buildVoxelPet(deskConfig.petType, deskConfig.petColor);
    petGroup.position.set(0.85, 0, -0.2);
    group.add(petGroup);
  }

  return group;
}

// -------------------------------------------------------------
// 3D Voxel Companion Pet Builder
// -------------------------------------------------------------
export function buildVoxelPet(type: DeskConfig['petType'], color?: string): THREE.Group {
  const pet = new THREE.Group();

  if (type === 'shiba') {
    const c = color || '#f59e0b';
    const body = createVoxelBox(0.35, 0.25, 0.45, c);
    body.position.set(0, 0.22, 0);
    const head = createVoxelBox(0.26, 0.24, 0.26, c);
    head.position.set(0, 0.38, 0.22);
    const snout = createVoxelBox(0.12, 0.08, 0.1, '#ffffff');
    snout.position.set(0, 0.34, 0.38);
    const earL = createVoxelBox(0.06, 0.08, 0.04, c);
    earL.position.set(-0.1, 0.52, 0.22);
    const earR = createVoxelBox(0.06, 0.08, 0.04, c);
    earR.position.set(0.1, 0.52, 0.22);
    const tail = createVoxelBox(0.08, 0.18, 0.08, c);
    tail.position.set(0, 0.35, -0.22);
    tail.rotation.x = -0.4;
    pet.add(body, head, snout, earL, earR, tail);
  } else if (type === 'cat') {
    const c = color || '#f8fafc';
    const body = createVoxelBox(0.3, 0.22, 0.4, c);
    body.position.set(0, 0.18, 0);
    const head = createVoxelBox(0.24, 0.22, 0.24, c);
    head.position.set(0, 0.32, 0.18);
    const earL = createVoxelBox(0.06, 0.08, 0.04, '#fb7185');
    earL.position.set(-0.08, 0.44, 0.18);
    const earR = createVoxelBox(0.06, 0.08, 0.04, '#fb7185');
    earR.position.set(0.08, 0.44, 0.18);
    pet.add(body, head, earL, earR);
  } else if (type === 'capybara') {
    const body = createVoxelBox(0.45, 0.32, 0.55, '#a16207');
    body.position.set(0, 0.25, 0);
    const head = createVoxelBox(0.3, 0.28, 0.32, '#a16207');
    head.position.set(0, 0.4, 0.26);
    const yuzuOrange = createVoxelBox(0.12, 0.1, 0.12, '#f97316');
    yuzuOrange.position.set(0, 0.58, 0.26);
    pet.add(body, head, yuzuOrange);
  } else if (type === 'ghost') {
    const body = createVoxelBox(0.3, 0.45, 0.3, '#c7d2fe', { emissive: '#818cf8', emissiveIntensity: 0.5, transparent: true, opacity: 0.85 });
    body.position.set(0, 0.35, 0);
    const eyeL = createVoxelBox(0.05, 0.05, 0.02, '#1e1b4b');
    eyeL.position.set(-0.07, 0.42, 0.16);
    const eyeR = createVoxelBox(0.05, 0.05, 0.02, '#1e1b4b');
    eyeR.position.set(0.07, 0.42, 0.16);
    pet.add(body, eyeL, eyeR);
  } else if (type === 'dragon') {
    const c = color || '#10b981';
    const body = createVoxelBox(0.35, 0.28, 0.45, c);
    body.position.set(0, 0.24, 0);
    const head = createVoxelBox(0.26, 0.24, 0.26, c);
    head.position.set(0, 0.4, 0.22);
    const hornL = createVoxelBox(0.05, 0.14, 0.05, '#f59e0b');
    hornL.position.set(-0.1, 0.54, 0.18);
    const hornR = createVoxelBox(0.05, 0.14, 0.05, '#f59e0b');
    hornR.position.set(0.1, 0.54, 0.18);
    const wingL = createVoxelBox(0.25, 0.15, 0.04, '#34d399');
    wingL.position.set(-0.25, 0.35, -0.05);
    wingL.rotation.z = 0.5;
    const wingR = createVoxelBox(0.25, 0.15, 0.04, '#34d399');
    wingR.position.set(0.25, 0.35, -0.05);
    wingR.rotation.z = -0.5;
    pet.add(body, head, hornL, hornR, wingL, wingR);
  }

  return pet;
}

// -------------------------------------------------------------
// 3D Voxel High-Detail Tech Office Environment Builder
// -------------------------------------------------------------
export function buildVoxelRoom(room: CoWorkingRoom, timeOfDay: TimeOfDay): {
  roomGroup: THREE.Group;
  lightGroup: THREE.Group;
  updateLights: (tod: TimeOfDay) => void;
} {
  const roomGroup = new THREE.Group();
  const lightGroup = new THREE.Group();

  const roomWidth = 20;
  const roomDepth = 18;
  const wallHeight = 5.2;

  // 1. Professional Office Floor (Bright Nordic Ash Hardwood & Light Acoustic Carpet)
  const floorBase = createVoxelBox(roomWidth, 0.3, roomDepth, '#cbd5e1');
  floorBase.position.set(0, -0.15, 0);
  floorBase.receiveShadow = true;
  roomGroup.add(floorBase);

  // Main Workstation Modern Felt Carpet (Bright Modern Slate-Grey Felt - Expanded for 8 desks)
  const carpet = createVoxelBox(14.5, 0.03, 10.5, '#475569', { roughness: 0.8 });
  carpet.position.set(0, 0.015, 0.6);
  carpet.receiveShadow = true;
  roomGroup.add(carpet);

  // Perimeter Polished Warm Oak Floor Strip
  const woodBorder = createVoxelBox(roomWidth - 0.4, 0.02, roomDepth - 0.4, '#d7c4a3', { roughness: 0.4 });
  woodBorder.position.set(0, 0.005, 0);
  roomGroup.add(woodBorder);

  // 2. Bright Modern Office Studio Walls (Bright Warm White / Architectural Nordic Slate)
  const wallColor = '#f1f5f9'; // Clean, bright Scandinavian tech studio wall
  const backWall = createVoxelBox(roomWidth, wallHeight, 0.3, wallColor, { roughness: 0.5 });
  backWall.position.set(0, wallHeight / 2, -roomDepth / 2);
  roomGroup.add(backWall);

  const leftWall = createVoxelBox(0.3, wallHeight, roomDepth, wallColor, { roughness: 0.5 });
  leftWall.position.set(-roomWidth / 2, wallHeight / 2, 0);
  roomGroup.add(leftWall);

  // Modern Architectural Accent Baseboards
  const baseboardB = createVoxelBox(roomWidth, 0.25, 0.35, '#334155');
  baseboardB.position.set(0, 0.125, -roomDepth / 2);
  const baseboardL = createVoxelBox(0.35, 0.25, roomDepth, '#334155');
  baseboardL.position.set(-roomWidth / 2, 0.125, 0);
  roomGroup.add(baseboardB, baseboardL);

  // 3. Panoramic High-Rise Skyline Windows with City Skyscraper View
  const windowFrame = createVoxelBox(6.5, 2.8, 0.2, '#1e293b');
  windowFrame.position.set(2.5, 2.8, -roomDepth / 2 + 0.1);
  const windowGlass = createVoxelBox(6.3, 2.6, 0.05, '#38bdf8', {
    emissive: timeOfDay === 'night' ? '#312e81' : timeOfDay === 'sunset' ? '#ea580c' : '#7dd3fc',
    emissiveIntensity: timeOfDay === 'night' ? 0.6 : 0.85,
    transparent: true,
    opacity: 0.92,
  });
  windowGlass.position.set(2.5, 2.8, -roomDepth / 2 + 0.15);

  // Window mullions (steel office window bars)
  const mullionV1 = createVoxelBox(0.08, 2.6, 0.08, '#1e293b');
  mullionV1.position.set(0.5, 2.8, -roomDepth / 2 + 0.18);
  const mullionV2 = createVoxelBox(0.08, 2.6, 0.08, '#1e293b');
  mullionV2.position.set(4.5, 2.8, -roomDepth / 2 + 0.18);
  const mullionH = createVoxelBox(6.3, 0.08, 0.08, '#1e293b');
  mullionH.position.set(2.5, 2.8, -roomDepth / 2 + 0.18);
  roomGroup.add(windowFrame, windowGlass, mullionV1, mullionV2, mullionH);

  // 4. Blackboard / Room Directory & Sprint Board on Back Wall
  const blackboardGroup = new THREE.Group();
  blackboardGroup.name = 'hotspot_blackboard';
  blackboardGroup.userData = { hotspot: 'blackboard' };
  blackboardGroup.position.set(-4.2, 2.8, -roomDepth / 2 + 0.2);

  const boardFrame = createVoxelBox(4.4, 2.5, 0.1, '#78350f', { roughness: 0.7 }); // Rich warm wood frame
  const boardFace = createVoxelBox(4.2, 2.3, 0.06, '#182420', { roughness: 0.95 }); // Deep slate-green chalkboard
  boardFace.position.set(0, 0, 0.02);

  // Top Blackboard Header: "ROOM DIRECTORY & HALLWAY"
  const boardTitleBar = createVoxelBox(3.8, 0.28, 0.02, '#1e293b');
  boardTitleBar.position.set(0, 0.92, 0.05);

  // Chalk written room category badges on the blackboard
  const chalkBadge1 = createVoxelBox(0.85, 0.16, 0.02, '#38bdf8'); // Offices
  chalkBadge1.position.set(-1.45, 0.65, 0.06);
  const chalkBadge2 = createVoxelBox(0.85, 0.16, 0.02, '#4ade80'); // Tea & Cafes
  chalkBadge2.position.set(-0.45, 0.65, 0.06);
  const chalkBadge3 = createVoxelBox(0.85, 0.16, 0.02, '#fbbf24'); // Nature Lofts
  chalkBadge3.position.set(0.55, 0.65, 0.06);
  const chalkBadge4 = createVoxelBox(0.85, 0.16, 0.02, '#f472b6'); // Night Dens
  chalkBadge4.position.set(1.55, 0.65, 0.06);

  // Chalk lines & drawings on the blackboard
  const chalkLine1 = createVoxelBox(0.03, 1.3, 0.02, '#94a3b8');
  chalkLine1.position.set(-0.95, -0.15, 0.06);
  const chalkLine2 = createVoxelBox(0.03, 1.3, 0.02, '#94a3b8');
  chalkLine2.position.set(0.05, -0.15, 0.06);
  const chalkLine3 = createVoxelBox(0.03, 1.3, 0.02, '#94a3b8');
  chalkLine3.position.set(1.05, -0.15, 0.06);

  // Chalk room notes & sticky cards on the blackboard
  const stickyColors = ['#facc15', '#f472b6', '#38bdf8', '#4ade80', '#fb923c', '#e2e8f0'];
  const stickyCoords = [
    [-1.5, 0.3], [-1.35, -0.1], [-1.55, -0.5],
    [-0.5, 0.35], [-0.35, -0.05], [-0.55, -0.45],
    [0.5, 0.3], [0.65, -0.1], [0.45, -0.5],
    [1.5, 0.35], [1.65, -0.05], [1.45, -0.45],
  ];
  stickyCoords.forEach(([sx, sy], sIdx) => {
    const st = createVoxelBox(0.24, 0.22, 0.02, stickyColors[sIdx % stickyColors.length]);
    st.position.set(sx, sy, 0.06);
    blackboardGroup.add(st);
  });

  blackboardGroup.add(
    boardFrame,
    boardFace,
    boardTitleBar,
    chalkBadge1,
    chalkBadge2,
    chalkBadge3,
    chalkBadge4,
    chalkLine1,
    chalkLine2,
    chalkLine3
  );

  // Wooden chalk tray with colorful chalk sticks and felt eraser
  const chalkTray = createVoxelBox(3.8, 0.08, 0.14, '#78350f', { roughness: 0.7 });
  chalkTray.position.set(0, -1.18, 0.08);
  const chalkWhite = createVoxelBox(0.14, 0.04, 0.04, '#ffffff');
  chalkWhite.position.set(-0.7, -1.12, 0.08);
  const chalkYellow = createVoxelBox(0.14, 0.04, 0.04, '#facc15');
  chalkYellow.position.set(-0.45, -1.12, 0.08);
  const chalkCyan = createVoxelBox(0.14, 0.04, 0.04, '#38bdf8');
  chalkCyan.position.set(-0.2, -1.12, 0.08);
  const chalkPink = createVoxelBox(0.14, 0.04, 0.04, '#f472b6');
  chalkPink.position.set(0.05, -1.12, 0.08);
  const feltEraser = createVoxelBox(0.28, 0.06, 0.09, '#334155');
  feltEraser.position.set(0.45, -1.12, 0.08);
  blackboardGroup.add(chalkTray, chalkWhite, chalkYellow, chalkCyan, chalkPink, feltEraser);

  roomGroup.add(blackboardGroup);

  // 5. World Time Zone Clocks (SF, NYC, LON, TYO)
  const clockGroup = new THREE.Group();
  clockGroup.position.set(-4.2, 4.35, -roomDepth / 2 + 0.15);
  const cities = ['SFO', 'NYC', 'LON', 'TYO'];
  cities.forEach((city, cIdx) => {
    const cx = -1.5 + cIdx * 1.0;
    const cFrame = createVoxelBox(0.55, 0.55, 0.06, '#1e293b');
    cFrame.position.set(cx, 0, 0);
    const cFace = createVoxelBox(0.48, 0.48, 0.05, '#ffffff');
    cFace.position.set(cx, 0, 0.02);
    const cHandH = createVoxelBox(0.03, 0.16, 0.02, '#0f172a');
    cHandH.position.set(cx, 0.05, 0.05);
    cHandH.rotation.z = cIdx * 1.5;
    const cHandM = createVoxelBox(0.2, 0.03, 0.02, '#ef4444');
    cHandM.position.set(cx + 0.06, 0, 0.05);
    clockGroup.add(cFrame, cFace, cHandH, cHandM);
  });
  roomGroup.add(clockGroup);

  // 6. Glass Conference / Meeting Room (Right Side Partition)
  const confRoom = new THREE.Group();
  confRoom.position.set(roomWidth / 2 - 1.8, 0, 1.5);

  // Glass Wall Partition
  const glassWall = createVoxelBox(0.1, wallHeight * 0.8, 6.5, '#bae6fd', {
    emissive: '#bae6fd',
    emissiveIntensity: 0.35,
    transparent: true,
    opacity: 0.4,
  });
  glassWall.position.set(-1.8, wallHeight * 0.4, 0);
  const glassFrameT = createVoxelBox(0.14, 0.12, 6.5, '#334155');
  glassFrameT.position.set(-1.8, wallHeight * 0.8, 0);
  const glassFrameB = createVoxelBox(0.14, 0.12, 6.5, '#334155');
  glassFrameB.position.set(-1.8, 0.06, 0);

  // Frosted Distraction Privacy Stripe on glass
  const frostStripe = createVoxelBox(0.12, 0.4, 6.5, '#ffffff', { transparent: true, opacity: 0.75 });
  frostStripe.position.set(-1.8, 1.4, 0);

  confRoom.add(glassWall, glassFrameT, glassFrameB, frostStripe);

  // Conference Table (Warm Walnut)
  const confTable = createVoxelBox(1.6, 0.1, 3.8, '#582c0e', { roughness: 0.3 });
  confTable.position.set(0, 0.75, 0);
  const confLeg1 = createVoxelBox(0.8, 0.7, 0.2, '#1e293b');
  confLeg1.position.set(0, 0.35, -1.4);
  const confLeg2 = createVoxelBox(0.8, 0.7, 0.2, '#1e293b');
  confLeg2.position.set(0, 0.35, 1.4);

  // Conference Triangle Speakerphone
  const speakerPhone = createVoxelBox(0.35, 0.06, 0.35, '#0f172a');
  speakerPhone.position.set(0, 0.82, 0);

  // Conference Leather Chairs (4 chairs around table)
  const confChairPositions = [
    [-0.7, -0.9, Math.PI / 2],
    [-0.7, 0.9, Math.PI / 2],
    [0.7, -0.9, -Math.PI / 2],
    [0.7, 0.9, -Math.PI / 2],
  ];
  confChairPositions.forEach(([cx, cz, crot]) => {
    const ch = new THREE.Group();
    ch.position.set(cx, 0, cz);
    ch.rotation.y = crot;
    const cSeat = createVoxelBox(0.5, 0.08, 0.5, '#334155');
    cSeat.position.set(0, 0.45, 0);
    const cBack = createVoxelBox(0.5, 0.6, 0.08, '#1e293b');
    cBack.position.set(0, 0.75, -0.22);
    const cStem = createVoxelBox(0.08, 0.42, 0.08, '#cbd5e1', { metalness: 0.8 });
    cStem.position.set(0, 0.21, 0);
    ch.add(cSeat, cBack, cStem);
    confRoom.add(ch);
  });

  // Presentation 75" TV Screen on back of conf room
  const presScreen = createVoxelBox(0.08, 1.4, 2.4, '#1e293b');
  presScreen.position.set(1.4, 2.6, 0);
  const presDisplay = createVoxelBox(0.04, 1.25, 2.25, '#0284c7', {
    emissive: '#38bdf8',
    emissiveIntensity: 0.8,
  });
  presDisplay.position.set(1.35, 2.6, 0);
  confRoom.add(confTable, confLeg1, confLeg2, speakerPhone, presScreen, presDisplay);
  roomGroup.add(confRoom);

  // 7. Kitchenette, Espresso Bar & Water Dispenser (Left Wall)
  const kitchenGroup = new THREE.Group();
  kitchenGroup.name = 'hotspot_espresso';
  kitchenGroup.userData = { hotspot: 'espresso' };
  kitchenGroup.position.set(-roomWidth / 2 + 1.2, 0, -4.2);

  // L-Shaped Kitchen Counter & Cabinets
  const counterBase = createVoxelBox(1.5, 0.9, 2.8, '#334155');
  counterBase.position.set(0, 0.45, 0);
  const counterTop = createVoxelBox(1.6, 0.08, 2.9, '#f8fafc', { roughness: 0.2 });
  counterTop.position.set(0, 0.94, 0);

  // Commercial Double Espresso Machine
  const espressoMachine = createVoxelBox(0.65, 0.58, 0.65, '#e2e8f0', { metalness: 0.9, roughness: 0.2 });
  espressoMachine.position.set(0.1, 1.28, -0.6);
  const portafilter = createVoxelBox(0.1, 0.08, 0.24, '#0f172a');
  portafilter.position.set(0.1, 1.18, -0.22);
  const cup1 = createVoxelBox(0.1, 0.12, 0.1, '#38bdf8');
  cup1.position.set(0.35, 1.04, 0.2);
  const cup2 = createVoxelBox(0.1, 0.12, 0.1, '#f472b6');
  cup2.position.set(0.35, 1.04, 0.45);

  // Microwave Oven
  const microwave = createVoxelBox(0.55, 0.35, 0.5, '#475569');
  microwave.position.set(0.1, 1.15, 0.85);
  const microScreen = createVoxelBox(0.15, 0.08, 0.02, '#22c55e', { emissive: '#22c55e', emissiveIntensity: 0.8 });
  microScreen.position.set(0.25, 1.22, 0.58);

  kitchenGroup.add(counterBase, counterTop, espressoMachine, portafilter, cup1, cup2, microwave, microScreen);
  roomGroup.add(kitchenGroup);

  // Office Refrigerator with sticky memos
  const fridge = new THREE.Group();
  fridge.position.set(-roomWidth / 2 + 1.1, 0, -2.0);
  const fridgeBody = createVoxelBox(1.0, 2.3, 0.9, '#cbd5e1', { metalness: 0.8, roughness: 0.3 });
  fridgeBody.position.set(0, 1.15, 0);
  const fridgeHandle = createVoxelBox(0.06, 0.8, 0.06, '#334155');
  fridgeHandle.position.set(0.52, 1.2, 0.25);
  const magnet1 = createVoxelBox(0.02, 0.12, 0.14, '#ef4444');
  magnet1.position.set(0.51, 1.6, -0.15);
  const magnet2 = createVoxelBox(0.02, 0.14, 0.12, '#3b82f6');
  magnet2.position.set(0.51, 1.35, -0.1);
  fridge.add(fridgeBody, fridgeHandle, magnet1, magnet2);
  roomGroup.add(fridge);

  // Water Cooler with Blue Bottle
  const coolerGroup = new THREE.Group();
  coolerGroup.name = 'hotspot_cooler';
  coolerGroup.userData = { hotspot: 'cooler' };
  coolerGroup.position.set(-roomWidth / 2 + 1.1, 0, -0.6);
  const coolerBase = createVoxelBox(0.55, 1.1, 0.55, '#ffffff');
  coolerBase.position.set(0, 0.55, 0);
  const jug = createVoxelBox(0.48, 0.65, 0.48, '#0284c7', {
    emissive: '#38bdf8',
    emissiveIntensity: 0.6,
    transparent: true,
    opacity: 0.85,
  });
  jug.position.set(0, 1.45, 0);
  coolerGroup.add(coolerBase, jug);
  roomGroup.add(coolerGroup);

  // 8. Office Multi-Function Heavy-Duty Printer & Copier Station (Left Front)
  const printerGroup = new THREE.Group();
  printerGroup.name = 'hotspot_printer';
  printerGroup.userData = { hotspot: 'printer' };
  printerGroup.position.set(-roomWidth / 2 + 1.3, 0, 2.4);

  const printBody = createVoxelBox(1.2, 1.3, 1.1, '#e2e8f0');
  printBody.position.set(0, 0.65, 0);
  const docFeeder = createVoxelBox(0.9, 0.25, 0.8, '#334155');
  docFeeder.position.set(0, 1.4, 0);
  const outTray = createVoxelBox(0.6, 0.04, 0.5, '#475569');
  outTray.position.set(0.6, 0.95, 0);
  const statusLed = createVoxelBox(0.06, 0.06, 0.04, '#22c55e', { emissive: '#22c55e', emissiveIntensity: 0.9 });
  statusLed.position.set(0.4, 1.35, -0.45);

  // Paper Shredder bin next to printer
  const shredder = createVoxelBox(0.45, 0.7, 0.45, '#334155');
  shredder.position.set(0, 0.35, 1.1);

  printerGroup.add(printBody, docFeeder, outTray, statusLed, shredder);
  roomGroup.add(printerGroup);

  // 9. Steel Document Archive Shelves & Gutenberg Bookshelf (Corner)
  const shelfGroup = new THREE.Group();
  shelfGroup.name = 'hotspot_bookshelf';
  shelfGroup.userData = { hotspot: 'bookshelf' };
  shelfGroup.position.set(-roomWidth / 2 + 1.2, 0, 4.8);
  const shelfFrame = createVoxelBox(1.1, 2.8, 1.8, '#334155');
  shelfFrame.position.set(0, 1.4, 0);
  shelfGroup.add(shelfFrame);

  const binderColors = ['#ef4444', '#3b82f6', '#10b981', '#f59e0b', '#8b5cf6'];
  for (let s = 0; s < 3; s++) {
    for (let b = 0; b < 4; b++) {
      const binder = createVoxelBox(0.55, 0.45, 0.18, binderColors[(s * 4 + b) % binderColors.length]);
      binder.position.set(0.32, 0.5 + s * 0.8, -0.6 + b * 0.4);
      shelfGroup.add(binder);
    }
  }
  roomGroup.add(shelfGroup);

  // 10. Office Break Lounge Couch & Coffee Table (Front Center)
  const couch = new THREE.Group();
  couch.position.set(0.5, 0, 5.2);
  const couchBase = createVoxelBox(2.8, 0.45, 1.2, '#3b82f6');
  couchBase.position.set(0, 0.225, 0);
  const couchBack = createVoxelBox(2.8, 0.8, 0.3, '#1d4ed8');
  couchBack.position.set(0, 0.65, 0.45);
  const pillowL = createVoxelBox(0.45, 0.35, 0.2, '#fbbf24');
  pillowL.position.set(-0.9, 0.55, 0.3);
  pillowL.rotation.y = 0.25;
  const pillowR = createVoxelBox(0.45, 0.35, 0.2, '#38bdf8');
  pillowR.position.set(0.9, 0.55, 0.3);
  pillowR.rotation.y = -0.25;
  couch.add(couchBase, couchBack, pillowL, pillowR);
  roomGroup.add(couch);

  // Low Modern Coffee Table with Donut Box
  const coffeeTable = createVoxelBox(1.5, 0.35, 0.8, '#1e293b');
  coffeeTable.position.set(0.5, 0.175, 3.8);
  const donutBox = createVoxelBox(0.35, 0.08, 0.35, '#f43f5e');
  donutBox.position.set(0.5, 0.38, 3.8);
  roomGroup.add(coffeeTable, donutBox);

  // 11. Wastebasket Basketball Hoop Station (Fun Office Mini-Game)
  const trashBin = createVoxelBox(0.55, 0.6, 0.55, '#64748b');
  trashBin.position.set(3.8, 0.3, 3.8);
  const hoopRing = createVoxelBox(0.65, 0.06, 0.65, '#f97316');
  hoopRing.position.set(3.8, 0.62, 3.8);
  roomGroup.add(trashBin, hoopRing);

  // 12. Office Biophilic Planters (Fiddle Leaf Fig Tree & Snake Plants)
  const treePot = createVoxelBox(0.9, 0.8, 0.9, '#ffffff');
  treePot.position.set(roomWidth / 2 - 1.2, 0.4, 5.0);
  const trunk = createVoxelBox(0.18, 1.8, 0.18, '#78350f');
  trunk.position.set(roomWidth / 2 - 1.2, 1.5, 5.0);
  const treeLeaves = createVoxelBox(1.4, 1.6, 1.4, '#16a34a');
  treeLeaves.position.set(roomWidth / 2 - 1.2, 2.5, 5.0);
  roomGroup.add(treePot, trunk, treeLeaves);

  // 13. Tech Office Cubicle Dividers (Acoustic Felt Partitions between Desks)
  const cubicleGroup = new THREE.Group();
  const dividerColor = '#3b82f6'; // Clean tech blue acoustic screen

  // Row 1 acoustic dividers between desks (z = -0.9, x at -2.6, 0.0, 2.6)
  [-2.6, 0.0, 2.6].forEach((cx) => {
    const divPanel = createVoxelBox(0.08, 1.2, 1.4, dividerColor, { roughness: 0.8 });
    divPanel.position.set(cx, 0.6, -0.9);
    const divCap = createVoxelBox(0.12, 0.04, 1.42, '#1e293b', { metalness: 0.8 });
    divCap.position.set(cx, 1.22, -0.9);
    cubicleGroup.add(divPanel, divCap);
  });

  // Row 2 acoustic dividers between desks (z = 2.2, x at -2.6, 0.0, 2.6)
  [-2.6, 0.0, 2.6].forEach((cx) => {
    const divPanel = createVoxelBox(0.08, 1.2, 1.4, dividerColor, { roughness: 0.8 });
    divPanel.position.set(cx, 0.6, 2.2);
    const divCap = createVoxelBox(0.12, 0.04, 1.42, '#1e293b', { metalness: 0.8 });
    divCap.position.set(cx, 1.22, 2.2);
    cubicleGroup.add(divPanel, divCap);
  });

  // Center spine modesty divider between Row 1 and Row 2 at z = 0.65
  const spineDivider = createVoxelBox(10.5, 1.1, 0.08, '#1e293b', { roughness: 0.7 });
  spineDivider.position.set(0, 0.55, 0.65);
  cubicleGroup.add(spineDivider);

  roomGroup.add(cubicleGroup);

  // 14. Exit Door to Hallway Corridor (Front-Right Corner Entrance)
  const exitDoorGroup = new THREE.Group();
  exitDoorGroup.name = 'hotspot_exit_door';
  exitDoorGroup.userData = { hotspot: 'exit_door' };
  exitDoorGroup.position.set(6.8, 0, 8.2);

  // Sturdy Architectural Wood Door Frame
  const doorFrameL = createVoxelBox(0.2, 3.8, 0.25, '#334155');
  doorFrameL.position.set(-1.05, 1.9, 0);
  const doorFrameR = createVoxelBox(0.2, 3.8, 0.25, '#334155');
  doorFrameR.position.set(1.05, 1.9, 0);
  const doorFrameT = createVoxelBox(2.3, 0.25, 0.25, '#334155');
  doorFrameT.position.set(0, 3.8, 0);
  const doorThreshold = createVoxelBox(2.3, 0.06, 0.35, '#64748b');
  doorThreshold.position.set(0, 0.03, 0);

  // Illuminated Glowing Green "EXIT / HALLWAY" Overhead Sign
  const exitSignHousing = createVoxelBox(1.3, 0.42, 0.14, '#14532d', {
    emissive: '#16a34a',
    emissiveIntensity: 0.9,
  });
  exitSignHousing.position.set(0, 4.15, 0.05);
  const exitSignGlow = createVoxelBox(1.1, 0.28, 0.04, '#ffffff', {
    emissive: '#22c55e',
    emissiveIntensity: 1.2,
  });
  exitSignGlow.position.set(0, 4.15, 0.13);

  // Warm Walnut Wood Door Panel (Slightly ajar inviting user into the hallway)
  const doorPanel = new THREE.Group();
  doorPanel.position.set(-0.95, 0, 0);
  doorPanel.rotation.y = -0.35; // Ajar opening outward toward hallway

  const doorWood = createVoxelBox(1.85, 3.5, 0.1, '#78350f', { roughness: 0.6 });
  doorWood.position.set(0.925, 1.75, 0);

  // Frosted Glass Window Inset with warm hallway light glow
  const doorGlass = createVoxelBox(0.7, 1.4, 0.12, '#fef08a', {
    emissive: '#fde047',
    emissiveIntensity: 0.75,
    transparent: true,
    opacity: 0.9,
  });
  doorGlass.position.set(0.925, 2.3, 0);

  // Polished Brass Door Handle & Lock Plate
  const doorKnob = createVoxelBox(0.12, 0.18, 0.18, '#facc15', { metalness: 0.9, roughness: 0.2 });
  doorKnob.position.set(1.65, 1.6, 0.06);

  doorPanel.add(doorWood, doorGlass, doorKnob);

  // Welcome Doormat in front of the door
  const welcomeMat = createVoxelBox(2.2, 0.04, 1.3, '#1e293b', { roughness: 0.9 });
  welcomeMat.position.set(0, 0.02, -0.7);
  const matStripe = createVoxelBox(1.8, 0.05, 0.08, '#f59e0b');
  matStripe.position.set(0, 0.03, -0.7);

  // Warm Hallway Sconce Light on the doorpost
  const doorSconce = createVoxelBox(0.18, 0.35, 0.18, '#f59e0b', {
    emissive: '#f59e0b',
    emissiveIntensity: 1.0,
  });
  doorSconce.position.set(-1.25, 2.5, 0.08);

  exitDoorGroup.add(
    doorFrameL,
    doorFrameR,
    doorFrameT,
    doorThreshold,
    exitSignHousing,
    exitSignGlow,
    doorPanel,
    welcomeMat,
    matStripe,
    doorSconce
  );

  roomGroup.add(exitDoorGroup);

  // -------------------------------------------------------------
  // Office Lighting Setup: Crisp, Bright, Beautiful Studio Fill
  // -------------------------------------------------------------
  const ambientLight = new THREE.AmbientLight(0xffffff, 1.2);
  lightGroup.add(ambientLight);

  // Hemispheric Soft Fill for natural bounce
  const hemiLight = new THREE.HemisphereLight(0xffffff, 0xc7d2fe, 0.75);
  lightGroup.add(hemiLight);

  const dirLight = new THREE.DirectionalLight(0xfffbeb, 1.75);
  dirLight.position.set(12, 18, 12);
  dirLight.castShadow = true;
  dirLight.shadow.mapSize.width = 1024;
  dirLight.shadow.mapSize.height = 1024;
  dirLight.shadow.bias = -0.0008;
  lightGroup.add(dirLight);

  // Bright Overhead Daylight Center Point Light
  const ceilingPendant = new THREE.PointLight(0xfffaed, 1.6, 22);
  ceilingPendant.position.set(0, 4.2, 0);
  ceilingPendant.castShadow = true;
  lightGroup.add(ceilingPendant);

  const updateLights = (tod: TimeOfDay) => {
    if (tod === 'sunset') {
      ambientLight.color.setHex(0xffedd5);
      ambientLight.intensity = 1.0;
      hemiLight.color.setHex(0xfef08a);
      hemiLight.groundColor.setHex(0xf97316);
      hemiLight.intensity = 0.65;
      dirLight.color.setHex(0xf97316);
      dirLight.intensity = 1.8;
      ceilingPendant.color.setHex(0xfeb272);
      windowGlass.material = new THREE.MeshStandardMaterial({
        color: new THREE.Color('#ea580c'),
        emissive: new THREE.Color('#ea580c'),
        emissiveIntensity: 0.9,
        flatShading: true,
      });
    } else if (tod === 'night') {
      ambientLight.color.setHex(0xc7d2fe);
      ambientLight.intensity = 0.85;
      hemiLight.color.setHex(0x818cf8);
      hemiLight.groundColor.setHex(0x312e81);
      hemiLight.intensity = 0.55;
      dirLight.color.setHex(0xa5b4fc);
      dirLight.intensity = 1.1;
      ceilingPendant.color.setHex(0xffedd5);
      ceilingPendant.intensity = 2.0; // Interior lights turn ON bright at night
      windowGlass.material = new THREE.MeshStandardMaterial({
        color: new THREE.Color('#1e1b4b'),
        emissive: new THREE.Color('#312e81'),
        emissiveIntensity: 0.65,
        flatShading: true,
      });
    } else if (tod === 'rainy') {
      ambientLight.color.setHex(0xe2e8f0);
      ambientLight.intensity = 0.95;
      hemiLight.color.setHex(0x94a3b8);
      hemiLight.groundColor.setHex(0x64748b);
      hemiLight.intensity = 0.6;
      dirLight.color.setHex(0x94a3b8);
      dirLight.intensity = 1.2;
      ceilingPendant.color.setHex(0xfef08a);
      windowGlass.material = new THREE.MeshStandardMaterial({
        color: new THREE.Color('#0284c7'),
        emissive: new THREE.Color('#38bdf8'),
        emissiveIntensity: 0.6,
        flatShading: true,
      });
    } else {
      // Day (Bright, Sunny, Pristine Office)
      ambientLight.color.setHex(0xffffff);
      ambientLight.intensity = 1.25;
      hemiLight.color.setHex(0xffffff);
      hemiLight.groundColor.setHex(0xc7d2fe);
      hemiLight.intensity = 0.75;
      dirLight.color.setHex(0xfffbeb);
      dirLight.intensity = 1.75;
      ceilingPendant.color.setHex(0xfffaed);
      ceilingPendant.intensity = 1.6;
      windowGlass.material = new THREE.MeshStandardMaterial({
        color: new THREE.Color('#38bdf8'),
        emissive: new THREE.Color('#7dd3fc'),
        emissiveIntensity: 0.85,
        flatShading: true,
      });
    }
  };

  updateLights(timeOfDay);

  return { roomGroup, lightGroup, updateLights };
}

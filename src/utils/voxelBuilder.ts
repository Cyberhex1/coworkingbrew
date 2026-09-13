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
// 3D Voxel Whiteboard / Sprint Kanban Board Builder
// Crisp white dry-erase face, zero z-fighting, theme-matching frame
// -------------------------------------------------------------
function buildThemedWhiteboard(theme: CoWorkingRoom['theme']): THREE.Group {
  const whiteboardGroup = new THREE.Group();
  whiteboardGroup.name = 'hotspot_sprint_board';
  whiteboardGroup.userData = { hotspot: 'sprint_board' };
  whiteboardGroup.position.set(-4.2, 2.7, -8.75);

  let frameColor = '#cbd5e1'; // Aluminum silver default
  if (theme === 'tea_loft' || theme === 'treehouse') frameColor = '#78350f'; // Warm cedar wood
  else if (theme === 'loft_office') frameColor = '#334155'; // Industrial steel
  else if (theme === 'greenhouse') frameColor = '#14532d'; // Wrought iron green
  else if (theme === 'arcade') frameColor = '#06b6d4'; // Cyber cyan
  else if (theme === 'cafe') frameColor = '#451a03'; // Dark walnut

  // 1. Backing panel (z = 0)
  const backPanel = createVoxelBox(4.4, 2.5, 0.06, frameColor, { roughness: 0.4 });
  backPanel.position.set(0, 0, 0);

  // 2. Whiteboard Face (z = 0.04, pure crisp glossy white)
  const boardFace = createVoxelBox(4.16, 2.26, 0.04, '#ffffff', { roughness: 0.15 });
  boardFace.position.set(0, 0, 0.035);

  // 3. Header Title Bar: "TEAM SPRINT & KANBAN" (z = 0.06)
  const titleBarColor = theme === 'arcade' ? '#4c1d95' : theme === 'tea_loft' ? '#713f12' : '#1e1b4b';
  const boardTitleBar = createVoxelBox(3.9, 0.24, 0.02, titleBarColor);
  boardTitleBar.position.set(0, 0.9, 0.06);

  // 4. Column Header Badges on the Whiteboard (TODO, IN PROGRESS, REVIEW, DONE)
  const colBadge1 = createVoxelBox(0.85, 0.16, 0.02, '#3b82f6'); // TODO
  colBadge1.position.set(-1.45, 0.65, 0.06);
  const colBadge2 = createVoxelBox(0.85, 0.16, 0.02, '#f59e0b'); // IN PROGRESS
  colBadge2.position.set(-0.45, 0.65, 0.06);
  const colBadge3 = createVoxelBox(0.85, 0.16, 0.02, '#8b5cf6'); // REVIEW
  colBadge3.position.set(0.55, 0.65, 0.06);
  const colBadge4 = createVoxelBox(0.85, 0.16, 0.02, '#10b981'); // DONE
  colBadge4.position.set(1.55, 0.65, 0.06);

  // 5. Clean column dividing grid lines
  const colLine1 = createVoxelBox(0.02, 1.35, 0.02, '#e2e8f0');
  colLine1.position.set(-0.95, -0.15, 0.055);
  const colLine2 = createVoxelBox(0.02, 1.35, 0.02, '#e2e8f0');
  colLine2.position.set(0.05, -0.15, 0.055);
  const colLine3 = createVoxelBox(0.02, 1.35, 0.02, '#e2e8f0');
  colLine3.position.set(1.05, -0.15, 0.055);

  // 6. Colorful sticky task notes on the whiteboard
  const stickyColors = ['#fef08a', '#f472b6', '#38bdf8', '#86efac', '#fdba74', '#e0e7ff'];
  const stickyCoords = [
    [-1.5, 0.3], [-1.35, -0.1], [-1.55, -0.5],
    [-0.5, 0.35], [-0.35, -0.05], [-0.55, -0.45],
    [0.5, 0.3], [0.65, -0.1], [0.45, -0.5],
    [1.5, 0.35], [1.65, -0.05], [1.45, -0.45],
  ];
  stickyCoords.forEach(([sx, sy], sIdx) => {
    const st = createVoxelBox(0.24, 0.22, 0.02, stickyColors[sIdx % stickyColors.length]);
    st.position.set(sx, sy, 0.065);
    whiteboardGroup.add(st);
  });

  whiteboardGroup.add(
    backPanel,
    boardFace,
    boardTitleBar,
    colBadge1,
    colBadge2,
    colBadge3,
    colBadge4,
    colLine1,
    colLine2,
    colLine3
  );

  // 7. Marker tray with colorful dry-erase markers and felt eraser
  const markerTray = createVoxelBox(3.8, 0.08, 0.14, frameColor, { metalness: 0.6, roughness: 0.3 });
  markerTray.position.set(0, -1.18, 0.08);
  const markerBlack = createVoxelBox(0.14, 0.04, 0.04, '#0f172a');
  markerBlack.position.set(-0.7, -1.12, 0.08);
  const markerBlue = createVoxelBox(0.14, 0.04, 0.04, '#2563eb');
  markerBlue.position.set(-0.45, -1.12, 0.08);
  const markerRed = createVoxelBox(0.14, 0.04, 0.04, '#dc2626');
  markerRed.position.set(-0.2, -1.12, 0.08);
  const markerGreen = createVoxelBox(0.14, 0.04, 0.04, '#16a34a');
  markerGreen.position.set(0.05, -1.12, 0.08);
  const boardEraser = createVoxelBox(0.28, 0.06, 0.09, '#1e293b');
  boardEraser.position.set(0.45, -1.12, 0.08);
  whiteboardGroup.add(markerTray, markerBlack, markerBlue, markerRed, markerGreen, boardEraser);

  return whiteboardGroup;
}

// -------------------------------------------------------------
// 3D Voxel Exit Door to Hallway Corridor
// -------------------------------------------------------------
function buildThemedExitDoor(theme: CoWorkingRoom['theme']): THREE.Group {
  const exitDoorGroup = new THREE.Group();
  exitDoorGroup.name = 'hotspot_exit_door';
  exitDoorGroup.userData = { hotspot: 'exit_door' };
  exitDoorGroup.position.set(6.8, 0, 8.2);

  let frameColor = '#334155';
  let doorWoodColor = '#78350f';
  let signGlowColor = '#22c55e';
  if (theme === 'tea_loft') {
    frameColor = '#5c2c16';
    doorWoodColor = '#92400e';
    signGlowColor = '#facc15';
  } else if (theme === 'arcade') {
    frameColor = '#0f172a';
    doorWoodColor = '#312e81';
    signGlowColor = '#ec4899';
  } else if (theme === 'treehouse') {
    frameColor = '#451a03';
    doorWoodColor = '#78350f';
    signGlowColor = '#84cc16';
  } else if (theme === 'greenhouse') {
    frameColor = '#14532d';
    doorWoodColor = '#166534';
    signGlowColor = '#4ade80';
  }

  // Sturdy Architectural Door Frame
  const doorFrameL = createVoxelBox(0.2, 3.8, 0.25, frameColor);
  doorFrameL.position.set(-1.05, 1.9, 0);
  const doorFrameR = createVoxelBox(0.2, 3.8, 0.25, frameColor);
  doorFrameR.position.set(1.05, 1.9, 0);
  const doorFrameT = createVoxelBox(2.3, 0.25, 0.25, frameColor);
  doorFrameT.position.set(0, 3.8, 0);
  const doorThreshold = createVoxelBox(2.3, 0.06, 0.35, '#64748b');
  doorThreshold.position.set(0, 0.03, 0);

  // Illuminated Glowing Overhead Sign
  const exitSignHousing = createVoxelBox(1.3, 0.42, 0.14, '#0f172a');
  exitSignHousing.position.set(0, 4.15, 0.05);
  const exitSignGlow = createVoxelBox(1.1, 0.28, 0.04, signGlowColor, {
    emissive: signGlowColor,
    emissiveIntensity: 1.2,
  });
  exitSignGlow.position.set(0, 4.15, 0.13);

  // Door Panel slightly ajar
  const doorPanel = new THREE.Group();
  doorPanel.position.set(-0.95, 0, 0);
  doorPanel.rotation.y = -0.35;

  const doorWood = createVoxelBox(1.85, 3.5, 0.1, doorWoodColor, { roughness: 0.6 });
  doorWood.position.set(0.925, 1.75, 0);

  // Glass Window Inset with warm light glow
  const doorGlass = createVoxelBox(0.7, 1.4, 0.12, '#fef08a', {
    emissive: '#fde047',
    emissiveIntensity: 0.75,
    transparent: true,
    opacity: 0.9,
  });
  doorGlass.position.set(0.925, 2.3, 0);

  // Brass Door Handle
  const doorKnob = createVoxelBox(0.12, 0.18, 0.18, '#facc15', { metalness: 0.9, roughness: 0.2 });
  doorKnob.position.set(1.65, 1.6, 0.06);

  doorPanel.add(doorWood, doorGlass, doorKnob);

  // Welcome Doormat
  const welcomeMat = createVoxelBox(2.2, 0.04, 1.3, '#1e293b', { roughness: 0.9 });
  welcomeMat.position.set(0, 0.02, -0.7);
  const matStripe = createVoxelBox(1.8, 0.05, 0.08, '#f59e0b');
  matStripe.position.set(0, 0.03, -0.7);

  // Wall Sconce Light
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

  return exitDoorGroup;
}

// -------------------------------------------------------------
// 3D Voxel Multi-Themed Room Environment Builder
// Fully supports all 9 Hallway Study Rooms with distinct themes!
// -------------------------------------------------------------
export function buildVoxelRoom(room: CoWorkingRoom, timeOfDay: TimeOfDay): {
  roomGroup: THREE.Group;
  lightGroup: THREE.Group;
  updateLights: (tod: TimeOfDay) => void;
  windowGlassMesh?: THREE.Mesh;
} {
  const roomGroup = new THREE.Group();
  const lightGroup = new THREE.Group();

  const theme = room?.theme || 'office';
  const roomWidth = 20;
  const roomDepth = 18;
  const wallHeight = 5.2;

  // Window glass reference for dynamic TOD syncing
  let windowGlassMesh: THREE.Mesh | null = null;

  // =============================================================
  // 1. THEME: 'office' (Open-Plan Studio Office)
  // =============================================================
  if (theme === 'office') {
    // Floor: Nordic Ash & Slate Carpet
    const floorBase = createVoxelBox(roomWidth, 0.3, roomDepth, '#cbd5e1');
    floorBase.position.set(0, -0.15, 0);
    floorBase.receiveShadow = true;
    const carpet = createVoxelBox(14.5, 0.03, 10.5, '#475569', { roughness: 0.8 });
    carpet.position.set(0, 0.015, 0.6);
    carpet.receiveShadow = true;
    const woodBorder = createVoxelBox(roomWidth - 0.4, 0.02, roomDepth - 0.4, '#d7c4a3', { roughness: 0.4 });
    woodBorder.position.set(0, 0.005, 0);
    roomGroup.add(floorBase, carpet, woodBorder);

    // Walls: Bright Scandinavian Studio White
    const wallColor = '#f1f5f9';
    const backWall = createVoxelBox(roomWidth, wallHeight, 0.3, wallColor);
    backWall.position.set(0, wallHeight / 2, -roomDepth / 2);
    const leftWall = createVoxelBox(0.3, wallHeight, roomDepth, wallColor);
    leftWall.position.set(-roomWidth / 2, wallHeight / 2, 0);
    const baseboardB = createVoxelBox(roomWidth, 0.25, 0.35, '#334155');
    baseboardB.position.set(0, 0.125, -roomDepth / 2);
    const baseboardL = createVoxelBox(0.35, 0.25, roomDepth, '#334155');
    baseboardL.position.set(-roomWidth / 2, 0.125, 0);
    roomGroup.add(backWall, leftWall, baseboardB, baseboardL);

    // Panoramic Skyline Windows
    const windowFrame = createVoxelBox(6.5, 2.8, 0.2, '#1e293b');
    windowFrame.position.set(2.5, 2.8, -roomDepth / 2 + 0.1);
    const windowGlass = createVoxelBox(6.3, 2.6, 0.05, '#38bdf8', {
      emissive: '#7dd3fc',
      emissiveIntensity: 0.85,
      transparent: true,
      opacity: 0.92,
    });
    windowGlass.position.set(2.5, 2.8, -roomDepth / 2 + 0.15);
    windowGlassMesh = windowGlass;
    const mullionV1 = createVoxelBox(0.08, 2.6, 0.08, '#1e293b');
    mullionV1.position.set(0.5, 2.8, -roomDepth / 2 + 0.18);
    const mullionV2 = createVoxelBox(0.08, 2.6, 0.08, '#1e293b');
    mullionV2.position.set(4.5, 2.8, -roomDepth / 2 + 0.18);
    const mullionH = createVoxelBox(6.3, 0.08, 0.08, '#1e293b');
    mullionH.position.set(2.5, 2.8, -roomDepth / 2 + 0.18);
    roomGroup.add(windowFrame, windowGlass, mullionV1, mullionV2, mullionH);

    // Glass Conference Partition on Right
    const confRoom = new THREE.Group();
    confRoom.position.set(roomWidth / 2 - 1.8, 0, 1.5);
    const glassWall = createVoxelBox(0.1, wallHeight * 0.8, 6.5, '#bae6fd', {
      emissive: '#bae6fd',
      emissiveIntensity: 0.35,
      transparent: true,
      opacity: 0.4,
    });
    glassWall.position.set(-1.8, wallHeight * 0.4, 0);
    const confTable = createVoxelBox(1.6, 0.1, 3.8, '#582c0e');
    confTable.position.set(0, 0.75, 0);
    confRoom.add(glassWall, confTable);
    roomGroup.add(confRoom);

    // Break Couch
    const couch = createVoxelBox(2.8, 0.45, 1.2, '#3b82f6');
    couch.position.set(0.5, 0.225, 5.2);
    const coffeeTable = createVoxelBox(1.5, 0.35, 0.8, '#1e293b');
    coffeeTable.position.set(0.5, 0.175, 3.8);
    roomGroup.add(couch, coffeeTable);

    // Fig Tree Planter
    const treePot = createVoxelBox(0.9, 0.8, 0.9, '#ffffff');
    treePot.position.set(roomWidth / 2 - 1.2, 0.4, 5.0);
    const trunk = createVoxelBox(0.18, 1.8, 0.18, '#78350f');
    trunk.position.set(roomWidth / 2 - 1.2, 1.5, 5.0);
    const leaves = createVoxelBox(1.4, 1.6, 1.4, '#16a34a');
    leaves.position.set(roomWidth / 2 - 1.2, 2.5, 5.0);
    roomGroup.add(treePot, trunk, leaves);
  }
  // =============================================================
  // 2. THEME: 'loft_office' (Sunset Tech Hub Office)
  // =============================================================
  else if (theme === 'loft_office') {
    // Floor: Dark Walnut & Amber Geometric Rug
    const floorBase = createVoxelBox(roomWidth, 0.3, roomDepth, '#3f1d0b');
    floorBase.position.set(0, -0.15, 0);
    const rug = createVoxelBox(14.5, 0.03, 10.5, '#b45309', { roughness: 0.7 });
    rug.position.set(0, 0.015, 0.6);
    roomGroup.add(floorBase, rug);

    // Back Wall: Industrial Exposed Terracotta Brick
    const backWall = createVoxelBox(roomWidth, wallHeight, 0.3, '#7c2d12', { roughness: 0.9 });
    backWall.position.set(0, wallHeight / 2, -roomDepth / 2);
    // Brick decorative horizontal mortar stripes
    for (let by = 0.5; by < wallHeight; by += 0.6) {
      const stripe = createVoxelBox(roomWidth, 0.04, 0.32, '#431407');
      stripe.position.set(0, by, -roomDepth / 2);
      roomGroup.add(stripe);
    }
    const leftWall = createVoxelBox(0.3, wallHeight, roomDepth, '#1e293b');
    leftWall.position.set(-roomWidth / 2, wallHeight / 2, 0);
    roomGroup.add(backWall, leftWall);

    // Industrial Sunset Skyline Window
    const windowFrame = createVoxelBox(6.5, 2.8, 0.2, '#0f172a');
    windowFrame.position.set(2.5, 2.8, -roomDepth / 2 + 0.1);
    const windowGlass = createVoxelBox(6.3, 2.6, 0.05, '#f97316', {
      emissive: '#ea580c',
      emissiveIntensity: 0.9,
      transparent: true,
      opacity: 0.92,
    });
    windowGlass.position.set(2.5, 2.8, -roomDepth / 2 + 0.15);
    windowGlassMesh = windowGlass;
    roomGroup.add(windowFrame, windowGlass);

    // Server Rack Tower in Corner
    const serverRack = createVoxelBox(1.2, 2.6, 1.2, '#0f172a');
    serverRack.position.set(roomWidth / 2 - 1.5, 1.3, -roomDepth / 2 + 1.2);
    const serverLed1 = createVoxelBox(0.04, 0.1, 0.8, '#22c55e', { emissive: '#22c55e', emissiveIntensity: 1.2 });
    serverLed1.position.set(roomWidth / 2 - 2.12, 1.8, -roomDepth / 2 + 1.2);
    const serverLed2 = createVoxelBox(0.04, 0.1, 0.8, '#38bdf8', { emissive: '#38bdf8', emissiveIntensity: 1.2 });
    serverLed2.position.set(roomWidth / 2 - 2.12, 1.2, -roomDepth / 2 + 1.2);
    roomGroup.add(serverRack, serverLed1, serverLed2);
  }
  // =============================================================
  // 3. THEME: 'tech_hub' (Corner Office & Coffee Bar)
  // =============================================================
  else if (theme === 'tech_hub') {
    // Floor: Herringbone Warm Oak & Cream Wool Rug
    const floorBase = createVoxelBox(roomWidth, 0.3, roomDepth, '#a16207');
    floorBase.position.set(0, -0.15, 0);
    const rug = createVoxelBox(14.5, 0.03, 10.5, '#fef3c7', { roughness: 0.8 });
    rug.position.set(0, 0.015, 0.6);
    roomGroup.add(floorBase, rug);

    // Wall: Wood Acoustic Slats & Sage Green
    const backWall = createVoxelBox(roomWidth, wallHeight, 0.3, '#1e3a29');
    backWall.position.set(0, wallHeight / 2, -roomDepth / 2);
    for (let sx = -roomWidth / 2 + 0.5; sx < -1; sx += 0.4) {
      const slat = createVoxelBox(0.18, wallHeight, 0.32, '#78350f');
      slat.position.set(sx, wallHeight / 2, -roomDepth / 2);
      roomGroup.add(slat);
    }
    const leftWall = createVoxelBox(0.3, wallHeight, roomDepth, '#1e3a29');
    leftWall.position.set(-roomWidth / 2, wallHeight / 2, 0);
    roomGroup.add(backWall, leftWall);

    // Neon "COFFEE & CODE" Sign
    const neonSign = createVoxelBox(3.0, 0.6, 0.08, '#f59e0b', {
      emissive: '#fbbf24',
      emissiveIntensity: 1.2,
    });
    neonSign.position.set(-4.2, 4.4, -roomDepth / 2 + 0.18);
    roomGroup.add(neonSign);

    // Window
    const windowFrame = createVoxelBox(6.5, 2.8, 0.2, '#78350f');
    windowFrame.position.set(2.5, 2.8, -roomDepth / 2 + 0.1);
    const windowGlass = createVoxelBox(6.3, 2.6, 0.05, '#fef08a', {
      emissive: '#facc15',
      emissiveIntensity: 0.8,
      transparent: true,
      opacity: 0.9,
    });
    windowGlass.position.set(2.5, 2.8, -roomDepth / 2 + 0.15);
    windowGlassMesh = windowGlass;
    roomGroup.add(windowFrame, windowGlass);
  }
  // =============================================================
  // 4. THEME: 'tea_loft' (Kyoto Tea Loft)
  // =============================================================
  else if (theme === 'tea_loft') {
    // Floor: Traditional Japanese Woven Tatami Mats
    const floorBase = createVoxelBox(roomWidth, 0.3, roomDepth, '#451a03');
    floorBase.position.set(0, -0.15, 0);
    const tatami = createVoxelBox(14.5, 0.03, 10.5, '#d4c59a', { roughness: 0.9 });
    tatami.position.set(0, 0.015, 0.6);
    // Tatami mat borders
    const border1 = createVoxelBox(14.5, 0.035, 0.12, '#5c2c16');
    border1.position.set(0, 0.02, 0.6);
    const border2 = createVoxelBox(0.12, 0.035, 10.5, '#5c2c16');
    border2.position.set(0, 0.02, 0.6);
    roomGroup.add(floorBase, tatami, border1, border2);

    // Walls: Shoji Paper Screen Lattice
    const backWall = createVoxelBox(roomWidth, wallHeight, 0.3, '#fef3c7');
    backWall.position.set(0, wallHeight / 2, -roomDepth / 2);
    const leftWall = createVoxelBox(0.3, wallHeight, roomDepth, '#fef3c7');
    leftWall.position.set(-roomWidth / 2, wallHeight / 2, 0);
    // Wooden Shoji Grid Frames
    for (let gy = 0.5; gy < wallHeight; gy += 1.0) {
      const beam = createVoxelBox(roomWidth, 0.08, 0.32, '#5c2c16');
      beam.position.set(0, gy, -roomDepth / 2);
      roomGroup.add(beam);
    }
    roomGroup.add(backWall, leftWall);

    // Zen Rock Garden in Right Corner
    const rockBed = createVoxelBox(4.5, 0.08, 4.5, '#f1f5f9', { roughness: 0.95 });
    rockBed.position.set(roomWidth / 2 - 2.8, 0.04, -roomDepth / 2 + 2.8);
    const rock1 = createVoxelBox(0.9, 0.6, 0.8, '#64748b');
    rock1.position.set(roomWidth / 2 - 2.6, 0.3, -roomDepth / 2 + 2.6);
    const rock2 = createVoxelBox(0.6, 0.4, 0.5, '#475569');
    rock2.position.set(roomWidth / 2 - 3.4, 0.2, -roomDepth / 2 + 3.2);
    // Bamboo Water Spout
    const spout = createVoxelBox(0.1, 0.6, 0.6, '#84cc16');
    spout.position.set(roomWidth / 2 - 2.0, 0.5, -roomDepth / 2 + 2.0);
    spout.rotation.x = -0.3;
    roomGroup.add(rockBed, rock1, rock2, spout);

    // Japanese Bonsai Table
    const bonsaiTable = createVoxelBox(1.2, 0.5, 0.8, '#451a03');
    bonsaiTable.position.set(roomWidth / 2 - 1.5, 0.25, 4.5);
    const bonsaiTrunk = createVoxelBox(0.14, 0.5, 0.14, '#78350f');
    bonsaiTrunk.position.set(roomWidth / 2 - 1.5, 0.7, 4.5);
    const bonsaiLeaves = createVoxelBox(0.65, 0.45, 0.65, '#15803d');
    bonsaiLeaves.position.set(roomWidth / 2 - 1.5, 1.05, 4.5);
    roomGroup.add(bonsaiTable, bonsaiTrunk, bonsaiLeaves);
  }
  // =============================================================
  // 5. THEME: 'cafe' (Rainy Window Espresso Café)
  // =============================================================
  else if (theme === 'cafe') {
    // Floor: Dark Mahogany & Burgundy Runner
    const floorBase = createVoxelBox(roomWidth, 0.3, roomDepth, '#271406');
    floorBase.position.set(0, -0.15, 0);
    const rug = createVoxelBox(14.5, 0.03, 10.5, '#881337', { roughness: 0.8 });
    rug.position.set(0, 0.015, 0.6);
    roomGroup.add(floorBase, rug);

    // Walls: Cozy Parisian Navy Blue
    const backWall = createVoxelBox(roomWidth, wallHeight, 0.3, '#0f172a');
    backWall.position.set(0, wallHeight / 2, -roomDepth / 2);
    const leftWall = createVoxelBox(0.3, wallHeight, roomDepth, '#0f172a');
    leftWall.position.set(-roomWidth / 2, wallHeight / 2, 0);
    const wainscot = createVoxelBox(roomWidth, 1.4, 0.32, '#451a03');
    wainscot.position.set(0, 0.7, -roomDepth / 2);
    roomGroup.add(backWall, leftWall, wainscot);

    // Rainy Overcast Window with Blue Misty Glow
    const windowFrame = createVoxelBox(6.5, 2.8, 0.2, '#451a03');
    windowFrame.position.set(2.5, 2.8, -roomDepth / 2 + 0.1);
    const windowGlass = createVoxelBox(6.3, 2.6, 0.05, '#0284c7', {
      emissive: '#38bdf8',
      emissiveIntensity: 0.65,
      transparent: true,
      opacity: 0.9,
    });
    windowGlass.position.set(2.5, 2.8, -roomDepth / 2 + 0.15);
    windowGlassMesh = windowGlass;
    roomGroup.add(windowFrame, windowGlass);

    // Warm Fireplace in Corner
    const fireplace = createVoxelBox(2.2, 2.2, 1.2, '#78350f');
    fireplace.position.set(roomWidth / 2 - 1.8, 1.1, -roomDepth / 2 + 1.2);
    const fireHearth = createVoxelBox(1.2, 1.0, 0.8, '#0f172a');
    fireHearth.position.set(roomWidth / 2 - 1.8, 0.7, -roomDepth / 2 + 1.3);
    const fireGlow = createVoxelBox(0.8, 0.4, 0.5, '#ea580c', { emissive: '#f97316', emissiveIntensity: 1.4 });
    fireGlow.position.set(roomWidth / 2 - 1.8, 0.5, -roomDepth / 2 + 1.3);
    roomGroup.add(fireplace, fireHearth, fireGlow);
  }
  // =============================================================
  // 6. THEME: 'treehouse' (Forest Canopy Treehouse)
  // =============================================================
  else if (theme === 'treehouse') {
    // Floor: Rustic Oak Planks & Moss Rug
    const floorBase = createVoxelBox(roomWidth, 0.3, roomDepth, '#78350f');
    floorBase.position.set(0, -0.15, 0);
    const mossRug = createVoxelBox(14.5, 0.03, 10.5, '#15803d', { roughness: 0.9 });
    mossRug.position.set(0, 0.015, 0.6);
    roomGroup.add(floorBase, mossRug);

    // Walls: Log Timber Walls
    const backWall = createVoxelBox(roomWidth, wallHeight, 0.3, '#854d0e');
    backWall.position.set(0, wallHeight / 2, -roomDepth / 2);
    const leftWall = createVoxelBox(0.3, wallHeight, roomDepth, '#854d0e');
    leftWall.position.set(-roomWidth / 2, wallHeight / 2, 0);
    roomGroup.add(backWall, leftWall);

    // Giant Curving Tree Trunk Pillars
    const trunk1 = createVoxelBox(1.4, wallHeight + 1, 1.4, '#451a03');
    trunk1.position.set(roomWidth / 2 - 2.5, wallHeight / 2, -roomDepth / 2 + 2.5);
    const trunk2 = createVoxelBox(1.2, wallHeight + 1, 1.2, '#451a03');
    trunk2.position.set(-roomWidth / 2 + 2.5, wallHeight / 2, roomDepth / 2 - 2.5);
    const branch = createVoxelBox(5.0, 0.5, 0.5, '#5c2c16');
    branch.position.set(roomWidth / 2 - 4.5, wallHeight - 0.5, -roomDepth / 2 + 2.5);
    roomGroup.add(trunk1, trunk2, branch);

    // Forest Open Balcony View
    const windowFrame = createVoxelBox(7.0, 3.2, 0.2, '#451a03');
    windowFrame.position.set(2.5, 2.8, -roomDepth / 2 + 0.1);
    const windowGlass = createVoxelBox(6.8, 3.0, 0.05, '#16a34a', {
      emissive: '#4ade80',
      emissiveIntensity: 0.55,
      transparent: true,
      opacity: 0.85,
    });
    windowGlass.position.set(2.5, 2.8, -roomDepth / 2 + 0.15);
    windowGlassMesh = windowGlass;
    roomGroup.add(windowFrame, windowGlass);
  }
  // =============================================================
  // 7. THEME: 'greenhouse' (Botanical Conservatory)
  // =============================================================
  else if (theme === 'greenhouse') {
    // Floor: Flagstone Cobblestone & Terra Cotta Path
    const floorBase = createVoxelBox(roomWidth, 0.3, roomDepth, '#64748b');
    floorBase.position.set(0, -0.15, 0);
    const path = createVoxelBox(14.5, 0.03, 10.5, '#b45309', { roughness: 0.85 });
    path.position.set(0, 0.015, 0.6);
    roomGroup.add(floorBase, path);

    // Walls: Victorian Arched Glasshouse Wall
    const backWall = createVoxelBox(roomWidth, wallHeight, 0.3, '#14532d');
    backWall.position.set(0, wallHeight / 2, -roomDepth / 2);
    const leftWall = createVoxelBox(0.3, wallHeight, roomDepth, '#14532d');
    leftWall.position.set(-roomWidth / 2, wallHeight / 2, 0);
    // Glass Panes
    const glassPane = createVoxelBox(roomWidth - 2, 3.2, 0.06, '#86efac', {
      emissive: '#4ade80',
      emissiveIntensity: 0.45,
      transparent: true,
      opacity: 0.6,
    });
    glassPane.position.set(0, 2.8, -roomDepth / 2 + 0.16);
    roomGroup.add(backWall, leftWall, glassPane);

    // Abundant Tropical Plants & Monstera in Corners
    for (let px = -6; px <= 6; px += 4) {
      const pot = createVoxelBox(0.7, 0.6, 0.7, '#ea580c');
      pot.position.set(px, 0.3, 5.0);
      const plantLeaves = createVoxelBox(1.1, 1.2, 1.1, '#16a34a');
      plantLeaves.position.set(px, 1.1, 5.0);
      roomGroup.add(pot, plantLeaves);
    }
  }
  // =============================================================
  // 8. THEME: 'lilypad' (Starlight Lotus Pond)
  // =============================================================
  else if (theme === 'lilypad') {
    // Floor: Dark Timber Floating Dock surrounded by Crystal Water
    const waterBase = createVoxelBox(roomWidth, 0.25, roomDepth, '#0284c7', {
      emissive: '#0369a1',
      emissiveIntensity: 0.6,
    });
    waterBase.position.set(0, -0.15, 0);
    const dock = createVoxelBox(14.5, 0.06, 10.5, '#1e1b4b', { roughness: 0.6 });
    dock.position.set(0, 0.02, 0.6);
    roomGroup.add(waterBase, dock);

    // Surrounding Floating Lotus Blossoms on water
    const lotusPositions = [
      [-8.0, -6.5], [-8.0, 0.0], [-8.0, 6.5],
      [8.0, -6.5], [8.0, 0.0], [8.0, 6.5],
      [0.0, 7.5], [-4.0, 7.5], [4.0, 7.5],
    ];
    lotusPositions.forEach(([lx, lz]) => {
      const pad = createVoxelBox(1.0, 0.02, 1.0, '#10b981');
      pad.position.set(lx, 0.01, lz);
      const flower = createVoxelBox(0.4, 0.25, 0.4, '#f472b6', {
        emissive: '#ec4899',
        emissiveIntensity: 0.8,
      });
      flower.position.set(lx, 0.15, lz);
      roomGroup.add(pad, flower);
    });

    // Night Backdrop
    const backWall = createVoxelBox(roomWidth, wallHeight, 0.3, '#090514');
    backWall.position.set(0, wallHeight / 2, -roomDepth / 2);
    const leftWall = createVoxelBox(0.3, wallHeight, roomDepth, '#090514');
    leftWall.position.set(-roomWidth / 2, wallHeight / 2, 0);
    // Glowing Moon in Sky
    const moon = createVoxelBox(1.6, 1.6, 0.08, '#fef08a', {
      emissive: '#fef08a',
      emissiveIntensity: 1.5,
    });
    moon.position.set(4.0, 4.0, -roomDepth / 2 + 0.18);
    roomGroup.add(backWall, leftWall, moon);
  }
  // =============================================================
  // 9. THEME: 'arcade' (Retro Pixel Study Den)
  // =============================================================
  else if (theme === 'arcade') {
    // Floor: Dark Synthwave with Cyan & Magenta Neon Grid Matrix
    const floorBase = createVoxelBox(roomWidth, 0.3, roomDepth, '#0a0518');
    floorBase.position.set(0, -0.15, 0);
    const carpet = createVoxelBox(14.5, 0.03, 10.5, '#1e1035');
    carpet.position.set(0, 0.015, 0.6);
    roomGroup.add(floorBase, carpet);

    // Neon Grid Lines on Floor
    for (let gx = -6; gx <= 6; gx += 2) {
      const lineX = createVoxelBox(0.04, 0.035, 10.5, '#06b6d4', { emissive: '#06b6d4', emissiveIntensity: 1.2 });
      lineX.position.set(gx, 0.02, 0.6);
      roomGroup.add(lineX);
    }
    for (let gz = -4; gz <= 5; gz += 2) {
      const lineZ = createVoxelBox(14.5, 0.035, 0.04, '#ec4899', { emissive: '#ec4899', emissiveIntensity: 1.2 });
      lineZ.position.set(0, 0.02, gz);
      roomGroup.add(lineZ);
    }

    // Walls: Midnight Cyberpunk Purple
    const backWall = createVoxelBox(roomWidth, wallHeight, 0.3, '#15092a');
    backWall.position.set(0, wallHeight / 2, -roomDepth / 2);
    const leftWall = createVoxelBox(0.3, wallHeight, roomDepth, '#15092a');
    leftWall.position.set(-roomWidth / 2, wallHeight / 2, 0);
    roomGroup.add(backWall, leftWall);

    // Neon Wall Art: Pixel Heart & Level Up
    const heart = createVoxelBox(0.9, 0.9, 0.08, '#f43f5e', { emissive: '#f43f5e', emissiveIntensity: 1.5 });
    heart.position.set(-1.0, 4.2, -roomDepth / 2 + 0.18);
    const levelUp = createVoxelBox(2.2, 0.5, 0.08, '#06b6d4', { emissive: '#06b6d4', emissiveIntensity: 1.5 });
    levelUp.position.set(3.5, 4.2, -roomDepth / 2 + 0.18);
    roomGroup.add(heart, levelUp);

    // Retro Arcade Machine Cabinet 1: Pac-Voxel
    const arcade1 = new THREE.Group();
    arcade1.position.set(roomWidth / 2 - 1.8, 0, -roomDepth / 2 + 2.0);
    const cab1 = createVoxelBox(1.1, 2.6, 1.2, '#eab308');
    cab1.position.set(0, 1.3, 0);
    const crt1 = createVoxelBox(0.7, 0.6, 0.08, '#0f172a', { emissive: '#38bdf8', emissiveIntensity: 1.0 });
    crt1.position.set(-0.54, 1.5, 0);
    crt1.rotation.y = Math.PI / 2;
    const marquee1 = createVoxelBox(0.8, 0.25, 0.08, '#ffffff', { emissive: '#facc15', emissiveIntensity: 1.5 });
    marquee1.position.set(-0.54, 2.35, 0);
    marquee1.rotation.y = Math.PI / 2;
    arcade1.add(cab1, crt1, marquee1);
    roomGroup.add(arcade1);

    // Retro Arcade Machine Cabinet 2: Space Invaders
    const arcade2 = new THREE.Group();
    arcade2.position.set(roomWidth / 2 - 1.8, 0, -roomDepth / 2 + 3.8);
    const cab2 = createVoxelBox(1.1, 2.6, 1.2, '#06b6d4');
    cab2.position.set(0, 1.3, 0);
    const crt2 = createVoxelBox(0.7, 0.6, 0.08, '#0f172a', { emissive: '#22c55e', emissiveIntensity: 1.0 });
    crt2.position.set(-0.54, 1.5, 0);
    crt2.rotation.y = Math.PI / 2;
    const marquee2 = createVoxelBox(0.8, 0.25, 0.08, '#ffffff', { emissive: '#06b6d4', emissiveIntensity: 1.5 });
    marquee2.position.set(-0.54, 2.35, 0);
    marquee2.rotation.y = Math.PI / 2;
    arcade2.add(cab2, crt2, marquee2);
    roomGroup.add(arcade2);
  }

  // =============================================================
  // COMMON INTERACTIVES (Present across all room themes)
  // =============================================================
  // 1. Pristine Whiteboard
  const whiteboardObj = buildThemedWhiteboard(theme);
  roomGroup.add(whiteboardObj);

  // 2. Hallway Exit Door
  const exitDoorObj = buildThemedExitDoor(theme);
  roomGroup.add(exitDoorObj);

  // 3. Kitchenette / Beverage Hotspot on Left Wall
  const kitchenGroup = new THREE.Group();
  kitchenGroup.name = 'hotspot_espresso';
  kitchenGroup.userData = { hotspot: 'espresso' };
  kitchenGroup.position.set(-roomWidth / 2 + 1.2, 0, -4.2);
  const counterBase = createVoxelBox(1.5, 0.9, 2.8, '#334155');
  counterBase.position.set(0, 0.45, 0);
  const counterTop = createVoxelBox(1.6, 0.08, 2.9, '#f8fafc', { roughness: 0.2 });
  counterTop.position.set(0, 0.94, 0);
  const espressoMachine = createVoxelBox(0.65, 0.58, 0.65, '#e2e8f0', { metalness: 0.8, roughness: 0.2 });
  espressoMachine.position.set(0.1, 1.28, -0.6);
  kitchenGroup.add(counterBase, counterTop, espressoMachine);
  roomGroup.add(kitchenGroup);

  // 4. Water Cooler / Hydration Hotspot
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

  // 5. Copier & Print Station Hotspot
  const printerGroup = new THREE.Group();
  printerGroup.name = 'hotspot_printer';
  printerGroup.userData = { hotspot: 'printer' };
  printerGroup.position.set(-roomWidth / 2 + 1.3, 0, 2.4);
  const printBody = createVoxelBox(1.2, 1.3, 1.1, '#e2e8f0');
  printBody.position.set(0, 0.65, 0);
  const docFeeder = createVoxelBox(0.9, 0.25, 0.8, '#334155');
  docFeeder.position.set(0, 1.4, 0);
  printerGroup.add(printBody, docFeeder);
  roomGroup.add(printerGroup);

  // 6. Gutenberg Bookshelf & Archive Hotspot
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

  // 7. Workstation Cubicle Partition Dividers
  const cubicleGroup = new THREE.Group();
  const dividerColor = theme === 'arcade' ? '#8b5cf6' : theme === 'tea_loft' ? '#78350f' : '#3b82f6';
  [-2.6, 0.0, 2.6].forEach((cx) => {
    const divPanel1 = createVoxelBox(0.08, 1.2, 1.4, dividerColor, { roughness: 0.8 });
    divPanel1.position.set(cx, 0.6, -0.9);
    const divPanel2 = createVoxelBox(0.08, 1.2, 1.4, dividerColor, { roughness: 0.8 });
    divPanel2.position.set(cx, 0.6, 2.2);
    cubicleGroup.add(divPanel1, divPanel2);
  });
  const spineDivider = createVoxelBox(10.5, 1.1, 0.08, '#1e293b', { roughness: 0.7 });
  spineDivider.position.set(0, 0.55, 0.65);
  cubicleGroup.add(spineDivider);
  roomGroup.add(cubicleGroup);

  // =============================================================
  // LIGHTING SETUP
  // =============================================================
  const ambientLight = new THREE.AmbientLight(0xffffff, 1.2);
  lightGroup.add(ambientLight);

  const hemiLight = new THREE.HemisphereLight(0xffffff, 0xc7d2fe, 0.75);
  lightGroup.add(hemiLight);

  const dirLight = new THREE.DirectionalLight(0xfffbeb, 1.75);
  dirLight.position.set(12, 18, 12);
  dirLight.castShadow = true;
  dirLight.shadow.mapSize.width = 1024;
  dirLight.shadow.mapSize.height = 1024;
  dirLight.shadow.bias = -0.0008;
  lightGroup.add(dirLight);

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
      if (windowGlassMesh) {
        windowGlassMesh.material = new THREE.MeshStandardMaterial({
          color: new THREE.Color('#ea580c'),
          emissive: new THREE.Color('#ea580c'),
          emissiveIntensity: 0.9,
          flatShading: true,
        });
      }
    } else if (tod === 'night') {
      ambientLight.color.setHex(0xc7d2fe);
      ambientLight.intensity = 0.85;
      hemiLight.color.setHex(0x818cf8);
      hemiLight.groundColor.setHex(0x312e81);
      hemiLight.intensity = 0.55;
      dirLight.color.setHex(0xa5b4fc);
      dirLight.intensity = 1.1;
      ceilingPendant.color.setHex(0xffedd5);
      ceilingPendant.intensity = 2.0;
      if (windowGlassMesh) {
        windowGlassMesh.material = new THREE.MeshStandardMaterial({
          color: new THREE.Color('#1e1b4b'),
          emissive: new THREE.Color('#312e81'),
          emissiveIntensity: 0.65,
          flatShading: true,
        });
      }
    } else if (tod === 'rainy') {
      ambientLight.color.setHex(0xe2e8f0);
      ambientLight.intensity = 0.95;
      hemiLight.color.setHex(0x94a3b8);
      hemiLight.groundColor.setHex(0x64748b);
      hemiLight.intensity = 0.6;
      dirLight.color.setHex(0x94a3b8);
      dirLight.intensity = 1.2;
      ceilingPendant.color.setHex(0xfef08a);
      if (windowGlassMesh) {
        windowGlassMesh.material = new THREE.MeshStandardMaterial({
          color: new THREE.Color('#0284c7'),
          emissive: new THREE.Color('#38bdf8'),
          emissiveIntensity: 0.6,
          flatShading: true,
        });
      }
    } else {
      ambientLight.color.setHex(0xffffff);
      ambientLight.intensity = 1.25;
      hemiLight.color.setHex(0xffffff);
      hemiLight.groundColor.setHex(0xc7d2fe);
      hemiLight.intensity = 0.75;
      dirLight.color.setHex(0xfffbeb);
      dirLight.intensity = 1.75;
      ceilingPendant.color.setHex(0xfffaed);
      ceilingPendant.intensity = 1.6;
      if (windowGlassMesh) {
        windowGlassMesh.material = new THREE.MeshStandardMaterial({
          color: new THREE.Color('#38bdf8'),
          emissive: new THREE.Color('#7dd3fc'),
          emissiveIntensity: 0.85,
          flatShading: true,
        });
      }
    }
  };

  updateLights(timeOfDay);

  return { roomGroup, lightGroup, updateLights, windowGlassMesh };
}

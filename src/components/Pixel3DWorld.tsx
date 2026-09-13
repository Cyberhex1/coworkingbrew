import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import {
  AvatarConfig,
  DeskConfig,
  RoomPeer,
  CoWorkingRoom,
  TimeOfDay,
  PomodoroMode,
  TaskItem,
  TimeBlock,
} from '../types';
import {
  buildVoxelAvatar,
  buildVoxelDesk,
  buildVoxelRoom,
  VoxelAvatarInstance,
} from '../utils/voxelBuilder';
import { soundEngine } from '../utils/audioSynth';
import { EspressoBarModal } from './EspressoBarModal';
import { WaterCoolerModal } from './WaterCoolerModal';
import { CopierHubModal } from './CopierHubModal';
import { SprintBoardModal } from './SprintBoardModal';
import { DeskWorkstationOverlay } from './DeskWorkstationOverlay';
import {
  Sparkles,
  Sun,
  Sunset,
  Moon,
  CloudRain,
  Eye,
  Sliders,
  RotateCcw,
  Coffee,
  Heart,
  Layers,
  Award,
  Zap,
  ZoomIn,
  ZoomOut,
} from 'lucide-react';
import confetti from 'canvas-confetti';

interface Pixel3DWorldProps {
  room: CoWorkingRoom;
  peers: RoomPeer[];
  userPeer: RoomPeer;
  timeOfDay: TimeOfDay;
  pomodoroMode: PomodoroMode;
  isTimerRunning: boolean;
  onTimeOfDayChange: (tod: TimeOfDay) => void;
  onSendReaction: (emoji: string) => void;
  onSendHighFive: (peerId: string) => void;
  onSendCoffee: (peerId: string) => void;
  onPeerPetClick: () => void;
  onOpenCustomizer: () => void;
  onOpenBreakGames?: () => void;
  onOpenBookshelf?: () => void;
  onOpenHallway?: () => void;
  tasks?: TaskItem[];
  timeBlocks?: TimeBlock[];
  onAddTask?: (title: string, category: 'work' | 'study' | 'creative' | 'chores', pomodoros: number) => void;
  onToggleTask?: (id: string) => void;
  onDeleteTask?: (id: string) => void;
  onAddTickets?: (amount: number) => void;
  tickets?: number;
  onUpdateDesk?: (newDesk: DeskConfig) => void;
  focusMinutesToday?: number;
  streakDays?: number;
  onSwitchTo2D?: () => void;
  onSelectPeer?: (peer: RoomPeer) => void;
}

export const Pixel3DWorld: React.FC<Pixel3DWorldProps> = ({
  room,
  peers,
  userPeer,
  timeOfDay,
  pomodoroMode,
  isTimerRunning,
  onTimeOfDayChange,
  onSendReaction,
  onSendHighFive,
  onSendCoffee,
  onPeerPetClick,
  onOpenCustomizer,
  onOpenBreakGames,
  onOpenBookshelf,
  onOpenHallway,
  tasks = [],
  timeBlocks = [],
  onAddTask,
  onToggleTask,
  onDeleteTask,
  onAddTickets,
  tickets = 50,
  onUpdateDesk,
  focusMinutesToday = 75,
  streakDays = 3,
  onSwitchTo2D,
  onSelectPeer,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // Resolution / Pixelation scale: 1 = Crisp 8-Bit, 2 = Retro Voxel, 3 = HD Pixel
  const [pixelScale, setPixelScale] = useState<number>(2);
  const [cameraMode, setCameraMode] = useState<'isometric' | 'orbit' | 'desk'>('isometric');
  const [isSittingAtDesk, setIsSittingAtDesk] = useState<boolean>(true);
  const [officeNotification, setOfficeNotification] = useState<string | null>(null);
  const [quickUserReaction, setQuickUserReaction] = useState<string | null>(null);
  const quickReactionTimerRef = useRef<number | null>(null);

  // 2D Screen projected floating nametags for 100% crisp vector visibility
  const [overlayNametags, setOverlayNametags] = useState<{
    id: string;
    name: string;
    task?: string;
    reaction?: string;
    isUser: boolean;
    x: number;
    y: number;
    visible: boolean;
    isOnline: boolean;
  }[]>([]);

  // Office Hotspots Interactive Modals State
  const [isEspressoOpen, setIsEspressoOpen] = useState<boolean>(false);
  const [isWaterCoolerOpen, setIsWaterCoolerOpen] = useState<boolean>(false);
  const [isCopierOpen, setIsCopierOpen] = useState<boolean>(false);
  const [isSprintBoardOpen, setIsSprintBoardOpen] = useState<boolean>(false);

  // Zoom Level State (0.6x to 2.2x)
  const [zoomLevel, setZoomLevel] = useState<number>(1.0);
  const zoomLevelRef = useRef<number>(1.0);

  // Hovered peer ID for interactive nametag disclosure
  const [hoveredPeerId, setHoveredPeerId] = useState<string | null>(null);

  // Proximity Triggers (E Key interaction)
  interface ProximityTrigger {
    id: string;
    label: string;
    icon: string;
    action: () => void;
  }
  const [activeTrigger, setActiveTrigger] = useState<ProximityTrigger | null>(null);
  const activeTriggerRef = useRef<ProximityTrigger | null>(null);

  // 6 Desk placement coordinates in the expanded 20x18 3D room
  // Desk 0: Designated Room Study Bot
  // Desks 1-5: Player Desks
  const deskLocations = [
    { x: -3.8, z: -0.9 },   // Desk 0 (Room Bot)
    { x: -1.3, z: -0.9 },   // Desk 1
    { x: 1.3, z: -0.9 },    // Desk 2
    { x: 3.8, z: -0.9 },    // Desk 3
    { x: -2.2, z: 2.2 },    // Desk 4
    { x: 2.2, z: 2.2 },     // Desk 5
  ];

  // User assigned desk index (defaults to 1 if not specified)
  const userDeskIdx = userPeer.deskIndex !== undefined ? userPeer.deskIndex : 1;
  const userDeskLoc = deskLocations[userDeskIdx] || deskLocations[1];

  // Stable Refs for 3D state loop (Prevents unwanted re-mounting and character snapping!)
  const isSittingRef = useRef<boolean>(true);
  const userPosRef = useRef<{ x: number; y: number; z: number }>({
    x: userDeskLoc.x,
    y: 0,
    z: userDeskLoc.z - 0.42,
  });
  const keysPressed = useRef<{ [key: string]: boolean }>({});
  const timeOfDayRef = useRef<TimeOfDay>(timeOfDay);
  const cameraModeRef = useRef<'isometric' | 'orbit' | 'desk'>(cameraMode);
  const pixelScaleRef = useRef<number>(pixelScale);
  const pomodoroModeRef = useRef<PomodoroMode>(pomodoroMode);
  const isTimerRunningRef = useRef<boolean>(isTimerRunning);
  const doorCooldownRef = useRef<boolean>(false);

  // Helper notification toaster
  const showOfficeNotice = (msg: string) => {
    setOfficeNotification(msg);
    setTimeout(() => {
      setOfficeNotification((prev) => (prev === msg ? null : prev));
    }, 2800);
  };

  // Office Interactive Station Handlers (Hoisted so animation loop can invoke them!)
  const handleOpenHallway = () => {
    soundEngine.playChime('bell');
    showOfficeNotice('Stepped into the Hallway corridor... 🚪');
    onOpenHallway?.();
  };

  const handleCoffeeBarClick = () => {
    soundEngine.playChime('chime');
    setIsEspressoOpen(true);
  };

  const handleWaterCoolerClick = () => {
    soundEngine.playChime('chime');
    setIsWaterCoolerOpen(true);
  };

  const handlePrinterStationClick = () => {
    soundEngine.playChime('digital');
    setIsCopierOpen(true);
  };

  const handleSprintBoardClick = () => {
    soundEngine.playChime('chime');
    setIsSprintBoardOpen(true);
  };

  const handleBookshelfClick = () => {
    soundEngine.playChime('chime');
    onOpenBookshelf?.();
  };

  const handleReturnToDesk = () => {
    const targetDesk = deskLocations[userDeskIdx] || deskLocations[1];
    userPosRef.current = { x: targetDesk.x, y: 0, z: targetDesk.z - 0.42 };
    if (userGroupRef.current) {
      userGroupRef.current.position.set(userPosRef.current.x, 0, userPosRef.current.z);
      userGroupRef.current.rotation.y = 0;
    }
    isSittingRef.current = true;
    setIsSittingAtDesk(true);
    soundEngine.playChime('bell');
    confetti({ particleCount: 25, spread: 50 });
    showOfficeNotice('Sat down at your workstation 💻');
  };

  const handleZoomChange = (delta: number) => {
    setZoomLevel((prev) => {
      const next = Math.max(0.6, Math.min(2.0, Number((prev + delta).toFixed(2))));
      zoomLevelRef.current = next;
      if (cameraRef.current && cameraModeRef.current !== 'desk') {
        cameraRef.current.zoom = next;
        cameraRef.current.updateProjectionMatrix();
      }
      return next;
    });
  };

  const handleResetZoom = () => {
    setZoomLevel(1.0);
    zoomLevelRef.current = 1.0;
    if (cameraRef.current && cameraModeRef.current !== 'desk') {
      cameraRef.current.zoom = 1.0;
      cameraRef.current.updateProjectionMatrix();
    }
  };

  // Sync state into refs
  useEffect(() => {
    isSittingRef.current = isSittingAtDesk;
  }, [isSittingAtDesk]);

  useEffect(() => {
    timeOfDayRef.current = timeOfDay;
  }, [timeOfDay]);

  useEffect(() => {
    cameraModeRef.current = cameraMode;
  }, [cameraMode]);

  useEffect(() => {
    pixelScaleRef.current = pixelScale;
  }, [pixelScale]);

  useEffect(() => {
    pomodoroModeRef.current = pomodoroMode;
    isTimerRunningRef.current = isTimerRunning;
  }, [pomodoroMode, isTimerRunning]);

  // Three.js Instances Refs
  const sceneRef = useRef<THREE.Scene | null>(null);
  const cameraRef = useRef<THREE.OrthographicCamera | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const userAvatarInstanceRef = useRef<VoxelAvatarInstance | null>(null);
  const peerAvatarInstancesRef = useRef<Map<string, VoxelAvatarInstance>>(new Map());
  const userGroupRef = useRef<THREE.Group | null>(null);
  const updateLightsRef = useRef<((tod: TimeOfDay) => void) | null>(null);

  // Orbit camera dragging
  const orbitAngle = useRef<{ theta: number; phi: number; distance: number; isDragging: boolean; lastX: number; lastY: number }>({
    theta: Math.PI / 4,
    phi: Math.PI / 6,
    distance: 18,
    isDragging: false,
    lastX: 0,
    lastY: 0,
  });

  // -------------------------------------------------------------
  // Initial Three.js Setup (Runs ONCE on mount, decoupled from timers)
  // -------------------------------------------------------------
  useEffect(() => {
    if (!canvasRef.current || !containerRef.current) return;

    const container = containerRef.current;
    const canvas = canvasRef.current;
    const width = container.clientWidth;
    const height = container.clientHeight;

    // 1. Scene
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x130f21);
    sceneRef.current = scene;

    // 2. Camera (Isometric Orthographic)
    const aspect = width / height;
    const d = 11.2;
    const orthoCamera = new THREE.OrthographicCamera(-d * aspect, d * aspect, d, -d, 1, 100);
    orthoCamera.zoom = zoomLevelRef.current;
    orthoCamera.position.set(16, 16, 16);
    orthoCamera.lookAt(0, 0.5, 0);
    cameraRef.current = orthoCamera;

    // 3. Renderer with Pixelation downscaling
    const renderer = new THREE.WebGLRenderer({
      canvas,
      antialias: false,
      powerPreference: 'high-performance',
    });
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;

    const rScale = pixelScaleRef.current;
    const renderW = Math.max(160, Math.floor(width / rScale));
    const renderH = Math.max(120, Math.floor(height / rScale));
    renderer.setSize(renderW, renderH, false);
    rendererRef.current = renderer;

    // 4. Build Office Environment Room
    const { roomGroup, lightGroup, updateLights } = buildVoxelRoom(room, timeOfDayRef.current);
    scene.add(roomGroup);
    scene.add(lightGroup);
    updateLightsRef.current = updateLights;

    // 5. Ambient Dust / Office Coffee Steam Particle System
    const particleCount = 50;
    const particleGeo = new THREE.BufferGeometry();
    const particlePositions = new Float32Array(particleCount * 3);
    for (let i = 0; i < particleCount * 3; i += 3) {
      particlePositions[i] = (Math.random() - 0.5) * 12;
      particlePositions[i + 1] = Math.random() * 4 + 0.5;
      particlePositions[i + 2] = (Math.random() - 0.5) * 12;
    }
    particleGeo.setAttribute('position', new THREE.BufferAttribute(particlePositions, 3));
    const particleMat = new THREE.PointsMaterial({
      color: 0xfef08a,
      size: 0.12,
      transparent: true,
      opacity: 0.7,
    });
    const particles = new THREE.Points(particleGeo, particleMat);
    scene.add(particles);

    // 6. Spawn 6 Workspace Desks & Active Avatars
    // A. Spawn All 6 Desks
    for (let dIdx = 0; dIdx < deskLocations.length; dIdx++) {
      const loc = deskLocations[dIdx];
      let dConfig = userPeer.desk;
      if (userDeskIdx === dIdx) {
        dConfig = userPeer.desk;
      } else {
        const occupant = peers.find((p) => p.deskIndex === dIdx);
        if (occupant) dConfig = occupant.desk;
      }
      const deskObj = buildVoxelDesk(dConfig);
      deskObj.position.set(loc.x, 0, loc.z);
      deskObj.userData = { deskIndex: dIdx };
      scene.add(deskObj);
    }

    // B. User Avatar (With 3D integrated nametag for 0-lag synchronization)
    const userAvatar = buildVoxelAvatar(
      userPeer.avatar,
      userPeer.name,
      userPeer.currentTask,
      userPeer.reactionEmoji
    );
    const userGroup = new THREE.Group();
    userGroup.position.set(userPosRef.current.x, userPosRef.current.y, userPosRef.current.z);
    userGroup.add(userAvatar.group);
    userGroup.userData = { isUser: true };
    scene.add(userGroup);
    userAvatarInstanceRef.current = userAvatar;
    userGroupRef.current = userGroup;

    // C. Peer Avatars (Bot at Desk 0, other connected peers at their deskIndex)
    const newPeerInstances = new Map<string, VoxelAvatarInstance>();

    peers.forEach((peer) => {
      const pDeskIdx = peer.deskIndex !== undefined ? peer.deskIndex : 0;
      const loc = deskLocations[pDeskIdx] || deskLocations[0];

      // Avatar (Sitting in chair at z - 0.42 facing desk and room +Z)
      const pAvatar = buildVoxelAvatar(peer.avatar, peer.name, peer.currentTask, peer.reactionEmoji);
      const pGroup = new THREE.Group();
      pGroup.position.set(loc.x, 0, loc.z - 0.42);
      pGroup.userData = { peerId: peer.id, isPeer: true, hotspot: 'peer_avatar' };
      pGroup.add(pAvatar.group);

      // Add userData to child meshes for raycasting
      pAvatar.group.traverse((child) => {
        child.userData = { peerId: peer.id, isPeer: true, hotspot: 'peer_avatar' };
      });

      scene.add(pGroup);
      newPeerInstances.set(peer.id, pAvatar);
    });
    peerAvatarInstancesRef.current = newPeerInstances;

    // 7. Animation Frame Loop
    let animationFrameId: number;
    const clock = new THREE.Clock();

    const animate = () => {
      animationFrameId = requestAnimationFrame(animate);
      const elapsedTime = clock.getElapsedTime();

      // Animate Particles
      const positions = particleGeo.attributes.position.array as Float32Array;
      for (let i = 1; i < particleCount * 3; i += 3) {
        positions[i] += Math.sin(elapsedTime + i) * 0.003;
        if (positions[i] > 4.2) positions[i] = 0.5;
      }
      particleGeo.attributes.position.needsUpdate = true;

      // Handle Smooth Keyboard Movement for User (WASD / Arrows)
      if (userGroupRef.current && userAvatarInstanceRef.current) {
        const speed = 0.085;
        let isWalking = false;
        let dx = 0;
        let dz = 0;

        if (keysPressed.current['KeyW'] || keysPressed.current['ArrowUp']) dz -= speed;
        if (keysPressed.current['KeyS'] || keysPressed.current['ArrowDown']) dz += speed;
        if (keysPressed.current['KeyA'] || keysPressed.current['ArrowLeft']) dx -= speed;
        if (keysPressed.current['KeyD'] || keysPressed.current['ArrowRight']) dx += speed;

        if (dx !== 0 || dz !== 0) {
          isWalking = true;
          // Stand up smoothly without re-triggering React scene recreation
          if (isSittingRef.current) {
            isSittingRef.current = false;
            setIsSittingAtDesk(false);
          }

          // Isometric coordinate movement translation
          const moveX = (dx + dz) * 0.7071;
          const moveZ = (dz - dx) * 0.7071;

          userPosRef.current.x = Math.max(-9.0, Math.min(9.0, userPosRef.current.x + moveX));
          userPosRef.current.z = Math.max(-8.0, Math.min(8.2, userPosRef.current.z + moveZ));

          userGroupRef.current.position.x = userPosRef.current.x;
          userGroupRef.current.position.z = userPosRef.current.z;

          // Rotate facing direction
          const targetAngle = Math.atan2(moveX, moveZ);
          userGroupRef.current.rotation.y = targetAngle;

          // Walking Out Door Threshold Trigger (Door is at x: 5.5..8.0, z >= 7.5)
          if (userPosRef.current.x >= 5.2 && userPosRef.current.z >= 7.5) {
            if (!doorCooldownRef.current) {
              doorCooldownRef.current = true;
              userPosRef.current.z = 6.6;
              userGroupRef.current.position.z = 6.6;
              handleOpenHallway();
              setTimeout(() => {
                doorCooldownRef.current = false;
              }, 2500);
            }
          }
        }

        // Update User animation
        const currentActivity =
          isTimerRunningRef.current && pomodoroModeRef.current === 'work'
            ? userPeer.avatar.activity
            : 'typing';
        userAvatarInstanceRef.current.updateAnimation(
          elapsedTime,
          isWalking,
          isSittingRef.current,
          currentActivity
        );
      }

      // Update Peers Animations (breathing, typing, tea sipping)
      peers.forEach((peer) => {
        const pInstance = peerAvatarInstancesRef.current.get(peer.id);
        if (pInstance) {
          pInstance.updateAnimation(elapsedTime + peer.deskIndex, false, true, peer.avatar.activity);
        }
      });

      // Update Camera based on CameraMode and Zoom Level
      if (cameraRef.current) {
        const currentCamMode = cameraModeRef.current;
        const targetZoom = currentCamMode === 'desk' ? 2.4 * zoomLevelRef.current : zoomLevelRef.current;
        if (Math.abs(cameraRef.current.zoom - targetZoom) > 0.001) {
          cameraRef.current.zoom = targetZoom;
          cameraRef.current.updateProjectionMatrix();
        }

        if (currentCamMode === 'isometric') {
          cameraRef.current.position.set(16, 16, 16);
          cameraRef.current.lookAt(0, 0.5, 0);
        } else if (currentCamMode === 'desk' && userGroupRef.current) {
          const uPos = userGroupRef.current.position;
          cameraRef.current.position.set(
            uPos.x + 3.2,
            uPos.y + 3.2,
            uPos.z + 3.2
          );
          cameraRef.current.lookAt(uPos.x, uPos.y + 0.6, uPos.z + 0.2);
        } else if (currentCamMode === 'orbit') {
          const { theta, phi, distance } = orbitAngle.current;
          const cx = distance * Math.sin(phi) * Math.sin(theta);
          const cy = distance * Math.cos(phi);
          const cz = distance * Math.sin(phi) * Math.cos(theta);
          cameraRef.current.position.set(cx, cy, cz);
          cameraRef.current.lookAt(0, 0.5, 0);
        }
      }

      // Proximity Trigger Detection Loop
      const uX = userPosRef.current.x;
      const uZ = userPosRef.current.z;
      let detectedTrigger: ProximityTrigger | null = null;

      // 1. If currently sitting at user desk: prompt to open Desk Workstation OS
      if (isSittingRef.current) {
        detectedTrigger = {
          id: 'desk_os',
          label: 'Open Desk Workstation OS',
          icon: '💻',
          action: () => {
            setCameraMode('desk');
          },
        };
      }
      // 2. Sprint Whiteboard (x: -4.2, z: -8.8)
      else if (Math.hypot(uX - (-4.2), uZ - (-8.8)) < 3.2) {
        detectedTrigger = {
          id: 'sprint_board',
          label: 'Open Sprint Kanban Whiteboard',
          icon: '📋',
          action: handleSprintBoardClick,
        };
      }
      // 3. Exit Door to Hallway Corridor (x: 6.8, z: 8.2)
      else if (Math.hypot(uX - 6.8, uZ - 8.2) < 3.4) {
        detectedTrigger = {
          id: 'exit_door',
          label: 'Walk into Hallway (Room Wall)',
          icon: '🚪',
          action: handleOpenHallway,
        };
      }
      // 4. Espresso Bar (x: -8.8, z: -4.2)
      else if (Math.hypot(uX - (-8.8), uZ - (-4.2)) < 3.2) {
        detectedTrigger = {
          id: 'espresso',
          label: 'Brew Espresso at Coffee Bar',
          icon: '☕',
          action: handleCoffeeBarClick,
        };
      }
      // 5. Water Cooler (x: -8.9, z: -0.6)
      else if (Math.hypot(uX - (-8.9), uZ - (-0.6)) < 3.0) {
        detectedTrigger = {
          id: 'cooler',
          label: 'Hydrate at Water Cooler',
          icon: '💧',
          action: handleWaterCoolerClick,
        };
      }
      // 6. Copier / Print Station (x: -8.7, z: 2.4)
      else if (Math.hypot(uX - (-8.7), uZ - 2.4) < 3.0) {
        detectedTrigger = {
          id: 'copier',
          label: 'Print at Copier Hub',
          icon: '🖨️',
          action: handlePrinterStationClick,
        };
      }
      // 7. Gutenberg Bookshelf & Archive (x: -8.8, z: 4.8)
      else if (Math.hypot(uX - (-8.8), uZ - 4.8) < 3.2) {
        detectedTrigger = {
          id: 'bookshelf',
          label: 'Browse Gutenberg Bookshelf',
          icon: '📚',
          action: handleBookshelfClick,
        };
      }
      // 8. Break Games / Basketball Hoop (x: 3.8, z: 3.8)
      else if (Math.hypot(uX - 3.8, uZ - 3.8) < 3.0) {
        detectedTrigger = {
          id: 'break_games',
          label: 'Play Break Mini-Games',
          icon: '🏀',
          action: () => onOpenBreakGames?.(),
        };
      }
      // 9. User Desk Workstation (when walking and near own desk)
      else if (Math.hypot(uX - userDeskLoc.x, uZ - (userDeskLoc.z - 0.42)) < 2.5) {
        detectedTrigger = {
          id: 'user_desk',
          label: 'Sit at Workstation',
          icon: '💻',
          action: handleReturnToDesk,
        };
      }
      // 10. Peer & Bot Desks: visit coworker / bot to open Nametag Modal (Add Friend / PM / Cheer)!
      else {
        for (let pIdx = 0; pIdx < peers.length; pIdx++) {
          const peer = peers[pIdx];
          const pDeskIdx = peer.deskIndex !== undefined ? peer.deskIndex : 0;
          const pLoc = deskLocations[pDeskIdx];
          if (pLoc && Math.hypot(uX - pLoc.x, uZ - (pLoc.z - 0.42)) < 2.5) {
            detectedTrigger = {
              id: peer.id,
              label: `Interact with ${peer.name}`,
              icon: '👋',
              action: () => {
                if (onSelectPeer) {
                  onSelectPeer(peer);
                } else {
                  onSendHighFive(peer.id);
                  soundEngine.playCoin();
                  confetti({ particleCount: 20, spread: 45 });
                  showOfficeNotice(`Gave high-five to ${peer.name}! 👏`);
                }
              },
            };
            break;
          }
        }
      }

      if (detectedTrigger?.id !== activeTriggerRef.current?.id) {
        activeTriggerRef.current = detectedTrigger;
        setActiveTrigger(detectedTrigger);
      }

      // Calculate 2D Screen Positions for Vector HTML Nametag Overlay
      if (containerRef.current && cameraRef.current) {
        const rect = containerRef.current.getBoundingClientRect();
        const cWidth = rect.width;
        const cHeight = rect.height;
        const tags: {
          id: string;
          name: string;
          task?: string;
          reaction?: string;
          isUser: boolean;
          x: number;
          y: number;
          visible: boolean;
          isOnline: boolean;
        }[] = [];
        const tempV = new THREE.Vector3();

        // User nametag
        if (userGroupRef.current) {
          userGroupRef.current.getWorldPosition(tempV);
          tempV.y += 1.85;
          tempV.project(cameraRef.current);
          const x = ((tempV.x + 1) / 2) * cWidth;
          const y = ((-tempV.y + 1) / 2) * cHeight;
          tags.push({
            id: userPeer.id,
            name: userPeer.name,
            task: userPeer.currentTask,
            reaction: userPeer.reactionEmoji,
            isUser: true,
            x,
            y,
            visible: tempV.z >= -1 && tempV.z <= 1,
            isOnline: true,
          });
        }

        // Peer nametags using true world positions
        peers.forEach((peer) => {
          const pInstance = peerAvatarInstancesRef.current.get(peer.id);
          if (pInstance) {
            pInstance.group.getWorldPosition(tempV);
            tempV.y += 1.85;
            tempV.project(cameraRef.current!);
            const x = ((tempV.x + 1) / 2) * cWidth;
            const y = ((-tempV.y + 1) / 2) * cHeight;
            tags.push({
              id: peer.id,
              name: peer.name,
              task: peer.currentTask,
              reaction: peer.reactionEmoji,
              isUser: false,
              x,
              y,
              visible: tempV.z >= -1 && tempV.z <= 1,
              isOnline: peer.isOnline,
            });
          }
        });

        setOverlayNametags(tags);
      }

      renderer.render(scene, cameraRef.current!);
    };

    animate();

    // Resize Handler
    const handleResize = () => {
      if (!containerRef.current || !rendererRef.current || !cameraRef.current) return;
      const nw = containerRef.current.clientWidth;
      const nh = containerRef.current.clientHeight;
      const aspect = nw / nh;
      const camD = 11.2;

      cameraRef.current.left = -camD * aspect;
      cameraRef.current.right = camD * aspect;
      cameraRef.current.top = camD;
      cameraRef.current.bottom = -camD;
      cameraRef.current.zoom = cameraModeRef.current === 'desk' ? 2.4 * zoomLevelRef.current : zoomLevelRef.current;
      cameraRef.current.updateProjectionMatrix();

      const curScale = pixelScaleRef.current;
      const rW = Math.max(160, Math.floor(nw / curScale));
      const rH = Math.max(120, Math.floor(nh / curScale));
      rendererRef.current.setSize(rW, rH, false);
    };

    window.addEventListener('resize', handleResize);

    // Keyboard handlers
    const handleKeyDown = (e: KeyboardEvent) => {
      // Avoid capturing input when user is typing in form inputs
      if (['INPUT', 'TEXTAREA', 'SELECT'].includes((e.target as HTMLElement)?.tagName)) return;

      keysPressed.current[e.code] = true;
      if (e.code === 'KeyE') {
        if (activeTriggerRef.current) {
          activeTriggerRef.current.action();
        } else if (!isSittingRef.current) {
          handleReturnToDesk();
        } else {
          // Stand up
          isSittingRef.current = false;
          setIsSittingAtDesk(false);
          showOfficeNotice('Standing up — walk around with WASD 🚶');
        }
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      keysPressed.current[e.code] = false;
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);

    return () => {
      cancelAnimationFrame(animationFrameId);
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
      renderer.dispose();
    };
  }, [room.id, room.theme]);

  // -------------------------------------------------------------
  // Dynamic Property Sync without Scene Re-Creation
  // -------------------------------------------------------------
  // 1. Time of Day Lighting
  useEffect(() => {
    if (updateLightsRef.current) {
      updateLightsRef.current(timeOfDay);
    }
  }, [timeOfDay]);

  // 2. Nametag & Reaction Sync (Instantly updates 3D billboard texture with 0 lag!)
  useEffect(() => {
    if (userAvatarInstanceRef.current) {
      userAvatarInstanceRef.current.updateNametag(
        userPeer.name,
        userPeer.currentTask,
        userPeer.reactionEmoji
      );
    }
  }, [userPeer.name, userPeer.currentTask, userPeer.reactionEmoji]);

  // 3. Peers Nametag Sync
  useEffect(() => {
    peers.forEach((peer) => {
      const pInstance = peerAvatarInstancesRef.current.get(peer.id);
      if (pInstance) {
        pInstance.updateNametag(peer.name, peer.currentTask, peer.reactionEmoji);
      }
    });
  }, [peers]);

  // 4. Pixelation Resolution Scale
  useEffect(() => {
    if (!containerRef.current || !rendererRef.current) return;
    const nw = containerRef.current.clientWidth;
    const nh = containerRef.current.clientHeight;
    const rW = Math.max(160, Math.floor(nw / pixelScale));
    const rH = Math.max(120, Math.floor(nh / pixelScale));
    rendererRef.current.setSize(rW, rH, false);
  }, [pixelScale]);

  // Handle Mouse Drag for Orbit Camera
  const mouseStartPos = useRef<{ x: number; y: number }>({ x: 0, y: 0 });

  const handleMouseDown = (e: React.MouseEvent) => {
    mouseStartPos.current = { x: e.clientX, y: e.clientY };
    if (cameraMode !== 'orbit') return;
    orbitAngle.current.isDragging = true;
    orbitAngle.current.lastX = e.clientX;
    orbitAngle.current.lastY = e.clientY;
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (orbitAngle.current.isDragging && cameraMode === 'orbit') {
      const deltaX = e.clientX - orbitAngle.current.lastX;
      const deltaY = e.clientY - orbitAngle.current.lastY;

      orbitAngle.current.theta += deltaX * 0.008;
      orbitAngle.current.phi = Math.max(0.2, Math.min(Math.PI / 2.2, orbitAngle.current.phi - deltaY * 0.008));

      orbitAngle.current.lastX = e.clientX;
      orbitAngle.current.lastY = e.clientY;
    }

    // Hover detection for peer avatars and nametag disclosure
    if (containerRef.current) {
      const rect = containerRef.current.getBoundingClientRect();
      const mouseX = e.clientX - rect.left;
      const mouseY = e.clientY - rect.top;

      let foundHover: string | null = null;
      for (const tag of overlayNametags) {
        if (!tag.isUser && tag.visible) {
          const dx = Math.abs(mouseX - tag.x);
          const dy = mouseY - tag.y;
          // tag.y is projected position above avatar head. Avatar & desk span dy from -20 to 110, dx < 50
          if (dx < 50 && dy > -20 && dy < 110) {
            foundHover = tag.id;
            break;
          }
        }
      }
      if (foundHover !== hoveredPeerId) {
        setHoveredPeerId(foundHover);
      }
    }
  };

  const handleMouseUp = () => {
    orbitAngle.current.isDragging = false;
  };

  // Click Raycasting on 3D Objects in the Office
  const handleCanvasClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    // If mouse was dragged (e.g. orbit rotation), do not treat as click
    const dist = Math.hypot(e.clientX - mouseStartPos.current.x, e.clientY - mouseStartPos.current.y);
    if (dist > 6) return;

    if (!canvasRef.current || !cameraRef.current || !sceneRef.current) return;
    const rect = canvasRef.current.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
    const y = -((e.clientY - rect.top) / rect.height) * 2 + 1;

    const raycaster = new THREE.Raycaster();
    raycaster.setFromCamera(new THREE.Vector2(x, y), cameraRef.current);
    const intersects = raycaster.intersectObjects(sceneRef.current.children, true);

    if (intersects.length > 0) {
      for (const hit of intersects) {
        let cur: THREE.Object3D | null = hit.object;
        while (cur) {
          if (cur.userData?.peerId) {
            const foundPeer = peers.find((p) => p.id === cur.userData.peerId);
            if (foundPeer && onSelectPeer) {
              onSelectPeer(foundPeer);
              return;
            }
          }
          if (cur.userData?.hotspot === 'blackboard' || cur.name === 'hotspot_blackboard') {
            handleOpenHallway();
            return;
          }
          if (cur.userData?.hotspot === 'exit_door' || cur.name === 'hotspot_exit_door') {
            handleOpenHallway();
            return;
          }
          if (cur.userData?.hotspot === 'espresso' || cur.name === 'hotspot_espresso') {
            handleCoffeeBarClick();
            return;
          }
          if (cur.userData?.hotspot === 'cooler' || cur.name === 'hotspot_cooler') {
            handleWaterCoolerClick();
            return;
          }
          if (cur.userData?.hotspot === 'printer' || cur.name === 'hotspot_printer') {
            handlePrinterStationClick();
            return;
          }
          if (cur.userData?.hotspot === 'sprint_board' || cur.name === 'hotspot_sprint_board') {
            handleSprintBoardClick();
            return;
          }
          if (cur.userData?.hotspot === 'exit_door' || cur.name === 'hotspot_exit_door') {
            handleOpenHallway();
            return;
          }
          if (cur.userData?.hotspot === 'bookshelf' || cur.name === 'hotspot_bookshelf') {
            handleBookshelfClick();
            return;
          }
          cur = cur.parent;
        }
      }
    }
  };

  return (
    <div
      ref={containerRef}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      className="relative w-full h-[380px] sm:h-[480px] md:h-[540px] rounded-3xl overflow-hidden border-2 border-purple-500/40 shadow-[0_12px_40px_rgba(0,0,0,0.6)] select-none bg-[#100c1e] group"
    >
      {/* 1. WebGL Pixelated Canvas (Renders 3D Scene + Zero-Lag 3D Sprite Nametags) */}
      <canvas
        ref={canvasRef}
        onClick={handleCanvasClick}
        className="w-full h-full block cursor-grab active:cursor-grabbing"
        style={{
          imageRendering: 'pixelated',
        }}
      />

      {/* 2. Office Activity Notification Banner */}
      {officeNotification && (
        <div className="absolute top-16 left-1/2 -translate-x-1/2 z-40 bg-[#1e1533]/95 border border-purple-400/80 px-4 py-2 rounded-2xl shadow-2xl text-xs font-cozy font-bold text-purple-100 flex items-center gap-2 animate-bounce">
          <Sparkles className="w-4 h-4 text-amber-400" />
          <span>{officeNotification}</span>
        </div>
      )}

      {/* 3. Top Controls Bar */}
      <div className="absolute top-4 left-4 right-4 flex items-center justify-between pointer-events-none">
        {/* Room Title & Theme badge */}
        <div className="bg-[#181524]/90 backdrop-blur-md px-3.5 py-1.5 rounded-2xl border border-purple-500/40 shadow-lg flex items-center gap-2 pointer-events-auto">
          <span className="text-xs font-cozy font-bold text-white flex items-center gap-1.5">
            <span>🏢</span>
            <span>{room.name}</span>
          </span>
          <span className="text-[10px] bg-purple-900/70 border border-purple-700/50 px-2 py-0.5 rounded-full text-purple-300 font-mono-timer">
            3D Voxel Office
          </span>
        </div>

        {/* Camera & Time of Day Controls */}
        <div className="flex items-center gap-2 pointer-events-auto">
          {/* Time of Day Switcher */}
          <div className="flex items-center bg-[#181524]/90 backdrop-blur-md p-1 rounded-2xl border border-purple-500/40 shadow-lg">
            <button
              onClick={() => onTimeOfDayChange('day')}
              title="Sunny Morning Office"
              className={`p-1.5 rounded-xl transition-all ${
                timeOfDay === 'day' ? 'bg-amber-500 text-purple-950 shadow-md' : 'text-purple-300 hover:text-white'
              }`}
            >
              <Sun className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => onTimeOfDayChange('sunset')}
              title="Sunset Tech Loft"
              className={`p-1.5 rounded-xl transition-all ${
                timeOfDay === 'sunset' ? 'bg-orange-500 text-white shadow-md' : 'text-purple-300 hover:text-white'
              }`}
            >
              <Sunset className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => onTimeOfDayChange('night')}
              title="Late Night Coding"
              className={`p-1.5 rounded-xl transition-all ${
                timeOfDay === 'night' ? 'bg-indigo-600 text-white shadow-md' : 'text-purple-300 hover:text-white'
              }`}
            >
              <Moon className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => onTimeOfDayChange('rainy')}
              title="Rainy Window Ambiance"
              className={`p-1.5 rounded-xl transition-all ${
                timeOfDay === 'rainy' ? 'bg-cyan-600 text-white shadow-md' : 'text-purple-300 hover:text-white'
              }`}
            >
              <CloudRain className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Camera Perspective Angle Switcher */}
          <div className="flex items-center bg-[#181524]/90 backdrop-blur-md p-1 rounded-2xl border border-purple-500/40 shadow-lg text-xs font-cozy">
            <button
              onClick={() => setCameraMode('isometric')}
              className={`px-2.5 py-1 rounded-xl transition-all ${
                cameraMode === 'isometric' ? 'bg-purple-600 text-white font-bold' : 'text-purple-300 hover:text-white'
              }`}
            >
              3D View
            </button>
            <button
              onClick={() => setCameraMode('orbit')}
              className={`px-2.5 py-1 rounded-xl transition-all ${
                cameraMode === 'orbit' ? 'bg-purple-600 text-white font-bold' : 'text-purple-300 hover:text-white'
              }`}
            >
              Orbit 3D
            </button>
            <button
              onClick={() => setCameraMode('desk')}
              className={`px-2.5 py-1 rounded-xl transition-all ${
                cameraMode === 'desk' ? 'bg-purple-600 text-white font-bold' : 'text-purple-300 hover:text-white'
              }`}
            >
              Desk View
            </button>
            {onSwitchTo2D && (
              <button
                onClick={onSwitchTo2D}
                className="px-2.5 py-1 rounded-xl transition-all text-purple-300 hover:text-white hover:bg-purple-900/40"
              >
                2D View
              </button>
            )}
          </div>

          {/* Zoom In / Out Controls */}
          <div className="flex items-center bg-[#181524]/90 backdrop-blur-md p-1 rounded-2xl border border-purple-500/40 shadow-lg text-xs font-cozy">
            <button
              onClick={() => handleZoomChange(-0.15)}
              title="Zoom Out Workspace (-)"
              className="px-2 py-1 rounded-xl text-purple-300 hover:text-white transition-all hover:bg-purple-900/50 flex items-center gap-1 font-bold active:scale-95"
            >
              <ZoomOut className="w-3.5 h-3.5" />
              <span className="font-mono text-xs leading-none">−</span>
            </button>
            <button
              onClick={handleResetZoom}
              title="Click to Reset Zoom (100%)"
              className="text-[11px] font-mono px-1.5 text-purple-200 min-w-[42px] text-center font-bold hover:text-white"
            >
              {Math.round(zoomLevel * 100)}%
            </button>
            <button
              onClick={() => handleZoomChange(0.15)}
              title="Zoom In Workspace (+)"
              className="px-2 py-1 rounded-xl text-purple-300 hover:text-white transition-all hover:bg-purple-900/50 flex items-center gap-1 font-bold active:scale-95"
            >
              <ZoomIn className="w-3.5 h-3.5" />
              <span className="font-mono text-xs leading-none">+</span>
            </button>
          </div>

          {/* Pixelation Resolution Level */}
          <button
            onClick={() => setPixelScale((prev) => (prev === 1 ? 2 : prev === 2 ? 3 : 1))}
            title={`Pixel Resolution: ${pixelScale === 1 ? '160p Retro' : pixelScale === 2 ? '240p Classic' : 'HD Smooth'}`}
            className="p-2 rounded-2xl bg-[#181524]/90 backdrop-blur-md border border-purple-500/40 text-purple-300 hover:text-white shadow-lg transition-all flex items-center gap-1 text-xs font-cozy"
          >
            <Sliders className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">
              {pixelScale === 1 ? 'Crisp 8-Bit' : pixelScale === 2 ? 'Retro Voxel' : 'HD Pixel'}
            </span>
          </button>
        </div>
      </div>

      {/* 4. Quick Office Hotspots Toolbar (Hallway, Blackboard, Espresso, Water Cooler, Printer, Mini-Games) */}
      <div className="absolute top-16 left-4 flex flex-col gap-2 pointer-events-none">
        <button
          onClick={handleOpenHallway}
          className="pointer-events-auto flex items-center gap-1.5 px-3 py-1.5 bg-gradient-to-r from-purple-900/90 to-indigo-900/90 backdrop-blur-md hover:from-purple-800 hover:to-indigo-800 border border-purple-400/50 text-purple-100 text-xs font-cozy rounded-2xl shadow-lg transition-all active:scale-95 animate-pulse"
          title="Step into the Hallway & Room Wall Directory"
        >
          <span>🚪</span>
          <span className="hidden sm:inline">Hallway (Room Wall)</span>
        </button>

        <button
          onClick={handleSprintBoardClick}
          className="pointer-events-auto flex items-center gap-1.5 px-3 py-1.5 bg-[#181524]/90 backdrop-blur-md hover:bg-purple-950/80 border border-purple-500/40 text-purple-200 text-xs font-cozy rounded-2xl shadow-lg transition-all active:scale-95"
          title="Open Sprint Kanban Whiteboard"
        >
          <span>📋</span>
          <span className="hidden sm:inline">Whiteboard</span>
        </button>

        <button
          onClick={handleCoffeeBarClick}
          className="pointer-events-auto flex items-center gap-1.5 px-3 py-1.5 bg-[#181524]/90 backdrop-blur-md hover:bg-amber-950/80 border border-amber-500/40 text-amber-200 text-xs font-cozy rounded-2xl shadow-lg transition-all active:scale-95"
          title="Visit Office Espresso Bar"
        >
          <span>☕</span>
          <span className="hidden sm:inline">Espresso Bar</span>
        </button>

        <button
          onClick={handleWaterCoolerClick}
          className="pointer-events-auto flex items-center gap-1.5 px-3 py-1.5 bg-[#181524]/90 backdrop-blur-md hover:bg-cyan-950/80 border border-cyan-500/40 text-cyan-200 text-xs font-cozy rounded-2xl shadow-lg transition-all active:scale-95"
          title="Drink Water at Office Cooler"
        >
          <span>💧</span>
          <span className="hidden sm:inline">Water Cooler</span>
        </button>

        <button
          onClick={handlePrinterStationClick}
          className="pointer-events-auto flex items-center gap-1.5 px-3 py-1.5 bg-[#181524]/90 backdrop-blur-md hover:bg-blue-950/80 border border-blue-500/40 text-blue-200 text-xs font-cozy rounded-2xl shadow-lg transition-all active:scale-95"
          title="Print Tasks at Multi-Function Copier"
        >
          <span>🖨️</span>
          <span className="hidden sm:inline">Copier Hub</span>
        </button>

        {onOpenBookshelf && (
          <button
            onClick={onOpenBookshelf}
            className="pointer-events-auto flex items-center gap-1.5 px-3 py-1.5 bg-[#181524]/90 backdrop-blur-md hover:bg-amber-900/80 border border-amber-500/40 text-amber-200 text-xs font-cozy rounded-2xl shadow-lg transition-all active:scale-95"
            title="Browse Gutenberg Bookshelf & Classics"
          >
            <span>📚</span>
            <span className="hidden sm:inline">Bookshelf</span>
          </button>
        )}

        {onOpenBreakGames && (
          <button
            onClick={onOpenBreakGames}
            className="pointer-events-auto flex items-center gap-1.5 px-3 py-1.5 bg-[#181524]/90 backdrop-blur-md hover:bg-purple-900/80 border border-purple-500/40 text-purple-200 text-xs font-cozy rounded-2xl shadow-lg transition-all active:scale-95"
            title="Play Paper Toss Basketball or Break Mini-Games"
          >
            <span>🏀</span>
            <span className="hidden sm:inline">Break Games</span>
          </button>
        )}
      </div>

      {/* 5. Bottom Movement Guide & Interaction Controls */}
      <div className="absolute bottom-4 left-4 right-4 flex items-center justify-between pointer-events-none">
        {/* WASD Walking & Interaction Tips */}
        <div className="bg-[#181524]/90 backdrop-blur-md px-3 py-1.5 rounded-2xl border border-purple-500/40 shadow-lg text-[11px] font-cozy text-purple-200 flex items-center gap-3 pointer-events-auto">
          <div className="flex items-center gap-1">
            <span className="bg-purple-900/80 px-1.5 py-0.5 rounded-md border border-purple-700/50 font-mono text-[10px] text-white">
              WASD / Arrows
            </span>
            <span>Walk office floor</span>
          </div>
          <span className="text-purple-600">•</span>
          <div className="flex items-center gap-1">
            <span className="bg-purple-900/80 px-1.5 py-0.5 rounded-md border border-purple-700/50 font-mono text-[10px] text-white">
              E
            </span>
            <span>Sit / Stand</span>
          </div>
        </div>

        {/* Sit Down at Workstation & Action Buttons */}
        <div className="flex items-center gap-2 pointer-events-auto">
          {!isSittingAtDesk && (
            <button
              onClick={handleReturnToDesk}
              className="flex items-center gap-1.5 px-3.5 py-2 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white rounded-2xl text-xs font-cozy font-bold shadow-xl animate-pulse transition-all active:scale-95"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Sit at My Workstation</span>
            </button>
          )}

          {/* Quick Reaction Tray */}
          <div className="flex items-center gap-1 bg-[#181524]/90 backdrop-blur-md p-1.5 rounded-2xl border border-purple-500/40 shadow-lg">
            {['☕', '👏', '💖', '🔥', '✨', '🎯'].map((emoji) => (
              <button
                key={emoji}
                onClick={() => {
                  soundEngine.playCoin();
                  setQuickUserReaction(emoji);
                  if (quickReactionTimerRef.current) {
                    window.clearTimeout(quickReactionTimerRef.current);
                  }
                  quickReactionTimerRef.current = window.setTimeout(() => {
                    setQuickUserReaction(null);
                  }, 4000);

                  onSendReaction(emoji);
                  if (userAvatarInstanceRef.current) {
                    userAvatarInstanceRef.current.updateNametag(userPeer.name, userPeer.currentTask, emoji);
                  }
                  confetti({ particleCount: 20, spread: 40 });
                }}
                className="w-7 h-7 rounded-xl hover:bg-purple-800/60 flex items-center justify-center text-sm transition-transform hover:scale-125 active:scale-90"
              >
                {emoji}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* 6. Interactive Office Station Modals */}
      <EspressoBarModal
        isOpen={isEspressoOpen}
        onClose={() => setIsEspressoOpen(false)}
        tickets={tickets}
        onBrewDrink={(drinkName, icon, focusBonus, cost) => {
          showOfficeNotice(`☕ Enjoying fresh ${drinkName}! (-${cost} 🎟️, +${focusBonus}% Focus)`);
          onSendReaction(icon);
          if (onAddTickets) onAddTickets(-cost);
        }}
        onSendRoundToRoom={(drinkName, cost) => {
          showOfficeNotice(`☕ You sent a round of ${drinkName} to everyone in the room! (-${cost} 🎟️)`);
          onSendReaction('☕');
          if (onAddTickets) onAddTickets(-cost);
          peers.forEach((p) => onSendCoffee(p.id));
        }}
      />

      {/* 7. Desk Workstation Computer OS Terminal (When zoomed in via Desk Cam) */}
      <DeskWorkstationOverlay
        isOpen={cameraMode === 'desk'}
        onClose={() => setCameraMode('isometric')}
        desk={userPeer.desk}
        avatar={userPeer.avatar}
        onUpdateDesk={(newDesk) => {
          if (onUpdateDesk) onUpdateDesk(newDesk);
          showOfficeNotice(`✨ Updated workstation aesthetic: ${newDesk.deskStyle}`);
        }}
        tickets={tickets}
        onAddTickets={(amount) => {
          if (onAddTickets) onAddTickets(amount);
        }}
        focusMinutesToday={focusMinutesToday}
        streakDays={streakDays}
        currentTask={userPeer.currentTask || ''}
      />

      {/* 8. Proximity Interaction HUD Banner (When near stations or peer desks) */}
      {activeTrigger && (
        <div
          onClick={activeTrigger.action}
          className="absolute bottom-16 left-1/2 -translate-x-1/2 z-30 flex items-center gap-2.5 px-4 py-2 bg-[#18122c]/95 border-2 border-amber-400 rounded-2xl shadow-[0_8px_30px_rgba(245,158,11,0.5)] backdrop-blur-md cursor-pointer hover:scale-105 active:scale-95 transition-all select-none animate-bounce"
        >
          <span className="bg-amber-400 text-purple-950 font-mono font-black text-xs px-2 py-0.5 rounded-md shadow-sm">
            Press [E]
          </span>
          <span className="text-xs font-cozy font-bold text-white flex items-center gap-1.5">
            <span>{activeTrigger.icon}</span>
            <span>{activeTrigger.label}</span>
          </span>
        </div>
      )}

      {/* 9. Crisp Vector Overlay Nametags (Player always visible; Peers reveal on hover/proximity) */}
      {cameraMode !== 'desk' && (
        <div className="absolute inset-0 pointer-events-none overflow-hidden z-20">
          {overlayNametags.map((tag) => {
            if (!tag.visible || tag.x < -100 || tag.x > 2500 || tag.y < -100 || tag.y > 2500) return null;

            const isPeerHovered = !tag.isUser && (hoveredPeerId === tag.id || activeTrigger?.id === tag.id);

            return (
              <div
                key={tag.id}
                style={{
                  left: `${tag.x}px`,
                  top: `${tag.y}px`,
                  transform: 'translate(-50%, -100%)',
                }}
                className="absolute flex flex-col items-center gap-1 select-none pointer-events-auto"
                onMouseEnter={() => !tag.isUser && setHoveredPeerId(tag.id)}
                onMouseLeave={() => !tag.isUser && setHoveredPeerId(null)}
              >
                {/* 1. Player's Nametag (Always 100% visible) */}
                {tag.isUser && (
                  <>
                    {(tag.reaction || quickUserReaction) && (
                      <div className="relative -mb-1 bg-gradient-to-r from-amber-400 via-amber-300 to-yellow-300 text-purple-950 px-3 py-1 rounded-2xl shadow-[0_6px_20px_rgba(245,158,11,0.6)] border-2 border-white text-base animate-bounce font-extrabold flex items-center justify-center gap-1 z-30 transition-transform">
                        <span className="text-xl leading-none">{tag.reaction || quickUserReaction}</span>
                        <div className="absolute -bottom-1.5 left-1/2 -translate-x-1/2 w-2.5 h-2.5 bg-amber-300 rotate-45 border-r-2 border-b-2 border-white" />
                      </div>
                    )}
                    <div
                      className="flex items-center gap-1.5 px-2.5 py-0.5 rounded-xl shadow-[0_4px_14px_rgba(0,0,0,0.6)] backdrop-blur-md border border-purple-300 text-xs font-cozy bg-gradient-to-r from-purple-900/95 to-indigo-900/95 text-white ring-1 ring-purple-300/80 cursor-default"
                      title="Your Workstation Station"
                    >
                      <span className="w-2 h-2 rounded-full inline-block bg-emerald-400 animate-pulse" />
                      <span className="font-bold tracking-wide drop-shadow-sm whitespace-nowrap">{tag.name}</span>
                      <span className="text-[9px] bg-purple-600 text-purple-100 px-1.5 py-0.2 rounded-md font-semibold">
                        YOU
                      </span>
                    </div>
                    {tag.task && (
                      <div className="text-[10px] bg-[#120e22]/90 backdrop-blur-sm text-purple-200 border border-purple-700/60 px-2 py-0.5 rounded-lg max-w-[140px] truncate shadow-md font-cozy">
                        ⚡ {tag.task}
                      </div>
                    )}
                  </>
                )}

                {/* 2. Peer Nametag: Hover / Proximity Expanded Card */}
                {!tag.isUser && isPeerHovered && (
                  <div
                    onClick={() => {
                      const foundPeer = peers.find((p) => p.id === tag.id);
                      if (foundPeer && onSelectPeer) {
                        onSelectPeer(foundPeer);
                      } else {
                        onSendHighFive(tag.id);
                        soundEngine.playCoin();
                        confetti({ particleCount: 15, spread: 35 });
                        showOfficeNotice(`Gave high-five to ${tag.name}! 👏`);
                      }
                    }}
                    className="flex flex-col items-center gap-1 bg-[#18122c]/95 border-2 border-amber-400/90 rounded-2xl p-1.5 shadow-[0_8px_25px_rgba(0,0,0,0.8)] backdrop-blur-md cursor-pointer transition-all scale-105 animate-in fade-in zoom-in-95 duration-150"
                  >
                    {tag.reaction && (
                      <div className="bg-white/95 text-slate-900 px-2 py-0.5 rounded-full shadow-lg border border-purple-400/60 text-sm animate-bounce font-bold">
                        {tag.reaction}
                      </div>
                    )}
                    <div className="flex items-center gap-1.5 px-2 py-0.5 text-xs font-cozy">
                      <span className={`w-2 h-2 rounded-full ${tag.isOnline ? 'bg-emerald-400 shadow-[0_0_8px_#34d399]' : 'bg-slate-500'}`} />
                      <span className="font-bold text-white whitespace-nowrap">{tag.name}</span>
                      <span className="text-[10px] bg-purple-900/80 text-amber-300 px-1.5 py-0.5 rounded-md border border-purple-700/50">
                        💬 Add / PM
                      </span>
                    </div>
                    {tag.task && (
                      <div className="text-[10px] bg-[#120e22]/95 text-purple-200 border border-purple-700/60 px-2 py-0.5 rounded-lg max-w-[150px] truncate shadow-md font-cozy">
                        ⚡ {tag.task}
                      </div>
                    )}
                  </div>
                )}

                {/* 3. Peer Nametag: Unhovered - Invisible hover target over avatar & desk */}
                {!tag.isUser && !isPeerHovered && (
                  <div
                    style={{
                      position: 'absolute',
                      top: '0px',
                      left: '50%',
                      transform: 'translate(-50%, 0)',
                      width: '84px',
                      height: '100px',
                    }}
                    className="cursor-pointer pointer-events-auto"
                    onMouseEnter={() => setHoveredPeerId(tag.id)}
                    onClick={() => setHoveredPeerId(tag.id)}
                    title={`Hover or click to view ${tag.name}`}
                  />
                )}
              </div>
            );
          })}
        </div>
      )}

      <WaterCoolerModal
        isOpen={isWaterCoolerOpen}
        onClose={() => setIsWaterCoolerOpen(false)}
        onDrinkWater={(glasses) => {
          showOfficeNotice(`💧 Crisp water logged! (${glasses}/8 glasses today)`);
          onSendReaction('✨');
          if (onAddTickets) onAddTickets(3);
        }}
        onPostMemo={(memoText) => {
          showOfficeNotice('📝 Sticky note placed on the water cooler!');
          onSendReaction('💬');
        }}
      />

      <CopierHubModal
        isOpen={isCopierOpen}
        onClose={() => setIsCopierOpen(false)}
        tasks={tasks}
        timeBlocks={timeBlocks}
        onPrintDeskPoster={(posterName) => {
          showOfficeNotice(`🖨️ Printed "${posterName}" desk sticker!`);
          onSendReaction('📑');
          if (onAddTickets) onAddTickets(5);
        }}
      />

      <SprintBoardModal
        isOpen={isSprintBoardOpen}
        onClose={() => setIsSprintBoardOpen(false)}
        tasks={tasks}
        onAddTask={(title, category, pomodoros) => {
          if (onAddTask) {
            onAddTask(title, category, pomodoros);
          }
          showOfficeNotice(`📋 Added sprint card: ${title}`);
        }}
        onToggleTask={(id) => {
          if (onToggleTask) onToggleTask(id);
        }}
        onDeleteTask={(id) => {
          if (onDeleteTask) onDeleteTask(id);
        }}
      />
    </div>
  );
};

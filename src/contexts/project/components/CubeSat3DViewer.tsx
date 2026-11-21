import React, { useRef, useEffect, useState, useCallback } from 'react';
import * as THREE from 'three';
import {
  RotateCw,
  Layers,
  Eye,
  Maximize2,
  Minimize2,
  ZoomIn,
  ZoomOut,
  Play,
  Pause,
  Box,
  Cpu,
  Atom,
  FlaskConical,
  Dna,
  Sun,
  Shield,
  Radio,
  Sparkles,
  Info,
  CheckCircle2,
  Sliders,
} from 'lucide-react';
import {
  CubeSatMissionPassport,
  ScienceDiscipline,
  CubeSatBlueprint,
} from '@/src/shared/types/index';
import { audioService } from '@/src/shared/lib/audioService';

interface CubeSat3DViewerProps {
  passport: CubeSatMissionPassport;
  activeBlueprintId?: string | null;
  onSelectBlueprint?: (blueprintId: string) => void;
  className?: string;
}

export const CubeSat3DViewer: React.FC<CubeSat3DViewerProps> = ({
  passport,
  activeBlueprintId,
  onSelectBlueprint,
  className = '',
}) => {
  const mountRef = useRef<HTMLDivElement>(null);
  const sceneRef = useRef<THREE.Scene | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const animFrameIdRef = useRef<number | null>(null);

  // Groups and anim targets
  const rootGroupRef = useRef<THREE.Group | null>(null);
  const explodedPartsRef = useRef<
    {
      mesh: THREE.Object3D;
      origPos: THREE.Vector3;
      explodedPos: THREE.Vector3;
      id: string;
      title: string;
      discipline?: ScienceDiscipline;
      type: string;
    }[]
  >([]);
  const solarWingsRef = useRef<{
    leftWing: THREE.Group | null;
    rightWing: THREE.Group | null;
  }>({ leftWing: null, rightWing: null });

  // UI state
  const [isRotating, setIsRotating] = useState(true);
  const [viewMode, setViewMode] = useState<'solid' | 'xray' | 'wireframe'>('solid');
  const [explodedFactor, setExplodedFactor] = useState(0); // 0 = assembled, 1 = exploded
  const [areSolarPanelsDeployed, setAreSolarPanelsDeployed] = useState(true);
  const [hoveredPart, setHoveredPart] = useState<{
    id: string;
    title: string;
    discipline?: string;
    type: string;
  } | null>(null);
  const [selectedPart, setSelectedPart] = useState<{
    id: string;
    title: string;
    discipline?: string;
    type: string;
  } | null>(null);
  const [cameraPreset, setCameraPreset] = useState<'iso' | 'front' | 'top' | 'payload'>('iso');
  const [isFullscreen, setIsFullscreen] = useState(false);

  // Spherical camera orbit state
  const orbitRef = useRef({
    isDragging: false,
    prevX: 0,
    prevY: 0,
    theta: Math.PI / 4,
    phi: Math.PI / 3,
    radius: 7.5,
    target: new THREE.Vector3(0, 0, 0),
  });

  // Calculate format multipliers based on 1U, 2U, 3U, 6U
  const format = passport.cubesatFormat || '3U';
  const unitLength = 1.0; // 100mm normalized
  const heightUnits = format === '1U' ? 1.0 : format === '2U' ? 2.0 : format === '3U' ? 3.4 : 3.4;
  const widthUnits = format === '6U' ? 2.0 : 1.0;
  const depthUnits = 1.0;

  // Initialize and build 3D Scene
  useEffect(() => {
    const container = mountRef.current;
    if (!container) return;

    const width = container.clientWidth || 600;
    const height = container.clientHeight || 420;

    // 1. Scene
    const scene = new THREE.Scene();
    sceneRef.current = scene;

    // Deep cosmic background with subtle gradient
    scene.background = new THREE.Color(0x060913);
    scene.fog = new THREE.FogExp2(0x060913, 0.035);

    // 2. Camera
    const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 100);
    cameraRef.current = camera;
    updateCameraPosition();

    // 3. Renderer with antialiasing
    const renderer = new THREE.WebGLRenderer({
      antialias: true,
      alpha: true,
      powerPreference: 'high-performance',
    });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    rendererRef.current = renderer;

    container.innerHTML = '';
    container.appendChild(renderer.domElement);

    // 4. Lights
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.85);
    scene.add(ambientLight);

    // Solar light (Warm sun from upper orbit)
    const sunLight = new THREE.DirectionalLight(0xfffaed, 2.2);
    sunLight.position.set(6, 9, 7);
    sunLight.castShadow = true;
    scene.add(sunLight);

    // Earth albedo light (Bluish reflection from beneath)
    const earthAlbedo = new THREE.DirectionalLight(0x38bdf8, 1.1);
    earthAlbedo.position.set(-5, -6, -4);
    scene.add(earthAlbedo);

    // Secondary rim light for technical edge highlighting
    const rimLight = new THREE.PointLight(0x818cf8, 1.4, 25);
    rimLight.position.set(0, 5, -6);
    scene.add(rimLight);

    // 5. Starfield & Orbital Reference Grid
    buildOrbitalEnvironment(scene);

    // 6. Build the dynamic CubeSat model
    const rootGroup = new THREE.Group();
    rootGroupRef.current = rootGroup;
    scene.add(rootGroup);

    buildDynamicCubeSat(rootGroup);

    // 7. Raycaster for interactive hover/selection
    const raycaster = new THREE.Raycaster();
    const mouse = new THREE.Vector2();

    const handlePointerMove = (e: MouseEvent) => {
      const rect = renderer.domElement.getBoundingClientRect();
      mouse.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      mouse.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;

      raycaster.setFromCamera(mouse, camera);
      const intersects = raycaster.intersectObjects(rootGroup.children, true);

      if (intersects.length > 0) {
        let obj: THREE.Object3D | null = intersects[0].object;
        while (obj && !obj.userData?.partInfo && obj.parent !== rootGroup) {
          obj = obj.parent;
        }
        if (obj && obj.userData?.partInfo) {
          setHoveredPart(obj.userData.partInfo);
          return;
        }
      }
      setHoveredPart(null);
    };

    const handlePointerDown = (e: MouseEvent) => {
      orbitRef.current.isDragging = true;
      orbitRef.current.prevX = e.clientX;
      orbitRef.current.prevY = e.clientY;
    };

    const handlePointerUp = (e: MouseEvent) => {
      orbitRef.current.isDragging = false;

      // Click detection if not dragged much
      const rect = renderer.domElement.getBoundingClientRect();
      mouse.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      mouse.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;
      raycaster.setFromCamera(mouse, camera);
      const intersects = raycaster.intersectObjects(rootGroup.children, true);

      if (intersects.length > 0) {
        let obj: THREE.Object3D | null = intersects[0].object;
        while (obj && !obj.userData?.partInfo && obj.parent !== rootGroup) {
          obj = obj.parent;
        }
        if (obj && obj.userData?.partInfo) {
          setSelectedPart(obj.userData.partInfo);
          if (onSelectBlueprint && obj.userData.partInfo.blueprintId) {
            onSelectBlueprint(obj.userData.partInfo.blueprintId);
          }
          audioService.playClickSound();
        }
      }
    };

    const handleWheel = (e: WheelEvent) => {
      e.preventDefault();
      orbitRef.current.radius = Math.min(
        14,
        Math.max(3.2, orbitRef.current.radius + e.deltaY * 0.006),
      );
      updateCameraPosition();
    };

    const dom = renderer.domElement;
    dom.addEventListener('mousemove', handlePointerMove);
    dom.addEventListener('mousedown', handlePointerDown);
    window.addEventListener('mouseup', handlePointerUp);
    dom.addEventListener('wheel', handleWheel, { passive: false });

    // Touch support for mobile devices
    let touchStartX = 0;
    let touchStartY = 0;
    const handleTouchStart = (e: TouchEvent) => {
      if (e.touches.length === 1) {
        orbitRef.current.isDragging = true;
        touchStartX = e.touches[0].clientX;
        touchStartY = e.touches[0].clientY;
      }
    };
    const handleTouchMove = (e: TouchEvent) => {
      if (orbitRef.current.isDragging && e.touches.length === 1) {
        const deltaX = e.touches[0].clientX - touchStartX;
        const deltaY = e.touches[0].clientY - touchStartY;
        touchStartX = e.touches[0].clientX;
        touchStartY = e.touches[0].clientY;

        orbitRef.current.theta -= deltaX * 0.008;
        orbitRef.current.phi = Math.max(
          0.1,
          Math.min(Math.PI - 0.1, orbitRef.current.phi - deltaY * 0.008),
        );
        updateCameraPosition();
      }
    };
    const handleTouchEnd = () => {
      orbitRef.current.isDragging = false;
    };

    dom.addEventListener('touchstart', handleTouchStart);
    dom.addEventListener('touchmove', handleTouchMove);
    dom.addEventListener('touchend', handleTouchEnd);

    // Resize observer
    const resizeObserver = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const { width: newWidth, height: newHeight } = entry.contentRect;
        if (newWidth > 0 && newHeight > 0) {
          camera.aspect = newWidth / newHeight;
          camera.updateProjectionMatrix();
          renderer.setSize(newWidth, newHeight);
        }
      }
    });
    resizeObserver.observe(container);

    // Animation Loop
    let lastTime = performance.now();
    const animate = (time: number) => {
      const delta = (time - lastTime) / 1000;
      lastTime = time;

      // Auto rotation
      if (isRotating && !orbitRef.current.isDragging) {
        orbitRef.current.theta += delta * 0.35;
        updateCameraPosition();
      }

      // Smooth exploded view interpolation
      if (explodedPartsRef.current.length > 0) {
        const t = explodedFactor;
        for (const part of explodedPartsRef.current) {
          part.mesh.position.lerpVectors(part.origPos, part.explodedPos, t);
        }
      }

      // Smooth solar wings deployment animation
      if (solarWingsRef.current.leftWing && solarWingsRef.current.rightWing) {
        const targetAngle = areSolarPanelsDeployed ? Math.PI * 0.48 : 0;
        solarWingsRef.current.leftWing.rotation.z = THREE.MathUtils.lerp(
          solarWingsRef.current.leftWing.rotation.z,
          -targetAngle,
          delta * 4.5,
        );
        solarWingsRef.current.rightWing.rotation.z = THREE.MathUtils.lerp(
          solarWingsRef.current.rightWing.rotation.z,
          targetAngle,
          delta * 4.5,
        );
      }

      renderer.render(scene, camera);
      animFrameIdRef.current = requestAnimationFrame(animate);
    };

    animFrameIdRef.current = requestAnimationFrame(animate);

    return () => {
      if (animFrameIdRef.current) cancelAnimationFrame(animFrameIdRef.current);
      resizeObserver.disconnect();
      dom.removeEventListener('mousemove', handlePointerMove);
      dom.removeEventListener('mousedown', handlePointerDown);
      window.removeEventListener('mouseup', handlePointerUp);
      dom.removeEventListener('wheel', handleWheel);
      dom.removeEventListener('touchstart', handleTouchStart);
      dom.removeEventListener('touchmove', handleTouchMove);
      dom.removeEventListener('touchend', handleTouchEnd);
      renderer.dispose();
      container.innerHTML = '';
    };
  }, [format, passport]);

  // Update camera position from spherical coords
  const updateCameraPosition = () => {
    if (!cameraRef.current) return;
    const { theta, phi, radius, target } = orbitRef.current;
    cameraRef.current.position.x = target.x + radius * Math.sin(phi) * Math.sin(theta);
    cameraRef.current.position.y = target.y + radius * Math.cos(phi);
    cameraRef.current.position.z = target.z + radius * Math.sin(phi) * Math.cos(theta);
    cameraRef.current.lookAt(target);
  };

  // Mouse move handler for orbit drag
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!orbitRef.current.isDragging) return;
      const deltaX = e.clientX - orbitRef.current.prevX;
      const deltaY = e.clientY - orbitRef.current.prevY;
      orbitRef.current.prevX = e.clientX;
      orbitRef.current.prevY = e.clientY;

      orbitRef.current.theta -= deltaX * 0.007;
      orbitRef.current.phi = Math.max(
        0.15,
        Math.min(Math.PI - 0.15, orbitRef.current.phi - deltaY * 0.007),
      );
      updateCameraPosition();
    };

    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, []);

  // Update materials when viewMode (solid / xray / wireframe) changes
  useEffect(() => {
    if (!rootGroupRef.current) return;

    rootGroupRef.current.traverse((child) => {
      if (child instanceof THREE.Mesh) {
        if (Array.isArray(child.material)) {
          child.material.forEach((mat) => applyMaterialMode(mat, viewMode));
        } else if (child.material) {
          applyMaterialMode(child.material, viewMode);
        }
      }
    });
  }, [viewMode]);

  const applyMaterialMode = (mat: THREE.Material, mode: 'solid' | 'xray' | 'wireframe') => {
    const anyMat = mat as any;
    if (mode === 'wireframe') {
      if ('wireframe' in anyMat) anyMat.wireframe = true;
      mat.transparent = false;
      mat.opacity = 1.0;
    } else if (mode === 'xray') {
      if ('wireframe' in anyMat) anyMat.wireframe = false;
      mat.transparent = true;
      mat.opacity = 0.35;
      mat.depthWrite = false;
    } else {
      if ('wireframe' in anyMat) anyMat.wireframe = false;
      mat.transparent = Boolean(anyMat.userData?.isGlass);
      mat.opacity = anyMat.userData?.isGlass ? 0.45 : 1.0;
      mat.depthWrite = true;
    }
  };

  // Camera presets
  const applyCameraPreset = (preset: 'iso' | 'front' | 'top' | 'payload') => {
    setCameraPreset(preset);
    setIsRotating(false);

    if (preset === 'iso') {
      orbitRef.current.theta = Math.PI / 4;
      orbitRef.current.phi = Math.PI / 3;
      orbitRef.current.radius = 7.5;
    } else if (preset === 'front') {
      orbitRef.current.theta = 0;
      orbitRef.current.phi = Math.PI / 2;
      orbitRef.current.radius = 6.5;
    } else if (preset === 'top') {
      orbitRef.current.theta = 0;
      orbitRef.current.phi = 0.2;
      orbitRef.current.radius = 6.0;
    } else if (preset === 'payload') {
      orbitRef.current.theta = Math.PI / 3;
      orbitRef.current.phi = Math.PI / 2.2;
      orbitRef.current.radius = 4.2;
    }
    updateCameraPosition();
    audioService.playClickSound();
  };

  // Build the complete dynamic CubeSat model
  const buildDynamicCubeSat = (rootGroup: THREE.Group) => {
    explodedPartsRef.current = [];

    // Materials Palette (Aerospace-grade PBR)
    const railMat = new THREE.MeshStandardMaterial({
      color: 0x272b38,
      metalness: 0.85,
      roughness: 0.25,
    });

    const bodyFrameMat = new THREE.MeshStandardMaterial({
      color: 0x1e2433,
      metalness: 0.7,
      roughness: 0.3,
    });

    const solarCellMat = new THREE.MeshStandardMaterial({
      color: 0x091b38,
      roughness: 0.15,
      metalness: 0.6,
      emissive: 0x031024,
    });

    const goldKaptonMat = new THREE.MeshStandardMaterial({
      color: 0xd97706,
      metalness: 0.9,
      roughness: 0.18,
      emissive: 0x451a03,
    });

    const pcbFr4Mat = new THREE.MeshStandardMaterial({
      color: 0x064e3b,
      metalness: 0.3,
      roughness: 0.4,
    });

    const copperCoilMat = new THREE.MeshStandardMaterial({
      color: 0xb45309,
      metalness: 0.95,
      roughness: 0.2,
    });

    const silverMetalMat = new THREE.MeshStandardMaterial({
      color: 0xe2e8f0,
      metalness: 0.95,
      roughness: 0.1,
    });

    const batteryLiFeMat = new THREE.MeshStandardMaterial({
      color: 0x059669,
      metalness: 0.6,
      roughness: 0.3,
    });

    const bioGlassMat = new THREE.MeshPhysicalMaterial({
      color: 0x10b981,
      metalness: 0.1,
      roughness: 0.1,
      transparent: true,
      opacity: 0.5,
      transmission: 0.9,
    });
    (bioGlassMat as any).userData = { isGlass: true };

    const halfH = heightUnits / 2;
    const halfW = widthUnits / 2;
    const halfD = depthUnits / 2;

    // ---------------------------------------------------------
    // 1. CHASSIS RAILS & CORNER STRUCTURE (Стандарт CalPoly)
    // ---------------------------------------------------------
    const chassisGroup = new THREE.Group();
    const chassisBp = passport.blueprints.find((b) => b.systemType === 'chassis');
    chassisGroup.userData = {
      partInfo: {
        id: 'chassis-sys',
        title: chassisBp?.title || `Несущая ферма и 4 направляющих рельса ${format}`,
        discipline: 'Инженерия и материаловедение',
        type: 'Силовой каркас (АМг6 / В95ОЧТ2)',
        blueprintId: chassisBp?.id,
      },
    };

    const railThickness = 0.06;
    const railCornerPos = [
      [-halfW, -halfD],
      [halfW, -halfD],
      [-halfW, halfD],
      [halfW, halfD],
    ];

    railCornerPos.forEach(([rx, rz]) => {
      // Main rail column
      const railGeo = new THREE.BoxGeometry(railThickness, heightUnits + 0.12, railThickness);
      const railMesh = new THREE.Mesh(railGeo, railMat);
      railMesh.position.set(rx, 0, rz);
      railMesh.castShadow = true;
      chassisGroup.add(railMesh);

      // Deployment standoff foot
      const footGeo = new THREE.CylinderGeometry(0.04, 0.04, 0.08, 12);
      const footTop = new THREE.Mesh(footGeo, silverMetalMat);
      footTop.position.set(rx, halfH + 0.08, rz);
      chassisGroup.add(footTop);

      const footBottom = new THREE.Mesh(footGeo, silverMetalMat);
      footBottom.position.set(rx, -halfH - 0.08, rz);
      chassisGroup.add(footBottom);
    });

    // Skeletal cross ribs
    const ribsCount = format === '1U' ? 2 : format === '2U' ? 3 : 4;
    for (let i = 0; i <= ribsCount; i++) {
      const y = -halfH + (heightUnits / ribsCount) * i;
      const frameGeo = new THREE.BoxGeometry(widthUnits + 0.02, 0.03, depthUnits + 0.02);
      const ribMesh = new THREE.Mesh(frameGeo, bodyFrameMat);
      ribMesh.position.set(0, y, 0);
      chassisGroup.add(ribMesh);
    }

    rootGroup.add(chassisGroup);
    explodedPartsRef.current.push({
      mesh: chassisGroup,
      origPos: new THREE.Vector3(0, 0, 0),
      explodedPos: new THREE.Vector3(0, 0, 0),
      id: 'chassis-sys',
      title: `Каркас ${format}`,
      type: 'Каркас',
    });

    // ---------------------------------------------------------
    // 2. INTERNAL PC-104 STACK (EPS, OBC, ADCS, Radio)
    // ---------------------------------------------------------
    const pcStackGroup = new THREE.Group();
    pcStackGroup.userData = {
      partInfo: {
        id: 'pc104-stack',
        title: 'Бортовой вычислительный комплекс PC-104 (ADCS, EPS, OBC, UHF)',
        discipline: 'Электроника и Физика управления',
        type: 'Стек микропроцессорных плат',
      },
    };

    const boardLevels = [
      { name: 'OBC (Бортовой компьютер ARM Cortex-M7)', y: -0.4, color: 0x064e3b },
      { name: 'EPS (Система распределения электропитания)', y: -0.15, color: 0x1e3a8a },
      { name: 'ADCS (Ориентация и стабилизация)', y: 0.1, color: 0x701a75 },
      { name: 'Radio TRX (Радиомодем 437.25 МГц)', y: 0.35, color: 0x0f172a },
    ];

    boardLevels.forEach((board) => {
      const pcbGeo = new THREE.BoxGeometry(0.82, 0.025, 0.82);
      const bMat = new THREE.MeshStandardMaterial({
        color: board.color,
        roughness: 0.3,
        metalness: 0.4,
      });
      const pcb = new THREE.Mesh(pcbGeo, bMat);
      pcb.position.set(0, board.y, 0);
      pcb.castShadow = true;
      pcStackGroup.add(pcb);

      // Microchips and shield cans on board
      const chipGeo = new THREE.BoxGeometry(0.22, 0.035, 0.22);
      const chip = new THREE.Mesh(chipGeo, silverMetalMat);
      chip.position.set(0.18, board.y + 0.03, 0.18);
      pcStackGroup.add(chip);

      // Capacitors / components
      const capGeo = new THREE.CylinderGeometry(0.04, 0.04, 0.06, 8);
      const cap = new THREE.Mesh(capGeo, copperCoilMat);
      cap.position.set(-0.25, board.y + 0.04, -0.2);
      pcStackGroup.add(cap);
    });

    // 4 Corner connector standoffs for PC-104 bus
    const busPins = [
      [-0.38, -0.38],
      [0.38, -0.38],
      [-0.38, 0.38],
      [0.38, 0.38],
    ];
    busPins.forEach(([bx, bz]) => {
      const pinGeo = new THREE.CylinderGeometry(0.015, 0.015, 1.0, 8);
      const pinMesh = new THREE.Mesh(pinGeo, silverMetalMat);
      pinMesh.position.set(bx, 0, bz);
      pcStackGroup.add(pinMesh);
    });

    rootGroup.add(pcStackGroup);
    explodedPartsRef.current.push({
      mesh: pcStackGroup,
      origPos: new THREE.Vector3(0, 0, 0),
      explodedPos: new THREE.Vector3(0, 0.7, 0), // slides up when exploded
      id: 'pc104-stack',
      title: 'Стек электроники PC-104',
      type: 'Электроника',
    });

    // ---------------------------------------------------------
    // 3. SCIENTIFIC PAYLOAD (Physics Sensor, Chem Battery, Bio Capsule)
    // ---------------------------------------------------------
    const payloadGroup = new THREE.Group();
    const payloadBp =
      passport.blueprints.find((b) => b.systemType === 'payload_sensor') || passport.blueprints[0];
    payloadGroup.userData = {
      partInfo: {
        id: 'scientific-payload',
        title: payloadBp?.title || 'Научная полезная нагрузка экипажа',
        discipline: payloadBp?.disciplineLabel || 'Физика (Аэрономия и Датчики)',
        type: 'Научный модуль',
        blueprintId: payloadBp?.id,
      },
    };

    // 3A. Chemistry / Power: Battery Block (LiFePO4)
    const batteryGroup = new THREE.Group();
    const batteryBp = passport.blueprints.find((b) => b.systemType === 'battery_pack');
    batteryGroup.userData = {
      partInfo: {
        id: 'battery-subsystem',
        title: batteryBp?.title || 'Батарейный блок LiFePO4 и EPS',
        discipline: 'Химия (Электрохимия аккумуляторов)',
        type: 'Энергетический накопитель',
        blueprintId: batteryBp?.id,
      },
    };

    const cellRadius = 0.08;
    const cellHeight = 0.55;
    const cellPositions = [
      [-0.18, -0.18],
      [0.18, -0.18],
      [-0.18, 0.18],
      [0.18, 0.18],
    ];
    cellPositions.forEach(([cx, cz]) => {
      const cellGeo = new THREE.CylinderGeometry(cellRadius, cellRadius, cellHeight, 16);
      const cell = new THREE.Mesh(cellGeo, batteryLiFeMat);
      cell.position.set(cx, -halfH + 0.45, cz);
      batteryGroup.add(cell);

      // Gold terminal contact
      const termGeo = new THREE.CylinderGeometry(0.03, 0.03, 0.02, 12);
      const term = new THREE.Mesh(termGeo, goldKaptonMat);
      term.position.set(cx, -halfH + 0.45 + cellHeight / 2 + 0.01, cz);
      batteryGroup.add(term);
    });

    rootGroup.add(batteryGroup);
    explodedPartsRef.current.push({
      mesh: batteryGroup,
      origPos: new THREE.Vector3(0, 0, 0),
      explodedPos: new THREE.Vector3(0, -1.2, 0), // slides down when exploded
      id: 'battery-subsystem',
      title: 'Блок аккумуляторов LiFePO4',
      type: 'Химия / EPS',
    });

    // 3B. Physics Scientific Sensor: 3-Axis Accelerometer / Aerodynamic Probe
    const probeGeo = new THREE.CylinderGeometry(0.18, 0.22, 0.35, 24);
    const probeMesh = new THREE.Mesh(probeGeo, silverMetalMat);
    probeMesh.position.set(0, halfH - 0.3, 0);
    payloadGroup.add(probeMesh);

    // Sensor lens / diaphragm
    const lensGeo = new THREE.CylinderGeometry(0.12, 0.12, 0.05, 24);
    const lensMesh = new THREE.Mesh(lensGeo, solarCellMat);
    lensMesh.position.set(0, halfH - 0.11, 0);
    payloadGroup.add(lensMesh);

    // Magnetorquer orthogonal coil rings (Физика магнитного поля)
    const coilToroidGeo = new THREE.TorusGeometry(0.32, 0.035, 12, 28);
    const coil1 = new THREE.Mesh(coilToroidGeo, copperCoilMat);
    coil1.rotation.x = Math.PI / 2;
    coil1.position.set(0, halfH - 0.45, 0);
    payloadGroup.add(coil1);

    // Bio-capsule chamber (if biology discipline covered)
    if (passport.disciplinesCovered?.includes('biology')) {
      const bioGeo = new THREE.SphereGeometry(0.14, 16, 16);
      const bioMesh = new THREE.Mesh(bioGeo, bioGlassMat);
      bioMesh.position.set(0.22, halfH - 0.3, 0.22);
      payloadGroup.add(bioMesh);

      // Micro LED biological backlight
      const bioLed = new THREE.PointLight(0x10b981, 1.2, 0.8);
      bioLed.position.set(0.22, halfH - 0.3, 0.22);
      payloadGroup.add(bioLed);
    }

    rootGroup.add(payloadGroup);
    explodedPartsRef.current.push({
      mesh: payloadGroup,
      origPos: new THREE.Vector3(0, 0, 0),
      explodedPos: new THREE.Vector3(0, 1.5, 0), // slides up when exploded
      id: 'scientific-payload',
      title: 'Научная полезная нагрузка',
      type: 'Физика / Биология',
    });

    // ---------------------------------------------------------
    // 4. BODY-MOUNTED SOLAR PANELS (Боковые грани)
    // ---------------------------------------------------------
    const bodySolarGroup = new THREE.Group();
    bodySolarGroup.userData = {
      partInfo: {
        id: 'body-solar',
        title: 'Корпусные фотоэлектрические панели (GaAs каскадные СБ)',
        discipline: 'Физика полупроводников и фотоэффекта',
        type: 'Корпусные панели',
      },
    };

    // Front and Back solar covers
    const panelThickness = 0.02;
    const faceW = widthUnits - 0.12;
    const faceH = heightUnits - 0.15;

    // +Z Face
    const pFront = new THREE.Mesh(
      new THREE.BoxGeometry(faceW, faceH, panelThickness),
      solarCellMat,
    );
    pFront.position.set(0, 0, halfD);
    bodySolarGroup.add(pFront);

    // -Z Face
    const pBack = new THREE.Mesh(new THREE.BoxGeometry(faceW, faceH, panelThickness), solarCellMat);
    pBack.position.set(0, 0, -halfD);
    bodySolarGroup.add(pBack);

    rootGroup.add(bodySolarGroup);
    explodedPartsRef.current.push({
      mesh: bodySolarGroup,
      origPos: new THREE.Vector3(0, 0, 0),
      explodedPos: new THREE.Vector3(0, 0, 0.8), // moves out in Z
      id: 'body-solar',
      title: 'Корпусные панели GaAs',
      type: 'Солнечные батареи',
    });

    // ---------------------------------------------------------
    // 5. DEPLOYABLE SOLAR WINGS (Раскрываемые крылья СБ)
    // ---------------------------------------------------------
    const wingW = 1.35;
    const wingH = Math.min(2.4, heightUnits - 0.3);
    const wingGeo = new THREE.BoxGeometry(wingW, wingH, 0.025);

    // Left Wing (hinge at -halfW)
    const leftWingGroup = new THREE.Group();
    leftWingGroup.position.set(-halfW, 0, 0);

    const leftWingMesh = new THREE.Mesh(wingGeo, solarCellMat);
    leftWingMesh.position.set(-wingW / 2, 0, 0); // origin at hinge
    leftWingMesh.castShadow = true;
    leftWingGroup.add(leftWingMesh);

    // Gold Kapton backside
    const leftBack = new THREE.Mesh(new THREE.BoxGeometry(wingW, wingH, 0.005), goldKaptonMat);
    leftBack.position.set(-wingW / 2, 0, -0.015);
    leftWingGroup.add(leftBack);

    // Right Wing (hinge at +halfW)
    const rightWingGroup = new THREE.Group();
    rightWingGroup.position.set(halfW, 0, 0);

    const rightWingMesh = new THREE.Mesh(wingGeo, solarCellMat);
    rightWingMesh.position.set(wingW / 2, 0, 0);
    rightWingMesh.castShadow = true;
    rightWingGroup.add(rightWingMesh);

    // Gold Kapton backside
    const rightBack = new THREE.Mesh(new THREE.BoxGeometry(wingW, wingH, 0.005), goldKaptonMat);
    rightBack.position.set(wingW / 2, 0, -0.015);
    rightWingGroup.add(rightBack);

    leftWingGroup.userData = {
      partInfo: {
        id: 'solar-wings',
        title: 'Раскрываемые крылья солнечных батарей (Энергобаланс в тени)',
        discipline: 'Физика (Фотоэффект и Термодинамика)',
        type: 'Раскрываемые панели',
      },
    };
    rightWingGroup.userData = leftWingGroup.userData;

    rootGroup.add(leftWingGroup);
    rootGroup.add(rightWingGroup);
    solarWingsRef.current = { leftWing: leftWingGroup, rightWing: rightWingGroup };

    explodedPartsRef.current.push({
      mesh: leftWingGroup,
      origPos: new THREE.Vector3(-halfW, 0, 0),
      explodedPos: new THREE.Vector3(-halfW - 0.8, 0, 0),
      id: 'solar-wing-left',
      title: 'Левое раскрываемое крыло СБ',
      type: 'Крыло СБ',
    });
    explodedPartsRef.current.push({
      mesh: rightWingGroup,
      origPos: new THREE.Vector3(halfW, 0, 0),
      explodedPos: new THREE.Vector3(halfW + 0.8, 0, 0),
      id: 'solar-wing-right',
      title: 'Правое раскрываемое крыло СБ',
      type: 'Крыло СБ',
    });

    // ---------------------------------------------------------
    // 6. DEPLOYABLE UHF/VHF TAPE ANTENNAS & SENSORS
    // ---------------------------------------------------------
    const antennaGroup = new THREE.Group();
    antennaGroup.userData = {
      partInfo: {
        id: 'antenna-array',
        title: 'Четвертьволновые ленточные антенны UHF 437.25 МГц',
        discipline: 'Электродинамика и Радиофизика',
        type: 'Антенная решетка',
      },
    };

    const antLength = 0.95;
    const antAngles = [0, Math.PI / 2, Math.PI, (Math.PI * 3) / 2];
    antAngles.forEach((ang) => {
      const antGeo = new THREE.CylinderGeometry(0.01, 0.01, antLength, 6);
      const ant = new THREE.Mesh(antGeo, copperCoilMat);
      ant.position.set(Math.cos(ang) * 0.45, -halfH - antLength / 2 - 0.05, Math.sin(ang) * 0.45);
      ant.rotation.z = Math.sin(ang) * 0.25;
      ant.rotation.x = Math.cos(ang) * 0.25;
      antennaGroup.add(ant);
    });

    rootGroup.add(antennaGroup);
    explodedPartsRef.current.push({
      mesh: antennaGroup,
      origPos: new THREE.Vector3(0, 0, 0),
      explodedPos: new THREE.Vector3(0, -1.8, 0),
      id: 'antenna-array',
      title: 'Антенный модуль связи',
      type: 'Радиосвязь',
    });
  };

  // Cosmic environment: Starfield particles and reference orbital grid
  const buildOrbitalEnvironment = (scene: THREE.Scene) => {
    // 1. Starfield
    const starsCount = 600;
    const starGeo = new THREE.BufferGeometry();
    const starPos = new Float32Array(starsCount * 3);
    for (let i = 0; i < starsCount * 3; i += 3) {
      starPos[i] = (Math.random() - 0.5) * 80;
      starPos[i + 1] = (Math.random() - 0.5) * 80;
      starPos[i + 2] = (Math.random() - 0.5) * 80;
    }
    starGeo.setAttribute('position', new THREE.BufferAttribute(starPos, 3));
    const starMat = new THREE.PointsMaterial({
      color: 0x94a3b8,
      size: 0.12,
      transparent: true,
      opacity: 0.7,
    });
    const starField = new THREE.Points(starGeo, starMat);
    scene.add(starField);

    // 2. Orbital coordinate grid plane at bottom
    const gridHelper = new THREE.GridHelper(10, 20, 0x312e81, 0x1e1b4b);
    gridHelper.position.y = -2.8;
    scene.add(gridHelper);

    // 3. Earth curvature horizon glow (semi-sphere)
    const earthGlowGeo = new THREE.RingGeometry(5.2, 5.25, 48);
    const earthGlowMat = new THREE.MeshBasicMaterial({
      color: 0x0284c7,
      side: THREE.DoubleSide,
      transparent: true,
      opacity: 0.25,
    });
    const earthRing = new THREE.Mesh(earthGlowGeo, earthGlowMat);
    earthRing.position.set(0, -2.8, 0);
    earthRing.rotation.x = Math.PI / 2;
    scene.add(earthRing);
  };

  const handleToggleFullscreen = () => {
    setIsFullscreen((prev) => !prev);
  };

  return (
    <div
      className={`relative bg-slate-950 border border-slate-800 rounded-2xl overflow-hidden shadow-2xl flex flex-col ${
        isFullscreen
          ? 'fixed inset-4 z-50 rounded-2xl border-indigo-500/50 shadow-2xl shadow-indigo-500/20'
          : className
      }`}
    >
      {/* Top HUD Toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-2 p-3 bg-slate-900/90 border-b border-slate-800 backdrop-blur z-10 text-xs">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-indigo-600/30 border border-indigo-500/40 flex items-center justify-center text-indigo-400">
            <Box className="w-4 h-4 animate-pulse" />
          </div>
          <div>
            <div className="font-bold text-white flex items-center gap-1.5">
              <span>3D-Модель: {passport.cubesatName}</span>
              <span className="px-1.5 py-0.2 rounded bg-indigo-500/20 text-indigo-300 text-[10px] font-mono">
                {passport.cubesatFormat} CalPoly
              </span>
            </div>
            <div className="text-[10px] text-slate-400 font-mono flex items-center gap-2">
              <span>H = {heightUnits * 100}мм</span>
              <span>·</span>
              <span>W = {widthUnits * 100}мм</span>
              <span>·</span>
              <span className="text-emerald-400">PBR WebGL</span>
            </div>
          </div>
        </div>

        {/* View Mode & Preset Controls */}
        <div className="flex items-center gap-1.5 flex-wrap">
          {/* Camera View Presets */}
          <div className="flex items-center bg-slate-950 p-0.5 rounded-lg border border-slate-800 text-[11px]">
            <button
              onClick={() => applyCameraPreset('iso')}
              className={`px-2 py-1 rounded transition-colors ${
                cameraPreset === 'iso'
                  ? 'bg-indigo-600 text-white font-semibold'
                  : 'text-slate-400 hover:text-white'
              }`}
              title="Изометрический вид"
            >
              Изометрия
            </button>
            <button
              onClick={() => applyCameraPreset('front')}
              className={`px-2 py-1 rounded transition-colors ${
                cameraPreset === 'front'
                  ? 'bg-indigo-600 text-white font-semibold'
                  : 'text-slate-400 hover:text-white'
              }`}
              title="Вид спереди"
            >
              Фронт
            </button>
            <button
              onClick={() => applyCameraPreset('top')}
              className={`px-2 py-1 rounded transition-colors ${
                cameraPreset === 'top'
                  ? 'bg-indigo-600 text-white font-semibold'
                  : 'text-slate-400 hover:text-white'
              }`}
              title="Вид сверху"
            >
              Сверху
            </button>
            <button
              onClick={() => applyCameraPreset('payload')}
              className={`px-2 py-1 rounded transition-colors ${
                cameraPreset === 'payload'
                  ? 'bg-indigo-600 text-white font-semibold'
                  : 'text-slate-400 hover:text-white'
              }`}
              title="Фокус на полезной нагрузке"
            >
              Нагрузка
            </button>
          </div>

          {/* Render Mode Switcher */}
          <div className="flex items-center bg-slate-950 p-0.5 rounded-lg border border-slate-800 text-[11px]">
            <button
              onClick={() => setViewMode('solid')}
              className={`px-2 py-1 rounded transition-colors ${
                viewMode === 'solid'
                  ? 'bg-indigo-600 text-white font-semibold'
                  : 'text-slate-400 hover:text-white'
              }`}
              title="Реалистичные материалы"
            >
              Solid
            </button>
            <button
              onClick={() => setViewMode('xray')}
              className={`px-2 py-1 rounded transition-colors ${
                viewMode === 'xray'
                  ? 'bg-indigo-600 text-white font-semibold'
                  : 'text-slate-400 hover:text-white'
              }`}
              title="Просвечивающий рентген каркаса"
            >
              Рентген
            </button>
            <button
              onClick={() => setViewMode('wireframe')}
              className={`px-2 py-1 rounded transition-colors ${
                viewMode === 'wireframe'
                  ? 'bg-indigo-600 text-white font-semibold'
                  : 'text-slate-400 hover:text-white'
              }`}
              title="Каркасная сетка (Wireframe)"
            >
              Сетка
            </button>
          </div>

          {/* Auto-Rotation Toggle */}
          <button
            onClick={() => setIsRotating(!isRotating)}
            className={`p-1.5 rounded-lg border transition-colors ${
              isRotating
                ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/40'
                : 'bg-slate-950 text-slate-400 border-slate-800 hover:text-white'
            }`}
            title={isRotating ? 'Остановить вращение' : 'Включить орбитальное вращение'}
          >
            {isRotating ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
          </button>

          {/* Solar Panels Deployment Toggle */}
          <button
            onClick={() => {
              setAreSolarPanelsDeployed(!areSolarPanelsDeployed);
              audioService.playClickSound();
            }}
            className={`px-2 py-1 rounded-lg border text-[11px] font-semibold flex items-center gap-1 transition-colors ${
              areSolarPanelsDeployed
                ? 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                : 'bg-slate-950 text-slate-400 border-slate-800 hover:text-white'
            }`}
            title="Раскрыть или сложить солнечные крылья"
          >
            <Sun className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">
              Крылья СБ: {areSolarPanelsDeployed ? 'Раскрыты' : 'Сложены'}
            </span>
          </button>

          {/* Fullscreen Toggle */}
          <button
            onClick={handleToggleFullscreen}
            className="p-1.5 rounded-lg bg-slate-950 border border-slate-800 text-slate-400 hover:text-white transition-colors"
            title={isFullscreen ? 'Свернуть' : 'Развернуть на весь экран'}
          >
            {isFullscreen ? (
              <Minimize2 className="w-3.5 h-3.5" />
            ) : (
              <Maximize2 className="w-3.5 h-3.5" />
            )}
          </button>
        </div>
      </div>

      {/* Main 3D Canvas Viewport */}
      <div className="relative flex-1 min-h-[360px] sm:min-h-[420px] w-full overflow-hidden cursor-grab active:cursor-grabbing">
        <div ref={mountRef} className="w-full h-full absolute inset-0" />

        {/* HUD Navigation Hints */}
        <div className="absolute top-3 left-3 pointer-events-none text-[10px] text-slate-400 font-mono space-y-0.5 bg-slate-950/70 p-2 rounded-lg border border-slate-800/80 backdrop-blur-sm hidden sm:block">
          <div>🖱️ ЛКМ: вращение 360°</div>
          <div>🔍 Колесико: зум</div>
          <div>👆 Клик: выбор модуля</div>
        </div>

        {/* Dynamic Part Hover/Selection HUD Card */}
        {(hoveredPart || selectedPart) && (
          <div className="absolute bottom-16 left-3 right-3 sm:right-auto sm:max-w-md bg-slate-950/90 border border-indigo-500/50 p-3 rounded-xl shadow-xl backdrop-blur-md text-xs space-y-1 animate-in fade-in duration-150">
            <div className="flex items-center justify-between">
              <span className="font-bold text-white flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
                <span>{(hoveredPart || selectedPart)?.title}</span>
              </span>
              <span className="text-[10px] px-1.5 py-0.5 rounded bg-indigo-500/20 text-indigo-300 font-mono">
                {(hoveredPart || selectedPart)?.type}
              </span>
            </div>
            <p className="text-[11px] text-slate-300">
              Научная дисциплина:{' '}
              <strong className="text-emerald-400">
                {(hoveredPart || selectedPart)?.discipline}
              </strong>
            </p>
          </div>
        )}

        {/* Exploded View Slider Floating Toolbar (Нижняя панель управления разборкой) */}
        <div className="absolute bottom-3 left-3 right-3 bg-slate-900/90 border border-slate-800/90 p-2.5 rounded-xl backdrop-blur flex items-center gap-3 text-xs shadow-lg">
          <div className="flex items-center gap-1.5 shrink-0 text-indigo-300 font-semibold text-[11px]">
            <Layers className="w-4 h-4 text-indigo-400" />
            <span>Взрыв-схема (Exploded View):</span>
          </div>

          <div className="flex-1 flex items-center gap-2">
            <button
              onClick={() => {
                setExplodedFactor(0);
                audioService.playClickSound();
              }}
              className={`px-2 py-0.5 rounded text-[10px] transition-colors ${
                explodedFactor === 0
                  ? 'bg-indigo-600 text-white font-bold'
                  : 'bg-slate-950 text-slate-400 hover:text-white'
              }`}
            >
              Собрать (0%)
            </button>

            <input
              type="range"
              min={0}
              max={1}
              step={0.01}
              value={explodedFactor}
              onChange={(e) => setExplodedFactor(parseFloat(e.target.value))}
              className="flex-1 accent-indigo-500 cursor-pointer h-1.5 bg-slate-950 rounded-lg"
              title="Развести подсистемы КубСата по слоям"
            />

            <button
              onClick={() => {
                setExplodedFactor(1);
                audioService.playClickSound();
              }}
              className={`px-2 py-0.5 rounded text-[10px] transition-colors ${
                explodedFactor === 1
                  ? 'bg-indigo-600 text-white font-bold'
                  : 'bg-slate-950 text-slate-400 hover:text-white'
              }`}
            >
              Разборка (100%)
            </button>
          </div>

          <span className="font-mono text-[11px] text-slate-400 w-10 text-right">
            {Math.round(explodedFactor * 100)}%
          </span>
        </div>
      </div>

      {/* Subsystem Telemetry Quick Badges */}
      <div className="p-3 bg-slate-900/95 border-t border-slate-800 grid grid-cols-2 sm:grid-cols-4 gap-2 text-[11px]">
        <div className="p-2 rounded-lg bg-slate-950 border border-slate-800/80 flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-indigo-500 animate-ping" />
          <div className="truncate">
            <div className="font-bold text-white">Ферма {format}</div>
            <div className="text-[10px] text-slate-400">7075-T6 анодирование</div>
          </div>
        </div>

        <div className="p-2 rounded-lg bg-slate-950 border border-slate-800/80 flex items-center gap-2">
          <Sun className="w-3.5 h-3.5 text-amber-400 shrink-0" />
          <div className="truncate">
            <div className="font-bold text-white">Фотоэлементы GaAs</div>
            <div className="text-[10px] text-slate-400">КПД 29.5% · 45 Вт·ч</div>
          </div>
        </div>

        <div className="p-2 rounded-lg bg-slate-950 border border-slate-800/80 flex items-center gap-2">
          <Cpu className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
          <div className="truncate">
            <div className="font-bold text-white">Стек PC-104</div>
            <div className="text-[10px] text-slate-400">ADCS + EPS + OBC</div>
          </div>
        </div>

        <div className="p-2 rounded-lg bg-slate-950 border border-slate-800/80 flex items-center gap-2">
          <Radio className="w-3.5 h-3.5 text-sky-400 shrink-0" />
          <div className="truncate">
            <div className="font-bold text-white">Антенны UHF</div>
            <div className="text-[10px] text-slate-400">437.25 МГц · 1 Вт</div>
          </div>
        </div>
      </div>
    </div>
  );
};

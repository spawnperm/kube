import React, { useEffect, useRef, useState, useCallback } from 'react';
import * as THREE from 'three';
import {
  RotateCcw,
  Sun,
  Compass,
  Zap,
  Play,
  CheckCircle2,
  Sparkles,
} from 'lucide-react';

export type CubeSatSubsystem = 'all' | 'eps' | 'adcs' | 'obc' | 'comm' | 'payload';

export interface CubeSatCoreViewerProps {
  wingsDeployed?: boolean;
  onToggleWings?: () => void;
  rotationSpeed?: number;
  highlightSubsystem?: CubeSatSubsystem;
  onSelectSubsystem?: (subsystem: CubeSatSubsystem) => void;
  competitionStageId?: string;
  deploymentTriggerKey?: number;
  className?: string;
}

const DEPLOY_DURATION_SEC = 2.4;

export const CubeSatCoreViewer: React.FC<CubeSatCoreViewerProps> = ({
  wingsDeployed: externalWingsDeployed,
  onToggleWings: externalToggleWings,
  rotationSpeed = 1,
  highlightSubsystem = 'all',
  onSelectSubsystem,
  competitionStageId,
  deploymentTriggerKey = 0,
  className = '',
}) => {
  const mountRef = useRef<HTMLDivElement | null>(null);
  const progressBarRef = useRef<HTMLDivElement | null>(null);
  const progressLabelRef = useRef<HTMLSpanElement | null>(null);

  const [internalWings, setInternalWings] = useState(
    competitionStageId === 'tasks_execution' ? true : false,
  );
  const [autoRotate, setAutoRotate] = useState(true);
  const [currentPreset, setCurrentPreset] = useState<'iso' | 'nadir' | 'sun'>('iso');
  const [deploymentPhase, setDeploymentPhase] = useState<'stowed' | 'deploying' | 'deployed'>(
    externalWingsDeployed || competitionStageId === 'tasks_execution' ? 'deploying' : 'stowed',
  );

  const wingsOpen =
    externalWingsDeployed !== undefined ? externalWingsDeployed : internalWings;
  const toggleWings =
    externalToggleWings || (() => setInternalWings((v) => !v));

  // Mutable refs for Three.js animation loop
  const sceneRef = useRef<THREE.Scene | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const satGroupRef = useRef<THREE.Group | null>(null);
  const mixerRef = useRef<THREE.AnimationMixer | null>(null);
  const deployActionRef = useRef<THREE.AnimationAction | null>(null);
  const solarWingMatRef = useRef<THREE.MeshStandardMaterial | null>(null);
  const hingeLedMatRef = useRef<THREE.MeshBasicMaterial | null>(null);
  const pcbMatRef = useRef<THREE.MeshStandardMaterial | null>(null);
  const antMatRef = useRef<THREE.MeshStandardMaterial | null>(null);
  const frameMatRef = useRef<THREE.MeshStandardMaterial | null>(null);
  const lensMatRef = useRef<THREE.MeshStandardMaterial | null>(null);

  const autoRotateRef = useRef(autoRotate);
  autoRotateRef.current = autoRotate;
  const rotationSpeedRef = useRef(rotationSpeed);
  rotationSpeedRef.current = rotationSpeed;
  const highlightSubsystemRef = useRef(highlightSubsystem);
  highlightSubsystemRef.current = highlightSubsystem;

  const isTasksStage = competitionStageId === 'tasks_execution';
  const prevStageIdRef = useRef<string | undefined>(competitionStageId);
  const prevTriggerKeyRef = useRef<number>(deploymentTriggerKey);
  const prevWingsOpenRef = useRef<boolean>(wingsOpen);
  const initialWingsOpenRef = useRef<boolean>(wingsOpen);
  const initialIsTasksStageRef = useRef<boolean>(isTasksStage);

  // Mouse interaction & smooth target rotation state
  const isDraggingRef = useRef(false);
  const previousMousePositionRef = useRef({ x: 0, y: 0 });
  const satRotationRef = useRef({ x: 0.35, y: -0.6 });
  const targetSatRotationRef = useRef({ x: 0.35, y: -0.6 });
  const targetCameraZRef = useRef(4.8);

  // Helper to launch Three.js AnimationMixer sequence from stowed -> deployed
  const playDeploymentFromStowed = useCallback(() => {
    const action = deployActionRef.current;
    if (!action) return;
    action.stop();
    action.reset();
    action.paused = false;
    action.timeScale = 1;
    action.play();
    setDeploymentPhase('deploying');

    // Frame the CubeSat nicely for the unfolding sequence
    targetSatRotationRef.current = { x: 0.32, y: -0.52 };
    targetCameraZRef.current = 4.9;
  }, []);

  // Procedural solar cell texture (sRGB)
  const createSolarTexture = useCallback(() => {
    const canvas = document.createElement('canvas');
    canvas.width = 512;
    canvas.height = 512;
    const ctx = canvas.getContext('2d');
    if (!ctx) return null;

    ctx.fillStyle = '#0f172a';
    ctx.fillRect(0, 0, 512, 512);

    const rows = 6;
    const cols = 2;
    const pad = 6;
    const w = (512 - pad * (cols + 1)) / cols;
    const h = (512 - pad * (rows + 1)) / rows;

    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        const x = pad + c * (w + pad);
        const y = pad + r * (h + pad);

        const grad = ctx.createLinearGradient(x, y, x + w, y + h);
        grad.addColorStop(0, '#1e1b4b');
        grad.addColorStop(0.5, '#0c2340');
        grad.addColorStop(1, '#081426');
        ctx.fillStyle = grad;
        ctx.fillRect(x, y, w, h);

        ctx.strokeStyle = 'rgba(56, 189, 248, 0.35)';
        ctx.lineWidth = 1;
        for (let gy = y + 8; gy < y + h; gy += 10) {
          ctx.beginPath();
          ctx.moveTo(x + 2, gy);
          ctx.lineTo(x + w - 2, gy);
          ctx.stroke();
        }

        ctx.strokeStyle = 'rgba(217, 249, 157, 0.72)';
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.moveTo(x + w / 2, y + 2);
        ctx.lineTo(x + w / 2, y + h - 2);
        ctx.stroke();
      }
    }

    const texture = new THREE.CanvasTexture(canvas);
    texture.colorSpace = THREE.SRGBColorSpace;
    texture.wrapS = THREE.RepeatWrapping;
    texture.wrapT = THREE.RepeatWrapping;
    return texture;
  }, []);

  // Build Three.js Scene & AnimationMixer
  useEffect(() => {
    const container = mountRef.current;
    if (!container) return;

    const width = container.clientWidth || 600;
    const height = container.clientHeight || 420;

    // 1. Scene
    const scene = new THREE.Scene();
    sceneRef.current = scene;
    scene.background = new THREE.Color(0x030712);

    // 2. Camera
    const camera = new THREE.PerspectiveCamera(40, width / height, 0.1, 100);
    camera.position.set(0, 0.85, targetCameraZRef.current);
    cameraRef.current = camera;

    // 3. Renderer
    const renderer = new THREE.WebGLRenderer({
      antialias: true,
      alpha: false,
      powerPreference: 'high-performance',
    });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.25;
    rendererRef.current = renderer;
    container.appendChild(renderer.domElement);

    // 4. Lights
    const sunLight = new THREE.DirectionalLight(0xfff5e6, 2.8);
    sunLight.position.set(4, 5, 4);
    scene.add(sunLight);

    const earthLight = new THREE.DirectionalLight(0x38bdf8, 1.3);
    earthLight.position.set(-3, -4, -2);
    scene.add(earthLight);

    const rimLight = new THREE.DirectionalLight(0x818cf8, 0.9);
    rimLight.position.set(0, 3, -5);
    scene.add(rimLight);

    const ambientLight = new THREE.AmbientLight(0x1e293b, 1.15);
    scene.add(ambientLight);

    // 5. Starfield Background
    const starGeo = new THREE.BufferGeometry();
    const starCount = 1200;
    const starPos = new Float32Array(starCount * 3);
    for (let i = 0; i < starCount * 3; i += 3) {
      starPos[i] = (Math.random() - 0.5) * 50;
      starPos[i + 1] = (Math.random() - 0.5) * 50;
      starPos[i + 2] = (Math.random() - 0.5) * 50;
    }
    starGeo.setAttribute('position', new THREE.BufferAttribute(starPos, 3));
    const starMat = new THREE.PointsMaterial({
      color: 0xffffff,
      size: 0.06,
      transparent: true,
      opacity: 0.85,
    });
    const starField = new THREE.Points(starGeo, starMat);
    scene.add(starField);

    // 6. Earth Glow Horizon
    const earthGeo = new THREE.SphereGeometry(18, 32, 16);
    const earthMat = new THREE.MeshBasicMaterial({
      color: 0x0284c7,
      wireframe: true,
      transparent: true,
      opacity: 0.08,
    });
    const earthSphere = new THREE.Mesh(earthGeo, earthMat);
    earthSphere.position.set(0, -21.5, 0);
    scene.add(earthSphere);

    // 7. Satellite 3U Model Group
    const satGroup = new THREE.Group();
    satGroupRef.current = satGroup;
    satGroup.rotation.x = satRotationRef.current.x;
    satGroup.rotation.y = satRotationRef.current.y;
    scene.add(satGroup);

    const widthU = 0.7;
    const height3U = 2.1;
    const depthU = 0.7;

    // A. Aluminum Chassis
    const frameMat = new THREE.MeshStandardMaterial({
      color: 0x334155,
      metalness: 0.9,
      roughness: 0.25,
      emissive: new THREE.Color(0x000000),
      emissiveIntensity: 0,
    });
    frameMatRef.current = frameMat;

    const railRadius = 0.025;
    const railGeo = new THREE.CylinderGeometry(railRadius, railRadius, height3U, 12);
    const offsets = [
      [-widthU / 2, -depthU / 2],
      [widthU / 2, -depthU / 2],
      [-widthU / 2, depthU / 2],
      [widthU / 2, depthU / 2],
    ];
    offsets.forEach(([rx, rz]) => {
      const rail = new THREE.Mesh(railGeo, frameMat);
      rail.position.set(rx, 0, rz);
      satGroup.add(rail);
    });

    const endCapGeo = new THREE.BoxGeometry(widthU + 0.04, 0.05, depthU + 0.04);
    const topCap = new THREE.Mesh(endCapGeo, frameMat);
    topCap.position.y = height3U / 2;
    satGroup.add(topCap);

    const bottomCap = new THREE.Mesh(endCapGeo, frameMat);
    bottomCap.position.y = -height3U / 2;
    satGroup.add(bottomCap);

    const ringGeo = new THREE.BoxGeometry(widthU + 0.02, 0.02, depthU + 0.02);
    const ring1 = new THREE.Mesh(ringGeo, frameMat);
    ring1.position.y = height3U / 6;
    satGroup.add(ring1);

    const ring2 = new THREE.Mesh(ringGeo, frameMat);
    ring2.position.y = -height3U / 6;
    satGroup.add(ring2);

    // B. Internal Avionics Stack (PC104)
    const pcbMat = new THREE.MeshStandardMaterial({
      color: 0x064e3b,
      metalness: 0.35,
      roughness: 0.55,
      emissive: new THREE.Color(0x000000),
      emissiveIntensity: 0,
    });
    pcbMatRef.current = pcbMat;
    const pcbGeo = new THREE.BoxGeometry(widthU * 0.85, 0.015, depthU * 0.85);
    for (let py = -0.7; py <= 0.7; py += 0.22) {
      const pcb = new THREE.Mesh(pcbGeo, pcbMat);
      pcb.position.y = py;
      satGroup.add(pcb);
    }

    // C. Body Solar Panels
    const solarTex = createSolarTexture();
    const solarBodyMat = new THREE.MeshStandardMaterial({
      color: 0xffffff,
      ...(solarTex ? { map: solarTex } : {}),
      metalness: 0.8,
      roughness: 0.2,
    });

    const sidePanelGeo = new THREE.BoxGeometry(widthU - 0.04, height3U - 0.08, 0.01);
    const frontPanel = new THREE.Mesh(sidePanelGeo, solarBodyMat);
    frontPanel.position.set(0, 0, depthU / 2 + 0.005);
    satGroup.add(frontPanel);

    const backPanel = new THREE.Mesh(sidePanelGeo, solarBodyMat);
    backPanel.position.set(0, 0, -depthU / 2 - 0.005);
    satGroup.add(backPanel);

    const sidePanelGeoLR = new THREE.BoxGeometry(0.01, height3U - 0.08, depthU - 0.04);
    const leftBodyPanel = new THREE.Mesh(sidePanelGeoLR, solarBodyMat);
    leftBodyPanel.position.set(-widthU / 2 - 0.005, 0, 0);
    satGroup.add(leftBodyPanel);

    const rightBodyPanel = new THREE.Mesh(sidePanelGeoLR, solarBodyMat);
    rightBodyPanel.position.set(widthU / 2 + 0.005, 0, 0);
    satGroup.add(rightBodyPanel);

    // D. Articulated 2-Segment Deployable Solar Wings (Left & Right)
    // Stowed flat against -X / +X sides, unfolding outward in 2 mechanical stages via AnimationMixer
    const wingSpan = 0.62;
    const wingHeight = height3U * 0.84;
    const wingThick = 0.016;

    const solarWingMat = new THREE.MeshStandardMaterial({
      color: 0xffffff,
      ...(solarTex ? { map: solarTex } : {}),
      metalness: 0.78,
      roughness: 0.22,
      emissive: new THREE.Color(0x0ea5e9),
      emissiveIntensity: 0,
    });
    solarWingMatRef.current = solarWingMat;

    const wingRimMat = new THREE.MeshStandardMaterial({
      color: 0x64748b,
      metalness: 0.85,
      roughness: 0.28,
    });

    const hingeBrassMat = new THREE.MeshStandardMaterial({
      color: 0xf59e0b,
      metalness: 0.9,
      roughness: 0.2,
    });

    const hingeLedMat = new THREE.MeshBasicMaterial({ color: 0x475569 });
    hingeLedMatRef.current = hingeLedMat;

    const wingPanelMaterials = [
      solarWingMat,
      solarWingMat,
      wingRimMat,
      wingRimMat,
      wingRimMat,
      wingRimMat,
    ];

    const wingSegmentGeo = new THREE.BoxGeometry(wingThick, wingHeight, wingSpan);
    const wingRimGeo = new THREE.BoxGeometry(wingThick * 0.85, wingHeight + 0.025, wingSpan + 0.02);
    const hingePinGeo = new THREE.CylinderGeometry(0.014, 0.014, 0.11, 10);
    const hingeLedGeo = new THREE.SphereGeometry(0.02, 10, 10);

    const buildWingAssembly = (side: -1 | 1) => {
      const innerHinge = new THREE.Group();
      innerHinge.name = side === -1 ? 'leftInnerHinge' : 'rightInnerHinge';
      innerHinge.position.set(side * (widthU / 2 + 0.026), 0, depthU / 2 - 0.02);

      // Mechanical root hinge brackets & spring pins
      [-wingHeight * 0.34, wingHeight * 0.34].forEach((hy) => {
        const pin = new THREE.Mesh(hingePinGeo, hingeBrassMat);
        pin.position.set(0, hy, 0);
        innerHinge.add(pin);
      });

      const hingeLed = new THREE.Mesh(hingeLedGeo, hingeLedMat);
      hingeLed.position.set(side * 0.02, wingHeight * 0.44, 0);
      innerHinge.add(hingeLed);

      // Inner solar segment
      const innerMesh = new THREE.Mesh(wingSegmentGeo, wingPanelMaterials);
      innerMesh.position.set(0, 0, -wingSpan / 2);
      innerHinge.add(innerMesh);

      const innerRim = new THREE.Mesh(wingRimGeo, wingRimMat);
      innerRim.position.set(0, 0, -wingSpan / 2);
      innerHinge.add(innerRim);

      // Outer articulated accordion hinge at tip of inner segment
      const outerHinge = new THREE.Group();
      outerHinge.name = side === -1 ? 'leftOuterHinge' : 'rightOuterHinge';
      outerHinge.position.set(side * wingThick * 1.45, 0, -wingSpan);

      [-wingHeight * 0.3, wingHeight * 0.3].forEach((hy) => {
        const pin = new THREE.Mesh(hingePinGeo, hingeBrassMat);
        pin.position.set(0, hy, 0);
        outerHinge.add(pin);
      });

      const outerMesh = new THREE.Mesh(wingSegmentGeo, wingPanelMaterials);
      outerMesh.position.set(0, 0, -wingSpan / 2);
      outerHinge.add(outerMesh);

      const outerRim = new THREE.Mesh(wingRimGeo, wingRimMat);
      outerRim.position.set(0, 0, -wingSpan / 2);
      outerHinge.add(outerRim);

      innerHinge.add(outerHinge);
      satGroup.add(innerHinge);
      return { innerHinge, outerHinge };
    };

    const leftWing = buildWingAssembly(-1);
    const rightWing = buildWingAssembly(1);

    // Set initial stowed pose before AnimationMixer attaches
    leftWing.innerHinge.rotation.y = 0;
    leftWing.outerHinge.rotation.y = Math.PI;
    rightWing.innerHinge.rotation.y = 0;
    rightWing.outerHinge.rotation.y = -Math.PI;

    // Build Three.js Keyframe AnimationClip for 2-stage mechanical deployment
    const trackLeftInner = new THREE.NumberKeyframeTrack(
      'leftInnerHinge.rotation[y]',
      [0, 0.15, 0.65, 1.15, 1.35, DEPLOY_DURATION_SEC],
      [0, 0.04, Math.PI * 0.28, Math.PI * 0.52, Math.PI * 0.5, Math.PI * 0.5],
      THREE.InterpolateSmooth,
    );
    const trackRightInner = new THREE.NumberKeyframeTrack(
      'rightInnerHinge.rotation[y]',
      [0, 0.15, 0.65, 1.15, 1.35, DEPLOY_DURATION_SEC],
      [0, -0.04, -Math.PI * 0.28, -Math.PI * 0.52, -Math.PI * 0.5, -Math.PI * 0.5],
      THREE.InterpolateSmooth,
    );
    const trackLeftOuter = new THREE.NumberKeyframeTrack(
      'leftOuterHinge.rotation[y]',
      [0, 0.72, 1.45, 2.05, 2.26, DEPLOY_DURATION_SEC],
      [Math.PI, Math.PI, Math.PI * 0.42, -0.06, 0, 0],
      THREE.InterpolateSmooth,
    );
    const trackRightOuter = new THREE.NumberKeyframeTrack(
      'rightOuterHinge.rotation[y]',
      [0, 0.72, 1.45, 2.05, 2.26, DEPLOY_DURATION_SEC],
      [-Math.PI, -Math.PI, -Math.PI * 0.42, 0.06, 0, 0],
      THREE.InterpolateSmooth,
    );

    const deployClip = new THREE.AnimationClip(
      'SolarPanelDeployment',
      DEPLOY_DURATION_SEC,
      [trackLeftInner, trackRightInner, trackLeftOuter, trackRightOuter],
    );

    const mixer = new THREE.AnimationMixer(satGroup);
    mixerRef.current = mixer;

    const deployAction = mixer.clipAction(deployClip);
    deployAction.setLoop(THREE.LoopOnce, 1);
    deployAction.clampWhenFinished = true;
    deployActionRef.current = deployAction;

    const handleMixerFinished = () => {
      if (deployAction.time >= DEPLOY_DURATION_SEC - 0.05) {
        setDeploymentPhase('deployed');
      } else if (deployAction.time <= 0.05) {
        setDeploymentPhase('stowed');
      }
    };
    mixer.addEventListener('finished', handleMixerFinished);

    // Trigger initial state or automatic deployment on tasks_execution stage
    if (initialIsTasksStageRef.current) {
      deployAction.reset();
      deployAction.timeScale = 1;
      deployAction.play();
      setDeploymentPhase('deploying');
    } else if (initialWingsOpenRef.current) {
      deployAction.play();
      deployAction.time = DEPLOY_DURATION_SEC;
      deployAction.paused = true;
      mixer.update(0);
      setDeploymentPhase('deployed');
    } else {
      deployAction.play();
      deployAction.time = 0;
      deployAction.paused = true;
      mixer.update(0);
      setDeploymentPhase('stowed');
    }

    // E. Optical Payload (DZZ Camera)
    const lensTubeGeo = new THREE.CylinderGeometry(0.12, 0.16, 0.22, 24);
    const lensMat = new THREE.MeshStandardMaterial({
      color: 0x0f172a,
      metalness: 0.95,
      roughness: 0.1,
      emissive: new THREE.Color(0x000000),
      emissiveIntensity: 0,
    });
    lensMatRef.current = lensMat;
    const lensTube = new THREE.Mesh(lensTubeGeo, lensMat);
    lensTube.position.set(0, -height3U / 2 - 0.11, 0);
    satGroup.add(lensTube);

    const glassMat = new THREE.MeshPhysicalMaterial({
      color: 0x38bdf8,
      metalness: 0.1,
      roughness: 0.05,
      transmission: 0.9,
      ior: 1.5,
    });
    const glassMesh = new THREE.Mesh(
      new THREE.CylinderGeometry(0.11, 0.11, 0.02, 24),
      glassMat,
    );
    glassMesh.position.set(0, -height3U / 2 - 0.22, 0);
    satGroup.add(glassMesh);

    // F. UHF/VHF Whip Antennas
    const antMat = new THREE.MeshStandardMaterial({
      color: 0xd97706,
      metalness: 0.9,
      roughness: 0.3,
      emissive: new THREE.Color(0x000000),
      emissiveIntensity: 0,
    });
    antMatRef.current = antMat;
    const antLength = 0.75;
    const antGeo = new THREE.CylinderGeometry(0.006, 0.006, antLength, 8);
    const antAngles = [0, Math.PI / 2, Math.PI, (Math.PI * 3) / 2];

    antAngles.forEach((ang) => {
      const antPivot = new THREE.Group();
      antPivot.position.set(0, height3U / 2 + 0.02, 0);
      antPivot.rotation.y = ang;

      const antMesh = new THREE.Mesh(antGeo, antMat);
      antMesh.position.set(0.18, antLength / 2, 0.18);
      antMesh.rotation.z = -0.45;
      antMesh.rotation.x = 0.45;
      antPivot.add(antMesh);
      satGroup.add(antPivot);
    });

    // G. GNSS Patch Antenna & Beacon LED
    const patchMat = new THREE.MeshStandardMaterial({
      color: 0xe2e8f0,
      metalness: 0.6,
      roughness: 0.4,
    });
    const patchAnt = new THREE.Mesh(new THREE.BoxGeometry(0.18, 0.02, 0.18), patchMat);
    patchAnt.position.set(0, height3U / 2 + 0.03, 0);
    satGroup.add(patchAnt);

    const ledGeo = new THREE.SphereGeometry(0.025, 12, 12);
    const ledMat = new THREE.MeshBasicMaterial({ color: 0x22c55e });
    const ledMesh = new THREE.Mesh(ledGeo, ledMat);
    ledMesh.position.set(0.2, height3U / 2 + 0.035, 0.2);
    satGroup.add(ledMesh);

    // 8. Interaction Handlers
    const handlePointerDown = (e: PointerEvent) => {
      isDraggingRef.current = true;
      previousMousePositionRef.current = { x: e.clientX, y: e.clientY };
    };

    const handlePointerMove = (e: PointerEvent) => {
      if (!isDraggingRef.current || !satGroupRef.current) return;
      const deltaX = e.clientX - previousMousePositionRef.current.x;
      const deltaY = e.clientY - previousMousePositionRef.current.y;

      satRotationRef.current.y += deltaX * 0.008;
      satRotationRef.current.x += deltaY * 0.008;
      targetSatRotationRef.current.y = satRotationRef.current.y;
      targetSatRotationRef.current.x = satRotationRef.current.x;

      satGroupRef.current.rotation.y = satRotationRef.current.y;
      satGroupRef.current.rotation.x = satRotationRef.current.x;

      previousMousePositionRef.current = { x: e.clientX, y: e.clientY };
    };

    const handlePointerUp = () => {
      isDraggingRef.current = false;
    };

    const handleWheel = (e: WheelEvent) => {
      e.preventDefault();
      targetCameraZRef.current = THREE.MathUtils.clamp(
        targetCameraZRef.current + e.deltaY * 0.003,
        2.4,
        7.8,
      );
    };

    const domEl = renderer.domElement;
    domEl.addEventListener('pointerdown', handlePointerDown);
    window.addEventListener('pointermove', handlePointerMove);
    window.addEventListener('pointerup', handlePointerUp);
    domEl.addEventListener('wheel', handleWheel, { passive: false });

    // 9. Resize Observer
    const handleResize = () => {
      if (!container || !renderer || !camera) return;
      const w = container.clientWidth;
      const h = container.clientHeight;
      if (w === 0 || h === 0) return;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    };

    const resizeObserver = new ResizeObserver(handleResize);
    resizeObserver.observe(container);

    // 10. Animation Loop (THREE.Timer + zero per-frame allocations)
    let animationFrameId: number;
    const timer = new THREE.Timer();
    let elapsedTotal = 0;

    const animate = () => {
      animationFrameId = requestAnimationFrame(animate);
      timer.update();
      const rawDelta = timer.getDelta();
      const delta = Math.min(rawDelta, 0.05);
      elapsedTotal += delta;

      // Advance Three.js AnimationMixer
      if (mixerRef.current) {
        mixerRef.current.update(delta);
      }

      // Update deployment progress DOM bar & solar energization shader properties
      if (deployActionRef.current) {
        const norm = THREE.MathUtils.clamp(
          deployActionRef.current.time / DEPLOY_DURATION_SEC,
          0,
          1,
        );
        const pct = Math.round(norm * 100);
        if (progressBarRef.current) {
          progressBarRef.current.style.width = `${pct}%`;
        }
        if (progressLabelRef.current) {
          progressLabelRef.current.textContent = `${pct}%`;
        }

        // Solar wing glow energization
        if (solarWingMatRef.current) {
          const isEpsFocused = highlightSubsystemRef.current === 'eps';
          let targetEmissive = 0;
          if (norm > 0.05 && norm < 0.98) {
            targetEmissive = 0.14 + 0.34 * norm;
          } else if (norm >= 0.98) {
            targetEmissive = isEpsFocused ? 0.42 : 0.16;
          }
          solarWingMatRef.current.emissiveIntensity = THREE.MathUtils.damp(
            solarWingMatRef.current.emissiveIntensity,
            targetEmissive,
            5,
            delta,
          );
        }

        // Hinge actuator status LED color
        if (hingeLedMatRef.current) {
          if (norm >= 0.98) {
            hingeLedMatRef.current.color.setHex(0x22c55e);
          } else if (norm > 0.02) {
            hingeLedMatRef.current.color.setHex(0xf59e0b);
          } else {
            hingeLedMatRef.current.color.setHex(0x475569);
          }
        }
      }

      // Subsystem focus highlighting
      const sub = highlightSubsystemRef.current;
      if (pcbMatRef.current) {
        const target = sub === 'obc' ? 0.65 : 0;
        if (sub === 'obc') pcbMatRef.current.emissive.setHex(0x10b981);
        pcbMatRef.current.emissiveIntensity = THREE.MathUtils.damp(
          pcbMatRef.current.emissiveIntensity,
          target,
          6,
          delta,
        );
      }
      if (frameMatRef.current) {
        const target = sub === 'adcs' ? 0.45 : 0;
        if (sub === 'adcs') frameMatRef.current.emissive.setHex(0xa855f7);
        frameMatRef.current.emissiveIntensity = THREE.MathUtils.damp(
          frameMatRef.current.emissiveIntensity,
          target,
          6,
          delta,
        );
      }
      if (lensMatRef.current) {
        const target = sub === 'payload' ? 0.7 : 0;
        if (sub === 'payload') lensMatRef.current.emissive.setHex(0x38bdf8);
        lensMatRef.current.emissiveIntensity = THREE.MathUtils.damp(
          lensMatRef.current.emissiveIntensity,
          target,
          6,
          delta,
        );
      }
      if (antMatRef.current) {
        const target = sub === 'comm' ? 0.6 : 0;
        if (sub === 'comm') antMatRef.current.emissive.setHex(0xf59e0b);
        antMatRef.current.emissiveIntensity = THREE.MathUtils.damp(
          antMatRef.current.emissiveIntensity,
          target,
          6,
          delta,
        );
      }

      // Smooth camera zoom & satellite orientation damping
      camera.position.z = THREE.MathUtils.damp(
        camera.position.z,
        targetCameraZRef.current,
        6,
        delta,
      );

      if (satGroupRef.current && !isDraggingRef.current) {
        if (autoRotateRef.current) {
          targetSatRotationRef.current.y += delta * 0.32 * rotationSpeedRef.current;
        }
        satRotationRef.current.x = THREE.MathUtils.damp(
          satRotationRef.current.x,
          targetSatRotationRef.current.x,
          6,
          delta,
        );
        satRotationRef.current.y = THREE.MathUtils.damp(
          satRotationRef.current.y,
          targetSatRotationRef.current.y,
          6,
          delta,
        );
        satGroupRef.current.rotation.x = satRotationRef.current.x;
        satGroupRef.current.rotation.y = satRotationRef.current.y;
      }

      // AX.25 Beacon LED blink
      const pulse = Math.sin(elapsedTotal * 4) > 0.6;
      ledMat.color.setHex(pulse ? 0x22c55e : 0x064e3b);

      // Starfield drift
      starField.rotation.y += delta * 0.02;

      renderer.render(scene, camera);
    };

    animate();

    return () => {
      cancelAnimationFrame(animationFrameId);
      timer.dispose();
      resizeObserver.disconnect();
      mixer.removeEventListener('finished', handleMixerFinished);
      mixer.stopAllAction();
      domEl.removeEventListener('pointerdown', handlePointerDown);
      window.removeEventListener('pointermove', handlePointerMove);
      window.removeEventListener('pointerup', handlePointerUp);
      domEl.removeEventListener('wheel', handleWheel);

      scene.traverse((obj) => {
        if ((obj as THREE.Mesh).geometry) {
          (obj as THREE.Mesh).geometry.dispose();
        }
        const mat = (obj as THREE.Mesh).material;
        if (Array.isArray(mat)) {
          mat.forEach((m) => m.dispose());
        } else if (mat) {
          mat.dispose();
        }
      });
      solarTex?.dispose();
      scene.clear();

      if (container && renderer.domElement.parentNode === container) {
        container.removeChild(renderer.domElement);
      }
      renderer.dispose();
    };
  }, [createSolarTexture]);

  // React to competition stage transitions ("Выполнение заданий") & manual wing toggles
  useEffect(() => {
    const action = deployActionRef.current;
    if (!action) return;

    const transitionedToTasks =
      competitionStageId === 'tasks_execution' &&
      prevStageIdRef.current !== 'tasks_execution';
    const triggerIncremented = deploymentTriggerKey !== prevTriggerKeyRef.current;
    const wingsChanged = wingsOpen !== prevWingsOpenRef.current;

    prevStageIdRef.current = competitionStageId;
    prevTriggerKeyRef.current = deploymentTriggerKey;
    prevWingsOpenRef.current = wingsOpen;

    if (transitionedToTasks || triggerIncremented) {
      playDeploymentFromStowed();
      return;
    }

    if (wingsChanged) {
      if (wingsOpen) {
        action.paused = false;
        action.timeScale = 1;
        if (action.time <= 0.01) {
          action.reset();
        }
        action.play();
        setDeploymentPhase(
          action.time >= DEPLOY_DURATION_SEC - 0.05 ? 'deployed' : 'deploying',
        );
      } else {
        if (action.time > 0.01) {
          action.paused = false;
          action.timeScale = -1.25;
          action.play();
          setDeploymentPhase('deploying');
        } else {
          setDeploymentPhase('stowed');
        }
      }
    }
  }, [wingsOpen, competitionStageId, deploymentTriggerKey, playDeploymentFromStowed]);

  // Camera Presets (smoothly damped)
  const setPreset = (preset: 'iso' | 'nadir' | 'sun') => {
    setCurrentPreset(preset);
    if (preset === 'iso') {
      targetSatRotationRef.current = { x: 0.35, y: -0.6 };
    } else if (preset === 'nadir') {
      targetSatRotationRef.current = { x: Math.PI / 2, y: 0 };
    } else if (preset === 'sun') {
      targetSatRotationRef.current = { x: 0.08, y: 0.15 };
    }
  };

  const resetView = () => {
    setPreset('iso');
    targetCameraZRef.current = 4.8;
  };

  return (
    <div
      ref={mountRef}
      className={`relative w-full h-full min-h-[380px] rounded-2xl overflow-hidden bg-slate-950 border border-cyan-500/25 shadow-2xl ${className}`}
    >
      {/* Top-Left HUD Controls (no backdrop-blur over WebGL canvas) */}
      <div className="absolute top-3.5 left-3.5 z-10 flex flex-wrap items-center gap-2 pointer-events-auto">
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-900/90 border border-cyan-500/30 text-xs font-mono text-cyan-300 shadow-lg">
          <span className="w-2 h-2 rounded-full bg-cyan-400" />
          <span>CubeSat 3U CAD-VIEW</span>
          <span className="text-slate-500">|</span>
          <span className="text-slate-300">100×100×340.5 мм</span>
        </div>

        {/* Subsystem quick tags */}
        <div className="hidden sm:flex items-center gap-1 px-2 py-1 rounded-xl bg-slate-900/90 border border-slate-800 text-[11px] font-mono">
          {(['all', 'eps', 'adcs', 'obc', 'payload'] as CubeSatSubsystem[]).map((sub) => (
            <button
              key={sub}
              type="button"
              onClick={() => onSelectSubsystem?.(sub)}
              className={`px-2 py-0.5 rounded-md uppercase transition-colors cursor-pointer ${
                highlightSubsystem === sub
                  ? 'bg-cyan-500/25 text-cyan-300 border border-cyan-500/40 font-bold'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              {sub}
            </button>
          ))}
        </div>
      </div>

      {/* Top-Right Control Buttons */}
      <div className="absolute top-3.5 right-3.5 z-10 flex items-center gap-1.5 pointer-events-auto">
        <button
          type="button"
          onClick={playDeploymentFromStowed}
          title="Воспроизвести анимацию развертывания солнечных панелей"
          className="px-2.5 py-1.5 rounded-xl text-xs font-semibold bg-cyan-500/20 text-cyan-200 border border-cyan-500/40 hover:bg-cyan-500/30 transition-colors flex items-center gap-1.5 cursor-pointer shadow-lg"
        >
          <Play className="w-3.5 h-3.5 text-cyan-300" />
          <span className="hidden md:inline">Развернуть (анимация)</span>
        </button>

        <button
          type="button"
          onClick={toggleWings}
          title={wingsOpen ? 'Сложить солнечные панели' : 'Раскрыть солнечные панели'}
          className={`px-3 py-1.5 rounded-xl text-xs font-semibold border transition-colors flex items-center gap-1.5 cursor-pointer shadow-lg ${
            wingsOpen
              ? 'bg-amber-500/20 text-amber-300 border-amber-500/40 hover:bg-amber-500/30'
              : 'bg-slate-900/90 text-slate-300 border-slate-700 hover:bg-slate-800'
          }`}
        >
          <Sun className="w-3.5 h-3.5 text-amber-400" />
          <span>{wingsOpen ? 'Сложить панели' : 'Раскрыть панели'}</span>
        </button>

        <button
          type="button"
          onClick={() => setAutoRotate((v) => !v)}
          title="Авто-вращение"
          className={`p-2 rounded-xl border transition-colors cursor-pointer ${
            autoRotate
              ? 'bg-cyan-500/20 text-cyan-300 border-cyan-500/40'
              : 'bg-slate-900/90 text-slate-400 border-slate-700 hover:text-slate-200'
          }`}
        >
          <RotateCcw className="w-4 h-4" />
        </button>

        <button
          type="button"
          onClick={resetView}
          title="Сбросить ракурс"
          className="p-2 rounded-xl bg-slate-900/90 hover:bg-slate-800 text-slate-300 border border-slate-700 transition-colors cursor-pointer"
        >
          <Compass className="w-4 h-4" />
        </button>
      </div>

      {/* Deployment Telemetry Strip (Bottom-Left above controls) */}
      <div className="absolute bottom-14 left-3.5 z-10 pointer-events-none">
        <div className="flex items-center gap-2.5 px-3 py-1.5 rounded-xl bg-slate-900/90 border border-slate-800 text-[11px] font-mono shadow-lg">
          {deploymentPhase === 'deployed' ? (
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
          ) : deploymentPhase === 'deploying' ? (
            <Sparkles className="w-3.5 h-3.5 text-amber-400 shrink-0" />
          ) : (
            <Zap className="w-3.5 h-3.5 text-slate-400 shrink-0" />
          )}

          <span className="text-slate-300">
            {isTasksStage && deploymentPhase === 'deploying'
              ? 'Этап заданий: развертывание СБ'
              : deploymentPhase === 'deployed'
                ? 'Солнечные крылья 2×2 развёрнуты'
                : deploymentPhase === 'deploying'
                  ? 'Ход механизма СБ'
                  : 'Панели сложены (транспортное положение)'}
          </span>

          <div className="w-20 h-1.5 rounded-full bg-slate-800 overflow-hidden">
            <div
              ref={progressBarRef}
              className="h-full bg-gradient-to-r from-amber-400 to-emerald-400"
              style={{ width: wingsOpen ? '100%' : '0%' }}
            />
          </div>
          <span ref={progressLabelRef} className="text-cyan-300 font-bold w-8 text-right">
            {wingsOpen ? '100%' : '0%'}
          </span>
        </div>
      </div>

      {/* Bottom Camera Preset Switcher & Guide */}
      <div className="absolute bottom-3.5 left-3.5 right-3.5 z-10 flex flex-col sm:flex-row items-center justify-between gap-2 pointer-events-none">
        <div className="flex items-center gap-1.5 pointer-events-auto bg-slate-900/90 px-2 py-1 rounded-xl border border-slate-800 text-xs">
          <span className="text-slate-500 text-[11px] px-1 font-mono">Ракурс:</span>
          <button
            type="button"
            onClick={() => setPreset('iso')}
            className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-colors cursor-pointer ${
              currentPreset === 'iso'
                ? 'bg-cyan-500 text-slate-950 font-bold'
                : 'text-slate-300 hover:text-white'
            }`}
          >
            Изометрия
          </button>
          <button
            type="button"
            onClick={() => setPreset('nadir')}
            className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-colors cursor-pointer ${
              currentPreset === 'nadir'
                ? 'bg-cyan-500 text-slate-950 font-bold'
                : 'text-slate-300 hover:text-white'
            }`}
          >
            Камера ДЗЗ (Надир)
          </button>
          <button
            type="button"
            onClick={() => setPreset('sun')}
            className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-colors cursor-pointer ${
              currentPreset === 'sun'
                ? 'bg-cyan-500 text-slate-950 font-bold'
                : 'text-slate-300 hover:text-white'
            }`}
          >
            Солнечные панели
          </button>
        </div>

        <div className="text-[11px] font-mono text-slate-400 bg-slate-900/90 px-3 py-1 rounded-xl border border-slate-800 pointer-events-auto">
          Вращение ЛКМ • Масштаб колёсиком • 3U CubeSat
        </div>
      </div>
    </div>
  );
};

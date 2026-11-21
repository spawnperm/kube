import React, { useEffect, useRef, useState, useCallback } from 'react';
import * as THREE from 'three';
import {
  Compass,
  Maximize2,
  Minimize2,
  RotateCcw,
  Sun,
  Activity,
  Layers,
  Zap,
  Glasses,
  X,
  Smartphone,
  Eye,
} from 'lucide-react';
import type { TelemetryPacket } from '../types';

type CameraPreset = 'iso' | 'nadir' | 'solar' | 'zenith';

interface WebXRSessionLike {
  end: () => Promise<void>;
  addEventListener: (type: string, listener: () => void) => void;
}

interface WebXRSystemLike {
  isSessionSupported: (mode: string) => Promise<boolean>;
  requestSession: (mode: string) => Promise<WebXRSessionLike>;
}

type NavigatorWithXR = Navigator & {
  xr?: any;
};

interface DeviceOrientationEventStatic {
  requestPermission?: () => Promise<'granted' | 'denied'>;
}

interface CubeSat3DViewerProps {
  telemetry: TelemetryPacket;
  isPaused?: boolean;
  className?: string;
}

export const CubeSat3DViewer: React.FC<CubeSat3DViewerProps> = ({
  telemetry,
  isPaused = false,
  className = '',
}) => {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  // Mutable refs for animate loop to avoid re-triggering Three.js scene setup
  const isPausedRef = useRef(isPaused);
  isPausedRef.current = isPaused;

  const telemetryModeRef = useRef(telemetry.mode);
  telemetryModeRef.current = telemetry.mode;

  const gyroRatesRef = useRef(telemetry.gyroRates);
  gyroRatesRef.current = telemetry.gyroRates;

  const rfPulseActiveRef = useRef(false);

  // VR & WebXR state
  const [isXrSupported, setIsXrSupported] = useState<boolean>(false);
  const [isVrActive, setIsVrActive] = useState<boolean>(false);
  const [vrType, setVrType] = useState<'webxr' | 'cardboard'>('cardboard');
  const [stereoIpd, setStereoIpd] = useState<number>(0.064); // 64mm standard interpupillary distance
  const xrSessionRef = useRef<WebXRSessionLike | null>(null);

  const isVrActiveRef = useRef<boolean>(false);
  isVrActiveRef.current = isVrActive;

  const vrTypeRef = useRef<'webxr' | 'cardboard'>('cardboard');
  vrTypeRef.current = vrType;

  const stereoIpdRef = useRef<number>(stereoIpd);
  stereoIpdRef.current = stereoIpd;

  const stereoCameraRef = useRef<THREE.StereoCamera>(new THREE.StereoCamera());

  // Viewer options state
  const [showAxes, setShowAxes] = useState<boolean>(true);
  const [showVectors, setShowVectors] = useState<boolean>(true);
  const [wingsDeployed, setWingsDeployed] = useState<boolean>(true);
  const [followTelemetry, setFollowTelemetry] = useState<boolean>(true);
  const [isFullscreen, setIsFullscreen] = useState<boolean>(false);
  const [activePreset, setActivePreset] = useState<CameraPreset>('iso');
  const [rfPulseActive, setRfPulseActive] = useState<boolean>(false);
  rfPulseActiveRef.current = rfPulseActive;

  // References to mutable Three.js objects
  const sceneRef = useRef<THREE.Scene | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const satelliteGroupRef = useRef<THREE.Group | null>(null);
  const leftWingGroupRef = useRef<THREE.Group | null>(null);
  const rightWingGroupRef = useRef<THREE.Group | null>(null);
  const axesGroupRef = useRef<THREE.Group | null>(null);
  const vectorsGroupRef = useRef<THREE.Group | null>(null);
  const sunLightRef = useRef<THREE.DirectionalLight | null>(null);
  const earthAlbedoRef = useRef<THREE.DirectionalLight | null>(null);
  const ambientLightRef = useRef<THREE.AmbientLight | null>(null);
  const earthGlowRef = useRef<THREE.Mesh | null>(null);
  const rfRingMeshRef = useRef<THREE.Mesh | null>(null);

  // Orbit controls state
  const isDraggingRef = useRef<boolean>(false);
  const previousMousePositionRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 });
  const cameraDistanceRef = useRef<number>(6.5);
  const cameraPhiRef = useRef<number>(Math.PI / 4); // Elevation
  const cameraThetaRef = useRef<number>(Math.PI / 4); // Azimuth
  const targetLookAtRef = useRef<THREE.Vector3>(new THREE.Vector3(0, 0, 0));

  // Orientation target angles in radians
  const targetRotationRef = useRef<THREE.Euler>(new THREE.Euler(0, 0, 0, 'ZYX'));
  const currentRotationRef = useRef<THREE.Euler>(new THREE.Euler(0, 0, 0, 'ZYX'));

  // Detect WebXR Device API availability on mount
  useEffect(() => {
    const nav = typeof navigator !== 'undefined' ? (navigator as NavigatorWithXR) : undefined;
    if (nav?.xr) {
      nav.xr
        .isSessionSupported('immersive-vr')
        .then((supported: boolean) => {
          setIsXrSupported(supported);
        })
        .catch(() => {
          setIsXrSupported(false);
        });
    }
  }, []);

  // Update target rotation whenever telemetry changes
  useEffect(() => {
    if (!followTelemetry) return;

    if (telemetry.orientation) {
      const rollRad = THREE.MathUtils.degToRad(telemetry.orientation.roll);
      const pitchRad = THREE.MathUtils.degToRad(telemetry.orientation.pitch);
      const yawRad = THREE.MathUtils.degToRad(telemetry.orientation.yaw);
      targetRotationRef.current.set(pitchRad, yawRad, rollRad, 'YXZ');
    } else {
      const [gx, gy, gz] = telemetry.gyroRates;
      targetRotationRef.current.x += THREE.MathUtils.degToRad(gy);
      targetRotationRef.current.y += THREE.MathUtils.degToRad(gz);
      targetRotationRef.current.z += THREE.MathUtils.degToRad(gx);
    }
  }, [telemetry, followTelemetry]);

  // Handle RF pulse on transmitting mode
  useEffect(() => {
    if (telemetry.mode === 'TRANSMITTING') {
      setRfPulseActive(true);
      const timer = setTimeout(() => setRfPulseActive(false), 900);
      return () => clearTimeout(timer);
    }
  }, [telemetry.mode, telemetry.packetsDownlinked]);

  // Dynamic orbital lighting & shadow intensities
  useEffect(() => {
    if (!sunLightRef.current || !ambientLightRef.current || !earthAlbedoRef.current) return;

    if (telemetry.mode === 'ECLIPSE') {
      // In Earth shadow (eclipse)
      sunLightRef.current.intensity = 0.08;
      ambientLightRef.current.intensity = 0.22;
      earthAlbedoRef.current.intensity = 0.12;
    } else {
      // Orbit solar progression angle calculated from telemetry longitude and latitude
      const orbitLonRad = THREE.MathUtils.degToRad(telemetry.longitude || 0);
      const orbitLatRad = THREE.MathUtils.degToRad(telemetry.latitude || 0);
      const sunDist = 14;

      const sx = Math.cos(orbitLonRad) * sunDist * Math.cos(orbitLatRad);
      const sy = Math.sin(orbitLatRad) * 6 + 7;
      const sz = Math.sin(orbitLonRad) * sunDist + 6;
      sunLightRef.current.position.set(sx, sy, sz);

      sunLightRef.current.intensity = telemetry.mode === 'DETUMBLING' ? 2.8 : 2.6;
      ambientLightRef.current.intensity = 0.45;
      earthAlbedoRef.current.intensity = 0.75;
    }
  }, [telemetry.mode, telemetry.longitude, telemetry.latitude]);

  // Toggle wings deployment
  useEffect(() => {
    const targetAngle = wingsDeployed ? Math.PI * 0.5 : 0;
    if (leftWingGroupRef.current) {
      leftWingGroupRef.current.rotation.y = targetAngle;
    }
    if (rightWingGroupRef.current) {
      rightWingGroupRef.current.rotation.y = -targetAngle;
    }
  }, [wingsDeployed]);

  // Toggle axes helper visibility
  useEffect(() => {
    if (axesGroupRef.current) axesGroupRef.current.visible = showAxes;
  }, [showAxes]);

  // Toggle vectors helper visibility
  useEffect(() => {
    if (vectorsGroupRef.current) vectorsGroupRef.current.visible = showVectors;
  }, [showVectors]);

  // Cardboard DeviceOrientation gyroscope tracking on mobile devices
  useEffect(() => {
    if (!isVrActive || vrType !== 'cardboard') return;

    const handleDeviceOrientation = (event: DeviceOrientationEvent) => {
      if (event.beta === null || event.gamma === null) return;
      const pitch = (event.beta - 90) * (Math.PI / 180);
      const roll = event.gamma * (Math.PI / 180);

      cameraPhiRef.current = Math.max(0.1, Math.min(Math.PI - 0.1, Math.PI / 2 + pitch * 0.7));
      cameraThetaRef.current = Math.PI / 4 + roll * 0.7;
    };

    const doeStatic =
      typeof DeviceOrientationEvent !== 'undefined'
        ? (DeviceOrientationEvent as unknown as DeviceOrientationEventStatic)
        : undefined;
    if (typeof doeStatic?.requestPermission === 'function') {
      doeStatic.requestPermission().catch(() => {});
    }

    window.addEventListener('deviceorientation', handleDeviceOrientation);
    return () => {
      window.removeEventListener('deviceorientation', handleDeviceOrientation);
    };
  }, [isVrActive, vrType]);

  // Camera presets
  const applyCameraPreset = useCallback((preset: CameraPreset) => {
    setActivePreset(preset);
    switch (preset) {
      case 'iso':
        cameraPhiRef.current = Math.PI / 4;
        cameraThetaRef.current = Math.PI / 4;
        cameraDistanceRef.current = 6.2;
        break;
      case 'nadir':
        cameraPhiRef.current = Math.PI * 0.85;
        cameraThetaRef.current = 0;
        cameraDistanceRef.current = 5.2;
        break;
      case 'solar':
        cameraPhiRef.current = Math.PI / 2;
        cameraThetaRef.current = Math.PI / 2;
        cameraDistanceRef.current = 6.8;
        break;
      case 'zenith':
        cameraPhiRef.current = 0.15;
        cameraThetaRef.current = 0;
        cameraDistanceRef.current = 5.5;
        break;
    }
  }, []);

  // Reset orientation
  const resetOrientation = useCallback(() => {
    targetRotationRef.current.set(0, 0, 0);
    currentRotationRef.current.set(0, 0, 0);
    if (satelliteGroupRef.current) {
      satelliteGroupRef.current.rotation.set(0, 0, 0);
    }
    applyCameraPreset('iso');
  }, [applyCameraPreset]);

  // Toggle VR mode (WebXR or Cardboard stereoscopic)
  const handleToggleVr = useCallback(async () => {
    if (isVrActive) {
      if (xrSessionRef.current) {
        try {
          await xrSessionRef.current.end();
        } catch {
          // Ignore
        }
        xrSessionRef.current = null;
      }
      if (rendererRef.current) {
        rendererRef.current.xr.enabled = false;
      }
      setIsVrActive(false);
      if (typeof document !== 'undefined' && document.fullscreenElement) {
        try {
          await document.exitFullscreen();
        } catch {
          // Ignore
        }
      }
      return;
    }

    // Try WebXR Device API first if supported
    const nav = typeof navigator !== 'undefined' ? (navigator as NavigatorWithXR) : undefined;
    if (nav?.xr && isXrSupported) {
      try {
        const session = await nav.xr.requestSession('immersive-vr');
        xrSessionRef.current = session;
        if (rendererRef.current) {
          rendererRef.current.xr.enabled = true;
          await rendererRef.current.xr.setSession(session as any);
        }
        session.addEventListener('end', () => {
          setIsVrActive(false);
          xrSessionRef.current = null;
          if (rendererRef.current) {
            rendererRef.current.xr.enabled = false;
          }
        });
        setIsVrActive(true);
        setVrType('webxr');
        return;
      } catch (e) {
        console.warn('WebXR session request failed, falling back to Cardboard stereo:', e);
      }
    }

    // Cardboard-style stereoscopic split-screen mode
    setIsVrActive(true);
    setVrType('cardboard');

    // Request fullscreen on container if available
    try {
      if (containerRef.current && typeof document !== 'undefined' && !document.fullscreenElement) {
        await containerRef.current.requestFullscreen();
      }
    } catch {
      // Ignored if browser prevents
    }
  }, [isVrActive, isXrSupported]);

  // Initialize Three.js scene with dynamic lighting, shadows, and stereo support
  useEffect(() => {
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container) return;

    const width = container.clientWidth || 800;
    const height = container.clientHeight || 450;

    // 1. Scene
    const scene = new THREE.Scene();
    sceneRef.current = scene;
    scene.background = new THREE.Color(0x050814);

    // 2. Camera
    const camera = new THREE.PerspectiveCamera(42, width / height, 0.1, 100);
    cameraRef.current = camera;

    // 3. Renderer with shadow maps & WebXR capability
    let renderer: THREE.WebGLRenderer | null = null;
    try {
      renderer = new THREE.WebGLRenderer({
        canvas,
        antialias: true,
        alpha: false,
        powerPreference: 'high-performance',
      });
      renderer.setSize(width, height);
      renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
      renderer.toneMapping = THREE.ACESFilmicToneMapping;
      renderer.toneMappingExposure = 1.15;

      // Enable dynamic PCF soft shadow maps
      renderer.shadowMap.enabled = true;
      renderer.shadowMap.type = THREE.PCFSoftShadowMap;

      rendererRef.current = renderer;
    } catch {
      renderer = null;
    }

    // 4. Dynamic Lighting: Directional Sun Light with Shadows
    const sunLight = new THREE.DirectionalLight(0xfff8ee, 2.6);
    sunLight.position.set(12, 8, 10);
    sunLight.castShadow = true;
    sunLight.shadow.mapSize.width = 2048;
    sunLight.shadow.mapSize.height = 2048;
    sunLight.shadow.camera.near = 0.5;
    sunLight.shadow.camera.far = 32;
    sunLight.shadow.camera.left = -4.5;
    sunLight.shadow.camera.right = 4.5;
    sunLight.shadow.camera.top = 4.5;
    sunLight.shadow.camera.bottom = -4.5;
    sunLight.shadow.bias = -0.0004;
    sunLight.shadow.normalBias = 0.02;
    scene.add(sunLight);
    sunLightRef.current = sunLight;

    // Earth Albedo Light (cyan-blue diffuse bounce from Earth planet disk below)
    const earthAlbedo = new THREE.DirectionalLight(0x38bdf8, 0.75);
    earthAlbedo.position.set(0, -10, 2);
    scene.add(earthAlbedo);
    earthAlbedoRef.current = earthAlbedo;

    // Deep space soft ambient light
    const ambientLight = new THREE.AmbientLight(0x0e172a, 0.45);
    scene.add(ambientLight);
    ambientLightRef.current = ambientLight;

    // 5. Cosmic Environment: Starfield Particles
    const starCount = 2400;
    const starGeometry = new THREE.BufferGeometry();
    const starPositions = new Float32Array(starCount * 3);
    const starColors = new Float32Array(starCount * 3);

    const colorPalette = [
      new THREE.Color(0xffffff),
      new THREE.Color(0xa5f3fc),
      new THREE.Color(0xfef08a),
      new THREE.Color(0xc084fc),
    ];

    for (let i = 0; i < starCount; i++) {
      const radius = 45 + Math.random() * 35;
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(2 * Math.random() - 1);

      starPositions[i * 3] = radius * Math.sin(phi) * Math.cos(theta);
      starPositions[i * 3 + 1] = radius * Math.sin(phi) * Math.sin(theta);
      starPositions[i * 3 + 2] = radius * Math.cos(phi);

      const color = colorPalette[Math.floor(Math.random() * colorPalette.length)];
      starColors[i * 3] = color.r;
      starColors[i * 3 + 1] = color.g;
      starColors[i * 3 + 2] = color.b;
    }

    starGeometry.setAttribute('position', new THREE.BufferAttribute(starPositions, 3));
    starGeometry.setAttribute('color', new THREE.BufferAttribute(starColors, 3));

    const starMaterial = new THREE.PointsMaterial({
      size: 0.28,
      vertexColors: true,
      transparent: true,
      opacity: 0.9,
    });
    const starPoints = new THREE.Points(starGeometry, starMaterial);
    scene.add(starPoints);

    // Distant Earth Limb (Curved blue atmospheric glow sphere at bottom)
    const earthRadius = 55;
    const earthGeometry = new THREE.SphereGeometry(earthRadius, 48, 24);
    const earthMaterial = new THREE.MeshBasicMaterial({
      color: 0x093054,
      wireframe: false,
    });
    const earthMesh = new THREE.Mesh(earthGeometry, earthMaterial);
    earthMesh.position.set(0, -earthRadius - 3.8, 0);
    scene.add(earthMesh);
    earthGlowRef.current = earthMesh;

    // Earth atmosphere atmospheric rim ring
    const atmosphereRingGeom = new THREE.RingGeometry(earthRadius, earthRadius + 0.6, 64);
    const atmosphereRingMat = new THREE.MeshBasicMaterial({
      color: 0x38bdf8,
      side: THREE.DoubleSide,
      transparent: true,
      opacity: 0.4,
    });
    const atmosphereRing = new THREE.Mesh(atmosphereRingGeom, atmosphereRingMat);
    atmosphereRing.position.copy(earthMesh.position);
    atmosphereRing.rotation.x = Math.PI / 2;
    scene.add(atmosphereRing);

    // 6. BUILD PROCEDURAL 3U CUBESAT MODEL WITH REALISTIC SHADOWS
    const satelliteGroup = new THREE.Group();
    scene.add(satelliteGroup);
    satelliteGroupRef.current = satelliteGroup;

    // Materials
    const chassisRailMaterial = new THREE.MeshStandardMaterial({
      color: 0x242d38,
      metalness: 0.85,
      roughness: 0.25,
    });

    const standoffFootMaterial = new THREE.MeshStandardMaterial({
      color: 0x94a3b8,
      metalness: 0.9,
      roughness: 0.2,
    });

    const solarCellMaterial = new THREE.MeshStandardMaterial({
      color: 0x0c1e3d,
      roughness: 0.15,
      metalness: 0.75,
      emissive: 0x040b17,
      emissiveIntensity: 0.4,
    });

    const goldMliMaterial = new THREE.MeshStandardMaterial({
      color: 0xf59e0b,
      metalness: 0.95,
      roughness: 0.35,
    });

    const lensBarrelMaterial = new THREE.MeshStandardMaterial({
      color: 0x111827,
      metalness: 0.9,
      roughness: 0.15,
    });
    const glassLensMaterial = new THREE.MeshPhysicalMaterial({
      color: 0x06b6d4,
      transmission: 0.85,
      opacity: 0.9,
      transparent: true,
      roughness: 0.05,
      ior: 1.52,
    });

    const copperAntennaMaterial = new THREE.MeshStandardMaterial({
      color: 0xf97316,
      metalness: 0.95,
      roughness: 0.25,
    });

    // Structural skeleton core (Main chassis box)
    const chassisBoxGeom = new THREE.BoxGeometry(0.98, 2.98, 0.98);
    const chassisBoxMat = new THREE.MeshStandardMaterial({
      color: 0x111827,
      metalness: 0.6,
      roughness: 0.4,
    });
    const chassisBox = new THREE.Mesh(chassisBoxGeom, chassisBoxMat);
    chassisBox.castShadow = true;
    chassisBox.receiveShadow = true;
    satelliteGroup.add(chassisBox);

    // Internal payload bay sensor LED glow
    const payloadLed = new THREE.PointLight(0x06b6d4, 1.2, 2.5);
    payloadLed.position.set(0, -1.55, 0);
    satelliteGroup.add(payloadLed);

    // 4 Longitudinal corner rails
    const railGeom = new THREE.BoxGeometry(0.06, 3.1, 0.06);
    const railPositions = [
      [0.5, 0, 0.5],
      [-0.5, 0, 0.5],
      [0.5, 0, -0.5],
      [-0.5, 0, -0.5],
    ];
    railPositions.forEach(([rx, ry, rz]) => {
      const rail = new THREE.Mesh(railGeom, chassisRailMaterial);
      rail.position.set(rx, ry, rz);
      rail.castShadow = true;
      rail.receiveShadow = true;
      satelliteGroup.add(rail);

      const footGeom = new THREE.BoxGeometry(0.08, 0.08, 0.08);
      const topFoot = new THREE.Mesh(footGeom, standoffFootMaterial);
      topFoot.position.set(rx, 1.55, rz);
      topFoot.castShadow = true;
      topFoot.receiveShadow = true;
      satelliteGroup.add(topFoot);

      const bottomFoot = new THREE.Mesh(footGeom, standoffFootMaterial);
      bottomFoot.position.set(rx, -1.55, rz);
      bottomFoot.castShadow = true;
      bottomFoot.receiveShadow = true;
      satelliteGroup.add(bottomFoot);
    });

    // Horizontal structural rib frames
    const ribHeights = [-1.0, 0.0, 1.0];
    const ribGeom = new THREE.BoxGeometry(1.02, 0.04, 1.02);
    ribHeights.forEach((h) => {
      const rib = new THREE.Mesh(ribGeom, chassisRailMaterial);
      rib.position.set(0, h, 0);
      rib.castShadow = true;
      rib.receiveShadow = true;
      satelliteGroup.add(rib);
    });

    // Body Solar Cell Panels
    const panelGeom = new THREE.BoxGeometry(0.92, 2.85, 0.02);

    const frontPanel = new THREE.Mesh(panelGeom, solarCellMaterial);
    frontPanel.position.set(0, 0, 0.505);
    frontPanel.castShadow = true;
    frontPanel.receiveShadow = true;
    satelliteGroup.add(frontPanel);

    const backMliGeom = new THREE.BoxGeometry(0.92, 2.85, 0.02);
    const backPanel = new THREE.Mesh(backMliGeom, goldMliMaterial);
    backPanel.position.set(0, 0, -0.505);
    backPanel.castShadow = true;
    backPanel.receiveShadow = true;
    satelliteGroup.add(backPanel);

    // Procedural solar grid lines
    const gridLineMat = new THREE.LineBasicMaterial({
      color: 0x93c5fd,
      transparent: true,
      opacity: 0.6,
    });
    for (let gy = -1.2; gy <= 1.2; gy += 0.4) {
      const pts = [new THREE.Vector3(-0.43, gy, 0.52), new THREE.Vector3(0.43, gy, 0.52)];
      const lineGeom = new THREE.BufferGeometry().setFromPoints(pts);
      const line = new THREE.Line(lineGeom, gridLineMat);
      satelliteGroup.add(line);
    }

    // Deployable Solar Array Wings with self-shadowing
    const leftWingGroup = new THREE.Group();
    leftWingGroup.position.set(-0.52, 0, 0);
    satelliteGroup.add(leftWingGroup);
    leftWingGroupRef.current = leftWingGroup;

    const wingGeom = new THREE.BoxGeometry(0.92, 2.8, 0.03);
    const leftWingMesh = new THREE.Mesh(wingGeom, solarCellMaterial);
    leftWingMesh.position.set(-0.48, 0, 0);
    leftWingMesh.castShadow = true;
    leftWingMesh.receiveShadow = true;
    leftWingGroup.add(leftWingMesh);

    const leftWingBackMesh = new THREE.Mesh(
      new THREE.BoxGeometry(0.91, 2.78, 0.01),
      goldMliMaterial,
    );
    leftWingBackMesh.position.set(-0.48, 0, -0.02);
    leftWingBackMesh.castShadow = true;
    leftWingBackMesh.receiveShadow = true;
    leftWingGroup.add(leftWingBackMesh);

    const rightWingGroup = new THREE.Group();
    rightWingGroup.position.set(0.52, 0, 0);
    satelliteGroup.add(rightWingGroup);
    rightWingGroupRef.current = rightWingGroup;

    const rightWingMesh = new THREE.Mesh(wingGeom, solarCellMaterial);
    rightWingMesh.position.set(0.48, 0, 0);
    rightWingMesh.castShadow = true;
    rightWingMesh.receiveShadow = true;
    rightWingGroup.add(rightWingMesh);

    const rightWingBackMesh = new THREE.Mesh(
      new THREE.BoxGeometry(0.91, 2.78, 0.01),
      goldMliMaterial,
    );
    rightWingBackMesh.position.set(0.48, 0, -0.02);
    rightWingBackMesh.castShadow = true;
    rightWingBackMesh.receiveShadow = true;
    rightWingGroup.add(rightWingBackMesh);

    leftWingGroup.rotation.y = Math.PI * 0.5;
    rightWingGroup.rotation.y = -Math.PI * 0.5;

    // Optical Earth Observation Payload (Nadir face: -Y bottom face)
    const payloadGroup = new THREE.Group();
    payloadGroup.position.set(0, -1.5, 0);
    satelliteGroup.add(payloadGroup);

    const lensBarrel = new THREE.Mesh(
      new THREE.CylinderGeometry(0.24, 0.28, 0.2, 32),
      lensBarrelMaterial,
    );
    lensBarrel.position.set(0, -0.08, 0);
    lensBarrel.castShadow = true;
    lensBarrel.receiveShadow = true;
    payloadGroup.add(lensBarrel);

    const opticalGlass = new THREE.Mesh(
      new THREE.CylinderGeometry(0.2, 0.2, 0.04, 32),
      glassLensMaterial,
    );
    opticalGlass.position.set(0, -0.17, 0);
    opticalGlass.castShadow = true;
    payloadGroup.add(opticalGlass);

    const apertureRing = new THREE.Mesh(
      new THREE.TorusGeometry(0.22, 0.015, 16, 32),
      new THREE.MeshStandardMaterial({ color: 0xf59e0b, metalness: 0.9, roughness: 0.2 }),
    );
    apertureRing.rotation.x = Math.PI / 2;
    apertureRing.position.set(0, -0.18, 0);
    apertureRing.castShadow = true;
    payloadGroup.add(apertureRing);

    const radDetector = new THREE.Mesh(
      new THREE.BoxGeometry(0.18, 0.02, 0.18),
      new THREE.MeshStandardMaterial({ color: 0x10b981, metalness: 0.8, roughness: 0.3 }),
    );
    radDetector.position.set(0.25, -0.01, 0.25);
    radDetector.castShadow = true;
    radDetector.receiveShadow = true;
    payloadGroup.add(radDetector);

    // Communications Antennas (Zenith face: +Y top face)
    const antennaHubGroup = new THREE.Group();
    antennaHubGroup.position.set(0, 1.5, 0);
    satelliteGroup.add(antennaHubGroup);

    const gnssPatch = new THREE.Mesh(
      new THREE.BoxGeometry(0.28, 0.03, 0.28),
      new THREE.MeshStandardMaterial({ color: 0xe2e8f0, metalness: 0.9, roughness: 0.2 }),
    );
    gnssPatch.position.set(0, 0.02, 0);
    gnssPatch.castShadow = true;
    gnssPatch.receiveShadow = true;
    antennaHubGroup.add(gnssPatch);

    const sbandPatch = new THREE.Mesh(
      new THREE.CylinderGeometry(0.12, 0.12, 0.02, 24),
      new THREE.MeshStandardMaterial({ color: 0xf59e0b, metalness: 0.95, roughness: 0.15 }),
    );
    sbandPatch.position.set(-0.25, 0.02, -0.2);
    sbandPatch.castShadow = true;
    sbandPatch.receiveShadow = true;
    antennaHubGroup.add(sbandPatch);

    // 4 Deployed Turnstile tape-spring UHF/VHF monopole antennas
    const antennaAngles = [0.25 * Math.PI, 0.75 * Math.PI, 1.25 * Math.PI, 1.75 * Math.PI];
    antennaAngles.forEach((ang) => {
      const whipGroup = new THREE.Group();
      whipGroup.position.set(Math.cos(ang) * 0.45, 0.02, Math.sin(ang) * 0.45);
      whipGroup.rotation.y = ang;
      whipGroup.rotation.z = Math.PI * 0.35;

      const whipMesh = new THREE.Mesh(
        new THREE.CylinderGeometry(0.008, 0.008, 1.2, 8),
        copperAntennaMaterial,
      );
      whipMesh.position.set(0, 0.6, 0);
      whipMesh.castShadow = true;
      whipGroup.add(whipMesh);
      antennaHubGroup.add(whipGroup);
    });

    // RF Pulsating Wave Ring
    const rfRingGeom = new THREE.TorusGeometry(0.4, 0.02, 16, 48);
    const rfRingMat = new THREE.MeshBasicMaterial({
      color: 0xc084fc,
      transparent: true,
      opacity: 0.0,
    });
    const rfRingMesh = new THREE.Mesh(rfRingGeom, rfRingMat);
    rfRingMesh.rotation.x = Math.PI / 2;
    rfRingMesh.position.set(0, 1.6, 0);
    satelliteGroup.add(rfRingMesh);
    rfRingMeshRef.current = rfRingMesh;

    // Remove Before Flight (RBF) Pin Socket
    const rbfSocket = new THREE.Mesh(
      new THREE.CylinderGeometry(0.04, 0.04, 0.06, 12),
      new THREE.MeshStandardMaterial({ color: 0xef4444, metalness: 0.7, roughness: 0.3 }),
    );
    rbfSocket.rotation.z = Math.PI / 2;
    rbfSocket.position.set(0.5, 1.2, 0.3);
    rbfSocket.castShadow = true;
    rbfSocket.receiveShadow = true;
    satelliteGroup.add(rbfSocket);

    // 7. BODY FRAME COORDINATE AXES
    const axesGroup = new THREE.Group();
    satelliteGroup.add(axesGroup);
    axesGroupRef.current = axesGroup;

    const createAxisArrow = (dir: THREE.Vector3, color: number, length: number) => {
      const arrowGroup = new THREE.Group();
      const shaft = new THREE.Mesh(
        new THREE.CylinderGeometry(0.018, 0.018, length - 0.3, 12),
        new THREE.MeshBasicMaterial({ color }),
      );
      shaft.position.set(0, (length - 0.3) / 2, 0);
      arrowGroup.add(shaft);

      const cone = new THREE.Mesh(
        new THREE.ConeGeometry(0.06, 0.3, 16),
        new THREE.MeshBasicMaterial({ color }),
      );
      cone.position.set(0, length - 0.15, 0);
      arrowGroup.add(cone);

      const up = new THREE.Vector3(0, 1, 0);
      if (!dir.equals(up)) {
        const quaternion = new THREE.Quaternion().setFromUnitVectors(up, dir.clone().normalize());
        arrowGroup.setRotationFromQuaternion(quaternion);
      }
      return arrowGroup;
    };

    axesGroup.add(createAxisArrow(new THREE.Vector3(1, 0, 0), 0xef4444, 2.2));
    axesGroup.add(createAxisArrow(new THREE.Vector3(0, 1, 0), 0x10b981, 2.8));
    axesGroup.add(createAxisArrow(new THREE.Vector3(0, 0, 1), 0x38bdf8, 2.2));

    // 8. FLIGHT VECTOR ARROWS
    const vectorsGroup = new THREE.Group();
    scene.add(vectorsGroup);
    vectorsGroupRef.current = vectorsGroup;

    const sunDir = new THREE.Vector3(12, 8, 10).normalize();
    const sunArrow = createAxisArrow(sunDir, 0xfacc15, 3.2);
    vectorsGroup.add(sunArrow);

    const nadirDir = new THREE.Vector3(0, -1, 0);
    const nadirArrow = createAxisArrow(nadirDir, 0x06b6d4, 3.0);
    vectorsGroup.add(nadirArrow);

    // 9. ANIMATION & RENDER LOOP
    let animationFrameId: number;
    let prevTime = performance.now();
    const startTime = prevTime;

    const animate = () => {
      animationFrameId = requestAnimationFrame(animate);
      const now = performance.now();
      const delta = Math.min((now - prevTime) / 1000, 0.1);
      const time = (now - startTime) / 1000;
      prevTime = now;

      // Camera position from spherical coordinates
      const camX =
        cameraDistanceRef.current *
        Math.sin(cameraPhiRef.current) *
        Math.sin(cameraThetaRef.current);
      const camY = cameraDistanceRef.current * Math.cos(cameraPhiRef.current);
      const camZ =
        cameraDistanceRef.current *
        Math.sin(cameraPhiRef.current) *
        Math.cos(cameraThetaRef.current);

      camera.position.set(camX, camY, camZ);
      camera.lookAt(targetLookAtRef.current);

      // Smooth interpolation of satellite rotation towards target
      if (satelliteGroupRef.current) {
        if (!isPausedRef.current) {
          if (telemetryModeRef.current === 'DETUMBLING') {
            const rates = gyroRatesRef.current;
            targetRotationRef.current.x += rates[1] * delta * 0.05;
            targetRotationRef.current.y += rates[2] * delta * 0.05;
            targetRotationRef.current.z += rates[0] * delta * 0.05;
          }

          currentRotationRef.current.x = THREE.MathUtils.lerp(
            currentRotationRef.current.x,
            targetRotationRef.current.x,
            Math.min(delta * 5, 1),
          );
          currentRotationRef.current.y = THREE.MathUtils.lerp(
            currentRotationRef.current.y,
            targetRotationRef.current.y,
            Math.min(delta * 5, 1),
          );
          currentRotationRef.current.z = THREE.MathUtils.lerp(
            currentRotationRef.current.z,
            targetRotationRef.current.z,
            Math.min(delta * 5, 1),
          );

          satelliteGroupRef.current.rotation.copy(currentRotationRef.current);
        }
      }

      // RF transmission wave animation
      if (rfRingMeshRef.current) {
        if (rfPulseActiveRef.current || telemetryModeRef.current === 'TRANSMITTING') {
          const wavePhase = (time * 4) % 1;
          rfRingMeshRef.current.scale.set(1 + wavePhase * 2.5, 1 + wavePhase * 2.5, 1);
          (rfRingMeshRef.current.material as THREE.MeshBasicMaterial).opacity =
            (1 - wavePhase) * 0.8;
        } else {
          (rfRingMeshRef.current.material as THREE.MeshBasicMaterial).opacity = 0;
        }
      }

      // Starfield subtle slow rotation
      starPoints.rotation.y = time * 0.005;

      // Rendering: Stereoscopic Cardboard Dual Viewport vs Standard Viewport
      if (renderer) {
        const curW = container.clientWidth || 800;
        const curH = container.clientHeight || 450;

        if (isVrActiveRef.current && vrTypeRef.current === 'cardboard') {
          // Stereoscopic Cardboard Dual Viewport Rendering
          const stereoCamera = stereoCameraRef.current;
          stereoCamera.eyeSep = stereoIpdRef.current;
          stereoCamera.aspect = (curW * 0.5) / curH;
          stereoCamera.update(camera);

          const halfW = Math.floor(curW / 2);

          renderer.setScissorTest(true);

          // Left Eye Viewport
          renderer.setScissor(0, 0, halfW, curH);
          renderer.setViewport(0, 0, halfW, curH);
          renderer.render(scene, stereoCamera.cameraL);

          // Right Eye Viewport
          renderer.setScissor(halfW, 0, halfW, curH);
          renderer.setViewport(halfW, 0, halfW, curH);
          renderer.render(scene, stereoCamera.cameraR);

          renderer.setScissorTest(false);
        } else {
          // Standard Single Viewport
          renderer.setViewport(0, 0, curW, curH);
          renderer.render(scene, camera);
        }
      }
    };

    animate();

    // Resize observer
    const handleResize = () => {
      if (!container || !renderer || !camera) return;
      const newWidth = container.clientWidth;
      const newHeight = container.clientHeight || 450;
      camera.aspect = newWidth / newHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(newWidth, newHeight);
    };

    const resizeObserver = new ResizeObserver(() => handleResize());
    resizeObserver.observe(container);

    // Cleanup
    return () => {
      cancelAnimationFrame(animationFrameId);
      resizeObserver.disconnect();
      if (renderer) {
        renderer.dispose();
      }
      scene.clear();
    };
  }, []);

  // Mouse & Touch Drag Controls
  const handlePointerDown = (e: React.PointerEvent<HTMLCanvasElement>) => {
    isDraggingRef.current = true;
    previousMousePositionRef.current = { x: e.clientX, y: e.clientY };
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (!isDraggingRef.current) return;

    const deltaX = e.clientX - previousMousePositionRef.current.x;
    const deltaY = e.clientY - previousMousePositionRef.current.y;

    previousMousePositionRef.current = { x: e.clientX, y: e.clientY };

    cameraThetaRef.current -= deltaX * 0.008;
    cameraPhiRef.current = Math.max(
      0.08,
      Math.min(Math.PI - 0.08, cameraPhiRef.current - deltaY * 0.008),
    );
  };

  const handlePointerUp = (e: React.PointerEvent<HTMLCanvasElement>) => {
    isDraggingRef.current = false;
    try {
      (e.target as HTMLElement).releasePointerCapture(e.pointerId);
    } catch {
      // Ignored
    }
  };

  const handleWheel = (e: React.WheelEvent<HTMLCanvasElement>) => {
    e.preventDefault();
    const zoomDelta = e.deltaY * 0.003;
    cameraDistanceRef.current = Math.max(
      3.2,
      Math.min(14.0, cameraDistanceRef.current + zoomDelta),
    );
  };

  // Orientation telemetry values
  const rollDeg = telemetry.orientation?.roll ?? 0;
  const pitchDeg = telemetry.orientation?.pitch ?? 0;
  const yawDeg = telemetry.orientation?.yaw ?? 0;
  const angularSpeed =
    telemetry.orientation?.angularVelocity ??
    Math.sqrt(
      telemetry.gyroRates[0] * telemetry.gyroRates[0] +
        telemetry.gyroRates[1] * telemetry.gyroRates[1] +
        telemetry.gyroRates[2] * telemetry.gyroRates[2],
    );

  const adcsStatus = telemetry.orientation?.adcsStatus ?? 'STABILIZED';

  return (
    <div
      ref={containerRef}
      className={`relative overflow-hidden rounded-2xl border border-slate-800 bg-slate-950 shadow-2xl transition-all ${
        isVrActive
          ? 'fixed inset-0 z-50 rounded-none bg-black max-h-none h-screen w-screen'
          : isFullscreen
            ? 'fixed inset-4 z-50 rounded-2xl max-h-none'
            : className
      }`}
    >
      {/* 3D WebGL Canvas */}
      <canvas
        ref={canvasRef}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerCancel={handlePointerUp}
        onWheel={handleWheel}
        className={`w-full block touch-none cursor-grab active:cursor-grabbing ${
          isVrActive ? 'h-full' : 'h-[320px] sm:h-[420px] lg:h-[480px]'
        }`}
      />

      {/* CARDBOARD STEREOSCOPIC VR OVERLAY */}
      {isVrActive && vrType === 'cardboard' && (
        <div className="absolute inset-0 pointer-events-none flex flex-col justify-between">
          {/* Top VR Control Bar */}
          <div className="p-3 flex items-center justify-between pointer-events-auto bg-gradient-to-b from-black/90 to-transparent">
            <div className="flex items-center gap-2">
              <span className="px-2 py-1 rounded-lg bg-purple-500/20 text-purple-300 border border-purple-500/40 text-xs font-mono font-bold flex items-center gap-1.5 shadow-lg">
                <Glasses className="h-4 w-4" />
                <span>VR CARDBOARD STEREO</span>
              </span>
              <span className="text-[10px] text-slate-400 font-mono hidden sm:inline">
                {isXrSupported ? 'WebXR API ready' : 'Стереоскопический режим'}
              </span>
            </div>

            {/* IPD Adjuster and Exit */}
            <div className="flex items-center gap-2">
              <div className="flex items-center bg-slate-900/90 rounded-lg p-0.5 border border-slate-750 text-xs text-slate-300">
                <span className="px-2 text-[10px] text-slate-400 font-mono">
                  IPD: {(stereoIpd * 1000).toFixed(0)} мм
                </span>
                <button
                  type="button"
                  onClick={() => setStereoIpd((v) => Math.max(0.045, v - 0.002))}
                  title="Уменьшить межзрачковое расстояние"
                  className="px-2 py-0.5 hover:bg-slate-800 rounded font-bold"
                >
                  -
                </button>
                <button
                  type="button"
                  onClick={() => setStereoIpd((v) => Math.min(0.085, v + 0.002))}
                  title="Увеличить межзрачковое расстояние"
                  className="px-2 py-0.5 hover:bg-slate-800 rounded font-bold"
                >
                  +
                </button>
              </div>

              <button
                type="button"
                onClick={handleToggleVr}
                className="px-3 py-1.5 rounded-lg bg-rose-600/80 hover:bg-rose-500 text-white font-semibold text-xs transition-all flex items-center gap-1 shadow-lg"
              >
                <X className="h-4 w-4" />
                <span>Выйти из VR</span>
              </button>
            </div>
          </div>

          {/* Center Separation Divider Line with Cardboard Nose Cutout */}
          <div className="absolute inset-y-0 left-1/2 w-0.5 -translate-x-1/2 bg-slate-800/80 pointer-events-none flex flex-col items-center justify-center">
            <div className="w-8 h-8 rounded-full bg-slate-950 border border-slate-700/80 flex items-center justify-center text-xs text-slate-400 shadow-xl">
              <Eye className="h-4 w-4 text-purple-400 animate-pulse" />
            </div>
          </div>

          {/* Left & Right Optical Focal Crosshairs */}
          <div className="absolute left-1/4 top-1/2 -translate-x-1/2 -translate-y-1/2 w-4 h-4 rounded-full border border-cyan-400/30 flex items-center justify-center pointer-events-none">
            <div className="w-1 h-1 rounded-full bg-cyan-400/60" />
          </div>
          <div className="absolute left-3/4 top-1/2 -translate-x-1/2 -translate-y-1/2 w-4 h-4 rounded-full border border-cyan-400/30 flex items-center justify-center pointer-events-none">
            <div className="w-1 h-1 rounded-full bg-cyan-400/60" />
          </div>

          {/* Bottom Cardboard Hint */}
          <div className="p-3 text-center bg-gradient-to-t from-black/90 to-transparent pointer-events-auto">
            <p className="text-xs text-slate-300 font-medium flex items-center justify-center gap-2">
              <Smartphone className="h-4 w-4 text-purple-400 animate-bounce" />
              <span>
                Вставьте смартфон в VR-очки Cardboard. Используйте гироскоп устройства или касания
                для обзора 360°
              </span>
            </p>
          </div>
        </div>
      )}

      {/* STANDARD HUD (Hidden when in VR mode for clean immersion) */}
      {!isVrActive && (
        <>
          {/* Top HUD Header: Status, ADCS & Action Controls */}
          <div className="absolute top-3 left-3 right-3 flex flex-wrap items-center justify-between gap-2 pointer-events-none">
            {/* Left: Satellite identity & ADCS badge */}
            <div className="flex items-center gap-2 pointer-events-auto bg-slate-900/85 backdrop-blur-md px-3 py-1.5 rounded-xl border border-slate-750 shadow-lg text-xs">
              <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-cyan-500/20 text-cyan-400 border border-cyan-500/30">
                <Compass className="h-4 w-4 animate-spin-slow" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-bold text-white tracking-wide">ORION-3 [3U CubeSat]</span>
                  <span
                    className={`px-1.5 py-0.5 rounded text-[10px] font-mono font-semibold uppercase tracking-wider border ${
                      adcsStatus === 'DETUMBLING'
                        ? 'bg-rose-500/20 text-rose-300 border-rose-500/40 animate-pulse'
                        : adcsStatus === 'TARGET_TRACKING'
                          ? 'bg-purple-500/20 text-purple-300 border-purple-500/40'
                          : adcsStatus === 'SUN_POINTING'
                            ? 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                            : 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                    }`}
                  >
                    {adcsStatus === 'DETUMBLING'
                      ? 'B-Dot Detumbling'
                      : adcsStatus === 'TARGET_TRACKING'
                        ? 'Ground Tracking'
                        : adcsStatus === 'SUN_POINTING'
                          ? 'Sun Pointing'
                          : '3-Axis Stabilized'}
                  </span>
                </div>
                <div className="flex items-center gap-2 text-[10px] text-slate-400 font-mono">
                  <span>Режим: {telemetry.mode}</span>
                  <span>•</span>
                  <span>
                    |ω| = <strong className="text-cyan-300">{angularSpeed.toFixed(2)} °/с</strong>
                  </span>
                </div>
              </div>
            </div>

            {/* Right: Quick Action Controls */}
            <div className="flex items-center gap-1.5 pointer-events-auto bg-slate-900/85 backdrop-blur-md p-1 rounded-xl border border-slate-750 shadow-lg text-xs">
              {/* VR Mode Toggle Button (WebXR / Cardboard) */}
              <button
                type="button"
                onClick={handleToggleVr}
                title="Включить стереоскопический VR-режим (WebXR / Cardboard)"
                className="px-2.5 py-1 rounded-lg text-[11px] font-semibold transition-all flex items-center gap-1.5 bg-gradient-to-r from-purple-600/30 to-indigo-600/30 hover:from-purple-600/50 hover:to-indigo-600/50 text-purple-200 border border-purple-500/40 shadow-xs cursor-pointer group"
              >
                <Glasses className="h-3.5 w-3.5 text-purple-300 group-hover:scale-110 transition-transform" />
                <span>VR-режим</span>
                <span className="text-[9px] px-1 py-0.2 rounded bg-purple-950/80 text-purple-300 font-mono border border-purple-500/30">
                  Cardboard
                </span>
              </button>

              {/* Follow telemetry toggle */}
              <button
                type="button"
                onClick={() => setFollowTelemetry(!followTelemetry)}
                title={
                  followTelemetry ? 'Следование за телеметрией ВКЛ' : 'Ручной осмотр 3D-модели'
                }
                className={`px-2.5 py-1 rounded-lg text-[11px] font-medium transition-all flex items-center gap-1.5 ${
                  followTelemetry
                    ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 font-semibold'
                    : 'bg-slate-800 text-slate-400 hover:text-white'
                }`}
              >
                <Activity className="h-3 w-3" />
                <span className="hidden sm:inline">
                  {followTelemetry ? 'Телеметрия Live' : 'Свободный'}
                </span>
              </button>

              {/* Wings toggle */}
              <button
                type="button"
                onClick={() => setWingsDeployed(!wingsDeployed)}
                title="Развернуть / сложить солнечные крылья"
                className={`px-2.5 py-1 rounded-lg text-[11px] font-medium transition-all flex items-center gap-1.5 ${
                  wingsDeployed
                    ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40 font-semibold'
                    : 'bg-slate-800 text-slate-400 hover:text-white'
                }`}
              >
                <Zap className="h-3 w-3" />
                <span className="hidden sm:inline">
                  {wingsDeployed ? 'СБ: Крылья' : 'СБ: Корпус'}
                </span>
              </button>

              {/* Reset View */}
              <button
                type="button"
                onClick={resetOrientation}
                title="Сбросить ракурс камеры"
                className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
              >
                <RotateCcw className="h-3.5 w-3.5" />
              </button>

              {/* Fullscreen toggle */}
              <button
                type="button"
                onClick={() => setIsFullscreen(!isFullscreen)}
                title={isFullscreen ? 'Свернуть' : 'Развернуть во весь экран'}
                className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
              >
                {isFullscreen ? (
                  <Minimize2 className="h-3.5 w-3.5" />
                ) : (
                  <Maximize2 className="h-3.5 w-3.5" />
                )}
              </button>
            </div>
          </div>

          {/* Camera View Presets Bar (Bottom Left) */}
          <div className="absolute bottom-3 left-3 flex flex-wrap items-center gap-1.5 pointer-events-auto bg-slate-900/85 backdrop-blur-md p-1.5 rounded-xl border border-slate-750 shadow-lg text-[11px]">
            <span className="text-slate-400 px-1 font-mono text-[10px] hidden sm:inline">
              Камера:
            </span>
            {[
              { id: 'iso' as CameraPreset, label: '3D Обзор' },
              { id: 'nadir' as CameraPreset, label: 'Оптика (Nadir)' },
              { id: 'solar' as CameraPreset, label: 'СБ (+X)' },
              { id: 'zenith' as CameraPreset, label: 'Антенна' },
            ].map((preset) => (
              <button
                key={preset.id}
                type="button"
                onClick={() => applyCameraPreset(preset.id)}
                className={`px-2 py-0.5 rounded-md font-medium transition-all ${
                  activePreset === preset.id
                    ? 'bg-cyan-500 text-slate-950 font-bold'
                    : 'text-slate-400 hover:text-white hover:bg-slate-800'
                }`}
              >
                {preset.label}
              </button>
            ))}

            <div className="h-3 w-px bg-slate-700 mx-0.5" />

            {/* Toggle axes */}
            <button
              type="button"
              onClick={() => setShowAxes(!showAxes)}
              title="Связаные оси координат КубСата (X, Y, Z)"
              className={`p-1 rounded-md transition-colors ${
                showAxes ? 'text-cyan-400 bg-cyan-500/20' : 'text-slate-500 hover:text-slate-300'
              }`}
            >
              <Layers className="h-3.5 w-3.5" />
            </button>

            {/* Toggle flight vectors */}
            <button
              type="button"
              onClick={() => setShowVectors(!showVectors)}
              title="Векторы на Солнце и Землю (Nadir)"
              className={`p-1 rounded-md transition-colors ${
                showVectors
                  ? 'text-amber-400 bg-amber-500/20'
                  : 'text-slate-500 hover:text-slate-300'
              }`}
            >
              <Sun className="h-3.5 w-3.5" />
            </button>
          </div>

          {/* Real-time Euler Angles Readout (Bottom Right HUD) */}
          <div className="absolute bottom-3 right-3 pointer-events-auto bg-slate-900/90 backdrop-blur-md p-3 rounded-xl border border-slate-750 shadow-lg font-mono text-xs space-y-1.5 min-w-[200px]">
            <div className="flex items-center justify-between pb-1.5 border-b border-slate-800 text-[10px] text-slate-400">
              <span className="flex items-center gap-1 text-slate-300 font-bold">
                <Compass className="h-3 w-3 text-cyan-400" /> УГЛЫ ОРИЕНТАЦИИ (ADCS)
              </span>
              <span className="text-emerald-400">OK</span>
            </div>

            <div className="grid grid-cols-3 gap-2 text-center pt-0.5">
              {/* Roll */}
              <div className="bg-slate-950/80 p-1.5 rounded-lg border border-red-500/20">
                <div className="text-[9px] text-red-400 font-bold uppercase">Крен (X)</div>
                <div className="text-[12px] font-bold text-white mt-0.5">
                  {rollDeg > 0 ? `+${rollDeg.toFixed(1)}` : rollDeg.toFixed(1)}°
                </div>
                <div className="text-[8px] text-slate-400">ω={telemetry.gyroRates[0]}°/с</div>
              </div>

              {/* Pitch */}
              <div className="bg-slate-950/80 p-1.5 rounded-lg border border-emerald-500/20">
                <div className="text-[9px] text-emerald-400 font-bold uppercase">Тангаж (Y)</div>
                <div className="text-[12px] font-bold text-white mt-0.5">
                  {pitchDeg > 0 ? `+${pitchDeg.toFixed(1)}` : pitchDeg.toFixed(1)}°
                </div>
                <div className="text-[8px] text-slate-400">ω={telemetry.gyroRates[1]}°/с</div>
              </div>

              {/* Yaw */}
              <div className="bg-slate-950/80 p-1.5 rounded-lg border border-sky-500/20">
                <div className="text-[9px] text-sky-400 font-bold uppercase">Рыскание (Z)</div>
                <div className="text-[12px] font-bold text-white mt-0.5">{yawDeg.toFixed(1)}°</div>
                <div className="text-[8px] text-slate-400">ω={telemetry.gyroRates[2]}°/с</div>
              </div>
            </div>

            {/* Legend / Info guide */}
            <div className="flex items-center justify-between pt-1 text-[9px] text-slate-400">
              <span className="flex items-center gap-1">
                <span className="h-1.5 w-1.5 rounded-full bg-red-500 inline-block" /> Roll
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 inline-block ml-1" /> Pitch
                <span className="h-1.5 w-1.5 rounded-full bg-sky-500 inline-block ml-1" /> Yaw
              </span>
              <span className="text-amber-400 flex items-center gap-0.5">
                <Sun className="h-2.5 w-2.5" /> Динамические тени
              </span>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

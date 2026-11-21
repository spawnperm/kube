/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useRef, useState, useMemo, useCallback } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import {
  Globe,
  Radio,
  Eye,
  Compass,
  Maximize2,
  Minimize2,
  Navigation,
  CheckCircle2,
  Signal,
  ZoomIn,
  ZoomOut,
  RotateCw,
  RotateCcw,
  RefreshCw,
  Play,
  Pause,
  Layers,
  ArrowUpRight,
  Focus,
  Crosshair,
  Shield,
  Zap,
} from 'lucide-react';
import type { TelemetryPacket } from '../../types';
import { GROUND_STATIONS, type GroundStation } from '../../services/telemetrySimulator';

interface CubeSat3DOrbitVisualizerProps {
  telemetry: TelemetryPacket;
  isPaused?: boolean;
  className?: string;
}

type CameraPreset = 'sat_close' | 'global' | 'nadir' | 'ground' | 'edge';
type CameraFocusTarget = 'satellite' | 'earth';

const R_EARTH_KM = 6371;
const GLOBE_RADIUS = 10; // 3D units for Earth radius
const SUN_DISTANCE = 85;

// Inclination & RAAN parameters for Sun-Synchronous Orbit (SSO)
const ORBIT_INCLINATION_RAD = (97.4 * Math.PI) / 180;
const ORBIT_RAAN_RAD = (45 * Math.PI) / 180;

/**
 * Creates a procedural high-resolution texture of planet Earth
 * Includes oceans, continents, lat/lon grid, equator and prime meridian
 */
function createProceduralEarthTexture(): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 2048;
  canvas.height = 1024;
  const ctx = canvas.getContext('2d');

  if (!ctx) {
    return new THREE.CanvasTexture(canvas);
  }

  const w = canvas.width;
  const h = canvas.height;

  // 1. Deep space ocean gradient
  const oceanGrad = ctx.createLinearGradient(0, 0, 0, h);
  oceanGrad.addColorStop(0, '#040d1a');
  oceanGrad.addColorStop(0.3, '#06162d');
  oceanGrad.addColorStop(0.5, '#081e3d');
  oceanGrad.addColorStop(0.7, '#06162d');
  oceanGrad.addColorStop(1, '#040d1a');
  ctx.fillStyle = oceanGrad;
  ctx.fillRect(0, 0, w, h);

  // Helper coordinate mapper
  const toX = (lon: number) => ((lon + 180) / 360) * w;
  const toY = (lat: number) => ((90 - lat) / 180) * h;

  // 2. Graticule Lat/Lon Grid lines
  ctx.strokeStyle = 'rgba(56, 189, 248, 0.08)';
  ctx.lineWidth = 1;
  // Meridians every 15 deg
  for (let lon = -180; lon <= 180; lon += 15) {
    const x = toX(lon);
    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.lineTo(x, h);
    ctx.stroke();
  }
  // Parallels every 15 deg
  for (let lat = -75; lat <= 75; lat += 15) {
    const y = toY(lat);
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(w, y);
    ctx.stroke();
  }

  // Equator highlight (cyan line)
  ctx.strokeStyle = 'rgba(56, 189, 248, 0.35)';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(0, toY(0));
  ctx.lineTo(w, toY(0));
  ctx.stroke();

  // Prime Meridian highlight
  ctx.strokeStyle = 'rgba(56, 189, 248, 0.25)';
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.moveTo(toX(0), 0);
  ctx.lineTo(toX(0), h);
  ctx.stroke();

  // 3. Continent Polygons (Eurasia, Africa, Americas, Australia, Antarctica)
  ctx.fillStyle = '#0f2438';
  ctx.strokeStyle = 'rgba(56, 189, 248, 0.4)';
  ctx.lineWidth = 1.5;

  const drawPolygon = (points: [number, number][]) => {
    if (points.length < 2) return;
    ctx.beginPath();
    ctx.moveTo(toX(points[0][1]), toY(points[0][0]));
    for (let i = 1; i < points.length; i++) {
      ctx.lineTo(toX(points[i][1]), toY(points[i][0]));
    }
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
  };

  // Eurasia simplified landmass
  drawPolygon([
    [70, 20],
    [72, 60],
    [70, 100],
    [65, 140],
    [60, 170],
    [50, 150],
    [35, 130],
    [25, 120],
    [10, 105],
    [5, 100],
    [15, 80],
    [25, 65],
    [12, 45],
    [30, 32],
    [42, 28],
    [40, -5],
    [50, -5],
    [60, 5],
    [65, 15],
    [70, 20],
  ]);

  // Russia & Siberia northern coast details
  drawPolygon([
    [65, 30],
    [68, 45],
    [73, 70],
    [76, 95],
    [72, 130],
    [65, 175],
    [58, 160],
    [53, 142],
    [50, 130],
    [52, 90],
    [55, 60],
    [58, 40],
    [65, 30],
  ]);

  // Africa simplified landmass
  drawPolygon([
    [35, -10],
    [37, 10],
    [32, 32],
    [12, 44],
    [10, 51],
    [-5, 40],
    [-25, 33],
    [-34, 25],
    [-34, 18],
    [-20, 12],
    [-5, 10],
    [5, 2],
    [5, -10],
    [15, -17],
    [30, -10],
    [35, -10],
  ]);

  // North America
  drawPolygon([
    [72, -165],
    [70, -130],
    [60, -80],
    [50, -60],
    [45, -65],
    [30, -80],
    [25, -80],
    [18, -95],
    [15, -90],
    [20, -105],
    [30, -115],
    [40, -125],
    [50, -125],
    [60, -140],
    [65, -168],
    [72, -165],
  ]);

  // South America
  drawPolygon([
    [12, -75],
    [10, -62],
    [0, -50],
    [-10, -35],
    [-22, -41],
    [-35, -55],
    [-55, -67],
    [-52, -75],
    [-35, -73],
    [-15, -75],
    [-5, -80],
    [5, -78],
    [12, -75],
  ]);

  // Australia
  drawPolygon([
    [-12, 130],
    [-15, 136],
    [-12, 142],
    [-22, 150],
    [-33, 152],
    [-38, 145],
    [-35, 136],
    [-32, 115],
    [-20, 114],
    [-15, 125],
    [-12, 130],
  ]);

  // Antarctica band at bottom
  ctx.fillRect(0, toY(-65), w, h - toY(-65));

  // 4. Ground stations and major tracking locations
  const trackingPoints: [number, number, string][] = [
    [58.01, 56.25, 'Пермь'],
    [55.75, 37.61, 'Москва'],
    [51.81, 128.33, 'Восточный'],
    [45.96, 63.3, 'Байконур'],
    [55.01, 82.93, 'Новосибирск'],
  ];

  trackingPoints.forEach(([lat, lon]) => {
    const x = toX(lon);
    const y = toY(lat);
    ctx.fillStyle = '#10b981';
    ctx.beginPath();
    ctx.arc(x, y, 3.5, 0, Math.PI * 2);
    ctx.fill();

    ctx.strokeStyle = 'rgba(16, 185, 129, 0.5)';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.arc(x, y, 8, 0, Math.PI * 2);
    ctx.stroke();
  });

  const texture = new THREE.CanvasTexture(canvas);
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.ClampToEdgeWrapping;
  return texture;
}

/**
 * Creates atmospheric glow shader material
 */
function createAtmosphereMaterial(): THREE.ShaderMaterial {
  return new THREE.ShaderMaterial({
    vertexShader: `
      varying vec3 vNormal;
      void main() {
        vNormal = normalize(normalMatrix * normal);
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
      }
    `,
    fragmentShader: `
      varying vec3 vNormal;
      void main() {
        float intensity = pow(0.65 - dot(vNormal, vec3(0.0, 0.0, 1.0)), 2.5);
        gl_FragColor = vec4(0.22, 0.74, 0.98, 1.0) * intensity * 1.6;
      }
    `,
    blending: THREE.AdditiveBlending,
    side: THREE.BackSide,
    transparent: true,
  });
}

/**
 * Creates dynamic text sprite for velocity readout in 3D
 */
function createVelocityTextSprite(text: string): THREE.Sprite {
  const canvas = document.createElement('canvas');
  canvas.width = 256;
  canvas.height = 64;
  const ctx = canvas.getContext('2d');
  if (ctx) {
    ctx.fillStyle = 'rgba(2, 6, 23, 0.85)';
    ctx.roundRect(4, 4, 248, 56, 12);
    ctx.fill();
    ctx.strokeStyle = '#10b981';
    ctx.lineWidth = 2;
    ctx.stroke();

    ctx.fillStyle = '#34d399';
    ctx.font = 'bold 22px monospace';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(text, 128, 32);
  }

  const texture = new THREE.CanvasTexture(canvas);
  const spriteMat = new THREE.SpriteMaterial({
    map: texture,
    transparent: true,
    depthTest: false,
  });
  const sprite = new THREE.Sprite(spriteMat);
  sprite.scale.set(2.4, 0.6, 1);
  return sprite;
}

/**
 * Creates 3D translucent spherical latitude and longitude grid (graticule)
 * around Earth with highlighted Equator, Prime Meridian, parallels and meridian labels
 */
function createLatLonGridGroup(radius: number): THREE.Group {
  const gridGroup = new THREE.Group();

  // Subtle translucent coordinate spherical wireframe mesh
  const sphereGeo = new THREE.SphereGeometry(radius, 48, 24);
  const sphereMat = new THREE.MeshBasicMaterial({
    color: 0x0284c7,
    wireframe: true,
    transparent: true,
    opacity: 0.12,
    depthWrite: false,
  });
  const shell = new THREE.Mesh(sphereGeo, sphereMat);
  gridGroup.add(shell);

  const segments = 96;

  // 1. Latitude Parallels (every 15 degrees from -75 to +75)
  const latitudes = [-75, -60, -45, -30, -15, 0, 15, 30, 45, 60, 75];
  latitudes.forEach((latDeg) => {
    const phi = (latDeg * Math.PI) / 180;
    const y = radius * Math.sin(phi);
    const rParallel = radius * Math.cos(phi);

    const points: THREE.Vector3[] = [];
    for (let i = 0; i <= segments; i++) {
      const theta = (i / segments) * Math.PI * 2;
      points.push(new THREE.Vector3(rParallel * Math.sin(theta), y, rParallel * Math.cos(theta)));
    }

    const isEquator = latDeg === 0;
    const isSpecial = Math.abs(latDeg) === 45 || Math.abs(latDeg) === 30;

    const lineGeo = new THREE.BufferGeometry().setFromPoints(points);
    const lineMat = new THREE.LineBasicMaterial({
      color: isEquator ? 0x38bdf8 : isSpecial ? 0x0ea5e9 : 0x0369a1,
      transparent: true,
      opacity: isEquator ? 0.85 : isSpecial ? 0.45 : 0.28,
      linewidth: isEquator ? 2.5 : 1,
      depthWrite: false,
    });
    const line = new THREE.LineLoop(lineGeo, lineMat);
    gridGroup.add(line);
  });

  // 2. Longitude Meridians (every 15 degrees from -180 to 180)
  for (let lonDeg = -180; lonDeg < 180; lonDeg += 15) {
    const isPrime = lonDeg === 0;
    const isAntiMeridian = Math.abs(lonDeg) === 180;
    const isMajor = lonDeg % 45 === 0;

    const points: THREE.Vector3[] = [];
    const theta = (lonDeg * Math.PI) / 180;

    for (let i = 0; i <= segments; i++) {
      const phi = -Math.PI / 2 + (i / segments) * Math.PI;
      const x = radius * Math.cos(phi) * Math.sin(theta);
      const y = radius * Math.sin(phi);
      const z = radius * Math.cos(phi) * Math.cos(theta);
      points.push(new THREE.Vector3(x, y, z));
    }

    const lineGeo = new THREE.BufferGeometry().setFromPoints(points);
    const lineMat = new THREE.LineBasicMaterial({
      color: isPrime ? 0x10b981 : isAntiMeridian ? 0x38bdf8 : isMajor ? 0x0ea5e9 : 0x0284c7,
      transparent: true,
      opacity: isPrime ? 0.85 : isAntiMeridian ? 0.65 : isMajor ? 0.4 : 0.22,
      linewidth: isPrime ? 2 : 1,
      depthWrite: false,
    });
    const line = new THREE.Line(lineGeo, lineMat);
    gridGroup.add(line);
  }

  // 3. Coordinate tick markers along Equator (30 deg intervals)
  const lonLabels = [
    { lon: 0, text: '0° Гринвич' },
    { lon: 30, text: '30°E' },
    { lon: 60, text: '60°E' },
    { lon: 90, text: '90°E' },
    { lon: 120, text: '120°E' },
    { lon: 150, text: '150°E' },
    { lon: 180, text: '180°' },
    { lon: -150, text: '150°W' },
    { lon: -120, text: '120°W' },
    { lon: -90, text: '90°W' },
    { lon: -60, text: '60°W' },
    { lon: -30, text: '30°W' },
  ];

  lonLabels.forEach(({ lon, text }) => {
    const theta = (lon * Math.PI) / 180;
    const pos = new THREE.Vector3(
      radius * 1.01 * Math.sin(theta),
      0,
      radius * 1.01 * Math.cos(theta),
    );

    const canvas = document.createElement('canvas');
    canvas.width = 128;
    canvas.height = 36;
    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.fillStyle = 'rgba(2, 6, 23, 0.75)';
      ctx.roundRect(2, 2, 124, 32, 6);
      ctx.fill();
      ctx.strokeStyle = lon === 0 ? '#10b981' : '#38bdf8';
      ctx.lineWidth = 1;
      ctx.stroke();

      ctx.fillStyle = lon === 0 ? '#34d399' : '#7dd3fc';
      ctx.font = 'bold 15px monospace';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(text, 64, 18);
    }
    const tex = new THREE.CanvasTexture(canvas);
    const spriteMat = new THREE.SpriteMaterial({ map: tex, transparent: true, depthTest: false });
    const sprite = new THREE.Sprite(spriteMat);
    sprite.position.copy(pos);
    sprite.scale.set(1.4, 0.4, 1);
    gridGroup.add(sprite);
  });

  return gridGroup;
}

export const CubeSat3DOrbitVisualizer: React.FC<CubeSat3DOrbitVisualizerProps> = ({
  telemetry,
  isPaused = false,
  className = '',
}) => {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const sceneRef = useRef<THREE.Scene | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const controlsRef = useRef<OrbitControls | null>(null);

  // Mesh & Object refs
  const earthMeshRef = useRef<THREE.Mesh | null>(null);
  const latLonGridGroupRef = useRef<THREE.Group | null>(null);
  const satelliteGroupRef = useRef<THREE.Group | null>(null);
  const nadirLineRef = useRef<THREE.Line | null>(null);
  const footprintMeshRef = useRef<THREE.Mesh | null>(null);
  const radioBeamLinesRef = useRef<THREE.Line[]>([]);
  const beaconSpriteRef = useRef<THREE.Sprite | null>(null);
  const orbitRingRef = useRef<THREE.LineLoop | null>(null);
  const sunLightRef = useRef<THREE.DirectionalLight | null>(null);
  const trailLineRef = useRef<THREE.Line | null>(null);
  const trailPointsRef = useRef<THREE.Vector3[]>([]);

  // Velocity Vector visual elements refs
  const velArrowRef = useRef<THREE.ArrowHelper | null>(null);
  const velSpriteRef = useRef<THREE.Sprite | null>(null);
  const velDirectionRef = useRef<THREE.Vector3>(new THREE.Vector3(0, 1, 0));
  const sunArrowRef = useRef<THREE.ArrowHelper | null>(null);

  // Component UI State
  const [cameraPreset, setCameraPreset] = useState<CameraPreset>('global');
  const [focusTarget, setFocusTarget] = useState<CameraFocusTarget>('earth');
  const [isAutoRotate, setIsAutoRotate] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showLatLonGrid, setShowLatLonGrid] = useState(true);
  const [showOrbitRing, setShowOrbitRing] = useState(true);
  const [showTrail, setShowTrail] = useState(true);
  const [showFootprint, setShowFootprint] = useState(true);
  const [showVelVector, setShowVelVector] = useState(true);
  const [showSunVector, setShowSunVector] = useState(true);
  const [activeStation, setActiveStation] = useState<GroundStation | null>(null);
  const [activeLinkDistanceKm, setActiveLinkDistanceKm] = useState<number | null>(null);
  const [lastVelocityVector, setLastVelocityVector] = useState<{ x: number; y: number; z: number }>(
    {
      x: 0,
      y: 1,
      z: 0,
    },
  );

  // Normalized orbital radius
  const satAltitudeKm = telemetry.altitudeKm || 524.8;
  const satRadiusNorm = GLOBE_RADIUS * (1 + satAltitudeKm / R_EARTH_KM);

  // Convert lat/lon/alt to 3D Cartesian coordinates
  const latLonToVector3 = useCallback(
    (latDeg: number, lonDeg: number, radius: number): THREE.Vector3 => {
      const phi = (latDeg * Math.PI) / 180;
      const theta = (lonDeg * Math.PI) / 180;

      // Earth Y-axis aligned
      const x = radius * Math.cos(phi) * Math.sin(theta);
      const y = radius * Math.sin(phi);
      const z = radius * Math.cos(phi) * Math.cos(theta);
      return new THREE.Vector3(x, y, z);
    },
    [],
  );

  // Ground station distances & active LOS calculation
  useEffect(() => {
    let closestStation: GroundStation | null = null;
    let minDistance = Infinity;

    GROUND_STATIONS.forEach((gs) => {
      const dLat = (telemetry.latitude - gs.lat) * (Math.PI / 180);
      const dLon = (telemetry.longitude - gs.lon) * (Math.PI / 180);
      const a =
        Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos(gs.lat * (Math.PI / 180)) *
          Math.cos(telemetry.latitude * (Math.PI / 180)) *
          Math.sin(dLon / 2) *
          Math.sin(dLon / 2);
      const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
      const surfaceDistanceKm = R_EARTH_KM * c;
      const slantRangeKm = Math.sqrt(
        surfaceDistanceKm * surfaceDistanceKm + satAltitudeKm * satAltitudeKm,
      );

      if (surfaceDistanceKm <= 1400 && slantRangeKm < minDistance) {
        minDistance = slantRangeKm;
        closestStation = gs;
      }
    });

    setActiveStation(closestStation);
    setActiveLinkDistanceKm(closestStation ? Math.round(minDistance) : null);
  }, [telemetry.latitude, telemetry.longitude, satAltitudeKm]);

  // Main Three.js Scene Setup & Render Loop
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    // 1. Scene
    const scene = new THREE.Scene();
    sceneRef.current = scene;
    scene.background = new THREE.Color(0x020617);

    // 2. Camera
    const camera = new THREE.PerspectiveCamera(
      45,
      container.clientWidth / container.clientHeight,
      0.1,
      2000,
    );
    camera.position.set(0, 16, 28);
    cameraRef.current = camera;

    // 3. Renderer
    const renderer = new THREE.WebGLRenderer({
      antialias: true,
      alpha: true,
      powerPreference: 'high-performance',
    });
    renderer.setSize(container.clientWidth, container.clientHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.2;
    rendererRef.current = renderer;
    container.appendChild(renderer.domElement);

    // 4. OrbitControls: enable rotating, zooming, damping
    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.08;
    controls.screenSpacePanning = true;
    controls.minDistance = 1.0;
    controls.maxDistance = GLOBE_RADIUS * 7.5;
    controls.maxPolarAngle = Math.PI - 0.02;
    controls.autoRotate = false;
    controls.autoRotateSpeed = 1.2;
    controlsRef.current = controls;

    // 5. Lighting
    const ambientLight = new THREE.AmbientLight(0x1e293b, 1.2);
    scene.add(ambientLight);

    const sunLight = new THREE.DirectionalLight(0xffffff, 2.8);
    sunLight.position.set(SUN_DISTANCE, 20, 30);
    scene.add(sunLight);
    sunLightRef.current = sunLight;

    // Sun flare sprite
    const sunCanvas = document.createElement('canvas');
    sunCanvas.width = 128;
    sunCanvas.height = 128;
    const sunCtx = sunCanvas.getContext('2d');
    if (sunCtx) {
      const grad = sunCtx.createRadialGradient(64, 64, 0, 64, 64, 64);
      grad.addColorStop(0, 'rgba(255, 255, 230, 1)');
      grad.addColorStop(0.3, 'rgba(253, 224, 71, 0.6)');
      grad.addColorStop(1, 'rgba(253, 224, 71, 0)');
      sunCtx.fillStyle = grad;
      sunCtx.fillRect(0, 0, 128, 128);
    }
    const sunTexture = new THREE.CanvasTexture(sunCanvas);
    const sunSpriteMat = new THREE.SpriteMaterial({
      map: sunTexture,
      blending: THREE.AdditiveBlending,
      transparent: true,
    });
    const sunSprite = new THREE.Sprite(sunSpriteMat);
    sunSprite.position.copy(sunLight.position);
    sunSprite.scale.set(24, 24, 1);
    scene.add(sunSprite);

    // 6. Deep Space Starfield
    const starGeometry = new THREE.BufferGeometry();
    const starCount = 2000;
    const starPositions = new Float32Array(starCount * 3);
    for (let i = 0; i < starCount * 3; i += 3) {
      const r = 200 + Math.random() * 300;
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(2 * Math.random() - 1);
      starPositions[i] = r * Math.sin(phi) * Math.cos(theta);
      starPositions[i + 1] = r * Math.sin(phi) * Math.sin(theta);
      starPositions[i + 2] = r * Math.cos(phi);
    }
    starGeometry.setAttribute('position', new THREE.BufferAttribute(starPositions, 3));
    const starMaterial = new THREE.PointsMaterial({
      color: 0xffffff,
      size: 1.4,
      transparent: true,
      opacity: 0.85,
    });
    const starfield = new THREE.Points(starGeometry, starMaterial);
    scene.add(starfield);

    // 7. Planet Earth Mesh
    const earthGeo = new THREE.SphereGeometry(GLOBE_RADIUS, 64, 64);
    const earthTexture = createProceduralEarthTexture();
    const earthMat = new THREE.MeshStandardMaterial({
      map: earthTexture,
      roughness: 0.65,
      metalness: 0.15,
      bumpScale: 0.05,
    });
    const earthMesh = new THREE.Mesh(earthGeo, earthMat);
    scene.add(earthMesh);
    earthMeshRef.current = earthMesh;

    // Translucent Lat/Lon Coordinate Grid around Earth
    const latLonGridGroup = createLatLonGridGroup(GLOBE_RADIUS * 1.006);
    scene.add(latLonGridGroup);
    latLonGridGroupRef.current = latLonGridGroup;

    // Atmospheric outer glow
    const atmosGeo = new THREE.SphereGeometry(GLOBE_RADIUS * 1.055, 64, 64);
    const atmosMat = createAtmosphereMaterial();
    const atmosMesh = new THREE.Mesh(atmosGeo, atmosMat);
    scene.add(atmosMesh);

    // 8. Ground Stations Markers on Earth
    const groundStationsGroup = new THREE.Group();
    GROUND_STATIONS.forEach((station) => {
      const gsPos = latLonToVector3(station.lat, station.lon, GLOBE_RADIUS * 1.002);
      // Dish antenna pin base
      const pinGeo = new THREE.CylinderGeometry(0.04, 0.08, 0.45, 12);
      const pinMat = new THREE.MeshStandardMaterial({
        color: 0x10b981,
        emissive: 0x059669,
        emissiveIntensity: 0.6,
      });
      const pinMesh = new THREE.Mesh(pinGeo, pinMat);
      pinMesh.position.copy(gsPos);
      pinMesh.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), gsPos.clone().normalize());

      // Pulse ring on ground station
      const ringGeo = new THREE.RingGeometry(0.12, 0.28, 16);
      const ringMat = new THREE.MeshBasicMaterial({
        color: 0x34d399,
        side: THREE.DoubleSide,
        transparent: true,
        opacity: 0.8,
      });
      const ringMesh = new THREE.Mesh(ringGeo, ringMat);
      ringMesh.position.copy(gsPos.clone().multiplyScalar(1.002));
      ringMesh.quaternion.setFromUnitVectors(new THREE.Vector3(0, 0, 1), gsPos.clone().normalize());

      groundStationsGroup.add(pinMesh);
      groundStationsGroup.add(ringMesh);
    });
    scene.add(groundStationsGroup);

    // 9. 3D Keplerian Orbit Ring (97.4 deg Sun-Synchronous Inclination)
    const orbitPoints: THREE.Vector3[] = [];
    const orbitSegments = 144;

    // Basis vectors of the orbital plane
    const P = new THREE.Vector3(Math.cos(ORBIT_RAAN_RAD), 0, Math.sin(ORBIT_RAAN_RAD));
    const Q = new THREE.Vector3(
      -Math.sin(ORBIT_RAAN_RAD) * Math.cos(ORBIT_INCLINATION_RAD),
      Math.sin(ORBIT_INCLINATION_RAD),
      Math.cos(ORBIT_RAAN_RAD) * Math.cos(ORBIT_INCLINATION_RAD),
    );

    for (let i = 0; i <= orbitSegments; i++) {
      const u = (i / orbitSegments) * Math.PI * 2;
      const pt = new THREE.Vector3()
        .addScaledVector(P, satRadiusNorm * Math.cos(u))
        .addScaledVector(Q, satRadiusNorm * Math.sin(u));
      orbitPoints.push(pt);
    }

    const orbitLineGeo = new THREE.BufferGeometry().setFromPoints(orbitPoints);
    const orbitLineMat = new THREE.LineBasicMaterial({
      color: 0x38bdf8,
      transparent: true,
      opacity: 0.6,
      linewidth: 2,
    });
    const orbitRing = new THREE.LineLoop(orbitLineGeo, orbitLineMat);
    scene.add(orbitRing);
    orbitRingRef.current = orbitRing;

    // 10. CubeSat Spacecraft 3D Model in Orbit
    const satGroup = new THREE.Group();

    // 3U Body Chassis (0.3 x 0.8 x 0.3 units)
    const bodyGeo = new THREE.BoxGeometry(0.3, 0.8, 0.3);
    const bodyMat = new THREE.MeshStandardMaterial({
      color: 0x1e293b,
      roughness: 0.3,
      metalness: 0.85,
    });
    const bodyMesh = new THREE.Mesh(bodyGeo, bodyMat);
    satGroup.add(bodyMesh);

    // Gold Multi-Layer Insulation (MLI) panels on sides
    const mliGeo = new THREE.BoxGeometry(0.31, 0.76, 0.29);
    const mliMat = new THREE.MeshStandardMaterial({
      color: 0xd97706,
      roughness: 0.2,
      metalness: 0.9,
    });
    const mliMesh = new THREE.Mesh(mliGeo, mliMat);
    satGroup.add(mliMesh);

    // Deployable Solar Panel Wings (Left & Right)
    const wingGeo = new THREE.BoxGeometry(0.8, 0.7, 0.02);
    const wingMat = new THREE.MeshStandardMaterial({
      color: 0x0369a1,
      roughness: 0.15,
      metalness: 0.95,
      emissive: 0x0284c7,
      emissiveIntensity: 0.2,
    });

    const leftWing = new THREE.Mesh(wingGeo, wingMat);
    leftWing.position.set(-0.55, 0, 0);
    satGroup.add(leftWing);

    const rightWing = new THREE.Mesh(wingGeo, wingMat);
    rightWing.position.set(0.55, 0, 0);
    satGroup.add(rightWing);

    // Antenna whiskers
    const antGeo = new THREE.CylinderGeometry(0.008, 0.008, 0.6, 6);
    const antMat = new THREE.MeshStandardMaterial({ color: 0x94a3b8, metalness: 0.9 });
    const ant1 = new THREE.Mesh(antGeo, antMat);
    ant1.position.set(0.12, -0.65, 0.12);
    ant1.rotation.x = Math.PI / 6;
    satGroup.add(ant1);

    // Beacon Pulse Halo
    const beaconCanvas = document.createElement('canvas');
    beaconCanvas.width = 64;
    beaconCanvas.height = 64;
    const bCtx = beaconCanvas.getContext('2d');
    if (bCtx) {
      const bGrad = bCtx.createRadialGradient(32, 32, 0, 32, 32, 32);
      bGrad.addColorStop(0, 'rgba(56, 189, 248, 1)');
      bGrad.addColorStop(0.4, 'rgba(56, 189, 248, 0.5)');
      bGrad.addColorStop(1, 'rgba(56, 189, 248, 0)');
      bCtx.fillStyle = bGrad;
      bCtx.fillRect(0, 0, 64, 64);
    }
    const beaconTexture = new THREE.CanvasTexture(beaconCanvas);
    const beaconMat = new THREE.SpriteMaterial({
      map: beaconTexture,
      blending: THREE.AdditiveBlending,
      transparent: true,
      opacity: 0.9,
    });
    const beaconSprite = new THREE.Sprite(beaconMat);
    beaconSprite.scale.set(1.5, 1.5, 1);
    satGroup.add(beaconSprite);
    beaconSpriteRef.current = beaconSprite;

    scene.add(satGroup);
    satelliteGroupRef.current = satGroup;

    // 11. Nadir Line (from Satellite down to Sub-Satellite Point on Earth)
    const nadirLineGeo = new THREE.BufferGeometry().setFromPoints([
      new THREE.Vector3(0, 0, 0),
      new THREE.Vector3(0, 0, 0),
    ]);
    const nadirLineMat = new THREE.LineDashedMaterial({
      color: 0x38bdf8,
      dashSize: 0.2,
      gapSize: 0.15,
      transparent: true,
      opacity: 0.7,
    });
    const nadirLine = new THREE.Line(nadirLineGeo, nadirLineMat);
    scene.add(nadirLine);
    nadirLineRef.current = nadirLine;

    // 12. Radio Footprint Projection Disk on Earth Surface
    const footprintGeo = new THREE.RingGeometry(0.1, 1.8, 32);
    const footprintMat = new THREE.MeshBasicMaterial({
      color: 0x38bdf8,
      transparent: true,
      opacity: 0.22,
      side: THREE.DoubleSide,
    });
    const footprintMesh = new THREE.Mesh(footprintGeo, footprintMat);
    scene.add(footprintMesh);
    footprintMeshRef.current = footprintMesh;

    // 13. Active Radio Downlink Beam to Ground Station
    const beamLineGeo = new THREE.BufferGeometry().setFromPoints([
      new THREE.Vector3(0, 0, 0),
      new THREE.Vector3(0, 0, 0),
    ]);
    const beamLineMat = new THREE.LineBasicMaterial({
      color: 0x34d399,
      linewidth: 3,
      transparent: true,
      opacity: 0.85,
    });
    const beamLine = new THREE.Line(beamLineGeo, beamLineMat);
    scene.add(beamLine);
    radioBeamLinesRef.current = [beamLine];

    // 14. Orbit Historical Trail
    const trailGeo = new THREE.BufferGeometry();
    const trailMat = new THREE.LineBasicMaterial({
      color: 0x06b6d4,
      transparent: true,
      opacity: 0.85,
      linewidth: 3,
    });
    const trailLine = new THREE.Line(trailGeo, trailMat);
    scene.add(trailLine);
    trailLineRef.current = trailLine;

    // 15. DYNAMIC VELOCITY VECTOR ARROW (Исходящая из спутника стрелка текущей скорости)
    // Emerald green arrow strictly originating from the CubeSat model position
    const velArrow = new THREE.ArrowHelper(
      new THREE.Vector3(0, 1, 0),
      new THREE.Vector3(0, 0, 0),
      2.6,
      0x10b981, // Emerald neon
      0.65, // headLength
      0.35, // headWidth
    );
    scene.add(velArrow);
    velArrowRef.current = velArrow;

    // 3D Tag Sprite showing velocity readout near arrow tip
    const velSprite = createVelocityTextSprite(`V = ${telemetry.velocityKms.toFixed(2)} км/с`);
    scene.add(velSprite);
    velSpriteRef.current = velSprite;

    // Sun Vector (Yellow arrow)
    const sunArrow = new THREE.ArrowHelper(
      new THREE.Vector3(1, 0, 0),
      new THREE.Vector3(0, 0, 0),
      1.8,
      0xeab308,
      0.4,
      0.2,
    );
    scene.add(sunArrow);
    sunArrowRef.current = sunArrow;

    // 16. Animation Render Loop
    let animId: number;
    const clock = new THREE.Clock();

    const animate = () => {
      animId = requestAnimationFrame(animate);
      const elapsedTime = clock.getElapsedTime();

      // Earth subtle rotation and geographic coordinate grid sync
      if (!isPaused && earthMeshRef.current) {
        earthMeshRef.current.rotation.y = elapsedTime * 0.02;
        if (latLonGridGroupRef.current) {
          latLonGridGroupRef.current.rotation.y = earthMeshRef.current.rotation.y;
        }
      }

      // Satellite position from telemetry
      const satPos = latLonToVector3(telemetry.latitude, telemetry.longitude, satRadiusNorm);
      const nadirPos = latLonToVector3(
        telemetry.latitude,
        telemetry.longitude,
        GLOBE_RADIUS * 1.002,
      );

      // Update Historical Trail
      if (
        trailPointsRef.current.length === 0 ||
        trailPointsRef.current[trailPointsRef.current.length - 1].distanceTo(satPos) > 0.08
      ) {
        trailPointsRef.current.push(satPos.clone());
        if (trailPointsRef.current.length > 70) {
          trailPointsRef.current.shift();
        }
        if (trailLineRef.current && trailPointsRef.current.length >= 2) {
          trailLineRef.current.geometry.setFromPoints(trailPointsRef.current);
        }
      }

      // Position CubeSat model
      if (satelliteGroupRef.current) {
        satelliteGroupRef.current.position.copy(satPos);
        // Face nadir direction (towards Earth center)
        satelliteGroupRef.current.lookAt(new THREE.Vector3(0, 0, 0));
        satelliteGroupRef.current.rotateX(Math.PI / 2);
      }

      // CALCULATE EXACT TANGENT VELOCITY VECTOR V:
      // In the orbital plane defined by orthonormal basis P and Q:
      // r(u) = satRadius * (cos(u)*P + sin(u)*Q)
      // Tangent velocity direction is strictly: v = -sin(u)*P + cos(u)*Q
      const u = Math.atan2(satPos.dot(Q), satPos.dot(P));
      const velDir = new THREE.Vector3()
        .addScaledVector(P, -Math.sin(u))
        .addScaledVector(Q, Math.cos(u))
        .normalize();

      velDirectionRef.current.copy(velDir);

      // Update Dynamic Velocity Arrow originating from CubeSat model
      if (velArrowRef.current) {
        const arrowLength = 2.4 * (telemetry.velocityKms / 7.61);
        velArrowRef.current.position.copy(satPos);
        velArrowRef.current.setDirection(velDir);
        velArrowRef.current.setLength(arrowLength, 0.6, 0.32);
      }

      // Update Velocity Tag Sprite near arrow tip
      if (velSpriteRef.current) {
        const arrowLength = 2.4 * (telemetry.velocityKms / 7.61);
        const tagPos = satPos.clone().addScaledVector(velDir, arrowLength + 0.4);
        velSpriteRef.current.position.copy(tagPos);
      }

      // Update Sun Vector
      if (sunArrowRef.current && sunLightRef.current) {
        const sunDir = sunLightRef.current.position.clone().sub(satPos).normalize();
        sunArrowRef.current.position.copy(satPos);
        sunArrowRef.current.setDirection(sunDir);
      }

      // Update Nadir line
      if (nadirLineRef.current) {
        nadirLineRef.current.geometry.setFromPoints([satPos, nadirPos]);
        nadirLineRef.current.computeLineDistances();
      }

      // Update Footprint circle
      if (footprintMeshRef.current) {
        footprintMeshRef.current.position.copy(nadirPos);
        footprintMeshRef.current.quaternion.setFromUnitVectors(
          new THREE.Vector3(0, 0, 1),
          nadirPos.clone().normalize(),
        );
      }

      // Beacon halo pulse animation
      if (beaconSpriteRef.current) {
        const pulse = 1.2 + 0.35 * Math.sin(elapsedTime * 6);
        beaconSpriteRef.current.scale.set(pulse, pulse, 1);
      }

      // Radio downlink beam update
      if (beamLine && radioBeamLinesRef.current[0]) {
        let closestGs: GroundStation | null = null;
        GROUND_STATIONS.forEach((gs) => {
          const dLat = Math.abs(telemetry.latitude - gs.lat);
          const dLon = Math.abs(telemetry.longitude - gs.lon);
          if (dLat < 12 && dLon < 18) {
            closestGs = gs;
          }
        });

        if (closestGs) {
          const gsPos = latLonToVector3(
            (closestGs as GroundStation).lat,
            (closestGs as GroundStation).lon,
            GLOBE_RADIUS * 1.004,
          );
          radioBeamLinesRef.current[0].visible = true;
          radioBeamLinesRef.current[0].geometry.setFromPoints([satPos, gsPos]);
        } else {
          radioBeamLinesRef.current[0].visible = false;
        }
      }

      // Smooth tracking if focus is set on satellite
      if (focusTarget === 'satellite') {
        controls.target.lerp(satPos, 0.08);
      }

      // OrbitControls damping update
      controls.update();
      renderer.render(scene, camera);
    };

    animate();

    // Resize Handler
    const handleResize = () => {
      if (!container || !renderer || !camera) return;
      camera.aspect = container.clientWidth / container.clientHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(container.clientWidth, container.clientHeight);
    };
    window.addEventListener('resize', handleResize);

    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener('resize', handleResize);
      controls.dispose();
      renderer.dispose();
      if (container.contains(renderer.domElement)) {
        container.removeChild(renderer.domElement);
      }
    };
  }, [
    telemetry.latitude,
    telemetry.longitude,
    telemetry.velocityKms,
    satRadiusNorm,
    isPaused,
    focusTarget,
    latLonToVector3,
  ]);

  // Update directional readout state when telemetry changes
  useEffect(() => {
    if (velDirectionRef.current) {
      setLastVelocityVector({
        x: +velDirectionRef.current.x.toFixed(3),
        y: +velDirectionRef.current.y.toFixed(3),
        z: +velDirectionRef.current.z.toFixed(3),
      });
    }
  }, [telemetry.latitude, telemetry.longitude]);

  // OrbitControls Camera Presets Controller
  const handleApplyCameraPreset = (preset: CameraPreset) => {
    setCameraPreset(preset);
    const camera = cameraRef.current;
    const controls = controlsRef.current;
    if (!camera || !controls) return;

    const satPos = latLonToVector3(telemetry.latitude, telemetry.longitude, satRadiusNorm);

    switch (preset) {
      case 'sat_close': {
        // Close-up detailed inspection of CubeSat and its velocity vector
        setFocusTarget('satellite');
        controls.minDistance = 0.6;
        controls.maxDistance = 30;
        controls.target.copy(satPos);
        // Position camera slightly offset from satellite
        const offset = new THREE.Vector3(1.4, 0.8, 1.8);
        camera.position.copy(satPos).add(offset);
        break;
      }
      case 'global': {
        // Isometric perspective of whole Earth and full orbit
        setFocusTarget('earth');
        controls.minDistance = GLOBE_RADIUS * 1.08;
        controls.maxDistance = GLOBE_RADIUS * 7.5;
        controls.target.set(0, 0, 0);
        camera.position.set(0, 18, 28);
        break;
      }
      case 'nadir': {
        // Looking from satellite down towards Earth center
        setFocusTarget('earth');
        controls.minDistance = GLOBE_RADIUS * 1.08;
        controls.maxDistance = GLOBE_RADIUS * 7.5;
        camera.position.copy(satPos.clone().multiplyScalar(1.35));
        controls.target.set(0, 0, 0);
        break;
      }
      case 'ground': {
        // Looking from Perm ground station up into space towards CubeSat
        setFocusTarget('satellite');
        controls.minDistance = 0.8;
        controls.maxDistance = GLOBE_RADIUS * 6.5;
        const permPos = latLonToVector3(58.01, 56.25, GLOBE_RADIUS * 1.05);
        camera.position.copy(permPos);
        controls.target.copy(satPos);
        break;
      }
      case 'edge': {
        // Edge-on view of the orbital plane
        setFocusTarget('earth');
        controls.minDistance = GLOBE_RADIUS * 1.08;
        controls.maxDistance = GLOBE_RADIUS * 7.5;
        controls.target.set(0, 0, 0);
        camera.position.set(32, 0, 0);
        break;
      }
    }
    controls.update();
  };

  // Switch camera focus target explicitly
  const handleToggleFocus = (target: CameraFocusTarget) => {
    setFocusTarget(target);
    const camera = cameraRef.current;
    const controls = controlsRef.current;
    if (!camera || !controls) return;

    const satPos = latLonToVector3(telemetry.latitude, telemetry.longitude, satRadiusNorm);

    if (target === 'satellite') {
      controls.minDistance = 0.6;
      controls.maxDistance = 35;
      controls.target.copy(satPos);
      camera.position.copy(satPos).add(new THREE.Vector3(1.8, 1.2, 2.2));
    } else {
      controls.minDistance = GLOBE_RADIUS * 1.08;
      controls.maxDistance = GLOBE_RADIUS * 7.5;
      controls.target.set(0, 0, 0);
      camera.position.set(0, 16, 28);
    }
    controls.update();
  };

  // Zoom In / Out via OrbitControls
  const handleZoom = (deltaFactor: number) => {
    const camera = cameraRef.current;
    const controls = controlsRef.current;
    if (!camera || !controls) return;

    const target = controls.target;
    const offset = camera.position.clone().sub(target);
    offset.multiplyScalar(deltaFactor);
    camera.position.copy(target).add(offset);
    controls.update();
  };

  // Rotate camera left / right
  const handleRotate = (angleRad: number) => {
    const controls = controlsRef.current;
    if (!controls) return;
    controls.autoRotate = false;
    setIsAutoRotate(false);
    // Rotate azimuthal angle
    const angle = controls.getAzimuthalAngle() + angleRad;
    const polar = controls.getPolarAngle();
    const distance = controls.getDistance();
    const target = controls.target;

    const x = target.x + distance * Math.sin(polar) * Math.sin(angle);
    const y = target.y + distance * Math.cos(polar);
    const z = target.z + distance * Math.sin(polar) * Math.cos(angle);

    if (cameraRef.current) {
      cameraRef.current.position.set(x, y, z);
      cameraRef.current.lookAt(target);
    }
    controls.update();
  };

  // Toggle Auto-Rotate
  const handleToggleAutoRotate = () => {
    const controls = controlsRef.current;
    if (!controls) return;
    const nextState = !isAutoRotate;
    setIsAutoRotate(nextState);
    controls.autoRotate = nextState;
  };

  // Reset Camera View
  const handleResetCamera = () => {
    handleApplyCameraPreset('global');
  };

  // Toggle Visibility Effects
  useEffect(() => {
    if (latLonGridGroupRef.current) latLonGridGroupRef.current.visible = showLatLonGrid;
    if (orbitRingRef.current) orbitRingRef.current.visible = showOrbitRing;
    if (footprintMeshRef.current) footprintMeshRef.current.visible = showFootprint;
    if (trailLineRef.current) trailLineRef.current.visible = showTrail;
    if (velArrowRef.current) velArrowRef.current.visible = showVelVector;
    if (velSpriteRef.current) velSpriteRef.current.visible = showVelVector;
    if (sunArrowRef.current) sunArrowRef.current.visible = showSunVector;
  }, [showLatLonGrid, showOrbitRing, showFootprint, showTrail, showVelVector, showSunVector]);

  return (
    <div
      className={`relative flex flex-col rounded-2xl border border-cyan-900/50 bg-slate-950/90 shadow-2xl overflow-hidden backdrop-blur-md ${
        isFullscreen ? 'fixed inset-0 z-50 rounded-none' : 'w-full'
      } ${className}`}
    >
      {/* Top Header Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-800/80 bg-slate-950/80 px-4 py-3 text-xs">
        <div className="flex items-center gap-2.5">
          <div className="flex h-7 w-7 items-center justify-center rounded-lg border border-cyan-500/40 bg-cyan-950/60 text-cyan-400 shadow-[0_0_12px_rgba(6,182,212,0.3)]">
            <Globe className="h-4 w-4" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-bold text-white tracking-wide">
                Орбитальный 3D-трекер CubeSat & Вектор скорости
              </span>
              <span className="rounded bg-cyan-500/20 px-1.5 py-0.2 font-mono text-[10px] font-bold text-cyan-300 border border-cyan-500/30">
                Three.js OrbitControls
              </span>
              <span className="rounded bg-emerald-500/20 px-1.5 py-0.2 font-mono text-[10px] font-bold text-emerald-300 border border-emerald-500/30">
                Вектор V: {telemetry.velocityKms.toFixed(2)} км/с
              </span>
            </div>
            <p className="text-[11px] text-slate-400">
              Интерактивное управление камерой (OrbitControls), динамический вектор скорости и
              положение CubeSat относительно Земли
            </p>
          </div>
        </div>

        {/* Telemetry Status Readout Pill */}
        <div className="flex flex-wrap items-center gap-2 font-mono text-[11px]">
          <div className="flex items-center gap-1.5 rounded-lg border border-slate-800 bg-slate-900/80 px-2.5 py-1 text-slate-300">
            <span className="text-slate-500">Высота H:</span>
            <span className="font-bold text-cyan-300">{satAltitudeKm.toFixed(1)} км</span>
          </div>

          <div className="flex items-center gap-1.5 rounded-lg border border-emerald-500/30 bg-emerald-950/40 px-2.5 py-1 text-emerald-300">
            <ArrowUpRight className="h-3.5 w-3.5 text-emerald-400" />
            <span className="text-slate-400">Скорость V:</span>
            <span className="font-bold text-emerald-300">
              {telemetry.velocityKms.toFixed(3)} км/с
            </span>
          </div>

          <div className="flex items-center gap-1.5 rounded-lg border border-slate-800 bg-slate-900/80 px-2.5 py-1 text-slate-300">
            <span className="text-slate-500">Ш/Д:</span>
            <span className="font-bold text-white">
              {telemetry.latitude.toFixed(1)}° / {telemetry.longitude.toFixed(1)}°
            </span>
          </div>

          <div
            className={`flex items-center gap-1.5 rounded-lg px-2.5 py-1 border font-bold ${
              activeStation
                ? 'border-emerald-500/40 bg-emerald-950/60 text-emerald-300 shadow-[0_0_10px_rgba(16,185,129,0.2)]'
                : 'border-slate-800 bg-slate-900/60 text-slate-400'
            }`}
          >
            <Radio className="h-3 w-3" />
            <span>
              {activeStation
                ? `${activeStation.city} (${activeLinkDistanceKm} км)`
                : 'Вне зоны станций'}
            </span>
          </div>

          <button
            type="button"
            onClick={() => setIsFullscreen(!isFullscreen)}
            className="flex h-7 w-7 items-center justify-center rounded-lg border border-slate-800 bg-slate-900 text-slate-300 hover:bg-slate-800 hover:text-white transition-all cursor-pointer"
            title={isFullscreen ? 'Выйти из полноэкранного режима' : 'На весь экран'}
          >
            {isFullscreen ? (
              <Minimize2 className="h-3.5 w-3.5" />
            ) : (
              <Maximize2 className="h-3.5 w-3.5" />
            )}
          </button>
        </div>
      </div>

      {/* Main 3D WebGL Canvas Viewport */}
      <div
        ref={containerRef}
        className={`relative w-full cursor-grab active:cursor-grabbing select-none ${
          isFullscreen ? 'flex-1' : 'h-[480px] sm:h-[560px]'
        }`}
      >
        {/* Top-Left: Camera Presets & Focus Switcher */}
        <div className="absolute top-3 left-3 z-10 flex flex-col gap-1.5 max-w-[calc(100%-24px)] sm:max-w-none">
          {/* Preset Buttons */}
          <div className="flex flex-wrap items-center gap-1.5 rounded-xl border border-slate-800/80 bg-slate-950/85 p-1.5 shadow-xl backdrop-blur-md">
            <span className="text-[10px] font-semibold text-slate-400 px-1.5 flex items-center gap-1">
              <Eye className="h-3 w-3 text-cyan-400" /> Вид:
            </span>

            <button
              type="button"
              onClick={() => handleApplyCameraPreset('sat_close')}
              className={`flex items-center gap-1 rounded-lg px-2.5 py-1 text-[11px] font-medium transition-all cursor-pointer ${
                cameraPreset === 'sat_close'
                  ? 'bg-emerald-500 text-slate-950 font-bold shadow-xs'
                  : 'text-slate-300 hover:bg-slate-800 hover:text-white'
              }`}
              title="Детальный осмотр спутника CubeSat и вектора скорости вблизи"
            >
              <Focus className="h-3 w-3" />
              <span>Осмотр CubeSat</span>
            </button>

            <button
              type="button"
              onClick={() => handleApplyCameraPreset('global')}
              className={`flex items-center gap-1 rounded-lg px-2.5 py-1 text-[11px] font-medium transition-all cursor-pointer ${
                cameraPreset === 'global'
                  ? 'bg-cyan-500 text-slate-950 font-bold shadow-xs'
                  : 'text-slate-300 hover:bg-slate-800 hover:text-white'
              }`}
              title="Глобальный обзор планеты и траектории орбиты"
            >
              <Globe className="h-3 w-3" />
              <span>Земля и орбита</span>
            </button>

            <button
              type="button"
              onClick={() => handleApplyCameraPreset('nadir')}
              className={`flex items-center gap-1 rounded-lg px-2 py-1 text-[11px] font-medium transition-all cursor-pointer ${
                cameraPreset === 'nadir'
                  ? 'bg-cyan-500 text-slate-950 font-bold shadow-xs'
                  : 'text-slate-300 hover:bg-slate-800 hover:text-white'
              }`}
              title="Вид из наноспутника вниз на Землю (Надир)"
            >
              <Navigation className="h-3 w-3" />
              <span>Надир (Вниз)</span>
            </button>

            <button
              type="button"
              onClick={() => handleApplyCameraPreset('ground')}
              className={`flex items-center gap-1 rounded-lg px-2 py-1 text-[11px] font-medium transition-all cursor-pointer ${
                cameraPreset === 'ground'
                  ? 'bg-cyan-500 text-slate-950 font-bold shadow-xs'
                  : 'text-slate-300 hover:bg-slate-800 hover:text-white'
              }`}
              title="Вид со станции Пермь в зенит"
            >
              <Signal className="h-3 w-3" />
              <span>Станция Пермь</span>
            </button>

            <button
              type="button"
              onClick={() => handleApplyCameraPreset('edge')}
              className={`flex items-center gap-1 rounded-lg px-2 py-1 text-[11px] font-medium transition-all cursor-pointer ${
                cameraPreset === 'edge'
                  ? 'bg-cyan-500 text-slate-950 font-bold shadow-xs'
                  : 'text-slate-300 hover:bg-slate-800 hover:text-white'
              }`}
              title="Профиль плоскости орбиты"
            >
              <Compass className="h-3 w-3" />
              <span>Плоскость ССО</span>
            </button>
          </div>

          {/* Focus Toggle Pill */}
          <div className="flex items-center gap-1 rounded-xl border border-slate-800/80 bg-slate-950/85 px-2 py-1 shadow-xl backdrop-blur-md text-[11px] w-fit">
            <span className="text-[10px] text-slate-400 font-semibold mr-1">
              Фокус центра вращения:
            </span>
            <button
              type="button"
              onClick={() => handleToggleFocus('satellite')}
              className={`px-2 py-0.5 rounded-md font-medium transition-all cursor-pointer ${
                focusTarget === 'satellite'
                  ? 'bg-emerald-500/30 text-emerald-300 font-bold border border-emerald-500/40'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              На спутнике
            </button>
            <button
              type="button"
              onClick={() => handleToggleFocus('earth')}
              className={`px-2 py-0.5 rounded-md font-medium transition-all cursor-pointer ${
                focusTarget === 'earth'
                  ? 'bg-cyan-500/30 text-cyan-300 font-bold border border-cyan-500/40'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              На Земле
            </button>
          </div>
        </div>

        {/* Top-Right: Visual Layer Toggles */}
        <div className="absolute top-3 right-3 z-10 flex flex-wrap items-center gap-1 rounded-xl border border-slate-800/80 bg-slate-950/85 p-1 shadow-xl backdrop-blur-md text-[11px]">
          <button
            type="button"
            onClick={() => setShowVelVector(!showVelVector)}
            className={`flex items-center gap-1 rounded-lg px-2.5 py-1 transition-all cursor-pointer ${
              showVelVector
                ? 'bg-emerald-500/25 text-emerald-300 font-bold border border-emerald-500/40 shadow-xs'
                : 'text-slate-400 hover:text-white'
            }`}
            title="Динамическая стрелка вектора текущей скорости CubeSat"
          >
            <ArrowUpRight className="h-3.5 w-3.5 text-emerald-400" />
            <span>Стрелка скорости V</span>
          </button>

          <button
            type="button"
            onClick={() => setShowLatLonGrid(!showLatLonGrid)}
            className={`flex items-center gap-1 rounded-lg px-2 py-1 transition-all cursor-pointer ${
              showLatLonGrid
                ? 'bg-cyan-500/25 text-cyan-300 font-bold border border-cyan-500/40 shadow-xs'
                : 'text-slate-400 hover:text-white'
            }`}
            title="Полупрозрачная координатная сетка широты и долготы (Lat/Lon) Земли"
          >
            <Compass className="h-3.5 w-3.5 text-cyan-400" />
            <span>Сетка Lat/Lon</span>
          </button>

          <button
            type="button"
            onClick={() => setShowOrbitRing(!showOrbitRing)}
            className={`rounded-lg px-2 py-1 transition-all cursor-pointer ${
              showOrbitRing
                ? 'bg-cyan-500/20 text-cyan-300 font-semibold'
                : 'text-slate-400 hover:text-white'
            }`}
            title="Траектория кольца орбиты"
          >
            Кольцо орбиты
          </button>

          <button
            type="button"
            onClick={() => setShowTrail(!showTrail)}
            className={`rounded-lg px-2 py-1 transition-all cursor-pointer ${
              showTrail
                ? 'bg-cyan-500/20 text-cyan-300 font-semibold'
                : 'text-slate-400 hover:text-white'
            }`}
            title="Шлейф пройденной траектории"
          >
            Шлейф
          </button>

          <button
            type="button"
            onClick={() => setShowFootprint(!showFootprint)}
            className={`rounded-lg px-2 py-1 transition-all cursor-pointer ${
              showFootprint
                ? 'bg-cyan-500/20 text-cyan-300 font-semibold'
                : 'text-slate-400 hover:text-white'
            }`}
            title="Зона радиовидимости антенн"
          >
            Зона луча
          </button>

          <button
            type="button"
            onClick={() => setShowSunVector(!showSunVector)}
            className={`rounded-lg px-2 py-1 transition-all cursor-pointer ${
              showSunVector
                ? 'bg-amber-500/20 text-amber-300 font-semibold'
                : 'text-slate-400 hover:text-white'
            }`}
            title="Вектор направления на Солнце"
          >
            Вектор Sun
          </button>
        </div>

        {/* Floating Interactive OrbitControls Toolbar (Zoom, Rotate, Auto-Rotate, Reset) */}
        <div className="absolute right-3 top-16 z-10 flex flex-col gap-1.5 rounded-xl border border-slate-800/80 bg-slate-950/85 p-1.5 shadow-2xl backdrop-blur-md">
          <button
            type="button"
            onClick={() => handleZoom(0.8)}
            className="flex h-7 w-7 items-center justify-center rounded-lg border border-slate-800 bg-slate-900 text-slate-300 hover:bg-slate-800 hover:text-cyan-300 transition-all cursor-pointer"
            title="Приблизить камеру (Зум +)"
          >
            <ZoomIn className="h-4 w-4" />
          </button>

          <button
            type="button"
            onClick={() => handleZoom(1.25)}
            className="flex h-7 w-7 items-center justify-center rounded-lg border border-slate-800 bg-slate-900 text-slate-300 hover:bg-slate-800 hover:text-cyan-300 transition-all cursor-pointer"
            title="Отдалить камеру (Зум -)"
          >
            <ZoomOut className="h-4 w-4" />
          </button>

          <button
            type="button"
            onClick={() => handleRotate(Math.PI / 8)}
            className="flex h-7 w-7 items-center justify-center rounded-lg border border-slate-800 bg-slate-900 text-slate-300 hover:bg-slate-800 hover:text-cyan-300 transition-all cursor-pointer"
            title="Повернуть камеру по часовой стрелке"
          >
            <RotateCw className="h-3.5 w-3.5" />
          </button>

          <button
            type="button"
            onClick={() => handleRotate(-Math.PI / 8)}
            className="flex h-7 w-7 items-center justify-center rounded-lg border border-slate-800 bg-slate-900 text-slate-300 hover:bg-slate-800 hover:text-cyan-300 transition-all cursor-pointer"
            title="Повернуть камеру против часовой стрелки"
          >
            <RotateCcw className="h-3.5 w-3.5" />
          </button>

          <button
            type="button"
            onClick={handleToggleAutoRotate}
            className={`flex h-7 w-7 items-center justify-center rounded-lg border transition-all cursor-pointer ${
              isAutoRotate
                ? 'border-cyan-500/60 bg-cyan-950/80 text-cyan-300 shadow-[0_0_8px_rgba(6,182,212,0.4)]'
                : 'border-slate-800 bg-slate-900 text-slate-400 hover:bg-slate-800 hover:text-white'
            }`}
            title={isAutoRotate ? 'Остановить авто-вращение' : 'Включить авто-вращение камеры'}
          >
            <RefreshCw className={`h-3.5 w-3.5 ${isAutoRotate ? 'animate-spin' : ''}`} />
          </button>

          <button
            type="button"
            onClick={handleResetCamera}
            className="flex h-7 w-7 items-center justify-center rounded-lg border border-slate-800 bg-slate-900 text-slate-400 hover:bg-slate-800 hover:text-white transition-all cursor-pointer text-[10px] font-mono font-bold"
            title="Сбросить положение камеры"
          >
            ⌂
          </button>
        </div>

        {/* Bottom-Left: Live Velocity Vector & Orbital HUD Card */}
        <div className="absolute bottom-3 left-3 z-10 flex flex-col gap-1.5 rounded-xl border border-slate-800/80 bg-slate-950/85 p-3 shadow-2xl backdrop-blur-md max-w-xs text-xs">
          <div className="flex items-center justify-between border-b border-slate-800 pb-1.5 font-bold text-white">
            <div className="flex items-center gap-1.5">
              <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
              <span>Вектор скорости CubeSat (V)</span>
            </div>
            <span className="font-mono text-[10px] text-emerald-400">
              {telemetry.velocityKms.toFixed(3)} км/с
            </span>
          </div>

          <div className="space-y-1 font-mono text-[11px] text-slate-300">
            <div className="flex justify-between">
              <span className="text-slate-400">Направление:</span>
              <span className="text-emerald-300 font-bold">Тангенциальное (по орбите)</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">Вектор (Vx, Vy, Vz):</span>
              <span className="text-slate-300 font-mono text-[10px]">
                [{lastVelocityVector.x}, {lastVelocityVector.y}, {lastVelocityVector.z}]
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">Орбитальная высота:</span>
              <span className="text-cyan-300 font-bold">{satAltitudeKm.toFixed(1)} км</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">Период обращения T:</span>
              <span className="text-white">95.12 мин</span>
            </div>
          </div>

          {activeStation && (
            <div className="mt-1 flex items-center gap-1.5 rounded bg-emerald-950/60 p-1.5 text-[11px] text-emerald-300 border border-emerald-500/30">
              <CheckCircle2 className="h-3.5 w-3.5 shrink-0" />
              <span>
                Радиоканал с <strong>{activeStation.name}</strong> ({activeLinkDistanceKm} км)
              </span>
            </div>
          )}
        </div>

        {/* Bottom-Right: OrbitControls Gesture Guide & Legend */}
        <div className="absolute bottom-3 right-3 z-10 flex flex-col items-end gap-1.5">
          <div className="hidden sm:flex items-center gap-2 rounded-lg border border-slate-800/80 bg-slate-950/80 px-2.5 py-1 text-[10px] text-slate-400 backdrop-blur-md">
            <span>🖱️ ЛКМ: вращение 360°</span>
            <span>•</span>
            <span>Колесико: зум</span>
            <span>•</span>
            <span>ПКМ: панорама</span>
          </div>

          <div className="flex items-center gap-3 rounded-xl border border-slate-800/80 bg-slate-950/85 px-3 py-1.5 text-[10px] text-slate-400 shadow-xl backdrop-blur-md">
            <div className="flex items-center gap-1">
              <span className="h-2 w-2 rounded-full bg-emerald-400" />
              <span className="text-emerald-300 font-medium">Стрелка скорости V</span>
            </div>
            <div className="flex items-center gap-1">
              <span className="h-2 w-2 rounded-full bg-cyan-400" />
              <span>CubeSat 3U</span>
            </div>
            <div className="flex items-center gap-1">
              <span className="h-1.5 w-3 bg-cyan-400/60 rounded" />
              <span>Орбита ССО</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

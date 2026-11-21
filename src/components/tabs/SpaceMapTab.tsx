import React, { useState, useRef, useEffect, useMemo, useCallback } from 'react';
import {
  Globe,
  Plus,
  Filter,
  Search,
  MapPin,
  Compass,
  X,
  Trash2,
  Satellite,
  Radio,
  Activity,
  Layers,
  RefreshCw,
  Navigation,
  Zap,
} from 'lucide-react';
import { SpaceMapObject, SpaceObjectType, Team, UserRole, TelemetryPacket } from '../../types';
import { GROUND_STATIONS, createTelemetrySimulator } from '../../services/telemetrySimulator';

interface SpaceMapTabProps {
  objects: SpaceMapObject[];
  activeTeam: Team;
  userRole: UserRole;
  onAddObject: (newObj: SpaceMapObject) => void;
  onDeleteObject: (id: string) => void;
  telemetry?: TelemetryPacket;
}

export type MapProjection = 'celestial' | 'ground';

export interface TrajectoryPoint {
  epoch: number;
  timestamp: string;
  lat: number;
  lon: number;
  raHours: number;
  decDeg: number;
  altitudeKm: number;
  velocityKms: number;
  mode: string;
  batterySocPercent: number;
}

const R_EARTH = 6371; // km
const INCLINATION_RAD = (97.4 * Math.PI) / 180;
const EARTH_ROTATION_DEG_PER_SEC = 360 / 86164;
const ORBIT_PERIOD_SEC = 95.12 * 60; // ~5707 sec for 525km altitude

// Calculate great-circle distance between two lat/lon points on Earth in km
function calculateGroundDistanceKm(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R_EARTH * c;
}

// Convert Lat/Lon & Epoch to Equatorial RA (hours) and Dec (degrees)
function latLonToEquatorial(
  lat: number,
  lon: number,
  epoch: number,
): { raHours: number; decDeg: number } {
  const decDeg = lat;
  const elapsedSec = (epoch / 1000) % 86164;
  const gmstDeg = (elapsedSec * EARTH_ROTATION_DEG_PER_SEC) % 360;
  let raDeg = (lon + gmstDeg) % 360;
  if (raDeg < 0) raDeg += 360;
  const raHours = +(raDeg / 15).toFixed(2);
  return { raHours, decDeg: +decDeg.toFixed(2) };
}

// Convert points array to SVG path string, splitting across screen wrap-around boundaries
function pointsToSvgPath(points: Array<{ x: number; y: number }>, maxJump = 350): string {
  if (points.length === 0) return '';
  let d = '';
  for (let i = 0; i < points.length; i++) {
    const pt = points[i];
    if (i === 0) {
      d += `M ${pt.x.toFixed(1)} ${pt.y.toFixed(1)}`;
    } else {
      const prev = points[i - 1];
      const dx = Math.abs(pt.x - prev.x);
      if (dx > maxJump) {
        // Discontinuity across meridian / 0h boundary
        d += ` M ${pt.x.toFixed(1)} ${pt.y.toFixed(1)}`;
      } else {
        d += ` L ${pt.x.toFixed(1)} ${pt.y.toFixed(1)}`;
      }
    }
  }
  return d;
}

// Generate pre-seeded preceding points along orbit for immediate visualization
function generatePrecedingOrbitPoints(
  currentLat: number,
  currentLon: number,
  currentEpoch: number,
  altitudeKm: number,
  velocityKms: number,
  count = 20,
): TrajectoryPoint[] {
  const pts: TrajectoryPoint[] = [];
  const currentTheta = Math.asin(
    Math.min(1, Math.max(-1, Math.sin((currentLat * Math.PI) / 180) / Math.sin(INCLINATION_RAD))),
  );

  for (let i = count; i >= 1; i--) {
    const timeDeltaSec = i * 120; // 2 minutes backwards per step
    const epoch = currentEpoch - timeDeltaSec * 1000;
    const theta = currentTheta - (timeDeltaSec / ORBIT_PERIOD_SEC) * 2 * Math.PI;

    const lat = Math.asin(Math.sin(INCLINATION_RAD) * Math.sin(theta)) * (180 / Math.PI);
    let lon = (currentLon - EARTH_ROTATION_DEG_PER_SEC * timeDeltaSec - i * 6.5) % 360;
    if (lon > 180) lon -= 360;
    if (lon < -180) lon += 360;

    const { raHours, decDeg } = latLonToEquatorial(lat, lon, epoch);
    const date = new Date(epoch);
    const timestamp = date.toLocaleTimeString('ru-RU', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    });

    pts.push({
      epoch,
      timestamp,
      lat: +lat.toFixed(2),
      lon: +lon.toFixed(2),
      raHours,
      decDeg,
      altitudeKm: +(altitudeKm + Math.sin(i) * 1.5).toFixed(1),
      velocityKms: +(velocityKms + Math.cos(i) * 0.02).toFixed(2),
      mode: 'NORMAL',
      batterySocPercent: Math.max(70, Math.min(100, 95 - i)),
    });
  }
  return pts;
}

export const SpaceMapTab: React.FC<SpaceMapTabProps> = ({
  objects,
  activeTeam,
  userRole,
  onAddObject,
  onDeleteObject,
  telemetry: externalTelemetry,
}) => {
  // Default fallback telemetry if not provided
  const [defaultTelemetry] = useState<TelemetryPacket>(() => {
    return createTelemetrySimulator().generateInitialPacket();
  });
  const telemetry = externalTelemetry || defaultTelemetry;

  // Projection state: Celestial Sphere (RA/Dec) or Earth Ground Track (Lat/Lon)
  const [projection, setProjection] = useState<MapProjection>('celestial');

  // SVG Layer visibility toggles
  const [showTrajectory, setShowTrajectory] = useState<boolean>(true);
  const [showFutureOrbit, setShowFutureOrbit] = useState<boolean>(true);
  const [showHistoryTrail, setShowHistoryTrail] = useState<boolean>(true);
  const [showFootprint, setShowFootprint] = useState<boolean>(true);
  const [showGroundStations, setShowGroundStations] = useState<boolean>(true);

  // Selected object and search filters
  const [selectedObjectId, setSelectedObjectId] = useState<string | null>(objects[0]?.id || null);
  const [filterType, setFilterType] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);

  // Hovered trajectory node tooltip
  const [hoveredNode, setHoveredNode] = useState<{
    point: TrajectoryPoint;
    x: number;
    y: number;
    label: string;
  } | null>(null);

  // Form states for adding markers
  const [name, setName] = useState('');
  const [type, setType] = useState<SpaceObjectType>('satellite');
  const [raHours, setRaHours] = useState<number>(12.0);
  const [decDeg, setDecDeg] = useState<number>(45.0);
  const [altitudeKm, setAltitudeKm] = useState<number>(525);
  const [description, setDescription] = useState('');
  const [specs, setSpecs] = useState('');

  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  // Trajectory history buffer
  const [trajectoryHistory, setTrajectoryHistory] = useState<TrajectoryPoint[]>(() => {
    const initialEpoch = telemetry.epoch || Date.now();
    return generatePrecedingOrbitPoints(
      telemetry.latitude,
      telemetry.longitude,
      initialEpoch,
      telemetry.altitudeKm,
      telemetry.velocityKms,
      18,
    );
  });

  // Append new telemetry points as they arrive
  useEffect(() => {
    const epoch = telemetry.epoch || Date.now();
    const { raHours: currentRa, decDeg: currentDec } = latLonToEquatorial(
      telemetry.latitude,
      telemetry.longitude,
      epoch,
    );

    const newPt: TrajectoryPoint = {
      epoch,
      timestamp: telemetry.timestamp || new Date(epoch).toLocaleTimeString('ru-RU'),
      lat: telemetry.latitude,
      lon: telemetry.longitude,
      raHours: currentRa,
      decDeg: currentDec,
      altitudeKm: telemetry.altitudeKm,
      velocityKms: telemetry.velocityKms,
      mode: telemetry.mode,
      batterySocPercent: telemetry.batterySocPercent,
    };

    setTrajectoryHistory((prev) => {
      if (prev.length === 0) return [newPt];
      const last = prev[prev.length - 1];
      // Only append if epoch changed or distance changed meaningfully
      if (
        last.epoch === epoch &&
        last.lat === telemetry.latitude &&
        last.lon === telemetry.longitude
      ) {
        return prev;
      }
      const updated = [...prev, newPt];
      // Keep maximum 60 historical points
      if (updated.length > 60) {
        return updated.slice(updated.length - 60);
      }
      return updated;
    });
  }, [telemetry]);

  // Selected object reference
  const selectedObject = objects.find((o) => o.id === selectedObjectId);

  // Filter objects
  const filteredObjects = objects.filter((o) => {
    if (filterType !== 'all' && o.type !== filterType) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      return (
        o.name.toLowerCase().includes(q) ||
        o.teamName.toLowerCase().includes(q) ||
        o.description.toLowerCase().includes(q)
      );
    }
    return true;
  });

  // Coordinate projection helpers
  // SVG Canvas dimensions: 900 x 440
  const SVG_WIDTH = 900;
  const SVG_HEIGHT = 440;

  const toSvgX = useCallback(
    (pt: { raHours: number; lon: number }) => {
      if (projection === 'celestial') {
        return (pt.raHours / 24) * SVG_WIDTH;
      }
      return ((pt.lon + 180) / 360) * SVG_WIDTH;
    },
    [projection],
  );

  const toSvgY = useCallback(
    (pt: { decDeg: number; lat: number }) => {
      if (projection === 'celestial') {
        return ((90 - pt.decDeg) / 180) * SVG_HEIGHT;
      }
      return ((90 - pt.lat) / 180) * SVG_HEIGHT;
    },
    [projection],
  );

  // Current CubeSat position in SVG coordinates
  const currentCubeSatPoint = useMemo(() => {
    const epoch = telemetry.epoch || Date.now();
    const { raHours: currentRa, decDeg: currentDec } = latLonToEquatorial(
      telemetry.latitude,
      telemetry.longitude,
      epoch,
    );
    const x = toSvgX({ raHours: currentRa, lon: telemetry.longitude });
    const y = toSvgY({ decDeg: currentDec, lat: telemetry.latitude });
    return {
      x,
      y,
      raHours: currentRa,
      decDeg: currentDec,
      lat: telemetry.latitude,
      lon: telemetry.longitude,
      altitudeKm: telemetry.altitudeKm,
      velocityKms: telemetry.velocityKms,
      mode: telemetry.mode,
      satelliteName: telemetry.satelliteName || 'КубСат-Пермь-1',
    };
  }, [telemetry, toSvgX, toSvgY]);

  // Projected future orbit pass points (~1 full revolution, 64 points)
  const futureOrbitPoints = useMemo(() => {
    const pts: Array<{
      x: number;
      y: number;
      lat: number;
      lon: number;
      raHours: number;
      decDeg: number;
      epoch: number;
    }> = [];
    const startEpoch = telemetry.epoch || Date.now();
    const currentTheta = Math.asin(
      Math.min(
        1,
        Math.max(-1, Math.sin((telemetry.latitude * Math.PI) / 180) / Math.sin(INCLINATION_RAD)),
      ),
    );

    const steps = 64;
    for (let i = 0; i <= steps; i++) {
      const dtSec = (i / steps) * ORBIT_PERIOD_SEC;
      const epoch = startEpoch + dtSec * 1000;
      const theta = currentTheta + (dtSec / ORBIT_PERIOD_SEC) * 2 * Math.PI;

      const lat = Math.asin(Math.sin(INCLINATION_RAD) * Math.sin(theta)) * (180 / Math.PI);
      let lon =
        (telemetry.longitude +
          (Math.atan2(Math.cos(INCLINATION_RAD) * Math.sin(theta), Math.cos(theta)) -
            Math.atan2(
              Math.cos(INCLINATION_RAD) * Math.sin(currentTheta),
              Math.cos(currentTheta),
            )) *
            (180 / Math.PI) -
          EARTH_ROTATION_DEG_PER_SEC * dtSec) %
        360;

      if (lon > 180) lon -= 360;
      if (lon < -180) lon += 360;

      const { raHours, decDeg } = latLonToEquatorial(lat, lon, epoch);
      const x = toSvgX({ raHours, lon });
      const y = toSvgY({ decDeg, lat });

      pts.push({ x, y, lat: +lat.toFixed(2), lon: +lon.toFixed(2), raHours, decDeg, epoch });
    }
    return pts;
  }, [telemetry, toSvgX, toSvgY]);

  // Past history trail points in SVG coordinates
  const historySvgPoints = useMemo(() => {
    return trajectoryHistory.map((pt) => ({
      x: toSvgX({ raHours: pt.raHours, lon: pt.lon }),
      y: toSvgY({ decDeg: pt.decDeg, lat: pt.lat }),
      raw: pt,
    }));
  }, [trajectoryHistory, toSvgX, toSvgY]);

  // SVG Paths for future orbit and past trail
  const futureOrbitPathD = useMemo(() => {
    return pointsToSvgPath(futureOrbitPoints, 350);
  }, [futureOrbitPoints]);

  const historyTrailPathD = useMemo(() => {
    return pointsToSvgPath(historySvgPoints, 350);
  }, [historySvgPoints]);

  // Ground stations with distances and radio visibility
  const groundStationsWithStatus = useMemo(() => {
    return GROUND_STATIONS.map((gs) => {
      const distKm = calculateGroundDistanceKm(
        telemetry.latitude,
        telemetry.longitude,
        gs.lat,
        gs.lon,
      );
      // Radio horizon coverage threshold ~1800 km for 525km LEO
      const isVisible = distKm <= 1800;

      // Project GS coordinates
      const epoch = telemetry.epoch || Date.now();
      const { raHours: gsRa, decDeg: gsDec } = latLonToEquatorial(gs.lat, gs.lon, epoch);
      const x = toSvgX({ raHours: gsRa, lon: gs.lon });
      const y = toSvgY({ decDeg: gsDec, lat: gs.lat });

      return {
        ...gs,
        distKm: Math.round(distKm),
        isVisible,
        x,
        y,
      };
    });
  }, [telemetry, toSvgX, toSvgY]);

  // Active connected ground station if any
  const activeStation = groundStationsWithStatus.find((gs) => gs.isVisible);

  // Render Canvas Background based on projection
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const width = canvas.width;
    const height = canvas.height;

    if (projection === 'celestial') {
      // Celestial Sky Background
      ctx.fillStyle = '#030712';
      ctx.fillRect(0, 0, width, height);

      const toCanvasX = (ra: number) => (ra / 24) * width;
      const toCanvasY = (dec: number) => ((90 - dec) / 180) * height;

      // Celestial Grid Lines
      ctx.strokeStyle = '#111827';
      ctx.lineWidth = 1;
      for (let h = 0; h <= 24; h += 2) {
        const x = toCanvasX(h);
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, height);
        ctx.stroke();

        ctx.fillStyle = '#475569';
        ctx.font = '9px monospace';
        ctx.fillText(`${h}h`, x + 3, height - 6);
      }
      for (let d = -60; d <= 60; d += 30) {
        const y = toCanvasY(d);
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(width, y);
        ctx.stroke();

        ctx.fillStyle = '#475569';
        ctx.font = '9px monospace';
        ctx.fillText(`${d > 0 ? `+${d}` : d}°`, 6, y - 4);
      }

      // Celestial Equator (Dec = 0)
      ctx.strokeStyle = '#1e293b';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(0, height / 2);
      ctx.lineTo(width, height / 2);
      ctx.stroke();

      // Ecliptic Line
      ctx.strokeStyle = '#ca8a04';
      ctx.lineWidth = 1.2;
      ctx.setLineDash([3, 3]);
      ctx.beginPath();
      for (let ra = 0; ra <= 24; ra += 0.2) {
        const dec = 23.44 * Math.sin((ra / 24) * 2 * Math.PI);
        const x = toCanvasX(ra);
        const y = toCanvasY(dec);
        if (ra === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
      ctx.stroke();
      ctx.setLineDash([]);
      ctx.fillStyle = '#ca8a04';
      ctx.font = '9px sans-serif';
      ctx.fillText('Плоскость эклиптики (Солнце)', width - 150, toCanvasY(15));

      // Constellation stars
      const stars = [
        { name: 'Полярная (Polaris)', ra: 2.5, dec: 89.3 },
        { name: 'Вега', ra: 18.6, dec: 38.8 },
        { name: 'Сириус', ra: 6.75, dec: -16.7 },
        { name: 'Бетельгейзе', ra: 5.9, dec: 7.4 },
        { name: 'Ригель', ra: 5.2, dec: -8.2 },
        { name: 'Арктур', ra: 14.3, dec: 19.2 },
        { name: 'Капелла', ra: 5.3, dec: 46.0 },
        { name: 'Альтаир', ra: 19.8, dec: 8.9 },
        { name: 'Денеб', ra: 20.7, dec: 45.3 },
        { name: 'Спика', ra: 13.4, dec: -11.2 },
      ];

      // Background stars sprinkle
      ctx.fillStyle = '#94a3b8';
      for (let i = 0; i < 90; i++) {
        const rx = (Math.sin(i * 99) * 0.5 + 0.5) * width;
        const ry = (Math.cos(i * 33) * 0.5 + 0.5) * height;
        ctx.beginPath();
        ctx.arc(rx, ry, i % 5 === 0 ? 1.5 : 0.8, 0, Math.PI * 2);
        ctx.fill();
      }

      // Named stars
      stars.forEach((st) => {
        const sx = toCanvasX(st.ra);
        const sy = toCanvasY(st.dec);
        ctx.fillStyle = '#f8fafc';
        ctx.beginPath();
        ctx.arc(sx, sy, 2.5, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = '#64748b';
        ctx.font = '8px sans-serif';
        ctx.fillText(st.name, sx + 5, sy + 3);
      });

      // Radiation Belt band
      ctx.fillStyle = 'rgba(245, 158, 11, 0.04)';
      ctx.fillRect(0, toCanvasY(35), width, toCanvasY(-35) - toCanvasY(35));
    } else {
      // Ground Map Projection (Equirectangular)
      ctx.fillStyle = '#060d1b';
      ctx.fillRect(0, 0, width, height);

      const toCanvasX = (lon: number) => ((lon + 180) / 360) * width;
      const toCanvasY = (lat: number) => ((90 - lat) / 180) * height;

      // Lat/Lon Grid lines
      ctx.strokeStyle = '#1e293b';
      ctx.lineWidth = 1;
      for (let lon = -180; lon <= 180; lon += 30) {
        const x = toCanvasX(lon);
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, height);
        ctx.stroke();

        ctx.fillStyle = '#475569';
        ctx.font = '9px monospace';
        ctx.fillText(`${lon}°`, x + 2, height - 6);
      }
      for (let lat = -60; lat <= 60; lat += 30) {
        const y = toCanvasY(lat);
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(width, y);
        ctx.stroke();

        ctx.fillStyle = '#475569';
        ctx.font = '9px monospace';
        ctx.fillText(`${lat > 0 ? `+${lat}` : lat}°`, 6, y - 4);
      }

      // Equator & Prime Meridian
      ctx.strokeStyle = '#334155';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(0, height / 2);
      ctx.lineTo(width, height / 2);
      ctx.stroke();

      const primeX = toCanvasX(0);
      ctx.beginPath();
      ctx.moveTo(primeX, 0);
      ctx.lineTo(primeX, height);
      ctx.stroke();

      // Continents landmass polygons (simplified)
      ctx.fillStyle = '#0f172a';
      // Eurasia / Africa
      ctx.beginPath();
      ctx.moveTo(toCanvasX(-10), toCanvasY(36));
      ctx.lineTo(toCanvasX(40), toCanvasY(35));
      ctx.lineTo(toCanvasX(80), toCanvasY(70));
      ctx.lineTo(toCanvasX(160), toCanvasY(65));
      ctx.lineTo(toCanvasX(140), toCanvasY(35));
      ctx.lineTo(toCanvasX(100), toCanvasY(15));
      ctx.lineTo(toCanvasX(50), toCanvasY(12));
      ctx.lineTo(toCanvasX(50), toCanvasY(-30));
      ctx.lineTo(toCanvasX(20), toCanvasY(-34));
      ctx.lineTo(toCanvasX(-15), toCanvasY(12));
      ctx.closePath();
      ctx.fill();

      // Americas
      ctx.beginPath();
      ctx.moveTo(toCanvasX(-125), toCanvasY(50));
      ctx.lineTo(toCanvasX(-70), toCanvasY(55));
      ctx.lineTo(toCanvasX(-75), toCanvasY(25));
      ctx.lineTo(toCanvasX(-35), toCanvasY(-5));
      ctx.lineTo(toCanvasX(-70), toCanvasY(-50));
      ctx.lineTo(toCanvasX(-80), toCanvasY(10));
      ctx.lineTo(toCanvasX(-120), toCanvasY(30));
      ctx.closePath();
      ctx.fill();

      // Australia
      ctx.beginPath();
      ctx.moveTo(toCanvasX(115), toCanvasY(-20));
      ctx.lineTo(toCanvasX(150), toCanvasY(-22));
      ctx.lineTo(toCanvasX(145), toCanvasY(-38));
      ctx.lineTo(toCanvasX(115), toCanvasY(-35));
      ctx.closePath();
      ctx.fill();
    }

    // Render registered Team Objects
    objects.forEach((obj) => {
      let ox: number;
      let oy: number;

      if (projection === 'celestial') {
        ox = (obj.coordinates.raHours / 24) * width;
        oy = ((90 - obj.coordinates.decDeg) / 180) * height;
      } else {
        // Approximate equatorial to sub-satellite mapping on Earth
        const lon = obj.coordinates.raHours * 15 - 180;
        const lat = obj.coordinates.decDeg;
        ox = ((lon + 180) / 360) * width;
        oy = ((90 - lat) / 180) * height;
      }

      const isSelected = obj.id === selectedObjectId;
      const color =
        obj.color ||
        (obj.type === 'satellite'
          ? '#38bdf8'
          : obj.type === 'observation_zone'
            ? '#34d399'
            : obj.type === 'radiation_belt'
              ? '#f59e0b'
              : obj.type === 'ground_station'
                ? '#a855f7'
                : '#f43f5e');

      if (isSelected) {
        ctx.strokeStyle = color;
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.arc(ox, oy, 16, 0, Math.PI * 2);
        ctx.stroke();

        ctx.strokeStyle = 'rgba(255, 255, 255, 0.4)';
        ctx.beginPath();
        ctx.arc(ox, oy, 22, 0, Math.PI * 2);
        ctx.stroke();
      }

      ctx.fillStyle = color;
      ctx.beginPath();
      ctx.arc(ox, oy, isSelected ? 7 : 5, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 1.5;
      ctx.stroke();

      ctx.fillStyle = isSelected ? '#ffffff' : '#cbd5e1';
      ctx.font = isSelected ? 'bold 10px sans-serif' : '9px sans-serif';
      ctx.fillText(obj.name, ox + 9, oy - 4);

      ctx.fillStyle = '#94a3b8';
      ctx.font = '8px sans-serif';
      ctx.fillText(`«${obj.teamName}»`, ox + 9, oy + 6);
    });
  }, [projection, objects, selectedObjectId]);

  // Click on canvas to select object or set coordinates for new marker
  const handleCanvasClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const clickX = ((e.clientX - rect.left) / rect.width) * canvas.width;
    const clickY = ((e.clientY - rect.top) / rect.height) * canvas.height;

    const clickedRa = +((clickX / canvas.width) * 24).toFixed(1);
    const clickedDec = +(90 - (clickY / canvas.height) * 180).toFixed(1);

    // Find nearest team object within 30px
    let nearest: SpaceMapObject | null = null;
    let minDist = 30;

    objects.forEach((obj) => {
      let ox: number;
      let oy: number;
      if (projection === 'celestial') {
        ox = (obj.coordinates.raHours / 24) * canvas.width;
        oy = ((90 - obj.coordinates.decDeg) / 180) * canvas.height;
      } else {
        const lon = obj.coordinates.raHours * 15 - 180;
        const lat = obj.coordinates.decDeg;
        ox = ((lon + 180) / 360) * canvas.width;
        oy = ((90 - lat) / 180) * canvas.height;
      }

      const dist = Math.hypot(clickX - ox, clickY - oy);
      if (dist < minDist) {
        minDist = dist;
        nearest = obj;
      }
    });

    if (nearest) {
      setSelectedObjectId((nearest as SpaceMapObject).id);
    } else {
      setRaHours(clickedRa);
      setDecDeg(clickedDec);
    }
  };

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    const newObj: SpaceMapObject = {
      id: `obj_${Date.now()}`,
      name,
      teamId: activeTeam.id,
      teamName: activeTeam.name,
      type,
      coordinates: { raHours, decDeg, altitudeKm },
      description:
        description || 'Исследовательская область или спутниковый объект проекта команды.',
      specs: specs || `${altitudeKm} км, целевой эксперимент`,
      createdAt: 'Сегодня',
      color:
        type === 'satellite'
          ? '#38bdf8'
          : type === 'observation_zone'
            ? '#34d399'
            : type === 'radiation_belt'
              ? '#f59e0b'
              : type === 'ground_station'
                ? '#a855f7'
                : '#f43f5e',
    };

    onAddObject(newObj);
    setSelectedObjectId(newObj.id);
    setIsAddModalOpen(false);

    setName('');
    setDescription('');
    setSpecs('');
  };

  const handleResetTrajectoryTrail = () => {
    setTrajectoryHistory([
      {
        epoch: telemetry.epoch || Date.now(),
        timestamp: telemetry.timestamp || 'Сейчас',
        lat: telemetry.latitude,
        lon: telemetry.longitude,
        raHours: currentCubeSatPoint.raHours,
        decDeg: currentCubeSatPoint.decDeg,
        altitudeKm: telemetry.altitudeKm,
        velocityKms: telemetry.velocityKms,
        mode: telemetry.mode,
        batterySocPercent: telemetry.batterySocPercent,
      },
    ]);
  };

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="rounded-2xl border border-cyan-500/25 bg-gradient-to-r from-slate-950 via-slate-900 to-indigo-950/30 p-5 shadow-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-cyan-500/20 text-cyan-400 border border-cyan-500/30 shadow-inner">
            <Globe className="h-6 w-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-bold text-white">
                Интерактивная карта космоса и орбитальной траектории
              </h1>
              <span className="rounded bg-cyan-500/20 px-2 py-0.5 text-[10px] font-semibold text-cyan-300 border border-cyan-500/30">
                SVG TELEMETRY TRACK
              </span>
            </div>
            <p className="mt-0.5 text-xs text-slate-300">
              Визуализация реальной траектории полета CubeSat на основе потоковой телеметрии с
              векторной SVG-графикой, прогнозом витка и зонами радиоконтакта.
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => setIsAddModalOpen(true)}
            className="flex items-center gap-1.5 rounded-xl bg-cyan-500 px-4 py-2 text-xs font-bold text-slate-950 hover:bg-cyan-400 shadow-lg shadow-cyan-500/25 transition-all"
          >
            <Plus className="h-4 w-4" />
            <span>Отметить объект на карте</span>
          </button>
        </div>
      </div>

      {/* Trajectory Controls & Mode Switcher Bar */}
      <div className="rounded-xl border border-slate-800 bg-slate-900/90 p-3.5 shadow-md flex flex-wrap items-center justify-between gap-3 text-xs">
        {/* Left: Projection switcher */}
        <div className="flex items-center gap-2">
          <span className="text-slate-400 font-medium flex items-center gap-1.5">
            <Navigation className="h-3.5 w-3.5 text-cyan-400" />
            Проекция:
          </span>
          <div className="inline-flex rounded-lg bg-slate-950 p-1 border border-slate-800">
            <button
              onClick={() => setProjection('celestial')}
              className={`rounded px-3 py-1 text-xs font-semibold transition-colors flex items-center gap-1.5 ${
                projection === 'celestial'
                  ? 'bg-cyan-500 text-slate-950 shadow-sm'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Compass className="h-3.5 w-3.5" />
              Небесная сфера (RA / Dec)
            </button>
            <button
              onClick={() => setProjection('ground')}
              className={`rounded px-3 py-1 text-xs font-semibold transition-colors flex items-center gap-1.5 ${
                projection === 'ground'
                  ? 'bg-cyan-500 text-slate-950 shadow-sm'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Globe className="h-3.5 w-3.5" />
              Подспутниковая трасса (Земля)
            </button>
          </div>
        </div>

        {/* Right: SVG Layer toggles */}
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => setShowTrajectory(!showTrajectory)}
            className={`rounded-lg px-2.5 py-1.5 text-xs font-medium border flex items-center gap-1.5 transition-colors ${
              showTrajectory
                ? 'bg-sky-500/20 border-sky-500/40 text-sky-300'
                : 'bg-slate-950 border-slate-800 text-slate-500 hover:text-slate-400'
            }`}
            title="Включить/выключить отображение траектории CubeSat"
          >
            <Satellite className="h-3.5 w-3.5" />
            <span>Траектория CubeSat</span>
          </button>

          <button
            onClick={() => setShowFutureOrbit(!showFutureOrbit)}
            className={`rounded-lg px-2.5 py-1.5 text-xs font-medium border flex items-center gap-1.5 transition-colors ${
              showFutureOrbit
                ? 'bg-amber-500/20 border-amber-500/40 text-amber-300'
                : 'bg-slate-950 border-slate-800 text-slate-500 hover:text-slate-400'
            }`}
            title="Прогноз орбитального витка на 95 минут вперед"
          >
            <Layers className="h-3.5 w-3.5" />
            <span>Прогноз витка</span>
          </button>

          <button
            onClick={() => setShowHistoryTrail(!showHistoryTrail)}
            className={`rounded-lg px-2.5 py-1.5 text-xs font-medium border flex items-center gap-1.5 transition-colors ${
              showHistoryTrail
                ? 'bg-indigo-500/20 border-indigo-500/40 text-indigo-300'
                : 'bg-slate-950 border-slate-800 text-slate-500 hover:text-slate-400'
            }`}
            title="Отображение истории полета за прошлые минуты"
          >
            <Activity className="h-3.5 w-3.5" />
            <span>След полета</span>
          </button>

          <button
            onClick={() => setShowGroundStations(!showGroundStations)}
            className={`rounded-lg px-2.5 py-1.5 text-xs font-medium border flex items-center gap-1.5 transition-colors ${
              showGroundStations
                ? 'bg-emerald-500/20 border-emerald-500/40 text-emerald-300'
                : 'bg-slate-950 border-slate-800 text-slate-500 hover:text-slate-400'
            }`}
            title="Наземные станции приема и зоны радиовидимости"
          >
            <Radio className="h-3.5 w-3.5" />
            <span>Станции связи</span>
          </button>

          <button
            onClick={() => setShowFootprint(!showFootprint)}
            className={`rounded-lg px-2.5 py-1.5 text-xs font-medium border flex items-center gap-1.5 transition-colors ${
              showFootprint
                ? 'bg-cyan-500/20 border-cyan-500/40 text-cyan-300'
                : 'bg-slate-950 border-slate-800 text-slate-500 hover:text-slate-400'
            }`}
            title="Зона радиопокрытия спутника (футпринт)"
          >
            <Compass className="h-3.5 w-3.5" />
            <span>Зона покрытия</span>
          </button>

          <button
            onClick={handleResetTrajectoryTrail}
            className="rounded-lg px-2.5 py-1.5 text-xs font-medium bg-slate-950 border border-slate-800 text-slate-400 hover:text-cyan-300 flex items-center gap-1.5 transition-colors"
            title="Сбросить накопленный трек"
          >
            <RefreshCw className="h-3 w-3" />
            <span>Сброс трека</span>
          </button>
        </div>
      </div>

      {/* Live Telemetry Status Strip */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 text-xs">
        <div className="rounded-xl border border-slate-800 bg-slate-950 p-3">
          <div className="text-[10px] text-slate-400 uppercase tracking-wider flex items-center gap-1">
            <Satellite className="h-3 w-3 text-sky-400" />
            Спутник / Борт
          </div>
          <div className="mt-1 font-bold text-white truncate">{telemetry.satelliteName}</div>
          <div className="mt-0.5 text-[10px] text-sky-400 font-mono">Режим: {telemetry.mode}</div>
        </div>

        <div className="rounded-xl border border-slate-800 bg-slate-950 p-3">
          <div className="text-[10px] text-slate-400 uppercase tracking-wider flex items-center gap-1">
            <Compass className="h-3 w-3 text-cyan-400" />
            Небесные координаты
          </div>
          <div className="mt-1 font-mono font-bold text-cyan-300">
            RA {currentCubeSatPoint.raHours}h
          </div>
          <div className="mt-0.5 text-[10px] text-slate-400 font-mono">
            Dec{' '}
            {currentCubeSatPoint.decDeg > 0
              ? `+${currentCubeSatPoint.decDeg}`
              : currentCubeSatPoint.decDeg}
            °
          </div>
        </div>

        <div className="rounded-xl border border-slate-800 bg-slate-950 p-3">
          <div className="text-[10px] text-slate-400 uppercase tracking-wider flex items-center gap-1">
            <Globe className="h-3 w-3 text-emerald-400" />
            Подспутниковая точка
          </div>
          <div className="mt-1 font-mono font-bold text-emerald-300">
            {telemetry.latitude.toFixed(2)}° N/S
          </div>
          <div className="mt-0.5 text-[10px] text-slate-400 font-mono">
            {telemetry.longitude.toFixed(2)}° E/W
          </div>
        </div>

        <div className="rounded-xl border border-slate-800 bg-slate-950 p-3">
          <div className="text-[10px] text-slate-400 uppercase tracking-wider flex items-center gap-1">
            <Activity className="h-3 w-3 text-amber-400" />
            Высота / Скорость
          </div>
          <div className="mt-1 font-mono font-bold text-amber-300">
            {telemetry.altitudeKm.toFixed(1)} км
          </div>
          <div className="mt-0.5 text-[10px] text-slate-400 font-mono">
            {telemetry.velocityKms.toFixed(2)} км/с
          </div>
        </div>

        <div className="rounded-xl border border-slate-800 bg-slate-950 p-3">
          <div className="text-[10px] text-slate-400 uppercase tracking-wider flex items-center gap-1">
            <Zap className="h-3 w-3 text-yellow-400" />
            Питание / Заряд
          </div>
          <div className="mt-1 font-mono font-bold text-yellow-300">
            {telemetry.batterySocPercent}%
          </div>
          <div className="mt-0.5 text-[10px] text-slate-400 font-mono">
            {telemetry.solarPowerW.toFixed(1)} Вт СБ
          </div>
        </div>

        <div className="rounded-xl border border-slate-800 bg-slate-950 p-3">
          <div className="text-[10px] text-slate-400 uppercase tracking-wider flex items-center gap-1">
            <Radio className="h-3 w-3 text-purple-400" />
            Радиоканал связи
          </div>
          <div className="mt-1 font-bold text-purple-300 truncate">
            {activeStation ? `В зоне: ${activeStation.city}` : 'Вне зоны станций'}
          </div>
          <div className="mt-0.5 text-[10px] text-slate-400 font-mono">
            RSSI: {telemetry.radioRssiDb} dBm
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row gap-3 items-center justify-between text-xs">
        <div className="relative w-full sm:w-80">
          <Search className="absolute left-3 top-2.5 h-3.5 w-3.5 text-slate-500" />
          <input
            type="text"
            placeholder="Поиск по названию или команде..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full rounded-xl border border-slate-800 bg-slate-900 pl-9 pr-3 py-2 text-white placeholder-slate-500 focus:border-cyan-500 focus:outline-none"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <Filter className="h-3.5 w-3.5 text-slate-400" />
          <select
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
            className="rounded-xl border border-slate-800 bg-slate-900 px-3 py-2 text-white focus:border-cyan-500 focus:outline-none"
          >
            <option value="all">Все типы объектов ({objects.length})</option>
            <option value="satellite">🛰️ КубСаты и спутники</option>
            <option value="observation_zone">🔭 Зоны наблюдений</option>
            <option value="radiation_belt">⚡ Радиационные пояса</option>
            <option value="ground_station">📡 Наземные пункты приема</option>
            <option value="separation_point">🚀 Точки отделения</option>
          </select>
        </div>
      </div>

      {/* Main Grid: Interactive Canvas & SVG Layer & Object Details Drawer */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left: Celestial Map Canvas + SVG Trajectory Overlay (8 cols) */}
        <div className="lg:col-span-8 rounded-2xl border border-slate-800 bg-slate-950 p-4 shadow-xl flex flex-col justify-between">
          <div className="flex items-center justify-between pb-3 border-b border-slate-850 text-xs">
            <div className="flex items-center gap-2 text-slate-400">
              <Compass className="h-4 w-4 text-cyan-400" />
              <span>
                {projection === 'celestial'
                  ? 'Экваториальная небесная сетка (Прямое восхождение α / Склонение δ) с наложением SVG-орбиты'
                  : 'Географическая равнопромежуточная проекция (Долгота λ / Широта φ) с подспутниковой трассой'}
              </span>
            </div>
            <div className="flex items-center gap-2 text-[10px] text-cyan-400">
              <span className="inline-block h-2 w-2 rounded-full bg-cyan-400 animate-pulse" />
              <span>SVG ПОТОК ТЕЛЕМЕТРИИ</span>
            </div>
          </div>

          {/* Canvas + SVG Layer Stack */}
          <div className="relative mt-3 overflow-hidden rounded-xl border border-slate-800 bg-slate-950">
            {/* HTML5 Canvas for stars/continents/grid */}
            <canvas
              ref={canvasRef}
              width={SVG_WIDTH}
              height={SVG_HEIGHT}
              onClick={handleCanvasClick}
              className="w-full h-[320px] sm:h-[440px] object-cover cursor-crosshair block"
            />

            {/* SVG Trajectory Layer */}
            {showTrajectory && (
              <svg
                viewBox={`0 0 ${SVG_WIDTH} ${SVG_HEIGHT}`}
                preserveAspectRatio="none"
                className="pointer-events-none absolute inset-0 h-full w-full"
              >
                <defs>
                  {/* Glowing filter for satellite beacon */}
                  <filter id="cubesatGlow" x="-50%" y="-50%" width="200%" height="200%">
                    <feGaussianBlur stdDeviation="3" result="blur" />
                    <feMerge>
                      <feMergeNode in="blur" />
                      <feMergeNode in="SourceGraphic" />
                    </feMerge>
                  </filter>

                  {/* Gradient for past trajectory trail */}
                  <linearGradient id="trailGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                    <stop offset="0%" stopColor="#0284c7" stopOpacity="0.2" />
                    <stop offset="60%" stopColor="#06b6d4" stopOpacity="0.8" />
                    <stop offset="100%" stopColor="#38bdf8" stopOpacity="1" />
                  </linearGradient>

                  {/* Gradient for projected future orbit */}
                  <linearGradient id="futureOrbitGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                    <stop offset="0%" stopColor="#38bdf8" stopOpacity="0.9" />
                    <stop offset="50%" stopColor="#a855f7" stopOpacity="0.6" />
                    <stop offset="100%" stopColor="#f59e0b" stopOpacity="0.4" />
                  </linearGradient>

                  {/* Radial gradient for ground footprint */}
                  <radialGradient id="footprintGradient" cx="50%" cy="50%" r="50%">
                    <stop offset="0%" stopColor="#06b6d4" stopOpacity="0.25" />
                    <stop offset="70%" stopColor="#0284c7" stopOpacity="0.08" />
                    <stop offset="100%" stopColor="#0369a1" stopOpacity="0" />
                  </radialGradient>

                  {/* Ground station link pulse gradient */}
                  <linearGradient id="linkBeamGrad" x1="0%" y1="0%" x2="100%" y2="0%">
                    <stop offset="0%" stopColor="#38bdf8" stopOpacity="1" />
                    <stop offset="100%" stopColor="#a855f7" stopOpacity="0.6" />
                  </linearGradient>
                </defs>

                {/* 1. Projected Future Orbit Path (SVG Dash Line) */}
                {showFutureOrbit && futureOrbitPathD && (
                  <path
                    d={futureOrbitPathD}
                    fill="none"
                    stroke="url(#futureOrbitGradient)"
                    strokeWidth="2.2"
                    strokeDasharray="5,4"
                    strokeLinecap="round"
                    className="opacity-80"
                  />
                )}

                {/* 2. Recorded Past Trajectory Trail (Glowing solid line) */}
                {showHistoryTrail && historyTrailPathD && (
                  <path
                    d={historyTrailPathD}
                    fill="none"
                    stroke="url(#trailGradient)"
                    strokeWidth="3.2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    filter="url(#cubesatGlow)"
                  />
                )}

                {/* 3. Past Breadcrumb Points along the Trail */}
                {showHistoryTrail &&
                  historySvgPoints.map((node, idx) => {
                    // Render dots every 2nd or 3rd point
                    if (idx % 2 !== 0 && idx !== historySvgPoints.length - 1) return null;
                    const opacity = Math.min(1, Math.max(0.2, (idx + 1) / historySvgPoints.length));
                    return (
                      <g
                        key={`trail_node_${idx}`}
                        className="pointer-events-auto cursor-pointer"
                        onMouseEnter={() =>
                          setHoveredNode({
                            point: node.raw,
                            x: node.x,
                            y: node.y,
                            label: `T: ${node.raw.timestamp}`,
                          })
                        }
                        onMouseLeave={() => setHoveredNode(null)}
                      >
                        <circle
                          cx={node.x}
                          cy={node.y}
                          r={idx === historySvgPoints.length - 1 ? 4 : 2.5}
                          fill="#38bdf8"
                          opacity={opacity}
                        />
                      </g>
                    );
                  })}

                {/* 4. Ground Stations & Radio Link Ray */}
                {showGroundStations &&
                  groundStationsWithStatus.map((gs, idx) => {
                    return (
                      <g key={`gs_${idx}`} className="pointer-events-auto">
                        {/* Coverage circle footprint around Ground Station */}
                        <circle
                          cx={gs.x}
                          cy={gs.y}
                          r={34}
                          fill={
                            gs.isVisible ? 'rgba(56, 189, 248, 0.08)' : 'rgba(168, 85, 247, 0.04)'
                          }
                          stroke={gs.isVisible ? '#38bdf8' : '#a855f7'}
                          strokeWidth="1"
                          strokeDasharray="2,3"
                          opacity={gs.isVisible ? 0.9 : 0.4}
                        />

                        {/* Station Pin */}
                        <circle
                          cx={gs.x}
                          cy={gs.y}
                          r={gs.isVisible ? 5 : 3.5}
                          fill={gs.isVisible ? '#38bdf8' : '#c084fc'}
                          stroke="#ffffff"
                          strokeWidth="1.2"
                        />

                        {/* Station Label */}
                        <text
                          x={gs.x + 8}
                          y={gs.y + 3}
                          fill={gs.isVisible ? '#38bdf8' : '#94a3b8'}
                          fontSize="8"
                          fontFamily="sans-serif"
                          fontWeight={gs.isVisible ? 'bold' : 'normal'}
                        >
                          {gs.city}
                        </text>

                        {/* Animated Radio Link Beam between CubeSat and station if visible */}
                        {gs.isVisible && (
                          <g>
                            <line
                              x1={currentCubeSatPoint.x}
                              y1={currentCubeSatPoint.y}
                              x2={gs.x}
                              y2={gs.y}
                              stroke="url(#linkBeamGrad)"
                              strokeWidth="2"
                              strokeDasharray="4,4"
                              opacity="0.85"
                            />
                            {/* Pulse ripples at the ground station */}
                            <circle
                              cx={gs.x}
                              cy={gs.y}
                              r="10"
                              fill="none"
                              stroke="#38bdf8"
                              strokeWidth="1.5"
                              opacity="0.7"
                            >
                              <animate
                                attributeName="r"
                                values="4;18;4"
                                dur="2s"
                                repeatCount="indefinite"
                              />
                              <animate
                                attributeName="opacity"
                                values="0.9;0;0.9"
                                dur="2s"
                                repeatCount="indefinite"
                              />
                            </circle>
                          </g>
                        )}
                      </g>
                    );
                  })}

                {/* 5. Sub-satellite Radio Footprint Ellipse around CubeSat */}
                {showFootprint && (
                  <ellipse
                    cx={currentCubeSatPoint.x}
                    cy={currentCubeSatPoint.y}
                    rx={38}
                    ry={26}
                    fill="url(#footprintGradient)"
                    stroke="#38bdf8"
                    strokeWidth="1.2"
                    strokeDasharray="3,3"
                    opacity="0.75"
                  />
                )}

                {/* 6. Active CubeSat SVG Graphic & Radar Beacon */}
                <g
                  transform={`translate(${currentCubeSatPoint.x}, ${currentCubeSatPoint.y})`}
                  className="pointer-events-auto cursor-pointer"
                  onClick={() => {
                    // Select or highlight satellite telemetry info
                    setHoveredNode({
                      point: {
                        epoch: telemetry.epoch || Date.now(),
                        timestamp: telemetry.timestamp || 'Сейчас',
                        lat: currentCubeSatPoint.lat,
                        lon: currentCubeSatPoint.lon,
                        raHours: currentCubeSatPoint.raHours,
                        decDeg: currentCubeSatPoint.decDeg,
                        altitudeKm: currentCubeSatPoint.altitudeKm,
                        velocityKms: currentCubeSatPoint.velocityKms,
                        mode: currentCubeSatPoint.mode,
                        batterySocPercent: telemetry.batterySocPercent,
                      },
                      x: currentCubeSatPoint.x,
                      y: currentCubeSatPoint.y,
                      label: `${currentCubeSatPoint.satelliteName} (Online)`,
                    });
                  }}
                >
                  {/* Expanding Radio Waves Pulse */}
                  <circle
                    cx="0"
                    cy="0"
                    r="8"
                    fill="none"
                    stroke="#38bdf8"
                    strokeWidth="1.5"
                    opacity="0.8"
                  >
                    <animate
                      attributeName="r"
                      values="8;26;8"
                      dur="2.4s"
                      repeatCount="indefinite"
                    />
                    <animate
                      attributeName="opacity"
                      values="0.8;0;0.8"
                      dur="2.4s"
                      repeatCount="indefinite"
                    />
                  </circle>

                  {/* Satellite body halo */}
                  <circle cx="0" cy="0" r="14" fill="rgba(14, 165, 233, 0.2)" />

                  {/* CubeSat Chassis & Solar Panels Graphic */}
                  {/* Left Solar Panel */}
                  <rect
                    x="-18"
                    y="-5"
                    width="9"
                    height="10"
                    rx="1"
                    fill="#0284c7"
                    stroke="#0369a1"
                    strokeWidth="0.8"
                  />
                  <line x1="-13.5" y1="-5" x2="-13.5" y2="5" stroke="#bae6fd" strokeWidth="0.5" />
                  <line x1="-18" y1="0" x2="-9" y2="0" stroke="#bae6fd" strokeWidth="0.5" />

                  {/* Right Solar Panel */}
                  <rect
                    x="9"
                    y="-5"
                    width="9"
                    height="10"
                    rx="1"
                    fill="#0284c7"
                    stroke="#0369a1"
                    strokeWidth="0.8"
                  />
                  <line x1="13.5" y1="-5" x2="13.5" y2="5" stroke="#bae6fd" strokeWidth="0.5" />
                  <line x1="9" y1="0" x2="18" y2="0" stroke="#bae6fd" strokeWidth="0.5" />

                  {/* Central 3U/1U Body Chassis */}
                  <rect
                    x="-7"
                    y="-7"
                    width="14"
                    height="14"
                    rx="2"
                    fill="#0f172a"
                    stroke="#38bdf8"
                    strokeWidth="1.5"
                    filter="url(#cubesatGlow)"
                  />

                  {/* Internal gold payload core */}
                  <rect x="-4" y="-4" width="8" height="8" rx="1" fill="#f59e0b" opacity="0.9" />

                  {/* Antenna mast */}
                  <line x1="0" y1="-7" x2="0" y2="-12" stroke="#e0f2fe" strokeWidth="1" />
                  <circle cx="0" cy="-12" r="1.2" fill="#ef4444" />

                  {/* Flashing Beacon LED */}
                  <circle cx="0" cy="0" r="2.5" fill="#38bdf8">
                    <animate
                      attributeName="opacity"
                      values="1;0.2;1"
                      dur="1s"
                      repeatCount="indefinite"
                    />
                  </circle>

                  {/* Live Callout Badge next to CubeSat */}
                  <g transform="translate(18, -18)">
                    <rect
                      x="0"
                      y="0"
                      width="120"
                      height="32"
                      rx="4"
                      fill="#030712"
                      stroke="#0284c7"
                      strokeWidth="1"
                      opacity="0.9"
                    />
                    <text x="6" y="11" fill="#ffffff" fontSize="8" fontWeight="bold">
                      {currentCubeSatPoint.satelliteName}
                    </text>
                    <text x="6" y="21" fill="#38bdf8" fontSize="7" fontFamily="monospace">
                      {currentCubeSatPoint.altitudeKm.toFixed(1)} км |{' '}
                      {currentCubeSatPoint.velocityKms.toFixed(2)} км/с
                    </text>
                    <text x="6" y="28" fill="#94a3b8" fontSize="6.5" fontFamily="monospace">
                      {projection === 'celestial'
                        ? `RA:${currentCubeSatPoint.raHours}h Dec:${currentCubeSatPoint.decDeg > 0 ? `+${currentCubeSatPoint.decDeg}` : currentCubeSatPoint.decDeg}°`
                        : `Lat:${currentCubeSatPoint.lat.toFixed(1)}° Lon:${currentCubeSatPoint.lon.toFixed(1)}°`}
                    </text>
                  </g>
                </g>

                {/* 7. Hover Tooltip Popup for Trajectory Nodes */}
                {hoveredNode && (
                  <g
                    transform={`translate(${Math.min(SVG_WIDTH - 150, Math.max(10, hoveredNode.x + 10))}, ${Math.max(30, hoveredNode.y - 45)})`}
                    className="pointer-events-none"
                  >
                    <rect
                      x="0"
                      y="0"
                      width="140"
                      height="46"
                      rx="5"
                      fill="#0b1120"
                      stroke="#38bdf8"
                      strokeWidth="1"
                      opacity="0.95"
                    />
                    <text x="6" y="12" fill="#38bdf8" fontSize="8" fontWeight="bold">
                      {hoveredNode.label}
                    </text>
                    <text x="6" y="23" fill="#ffffff" fontSize="7.5" fontFamily="monospace">
                      Коорд: {hoveredNode.point.raHours}h / {hoveredNode.point.decDeg}°
                    </text>
                    <text x="6" y="33" fill="#cbd5e1" fontSize="7" fontFamily="monospace">
                      Гео: {hoveredNode.point.lat}° N/S, {hoveredNode.point.lon}° E/W
                    </text>
                    <text x="6" y="42" fill="#34d399" fontSize="6.5" fontFamily="monospace">
                      Высота: {hoveredNode.point.altitudeKm} км | {hoveredNode.point.velocityKms}{' '}
                      км/с
                    </text>
                  </g>
                )}
              </svg>
            )}
          </div>

          {/* Map Legend */}
          <div className="mt-3 flex flex-wrap items-center justify-between gap-2 text-[10px] text-slate-400 pt-2 border-t border-slate-850">
            <div className="flex flex-wrap items-center gap-3">
              <span className="flex items-center gap-1">
                <span className="h-2 w-2 rounded-full bg-sky-400 inline-block shadow-sm" /> CubeSat
                (Live)
              </span>
              <span className="flex items-center gap-1">
                <span className="h-1.5 w-4 bg-sky-400 inline-block rounded" /> След полета (SVG)
              </span>
              <span className="flex items-center gap-1">
                <span className="h-1.5 w-4 border-b border-amber-400 border-dashed inline-block" />{' '}
                Прогноз витка
              </span>
              <span className="flex items-center gap-1">
                <span className="h-2 w-2 rounded-full bg-purple-400 inline-block" /> Наземный пункт
              </span>
              <span className="flex items-center gap-1">
                <span className="h-2 w-2 rounded-full bg-emerald-400 inline-block" /> Зона
                наблюдений
              </span>
            </div>
            <span>
              {projection === 'celestial' ? 'Координатная сетка J2000' : 'WGS-84 Equirectangular'}
            </span>
          </div>
        </div>

        {/* Right: Selected Object Card & Object List (4 cols) */}
        <div className="lg:col-span-4 space-y-4">
          {/* Selected object detail */}
          {selectedObject ? (
            <div className="rounded-2xl border border-cyan-900/40 bg-slate-900/90 p-5 text-xs shadow-xl space-y-3">
              <div className="flex items-start justify-between border-b border-slate-800 pb-2">
                <div>
                  <span
                    className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold ${
                      selectedObject.type === 'satellite'
                        ? 'bg-sky-500/20 text-sky-300 border border-sky-500/30'
                        : selectedObject.type === 'observation_zone'
                          ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                          : selectedObject.type === 'radiation_belt'
                            ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                            : selectedObject.type === 'ground_station'
                              ? 'bg-purple-500/20 text-purple-300 border border-purple-500/30'
                              : 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                    }`}
                  >
                    {selectedObject.type === 'satellite'
                      ? 'Орбитальный КубСат'
                      : selectedObject.type === 'observation_zone'
                        ? 'Научная зона наблюдений'
                        : selectedObject.type === 'radiation_belt'
                          ? 'Радиационный пояс'
                          : selectedObject.type === 'ground_station'
                            ? 'Школьный наземный пункт'
                            : 'Точка отделения'}
                  </span>
                  <h3 className="text-sm font-bold text-white mt-1.5">{selectedObject.name}</h3>
                </div>

                {(selectedObject.teamId === activeTeam.id || userRole === 'organizer') && (
                  <button
                    onClick={() => onDeleteObject(selectedObject.id)}
                    className="text-slate-500 hover:text-rose-400 p-1"
                    title="Удалить маркер"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                )}
              </div>

              <div className="space-y-1.5 text-slate-300">
                <div className="flex justify-between text-slate-400">
                  <span>Команда:</span>
                  <strong className="text-white">«{selectedObject.teamName}»</strong>
                </div>
                <div className="flex justify-between text-slate-400">
                  <span>Прямое восхождение (RA):</span>
                  <strong className="text-cyan-300 font-mono">
                    {selectedObject.coordinates.raHours}h
                  </strong>
                </div>
                <div className="flex justify-between text-slate-400">
                  <span>Склонение (Dec):</span>
                  <strong className="text-cyan-300 font-mono">
                    {selectedObject.coordinates.decDeg > 0
                      ? `+${selectedObject.coordinates.decDeg}`
                      : selectedObject.coordinates.decDeg}
                    °
                  </strong>
                </div>
                {selectedObject.coordinates.altitudeKm !== undefined && (
                  <div className="flex justify-between text-slate-400">
                    <span>Высота орбиты / слоя:</span>
                    <strong className="text-emerald-300 font-mono">
                      {selectedObject.coordinates.altitudeKm} км
                    </strong>
                  </div>
                )}
              </div>

              <div className="rounded-xl border border-slate-800 bg-slate-950 p-3 text-slate-300 text-[11px] leading-relaxed">
                {selectedObject.description}
              </div>

              <div className="rounded-xl border border-slate-800 bg-slate-950/60 p-2.5 text-[10px] font-mono text-slate-400">
                СПЕЦИФИКАЦИЯ: {selectedObject.specs}
              </div>
            </div>
          ) : (
            <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-5 text-center text-xs text-slate-500">
              Выберите объект на карте для просмотра спецификации
            </div>
          )}

          {/* List of registered objects */}
          <div className="rounded-2xl border border-slate-800 bg-slate-900/80 p-4 text-xs shadow-xl space-y-2">
            <div className="font-bold text-white mb-2 flex items-center justify-between">
              <span>Объекты на карте ({filteredObjects.length}):</span>
            </div>
            <div className="space-y-1.5 max-h-56 overflow-y-auto pr-1">
              {filteredObjects.map((obj) => (
                <div
                  key={obj.id}
                  role="button"
                  tabIndex={0}
                  aria-pressed={obj.id === selectedObjectId}
                  onClick={() => setSelectedObjectId(obj.id)}
                  onKeyDown={(event) => {
                    if (event.key === 'Enter' || event.key === ' ') {
                      event.preventDefault();
                      setSelectedObjectId(obj.id);
                    }
                  }}
                  className={`cursor-pointer rounded-lg border p-2 text-xs transition-colors ${
                    obj.id === selectedObjectId
                      ? 'border-cyan-500 bg-cyan-950/30 text-white font-medium'
                      : 'border-slate-800 bg-slate-950 text-slate-300 hover:bg-slate-900'
                  }`}
                >
                  <div className="flex items-center justify-between text-[11px]">
                    <span className="font-semibold">{obj.name}</span>
                    <span className="text-[10px] text-slate-500 font-mono">
                      {obj.coordinates.altitudeKm} км
                    </span>
                  </div>
                  <div className="text-[10px] text-slate-400">Команда «{obj.teamName}»</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Add New Marker Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4 animate-in fade-in">
          <div className="w-full max-w-lg rounded-2xl border border-cyan-800/40 bg-slate-900 p-6 shadow-2xl text-slate-200 text-xs">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <MapPin className="h-5 w-5 text-cyan-400" />
                <h3 className="text-base font-bold text-white">
                  Добавить объект / область на карту
                </h3>
              </div>
              <button
                onClick={() => setIsAddModalOpen(false)}
                className="text-slate-400 hover:text-white"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleFormSubmit} className="mt-4 space-y-3.5">
              <div>
                <label
                  htmlFor="spacemaptab_field_1"
                  className="block text-slate-300 font-medium mb-1"
                >
                  Название объекта *
                </label>
                <input
                  id="spacemaptab_field_1"
                  type="text"
                  required
                  placeholder="например, КубСат «Гелиос-1» (Апогей ССО)"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full rounded-lg border border-slate-800 bg-slate-950 px-3 py-2 text-white focus:border-cyan-500 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label
                    htmlFor="spacemaptab_field_2"
                    className="block text-slate-300 font-medium mb-1"
                  >
                    Тип объекта
                  </label>
                  <select
                    id="spacemaptab_field_2"
                    value={type}
                    onChange={(e) => setType(e.target.value as SpaceObjectType)}
                    className="w-full rounded-lg border border-slate-800 bg-slate-950 px-3 py-2 text-white focus:border-cyan-500 focus:outline-none"
                  >
                    <option value="satellite">🛰️ Спутник / КубСат</option>
                    <option value="observation_zone">🔭 Зона наблюдений</option>
                    <option value="radiation_belt">⚡ Радиационный пояс</option>
                    <option value="ground_station">📡 Наземная станция</option>
                    <option value="separation_point">🚀 Точка разделения</option>
                  </select>
                </div>
                <div>
                  <label
                    htmlFor="spacemaptab_field_3"
                    className="block text-slate-300 font-medium mb-1"
                  >
                    Высота (км)
                  </label>
                  <input
                    id="spacemaptab_field_3"
                    type="number"
                    value={altitudeKm}
                    onChange={(e) => setAltitudeKm(+e.target.value)}
                    className="w-full rounded-lg border border-slate-800 bg-slate-950 px-3 py-2 text-white focus:border-cyan-500 focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label
                    htmlFor="spacemaptab_field_4"
                    className="block text-slate-300 font-medium mb-1"
                  >
                    Прямое восхождение RA (0..24 ч)
                  </label>
                  <input
                    id="spacemaptab_field_4"
                    type="number"
                    step="0.1"
                    min="0"
                    max="24"
                    value={raHours}
                    onChange={(e) => setRaHours(+e.target.value)}
                    className="w-full rounded-lg border border-slate-800 bg-slate-950 px-3 py-2 text-white focus:border-cyan-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label
                    htmlFor="spacemaptab_field_5"
                    className="block text-slate-300 font-medium mb-1"
                  >
                    Склонение Dec (-90..+90°)
                  </label>
                  <input
                    id="spacemaptab_field_5"
                    type="number"
                    step="0.1"
                    min="-90"
                    max="90"
                    value={decDeg}
                    onChange={(e) => setDecDeg(+e.target.value)}
                    className="w-full rounded-lg border border-slate-800 bg-slate-950 px-3 py-2 text-white focus:border-cyan-500 focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label
                  htmlFor="spacemaptab_field_6"
                  className="block text-slate-300 font-medium mb-1"
                >
                  Описание научной цели миссии
                </label>
                <textarea
                  id="spacemaptab_field_6"
                  rows={2}
                  placeholder="Опишите, какую научную или инженерную задачу решает данный объект..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full rounded-lg border border-slate-800 bg-slate-950 px-3 py-2 text-white focus:border-cyan-500 focus:outline-none"
                />
              </div>

              <div>
                <label
                  htmlFor="spacemaptab_field_7"
                  className="block text-slate-300 font-medium mb-1"
                >
                  Технические спецификации
                </label>
                <input
                  id="spacemaptab_field_7"
                  type="text"
                  placeholder="Частота, полезная нагрузка, энергобаланс"
                  value={specs}
                  onChange={(e) => setSpecs(e.target.value)}
                  className="w-full rounded-lg border border-slate-800 bg-slate-950 px-3 py-2 text-white focus:border-cyan-500 focus:outline-none"
                />
              </div>

              <div className="mt-5 flex items-center justify-end gap-3 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="rounded-lg px-4 py-2 text-slate-400 hover:text-white"
                >
                  Отмена
                </button>
                <button
                  type="submit"
                  className="rounded-lg bg-cyan-500 px-5 py-2 font-bold text-slate-950 hover:bg-cyan-400 shadow-lg shadow-cyan-500/20"
                >
                  Опубликовать на карте
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

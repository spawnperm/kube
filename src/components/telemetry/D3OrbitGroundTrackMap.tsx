import React, { useEffect, useRef, useState, useMemo } from 'react';
import * as d3 from 'd3';
import {
  Satellite,
  Radio,
  MapPin,
  Compass,
  Maximize2,
  Minimize2,
  RefreshCw,
  Eye,
  Layers,
  Activity,
  CheckCircle2,
  Volume2,
  Clock,
} from 'lucide-react';
import { TelemetryPacket } from '../../types';

export interface GroundStation {
  id: string;
  name: string;
  city: string;
  lat: number;
  lon: number;
  coverageRadiusKm: number;
  freqMhz: number;
  network: 'СОНИКС' | 'Space-Pi' | 'Роскосмос';
  status: 'ONLINE' | 'STANDBY';
  elevationDeg?: number;
}

export const GROUND_STATIONS: GroundStation[] = [
  {
    id: 'perm',
    name: 'ПНИПУ / СОНИКС-01',
    city: 'Пермь',
    lat: 58.01,
    lon: 56.25,
    coverageRadiusKm: 2100,
    freqMhz: 437.425,
    network: 'СОНИКС',
    status: 'ONLINE',
  },
  {
    id: 'moscow',
    name: 'ЦУП МГУ / СОНИКС-02',
    city: 'Москва',
    lat: 55.75,
    lon: 37.62,
    coverageRadiusKm: 2200,
    freqMhz: 437.425,
    network: 'СОНИКС',
    status: 'ONLINE',
  },
  {
    id: 'samara',
    name: 'СГАУ им. Королёва',
    city: 'Самара',
    lat: 53.2,
    lon: 50.15,
    coverageRadiusKm: 2000,
    freqMhz: 437.425,
    network: 'Space-Pi',
    status: 'ONLINE',
  },
  {
    id: 'vostochny',
    name: 'Космодром «Восточный»',
    city: 'Амурская обл.',
    lat: 51.88,
    lon: 128.33,
    coverageRadiusKm: 2400,
    freqMhz: 437.425,
    network: 'Роскосмос',
    status: 'ONLINE',
  },
  {
    id: 'krasnoyarsk',
    name: 'СибГУ им. Решетнёва',
    city: 'Красноярск',
    lat: 56.01,
    lon: 92.85,
    coverageRadiusKm: 2150,
    freqMhz: 437.425,
    network: 'СОНИКС',
    status: 'ONLINE',
  },
  {
    id: 'kaluga',
    name: 'ГМИК им. Циолковского',
    city: 'Калуга',
    lat: 54.51,
    lon: 36.26,
    coverageRadiusKm: 1950,
    freqMhz: 437.425,
    network: 'Space-Pi',
    status: 'ONLINE',
  },
];

interface D3OrbitGroundTrackMapProps {
  telemetry?: TelemetryPacket;
  className?: string;
  onStationSelect?: (station: GroundStation) => void;
}

export const D3OrbitGroundTrackMap: React.FC<D3OrbitGroundTrackMapProps> = ({
  telemetry,
  className = '',
  onStationSelect,
}) => {
  const svgRef = useRef<SVGSVGElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);

  const [selectedStationId, setSelectedStationId] = useState<string>('perm');
  const [showFootprints, setShowFootprints] = useState<boolean>(true);
  const [showFutureOrbits, setShowFutureOrbits] = useState<boolean>(true);
  const [selectedStationsFilter, setSelectedStationsFilter] = useState<string[]>(
    GROUND_STATIONS.map((s) => s.id),
  );
  const [zoomLevel, setZoomLevel] = useState<number>(1);

  // Satellite dynamic position calculation (SSO orbit ~520km, inclination 97.4 deg)
  const [orbitTimeSec, setOrbitTimeSec] = useState<number>(() => Date.now() / 1000);

  useEffect(() => {
    const timer = setInterval(() => {
      setOrbitTimeSec((prev) => prev + 1);
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // Compute satellite position from orbital parameters or telemetry
  const satPosition = useMemo(() => {
    const periodSec = 95.12 * 60; // 5707s
    const t = (orbitTimeSec % periodSec) / periodSec;
    const meanAnomaly = t * 2 * Math.PI;

    // Sun-synchronous orbit: i = 97.4 deg
    const inc = (97.45 * Math.PI) / 180;
    const lat = (Math.asin(Math.sin(inc) * Math.sin(meanAnomaly)) * 180) / Math.PI;

    // Node regression + Earth rotation: 360 deg in 24h + nodal precession
    const earthRotDeg = ((orbitTimeSec % 86400) / 86400) * 360;
    const orbitLon =
      (Math.atan2(Math.cos(inc) * Math.sin(meanAnomaly), Math.cos(meanAnomaly)) * 180) / Math.PI;
    let lon = (orbitLon - earthRotDeg + 120) % 360;
    if (lon > 180) lon -= 360;
    if (lon < -180) lon += 360;

    return {
      lat: +(telemetry?.latitude ?? lat).toFixed(3),
      lon: +(telemetry?.longitude ?? lon).toFixed(3),
      alt: telemetry?.altitudeKm ?? 521.4,
    };
  }, [orbitTimeSec, telemetry]);

  // Generate ground track points for: current orbit, past orbit, next orbit
  const orbitTracks = useMemo(() => {
    const periodSec = 95.12 * 60;
    const inc = (97.45 * Math.PI) / 180;
    const currentT = (orbitTimeSec % periodSec) / periodSec;
    const earthRotDegPerSec = 360 / 86164;

    const generateOrbit = (orbitOffset: number) => {
      const pts: Array<[number, number]> = [];
      const steps = 180;
      for (let i = 0; i <= steps; i++) {
        const frac = i / steps;
        const totalT = currentT + orbitOffset + frac;
        const u = totalT * 2 * Math.PI;

        const lat = (Math.asin(Math.sin(inc) * Math.sin(u)) * 180) / Math.PI;
        const orbitLon = (Math.atan2(Math.cos(inc) * Math.sin(u), Math.cos(u)) * 180) / Math.PI;

        const elapsed = (totalT - currentT) * periodSec;
        const earthRot = elapsed * earthRotDegPerSec;
        let lon = (orbitLon - earthRot + 120) % 360;
        if (lon > 180) lon -= 360;
        if (lon < -180) lon += 360;

        pts.push([lon, lat]);
      }
      return pts;
    };

    return {
      past: generateOrbit(-1),
      current: generateOrbit(0),
      next: generateOrbit(1),
    };
  }, [orbitTimeSec]);

  // Selected Station
  const activeStation = useMemo(
    () => GROUND_STATIONS.find((s) => s.id === selectedStationId) || GROUND_STATIONS[0],
    [selectedStationId],
  );

  // Great-circle distance from sat to station
  const distToActiveStationKm = useMemo(() => {
    if (!activeStation) return 0;
    const rEarth = 6371;
    const phi1 = (satPosition.lat * Math.PI) / 180;
    const phi2 = (activeStation.lat * Math.PI) / 180;
    const deltaPhi = ((activeStation.lat - satPosition.lat) * Math.PI) / 180;
    const deltaLambda = ((activeStation.lon - satPosition.lon) * Math.PI) / 180;

    const a =
      Math.sin(deltaPhi / 2) * Math.sin(deltaPhi / 2) +
      Math.cos(phi1) * Math.cos(phi2) * Math.sin(deltaLambda / 2) * Math.sin(deltaLambda / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return Math.round(rEarth * c);
  }, [satPosition, activeStation]);

  const isInCoverage = distToActiveStationKm <= activeStation.coverageRadiusKm;

  // D3 Render Effect
  useEffect(() => {
    if (!svgRef.current || !containerRef.current) return;

    const width = containerRef.current.clientWidth || 800;
    const height = Math.max(380, containerRef.current.clientHeight || 450);

    const svg = d3.select(svgRef.current);
    svg.selectAll('*').remove(); // Clean previous render

    svg.attr('viewBox', `0 0 ${width} ${height}`);

    // Create D3 Equirectangular Projection
    const projection = d3
      .geoEquirectangular()
      .scale((width / (2 * Math.PI)) * 0.95)
      .translate([width / 2, height / 2]);

    const pathGenerator = d3.geoPath().projection(projection);

    const g = svg.append('g').attr('class', 'map-root');

    // 1. Ocean Background
    g.append('rect')
      .attr('width', width)
      .attr('height', height)
      .attr('fill', '#020617')
      .attr('stroke', '#1e293b')
      .attr('stroke-width', 1);

    // 2. Graticule Grid (Lines of Lat & Lon)
    const graticule = d3.geoGraticule().step([30, 30]);

    g.append('path')
      .datum(graticule)
      .attr('class', 'graticule')
      .attr('d', pathGenerator)
      .attr('fill', 'none')
      .attr('stroke', 'rgba(56, 189, 248, 0.08)')
      .attr('stroke-width', 0.75);

    // Equator Line (Accent)
    const equator = {
      type: 'LineString',
      coordinates: [
        [-180, 0],
        [180, 0],
      ],
    };
    g.append('path')
      .datum(equator as any)
      .attr('d', pathGenerator)
      .attr('fill', 'none')
      .attr('stroke', 'rgba(147, 51, 234, 0.25)')
      .attr('stroke-dasharray', '4 4')
      .attr('stroke-width', 1);

    // Prime Meridian
    const primeMeridian = {
      type: 'LineString',
      coordinates: [
        [0, -90],
        [0, 90],
      ],
    };
    g.append('path')
      .datum(primeMeridian as any)
      .attr('d', pathGenerator)
      .attr('fill', 'none')
      .attr('stroke', 'rgba(56, 189, 248, 0.2)')
      .attr('stroke-dasharray', '4 4')
      .attr('stroke-width', 1);

    // 3. Continents & Landmasses Outline (Simplified GeoJSON Features)
    // Approximate stylized land contours for fast, robust zero-dependency rendering
    const continentsGeo: any = {
      type: 'FeatureCollection',
      features: [
        // Eurasia
        {
          type: 'Feature',
          geometry: {
            type: 'Polygon',
            coordinates: [
              [
                [-10, 36],
                [10, 36],
                [30, 30],
                [60, 25],
                [75, 10],
                [90, 22],
                [105, 10],
                [120, 22],
                [140, 35],
                [170, 65],
                [180, 70],
                [100, 78],
                [50, 70],
                [20, 71],
                [5, 60],
                [-5, 48],
                [-10, 36],
              ],
            ],
          },
        },
        // Africa
        {
          type: 'Feature',
          geometry: {
            type: 'Polygon',
            coordinates: [
              [
                [-17, 15],
                [12, 37],
                [32, 31],
                [51, 12],
                [40, -10],
                [28, -34],
                [18, -34],
                [12, -5],
                [-17, 15],
              ],
            ],
          },
        },
        // North America
        {
          type: 'Feature',
          geometry: {
            type: 'Polygon',
            coordinates: [
              [
                [-168, 65],
                [-140, 70],
                [-95, 75],
                [-60, 50],
                [-75, 30],
                [-80, 25],
                [-98, 20],
                [-105, 23],
                [-120, 35],
                [-125, 50],
                [-168, 65],
              ],
            ],
          },
        },
        // South America
        {
          type: 'Feature',
          geometry: {
            type: 'Polygon',
            coordinates: [
              [
                [-80, 10],
                [-50, -5],
                [-35, -7],
                [-40, -22],
                [-55, -35],
                [-68, -55],
                [-75, -45],
                [-80, -5],
                [-80, 10],
              ],
            ],
          },
        },
        // Australia
        {
          type: 'Feature',
          geometry: {
            type: 'Polygon',
            coordinates: [
              [
                [115, -22],
                [130, -12],
                [145, -15],
                [150, -35],
                [138, -38],
                [115, -34],
                [115, -22],
              ],
            ],
          },
        },
      ],
    };

    g.append('g')
      .attr('class', 'landmasses')
      .selectAll('path')
      .data(continentsGeo.features)
      .enter()
      .append('path')
      .attr('d', pathGenerator as any)
      .attr('fill', '#091528')
      .attr('stroke', '#1e3a5f')
      .attr('stroke-width', 0.8)
      .attr('opacity', 0.9);

    // 4. Ground Stations Radio Footprint Circles (Coverage Zones)
    const stationsToRender = GROUND_STATIONS.filter((s) => selectedStationsFilter.includes(s.id));

    if (showFootprints) {
      stationsToRender.forEach((station) => {
        const isSel = station.id === selectedStationId;
        // 1 deg on Earth ~ 111 km -> coverage radius in degrees
        const radiusDeg = station.coverageRadiusKm / 111;
        const circleGeo = d3.geoCircle().center([station.lon, station.lat]).radius(radiusDeg)();

        g.append('path')
          .datum(circleGeo)
          .attr('class', `footprint-${station.id}`)
          .attr('d', pathGenerator as any)
          .attr('fill', isSel ? 'rgba(56, 189, 248, 0.12)' : 'rgba(16, 185, 129, 0.05)')
          .attr('stroke', isSel ? '#38bdf8' : '#10b981')
          .attr('stroke-width', isSel ? 1.5 : 0.8)
          .attr('stroke-dasharray', isSel ? 'none' : '3 3')
          .attr('opacity', 0.8);
      });
    }

    // 5. Orbit Trajectory Tracks (D3 Path Split across Meridian)
    const renderTrack = (
      points: Array<[number, number]>,
      strokeColor: string,
      strokeWidth: number,
      dashArray?: string,
      opacity = 0.8,
    ) => {
      // Split track at longitude jumps (> 180 deg crossing)
      const segments: Array<Array<[number, number]>> = [];
      let currentSeg: Array<[number, number]> = [];

      for (let i = 0; i < points.length; i++) {
        const pt = points[i];
        if (currentSeg.length > 0) {
          const prev = currentSeg[currentSeg.length - 1];
          if (Math.abs(pt[0] - prev[0]) > 180) {
            segments.push(currentSeg);
            currentSeg = [];
          }
        }
        currentSeg.push(pt);
      }
      if (currentSeg.length > 0) segments.push(currentSeg);

      segments.forEach((seg) => {
        const lineGeo = {
          type: 'LineString',
          coordinates: seg,
        };
        g.append('path')
          .datum(lineGeo as any)
          .attr('d', pathGenerator as any)
          .attr('fill', 'none')
          .attr('stroke', strokeColor)
          .attr('stroke-width', strokeWidth)
          .attr('stroke-dasharray', dashArray || 'none')
          .attr('opacity', opacity);
      });
    };

    // Past orbit (dashed cyan)
    renderTrack(orbitTracks.past, '#0284c7', 1, '4 4', 0.4);

    // Next predicted orbit (dashed purple)
    if (showFutureOrbits) {
      renderTrack(orbitTracks.next, '#a855f7', 1.2, '3 3', 0.5);
    }

    // Current active orbit (glowing cyan line)
    renderTrack(orbitTracks.current, '#38bdf8', 2.2, undefined, 0.95);

    // 6. Ground Stations Pins & Labels
    stationsToRender.forEach((station) => {
      const [sx, sy] = projection([station.lon, station.lat]) || [0, 0];
      const isSel = station.id === selectedStationId;

      const stationGroup = g
        .append('g')
        .attr('class', 'station-marker')
        .attr('transform', `translate(${sx}, ${sy})`)
        .style('cursor', 'pointer')
        .on('click', () => {
          setSelectedStationId(station.id);
          onStationSelect?.(station);
        });

      // Pulse ring for online station
      stationGroup
        .append('circle')
        .attr('r', isSel ? 7 : 4)
        .attr('fill', isSel ? 'rgba(56, 189, 248, 0.4)' : 'rgba(16, 185, 129, 0.3)')
        .attr('stroke', isSel ? '#38bdf8' : '#10b981')
        .attr('stroke-width', 1.5);

      stationGroup
        .append('circle')
        .attr('r', isSel ? 3.5 : 2)
        .attr('fill', isSel ? '#ffffff' : '#34d399');

      // Label
      stationGroup
        .append('text')
        .attr('x', 9)
        .attr('y', 3)
        .attr('font-size', isSel ? '10px' : '9px')
        .attr('font-family', 'monospace')
        .attr('font-weight', isSel ? 'bold' : 'normal')
        .attr('fill', isSel ? '#38bdf8' : '#94a3b8')
        .text(station.city);
    });

    // 7. Satellite Subsatellite Point & Footprint
    const [satX, satY] = projection([satPosition.lon, satPosition.lat]) || [0, 0];

    // Satellite radio horizon (footprint ~2200km)
    const satFootprint = d3
      .geoCircle()
      .center([satPosition.lon, satPosition.lat])
      .radius(2200 / 111)();
    g.append('path')
      .datum(satFootprint)
      .attr('d', pathGenerator as any)
      .attr('fill', isInCoverage ? 'rgba(34, 197, 94, 0.15)' : 'rgba(56, 189, 248, 0.08)')
      .attr('stroke', isInCoverage ? '#22c55e' : '#38bdf8')
      .attr('stroke-width', 1.2)
      .attr('stroke-dasharray', '2 2');

    // Pulsing Satellite Marker
    const satGroup = g.append('g').attr('transform', `translate(${satX}, ${satY})`);

    satGroup
      .append('circle')
      .attr('r', 10)
      .attr('fill', isInCoverage ? 'rgba(34, 197, 94, 0.3)' : 'rgba(56, 189, 248, 0.3)')
      .attr('stroke', isInCoverage ? '#4ade80' : '#38bdf8')
      .attr('stroke-width', 1.5);

    satGroup.append('circle').attr('r', 4).attr('fill', '#ffffff');

    // Satellite Callout Tag
    satGroup
      .append('rect')
      .attr('x', 12)
      .attr('y', -14)
      .attr('width', 96)
      .attr('height', 18)
      .attr('rx', 4)
      .attr('fill', 'rgba(15, 23, 42, 0.85)')
      .attr('stroke', '#38bdf8')
      .attr('stroke-width', 1);

    satGroup
      .append('text')
      .attr('x', 16)
      .attr('y', -2)
      .attr('font-size', '9px')
      .attr('font-family', 'monospace')
      .attr('font-weight', 'bold')
      .attr('fill', '#e2e8f0')
      .text('CubeSat 3U: RS40S');
  }, [
    satPosition,
    orbitTracks,
    selectedStationId,
    showFootprints,
    showFutureOrbits,
    selectedStationsFilter,
    isInCoverage,
    onStationSelect,
  ]);

  return (
    <div
      ref={containerRef}
      className={`relative w-full rounded-2xl overflow-hidden bg-slate-950 border border-cyan-500/30 shadow-2xl flex flex-col ${className}`}
    >
      {/* Top Map Controls Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 p-3.5 bg-slate-900/90 border-b border-slate-800 text-xs font-mono">
        <div className="flex items-center gap-2 text-cyan-300 font-bold">
          <Compass className="w-4 h-4 text-cyan-400" />
          <span>D3 Орбитальный трек и наземные станции</span>
          <span className="text-[11px] px-1.5 py-0.5 rounded bg-cyan-500/20 text-cyan-200 border border-cyan-500/30">
            D3.js Geo
          </span>
        </div>

        {/* View Options */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowFootprints((v) => !v)}
            className={`px-2.5 py-1 rounded-lg border text-xs transition-all cursor-pointer ${
              showFootprints
                ? 'bg-cyan-500/20 text-cyan-300 border-cyan-500/40 font-bold'
                : 'bg-slate-800 text-slate-400 border-slate-700'
            }`}
          >
            Зоны приёма
          </button>

          <button
            onClick={() => setShowFutureOrbits((v) => !v)}
            className={`px-2.5 py-1 rounded-lg border text-xs transition-all cursor-pointer ${
              showFutureOrbits
                ? 'bg-purple-500/20 text-purple-300 border-purple-500/40 font-bold'
                : 'bg-slate-800 text-slate-400 border-slate-700'
            }`}
          >
            Прогноз витка
          </button>
        </div>
      </div>

      {/* SVG Canvas for D3 */}
      <div className="relative w-full min-h-[380px] flex-1 bg-slate-950 overflow-hidden">
        <svg ref={svgRef} className="w-full h-full block" />

        {/* Overlay Telemetry HUD (Bottom Left) */}
        <div className="absolute bottom-3 left-3 z-10 p-3 rounded-xl bg-slate-900/90 backdrop-blur-md border border-slate-800 text-xs font-mono text-slate-300 space-y-1 shadow-lg pointer-events-none">
          <div className="flex items-center gap-2 text-white font-bold pb-1 border-b border-slate-800">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span>Подспутниковая точка</span>
          </div>
          <div className="flex justify-between gap-4">
            <span className="text-slate-400">Широта (Lat):</span>
            <span className="text-cyan-300 font-bold">{satPosition.lat}° N</span>
          </div>
          <div className="flex justify-between gap-4">
            <span className="text-slate-400">Долгота (Lon):</span>
            <span className="text-cyan-300 font-bold">{satPosition.lon}° E</span>
          </div>
          <div className="flex justify-between gap-4">
            <span className="text-slate-400">Высота:</span>
            <span className="text-purple-300">{satPosition.alt} км</span>
          </div>
        </div>

        {/* Selected Station Contact Card (Bottom Right) */}
        <div className="absolute bottom-3 right-3 z-10 p-3 rounded-xl bg-slate-900/90 backdrop-blur-md border border-slate-800 text-xs font-mono text-slate-300 space-y-1.5 shadow-lg max-w-xs">
          <div className="flex items-center justify-between pb-1 border-b border-slate-800">
            <div className="flex items-center gap-1.5 text-white font-bold">
              <Radio className="w-3.5 h-3.5 text-cyan-400" />
              <span>{activeStation.name}</span>
            </div>
            <span
              className={`text-[10px] px-1.5 py-0.2 rounded font-bold ${
                isInCoverage
                  ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 animate-pulse'
                  : 'bg-slate-800 text-slate-400'
              }`}
            >
              {isInCoverage ? 'СВЯЗЬ ЕСТЬ' : 'ВНЕ ЗОНЫ'}
            </span>
          </div>

          <div className="text-[11px] text-slate-400 space-y-0.5">
            <div className="flex justify-between">
              <span>Дистанция:</span>
              <span className="text-slate-200 font-bold">{distToActiveStationKm} км</span>
            </div>
            <div className="flex justify-between">
              <span>Радиус зоны:</span>
              <span className="text-slate-200">{activeStation.coverageRadiusKm} км</span>
            </div>
            <div className="flex justify-between">
              <span>Частота:</span>
              <span className="text-emerald-400 font-bold">{activeStation.freqMhz} МГц</span>
            </div>
            <div className="flex justify-between">
              <span>Сеть станций:</span>
              <span className="text-cyan-300">{activeStation.network}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Ground Station Switcher Footer */}
      <div className="p-2.5 bg-slate-900/90 border-t border-slate-800 flex items-center gap-2 overflow-x-auto scrollbar-none text-xs font-mono">
        <span className="text-slate-500 shrink-0 text-[11px] px-1">Станции:</span>
        {GROUND_STATIONS.map((station) => (
          <button
            key={station.id}
            onClick={() => {
              setSelectedStationId(station.id);
              onStationSelect?.(station);
            }}
            className={`px-3 py-1.5 rounded-xl whitespace-nowrap transition-all cursor-pointer flex items-center gap-1.5 ${
              selectedStationId === station.id
                ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 font-bold shadow-sm'
                : 'bg-slate-800/80 text-slate-400 hover:text-slate-200 hover:bg-slate-800'
            }`}
          >
            <MapPin className="w-3 h-3 text-cyan-400" />
            <span>{station.city}</span>
          </button>
        ))}
      </div>
    </div>
  );
};

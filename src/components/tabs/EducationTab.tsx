import React, { useState, useRef, useEffect, useMemo, useCallback } from 'react';
import {
  GraduationCap,
  Play,
  Pause,
  Volume2,
  VolumeX,
  Maximize,
  Minimize,
  ExternalLink,
  Plus,
  Search,
  FileText,
  X,
  Video,
  RotateCcw,
  RotateCw,
  Compass,
  Check,
  Copy,
  Trash2,
  UploadCloud,
  Code,
  Database,
  ListOrdered,
  Info,
  Layers,
} from 'lucide-react';
import { EducationalMaterial, MaterialChapter, UserRole } from '../../types';

interface EducationTabProps {
  materials: EducationalMaterial[];
  userRole: UserRole;
  onAddMaterial: (material: EducationalMaterial) => void;
  onDeleteMaterial?: (materialId: string) => void;
}

interface ExternalResourceInput {
  title: string;
  url: string;
  type: 'pdf' | 'link' | 'code' | 'dataset';
}

interface ChapterInput {
  timeFormatted: string;
  title: string;
}

// Preset locations for the 360° interactive virtual tour
interface PanoramaLocation {
  id: string;
  name: string;
  description: string;
  skyGradient: [string, string, string];
  horizonColor: string;
  groundColor: string;
  elements: Array<{
    type: 'pad' | 'tower' | 'cleanroom' | 'antenna' | 'satellite';
    yaw: number; // degrees 0-360
    pitch: number; // degrees -90 to +90
    label: string;
    details: string;
  }>;
}

const PANORAMA_LOCATIONS: Record<string, PanoramaLocation> = {
  pad_1c: {
    id: 'pad_1c',
    name: 'Стартовый комплекс 1С (Космодром «Восточный»)',
    description:
      'Пусковой стол для РН среднего класса «Союз-2.1б» с отводными мачтами и системой шумоподавления.',
    skyGradient: ['#030712', '#0f172a', '#1e1b4b'],
    horizonColor: '#1e293b',
    groundColor: '#090d16',
    elements: [
      {
        type: 'pad',
        yaw: 0,
        pitch: -15,
        label: 'Пусковой стол 1С',
        details:
          'Опорные фермы удерживают ракету-носитель массой 312 тонн до выхода двигателей на главную ступень тяги.',
      },
      {
        type: 'tower',
        yaw: 75,
        pitch: 10,
        label: 'Мобильная башня обслуживания (МБО)',
        details:
          'Уникальное сооружение высотой 52 м и массой 1600 тонн. Обеспечивает предстартовую подготовку в суровых климатических условиях Дальнего Востока.',
      },
      {
        type: 'satellite',
        yaw: 340,
        pitch: 25,
        label: 'Головной обтекатель (МОП КубСатов)',
        details:
          'Внутри створок обтекателя смонтированы пусковые контейнеры 3U/12U со спутниками школьного кейс-чемпионата.',
      },
      {
        type: 'antenna',
        yaw: 160,
        pitch: -5,
        label: 'Система подачи воды шумоглушения',
        details:
          'Подает до 45 000 литров воды в секунду для снижения акустического давления на спутники ниже порога 142 дБ.',
      },
    ],
  },
  cleanroom: {
    id: 'cleanroom',
    name: 'Чистая комната ISO Class 7 (Сборка спутников)',
    description:
      'Обеспыленный цех сборки и предполетных интеграционных тестов КубСатов при влажности 45% и +22°C.',
    skyGradient: ['#0a0f1d', '#111827', '#1f2937'],
    horizonColor: '#334155',
    groundColor: '#0b1120',
    elements: [
      {
        type: 'cleanroom',
        yaw: 20,
        pitch: 0,
        label: 'Ламинарный шкаф ISO Class 5',
        details:
          'Стерильная зона с HEPA-фильтрацией H14 (задержка 99.995% частиц >0.3 мкм) для монтажа космической оптики.',
      },
      {
        type: 'tower',
        yaw: 110,
        pitch: -10,
        label: 'Термовакуумная камера ТВК-1',
        details:
          'Имитирует глубокий космический вакуум 10⁻⁵ Торр и циклический термоудар от -60°C до +110°C.',
      },
      {
        type: 'antenna',
        yaw: 220,
        pitch: -5,
        label: 'Вибростенд квалификационных испытаний',
        details:
          'Электродинамический шейкер для моделирования перегрузок до 12 g и случайных вибраций при выведении.',
      },
      {
        type: 'pad',
        yaw: 290,
        pitch: 15,
        label: 'Антистатический монтажный стол ESD',
        details:
          'Заземленная рабочая зона с постоянным мониторингом электростатического потенциала для защиты чипов STM32.',
      },
    ],
  },
};

export const EducationTab: React.FC<EducationTabProps> = ({
  materials,
  userRole: _userRole,
  onAddMaterial,
  onDeleteMaterial,
}) => {
  const [selectedMaterialId, setSelectedMaterialId] = useState<string>(() => {
    return materials[0]?.id || 'edu_1';
  });
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [activeTabMode, setActiveTabMode] = useState<'video' | 'panorama360'>('video');

  // Video playback states
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(0.85);
  const [isMuted, setIsMuted] = useState(false);
  const [playbackSpeed, setPlaybackSpeed] = useState<number>(1);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [copiedLink, setCopiedLink] = useState<string | null>(null);

  // 360° Panorama Interactive state
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [selectedLocationKey, setSelectedLocationKey] = useState<string>('pad_1c');
  const [panYaw, setPanYaw] = useState<number>(20); // 0 - 360
  const [panPitch, setPanPitch] = useState<number>(0); // -60 to +60
  const [panFov, setPanFov] = useState<number>(75); // 50 to 100 degrees
  const [isDraggingPan, setIsDraggingPan] = useState(false);
  const [lastMousePos, setLastMousePos] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [isAutoRotate, setIsAutoRotate] = useState(true);
  const [selectedHotspot, setSelectedHotspot] = useState<PanoramaLocation['elements'][0] | null>(
    null,
  );

  // Add Material Modal form states
  const [uploadMode, setUploadMode] = useState<'upload' | 'url'>('upload');
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [uploadProgress, setUploadProgress] = useState<number>(0);
  const [isUploading, setIsUploading] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newCategory, setNewCategory] = useState<
    'tour_360' | 'lecture' | 'workshop' | 'masterclass'
  >('lecture');
  const [newAuthor, setNewAuthor] = useState('');
  const [newOrg, setNewOrg] = useState('');
  const [newDuration, setNewDuration] = useState('20 мин');
  const [newVideoUrl, setNewVideoUrl] = useState('');
  const [newDescription, setNewDescription] = useState('');
  const [newTopics, setNewTopics] = useState('Орбитальная механика, Телеметрия CubeSat');
  const [newThumbnailUrl, setNewThumbnailUrl] = useState('');

  // Dynamic chapters in modal
  const [modalChapters, setModalChapters] = useState<ChapterInput[]>([
    { timeFormatted: '00:00', title: 'Введение и постановка задачи' },
    { timeFormatted: '05:30', title: 'Физические основы и расчетные формулы' },
    { timeFormatted: '12:00', title: 'Практическая демонстрация и выводы' },
  ]);

  // Dynamic external resources in modal
  const [modalResources, setModalResources] = useState<ExternalResourceInput[]>([
    {
      title: 'Методическое пособие по расчету орбит (PDF)',
      url: 'https://astronomy.edu/manual.pdf',
      type: 'pdf',
    },
    {
      title: 'Скрипт баллистического симулятора (Python)',
      url: 'https://github.com/space-orion3/cubesat-sim',
      type: 'code',
    },
  ]);

  const categoryLabels: Record<string, string> = {
    all: 'Все материалы',
    tour_360: '🌐 Виртуальные 360° экскурсии',
    lecture: '🎓 Видеолекции ученых',
    masterclass: '🔧 Мастер-классы и пайка',
    workshop: '💻 Практикумы по баллистике',
  };

  const selectedMaterial = useMemo(() => {
    return materials.find((m) => m.id === selectedMaterialId) || materials[0];
  }, [materials, selectedMaterialId]);

  // Filter materials based on category and search query
  const filteredMaterials = useMemo(() => {
    return materials.filter((m) => {
      if (selectedCategory !== 'all' && m.category !== selectedCategory) return false;
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        return (
          m.title.toLowerCase().includes(q) ||
          m.author.toLowerCase().includes(q) ||
          m.organization.toLowerCase().includes(q) ||
          m.description.toLowerCase().includes(q) ||
          m.keyTopics.some((topic) => topic.toLowerCase().includes(q))
        );
      }
      return true;
    });
  }, [materials, selectedCategory, searchQuery]);

  // Handle switching materials
  const handleSelectMaterial = useCallback(
    (matId: string) => {
      setSelectedMaterialId(matId);
      setIsPlaying(false);
      setCurrentTime(0);
      const targetMat = materials.find((m) => m.id === matId);
      if (targetMat?.category === 'tour_360') {
        setActiveTabMode('panorama360');
      } else {
        setActiveTabMode('video');
      }
    },
    [materials],
  );

  // Video element control handlers
  const handleTogglePlay = useCallback(() => {
    if (!videoRef.current) return;
    if (videoRef.current.paused) {
      videoRef.current
        .play()
        .then(() => setIsPlaying(true))
        .catch(() => setIsPlaying(false));
    } else {
      videoRef.current.pause();
      setIsPlaying(false);
    }
  }, []);

  const handleSkipTime = useCallback((deltaSeconds: number) => {
    if (!videoRef.current) return;
    const newTime = Math.max(
      0,
      Math.min(videoRef.current.duration || 1000, videoRef.current.currentTime + deltaSeconds),
    );
    videoRef.current.currentTime = newTime;
    setCurrentTime(newTime);
  }, []);

  const handleSeek = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      if (!videoRef.current) return;
      const rect = e.currentTarget.getBoundingClientRect();
      const clickX = e.clientX - rect.left;
      const percent = Math.max(0, Math.min(1, clickX / rect.width));
      const targetDuration = videoRef.current.duration || duration || 60;
      const seekTime = percent * targetDuration;
      videoRef.current.currentTime = seekTime;
      setCurrentTime(seekTime);
    },
    [duration],
  );

  const handleSeekChapter = useCallback((timeSec: number) => {
    if (!videoRef.current) return;
    videoRef.current.currentTime = timeSec;
    setCurrentTime(timeSec);
    if (videoRef.current.paused) {
      videoRef.current
        .play()
        .then(() => setIsPlaying(true))
        .catch(() => {});
    }
  }, []);

  const handleSpeedChange = useCallback(() => {
    const speeds = [0.75, 1, 1.25, 1.5, 2];
    const nextIndex = (speeds.indexOf(playbackSpeed) + 1) % speeds.length;
    const nextSpeed = speeds[nextIndex];
    setPlaybackSpeed(nextSpeed);
    if (videoRef.current) {
      videoRef.current.playbackRate = nextSpeed;
    }
  }, [playbackSpeed]);

  const handleToggleMute = useCallback(() => {
    if (!videoRef.current) return;
    const nextMute = !isMuted;
    setIsMuted(nextMute);
    videoRef.current.muted = nextMute;
  }, [isMuted]);

  const handleVolumeChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const val = parseFloat(e.target.value);
    setVolume(val);
    setIsMuted(val === 0);
    if (videoRef.current) {
      videoRef.current.volume = val;
      videoRef.current.muted = val === 0;
    }
  }, []);

  const handleToggleFullscreen = useCallback(() => {
    if (!containerRef.current) return;
    if (!document.fullscreenElement) {
      containerRef.current
        .requestFullscreen?.()
        .then(() => setIsFullscreen(true))
        .catch(() => {});
    } else {
      document
        .exitFullscreen?.()
        .then(() => setIsFullscreen(false))
        .catch(() => {});
    }
  }, []);

  // Format seconds to mm:ss or hh:mm:ss
  const formatTime = useCallback((totalSeconds: number): string => {
    if (isNaN(totalSeconds) || totalSeconds < 0) return '00:00';
    const hrs = Math.floor(totalSeconds / 3600);
    const mins = Math.floor((totalSeconds % 3600) / 60);
    const secs = Math.floor(totalSeconds % 60);
    if (hrs > 0) {
      return `${hrs}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  }, []);

  // Copy resource link helper
  const handleCopyLink = useCallback((url: string, id: string) => {
    navigator.clipboard
      ?.writeText(url)
      .then(() => {
        setCopiedLink(id);
        setTimeout(() => setCopiedLink(null), 2500);
      })
      .catch(() => {});
  }, []);

  // 360° Interactive Canvas Rendering
  useEffect(() => {
    if (activeTabMode !== 'panorama360' || !canvasRef.current) return;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationFrameId: number;
    const loc = PANORAMA_LOCATIONS[selectedLocationKey] || PANORAMA_LOCATIONS.pad_1c;

    const render = () => {
      const width = canvas.width;
      const height = canvas.height;
      ctx.clearRect(0, 0, width, height);

      // Sky Background Gradient
      const skyGrad = ctx.createLinearGradient(0, 0, 0, height * 0.7);
      skyGrad.addColorStop(0, loc.skyGradient[0]);
      skyGrad.addColorStop(0.5, loc.skyGradient[1]);
      skyGrad.addColorStop(1, loc.skyGradient[2]);
      ctx.fillStyle = skyGrad;
      ctx.fillRect(0, 0, width, height * 0.7);

      // Stars in celestial sphere
      ctx.save();
      ctx.fillStyle = '#ffffff';
      for (let i = 0; i < 90; i++) {
        const starX = (((i * 123 + panYaw * 3) % width) + width) % width;
        const starY = (i * 37) % (height * 0.6);
        const radius = i % 3 === 0 ? 1.5 : 0.8;
        ctx.globalAlpha = 0.4 + 0.5 * Math.sin(Date.now() / 800 + i);
        ctx.beginPath();
        ctx.arc(starX, starY, radius, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.restore();

      // Distant Horizon & Ground
      const horizonY = height * 0.6 + panPitch * (height / 180);
      const groundGrad = ctx.createLinearGradient(0, horizonY, 0, height);
      groundGrad.addColorStop(0, loc.horizonColor);
      groundGrad.addColorStop(1, loc.groundColor);
      ctx.fillStyle = groundGrad;
      ctx.fillRect(0, Math.max(0, horizonY), width, height);

      // Panoramic Grid Lines (equirectangular perspective)
      ctx.save();
      ctx.strokeStyle = 'rgba(99, 102, 241, 0.15)';
      ctx.lineWidth = 1;

      // Latitude lines
      for (let lat = -60; lat <= 60; lat += 20) {
        const y = horizonY - lat * (height / 180);
        if (y >= 0 && y <= height) {
          ctx.beginPath();
          ctx.moveTo(0, y);
          ctx.lineTo(width, y);
          ctx.stroke();
        }
      }

      // Longitude lines
      for (let lon = 0; lon < 360; lon += 30) {
        const diff = ((lon - panYaw + 540) % 360) - 180;
        const x = width / 2 + diff * (width / panFov);
        if (x >= -50 && x <= width + 50) {
          ctx.beginPath();
          ctx.moveTo(x, 0);
          ctx.lineTo(x, height);
          ctx.stroke();
        }
      }
      ctx.restore();

      // Render Cosmodrome Structures & Hotspots
      loc.elements.forEach((elem) => {
        const diffYaw = ((elem.yaw - panYaw + 540) % 360) - 180;
        const screenX = width / 2 + diffYaw * (width / panFov);
        const screenY = horizonY - elem.pitch * (height / 180);

        if (screenX >= 20 && screenX <= width - 20 && screenY >= 20 && screenY <= height - 20) {
          const isHovered = selectedHotspot?.label === elem.label;

          // Pulse circle animation
          const pulse = (Math.sin(Date.now() / 300) + 1) * 4;
          ctx.save();
          ctx.beginPath();
          ctx.arc(screenX, screenY, 14 + pulse, 0, Math.PI * 2);
          ctx.fillStyle = 'rgba(99, 102, 241, 0.2)';
          ctx.fill();

          // Outer ring
          ctx.beginPath();
          ctx.arc(screenX, screenY, 10, 0, Math.PI * 2);
          ctx.fillStyle = isHovered ? '#6366f1' : '#38bdf8';
          ctx.shadowColor = '#38bdf8';
          ctx.shadowBlur = 10;
          ctx.fill();

          // Center dot
          ctx.beginPath();
          ctx.arc(screenX, screenY, 4, 0, Math.PI * 2);
          ctx.fillStyle = '#ffffff';
          ctx.fill();

          // Label Card Overlay
          ctx.font = 'bold 11px system-ui, sans-serif';
          const textWidth = ctx.measureText(elem.label).width;
          const boxPadding = 6;
          const boxWidth = textWidth + boxPadding * 2 + 16;
          const boxHeight = 22;
          const boxX = screenX - boxWidth / 2;
          const boxY = screenY - 28;

          ctx.fillStyle = 'rgba(15, 23, 42, 0.88)';
          ctx.strokeStyle = isHovered ? '#818cf8' : 'rgba(99, 102, 241, 0.4)';
          ctx.lineWidth = 1.5;
          ctx.beginPath();
          ctx.roundRect(boxX, boxY, boxWidth, boxHeight, 6);
          ctx.fill();
          ctx.stroke();

          // Pin icon indicator
          ctx.fillStyle = '#38bdf8';
          ctx.beginPath();
          ctx.arc(boxX + 10, boxY + boxHeight / 2, 3, 0, Math.PI * 2);
          ctx.fill();

          // Text
          ctx.fillStyle = '#ffffff';
          ctx.fillText(elem.label, boxX + 18, boxY + 15);
          ctx.restore();
        }
      });

      // Subtle compass HUD at bottom center
      ctx.save();
      ctx.font = '10px monospace';
      ctx.fillStyle = '#94a3b8';
      const compassText = `АЗИМУТ: ${Math.round(panYaw)}° · УГОЛ МЕСТА: ${Math.round(panPitch)}° · FOV: ${panFov}°`;
      ctx.fillText(compassText, width / 2 - ctx.measureText(compassText).width / 2, height - 12);
      ctx.restore();

      // Auto-rotate if enabled and not dragging
      if (isAutoRotate && !isDraggingPan) {
        setPanYaw((prev) => (prev + 0.08) % 360);
      }

      animationFrameId = requestAnimationFrame(render);
    };

    render();

    return () => {
      cancelAnimationFrame(animationFrameId);
    };
  }, [
    activeTabMode,
    selectedLocationKey,
    panYaw,
    panPitch,
    panFov,
    isDraggingPan,
    isAutoRotate,
    selectedHotspot,
  ]);

  // Canvas Mouse / Touch handlers for 360° pan
  const handleCanvasMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    setIsDraggingPan(true);
    setLastMousePos({ x: e.clientX, y: e.clientY });

    // Check hotspot click
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const clickY = e.clientY - rect.top;

    const loc = PANORAMA_LOCATIONS[selectedLocationKey] || PANORAMA_LOCATIONS.pad_1c;
    const horizonY = canvas.height * 0.6 + panPitch * (canvas.height / 180);

    const clicked = loc.elements.find((elem) => {
      const diffYaw = ((elem.yaw - panYaw + 540) % 360) - 180;
      const screenX = canvas.width / 2 + diffYaw * (canvas.width / panFov);
      const screenY = horizonY - elem.pitch * (canvas.height / 180);
      const dist = Math.hypot(clickX - screenX, clickY - screenY);
      return dist <= 24;
    });

    if (clicked) {
      setSelectedHotspot(clicked);
    }
  };

  const handleCanvasMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDraggingPan) return;
    const deltaX = e.clientX - lastMousePos.x;
    const deltaY = e.clientY - lastMousePos.y;

    setPanYaw((prev) => (prev - deltaX * 0.35 + 360) % 360);
    setPanPitch((prev) => Math.max(-55, Math.min(55, prev + deltaY * 0.35)));
    setLastMousePos({ x: e.clientX, y: e.clientY });
  };

  const handleCanvasMouseUp = () => {
    setIsDraggingPan(false);
  };

  // Video File upload handler with simulated progress & metadata extraction
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadedFile(file);
    setIsUploading(true);
    setUploadProgress(15);

    const objectUrl = URL.createObjectURL(file);
    setNewVideoUrl(objectUrl);

    // Default title from file name if empty
    if (!newTitle) {
      const cleanName = file.name.replace(/\.[^/.]+$/, '');
      setNewTitle(`Видеоматериал: ${cleanName}`);
    }

    // Try to get video duration from file
    const tempVideo = document.createElement('video');
    tempVideo.preload = 'metadata';
    tempVideo.src = objectUrl;
    tempVideo.onloadedmetadata = () => {
      const sec = Math.round(tempVideo.duration);
      if (sec && !isNaN(sec)) {
        const mins = Math.floor(sec / 60);
        const remSec = sec % 60;
        setNewDuration(`${mins} мин ${remSec} сек`);
      }
    };

    // Simulated upload progress animation
    let cur = 15;
    const interval = setInterval(() => {
      cur += 25;
      if (cur >= 100) {
        setUploadProgress(100);
        setIsUploading(false);
        clearInterval(interval);
      } else {
        setUploadProgress(cur);
      }
    }, 180);
  };

  // Dynamic modal chapters management
  const handleAddModalChapter = () => {
    setModalChapters((prev) => [
      ...prev,
      { timeFormatted: '15:00', title: 'Новый раздел видеоматериала' },
    ]);
  };

  const handleRemoveModalChapter = (index: number) => {
    setModalChapters((prev) => prev.filter((_, i) => i !== index));
  };

  const handleUpdateModalChapter = (
    index: number,
    field: 'timeFormatted' | 'title',
    value: string,
  ) => {
    setModalChapters((prev) =>
      prev.map((chap, i) => (i === index ? { ...chap, [field]: value } : chap)),
    );
  };

  // Dynamic modal external resources management
  const handleAddModalResource = () => {
    setModalResources((prev) => [
      ...prev,
      {
        title: 'Методическое приложение (PDF)',
        url: 'https://astronomy.edu/docs/app.pdf',
        type: 'pdf',
      },
    ]);
  };

  const handleRemoveModalResource = (index: number) => {
    setModalResources((prev) => prev.filter((_, i) => i !== index));
  };

  const handleUpdateModalResource = (
    index: number,
    field: keyof ExternalResourceInput,
    value: string,
  ) => {
    setModalResources((prev) =>
      prev.map((res, i) => (i === index ? { ...res, [field]: value } : res)),
    );
  };

  // Submit new educational material
  const handleCreateMaterial = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim()) return;

    const keyTopicsList = newTopics
      .split(',')
      .map((t) => t.trim())
      .filter((t) => t.length > 0);

    // Parse chapters to MaterialChapter format
    const parsedChapters: MaterialChapter[] = modalChapters.map((ch) => {
      const parts = ch.timeFormatted.split(':').map(Number);
      const seconds =
        parts.length === 2
          ? parts[0] * 60 + parts[1]
          : parts.length === 3
            ? parts[0] * 3600 + parts[1] * 60 + parts[2]
            : 0;
      return {
        timeSeconds: isNaN(seconds) ? 0 : seconds,
        timeFormatted: ch.timeFormatted,
        title: ch.title,
      };
    });

    const item: EducationalMaterial = {
      id: `edu_${Date.now()}`,
      title: newTitle.trim(),
      category: newCategory,
      author: newAuthor.trim() || 'Инженер-баллистик / Преподаватель',
      organization: newOrg.trim() || 'Аэрокосмический центр',
      duration: newDuration.trim() || '20 мин',
      thumbnail:
        newThumbnailUrl.trim() ||
        (newCategory === 'tour_360'
          ? 'https://images.unsplash.com/photo-1517976487584-6014b2d56a0c?auto=format&fit=crop&w=600&q=80'
          : 'https://images.unsplash.com/photo-1451187580459-43490279c0fa?auto=format&fit=crop&w=600&q=80'),
      videoUrl:
        newVideoUrl.trim() ||
        'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/TearsOfSteel.mp4',
      description:
        newDescription.trim() ||
        'Учебный видеоматериал для подготовки к кейс-чемпионату по физике и спутникостроению.',
      keyTopics: keyTopicsList,
      externalResources: modalResources,
      publishedAt: 'Сегодня',
      chapters: parsedChapters,
      isUploadedFile: !!uploadedFile,
      fileSize: uploadedFile ? `${(uploadedFile.size / (1024 * 1024)).toFixed(1)} МБ` : undefined,
    };

    onAddMaterial(item);
    setSelectedMaterialId(item.id);
    setIsAddModalOpen(false);

    // Reset Form
    setNewTitle('');
    setNewAuthor('');
    setNewOrg('');
    setNewDescription('');
    setNewVideoUrl('');
    setUploadedFile(null);
    setUploadProgress(0);
  };

  const getResourceIcon = (type: ExternalResourceInput['type']) => {
    switch (type) {
      case 'pdf':
        return <FileText className="h-4 w-4 text-rose-400" />;
      case 'code':
        return <Code className="h-4 w-4 text-emerald-400" />;
      case 'dataset':
        return <Database className="h-4 w-4 text-amber-400" />;
      case 'link':
      default:
        return <ExternalLink className="h-4 w-4 text-cyan-400" />;
    }
  };

  const getResourceTypeLabel = (type: ExternalResourceInput['type']) => {
    switch (type) {
      case 'pdf':
        return 'PDF Документ';
      case 'code':
        return 'Исходный код';
      case 'dataset':
        return 'Датасет / Данные';
      case 'link':
      default:
        return 'Веб-ресурс';
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Banner with Clean Typography */}
      <div className="rounded-2xl border border-slate-800 bg-slate-950 p-5 shadow-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
            <GraduationCap className="h-6 w-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-bold text-white tracking-tight">
                Образовательный контент & Виртуальные 360° экскурсии
              </h1>
              <span className="text-[11px] font-mono text-indigo-400 font-semibold tracking-wider">
                COSMO-ACADEMY
              </span>
            </div>
            <p className="mt-0.5 text-xs text-slate-400">
              Видеолекции ведущих ученых, мастер-классы по пайке наноспутников и виртуальные 360°
              туры по космодромам.
            </p>
          </div>
        </div>

        <button
          onClick={() => setIsAddModalOpen(true)}
          className="flex items-center gap-2 rounded-xl bg-indigo-600 px-4 py-2.5 text-xs font-semibold text-white hover:bg-indigo-500 shadow-md transition-colors shrink-0"
        >
          <Plus className="h-4 w-4" />
          <span>Добавить видеоматериал</span>
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row gap-3 items-center justify-between text-xs">
        <div className="relative w-full sm:w-80">
          <Search className="absolute left-3 top-2.5 h-3.5 w-3.5 text-slate-500" />
          <input
            type="text"
            placeholder="Поиск по лекциям, темам и авторам..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full rounded-xl border border-slate-800 bg-slate-900 pl-9 pr-3 py-2 text-white placeholder-slate-500 focus:border-indigo-500 focus:outline-none transition-colors"
          />
        </div>

        {/* Clean Segmented Categories Control */}
        <div className="flex flex-wrap items-center gap-1.5 p-1 bg-slate-900 rounded-xl border border-slate-800 w-full sm:w-auto">
          {Object.entries(categoryLabels).map(([key, label]) => {
            const isActive = selectedCategory === key;
            return (
              <button
                key={key}
                onClick={() => setSelectedCategory(key)}
                className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors ${
                  isActive
                    ? 'bg-indigo-600 text-white shadow-sm'
                    : 'text-slate-400 hover:text-white hover:bg-slate-800'
                }`}
              >
                {label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Main Grid: Interactive Player / 360 Viewer & Catalog */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Interactive Player & Details (8 cols) */}
        <div className="lg:col-span-8 space-y-4">
          {selectedMaterial && (
            <div className="rounded-2xl border border-slate-800 bg-slate-900/90 p-5 text-xs shadow-xl space-y-4">
              {/* Mode Toggle Bar for 360° Tours */}
              {selectedMaterial.category === 'tour_360' && (
                <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-slate-400 font-medium">Режим просмотра:</span>
                    <div className="flex items-center gap-1 bg-slate-950 p-1 rounded-lg border border-slate-800">
                      <button
                        onClick={() => setActiveTabMode('panorama360')}
                        className={`flex items-center gap-1.5 px-3 py-1 rounded-md text-xs font-medium transition-colors ${
                          activeTabMode === 'panorama360'
                            ? 'bg-indigo-600 text-white'
                            : 'text-slate-400 hover:text-white'
                        }`}
                      >
                        <Compass className="h-3.5 w-3.5" />
                        <span>360° Интерактивная панорама</span>
                      </button>
                      <button
                        onClick={() => setActiveTabMode('video')}
                        className={`flex items-center gap-1.5 px-3 py-1 rounded-md text-xs font-medium transition-colors ${
                          activeTabMode === 'video'
                            ? 'bg-indigo-600 text-white'
                            : 'text-slate-400 hover:text-white'
                        }`}
                      >
                        <Play className="h-3.5 w-3.5" />
                        <span>Видео-экскурсия</span>
                      </button>
                    </div>
                  </div>

                  {/* Location Selector for 360° Mode */}
                  {activeTabMode === 'panorama360' && (
                    <div className="flex items-center gap-2">
                      <Layers className="h-3.5 w-3.5 text-slate-400" />
                      <select
                        value={selectedLocationKey}
                        onChange={(e) => {
                          setSelectedLocationKey(e.target.value);
                          setSelectedHotspot(null);
                        }}
                        className="rounded-lg border border-slate-800 bg-slate-950 px-2.5 py-1 text-xs text-white focus:border-indigo-500 focus:outline-none"
                      >
                        <option value="pad_1c">Стартовый стол 1С («Восточный»)</option>
                        <option value="cleanroom">Чистая комната ISO 7 (Сборка)</option>
                      </select>
                    </div>
                  )}
                </div>
              )}

              {/* Viewport: Either Interactive 360° Panorama Canvas OR Real HTML5 Video Player */}
              {activeTabMode === 'panorama360' && selectedMaterial.category === 'tour_360' ? (
                <div className="relative overflow-hidden rounded-xl border border-slate-800 bg-slate-950 aspect-video select-none group">
                  <canvas
                    ref={canvasRef}
                    width={800}
                    height={450}
                    onMouseDown={handleCanvasMouseDown}
                    onMouseMove={handleCanvasMouseMove}
                    onMouseUp={handleCanvasMouseUp}
                    onMouseLeave={handleCanvasMouseUp}
                    className="w-full h-full cursor-grab active:cursor-grabbing block"
                  />

                  {/* 360 Controls HUD */}
                  <div className="absolute top-3 left-3 flex items-center gap-2 bg-slate-950/80 backdrop-blur px-3 py-1.5 rounded-lg border border-slate-800 text-[11px] text-white">
                    <Compass className="h-3.5 w-3.5 text-cyan-400" />
                    <span>
                      {PANORAMA_LOCATIONS[selectedLocationKey]?.name || 'Стартовый комплекс'}
                    </span>
                  </div>

                  <div className="absolute bottom-3 right-3 flex items-center gap-1.5 bg-slate-950/80 backdrop-blur p-1 rounded-lg border border-slate-800 text-white">
                    <button
                      onClick={() => setPanFov((f) => Math.max(50, f - 10))}
                      title="Приблизить (Zoom in)"
                      className="p-1.5 rounded hover:bg-slate-800 text-slate-300 hover:text-white"
                    >
                      +
                    </button>
                    <button
                      onClick={() => setPanFov((f) => Math.min(100, f + 10))}
                      title="Отдалить (Zoom out)"
                      className="p-1.5 rounded hover:bg-slate-800 text-slate-300 hover:text-white"
                    >
                      -
                    </button>
                    <button
                      onClick={() => setIsAutoRotate(!isAutoRotate)}
                      title="Авто-вращение"
                      className={`p-1.5 rounded ${isAutoRotate ? 'text-indigo-400 bg-indigo-500/10' : 'text-slate-400 hover:text-white'}`}
                    >
                      <RotateCw className="h-3.5 w-3.5" />
                    </button>
                    <button
                      onClick={() => {
                        setPanYaw(0);
                        setPanPitch(0);
                        setPanFov(75);
                      }}
                      title="Сбросить ракурс"
                      className="p-1.5 rounded hover:bg-slate-800 text-slate-400 hover:text-white"
                    >
                      <RotateCcw className="h-3.5 w-3.5" />
                    </button>
                  </div>

                  {/* Hotspot details drawer if opened */}
                  {selectedHotspot && (
                    <div className="absolute inset-x-4 bottom-4 z-20 rounded-xl border border-indigo-500/40 bg-slate-950/95 p-4 shadow-2xl backdrop-blur animate-in fade-in">
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex items-center gap-2">
                          <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-indigo-500/20 text-indigo-400 border border-indigo-500/30">
                            <Info className="h-4 w-4" />
                          </div>
                          <div>
                            <h4 className="text-xs font-bold text-white">
                              {selectedHotspot.label}
                            </h4>
                            <span className="text-[10px] text-slate-400 font-mono">
                              Точка интереса 360° тура
                            </span>
                          </div>
                        </div>
                        <button
                          onClick={() => setSelectedHotspot(null)}
                          className="text-slate-400 hover:text-white"
                        >
                          <X className="h-4 w-4" />
                        </button>
                      </div>
                      <p className="mt-2 text-xs text-slate-300 leading-relaxed">
                        {selectedHotspot.details}
                      </p>
                    </div>
                  )}
                </div>
              ) : (
                /* Real Video Player Container */
                <div
                  ref={containerRef}
                  className="relative overflow-hidden rounded-xl border border-slate-800 bg-slate-950 aspect-video flex flex-col justify-between group"
                >
                  <video
                    ref={videoRef}
                    src={selectedMaterial.videoUrl}
                    poster={selectedMaterial.thumbnail}
                    className="w-full h-full object-cover cursor-pointer"
                    onClick={handleTogglePlay}
                    onTimeUpdate={() => {
                      if (videoRef.current) {
                        setCurrentTime(videoRef.current.currentTime);
                      }
                    }}
                    onLoadedMetadata={() => {
                      if (videoRef.current) {
                        setDuration(videoRef.current.duration);
                      }
                    }}
                    onPlay={() => setIsPlaying(true)}
                    onPause={() => setIsPlaying(false)}
                    onEnded={() => setIsPlaying(false)}
                  >
                    <track kind="captions" srcLang="ru" label="Русский" default />
                  </video>

                  {/* Center Big Play Button when paused */}
                  {!isPlaying && (
                    <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                      <button
                        onClick={handleTogglePlay}
                        className="pointer-events-auto flex h-16 w-16 items-center justify-center rounded-full bg-indigo-600/90 text-white shadow-2xl backdrop-blur transition-transform hover:scale-110 hover:bg-indigo-500"
                        aria-label="Воспроизвести видео"
                      >
                        <Play className="h-7 w-7 ml-1" />
                      </button>
                    </div>
                  )}

                  {/* Top Overlay Badge */}
                  <div className="absolute top-0 inset-x-0 z-10 flex items-center justify-between p-3 bg-gradient-to-b from-black/80 to-transparent pointer-events-none">
                    <div className="flex items-center gap-2 pointer-events-auto">
                      <span className="text-xs font-semibold text-white drop-shadow">
                        {selectedMaterial.organization}
                      </span>
                      {selectedMaterial.isUploadedFile && (
                        <span className="text-[10px] text-cyan-400 font-mono">
                          · Загружен локально ({selectedMaterial.fileSize || 'MP4'})
                        </span>
                      )}
                    </div>
                    <span className="rounded bg-black/60 px-2 py-0.5 font-mono text-[10px] text-slate-300">
                      {selectedMaterial.duration}
                    </span>
                  </div>

                  {/* Bottom Video Controls HUD */}
                  <div className="absolute bottom-0 inset-x-0 z-10 p-3 bg-gradient-to-t from-black/95 via-black/70 to-transparent space-y-2">
                    {/* Scrubber Bar with Chapter Ticks */}
                    <div
                      role="slider"
                      tabIndex={0}
                      aria-label="Перемотка видео"
                      aria-valuenow={Math.round(currentTime)}
                      aria-valuemin={0}
                      aria-valuemax={Math.round(duration || 100)}
                      onClick={handleSeek}
                      onKeyDown={(e) => {
                        if (e.key === 'ArrowRight') handleSkipTime(5);
                        if (e.key === 'ArrowLeft') handleSkipTime(-5);
                      }}
                      className="relative h-2 w-full bg-slate-700/60 rounded-full cursor-pointer group/scrub"
                      title="Перемотка"
                    >
                      <div
                        className="h-full bg-indigo-500 rounded-full transition-all"
                        style={{
                          width: `${(currentTime / (duration || 1)) * 100}%`,
                        }}
                      />

                      {/* Chapter Markers on the scrubber */}
                      {selectedMaterial.chapters &&
                        duration > 0 &&
                        selectedMaterial.chapters.map((ch, idx) => {
                          const percent = (ch.timeSeconds / duration) * 100;
                          return (
                            <div
                              key={idx}
                              style={{ left: `${percent}%` }}
                              title={`${ch.timeFormatted} - ${ch.title}`}
                              className="absolute top-0 bottom-0 w-0.5 bg-white/70 hover:w-1 hover:bg-yellow-400 transition-all pointer-events-none"
                            />
                          );
                        })}
                    </div>

                    {/* Controls Row */}
                    <div className="flex items-center justify-between text-white text-[11px]">
                      <div className="flex items-center gap-3">
                        <button
                          onClick={handleTogglePlay}
                          className="hover:text-indigo-400 transition-colors"
                          aria-label={isPlaying ? 'Пауза' : 'Воспроизведение'}
                        >
                          {isPlaying ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
                        </button>

                        <button
                          onClick={() => handleSkipTime(-10)}
                          className="hover:text-indigo-400 transition-colors"
                          title="Назад на 10 сек"
                        >
                          <RotateCcw className="h-3.5 w-3.5" />
                        </button>
                        <button
                          onClick={() => handleSkipTime(10)}
                          className="hover:text-indigo-400 transition-colors"
                          title="Вперед на 10 сек"
                        >
                          <RotateCw className="h-3.5 w-3.5" />
                        </button>

                        {/* Volume Control */}
                        <div className="flex items-center gap-1.5 group/vol">
                          <button
                            onClick={handleToggleMute}
                            className="hover:text-indigo-400 transition-colors"
                            aria-label={isMuted ? 'Включить звук' : 'Выключить звук'}
                          >
                            {isMuted || volume === 0 ? (
                              <VolumeX className="h-4 w-4" />
                            ) : (
                              <Volume2 className="h-4 w-4" />
                            )}
                          </button>
                          <input
                            type="range"
                            min={0}
                            max={1}
                            step={0.05}
                            value={isMuted ? 0 : volume}
                            onChange={handleVolumeChange}
                            className="w-16 h-1 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-indigo-500"
                          />
                        </div>

                        {/* Time display */}
                        <span className="font-mono text-[10px] text-slate-300">
                          {formatTime(currentTime)} / {formatTime(duration || 0)}
                        </span>
                      </div>

                      <div className="flex items-center gap-2">
                        {/* Speed selector */}
                        <button
                          onClick={handleSpeedChange}
                          className="rounded bg-white/10 px-2 py-0.5 font-mono text-[10px] hover:bg-white/20 transition-colors"
                        >
                          {playbackSpeed}x
                        </button>

                        {/* Fullscreen */}
                        <button
                          onClick={handleToggleFullscreen}
                          className="hover:text-indigo-400 transition-colors"
                          aria-label="На весь экран"
                        >
                          {isFullscreen ? (
                            <Minimize className="h-3.5 w-3.5" />
                          ) : (
                            <Maximize className="h-3.5 w-3.5" />
                          )}
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Title & Author Info (Zero-Pill Discipline) */}
              <div>
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <h2 className="text-base font-bold text-white leading-snug">
                      {selectedMaterial.title}
                    </h2>
                    {/* Clean Metadata with separator dots */}
                    <div className="flex flex-wrap items-center gap-2 mt-1.5 text-xs text-slate-400">
                      <span className="text-slate-300">
                        Автор:{' '}
                        <strong className="text-white font-medium">
                          {selectedMaterial.author}
                        </strong>
                      </span>
                      <span aria-hidden="true" className="text-slate-600">
                        ·
                      </span>
                      <span>{selectedMaterial.organization}</span>
                      <span aria-hidden="true" className="text-slate-600">
                        ·
                      </span>
                      <span>Длительность: {selectedMaterial.duration}</span>
                      <span aria-hidden="true" className="text-slate-600">
                        ·
                      </span>
                      <span>{selectedMaterial.publishedAt}</span>
                    </div>
                  </div>

                  {/* Optional delete button if user added it */}
                  {onDeleteMaterial && (
                    <button
                      onClick={() => onDeleteMaterial(selectedMaterial.id)}
                      className="text-slate-500 hover:text-rose-400 p-1.5 rounded-lg hover:bg-rose-500/10 transition-colors"
                      title="Удалить видеоматериал"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  )}
                </div>
              </div>

              {/* Chapters & Timeline Navigation */}
              {selectedMaterial.chapters && selectedMaterial.chapters.length > 0 && (
                <div className="rounded-xl border border-slate-800 bg-slate-950 p-3.5">
                  <div className="flex items-center gap-2 mb-2 text-white font-semibold text-xs">
                    <ListOrdered className="h-4 w-4 text-indigo-400" />
                    <span>Таймкоды и разделы видеоматериала:</span>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {selectedMaterial.chapters.map((ch, idx) => {
                      const isCurrent =
                        currentTime >= ch.timeSeconds &&
                        (idx === selectedMaterial.chapters!.length - 1 ||
                          currentTime < selectedMaterial.chapters![idx + 1].timeSeconds);

                      return (
                        <button
                          key={idx}
                          onClick={() => handleSeekChapter(ch.timeSeconds)}
                          className={`flex items-center justify-between p-2 rounded-lg text-left text-xs transition-colors border ${
                            isCurrent
                              ? 'border-indigo-500/50 bg-indigo-500/10 text-white'
                              : 'border-slate-800/80 bg-slate-900/60 text-slate-300 hover:border-slate-700 hover:text-white'
                          }`}
                        >
                          <div className="flex items-center gap-2 min-w-0">
                            <span className="font-mono text-[10px] text-indigo-400 shrink-0">
                              {ch.timeFormatted}
                            </span>
                            <span className="truncate">{ch.title}</span>
                          </div>
                          <Play className="h-3 w-3 text-slate-500 shrink-0 ml-1" />
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Description Content */}
              <div className="rounded-xl border border-slate-800 bg-slate-950 p-4 text-slate-300 text-xs leading-relaxed">
                <p>{selectedMaterial.description}</p>
              </div>

              {/* Covered Key Topics */}
              {selectedMaterial.keyTopics.length > 0 && (
                <div>
                  <h4 className="font-semibold text-white mb-2 text-xs">
                    Ключевые темы и физические принципы:
                  </h4>
                  <div className="flex flex-wrap gap-1.5">
                    {selectedMaterial.keyTopics.map((topic) => (
                      <span
                        key={topic}
                        className="rounded-lg border border-slate-800 bg-slate-950 px-2.5 py-1 text-slate-300 text-[11px]"
                      >
                        ✓ {topic}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* External Resources & Downloadable References */}
              {selectedMaterial.externalResources.length > 0 && (
                <div className="pt-2 border-t border-slate-800">
                  <h4 className="font-semibold text-white mb-2 text-xs flex items-center justify-between">
                    <span>Методические материалы и ссылки на внешние ресурсы:</span>
                    <span className="text-[11px] text-slate-400 font-normal">
                      {selectedMaterial.externalResources.length} ресурсов
                    </span>
                  </h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {selectedMaterial.externalResources.map((res, idx) => (
                      <div
                        key={idx}
                        className="flex items-center justify-between rounded-xl border border-slate-800 bg-slate-950 p-3 text-slate-300 hover:border-indigo-500/40 hover:text-white transition-all group/item"
                      >
                        <div className="flex items-center gap-2.5 min-w-0 pr-2">
                          <div className="p-1.5 rounded-lg bg-slate-900 border border-slate-800 shrink-0">
                            {getResourceIcon(res.type)}
                          </div>
                          <div className="min-w-0">
                            <div className="font-medium text-white truncate text-xs">
                              {res.title}
                            </div>
                            <div className="text-[10px] text-slate-500 font-mono flex items-center gap-1.5">
                              <span>{getResourceTypeLabel(res.type)}</span>
                              <span>·</span>
                              <span className="truncate">
                                {res.url.replace(/^https?:\/\//, '')}
                              </span>
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center gap-1 shrink-0">
                          <button
                            onClick={() => handleCopyLink(res.url, `${selectedMaterial.id}_${idx}`)}
                            title="Скопировать ссылку"
                            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
                          >
                            {copiedLink === `${selectedMaterial.id}_${idx}` ? (
                              <Check className="h-3.5 w-3.5 text-emerald-400" />
                            ) : (
                              <Copy className="h-3.5 w-3.5" />
                            )}
                          </button>
                          <a
                            href={res.url}
                            target="_blank"
                            rel="noreferrer"
                            title="Открыть внешнюю ссылку"
                            className="p-1.5 rounded-lg text-slate-400 hover:text-indigo-400 hover:bg-slate-800 transition-colors"
                          >
                            <ExternalLink className="h-3.5 w-3.5" />
                          </a>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Right Column: Catalog of Available Materials (4 cols) */}
        <div className="lg:col-span-4 space-y-3">
          <div className="font-bold text-white text-xs mb-1 flex items-center justify-between">
            <span>Каталог материалов ({filteredMaterials.length}):</span>
          </div>

          <div className="space-y-2.5 max-h-[75vh] overflow-y-auto pr-1">
            {filteredMaterials.map((mat) => {
              const isSelected = mat.id === selectedMaterial?.id;

              return (
                <div
                  key={mat.id}
                  role="button"
                  tabIndex={0}
                  aria-pressed={isSelected}
                  onClick={() => handleSelectMaterial(mat.id)}
                  onKeyDown={(event) => {
                    if (event.key === 'Enter' || event.key === ' ') {
                      event.preventDefault();
                      handleSelectMaterial(mat.id);
                    }
                  }}
                  className={`cursor-pointer rounded-xl border p-3 text-xs transition-all flex gap-3 ${
                    isSelected
                      ? 'border-indigo-500 bg-indigo-950/20 shadow-md'
                      : 'border-slate-800 bg-slate-900/60 hover:bg-slate-900 hover:border-slate-700'
                  }`}
                >
                  <div className="relative h-16 w-24 shrink-0 rounded-lg overflow-hidden bg-slate-950">
                    <img
                      src={mat.thumbnail}
                      alt={mat.title}
                      className="h-full w-full object-cover"
                    />
                    <span className="absolute bottom-1 right-1 rounded bg-black/80 px-1 py-0.2 text-[9px] font-mono text-white">
                      {mat.duration}
                    </span>
                  </div>

                  <div className="flex-1 min-w-0">
                    <span className="text-[10px] text-indigo-400 font-medium">
                      {categoryLabels[mat.category]}
                    </span>
                    <h4 className="font-bold text-white line-clamp-2 leading-snug mt-0.5">
                      {mat.title}
                    </h4>
                    <div className="text-[10px] text-slate-400 truncate mt-1">
                      {mat.author} · {mat.organization}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Add New Educational Material Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4 animate-in fade-in">
          <div className="w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-2xl border border-slate-800 bg-slate-900 p-6 shadow-2xl text-slate-200 text-xs">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <Video className="h-5 w-5 text-indigo-400" />
                <h3 className="text-base font-bold text-white">
                  Добавить образовательный видеоматериал
                </h3>
              </div>
              <button
                onClick={() => setIsAddModalOpen(false)}
                className="text-slate-400 hover:text-white"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleCreateMaterial} className="mt-4 space-y-4">
              {/* Upload Mode Selector */}
              <div>
                <div className="block text-slate-300 font-medium mb-1.5">
                  Способ добавления видеоматериала *
                </div>
                <div className="grid grid-cols-2 gap-2 bg-slate-950 p-1 rounded-xl border border-slate-800">
                  <button
                    type="button"
                    onClick={() => setUploadMode('upload')}
                    className={`py-2 px-3 rounded-lg text-xs font-medium flex items-center justify-center gap-2 transition-colors ${
                      uploadMode === 'upload'
                        ? 'bg-indigo-600 text-white'
                        : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    <UploadCloud className="h-4 w-4" />
                    <span>Загрузить видеофайл</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setUploadMode('url')}
                    className={`py-2 px-3 rounded-lg text-xs font-medium flex items-center justify-center gap-2 transition-colors ${
                      uploadMode === 'url'
                        ? 'bg-indigo-600 text-white'
                        : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    <ExternalLink className="h-4 w-4" />
                    <span>Указать ссылку (URL / Embed)</span>
                  </button>
                </div>
              </div>

              {/* Upload File Box or Video URL Input */}
              {uploadMode === 'upload' ? (
                <div className="rounded-xl border-2 border-dashed border-slate-700 bg-slate-950 p-4 text-center">
                  <label
                    htmlFor="video_file_input"
                    className="cursor-pointer flex flex-col items-center justify-center gap-2"
                  >
                    <input
                      type="file"
                      id="video_file_input"
                      accept="video/mp4,video/webm,video/ogg,video/quicktime"
                      onChange={handleFileUpload}
                      className="hidden"
                    />
                    <UploadCloud className="h-8 w-8 text-indigo-400" />
                    <div>
                      <span className="text-white font-medium">Выберите видеофайл</span>
                      <span className="text-slate-400"> или перетащите сюда</span>
                    </div>
                    <span className="text-[10px] text-slate-500">
                      Поддерживаются MP4, WebM, MOV до 500 МБ
                    </span>
                  </label>

                  {uploadedFile && (
                    <div className="mt-3 p-2.5 rounded-lg bg-slate-900 border border-slate-800 flex items-center justify-between text-left">
                      <div className="min-w-0 pr-2">
                        <div className="text-white font-medium truncate">{uploadedFile.name}</div>
                        <div className="text-[10px] text-slate-400 font-mono">
                          {(uploadedFile.size / (1024 * 1024)).toFixed(1)} МБ · Готово к
                          воспроизведению
                        </div>
                      </div>
                      {isUploading ? (
                        <span className="text-cyan-400 text-xs font-medium animate-pulse shrink-0">
                          Загрузка {uploadProgress}%...
                        </span>
                      ) : (
                        <span className="text-emerald-400 text-xs font-medium shrink-0">
                          Загружено 100%
                        </span>
                      )}
                    </div>
                  )}
                </div>
              ) : (
                <div>
                  <label
                    htmlFor="video_url_field"
                    className="block text-slate-300 font-medium mb-1"
                  >
                    Ссылка на видеоматериал / виртуальный тур (MP4, YouTube, Vimeo)
                  </label>
                  <input
                    id="video_url_field"
                    type="url"
                    placeholder="https://commondatastorage.googleapis.com/... или https://youtube.com/..."
                    value={newVideoUrl}
                    onChange={(e) => setNewVideoUrl(e.target.value)}
                    className="w-full rounded-lg border border-slate-800 bg-slate-950 px-3 py-2 text-white focus:border-indigo-500 focus:outline-none"
                  />
                </div>
              )}

              {/* Title Input */}
              <div>
                <label htmlFor="title_field" className="block text-slate-300 font-medium mb-1">
                  Название материала *
                </label>
                <input
                  id="title_field"
                  type="text"
                  required
                  placeholder="например, Видеолекция: Расчет теплообмена КубСата в термовакууме"
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  className="w-full rounded-lg border border-slate-800 bg-slate-950 px-3 py-2 text-white focus:border-indigo-500 focus:outline-none"
                />
              </div>

              {/* Optional Thumbnail Field */}
              <div>
                <label htmlFor="thumbnail_field" className="block text-slate-300 font-medium mb-1">
                  URL обложки видео (необязательно)
                </label>
                <input
                  id="thumbnail_field"
                  type="url"
                  placeholder="https://images.unsplash.com/... (оставьте пустым для авто-выбора)"
                  value={newThumbnailUrl}
                  onChange={(e) => setNewThumbnailUrl(e.target.value)}
                  className="w-full rounded-lg border border-slate-800 bg-slate-950 px-3 py-2 text-white focus:border-indigo-500 focus:outline-none"
                />
              </div>

              {/* Category & Duration */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label htmlFor="category_field" className="block text-slate-300 font-medium mb-1">
                    Категория
                  </label>
                  <select
                    id="category_field"
                    value={newCategory}
                    onChange={(e) =>
                      setNewCategory(e.target.value as EducationalMaterial['category'])
                    }
                    className="w-full rounded-lg border border-slate-800 bg-slate-950 px-3 py-2 text-white focus:border-indigo-500 focus:outline-none"
                  >
                    <option value="tour_360">🌐 Виртуальная 360° экскурсия</option>
                    <option value="lecture">🎓 Видеолекция</option>
                    <option value="masterclass">🔧 Мастер-класс</option>
                    <option value="workshop">💻 Практикум</option>
                  </select>
                </div>
                <div>
                  <label htmlFor="duration_field" className="block text-slate-300 font-medium mb-1">
                    Длительность
                  </label>
                  <input
                    id="duration_field"
                    type="text"
                    value={newDuration}
                    onChange={(e) => setNewDuration(e.target.value)}
                    className="w-full rounded-lg border border-slate-800 bg-slate-950 px-3 py-2 text-white focus:border-indigo-500 focus:outline-none"
                  />
                </div>
              </div>

              {/* Author & Organization */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label htmlFor="author_field" className="block text-slate-300 font-medium mb-1">
                    Лектор / Автор
                  </label>
                  <input
                    id="author_field"
                    type="text"
                    placeholder="ФИО ученого или инженера"
                    value={newAuthor}
                    onChange={(e) => setNewAuthor(e.target.value)}
                    className="w-full rounded-lg border border-slate-800 bg-slate-950 px-3 py-2 text-white focus:border-indigo-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label htmlFor="org_field" className="block text-slate-300 font-medium mb-1">
                    Организация / Университет
                  </label>
                  <input
                    id="org_field"
                    type="text"
                    placeholder="Роскосмос / МГУ / НИИ КС"
                    value={newOrg}
                    onChange={(e) => setNewOrg(e.target.value)}
                    className="w-full rounded-lg border border-slate-800 bg-slate-950 px-3 py-2 text-white focus:border-indigo-500 focus:outline-none"
                  />
                </div>
              </div>

              {/* Description & Topics */}
              <div>
                <label htmlFor="desc_field" className="block text-slate-300 font-medium mb-1">
                  Описание и аннотация материала
                </label>
                <textarea
                  id="desc_field"
                  rows={2}
                  placeholder="Опишите, какие формулы, законы физики или элементы конструкции разбираются в видео..."
                  value={newDescription}
                  onChange={(e) => setNewDescription(e.target.value)}
                  className="w-full rounded-lg border border-slate-800 bg-slate-950 p-2.5 text-white focus:border-indigo-500 focus:outline-none"
                />
              </div>

              <div>
                <label htmlFor="topics_field" className="block text-slate-300 font-medium mb-1">
                  Ключевые темы (через запятую)
                </label>
                <input
                  id="topics_field"
                  type="text"
                  placeholder="3-й закон Кеплера, Link Budget, GaAS панели"
                  value={newTopics}
                  onChange={(e) => setNewTopics(e.target.value)}
                  className="w-full rounded-lg border border-slate-800 bg-slate-950 px-3 py-2 text-white focus:border-indigo-500 focus:outline-none"
                />
              </div>

              {/* Dynamic Chapters / Timestamps Section */}
              <div className="pt-2 border-t border-slate-800">
                <div className="flex items-center justify-between mb-2">
                  <span className="font-medium text-white text-xs">
                    Главы и таймкоды видеоматериала:
                  </span>
                  <button
                    type="button"
                    onClick={handleAddModalChapter}
                    className="text-[11px] text-indigo-400 hover:text-indigo-300 flex items-center gap-1"
                  >
                    <Plus className="h-3.5 w-3.5" />
                    <span>Добавить главу</span>
                  </button>
                </div>
                <div className="space-y-2">
                  {modalChapters.map((chap, idx) => (
                    <div key={idx} className="flex items-center gap-2">
                      <input
                        type="text"
                        placeholder="00:00"
                        value={chap.timeFormatted}
                        onChange={(e) =>
                          handleUpdateModalChapter(idx, 'timeFormatted', e.target.value)
                        }
                        className="w-20 rounded-lg border border-slate-800 bg-slate-950 px-2.5 py-1.5 font-mono text-white text-xs focus:border-indigo-500 focus:outline-none"
                      />
                      <input
                        type="text"
                        placeholder="Название раздела"
                        value={chap.title}
                        onChange={(e) => handleUpdateModalChapter(idx, 'title', e.target.value)}
                        className="flex-1 rounded-lg border border-slate-800 bg-slate-950 px-2.5 py-1.5 text-white text-xs focus:border-indigo-500 focus:outline-none"
                      />
                      <button
                        type="button"
                        onClick={() => handleRemoveModalChapter(idx)}
                        className="text-slate-500 hover:text-rose-400 p-1"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              {/* Dynamic External Resources Section */}
              <div className="pt-2 border-t border-slate-800">
                <div className="flex items-center justify-between mb-2">
                  <span className="font-medium text-white text-xs">
                    Ссылки на внешние ресурсы и методические материалы:
                  </span>
                  <button
                    type="button"
                    onClick={handleAddModalResource}
                    className="text-[11px] text-indigo-400 hover:text-indigo-300 flex items-center gap-1"
                  >
                    <Plus className="h-3.5 w-3.5" />
                    <span>Добавить ресурс</span>
                  </button>
                </div>
                <div className="space-y-2">
                  {modalResources.map((res, idx) => (
                    <div key={idx} className="grid grid-cols-12 gap-2 items-center">
                      <div className="col-span-4">
                        <input
                          type="text"
                          placeholder="Название (PDF/репозиторий)"
                          value={res.title}
                          onChange={(e) => handleUpdateModalResource(idx, 'title', e.target.value)}
                          className="w-full rounded-lg border border-slate-800 bg-slate-950 px-2.5 py-1.5 text-white text-xs focus:border-indigo-500 focus:outline-none"
                        />
                      </div>
                      <div className="col-span-5">
                        <input
                          type="url"
                          placeholder="https://..."
                          value={res.url}
                          onChange={(e) => handleUpdateModalResource(idx, 'url', e.target.value)}
                          className="w-full rounded-lg border border-slate-800 bg-slate-950 px-2.5 py-1.5 text-white text-xs focus:border-indigo-500 focus:outline-none"
                        />
                      </div>
                      <div className="col-span-2">
                        <select
                          value={res.type}
                          onChange={(e) =>
                            handleUpdateModalResource(
                              idx,
                              'type',
                              e.target.value as ExternalResourceInput['type'],
                            )
                          }
                          className="w-full rounded-lg border border-slate-800 bg-slate-950 px-2 py-1.5 text-white text-xs focus:border-indigo-500 focus:outline-none"
                        >
                          <option value="pdf">PDF</option>
                          <option value="code">Код / Git</option>
                          <option value="dataset">Датасет</option>
                          <option value="link">Ссылка</option>
                        </select>
                      </div>
                      <div className="col-span-1 text-center">
                        <button
                          type="button"
                          onClick={() => handleRemoveModalResource(idx)}
                          className="text-slate-500 hover:text-rose-400 p-1"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Footer Buttons */}
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
                  className="rounded-lg bg-indigo-600 px-5 py-2 font-bold text-white hover:bg-indigo-500 shadow-md transition-colors"
                >
                  Опубликовать материал
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

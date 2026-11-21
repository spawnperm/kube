import React, { useState } from 'react';
import {
  type CubeSatMissionIdea,
  MISSION_CATEGORIES,
  CREW_ROLES,
  type CrewRole,
} from '../data/cubesatMissionIdeas';
import { ALL_CATALOG_ROLES, ROLE_ICONS } from './CubeSatIdeasCatalog';
import {
  X,
  Sparkles,
  PlusCircle,
  Satellite,
  Users,
  Star,
  Orbit,
  Cpu,
  Layers,
  Check,
} from 'lucide-react';

interface AddCustomIdeaModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAddIdea: (newIdea: CubeSatMissionIdea) => void;
  nextNumber: number;
}

const AVAILABLE_CATEGORIES = MISSION_CATEGORIES.filter((c) => c !== 'Все категории');

export const AddCustomIdeaModal: React.FC<AddCustomIdeaModalProps> = ({
  isOpen,
  onClose,
  onAddIdea,
  nextNumber,
}) => {
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState<string>(AVAILABLE_CATEGORIES[0]);
  const [customCategory, setCustomCategory] = useState('');
  const [format, setFormat] = useState<'1U' | '2U' | '3U' | '6U' | '12U'>('3U');
  const [trackId, setTrackId] = useState<CubeSatMissionIdea['trackId']>(
    'track_payload_remote_sensing',
  );
  const [description, setDescription] = useState('');
  const [payload, setPayload] = useState('');
  const [orbit, setOrbit] = useState('НОО 520 км, солнечно-синхронная ССО, наклонение 97.5°');
  const [creativityHighlight, setCreativityHighlight] = useState('');
  const [selectedRoles, setSelectedRoles] = useState<string[]>([
    'Инженер',
    'Программист',
    'Исследователь',
  ]);
  const [rating, setRating] = useState<number>(4);
  const [errors, setErrors] = useState<Record<string, string>>({});

  if (!isOpen) return null;

  const toggleRole = (role: string) => {
    if (selectedRoles.includes(role)) {
      if (selectedRoles.length > 1) {
        setSelectedRoles(selectedRoles.filter((r) => r !== role));
      }
    } else {
      setSelectedRoles([...selectedRoles, role]);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const newErrors: Record<string, string> = {};

    const cleanTitle = title.trim();
    if (!cleanTitle) {
      newErrors.title = 'Укажите название вашей миссии или идеи';
    } else if (cleanTitle.length < 5) {
      newErrors.title = 'Название должно содержать не менее 5 символов';
    }

    const cleanCategory = category === 'Другая категория' ? customCategory.trim() : category;
    if (!cleanCategory) {
      newErrors.category = 'Выберите или введите категорию миссии';
    }

    const cleanDesc = description.trim();
    if (!cleanDesc) {
      newErrors.description = 'Опишите цель и научную задачу миссии';
    } else if (cleanDesc.length < 15) {
      newErrors.description = 'Описание должно быть подробным (от 15 символов)';
    }

    const cleanPayload = payload.trim();
    if (!cleanPayload) {
      newErrors.payload = 'Укажите состав полезной нагрузки и приборов';
    }

    const cleanHighlight = creativityHighlight.trim();
    if (!cleanHighlight) {
      newErrors.creativityHighlight = 'Опишите ключевую особенность или инновацию идеи';
    }

    if (selectedRoles.length === 0) {
      newErrors.roles = 'Выберите хотя бы одну роль для миссии';
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    const newIdea: CubeSatMissionIdea = {
      id: `custom-idea-${Date.now()}`,
      number: nextNumber,
      title: cleanTitle,
      category: cleanCategory,
      scope: 'Научное',
      description: cleanDesc,
      payload: cleanPayload,
      orbit: orbit.trim() || 'НОО 500-550 км',
      trackId,
      roles: selectedRoles,
      rating,
      creativityHighlight: cleanHighlight,
      isCustom: true,
      format,
    };

    onAddIdea(newIdea);
    onClose();

    // Reset fields
    setTitle('');
    setDescription('');
    setPayload('');
    setCreativityHighlight('');
    setErrors({});
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/80 backdrop-blur-md overflow-y-auto">
      <div className="relative w-full max-w-2xl rounded-2xl border border-cyan-500/40 bg-slate-900 shadow-2xl shadow-cyan-950/50 my-8 overflow-hidden text-slate-100 animate-in fade-in zoom-in-95 duration-150">
        {/* Шапка модального окна */}
        <div className="flex items-center justify-between border-b border-slate-800 bg-gradient-to-r from-slate-900 via-slate-950 to-indigo-950/60 px-5 py-4">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 text-slate-950 shadow-md shadow-emerald-500/30">
              <PlusCircle className="h-5 w-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-white text-base">Внести свою идею CubeSat</h3>
                <span className="rounded-full bg-emerald-500/20 px-2 py-0.5 text-[10px] font-bold text-emerald-300 border border-emerald-500/40">
                  Идея команды
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Зарегистрируйте авторскую разработку вашей команды в общем банке решений
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-800 hover:text-white transition-colors cursor-pointer"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Форма внесения идеи */}
        <form onSubmit={handleSubmit} className="p-5 space-y-4 max-h-[80vh] overflow-y-auto">
          {/* Название */}
          <div>
            <label className="block text-xs font-semibold text-slate-200 mb-1">
              Название миссии / авторской идеи <span className="text-rose-400">*</span>
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => {
                setTitle(e.target.value);
                if (errors.title) setErrors((prev) => ({ ...prev, title: '' }));
              }}
              placeholder="Например: Двухспектральный мониторинг цветения водорослей Байкала"
              className={`w-full rounded-lg border bg-slate-950 px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none transition-colors ${
                errors.title
                  ? 'border-rose-500 focus:border-rose-400'
                  : 'border-slate-800 focus:border-cyan-400'
              }`}
            />
            {errors.title && <p className="text-[11px] text-rose-400 mt-1">{errors.title}</p>}
          </div>

          {/* Категория и Форм-фактор */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-200 mb-1">
                Категория миссии <span className="text-rose-400">*</span>
              </label>
              <select
                value={category}
                onChange={(e) => {
                  setCategory(e.target.value);
                  if (errors.category) setErrors((prev) => ({ ...prev, category: '' }));
                }}
                className="w-full rounded-lg border border-slate-800 bg-slate-950 px-3 py-2 text-xs text-white focus:border-cyan-400 focus:outline-none"
              >
                {AVAILABLE_CATEGORIES.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
                <option value="Другая категория">Другая категория (ввести вручную)...</option>
              </select>

              {category === 'Другая категория' && (
                <input
                  type="text"
                  value={customCategory}
                  onChange={(e) => setCustomCategory(e.target.value)}
                  placeholder="Введите название новой категории..."
                  className="mt-2 w-full rounded-lg border border-slate-800 bg-slate-950 px-3 py-1.5 text-xs text-white focus:border-cyan-400 focus:outline-none"
                />
              )}
              {errors.category && (
                <p className="text-[11px] text-rose-400 mt-1">{errors.category}</p>
              )}
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-200 mb-1">
                Форм-фактор CubeSat
              </label>
              <div className="grid grid-cols-5 gap-1.5">
                {(['1U', '2U', '3U', '6U', '12U'] as const).map((fmt) => (
                  <button
                    key={fmt}
                    type="button"
                    onClick={() => setFormat(fmt)}
                    className={`py-2 rounded-lg text-xs font-bold border transition-all cursor-pointer ${
                      format === fmt
                        ? 'bg-cyan-500 text-slate-950 border-cyan-300 shadow-sm shadow-cyan-500/20'
                        : 'bg-slate-950 text-slate-400 border-slate-800 hover:border-slate-700 hover:text-white'
                    }`}
                  >
                    {fmt}
                  </button>
                ))}
              </div>
              <p className="text-[10px] text-slate-500 mt-1 font-mono">
                {format === '1U' && '100×100×100 мм, до 1.33 кг'}
                {format === '2U' && '100×100×200 мм, до 2.66 кг'}
                {format === '3U' && '100×100×340 мм, до 4.00 кг'}
                {format === '6U' && '100×226×366 мм, до 8.00 кг'}
                {format === '12U' && '226×226×366 мм, до 16.0 кг'}
              </p>
            </div>
          </div>

          {/* Инженерный трек кейс-чемпионата */}
          <div>
            <label className="block text-xs font-semibold text-slate-200 mb-1">
              Инженерный трек чемпионата
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
              {[
                { id: 'track_ballistics', label: 'Баллистика и расчет схода с орбиты' },
                { id: 'track_payload_remote_sensing', label: 'Полезная нагрузка и ДЗЗ' },
                { id: 'track_radio_telemetry', label: 'Радиоканал AX.25 и телеметрия' },
                { id: 'track_adcs_orientation', label: 'ADCS (ориентация и стабилизация)' },
                { id: 'track_power_systems', label: 'Системы электропитания и АКБ' },
              ].map((trk) => (
                <button
                  key={trk.id}
                  type="button"
                  onClick={() => setTrackId(trk.id as CubeSatMissionIdea['trackId'])}
                  className={`px-3 py-2 rounded-lg text-left border transition-all cursor-pointer text-xs flex items-center justify-between ${
                    trackId === trk.id
                      ? 'border-indigo-400 bg-indigo-950/40 text-indigo-200 font-semibold ring-1 ring-indigo-400/40'
                      : 'border-slate-800 bg-slate-950/60 text-slate-400 hover:border-slate-700 hover:text-white'
                  }`}
                >
                  <span className="truncate">{trk.label}</span>
                  {trackId === trk.id && (
                    <Check className="h-3.5 w-3.5 text-indigo-400 shrink-0 ml-1" />
                  )}
                </button>
              ))}
            </div>
          </div>

          {/* Ключевая особенность / инновация */}
          <div>
            <label className="block text-xs font-semibold text-slate-200 mb-1 flex items-center gap-1.5">
              <Sparkles className="h-3.5 w-3.5 text-amber-400" />
              <span>Ключевая особенность и инновационное решение</span>{' '}
              <span className="text-rose-400">*</span>
            </label>
            <input
              type="text"
              value={creativityHighlight}
              onChange={(e) => {
                setCreativityHighlight(e.target.value);
                if (errors.creativityHighlight) {
                  setErrors((prev) => ({ ...prev, creativityHighlight: '' }));
                }
              }}
              placeholder="Например: Бортовая нейросеть для фильтрации облачности перед передачей по радиоканалу"
              className={`w-full rounded-lg border bg-slate-950 px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none transition-colors ${
                errors.creativityHighlight
                  ? 'border-rose-500 focus:border-rose-400'
                  : 'border-slate-800 focus:border-cyan-400'
              }`}
            />
            {errors.creativityHighlight && (
              <p className="text-[11px] text-rose-400 mt-1">{errors.creativityHighlight}</p>
            )}
          </div>

          {/* Описание миссии */}
          <div>
            <label className="block text-xs font-semibold text-slate-200 mb-1">
              Научно-техническая цель и описание задачи <span className="text-rose-400">*</span>
            </label>
            <textarea
              rows={3}
              value={description}
              onChange={(e) => {
                setDescription(e.target.value);
                if (errors.description) setErrors((prev) => ({ ...prev, description: '' }));
              }}
              placeholder="Опишите подробно, какую физическую или прикладную задачу решает кубсат, условия орбиты и ожидаемый результат..."
              className={`w-full rounded-lg border bg-slate-950 px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none transition-colors resize-none ${
                errors.description
                  ? 'border-rose-500 focus:border-rose-400'
                  : 'border-slate-800 focus:border-cyan-400'
              }`}
            />
            {errors.description && (
              <p className="text-[11px] text-rose-400 mt-1">{errors.description}</p>
            )}
          </div>

          {/* Полезная нагрузка и Орбита */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-200 mb-1 flex items-center gap-1">
                <Cpu className="h-3.5 w-3.5 text-cyan-400" />
                <span>Полезная нагрузка и приборы</span> <span className="text-rose-400">*</span>
              </label>
              <input
                type="text"
                value={payload}
                onChange={(e) => {
                  setPayload(e.target.value);
                  if (errors.payload) setErrors((prev) => ({ ...prev, payload: '' }));
                }}
                placeholder="Спектрометр VIS/NIR, CMOS-матрица, ПЛИС"
                className={`w-full rounded-lg border bg-slate-950 px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none transition-colors ${
                  errors.payload
                    ? 'border-rose-500 focus:border-rose-400'
                    : 'border-slate-800 focus:border-cyan-400'
                }`}
              />
              {errors.payload && <p className="text-[11px] text-rose-400 mt-1">{errors.payload}</p>}
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-200 mb-1 flex items-center gap-1">
                <Orbit className="h-3.5 w-3.5 text-indigo-400" />
                <span>Расчетная орбита</span>
              </label>
              <input
                type="text"
                value={orbit}
                onChange={(e) => setOrbit(e.target.value)}
                placeholder="НОО 520 км, наклонение 97.5°"
                className="w-full rounded-lg border border-slate-800 bg-slate-950 px-3 py-2 text-xs text-white placeholder-slate-500 focus:border-cyan-400 focus:outline-none"
              />
            </div>
          </div>

          {/* Роли участников (мультивыбор тегов) */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs font-semibold text-slate-200 flex items-center gap-1.5">
                <Users className="h-3.5 w-3.5 text-cyan-400" />
                <span>Необходимые роли участников экипажа</span>{' '}
                <span className="text-rose-400">*</span>
              </label>
              <span className="text-[11px] text-cyan-400 font-mono">
                Выбрано: {selectedRoles.length}
              </span>
            </div>
            <div className="flex flex-wrap gap-1.5 p-2 rounded-xl bg-slate-950 border border-slate-800">
              {ALL_CATALOG_ROLES.map((role) => {
                const isSelected = selectedRoles.includes(role);
                const icon = ROLE_ICONS[role] || '👤';

                return (
                  <button
                    key={role}
                    type="button"
                    onClick={() => toggleRole(role)}
                    className={`px-2.5 py-1 rounded-lg text-xs font-medium border transition-all cursor-pointer flex items-center gap-1.5 ${
                      isSelected
                        ? 'bg-cyan-500 text-slate-950 border-cyan-300 font-bold shadow-xs'
                        : 'bg-slate-900 text-slate-400 border-slate-800 hover:border-slate-700 hover:text-white'
                    }`}
                  >
                    <span>{icon}</span>
                    <span>{role}</span>
                    {isSelected && <Check className="h-3 w-3 stroke-[3]" />}
                  </button>
                );
              })}
            </div>
            {errors.roles && <p className="text-[11px] text-rose-400 mt-1">{errors.roles}</p>}
          </div>

          {/* Сложность / рейтинг (3-5 звезд) */}
          <div className="flex items-center justify-between p-3 rounded-xl bg-slate-950 border border-slate-800">
            <div>
              <span className="block text-xs font-semibold text-slate-200">
                Сложность / рейтинг миссии (3–5 звезд)
              </span>
              <span className="text-[11px] text-slate-500">
                Определяет глубину проработки физических процессов
              </span>
            </div>

            <div className="flex items-center gap-1 bg-slate-900 px-3 py-1.5 rounded-lg border border-slate-800">
              {[3, 4, 5].map((stars) => (
                <button
                  key={stars}
                  type="button"
                  onClick={() => setRating(stars)}
                  className={`flex items-center gap-0.5 px-2 py-1 rounded-md text-xs font-bold transition-all cursor-pointer ${
                    rating === stars
                      ? 'bg-amber-400/20 text-amber-300 border border-amber-400/40 shadow-xs'
                      : 'text-slate-500 hover:text-slate-300'
                  }`}
                  title={`${stars} звезд`}
                >
                  {Array.from({ length: stars }, (_, i) => (
                    <Star key={i} className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />
                  ))}
                </button>
              ))}
            </div>
          </div>

          {/* Кнопки действий */}
          <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-400 hover:bg-slate-800 hover:text-white transition-colors cursor-pointer"
            >
              Отмена
            </button>
            <button
              type="submit"
              className="flex items-center gap-2 px-5 py-2 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-slate-950 font-bold text-xs shadow-lg shadow-emerald-500/25 transition-all cursor-pointer transform active:scale-95"
            >
              <PlusCircle className="h-4 w-4" />
              <span>Добавить идею в банк решений</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

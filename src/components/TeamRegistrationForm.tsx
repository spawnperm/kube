import React, { useState } from 'react';
import {
  Rocket,
  Satellite,
  Plus,
  Trash2,
  AlertCircle,
  CheckCircle2,
  Crown,
  School,
  MapPin,
  Sparkles,
  Compass,
  Radio,
  Camera,
  Zap,
  Info,
  Box,
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { CubeSatAssemblyBlueprintModal } from './CubeSatAssemblyBlueprintModal';
import { Team, TeamMember } from '../types';
import blueprint1U from '@/src/assets/images/cubesat_1u_blueprint_1791436560253.jpg';
import blueprint2U from '@/src/assets/images/cubesat_2u_blueprint_1791436574557.jpg';
import blueprint3U from '@/src/assets/images/cubesat_3u_blueprint_1791436585233.jpg';
import {
  CHAMPIONSHIP_TRACKS,
  validateTeamRegistration,
  buildTeamFromFormData,
  TeamRegistrationFormData,
  RegistrationValidationResult,
} from '../domain/teamRegistration';
import { createId } from '../utils/id';

interface TeamRegistrationFormProps {
  onRegisterTeam: (newTeam: Team) => void;
  onCancel?: () => void;
  isModal?: boolean;
}

const DEFAULT_MEMBERS: TeamMember[] = [
  {
    id: 'm1',
    name: 'Иван Сергеев',
    role: 'Капитан',
    grade: '11 класс',
    email: 'sergeev.ivan@school.edu',
  },
  {
    id: 'm2',
    name: 'Анна Морозова',
    role: 'Баллистик',
    grade: '10 класс',
    email: 'morozova.anna@school.edu',
  },
  {
    id: 'm3',
    name: 'Максим Белов',
    role: 'Инженер-конструктор',
    grade: '11 класс',
    email: 'belov.max@school.edu',
  },
];

export const TeamRegistrationForm: React.FC<TeamRegistrationFormProps> = ({
  onRegisterTeam,
  onCancel,
  isModal = false,
}) => {
  const [formData, setFormData] = useState<TeamRegistrationFormData>({
    teamName: '',
    trackId: 'track_ballistics',
    school: '',
    city: '',
    league: 'Старшая лига (10-11 классы)',
    mentorName: '',
    mentorTitle: '',
    format: '3U',
    orbitAltitudeKm: 520,
    radioFreqMhz: 437.425,
    payloadType: 'Оптический фотометр верхней атмосферы Земли',
    members: DEFAULT_MEMBERS,
  });

  const [validation, setValidation] = useState<RegistrationValidationResult>({
    isValid: true,
    errors: {},
  });
  const [submitted, setSubmitted] = useState(false);
  const [successTeam, setSuccessTeam] = useState<Team | null>(null);
  const [isBlueprintModalOpen, setIsBlueprintModalOpen] = useState(false);

  const handleTextChange = (
    field: keyof Omit<
      TeamRegistrationFormData,
      'members' | 'format' | 'orbitAltitudeKm' | 'radioFreqMhz'
    >,
    value: string,
  ) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    // Clear error for field if exists
    if (validation.errors[field]) {
      setValidation((prev) => {
        const nextErrors = { ...prev.errors };
        delete nextErrors[field];
        return { ...prev, errors: nextErrors, isValid: Object.keys(nextErrors).length === 0 };
      });
    }
  };

  const handleTrackSelect = (trackId: string) => {
    setFormData((prev) => {
      let payload = prev.payloadType;
      if (trackId === 'track_ballistics') {
        payload = 'Баллистический модуль & расчет схода с орбиты';
      } else if (trackId === 'track_payload_remote_sensing') {
        payload = 'Оптический фотометр верхней атмосферы Земли';
      } else if (trackId === 'track_radio_telemetry') {
        payload = 'Антенно-фидерный модуль AX.25 437 МГц';
      } else if (trackId === 'track_adcs_orientation') {
        payload = '3-осевая система стабилизации с датчиками Солнца';
      } else if (trackId === 'track_power_systems') {
        payload = 'Система преобразования СБ GaAs & LiFePO4 20 Вт·ч';
      }
      return { ...prev, trackId, payloadType: payload };
    });

    if (validation.errors.trackId) {
      setValidation((prev) => {
        const nextErrors = { ...prev.errors };
        delete nextErrors.trackId;
        return { ...prev, errors: nextErrors, isValid: Object.keys(nextErrors).length === 0 };
      });
    }
  };

  const handleAddMember = () => {
    if (formData.members.length >= 6) return;
    const newMember: TeamMember = {
      id: createId('m'),
      name: '',
      role: 'Радиоинженер',
      grade: '10 класс',
      email: '',
    };
    setFormData((prev) => ({ ...prev, members: [...prev.members, newMember] }));
  };

  const handleRemoveMember = (idx: number) => {
    if (formData.members.length <= 1) return;
    setFormData((prev) => ({
      ...prev,
      members: prev.members.filter((_, i) => i !== idx),
    }));
  };

  const handleMemberChange = (idx: number, field: keyof TeamMember, value: string) => {
    setFormData((prev) => {
      const updated = [...prev.members];
      updated[idx] = { ...updated[idx], [field]: value };
      return { ...prev, members: updated };
    });

    if (validation.memberErrors?.[idx]?.[field] || validation.errors.members) {
      setValidation((prev) => {
        const nextMemberErrors = { ...prev.memberErrors };
        if (nextMemberErrors[idx]) {
          delete nextMemberErrors[idx][field];
          if (Object.keys(nextMemberErrors[idx]).length === 0) {
            delete nextMemberErrors[idx];
          }
        }
        return {
          ...prev,
          memberErrors: Object.keys(nextMemberErrors).length > 0 ? nextMemberErrors : undefined,
          errors: {
            ...prev.errors,
            ...(Object.keys(nextMemberErrors).length === 0 ? { members: '' } : {}),
          },
        };
      });
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const result = validateTeamRegistration(formData);
    setValidation(result);

    if (!result.isValid) {
      // Focus on first error if any
      const firstErrorKey = Object.keys(result.errors)[0];
      const element = document.getElementById(`field-${firstErrorKey}`);
      if (element) {
        element.scrollIntoView({ behavior: 'smooth', block: 'center' });
        element.focus();
      }
      return;
    }

    const newTeam = buildTeamFromFormData(formData);
    setSuccessTeam(newTeam);
    setSubmitted(true);

    try {
      confetti({
        particleCount: 80,
        spread: 70,
        origin: { y: 0.6 },
        colors: ['#38bdf8', '#818cf8', '#c084fc', '#34d399'],
      });
    } catch {
      // Ignore if confetti fails in headless env
    }

    onRegisterTeam(newTeam);
  };

  const getTrackIcon = (id: string) => {
    switch (id) {
      case 'track_ballistics':
        return <Compass className="h-5 w-5 text-cyan-400" />;
      case 'track_payload_remote_sensing':
        return <Camera className="h-5 w-5 text-purple-400" />;
      case 'track_radio_telemetry':
        return <Radio className="h-5 w-5 text-emerald-400" />;
      case 'track_adcs_orientation':
        return <Satellite className="h-5 w-5 text-amber-400" />;
      case 'track_power_systems':
        return <Zap className="h-5 w-5 text-rose-400" />;
      default:
        return <Rocket className="h-5 w-5 text-cyan-400" />;
    }
  };

  if (submitted && successTeam) {
    return (
      <div className="rounded-2xl border border-cyan-500/40 bg-gradient-to-b from-slate-900/90 to-slate-950/90 p-8 text-center backdrop-blur-xl shadow-2xl shadow-cyan-950/50">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-tr from-cyan-500 to-indigo-600 text-white shadow-lg shadow-cyan-500/30">
          <CheckCircle2 className="h-10 w-10 text-emerald-300" />
        </div>

        <div className="mt-4 inline-flex items-center gap-2 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-3 py-1 text-xs font-semibold text-emerald-300">
          <Sparkles className="h-3.5 w-3.5" />
          <span>Заявка успешно зарегистрирована в ЦУП</span>
        </div>

        <h3 className="mt-3 text-2xl font-black tracking-wide text-white">
          Команда «{successTeam.name}» готова к полету!
        </h3>

        <p className="mx-auto mt-2 max-w-lg text-sm text-slate-300">
          Данные внесены в бортовой реестр кейс-чемпионата. Назначен трек{' '}
          <strong className="text-cyan-300">«{successTeam.trackTitle}»</strong>, формат аппарата{' '}
          <strong className="text-cyan-300">CubeSat {successTeam.cubesatSpecs.format}</strong>.
        </p>

        <div className="mx-auto mt-6 max-w-md rounded-xl border border-slate-800 bg-slate-950/80 p-4 text-left text-xs space-y-2">
          <div className="flex justify-between border-b border-slate-800/80 pb-2">
            <span className="text-slate-400">Школа / Организация:</span>
            <span className="font-medium text-slate-200">{successTeam.school}</span>
          </div>
          <div className="flex justify-between border-b border-slate-800/80 pb-2">
            <span className="text-slate-400">Город:</span>
            <span className="font-medium text-slate-200">{successTeam.city}</span>
          </div>
          <div className="flex justify-between border-b border-slate-800/80 pb-2">
            <span className="text-slate-400">Лига:</span>
            <span className="font-medium text-slate-200">{successTeam.league}</span>
          </div>
          <div className="flex justify-between border-b border-slate-800/80 pb-2">
            <span className="text-slate-400">Экипаж:</span>
            <span className="font-medium text-slate-200">
              {successTeam.members.length} уч. (Капитан:{' '}
              {successTeam.members.find((m) => m.role === 'Капитан')?.name || 'Не назначен'})
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-400">Куратор:</span>
            <span className="font-medium text-slate-200">{successTeam.mentorName}</span>
          </div>
        </div>

        <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
          {onCancel && (
            <button
              type="button"
              onClick={onCancel}
              className="rounded-xl border border-slate-700 bg-slate-800 px-5 py-2.5 text-xs font-semibold text-slate-200 hover:bg-slate-700 hover:text-white transition-colors"
            >
              Закрыть
            </button>
          )}
          <button
            type="button"
            onClick={() => {
              setSubmitted(false);
              setSuccessTeam(null);
            }}
            className="rounded-xl border border-cyan-500/40 bg-cyan-500/20 px-5 py-2.5 text-xs font-semibold text-cyan-300 hover:bg-cyan-500/30 transition-colors"
          >
            Зарегистрировать еще одну команду
          </button>
        </div>
      </div>
    );
  }

  return (
    <form
      onSubmit={handleSubmit}
      noValidate
      className={`relative space-y-6 ${
        isModal
          ? ''
          : 'rounded-2xl border border-cyan-900/40 bg-slate-900/80 p-6 md:p-8 backdrop-blur-xl shadow-2xl'
      }`}
    >
      {/* Intro Header */}
      <div>
        <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-cyan-400">
          <Rocket className="h-4 w-4" />
          <span>Официальная регистрация участников</span>
        </div>
        <h2 className="mt-1 text-xl sm:text-2xl font-black text-white tracking-tight">
          Форма регистрации команды кейс-чемпионата
        </h2>
        <p className="mt-1 text-xs sm:text-sm text-slate-400 leading-relaxed">
          Заполните данные экипажа, выберите трек научно-инженерного исследования и параметры
          наноспутника CubeSat для допуска к орбитальному этапу.
        </p>
      </div>

      {/* Global Validation Warning if errors exist */}
      {!validation.isValid && Object.keys(validation.errors).length > 0 && (
        <div className="flex items-start gap-3 rounded-xl border border-rose-500/40 bg-rose-950/30 p-3.5 text-xs text-rose-200">
          <AlertCircle className="h-5 w-5 text-rose-400 shrink-0 mt-0.5" />
          <div>
            <div className="font-bold text-rose-300">Пожалуйста, исправьте ошибки в форме:</div>
            <ul className="mt-1 list-disc list-inside space-y-0.5 text-rose-300/90">
              {Object.values(validation.errors)
                .filter(Boolean)
                .map((msg, i) => (
                  <li key={i}>{msg}</li>
                ))}
            </ul>
          </div>
        </div>
      )}

      {/* SECTION 1: Основная информация о команде */}
      <div className="rounded-xl border border-slate-800 bg-slate-950/60 p-4 sm:p-5 space-y-4">
        <div className="flex items-center justify-between border-b border-slate-800/80 pb-2">
          <div className="flex items-center gap-2">
            <span className="flex h-6 w-6 items-center justify-center rounded-md bg-cyan-500/20 text-xs font-bold text-cyan-300">
              1
            </span>
            <h3 className="text-sm font-bold text-white">Основная информация о команде</h3>
          </div>
          <span className="text-[11px] text-slate-500">* обязательные поля</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Название команды */}
          <div>
            <label
              htmlFor="field-teamName"
              className="block text-xs font-semibold text-slate-300 mb-1"
            >
              Название команды <span className="text-rose-400">*</span>
            </label>
            <div className="relative">
              <input
                id="field-teamName"
                type="text"
                value={formData.teamName}
                onChange={(e) => handleTextChange('teamName', e.target.value)}
                placeholder="например, «Гелиос-1», «Орион», «Зенит-Лицей»"
                className={`w-full rounded-lg border bg-slate-900 px-3.5 py-2 text-xs text-white placeholder-slate-500 transition-all focus:outline-none ${
                  validation.errors.teamName
                    ? 'border-rose-500 focus:border-rose-400 focus:ring-1 focus:ring-rose-500'
                    : 'border-slate-800 focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500/30'
                }`}
              />
            </div>
            {validation.errors.teamName ? (
              <p className="mt-1 flex items-center gap-1 text-[11px] text-rose-400">
                <AlertCircle className="h-3 w-3 shrink-0" />
                <span>{validation.errors.teamName}</span>
              </p>
            ) : (
              <p className="mt-1 text-[10px] text-slate-500">
                Уникальный позывной команды для телеметрии и судейских протоколов (от 3 до 50
                символов)
              </p>
            )}
          </div>

          {/* Город */}
          <div>
            <label htmlFor="field-city" className="block text-xs font-semibold text-slate-300 mb-1">
              Город / Населенный пункт <span className="text-rose-400">*</span>
            </label>
            <div className="relative">
              <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-slate-500">
                <MapPin className="h-3.5 w-3.5" />
              </div>
              <input
                id="field-city"
                type="text"
                value={formData.city}
                onChange={(e) => handleTextChange('city', e.target.value)}
                placeholder="Пермь, Москва, Самара, Новосибирск"
                className={`w-full rounded-lg border bg-slate-900 pl-8 pr-3.5 py-2 text-xs text-white placeholder-slate-500 transition-all focus:outline-none ${
                  validation.errors.city
                    ? 'border-rose-500 focus:border-rose-400 focus:ring-1 focus:ring-rose-500'
                    : 'border-slate-800 focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500/30'
                }`}
              />
            </div>
            {validation.errors.city && (
              <p className="mt-1 flex items-center gap-1 text-[11px] text-rose-400">
                <AlertCircle className="h-3 w-3 shrink-0" />
                <span>{validation.errors.city}</span>
              </p>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Образовательное учреждение */}
          <div>
            <label
              htmlFor="field-school"
              className="block text-xs font-semibold text-slate-300 mb-1"
            >
              Учебное заведение / Школа / Кванториум <span className="text-rose-400">*</span>
            </label>
            <div className="relative">
              <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-slate-500">
                <School className="h-3.5 w-3.5" />
              </div>
              <input
                id="field-school"
                type="text"
                value={formData.school}
                onChange={(e) => handleTextChange('school', e.target.value)}
                placeholder="МАОУ «Лицей №1», Гимназия №2, ЦДТТ"
                className={`w-full rounded-lg border bg-slate-900 pl-8 pr-3.5 py-2 text-xs text-white placeholder-slate-500 transition-all focus:outline-none ${
                  validation.errors.school
                    ? 'border-rose-500 focus:border-rose-400 focus:ring-1 focus:ring-rose-500'
                    : 'border-slate-800 focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500/30'
                }`}
              />
            </div>
            {validation.errors.school && (
              <p className="mt-1 flex items-center gap-1 text-[11px] text-rose-400">
                <AlertCircle className="h-3 w-3 shrink-0" />
                <span>{validation.errors.school}</span>
              </p>
            )}
          </div>

          {/* Возрастная лига */}
          <div>
            <label
              htmlFor="field-league"
              className="block text-xs font-semibold text-slate-300 mb-1"
            >
              Возрастная лига <span className="text-rose-400">*</span>
            </label>
            <select
              id="field-league"
              value={formData.league}
              onChange={(e) =>
                setFormData((prev) => ({
                  ...prev,
                  league: e.target.value as Team['league'],
                }))
              }
              className="w-full rounded-lg border border-slate-800 bg-slate-900 px-3.5 py-2 text-xs text-white focus:border-cyan-500 focus:outline-none"
            >
              <option value="Старшая лига (10-11 классы)">Старшая лига (10-11 классы)</option>
              <option value="Юниорская лига (8-9 классы)">Юниорская лига (8-9 классы)</option>
            </select>
            <p className="mt-1 text-[10px] text-slate-500">
              Определяет сложность критериев оценки жюри и допуск к полезной нагрузке
            </p>
          </div>
        </div>
      </div>

      {/* SECTION 2: Выбор трека кейс-чемпионата */}
      <div
        id="field-trackId"
        className={`rounded-xl border bg-slate-950/60 p-4 sm:p-5 space-y-4 ${
          validation.errors.trackId ? 'border-rose-500/70' : 'border-slate-800'
        }`}
      >
        <div className="flex items-center justify-between border-b border-slate-800/80 pb-2">
          <div className="flex items-center gap-2">
            <span className="flex h-6 w-6 items-center justify-center rounded-md bg-indigo-500/20 text-xs font-bold text-indigo-300">
              2
            </span>
            <div>
              <h3 className="text-sm font-bold text-white">
                Выбор трека кейс-чемпионата <span className="text-rose-400">*</span>
              </h3>
              <p className="text-[11px] text-slate-400">
                Выберите научно-инженерное направление для проектирования CubeSat
              </p>
            </div>
          </div>
        </div>

        {validation.errors.trackId && (
          <p className="flex items-center gap-1.5 rounded-lg bg-rose-500/10 p-2 text-xs text-rose-300 border border-rose-500/30">
            <AlertCircle className="h-4 w-4 shrink-0 text-rose-400" />
            <span>{validation.errors.trackId}</span>
          </p>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {CHAMPIONSHIP_TRACKS.map((track) => {
            const isSelected = formData.trackId === track.id;
            return (
              <div
                key={track.id}
                role="button"
                tabIndex={0}
                onClick={() => handleTrackSelect(track.id)}
                onKeyDown={(e) => {
                  if (e.key === ' ' || e.key === 'Enter') {
                    e.preventDefault();
                    handleTrackSelect(track.id);
                  }
                }}
                className={`relative flex flex-col justify-between rounded-xl p-4 cursor-pointer border text-left transition-all ${
                  isSelected
                    ? 'border-cyan-400/80 bg-gradient-to-b from-cyan-950/40 to-slate-900 shadow-lg shadow-cyan-500/10 ring-1 ring-cyan-400/50'
                    : 'border-slate-800 bg-slate-900/60 hover:border-slate-700 hover:bg-slate-900'
                }`}
              >
                <div>
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-slate-800 border border-slate-700">
                        {getTrackIcon(track.id)}
                      </div>
                      <span className="text-lg">{track.icon}</span>
                    </div>
                    {isSelected ? (
                      <span className="flex items-center gap-1 rounded-full bg-cyan-400/20 px-2 py-0.5 text-[10px] font-bold text-cyan-300 border border-cyan-400/40">
                        <CheckCircle2 className="h-3 w-3" />
                        Выбран
                      </span>
                    ) : (
                      <span className="rounded-full bg-slate-800 px-2 py-0.5 text-[10px] text-slate-400">
                        {track.category.split(' ')[0]}
                      </span>
                    )}
                  </div>

                  <h4 className="mt-3 text-xs font-bold text-white line-clamp-2">{track.title}</h4>
                  <p className="mt-1 text-[11px] text-slate-400 leading-relaxed line-clamp-3">
                    {track.description}
                  </p>
                </div>

                <div className="mt-3 pt-2.5 border-t border-slate-800/80 text-[10px] text-cyan-400/90 font-mono">
                  {track.recommendedSpecs}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* SECTION 3: Список участников */}
      <div
        id="field-members"
        className={`rounded-xl border bg-slate-950/60 p-4 sm:p-5 space-y-4 ${
          validation.errors.members ? 'border-rose-500/70' : 'border-slate-800'
        }`}
      >
        <div className="flex items-center justify-between border-b border-slate-800/80 pb-2">
          <div className="flex items-center gap-2">
            <span className="flex h-6 w-6 items-center justify-center rounded-md bg-purple-500/20 text-xs font-bold text-purple-300">
              3
            </span>
            <div>
              <h3 className="text-sm font-bold text-white">
                Состав команды (экипаж) <span className="text-rose-400">*</span>
              </h3>
              <p className="text-[11px] text-slate-400">
                От 1 до 6 школьников. Один из участников обязательно назначается Капитаном.
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={handleAddMember}
            disabled={formData.members.length >= 6}
            className="flex items-center gap-1.5 rounded-lg bg-cyan-500/20 px-3 py-1.5 text-xs font-semibold text-cyan-300 hover:bg-cyan-500/30 border border-cyan-500/40 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
          >
            <Plus className="h-3.5 w-3.5" />
            <span>Добавить участника</span>
          </button>
        </div>

        {validation.errors.members && (
          <p className="flex items-center gap-1.5 rounded-lg bg-rose-500/10 p-2 text-xs text-rose-300 border border-rose-500/30">
            <AlertCircle className="h-4 w-4 shrink-0 text-rose-400" />
            <span>{validation.errors.members}</span>
          </p>
        )}

        <div className="space-y-3">
          {formData.members.map((member, idx) => {
            const hasError = validation.memberErrors?.[idx];
            const isCaptain = member.role === 'Капитан';

            return (
              <div
                key={member.id}
                className={`rounded-xl border p-3.5 transition-all ${
                  isCaptain
                    ? 'border-amber-500/40 bg-amber-950/10'
                    : 'border-slate-800 bg-slate-900/60'
                }`}
              >
                <div className="flex flex-wrap items-center justify-between gap-2 pb-2 mb-2 border-b border-slate-800/60">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-slate-400">Участник #{idx + 1}</span>
                    {isCaptain && (
                      <span className="flex items-center gap-1 rounded-md bg-amber-500/20 px-2 py-0.5 text-[10px] font-bold text-amber-300 border border-amber-500/40">
                        <Crown className="h-3 w-3" />
                        Капитан команды
                      </span>
                    )}
                  </div>
                  <button
                    type="button"
                    onClick={() => handleRemoveMember(idx)}
                    disabled={formData.members.length <= 1}
                    className="flex items-center gap-1 text-[11px] text-slate-500 hover:text-rose-400 disabled:opacity-20 disabled:hover:text-slate-500 transition-colors"
                  >
                    <Trash2 className="h-3 w-3" />
                    <span>Удалить</span>
                  </button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 text-xs">
                  {/* ФИО */}
                  <div className="sm:col-span-5">
                    <label
                      htmlFor={`member-${idx}-name`}
                      className="block text-[11px] font-medium text-slate-300 mb-1"
                    >
                      ФИО школьника <span className="text-rose-400">*</span>
                    </label>
                    <input
                      id={`member-${idx}-name`}
                      type="text"
                      placeholder="Иванов Алексей Дмитриевич"
                      value={member.name}
                      onChange={(e) => handleMemberChange(idx, 'name', e.target.value)}
                      className={`w-full rounded-lg border bg-slate-950 px-3 py-1.5 text-xs text-white placeholder-slate-600 transition-all focus:outline-none ${
                        hasError?.name
                          ? 'border-rose-500 focus:border-rose-400 focus:ring-1 focus:ring-rose-500'
                          : 'border-slate-800 focus:border-cyan-500'
                      }`}
                    />
                    {hasError?.name && (
                      <p className="mt-1 text-[10px] text-rose-400">{hasError.name}</p>
                    )}
                  </div>

                  {/* Роль */}
                  <div className="sm:col-span-3">
                    <label
                      htmlFor={`member-${idx}-role`}
                      className="block text-[11px] font-medium text-slate-300 mb-1"
                    >
                      Роль в проекте
                    </label>
                    <select
                      id={`member-${idx}-role`}
                      value={member.role}
                      onChange={(e) => handleMemberChange(idx, 'role', e.target.value)}
                      className="w-full rounded-lg border border-slate-800 bg-slate-950 px-2.5 py-1.5 text-xs text-white focus:border-cyan-500 focus:outline-none"
                    >
                      <option value="Капитан">Капитан</option>
                      <option value="Баллистик">Баллистик</option>
                      <option value="Инженер-конструктор">Инженер-конструктор</option>
                      <option value="Радиоинженер">Радиоинженер</option>
                      <option value="Разработчик ПН">Разработчик ПН</option>
                      <option value="Программист бортового ПО">Программист бортового ПО</option>
                      <option value="Исследователь">Исследователь</option>
                    </select>
                  </div>

                  {/* Класс */}
                  <div className="sm:col-span-2">
                    <label
                      htmlFor={`member-${idx}-grade`}
                      className="block text-[11px] font-medium text-slate-300 mb-1"
                    >
                      Класс
                    </label>
                    <select
                      id={`member-${idx}-grade`}
                      value={member.grade}
                      onChange={(e) => handleMemberChange(idx, 'grade', e.target.value)}
                      className="w-full rounded-lg border border-slate-800 bg-slate-950 px-2 py-1.5 text-xs text-white focus:border-cyan-500 focus:outline-none"
                    >
                      <option value="8 класс">8 класс</option>
                      <option value="9 класс">9 класс</option>
                      <option value="10 класс">10 класс</option>
                      <option value="11 класс">11 класс</option>
                    </select>
                  </div>

                  {/* Email */}
                  <div className="sm:col-span-2">
                    <label
                      htmlFor={`member-${idx}-email`}
                      className="block text-[11px] font-medium text-slate-300 mb-1"
                    >
                      Email (контакт)
                    </label>
                    <input
                      id={`member-${idx}-email`}
                      type="email"
                      placeholder="alex@mail.ru"
                      value={member.email || ''}
                      onChange={(e) => handleMemberChange(idx, 'email', e.target.value)}
                      className={`w-full rounded-lg border bg-slate-950 px-2.5 py-1.5 text-xs text-white placeholder-slate-600 transition-all focus:outline-none ${
                        hasError?.email
                          ? 'border-rose-500'
                          : 'border-slate-800 focus:border-cyan-500'
                      }`}
                    />
                    {hasError?.email && (
                      <p className="mt-1 text-[10px] text-rose-400">{hasError.email}</p>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* SECTION 4: Наставник и технический концепт CubeSat */}
      <div className="rounded-xl border border-slate-800 bg-slate-950/60 p-4 sm:p-5 space-y-4">
        <div className="flex items-center justify-between border-b border-slate-800/80 pb-2">
          <div className="flex items-center gap-2">
            <span className="flex h-6 w-6 items-center justify-center rounded-md bg-emerald-500/20 text-xs font-bold text-emerald-300">
              4
            </span>
            <div>
              <h3 className="text-sm font-bold text-white">Куратор и параметры CubeSat</h3>
              <p className="text-[11px] text-slate-400">
                Информация о научном руководителе и предварительные характеристики спутника
              </p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label
              htmlFor="field-mentorName"
              className="block text-xs font-medium text-slate-300 mb-1"
            >
              ФИО Наставника / Ментора
            </label>
            <input
              id="field-mentorName"
              type="text"
              value={formData.mentorName}
              onChange={(e) => handleTextChange('mentorName', e.target.value)}
              placeholder="Ковалев Сергей Николаевич"
              className="w-full rounded-lg border border-slate-800 bg-slate-900 px-3.5 py-2 text-xs text-white placeholder-slate-500 focus:border-cyan-500 focus:outline-none"
            />
          </div>
          <div>
            <label
              htmlFor="field-mentorTitle"
              className="block text-xs font-medium text-slate-300 mb-1"
            >
              Должность и организация наставника
            </label>
            <input
              id="field-mentorTitle"
              type="text"
              value={formData.mentorTitle}
              onChange={(e) => handleTextChange('mentorTitle', e.target.value)}
              placeholder="Учитель физики и астрономии, педагог ЦДТТ"
              className="w-full rounded-lg border border-slate-800 bg-slate-900 px-3.5 py-2 text-xs text-white placeholder-slate-500 focus:border-cyan-500 focus:outline-none"
            />
          </div>
        </div>

        {/* CubeSat Format & Radio */}
        <div className="rounded-xl border border-cyan-900/30 bg-cyan-950/10 p-3.5 space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-2 text-xs font-semibold text-cyan-300">
              <Satellite className="h-4 w-4 text-cyan-400" />
              <span>Конфигурация аппарата</span>
            </div>
            <button
              type="button"
              onClick={() => setIsBlueprintModalOpen(true)}
              className="flex items-center gap-1.5 rounded-lg bg-gradient-to-r from-cyan-500/20 to-purple-500/20 px-2.5 py-1 text-xs font-semibold text-cyan-300 hover:from-cyan-500/30 hover:to-purple-500/30 border border-cyan-400/40 transition-all cursor-pointer shadow-sm"
              title="Открыть сборочный чертеж и 3D-схему компоновки"
            >
              <Sparkles className="h-3.5 w-3.5 text-amber-300" />
              <span>3D-схема сборки (ИИ-подсказка)</span>
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <span className="block text-[11px] font-medium text-slate-400 mb-1">
                Форм-фактор CubeSat
              </span>
              <div className="grid grid-cols-3 gap-1.5">
                <button
                  type="button"
                  onClick={() => setFormData((prev) => ({ ...prev, format: '1U' }))}
                  className={`rounded-lg py-1.5 text-[11px] font-bold transition-all border cursor-pointer ${
                    formData.format === '1U'
                      ? 'border-cyan-400 bg-cyan-500/20 text-cyan-300 shadow-sm'
                      : 'border-slate-800 bg-slate-900 text-slate-400 hover:text-white'
                  }`}
                >
                  1U (1.3 кг)
                </button>
                <button
                  type="button"
                  onClick={() => setFormData((prev) => ({ ...prev, format: '2U' }))}
                  className={`rounded-lg py-1.5 text-[11px] font-bold transition-all border cursor-pointer ${
                    formData.format === '2U'
                      ? 'border-cyan-400 bg-cyan-500/20 text-cyan-300 shadow-sm'
                      : 'border-slate-800 bg-slate-900 text-slate-400 hover:text-white'
                  }`}
                >
                  2U (2.5 кг)
                </button>
                <button
                  type="button"
                  onClick={() => setFormData((prev) => ({ ...prev, format: '3U' }))}
                  className={`rounded-lg py-1.5 text-[11px] font-bold transition-all border cursor-pointer ${
                    formData.format === '3U'
                      ? 'border-cyan-400 bg-cyan-500/20 text-cyan-300 shadow-sm'
                      : 'border-slate-800 bg-slate-900 text-slate-400 hover:text-white'
                  }`}
                >
                  3U (3.5 кг)
                </button>
              </div>
            </div>

            <div>
              <label
                htmlFor="field-orbitAltitudeKm"
                className="block text-[11px] font-medium text-slate-400 mb-1"
              >
                Высота орбиты (км)
              </label>
              <input
                id="field-orbitAltitudeKm"
                type="number"
                value={formData.orbitAltitudeKm}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, orbitAltitudeKm: +e.target.value }))
                }
                className="w-full rounded-lg border border-slate-800 bg-slate-900 px-3 py-1.5 text-xs text-white focus:border-cyan-500 focus:outline-none"
              />
            </div>

            <div>
              <label
                htmlFor="field-radioFreqMhz"
                className="block text-[11px] font-medium text-slate-400 mb-1"
              >
                Частота радиоканала (МГц)
              </label>
              <input
                id="field-radioFreqMhz"
                type="number"
                step="0.025"
                value={formData.radioFreqMhz}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, radioFreqMhz: +e.target.value }))
                }
                className="w-full rounded-lg border border-slate-800 bg-slate-900 px-3 py-1.5 text-xs text-white focus:border-cyan-500 focus:outline-none"
              />
            </div>
          </div>

          <div>
            <label
              htmlFor="field-payloadType"
              className="block text-[11px] font-medium text-slate-400 mb-1"
            >
              Описание планируемой полезной нагрузки
            </label>
            <input
              id="field-payloadType"
              type="text"
              value={formData.payloadType}
              onChange={(e) => handleTextChange('payloadType', e.target.value)}
              placeholder="Фотометр / Гамма-спектрометр / Камера ДЗЗ"
              className="w-full rounded-lg border border-slate-800 bg-slate-900 px-3 py-1.5 text-xs text-white focus:border-cyan-500 focus:outline-none"
            />
          </div>

          {/* AI Image Generation Blueprint Preview Card */}
          <div className="rounded-xl border border-cyan-800/40 bg-slate-950/80 p-3.5 space-y-2.5">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-amber-400" />
                <span className="text-xs font-bold text-white">
                  Визуализация сборочного чертежа (Image Generation)
                </span>
                <span className="rounded bg-cyan-500/20 px-2 py-0.5 text-[10px] font-mono text-cyan-300 border border-cyan-500/30">
                  CubeSat {formData.format}
                </span>
              </div>

              <div className="flex items-center gap-2">
                {/* Format switcher inside card */}
                <div className="flex items-center rounded-lg bg-slate-900 p-0.5 border border-slate-800 text-[11px] font-mono">
                  {(['1U', '2U', '3U'] as const).map((fmt) => (
                    <button
                      key={fmt}
                      type="button"
                      onClick={() => setFormData((prev) => ({ ...prev, format: fmt }))}
                      className={`px-2 py-0.5 rounded transition-all cursor-pointer font-bold ${
                        formData.format === fmt
                          ? 'bg-cyan-500 text-slate-950'
                          : 'text-slate-400 hover:text-white'
                      }`}
                    >
                      {fmt}
                    </button>
                  ))}
                </div>

                <button
                  type="button"
                  onClick={() => setIsBlueprintModalOpen(true)}
                  className="flex items-center gap-1.5 rounded-lg bg-cyan-600/90 hover:bg-cyan-500 px-2.5 py-1 text-xs font-semibold text-white transition-all cursor-pointer shadow-xs"
                >
                  <Box className="h-3.5 w-3.5" />
                  <span>3D-схема сборки (React Three Fiber)</span>
                </button>
              </div>
            </div>

            <div
              role="button"
              tabIndex={0}
              onClick={() => setIsBlueprintModalOpen(true)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  setIsBlueprintModalOpen(true);
                }
              }}
              className="relative group rounded-lg overflow-hidden border border-slate-800 bg-slate-900 cursor-pointer"
            >
              <img
                src={
                  formData.format === '1U'
                    ? blueprint1U
                    : formData.format === '2U'
                      ? blueprint2U
                      : blueprint3U
                }
                alt={`Сборочный чертеж CubeSat ${formData.format}`}
                referrerPolicy="no-referrer"
                className="w-full h-44 sm:h-52 object-cover group-hover:scale-105 transition-transform duration-300"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-slate-950/95 via-transparent to-transparent flex items-end p-3 justify-between">
                <div className="text-[11px] font-mono text-cyan-200">
                  <span className="block font-bold">
                    CAD Exploded View: Сборочный чертеж {formData.format}
                  </span>
                  <span className="text-[10px] text-slate-400">
                    Габариты:{' '}
                    {formData.format === '1U'
                      ? '100×100×100 мм • 1.3 кг'
                      : formData.format === '2U'
                        ? '100×100×200 мм • 2.5 кг'
                        : '100×100×340 мм • 3.5 кг'}
                  </span>
                </div>
                <span className="text-[11px] text-cyan-400 font-semibold flex items-center gap-1 group-hover:underline">
                  <span>Открыть 3D взрыв-схему (R3F)</span>
                  <Sparkles className="h-3 w-3" />
                </span>
              </div>
            </div>

            {/* AI Image Generation Engineering Metadata */}
            <div className="flex flex-wrap items-center justify-between gap-2 text-[10px] font-mono text-slate-400 bg-slate-900/60 p-2 rounded-lg border border-slate-800">
              <span className="flex items-center gap-1 text-slate-300">
                <Sparkles className="h-3 w-3 text-amber-400 shrink-0" />
                <span>
                  Генерация чертежа:{' '}
                  <strong>Prompt-инжиниринг CubeSat {formData.format} CDS</strong>
                </span>
              </span>
              <span className="text-cyan-400">
                {formData.format === '1U'
                  ? '1-юнитовый моноблок'
                  : formData.format === '2U'
                    ? '2-юнитовый дуплекс'
                    : '3-юнитовый триплекс'}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* FOOTER ACTIONS */}
      <div className="flex flex-wrap items-center justify-between gap-4 pt-4 border-t border-slate-800">
        <div className="flex items-center gap-2 text-[11px] text-slate-400">
          <Info className="h-3.5 w-3.5 text-cyan-400" />
          <span>После регистрации команда получит доступ ко всем этапам и телеметрии</span>
        </div>

        <div className="flex items-center gap-3">
          {onCancel && (
            <button
              type="button"
              onClick={onCancel}
              className="rounded-xl border border-slate-800 px-4 py-2 text-xs font-semibold text-slate-400 hover:bg-slate-800 hover:text-white transition-colors"
            >
              Отмена
            </button>
          )}

          <button
            type="submit"
            className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-cyan-500 to-indigo-600 px-6 py-2.5 text-xs font-bold text-slate-950 hover:from-cyan-400 hover:to-indigo-500 shadow-lg shadow-cyan-500/25 transition-all transform active:scale-95"
          >
            <Rocket className="h-4 w-4" />
            <span>Зарегистрировать команду</span>
          </button>
        </div>
      </div>

      {/* 3D Assembly Blueprint Modal */}
      <CubeSatAssemblyBlueprintModal
        isOpen={isBlueprintModalOpen}
        onClose={() => setIsBlueprintModalOpen(false)}
        specs={{
          format: formData.format,
          payloadType: formData.payloadType,
          orbitAltitudeKm: formData.orbitAltitudeKm,
          radioFreqMhz: formData.radioFreqMhz,
          massKg: formData.format === '3U' ? 3.4 : formData.format === '2U' ? 2.3 : 1.2,
          powerBudgetWatts: formData.format === '3U' ? 18.5 : formData.format === '2U' ? 12.0 : 6.5,
        }}
        teamName={formData.teamName || 'Новый экипаж'}
      />
    </form>
  );
};

import React, { useState, useEffect } from 'react';
import {
  X,
  Save,
  Plus,
  Trash2,
  BookOpen,
  Users,
  School,
  UserCheck,
  Rocket,
  Shield,
  Phone,
  Mail,
  CheckCircle2,
  Lock,
  ShieldCheck,
} from 'lucide-react';
import { CrmTeamRecord, CrmStudent } from '@/src/contexts/crew/data/crmTeamsData';
import { UserProfile } from '@/src/shared/types';
import { canEditTeamCard } from '@/src/contexts/crew/services/rolePermissionService';
import { audioService } from '@/src/shared/lib/audioService';

interface TeamEditModalProps {
  isOpen: boolean;
  onClose: () => void;
  team: CrmTeamRecord | null;
  currentUser?: UserProfile;
  isNew?: boolean;
  nextOrderNumber?: number;
  onSave: (team: CrmTeamRecord) => void;
  onOpenTaskDirectory: (team: CrmTeamRecord) => void;
}

export const TeamEditModal: React.FC<TeamEditModalProps> = ({
  isOpen,
  onClose,
  team,
  currentUser,
  isNew = false,
  nextOrderNumber = 17,
  onSave,
  onOpenTaskDirectory,
}) => {
  const [formData, setFormData] = useState<Partial<CrmTeamRecord>>({});
  const [students, setStudents] = useState<CrmStudent[]>([]);

  const isAuthorizedToEdit = canEditTeamCard(currentUser, team);

  useEffect(() => {
    if (team) {
      setFormData({ ...team });
      setStudents(team.students ? [...team.students] : []);
    } else if (isNew) {
      const paddedOrder = nextOrderNumber < 10 ? `0${nextOrderNumber}` : `${nextOrderNumber}`;
      setFormData({
        id: `team-${Date.now()}`,
        orderNumber: nextOrderNumber,
        shipCallsign: `Борт-${paddedOrder}`,
        shipName: `Звезда-${nextOrderNumber}`,
        cubesatName: `CubeSat-${nextOrderNumber}`,
        cubesatFormat: '3U',
        school: 'МАОУ СОШ г. Перми',
        city: 'Пермь',
        mentorName: '',
        mentorEmail: '',
        mentorPhone: '+7 (900) 000-00-00',
        captainTitle: 'Капитан корабля (Преподаватель)',
        status: 'quota_allocated',
        waitlistPosition: nextOrderNumber,
        navigatorMascot: {
          name: 'Леший',
          role: 'navigator',
          roleTitle: 'Бортовой компьютер «Леший»',
          description: 'Бортовой компьютер корабля',
        },
      });
      setStudents([
        {
          raw: '',
          name: '',
          gradeText: '10 класс',
          gradeNumber: 10,
          assignedRole: 'physicist',
          roleTitle: 'Инженер-физик (Баллистика)',
          discipline: 'Физика',
        },
        {
          raw: '',
          name: '',
          gradeText: '10 класс',
          gradeNumber: 10,
          assignedRole: 'chemist',
          roleTitle: 'Инженер-химик (Жизнеобеспечение)',
          discipline: 'Химия',
        },
        {
          raw: '',
          name: '',
          gradeText: '10 класс',
          gradeNumber: 10,
          assignedRole: 'biologist',
          roleTitle: 'Инженер-биолог (Биореактор)',
          discipline: 'Биология',
        },
      ]);
    }
  }, [team, isNew, nextOrderNumber, isOpen]);

  if (!isOpen) return null;

  const handleStudentChange = (index: number, field: keyof CrmStudent, value: any) => {
    setStudents((prev) => {
      const copy = [...prev];
      copy[index] = { ...copy[index], [field]: value };
      return copy;
    });
  };

  const handleAddStudent = () => {
    audioService.playClickSound();
    setStudents((prev) => [
      ...prev,
      {
        raw: '',
        name: '',
        gradeText: '10 класс',
        gradeNumber: 10,
        assignedRole: 'physicist',
        roleTitle: 'Исследователь экипажа',
        discipline: 'Физика',
      },
    ]);
  };

  const handleRemoveStudent = (index: number) => {
    audioService.playClickSound();
    setStudents((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!isAuthorizedToEdit) {
      audioService.playTimerWarning();
      alert(
        'Редактирование карточки команды разрешено только пользователям с ролями: Администратор, Организатор или Капитан команды.',
      );
      return;
    }
    if (!formData.shipName || !formData.school) {
      alert('Пожалуйста, укажите название корабля и образовательное учреждение.');
      return;
    }

    const completedTeam: CrmTeamRecord = {
      ...(formData as CrmTeamRecord),
      students,
    };

    audioService.playSuccessChime();
    onSave(completedTeam);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-slate-950/80 backdrop-blur-md animate-fadeIn">
      <div
        className="w-full max-w-4xl max-h-[92vh] flex flex-col bg-slate-900 border border-amber-500/40 rounded-3xl shadow-2xl overflow-hidden relative"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="p-4 sm:p-6 border-b border-slate-800 bg-slate-950/90 flex items-center justify-between gap-4">
          <div className="space-y-1.5">
            <div className="flex items-center gap-2">
              <span className="p-1.5 rounded-lg bg-amber-500/20 text-amber-400">
                <Rocket className="w-4 h-4" />
              </span>
              <span className="text-xs font-mono font-bold uppercase tracking-wider text-amber-400">
                {isNew ? 'Новая команда' : 'Редактирование профиля борта'}
              </span>
            </div>
            <h2 className="text-lg sm:text-xl font-extrabold text-white">
              {isNew
                ? 'Добавление новой команды в CRM-реестр'
                : `Редактирование: ${formData.shipCallsign || 'Борт'} «${formData.shipName}»`}
            </h2>

            {/* Role Permissions Access Badge */}
            <div className="flex flex-wrap items-center gap-2 pt-1 text-xs">
              <span className="text-[11px] font-mono px-2 py-0.5 rounded-full bg-slate-800 text-slate-300 border border-slate-700">
                Доступ: Администратор • Организатор • Капитан команды
              </span>
              {isAuthorizedToEdit ? (
                <span className="text-[11px] font-mono px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 flex items-center gap-1 font-semibold">
                  <ShieldCheck className="w-3 h-3 text-emerald-400" />
                  Право подтверждено:{' '}
                  {currentUser?.role === 'admin'
                    ? 'Администратор'
                    : currentUser?.role === 'organizer'
                      ? 'Организатор'
                      : 'Капитан команды'}
                </span>
              ) : (
                <span className="text-[11px] font-mono px-2 py-0.5 rounded-full bg-rose-500/10 text-rose-400 border border-rose-500/30 flex items-center gap-1">
                  <Lock className="w-3 h-3 text-rose-400" />
                  Режим только чтения
                </span>
              )}
            </div>
          </div>

          <button
            onClick={() => {
              audioService.playClickSound();
              onClose();
            }}
            className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Form Body */}
        <form
          onSubmit={handleSubmit}
          className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6 no-scrollbar"
        >
          {/* Section 1: Ship & Identifiers */}
          <div className="space-y-4">
            <h3 className="text-xs font-mono font-bold text-cyan-400 uppercase tracking-wider flex items-center gap-1.5 border-b border-slate-800 pb-2">
              <Shield className="w-3.5 h-3.5" />
              <span>Параметры корабля и наноспутника</span>
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
              <div>
                <label className="text-[11px] font-semibold text-slate-300 block mb-1">
                  Позывной борта
                </label>
                <input
                  type="text"
                  required
                  value={formData.shipCallsign || ''}
                  onChange={(e) => setFormData({ ...formData, shipCallsign: e.target.value })}
                  placeholder="Борт-01"
                  className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs font-mono text-cyan-300 font-bold focus:outline-none focus:border-amber-500"
                />
              </div>

              <div>
                <label className="text-[11px] font-semibold text-slate-300 block mb-1">
                  Название корабля
                </label>
                <input
                  type="text"
                  required
                  value={formData.shipName || ''}
                  onChange={(e) => setFormData({ ...formData, shipName: e.target.value })}
                  placeholder="Восток-1"
                  className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs font-bold text-white focus:outline-none focus:border-amber-500"
                />
              </div>

              <div>
                <label className="text-[11px] font-semibold text-slate-300 block mb-1">
                  Формат CubeSat
                </label>
                <select
                  value={formData.cubesatFormat || '3U'}
                  onChange={(e) =>
                    setFormData({ ...formData, cubesatFormat: e.target.value as any })
                  }
                  className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs font-mono text-white focus:outline-none focus:border-amber-500 cursor-pointer"
                >
                  <option value="1U">1U (10×10×10 см, 1.3 кг)</option>
                  <option value="2U">2U (10×10×20 см, 2.6 кг)</option>
                  <option value="3U">3U (10×10×30 см, 4.0 кг)</option>
                  <option value="6U">6U (10×20×30 см, 8.0 кг)</option>
                </select>
              </div>

              <div>
                <label className="text-[11px] font-semibold text-slate-300 block mb-1">
                  Статус квоты
                </label>
                <select
                  value={formData.status || 'quota_allocated'}
                  onChange={(e) => setFormData({ ...formData, status: e.target.value as any })}
                  className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs font-mono text-white focus:outline-none focus:border-amber-500 cursor-pointer"
                >
                  <option value="quota_allocated">Квота выделена</option>
                  <option value="registered_active">Активен (зарегистрирован)</option>
                  <option value="waitlist">Лист ожидания</option>
                </select>
              </div>
            </div>
          </div>

          {/* Section 2: School & Location */}
          <div className="space-y-4">
            <h3 className="text-xs font-mono font-bold text-cyan-400 uppercase tracking-wider flex items-center gap-1.5 border-b border-slate-800 pb-2">
              <School className="w-3.5 h-3.5" />
              <span>Образовательное учреждение и география</span>
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="sm:col-span-2">
                <label className="text-[11px] font-semibold text-slate-300 block mb-1">
                  Полное наименование школы / лицея / организации
                </label>
                <input
                  type="text"
                  required
                  value={formData.school || ''}
                  onChange={(e) => setFormData({ ...formData, school: e.target.value })}
                  placeholder="МАОУ «Лицей №1» г. Перми"
                  className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white focus:outline-none focus:border-amber-500"
                />
              </div>

              <div>
                <label className="text-[11px] font-semibold text-slate-300 block mb-1">
                  Город / Регион
                </label>
                <input
                  type="text"
                  required
                  value={formData.city || ''}
                  onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                  placeholder="Пермь"
                  className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white focus:outline-none focus:border-amber-500"
                />
              </div>
            </div>
          </div>

          {/* Section 3: Mentor / Captain */}
          <div className="space-y-4">
            <h3 className="text-xs font-mono font-bold text-cyan-400 uppercase tracking-wider flex items-center gap-1.5 border-b border-slate-800 pb-2">
              <UserCheck className="w-3.5 h-3.5" />
              <span>Капитан корабля (Преподаватель / Наставник)</span>
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="text-[11px] font-semibold text-slate-300 block mb-1">
                  ФИО преподавателя
                </label>
                <input
                  type="text"
                  required
                  value={formData.mentorName || ''}
                  onChange={(e) => setFormData({ ...formData, mentorName: e.target.value })}
                  placeholder="Иванов Сергей Петрович"
                  className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white font-medium focus:outline-none focus:border-amber-500"
                />
              </div>

              <div>
                <label className="text-[11px] font-semibold text-slate-300 block mb-1">
                  Email (Логин для входа)
                </label>
                <div className="relative">
                  <Mail className="w-3.5 h-3.5 text-slate-500 absolute left-2.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="email"
                    required
                    value={formData.mentorEmail || ''}
                    onChange={(e) => setFormData({ ...formData, mentorEmail: e.target.value })}
                    placeholder="mentor@school.ru"
                    className="w-full pl-8 pr-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs font-mono text-cyan-300 focus:outline-none focus:border-amber-500"
                  />
                </div>
              </div>

              <div>
                <label className="text-[11px] font-semibold text-slate-300 block mb-1">
                  Контактный телефон
                </label>
                <div className="relative">
                  <Phone className="w-3.5 h-3.5 text-slate-500 absolute left-2.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={formData.mentorPhone || ''}
                    onChange={(e) => setFormData({ ...formData, mentorPhone: e.target.value })}
                    placeholder="+7 (902) 123-45-67"
                    className="w-full pl-8 pr-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs font-mono text-slate-200 focus:outline-none focus:border-amber-500"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Section 4: Case Task Selection (Interactive Trigger) */}
          <div className="space-y-3">
            <h3 className="text-xs font-mono font-bold text-cyan-400 uppercase tracking-wider flex items-center justify-between border-b border-slate-800 pb-2">
              <span className="flex items-center gap-1.5">
                <BookOpen className="w-3.5 h-3.5 text-indigo-400" />
                <span>Выбранное кейс-задание чемпионата</span>
              </span>
              <span className="text-[10px] text-slate-400 font-normal">
                Эксклюзивное закрепление
              </span>
            </h3>

            <div className="p-4 rounded-2xl bg-slate-950 border border-indigo-500/30 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
              <div className="space-y-1 min-w-0">
                <span className="text-[10px] font-mono text-indigo-400 block uppercase">
                  Текущее назначенное задание:
                </span>
                <div className="text-sm font-bold text-white leading-snug">
                  {formData.selectedTaskTitle || (
                    <span className="text-amber-400 italic">Задание еще не выбрано</span>
                  )}
                </div>
                {formData.selectedTaskId && (
                  <span className="text-[11px] font-mono text-cyan-300">
                    ID задачи: {formData.selectedTaskId}
                  </span>
                )}
              </div>

              <button
                type="button"
                onClick={() => {
                  audioService.playClickSound();
                  onOpenTaskDirectory({ ...(formData as CrmTeamRecord), students });
                }}
                className="px-4 py-2 rounded-xl bg-gradient-to-r from-indigo-600 to-cyan-600 hover:from-indigo-500 hover:to-cyan-500 text-white font-bold text-xs shadow-md transition-all flex items-center gap-2 shrink-0 cursor-pointer active:scale-95"
              >
                <BookOpen className="w-4 h-4" />
                <span>Открыть справочник заданий</span>
              </button>
            </div>
          </div>

          {/* Section 5: Crew Members (Students) */}
          <div className="space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-2">
              <h3 className="text-xs font-mono font-bold text-cyan-400 uppercase tracking-wider flex items-center gap-1.5">
                <Users className="w-3.5 h-3.5" />
                <span>Исследовательский экипаж (школьники)</span>
              </h3>
              <button
                type="button"
                onClick={handleAddStudent}
                className="px-3 py-1 rounded-lg bg-indigo-600/30 hover:bg-indigo-600/50 text-indigo-300 border border-indigo-500/40 text-xs font-semibold flex items-center gap-1 transition-colors cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Добавить участника</span>
              </button>
            </div>

            <div className="space-y-3">
              {students.map((st, idx) => (
                <div
                  key={idx}
                  className="p-3 rounded-2xl bg-slate-950 border border-slate-800/90 grid grid-cols-1 sm:grid-cols-12 gap-3 items-center"
                >
                  <div className="sm:col-span-5">
                    <label className="text-[10px] text-slate-400 block mb-0.5">ФИО школьника</label>
                    <input
                      type="text"
                      required
                      value={st.name}
                      onChange={(e) => handleStudentChange(idx, 'name', e.target.value)}
                      placeholder="Смирнов Артем"
                      className="w-full px-2.5 py-1.5 rounded-lg bg-slate-900 border border-slate-800 text-xs text-white focus:outline-none focus:border-amber-500"
                    />
                  </div>

                  <div className="sm:col-span-2">
                    <label className="text-[10px] text-slate-400 block mb-0.5">Класс</label>
                    <input
                      type="text"
                      value={st.gradeText}
                      onChange={(e) => handleStudentChange(idx, 'gradeText', e.target.value)}
                      placeholder="10 класс"
                      className="w-full px-2.5 py-1.5 rounded-lg bg-slate-900 border border-slate-800 text-xs text-white focus:outline-none focus:border-amber-500"
                    />
                  </div>

                  <div className="sm:col-span-4">
                    <label className="text-[10px] text-slate-400 block mb-0.5">
                      Роль в экипаже
                    </label>
                    <select
                      value={st.assignedRole}
                      onChange={(e) => {
                        const role = e.target.value as 'physicist' | 'chemist' | 'biologist';
                        const map: Record<
                          string,
                          { title: string; disc: 'Физика' | 'Химия' | 'Биология' }
                        > = {
                          physicist: { title: 'Инженер-физик (Баллистика)', disc: 'Физика' },
                          chemist: { title: 'Инженер-химик (Жизнеобеспечение)', disc: 'Химия' },
                          biologist: { title: 'Инженер-биолог (Биореактор)', disc: 'Биология' },
                        };
                        handleStudentChange(idx, 'assignedRole', role);
                        handleStudentChange(idx, 'roleTitle', map[role].title);
                        handleStudentChange(idx, 'discipline', map[role].disc);
                      }}
                      className="w-full px-2.5 py-1.5 rounded-lg bg-slate-900 border border-slate-800 text-xs text-white focus:outline-none focus:border-amber-500 cursor-pointer"
                    >
                      <option value="physicist">Физик (Баллистика / Механика)</option>
                      <option value="chemist">Химик (Энергия / Жизнеобеспечение)</option>
                      <option value="biologist">Биолог (Биореактор / Экология)</option>
                    </select>
                  </div>

                  <div className="sm:col-span-1 flex justify-end">
                    <button
                      type="button"
                      onClick={() => handleRemoveStudent(idx)}
                      className="p-1.5 rounded-lg text-slate-500 hover:text-rose-400 hover:bg-rose-500/10 transition-colors"
                      title="Удалить школьника"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Form Actions */}
          <div className="pt-4 border-t border-slate-800 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={() => {
                audioService.playClickSound();
                onClose();
              }}
              className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold text-xs transition-colors cursor-pointer"
            >
              Отмена
            </button>

            <button
              type="submit"
              disabled={!isAuthorizedToEdit}
              className={`px-6 py-2.5 rounded-xl font-bold text-xs shadow-lg active:scale-95 transition-all flex items-center gap-2 ${
                isAuthorizedToEdit
                  ? 'bg-gradient-to-r from-amber-600 to-indigo-600 hover:from-amber-500 hover:to-indigo-500 text-white shadow-amber-900/30 cursor-pointer'
                  : 'bg-slate-800 text-slate-500 border border-slate-700 cursor-not-allowed select-none'
              }`}
              title={
                isAuthorizedToEdit
                  ? undefined
                  : 'Редактирование карточки доступно только Администратору, Организатору или Капитану команды'
              }
            >
              {isAuthorizedToEdit ? <Save className="w-4 h-4" /> : <Lock className="w-4 h-4" />}
              <span>
                {isAuthorizedToEdit
                  ? isNew
                    ? 'Создать команду'
                    : 'Сохранить изменения'
                  : 'Сохранение заблокировано'}
              </span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

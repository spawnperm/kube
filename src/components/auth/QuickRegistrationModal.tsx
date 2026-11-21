import React, { useState, useEffect } from 'react';
import QRCode from 'qrcode';
import {
  QrCode,
  UserPlus,
  Users,
  Copy,
  Check,
  Download,
  Sparkles,
  X,
  School,
  Lock,
  Mail,
  User,
  Compass,
  AlertCircle,
} from 'lucide-react';
import { useAuthentikAuth } from '../../contexts/auth/AuthentikAuthContext';
import type { UserRole } from '../../types';

interface QuickRegistrationModalProps {
  isOpen: boolean;
  onClose: () => void;
  defaultRole?: UserRole;
  isAdminMode?: boolean;
}

export const QuickRegistrationModal: React.FC<QuickRegistrationModalProps> = ({
  isOpen,
  onClose,
  defaultRole = 'participant',
  isAdminMode = false,
}) => {
  const { user, register, adminRegister, allUsers, refreshUsers } = useAuthentikAuth();

  const isUserAdmin = isAdminMode || user?.role === 'admin';

  const [activeTab, setActiveTab] = useState<'form' | 'qr' | 'registry'>('form');

  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [role, setRole] = useState<UserRole>(defaultRole);
  const [school, setSchool] = useState('');
  const [teamName, setTeamName] = useState('');
  const [grade, setGrade] = useState('');
  const [city, setCity] = useState('Пермь');
  const [password, setPassword] = useState('123');

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const [qrDataUrl, setQrDataUrl] = useState<string>('');
  const [qrRole, setQrRole] = useState<UserRole>('participant');
  const [qrInviteUrl, setQrInviteUrl] = useState<string>('');
  const [copiedUrl, setCopiedUrl] = useState(false);

  useEffect(() => {
    if (defaultRole) {
      setRole(defaultRole);
    }
  }, [defaultRole]);

  useEffect(() => {
    async function generateQr() {
      const baseUrl =
        typeof window !== 'undefined' ? window.location.origin : 'http://localhost:3000';
      const token = `cosmoport_invite_${qrRole}_${Date.now()}`;
      const url = `${baseUrl}/?action=register&role=${qrRole}&token=${token}`;
      setQrInviteUrl(url);

      try {
        const dataUrl = await QRCode.toDataURL(url, {
          width: 280,
          margin: 2,
          color: {
            dark: '#0284c7',
            light: '#030712',
          },
        });
        setQrDataUrl(dataUrl);
      } catch (err) {
        console.error('Failed to generate QR code', err);
      }
    }

    if (isOpen) {
      generateQr();
    }
  }, [isOpen, qrRole]);

  if (!isOpen) return null;

  const handleSubmitForm = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!fullName.trim() || !email.trim()) return;

    setIsSubmitting(true);
    setErrorMessage(null);
    setSuccessMessage(null);

    const payload = {
      fullName: fullName.trim(),
      email: email.trim().toLowerCase(),
      role,
      school: school.trim(),
      teamName: teamName.trim(),
      grade: grade.trim(),
      city: city.trim(),
      password: password || '123',
    };

    if (isUserAdmin) {
      const result = await adminRegister(payload);
      if (result.success) {
        setSuccessMessage(
          `Участник ${fullName} успешно зарегистрирован в PostgreSQL с паролем "${password || '123'}"`,
        );
        setFullName('');
        setEmail('');
        setSchool('');
        setTeamName('');
        setGrade('');
        await refreshUsers();
      } else {
        setErrorMessage(result.error || 'Ошибка регистрации участника');
      }
    } else {
      const ok = await register(payload);
      if (ok) {
        setSuccessMessage(`Добро пожаловать, ${fullName}! Вы зарегистрированы на портале.`);
        setTimeout(() => onClose(), 1200);
      }
    }

    setIsSubmitting(false);
  };

  const handleCopyInviteUrl = () => {
    if (!qrInviteUrl) return;
    navigator.clipboard.writeText(qrInviteUrl).then(() => {
      setCopiedUrl(true);
      setTimeout(() => setCopiedUrl(false), 2000);
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/85 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-2xl bg-slate-900 border border-cyan-500/40 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="bg-gradient-to-r from-slate-950 via-slate-900 to-indigo-950/90 border-b border-slate-800 p-4 sm:p-5 flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-xl bg-gradient-to-tr from-cyan-500 via-indigo-600 to-purple-600 p-0.5 shadow-lg flex items-center justify-center">
              <div className="w-full h-full bg-slate-950 rounded-[10px] flex items-center justify-center">
                <UserPlus className="w-6 h-6 text-cyan-400" />
              </div>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base sm:text-lg font-bold text-white flex items-center gap-2">
                  <span>Регистрация участников</span>
                </h3>
                {isUserAdmin && (
                  <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-rose-500/20 text-rose-300 border border-rose-500/40">
                    Права Администратора
                  </span>
                )}
                <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-cyan-500/20 text-cyan-300 border border-cyan-500/40">
                  PostgreSQL
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                Быстрое занесение в базу данных через форму или мобильный QR-код с паролем «123»
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
            aria-label="Закрыть"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation Tabs */}
        <div className="grid grid-cols-3 bg-slate-950/80 border-b border-slate-800 text-xs font-semibold">
          <button
            type="button"
            onClick={() => setActiveTab('form')}
            className={`py-3 px-3 flex items-center justify-center gap-1.5 transition-all cursor-pointer border-b-2 ${
              activeTab === 'form'
                ? 'border-cyan-400 text-cyan-300 bg-slate-900/60'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <UserPlus className="w-4 h-4 text-cyan-400" />
            <span>Анкета регистрации</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('qr')}
            className={`py-3 px-3 flex items-center justify-center gap-1.5 transition-all cursor-pointer border-b-2 ${
              activeTab === 'qr'
                ? 'border-cyan-400 text-cyan-300 bg-slate-900/60'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <QrCode className="w-4 h-4 text-emerald-400" />
            <span>QR-код для смартфонов</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('registry')}
            className={`py-3 px-3 flex items-center justify-center gap-1.5 transition-all cursor-pointer border-b-2 ${
              activeTab === 'registry'
                ? 'border-cyan-400 text-cyan-300 bg-slate-900/60'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Users className="w-4 h-4 text-indigo-400" />
            <span>База PostgreSQL ({allUsers.length})</span>
          </button>
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-4">
          {successMessage && (
            <div className="p-3 rounded-xl bg-emerald-950/60 border border-emerald-500/50 text-emerald-200 text-xs flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>{successMessage}</span>
            </div>
          )}

          {errorMessage && (
            <div className="p-3 rounded-xl bg-rose-950/60 border border-rose-500/50 text-rose-200 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* TAB 1: FORM REGISTRATION */}
          {activeTab === 'form' && (
            <form onSubmit={handleSubmitForm} className="space-y-3.5">
              <div className="p-2.5 rounded-xl bg-cyan-950/30 border border-cyan-500/30 text-cyan-200 text-xs flex items-center justify-between">
                <span>
                  {isUserAdmin
                    ? 'Администратор регистрирует нового участника напрямую в базу данных PostgreSQL.'
                    : 'Заполните анкету для моментального создания учетной записи в Authentik.'}
                </span>
                <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-cyan-500/20 text-cyan-300 border border-cyan-500/40">
                  Пароль: 123
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    ФИО участника *:
                  </label>
                  <div className="relative">
                    <User className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                    <input
                      type="text"
                      required
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      placeholder="Например: Сидоров Артем Игоревич"
                      className="w-full pl-9 pr-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Email адрес *:
                  </label>
                  <div className="relative">
                    <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                    <input
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="sidorov@school.perm.ru"
                      className="w-full pl-9 pr-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500"
                    />
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Назначаемая роль:
                  </label>
                  <select
                    value={role}
                    onChange={(e) => setRole(e.target.value as UserRole)}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white focus:outline-none focus:border-cyan-500 cursor-pointer"
                  >
                    <option value="participant">🚀 Участник (Школьник)</option>
                    <option value="mentor">👨‍✈️ Наставник (Учитель-педагог)</option>
                    <option value="expert">⚖️ Эксперт (Член жюри)</option>
                    {isUserAdmin && <option value="organizer">🛰️ Организатор (Оргкомитет)</option>}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Пароль для входа:
                  </label>
                  <div className="relative">
                    <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                    <input
                      type="text"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="123"
                      className="w-full pl-9 pr-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500 font-mono"
                    />
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Школа / Организация:
                  </label>
                  <div className="relative">
                    <School className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                    <input
                      type="text"
                      value={school}
                      onChange={(e) => setSchool(e.target.value)}
                      placeholder="МАОУ «СОШ № 108» г. Перми"
                      className="w-full pl-9 pr-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Команда / Проект CubeSat:
                  </label>
                  <div className="relative">
                    <Compass className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                    <input
                      type="text"
                      value={teamName}
                      onChange={(e) => setTeamName(e.target.value)}
                      placeholder="«Импульс-108» или «Синтез»"
                      className="w-full pl-9 pr-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500"
                    />
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Класс / Группа:
                  </label>
                  <input
                    type="text"
                    value={grade}
                    onChange={(e) => setGrade(e.target.value)}
                    placeholder="10 класс / 11А класс"
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Город:</label>
                  <input
                    type="text"
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                    placeholder="Пермь"
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full py-2.5 px-4 rounded-xl bg-gradient-to-r from-cyan-600 via-indigo-600 to-purple-600 hover:from-cyan-500 hover:to-indigo-500 text-white font-bold text-xs transition-all shadow-lg flex items-center justify-center gap-2 cursor-pointer active:scale-98"
              >
                <UserPlus className="w-4 h-4" />
                <span>
                  {isSubmitting
                    ? 'Запись в PostgreSQL...'
                    : isUserAdmin
                      ? 'Зарегистрировать участника (Админ)'
                      : 'Зарегистрироваться на портале'}
                </span>
              </button>
            </form>
          )}

          {/* TAB 2: QR CODE ONBOARDING */}
          {activeTab === 'qr' && (
            <div className="space-y-4 text-center">
              <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 text-xs text-slate-300 max-w-md mx-auto">
                <p>
                  Покажите этот QR-код школьнику или наставнику. При наведении камеры смартфона
                  откроется мобильная форма регистрации с предустановленным паролем{' '}
                  <strong className="text-white font-mono">123</strong>.
                </p>
              </div>

              <div className="flex items-center justify-center gap-2">
                <span className="text-xs text-slate-400">Роль в QR-коде:</span>
                <select
                  value={qrRole}
                  onChange={(e) => setQrRole(e.target.value as UserRole)}
                  className="bg-slate-950 border border-cyan-500/40 text-cyan-300 rounded-lg px-2.5 py-1 text-xs font-semibold focus:outline-none cursor-pointer"
                >
                  <option value="participant">🚀 Участник (Школьник)</option>
                  <option value="mentor">👨‍✈️ Наставник (Учитель)</option>
                  <option value="expert">⚖️ Эксперт (Жюри)</option>
                </select>
              </div>

              <div className="flex flex-col items-center justify-center p-4 bg-slate-950 rounded-2xl border border-cyan-500/30 max-w-xs mx-auto shadow-xl">
                {qrDataUrl ? (
                  <img
                    src={qrDataUrl}
                    alt="QR Код для регистрации"
                    className="w-56 h-56 rounded-xl border border-slate-800 shadow-md"
                  />
                ) : (
                  <div className="w-56 h-56 flex items-center justify-center text-slate-500 text-xs">
                    Генерация QR-кода...
                  </div>
                )}
                <span className="text-[11px] font-mono text-cyan-400 mt-3 font-semibold">
                  СКАНИРУЙТЕ ДЛЯ РЕГИСТРАЦИИ
                </span>
                <span className="text-[10px] text-slate-500">
                  Кейс-чемпионат «МИРОВИЗОР» • Authentik SSO
                </span>
              </div>

              <div className="flex flex-wrap items-center justify-center gap-2 max-w-md mx-auto">
                <button
                  type="button"
                  onClick={handleCopyInviteUrl}
                  className="px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer shadow-xs"
                >
                  {copiedUrl ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-emerald-400" />
                      <span className="text-emerald-400">Ссылка скопирована!</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5 text-cyan-400" />
                      <span>Скопировать ссылку</span>
                    </>
                  )}
                </button>

                {qrDataUrl && (
                  <a
                    href={qrDataUrl}
                    download={`cosmoport-qr-${qrRole}.png`}
                    className="px-3 py-2 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-slate-950 font-bold text-xs flex items-center gap-1.5 transition-all shadow-sm"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>Скачать QR (PNG)</span>
                  </a>
                )}
              </div>
            </div>
          )}

          {/* TAB 3: POSTGRESQL USERS REGISTRY */}
          {activeTab === 'registry' && (
            <div className="space-y-3">
              <div className="flex items-center justify-between text-xs text-slate-400">
                <span>
                  Всего зарегистрировано в PostgreSQL:{' '}
                  <strong className="text-white font-mono">{allUsers.length}</strong>
                </span>
                <button
                  type="button"
                  onClick={() => refreshUsers()}
                  className="text-cyan-400 hover:text-cyan-300 font-semibold cursor-pointer"
                >
                  Обновить список
                </button>
              </div>

              <div className="space-y-2 max-h-[46vh] overflow-y-auto pr-1">
                {allUsers.map((u) => (
                  <div
                    key={u.id}
                    className="p-2.5 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-between gap-3 text-xs"
                  >
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-white truncate">{u.full_name}</span>
                        <span className="px-1.5 py-0.2 rounded text-[10px] font-mono bg-slate-800 text-cyan-300">
                          {u.role}
                        </span>
                        {u.team_name && (
                          <span className="text-[10px] text-slate-400 truncate">
                            «{u.team_name}»
                          </span>
                        )}
                      </div>
                      <div className="text-[11px] text-slate-400 font-mono truncate">{u.email}</div>
                    </div>

                    <span className="text-[10px] text-slate-500 font-mono shrink-0">
                      Пароль: 123
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef, useCallback } from 'react';
import QRCode from 'qrcode';
import {
  Smartphone,
  QrCode,
  RefreshCw,
  Copy,
  Check,
  Download,
  ShieldCheck,
  Radio,
  Clock,
  Trash2,
  Bell,
  Sparkles,
  ExternalLink,
  X,
  Battery,
  AlertTriangle,
  Zap,
} from 'lucide-react';
import type { Team, UserRole, ConnectedMobileDevice, MobileAuthPayload } from '../types';
import {
  createMobileAuthPayload,
  createMobileDeepLinks,
  getRemainingValiditySeconds,
  isPayloadExpired,
  serializeMobileAuthPayload,
  createSimulatedDevice,
} from '../domain/mobileAuth';

export interface TeamMobileAuthQrModalProps {
  isOpen: boolean;
  onClose: () => void;
  team: Team;
  userRole?: UserRole;
  connectedDevices: ConnectedMobileDevice[];
  onAddDevice: (device: ConnectedMobileDevice) => void;
  onRemoveDevice: (deviceId: string) => void;
  onShowNotification?: (
    title: string,
    message: string,
    type?: 'info' | 'success' | 'warning',
  ) => void;
}

type QrTheme = 'neon-cyan' | 'neon-emerald' | 'classic-contrast';

export const TeamMobileAuthQrModal: React.FC<TeamMobileAuthQrModalProps> = ({
  isOpen,
  onClose,
  team,
  userRole = 'participant',
  connectedDevices,
  onAddDevice,
  onRemoveDevice,
  onShowNotification,
}) => {
  const [targetRole, setTargetRole] = useState<UserRole>(userRole);
  const [authPayload, setAuthPayload] = useState<MobileAuthPayload>(() =>
    createMobileAuthPayload(team, userRole),
  );
  const [qrDataUrl, setQrDataUrl] = useState<string>('');
  const [remainingSeconds, setRemainingSeconds] = useState<number>(() =>
    getRemainingValiditySeconds(authPayload),
  );
  const [qrTheme, setQrTheme] = useState<QrTheme>('neon-cyan');
  const [showScannerLaser, setShowScannerLaser] = useState(true);
  const [activeTab, setActiveTab] = useState<'qr' | 'devices' | 'guide'>('qr');
  const [copiedCode, setCopiedCode] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);
  const [isSimulatingScan, setIsSimulatingScan] = useState(false);
  const [scanSuccessMessage, setScanSuccessMessage] = useState<string | null>(null);

  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  // Re-generate auth payload
  const handleRegenerateCode = useCallback(() => {
    const newPayload = createMobileAuthPayload(team, targetRole);
    setAuthPayload(newPayload);
    setRemainingSeconds(getRemainingValiditySeconds(newPayload));
    setScanSuccessMessage(null);
  }, [team, targetRole]);

  // When target role changes, regenerate
  useEffect(() => {
    handleRegenerateCode();
  }, [targetRole, handleRegenerateCode]);

  // Countdown timer for session validity
  useEffect(() => {
    if (!isOpen) return;

    const interval = setInterval(() => {
      const remaining = getRemainingValiditySeconds(authPayload);
      setRemainingSeconds(remaining);
    }, 1000);

    return () => clearInterval(interval);
  }, [isOpen, authPayload]);

  // Render QR code to data URL
  useEffect(() => {
    if (!isOpen) return;

    const generateQr = async () => {
      try {
        const textToEncode = serializeMobileAuthPayload(authPayload);

        let darkColor = '#22d3ee'; // cyan-400
        let lightColor = '#030712'; // slate-950

        if (qrTheme === 'neon-emerald') {
          darkColor = '#34d399'; // emerald-400
          lightColor = '#030712';
        } else if (qrTheme === 'classic-contrast') {
          darkColor = '#020617'; // jet black
          lightColor = '#ffffff'; // pure white
        }

        const dataUrl = await QRCode.toDataURL(textToEncode, {
          width: 320,
          margin: 2,
          errorCorrectionLevel: 'H', // High error correction to support central logo
          color: {
            dark: darkColor,
            light: lightColor,
          },
        });
        setQrDataUrl(dataUrl);
      } catch (err) {
        console.error('Failed to generate QR code:', err);
      }
    };

    generateQr();
  }, [isOpen, authPayload, qrTheme]);

  if (!isOpen) return null;

  const expired = isPayloadExpired(authPayload);
  const minutes = Math.floor(remainingSeconds / 60);
  const seconds = remainingSeconds % 60;
  const formattedTime = `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
  const links = createMobileDeepLinks(authPayload);

  // Copy Auth Code
  const handleCopyCode = async () => {
    try {
      await navigator.clipboard.writeText(authPayload.authCode);
      setCopiedCode(true);
      setTimeout(() => setCopiedCode(false), 2000);
    } catch {
      // fallback
    }
  };

  // Copy Deep Link
  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(links.universalLink);
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2000);
    } catch {
      // fallback
    }
  };

  // Download QR as PNG
  const handleDownloadQr = () => {
    if (!qrDataUrl) return;
    const a = document.createElement('a');
    a.href = qrDataUrl;
    a.download = `cosmoport-qr-${team.id}-${authPayload.authCode}.png`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    if (onShowNotification) {
      onShowNotification('QR-код сохранен', 'Изображение QR-кода загружено для печати', 'info');
    }
  };

  // Simulate mobile scan in browser
  const handleSimulateMobileScan = () => {
    if (expired) return;
    setIsSimulatingScan(true);

    setTimeout(() => {
      const newDevice = createSimulatedDevice(team);
      onAddDevice(newDevice);
      setIsSimulatingScan(false);
      setScanSuccessMessage(`Устройство «${newDevice.deviceName}» успешно авторизовано!`);

      if (onShowNotification) {
        onShowNotification(
          'Устройство подключено',
          `Смартфон «${newDevice.deviceName}» экипажа ${newDevice.memberName} синхронизирован с порталом`,
          'success',
        );
      }
    }, 1200);
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="mobile-auth-modal-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-fade-in"
    >
      <div className="relative w-full max-w-2xl max-h-[92vh] flex flex-col rounded-2xl border border-cyan-500/30 bg-slate-900 shadow-2xl overflow-hidden text-slate-100">
        {/* Glow ambient background effects */}
        <div className="absolute -right-20 -top-20 h-56 w-56 rounded-full bg-cyan-500/15 blur-3xl pointer-events-none" />
        <div className="absolute -left-20 -bottom-20 h-56 w-56 rounded-full bg-indigo-500/15 blur-3xl pointer-events-none" />

        {/* Modal Header */}
        <div className="relative z-10 flex items-center justify-between border-b border-slate-800 bg-slate-950/60 px-6 py-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-cyan-500/20 to-indigo-500/20 border border-cyan-500/40 text-cyan-400 shadow-inner">
              <Smartphone className="h-5 w-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 id="mobile-auth-modal-title" className="text-base font-bold text-white">
                  Мобильная авторизация команды
                </h2>
                <span className="rounded-full bg-cyan-500/15 px-2 py-0.5 text-[10px] font-semibold text-cyan-300 border border-cyan-500/30">
                  QR-Синхронизация
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Команда «{team.name}» • Шлюз ЦУП для полевых смартфонов
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            aria-label="Закрыть окно"
            className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-800 hover:text-white transition-colors cursor-pointer"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Navigation Tabs */}
        <div className="relative z-10 flex border-b border-slate-800 bg-slate-950/40 px-6">
          <button
            type="button"
            onClick={() => setActiveTab('qr')}
            className={`flex items-center gap-2 border-b-2 px-4 py-3 text-xs font-semibold transition-all cursor-pointer ${
              activeTab === 'qr'
                ? 'border-cyan-400 text-cyan-300 bg-cyan-500/10'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <QrCode className="h-4 w-4" />
            <span>QR-код подключения</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('devices')}
            className={`flex items-center gap-2 border-b-2 px-4 py-3 text-xs font-semibold transition-all cursor-pointer ${
              activeTab === 'devices'
                ? 'border-cyan-400 text-cyan-300 bg-cyan-500/10'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Smartphone className="h-4 w-4" />
            <span>Подключенные устройства ({connectedDevices.length})</span>
            {connectedDevices.length > 0 && (
              <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
            )}
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('guide')}
            className={`flex items-center gap-2 border-b-2 px-4 py-3 text-xs font-semibold transition-all cursor-pointer ${
              activeTab === 'guide'
                ? 'border-cyan-400 text-cyan-300 bg-cyan-500/10'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Radio className="h-4 w-4" />
            <span>Возможности приложения</span>
          </button>
        </div>

        {/* Modal Body with Scroll */}
        <div className="relative z-10 overflow-y-auto p-6 space-y-6">
          {activeTab === 'qr' && (
            <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-center">
              {/* Left Column: QR Code Display Card */}
              <div className="md:col-span-6 flex flex-col items-center">
                <div
                  className={`relative rounded-2xl p-4 border transition-all shadow-xl ${
                    qrTheme === 'classic-contrast'
                      ? 'bg-white border-slate-300 text-slate-900 shadow-white/5'
                      : qrTheme === 'neon-emerald'
                        ? 'bg-slate-950 border-emerald-500/40 shadow-emerald-500/10'
                        : 'bg-slate-950 border-cyan-500/40 shadow-cyan-500/10'
                  }`}
                >
                  {/* Laser sweep animation line */}
                  {showScannerLaser && !expired && (
                    <div className="pointer-events-none absolute inset-x-4 top-4 overflow-hidden rounded-xl h-[260px] z-20">
                      <div className="h-1 w-full bg-gradient-to-r from-transparent via-cyan-400 to-transparent shadow-[0_0_12px_#38bdf8] animate-pulse" />
                    </div>
                  )}

                  {/* QR Code Canvas/Image */}
                  <div className="relative flex items-center justify-center rounded-xl overflow-hidden min-h-[256px] min-w-[256px]">
                    {qrDataUrl ? (
                      <img
                        src={qrDataUrl}
                        alt={`QR-код авторизации для команды ${team.name}`}
                        className={`w-64 h-64 object-contain transition-opacity duration-300 ${
                          expired ? 'opacity-25 grayscale' : 'opacity-100'
                        }`}
                      />
                    ) : (
                      <div className="w-64 h-64 flex items-center justify-center bg-slate-900 text-slate-500 text-xs font-mono">
                        Генерация матрицы QR...
                      </div>
                    )}

                    {/* Central Logo Badge */}
                    <div
                      className={`absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 flex items-center justify-center h-12 w-12 rounded-xl border shadow-lg ${
                        qrTheme === 'classic-contrast'
                          ? 'bg-slate-950 border-slate-700 text-white'
                          : 'bg-slate-900/90 border-cyan-400/60 text-cyan-300 backdrop-blur-md'
                      }`}
                    >
                      <span className="text-xl" title="КубСат борт">
                        {team.logo || '🛰️'}
                      </span>
                    </div>

                    {/* Expired Overlay */}
                    {expired && (
                      <div className="absolute inset-0 flex flex-col items-center justify-center bg-slate-950/85 p-4 text-center rounded-xl backdrop-blur-xs">
                        <AlertTriangle className="h-8 w-8 text-amber-400 mb-2" />
                        <span className="text-xs font-bold text-white uppercase tracking-wider">
                          Сессия QR-кода истекла
                        </span>
                        <p className="text-[11px] text-slate-400 mt-1 max-w-[200px]">
                          Для защиты сессии время действия ограничено 5 минутами
                        </p>
                        <button
                          type="button"
                          onClick={handleRegenerateCode}
                          className="mt-3 flex items-center gap-1.5 rounded-lg bg-cyan-500 px-3 py-1.5 text-xs font-bold text-slate-950 hover:bg-cyan-400 transition-all shadow-md cursor-pointer"
                        >
                          <RefreshCw className="h-3.5 w-3.5" />
                          <span>Обновить QR-код</span>
                        </button>
                      </div>
                    )}
                  </div>

                  {/* QR Footer Status */}
                  <div
                    className={`mt-3 flex items-center justify-between text-[11px] pt-2 border-t ${
                      qrTheme === 'classic-contrast'
                        ? 'border-slate-200 text-slate-600'
                        : 'border-slate-800 text-slate-400'
                    }`}
                  >
                    <span className="flex items-center gap-1 font-mono">
                      <Radio className="h-3 w-3 text-cyan-400" />
                      <span>{authPayload.telemetryFreqMhz} МГц</span>
                    </span>
                    <span
                      className={`font-mono font-semibold flex items-center gap-1 ${
                        expired
                          ? 'text-rose-400'
                          : remainingSeconds < 60
                            ? 'text-amber-400 animate-pulse'
                            : 'text-cyan-400'
                      }`}
                    >
                      <Clock className="h-3 w-3" />
                      <span>{expired ? 'Истек' : formattedTime}</span>
                    </span>
                  </div>
                </div>

                {/* Theme & Laser Controls */}
                <div className="mt-3 flex items-center gap-2">
                  <div className="flex rounded-lg bg-slate-950 p-1 border border-slate-800 text-[10px]">
                    <button
                      type="button"
                      onClick={() => setQrTheme('neon-cyan')}
                      className={`px-2 py-1 rounded transition-colors cursor-pointer ${
                        qrTheme === 'neon-cyan'
                          ? 'bg-cyan-500/20 text-cyan-300 font-bold'
                          : 'text-slate-400 hover:text-slate-200'
                      }`}
                    >
                      Неон
                    </button>
                    <button
                      type="button"
                      onClick={() => setQrTheme('neon-emerald')}
                      className={`px-2 py-1 rounded transition-colors cursor-pointer ${
                        qrTheme === 'neon-emerald'
                          ? 'bg-emerald-500/20 text-emerald-300 font-bold'
                          : 'text-slate-400 hover:text-slate-200'
                      }`}
                    >
                      Изумруд
                    </button>
                    <button
                      type="button"
                      onClick={() => setQrTheme('classic-contrast')}
                      className={`px-2 py-1 rounded transition-colors cursor-pointer ${
                        qrTheme === 'classic-contrast'
                          ? 'bg-white text-slate-950 font-bold'
                          : 'text-slate-400 hover:text-slate-200'
                      }`}
                    >
                      Контраст
                    </button>
                  </div>

                  <button
                    type="button"
                    onClick={() => setShowScannerLaser(!showScannerLaser)}
                    className={`flex items-center gap-1 px-2.5 py-1.5 rounded-lg border text-[10px] transition-all cursor-pointer ${
                      showScannerLaser
                        ? 'bg-cyan-500/10 border-cyan-500/30 text-cyan-300'
                        : 'bg-slate-950 border-slate-800 text-slate-400'
                    }`}
                  >
                    <Zap className="h-3 w-3" />
                    <span>Лазер-сканер</span>
                  </button>
                </div>
              </div>

              {/* Right Column: Pairing Actions & Details */}
              <div className="md:col-span-6 space-y-4">
                {/* Target Role Selector */}
                <div className="rounded-xl border border-slate-800 bg-slate-950/70 p-3.5 space-y-2">
                  <label
                    htmlFor="target-auth-role"
                    className="text-xs font-semibold text-slate-300"
                  >
                    Авторизовать в мобильном приложении как:
                  </label>
                  <select
                    id="target-auth-role"
                    value={targetRole}
                    onChange={(e) => setTargetRole(e.target.value as UserRole)}
                    className="w-full rounded-lg bg-slate-900 border border-slate-700 p-2 text-xs text-white focus:border-cyan-500 focus:outline-hidden cursor-pointer"
                  >
                    <option value="participant">
                      Участник экипажа (полный доступ к борт-данным)
                    </option>
                    <option value="mentor">Куратор / Ментор команды</option>
                    <option value="jury">Член жюри / Эксперт чемпионата</option>
                    <option value="organizer">Организатор ЦУП</option>
                  </select>
                </div>

                {/* Manual 6-Digit Auth Code */}
                <div className="rounded-xl border border-slate-800 bg-slate-950/70 p-3.5 space-y-2">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-slate-400">Резервный код ручного ввода:</span>
                    <span className="text-[10px] text-cyan-400">если камера недоступна</span>
                  </div>
                  <div className="flex items-center justify-between gap-2 p-2 rounded-lg bg-slate-900 border border-slate-800">
                    <span className="font-mono text-base font-bold tracking-widest text-cyan-300 select-all">
                      {authPayload.authCode}
                    </span>
                    <button
                      type="button"
                      onClick={handleCopyCode}
                      className="flex items-center gap-1 rounded bg-slate-800 hover:bg-slate-700 px-2.5 py-1 text-xs text-slate-200 transition-colors cursor-pointer"
                      title="Скопировать код"
                    >
                      {copiedCode ? (
                        <>
                          <Check className="h-3 w-3 text-emerald-400" />
                          <span className="text-emerald-400">Скопировано</span>
                        </>
                      ) : (
                        <>
                          <Copy className="h-3 w-3 text-slate-400" />
                          <span>Копия</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>

                {/* Quick Action Buttons */}
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={handleRegenerateCode}
                    className="flex items-center justify-center gap-1.5 py-2 px-3 rounded-lg border border-slate-700 bg-slate-900 hover:border-cyan-500/40 text-xs text-slate-300 hover:text-white transition-all cursor-pointer"
                  >
                    <RefreshCw className="h-3.5 w-3.5 text-cyan-400" />
                    <span>Обновить QR</span>
                  </button>

                  <button
                    type="button"
                    onClick={handleDownloadQr}
                    className="flex items-center justify-center gap-1.5 py-2 px-3 rounded-lg border border-slate-700 bg-slate-900 hover:border-cyan-500/40 text-xs text-slate-300 hover:text-white transition-all cursor-pointer"
                  >
                    <Download className="h-3.5 w-3.5 text-indigo-400" />
                    <span>Скачать PNG</span>
                  </button>
                </div>

                {/* Deep Link copy button */}
                <button
                  type="button"
                  onClick={handleCopyLink}
                  className="w-full flex items-center justify-center gap-2 py-2 px-3 rounded-lg border border-slate-800 bg-slate-950/80 hover:border-slate-700 text-xs text-slate-400 hover:text-slate-200 transition-all cursor-pointer"
                >
                  {copiedLink ? (
                    <>
                      <Check className="h-3.5 w-3.5 text-emerald-400" />
                      <span className="text-emerald-400 font-medium">Ссылка скопирована!</span>
                    </>
                  ) : (
                    <>
                      <ExternalLink className="h-3.5 w-3.5 text-slate-500" />
                      <span>Скопировать универсальную ссылку синхронизации</span>
                    </>
                  )}
                </button>

                {/* SIMULATE SCAN BUTTON (Interactive tester) */}
                <div className="pt-2 border-t border-slate-800">
                  <button
                    type="button"
                    onClick={handleSimulateMobileScan}
                    disabled={isSimulatingScan || expired}
                    className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl font-bold text-xs bg-gradient-to-r from-cyan-500 to-indigo-600 hover:from-cyan-400 hover:to-indigo-500 text-slate-950 transition-all shadow-lg hover:shadow-cyan-500/20 disabled:opacity-50 cursor-pointer"
                  >
                    {isSimulatingScan ? (
                      <>
                        <RefreshCw className="h-4 w-4 animate-spin text-slate-950" />
                        <span>Сканирование смартфоном...</span>
                      </>
                    ) : (
                      <>
                        <Sparkles className="h-4 w-4 text-slate-950" />
                        <span>Имитировать сканирование со смартфона</span>
                      </>
                    )}
                  </button>
                  <p className="mt-1 text-[11px] text-center text-slate-400">
                    Эмулирует наведение камеры участника и моментальную привязку устройства
                  </p>

                  {scanSuccessMessage && (
                    <div className="mt-2 flex items-center gap-2 p-2 rounded-lg bg-emerald-500/20 border border-emerald-500/40 text-xs text-emerald-300 animate-fade-in">
                      <Check className="h-4 w-4 text-emerald-400 shrink-0" />
                      <span>{scanSuccessMessage}</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: CONNECTED DEVICES */}
          {activeTab === 'devices' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-bold text-white">
                    Синхронизированные устройства экипажа
                  </h3>
                  <p className="text-xs text-slate-400">
                    Устройства, получающие push-уведомления и живую телеметрию КубСата
                  </p>
                </div>
                <button
                  type="button"
                  onClick={handleSimulateMobileScan}
                  disabled={isSimulatingScan}
                  className="flex items-center gap-1.5 rounded-lg bg-cyan-500/20 border border-cyan-500/40 px-3 py-1.5 text-xs font-semibold text-cyan-300 hover:bg-cyan-500/30 transition-all cursor-pointer"
                >
                  <Smartphone className="h-3.5 w-3.5" />
                  <span>+ Привязать тестовое устройство</span>
                </button>
              </div>

              {connectedDevices.length === 0 ? (
                <div className="rounded-xl border border-dashed border-slate-800 p-8 text-center">
                  <Smartphone className="mx-auto h-8 w-8 text-slate-600 mb-2" />
                  <p className="text-sm text-slate-300 font-semibold">
                    Нет синхронизированных устройств
                  </p>
                  <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
                    Откройте вкладку «QR-код подключения» и наведите камеру смартфона, чтобы
                    привязать первый гаджет.
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {connectedDevices.map((device) => (
                    <div
                      key={device.id}
                      className="flex flex-col justify-between p-3.5 rounded-xl border border-slate-800 bg-slate-950/80 hover:border-slate-700 transition-all"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex items-center gap-3">
                          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-900 border border-slate-800 text-cyan-400">
                            <Smartphone className="h-5 w-5" />
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <h4 className="text-xs font-bold text-white">{device.deviceName}</h4>
                              <span className="rounded bg-slate-800 px-1.5 py-0.5 text-[9px] uppercase font-mono text-slate-400">
                                {device.platform}
                              </span>
                            </div>
                            <div className="text-[11px] text-cyan-300 mt-0.5">
                              {device.memberName} ({device.memberRole})
                            </div>
                          </div>
                        </div>

                        <button
                          type="button"
                          onClick={() => onRemoveDevice(device.id)}
                          className="rounded-lg p-1.5 text-slate-500 hover:text-rose-400 hover:bg-rose-500/10 transition-colors cursor-pointer"
                          title="Отозвать авторизацию устройства"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>

                      <div className="mt-3 pt-2.5 border-t border-slate-900 flex items-center justify-between text-[11px] text-slate-400 font-mono">
                        <span className="flex items-center gap-1.5">
                          <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
                          <span className="text-slate-300">{device.lastActiveAt}</span>
                        </span>
                        {device.batteryLevel && (
                          <span className="flex items-center gap-1 text-slate-400">
                            <Battery className="h-3 w-3 text-emerald-400" />
                            <span>{device.batteryLevel}%</span>
                          </span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* TAB 3: GUIDE & MOBILE SPECS */}
          {activeTab === 'guide' && (
            <div className="space-y-4 text-xs text-slate-300">
              <div className="rounded-xl border border-cyan-500/20 bg-cyan-950/20 p-4">
                <h3 className="font-bold text-cyan-300 flex items-center gap-2">
                  <Radio className="h-4 w-4" />
                  Возможности мобильного клиента «Космос-Просто»
                </h3>
                <p className="mt-1 text-slate-300">
                  Мобильное PWA-приложение позволяет экипажу оставаться на связи с бортом КубСата
                  даже вне рабочего места за компьютером:
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <div className="rounded-xl border border-slate-800 bg-slate-950/60 p-3 space-y-1.5">
                  <div className="flex items-center gap-2 text-cyan-300 font-bold">
                    <Bell className="h-4 w-4 text-cyan-400" />
                    <span>Push-оповещения</span>
                  </div>
                  <p className="text-[11px] text-slate-400 leading-relaxed">
                    Мгновенные уведомления о смене статуса этапа экспертами жюри, входе аппарата в
                    тень Земли и критических просадках напряжения батарей.
                  </p>
                </div>

                <div className="rounded-xl border border-slate-800 bg-slate-950/60 p-3 space-y-1.5">
                  <div className="flex items-center gap-2 text-indigo-300 font-bold">
                    <Radio className="h-4 w-4 text-indigo-400" />
                    <span>Прямой радиомаяк</span>
                  </div>
                  <p className="text-[11px] text-slate-400 leading-relaxed">
                    Прием сырых пакетов AX.25 на частоте {team.cubesatSpecs.radioFreqMhz} МГц и
                    отслеживание окна прямой радиовидимости над наземной станцией.
                  </p>
                </div>

                <div className="rounded-xl border border-slate-800 bg-slate-950/60 p-3 space-y-1.5">
                  <div className="flex items-center gap-2 text-emerald-300 font-bold">
                    <ShieldCheck className="h-4 w-4 text-emerald-400" />
                    <span>Безопасность</span>
                  </div>
                  <p className="text-[11px] text-slate-400 leading-relaxed">
                    Авторизация через зашифрованный одноразовый QR-токен со сроком жизни 5 минут и
                    возможностью немедленного отзыва доступа любого гаджета.
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="relative z-10 flex items-center justify-between border-t border-slate-800 bg-slate-950/80 px-6 py-3.5 text-xs text-slate-400">
          <div className="flex items-center gap-2">
            <span className="h-2 w-2 rounded-full bg-emerald-400" />
            <span>Шлюз синхронизации активен (Протокол v1.0)</span>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg bg-slate-800 px-4 py-1.5 text-xs font-semibold text-slate-200 hover:bg-slate-700 transition-colors cursor-pointer"
          >
            Закрыть
          </button>
        </div>
      </div>
      <canvas ref={canvasRef} className="hidden" />
    </div>
  );
};

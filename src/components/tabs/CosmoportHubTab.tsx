import React, { useState, useEffect, useCallback } from 'react';
import {
  Radio,
  Server,
  Activity,
  Sliders,
  Terminal,
  RefreshCw,
  Power,
  Play,
  Pause,
  Send,
  Binary,
  CheckCircle2,
  AlertTriangle,
  Copy,
  Check,
  Eye,
  EyeOff,
  Zap,
} from 'lucide-react';
import {
  cosmoportHub,
  DataTransformer,
  type PortDefinition,
  type ConnectionSession,
} from '../../services/cosmoport';
import { cosmoportConfig } from '../../config/cosmoportConfig';
import { logger, type StructuredLogEntry } from '../../services/logger';
import type { LogLevel } from '../../config/types';

export const CosmoportHubTab: React.FC = () => {
  const [activeSection, setActiveSection] = useState<'ports' | 'transform' | 'config' | 'logs'>(
    'ports',
  );
  const [ports, setPorts] = useState<PortDefinition[]>([]);
  const [sessions, setSessions] = useState<ConnectionSession[]>([]);
  const [logs, setLogs] = useState<StructuredLogEntry[]>([]);
  const [logFilter, setLogFilter] = useState<'all' | LogLevel>('all');

  // Config view state
  const [configFormat, setConfigFormat] = useState<'yaml' | 'json'>('yaml');
  const [showMasked, setShowMasked] = useState(true);
  const [configText, setConfigText] = useState('');
  const [configCopied, setConfigCopied] = useState(false);
  const [configError, setConfigError] = useState<string | null>(null);

  // Connection testing state
  const [selectedPortId, setSelectedPortId] = useState<string>('port_uhf_downlink');
  const [remoteEndpoint, setRemoteEndpoint] = useState('cubesat-prosto-3u');
  const [connToken, setConnToken] = useState('');
  const [isConnecting, setIsConnecting] = useState(false);
  const [telecommandPayload, setTelecommandPayload] = useState('CMD_ADCS_DETUMBLE_START');

  // Data Transformation Lab state
  const [rawVoltage, setRawVoltage] = useState(2730);
  const [rawTemp, setRawTemp] = useState(2047);
  const [rawCurrent, setRawCurrent] = useState(1365);
  const [rawSolar, setRawSolar] = useState(2800);
  const [dopplerVelocity, setDopplerVelocity] = useState(7.5);
  const [crcInputText, setCrcInputText] = useState('COSMOPORT_ORBITAL_FRAME_01');

  useEffect(() => {
    // Initial fetch
    refreshPorts();
    setLogs(logger.getLogs(100));

    // Subscribe to logger
    const unsubscribe = logger.subscribe((entry) => {
      setLogs((prev) => [...prev.slice(-150), entry]);
    });

    return () => unsubscribe();
  }, []);

  const updateConfigDisplay = useCallback(() => {
    if (configFormat === 'yaml') {
      setConfigText(cosmoportConfig.toYaml(showMasked));
    } else {
      setConfigText(cosmoportConfig.toJson(showMasked));
    }
  }, [configFormat, showMasked]);

  useEffect(() => {
    updateConfigDisplay();
  }, [updateConfigDisplay]);

  const refreshPorts = () => {
    setPorts(cosmoportHub.portManager.listPorts());
    setSessions(cosmoportHub.connectionManager.listSessions());
  };

  const handleOpenPort = async (portId: string) => {
    try {
      await cosmoportHub.portManager.openPort(portId);
      refreshPorts();
    } catch (err) {
      logger.logError(err instanceof Error ? err : String(err), 'port.open');
    }
  };

  const handleClosePort = async (portId: string) => {
    try {
      await cosmoportHub.portManager.closePort(portId);
      refreshPorts();
    } catch (err) {
      logger.logError(err instanceof Error ? err : String(err), 'port.close');
    }
  };

  const handlePausePort = (portId: string) => {
    cosmoportHub.portManager.pausePort(portId);
    refreshPorts();
  };

  const handleResumePort = (portId: string) => {
    cosmoportHub.portManager.resumePort(portId);
    refreshPorts();
  };

  const handleConnectTest = async () => {
    setIsConnecting(true);
    try {
      await cosmoportHub.connectionManager.connect(selectedPortId, remoteEndpoint, {
        simulateLatencyMs: 15,
        credentials: connToken ? { token: connToken } : undefined,
      });
      refreshPorts();
    } catch (err) {
      logger.logError(err instanceof Error ? err : String(err), 'connection.test');
    } finally {
      setIsConnecting(false);
    }
  };

  const handleSendTelecommand = async (sessionId: string) => {
    try {
      await cosmoportHub.connectionManager.sendData(sessionId, telecommandPayload);
      refreshPorts();
    } catch (err) {
      logger.logError(err instanceof Error ? err : String(err), 'telecommand.send');
    }
  };

  const handleDisconnect = async (sessionId: string) => {
    try {
      await cosmoportHub.connectionManager.disconnect(sessionId, 'Сессия завершена оператором');
      refreshPorts();
    } catch (err) {
      logger.logError(err instanceof Error ? err : String(err), 'connection.disconnect');
    }
  };

  const handleApplyConfig = () => {
    setConfigError(null);
    try {
      if (configFormat === 'yaml') {
        cosmoportConfig.loadFromYaml(configText);
      } else {
        cosmoportConfig.loadFromJson(configText);
      }
      cosmoportHub.initializeDefaultPorts();
      refreshPorts();
      logger.info('Конфигурация Cosmoport успешно обновлена оператором');
    } catch (err) {
      setConfigError(err instanceof Error ? err.message : 'Ошибка применения конфигурации');
    }
  };

  const handleResetConfig = () => {
    cosmoportConfig.resetToDefaults();
    cosmoportHub.initializeDefaultPorts();
    refreshPorts();
    updateConfigDisplay();
    logger.info('Конфигурация сброшена к заводским настройкам');
  };

  const handleCopyConfig = () => {
    navigator.clipboard.writeText(configText);
    setConfigCopied(true);
    setTimeout(() => setConfigCopied(false), 2000);
  };

  // Calculated values for transformations
  const calculatedEng = DataTransformer.transformAdcToEngineeringUnits({
    rawVoltage,
    rawCurrent,
    rawTemp,
    rawSolarPower: rawSolar,
    rawGyroX: 2047,
    rawGyroY: 2047,
    rawGyroZ: 2047,
    rawMagX: 2047,
    rawMagY: 2047,
    rawMagZ: 2047,
    rawRssi: 150,
  });

  const dopplerResult = DataTransformer.calculateDopplerShift(437425000, dopplerVelocity);
  const crc16Value = DataTransformer.calculateCrc16(new TextEncoder().encode(crcInputText));

  const filteredLogs = logs.filter((l) => logFilter === 'all' || l.level === logFilter);

  return (
    <div className="mx-auto max-w-7xl px-4 py-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 rounded-xl border border-cyan-800/40 bg-slate-900/60 p-6 backdrop-blur-md">
        <div>
          <div className="flex items-center gap-3">
            <div className="rounded-lg bg-cyan-500/10 p-2 text-cyan-400 border border-cyan-500/30">
              <Server className="h-6 w-6" />
            </div>
            <div>
              <h1 className="text-2xl font-bold tracking-tight text-white flex items-center gap-2">
                Управление портами и шлюзом Cosmoport
                <span className="rounded-full bg-cyan-500/20 px-2.5 py-0.5 text-xs font-mono font-semibold text-cyan-300 border border-cyan-500/30">
                  v0.1.0-PRO
                </span>
              </h1>
              <p className="text-sm text-slate-400">
                Конфигурация портов связи, активные соединения, структурированные логи (Pino) и
                преобразование телеметрии
              </p>
            </div>
          </div>
        </div>

        {/* Section Tabs */}
        <div className="flex flex-wrap gap-2 border border-slate-800 rounded-lg p-1 bg-slate-950/80">
          <button
            onClick={() => setActiveSection('ports')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-all ${
              activeSection === 'ports'
                ? 'bg-cyan-500 text-slate-950 font-semibold shadow'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Radio className="h-4 w-4" />
            Порты и связи ({ports.length})
          </button>
          <button
            onClick={() => setActiveSection('transform')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-all ${
              activeSection === 'transform'
                ? 'bg-cyan-500 text-slate-950 font-semibold shadow'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Binary className="h-4 w-4" />
            Преобразование данных
          </button>
          <button
            onClick={() => setActiveSection('config')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-all ${
              activeSection === 'config'
                ? 'bg-cyan-500 text-slate-950 font-semibold shadow'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Sliders className="h-4 w-4" />
            Конфигурация
          </button>
          <button
            onClick={() => setActiveSection('logs')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-all ${
              activeSection === 'logs'
                ? 'bg-cyan-500 text-slate-950 font-semibold shadow'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Terminal className="h-4 w-4" />
            Логи Pino ({logs.length})
          </button>
        </div>
      </div>

      {/* SECTION 1: PORTS AND CONNECTIONS */}
      {activeSection === 'ports' && (
        <div className="space-y-6">
          {/* Ports List */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {ports.map((port) => {
              const isListening = port.state === 'LISTENING';
              const isConnected = port.state === 'CONNECTED';
              const isClosed = port.state === 'CLOSED';
              const isPaused = port.state === 'PAUSED';

              return (
                <div
                  key={port.id}
                  className={`rounded-xl border p-4 transition-all flex flex-col justify-between ${
                    isConnected
                      ? 'border-emerald-500/50 bg-emerald-950/20'
                      : isListening
                        ? 'border-cyan-500/50 bg-cyan-950/20'
                        : isPaused
                          ? 'border-amber-500/50 bg-amber-950/20'
                          : 'border-slate-800 bg-slate-900/40 opacity-80'
                  }`}
                >
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-mono text-xs font-bold text-cyan-400">
                        :{port.portNumber}
                      </span>
                      <span
                        className={`px-2 py-0.5 rounded text-[10px] font-mono font-semibold uppercase ${
                          isConnected
                            ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                            : isListening
                              ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/30'
                              : isPaused
                                ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                                : 'bg-slate-800 text-slate-400 border border-slate-700'
                        }`}
                      >
                        {port.state}
                      </span>
                    </div>

                    <h3 className="font-semibold text-white text-sm leading-tight mb-1">
                      {port.name}
                    </h3>
                    <p className="text-xs text-slate-400 line-clamp-2 mb-3">{port.description}</p>

                    <div className="space-y-1 text-xs font-mono text-slate-400 mb-4 bg-slate-950/60 p-2 rounded border border-slate-900">
                      <div className="flex justify-between">
                        <span>Протокол:</span>
                        <span className="text-slate-200">{port.protocol}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Соединения:</span>
                        <span className="text-slate-200">
                          {port.currentConnections} / {port.maxConnections}
                        </span>
                      </div>
                      {port.baudRate && (
                        <div className="flex justify-between">
                          <span>Скорость:</span>
                          <span className="text-slate-200">{port.baudRate} бод</span>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5 pt-2 border-t border-slate-800/80">
                    {isClosed ? (
                      <button
                        onClick={() => handleOpenPort(port.id)}
                        className="w-full flex items-center justify-center gap-1.5 py-1.5 rounded bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-medium transition-colors"
                      >
                        <Power className="h-3.5 w-3.5" />
                        Открыть порт
                      </button>
                    ) : (
                      <>
                        <button
                          onClick={() => handleClosePort(port.id)}
                          className="flex-1 flex items-center justify-center gap-1 py-1 rounded bg-rose-950/50 hover:bg-rose-900/60 text-rose-300 border border-rose-800/50 text-xs transition-colors"
                        >
                          <Power className="h-3 w-3" />
                          Закрыть
                        </button>
                        {isPaused ? (
                          <button
                            onClick={() => handleResumePort(port.id)}
                            className="flex-1 flex items-center justify-center gap-1 py-1 rounded bg-amber-950/50 hover:bg-amber-900/60 text-amber-300 border border-amber-800/50 text-xs transition-colors"
                          >
                            <Play className="h-3 w-3" />
                            Возобновить
                          </button>
                        ) : (
                          <button
                            onClick={() => handlePausePort(port.id)}
                            className="flex-1 flex items-center justify-center gap-1 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs transition-colors"
                          >
                            <Pause className="h-3 w-3" />
                            Пауза
                          </button>
                        )}
                      </>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Connection Test Gateway */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="rounded-xl border border-slate-800 bg-slate-900/50 p-5 space-y-4">
              <h2 className="text-base font-semibold text-white flex items-center gap-2">
                <Zap className="h-4 w-4 text-cyan-400" />
                Тестирование установления соединения
              </h2>
              <div className="space-y-3">
                <div>
                  <label
                    htmlFor="select-destination-port"
                    className="block text-xs font-medium text-slate-400 mb-1"
                  >
                    Порт назначения:
                  </label>
                  <select
                    id="select-destination-port"
                    value={selectedPortId}
                    onChange={(e) => setSelectedPortId(e.target.value)}
                    className="w-full rounded bg-slate-950 border border-slate-800 px-3 py-1.5 text-xs text-white focus:border-cyan-500 focus:outline-none"
                  >
                    {ports.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.name} (:{p.portNumber}) [{p.state}]
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label
                    htmlFor="input-remote-endpoint"
                    className="block text-xs font-medium text-slate-400 mb-1"
                  >
                    Удаленный эндпоинт (КубСат / Станция):
                  </label>
                  <input
                    id="input-remote-endpoint"
                    type="text"
                    value={remoteEndpoint}
                    onChange={(e) => setRemoteEndpoint(e.target.value)}
                    className="w-full rounded bg-slate-950 border border-slate-800 px-3 py-1.5 text-xs text-white focus:border-cyan-500 focus:outline-none font-mono"
                    placeholder="cubesat-prosto-3u"
                  />
                </div>

                <div>
                  <label
                    htmlFor="input-auth-token"
                    className="block text-xs font-medium text-slate-400 mb-1"
                  >
                    Токен авторизации (опционально):
                  </label>
                  <input
                    id="input-auth-token"
                    type="password"
                    value={connToken}
                    onChange={(e) => setConnToken(e.target.value)}
                    className="w-full rounded bg-slate-950 border border-slate-800 px-3 py-1.5 text-xs text-white focus:border-cyan-500 focus:outline-none font-mono"
                    placeholder="Оставьте пустым для открытого теста"
                  />
                </div>

                <button
                  onClick={handleConnectTest}
                  disabled={isConnecting}
                  className="w-full flex items-center justify-center gap-2 rounded bg-cyan-600 hover:bg-cyan-500 disabled:opacity-50 text-white px-4 py-2 text-xs font-semibold transition-colors"
                >
                  <Activity className={`h-4 w-4 ${isConnecting ? 'animate-spin' : ''}`} />
                  {isConnecting ? 'Выполняется Handshake...' : 'Установить сессию связи'}
                </button>
              </div>
            </div>

            {/* Active Sessions Monitor */}
            <div className="lg:col-span-2 rounded-xl border border-slate-800 bg-slate-900/50 p-5 space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-base font-semibold text-white flex items-center gap-2">
                  <Activity className="h-4 w-4 text-emerald-400" />
                  Активные сессии связи ({sessions.length})
                </h2>
                <button
                  onClick={refreshPorts}
                  className="text-slate-400 hover:text-white p-1 rounded hover:bg-slate-800 transition-colors"
                  title="Обновить"
                >
                  <RefreshCw className="h-4 w-4" />
                </button>
              </div>

              {sessions.length === 0 ? (
                <div className="p-8 text-center border border-dashed border-slate-800 rounded-lg text-slate-500 text-xs">
                  Нет активных соединений. Запустите тест подключения слева.
                </div>
              ) : (
                <div className="space-y-3 max-h-72 overflow-y-auto pr-1">
                  {sessions.map((s) => (
                    <div
                      key={s.id}
                      className="rounded-lg border border-slate-800 bg-slate-950/80 p-3 flex flex-col md:flex-row md:items-center justify-between gap-3 text-xs"
                    >
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="font-mono font-bold text-cyan-300">
                            {s.remoteEndpoint}
                          </span>
                          <span className="px-1.5 py-0.2 rounded text-[10px] bg-emerald-500/20 text-emerald-400 font-mono">
                            {s.state}
                          </span>
                          <span className="text-slate-500 font-mono text-[11px]">[{s.id}]</span>
                        </div>
                        <div className="flex flex-wrap gap-x-4 text-slate-400 font-mono text-[11px]">
                          <span>RTT: {s.latencyMs}ms</span>
                          <span>SNR: {s.snrDb} dB</span>
                          <span>
                            TX: {s.bytesSent} B ({s.packetsSent} пкт)
                          </span>
                          <span>
                            RX: {s.bytesReceived} B ({s.packetsReceived} пкт)
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => handleSendTelecommand(s.id)}
                          className="flex items-center gap-1 rounded bg-slate-800 hover:bg-slate-700 text-cyan-300 px-2.5 py-1 text-xs transition-colors"
                          title="Отправить телекоманду"
                        >
                          <Send className="h-3 w-3" />
                          Команда
                        </button>
                        <button
                          onClick={() => handleDisconnect(s.id)}
                          className="flex items-center gap-1 rounded bg-rose-950/60 hover:bg-rose-900/80 text-rose-300 px-2.5 py-1 text-xs border border-rose-800/40 transition-colors"
                        >
                          Отключить
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Quick Telecommand input */}
              <div className="pt-2 border-t border-slate-800 flex items-center gap-2">
                <span className="text-xs text-slate-400">Пакет телекоманды:</span>
                <input
                  type="text"
                  value={telecommandPayload}
                  onChange={(e) => setTelecommandPayload(e.target.value)}
                  className="flex-1 rounded bg-slate-950 border border-slate-800 px-3 py-1 text-xs text-white font-mono focus:border-cyan-500 focus:outline-none"
                />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* SECTION 2: DATA TRANSFORMATION LAB */}
      {activeSection === 'transform' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* ADC to Engineering Units */}
            <div className="lg:col-span-2 rounded-xl border border-slate-800 bg-slate-900/50 p-5 space-y-4">
              <h2 className="text-base font-semibold text-white flex items-center gap-2">
                <Binary className="h-4 w-4 text-cyan-400" />
                Трансформация сырых 12-битных ADC отсчетов в физические величины
              </h2>
              <p className="text-xs text-slate-400">
                Моделирование бортовых датчиков КубСата: напряжение шины, ток, температура батарей и
                солнечная генерация.
              </p>

              {/* Sliders */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
                <div className="space-y-1">
                  <div className="flex justify-between text-xs">
                    <span className="text-slate-400">ADC Напряжение (0..4095):</span>
                    <span className="font-mono text-cyan-300">{rawVoltage}</span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="4095"
                    value={rawVoltage}
                    onChange={(e) => setRawVoltage(Number(e.target.value))}
                    className="w-full accent-cyan-500"
                  />
                </div>

                <div className="space-y-1">
                  <div className="flex justify-between text-xs">
                    <span className="text-slate-400">ADC Ток потребления (0..4095):</span>
                    <span className="font-mono text-cyan-300">{rawCurrent}</span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="4095"
                    value={rawCurrent}
                    onChange={(e) => setRawCurrent(Number(e.target.value))}
                    className="w-full accent-cyan-500"
                  />
                </div>

                <div className="space-y-1">
                  <div className="flex justify-between text-xs">
                    <span className="text-slate-400">ADC Температура (-40..+85 °C):</span>
                    <span className="font-mono text-cyan-300">{rawTemp}</span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="4095"
                    value={rawTemp}
                    onChange={(e) => setRawTemp(Number(e.target.value))}
                    className="w-full accent-cyan-500"
                  />
                </div>

                <div className="space-y-1">
                  <div className="flex justify-between text-xs">
                    <span className="text-slate-400">ADC Солнечная мощность (0..28.5 Вт):</span>
                    <span className="font-mono text-cyan-300">{rawSolar}</span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="4095"
                    value={rawSolar}
                    onChange={(e) => setRawSolar(Number(e.target.value))}
                    className="w-full accent-cyan-500"
                  />
                </div>
              </div>

              {/* Transformed Result Cards */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-4 border-t border-slate-800">
                <div className="p-3 rounded-lg bg-slate-950/80 border border-slate-800">
                  <span className="text-[10px] text-slate-500 uppercase block font-semibold">
                    Напряжение шины
                  </span>
                  <span className="text-lg font-bold font-mono text-cyan-400">
                    {calculatedEng.busVoltageV} В
                  </span>
                </div>
                <div className="p-3 rounded-lg bg-slate-950/80 border border-slate-800">
                  <span className="text-[10px] text-slate-500 uppercase block font-semibold">
                    Ток системы
                  </span>
                  <span className="text-lg font-bold font-mono text-cyan-400">
                    {calculatedEng.busCurrentA} А
                  </span>
                </div>
                <div className="p-3 rounded-lg bg-slate-950/80 border border-slate-800">
                  <span className="text-[10px] text-slate-500 uppercase block font-semibold">
                    Температура АКБ
                  </span>
                  <span className="text-lg font-bold font-mono text-cyan-400">
                    {calculatedEng.batteryTempC} °C
                  </span>
                </div>
                <div className="p-3 rounded-lg bg-slate-950/80 border border-slate-800">
                  <span className="text-[10px] text-slate-500 uppercase block font-semibold">
                    Генерация СБ
                  </span>
                  <span className="text-lg font-bold font-mono text-cyan-400">
                    {calculatedEng.solarPowerW} Вт
                  </span>
                </div>
              </div>

              {/* Status Flags */}
              <div className="flex flex-wrap gap-2 pt-2">
                <span
                  className={`px-2 py-1 rounded text-xs font-mono flex items-center gap-1 ${
                    calculatedEng.payloadStatus === 'OK'
                      ? 'bg-emerald-500/20 text-emerald-300'
                      : 'bg-rose-500/20 text-rose-300'
                  }`}
                >
                  Статус ПН: {calculatedEng.payloadStatus}
                </span>
                <span className="px-2 py-1 rounded text-xs font-mono bg-slate-800 text-slate-300">
                  Антенна: {calculatedEng.isAntennaDeployed ? 'Развернута' : 'Сложена'}
                </span>
                <span className="px-2 py-1 rounded text-xs font-mono bg-slate-800 text-slate-300">
                  Режим: {calculatedEng.lowPowerMode ? 'Энергосбережение' : 'Номинал'}
                </span>
              </div>
            </div>

            {/* Doppler Shift & CRC16 Tools */}
            <div className="space-y-6">
              {/* Doppler */}
              <div className="rounded-xl border border-slate-800 bg-slate-900/50 p-5 space-y-3">
                <h3 className="text-sm font-semibold text-white flex items-center gap-2">
                  <Radio className="h-4 w-4 text-cyan-400" />
                  Орбитальный эффект Доплера
                </h3>
                <div className="space-y-1">
                  <div className="flex justify-between text-xs">
                    <span className="text-slate-400">Радиальная скорость:</span>
                    <span className="font-mono text-cyan-300">{dopplerVelocity} км/с</span>
                  </div>
                  <input
                    type="range"
                    min="-8"
                    max="8"
                    step="0.5"
                    value={dopplerVelocity}
                    onChange={(e) => setDopplerVelocity(Number(e.target.value))}
                    className="w-full accent-cyan-500"
                  />
                </div>
                <div className="p-3 rounded bg-slate-950 font-mono text-xs space-y-1 border border-slate-900">
                  <div className="flex justify-between">
                    <span className="text-slate-500">Несущая (номинал):</span>
                    <span className="text-slate-200">437.425 МГц</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Доплеровский сдвиг:</span>
                    <span
                      className={dopplerResult.shiftHz >= 0 ? 'text-emerald-400' : 'text-amber-400'}
                    >
                      {dopplerResult.shiftHz >= 0 ? '+' : ''}
                      {dopplerResult.shiftKHz} кГц
                    </span>
                  </div>
                  <div className="flex justify-between font-bold pt-1 border-t border-slate-800">
                    <span className="text-cyan-400">Приемная частота:</span>
                    <span className="text-cyan-400">
                      {(dopplerResult.observedFreqHz / 1e6).toFixed(4)} МГц
                    </span>
                  </div>
                </div>
              </div>

              {/* CRC16 */}
              <div className="rounded-xl border border-slate-800 bg-slate-900/50 p-5 space-y-3">
                <h3 className="text-sm font-semibold text-white flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-emerald-400" />
                  Контрольная сумма CRC-16-CCITT
                </h3>
                <input
                  type="text"
                  value={crcInputText}
                  onChange={(e) => setCrcInputText(e.target.value)}
                  className="w-full rounded bg-slate-950 border border-slate-800 px-3 py-1.5 text-xs text-white font-mono focus:border-cyan-500 focus:outline-none"
                  placeholder="Введите текст для расчета контрольной суммы"
                />
                <div className="p-3 rounded bg-slate-950 font-mono text-xs flex justify-between items-center border border-slate-900">
                  <span className="text-slate-500">Контрольная сумма:</span>
                  <span className="text-emerald-400 font-bold">
                    0x{crc16Value.toString(16).toUpperCase().padStart(4, '0')}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* SECTION 3: CONFIGURATION MANAGEMENT */}
      {activeSection === 'config' && (
        <div className="space-y-4">
          <div className="rounded-xl border border-slate-800 bg-slate-900/50 p-5 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h2 className="text-base font-semibold text-white flex items-center gap-2">
                  <Sliders className="h-4 w-4 text-cyan-400" />
                  Система управления конфигурацией Cosmoport
                </h2>
                <p className="text-xs text-slate-400">
                  Загрузка и переопределение параметров портов, таймаутов и учетных данных из
                  YAML/JSON и переменных окружения
                </p>
              </div>

              <div className="flex items-center gap-2">
                <div className="flex rounded border border-slate-800 p-0.5 bg-slate-950">
                  <button
                    onClick={() => setConfigFormat('yaml')}
                    className={`px-2.5 py-1 text-xs rounded font-mono ${
                      configFormat === 'yaml' ? 'bg-cyan-600 text-white' : 'text-slate-400'
                    }`}
                  >
                    YAML
                  </button>
                  <button
                    onClick={() => setConfigFormat('json')}
                    className={`px-2.5 py-1 text-xs rounded font-mono ${
                      configFormat === 'json' ? 'bg-cyan-600 text-white' : 'text-slate-400'
                    }`}
                  >
                    JSON
                  </button>
                </div>

                <button
                  onClick={() => setShowMasked(!showMasked)}
                  className="flex items-center gap-1.5 px-3 py-1 text-xs rounded bg-slate-800 hover:bg-slate-700 text-slate-200 transition-colors"
                  title="Маскировать секреты"
                >
                  {showMasked ? (
                    <EyeOff className="h-3.5 w-3.5" />
                  ) : (
                    <Eye className="h-3.5 w-3.5" />
                  )}
                  {showMasked ? 'Секреты скрыты' : 'Секреты открыты'}
                </button>

                <button
                  onClick={handleCopyConfig}
                  className="flex items-center gap-1.5 px-3 py-1 text-xs rounded bg-slate-800 hover:bg-slate-700 text-slate-200 transition-colors"
                >
                  {configCopied ? (
                    <Check className="h-3.5 w-3.5 text-emerald-400" />
                  ) : (
                    <Copy className="h-3.5 w-3.5" />
                  )}
                  Копировать
                </button>
              </div>
            </div>

            {configError && (
              <div className="p-3 rounded-lg bg-rose-950/50 border border-rose-800 text-rose-300 text-xs flex items-center gap-2">
                <AlertTriangle className="h-4 w-4 shrink-0" />
                <span>{configError}</span>
              </div>
            )}

            <div className="relative">
              <textarea
                value={configText}
                onChange={(e) => setConfigText(e.target.value)}
                rows={16}
                className="w-full rounded-lg bg-slate-950 border border-slate-800 p-4 font-mono text-xs text-cyan-300 focus:border-cyan-500 focus:outline-none leading-relaxed"
                spellCheck={false}
              />
            </div>

            <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
              <div className="text-xs text-slate-500">
                Поддерживаются переменные среды:{' '}
                <code className="text-slate-400 font-mono">COSMOPORT_PORT</code>,{' '}
                <code className="text-slate-400 font-mono">COSMOPORT_TIMEOUT_MS</code>,{' '}
                <code className="text-slate-400 font-mono">COSMOPORT_API_KEY</code>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={handleResetConfig}
                  className="px-3 py-1.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs transition-colors"
                >
                  Сбросить к умолчанию
                </button>
                <button
                  onClick={handleApplyConfig}
                  className="px-4 py-1.5 rounded bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-semibold shadow transition-colors"
                >
                  Применить конфигурацию
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* SECTION 4: STRUCTURED PINO LOGS */}
      {activeSection === 'logs' && (
        <div className="rounded-xl border border-slate-800 bg-slate-900/50 p-5 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h2 className="text-base font-semibold text-white flex items-center gap-2">
                <Terminal className="h-4 w-4 text-cyan-400" />
                Структурированный поток логов (Pino Logger)
              </h2>
              <p className="text-xs text-slate-400">
                Фиксация событий жизненного цикла, соединений, передачи данных и перехваченных
                исключений
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <div className="flex rounded border border-slate-800 p-0.5 bg-slate-950 text-xs">
                {(['all', 'debug', 'info', 'warn', 'error'] as const).map((lvl) => (
                  <button
                    key={lvl}
                    onClick={() => setLogFilter(lvl)}
                    className={`px-2.5 py-0.5 rounded capitalize font-mono text-[11px] ${
                      logFilter === lvl
                        ? 'bg-cyan-600 text-white font-bold'
                        : 'text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    {lvl}
                  </button>
                ))}
              </div>

              <button
                onClick={() => {
                  logger.info('Тестовое информационное событие оператора');
                  logger.warn('Тестовое предупреждение орбитального канала');
                  logger.error('Тестовая ошибка шлюза', new Error('Simulated gateway fault'));
                }}
                className="px-2.5 py-1 text-xs rounded bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors"
              >
                + Тест-лог
              </button>

              <button
                onClick={() => {
                  logger.clearBuffer();
                  setLogs([]);
                }}
                className="px-2.5 py-1 text-xs rounded bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors"
              >
                Очистить
              </button>
            </div>
          </div>

          {/* Logs List */}
          <div className="rounded-lg bg-slate-950 border border-slate-800 p-3 h-96 overflow-y-auto space-y-2 font-mono text-xs">
            {filteredLogs.length === 0 ? (
              <div className="p-8 text-center text-slate-600">
                Нет записей в журнале для выбранного уровня фильтра.
              </div>
            ) : (
              filteredLogs.map((entry) => {
                const isError = entry.level === 'error';
                const isWarn = entry.level === 'warn';
                const isInfo = entry.level === 'info';

                return (
                  <div
                    key={entry.id}
                    className={`p-2 rounded border flex flex-col gap-1 transition-all ${
                      isError
                        ? 'border-rose-900/60 bg-rose-950/20 text-rose-200'
                        : isWarn
                          ? 'border-amber-900/60 bg-amber-950/20 text-amber-200'
                          : isInfo
                            ? 'border-cyan-900/50 bg-cyan-950/10 text-cyan-200'
                            : 'border-slate-800 bg-slate-900/40 text-slate-300'
                    }`}
                  >
                    <div className="flex items-center justify-between text-[11px]">
                      <div className="flex items-center gap-2">
                        <span
                          className={`px-1.5 py-0.2 rounded font-bold uppercase text-[10px] ${
                            isError
                              ? 'bg-rose-500/20 text-rose-400'
                              : isWarn
                                ? 'bg-amber-500/20 text-amber-400'
                                : isInfo
                                  ? 'bg-cyan-500/20 text-cyan-400'
                                  : 'bg-slate-800 text-slate-400'
                          }`}
                        >
                          {entry.level}
                        </span>
                        <span className="font-semibold text-white">{entry.event}</span>
                      </div>
                      <span className="text-slate-500 text-[10px]">
                        {new Date(entry.time).toLocaleTimeString()}
                      </span>
                    </div>

                    <div className="text-slate-200 text-xs">{entry.message}</div>

                    {entry.details && Object.keys(entry.details).length > 0 && (
                      <pre className="text-[10px] text-slate-400 bg-slate-950/90 p-1.5 rounded border border-slate-900 overflow-x-auto">
                        {JSON.stringify(entry.details, null, 2)}
                      </pre>
                    )}

                    {entry.error && (
                      <div className="text-[10px] text-rose-400 bg-rose-950/40 p-1.5 rounded border border-rose-900">
                        <strong>{entry.error.name}:</strong> {entry.error.message}
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
};

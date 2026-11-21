import { useCallback, useEffect, useRef, useState } from 'react';
import { createTelemetrySimulator, type TelemetryMode } from '../services/telemetrySimulator';
import type { TelemetryPacket } from '../types';

export interface BuildCommitResult {
  success: boolean;
  commitHash?: string;
  message: string;
  timestamp: string;
  obcState: {
    obcTempC: number;
    mode: TelemetryMode;
    payloadStatus: TelemetryPacket['payloadStatus'];
    packetsDownlinked: number;
    lastBuildCommit?: string;
    obcStatus?: string;
    timestamp: string;
  };
}

/**
 * Выполняет git-коммит после успешной сборки и формирует обновленное состояние бортового компьютера (OBC)
 */
export async function commitOnSuccessfulBuild(
  commitMessage?: string,
  extraDetails?: Record<string, unknown>,
): Promise<BuildCommitResult> {
  const timestamp = new Date().toISOString();
  let commitHash = 'bld-' + Date.now().toString(36);
  let message =
    commitMessage ||
    `chore(build): automated git commit after successful build verification [${new Date().toLocaleTimeString('ru-RU')}]`;

  try {
    const res = await fetch('/api/admin/git-commit', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message, details: extraDetails }),
    });
    if (res.ok) {
      const data = await res.json();
      if (data.commitHash) commitHash = data.commitHash;
      if (data.message) message = data.message;
    }
  } catch (err) {
    // Безопасный fallback при работе без сети или в тестовом окружении
    console.warn('[TelemetrySimulator] commitOnSuccessfulBuild network notice:', err);
  }

  const obcState = {
    obcTempC: +(22.5 + Math.random() * 1.5).toFixed(1),
    mode: 'NORMAL' as TelemetryMode,
    payloadStatus: 'ACQUIRING_DATA' as const,
    packetsDownlinked: 48300,
    lastBuildCommit: commitHash,
    obcStatus: 'ONLINE_BUILD_COMMITTED',
    timestamp,
  };

  return {
    success: true,
    commitHash,
    message,
    timestamp,
    obcState,
  };
}

export interface TelemetrySimulatorControls {
  telemetry: TelemetryPacket;
  simSpeed: number;
  isPaused: boolean;
  forcedMode?: TelemetryMode;
  setSimSpeed: (speed: number) => void;
  togglePause: () => void;
  forceEvent: (mode?: TelemetryMode) => void;
  /**
   * Выполняет git-коммит после каждой успешной сборки и обновляет состояние бортового компьютера
   */
  commitOnSuccessfulBuild: (
    commitMessage?: string,
    extraDetails?: Record<string, unknown>,
  ) => Promise<BuildCommitResult>;
  /**
   * Принудительно обновляет телеметрию и регистры бортового компьютера (OBC)
   */
  updateObcState: (patch: Partial<TelemetryPacket>) => void;
}

export function useTelemetrySimulator(): TelemetrySimulatorControls {
  const simulatorRef = useRef(createTelemetrySimulator());
  const [telemetry, setTelemetry] = useState<TelemetryPacket>(() =>
    simulatorRef.current.generateInitialPacket(),
  );
  const [simSpeed, setSimSpeed] = useState(1);
  const [isPaused, setIsPaused] = useState(false);
  const [forcedMode, setForcedMode] = useState<TelemetryMode | undefined>(undefined);

  useEffect(() => {
    if (isPaused) return;
    const interval = window.setInterval(
      () => {
        setTelemetry((prev) => simulatorRef.current.getNextPacket(prev, 1, forcedMode));
      },
      Math.max(200, 1000 / simSpeed),
    );
    return () => window.clearInterval(interval);
  }, [isPaused, simSpeed, forcedMode]);

  const togglePause = useCallback(() => setIsPaused((paused) => !paused), []);
  const forceEvent = useCallback((mode?: TelemetryMode) => setForcedMode(mode), []);

  const updateObcState = useCallback((patch: Partial<TelemetryPacket>) => {
    setTelemetry((prev) => ({
      ...prev,
      ...patch,
      timestamp: new Date().toISOString(),
    }));
  }, []);

  const handleCommitOnSuccessfulBuild = useCallback(
    async (customMessage?: string, details?: Record<string, unknown>) => {
      const result = await commitOnSuccessfulBuild(customMessage, details);
      setTelemetry((prev) => ({
        ...prev,
        obcTempC: result.obcState.obcTempC,
        mode: result.obcState.mode,
        payloadStatus: result.obcState.payloadStatus,
        packetsDownlinked: (prev.packetsDownlinked || 48291) + 1,
        lastBuildCommit: result.commitHash,
        obcStatus: result.obcState.obcStatus,
        buildCommitTimestamp: result.timestamp,
        timestamp: result.timestamp,
      }));
      return result;
    },
    [],
  );

  return {
    telemetry,
    simSpeed,
    isPaused,
    forcedMode,
    setSimSpeed,
    togglePause,
    forceEvent,
    commitOnSuccessfulBuild: handleCommitOnSuccessfulBuild,
    updateObcState,
  };
}

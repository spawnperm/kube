/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import QRCode from 'qrcode';
import { Smartphone, QrCode, Radio, ArrowRight, Check, Copy } from 'lucide-react';
import type { Team, ConnectedMobileDevice } from '../types';
import { createMobileAuthPayload, serializeMobileAuthPayload } from '../domain/mobileAuth';

export interface TeamMobileSyncWidgetProps {
  team: Team;
  connectedDevices: ConnectedMobileDevice[];
  onOpenModal: () => void;
}

export const TeamMobileSyncWidget: React.FC<TeamMobileSyncWidgetProps> = ({
  team,
  connectedDevices,
  onOpenModal,
}) => {
  const [miniQrUrl, setMiniQrUrl] = useState<string>('');
  const [authPayload] = useState(() => createMobileAuthPayload(team));
  const [copiedCode, setCopiedCode] = useState(false);

  useEffect(() => {
    let isMounted = true;
    QRCode.toDataURL(serializeMobileAuthPayload(authPayload), {
      width: 140,
      margin: 1,
      color: {
        dark: '#22d3ee', // cyan-400
        light: '#030712', // slate-950
      },
    }).then((url) => {
      if (isMounted) setMiniQrUrl(url);
    });

    return () => {
      isMounted = false;
    };
  }, [authPayload]);

  const handleCopyCode = async (e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      await navigator.clipboard.writeText(authPayload.authCode);
      setCopiedCode(true);
      setTimeout(() => setCopiedCode(false), 2000);
    } catch {
      // fallback
    }
  };

  return (
    <div className="relative overflow-hidden rounded-2xl border border-cyan-500/25 bg-gradient-to-br from-slate-950 via-slate-900 to-indigo-950/40 p-5 shadow-xl">
      <div className="absolute -right-10 -bottom-10 h-40 w-40 rounded-full bg-cyan-500/10 blur-2xl pointer-events-none" />

      <div className="flex flex-col lg:flex-row items-center justify-between gap-5">
        {/* Left: Info & Description */}
        <div className="flex-1 space-y-3">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-cyan-500/20 text-cyan-300 border border-cyan-500/40">
              <Smartphone className="h-4 w-4" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-bold text-white">
                  Синхронизация мобильного приложения команды
                </h3>
                <span className="rounded-full bg-emerald-500/15 px-2 py-0.2 text-[10px] font-semibold text-emerald-300 border border-emerald-500/30">
                  Шлюз ЦУП
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Быстрая авторизация полевых смартфонов экипажа через зашифрованный QR-код
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2 pt-1">
            <span className="inline-flex items-center gap-1.5 rounded-lg bg-slate-950 border border-slate-800 px-2.5 py-1 text-xs font-mono text-slate-300">
              <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
              <span>
                {connectedDevices.length > 0
                  ? `${connectedDevices.length} устройств(а) на связи`
                  : '0 устройств подключено'}
              </span>
            </span>

            <span className="inline-flex items-center gap-1.5 rounded-lg bg-slate-950 border border-slate-800 px-2.5 py-1 text-xs font-mono text-cyan-400">
              <Radio className="h-3 w-3" />
              <span>AX.25 {team.cubesatSpecs.radioFreqMhz} МГц</span>
            </span>

            <div className="inline-flex items-center gap-1.5 rounded-lg bg-slate-950 border border-slate-800 px-2 py-1 text-xs text-slate-300">
              <span className="text-[10px] text-slate-500 font-mono">Код:</span>
              <span className="font-mono font-bold text-cyan-300">{authPayload.authCode}</span>
              <button
                type="button"
                onClick={handleCopyCode}
                className="text-slate-400 hover:text-white transition-colors cursor-pointer ml-1"
                title="Скопировать резервный код"
              >
                {copiedCode ? (
                  <Check className="h-3 w-3 text-emerald-400" />
                ) : (
                  <Copy className="h-3 w-3" />
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Right: Interactive Mini QR Code Card & Button */}
        <div className="flex items-center gap-4 shrink-0">
          <button
            type="button"
            onClick={onOpenModal}
            className="group relative cursor-pointer rounded-xl border border-cyan-500/40 bg-slate-950 p-2 shadow-lg hover:border-cyan-400 transition-all hover:scale-105 text-left"
            title="Нажмите, чтобы развернуть полноэкранный QR-код"
            aria-label="Развернуть полноэкранный QR-код"
          >
            {miniQrUrl ? (
              <img
                src={miniQrUrl}
                alt="QR-код мобильной синхронизации"
                className="h-24 w-24 object-contain rounded-lg"
              />
            ) : (
              <div className="h-24 w-24 flex items-center justify-center bg-slate-900 text-slate-500 text-[10px]">
                QR
              </div>
            )}
            <div className="absolute inset-0 flex items-center justify-center bg-slate-950/60 opacity-0 group-hover:opacity-100 transition-opacity rounded-xl backdrop-blur-xs">
              <QrCode className="h-6 w-6 text-cyan-300" />
            </div>
          </button>

          <div className="flex flex-col gap-2">
            <button
              type="button"
              onClick={onOpenModal}
              className="flex items-center justify-center gap-2 rounded-xl bg-cyan-500 px-4 py-2.5 text-xs font-bold text-slate-950 hover:bg-cyan-400 transition-all shadow-md hover:shadow-cyan-500/20 cursor-pointer"
            >
              <QrCode className="h-4 w-4" />
              <span>Открыть QR-код</span>
              <ArrowRight className="h-3.5 w-3.5" />
            </button>

            <button
              type="button"
              onClick={onOpenModal}
              className="flex items-center justify-center gap-1.5 rounded-xl border border-slate-800 bg-slate-950 px-3 py-1.5 text-xs text-slate-300 hover:text-white hover:border-slate-700 transition-all cursor-pointer"
            >
              <Smartphone className="h-3.5 w-3.5 text-indigo-400" />
              <span>Устройства ({connectedDevices.length})</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

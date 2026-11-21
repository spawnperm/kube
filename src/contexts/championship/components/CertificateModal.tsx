/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * Модальное окно предпросмотра и скачивания официального PDF-сертификата участия.
 */

import React, { useEffect, useRef, useState } from 'react';
import { Download, X, Award, CheckCircle2, Sparkles, Printer, FileText } from 'lucide-react';
import confetti from 'canvas-confetti';
import {
  CertificateData,
  drawCertificateToCanvas,
  downloadTeamCertificatePdf,
} from '@/src/contexts/championship/services/certificateService';
import { audioService } from '@/src/shared/lib/audioService';

interface CertificateModalProps {
  isOpen: boolean;
  onClose: () => void;
  data: CertificateData;
}

export const CertificateModal: React.FC<CertificateModalProps> = ({ isOpen, onClose, data }) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [downloadSuccess, setDownloadSuccess] = useState(false);

  useEffect(() => {
    if (isOpen) {
      // Confetti celebration
      try {
        confetti({
          particleCount: 70,
          spread: 80,
          origin: { y: 0.6 },
          colors: ['#fbbf24', '#f59e0b', '#818cf8', '#6366f1', '#34d399'],
        });
      } catch (e) {
        // ignore
      }
      audioService.playSuccessChime();

      // Render canvas preview
      setTimeout(() => {
        if (canvasRef.current) {
          drawCertificateToCanvas(canvasRef.current, data);
        }
      }, 50);
    }
  }, [isOpen, data]);

  if (!isOpen) return null;

  const handleDownload = async () => {
    setIsGenerating(true);
    try {
      await downloadTeamCertificatePdf(data);
      setDownloadSuccess(true);
      audioService.playSuccessChime();
      try {
        confetti({
          particleCount: 50,
          spread: 60,
          origin: { y: 0.7 },
        });
      } catch (e) {
        // ignore
      }
      setTimeout(() => setDownloadSuccess(false), 4000);
    } catch (err) {
      console.error('Failed to download certificate PDF:', err);
    } finally {
      setIsGenerating(false);
    }
  };

  const handlePrint = () => {
    if (canvasRef.current) {
      const dataUrl = canvasRef.current.toDataURL('image/png');
      const win = window.open('', '_blank');
      if (win) {
        win.document.write(`
          <html>
            <head>
              <title>Сертификат - ${data.shipName || data.teamName}</title>
              <style>
                @page { size: landscape; margin: 0; }
                body { margin: 0; display: flex; align-items: center; justify-content: center; background: #000; }
                img { width: 100vw; height: 100vh; object-fit: contain; }
              </style>
            </head>
            <body>
              <img src="${dataUrl}" onload="window.print(); window.close();" />
            </body>
          </html>
        `);
        win.document.close();
      }
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/85 backdrop-blur-md animate-fade-in">
      <div className="relative w-full max-w-4xl bg-slate-900 border border-slate-700/80 rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh]">
        {/* Modal Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-800 bg-slate-950/60">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-400">
              <Award className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm sm:text-base font-bold text-white flex items-center gap-2">
                <span>Официальный PDF-сертификат участия</span>
                <span className="px-2 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 text-[10px] font-mono">
                  A4 Landscape
                </span>
              </h3>
              <p className="text-xs text-slate-400">
                Корабль «{data.shipName || data.teamName}» · Итоговый балл:{' '}
                {data.finalScore.toFixed(2)} / 5.0
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="w-8 h-8 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 flex items-center justify-center transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Modal Body: Canvas Preview */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 flex flex-col items-center justify-center bg-slate-950/50">
          <div className="relative w-full max-w-3xl aspect-[1754/1240] rounded-xl overflow-hidden shadow-2xl border border-slate-800 bg-slate-950 flex items-center justify-center">
            <canvas ref={canvasRef} className="w-full h-full object-contain" />
          </div>

          <div className="mt-4 flex flex-wrap items-center justify-center gap-4 text-xs text-slate-400">
            <div className="flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-amber-400" />
              <span>Гербовая цифровая печать ЦУП</span>
            </div>
            <span>•</span>
            <div className="flex items-center gap-1.5">
              <FileText className="w-3.5 h-3.5 text-indigo-400" />
              <span>Формат PDF (высокое разрешение 300 DPI)</span>
            </div>
            <span>•</span>
            <div className="flex items-center gap-1.5">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
              <span>Подписи оргкомитета</span>
            </div>
          </div>
        </div>

        {/* Modal Footer Actions */}
        <div className="flex flex-wrap items-center justify-between gap-3 px-5 py-4 border-t border-slate-800 bg-slate-950/80">
          <div className="text-xs text-slate-400">
            {downloadSuccess ? (
              <span className="text-emerald-400 font-semibold flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                Файл успешно сформирован и загружен!
              </span>
            ) : (
              <span>Готов к загрузке в портфолио школьника и наставника</span>
            )}
          </div>

          <div className="flex items-center gap-2.5">
            <button
              onClick={handlePrint}
              className="min-h-[42px] px-4 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold flex items-center gap-1.5 transition-colors border border-slate-700"
              title="Распечатать сертификат"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Печать</span>
            </button>

            <button
              onClick={handleDownload}
              disabled={isGenerating}
              className="min-h-[42px] px-6 rounded-xl bg-gradient-to-r from-amber-500 via-amber-600 to-yellow-500 hover:from-amber-400 hover:to-yellow-400 text-slate-950 font-bold text-xs flex items-center gap-2 shadow-lg shadow-amber-500/25 transition-all active:scale-95 disabled:opacity-50"
            >
              <Download className="w-4 h-4 text-slate-950" />
              <span>{isGenerating ? 'Создание PDF…' : 'Скачать PDF-сертификат'}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

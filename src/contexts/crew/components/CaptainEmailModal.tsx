/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * Почтовый ящик Капитана корабля (Наставника)
 * Отображает официальные извещения от руководства ЦУП (Смирнов А.А., Песин М.В., Анисимова А.С.)
 */

import React, { useState } from 'react';
import { CrmNotificationEmail } from '@/src/shared/types/index';

interface CaptainEmailModalProps {
  isOpen: boolean;
  onClose: () => void;
  emails: CrmNotificationEmail[];
  mentorEmail: string;
  mentorName: string;
  onMarkAsRead?: (emailId: string) => void;
}

export const CaptainEmailModal: React.FC<CaptainEmailModalProps> = ({
  isOpen,
  onClose,
  emails,
  mentorEmail,
  mentorName,
  onMarkAsRead,
}) => {
  const [selectedEmailId, setSelectedEmailId] = useState<string>(emails[0]?.id || '');

  if (!isOpen) return null;

  const activeEmail = emails.find((e) => e.id === selectedEmailId) || emails[0];

  const handleSelectEmail = (email: CrmNotificationEmail) => {
    setSelectedEmailId(email.id);
    if (!email.isRead && onMarkAsRead) {
      onMarkAsRead(email.id);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-md p-4 animate-in fade-in duration-200">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-4xl w-full p-6 shadow-2xl relative overflow-hidden flex flex-col max-h-[90vh]">
        {/* Glow */}
        <div className="absolute top-0 right-1/3 w-80 h-32 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />

        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-4 mb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-500 to-rose-500 flex items-center justify-center text-white text-xl shadow-lg shadow-amber-500/20">
              ✉️
            </div>
            <div>
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                Официальный почтовый ящик капитана
                <span className="text-xs px-2.5 py-0.5 rounded-full bg-slate-800 text-amber-300 border border-amber-800/60 font-mono">
                  {mentorEmail}
                </span>
              </h3>
              <p className="text-xs text-slate-400">
                Адресат: {mentorName} · Оповещения регламента от Администрации ЦУП и МАОУ ДПО «ЦРСО»
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white p-2 rounded-lg hover:bg-slate-800 transition-colors"
          >
            ✕
          </button>
        </div>

        {/* Two-Column Mail Client Layout */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-4 flex-1 overflow-hidden">
          {/* Email Inbox List */}
          <div className="md:col-span-5 border border-slate-800 rounded-xl bg-slate-950/70 p-2 overflow-y-auto space-y-1.5 max-h-[500px]">
            <div className="px-2 py-1 text-[11px] font-semibold text-slate-400 uppercase tracking-wider flex justify-between">
              <span>Входящие извещения ({emails.length})</span>
              <span className="text-amber-400">ЦУП / ЦРСО</span>
            </div>

            {emails.map((mail) => {
              const isSelected = mail.id === activeEmail?.id;
              return (
                <button
                  key={mail.id}
                  onClick={() => handleSelectEmail(mail)}
                  className={`w-full text-left p-3 rounded-xl border transition-all ${
                    isSelected
                      ? 'border-amber-500/80 bg-amber-950/30 text-amber-200 ring-1 ring-amber-500/50'
                      : 'border-slate-800/80 bg-slate-900/50 hover:bg-slate-800/80 text-slate-300'
                  }`}
                >
                  <div className="flex items-center justify-between text-[11px] mb-1">
                    <span className="font-bold text-white truncate max-w-[150px]">
                      {mail.senderName}
                    </span>
                    <span className="text-[10px] text-slate-400 font-mono">{mail.sentAt}</span>
                  </div>
                  <div className="text-xs font-semibold text-slate-200 line-clamp-1 mb-1">
                    {mail.subject}
                  </div>
                  <p className="text-[11px] text-slate-400 line-clamp-2 leading-relaxed">
                    {mail.preview}
                  </p>
                </button>
              );
            })}
          </div>

          {/* Email Body Viewer */}
          <div className="md:col-span-7 border border-slate-800 rounded-xl bg-slate-950/90 p-5 overflow-y-auto max-h-[500px] flex flex-col justify-between">
            {activeEmail ? (
              <div className="space-y-4">
                {/* Email Meta */}
                <div className="border-b border-slate-800 pb-3">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs px-2 py-0.5 rounded bg-amber-950/80 text-amber-300 border border-amber-800 font-medium">
                      Официальный циркуляр ЦУП
                    </span>
                    <span className="text-xs text-slate-400 font-mono">{activeEmail.sentAt}</span>
                  </div>
                  <h4 className="text-base font-bold text-white mt-2">{activeEmail.subject}</h4>
                  <div className="mt-2 text-xs text-slate-400 flex flex-col gap-0.5">
                    <div>
                      <strong className="text-slate-300">Отправитель:</strong>{' '}
                      {activeEmail.senderName} ({activeEmail.senderPosition})
                    </div>
                    <div>
                      <strong className="text-slate-300">Кому:</strong> {activeEmail.recipientName}{' '}
                      &lt;{activeEmail.recipientEmail}&gt;
                    </div>
                  </div>
                </div>

                {/* Letter Content */}
                <div className="whitespace-pre-line text-xs sm:text-sm text-slate-200 leading-relaxed font-sans bg-slate-900/50 p-4 rounded-xl border border-slate-800/80">
                  {activeEmail.body}
                </div>

                {/* Official Stamp */}
                <div className="p-3 rounded-xl bg-slate-900/80 border border-slate-800 flex items-center justify-between text-xs text-slate-400">
                  <div className="flex items-center gap-2">
                    <span className="text-emerald-400 text-base">🛡️</span>
                    <span>Электронная подпись ЦУП КОСМОПОРТ верифицирована</span>
                  </div>
                  <span className="font-mono text-[10px] text-slate-500">AUTH-MCC-OK</span>
                </div>
              </div>
            ) : (
              <div className="text-center py-20 text-slate-500 text-sm">
                Выберите письмо для прочтения
              </div>
            )}

            <div className="border-t border-slate-800 pt-3 mt-4 flex items-center justify-between text-xs text-slate-400">
              <span>Синхронизировано с почтовым сервером оргкомитета</span>
              <button
                onClick={onClose}
                className="px-4 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-white font-medium transition-colors"
              >
                Закрыть почту
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

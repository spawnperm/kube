import React, { useState } from 'react';
import { MessageSquare, Send, HelpCircle, Pin } from 'lucide-react';
import { Team, MentorMessage, StageId } from '../../types';
import { CASE_STAGES } from '../../data/mockData';

interface MentorTabProps {
  team: Team;
  messages: MentorMessage[];
  onSendMessage: (text: string, stageId?: StageId) => void;
}

export const MentorTab: React.FC<MentorTabProps> = ({ team, messages, onSendMessage }) => {
  const [inputText, setInputText] = useState('');
  const [selectedStage, setSelectedStage] = useState<string>('all');

  const filteredMessages = messages.filter((m) => {
    if (selectedStage !== 'all' && m.stageReference !== selectedStage) return false;
    return true;
  });

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim()) return;

    onSendMessage(inputText, selectedStage !== 'all' ? (selectedStage as StageId) : undefined);
    setInputText('');
  };

  const handleApplyQuestionTemplate = (tpl: string) => {
    setInputText(tpl);
  };

  return (
    <div className="space-y-6">
      {/* Top Banner: Mentor Credentials */}
      <div className="rounded-2xl border border-purple-500/25 bg-gradient-to-r from-slate-950 via-slate-900 to-purple-950/20 p-6 shadow-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-purple-500/20 text-purple-300 border border-purple-500/30 text-2xl shadow-inner font-bold">
            🎓
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-bold text-white">{team.mentorName}</h1>
              <span className="rounded bg-purple-500/20 px-2 py-0.5 text-[10px] font-semibold text-purple-300 border border-purple-500/30">
                Научный наставник
              </span>
              <span className="flex items-center gap-1 text-[11px] text-emerald-400">
                <span className="h-2 w-2 rounded-full bg-emerald-400 inline-block animate-ping" />{' '}
                На связи
              </span>
            </div>
            <p className="mt-0.5 text-xs text-slate-300">{team.mentorTitle}</p>
            <p className="mt-1 text-slate-400 text-xs">
              Курирует команду «{team.name}» ({team.school}) по всем разделам физики, орбитальной
              баллистики и радиоэлектроники.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 bg-slate-950 px-3 py-2 rounded-xl border border-slate-800 text-xs">
          <span className="text-slate-400">Сообщений в треде:</span>
          <strong className="text-purple-300 font-mono">{messages.length}</strong>
        </div>
      </div>

      {/* Main Two-Column Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Pinned Key Recommendations (4 cols) */}
        <div className="lg:col-span-4 space-y-4">
          <div className="rounded-2xl border border-purple-900/40 bg-slate-900/80 p-5 text-xs shadow-xl space-y-3">
            <div className="flex items-center gap-2 text-purple-400 font-bold border-b border-slate-800 pb-2">
              <Pin className="h-4 w-4" />
              <span>Закрепленные советы ментора</span>
            </div>

            <div className="rounded-xl border border-purple-900/30 bg-purple-950/20 p-3 space-y-1.5">
              <div className="font-semibold text-purple-300">
                1. Температурный дрейф SiPM (Этап 3)
              </div>
              <p className="text-slate-400 text-[11px] leading-relaxed">
                На теневом участке температура падает до -15°C. Напряжение пробоя кремниевого
                фотоумножителя падает с температурным коэффициентом ~21 мВ/°C. Обязательно
                используйте компенсационную цепочку на МК!
              </p>
            </div>

            <div className="rounded-xl border border-purple-900/30 bg-purple-950/20 p-3 space-y-1.5">
              <div className="font-semibold text-purple-300">
                2. Доплеровский сдвиг 437 МГц (Этап 4)
              </div>
              <p className="text-slate-400 text-[11px] leading-relaxed">
                Для LEO h=525 км максимальный сдвиг частоты составляет ±9.3 кГц при прохождении
                зенита со скоростью 7.6 км/с. Настройте AFC (автоподстройку) в SDR приемнике
                радиоклуба.
              </p>
            </div>

            <div className="rounded-xl border border-purple-900/30 bg-purple-950/20 p-3 space-y-1.5">
              <div className="font-semibold text-purple-300">3. Правила пускового контейнера</div>
              <p className="text-slate-400 text-[11px] leading-relaxed">
                Концевые выключатели пускового контейнера (Kill Switch) должны блокировать питание
                радиопередатчика минимум на 30 минут после отделения.
              </p>
            </div>
          </div>

          {/* Quick Question templates */}
          <div className="rounded-2xl border border-slate-800 bg-slate-900/80 p-5 text-xs shadow-xl space-y-2.5">
            <div className="font-semibold text-slate-300 flex items-center gap-1.5">
              <HelpCircle className="h-3.5 w-3.5 text-cyan-400" />
              <span>Быстрые вопросы наставнику:</span>
            </div>

            <button
              onClick={() =>
                handleApplyQuestionTemplate(
                  'Виктор Андреевич, как лучше учесть солнечную радиацию при расчете деградации фотоэлементов за 3 года?',
                )
              }
              className="w-full text-left rounded-lg border border-slate-800 bg-slate-950 p-2 text-[11px] text-slate-400 hover:text-white hover:border-cyan-500/40 transition-colors"
            >
              • Деградация солнечных элементов за 3 года
            </button>
            <button
              onClick={() =>
                handleApplyQuestionTemplate(
                  'Подскажите, стоит ли закладывать разворот КубСата солнечными панелями к Солнцу в теневой части витка?',
                )
              }
              className="w-full text-left rounded-lg border border-slate-800 bg-slate-950 p-2 text-[11px] text-slate-400 hover:text-white hover:border-cyan-500/40 transition-colors"
            >
              • Алгоритм ориентации ADCS в тени
            </button>
            <button
              onClick={() =>
                handleApplyQuestionTemplate(
                  'Какую методику расчета Link Budget рекомендуете для жюри: ITU-R P.618 или упрощенную модель свободного пространства?',
                )
              }
              className="w-full text-left rounded-lg border border-slate-800 bg-slate-950 p-2 text-[11px] text-slate-400 hover:text-white hover:border-cyan-500/40 transition-colors"
            >
              • Методика расчета Link Budget для жюри
            </button>
          </div>
        </div>

        {/* Right Column: Interactive Chat & Q&A Stream (8 cols) */}
        <div className="lg:col-span-8 flex flex-col rounded-2xl border border-slate-800 bg-slate-900/80 shadow-xl overflow-hidden h-[620px]">
          {/* Filter Bar */}
          <div className="flex items-center justify-between p-3.5 border-b border-slate-800 bg-slate-950/60 text-xs">
            <div className="flex items-center gap-2">
              <MessageSquare className="h-4 w-4 text-purple-400" />
              <span className="font-bold text-white">Диалоговый тред консультаций</span>
            </div>

            <select
              value={selectedStage}
              onChange={(e) => setSelectedStage(e.target.value)}
              className="rounded-lg border border-slate-800 bg-slate-900 px-2.5 py-1 text-slate-300 focus:outline-none focus:border-cyan-500"
            >
              <option value="all">Все темы и этапы кейса</option>
              {CASE_STAGES.map((s) => (
                <option key={s.id} value={s.id}>
                  Этап {s.number}: {s.title.substring(0, 24)}...
                </option>
              ))}
            </select>
          </div>

          {/* Messages scroll area */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {filteredMessages.map((msg) => {
              const isMentor = msg.senderRole === 'mentor';
              const stage = msg.stageReference
                ? CASE_STAGES.find((s) => s.id === msg.stageReference)
                : null;

              return (
                <div
                  key={msg.id}
                  className={`flex items-start gap-3 text-xs ${
                    isMentor ? 'flex-row' : 'flex-row-reverse'
                  }`}
                >
                  <div
                    className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl font-bold shadow-sm ${
                      isMentor
                        ? 'bg-purple-500/20 text-purple-300 border border-purple-500/30'
                        : 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/30'
                    }`}
                  >
                    {isMentor ? 'ВС' : 'О3'}
                  </div>

                  <div
                    className={`max-w-xl rounded-2xl p-3.5 shadow-md ${
                      isMentor
                        ? msg.isImportantAdvice
                          ? 'bg-purple-950/30 border border-purple-500/40 text-slate-200'
                          : 'bg-slate-950/90 border border-slate-800 text-slate-200'
                        : 'bg-cyan-950/30 border border-cyan-800/40 text-slate-100'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-3 pb-1 border-b border-slate-800/60 mb-1.5">
                      <div className="flex items-center gap-1.5">
                        <span
                          className={`font-semibold ${isMentor ? 'text-purple-300' : 'text-cyan-300'}`}
                        >
                          {msg.senderName}
                        </span>
                        {isMentor && (
                          <span className="text-[10px] bg-purple-500/20 text-purple-300 px-1.5 py-0.2 rounded">
                            Наставник
                          </span>
                        )}
                        {stage && (
                          <span className="text-[10px] bg-slate-800 text-slate-400 px-1.5 py-0.2 rounded">
                            Этап {stage.number}
                          </span>
                        )}
                      </div>
                      <span className="text-[10px] text-slate-500">{msg.timestamp}</span>
                    </div>

                    <p className="leading-relaxed text-[11px] whitespace-pre-wrap">{msg.text}</p>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Input Box */}
          <form
            onSubmit={handleSend}
            className="p-3 bg-slate-950 border-t border-slate-800 flex items-center gap-2"
          >
            <input
              type="text"
              placeholder="Задайте вопрос наставнику по физике, баллистике или оборудованию..."
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              className="flex-1 rounded-xl border border-slate-800 bg-slate-900 px-3.5 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-purple-500"
            />
            <button
              type="submit"
              className="flex items-center gap-1.5 rounded-xl bg-purple-500 px-4 py-2 text-xs font-bold text-white hover:bg-purple-400 shadow-lg shadow-purple-500/20 transition-all shrink-0"
            >
              <Send className="h-3.5 w-3.5" />
              <span>Отправить</span>
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

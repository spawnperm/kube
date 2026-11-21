import React from 'react';
import { X, Check, ArrowUp, ArrowDown, Layout, RotateCcw } from 'lucide-react';
import { WidgetConfig, WidgetId } from '../types';
import { Modal } from './ui/Modal';

interface DashboardCustomizerProps {
  isOpen: boolean;
  onClose: () => void;
  widgets: WidgetConfig[];
  onToggleWidget: (id: WidgetId) => void;
  onMoveWidget: (id: WidgetId, direction: 'up' | 'down') => void;
  onApplyPreset: (preset: 'all' | 'flight' | 'engineering' | 'minimal') => void;
  onResetWidgets: () => void;
}

export const DashboardCustomizer: React.FC<DashboardCustomizerProps> = ({
  isOpen,
  onClose,
  widgets,
  onToggleWidget,
  onMoveWidget,
  onApplyPreset,
  onResetWidgets,
}) => {
  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      labelledBy="customizer-title"
      panelClassName="w-full max-w-xl rounded-2xl border border-cyan-900/40 bg-slate-900 p-5 text-slate-200 shadow-2xl"
    >
      <div className="flex items-center justify-between pb-3 border-b border-slate-800">
        <div className="flex items-center gap-2.5">
          <Layout className="h-5 w-5 text-cyan-400" />
          <div>
            <h3 id="customizer-title" className="text-base font-bold text-white">
              Кастомизация командного дашборда
            </h3>
            <p className="text-xs text-slate-400">
              Настройте состав и расположение панелей под задачи вашей команды
            </p>
          </div>
        </div>
        <button
          type="button"
          onClick={onClose}
          aria-label="Закрыть окно настройки"
          className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-800 hover:text-white transition-colors"
        >
          <X className="h-5 w-5" />
        </button>
      </div>

      {/* Presets */}
      <div className="my-4">
        <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
          Быстрые пресеты компоновки:
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          <button
            onClick={() => onApplyPreset('all')}
            className="rounded-lg border border-slate-800 bg-slate-950 p-2 text-center text-xs hover:border-cyan-500/50 hover:bg-slate-850 transition-all"
          >
            <div className="font-semibold text-white">Полный</div>
            <div className="text-[10px] text-slate-400">Все модули</div>
          </button>
          <button
            onClick={() => onApplyPreset('flight')}
            className="rounded-lg border border-slate-800 bg-slate-950 p-2 text-center text-xs hover:border-cyan-500/50 hover:bg-slate-850 transition-all"
          >
            <div className="font-semibold text-cyan-300">Баллистика</div>
            <div className="text-[10px] text-slate-400">Орбита & Трекинг</div>
          </button>
          <button
            onClick={() => onApplyPreset('engineering')}
            className="rounded-lg border border-slate-800 bg-slate-950 p-2 text-center text-xs hover:border-cyan-500/50 hover:bg-slate-850 transition-all"
          >
            <div className="font-semibold text-emerald-300">Инженерный</div>
            <div className="text-[10px] text-slate-400">Энергобаланс & Этапы</div>
          </button>
          <button
            onClick={() => onApplyPreset('minimal')}
            className="rounded-lg border border-slate-800 bg-slate-950 p-2 text-center text-xs hover:border-cyan-500/50 hover:bg-slate-850 transition-all"
          >
            <div className="font-semibold text-purple-300">Компактный</div>
            <div className="text-[10px] text-slate-400">Только ключевое</div>
          </button>
        </div>
      </div>

      {/* Widgets Reorder & Toggle List */}
      <div className="mt-3">
        <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
          Порядок и видимость виджетов:
        </div>
        <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
          {widgets.map((widget, index) => (
            <div
              key={widget.id}
              className={`flex items-center justify-between rounded-xl border p-2.5 text-xs transition-all ${
                widget.visible
                  ? 'border-cyan-900/40 bg-slate-950/70 text-white'
                  : 'border-slate-800/60 bg-slate-950/30 text-slate-500 opacity-60'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <button
                  onClick={() => onToggleWidget(widget.id)}
                  className={`flex h-5 w-5 items-center justify-center rounded border transition-colors ${
                    widget.visible
                      ? 'border-cyan-500 bg-cyan-500 text-slate-950 font-bold'
                      : 'border-slate-700 bg-slate-900'
                  }`}
                >
                  {widget.visible && <Check className="h-3.5 w-3.5 stroke-[3]" />}
                </button>
                <span className="font-medium text-slate-200">{widget.title}</span>
              </div>

              <div className="flex items-center gap-1">
                <button
                  onClick={() => onMoveWidget(widget.id, 'up')}
                  disabled={index === 0}
                  className="rounded p-1 text-slate-400 hover:bg-slate-800 hover:text-white disabled:opacity-30 disabled:pointer-events-none"
                  title="Поднять выше"
                >
                  <ArrowUp className="h-3.5 w-3.5" />
                </button>
                <button
                  onClick={() => onMoveWidget(widget.id, 'down')}
                  disabled={index === widgets.length - 1}
                  className="rounded p-1 text-slate-400 hover:bg-slate-800 hover:text-white disabled:opacity-30 disabled:pointer-events-none"
                  title="Опустить ниже"
                >
                  <ArrowDown className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Footer */}
      <div className="mt-5 flex items-center justify-between pt-3 border-t border-slate-800 text-xs">
        <button
          onClick={onResetWidgets}
          className="flex items-center gap-1.5 text-slate-400 hover:text-white transition-colors"
        >
          <RotateCcw className="h-3.5 w-3.5" />
          <span>Сбросить по умолчанию</span>
        </button>
        <button
          onClick={onClose}
          className="rounded-lg bg-cyan-500 px-4 py-2 font-semibold text-slate-950 hover:bg-cyan-400 transition-colors shadow-lg shadow-cyan-500/20"
        >
          Применить конфигурацию
        </button>
      </div>
    </Modal>
  );
};

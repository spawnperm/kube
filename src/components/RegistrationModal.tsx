import React from 'react';
import { X } from 'lucide-react';
import { Team } from '../types';
import { Modal } from './ui/Modal';
import { TeamRegistrationForm } from './TeamRegistrationForm';

interface RegistrationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onRegisterTeam: (newTeam: Team) => void;
}

export const RegistrationModal: React.FC<RegistrationModalProps> = ({
  isOpen,
  onClose,
  onRegisterTeam,
}) => {
  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      labelledBy="registration-title"
      panelClassName="w-full max-w-4xl max-h-[92vh] overflow-y-auto rounded-2xl border border-cyan-800/40 bg-slate-950 p-6 text-slate-200 shadow-2xl backdrop-blur-2xl"
    >
      <div className="flex items-center justify-between pb-3 border-b border-slate-800 mb-4">
        <div>
          <h2
            id="registration-title"
            className="text-base font-bold text-white flex items-center gap-2"
          >
            <span className="text-cyan-400">🛰️</span>
            <span>Регистрация команды в ЦУП кейс-чемпионата</span>
          </h2>
          <p className="text-xs text-slate-400">
            Официальный допуск к школьной программе наноспутников CubeSat «Космос-просто»
          </p>
        </div>
        <button
          type="button"
          onClick={onClose}
          aria-label="Закрыть форму регистрации"
          className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-800 hover:text-white transition-colors"
        >
          <X className="h-5 w-5" />
        </button>
      </div>

      <TeamRegistrationForm
        isModal={true}
        onRegisterTeam={(team) => {
          onRegisterTeam(team);
        }}
        onCancel={onClose}
      />
    </Modal>
  );
};

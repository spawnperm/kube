import React, { useState } from 'react';
import { Users, Trophy } from 'lucide-react';
import { Team } from '../../types';
import { TeamParticipationCertificate } from '../TeamParticipationCertificate';

interface CertificatesTabProps {
  teams: Team[];
  activeTeam: Team;
}

export const CertificatesTab: React.FC<CertificatesTabProps> = ({ teams, activeTeam }) => {
  const [selectedTeamId, setSelectedTeamId] = useState<string>(activeTeam.id);

  const currentTeam = teams.find((t) => t.id === selectedTeamId) || activeTeam;

  return (
    <div className="space-y-6">
      {/* Team Selection Bar */}
      <div className="rounded-2xl border border-slate-800 bg-slate-900/80 p-4 shadow-xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 text-xs">
        <div className="flex items-center gap-2">
          <Users className="h-4 w-4 text-amber-400" />
          <span className="font-semibold text-white">Выбор команды для формирования диплома:</span>
        </div>

        <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
          {teams.map((t) => {
            const isSelected = t.id === currentTeam.id;
            return (
              <button
                key={t.id}
                type="button"
                onClick={() => setSelectedTeamId(t.id)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl font-medium transition-all border cursor-pointer ${
                  isSelected
                    ? 'border-amber-400 bg-amber-500/20 text-amber-300 font-bold shadow-sm'
                    : 'border-slate-800 bg-slate-950 text-slate-400 hover:text-white hover:border-slate-700'
                }`}
              >
                <Trophy className={`h-3 w-3 ${isSelected ? 'text-amber-400' : 'text-slate-500'}`} />
                <span>«{t.name}»</span>
                <span className="font-mono text-[10px] text-slate-400">(#{t.rank})</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Main Certificate Generator Component */}
      <TeamParticipationCertificate team={currentTeam} key={currentTeam.id} />
    </div>
  );
};

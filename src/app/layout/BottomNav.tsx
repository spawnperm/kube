import React from 'react';
import { Globe, Rocket, Award, Radio, Settings, Bot, Users, Sliders } from 'lucide-react';
import { UserRole } from '@/src/shared/types/index';

interface BottomNavProps {
  currentScreen: string;
  onSelectScreen: (screen: any) => void;
  userRole?: UserRole;
  isVoiceActive?: boolean;
}

export const BottomNav: React.FC<BottomNavProps> = ({
  currentScreen,
  onSelectScreen,
  userRole = 'guest',
  isVoiceActive = false,
}) => {
  // Mobile navigation tabs dynamically adjusted according to user's permitted role
  const getTabs = () => {
    // 1. Admin gets all screens in bottom nav
    if (userRole === 'admin') {
      return [
        { id: 'stage_director', label: 'Сцена', icon: Sliders },
        { id: 'admin', label: 'Админ', icon: Settings },
        { id: 'mcc', label: 'CRM', icon: Radio },
        { id: 'inspectors', label: 'Жюри', icon: Award },
        { id: 'ship', label: 'Борт', icon: Rocket },
      ];
    }

    // 2. Organizer gets MCC, Inspectors, Ship, Home, Kubik
    if (userRole === 'organizer') {
      return [
        { id: 'mcc', label: 'ЦУП', icon: Radio },
        { id: 'inspectors', label: 'Жюри', icon: Award },
        { id: 'mascot', label: 'Кубик', icon: Bot, isPrimary: true },
        { id: 'ship', label: 'Пульт', icon: Rocket },
        { id: 'starmap', label: 'Главная', icon: Globe },
      ];
    }

    // 3. Experts only get Inspectors and Kubik
    if (userRole === 'expert') {
      return [
        { id: 'inspectors', label: 'Инспекторы', icon: Award },
        { id: 'mascot', label: 'Штурман Кубик', icon: Bot, isPrimary: true },
      ];
    }

    // 4. Commander and Crew only get Ship Control and Kubik
    if (userRole === 'mentor' || userRole === 'participant') {
      return [
        { id: 'ship', label: 'Пульт корабля', icon: Rocket },
        { id: 'mascot', label: 'Штурман Кубик', icon: Bot, isPrimary: true },
      ];
    }

    // 5. Passenger (Guest) only gets Home (Star Map) and Kubik
    return [
      { id: 'starmap', label: 'Главная (Звёздная карта)', icon: Globe },
      { id: 'mascot', label: 'Штурман Кубик', icon: Bot, isPrimary: true },
    ];
  };

  const tabs = getTabs();

  return (
    <nav
      aria-label="Основная мобильная навигация"
      className="lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-slate-950/95 backdrop-blur-lg border-t border-slate-800/80 pb-[max(env(safe-area-inset-bottom),8px)] pt-1"
    >
      <div
        className={`grid items-center h-14 max-w-lg mx-auto px-2 ${
          tabs.length === 2 ? 'grid-cols-2' : 'grid-cols-5'
        }`}
      >
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = currentScreen === tab.id;

          if (tab.isPrimary) {
            return (
              <button
                key={tab.id}
                onClick={() => onSelectScreen(tab.id as any)}
                className="relative flex flex-col items-center justify-center min-h-[48px] -mt-3 group focus-visible:outline-none cursor-pointer"
              >
                <div
                  className={`w-11 h-11 rounded-xl flex items-center justify-center transition-all shadow-md ${
                    isActive
                      ? 'bg-indigo-600 text-white shadow-indigo-600/30 scale-105 ring-2 ring-indigo-400/40'
                      : 'bg-slate-900 text-indigo-400 border border-indigo-500/30 hover:border-indigo-500/60'
                  } ${isVoiceActive ? 'animate-pulse ring-4 ring-rose-500/50 text-rose-400' : ''}`}
                >
                  <Icon className="w-5 h-5" />
                </div>
                <span
                  className={`text-[10px] font-medium tracking-tight mt-1 transition-colors ${
                    isActive ? 'text-indigo-400 font-bold' : 'text-slate-400'
                  }`}
                >
                  {tab.label}
                </span>
              </button>
            );
          }

          return (
            <button
              key={tab.id}
              onClick={() => onSelectScreen(tab.id as any)}
              className="flex flex-col items-center justify-center min-h-[44px] group focus-visible:outline-none cursor-pointer"
            >
              <div
                className={`p-1 rounded-lg transition-colors ${
                  isActive ? 'text-indigo-400' : 'text-slate-400 group-hover:text-slate-200'
                }`}
              >
                <Icon className="w-5 h-5" />
              </div>
              <span
                className={`text-[10px] font-medium tracking-tight transition-colors ${
                  isActive ? 'text-indigo-400 font-bold' : 'text-slate-400'
                }`}
              >
                {tab.label}
              </span>
            </button>
          );
        })}
      </div>
    </nav>
  );
};

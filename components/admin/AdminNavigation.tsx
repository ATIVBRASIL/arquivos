import React from 'react';
import { Users, Link as LinkIcon, Layers, BookOpen, MessageSquare, TrendingUp } from 'lucide-react';

export type MainTab = 'intelligence' | 'content' | 'messages' | 'cohorts' | 'quick_access' | 'marketing';

interface Props {
  activeTab: MainTab;
  onChange: (tab: MainTab) => void;
}

export const AdminNavigation: React.FC<Props> = ({ activeTab, onChange }) => {
  // Configuração das abas com classes explícitas para evitar purga do Tailwind
  const tabs = [
    { 
      id: 'intelligence', 
      label: 'Inteligência', 
      icon: Users, 
      activeClass: 'bg-amber-500 text-black shadow-[0_0_15px_rgba(245,158,11,0.4)]' 
    },
    { 
      id: 'quick_access', 
      label: 'Acesso Rápido', 
      icon: LinkIcon, 
      activeClass: 'bg-green-500 text-black shadow-[0_0_15px_rgba(34,197,94,0.4)]' 
    },
    { 
      id: 'cohorts', 
      label: 'Turmas', 
      icon: Layers, 
      activeClass: 'bg-amber-500 text-black shadow-[0_0_15px_rgba(245,158,11,0.4)]' 
    },
    { 
      id: 'content', 
      label: 'Acervo', 
      icon: BookOpen, 
      activeClass: 'bg-amber-500 text-black shadow-[0_0_15px_rgba(245,158,11,0.4)]' 
    },
    { 
      id: 'messages', 
      label: 'Mensagens', 
      icon: MessageSquare, 
      activeClass: 'bg-amber-500 text-black shadow-[0_0_15px_rgba(245,158,11,0.4)]' 
    },
    { 
      id: 'marketing', 
      label: 'Marketing', 
      icon: TrendingUp, 
      activeClass: 'bg-amber-500 text-black shadow-[0_0_15px_rgba(245,158,11,0.4)]' 
    },
  ] as const;

  return (
    <div className="flex bg-black/50 p-1 rounded-lg border border-graphite-700 md:ml-4 overflow-x-auto max-w-[280px] md:max-w-none no-scrollbar">
      {tabs.map((tab) => {
        const isActive = activeTab === tab.id;

        return (
          <button
            key={tab.id}
            onClick={() => onChange(tab.id)}
            type="button"
            className={`
              relative group flex items-center gap-2 px-4 py-2 rounded-md text-xs font-bold uppercase whitespace-nowrap transition-all duration-300 ease-out
              outline-none focus-visible:ring-2 focus-visible:ring-amber-500 focus-visible:ring-offset-2 focus-visible:ring-offset-black
              ${isActive 
                ? `${tab.activeClass} scale-100` 
                : 'text-text-muted hover:text-white hover:bg-white/5 active:scale-95'
              }
            `}
          >
            <tab.icon 
              size={16} 
              className={`transition-transform duration-300 ${isActive ? 'scale-100' : 'group-hover:scale-110'}`}
            />
            <span className="hidden sm:inline">{tab.label}</span>
          </button>
        );
      })}
    </div>
  );
};
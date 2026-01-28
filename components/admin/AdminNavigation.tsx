import React from 'react';
import { Users, Link as LinkIcon, Layers, BookOpen, MessageSquare, TrendingUp } from 'lucide-react';

export type MainTab = 'intelligence' | 'content' | 'messages' | 'cohorts' | 'quick_access' | 'marketing';

interface Props {
  activeTab: MainTab;
  onChange: (tab: MainTab) => void;
}

export const AdminNavigation: React.FC<Props> = ({ activeTab, onChange }) => {
  const tabs = [
    { id: 'intelligence', label: 'Inteligência', icon: Users, color: 'amber-500' },
    { id: 'quick_access', label: 'Acesso Rápido', icon: LinkIcon, color: 'green-500' },
    { id: 'cohorts', label: 'Turmas', icon: Layers, color: 'amber-500' },
    { id: 'content', label: 'Acervo', icon: BookOpen, color: 'amber-500' },
    { id: 'messages', label: 'Mensagens', icon: MessageSquare, color: 'amber-500' },
    { id: 'marketing', label: 'Marketing', icon: TrendingUp, color: 'amber-500' },
  ] as const;

  return (
    <div className="flex bg-black/50 p-1 rounded-lg border border-graphite-700 md:ml-4 overflow-x-auto max-w-[280px] md:max-w-none">
      {tabs.map((tab) => (
        <button
          key={tab.id}
          onClick={() => onChange(tab.id)}
          className={`px-4 py-2 rounded-md text-xs font-bold uppercase whitespace-nowrap flex gap-2 transition-all ${
            activeTab === tab.id
              ? `bg-${tab.color} text-black shadow-lg`
              : 'text-text-muted hover:text-white'
          }`}
        >
          <tab.icon size={16} /> <span className="hidden sm:inline">{tab.label}</span>
        </button>
      ))}
    </div>
  );
};
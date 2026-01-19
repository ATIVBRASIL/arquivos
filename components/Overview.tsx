import React, { useEffect, useState } from 'react';
import { supabase } from '../src/lib/supabase';
import { BookOpen, Users, MessageSquare } from 'lucide-react';

interface Stats {
  totalEbooks: number;
  activeUsers: number;
  unreadMessages: number;
}

export const Overview: React.FC = () => {
  const [stats, setStats] = useState<Stats>({ totalEbooks: 0, activeUsers: 0, unreadMessages: 0 });
  const [loading, setLoading] = useState(true);

  const fetchStats = async () => {
    setLoading(true);
    try {
      const { count: ebCount } = await supabase.from('ebooks').select('*', { count: 'exact', head: true }).eq('status', 'published');
      const { count: usCount } = await supabase.from('profiles').select('*', { count: 'exact', head: true });
      // CONTAGEM TÁTICA: Apenas o que ainda não foi processado (is_read = false)
      const { count: msgCount } = await supabase.from('messages').select('*', { count: 'exact', head: true }).eq('is_read', false);

      setStats({ totalEbooks: ebCount || 0, activeUsers: usCount || 0, unreadMessages: msgCount || 0 });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchStats(); }, []);

  const cards = [
    { label: 'Ebooks Ativos', value: loading ? '--' : stats.totalEbooks, icon: <BookOpen className="text-amber-500" size={24} />, desc: 'Acervo publicado' },
    { label: 'Operadores', value: loading ? '--' : stats.activeUsers, icon: <Users className="text-amber-500" size={24} />, desc: 'Acessos autorizados' },
    { label: 'Novas Mensagens', value: loading ? '--' : stats.unreadMessages, icon: <MessageSquare className="text-amber-500" size={24} />, desc: 'Aguardando processamento' },
  ];

  return (
    <div className="space-y-8 animate-fade-in-up">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {cards.map((card, index) => (
          <div key={index} className="bg-graphite-800 border border-graphite-700 p-6 rounded-2xl">
            <div className="p-3 bg-black/40 rounded-xl border border-graphite-600 w-fit mb-4">{card.icon}</div>
            <h4 className="text-3xl font-display font-bold text-text-primary">{card.value}</h4>
            <p className="text-[10px] text-amber-500 font-black uppercase">{card.label}</p>
            <p className="text-[10px] text-text-muted italic">{card.desc}</p>
          </div>
        ))}
      </div>
    </div>
  );
};
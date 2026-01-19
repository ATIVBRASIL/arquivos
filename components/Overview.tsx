import React, { useEffect, useState } from 'react';
import { supabase } from '../src/lib/supabase';
import { BookOpen, Users, MessageSquare, TrendingUp } from 'lucide-react';

interface Stats {
  totalEbooks: number;
  activeUsers: number;
  totalMessages: number;
}

export const Overview: React.FC = () => {
  const [stats, setStats] = useState<Stats>({
    totalEbooks: 0,
    activeUsers: 0,
    totalMessages: 0
  });
  const [loading, setLoading] = useState(true);

  const fetchStats = async () => {
    setLoading(true);
    try {
      // 1. Contagem de Ebooks Publicados
      const { count: ebookCount } = await supabase
        .from('ebooks')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'published');

      // 2. Contagem de Operadores (Perfis)
      const { count: userCount } = await supabase
        .from('profiles')
        .select('*', { count: 'exact', head: true });

      // 3. Contagem de Mensagens na Inbox Tática
      const { count: msgCount } = await supabase
        .from('messages')
        .select('*', { count: 'exact', head: true });

      setStats({
        totalEbooks: ebookCount || 0,
        activeUsers: userCount || 0,
        totalMessages: msgCount || 0
      });
    } catch (error) {
      console.error("Erro ao sincronizar métricas:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
  }, []);

  const cards = [
    { 
      label: 'Total de Ebooks', 
      value: loading ? '--' : stats.totalEbooks, 
      icon: <BookOpen className="text-amber-500" size={24} />,
      desc: 'Manuais ativos no acervo' 
    },
    { 
      label: 'Usuários Ativos', 
      value: loading ? '--' : stats.activeUsers, 
      icon: <Users className="text-amber-500" size={24} />,
      desc: 'Operadores autorizados' 
    },
    { 
      label: 'Novas Mensagens', 
      value: loading ? '--' : stats.totalMessages, 
      icon: <MessageSquare className="text-amber-500" size={24} />,
      desc: 'Reportes e solicitações' 
    },
  ];

  return (
    <div className="space-y-8 animate-fade-in-up">
      <div>
        <h2 className="text-2xl font-display font-bold text-text-primary uppercase tracking-tight">Visão Geral</h2>
        <p className="text-[10px] text-text-muted uppercase tracking-[0.2em] font-bold">Inteligência de Dados em Tempo Real</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {cards.map((card, index) => (
          <div key={index} className="bg-graphite-800 border border-graphite-700 p-6 rounded-2xl shadow-lg group hover:border-amber-500/30 transition-all">
            <div className="flex items-start justify-between mb-4">
              <div className="p-3 bg-black/40 rounded-xl border border-graphite-600 group-hover:border-amber-500/20 transition-all">
                {card.icon}
              </div>
              <div className="bg-green-500/10 text-green-500 text-[10px] font-bold px-2 py-1 rounded-full flex items-center gap-1">
                <TrendingUp size={10} /> +100%
              </div>
            </div>
            <div className="space-y-1">
              <h4 className="text-3xl font-display font-bold text-text-primary tracking-tighter">
                {card.value}
              </h4>
              <p className="text-[10px] text-amber-500 font-black uppercase tracking-widest">
                {card.label}
              </p>
              <p className="text-[10px] text-text-muted italic">
                {card.desc}
              </p>
            </div>
          </div>
        ))}
      </div>

      <div className="bg-graphite-800 border border-graphite-700 rounded-2xl p-8 h-48 flex items-center justify-center text-center">
        <div>
          <TrendingUp size={32} className="text-graphite-600 mx-auto mb-3" />
          <p className="text-[10px] text-text-muted uppercase tracking-widest font-bold">Monitoramento de Atividade</p>
          <p className="text-[9px] text-graphite-500 mt-2 italic">O sistema está operando em regime de prontidão.</p>
        </div>
      </div>
    </div>
  );
};
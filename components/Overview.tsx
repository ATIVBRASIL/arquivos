import React, { useEffect, useState } from 'react';
import { supabase } from '../src/lib/supabase';
import { BookOpen, Users, MessageSquare, TrendingUp } from 'lucide-react';

interface Stats {
  totalEbooks: number;
  activeUsers: number;
  unreadMessages: number; // Alterado para refletir apenas as não lidas
}

export const Overview: React.FC = () => {
  const [stats, setStats] = useState<Stats>({
    totalEbooks: 0,
    activeUsers: 0,
    unreadMessages: 0
  });
  const [loading, setLoading] = useState(true);

  const fetchStats = async () => {
    setLoading(true);
    try {
      // 1. Manuais ativos
      const { count: ebookCount } = await supabase
        .from('ebooks')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'published');

      // 2. Operadores autorizados
      const { count: userCount } = await supabase
        .from('profiles')
        .select('*', { count: 'exact', head: true });

      // 3. FILTRO TÁTICO: Conta apenas mensagens onde is_read é FALSE
      const { count: msgCount } = await supabase
        .from('messages')
        .select('*', { count: 'exact', head: true })
        .eq('is_read', false); 

      setStats({
        totalEbooks: ebookCount || 0,
        activeUsers: userCount || 0,
        unreadMessages: msgCount || 0
      });
    } catch (error) {
      console.error("Erro na telemetria:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchStats(); }, []);

  const cards = [
    { 
      label: 'Ebooks Ativos', 
      value: loading ? '--' : stats.totalEbooks, 
      icon: <BookOpen className="text-amber-500" size={24} />,
      desc: 'Acervo publicado' 
    },
    { 
      label: 'Operadores', 
      value: loading ? '--' : stats.activeUsers, 
      icon: <Users className="text-amber-500" size={24} />,
      desc: 'Acessos autorizados' 
    },
    { 
      label: 'Novas Mensagens', 
      value: loading ? '--' : stats.unreadMessages, 
      icon: <MessageSquare className="text-amber-500" size={24} />,
      desc: 'Aguardando processamento' 
    },
  ];

  return (
    <div className="space-y-8 animate-fade-in-up">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-display font-bold text-text-primary uppercase tracking-tight">Visão Geral</h2>
          <p className="text-[10px] text-text-muted uppercase tracking-[0.2em] font-bold">Inteligência de Dados em Tempo Real</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {cards.map((card, index) => (
          <div key={index} className="bg-graphite-800 border border-graphite-700 p-6 rounded-2xl shadow-lg group hover:border-amber-500/30 transition-all">
            <div className="flex items-start justify-between mb-4">
              <div className="p-3 bg-black/40 rounded-xl border border-graphite-600 group-hover:border-amber-500/20 transition-all">
                {card.icon}
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

      <div className="bg-graphite-800 border border-graphite-700 rounded-2xl p-10 flex flex-col items-center justify-center text-center">
        <TrendingUp size={32} className="text-amber-500/20 mb-3" />
        <p className="text-[10px] text-text-muted uppercase tracking-[0.3em] font-black">Monitoramento de Atividade</p>
        <p className="text-[9px] text-graphite-500 mt-2 italic">Radar operando em modo de filtragem por prioridade.</p>
      </div>
    </div>
  );
};
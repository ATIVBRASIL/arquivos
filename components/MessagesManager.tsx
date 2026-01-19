import React, { useEffect, useState } from 'react';
import { supabase } from '../src/lib/supabase';
import { Mail, Trash2, Clock, User, MessageSquare, CheckCircle2, Circle } from 'lucide-react';

interface Message {
  id: string;
  full_name: string;
  email: string;
  subject: string;
  content: string;
  created_at: string;
  is_read: boolean;
}

export const MessagesManager: React.FC = () => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchMessages = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('messages')
      .select('*')
      .order('is_read', { ascending: true }) 
      .order('created_at', { ascending: false });

    if (!error && data) setMessages(data);
    setLoading(false);
  };

  useEffect(() => { fetchMessages(); }, []);

  const toggleReadStatus = async (id: string, currentStatus: boolean) => {
    const { error } = await supabase
      .from('messages')
      .update({ is_read: !currentStatus })
      .eq('id', id);

    if (!error) fetchMessages();
  };

  const deleteMessage = async (id: string) => {
    if (!confirm("Confirmar descarte definitivo?")) return;
    const { error } = await supabase.from('messages').delete().eq('id', id);
    if (!error) fetchMessages();
  };

  return (
    <div className="space-y-6 animate-fade-in-up">
      <div>
        <h2 className="text-2xl font-display font-bold text-text-primary uppercase tracking-tight">Inbox Tática</h2>
        <p className="text-[10px] text-text-muted uppercase tracking-[0.2em] font-bold">Gestão de Reportes Operacionais</p>
      </div>

      <div className="space-y-4">
        {loading ? (
          <div className="py-20 text-center text-text-muted italic">Sincronizando comunicações...</div>
        ) : messages.map((msg) => (
          <div key={msg.id} className={`bg-graphite-800 border transition-all rounded-xl p-6 group ${msg.is_read ? 'border-graphite-700 opacity-40' : 'border-amber-500 shadow-[0_0_20px_rgba(245,158,11,0.15)]'}`}>
            <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
              <div className="flex-1 space-y-3">
                <div className="flex items-center gap-3">
                  <div className={`p-2 rounded-lg ${msg.is_read ? 'bg-graphite-700 text-graphite-500' : 'bg-amber-500 text-black'}`}>
                    <User size={16} />
                  </div>
                  <div>
                    <h4 className={`text-sm font-bold uppercase flex items-center gap-2 ${msg.is_read ? 'text-text-muted' : 'text-text-primary'}`}>
                      {msg.full_name} 
                      {!msg.is_read && <span className="bg-amber-500 text-black text-[8px] px-1 rounded animate-pulse">NOVO</span>}
                    </h4>
                    <p className="text-[10px] text-text-muted">{msg.email}</p>
                  </div>
                </div>
                
                <div className={`p-4 rounded-lg border ${msg.is_read ? 'bg-black/10 border-graphite-700/50' : 'bg-black/40 border-amber-500/20'}`}>
                  <h5 className={`text-xs font-black uppercase mb-1 ${msg.is_read ? 'text-graphite-500' : 'text-amber-500'}`}>{msg.subject}</h5>
                  <p className={`text-sm leading-relaxed ${msg.is_read ? 'text-text-muted' : 'text-text-secondary'}`}>{msg.content}</p>
                </div>

                <div className="flex items-center gap-4 text-[9px] text-text-muted uppercase font-bold">
                  <span className="flex items-center gap-1"><Clock size={12} /> {new Date(msg.created_at).toLocaleString()}</span>
                </div>
              </div>

              <div className="flex md:flex-col gap-2">
                <button 
                  onClick={() => toggleReadStatus(msg.id, msg.is_read)}
                  className={`p-3 rounded-xl transition-all ${msg.is_read ? 'bg-amber-500 text-black' : 'text-amber-500 hover:bg-amber-500/10 border border-amber-500/30'}`}
                  title={msg.is_read ? "Marcar como Pendente" : "Marcar como Processado"}
                >
                  {/* CORREÇÃO AQUI: is_read true mostra o visto, false mostra círculo vazio */}
                  {msg.is_read ? <CheckCircle2 size={20} /> : <Circle size={20} />}
                </button>
                <button 
                  onClick={() => deleteMessage(msg.id)}
                  className="p-3 text-text-muted hover:text-red-500 hover:bg-red-500/10 rounded-xl transition-all"
                  title="Descartar"
                >
                  <Trash2 size={20} />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
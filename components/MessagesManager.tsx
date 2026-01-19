import React, { useEffect, useState } from 'react';
import { supabase } from '../src/lib/supabase';
import { Mail, Trash2, Clock, User, MessageSquare } from 'lucide-react';

interface Message {
  id: string;
  full_name: string;
  email: string;
  subject: string;
  content: string;
  created_at: string;
}

export const MessagesManager: React.FC = () => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchMessages = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('messages')
      .select('*')
      .order('created_at', { ascending: false });

    if (!error && data) {
      setMessages(data);
    }
    setLoading(false);
  };

  useEffect(() => { fetchMessages(); }, []);

  const deleteMessage = async (id: string) => {
    if (!confirm("Confirmar descarte definitivo desta mensagem?")) return;
    
    const { error } = await supabase
      .from('messages')
      .delete()
      .eq('id', id);

    if (!error) fetchMessages();
  };

  return (
    <div className="space-y-6 animate-fade-in-up">
      <div>
        <h2 className="text-2xl font-display font-bold text-text-primary uppercase tracking-tight">Inbox Tática</h2>
        <p className="text-[10px] text-text-muted uppercase tracking-[0.2em] font-bold">Comunicações e Reportes de Operadores</p>
      </div>

      <div className="space-y-4">
        {loading ? (
          <div className="py-20 text-center text-text-muted italic">Sincronizando comunicações...</div>
        ) : messages.length === 0 ? (
          <div className="bg-graphite-800 border border-dashed border-graphite-700 rounded-2xl p-12 text-center">
            <Mail size={40} className="mx-auto text-graphite-600 mb-4 opacity-20" />
            <p className="text-text-muted text-xs uppercase font-bold tracking-widest">Nenhuma mensagem pendente</p>
          </div>
        ) : (
          messages.map((msg) => (
            <div key={msg.id} className="bg-graphite-800 border border-graphite-700 rounded-xl p-6 hover:border-amber-500/30 transition-all shadow-lg group">
              <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
                <div className="flex-1 space-y-3">
                  <div className="flex items-center gap-3">
                    <span className="bg-amber-500/10 text-amber-500 p-2 rounded-lg">
                      <User size={16} />
                    </span>
                    <div>
                      <h4 className="text-sm font-bold text-text-primary uppercase">{msg.full_name}</h4>
                      <p className="text-[10px] text-text-muted">{msg.email}</p>
                    </div>
                  </div>
                  
                  <div>
                    <h5 className="text-amber-500 text-xs font-black uppercase mb-1">{msg.subject}</h5>
                    <p className="text-sm text-text-secondary leading-relaxed bg-black/20 p-4 rounded-lg border border-graphite-700/50">
                      {msg.content}
                    </p>
                  </div>

                  <div className="flex items-center gap-4 text-[9px] text-text-muted uppercase font-bold">
                    <span className="flex items-center gap-1"><Clock size={12} /> {new Date(msg.created_at).toLocaleString()}</span>
                    <span className="flex items-center gap-1"><MessageSquare size={12} /> ID: {msg.id.substring(0,8)}</span>
                  </div>
                </div>

                <button 
                  onClick={() => deleteMessage(msg.id)}
                  className="self-end md:self-start p-3 text-text-muted hover:text-red-500 hover:bg-red-500/10 rounded-xl transition-all"
                  title="Descartar Mensagem"
                >
                  <Trash2 size={20} />
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};
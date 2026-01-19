import React, { useState } from 'react';
import { X, Send, MessageSquare, ShieldCheck } from 'lucide-react';
import { supabase } from '../src/lib/supabase';
import { Button } from './Button';
import { User } from '../types';

interface SupportModalProps {
  user: User;
  onClose: () => void;
}

export const SupportModal: React.FC<SupportModalProps> = ({ user, onClose }) => {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    subject: 'Reporte Operacional',
    content: ''
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Sincronização exata: Coluna 'full_name' recebe a propriedade 'user.name' do App.tsx
      const { error } = await supabase.from('messages').insert([{
        full_name: user.name, 
        email: user.email,
        subject: formData.subject,
        content: formData.content
      }]);

      if (error) throw error;

      alert("MENSAGEM ENVIADA: O Comando recebeu seu reporte.");
      onClose();
    } catch (error: any) {
      console.error("Erro técnico detalhado:", error);
      alert("FALHA TÁTICA: Erro de comunicação com o banco. Verifique se as políticas RLS foram aplicadas no Supabase.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[150] bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-graphite-800 border-2 border-amber-500 w-full max-w-md rounded-2xl shadow-2xl overflow-hidden animate-fade-in-up">
        
        {/* Cabeçalho do Modal */}
        <header className="p-6 bg-black/40 border-b border-graphite-700 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <MessageSquare className="text-amber-500" size={20} />
            <h3 className="text-sm font-display font-bold text-text-primary uppercase tracking-widest">Suporte Tático</h3>
          </div>
          <button onClick={onClose} className="text-text-muted hover:text-white transition-colors">
            <X size={20} />
          </button>
        </header>

        {/* Formulário de Envio */}
        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          <div className="bg-amber-500/10 border border-amber-500/20 p-3 rounded-lg flex items-center gap-3 mb-2">
            <ShieldCheck className="text-amber-500" size={16} />
            <p className="text-[10px] text-amber-200/80 font-bold uppercase tracking-tight">
              Canal direto com o Comando Master
            </p>
          </div>

          <div>
            <label className="block text-[10px] font-bold text-amber-500 uppercase mb-2">Assunto / Prioridade</label>
            <select 
              value={formData.subject}
              onChange={e => setFormData({...formData, subject: e.target.value})}
              className="w-full bg-black border border-graphite-600 rounded-lg p-3 text-sm text-white outline-none focus:border-amber-500 cursor-pointer"
            >
              <option>Reporte Operacional</option>
              <option>Dúvida de Legislação</option>
              <option>Sugestão de Conteúdo</option>
              <option>Erro no Aplicativo</option>
            </select>
          </div>

          <div>
            <label className="block text-[10px] font-bold text-amber-500 uppercase mb-2">Descrição Detalhada</label>
            <textarea 
              required
              rows={4}
              value={formData.content}
              onChange={e => setFormData({...formData, content: e.target.value})}
              className="w-full bg-black border border-graphite-600 rounded-lg p-4 text-sm text-white outline-none focus:border-amber-500 resize-none"
              placeholder="Descreva aqui sua solicitação..."
            />
          </div>

          <footer className="pt-2">
            <Button 
              type="submit" 
              disabled={loading} 
              fullWidth 
              icon={<Send size={18} />}
            >
              {loading ? 'PROCESSANDO...' : 'ENVIAR AO COMANDO'}
            </Button>
          </footer>
        </form>
      </div>
    </div>
  );
};
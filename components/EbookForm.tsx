import React, { useState, useEffect } from 'react';
import { X, Save, Settings, FileCode, Info, ListChecks } from 'lucide-react';
import { Button } from './Button';
import { EbookLevel, EbookStatus } from '../types';

interface EbookFormProps {
  onClose: () => void;
  onSave: (bookData: any) => Promise<void>;
  initialData?: any; // Suporte para edição
}

export const EbookForm: React.FC<EbookFormProps> = ({ onClose, onSave, initialData }) => {
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<'settings' | 'content' | 'quiz'>('settings');
  
  // Estado inicial dinâmico (Carrega dados se for edição ou limpo se for novo)
  const [formData, setFormData] = useState({
    title: initialData?.title || '',
    description: initialData?.description || '',
    category: initialData?.category || 'Mindset do Guerreiro',
    cover_url: initialData?.coverUrl || '',
    tags: initialData?.tags?.join(', ') || '',
    read_time: initialData?.readTime || '',
    level: (initialData?.level as EbookLevel) || 'Básico',
    status: (initialData?.status as EbookStatus) || 'published',
    content_html: initialData?.content || '',
    // Transforma o objeto JSON do banco em texto para o campo de edição
    quiz_data: initialData?.quiz_data ? JSON.stringify(initialData.quiz_data, null, 2) : '[]'
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      // Validação Tática do JSON
      let parsedQuiz = [];
      try {
        parsedQuiz = JSON.parse(formData.quiz_data);
      } catch (jsonErr) {
        throw new Error("FORMATO INVÁLIDO NO QUIZ: Verifique vírgulas e colchetes.");
      }

      const formattedData = {
        ...formData,
        tags: formData.tags.split(',').map(t => t.trim()).filter(t => t !== ''),
        quiz_data: parsedQuiz // Salva como objeto JSON real no Supabase
      };
      
      await onSave(formattedData);
    } catch (err: any) {
      alert("FALHA NA MISSÃO: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[999] bg-black/90 flex items-start justify-center pt-8 pb-8 px-4 overflow-y-auto no-scrollbar">
      <div className="bg-graphite-800 border-2 border-amber-500 w-full max-w-5xl flex flex-col rounded-2xl shadow-[0_0_80px_rgba(0,0,0,1)] relative">
        
        <header className="p-5 border-b border-graphite-700 bg-black/30 rounded-t-2xl">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <h3 className="text-lg font-display font-bold text-amber-500 uppercase">
                {initialData ? 'Editar Protocolo' : 'Novo Protocolo'}
              </h3>
              <p className="text-[9px] text-text-muted uppercase tracking-widest font-bold">Ambiente de Operação Desktop</p>
            </div>
            
            <div className="flex bg-black/40 p-1 rounded-xl border border-graphite-600 overflow-x-auto">
              <button 
                type="button"
                onClick={() => setActiveTab('settings')}
                className={`flex items-center gap-2 px-4 md:px-6 py-2 rounded-lg text-[10px] font-black transition-all whitespace-nowrap ${activeTab === 'settings' ? 'bg-amber-500 text-black shadow-lg' : 'text-text-muted hover:text-white'}`}
              >
                <Settings size={14} /> 1. CONFIGURAÇÕES
              </button>
              <button 
                type="button"
                onClick={() => setActiveTab('content')}
                className={`flex items-center gap-2 px-4 md:px-6 py-2 rounded-lg text-[10px] font-black transition-all whitespace-nowrap ${activeTab === 'content' ? 'bg-amber-500 text-black shadow-lg' : 'text-text-muted hover:text-white'}`}
              >
                <FileCode size={14} /> 2. CONTEÚDO HTML
              </button>
              <button 
                type="button"
                onClick={() => setActiveTab('quiz')}
                className={`flex items-center gap-2 px-4 md:px-6 py-2 rounded-lg text-[10px] font-black transition-all whitespace-nowrap ${activeTab === 'quiz' ? 'bg-amber-500 text-black shadow-lg' : 'text-text-muted hover:text-white'}`}
              >
                <ListChecks size={14} /> 3. QUIZ TÁTICO
              </button>
            </div>

            <button onClick={onClose} className="hidden md:block p-2 text-text-muted hover:text-amber-500 transition-colors">
              <X size={24} />
            </button>
          </div>
        </header>

        <form onSubmit={handleSubmit} className="flex flex-col">
          <div className="p-8 max-h-[60vh] overflow-y-auto">
            {activeTab === 'settings' && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8 animate-fade-in">
                <div className="space-y-6">
                  <div>
                    <label className="block text-[10px] font-bold text-amber-500 uppercase mb-2">Título do Manual</label>
                    <input required type="text" value={formData.title} onChange={e => setFormData({...formData, title: e.target.value})}
                      className="w-full bg-graphite-900 border border-graphite-600 rounded-lg p-3 text-sm text-white outline-none focus:border-amber-500" />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-amber-500 uppercase mb-2">Categoria</label>
                    <select 
                      value={formData.category} 
                      onChange={e => setFormData({...formData, category: e.target.value})} 
                      className="w-full bg-graphite-900 border border-graphite-600 rounded-lg p-3 text-sm text-white outline-none focus:border-amber-500 cursor-pointer"
                    >
                      <option>Mindset do Guerreiro</option>
                      <option>Filosofia Tática</option>
                      <option>Leis / Normas</option>
                      <option>Doutrina Operacional</option>
                      <option>Psicologia do Confronto</option>
                      <option>Liderança de Elite</option>
                      <option>Sobrevivência & Resiliência</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-amber-500 uppercase mb-2">Link da Capa (.png/.jpg)</label>
                    <input type="url" value={formData.cover_url} onChange={e => setFormData({...formData, cover_url: e.target.value})}
                      className="w-full bg-graphite-900 border border-graphite-600 rounded-lg p-3 text-sm text-white focus:border-amber-500 outline-none" />
                  </div>
                </div>

                <div className="space-y-6">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-[10px] font-bold text-amber-500 uppercase mb-2">Nível</label>
                      <select value={formData.level} onChange={e => setFormData({...formData, level: e.target.value as EbookLevel})}
                        className="w-full bg-graphite-900 border border-graphite-600 rounded-lg p-3 text-sm text-white focus:border-amber-500 outline-none">
                        <option value="Básico">Básico</option>
                        <option value="Intermediário">Intermediário</option>
                        <option value="Avançado">Avançado</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-amber-500 uppercase mb-2">Tempo</label>
                      <input type="text" value={formData.read_time} onChange={e => setFormData({...formData, read_time: e.target.value})}
                        className="w-full bg-graphite-900 border border-graphite-600 rounded-lg p-3 text-sm text-white focus:border-amber-500 outline-none" />
                    </div>
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-amber-500 uppercase mb-2">Resumo para o Card</label>
                    <textarea rows={3} value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})}
                      className="w-full bg-graphite-900 border border-graphite-600 rounded-lg p-3 text-sm text-white focus:border-amber-500 outline-none resize-none" />
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'content' && (
              <div className="h-full flex flex-col space-y-4 animate-fade-in">
                <div className="bg-amber-500/5 border border-amber-500/20 p-3 rounded flex items-center gap-3">
                  <Info className="text-amber-500 shrink-0" size={16} />
                  <p className="text-[10px] text-amber-200/80 font-bold uppercase">Área de Inserção de Código Tático (HTML)</p>
                </div>
                <textarea 
                  required 
                  value={formData.content_html} 
                  onChange={e => setFormData({...formData, content_html: e.target.value})}
                  className="w-full bg-graphite-900 p-6 rounded-xl border border-graphite-600 text-sm font-mono text-amber-400 outline-none focus:border-amber-500 min-h-[300px]" 
                  placeholder="Cole seu código aqui..."
                />
              </div>
            )}

            {activeTab === 'quiz' && (
              <div className="h-full flex flex-col space-y-4 animate-fade-in">
                <div className="bg-amber-500/5 border border-amber-500/20 p-3 rounded flex items-center gap-3">
                  <Info className="text-amber-500 shrink-0" size={16} />
                  <div>
                    <p className="text-[10px] text-amber-200/80 font-bold uppercase">Configuração de Avaliação de Elite</p>
                    <p className="text-[9px] text-text-muted">Insira as 10 perguntas seguindo o padrão de inteligência (JSON).</p>
                  </div>
                </div>
                <textarea 
                  value={formData.quiz_data} 
                  onChange={e => setFormData({...formData, quiz_data: e.target.value})}
                  className="w-full bg-graphite-900 p-6 rounded-xl border border-graphite-600 text-sm font-mono text-blue-400 outline-none focus:border-amber-500 min-h-[300px]" 
                  placeholder='[
  {
    "q": "Qual o primeiro pilar da observação?",
    "options": ["Ação", "Detecção", "Fuga", "Espera"],
    "correct": 1
  }
]'
                />
              </div>
            )}
          </div>

          <footer className="p-6 border-t border-graphite-700 bg-black/30 flex justify-end gap-4 rounded-b-2xl">
            <button type="button" onClick={onClose} className="px-6 py-2 text-text-muted hover:text-white text-[10px] font-black uppercase">Cancelar</button>
            <Button type="submit" disabled={loading} className="px-10 py-3 shadow-glow">
              {loading ? 'GRAVANDO...' : initialData ? 'ATUALIZAR MANUAL' : 'PUBLICAR MANUAL'}
            </Button>
          </footer>
        </form>
      </div>
    </div>
  );
};
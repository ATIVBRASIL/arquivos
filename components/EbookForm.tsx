import React, { useState } from 'react';
import { X, Settings, FileCode, Info, ListChecks, Loader2 } from 'lucide-react';
import { Button } from './Button';
import { EbookLevel, EbookStatus } from '../types';

interface EbookFormProps {
  onClose: () => void;
  onSave: (bookData: any) => Promise<void>;
  initialData?: any; 
}

export const EbookForm: React.FC<EbookFormProps> = ({ onClose, onSave, initialData }) => {
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<'settings' | 'content' | 'quiz'>('settings');
  
  // 1. ESTADO INICIAL (MAPEAMENTO DE ENTRADA)
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
    // Sincronização com a coluna do Supabase
    technical_skills: initialData?.technical_skills || '',
    quiz_data: initialData?.quiz_data ? JSON.stringify(initialData.quiz_data, null, 2) : '[]'
  });

  // 2. PROTOCOLO DE ENVIO (MAPEAMENTO DE SAÍDA)
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      let parsedQuiz = [];
      try {
        parsedQuiz = JSON.parse(formData.quiz_data);
      } catch (jsonErr) {
        throw new Error("FORMATO INVÁLIDO NO QUIZ: Verifique a sintaxe JSON.");
      }

      // OBJETO FORMATADO EXPLICITAMENTE PARA O SUPABASE
      const formattedData = {
        title: formData.title,
        description: formData.description,
        category: formData.category,
        cover_url: formData.cover_url,
        read_time: formData.read_time,
        level: formData.level,
        status: formData.status,
        content_html: formData.content_html,
        // Alvo: Coluna technical_skills na tabela ebooks
        technical_skills: formData.technical_skills, 
        tags: formData.tags.split(',').map(t => t.trim()).filter(t => t !== ''),
        quiz_data: parsedQuiz
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
              <button type="button" onClick={() => setActiveTab('settings')}
                className={`flex items-center gap-2 px-4 md:px-6 py-2 rounded-lg text-[10px] font-black transition-all whitespace-nowrap ${activeTab === 'settings' ? 'bg-amber-500 text-black' : 'text-text-muted hover:text-white'}`}>
                <Settings size={14} /> 1. CONFIGURAÇÕES
              </button>
              <button type="button" onClick={() => setActiveTab('content')}
                className={`flex items-center gap-2 px-4 md:px-6 py-2 rounded-lg text-[10px] font-black transition-all whitespace-nowrap ${activeTab === 'content' ? 'bg-amber-500 text-black' : 'text-text-muted hover:text-white'}`}>
                <FileCode size={14} /> 2. CONTEÚDO HTML
              </button>
              <button type="button" onClick={() => setActiveTab('quiz')}
                className={`flex items-center gap-2 px-4 md:px-6 py-2 rounded-lg text-[10px] font-black transition-all whitespace-nowrap ${activeTab === 'quiz' ? 'bg-amber-500 text-black' : 'text-text-muted hover:text-white'}`}>
                <ListChecks size={14} /> 3. QUIZ TÁTICO
              </button>
            </div>

            <button onClick={onClose} className="p-2 text-text-muted hover:text-amber-500 transition-colors">
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
                    <select value={formData.category} onChange={e => setFormData({...formData, category: e.target.value})} 
                      className="w-full bg-graphite-900 border border-graphite-600 rounded-lg p-3 text-sm text-white outline-none focus:border-amber-500">
                      <option>Mindset do Guerreiro</option>
                      <option>Filosofia Tática</option>
                      <option>Doutrina Operacional</option>
                      <option>Psicologia do Confronto</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-amber-500 uppercase mb-2">Link da Capa</label>
                    <input type="url" value={formData.cover_url} onChange={e => setFormData({...formData, cover_url: e.target.value})}
                      className="w-full bg-graphite-900 border border-graphite-600 rounded-lg p-3 text-sm text-white outline-none" />
                  </div>
                </div>

                <div className="space-y-6">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-[10px] font-bold text-amber-500 uppercase mb-2">Nível</label>
                      <select value={formData.level} onChange={e => setFormData({...formData, level: e.target.value as EbookLevel})}
                        className="w-full bg-graphite-900 border border-graphite-600 rounded-lg p-3 text-sm text-white outline-none">
                        <option value="Básico">Básico</option>
                        <option value="Intermediário">Intermediário</option>
                        <option value="Avançado">Avançado</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-amber-500 uppercase mb-2">Tempo</label>
                      <input type="text" value={formData.read_time} onChange={e => setFormData({...formData, read_time: e.target.value})}
                        className="w-full bg-graphite-900 border border-graphite-600 rounded-lg p-3 text-sm text-white outline-none" />
                    </div>
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-amber-500 uppercase mb-2">Resumo para o Card</label>
                    <textarea rows={2} value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})}
                      className="w-full bg-graphite-900 border border-graphite-600 rounded-lg p-3 text-sm text-white outline-none resize-none" />
                  </div>
                  
                  {/* CAMPO CRÍTICO: EMENTA TÉCNICA */}
                  <div>
                    <label className="block text-[10px] font-bold text-amber-500 uppercase mb-1">Ementa Técnica / Competências (Certificado)</label>
                    <textarea rows={2} value={formData.technical_skills} 
                      onChange={e => setFormData({...formData, technical_skills: e.target.value})}
                      placeholder="Ex: Leitura de Microexpressões • Protocolos FBI..."
                      className="w-full bg-graphite-900 border border-graphite-600 rounded-lg p-3 text-sm text-white focus:border-amber-500 outline-none resize-none" />
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'content' && (
              <div className="h-full flex flex-col space-y-4 animate-fade-in">
                <textarea required value={formData.content_html} 
                  onChange={e => setFormData({...formData, content_html: e.target.value})}
                  className="w-full bg-graphite-900 p-6 rounded-xl border border-graphite-600 text-sm font-mono text-amber-400 min-h-[300px] outline-none" 
                  placeholder="Cole seu código HTML aqui..." />
              </div>
            )}

            {activeTab === 'quiz' && (
              <div className="h-full flex flex-col space-y-4 animate-fade-in">
                <textarea value={formData.quiz_data} 
                  onChange={e => setFormData({...formData, quiz_data: e.target.value})}
                  className="w-full bg-graphite-900 p-6 rounded-xl border border-graphite-600 text-sm font-mono text-blue-400 min-h-[300px] outline-none" />
              </div>
            )}
          </div>

          <footer className="p-6 border-t border-graphite-700 bg-black/30 flex justify-end gap-4 rounded-b-2xl">
            <button type="button" onClick={onClose} className="px-6 py-2 text-text-muted hover:text-white text-[10px] font-black uppercase">Cancelar</button>
            <Button type="submit" disabled={loading} className="px-10 py-3 shadow-glow">
              {loading ? <Loader2 className="animate-spin" size={18} /> : initialData ? 'ATUALIZAR MANUAL' : 'PUBLICAR MANUAL'}
            </Button>
          </footer>
        </form>
      </div>
    </div>
  );
};
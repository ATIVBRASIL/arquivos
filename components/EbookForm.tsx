import React, { useState } from 'react';
import { X, Save, Settings, FileCode, Info } from 'lucide-react';
import { Button } from './Button';
import { EbookLevel, EbookStatus } from '../types';

interface EbookFormProps {
  onClose: () => void;
  onSave: (bookData: any) => Promise<void>;
}

export const EbookForm: React.FC<EbookFormProps> = ({ onClose, onSave }) => {
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<'settings' | 'content'>('settings');
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    category: 'Proteção Executiva',
    cover_url: '',
    tags: '',
    read_time: '',
    level: 'Básico' as EbookLevel,
    status: 'published' as EbookStatus,
    content_html: ''
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const formattedData = {
        ...formData,
        tags: formData.tags.split(',').map(t => t.trim()).filter(t => t !== '')
      };
      await onSave(formattedData);
    } catch (err) {
      alert("Erro ao salvar. Verifique o console.");
    } finally {
      setLoading(false);
    }
  };

  return (
    // Overlay com padding superior para garantir que o topo nunca encoste na borda do navegador
    <div className="fixed inset-0 z-[999] bg-black/90 flex items-start justify-center pt-8 pb-8 px-4 overflow-y-auto">
      
      {/* Container com altura máxima controlada (max-h-[85vh]) para notebooks */}
      <div className="bg-graphite-800 border-2 border-amber-500 w-full max-w-5xl flex flex-col rounded-2xl shadow-[0_0_80px_rgba(0,0,0,1)] relative">
        
        {/* Cabeçalho Fixo com Abas Visíveis */}
        <header className="p-5 border-b border-graphite-700 bg-black/30 rounded-t-2xl">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <h3 className="text-lg font-display font-bold text-amber-500 uppercase">Editor de Protocolo</h3>
              <p className="text-[9px] text-text-muted uppercase tracking-widest font-bold">Ambiente de Operação Desktop</p>
            </div>
            
            {/* Sistema de Abas - Reforçado para visibilidade */}
            <div className="flex bg-black/40 p-1 rounded-xl border border-graphite-600">
              <button 
                type="button"
                onClick={() => setActiveTab('settings')}
                className={`flex items-center gap-2 px-6 py-2 rounded-lg text-[10px] font-black transition-all ${activeTab === 'settings' ? 'bg-amber-500 text-black shadow-lg' : 'text-text-muted hover:text-white'}`}
              >
                <Settings size={14} /> 1. CONFIGURAÇÕES
              </button>
              <button 
                type="button"
                onClick={() => setActiveTab('content')}
                className={`flex items-center gap-2 px-6 py-2 rounded-lg text-[10px] font-black transition-all ${activeTab === 'content' ? 'bg-amber-500 text-black shadow-lg' : 'text-text-muted hover:text-white'}`}
              >
                <FileCode size={14} /> 2. CONTEÚDO HTML
              </button>
            </div>

            <button onClick={onClose} className="hidden md:block p-2 text-text-muted hover:text-amber-500 transition-colors">
              <X size={24} />
            </button>
          </div>
        </header>

        <form onSubmit={handleSubmit} className="flex flex-col">
          {/* Área de rolagem interna do formulário */}
          <div className="p-8 max-h-[60vh] overflow-y-auto">
            
            {activeTab === 'settings' && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8 animate-fade-in">
                <div className="space-y-6">
                  <div>
                    <label className="block text-[10px] font-bold text-amber-500 uppercase mb-2">Título do Manual</label>
                    <input required type="text" value={formData.title} onChange={e => setFormData({...formData, title: e.target.value})}
                      className="w-full bg-graphite-900 border border-graphite-600 rounded-lg p-3 text-sm text-white focus:border-amber-500 outline-none" />
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
                  <p className="text-[10px] text-amber-200/80 font-bold uppercase">Área de Inserção de Código Tático</p>
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
          </div>

          {/* Rodapé fixo para botões sempre visíveis */}
          <footer className="p-6 border-t border-graphite-700 bg-black/30 flex justify-end gap-4 rounded-b-2xl">
            <button type="button" onClick={onClose} className="px-6 py-2 text-text-muted hover:text-white text-[10px] font-black uppercase">Cancelar</button>
            <Button type="submit" disabled={loading} className="px-10 py-3 shadow-glow">
              {loading ? 'GRAVANDO...' : 'PUBLICAR MANUAL'}
            </Button>
          </footer>
        </form>
      </div>
    </div>
  );
};
import React, { useState } from 'react';
import { X, Save, Settings, FileCode, AlertCircle } from 'lucide-react';
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
    status: 'draft' as EbookStatus,
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
      alert("Erro ao processar salvamento. Verifique o console.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] bg-black flex items-center justify-center p-0 md:p-6 overflow-hidden">
      <div className="bg-graphite-800 border-2 border-amber-500/50 w-full max-w-5xl h-full md:h-[85vh] flex flex-col rounded-2xl shadow-2xl">
        
        <header className="p-6 border-b border-graphite-700 flex items-center justify-between bg-black/20">
          <div>
            <h3 className="text-xl font-display font-bold text-amber-500 uppercase">Editor de Protocolo</h3>
            <div className="flex gap-4 mt-4">
              <button 
                type="button"
                onClick={() => setActiveTab('settings')}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold transition-all ${activeTab === 'settings' ? 'bg-amber-500 text-black' : 'bg-black/40 text-text-muted hover:text-white'}`}
              >
                <Settings size={14} /> 1. CONFIGURAÇÕES
              </button>
              <button 
                type="button"
                onClick={() => setActiveTab('content')}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold transition-all ${activeTab === 'content' ? 'bg-amber-500 text-black' : 'bg-black/40 text-text-muted hover:text-white'}`}
              >
                <FileCode size={14} /> 2. CONTEÚDO HTML
              </button>
            </div>
          </div>
          <button onClick={onClose} className="p-2 text-text-muted hover:text-white bg-black/20 rounded-full transition-colors"><X size={24} /></button>
        </header>

        <form onSubmit={handleSubmit} className="flex-1 flex flex-col overflow-hidden text-text-primary">
          <div className="flex-1 overflow-y-auto p-8">
            {activeTab === 'settings' && (
              <div className="space-y-6 animate-fade-in">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <label className="block">
                      <span className="text-[10px] font-bold text-amber-500 uppercase tracking-widest">Título</span>
                      <input required type="text" value={formData.title} onChange={e => setFormData({...formData, title: e.target.value})}
                        className="w-full bg-black border border-graphite-600 rounded-lg p-3 mt-1 text-sm outline-none focus:border-amber-500" />
                    </label>
                    <label className="block">
                      <span className="text-[10px] font-bold text-amber-500 uppercase tracking-widest">Link da Capa</span>
                      <input type="url" value={formData.cover_url} onChange={e => setFormData({...formData, cover_url: e.target.value})}
                        className="w-full bg-black border border-graphite-600 rounded-lg p-3 mt-1 text-sm outline-none focus:border-amber-500" />
                    </label>
                  </div>
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <label className="block">
                        <span className="text-[10px] font-bold text-amber-500 uppercase tracking-widest">Nível</span>
                        <select value={formData.level} onChange={e => setFormData({...formData, level: e.target.value as EbookLevel})}
                          className="w-full bg-black border border-graphite-600 rounded-lg p-3 mt-1 text-sm outline-none">
                          <option value="Básico">Básico</option>
                          <option value="Intermediário">Intermediário</option>
                          <option value="Avançado">Avançado</option>
                        </select>
                      </label>
                      <label className="block">
                        <span className="text-[10px] font-bold text-amber-500 uppercase tracking-widest">Tempo</span>
                        <input type="text" value={formData.read_time} onChange={e => setFormData({...formData, read_time: e.target.value})}
                          className="w-full bg-black border border-graphite-600 rounded-lg p-3 mt-1 text-sm outline-none" />
                      </label>
                    </div>
                    <label className="block">
                      <span className="text-[10px] font-bold text-amber-500 uppercase tracking-widest">Resumo Operacional</span>
                      <textarea rows={3} value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})}
                        className="w-full bg-black border border-graphite-600 rounded-lg p-3 mt-1 text-sm outline-none resize-none" />
                    </label>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'content' && (
              <div className="h-full flex flex-col space-y-4 animate-fade-in">
                <textarea 
                  required 
                  value={formData.content_html} 
                  onChange={e => setFormData({...formData, content_html: e.target.value})}
                  className="flex-1 w-full bg-black p-6 rounded-xl border border-graphite-600 text-sm font-mono text-amber-500/90 outline-none focus:border-amber-500" 
                  placeholder="Cole seu código HTML aqui..."
                />
              </div>
            )}
          </div>

          <footer className="p-6 border-t border-graphite-700 bg-black/20 flex justify-end gap-4">
            <Button type="button" variant="ghost" onClick={onClose}>Cancelar</Button>
            <Button type="submit" disabled={loading} icon={<Save size={20} />} className="px-12 shadow-glow">
              {loading ? 'GRAVANDO...' : 'FINALIZAR E SALVAR'}
            </Button>
          </footer>
        </form>
      </div>
    </div>
  );
};
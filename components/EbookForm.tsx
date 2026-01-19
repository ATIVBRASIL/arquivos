import React, { useState } from 'react';
import { X, Save, Settings, FileCode, AlertCircle, Info } from 'lucide-react';
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
    status: 'published' as EbookStatus, // Já inicia como publicado para facilitar
    content_html: ''
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    console.log("Tentando salvar dados...", formData); // Log para debug no console
    setLoading(true);
    try {
      const formattedData = {
        ...formData,
        tags: formData.tags.split(',').map(t => t.trim()).filter(t => t !== '')
      };
      await onSave(formattedData);
    } catch (err) {
      console.error(err);
      alert("Erro ao salvar. Verifique se o HTML não é grande demais.");
    } finally {
      setLoading(false);
    }
  };

  return (
    // Ajustado para garantir que fique por cima de TUDO (z-[999])
    <div className="fixed inset-0 z-[999] bg-black/95 flex items-center justify-center p-0 md:p-4">
      
      {/* Container com fundo sólido Grafite e borda Amber para separação visual */}
      <div className="bg-graphite-800 border-2 border-amber-500 w-full max-w-5xl h-full md:h-[90vh] flex flex-col md:rounded-2xl shadow-[0_0_100px_rgba(0,0,0,1)]">
        
        <header className="p-6 border-b border-graphite-700 bg-black/40 flex items-center justify-between">
          <div>
            <h3 className="text-xl font-display font-bold text-amber-500 uppercase tracking-tight">Editor de Protocolo Tático</h3>
            <div className="flex gap-2 mt-4">
              <button 
                type="button"
                onClick={() => setActiveTab('settings')}
                className={`px-4 py-2 rounded-lg text-[10px] font-black transition-all border ${activeTab === 'settings' ? 'bg-amber-500 text-black border-amber-500' : 'bg-transparent text-text-muted border-graphite-600 hover:border-amber-500/50'}`}
              >
                1. CONFIGURAÇÕES
              </button>
              <button 
                type="button"
                onClick={() => setActiveTab('content')}
                className={`px-4 py-2 rounded-lg text-[10px] font-black transition-all border ${activeTab === 'content' ? 'bg-amber-500 text-black border-amber-500' : 'bg-transparent text-text-muted border-graphite-600 hover:border-amber-500/50'}`}
              >
                2. CONTEÚDO HTML
              </button>
            </div>
          </div>
          <button onClick={onClose} className="p-3 text-text-muted hover:text-amber-500 bg-black/40 rounded-full transition-all"><X size={24} /></button>
        </header>

        <form onSubmit={handleSubmit} className="flex-1 flex flex-col overflow-hidden">
          <div className="flex-1 overflow-y-auto p-8 bg-graphite-800">
            
            {activeTab === 'settings' && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8 animate-fade-in">
                <div className="space-y-6">
                  <div>
                    <label className="block text-[10px] font-bold text-amber-500 uppercase mb-2">Título do Manual</label>
                    <input required type="text" value={formData.title} onChange={e => setFormData({...formData, title: e.target.value})}
                      className="w-full bg-graphite-900 border-2 border-graphite-600 rounded-lg p-4 text-sm text-white focus:border-amber-500 outline-none transition-all" />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-amber-500 uppercase mb-2">Link da Capa (.png/.jpg)</label>
                    <input type="url" value={formData.cover_url} onChange={e => setFormData({...formData, cover_url: e.target.value})}
                      className="w-full bg-graphite-900 border-2 border-graphite-600 rounded-lg p-4 text-sm text-white focus:border-amber-500 outline-none transition-all" />
                  </div>
                </div>

                <div className="space-y-6">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-[10px] font-bold text-amber-500 uppercase mb-2">Nível</label>
                      <select value={formData.level} onChange={e => setFormData({...formData, level: e.target.value as EbookLevel})}
                        className="w-full bg-graphite-900 border-2 border-graphite-600 rounded-lg p-4 text-sm text-white focus:border-amber-500 outline-none">
                        <option value="Básico">Básico</option>
                        <option value="Intermediário">Intermediário</option>
                        <option value="Avançado">Avançado</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-amber-500 uppercase mb-2">Tempo</label>
                      <input type="text" value={formData.read_time} onChange={e => setFormData({...formData, read_time: e.target.value})}
                        className="w-full bg-graphite-900 border-2 border-graphite-600 rounded-lg p-4 text-sm text-white focus:border-amber-500 outline-none" />
                    </div>
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-amber-500 uppercase mb-2">Resumo Operacional</label>
                    <textarea rows={4} value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})}
                      className="w-full bg-graphite-900 border-2 border-graphite-600 rounded-lg p-4 text-sm text-white focus:border-amber-500 outline-none resize-none" />
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'content' && (
              <div className="h-full flex flex-col space-y-4 animate-fade-in">
                <div className="bg-amber-500/10 border border-amber-500/30 p-4 rounded-lg flex items-center gap-3">
                  <Info className="text-amber-500 shrink-0" size={20} />
                  <p className="text-[10px] text-amber-200/80 font-bold uppercase">Cole apenas o corpo do HTML. Evite as tags &lt;html&gt; e &lt;head&gt;.</p>
                </div>
                <textarea 
                  required 
                  value={formData.content_html} 
                  onChange={e => setFormData({...formData, content_html: e.target.value})}
                  className="flex-1 w-full bg-graphite-900 p-6 rounded-xl border-2 border-graphite-600 text-sm font-mono text-amber-400 outline-none focus:border-amber-500" 
                  placeholder="Cole seu código aqui..."
                />
              </div>
            )}
          </div>

          <footer className="p-6 border-t border-graphite-700 bg-black/40 flex justify-end gap-4">
            <button type="button" onClick={onClose} className="px-6 py-3 text-text-muted hover:text-white text-xs font-bold uppercase tracking-widest">Cancelar</button>
            <Button type="submit" disabled={loading} className="px-12 py-3 shadow-glow ring-2 ring-amber-500/20">
              {loading ? 'EFETIVANDO...' : 'PUBLICAR MANUAL'}
            </Button>
          </footer>
        </form>
      </div>
    </div>
  );
};
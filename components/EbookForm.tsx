import React, { useState } from 'react';
import { X, Save, BookOpen, Clock, Tag, Layers, ImageIcon } from 'lucide-react';
import { Button } from './Button';
import { EbookLevel, EbookStatus } from '../types';

interface EbookFormProps {
  onClose: () => void;
  onSave: (bookData: any) => Promise<void>;
}

export const EbookForm: React.FC<EbookFormProps> = ({ onClose, onSave }) => {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    category: 'Proteção Executiva',
    cover_url: '', // Campo para o link .png ou .jpeg
    tags: '',
    read_time: '',
    level: 'Básico' as EbookLevel,
    status: 'draft' as EbookStatus,
    content_html: ''
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    
    // Converte a string de tags em um array para o banco de dados
    const formattedData = {
      ...formData,
      tags: formData.tags.split(',').map(t => t.trim()).filter(t => t !== '')
    };
    
    await onSave(formattedData);
    setLoading(false);
  };

  return (
    // Overlay escuro com desfoque para isolar o formulário do resto do App
    <div className="fixed inset-0 z-[100] bg-black-900/95 backdrop-blur-md flex items-center justify-center p-4">
      
      {/* Container com fundo sólido e borda de alto contraste */}
      <div className="bg-graphite-800 border-2 border-graphite-600 w-full max-w-4xl max-h-[90vh] overflow-y-auto rounded-2xl shadow-[0_0_50px_rgba(0,0,0,0.8)] animate-fade-in-up">
        
        <header className="sticky top-0 z-10 bg-graphite-800 p-6 border-b border-graphite-700 flex items-center justify-between">
          <div>
            <h3 className="text-xl font-display font-bold text-amber-500 uppercase tracking-tight">Novo Ativo Digital</h3>
            <p className="text-[10px] text-text-muted uppercase tracking-widest font-semibold">Configuração de Manual Operacional</p>
          </div>
          <button onClick={onClose} className="text-text-muted hover:text-white transition-colors p-2">
            <X size={24} />
          </button>
        </header>

        <form onSubmit={handleSubmit} className="p-8 space-y-8">
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="space-y-6">
              <div>
                <label className="block text-[10px] font-bold text-amber-500/70 uppercase mb-2 tracking-widest">Título do Manual</label>
                <input required type="text" value={formData.title} onChange={e => setFormData({...formData, title: e.target.value})}
                  className="w-full bg-black-900 border border-graphite-600 rounded-xl p-4 text-sm text-text-primary focus:border-amber-500 outline-none transition-all" 
                  placeholder="Ex: Protocolo de Escolta VIP" />
              </div>
              
              {/* CAMPO DE LINK DA CAPA SOLICITADO */}
              <div>
                <label className="block text-[10px] font-bold text-amber-500/70 uppercase mb-2 tracking-widest">Link da Capa (.png / .jpg)</label>
                <div className="relative">
                  <ImageIcon className="absolute left-4 top-1/2 -translate-y-1/2 text-text-muted w-4 h-4" />
                  <input type="url" value={formData.cover_url} onChange={e => setFormData({...formData, cover_url: e.target.value})}
                    className="w-full bg-black-900 border border-graphite-600 rounded-xl p-4 pl-12 text-sm text-text-primary focus:border-amber-500 outline-none transition-all" 
                    placeholder="https://exemplo.com/imagem.png" />
                </div>
                <p className="text-[9px] text-text-muted mt-2 italic">* Cole a URL direta da imagem para o card.</p>
              </div>
            </div>

            <div className="space-y-6">
               <div>
                <label className="block text-[10px] font-bold text-amber-500/70 uppercase mb-2 tracking-widest">Categoria</label>
                <select value={formData.category} onChange={e => setFormData({...formData, category: e.target.value})}
                  className="w-full bg-black-900 border border-graphite-600 rounded-xl p-4 text-sm text-text-primary focus:border-amber-500 outline-none cursor-pointer">
                  <option>Proteção Executiva</option>
                  <option>Inteligência</option>
                  <option>APH Tático</option>
                  <option>Combate</option>
                  <option>Gestão</option>
                  <option>Técnico</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-bold text-amber-500/70 uppercase mb-2 tracking-widest flex items-center gap-1"><Clock size={12}/> Tempo</label>
                  <input type="text" value={formData.read_time} onChange={e => setFormData({...formData, read_time: e.target.value})}
                    className="w-full bg-black-900 border border-graphite-600 rounded-xl p-4 text-sm focus:border-amber-500 outline-none" placeholder="Ex: 45 min" />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-amber-500/70 uppercase mb-2 tracking-widest flex items-center gap-1"><Layers size={12}/> Nível</label>
                  <select value={formData.level} onChange={e => setFormData({...formData, level: e.target.value as EbookLevel})}
                    className="w-full bg-black-900 border border-graphite-600 rounded-xl p-4 text-sm focus:border-amber-500 outline-none cursor-pointer">
                    <option value="Básico">BÁSICO</option>
                    <option value="Intermediário">INTERMEDIÁRIO</option>
                    <option value="Avançado">AVANÇADO</option>
                  </select>
                </div>
              </div>
            </div>
          </div>

          <div>
            <label className="block text-[10px] font-bold text-amber-500/70 uppercase mb-2 tracking-widest flex items-center gap-1"><Tag size={12}/> Tags (separadas por vírgula)</label>
            <input type="text" value={formData.tags} onChange={e => setFormData({...formData, tags: e.target.value})}
              className="w-full bg-black-900 border border-graphite-600 rounded-xl p-4 text-sm focus:border-amber-500 outline-none" placeholder="VIP, Escolta, Urbano..." />
          </div>

          <div>
            <label className="block text-[10px] font-bold text-amber-500/70 uppercase mb-2 tracking-widest">Resumo para o Card</label>
            <textarea rows={2} value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})}
              className="w-full bg-black-900 border border-graphite-600 rounded-xl p-4 text-sm focus:border-amber-500 outline-none resize-none" placeholder="Descrição curta que aparece no catálogo..." />
          </div>

          <div>
            <label className="block text-[10px] font-bold text-amber-500/70 uppercase mb-2 tracking-widest flex items-center gap-1"><BookOpen size={12}/> Conteúdo em HTML</label>
            <textarea rows={10} required value={formData.content_html} onChange={e => setFormData({...formData, content_html: e.target.value})}
              className="w-full bg-black-900 border border-graphite-600 rounded-xl p-6 text-sm font-mono text-amber-500/90 outline-none focus:border-amber-500 transition-all" 
              placeholder="<div><h2>Capítulo 1</h2><p>Texto técnico...</p></div>" />
          </div>

          <footer className="flex items-center justify-end gap-4 pt-6 border-t border-graphite-700">
            <Button type="button" variant="ghost" onClick={onClose} className="text-text-muted hover:text-white">Cancelar</Button>
            <Button type="submit" disabled={loading} icon={<Save size={18} />} className="px-8 shadow-glow">
              {loading ? 'Sincronizando...' : 'Publicar no Acervo'}
            </Button>
          </footer>
        </form>
      </div>
    </div>
  );
};
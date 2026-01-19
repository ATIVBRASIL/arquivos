import React, { useState } from 'react';
import { X, Save, BookOpen, Clock, Tag, Layers } from 'lucide-react';
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
    cover_url: 'https://picsum.photos/600/400?grayscale',
    tags: '',
    read_time: '',
    level: 'Básico' as EbookLevel,
    status: 'draft' as EbookStatus,
    content_html: ''
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const formattedData = {
      ...formData,
      tags: formData.tags.split(',').map(t => t.trim()).filter(t => t !== '')
    };
    await onSave(formattedData);
    setLoading(false);
  };

  return (
    <div className="fixed inset-0 z-[60] bg-black-900/90 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-graphite-800 border border-graphite-700 w-full max-w-4xl max-h-[90vh] overflow-y-auto rounded-2xl shadow-2xl animate-fade-in-up">
        
        <header className="sticky top-0 z-10 bg-graphite-800/95 backdrop-blur p-6 border-b border-graphite-700 flex items-center justify-between">
          <div>
            <h3 className="text-xl font-display font-bold text-amber-500 uppercase">Novo Ativo Digital</h3>
            <p className="text-[10px] text-text-muted uppercase tracking-widest">Cadastro de Manual Operacional</p>
          </div>
          <button onClick={onClose} className="text-text-muted hover:text-white transition-colors"><X size={24} /></button>
        </header>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Título e Categoria */}
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-text-muted uppercase mb-1">Título do Manual</label>
                <input required type="text" value={formData.title} onChange={e => setFormData({...formData, title: e.target.value})}
                  className="w-full bg-black-900 border border-graphite-600 rounded-lg p-3 text-sm focus:border-amber-500 outline-none" placeholder="Ex: Protocolo de Escolta" />
              </div>
              
              <div>
                <label className="block text-xs font-bold text-text-muted uppercase mb-1">Categoria</label>
                <select value={formData.category} onChange={e => setFormData({...formData, category: e.target.value})}
                  className="w-full bg-black-900 border border-graphite-600 rounded-lg p-3 text-sm focus:border-amber-500 outline-none text-text-primary">
                  <option>Proteção Executiva</option>
                  <option>Inteligência</option>
                  <option>APH Tático</option>
                  <option>Combate</option>
                  <option>Gestão</option>
                  <option>Técnico</option>
                </select>
              </div>
            </div>

            {/* Configurações Táticas */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-text-muted uppercase mb-1 flex items-center gap-1"><Clock size={12}/> Tempo</label>
                <input type="text" value={formData.read_time} onChange={e => setFormData({...formData, read_time: e.target.value})}
                  className="w-full bg-black-900 border border-graphite-600 rounded-lg p-3 text-sm focus:border-amber-500 outline-none" placeholder="Ex: 45 min" />
              </div>
              <div>
                <label className="block text-xs font-bold text-text-muted uppercase mb-1 flex items-center gap-1"><Layers size={12}/> Nível</label>
                <select value={formData.level} onChange={e => setFormData({...formData, level: e.target.value as EbookLevel})}
                  className="w-full bg-black-900 border border-graphite-600 rounded-lg p-3 text-sm focus:border-amber-500 outline-none">
                  <option value="Básico">BÁSICO</option>
                  <option value="Intermediário">INTERMEDIÁRIO</option>
                  <option value="Avançado">AVANÇADO</option>
                </select>
              </div>
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-text-muted uppercase mb-1 flex items-center gap-1"><Tag size={12}/> Tags (separadas por vírgula)</label>
            <input type="text" value={formData.tags} onChange={e => setFormData({...formData, tags: e.target.value})}
              className="w-full bg-black-900 border border-graphite-600 rounded-lg p-3 text-sm focus:border-amber-500 outline-none" placeholder="VIP, Escolta, Urbano..." />
          </div>

          <div>
            <label className="block text-xs font-bold text-text-muted uppercase mb-1">Descrição Curta</label>
            <textarea rows={2} value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})}
              className="w-full bg-black-900 border border-graphite-600 rounded-lg p-3 text-sm focus:border-amber-500 outline-none" placeholder="Breve resumo para o card..." />
          </div>

          <div>
            <label className="block text-xs font-bold text-text-muted uppercase mb-1 flex items-center gap-1"><BookOpen size={12}/> Conteúdo (HTML)</label>
            <textarea rows={8} required value={formData.content_html} onChange={e => setFormData({...formData, content_html: e.target.value})}
              className="w-full bg-black-900 border border-graphite-600 rounded-lg p-3 text-sm font-mono focus:border-amber-500 outline-none" 
              placeholder="<div><h2>Capítulo 1</h2><p>Texto aqui...</p></div>" />
          </div>

          <footer className="flex items-center justify-end gap-4 pt-4 border-t border-graphite-700">
            <Button type="button" variant="ghost" onClick={onClose}>Cancelar</Button>
            <Button type="submit" disabled={loading} icon={<Save size={18} />}>
              {loading ? 'Salvando...' : 'Cadastrar Manual'}
            </Button>
          </footer>
        </form>
      </div>
    </div>
  );
};
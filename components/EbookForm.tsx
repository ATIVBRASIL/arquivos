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
    const formattedData = {
      ...formData,
      tags: formData.tags.split(',').map(t => t.trim()).filter(t => t !== '')
    };
    await onSave(formattedData);
    setLoading(false);
  };

  return (
    // Overlay 100% opaco para eliminar qualquer interferência do fundo
    <div className="fixed inset-0 z-[100] bg-black flex items-center justify-center p-0 md:p-4 overflow-hidden">
      
      {/* Container com borda Amber destacada e fundo sólido */}
      <div className="bg-graphite-800 border-t-4 border-amber-500 w-full max-w-5xl h-full md:h-auto md:max-h-[95vh] overflow-y-auto md:rounded-b-2xl shadow-[0_0_100px_rgba(0,0,0,1)] flex flex-col">
        
        <header className="p-6 border-b border-graphite-700 bg-graphite-800 flex items-center justify-between sticky top-0 z-20">
          <div>
            <h3 className="text-2xl font-display font-bold text-amber-500 uppercase tracking-tighter">Novo Protocolo Operacional</h3>
            <p className="text-[10px] text-text-muted uppercase tracking-[0.2em] font-bold">Entrada de dados no sistema central</p>
          </div>
          <button onClick={onClose} className="p-2 text-text-muted hover:text-amber-500 transition-colors bg-black/20 rounded-full">
            <X size={28} />
          </button>
        </header>

        <form onSubmit={handleSubmit} className="p-8 space-y-10">
          
          {/* GRADE PRINCIPAL */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
            <div className="space-y-6">
              <div className="bg-black/30 p-4 rounded-xl border border-graphite-700">
                <label className="block text-[10px] font-black text-amber-500 uppercase mb-2 tracking-widest">Identificação do Ativo</label>
                <input required type="text" value={formData.title} onChange={e => setFormData({...formData, title: e.target.value})}
                  className="w-full bg-black border border-graphite-600 rounded-lg p-4 text-base text-text-primary focus:border-amber-500 outline-none" 
                  placeholder="Ex: Escolta de Autoridades Nível 1" />
              </div>
              
              <div className="bg-black/30 p-4 rounded-xl border border-graphite-700">
                <label className="block text-[10px] font-black text-amber-500 uppercase mb-2 tracking-widest text-wrap">Endereço da Capa (.png ou .jpg)</label>
                <div className="flex gap-3">
                  <div className="bg-black p-3 rounded-lg border border-graphite-600 flex items-center justify-center">
                    <ImageIcon className="text-text-muted" size={20} />
                  </div>
                  <input type="url" value={formData.cover_url} onChange={e => setFormData({...formData, cover_url: e.target.value})}
                    className="flex-1 bg-black border border-graphite-600 rounded-lg p-4 text-sm text-text-primary focus:border-amber-500 outline-none" 
                    placeholder="https://link-da-imagem.com/capa.png" />
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
               <div className="bg-black/30 p-4 rounded-xl border border-graphite-700">
                <label className="block text-[10px] font-black text-amber-500 uppercase mb-2 tracking-widest">Classificação</label>
                <select value={formData.category} onChange={e => setFormData({...formData, category: e.target.value})}
                  className="w-full bg-black border border-graphite-600 rounded-lg p-4 text-sm text-text-primary focus:border-amber-500 outline-none cursor-pointer">
                  <option>Proteção Executiva</option>
                  <option>Inteligência</option>
                  <option>APH Tático</option>
                  <option>Combate</option>
                  <option>Gestão</option>
                </select>
              </div>

              <div className="bg-black/30 p-4 rounded-xl border border-graphite-700">
                <label className="block text-[10px] font-black text-amber-500 uppercase mb-2 tracking-widest">Nível de Acesso</label>
                <select value={formData.level} onChange={e => setFormData({...formData, level: e.target.value as EbookLevel})}
                  className="w-full bg-black border border-graphite-600 rounded-lg p-4 text-sm focus:border-amber-500 outline-none cursor-pointer">
                  <option value="Básico">BÁSICO</option>
                  <option value="Intermediário">INTERMEDIÁRIO</option>
                  <option value="Avançado">AVANÇADO</option>
                </select>
              </div>

              <div className="bg-black/30 p-4 rounded-xl border border-graphite-700 sm:col-span-2">
                <label className="block text-[10px] font-black text-amber-500 uppercase mb-2 tracking-widest">Tempo de Estudo Estimado</label>
                <div className="flex items-center gap-3">
                   <Clock size={18} className="text-text-muted" />
                   <input type="text" value={formData.read_time} onChange={e => setFormData({...formData, read_time: e.target.value})}
                    className="flex-1 bg-black border border-graphite-600 rounded-lg p-4 text-sm focus:border-amber-500 outline-none" placeholder="Ex: 1h 30min" />
                </div>
              </div>
            </div>
          </div>

          <div className="bg-black/30 p-6 rounded-xl border border-graphite-700 space-y-6">
            <div>
              <label className="block text-[10px] font-black text-amber-500 uppercase mb-2 tracking-widest">Resumo Estratégico (O que o operador aprenderá?)</label>
              <textarea rows={2} value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})}
                className="w-full bg-black border border-graphite-600 rounded-lg p-4 text-sm focus:border-amber-500 outline-none resize-none" placeholder="Descrição curta para o card..." />
            </div>

            <div>
              <label className="block text-[10px] font-black text-amber-500 uppercase mb-2 tracking-widest">Corpo do Manual (HTML Operacional)</label>
              <textarea rows={12} required value={formData.content_html} onChange={e => setFormData({...formData, content_html: e.target.value})}
                className="w-full bg-black border border-graphite-600 rounded-lg p-6 text-sm font-mono text-amber-500/80 outline-none focus:border-amber-500 transition-all shadow-inner" 
                placeholder="<div><h2>Introdução</h2><p>Texto aqui...</p></div>" />
            </div>
          </div>

          <footer className="flex items-center justify-end gap-6 pt-6 border-t border-graphite-700 pb-4">
            <button type="button" onClick={onClose} className="text-text-muted hover:text-white uppercase text-xs font-bold tracking-widest px-4 py-2">Descartar</button>
            <Button type="submit" disabled={loading} icon={<Save size={20} />} className="px-12 py-4 text-lg shadow-glow">
              {loading ? 'GRAVANDO...' : 'EFETIVAR CADASTRO'}
            </Button>
          </footer>
        </form>
      </div>
    </div>
  );
};
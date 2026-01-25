import React, { useEffect, useMemo, useState } from 'react';
import { X, Settings, FileCode, ListChecks, Loader2, Upload, Image as ImageIcon } from 'lucide-react';
import { Button } from './Button';
import { EbookLevel, EbookStatus } from '../types';
import { supabase } from '../src/lib/supabase'; // Caminho confirmado

interface EbookFormProps {
  onClose: () => void;
  onSave: (bookData: any) => Promise<void>;
  initialData?: any;
}

function splitCompetencies(raw: string): string[] {
  if (!raw) return [];
  return raw
    .replace(/\r/g, '')
    .split(/[\n•]+|(?:\s*\.\s*)/g)
    .map((s) => s.trim())
    .filter(Boolean)
    .slice(0, 5);
}

function joinCompetencies(list: string[]): string {
  const clean = list.map((s) => (s ?? '').trim()).filter(Boolean);
  return clean.join('. ');
}

export const EbookForm: React.FC<EbookFormProps> = ({ onClose, onSave, initialData }) => {
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [activeTab, setActiveTab] = useState<'settings' | 'content' | 'quiz'>('settings');

  // Base (dados do ebook)
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
    technical_skills: initialData?.technical_skills || '',
    quiz_data: initialData?.quiz_data ? JSON.stringify(initialData.quiz_data, null, 2) : '[]',
  });

  const [competencies, setCompetencies] = useState<string[]>(['', '', '', '', '']);

  useEffect(() => {
    const parsed = splitCompetencies(initialData?.technical_skills || '');
    const filled = [...parsed, '', '', '', '', ''].slice(0, 5);
    setCompetencies(filled);
  }, [initialData?.technical_skills]);

  const hasAtLeastOneCompetency = useMemo(() => {
    return competencies.some((c) => String(c || '').trim().length > 0);
  }, [competencies]);

  // === FUNÇÃO DE UPLOAD BLINDADA ===
  const handleCoverUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    if (!event.target.files || event.target.files.length === 0) return;
    
    alert("INICIANDO UPLOAD... (Aguarde o próximo aviso)"); // Diagnóstico 1

    try {
      setUploading(true);
      const file = event.target.files[0];
      const fileExt = file.name.split('.').pop();
      const fileName = `${Date.now()}.${fileExt}`;
      const filePath = `covers/${fileName}`;

      // 1. Upload
      const { error: uploadError } = await supabase.storage
        .from('ebook-covers')
        .upload(filePath, file);

      if (uploadError) {
        console.error('Erro Supabase:', uploadError);
        throw new Error(uploadError.message);
      }

      // 2. Pegar URL
      const { data } = supabase.storage
        .from('ebook-covers')
        .getPublicUrl(filePath);

      if (!data.publicUrl) throw new Error("Falha ao gerar link público");

      alert("SUCESSO! Imagem enviada para o servidor."); // Diagnóstico 2
      
      setFormData(prev => ({ ...prev, cover_url: data.publicUrl }));
      
    } catch (error: any) {
      alert('ERRO NO UPLOAD: ' + error.message); // Diagnóstico de Erro
    } finally {
      setUploading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (!hasAtLeastOneCompetency) throw new Error('PREENCHA PELO MENOS 1 COMPETÊNCIA.');

      let parsedQuiz: any[] = [];
      try {
        parsedQuiz = JSON.parse(formData.quiz_data);
      } catch {
        throw new Error('FORMATO INVÁLIDO NO QUIZ: Verifique a sintaxe JSON.');
      }

      const technical_skills = joinCompetencies(competencies);

      const formattedData = {
        title: formData.title,
        description: formData.description,
        category: formData.category,
        cover_url: formData.cover_url,
        read_time: formData.read_time,
        level: formData.level,
        status: formData.status,
        content_html: formData.content_html,
        technical_skills,
        tags: formData.tags.split(',').map((t) => t.trim()).filter((t) => t !== ''),
        quiz_data: parsedQuiz,
      };

      await onSave(formattedData);
    } catch (err: any) {
      alert('FALHA NA MISSÃO: ' + (err?.message || err));
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
                {initialData ? 'EDITAR PROTOCOLO' : 'NOVO PROTOCOLO'}
              </h3>
              <p className="text-[10px] text-text-muted uppercase tracking-widest">
                Ambiente de operação desktop
              </p>
            </div>
            <button onClick={onClose} className="text-text-muted hover:text-white transition-colors ml-auto">
              <X size={22} />
            </button>
          </div>

          <div className="mt-4 flex gap-2">
            <button type="button" onClick={() => setActiveTab('settings')} className={`px-4 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest border transition-all ${activeTab === 'settings' ? 'bg-amber-500 text-black border-amber-500' : 'bg-black/30 text-text-secondary border-graphite-700'}`}>
              <span className="inline-flex items-center gap-2"><Settings size={14} /> 1. Configurações</span>
            </button>
            <button type="button" onClick={() => setActiveTab('content')} className={`px-4 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest border transition-all ${activeTab === 'content' ? 'bg-amber-500 text-black border-amber-500' : 'bg-black/30 text-text-secondary border-graphite-700'}`}>
              <span className="inline-flex items-center gap-2"><FileCode size={14} /> 2. Conteúdo HTML</span>
            </button>
            <button type="button" onClick={() => setActiveTab('quiz')} className={`px-4 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest border transition-all ${activeTab === 'quiz' ? 'bg-amber-500 text-black border-amber-500' : 'bg-black/30 text-text-secondary border-graphite-700'}`}>
              <span className="inline-flex items-center gap-2"><ListChecks size={14} /> 3. Quiz Tático</span>
            </button>
          </div>
        </header>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {activeTab === 'settings' && (
            <div className="space-y-6 animate-fade-in">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="md:col-span-2">
                  <label className="block text-[10px] font-bold text-amber-500 uppercase mb-2">Título do Manual</label>
                  <input required value={formData.title} onChange={(e) => setFormData({ ...formData, title: e.target.value })} className="w-full bg-graphite-900 border border-graphite-600 rounded-lg p-3 text-sm text-white focus:border-amber-500 outline-none" />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-amber-500 uppercase mb-2">Nível</label>
                  <select value={formData.level} onChange={(e) => setFormData({ ...formData, level: e.target.value as EbookLevel })} className="w-full bg-graphite-900 border border-graphite-600 rounded-lg p-3 text-sm text-white focus:border-amber-500 outline-none">
                    <option value="Básico">Básico</option>
                    <option value="Intermediário">Intermediário</option>
                    <option value="Avançado">Avançado</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-[10px] font-bold text-amber-500 uppercase mb-2">Categoria</label>
                  <select value={formData.category} onChange={(e) => setFormData({ ...formData, category: e.target.value })} className="w-full bg-graphite-900 border border-graphite-600 rounded-lg p-3 text-sm text-white focus:border-amber-500 outline-none">
                    <option>Mindset do Guerreiro</option>
                    <option>Doutrina Operacional</option>
                    <option>Psicologia do Confronto</option>
                    <option>Liderança de Elite</option>
                    <option>Sobrevivência & Resiliência</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-amber-500 uppercase mb-2">Tempo</label>
                  <input type="text" value={formData.read_time} onChange={(e) => setFormData({ ...formData, read_time: e.target.value })} className="w-full bg-graphite-900 border border-graphite-600 rounded-lg p-3 text-sm text-white focus:border-amber-500 outline-none" />
                </div>
                
                {/* ÁREA DE UPLOAD */}
                <div>
                  <label className="block text-[10px] font-bold text-amber-500 uppercase mb-2">Capa do Protocolo</label>
                  <div className="relative group">
                    <input 
                      type="url" 
                      value={formData.cover_url} 
                      onChange={(e) => setFormData({ ...formData, cover_url: e.target.value })} 
                      placeholder="URL ou Upload..."
                      className="w-full bg-graphite-900 border border-graphite-600 rounded-lg p-3 pl-10 text-sm text-white focus:border-amber-500 outline-none" 
                    />
                    <div className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted">
                        <ImageIcon size={16} />
                    </div>
                    
                    <label className="absolute right-2 top-1/2 -translate-y-1/2 cursor-pointer bg-graphite-700 hover:bg-amber-600 hover:text-black text-xs text-white px-3 py-1.5 rounded transition-colors flex items-center gap-2">
                        {uploading ? <Loader2 className="animate-spin" size={14} /> : <Upload size={14} />}
                        <span className="uppercase font-bold text-[10px]">{uploading ? 'ENVIANDO...' : 'UPLOAD'}</span>
                        <input 
                            type="file" 
                            accept="image/*" 
                            className="hidden" 
                            onChange={handleCoverUpload}
                            disabled={uploading}
                        />
                    </label>
                  </div>
                  {formData.cover_url && (
                      <div className="mt-2 h-20 w-full overflow-hidden rounded border border-graphite-700 relative">
                          <img src={formData.cover_url} alt="Preview" className="w-full h-full object-cover opacity-60" />
                          <span className="absolute bottom-1 right-1 bg-green-500 text-black text-[9px] font-bold px-1 rounded">IMAGEM OK</span>
                      </div>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="md:col-span-2">
                  <label className="block text-[10px] font-bold text-amber-500 uppercase mb-2">Resumo para o Card</label>
                  <textarea rows={2} value={formData.description} onChange={(e) => setFormData({ ...formData, description: e.target.value })} className="w-full bg-graphite-900 border border-graphite-600 rounded-lg p-3 text-sm text-white focus:border-amber-500 outline-none resize-none" />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-amber-500 uppercase mb-2">Tags</label>
                  <input value={formData.tags} onChange={(e) => setFormData({ ...formData, tags: e.target.value })} placeholder="Ex: fbi, leitura corporal" className="w-full bg-graphite-900 border border-graphite-600 rounded-lg p-3 text-sm text-white focus:border-amber-500 outline-none" />
                </div>
              </div>

              <div className="bg-black/25 border border-graphite-700 rounded-xl p-4">
                <div className="flex items-center justify-between gap-3 mb-3">
                  <p className="text-[10px] font-black text-amber-500 uppercase tracking-widest">Ementa Técnica / Competências</p>
                  <span className={`text-[10px] font-black uppercase px-2 py-1 rounded border ${hasAtLeastOneCompetency ? 'bg-green-500/10 text-green-400 border-green-500/20' : 'bg-red-500/10 text-red-400 border-red-500/20'}`}>
                    {hasAtLeastOneCompetency ? 'OK' : 'OBRIGATÓRIO'}
                  </span>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {competencies.map((val, idx) => (
                    <div key={idx}>
                      <label className="block text-[10px] font-bold text-amber-500 uppercase mb-2">competência {idx + 1}</label>
                      <input value={val} onChange={(e) => { const next = [...competencies]; next[idx] = e.target.value; setCompetencies(next); }} className="w-full bg-graphite-900 border border-graphite-600 rounded-lg p-3 text-sm text-white focus:border-amber-500 outline-none" />
                    </div>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-bold text-amber-500 uppercase mb-2">Status</label>
                  <select value={formData.status} onChange={(e) => setFormData({ ...formData, status: e.target.value as EbookStatus })} className="w-full bg-graphite-900 border border-graphite-600 rounded-lg p-3 text-sm text-white focus:border-amber-500 outline-none">
                    <option value="published">Publicado</option>
                    <option value="draft">Rascunho</option>
                  </select>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'content' && (
            <div className="h-full flex flex-col space-y-4 animate-fade-in">
              <textarea required value={formData.content_html} onChange={(e) => setFormData({ ...formData, content_html: e.target.value })} className="w-full bg-graphite-900 p-6 rounded-xl border border-graphite-600 text-sm font-mono text-amber-400 outline-none focus:border-amber-500 min-h-[300px]" placeholder="Cole seu código HTML aqui." />
            </div>
          )}

          {activeTab === 'quiz' && (
            <div className="h-full flex flex-col space-y-4 animate-fade-in">
              <textarea value={formData.quiz_data} onChange={(e) => setFormData({ ...formData, quiz_data: e.target.value })} className="w-full bg-graphite-900 p-6 rounded-xl border border-graphite-600 text-sm font-mono text-amber-400 outline-none focus:border-amber-500 min-h-[300px]" placeholder='Cole o JSON do quiz aqui.' />
            </div>
          )}

          <div className="flex items-center justify-end gap-3 pt-2">
            <Button type="button" variant="secondary" onClick={onClose} disabled={loading}>Cancelar</Button>
            <button type="submit" disabled={loading} className="bg-amber-500 hover:bg-amber-600 text-black font-black uppercase tracking-widest text-[11px] px-6 py-3 rounded-lg transition-all disabled:opacity-60 flex items-center gap-2">
              {loading ? <><Loader2 className="animate-spin" size={16} /> Salvando...</> : 'Salvar Protocolo'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
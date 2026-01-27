import React, { useEffect, useState, useMemo, useRef } from 'react';
import { supabase } from '../src/lib/supabase';
import { User, Book, Cohort } from '../types';
import { EbookForm } from './EbookForm';
import { Search, X, MessageSquare, Award, TrendingUp, BookOpen, Plus, Trash2, Edit, Users, Layers, Upload, CheckCircle, ShieldCheck, List, FileText, Download, AlertCircle, ArrowLeft, Calendar, UserPlus, Link as LinkIcon, Copy } from 'lucide-react';

interface AdminDashboardProps {
  user: User;
  onClose: () => void;
}

interface ProfileData {
  id: string;
  email: string;
  full_name: string;
  role: string;
  whatsapp?: string;
  occupation?: string;
  experience_level?: string;
  created_at: string;
  cohort_id?: string;
  cohort_name?: string;
  expires_at?: string;
  ticket_code?: string;
  is_lifetime?: boolean;
}

interface UserExam {
  id: string;
  user_id: string;
  ebook_id: string;
  score: number;
  status: string; 
  created_at: string;
}

interface SupportMessage {
  id: string;
  email: string;
  full_name: string;
  subject: string;
  content: string;
  created_at: string;
  status: 'new' | 'read';
}

interface WhitelistItem {
  id: string;
  cohort_id: string;
  allowed_code: string;
  used_at: string | null;
  created_at: string;
}

type MainTab = 'intelligence' | 'content' | 'messages' | 'cohorts' | 'quick_access';
type SubTab = 'users' | 'ranking' | 'alerts';

export const AdminDashboard: React.FC<AdminDashboardProps> = ({ onClose }) => {
  // --- ESTADOS DE NAVEGAÇÃO ---
  const [mainTab, setMainTab] = useState<MainTab>('intelligence');
  const [subTab, setSubTab] = useState<SubTab>('users');

  // --- ESTADOS DE DADOS ---
  const [profiles, setProfiles] = useState<ProfileData[]>([]);
  const [attempts, setAttempts] = useState<UserExam[]>([]); 
  const [ebooks, setEbooks] = useState<Book[]>([]);
  const [messages, setMessages] = useState<SupportMessage[]>([]);
  const [cohorts, setCohorts] = useState<Cohort[]>([]);
  const [whitelist, setWhitelist] = useState<WhitelistItem[]>([]);
  
  // --- ESTADOS DE CONTROLE ---
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [isEditingBook, setIsEditingBook] = useState(false);
  const [selectedBook, setSelectedBook] = useState<Book | undefined>(undefined);
  
  // --- ESTADOS: TURMAS ---
  const [newCohortName, setNewCohortName] = useState('');
  const [newCohortValidity, setNewCohortValidity] = useState('365');
  const [selectedCohort, setSelectedCohort] = useState<Cohort | null>(null);
  
  // --- ESTADOS: IMPORTAÇÃO ---
  const [isImporting, setIsImporting] = useState(false);
  const [importText, setImportText] = useState('');
  const [singleCode, setSingleCode] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  // --- ESTADOS: ACESSO RÁPIDO (LINK MÁGICO) ---
  const [quickValidity, setQuickValidity] = useState('365');
  const [generatedLink, setGeneratedLink] = useState('');
  const [isGeneratingLink, setIsGeneratingLink] = useState(false);

  // === CARREGAMENTO INICIAL ===
  useEffect(() => {
    fetchAllData();
  }, []);

  const fetchAllData = async () => {
    setLoading(true);
    try {
      // Carrega tudo em paralelo para velocidade
      const [profilesRes, examsRes, cohortsRes, ebooksRes, msgsRes, whitelistRes] = await Promise.all([
        supabase.from('profiles').select('*').order('created_at', { ascending: false }),
        supabase.from('user_exams').select('*').order('created_at', { ascending: false }),
        supabase.from('cohorts').select('*').order('created_at', { ascending: false }),
        supabase.from('ebooks').select('*').order('created_at', { ascending: false }),
        supabase.from('messages').select('*').order('created_at', { ascending: false }),
        supabase.from('whitelist').select('*')
      ]);

      // Processamento de Perfis (Join Manual com Turmas)
      const enrichedProfiles = (profilesRes.data || []).map((p: any) => ({
        ...p,
        cohort_name: cohortsRes.data?.find((c: any) => c.id === p.cohort_id)?.name || '-'
      }));

      setProfiles(enrichedProfiles);
      setAttempts(examsRes.data || []); 
      setCohorts(cohortsRes.data || []);
      setWhitelist(whitelistRes.data || []);
      setMessages(msgsRes.data || []);
      
      const formattedBooks: Book[] = (ebooksRes.data || []).map((b: any) => ({
        id: b.id,
        title: b.title,
        description: b.description,
        category: b.category,
        coverUrl: b.cover_url,
        tags: b.tags || [],
        content: b.content_html,
        readTime: b.read_time,
        level: b.level,
        status: b.status,
        technical_skills: b.technical_skills,
        quiz_data: b.quiz_data
      }));
      setEbooks(formattedBooks);

    } catch (error) {
      console.error('Erro crítico ao buscar dados:', error);
    } finally {
      setLoading(false);
    }
  };

  // === AÇÕES: CONTEÚDO E SUPORTE ===
  const handleDeleteBook = async (id: string) => { 
    if (!confirm('Tem certeza que deseja excluir este protocolo?')) return; 
    await supabase.from('ebooks').delete().eq('id', id); 
    fetchAllData(); 
  };

  const handleSaveBook = () => { 
    setIsEditingBook(false); 
    setSelectedBook(undefined); 
    fetchAllData(); 
  };

  const handleDeleteMessage = async (id: string) => { 
    if (!confirm('Excluir mensagem permanentemente?')) return; 
    await supabase.from('messages').delete().eq('id', id); 
    fetchAllData(); 
  };

  // === INTELIGÊNCIA: RANKING & RADAR ===
  const ranking = useMemo(() => {
    const userStats: Record<string, { passedCount: number, name: string, scoreSum: number }> = {};
    attempts.filter(a => a.status === 'approved').forEach(attempt => {
      if (!userStats[attempt.user_id]) {
        const profile = profiles.find(p => p.id === attempt.user_id);
        userStats[attempt.user_id] = { passedCount: 0, name: profile?.full_name || 'Agente', scoreSum: 0 };
      }
      userStats[attempt.user_id].passedCount += 1;
      userStats[attempt.user_id].scoreSum += attempt.score;
    });
    return Object.entries(userStats).sort(([, a], [, b]) => b.passedCount - a.passedCount || b.scoreSum - a.scoreSum).slice(0, 10);
  }, [attempts, profiles]);

  const strugglingUsers = useMemo(() => {
    const fails: Record<string, Record<string, number>> = {};
    attempts.filter(a => a.status !== 'approved').forEach(a => {
      if (!fails[a.user_id]) fails[a.user_id] = {};
      if (!fails[a.user_id][a.ebook_id]) fails[a.user_id][a.ebook_id] = 0;
      fails[a.user_id][a.ebook_id] += 1;
    });
    const alerts: Array<{ name: string, book: string, count: number, whatsapp?: string }> = [];
    Object.entries(fails).forEach(([userId, booksMap]) => {
      Object.entries(booksMap).forEach(([bookId, count]) => {
        if (count >= 2) { 
          const profile = profiles.find(p => p.id === userId);
          const bookTitle = ebooks.find(e => e.id === bookId)?.title || 'Manual';
          alerts.push({ name: profile?.full_name || 'Desconhecido', whatsapp: profile?.whatsapp, book: bookTitle, count });
        }
      });
    });
    return alerts;
  }, [attempts, profiles, ebooks]);

  // === AÇÕES: TURMAS ===
  const handleCreateCohort = async () => {
    if (!newCohortName.trim()) return;
    const { error } = await supabase.from('cohorts').insert([{ name: newCohortName, validity_days: parseInt(newCohortValidity) }]);
    if (!error) { setNewCohortName(''); fetchAllData(); } else { alert('Erro ao criar turma'); }
  };

  const handleDeleteCohort = async (id: string) => {
    if (!confirm('ATENÇÃO: Excluir turma removerá o histórico associado. Continuar?')) return;
    await supabase.from('cohorts').delete().eq('id', id);
    if (selectedCohort?.id === id) setSelectedCohort(null);
    fetchAllData();
  };

  // === GERADOR DE LINK INDIVIDUAL (MÁGICO & CORRIGIDO) ===
  const generateMagicLink = async () => {
    setIsGeneratingLink(true);
    setGeneratedLink('');
    try {
        const days = parseInt(quickValidity);
        let targetCohortId = '';

        // 1. ESTRATÉGIA SEGURA: Consulta o Banco DIRETAMENTE (não confia no state local)
        const cohortName = `INDIVIDUAL - ${days} DIAS`;
        
        // Tenta achar a turma no banco
        const { data: existingCohort, error: searchError } = await supabase
            .from('cohorts')
            .select('id')
            .eq('name', cohortName)
            .eq('validity_days', days)
            .maybeSingle();

        if (existingCohort) {
            targetCohortId = existingCohort.id;
        } else {
            // Se não existe, cria AGORA no banco
            const { data: newCohort, error: createError } = await supabase
                .from('cohorts')
                .insert([{ name: cohortName, validity_days: days }])
                .select()
                .single();
            
            if (createError || !newCohort) throw new Error('Erro crítico ao criar grupo de validade.');
            targetCohortId = newCohort.id;
            
            // Atualiza a lista local para refletir a nova turma
            fetchAllData(); 
        }

        // 2. Gera código único e vincula à Turma confirmada
        const uniqueCode = `ATIV-${Math.random().toString(36).substring(2, 8).toUpperCase()}`;
        
        const { error: wlError } = await supabase.from('whitelist').insert([{
            cohort_id: targetCohortId, // ID confirmado do banco
            allowed_code: uniqueCode
        }]);

        if (wlError) throw wlError;

        // 3. Monta o Link
        const link = `${window.location.origin}/?invite=${uniqueCode}`;
        setGeneratedLink(link);

    } catch (err: any) {
        alert('Erro ao gerar link: ' + err.message);
    } finally {
        setIsGeneratingLink(false);
    }
  };

  const copyLink = () => {
      navigator.clipboard.writeText(generatedLink);
      alert('Link copiado!');
  };

  // === IMPORTAÇÃO & WHITELIST (MANUAL E CSV) ===
  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (e) => setImportText(e.target?.result as string);
    reader.readAsText(file);
  };

  // Adiciona códigos (um ou vários)
  const addCodesToWhitelist = async (codes: string[]) => {
     if (!selectedCohort) return;
     const whitelistItems = codes.map(code => ({
       cohort_id: selectedCohort.id,
       allowed_code: code.trim().toUpperCase()
     }));

     setLoading(true);
     const { error } = await supabase.from('whitelist').insert(whitelistItems);
     setLoading(false);
     
     if (error) {
        if (error.code === '23505') alert('Atenção: Algumas matrículas já existiam e foram ignoradas.');
        else alert('Erro: ' + error.message);
     } else {
        alert(`${whitelistItems.length} Matrícula(s) autorizada(s)!`);
        setIsImporting(false);
        setImportText('');
        setSingleCode('');
        fetchAllData();
     }
  };

  // === RELATÓRIOS E EXPORTAÇÃO ===
  const getCohortReportData = (cohortId: string) => {
    const cohortWhitelist = whitelist.filter(w => w.cohort_id === cohortId);
    const cohortUsers = profiles.filter(p => p.cohort_id === cohortId);

    const activeRows = cohortUsers.map(user => {
        const userAttempts = attempts.filter(a => a.user_id === user.id);
        const approvedCount = userAttempts.filter(a => a.status === 'approved').length;
        
        return {
            matricula: user.ticket_code || 'LINK',
            nome: user.full_name,
            status: 'ATIVO',
            data_cadastro: new Date(user.created_at).toLocaleDateString(),
            aprovados: approvedCount,
            expires: user.expires_at ? new Date(user.expires_at).toLocaleDateString() : 'Vitalício'
        };
    });

    const pendingRows = cohortWhitelist
        .filter(w => w.used_at === null)
        .map(w => ({
            matricula: w.allowed_code,
            nome: '-',
            status: 'PENDENTE',
            data_cadastro: '-',
            aprovados: 0,
            expires: '-'
        }));
    
    return [...activeRows, ...pendingRows];
  };

  const exportToCSV = () => {
    if (!selectedCohort) return;
    const data = getCohortReportData(selectedCohort.id);
    const headers = ['Matricula', 'Nome', 'Status', 'Data Ativacao', 'Validade', 'Aprovados'];
    const csvRows = [headers.join(';')];
    data.forEach(row => csvRows.push([row.matricula, `"${row.nome}"`, row.status, row.data_cadastro, row.expires, row.aprovados].join(';')));
    const blob = new Blob([csvRows.join('\n')], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Relatorio_${selectedCohort.name}.csv`;
    a.click();
  };

  const filteredProfiles = profiles.filter(p => (p.full_name?.toLowerCase() || '').includes(searchTerm.toLowerCase()));

  // === RENDER: MODAL DE EDIÇÃO DE EBOOK ===
  if (isEditingBook) {
    return (
      <div className="fixed inset-0 z-50 bg-black overflow-y-auto animate-fade-in">
        <EbookForm 
          initialData={selectedBook} 
          onClose={() => setIsEditingBook(false)} 
          onSave={async (data) => { 
            if (selectedBook) { await supabase.from('ebooks').update(data).eq('id', selectedBook.id); } 
            else { await supabase.from('ebooks').insert([data]); } 
            handleSaveBook(); 
          }} 
        />
      </div>
    );
  }

  // === RENDER: MODAL DE ADIÇÃO DE AGENTES (NA TURMA) ===
  if (isImporting && selectedCohort) {
    return (
        <div className="fixed inset-0 z-[60] bg-black/90 backdrop-blur-sm flex items-center justify-center p-4 animate-fade-in">
            <div className="bg-graphite-800 border border-graphite-700 w-full max-w-2xl rounded-2xl p-6 shadow-2xl">
                <div className="flex justify-between items-center mb-6">
                    <h3 className="text-xl font-display font-bold text-white uppercase flex items-center gap-2">
                        <UserPlus className="text-amber-500" /> Adicionar Agentes - {selectedCohort.name}
                    </h3>
                    <button onClick={() => setIsImporting(false)}><X className="text-text-muted hover:text-white" /></button>
                </div>
                
                <div className="space-y-8">
                    {/* OPÇÃO 1: ÚNICO */}
                    <div className="bg-black/40 p-4 rounded-xl border border-graphite-700">
                        <label className="text-xs font-bold text-amber-500 uppercase mb-2 block">Adicionar Único Agente</label>
                        <div className="flex gap-2">
                            <input 
                                type="text" 
                                value={singleCode} 
                                onChange={(e) => setSingleCode(e.target.value)} 
                                placeholder="DIGITE A MATRÍCULA / CÓDIGO" 
                                className="flex-1 bg-graphite-800 border border-graphite-600 rounded-lg p-3 text-white font-bold uppercase outline-none focus:border-amber-500"
                            />
                            <button 
                                onClick={() => addCodesToWhitelist([singleCode])}
                                disabled={!singleCode.trim()}
                                className="bg-amber-500 hover:bg-amber-600 disabled:opacity-50 text-black px-4 rounded-lg font-black uppercase"
                            >
                                <Plus size={20} />
                            </button>
                        </div>
                    </div>

                    <div className="relative flex items-center justify-center">
                        <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-graphite-600"></div></div>
                        <span className="relative bg-graphite-800 px-2 text-[10px] text-text-muted uppercase font-bold">OU (EM MASSA)</span>
                    </div>

                    {/* OPÇÃO 2: CSV */}
                    <div>
                        <div className="flex justify-between items-end mb-1">
                           <label className="text-xs font-bold text-text-muted uppercase block">Lista de Matrículas (CSV/TXT)</label>
                           <div className="flex items-center gap-2">
                              <input type="file" ref={fileInputRef} onChange={handleFileUpload} className="hidden" accept=".csv,.txt" />
                              <button onClick={() => fileInputRef.current?.click()} className="text-[10px] bg-graphite-700 hover:bg-white hover:text-black text-white px-2 py-1 rounded font-bold uppercase transition-colors flex items-center gap-1"><Upload size={10} /> Carregar Arquivo</button>
                           </div>
                        </div>
                        <textarea value={importText} onChange={(e) => setImportText(e.target.value)} placeholder="Ex:&#10;992102&#10;884102&#10;CNV-1029" className="w-full h-32 bg-black border border-graphite-600 rounded-lg p-4 text-white font-mono text-sm focus:border-amber-500 outline-none resize-none" />
                        <button onClick={() => addCodesToWhitelist(importText.split(/\r?\n/).filter(l => l.trim()))} disabled={!importText.trim()} className="w-full mt-4 bg-graphite-700 hover:bg-white hover:text-black text-white p-3 rounded-lg font-bold uppercase transition-all">Processar Lista</button>
                    </div>
                </div>
            </div>
        </div>
    );
  }

  // === RENDER: DASHBOARD PRINCIPAL ===
  return (
    <div className="fixed inset-0 z-50 bg-black text-text-primary overflow-y-auto animate-fade-in">
      <div className="sticky top-0 bg-graphite-900 border-b border-graphite-700 p-4 flex flex-col md:flex-row justify-between items-center z-20 shadow-xl gap-4">
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-4">
            <img src="/logo_ativ.png" alt="ATIV" className="h-10 md:h-12 w-auto object-contain drop-shadow-[0_0_8px_rgba(245,158,11,0.2)]" />
            <div className="flex flex-col justify-center">
              <h2 className="text-xl md:text-2xl font-display font-bold text-white uppercase tracking-tighter leading-none">COMANDO & CONTROLE</h2>
            </div>
          </div>
          <div className="flex bg-black/50 p-1 rounded-lg border border-graphite-700 md:ml-4 overflow-x-auto max-w-[200px] md:max-w-none">
            <button onClick={() => setMainTab('intelligence')} className={`px-4 py-2 rounded-md text-xs font-bold uppercase whitespace-nowrap flex gap-2 ${mainTab === 'intelligence' ? 'bg-amber-500 text-black shadow-lg' : 'text-text-muted hover:text-white'}`}><Users size={16} /><span className="hidden sm:inline">Inteligência</span></button>
            <button onClick={() => setMainTab('quick_access')} className={`px-4 py-2 rounded-md text-xs font-bold uppercase whitespace-nowrap flex gap-2 ${mainTab === 'quick_access' ? 'bg-green-500 text-black shadow-lg' : 'text-text-muted hover:text-white'}`}><LinkIcon size={16} /><span className="hidden sm:inline">Acesso Rápido</span></button>
            <button onClick={() => setMainTab('cohorts')} className={`px-4 py-2 rounded-md text-xs font-bold uppercase whitespace-nowrap flex gap-2 ${mainTab === 'cohorts' ? 'bg-amber-500 text-black shadow-lg' : 'text-text-muted hover:text-white'}`}><Layers size={16} /><span className="hidden sm:inline">Turmas</span></button>
            <button onClick={() => setMainTab('content')} className={`px-4 py-2 rounded-md text-xs font-bold uppercase whitespace-nowrap flex gap-2 ${mainTab === 'content' ? 'bg-amber-500 text-black shadow-lg' : 'text-text-muted hover:text-white'}`}><BookOpen size={16} /><span className="hidden sm:inline">Acervo</span></button>
            <button onClick={() => setMainTab('messages')} className={`px-4 py-2 rounded-md text-xs font-bold uppercase whitespace-nowrap flex gap-2 ${mainTab === 'messages' ? 'bg-amber-500 text-black shadow-lg' : 'text-text-muted hover:text-white'}`}><MessageSquare size={16} /><span className="hidden sm:inline">Mensagens</span></button>
          </div>
        </div>
        <button onClick={onClose} className="p-2 hover:bg-graphite-800 rounded-full transition-colors text-text-muted hover:text-white"><X size={24} /></button>
      </div>

      <div className="max-w-7xl mx-auto p-6 space-y-8">
        
        {/* ABA: ACESSO RÁPIDO (LINK MÁGICO) */}
        {mainTab === 'quick_access' && (
            <div className="animate-fade-in space-y-6">
                <div className="bg-graphite-800 border border-graphite-700 p-8 rounded-2xl max-w-2xl mx-auto shadow-2xl">
                    <h3 className="text-2xl font-display font-bold text-white uppercase flex items-center gap-3 mb-6">
                        <LinkIcon className="text-green-500" size={32} /> Gerador de Link Individual
                    </h3>
                    
                    <p className="text-text-secondary text-sm mb-8">
                        Use esta ferramenta para criar acesso imediato para um único agente (ex: venda avulsa ou cortesia).
                        O sistema criará um link de ativação exclusivo.
                    </p>

                    <div className="space-y-6">
                        <div>
                            <label className="text-xs font-bold text-text-muted uppercase mb-2 block">Duração do Acesso</label>
                            <select 
                                value={quickValidity} 
                                onChange={(e) => setQuickValidity(e.target.value)}
                                className="w-full bg-black border border-graphite-600 rounded-lg p-4 text-white font-bold outline-none focus:border-green-500 transition-colors uppercase"
                            >
                                <option value="30">1 Mês (Degustação)</option>
                                <option value="180">6 Meses (Semestral)</option>
                                <option value="365">1 Ano (Anual)</option>
                                <option value="730">2 Anos (Bi-anual)</option>
                                <option value="36500">Vitalício</option>
                            </select>
                        </div>

                        {!generatedLink ? (
                            <button 
                                onClick={generateMagicLink}
                                disabled={isGeneratingLink}
                                className="w-full bg-green-500 hover:bg-green-600 text-black font-black uppercase py-4 rounded-xl flex items-center justify-center gap-2 transition-all shadow-lg hover:shadow-green-500/20"
                            >
                                {isGeneratingLink ? <><div className="animate-spin rounded-full h-4 w-4 border-b-2 border-black"></div> Gerando...</> : 'GERAR LINK DE ACESSO'}
                            </button>
                        ) : (
                            <div className="animate-fade-in bg-black/60 border border-green-500/30 p-6 rounded-xl text-center">
                                <div className="text-green-500 font-bold uppercase text-xs mb-2 flex items-center justify-center gap-2">
                                    <CheckCircle size={14} /> Link Gerado com Sucesso
                                </div>
                                <div className="bg-black p-3 rounded border border-graphite-700 text-text-primary font-mono text-sm break-all mb-4 select-all">
                                    {generatedLink}
                                </div>
                                <div className="flex gap-2">
                                    <button onClick={copyLink} className="flex-1 bg-white hover:bg-gray-200 text-black font-bold uppercase py-3 rounded-lg flex items-center justify-center gap-2 transition-colors">
                                        <Copy size={18} /> Copiar Link
                                    </button>
                                    <button onClick={() => setGeneratedLink('')} className="bg-graphite-700 hover:bg-graphite-600 text-white px-4 rounded-lg font-bold uppercase">
                                        Novo
                                    </button>
                                </div>
                                <p className="text-[10px] text-text-muted mt-4">
                                    * Envie este link diretamente para o agente. Ele poderá criar a senha imediatamente.
                                </p>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        )}

        {mainTab === 'intelligence' && (
          <>
            <div className="flex gap-4 border-b border-graphite-700 pb-1 mb-6 overflow-x-auto">
              <button onClick={() => setSubTab('users')} className={`pb-3 px-2 text-xs font-bold uppercase tracking-wider transition-colors whitespace-nowrap ${subTab === 'users' ? 'text-amber-500 border-b-2 border-amber-500' : 'text-text-muted hover:text-white'}`}>Base de Agentes</button>
              <button onClick={() => setSubTab('ranking')} className={`pb-3 px-2 text-xs font-bold uppercase tracking-wider transition-colors whitespace-nowrap ${subTab === 'ranking' ? 'text-purple-500 border-b-2 border-purple-500' : 'text-text-muted hover:text-white'}`}>Ranking Elite</button>
              <button onClick={() => setSubTab('alerts')} className={`pb-3 px-2 text-xs font-bold uppercase tracking-wider transition-colors whitespace-nowrap ${subTab === 'alerts' ? 'text-red-500 border-b-2 border-red-500' : 'text-text-muted hover:text-white'}`}>Radar de Risco</button>
            </div>
            {subTab === 'users' && (
              <div className="space-y-6 animate-fade-in">
                <div className="relative">
                  <input type="text" placeholder="BUSCAR POR NOME..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="w-full bg-graphite-800 border border-graphite-600 rounded-lg py-4 pl-12 pr-4 text-white focus:border-amber-500 outline-none uppercase font-bold placeholder:text-gray-600"/>
                  <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500" size={20} />
                </div>
                <div className="bg-graphite-800 border border-graphite-700 rounded-xl overflow-hidden overflow-x-auto">
                  <table className="w-full text-left border-collapse min-w-[800px]">
                    <thead>
                      <tr className="bg-graphite-900 border-b border-graphite-700 text-[10px] uppercase font-black text-text-muted tracking-widest">
                        <th className="p-4">Agente</th>
                        <th className="p-4">Turma / Validade</th>
                        <th className="p-4">Contato</th>
                        <th className="p-4">Perfil</th>
                        <th className="p-4">Cadastro</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-graphite-700">
                      {loading ? <tr><td colSpan={5} className="p-8 text-center text-text-muted">CARREGANDO...</td></tr> : filteredProfiles.map((profile) => {
                        return (
                          <tr key={profile.id} className="hover:bg-graphite-700/50">
            <td className="p-4">
              <div className="font-bold text-white">{profile.full_name || 'SEM NOME'}</div>
              <div className="text-xs text-text-muted">{profile.email.includes('ativ.local') ? 'Matrícula: ' + profile.ticket_code : profile.email}</div>
            </td>
            <td className="p-4">
              <div className="flex flex-col gap-1">
                <span className="text-xs font-bold text-amber-500">{profile.cohort_name}</span>
                <span className={`text-[10px] font-bold uppercase ${(!profile.is_lifetime && profile.expires_at && new Date(profile.expires_at) < new Date()) ? 'text-red-500' : 'text-green-500'}`}>
                  {profile.is_lifetime 
                    ? 'VITALÍCIO' 
                    : (profile.expires_at ? `Vence: ${new Date(profile.expires_at).toLocaleDateString()}` : 'VITALÍCIO')
                  }
                </span>
              </div>
            </td>
            <td className="p-4">{profile.whatsapp ? <a href={`https://wa.me/55${profile.whatsapp.replace(/\D/g, '')}`} target="_blank" rel="noreferrer" className="text-green-500 font-bold text-xs">WhatsApp OK</a> : <span className="text-text-muted text-xs">N/A</span>}</td>
            <td className="p-4"><div className="flex flex-col"><span className="text-xs font-bold text-white">{profile.occupation || '-'}</span></div></td>
            <td className="p-4 text-xs text-text-muted font-mono">{new Date(profile.created_at).toLocaleDateString('pt-BR')}</td>
          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
            {subTab === 'ranking' && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 animate-fade-in">
                <div className="bg-graphite-800 border border-graphite-700 rounded-xl p-6">
                  <h3 className="text-lg font-bold text-purple-500 uppercase mb-4 flex items-center gap-2"><TrendingUp size={20} /> Top Agentes (Aprovados)</h3>
                  {ranking.length === 0 ? <div className="text-text-muted text-xs p-4 italic">Nenhum aprovado.</div> : <div className="space-y-4">{ranking.map(([userId, stats], index) => (<div key={userId} className="flex items-center justify-between p-4 bg-black/40 rounded-lg border border-graphite-700"><div className="flex items-center gap-4"><div className={`w-8 h-8 rounded-full flex items-center justify-center font-black text-sm ${index === 0 ? 'bg-amber-500 text-black' : 'bg-graphite-700 text-white'}`}>{index + 1}</div><div className="font-bold text-white uppercase">{stats.name}</div></div><div className="flex items-center gap-2 text-purple-400 font-bold"><Award size={16} /><span>{stats.passedCount} Aprovações</span></div></div>))}</div>}
                </div>
              </div>
            )}
            {subTab === 'alerts' && (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 animate-fade-in">
                {strugglingUsers.length === 0 ? <div className="col-span-full p-8 text-center text-text-muted">Nenhum risco.</div> : strugglingUsers.map((alert, idx) => (
                  <div key={idx} className="bg-graphite-800 border border-red-500/30 p-5 rounded-xl hover:border-red-500 transition-colors">
                    <div className="flex justify-between mb-4"><div className="font-bold text-white uppercase">{alert.name}</div><span className="bg-red-500/10 text-red-500 text-[10px] font-black px-2 py-1 rounded">{alert.count} ERROS</span></div>
                    <div className="text-xs text-text-muted mb-4">Dificuldade em: <span className="text-white font-bold">{alert.book}</span></div>
                  </div>
                ))}
              </div>
            )}
          </>
        )}

        {mainTab === 'cohorts' && (
          <div className="animate-fade-in space-y-6">
            {!selectedCohort ? (
              <>
                <h3 className="text-xl font-display font-bold text-white uppercase flex items-center gap-2">
                  <Layers size={24} className="text-amber-500"/> Gestão de Turmas (B2B & Lançamentos)
                </h3>
                <div className="bg-graphite-800 border border-graphite-700 p-6 rounded-xl flex flex-col md:flex-row gap-4 items-end">
                  <div className="flex-1 w-full space-y-2">
                    <label className="text-xs text-text-muted uppercase font-bold block">Nome da Nova Turma / Empresa</label>
                    <input type="text" value={newCohortName} onChange={(e) => setNewCohortName(e.target.value)} placeholder="Ex: GRUPO ALPHA" className="w-full bg-black border border-graphite-600 rounded-lg p-3 text-white focus:border-amber-500 outline-none uppercase font-bold" />
                  </div>
                  <div className="w-full md:w-48 space-y-2">
                    <label className="text-xs text-text-muted uppercase font-bold block">Validade (Dias)</label>
                    <select value={newCohortValidity} onChange={(e) => setNewCohortValidity(e.target.value)} className="w-full bg-black border border-graphite-600 rounded-lg p-3 text-white focus:border-amber-500 outline-none font-bold">
                        <option value="180">6 Meses (180)</option>
                        <option value="365">1 Ano (365)</option>
                        <option value="730">2 Anos (730)</option>
                        <option value="36500">Vitalício</option>
                    </select>
                  </div>
                  <button onClick={handleCreateCohort} disabled={!newCohortName.trim()} className="bg-amber-500 hover:bg-amber-600 disabled:opacity-50 text-black px-6 py-3 rounded-lg font-black uppercase tracking-wider flex items-center gap-2 transition-all w-full md:w-auto justify-center h-[50px]"><Plus size={20} /> Criar Turma</button>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {cohorts.length === 0 ? <p className="text-text-muted italic col-span-full text-center py-8">Nenhuma turma criada.</p> : cohorts.map(cohort => {
                    const studentCount = profiles.filter(p => p.cohort_id === cohort.id).length;
                    const allowedCount = whitelist.filter(w => w.cohort_id === cohort.id).length;
                    return (
                      <div key={cohort.id} className="bg-graphite-800 border border-graphite-700 rounded-xl p-5 hover:border-amber-500 transition-colors group relative cursor-pointer" onClick={() => setSelectedCohort(cohort)}>
                        <div className="flex justify-between items-start mb-4">
                          <div><h4 className="font-bold text-white text-lg uppercase">{cohort.name}</h4>
                          <div className="flex items-center gap-2 mt-1">
                             <span className="text-[10px] text-text-muted font-mono">{new Date(cohort.created_at).toLocaleDateString()}</span>
                             <span className="text-[10px] bg-amber-500/10 text-amber-500 px-1 rounded border border-amber-500/20 font-bold uppercase">{cohort.validity_days > 10000 ? 'VITALÍCIO' : `${cohort.validity_days} DIAS`}</span>
                          </div>
                          </div>
                          <button onClick={(e) => { e.stopPropagation(); handleDeleteCohort(cohort.id); }} className="text-graphite-600 hover:text-red-500 transition-colors"><Trash2 size={18} /></button>
                        </div>
                        <div className="grid grid-cols-2 gap-2 mb-4">
                            <div className="bg-black/30 p-2 rounded text-center">
                                <div className="text-xs text-text-muted uppercase font-bold">Liberados</div>
                                <div className="text-xl font-bold text-white">{allowedCount}</div>
                            </div>
                            <div className="bg-black/30 p-2 rounded text-center border border-amber-500/20">
                                <div className="text-xs text-text-muted uppercase font-bold">Ativados</div>
                                <div className="text-xl font-bold text-amber-500">{studentCount}</div>
                            </div>
                        </div>
                        <button className="w-full bg-graphite-700 group-hover:bg-white group-hover:text-black text-white text-xs font-bold uppercase py-3 rounded transition-all flex items-center justify-center gap-2"><List size={14} /> Painel & Whitelist</button>
                      </div>
                    );
                  })}
                </div>
              </>
            ) : (
              <div className="animate-fade-in">
                <div className="flex items-center gap-4 mb-6">
                    <button onClick={() => setSelectedCohort(null)} className="p-2 bg-graphite-800 hover:bg-white hover:text-black rounded-lg transition-colors"><ArrowLeft size={20} /></button>
                    <div>
                        <h3 className="text-2xl font-display font-bold text-white uppercase">{selectedCohort.name}</h3>
                        <p className="text-xs text-text-muted">Validade Padrão: {selectedCohort.validity_days > 10000 ? 'VITALÍCIA' : `${selectedCohort.validity_days} DIAS`}</p>
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
                    <div className="bg-graphite-800 border border-graphite-700 p-6 rounded-xl flex flex-col justify-between">
                        <div><h4 className="text-sm font-bold text-text-muted uppercase mb-2">Relatório Operacional</h4><p className="text-xs text-text-secondary mb-4">Lista completa para o RH.</p></div>
                        <button onClick={exportToCSV} className="w-full bg-green-600 hover:bg-green-500 text-white font-bold uppercase py-3 rounded flex items-center justify-center gap-2"><Download size={18} /> Baixar CSV</button>
                    </div>
                    <div className="bg-graphite-800 border border-graphite-700 p-6 rounded-xl flex flex-col justify-between">
                          <div><h4 className="text-sm font-bold text-text-muted uppercase mb-2">Expansão de Efetivo</h4><p className="text-xs text-text-secondary mb-4">Adicionar matrículas (Unitário ou Lote).</p></div>
                        <button onClick={() => setIsImporting(true)} className="w-full bg-amber-500 hover:bg-amber-600 text-black font-bold uppercase py-3 rounded flex items-center justify-center gap-2"><UserPlus size={18} /> Adicionar Agentes</button>
                    </div>
                </div>

                <div className="bg-graphite-800 border border-graphite-700 rounded-xl overflow-hidden">
                    <div className="p-4 border-b border-graphite-700 bg-black/20 flex justify-between items-center">
                        <h4 className="font-bold text-white uppercase text-sm">Efetivo Completo</h4>
                        <span className="text-[10px] text-text-muted uppercase">Ordenado por Status</span>
                    </div>
                    <div className="overflow-x-auto">
                        <table className="w-full text-left">
                            <thead>
                                <tr className="text-[10px] uppercase font-black text-text-muted tracking-widest bg-black/40">
                                    <th className="p-4">Matrícula</th>
                                    <th className="p-4">Agente</th>
                                    <th className="p-4">Status</th>
                                    <th className="p-4">Validade</th>
                                    <th className="p-4">Desempenho</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-graphite-700">
                                {getCohortReportData(selectedCohort.id).map((row, idx) => (
                                    <tr key={idx} className="hover:bg-graphite-700/50">
                                        <td className="p-4 font-mono text-xs text-white font-bold">{row.matricula}</td>
                                        <td className="p-4 text-sm text-text-secondary">{row.nome}</td>
                                        <td className="p-4">{row.status === 'ATIVO' ? <span className="bg-green-500/20 text-green-500 px-2 py-1 rounded text-[10px] font-black uppercase flex items-center gap-1 w-fit"><CheckCircle size={10} /> Ativo</span> : <span className="bg-red-500/10 text-red-500 px-2 py-1 rounded text-[10px] font-black uppercase flex items-center gap-1 w-fit"><AlertCircle size={10} /> Pendente</span>}</td>
                                        <td className="p-4 text-xs font-mono">{row.expires}</td>
                                        <td className="p-4">{row.status === 'ATIVO' ? <div className="flex gap-3 text-xs"><span className="text-purple-400 font-bold">{row.aprovados} Aprovados</span></div> : <span className="text-text-muted text-xs">-</span>}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
              </div>
            )}
          </div>
        )}

        {mainTab === 'content' && (
          <div className="animate-fade-in space-y-6">
            <div className="flex justify-between items-center"><h3 className="text-xl font-display font-bold text-white uppercase flex items-center gap-2"><BookOpen size={24} className="text-amber-500"/> Acervo Tático</h3><button onClick={() => { setSelectedBook(undefined); setIsEditingBook(true); }} className="bg-amber-500 hover:bg-amber-600 text-black px-6 py-3 rounded-lg font-black uppercase tracking-wider flex items-center gap-2 transition-all shadow-lg hover:shadow-amber-500/20"><Plus size={20} /> Novo Protocolo</button></div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">{ebooks.map(book => (<div key={book.id} className="bg-graphite-800 border border-graphite-700 rounded-xl overflow-hidden group hover:border-amber-500 transition-all"><div className="h-32 bg-black relative"><img src={book.coverUrl} alt={book.title} className="w-full h-full object-cover opacity-60 group-hover:opacity-100 transition-opacity" /><div className="absolute top-2 right-2 bg-black/80 px-2 py-1 rounded text-[10px] font-bold uppercase text-white border border-white/20">{book.status === 'published' ? 'Publicado' : 'Rascunho'}</div></div><div className="p-4"><h4 className="font-bold text-white uppercase text-sm mb-1 line-clamp-1">{book.title}</h4><p className="text-xs text-text-muted mb-4 line-clamp-2">{book.description}</p><div className="flex gap-2"><button onClick={() => { setSelectedBook(book); setIsEditingBook(true); }} className="flex-1 bg-graphite-700 hover:bg-white hover:text-black text-white text-xs font-bold uppercase py-2 rounded transition-colors flex items-center justify-center gap-1"><Edit size={14} /> Editar</button><button onClick={() => handleDeleteBook(book.id)} className="bg-red-500/10 hover:bg-red-500 text-red-500 hover:text-white px-3 rounded transition-colors"><Trash2 size={16} /></button></div></div></div>))}</div>
          </div>
        )}
        {mainTab === 'messages' && (
          <div className="animate-fade-in space-y-6">
              <h3 className="text-xl font-display font-bold text-white uppercase flex items-center gap-2"><MessageSquare size={24} className="text-amber-500"/> Suporte Operacional</h3>
              <div className="bg-graphite-800 border border-graphite-700 rounded-xl overflow-hidden">{messages.length === 0 ? <div className="p-12 text-center text-text-muted italic">Nenhuma mensagem.</div> : <table className="w-full text-left"><tbody className="divide-y divide-graphite-700">{messages.map(msg => (<tr key={msg.id} className="hover:bg-graphite-700/50"><td className="p-4 w-1/4"><div className="font-bold text-white">{msg.full_name}</div><div className="text-xs text-text-muted">{msg.email}</div><div className="text-[10px] text-text-muted mt-1">{new Date(msg.created_at).toLocaleDateString()}</div></td><td className="p-4"><div className="text-xs font-bold text-amber-500 uppercase mb-1">{msg.subject}</div><div className="text-sm text-text-secondary">{msg.content}</div></td><td className="p-4 w-20 text-right"><button onClick={() => handleDeleteMessage(msg.id)} className="text-text-muted hover:text-red-500"><Trash2 size={18} /></button></td></tr>))}</tbody></table>}</div>
          </div>
        )}
      </div>
    </div>
  );
};
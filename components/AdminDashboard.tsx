import React, { useEffect, useState, useMemo } from 'react';
import { supabase } from '../src/lib/supabase';
import { User, Book, Cohort } from '../types';
import { EbookForm } from './EbookForm';
import { Search, X, MessageSquare, Award, TrendingUp, BookOpen, Plus, Trash2, Edit, Users, Layers, Calendar, Clock } from 'lucide-react';

interface AdminDashboardProps {
  user: User;
  onClose: () => void;
}

// Tipos para Inteligência
interface ProfileData {
  id: string;
  email: string;
  full_name: string;
  role: string;
  whatsapp?: string;
  occupation?: string;
  experience_level?: string;
  main_goal?: string;
  created_at: string;
  // Novos campos
  cohort_id?: string;
  expires_at?: string;
}

// Interface para o Ranking (Tabela user_exams)
interface UserExam {
  id: string;
  user_id: string;
  ebook_id: string;
  score: number;
  status: string; 
  created_at: string;
}

// Interface para mensagens de suporte
interface SupportMessage {
  id: string;
  email: string;
  full_name: string;
  subject: string;
  content: string;
  created_at: string;
  status: 'new' | 'read';
}

// Navegação Principal
type MainTab = 'intelligence' | 'content' | 'messages' | 'cohorts';
type SubTab = 'users' | 'ranking' | 'alerts';

export const AdminDashboard: React.FC<AdminDashboardProps> = ({ onClose }) => {
  // Estados de Navegação
  const [mainTab, setMainTab] = useState<MainTab>('intelligence');
  const [subTab, setSubTab] = useState<SubTab>('users');

  // Estados de Dados
  const [profiles, setProfiles] = useState<ProfileData[]>([]);
  const [attempts, setAttempts] = useState<UserExam[]>([]); 
  const [ebooks, setEbooks] = useState<Book[]>([]);
  const [messages, setMessages] = useState<SupportMessage[]>([]);
  const [cohorts, setCohorts] = useState<Cohort[]>([]);
  
  // Estados de Controle
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [isEditingBook, setIsEditingBook] = useState(false);
  const [selectedBook, setSelectedBook] = useState<Book | undefined>(undefined);
  
  // Estado para Criar Turma
  const [newCohortName, setNewCohortName] = useState('');

  useEffect(() => {
    fetchAllData();
  }, []);

  const fetchAllData = async () => {
    setLoading(true);
    try {
      // 1. Dados de Inteligência e Turmas
      const { data: profilesData } = await supabase.from('profiles').select('*').order('created_at', { ascending: false });
      const { data: examsData } = await supabase.from('user_exams').select('*').order('created_at', { ascending: false });
      const { data: cohortsData } = await supabase.from('cohorts').select('*').order('created_at', { ascending: false });

      // 2. Dados de Conteúdo
      const { data: ebooksData } = await supabase.from('ebooks').select('*').order('created_at', { ascending: false });

      // 3. Dados de Mensagens
      const { data: msgsData } = await supabase.from('messages').select('*').order('created_at', { ascending: false });

      setProfiles(profilesData || []);
      setAttempts(examsData || []); 
      setCohorts(cohortsData || []);
      
      const formattedBooks: Book[] = (ebooksData || []).map((b: any) => ({
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
      setMessages(msgsData || []);

    } catch (error) {
      console.error('Erro ao buscar dados:', error);
    } finally {
      setLoading(false);
    }
  };

  // === AÇÕES DE CONTEÚDO ===
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
    if (!confirm('Excluir mensagem?')) return;
    await supabase.from('messages').delete().eq('id', id);
    fetchAllData();
  };

  // === AÇÕES DE TURMAS ===
  const handleCreateCohort = async () => {
    if (!newCohortName.trim()) return;
    const { error } = await supabase.from('cohorts').insert([{ name: newCohortName }]);
    if (!error) {
      setNewCohortName('');
      fetchAllData();
    } else {
      alert('Erro ao criar turma');
    }
  };

  const handleDeleteCohort = async (id: string) => {
    if (!confirm('ATENÇÃO: Excluir uma turma não exclui os alunos, apenas remove a associação. Continuar?')) return;
    await supabase.from('cohorts').delete().eq('id', id);
    fetchAllData();
  };

  // === AUXILIARES ===
  const getCohortName = (id?: string) => {
    if (!id) return '-';
    return cohorts.find(c => c.id === id)?.name || 'Desconhecida';
  };

  const getExpirationDisplay = (dateStr?: string) => {
    if (!dateStr) return <span className="text-green-500 font-bold text-[10px] uppercase">Vitalício</span>;
    const date = new Date(dateStr);
    const now = new Date();
    const isExpired = date < now;
    return (
      <span className={`text-[10px] font-bold uppercase ${isExpired ? 'text-red-500' : 'text-amber-500'}`}>
        {isExpired ? 'Expirou em: ' : 'Vence em: '} {date.toLocaleDateString('pt-BR')}
      </span>
    );
  };

  // === LÓGICA DE INTELIGÊNCIA (RANKING) ===
  const ranking = useMemo(() => {
    const userStats: Record<string, { passedCount: number, name: string, scoreSum: number }> = {};
    
    attempts.filter(a => a.status === 'approved').forEach(attempt => {
      if (!userStats[attempt.user_id]) {
        const profile = profiles.find(p => p.id === attempt.user_id);
        userStats[attempt.user_id] = { 
            passedCount: 0, 
            name: profile?.full_name || 'Agente Desconhecido', 
            scoreSum: 0 
        };
      }
      userStats[attempt.user_id].passedCount += 1;
      userStats[attempt.user_id].scoreSum += attempt.score;
    });

    return Object.entries(userStats)
      .sort(([, a], [, b]) => b.passedCount - a.passedCount || b.scoreSum - a.scoreSum)
      .slice(0, 10);
  }, [attempts, profiles]);

  // === LÓGICA DE RADAR DE RISCO ===
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
          const bookTitle = ebooks.find(e => e.id === bookId)?.title || 'Manual Desconhecido';
          alerts.push({ 
            name: profile?.full_name || 'Desconhecido', 
            whatsapp: profile?.whatsapp, 
            book: bookTitle, 
            count 
          });
        }
      });
    });
    return alerts;
  }, [attempts, profiles, ebooks]);

  const filteredProfiles = profiles.filter(p => 
    (p.full_name?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
    (p.email?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
    (p.occupation?.toLowerCase() || '').includes(searchTerm.toLowerCase())
  );

  const getWhatsappLink = (phone?: string) => {
    if (!phone) return null;
    const cleanPhone = phone.replace(/\D/g, '');
    return `https://wa.me/55${cleanPhone}`;
  };

  // === RENDERIZAÇÃO ===
  if (isEditingBook) {
    return (
      <div className="fixed inset-0 z-50 bg-black overflow-y-auto animate-fade-in">
        <EbookForm 
          initialData={selectedBook} 
          onClose={() => setIsEditingBook(false)} 
          onSave={async (data) => {
            if (selectedBook) {
               await supabase.from('ebooks').update(data).eq('id', selectedBook.id);
            } else {
               await supabase.from('ebooks').insert([data]);
            }
            handleSaveBook();
          }}
        />
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 bg-black text-text-primary overflow-y-auto animate-fade-in">
      
      {/* CABEÇALHO GLOBAL */}
      <div className="sticky top-0 bg-graphite-900 border-b border-graphite-700 p-4 flex flex-col md:flex-row justify-between items-center z-20 shadow-xl gap-4">
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-4">
            <img 
              src="/logo_ativ.png" 
              alt="ATIV BRASIL" 
              className="h-10 md:h-12 w-auto object-contain drop-shadow-[0_0_8px_rgba(245,158,11,0.2)]" 
            />
            <div className="flex flex-col justify-center">
              <h2 className="text-xl md:text-2xl font-display font-bold text-white uppercase tracking-tighter leading-none">
                COMANDO & CONTROLE
              </h2>
            </div>
          </div>
          
          {/* MENU PRINCIPAL */}
          <div className="flex bg-black/50 p-1 rounded-lg border border-graphite-700 md:ml-4 overflow-x-auto max-w-[200px] md:max-w-none">
            <button 
              onClick={() => setMainTab('intelligence')}
              className={`px-4 py-2 rounded-md text-xs font-bold uppercase transition-all flex items-center gap-2 whitespace-nowrap ${mainTab === 'intelligence' ? 'bg-amber-500 text-black shadow-lg' : 'text-text-muted hover:text-white'}`}
            >
              <Users size={16} /> <span className="hidden sm:inline">Inteligência</span>
            </button>
            <button 
              onClick={() => setMainTab('cohorts')}
              className={`px-4 py-2 rounded-md text-xs font-bold uppercase transition-all flex items-center gap-2 whitespace-nowrap ${mainTab === 'cohorts' ? 'bg-amber-500 text-black shadow-lg' : 'text-text-muted hover:text-white'}`}
            >
              <Layers size={16} /> <span className="hidden sm:inline">Turmas</span>
            </button>
            <button 
              onClick={() => setMainTab('content')}
              className={`px-4 py-2 rounded-md text-xs font-bold uppercase transition-all flex items-center gap-2 whitespace-nowrap ${mainTab === 'content' ? 'bg-amber-500 text-black shadow-lg' : 'text-text-muted hover:text-white'}`}
            >
              <BookOpen size={16} /> <span className="hidden sm:inline">Acervo</span>
            </button>
            <button 
              onClick={() => setMainTab('messages')}
              className={`px-4 py-2 rounded-md text-xs font-bold uppercase transition-all flex items-center gap-2 whitespace-nowrap ${mainTab === 'messages' ? 'bg-amber-500 text-black shadow-lg' : 'text-text-muted hover:text-white'}`}
            >
              <MessageSquare size={16} /> <span className="hidden sm:inline">Mensagens</span>
            </button>
          </div>
        </div>

        <button onClick={onClose} className="p-2 hover:bg-graphite-800 rounded-full transition-colors text-text-muted hover:text-white">
          <X size={24} />
        </button>
      </div>

      <div className="max-w-7xl mx-auto p-6 space-y-8">

        {/* SEÇÃO: INTELIGÊNCIA */}
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
                  <input type="text" placeholder="BUSCAR POR NOME, EMAIL OU FUNÇÃO..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="w-full bg-graphite-800 border border-graphite-600 rounded-lg py-4 pl-12 pr-4 text-white focus:border-amber-500 outline-none uppercase font-bold placeholder:text-gray-600"/>
                  <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500" size={20} />
                </div>
                <div className="bg-graphite-800 border border-graphite-700 rounded-xl overflow-hidden overflow-x-auto">
                  <table className="w-full text-left border-collapse min-w-[800px]">
                    <thead>
                      <tr className="bg-graphite-900 border-b border-graphite-700 text-[10px] uppercase font-black text-text-muted tracking-widest">
                        <th className="p-4">Agente</th>
                        <th className="p-4">Turma / Acesso</th>
                        <th className="p-4">Contato</th>
                        <th className="p-4">Perfil</th>
                        <th className="p-4">Cadastro</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-graphite-700">
                      {loading ? <tr><td colSpan={5} className="p-8 text-center text-text-muted">CARREGANDO...</td></tr> : filteredProfiles.map((profile) => (
                        <tr key={profile.id} className="hover:bg-graphite-700/50">
                          <td className="p-4">
                            <div className="font-bold text-white">{profile.full_name || 'SEM NOME'}</div>
                            <div className="text-xs text-text-muted">{profile.email}</div>
                          </td>
                          <td className="p-4">
                            <div className="flex flex-col gap-1">
                              <span className="text-xs font-bold text-amber-500">{getCohortName(profile.cohort_id)}</span>
                              {getExpirationDisplay(profile.expires_at)}
                            </div>
                          </td>
                          <td className="p-4">{profile.whatsapp ? <a href={getWhatsappLink(profile.whatsapp)!} target="_blank" rel="noreferrer" className="inline-flex items-center gap-2 bg-green-500/10 text-green-500 px-3 py-1.5 rounded-lg border border-green-500/20 text-xs font-bold uppercase hover:bg-green-500 hover:text-black transition-all"><MessageSquare size={14} /> WhatsApp</a> : <span className="text-text-muted text-xs">N/A</span>}</td>
                          <td className="p-4"><div className="flex flex-col"><span className="text-xs font-bold text-white">{profile.occupation || '-'}</span><span className="text-[10px] text-text-muted">{profile.experience_level}</span></div></td>
                          <td className="p-4 text-xs text-text-muted font-mono">{new Date(profile.created_at).toLocaleDateString('pt-BR')}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {subTab === 'ranking' && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 animate-fade-in">
                <div className="bg-graphite-800 border border-graphite-700 rounded-xl p-6">
                  <h3 className="text-lg font-bold text-purple-500 uppercase mb-4 flex items-center gap-2"><TrendingUp size={20} /> Top Agentes (Aprovados)</h3>
                  {ranking.length === 0 ? (
                      <div className="text-text-muted text-xs p-4 italic">Nenhum agente aprovado ainda.</div>
                  ) : (
                    <div className="space-y-4">{ranking.map(([userId, stats], index) => (
                      <div key={userId} className="flex items-center justify-between p-4 bg-black/40 rounded-lg border border-graphite-700">
                        <div className="flex items-center gap-4"><div className={`w-8 h-8 rounded-full flex items-center justify-center font-black text-sm ${index === 0 ? 'bg-amber-500 text-black' : 'bg-graphite-700 text-white'}`}>{index + 1}</div><div className="font-bold text-white uppercase">{stats.name}</div></div>
                        <div className="flex items-center gap-2 text-purple-400 font-bold"><Award size={16} /><span>{stats.passedCount} Aprovações</span></div>
                      </div>
                    ))}</div>
                  )}
                </div>
              </div>
            )}

            {subTab === 'alerts' && (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 animate-fade-in">
                {strugglingUsers.length === 0 ? <div className="col-span-full p-8 text-center text-text-muted">Nenhum risco detectado.</div> : strugglingUsers.map((alert, idx) => (
                  <div key={idx} className="bg-graphite-800 border border-red-500/30 p-5 rounded-xl hover:border-red-500 transition-colors">
                    <div className="flex justify-between mb-4"><div className="font-bold text-white uppercase">{alert.name}</div><span className="bg-red-500/10 text-red-500 text-[10px] font-black px-2 py-1 rounded">{alert.count} ERROS</span></div>
                    <div className="text-xs text-text-muted mb-4">Dificuldade em: <span className="text-white font-bold">{alert.book}</span></div>
                    {alert.whatsapp && <a href={getWhatsappLink(alert.whatsapp)!} target="_blank" rel="noreferrer" className="flex items-center justify-center gap-2 bg-green-600 hover:bg-green-500 text-white font-bold text-xs uppercase py-3 rounded-lg"><MessageSquare size={16} /> Oferecer Ajuda</a>}
                  </div>
                ))}
              </div>
            )}
          </>
        )}

        {/* SEÇÃO: TURMAS */}
        {mainTab === 'cohorts' && (
          <div className="animate-fade-in space-y-6">
            <h3 className="text-xl font-display font-bold text-white uppercase flex items-center gap-2">
              <Layers size={24} className="text-amber-500"/> Gestão de Turmas (B2B & Lançamentos)
            </h3>

            {/* Criar Nova Turma */}
            <div className="bg-graphite-800 border border-graphite-700 p-6 rounded-xl flex flex-col md:flex-row gap-4 items-end md:items-center">
              <div className="flex-1 w-full">
                <label className="text-xs text-text-muted uppercase font-bold mb-2 block">Nome da Nova Turma / Empresa</label>
                <input 
                  type="text" 
                  value={newCohortName}
                  onChange={(e) => setNewCohortName(e.target.value)}
                  placeholder="Ex: GRUPO ALPHA - JANEIRO 2026"
                  className="w-full bg-black border border-graphite-600 rounded-lg p-3 text-white focus:border-amber-500 outline-none uppercase font-bold"
                />
              </div>
              <button 
                onClick={handleCreateCohort}
                disabled={!newCohortName.trim()}
                className="bg-amber-500 hover:bg-amber-600 disabled:opacity-50 text-black px-6 py-3 rounded-lg font-black uppercase tracking-wider flex items-center gap-2 transition-all w-full md:w-auto justify-center"
              >
                <Plus size={20} /> Criar Turma
              </button>
            </div>

            {/* Lista de Turmas */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {cohorts.length === 0 ? (
                <p className="text-text-muted italic col-span-full text-center py-8">Nenhuma turma criada.</p>
              ) : cohorts.map(cohort => {
                // Contar alunos nesta turma
                const studentCount = profiles.filter(p => p.cohort_id === cohort.id).length;
                return (
                  <div key={cohort.id} className="bg-graphite-800 border border-graphite-700 rounded-xl p-5 hover:border-amber-500 transition-colors group relative">
                    <div className="flex justify-between items-start mb-4">
                      <div>
                        <h4 className="font-bold text-white text-lg uppercase">{cohort.name}</h4>
                        <span className="text-[10px] text-text-muted font-mono">{new Date(cohort.created_at).toLocaleDateString()}</span>
                      </div>
                      <button onClick={() => handleDeleteCohort(cohort.id)} className="text-graphite-600 hover:text-red-500 transition-colors">
                        <Trash2 size={18} />
                      </button>
                    </div>
                    
                    <div className="flex items-center gap-2 text-text-secondary text-sm bg-black/30 p-2 rounded mb-4">
                      <Users size={16} className="text-amber-500"/>
                      <span className="font-bold text-white">{studentCount}</span> Agentes matriculados
                    </div>

                    <div className="flex gap-2">
                       <button className="flex-1 bg-graphite-700 hover:bg-white hover:text-black text-white text-xs font-bold uppercase py-2 rounded transition-all flex items-center justify-center gap-2 opacity-50 cursor-not-allowed" title="Em breve: Importar CSV">
                          <Plus size={14} /> Adicionar Agentes
                       </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* SEÇÃO: ACERVO (PLAYBOOKS) */}
        {mainTab === 'content' && (
          <div className="animate-fade-in space-y-6">
            <div className="flex justify-between items-center">
              <h3 className="text-xl font-display font-bold text-white uppercase flex items-center gap-2">
                <BookOpen size={24} className="text-amber-500"/> Acervo Tático
              </h3>
              <button 
                onClick={() => { setSelectedBook(undefined); setIsEditingBook(true); }}
                className="bg-amber-500 hover:bg-amber-600 text-black px-6 py-3 rounded-lg font-black uppercase tracking-wider flex items-center gap-2 transition-all shadow-lg hover:shadow-amber-500/20"
              >
                <Plus size={20} /> Novo Protocolo
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {ebooks.map(book => (
                <div key={book.id} className="bg-graphite-800 border border-graphite-700 rounded-xl overflow-hidden group hover:border-amber-500 transition-all">
                  <div className="h-32 bg-black relative">
                    <img src={book.coverUrl} alt={book.title} className="w-full h-full object-cover opacity-60 group-hover:opacity-100 transition-opacity" />
                    <div className="absolute top-2 right-2 bg-black/80 px-2 py-1 rounded text-[10px] font-bold uppercase text-white border border-white/20">
                      {book.status === 'published' ? 'Publicado' : 'Rascunho'}
                    </div>
                  </div>
                  <div className="p-4">
                    <h4 className="font-bold text-white uppercase text-sm mb-1 line-clamp-1">{book.title}</h4>
                    <p className="text-xs text-text-muted mb-4 line-clamp-2">{book.description}</p>
                    <div className="flex gap-2">
                      <button 
                        onClick={() => { setSelectedBook(book); setIsEditingBook(true); }}
                        className="flex-1 bg-graphite-700 hover:bg-white hover:text-black text-white text-xs font-bold uppercase py-2 rounded transition-colors flex items-center justify-center gap-1"
                      >
                        <Edit size={14} /> Editar
                      </button>
                      <button 
                        onClick={() => handleDeleteBook(book.id)}
                        className="bg-red-500/10 hover:bg-red-500 text-red-500 hover:text-white px-3 rounded transition-colors"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* SEÇÃO: MENSAGENS (SUPORTE) */}
        {mainTab === 'messages' && (
          <div className="animate-fade-in space-y-6">
              <h3 className="text-xl font-display font-bold text-white uppercase flex items-center gap-2">
                <MessageSquare size={24} className="text-amber-500"/> Suporte Operacional
              </h3>
              
              <div className="bg-graphite-800 border border-graphite-700 rounded-xl overflow-hidden">
                {messages.length === 0 ? (
                  <div className="p-12 text-center text-text-muted italic">Nenhuma mensagem na caixa de entrada.</div>
                ) : (
                  <table className="w-full text-left">
                    <tbody className="divide-y divide-graphite-700">
                      {messages.map(msg => (
                        <tr key={msg.id} className="hover:bg-graphite-700/50">
                          <td className="p-4 w-1/4">
                            <div className="font-bold text-white">{msg.full_name}</div>
                            <div className="text-xs text-text-muted">{msg.email}</div>
                            <div className="text-[10px] text-text-muted mt-1">{new Date(msg.created_at).toLocaleDateString()}</div>
                          </td>
                          <td className="p-4">
                              <div className="text-xs font-bold text-amber-500 uppercase mb-1">{msg.subject}</div>
                              <div className="text-sm text-text-secondary">{msg.content}</div>
                          </td>
                          <td className="p-4 w-20 text-right">
                              <button onClick={() => handleDeleteMessage(msg.id)} className="text-text-muted hover:text-red-500"><Trash2 size={18} /></button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>
          </div>
        )}

      </div>
    </div>
  );
};
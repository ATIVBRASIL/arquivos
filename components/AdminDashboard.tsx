import React, { useEffect, useMemo, useState } from 'react';
import { supabase } from '../src/lib/supabase';
import { Book, Cohort, User } from '../types';
import { EbookForm } from './EbookForm';
import { MarketingManager } from './MarketingManager';
import { AdminHeader } from './admin/AdminHeader';
import { AdminNavigation, MainTab } from './admin/AdminNavigation';

// NOVOS IMPORTS: Trazendo os componentes que criamos
import { CohortsTab } from './admin/tabs/CohortsTab';
import { QuickAccessTab } from './admin/tabs/QuickAccessTab';

import {
  BookOpen,
  Edit,
  MessageSquare,
  Plus,
  Search,
  Trash2,
  TrendingUp,
} from 'lucide-react';

interface AdminDashboardProps {
  user: User;
  onClose: () => void;
}

// Interfaces mantidas pois são usadas na aba de Inteligência e Mensagens
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

type SubTab = 'users' | 'ranking' | 'alerts';

export const AdminDashboard: React.FC<AdminDashboardProps> = ({ user, onClose }) => {
  // --- ESTADOS DE NAVEGAÇÃO ---
  const [mainTab, setMainTab] = useState<MainTab>('intelligence');
  const [subTab, setSubTab] = useState<SubTab>('users');

  // --- ESTADOS DE DADOS (Centralizados para alimentar as abas) ---
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

  // === CARREGAMENTO INICIAL ===
  useEffect(() => {
    void fetchAllData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const fetchAllData = async () => {
    setLoading(true);

    try {
      const [profilesRes, examsRes, cohortsRes, ebooksRes, msgsRes, whitelistRes] = await Promise.all([
        supabase.from('profiles').select('*').order('created_at', { ascending: false }),
        supabase.from('user_exams').select('*').order('created_at', { ascending: false }),
        supabase.from('cohorts').select('*').order('created_at', { ascending: false }),
        supabase.from('ebooks').select('*').order('created_at', { ascending: false }),
        supabase.from('messages').select('*').order('created_at', { ascending: false }),
        supabase.from('whitelist').select('*'),
      ]);

      if (profilesRes.error) throw profilesRes.error;
      if (examsRes.error) throw examsRes.error;
      if (cohortsRes.error) throw cohortsRes.error;
      if (ebooksRes.error) throw ebooksRes.error;
      if (msgsRes.error) throw msgsRes.error;
      if (whitelistRes.error) throw whitelistRes.error;

      const cohortList = cohortsRes.data || [];

      const enrichedProfiles: ProfileData[] = (profilesRes.data || []).map((p: any) => ({
        ...p,
        cohort_name: cohortList.find((c: any) => c.id === p.cohort_id)?.name || '-',
      }));

      setProfiles(enrichedProfiles);
      setAttempts(examsRes.data || []);
      setCohorts(cohortList);
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
        quiz_data: b.quiz_data,
      }));

      setEbooks(formattedBooks);
    } catch (error) {
      console.error('[ADMIN_FETCH_ALL_ERROR]', error);
      alert('Erro crítico ao buscar dados do painel admin. Verifique logs / RLS.');
    } finally {
      setLoading(false);
    }
  };

  // === AÇÕES: CONTEÚDO E SUPORTE (Mantidas aqui por enquanto) ===
  const handleDeleteBook = async (id: string) => {
    if (!confirm('Tem certeza que deseja excluir este protocolo?')) return;
    const { error } = await supabase.from('ebooks').delete().eq('id', id);
    if (error) {
      alert('Erro ao excluir: ' + error.message);
      return;
    }
    void fetchAllData();
  };

  const handleSaveBook = () => {
    setIsEditingBook(false);
    setSelectedBook(undefined);
    void fetchAllData();
  };

  const handleDeleteMessage = async (id: string) => {
    if (!confirm('Excluir mensagem permanentemente?')) return;
    const { error } = await supabase.from('messages').delete().eq('id', id);
    if (error) {
      alert('Erro ao excluir mensagem: ' + error.message);
      return;
    }
    void fetchAllData();
  };

  // === LÓGICA DE INTELIGÊNCIA (Mantida aqui por enquanto) ===
  const ranking = useMemo(() => {
    const userStats: Record<string, { passedCount: number; name: string; scoreSum: number }> = {};

    attempts
      .filter((a) => a.status === 'approved')
      .forEach((attempt) => {
        if (!userStats[attempt.user_id]) {
          const profile = profiles.find((p) => p.id === attempt.user_id);
          userStats[attempt.user_id] = { passedCount: 0, name: profile?.full_name || 'Agente', scoreSum: 0 };
        }
        userStats[attempt.user_id].passedCount += 1;
        userStats[attempt.user_id].scoreSum += attempt.score;
      });

    return Object.entries(userStats)
      .sort(([, a], [, b]) => b.passedCount - a.passedCount || b.scoreSum - a.scoreSum)
      .slice(0, 10);
  }, [attempts, profiles]);

  const strugglingUsers = useMemo(() => {
    const fails: Record<string, Record<string, number>> = {};

    attempts
      .filter((a) => a.status !== 'approved')
      .forEach((a) => {
        if (!fails[a.user_id]) fails[a.user_id] = {};
        if (!fails[a.user_id][a.ebook_id]) fails[a.user_id][a.ebook_id] = 0;
        fails[a.user_id][a.ebook_id] += 1;
      });

    const alerts: Array<{ name: string; book: string; count: number; whatsapp?: string }> = [];

    Object.entries(fails).forEach(([userId, booksMap]) => {
      Object.entries(booksMap).forEach(([bookId, count]) => {
        if (count >= 2) {
          const profile = profiles.find((p) => p.id === userId);
          const bookTitle = ebooks.find((e) => e.id === bookId)?.title || 'Manual';
          alerts.push({ name: profile?.full_name || 'Desconhecido', whatsapp: profile?.whatsapp, book: bookTitle, count });
        }
      });
    });

    return alerts;
  }, [attempts, profiles, ebooks]);

  const filteredProfiles = useMemo(() => {
    const term = searchTerm.trim().toLowerCase();
    if (!term) return profiles;
    return profiles.filter((p) => (p.full_name?.toLowerCase() || '').includes(term));
  }, [profiles, searchTerm]);

  // === RENDER: MODAL DE EDIÇÃO DE EBOOK ===
  if (isEditingBook) {
    return (
      <div className="fixed inset-0 z-50 bg-black overflow-y-auto animate-fade-in">
        <EbookForm
          initialData={selectedBook}
          onClose={() => setIsEditingBook(false)}
          onSave={async (data) => {
            try {
              if (selectedBook) {
                const { error } = await supabase.from('ebooks').update(data).eq('id', selectedBook.id);
                if (error) throw error;
              } else {
                const { error } = await supabase.from('ebooks').insert([data]);
                if (error) throw error;
              }
              handleSaveBook();
            } catch (err: any) {
              alert('Erro ao salvar protocolo: ' + (err?.message || String(err)));
            }
          }}
        />
      </div>
    );
  }

  // === RENDER: DASHBOARD PRINCIPAL ===
  return (
    <div className="fixed inset-0 z-50 bg-black text-text-primary overflow-y-auto animate-fade-in">
      <AdminHeader user={user} onClose={onClose}>
        <AdminNavigation activeTab={mainTab} onChange={setMainTab} />
      </AdminHeader>

      <div className="max-w-7xl mx-auto p-6 space-y-8">
        {/* ABA: ACESSO RÁPIDO (LINK MÁGICO) - Agora Modularizado */}
        {mainTab === 'quick_access' && (
          <QuickAccessTab onRefresh={fetchAllData} />
        )}

        {/* ABA: INTELIGÊNCIA (USER, RANKING, ALERTS) */}
        {mainTab === 'intelligence' && (
          <>
            <div className="flex gap-4 border-b border-graphite-700 pb-1 mb-6 overflow-x-auto">
              <button
                onClick={() => setSubTab('users')}
                className={`pb-3 px-2 text-xs font-bold uppercase tracking-wider transition-colors whitespace-nowrap ${
                  subTab === 'users' ? 'text-amber-500 border-b-2 border-amber-500' : 'text-text-muted hover:text-white'
                }`}
              >
                Base de Agentes
              </button>
              <button
                onClick={() => setSubTab('ranking')}
                className={`pb-3 px-2 text-xs font-bold uppercase tracking-wider transition-colors whitespace-nowrap ${
                  subTab === 'ranking' ? 'text-purple-500 border-b-2 border-purple-500' : 'text-text-muted hover:text-white'
                }`}
              >
                Ranking Elite
              </button>
              <button
                onClick={() => setSubTab('alerts')}
                className={`pb-3 px-2 text-xs font-bold uppercase tracking-wider transition-colors whitespace-nowrap ${
                  subTab === 'alerts' ? 'text-red-500 border-b-2 border-red-500' : 'text-text-muted hover:text-white'
                }`}
              >
                Radar de Risco
              </button>
            </div>

            {subTab === 'users' && (
              <div className="space-y-6 animate-fade-in">
                <div className="relative">
                  <input
                    type="text"
                    placeholder="BUSCAR POR NOME..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full bg-graphite-800 border border-graphite-600 rounded-lg py-4 pl-12 pr-4 text-white focus:border-amber-500 outline-none uppercase font-bold placeholder:text-gray-600"
                  />
                  <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500" size={20} />
                </div>

                <div className="bg-graphite-800 border border-graphite-700 rounded-xl overflow-hidden overflow-x-auto">
                  <table className="w-full text-left border-collapse min-w-[800px]">
                    <thead>
                      <tr className="bg-graphite-900 border-b border-graphite-700 text-[10px] uppercase font-black text-text-muted tracking-widest">
                        <th className="p-4">Agente</th>
                        <th className="p-4">Turma</th>
                        <th className="p-4">Validade</th>
                        <th className="p-4">Contato</th>
                        <th className="p-4">Perfil</th>
                        <th className="p-4">Cadastro</th>
                      </tr>
                    </thead>

                    <tbody className="divide-y divide-graphite-700">
                      {loading ? (
                        <tr>
                          <td colSpan={6} className="p-8 text-center text-text-muted">
                            CARREGANDO...
                          </td>
                        </tr>
                      ) : (
                        filteredProfiles.map((profile) => (
                          <tr key={profile.id} className="hover:bg-graphite-700/50">
                            <td className="p-4">
                              <div className="font-bold text-white">{profile.full_name || 'SEM NOME'}</div>
                              <div className="text-xs text-text-muted">
                                {profile.email?.includes('ativ.local') ? 'Matrícula: ' + profile.ticket_code : profile.email}
                              </div>
                            </td>

                            <td className="p-4">
                              <span className="text-xs font-bold text-amber-500">{profile.cohort_name}</span>
                            </td>

                            <td className="p-4">
                              {profile.is_lifetime ? (
                                <span className="inline-block bg-green-500/10 text-green-500 border border-green-500/20 px-2 py-1 rounded text-[10px] font-black uppercase">
                                  VITALÍCIO
                                </span>
                              ) : profile.expires_at ? (
                                <div className="flex flex-col">
                                  <span className="text-xs font-bold text-white">
                                    {new Date(profile.expires_at).toLocaleDateString('pt-BR')}
                                  </span>
                                  {new Date(profile.expires_at) < new Date() && (
                                    <span className="text-[10px] text-red-500 font-black uppercase mt-1">EXPIRADO</span>
                                  )}
                                </div>
                              ) : (
                                <span className="text-text-muted text-xs">-</span>
                              )}
                            </td>

                            <td className="p-4">
                              {profile.whatsapp ? (
                                <a
                                  href={`https://wa.me/55${profile.whatsapp.replace(/\D/g, '')}`}
                                  target="_blank"
                                  rel="noreferrer"
                                  className="text-green-500 font-bold text-xs"
                                >
                                  WhatsApp OK
                                </a>
                              ) : (
                                <span className="text-text-muted text-xs">N/A</span>
                              )}
                            </td>

                            <td className="p-4">
                              <div className="flex flex-col">
                                <span className="text-xs font-bold text-white">{profile.occupation || '-'}</span>
                              </div>
                            </td>

                            <td className="p-4 text-xs text-text-muted font-mono">
                              {new Date(profile.created_at).toLocaleDateString('pt-BR')}
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {subTab === 'ranking' && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 animate-fade-in">
                <div className="bg-graphite-800 border border-graphite-700 rounded-xl p-6">
                  <h3 className="text-lg font-bold text-purple-500 uppercase mb-4 flex items-center gap-2">
                    <TrendingUp size={20} /> Top Agentes (Aprovados)
                  </h3>

                  {ranking.length === 0 ? (
                    <div className="text-text-muted text-xs p-4 italic">Nenhum aprovado.</div>
                  ) : (
                    <div className="space-y-4">
                      {ranking.map(([userId, stats], index) => (
                        <div
                          key={userId}
                          className="flex items-center justify-between p-4 bg-black/40 rounded-lg border border-graphite-700"
                        >
                          <div className="flex items-center gap-4">
                            <div
                              className={`w-8 h-8 rounded-full flex items-center justify-center font-black text-sm ${
                                index === 0 ? 'bg-amber-500 text-black' : 'bg-graphite-700 text-white'
                              }`}
                            >
                              {index + 1}
                            </div>
                            <div className="font-bold text-white uppercase">{stats.name}</div>
                          </div>
                          <div className="flex items-center gap-2 text-purple-400 font-bold">
                            <span>{stats.passedCount} Aprovações</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}

            {subTab === 'alerts' && (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 animate-fade-in">
                {strugglingUsers.length === 0 ? (
                  <div className="col-span-full p-8 text-center text-text-muted">Nenhum risco.</div>
                ) : (
                  strugglingUsers.map((alert, idx) => (
                    <div key={idx} className="bg-graphite-800 border border-red-500/30 p-5 rounded-xl hover:border-red-500 transition-colors">
                      <div className="flex justify-between mb-4">
                        <div className="font-bold text-white uppercase">{alert.name}</div>
                        <span className="bg-red-500/10 text-red-500 text-[10px] font-black px-2 py-1 rounded">
                          {alert.count} ERROS
                        </span>
                      </div>
                      <div className="text-xs text-text-muted mb-4">
                        Dificuldade em: <span className="text-white font-bold">{alert.book}</span>
                      </div>
                    </div>
                  ))
                )}
              </div>
            )}
          </>
        )}

        {/* ABA: TURMAS - Agora Modularizada */}
        {mainTab === 'cohorts' && (
          <CohortsTab
            cohorts={cohorts}
            profiles={profiles}
            whitelist={whitelist}
            attempts={attempts}
            loading={loading}
            setLoading={setLoading}
            onRefresh={fetchAllData}
          />
        )}

        {/* ABA: ACERVO (Mantida) */}
        {mainTab === 'content' && (
          <div className="animate-fade-in space-y-6">
            <div className="flex justify-between items-center">
              <h3 className="text-xl font-display font-bold text-white uppercase flex items-center gap-2">
                <BookOpen size={24} className="text-amber-500" /> Acervo Tático
              </h3>

              <button
                onClick={() => {
                  setSelectedBook(undefined);
                  setIsEditingBook(true);
                }}
                className="bg-amber-500 hover:bg-amber-600 text-black px-6 py-3 rounded-lg font-black uppercase tracking-wider flex items-center gap-2 transition-all shadow-lg hover:shadow-amber-500/20"
              >
                <Plus size={20} /> Novo Protocolo
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {ebooks.map((book) => (
                <div
                  key={book.id}
                  className="bg-graphite-800 border border-graphite-700 rounded-xl overflow-hidden group hover:border-amber-500 transition-all"
                >
                  <div className="h-32 bg-black relative">
                    <img
                      src={book.coverUrl}
                      alt={book.title}
                      className="w-full h-full object-cover opacity-60 group-hover:opacity-100 transition-opacity"
                    />
                    <div className="absolute top-2 right-2 bg-black/80 px-2 py-1 rounded text-[10px] font-bold uppercase text-white border border-white/20">
                      {book.status === 'published' ? 'Publicado' : 'Rascunho'}
                    </div>
                  </div>

                  <div className="p-4">
                    <h4 className="font-bold text-white uppercase text-sm mb-1 line-clamp-1">{book.title}</h4>
                    <p className="text-xs text-text-muted mb-4 line-clamp-2">{book.description}</p>

                    <div className="flex gap-2">
                      <button
                        onClick={() => {
                          setSelectedBook(book);
                          setIsEditingBook(true);
                        }}
                        className="flex-1 bg-graphite-700 hover:bg-white hover:text-black text-white text-xs font-bold uppercase py-2 rounded transition-colors flex items-center justify-center gap-1"
                      >
                        <Edit size={14} /> Editar
                      </button>

                      <button
                        onClick={() => void handleDeleteBook(book.id)}
                        className="bg-red-500/10 hover:bg-red-500 text-red-500 hover:text-white px-3 rounded transition-colors"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </div>
                </div>
              ))}

              {!loading && ebooks.length === 0 && (
                <div className="col-span-full p-10 text-center text-text-muted italic border border-graphite-700 rounded-xl">
                  Nenhum protocolo cadastrado no acervo.
                </div>
              )}
            </div>
          </div>
        )}

        {/* ABA: MENSAGENS (Mantida) */}
        {mainTab === 'messages' && (
          <div className="animate-fade-in space-y-6">
            <h3 className="text-xl font-display font-bold text-white uppercase flex items-center gap-2">
              <MessageSquare size={24} className="text-amber-500" /> Suporte Operacional
            </h3>

            <div className="bg-graphite-800 border border-graphite-700 rounded-xl overflow-hidden">
              {messages.length === 0 ? (
                <div className="p-12 text-center text-text-muted italic">Nenhuma mensagem.</div>
              ) : (
                <table className="w-full text-left">
                  <tbody className="divide-y divide-graphite-700">
                    {messages.map((msg) => (
                      <tr key={msg.id} className="hover:bg-graphite-700/50">
                        <td className="p-4 w-1/4">
                          <div className="font-bold text-white">{msg.full_name}</div>
                          <div className="text-xs text-text-muted">{msg.email}</div>
                          <div className="text-[10px] text-text-muted mt-1">
                            {new Date(msg.created_at).toLocaleDateString('pt-BR')}
                          </div>
                        </td>

                        <td className="p-4">
                          <div className="text-xs font-bold text-amber-500 uppercase mb-1">{msg.subject}</div>
                          <div className="text-sm text-text-secondary">{msg.content}</div>
                        </td>

                        <td className="p-4 w-20 text-right">
                          <button onClick={() => void handleDeleteMessage(msg.id)} className="text-text-muted hover:text-red-500">
                            <Trash2 size={18} />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        )}

        {/* ABA: MARKETING (Mantida) */}
        {mainTab === 'marketing' && (
          <div className="animate-fade-in">
            <MarketingManager />
          </div>
        )}
      </div>
    </div>
  );
};
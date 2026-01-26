import React, { useEffect, useState, useMemo } from 'react';
import { Navbar } from './components/Navbar';
import { BookCard } from './components/BookCard';
import { Reader } from './components/Reader';
import { AdminDashboard } from './components/AdminDashboard';
import { SupportModal } from './components/SupportModal';
import { Button } from './components/Button';
import { ValidateCertificate } from './components/ValidateCertificate';
import { Shield, Loader2, MessageSquare, UserCheck, Save, Search, ChevronRight, BarChart3, Layers, PlayCircle, ArrowLeft } from 'lucide-react';

// Importações
import { Book, User, ViewState, UserRole, UserProgress } from './types'; 
import { supabase } from './src/lib/supabase'; 
import { TRACKS, groupBooksByTrack, TrackId } from './src/lib/tracks';

type Profile = {
  id: string;
  email: string;
  full_name: string | null;
  role: UserRole;
  whatsapp: string | null;
  occupation: string | null;
  main_goal: string | null;
  experience_level: string | null;
};

// === LOGIN COMPONENT ===
const LoginView: React.FC<{
  onLoginAction: (e: string, p: string) => Promise<void>;
  authLoading: boolean;
  authError: string | null;
}> = ({ onLoginAction, authLoading, authError }) => {
  const [localEmail, setLocalEmail] = useState('');
  const [localPassword, setLocalPassword] = useState('');

  return (
    <div className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden bg-black">
      <div className="w-full max-w-md bg-graphite-800/50 backdrop-blur-md border border-graphite-700 p-8 rounded-2xl shadow-2xl">
        <div className="flex flex-col items-center mb-6">
          <Shield className="text-amber-500 w-12 h-12 mb-2" />
          <h1 className="text-2xl font-bold text-text-primary uppercase tracking-tighter">
            Arquivos ATIV
          </h1>
          <p className="text-xs text-text-muted italic">Operação de Inteligência Digital</p>
        </div>

        <form
          onSubmit={(e) => {
            e.preventDefault();
            onLoginAction(localEmail, localPassword);
          }}
          className="space-y-4"
        >
          <input
            type="email"
            required
            value={localEmail}
            onChange={(e) => setLocalEmail(e.target.value)}
            className="w-full bg-black border border-graphite-600 rounded-lg p-3 text-sm text-text-primary outline-none focus:border-amber-500"
            placeholder="E-mail funcional"
          />
          <input
            type="password"
            required
            value={localPassword}
            onChange={(e) => setLocalPassword(e.target.value)}
            className="w-full bg-black border border-graphite-600 rounded-lg p-3 text-sm text-text-primary outline-none focus:border-amber-500"
            placeholder="Senha de acesso"
          />

          {authError && (
            <div className="text-red-500 text-[10px] text-center uppercase font-bold">
              {authError}
            </div>
          )}

          <Button type="submit" fullWidth disabled={authLoading}>
            {authLoading ? 'AUTENTICANDO...' : 'ACESSAR SISTEMA'}
          </Button>
        </form>
      </div>
    </div>
  );
};

// === APP PRINCIPAL ===
const App: React.FC = () => {
  const [user, setUser] = useState<User | null>(null);
  const [view, setView] = useState<ViewState>('home');
  const [books, setBooks] = useState<Book[]>([]);
  const [currentBook, setCurrentBook] = useState<Book | null>(null);
  const [loading, setLoading] = useState(true);
  const [authError, setAuthError] = useState<string | null>(null);
  const [isSupportOpen, setIsSupportOpen] = useState(false);
  
  // Onboarding States
  const [isProfileIncomplete, setIsProfileIncomplete] = useState(false);
  const [onboardingStep, setOnboardingStep] = useState(1);
  const [savingProfile, setSavingProfile] = useState(false);
  
  const [profileForm, setProfileForm] = useState({
    fullName: '',
    whatsapp: '',
    occupation: 'Segurança Privada',
    experience: 'Iniciante (0-2 anos)',
    goal: 'Especialização Técnica'
  });

  // Novos States de Navegação
  const [selectedTrackId, setSelectedTrackId] = useState<TrackId | null>(null);
  const [trackSearchTerm, setTrackSearchTerm] = useState('');
  
  // State de Progresso (MVP Local)
  const [progress, setProgress] = useState<UserProgress>({ opened: {} });

  // === HELPERS DE PROGRESSO ===
  const loadLocalProgress = (userId: string) => {
    try {
      const stored = localStorage.getItem(`ativ_progress_${userId}`);
      if (stored) {
        setProgress(JSON.parse(stored));
      } else {
        setProgress({ opened: {} });
      }
    } catch { 
      setProgress({ opened: {} });
    }
  };

  const markBookOpened = (bookId: string) => {
    if (!user) return;
    
    const now = new Date().toISOString();
    const newProgress = { ...progress };
    
    if (!newProgress.opened[bookId]) {
      newProgress.opened[bookId] = {
        firstOpenedAt: now,
        lastOpenedAt: now,
        count: 1
      };
    } else {
      newProgress.opened[bookId].lastOpenedAt = now;
      newProgress.opened[bookId].count += 1;
    }

    setProgress(newProgress);
    localStorage.setItem(`ativ_progress_${user.id}`, JSON.stringify(newProgress));
  };

  useEffect(() => {
    try {
      const params = new URLSearchParams(window.location.search);
      const redirect = params.get('redirect');
      if (redirect) {
        window.history.replaceState(null, '', redirect);
      }
    } catch { }
  }, []);

  const isValidationRoute =
    typeof window !== 'undefined' &&
    window.location.pathname.replace(/\/+$/, '').endsWith('/validar');

  const fetchRealContent = async () => {
    const { data, error } = await supabase
      .from('ebooks')
      .select('*')
      .eq('status', 'published')
      .order('created_at', { ascending: false });

    if (!error && data) {
      setBooks(
        data.map((b: any) => ({
          id: b.id,
          title: b.title,
          description: b.description,
          category: b.category,
          coverUrl: b.cover_url,
          tags: b.tags || [],
          content: b.content_html,
          readTime: b.read_time,
          level: b.level,
          quiz_data: b.quiz_data,
          technical_skills: b.technical_skills,
        }))
      );
    }
  };

  const loadProfile = async (authUser: any) => {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', authUser.id)
      .single<Profile>();

    if (error || !data) {
      setAuthError('Perfil não autorizado.');
      await supabase.auth.signOut();
      return;
    }

    const isIncomplete = !data.full_name || !data.whatsapp || !data.occupation;

    if (isIncomplete) {
      setIsProfileIncomplete(true);
      setProfileForm(prev => ({
        ...prev,
        fullName: data.full_name || '',
        whatsapp: data.whatsapp || ''
      }));
    } else {
      setIsProfileIncomplete(false);
    }

    setUser({
      id: data.id,
      name: (data.full_name || data.email.split('@')[0]),
      email: data.email,
      role: data.role
    } as User);

    loadLocalProgress(data.id);
    await fetchRealContent();
    setLoading(false);
  };

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    if (onboardingStep === 1) {
      if (profileForm.fullName.length < 3 || profileForm.whatsapp.length < 8) {
        alert("Preencha corretamente sua identificação e contato.");
        return;
      }
      setOnboardingStep(2);
      return;
    }

    setSavingProfile(true);
    const { error } = await supabase
      .from('profiles')
      .update({ 
        full_name: profileForm.fullName.trim().toUpperCase(),
        whatsapp: profileForm.whatsapp.replace(/\D/g, ''),
        occupation: profileForm.occupation,
        experience_level: profileForm.experience,
        main_goal: profileForm.goal
      })
      .eq('id', user.id);

    if (!error) {
      setUser({ ...user, name: profileForm.fullName.trim().toUpperCase() });
      setIsProfileIncomplete(false);
    } else {
      alert("Erro ao salvar perfil. Tente novamente.");
    }
    setSavingProfile(false);
  };

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      if (data.session?.user) loadProfile(data.session.user);
      else setLoading(false);
    });

    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session?.user) loadProfile(session.user);
      else {
        setUser(null);
        setView('home');
        setLoading(false);
      }
    });

    return () => listener.subscription.unsubscribe();
  }, []);

  // === DADOS COMPUTADOS PARA A HOME ===
  const dashboardData = useMemo(() => {
    const openedCount = Object.keys(progress.opened).length;
    const booksByTrack = groupBooksByTrack(books);
    
    // Recomendações: Livros recentes que ainda não foram abertos
    const recommendations = books
      .filter(b => !progress.opened[b.id])
      .slice(0, 6);

    return { openedCount, booksByTrack, recommendations };
  }, [books, progress]);

  // === RENDERIZAÇÃO ===
  if (loading && !isValidationRoute) {
    return (
      <div className="h-screen bg-black flex items-center justify-center">
        <Loader2 className="animate-spin text-amber-500" size={40} />
      </div>
    );
  }

  if (isValidationRoute) {
    return <ValidateCertificate />;
  }

  if (!user) {
    return (
      <LoginView
        onLoginAction={async (e, p) => {
          setAuthError(null);
          const { error } = await supabase.auth.signInWithPassword({ email: e, password: p });
          if (error) setAuthError(error.message);
        }}
        authLoading={false}
        authError={authError}
      />
    );
  }

  return (
    <div className="bg-black min-h-screen text-text-primary relative pb-20">
      
      {/* ONBOARDING MODAL */}
      {isProfileIncomplete && (
        <div className="fixed inset-0 z-[9999] bg-black/95 flex items-center justify-center p-4 backdrop-blur-sm">
          <div className="w-full max-w-md bg-graphite-800 border-2 border-amber-500 p-8 rounded-2xl shadow-[0_0_50px_rgba(245,158,11,0.2)] animate-fade-in-up">
            <div className="flex flex-col items-center text-center mb-6">
              <div className="w-16 h-16 bg-amber-500/10 rounded-full flex items-center justify-center mb-4">
                <UserCheck size={32} className="text-amber-500" />
              </div>
              <h2 className="text-xl font-bold font-display text-white uppercase tracking-wider">Credenciamento Oficial</h2>
              <div className="flex gap-2 mt-4 mb-2">
                <div className={`h-1 w-12 rounded-full ${onboardingStep === 1 ? 'bg-amber-500' : 'bg-graphite-600'}`}></div>
                <div className={`h-1 w-12 rounded-full ${onboardingStep === 2 ? 'bg-amber-500' : 'bg-graphite-600'}`}></div>
              </div>
              <p className="text-text-secondary text-xs mt-2">{onboardingStep === 1 ? 'Identificação & Contato' : 'Perfil Operacional'}</p>
            </div>
            
            <form onSubmit={handleSaveProfile} className="space-y-4">
              {onboardingStep === 1 && (
                <div className="space-y-4 animate-fade-in">
                  <div>
                    <label className="block text-[10px] font-bold text-amber-500 uppercase mb-2">
                      Este nome será gravado nos certificados
                    </label>
                    <input autoFocus required value={profileForm.fullName} onChange={(e) => setProfileForm({...profileForm, fullName: e.target.value})} placeholder="NOME COMPLETO" className="w-full bg-graphite-800 border border-graphite-600 rounded-lg p-4 text-white font-bold outline-none focus:border-amber-500 uppercase placeholder:text-gray-500" />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-amber-500 uppercase mb-2">
                      Para receber promoções de treinamentos
                    </label>
                    <input type="tel" required value={profileForm.whatsapp} onChange={(e) => setProfileForm({...profileForm, whatsapp: e.target.value})} placeholder="WhatsApp" className="w-full bg-graphite-800 border border-graphite-600 rounded-lg p-4 text-white font-bold outline-none focus:border-amber-500 placeholder:text-gray-500" />
                  </div>
                </div>
              )}
              {onboardingStep === 2 && (
                <div className="space-y-4 animate-fade-in">
                  <div>
                    <label className="block text-[10px] font-bold text-amber-500 uppercase mb-2">Área de Atuação</label>
                    <select value={profileForm.occupation} onChange={(e) => setProfileForm({...profileForm, occupation: e.target.value})} className="w-full bg-graphite-800 border border-graphite-600 rounded-lg p-3 text-sm text-white outline-none focus:border-amber-500">
                      <option>Segurança Privada</option>
                      <option>Segurança Pública</option>
                      <option>Forças Armadas</option>
                      <option>Civil / Entusiasta</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-amber-500 uppercase mb-2">Experiência</label>
                    <select value={profileForm.experience} onChange={(e) => setProfileForm({...profileForm, experience: e.target.value})} className="w-full bg-black border border-graphite-600 rounded-lg p-3 text-sm text-white outline-none focus:border-amber-500">
                      <option>Iniciante (0-2 anos)</option>
                      <option>Intermediário (2-5 anos)</option>
                      <option>Veterano (5-10 anos)</option>
                      <option>Elite (+10 anos)</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-amber-500 uppercase mb-2">Objetivo</label>
                    <select value={profileForm.goal} onChange={(e) => setProfileForm({...profileForm, goal: e.target.value})} className="w-full bg-black border border-graphite-600 rounded-lg p-3 text-sm text-white outline-none focus:border-amber-500">
                      <option>Especialização Técnica</option>
                      <option>Promoção na Carreira</option>
                      <option>Mindset e Comportamento</option>
                    </select>
                  </div>
                </div>
              )}
              <button type="submit" disabled={savingProfile} className="w-full bg-amber-500 hover:bg-amber-600 text-black font-black uppercase tracking-widest py-4 rounded-lg transition-all flex items-center justify-center gap-2 mt-4">
                {savingProfile ? <Loader2 className="animate-spin" /> : onboardingStep === 1 ? <>Próxima Etapa <ChevronRight size={18} /></> : <><Save size={18} /> Confirmar</>}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* NAVBAR */}
      {!isProfileIncomplete && view !== 'admin' && (
        <Navbar
          currentView={view}
          isLoggedIn={true}
          onLogout={() => supabase.auth.signOut()}
          onNavigate={(v) => {
            setView(v);
            if (v !== 'reader') setCurrentBook(null);
          }}
          isAdmin={user.role !== 'user'}
        />
      )}

      {/* === VIEW: HOME (PAINEL TÁTICO) === */}
      {view === 'home' && !isProfileIncomplete && (
        <div className="pt-24 px-6 max-w-7xl mx-auto space-y-10 animate-fade-in pb-10">
          
          {/* BLOCO A: RESUMO DE PROGRESSO */}
          <section className="grid grid-cols-2 gap-4">
            <div className="bg-graphite-800 border border-graphite-700 p-6 rounded-2xl flex flex-col justify-between">
              <div className="flex items-center gap-2 text-text-muted mb-2">
                <BarChart3 size={16} className="text-amber-500" />
                <span className="text-[10px] font-black uppercase tracking-widest">Protocolos Iniciados</span>
              </div>
              <div className="text-3xl font-display font-bold text-white">{dashboardData.openedCount}</div>
            </div>
            <div className="bg-graphite-800 border border-graphite-700 p-6 rounded-2xl flex flex-col justify-between">
              <div className="flex items-center gap-2 text-text-muted mb-2">
                <Layers size={16} className="text-amber-500" />
                <span className="text-[10px] font-black uppercase tracking-widest">Trilhas no Acervo</span>
              </div>
              <div className="text-3xl font-display font-bold text-white">5</div>
            </div>
          </section>

          {/* BLOCO B: RECOMENDAÇÕES (CARROSSEL) */}
          {dashboardData.recommendations.length > 0 && (
            <section>
              <h2 className="text-lg font-display font-bold text-amber-500 uppercase mb-4 flex items-center gap-2">
                <PlayCircle size={20} /> Sugestões do Comando
              </h2>
              
              <div className="flex overflow-x-auto gap-4 pb-6 snap-x snap-mandatory scroll-smooth -mx-6 px-6 md:mx-0 md:px-0">
                {dashboardData.recommendations.map(book => (
                  <div key={book.id} className="min-w-[280px] md:min-w-[300px] snap-center">
                    <BookCard 
                      book={book} 
                      onClick={(b) => {
                        markBookOpened(b.id);
                        setCurrentBook(b);
                        setView('reader');
                      }} 
                    />
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* BLOCO C: TRILHAS EM RESUMO (CARDS) */}
          <section>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-display font-bold text-white uppercase flex items-center gap-2">
                <Layers size={20} className="text-amber-500" /> Trilhas Operacionais
              </h2>
              <button onClick={() => setView('tracks')} className="text-xs text-amber-500 font-bold uppercase hover:underline">
                Ver Todas
              </button>
            </div>
            
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              {TRACKS.slice(0, 4).map(track => {
                const count = dashboardData.booksByTrack[track.id]?.length || 0;
                return (
                  <button 
                    key={track.id}
                    onClick={() => { setSelectedTrackId(track.id); setView('track'); }}
                    className="bg-graphite-800 border border-graphite-700 p-4 rounded-xl text-left hover:border-amber-500 transition-all group flex flex-col justify-between h-32"
                  >
                    <div>
                      <h3 className="font-display font-bold text-white uppercase text-xs group-hover:text-amber-500 transition-colors line-clamp-2">
                        {track.title}
                      </h3>
                    </div>
                    
                    <div className="flex items-center justify-between mt-2">
                      <span className="text-[10px] font-black bg-black/40 px-2 py-1 rounded text-text-secondary">
                        {count} ARQ.
                      </span>
                      <ChevronRight className="text-graphite-600 group-hover:text-amber-500" size={16} />
                    </div>
                  </button>
                )
              })}
            </div>
          </section>
        </div>
      )}

      {/* === VIEW: TRACKS (LISTA DE TODAS AS TRILHAS) === */}
      {view === 'tracks' && (
        <div className="pt-24 px-6 max-w-3xl mx-auto space-y-6 animate-fade-in pb-10">
          <div className="flex items-center gap-4 mb-8">
            <button onClick={() => setView('home')} className="bg-graphite-800 p-2 rounded-full hover:bg-amber-500 hover:text-black transition-colors">
              <ArrowLeft size={20} />
            </button>
            <h2 className="text-2xl font-display font-bold text-white uppercase">Todas as Trilhas</h2>
          </div>

          <div className="space-y-4">
            {TRACKS.map(track => {
              const count = dashboardData.booksByTrack[track.id]?.length || 0;
              return (
                <button 
                  key={track.id}
                  onClick={() => { setSelectedTrackId(track.id); setView('track'); }}
                  className="w-full bg-graphite-800 border border-graphite-700 p-6 rounded-xl text-left hover:border-amber-500 transition-all group flex items-center justify-between"
                >
                  <div>
                    <h3 className="text-lg font-display font-bold text-white uppercase group-hover:text-amber-500 transition-colors">
                      {track.title}
                    </h3>
                    <p className="text-xs text-text-muted mt-1">{track.description}</p>
                    <span className="inline-block mt-3 text-[10px] font-black bg-amber-500/10 text-amber-500 px-2 py-1 rounded border border-amber-500/20">
                      {count} ARQUIVOS DISPONÍVEIS
                    </span>
                  </div>
                  <ChevronRight className="text-graphite-600 group-hover:text-amber-500" size={24} />
                </button>
              )
            })}
          </div>
        </div>
      )}

      {/* === VIEW: TRACK (DETALHE DA TRILHA - GRID DUPLO NO MOBILE) === */}
      {view === 'track' && selectedTrackId && (
        <div className="pt-24 px-6 max-w-7xl mx-auto space-y-8 animate-fade-in pb-20">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 pb-6 border-b border-graphite-800">
            <div className="space-y-2">
              <button onClick={() => setView('tracks')} className="flex items-center gap-2 text-[10px] font-black uppercase text-text-muted hover:text-amber-500 mb-2">
                <ArrowLeft size={12} /> Voltar para Trilhas
              </button>
              <h2 className="text-3xl font-display font-bold text-amber-500 uppercase leading-none">
                {TRACKS.find(t => t.id === selectedTrackId)?.title}
              </h2>
              <p className="text-text-secondary text-sm max-w-2xl">
                {TRACKS.find(t => t.id === selectedTrackId)?.description}
              </p>
            </div>
            
            <div className="w-full md:w-80 relative">
              <input 
                type="text" 
                value={trackSearchTerm}
                onChange={(e) => setTrackSearchTerm(e.target.value)}
                placeholder="FILTRAR NESTA TRILHA..." 
                className="w-full bg-graphite-800 border border-graphite-600 rounded-lg py-3 pl-10 pr-4 text-xs font-bold text-white focus:border-amber-500 outline-none transition-all placeholder:text-text-muted uppercase"
              />
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" size={16} />
            </div>
          </div>

          {/* AQUI ESTÁ A MUDANÇA: grid-cols-2 no mobile */}
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
            {dashboardData.booksByTrack[selectedTrackId]
              ?.filter(b => 
                trackSearchTerm === '' || 
                b.title.toLowerCase().includes(trackSearchTerm.toLowerCase()) ||
                b.tags.some(t => t.toLowerCase().includes(trackSearchTerm.toLowerCase()))
              )
              .map(book => (
                <BookCard 
                  key={book.id} 
                  book={book} 
                  onClick={(b) => {
                    markBookOpened(b.id);
                    setCurrentBook(b);
                    setView('reader');
                  }} 
                />
              ))
            }
            {(!dashboardData.booksByTrack[selectedTrackId] || dashboardData.booksByTrack[selectedTrackId].length === 0) && (
              <div className="col-span-full py-20 text-center text-text-muted italic">
                Nenhum protocolo classificado nesta trilha ainda.
              </div>
            )}
          </div>
        </div>
      )}

      {/* MODAIS E DASHBOARDS */}
      <button
        onClick={() => setIsSupportOpen(true)}
        className="fixed bottom-6 right-6 z-[100] bg-amber-500 hover:bg-amber-600 text-black p-4 rounded-full shadow-[0_0_20px_rgba(245,158,11,0.3)] transition-all hover:scale-110 active:scale-95 group"
      >
        <MessageSquare size={24} />
      </button>

      {isSupportOpen && <SupportModal user={user} onClose={() => setIsSupportOpen(false)} />}
      {view === 'reader' && currentBook && <Reader book={currentBook} user={user} onClose={() => setView('home')} />}
      {view === 'admin' && <AdminDashboard user={user} onClose={() => setView('home')} />}
    </div>
  );
};

export default App;
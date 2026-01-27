import React, { useEffect, useState, useMemo } from 'react';
import { Navbar } from './components/Navbar';
import { BookCard } from './components/BookCard';
import { Reader } from './components/Reader';
import { ProtocolSummary } from './components/ProtocolSummary'; 
import { AdminDashboard } from './components/AdminDashboard';
import { SupportModal } from './components/SupportModal';
import { Button } from './components/Button';
import { ValidateCertificate } from './components/ValidateCertificate';
import { Shield, Loader2, MessageSquare, UserCheck, Save, Search, ChevronRight, BarChart3, Layers, PlayCircle, ArrowLeft, UserPlus, CheckCircle, AlertCircle } from 'lucide-react';

// Importações de Inteligência e Dados
import { Book, User, ViewState, UserRole, UserProgress, Cohort } from './types'; 
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
  is_active: boolean;
  expires_at: string | null;
};

// === LOGIN COMPONENT (ATUALIZADO) ===
const LoginView: React.FC<{
  onLoginAction: (e: string, p: string) => Promise<void>;
  authLoading: boolean;
  authError: string | null;
}> = ({ onLoginAction, authLoading, authError }) => {
  const [mode, setMode] = useState<'login' | 'activate'>('login');
  const [localEmail, setLocalEmail] = useState('');
  const [localPassword, setLocalPassword] = useState('');

  const [cohorts, setCohorts] = useState<Cohort[]>([]);
  const [selectedCohortId, setSelectedCohortId] = useState('');
  const [activationCode, setActivationCode] = useState('');
  const [activationName, setActivationName] = useState('');
  const [activationPassword, setActivationPassword] = useState('');
  const [activationStep, setActivationStep] = useState<1 | 2>(1);
  const [activationError, setActivationError] = useState('');
  const [isValidating, setIsValidating] = useState(false);
  
  const [isMagicLink, setIsMagicLink] = useState(false);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const inviteCode = params.get('invite');
    const cohortId = params.get('c');

    if (inviteCode && cohortId) {
        setMode('activate');
        setSelectedCohortId(cohortId);
        setActivationCode(inviteCode);
        setIsMagicLink(true);
    }
  }, []);

  useEffect(() => {
    if (mode === 'activate' && !isMagicLink) {
      const fetchCohorts = async () => {
        const { data } = await supabase.from('cohorts').select('*').order('name');
        if (data) setCohorts(data);
      };
      fetchCohorts();
    }
  }, [mode, isMagicLink]);

  const verifyWhitelist = async () => {
    setActivationError('');
    setIsValidating(true);
    
    if (!selectedCohortId || !activationCode.trim()) {
      setActivationError('Dados de acesso incompletos.');
      setIsValidating(false);
      return;
    }

    try {
      const { data, error } = await supabase
        .from('whitelist')
        .select('*')
        .eq('cohort_id', selectedCohortId)
        .eq('allowed_code', activationCode.trim().toUpperCase())
        .is('used_at', null)
        .single();

      if (error || !data) {
        setActivationError('Código inválido ou já utilizado.');
      } else {
        setActivationStep(2);
      }
    } catch (err) { 
      setActivationError('Erro ao verificar credencial.'); 
    } finally { 
      setIsValidating(false); 
    }
  };

  const handleActivation = async () => {
    setActivationError('');
    setIsValidating(true);
    if (activationPassword.length < 6) { setActivationError('A senha deve ter no mínimo 6 caracteres.'); setIsValidating(false); return; }
    if (activationName.length < 3) { setActivationError('Nome muito curto para certificado.'); setIsValidating(false); return; }

    try {
        const fakeEmail = `${activationCode.trim().toUpperCase()}.${selectedCohortId.slice(0,4)}@ativ.local`;
        
        const { data: cohortData } = await supabase.from('cohorts').select('validity_days').eq('id', selectedCohortId).single();
        const days = cohortData?.validity_days || 365;
        const expirationDate = new Date();
        expirationDate.setDate(expirationDate.getDate() + days);

        const { data: authData, error: authError } = await supabase.auth.signUp({
            email: fakeEmail,
            password: activationPassword,
            options: { data: { full_name: activationName.toUpperCase() } }
        });

        if (authError) throw authError;

        if (authData.user) {
            await supabase.from('profiles').update({
                full_name: activationName.toUpperCase(),
                cohort_id: selectedCohortId,
                ticket_code: activationCode.trim().toUpperCase(),
                role: 'user',
                expires_at: expirationDate.toISOString()
            }).eq('id', authData.user.id);

            await supabase.from('whitelist').update({ used_at: new Date().toISOString() }).eq('cohort_id', selectedCohortId).eq('allowed_code', activationCode.trim().toUpperCase());
            
            window.history.replaceState(null, '', '/');
            window.location.reload(); 
        }
    } catch (err: any) { setActivationError(err.message || 'Erro ao criar conta.'); setIsValidating(false); }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden bg-black font-sans">
      <div className="w-full max-w-md bg-graphite-800/50 backdrop-blur-md border border-graphite-700 p-8 rounded-2xl shadow-2xl relative z-10">
        
        <div className="flex flex-col items-center mb-6">
          <img 
            src="/logo_ativ.png" 
            alt="ATIV BRASIL" 
            className="w-24 h-24 object-contain mb-4 drop-shadow-[0_0_10px_rgba(245,158,11,0.3)]" 
          />
          <h1 className="text-2xl font-bold text-text-primary uppercase tracking-tighter text-center leading-none">
            {mode === 'login' ? 'ATIV' : 'NOVO AGENTE'}
          </h1>
          <p className="text-xs text-text-muted italic mt-1 uppercase tracking-widest">
            {mode === 'login' ? 'Operação de Inteligência Digital' : 'Ativação de Credencial'}
          </p>
        </div>

        {mode === 'login' && (
          <form onSubmit={(e) => { e.preventDefault(); onLoginAction(localEmail, localPassword); }} className="space-y-4 animate-fade-in">
            <input type="text" required value={localEmail} onChange={(e) => setLocalEmail(e.target.value)} className="w-full bg-black border border-graphite-600 rounded-lg p-3 text-sm text-text-primary outline-none focus:border-amber-500 font-bold" placeholder="USUÁRIO / EMAIL" />
            <input type="password" required value={localPassword} onChange={(e) => setLocalPassword(e.target.value)} className="w-full bg-black border border-graphite-600 rounded-lg p-3 text-sm text-text-primary outline-none focus:border-amber-500" placeholder="SENHA DE ACESSO" />
            
            {authError && (
                <div className="bg-red-500/10 border border-red-500/20 p-2 rounded text-red-500 text-[10px] text-center uppercase font-bold flex items-center justify-center gap-2">
                    <AlertCircle size={12} /> {authError}
                </div>
            )}

            <Button type="submit" fullWidth disabled={authLoading}>
                {authLoading ? <><Loader2 className="animate-spin mr-2" size={16}/> AUTENTICANDO...</> : 'ACESSAR SISTEMA'}
            </Button>

            <div className="pt-4 border-t border-graphite-700 text-center">
                <button type="button" onClick={() => setMode('activate')} className="text-xs text-text-muted hover:text-amber-500 font-bold uppercase tracking-wider transition-colors flex items-center justify-center gap-2 w-full">
                    <UserPlus size={14} /> Primeiro Acesso? Ativar Conta
                </button>
            </div>
          </form>
        )}

        {mode === 'activate' && (
            <div className="animate-fade-in space-y-4">
                {activationStep === 1 ? (
                    <>
                        {isMagicLink ? (
                             <div className="bg-amber-500/10 border border-amber-500/20 p-3 rounded text-amber-500 text-xs font-bold uppercase text-center mb-4">
                                Você está ativando um acesso exclusivo.<br/>Confirme o código abaixo.
                             </div>
                        ) : (
                            <div className="space-y-2">
                                <label className="text-[10px] font-bold text-amber-500 uppercase tracking-wider ml-1">1. Selecione sua Turma</label>
                                <select value={selectedCohortId} onChange={(e) => setSelectedCohortId(e.target.value)} className="w-full bg-black border border-graphite-600 rounded-lg p-3 text-sm text-white outline-none focus:border-amber-500 transition-colors font-bold uppercase">
                                    <option value="">SELECIONE...</option>
                                    {cohorts.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                                </select>
                            </div>
                        )}
                        <div className="space-y-2">
                            <label className="text-[10px] font-bold text-amber-500 uppercase tracking-wider ml-1">Código de Acesso</label>
                            <input type="text" value={activationCode} onChange={(e) => setActivationCode(e.target.value)} className="w-full bg-black border border-graphite-600 rounded-lg p-3 text-sm text-white outline-none focus:border-amber-500 transition-colors font-bold uppercase tracking-widest" placeholder="CÓDIGO ÚNICO" disabled={isMagicLink} />
                        </div>
                        
                        {activationError && <div className="bg-red-500/10 border border-red-500/20 p-2 rounded text-red-500 text-[10px] text-center uppercase font-bold flex items-center justify-center gap-2"><AlertCircle size={12} /> {activationError}</div>}
                        <Button onClick={verifyWhitelist} fullWidth disabled={isValidating}>{isValidating ? <><Loader2 className="animate-spin mr-2" size={16}/> VERIFICANDO...</> : 'VALIDAR ACESSO'}</Button>
                    </>
                ) : (
                    <>
                        <div className="bg-green-500/10 border border-green-500/20 p-3 rounded text-green-500 text-xs font-bold uppercase text-center mb-2 flex items-center justify-center gap-2"><CheckCircle size={16} /> Acesso Liberado</div>
                        
                        {/* --- CORREÇÃO AQUI: NOME COMPLETO PARA CERTIFICADO --- */}
                        <div className="space-y-2">
                            <label className="text-[10px] font-bold text-amber-500 uppercase tracking-wider ml-1">Nome Completo (Para Certificado)</label>
                            <input 
                                type="text" 
                                value={activationName} 
                                onChange={(e) => setActivationName(e.target.value)} 
                                className="w-full bg-black border border-graphite-600 rounded-lg p-3 text-sm text-white outline-none focus:border-amber-500 transition-colors font-bold uppercase" 
                                placeholder="EX: JOÃO DA SILVA" 
                            />
                        </div>

                        <div className="space-y-2">
                            <label className="text-[10px] font-bold text-amber-500 uppercase tracking-wider ml-1">Crie sua Senha</label>
                            <input type="password" value={activationPassword} onChange={(e) => setActivationPassword(e.target.value)} className="w-full bg-black border border-graphite-600 rounded-lg p-3 text-sm text-white outline-none focus:border-amber-500 transition-colors" placeholder="Mínimo 6 caracteres" />
                        </div>
                        
                        {activationError && <div className="bg-red-500/10 border border-red-500/20 p-2 rounded text-red-500 text-[10px] text-center uppercase font-bold flex items-center justify-center gap-2"><AlertCircle size={12} /> {activationError}</div>}
                        <Button onClick={handleActivation} fullWidth disabled={isValidating}>{isValidating ? <><Loader2 className="animate-spin mr-2" size={16}/> REGISTRAR E ENTRAR...</> : 'CONFIRMAR CADASTRO'}</Button>
                    </>
                )}
                <div className="pt-4 border-t border-graphite-700 text-center">
                    <button type="button" onClick={() => { setMode('login'); setActivationStep(1); setActivationError(''); setSelectedCohortId(''); setActivationCode(''); setIsMagicLink(false); window.history.replaceState(null, '', '/'); }} className="text-xs text-text-muted hover:text-white font-bold uppercase tracking-wider transition-colors flex items-center justify-center gap-2 w-full">
                        <ArrowLeft size={14} /> Voltar ao Login
                    </button>
                </div>
            </div>
        )}
      </div>
    </div>
  );
};

// === APP PRINCIPAL ===
const App: React.FC = () => {
  const [user, setUser] = useState<User | null>(null);
  const [view, setView] = useState<ViewState | 'preview'>('home');
  const [books, setBooks] = useState<Book[]>([]);
  const [currentBook, setCurrentBook] = useState<Book | null>(null);
  const [loading, setLoading] = useState(true);
  const [authError, setAuthError] = useState<string | null>(null);
  const [isSupportOpen, setIsSupportOpen] = useState(false);
  
  // Onboarding States
  const [isProfileIncomplete, setIsProfileIncomplete] = useState(false);
  const [onboardingStep, setOnboardingStep] = useState(1);
  const [savingProfile, setSavingProfile] = useState(false);
  const [profileForm, setProfileForm] = useState({ fullName: '', whatsapp: '', occupation: 'Segurança Privada', experience: 'Iniciante (0-2 anos)', goal: 'Especialização Técnica' });

  // Trilhas & Progresso
  const [selectedTrackId, setSelectedTrackId] = useState<TrackId | null>(null);
  const [trackSearchTerm, setTrackSearchTerm] = useState('');
  const [progress, setProgress] = useState<UserProgress>({ opened: {} });
  const [completedBookIds, setCompletedBookIds] = useState<string[]>([]);

  // Helpers
  const loadLocalProgress = (userId: string) => { try { const stored = localStorage.getItem(`ativ_progress_${userId}`); if (stored) setProgress(JSON.parse(stored)); else setProgress({ opened: {} }); } catch { setProgress({ opened: {} }); } };
  const markBookOpened = (bookId: string) => { if (!user) return; const now = new Date().toISOString(); const newProgress = { ...progress }; if (!newProgress.opened[bookId]) newProgress.opened[bookId] = { firstOpenedAt: now, lastOpenedAt: now, count: 1 }; else { newProgress.opened[bookId].lastOpenedAt = now; newProgress.opened[bookId].count += 1; } setProgress(newProgress); localStorage.setItem(`ativ_progress_${user.id}`, JSON.stringify(newProgress)); };
  const getBookStatus = (bookId: string): 'cursando' | 'certificado' | undefined => { if (completedBookIds.includes(bookId)) return 'certificado'; if (progress.opened[bookId]) return 'cursando'; return undefined; };

  useEffect(() => { try { const params = new URLSearchParams(window.location.search); const redirect = params.get('redirect'); if (redirect) window.history.replaceState(null, '', redirect); } catch { } }, []);
  const isValidationRoute = typeof window !== 'undefined' && window.location.pathname.replace(/\/+$/, '').endsWith('/validar');

  const fetchRealContent = async () => { const { data, error } = await supabase.from('ebooks').select('*').eq('status', 'published').order('created_at', { ascending: false }); if (!error && data) setBooks(data.map((b: any) => ({ id: b.id, title: b.title, description: b.description, category: b.category, coverUrl: b.cover_url, tags: b.tags || [], content: b.content_html, readTime: b.read_time, level: b.level, quiz_data: b.quiz_data, technical_skills: b.technical_skills, }))); };
  
  const loadProfile = async (authUser: any) => { 
      const { data, error } = await supabase.from('profiles').select('*').eq('id', authUser.id).single<Profile>(); 
      if (error || !data) { setAuthError('Perfil não autorizado.'); await supabase.auth.signOut(); return; } 
      
      const { data: exams } = await supabase.from('user_exams').select('ebook_id').eq('user_id', authUser.id).eq('status', 'approved'); 
      if (exams) setCompletedBookIds(exams.map(e => e.ebook_id)); 
      
      const isIncomplete = !data.full_name || !data.whatsapp || !data.occupation; 
      if (isIncomplete) { setIsProfileIncomplete(true); setProfileForm(prev => ({ ...prev, fullName: data.full_name || '', whatsapp: data.whatsapp || '' })); } else setIsProfileIncomplete(false); 
      
      setUser({ id: data.id, name: (data.full_name || data.email.split('@')[0]), email: data.email, role: data.role } as User); 
      loadLocalProgress(data.id); 
      await fetchRealContent(); 
      setLoading(false); 
  };

  const handleSaveProfile = async (e: React.FormEvent) => { 
      e.preventDefault(); 
      if (!user) return; 
      if (onboardingStep === 1) { if (profileForm.fullName.length < 3 || profileForm.whatsapp.length < 8) { alert("Preencha corretamente."); return; } setOnboardingStep(2); return; } 
      setSavingProfile(true); 
      const { error } = await supabase.from('profiles').update({ full_name: profileForm.fullName.trim().toUpperCase(), whatsapp: profileForm.whatsapp.replace(/\D/g, ''), occupation: profileForm.occupation, experience_level: profileForm.experience, main_goal: profileForm.goal }).eq('id', user.id); 
      if (!error) { setUser({ ...user, name: profileForm.fullName.trim().toUpperCase() }); setIsProfileIncomplete(false); } else alert("Erro ao salvar."); setSavingProfile(false); 
  };

  useEffect(() => { supabase.auth.getSession().then(({ data }) => { if (data.session?.user) loadProfile(data.session.user); else setLoading(false); }); const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => { if (session?.user) loadProfile(session.user); else { setUser(null); setView('home'); setLoading(false); } }); return () => listener.subscription.unsubscribe(); }, []);
  
  const dashboardData = useMemo(() => { 
      const openedCount = Object.keys(progress.opened).length; 
      const booksByTrack = groupBooksByTrack(books); 
      const recommendations = books.filter(b => !completedBookIds.includes(b.id)).slice(0, 6); 
      const myHistory = books.filter(b => progress.opened[b.id]); 
      return { openedCount, booksByTrack, recommendations, myHistory }; 
  }, [books, progress, completedBookIds]);

  if (loading && !isValidationRoute) return <div className="h-screen bg-black flex items-center justify-center"><Loader2 className="animate-spin text-amber-500" size={40} /></div>;
  if (isValidationRoute) return <ValidateCertificate />;
  if (!user) return <LoginView onLoginAction={async (e, p) => { setAuthError(null); const { error } = await supabase.auth.signInWithPassword({ email: e, password: p }); if (error) setAuthError(error.message); }} authLoading={false} authError={authError} />;

  return (
    <div className="bg-black min-h-screen text-text-primary relative pb-20">
      
      {/* ONBOARDING MODAL */}
      {isProfileIncomplete && (
        <div className="fixed inset-0 z-[9999] bg-black/95 flex items-center justify-center p-4 backdrop-blur-sm">
          <div className="w-full max-w-md bg-graphite-800 border-2 border-amber-500 p-8 rounded-2xl shadow-[0_0_50px_rgba(245,158,11,0.2)] animate-fade-in-up">
            <div className="flex flex-col items-center text-center mb-6"><div className="w-16 h-16 bg-amber-500/10 rounded-full flex items-center justify-center mb-4"><UserCheck size={32} className="text-amber-500" /></div><h2 className="text-xl font-bold font-display text-white uppercase tracking-wider">Credenciamento Oficial</h2><div className="flex gap-2 mt-4 mb-2"><div className={`h-1 w-12 rounded-full ${onboardingStep === 1 ? 'bg-amber-500' : 'bg-graphite-600'}`}></div><div className={`h-1 w-12 rounded-full ${onboardingStep === 2 ? 'bg-amber-500' : 'bg-graphite-600'}`}></div></div><p className="text-text-secondary text-xs mt-2">{onboardingStep === 1 ? 'Identificação & Contato' : 'Perfil Operacional'}</p></div>
            <form onSubmit={handleSaveProfile} className="space-y-4">
              {onboardingStep === 1 && (<div className="space-y-4 animate-fade-in"><div><label className="block text-[10px] font-bold text-amber-500 uppercase mb-2">Este nome será gravado nos certificados</label><input autoFocus required value={profileForm.fullName} onChange={(e) => setProfileForm({...profileForm, fullName: e.target.value})} placeholder="NOME COMPLETO" className="w-full bg-graphite-800 border border-graphite-600 rounded-lg p-4 text-white font-bold outline-none focus:border-amber-500 uppercase placeholder:text-gray-500" /></div><div><label className="block text-[10px] font-bold text-amber-500 uppercase mb-2">Para receber promoções de treinamentos</label><input type="tel" required value={profileForm.whatsapp} onChange={(e) => setProfileForm({...profileForm, whatsapp: e.target.value})} placeholder="WhatsApp" className="w-full bg-graphite-800 border border-graphite-600 rounded-lg p-4 text-white font-bold outline-none focus:border-amber-500 placeholder:text-gray-500" /></div></div>)}
              {onboardingStep === 2 && (<div className="space-y-4 animate-fade-in"><div><label className="block text-[10px] font-bold text-amber-500 uppercase mb-2">Área de Atuação</label><select value={profileForm.occupation} onChange={(e) => setProfileForm({...profileForm, occupation: e.target.value})} className="w-full bg-graphite-800 border border-graphite-600 rounded-lg p-3 text-sm text-white outline-none focus:border-amber-500"><option>Segurança Privada</option><option>Segurança Pública</option><option>Forças Armadas</option><option>Civil / Entusiasta</option></select></div><div><label className="block text-[10px] font-bold text-amber-500 uppercase mb-2">Experiência</label><select value={profileForm.experience} onChange={(e) => setProfileForm({...profileForm, experience: e.target.value})} className="w-full bg-black border border-graphite-600 rounded-lg p-3 text-sm text-white outline-none focus:border-amber-500"><option>Iniciante (0-2 anos)</option><option>Intermediário (2-5 anos)</option><option>Veterano (5-10 anos)</option><option>Elite (+10 anos)</option></select></div><div><label className="block text-[10px] font-bold text-amber-500 uppercase mb-2">Objetivo</label><select value={profileForm.goal} onChange={(e) => setProfileForm({...profileForm, goal: e.target.value})} className="w-full bg-black border border-graphite-600 rounded-lg p-3 text-sm text-white outline-none focus:border-amber-500"><option>Especialização Técnica</option><option>Promoção na Carreira</option><option>Mindset e Comportamento</option></select></div></div>)}
              <button type="submit" disabled={savingProfile} className="w-full bg-amber-500 hover:bg-amber-600 text-black font-black uppercase tracking-widest py-4 rounded-lg transition-all flex items-center justify-center gap-2 mt-4">{savingProfile ? <Loader2 className="animate-spin" /> : onboardingStep === 1 ? <>Próxima Etapa <ChevronRight size={18} /></> : <><Save size={18} /> Confirmar</>}</button>
            </form>
          </div>
        </div>
      )}

      {/* NAVBAR */}
      {!isProfileIncomplete && view !== 'admin' && (
        <Navbar
          currentView={view as any}
          isLoggedIn={true}
          onLogout={() => supabase.auth.signOut()}
          onNavigate={(v) => {
            setView(v);
            if (v !== 'reader' && v !== 'preview') setCurrentBook(null);
          }}
          isAdmin={user.role !== 'user'}
        />
      )}

      {/* === VIEW: HOME (PAINEL TÁTICO) === */}
      {view === 'home' && !isProfileIncomplete && (
        <div className="pt-24 px-6 max-w-7xl mx-auto space-y-10 animate-fade-in pb-10">
          
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
                <span className="text-[10px] font-black uppercase tracking-widest">Certificados Ativos</span>
              </div>
              <div className="text-3xl font-display font-bold text-white">{completedBookIds.length}</div>
            </div>
          </section>

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
                      status={getBookStatus(book.id)}
                      onClick={(b) => {
                        setCurrentBook(b);
                        setView('preview'); // MANOBRA: Vai para o Sumário primeiro
                      }} 
                    />
                  </div>
                ))}
              </div>
            </section>
          )}

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

      {/* === VIEW: TRACKS === */}
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

      {/* === VIEW: TRACK (DETALHE DA TRILHA) === */}
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
                  status={getBookStatus(book.id)}
                  onClick={(b) => {
                    setCurrentBook(b);
                    setView('preview'); // MANOBRA: Vai para o Sumário primeiro
                  }} 
                />
              ))
            }
          </div>
        </div>
      )}

      {/* === VIEW: MINHA LISTA (HISTÓRICO OPERACIONAL) === */}
      {view === 'my-list' && (
        <div className="pt-24 px-6 max-w-7xl mx-auto space-y-8 animate-fade-in pb-20">
          <div className="flex items-center gap-4 mb-8">
            <button onClick={() => setView('home')} className="bg-graphite-800 p-2 rounded-full hover:bg-amber-500 hover:text-black transition-colors">
              <ArrowLeft size={20} />
            </button>
            <h2 className="text-2xl font-display font-bold text-white uppercase tracking-tighter">Minha Lista de Estudos</h2>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
            {dashboardData.myHistory.map(book => (
              <BookCard 
                key={book.id} 
                book={book} 
                status={getBookStatus(book.id)} 
                onClick={(b) => {
                  setCurrentBook(b);
                  setView('preview'); // MANOBRA: Vai para o Sumário primeiro
                }} 
              />
            ))}
            
            {dashboardData.myHistory.length === 0 && (
              <div className="col-span-full py-20 text-center text-text-muted italic border-2 border-dashed border-graphite-700 rounded-2xl">
                Nenhum protocolo iniciado. Abra um manual no acervo para começar seu histórico.
              </div>
            )}
          </div>
        </div>
      )}

      {/* MODAIS E DASHBOARDS DE COMANDO */}
      <button
        onClick={() => setIsSupportOpen(true)}
        className="fixed bottom-6 right-6 z-[100] bg-amber-500 hover:bg-amber-600 text-black p-4 rounded-full shadow-[0_0_20px_rgba(245,158,11,0.3)] transition-all hover:scale-110 active:scale-95 group"
      >
        <MessageSquare size={24} />
      </button>

      {isSupportOpen && <SupportModal user={user} onClose={() => setIsSupportOpen(false)} />}
      
      {/* MANOBRA DE NAVEGAÇÃO: SUMÁRIO -> LEITOR */}
      {view === 'preview' && currentBook && (
        <ProtocolSummary 
          book={currentBook} 
          user={user} 
          onClose={() => setView('home')} 
          onStart={(b) => {
            markBookOpened(b.id); // SÓ MARCA COMO CURSANDO AQUI
            setView('reader');
          }}
        />
      )}

      {view === 'reader' && currentBook && <Reader book={currentBook} user={user} onClose={() => setView('home')} />}
      {view === 'admin' && <AdminDashboard user={user} onClose={() => setView('home')} />}
    </div>
  );
};

export default App;
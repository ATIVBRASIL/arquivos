import React, { useEffect, useState } from 'react';
import { Navbar } from './components/Navbar';
import { BookCard } from './components/BookCard';
import { Reader } from './components/Reader';
import { AdminDashboard } from './components/AdminDashboard';
import { SupportModal } from './components/SupportModal'; // Canal de Suporte
import { Button } from './components/Button';
import { Book, User, ViewState, UserRole } from './types';
import { Shield, Loader2, MessageSquare } from 'lucide-react'; 
import { supabase } from './src/lib/supabase';
import { ValidateCertificate } from './components/ValidateCertificate';


type Profile = {
  id: string;
  email: string;
  role: UserRole;
  is_active: boolean;
  expires_at: string | null;
};

// === COMPONENTE DE LOGIN ===
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
          <h1 className="text-2xl font-bold text-text-primary uppercase tracking-tighter">Arquivos ATIV</h1>
          <p className="text-xs text-text-muted italic">Operação de Inteligência Digital</p>
        </div>
        <form onSubmit={(e) => { e.preventDefault(); onLoginAction(localEmail, localPassword); }} className="space-y-4">
          <input type="email" required value={localEmail} onChange={(e) => setLocalEmail(e.target.value)}
            className="w-full bg-black border border-graphite-600 rounded-lg p-3 text-sm text-text-primary outline-none focus:border-amber-500" placeholder="E-mail funcional" />
          <input type="password" required value={localPassword} onChange={(e) => setLocalPassword(e.target.value)}
            className="w-full bg-black border border-graphite-600 rounded-lg p-3 text-sm text-text-primary outline-none focus:border-amber-500" placeholder="Senha de acesso" />
          {authError && <div className="text-red-500 text-[10px] text-center uppercase font-bold">{authError}</div>}
          <Button type="submit" fullWidth disabled={authLoading}>{authLoading ? 'AUTENTICANDO...' : 'ACESSAR SISTEMA'}</Button>
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

  // Busca Livros Reais do Banco de Dados
  const fetchRealContent = async () => {
    const { data, error } = await supabase
      .from('ebooks')
      .select('*')
      .eq('status', 'published')
      .order('created_at', { ascending: false });

    if (!error && data) {
      setBooks(data.map((b: any) => ({
        id: b.id,
        title: b.title,
        description: b.description,
        category: b.category,
        coverUrl: b.cover_url,
        tags: b.tags || [],
        content: b.content_html,
        readTime: b.read_time,
        level: b.level,
        quiz_data: b.quiz_data // SINCRONIZAÇÃO: Carrega o quiz para o Reader
      })));
    }
  };

  const loadProfile = async (authUser: any) => {
    const { data, error } = await supabase.from('profiles').select('*').eq('id', authUser.id).single<Profile>();
    if (error || !data) { setAuthError('Perfil não autorizado.'); await supabase.auth.signOut(); return; }
    
    setUser({ id: data.id, name: data.email.split('@')[0], email: data.email, role: data.role } as User);
    await fetchRealContent();
    setLoading(false);
  };

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => { if (data.session?.user) loadProfile(data.session.user); else setLoading(false); });
    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session?.user) loadProfile(session.user);
      else { setUser(null); setView('home'); setLoading(false); }
    });
    return () => listener.subscription.unsubscribe();
  }, []);

  if (loading) return <div className="h-screen bg-black flex items-center justify-center"><Loader2 className="animate-spin text-amber-500" size={40} /></div>;

  if (!user) return <LoginView onLoginAction={async (e, p) => { setAuthError(null); const { error } = await supabase.auth.signInWithPassword({ email: e, password: p }); if (error) setAuthError(error.message); }} authLoading={false} authError={authError} />;

    // === ROTA PÚBLICA: /validar?code=... ===
  const isValidationRoute =
    typeof window !== 'undefined' &&
    window.location.pathname.replace(/\/+$/, '').endsWith('/validar');

  if (!loading && isValidationRoute) {
    return <ValidateCertificate />;
  }

  return (
    <div className="bg-black min-h-screen text-text-primary relative">
      {view !== 'admin' && (
        <Navbar currentView={view} isLoggedIn={true} onLogout={() => supabase.auth.signOut()} onNavigate={(v) => { setView(v); if (v !== 'reader') setCurrentBook(null); }} isAdmin={user.role !== 'user'} />
      )}

      {view === 'home' && (
        <div className="pt-24 px-6 max-w-7xl mx-auto space-y-10">
          <h2 className="text-2xl font-display font-bold text-amber-500 uppercase">Acervo Tático Disponível</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6 pb-20">
            {books.length === 0 ? (
              <p className="text-text-muted italic">Nenhum protocolo publicado no momento.</p>
            ) : books.map((book) => (
              <BookCard key={book.id} book={book} onClick={(b) => { setCurrentBook(b); setView('reader'); }} />
            ))}
          </div>

          <button 
            onClick={() => setIsSupportOpen(true)}
            className="fixed bottom-6 right-6 z-[100] bg-amber-500 hover:bg-amber-600 text-black p-4 rounded-full shadow-[0_0_20px_rgba(245,158,11,0.3)] transition-all hover:scale-110 active:scale-95 group"
            title="Suporte Tático"
          >
            <MessageSquare size={24} />
            <span className="absolute right-16 top-1/2 -translate-y-1/2 bg-graphite-800 text-amber-500 text-[10px] font-black uppercase px-3 py-1 rounded border border-amber-500/20 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap">
              Falar com o Comando
            </span>
          </button>
        </div>
      )}

      {isSupportOpen && <SupportModal user={user} onClose={() => setIsSupportOpen(false)} />}
      
      {/* PASSO 9: Reader agora recebe o objeto user completo */}
      {view === 'reader' && currentBook && (
        <Reader 
          book={currentBook} 
          user={user} 
          onClose={() => setView('home')} 
        />
      )}
      
      {view === 'admin' && <AdminDashboard user={user} onClose={() => setView('home')} />}
    </div>
  );
};

export default App;
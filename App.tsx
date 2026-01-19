import React, { useEffect, useState } from 'react';
import { Navbar } from './components/Navbar';
import { BookCard } from './components/BookCard';
import { Reader } from './components/Reader';
import { AdminDashboard } from './components/AdminDashboard';
import { Button } from './components/Button';
import { CATEGORIES } from './constants';
import { Book, User, ViewState, UserRole } from './types';
import { Shield } from 'lucide-react';
import { supabase } from './supabase';

// Tipo local para bater com as colunas do banco de dados Profiles
type Profile = {
  id: string;
  email: string;
  role: UserRole;
  is_active: boolean;
  expires_at: string | null;
};

// === COMPONENTE DE LOGIN ISOLADO ===
const LoginView: React.FC<{ 
  onLoginAction: (e: string, p: string) => Promise<void>;
  authLoading: boolean;
  authError: string | null;
}> = ({ onLoginAction, authLoading, authError }) => {
  const [localEmail, setLocalEmail] = useState('');
  const [localPassword, setLocalPassword] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onLoginAction(localEmail, localPassword);
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden">
      <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-graphite-800 via-black-900 to-black-900 -z-10" />

      <div className="w-full max-w-md bg-graphite-800/50 backdrop-blur-md border border-graphite-700 p-8 rounded-2xl shadow-2xl animate-fade-in-up">
        <div className="flex flex-col items-center mb-6">
          <div className="w-14 h-14 bg-gradient-to-br from-graphite-700 to-black-900 rounded-lg border border-graphite-600 flex items-center justify-center mb-3 shadow-glow">
            <Shield className="text-amber-500 w-7 h-7" />
          </div>
          <h1 className="text-2xl font-bold text-text-primary">ARQUIVOS ATIV</h1>
          <p className="text-xs text-text-secondary">Acesso restrito</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <input
            type="email"
            required
            value={localEmail}
            onChange={(e) => setLocalEmail(e.target.value)}
            className="w-full bg-black-900 border border-graphite-600 rounded px-4 py-3 text-text-primary"
            placeholder="email@ativbrasil.com.br"
            autoComplete="email"
          />

          <input
            type="password"
            required
            value={localPassword}
            onChange={(e) => setLocalPassword(e.target.value)}
            className="w-full bg-black-900 border border-graphite-600 rounded px-4 py-3 text-text-primary"
            placeholder="••••••••"
            autoComplete="current-password"
          />

          {authError && (
            <div className="text-red-400 text-xs text-center">
              {authError}
            </div>
          )}

          <Button type="submit" fullWidth disabled={authLoading}>
            {authLoading ? 'AUTENTICANDO…' : 'ACESSAR'}
          </Button>
        </form>
      </div>
    </div>
  );
};

// === VISTA DA HOME (CATÁLOGO) ===
const HomeView: React.FC<{ onOpenBook: (book: Book) => void }> = ({ onOpenBook }) => (
  <div className="min-h-screen pt-20 pb-20">
    <div className="space-y-12 px-4">
      {CATEGORIES.map((category) => (
        <section key={category.id}>
          <h2 className="text-xl font-bold mb-4">{category.title}</h2>
          <div className="flex overflow-x-auto gap-4 pb-4 no-scrollbar">
            {category.books.map((book) => (
              <BookCard key={book.id} book={book} onClick={onOpenBook} />
            ))}
          </div>
        </section>
      ))}
    </div>
  </div>
);

// === COMPONENTE PRINCIPAL (APP) ===
const App: React.FC = () => {
  const [user, setUser] = useState<User | null>(null);
  const [view, setView] = useState<ViewState>('home');
  const [currentBook, setCurrentBook] = useState<Book | null>(null);
  const [authLoading, setAuthLoading] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);

  const loadProfile = async (authUser: any) => {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', authUser.id)
      .single<Profile>();

    if (error || !data) {
      setAuthError('Perfil não encontrado ou acesso negado.');
      await supabase.auth.signOut();
      return;
    }

    // Verifica expiração [cite: 55, 65, 127]
    const expired = data.expires_at ? new Date(data.expires_at).getTime() < Date.now() : false;

    if (!data.is_active || expired) {
      setAuthError('Acesso suspenso ou expirado.');
      await supabase.auth.signOut();
      return;
    }

    setUser({
      id: data.id,
      name: data.email.split('@')[0],
      email: data.email,
      subscriptionStatus: 'active',
      role: data.role,
      expiresAt: data.expires_at
    } as User);

    setView('home');
  };

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      if (data.session?.user) loadProfile(data.session.user);
    });

    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session?.user) {
        loadProfile(session.user);
      } else {
        setUser(null);
        setView('home');
      }
    });

    return () => listener.subscription.unsubscribe();
  }, []);

  const handleLogin = async (emailInput: string, passwordInput: string) => {
    setAuthLoading(true);
    setAuthError(null);

    const { data, error } = await supabase.auth.signInWithPassword({
      email: emailInput,
      password: passwordInput,
    });

    if (error || !data.user) {
      setAuthError(error?.message ?? 'Falha no login.');
      setAuthLoading(false);
      return;
    }

    await loadProfile(data.user);
    setAuthLoading(false);
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    setUser(null);
    setView('home');
  };

  // Se não estiver logado, exibe apenas a tela de login
  if (!user) {
    return (
      <div className="bg-black-900 min-h-screen text-text-primary">
        <LoginView 
          onLoginAction={handleLogin} 
          authLoading={authLoading} 
          authError={authError} 
        />
      </div>
    );
  }

  // Lógica de renderização baseada no estado ViewState
  return (
    <div className="bg-black-900 min-h-screen text-text-primary">
      {/* Navbar só aparece fora da tela Admin para manter o layout limpo */}
      {view !== 'admin' && (
        <Navbar
          currentView={view}
          isLoggedIn={true}
          onNavigate={(v) => {
            setView(v);
            if (v !== 'reader') setCurrentBook(null);
          }}
          onLogout={handleLogout}
          isAdmin={user.role !== 'user'} // Admins Master, Op e Content podem ver o link admin
        />
      )}

      {view === 'home' && <HomeView onOpenBook={(book) => {
        setCurrentBook(book);
        setView('reader');
        window.scrollTo(0, 0);
      }} />}

      {view === 'reader' && currentBook && (
        <Reader book={currentBook} onClose={() => setView('home')} />
      )}

      {view === 'admin' && (
        <AdminDashboard 
          user={user} 
          onClose={() => setView('home')} 
        />
      )}
    </div>
  );
};

export default App;
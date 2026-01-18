import React, { useEffect, useState } from 'react';
import { Navbar } from './components/Navbar';
import { BookCard } from './components/BookCard';
import { Reader } from './components/Reader';
import { Button } from './components/Button';
import { MOCK_BOOKS, CATEGORIES } from './constants';
import { Book, User, ViewState } from './types';
import { Shield, Lock, ChevronRight, Play } from 'lucide-react';

// App.tsx está na raiz; seu client Supabase está em src/lib/supabase.ts
import { supabase } from './src/lib/supabase';

const App: React.FC = () => {
  // State Management
  const [user, setUser] = useState<User | null>(null);
  const [view, setView] = useState<ViewState>('login');
  const [currentBook, setCurrentBook] = useState<Book | null>(null);

  // Auth form states
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  // Auth UX states
  const [authLoading, setAuthLoading] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);

  // Hydrate user from supabase session + keep it in sync
  useEffect(() => {
    let isMounted = true;

    const setUserFromSession = (sessionUser: any | null) => {
      if (!isMounted) return;

      if (!sessionUser) {
        setUser(null);
        setView('login');
        setCurrentBook(null);
        return;
      }

      const uEmail: string = sessionUser.email ?? '';
      setUser({
        id: sessionUser.id,
        name: (uEmail || 'Operador').split('@')[0] || 'Operador',
        email: uEmail,
        subscriptionStatus: 'active', // Passo 5: trocar por verificação real (perfil/assinatura/RLS)
      });
      setView('home');
    };

    // 1) current session
    supabase.auth
      .getSession()
      .then(({ data }) => {
        setUserFromSession(data.session?.user ?? null);
      })
      .catch(() => {
        // Se der algum erro raro aqui, mantém em login
        setUserFromSession(null);
      });

    // 2) auth state changes
    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      setUserFromSession(session?.user ?? null);
    });

    return () => {
      isMounted = false;
      listener.subscription.unsubscribe();
    };
  }, []);

  // Login Handler (REAL)
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthLoading(true);
    setAuthError(null);

    const { data, error } = await supabase.auth.signInWithPassword({
      email: email.trim(),
      password,
    });

    if (error) {
      setAuthError(error.message);
      setAuthLoading(false);
      return;
    }

    // onAuthStateChange vai ajustar user/view, mas já podemos acelerar a UX
    const u = data.user;
    if (u) {
      setUser({
        id: u.id,
        name: ((u.email ?? 'Operador').split('@')[0]) || 'Operador',
        email: u.email ?? '',
        subscriptionStatus: 'active',
      });
      setView('home');
    }

    setAuthLoading(false);
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    setUser(null);
    setView('login');
    setCurrentBook(null);
    setEmail('');
    setPassword('');
    setAuthError(null);
  };

  const openBook = (book: Book) => {
    if (user?.subscriptionStatus === 'active') {
      setCurrentBook(book);
      setView('reader');
      window.scrollTo(0, 0);
    } else {
      alert('Assinatura necessária para acessar este conteúdo.');
    }
  };

  // --- Views ---

  const LoginView = () => (
    <div className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden">
      {/* Background Elements */}
      <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-graphite-800 via-black-900 to-black-900 -z-10" />

      <div className="w-full max-w-md bg-graphite-800/50 backdrop-blur-md border border-graphite-700 p-8 rounded-2xl shadow-2xl animate-fade-in-up">
        <div className="flex flex-col items-center mb-8">
          <div className="w-16 h-16 bg-gradient-to-br from-graphite-700 to-black-900 rounded-lg border border-graphite-600 flex items-center justify-center mb-4 shadow-glow">
            <Shield className="text-amber-500 w-8 h-8" />
          </div>
          <h1 className="text-3xl font-display font-bold text-text-primary tracking-wide">ARQUIVOS ATIV</h1>
          <p className="text-text-secondary text-sm mt-2 text-center">Acesso restrito a pessoal autorizado.</p>
        </div>

        <form onSubmit={handleLogin} className="space-y-6">
          <div className="space-y-2">
            <label className="text-xs font-bold text-text-muted uppercase tracking-wider">Email Operacional</label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full bg-black-900 border border-graphite-600 rounded-lg px-4 py-3 text-text-primary focus:border-amber-500 focus:outline-none focus:ring-1 focus:ring-amber-500 transition-colors"
              placeholder="id@ativbrasil.com.br"
              autoComplete="email"
            />
          </div>

          <div className="space-y-2">
            <label className="text-xs font-bold text-text-muted uppercase tracking-wider">Senha de Acesso</label>
            <div className="relative">
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-black-900 border border-graphite-600 rounded-lg px-4 py-3 text-text-primary focus:border-amber-500 focus:outline-none focus:ring-1 focus:ring-amber-500 transition-colors"
                placeholder="••••••••"
                autoComplete="current-password"
              />
              <Lock className="absolute right-3 top-1/2 -translate-y-1/2 text-text-muted w-4 h-4" />
            </div>
          </div>

          {authError && (
            <div className="text-center text-xs text-red-400">
              {authError}
            </div>
          )}

          <Button type="submit" fullWidth>
            {authLoading ? 'AUTENTICANDO...' : 'ACESSAR SISTEMA'}
          </Button>

          <div className="text-center">
            <a
              href="#"
              onClick={(e) => {
                e.preventDefault();
                alert('Recuperação de senha será configurada em seguida.');
              }}
              className="text-xs text-text-muted hover:text-amber-500 transition-colors"
            >
              Esqueceu suas credenciais?
            </a>
          </div>
        </form>
      </div>
    </div>
  );

  const HomeView = () => (
    <div className="min-h-screen pt-20 pb-20 animate-fade-in">
      {/* Hero Section */}
      <section className="relative px-4 md:px-8 lg:px-12 py-8 mb-8">
        <div
          className="bg-gradient-to-r from-graphite-800 to-black-900 rounded-2xl p-6 md:p-12 border border-graphite-700 relative overflow-hidden group cursor-pointer shadow-2xl"
          onClick={() => openBook(MOCK_BOOKS[0])}
        >
          <div className="absolute top-0 right-0 w-1/2 h-full bg-[url('https://picsum.photos/800/400?grayscale')] bg-cover bg-center opacity-20 group-hover:opacity-30 transition-opacity mask-image-linear-gradient" />

          <div className="relative z-10 max-w-2xl">
            <span className="inline-block px-3 py-1 rounded bg-amber-500/10 text-amber-500 text-xs font-bold tracking-widest uppercase mb-4 border border-amber-500/20">
              Destaque da Semana
            </span>
            <h1 className="text-4xl md:text-6xl font-display font-bold text-white mb-4 leading-none">
              Protocolos VIP: <br />
              <span className="text-text-secondary">Nível 3</span>
            </h1>
            <p className="text-lg text-text-secondary mb-8 max-w-lg leading-relaxed">
              Atualização crítica sobre escolta armada em zonas de alto risco urbano.
              Estudo de caso da operação Centurião.
            </p>
            <div className="flex gap-4">
              <Button icon={<Play size={20} />}>Ler Agora</Button>
              <Button variant="secondary" icon={<ChevronRight size={20} />}>
                Mais Detalhes
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Categories Rows */}
      <div className="space-y-12 px-4 md:px-8 lg:px-12">
        {CATEGORIES.map((category) => (
          <section key={category.id}>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl md:text-2xl font-display font-bold text-text-primary tracking-wide">
                {category.title}
              </h2>
              <button className="text-xs font-bold text-amber-500 hover:text-amber-400 uppercase tracking-widest flex items-center gap-1">
                Ver Todos <ChevronRight size={14} />
              </button>
            </div>

            {/* Horizontal Scroll Container */}
            <div className="flex overflow-x-auto gap-4 md:gap-6 pb-4 -mx-4 px-4 md:-mx-8 md:px-8 scroll-smooth no-scrollbar">
              {category.books.map((book) => (
                <BookCard
                  key={`${category.id}-${book.id}`}
                  book={book}
                  onClick={openBook}
                />
              ))}
            </div>
          </section>
        ))}
      </div>
    </div>
  );

  return (
    <div className="bg-black-900 min-h-screen text-text-primary font-sans selection:bg-amber-500 selection:text-black-900">
      <Navbar
        currentView={view}
        isLoggedIn={!!user}
        onNavigate={(v) => {
          if (!user && v !== 'login') return;
          setView(v);
          if (v !== 'reader') setCurrentBook(null);
        }}
        onLogout={handleLogout}
      />

      {view === 'login' && <LoginView />}
      {view === 'home' && <HomeView />}
      {view === 'reader' && currentBook && (
        <Reader
          book={currentBook}
          onClose={() => setView('home')}
        />
      )}
    </div>
  );
};

export default App;

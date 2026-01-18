import React, { useEffect, useState } from 'react';
import { Navbar } from './components/Navbar';
import { BookCard } from './components/BookCard';
import { Reader } from './components/Reader';
import { Button } from './components/Button';
import { MOCK_BOOKS, CATEGORIES } from './constants';
import { Book, User, ViewState } from './types';
import { Shield, Lock, ChevronRight, Play } from 'lucide-react';
import { supabase } from './src/lib/supabase';

type Profile = {
  id: string;
  email: string;
  role: 'admin' | 'user';
  is_active: boolean;
  expires_at: string | null;
};

const App: React.FC = () => {
  const [user, setUser] = useState<User | null>(null);
  const [view, setView] = useState<ViewState>('login');
  const [currentBook, setCurrentBook] = useState<Book | null>(null);

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [authLoading, setAuthLoading] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);

  // === CORE: carregar perfil real ===
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

    const expired =
      data.expires_at &&
      new Date(data.expires_at).getTime() < Date.now();

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
      role: data.role, // admin | user
    } as User);

    setView('home');
  };

  // === Sessão persistente ===
  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      if (data.session?.user) {
        loadProfile(data.session.user);
      }
    });

    const { data: listener } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        if (session?.user) {
          loadProfile(session.user);
        } else {
          setUser(null);
          setView('login');
          setCurrentBook(null);
        }
      }
    );

    return () => listener.subscription.unsubscribe();
  }, []);

  // === Login real ===
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthLoading(true);
    setAuthError(null);

    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
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
    setView('login');
    setCurrentBook(null);
  };

  const openBook = (book: Book) => {
    if (user?.subscriptionStatus === 'active') {
      setCurrentBook(book);
      setView('reader');
      window.scrollTo(0, 0);
    } else {
      alert('Acesso bloqueado.');
    }
  };

  // === LOGIN VIEW ===
  const LoginView = () => (
    <div className="min-h-screen flex items-center justify-center p-4 relative">
      <div className="w-full max-w-md bg-graphite-800/50 backdrop-blur-md border border-graphite-700 p-8 rounded-2xl shadow-2xl">
        <div className="flex flex-col items-center mb-6">
          <Shield className="text-amber-500 w-10 h-10 mb-2" />
          <h1 className="text-2xl font-bold">ARQUIVOS ATIV</h1>
          <p className="text-xs text-text-secondary">Acesso restrito</p>
        </div>

        <form onSubmit={handleLogin} className="space-y-4">
          <input
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full bg-black-900 border border-graphite-600 rounded px-4 py-3"
            placeholder="email@ativbrasil.com.br"
          />

          <input
            type="password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full bg-black-900 border border-graphite-600 rounded px-4 py-3"
            placeholder="••••••••"
          />

          {authError && (
            <div className="text-red-400 text-xs text-center">
              {authError}
            </div>
          )}

          <Button type="submit" fullWidth>
            {authLoading ? 'AUTENTICANDO…' : 'ACESSAR'}
          </Button>
        </form>
      </div>
    </div>
  );

  // === HOME VIEW ===
  const HomeView = () => (
    <div className="min-h-screen pt-20 pb-20">
      <div className="space-y-12 px-4">
        {CATEGORIES.map((category) => (
          <section key={category.id}>
            <h2 className="text-xl font-bold mb-4">{category.title}</h2>
            <div className="flex overflow-x-auto gap-4 pb-4 no-scrollbar">
              {category.books.map((book) => (
                <BookCard
                  key={book.id}
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
    <div className="bg-black-900 min-h-screen text-text-primary">
      <Navbar
        currentView={view}
        isLoggedIn={!!user}
        onNavigate={(v) => {
          if (!user && v !== 'login') return;
          setView(v);
          if (v !== 'reader') setCurrentBook(null);
        }}
        onLogout={handleLogout}
        isAdmin={user?.role === 'admin'}
      />

      {view === 'login' && <LoginView />}
      {view === 'home' && <HomeView />}
      {view === 'reader' && currentBook && (
        <Reader book={currentBook} onClose={() => setView('home')} />
      )}
    </div>
  );
};

export default App;

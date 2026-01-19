import React, { useEffect, useState } from 'react';
import { supabase } from '../src/lib/supabase';
import { Book, EbookStatus, EbookLevel } from '../types';
import { Plus, Search, BookOpen, Edit, Archive, CheckCircle, Clock } from 'lucide-react';
import { Button } from './Button';
import { EbookForm } from './EbookForm';

export const ContentManager: React.FC = () => {
  const [books, setBooks] = useState<Book[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [isAdding, setIsAdding] = useState(false);

  const fetchBooks = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('ebooks')
      .select('*')
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
        level: b.level as EbookLevel,
        status: b.status as EbookStatus,
        createdAt: b.created_at,
        updatedAt: b.updated_at
      })));
    }
    setLoading(false);
  };

  useEffect(() => { fetchBooks(); }, []);

  const handleCreateBook = async (bookData: any) => {
    try {
      const { error } = await supabase.from('ebooks').insert([bookData]);
      if (error) throw error;
      
      setIsAdding(false);
      fetchBooks();
      alert("MISSÃO CUMPRIDA: O novo manual foi inserido no acervo!");
    } catch (error: any) {
      console.error("Erro no Supabase:", error);
      alert("ERRO DE CONEXÃO: O banco recusou os dados. Motivo: " + error.message);
    }
  };

  const updateBookStatus = async (id: string, newStatus: EbookStatus) => {
    const { error } = await supabase
      .from('ebooks')
      .update({ status: newStatus, updated_at: new Date().toISOString() })
      .eq('id', id);
    if (!error) fetchBooks();
  };

  const filteredBooks = books.filter(b => b.title.toLowerCase().includes(searchTerm.toLowerCase()));

  return (
    <div className="space-y-6 animate-fade-in-up">
      {isAdding && (
        <EbookForm onClose={() => setIsAdding(false)} onSave={handleCreateBook} />
      )}

      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-display font-bold text-text-primary uppercase tracking-tight">Gestão de Acervo</h2>
        <Button variant="primary" icon={<Plus size={18} />} onClick={() => setIsAdding(true)}>
          Novo Ebook
        </Button>
      </div>

      <div className="relative w-full">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted w-4 h-4" />
        <input type="text" placeholder="Buscar manual ou protocolo..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full bg-graphite-800 border border-graphite-700 rounded-lg py-3 pl-10 pr-4 text-sm text-text-primary focus:border-amber-500 outline-none" />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {loading ? (
          <div className="col-span-full py-20 text-center text-text-muted italic">Sincronizando biblioteca tática...</div>
        ) : filteredBooks.length === 0 ? (
          <div className="col-span-full py-20 text-center text-text-muted">Nenhum ebook encontrado no banco de dados.</div>
        ) : filteredBooks.map((book) => (
          <div key={book.id} className="bg-graphite-800 border border-graphite-700 rounded-xl overflow-hidden flex flex-col group hover:border-amber-500/30 transition-all shadow-lg">
            <div className="aspect-[16/9] relative overflow-hidden bg-black-900">
              <img src={book.coverUrl} alt={book.title} className="w-full h-full object-cover opacity-60 group-hover:opacity-80 transition-opacity" />
              <div className="absolute top-3 right-3 flex gap-2">
                <span className={`px-2 py-1 rounded text-[10px] font-bold uppercase border ${
                  book.status === 'published' ? 'bg-green-500/10 text-green-500 border-green-500/20' : 
                  'bg-amber-500/10 text-amber-500 border-amber-500/20'
                }`}>
                  {book.status === 'published' ? 'Publicado' : 'Rascunho'}
                </span>
              </div>
            </div>
            
            <div className="p-5 flex-1 flex flex-col">
              <span className="text-amber-500 text-[10px] font-bold uppercase tracking-widest mb-1">{book.category}</span>
              <h3 className="text-lg font-bold leading-tight mb-2 text-text-primary line-clamp-1">{book.title}</h3>
              <p className="text-xs text-text-muted line-clamp-2 mb-4">{book.description}</p>
              
              <div className="mt-auto pt-4 border-t border-graphite-700 flex items-center justify-between text-[10px] font-medium text-text-secondary uppercase">
                <div className="flex items-center gap-1"><Clock size={12} /> {book.readTime}</div>
                <div className="flex items-center gap-1"><BookOpen size={12} /> {book.level}</div>
              </div>
            </div>

            <div className="bg-black-900/50 p-3 flex border-t border-graphite-700">
              <button className="flex-1 flex items-center justify-center gap-2 text-[10px] font-bold uppercase text-text-muted hover:text-amber-500 transition-colors border-r border-graphite-700">
                <Edit size={14} /> Editar
              </button>
              <button 
                onClick={() => updateBookStatus(book.id, book.status === 'published' ? 'draft' : 'published')}
                className={`flex-1 flex items-center justify-center gap-2 text-[10px] font-bold uppercase transition-colors ${
                  book.status === 'published' ? 'text-red-500/70 hover:text-red-500' : 'text-green-500/70 hover:text-green-500'
                }`}
              >
                {book.status === 'published' ? 'Arquivar' : 'Publicar'}
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
import React from 'react';
import { Play, ArrowLeft, Shield, Clock, BarChart3 } from 'lucide-react';
import { Book, User } from '../types';

interface ProtocolSummaryProps {
  book: Book;
  user: User;
  onClose: () => void;
  onStart: (book: Book) => void;
}

export const ProtocolSummary: React.FC<ProtocolSummaryProps> = ({ book, user, onClose, onStart }) => {
  // Converte a string de competências em lista para o layout
  const skillsList = book.technical_skills 
    ? book.technical_skills.split('.').map(s => s.trim()).filter(Boolean)
    : [];

  return (
    <div className="fixed inset-0 z-[60] bg-black flex flex-col animate-fade-in overflow-y-auto">
      {/* Header de Reconhecimento */}
      <header className="sticky top-0 z-10 bg-graphite-900/80 backdrop-blur-md border-b border-graphite-700 p-4 flex items-center justify-between shadow-xl">
        <button 
          onClick={onClose}
          className="flex items-center gap-2 text-[10px] font-black uppercase text-text-muted hover:text-amber-500 transition-colors"
        >
          <ArrowLeft size={16} /> Voltar ao Acervo
        </button>
        <div className="flex flex-col items-end">
          <span className="text-[10px] text-amber-500 font-black tracking-widest uppercase">Protocolo de Reconhecimento</span>
          <span className="text-[9px] text-text-muted font-bold uppercase">Agente: {user.name}</span>
        </div>
      </header>

      <main className="flex-1 max-w-4xl mx-auto w-full p-6 md:p-10 space-y-10">
        {/* Bloco de Capa e Meta */}
        <section className="grid grid-cols-1 md:grid-cols-2 gap-8 items-start">
          <div className="aspect-[16/9] rounded-2xl overflow-hidden border border-graphite-700 shadow-2xl bg-graphite-800">
            <img src={book.coverUrl} alt={book.title} className="w-full h-full object-cover" />
          </div>
          
          <div className="space-y-4">
            <div className="flex gap-2">
              <span className="bg-amber-500/10 text-amber-500 text-[10px] font-black px-2 py-1 rounded border border-amber-500/20 uppercase tracking-widest">
                {book.category}
              </span>
              <span className="bg-graphite-700 text-white text-[10px] font-black px-2 py-1 rounded uppercase tracking-widest">
                {book.level}
              </span>
            </div>
            
            <h1 className="text-3xl font-display font-bold text-white uppercase leading-tight">
              {book.title}
            </h1>

            <div className="flex items-center gap-6 text-text-muted">
              <div className="flex items-center gap-2 text-xs font-bold uppercase">
                <Clock size={16} className="text-amber-500" />
                {book.readTime}
              </div>
              <div className="flex items-center gap-2 text-xs font-bold uppercase">
                <BarChart3 size={16} className="text-amber-500" />
                Certificação 90%
              </div>
            </div>
          </div>
        </section>

        {/* Resumo e Ementa */}
        <section className="grid grid-cols-1 md:grid-cols-3 gap-10 border-t border-graphite-800 pt-10">
          <div className="md:col-span-2 space-y-4">
            <h3 className="text-amber-500 font-black text-xs uppercase tracking-[0.2em] flex items-center gap-2">
              <Shield size={14} /> Resumo Operacional
            </h3>
            <p className="text-text-secondary leading-relaxed text-sm italic">
              "{book.description}"
            </p>
          </div>

          <div className="space-y-4">
            <h3 className="text-amber-500 font-black text-xs uppercase tracking-[0.2em]">Ementa Técnica</h3>
            <ul className="space-y-3">
              {skillsList.map((skill, idx) => (
                <li key={idx} className="flex items-start gap-3 text-xs text-text-primary font-medium">
                  <div className="w-1.5 h-1.5 rounded-full bg-amber-500 mt-1.5 shrink-0" />
                  {skill}
                </li>
              ))}
              {skillsList.length === 0 && <li className="text-text-muted text-xs italic">Nenhuma competência listada.</li>}
            </ul>
          </div>
        </section>

        {/* Footer de Engajamento */}
        <footer className="pt-10 border-t border-graphite-800 flex flex-col md:flex-row items-center justify-between gap-6 pb-10">
          <div className="text-center md:text-left">
            <p className="text-[10px] text-text-muted uppercase font-black tracking-widest mb-1">Pronto para a missão?</p>
            <p className="text-xs text-text-secondary">Ao assumir a instrução, este protocolo será registrado em seu histórico.</p>
          </div>
          
          <button 
            onClick={() => onStart(book)}
            className="w-full md:w-auto bg-amber-500 hover:bg-amber-600 text-black px-10 py-4 rounded-xl font-black uppercase tracking-[0.2em] shadow-glow flex items-center justify-center gap-3 transition-all hover:scale-105 active:scale-95"
          >
            <Play size={20} fill="currentColor" /> Assumir Instrução
          </button>
        </footer>
      </main>
    </div>
  );
};
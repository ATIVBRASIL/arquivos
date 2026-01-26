import React from 'react';
import { Book } from '../types';
import { Clock, ChevronRight } from 'lucide-react';

interface BookCardProps {
  book: Book;
  onClick: (book: Book) => void;
  status?: 'cursando' | 'certificado'; // Nova prop tática
}

export const BookCard: React.FC<BookCardProps> = ({ book, onClick, status }) => {
  return (
    <div 
      onClick={() => onClick(book)}
      className="bg-graphite-800 border border-graphite-700 rounded-2xl overflow-hidden cursor-pointer group hover:border-amber-500/50 transition-all shadow-xl flex flex-col h-full relative"
    >
      {/* Container da Imagem */}
      <div className="aspect-[16/9] relative overflow-hidden bg-black">
        
        {/* TARJAS DE STATUS (Z-INDEX 10 para ficar sobre a imagem) */}
        {status === 'certificado' && (
          <div className="absolute top-0 left-0 right-0 bg-green-500 text-black text-[9px] font-black py-1 text-center uppercase tracking-[0.2em] z-10 shadow-lg">
            Certificado Emitido
          </div>
        )}
        
        {status === 'cursando' && (
          <div className="absolute top-0 left-0 right-0 bg-amber-500 text-black text-[9px] font-black py-1 text-center uppercase tracking-[0.2em] z-10 shadow-lg">
            Cursando
          </div>
        )}

        <img 
          src={book.coverUrl} 
          alt={book.title}
          className={`w-full h-full object-cover ${status ? 'opacity-40' : 'opacity-70'} group-hover:opacity-100 group-hover:scale-105 transition-all duration-500`}
        />
        
        {/* Badge de Nível */}
        <div className="absolute bottom-3 right-3">
          <span className="bg-black/60 backdrop-blur-md text-amber-500 text-[9px] font-black px-2 py-1 rounded border border-amber-500/20 uppercase tracking-tighter">
            {book.level}
          </span>
        </div>
      </div>

      {/* Conteúdo do Card */}
      <div className="p-5 flex flex-col flex-1">
        <span className="text-amber-500 text-[10px] font-black uppercase tracking-[0.15em] mb-2 pt-1">
          {book.category}
        </span>
        
        <h3 className="text-lg font-display font-bold text-text-primary leading-tight mb-3 group-hover:text-amber-500 transition-colors line-clamp-2">
          {book.title}
        </h3>
        
        <p className="text-xs text-text-muted line-clamp-2 mb-6 leading-relaxed">
          {book.description}
        </p>

        {/* Rodapé do Card */}
        <div className="mt-auto flex items-center justify-between border-t border-graphite-700 pt-4">
          <div className="flex items-center gap-4 text-text-muted">
            <div className="flex items-center gap-1.5 text-[10px] font-bold">
              <Clock size={12} className="text-amber-500/70" />
              {book.readTime}
            </div>
          </div>
          <div className="flex items-center gap-1 text-amber-500 text-[10px] font-black uppercase tracking-widest">
            {status === 'certificado' ? 'Revisar' : 'Acessar'} <ChevronRight size={14} />
          </div>
        </div>
      </div>
    </div>
  );
};
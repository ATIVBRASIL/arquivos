import React from 'react';
import { Book } from '../types';
import { PlayCircle } from 'lucide-react';

interface BookCardProps {
  book: Book;
  onClick: (book: Book) => void;
  featured?: boolean;
}

export const BookCard: React.FC<BookCardProps> = ({ book, onClick, featured = false }) => {
  // Design System:
  // Fundo: graphite-800
  // Radius: 12-16px
  // Hover: Zoom 1.02, Glow âmbar discreto
  
  return (
    <div 
      onClick={() => onClick(book)}
      className={`
        group relative flex-shrink-0 cursor-pointer overflow-hidden rounded-xl bg-graphite-800 border border-graphite-700
        transition-all duration-300 ease-out
        hover:scale-[1.02] hover:border-amber-500/30 hover:shadow-glow
        ${featured ? 'w-[280px] h-[420px]' : 'w-[160px] md:w-[200px] h-[280px] md:h-[340px]'}
      `}
    >
      {/* Image with overlay gradient */}
      <div className="absolute inset-0">
        <img 
          src={book.coverUrl} 
          alt={book.title} 
          className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105 opacity-80 group-hover:opacity-100"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black-900 via-black-900/40 to-transparent" />
      </div>

      {/* Content Overlay */}
      <div className="absolute bottom-0 left-0 right-0 p-4 flex flex-col justify-end h-full">
        <span className="text-amber-500 text-xs font-bold tracking-wider uppercase mb-1 font-display">
          {book.category}
        </span>
        <h3 className={`font-display font-bold text-text-primary leading-tight mb-1 ${featured ? 'text-2xl' : 'text-lg'}`}>
          {book.title}
        </h3>
        
        {/* Visible only on hover or featured */}
        <div className={`transition-all duration-300 transform translate-y-4 opacity-0 group-hover:translate-y-0 group-hover:opacity-100 ${featured ? 'translate-y-0 opacity-100' : ''}`}>
          <p className="text-xs text-text-secondary line-clamp-2 mb-3">
            {book.description}
          </p>
          <div className="flex items-center text-amber-500 text-sm font-medium gap-2">
            <PlayCircle size={16} />
            <span>Ler Agora</span>
          </div>
        </div>
      </div>
    </div>
  );
};
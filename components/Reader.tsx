import React from 'react';
import { X } from 'lucide-react';
import { Book } from '../types';

interface ReaderProps {
  book: Book;
  onClose: () => void;
}

export const Reader: React.FC<ReaderProps> = ({ book, onClose }) => {
  return (
    <div className="fixed inset-0 z-50 bg-black flex flex-col animate-fade-in">
      {/* Cabeçalho de Controle do App */}
      <header className="bg-graphite-800 border-b border-graphite-700 p-4 flex items-center justify-between">
        <div>
          <h2 className="text-amber-500 font-display font-bold uppercase text-sm tracking-tight">{book.title}</h2>
          <p className="text-[10px] text-text-muted uppercase tracking-widest">{book.category}</p>
        </div>
        <button 
          onClick={onClose}
          className="bg-black/20 hover:bg-amber-500 hover:text-black p-2 rounded-full transition-all text-text-muted"
        >
          <X size={24} />
        </button>
      </header>

      {/* O "Coração" do Leitor: iFrame para isolar o seu HTML/CSS/JS */}
      <div className="flex-1 bg-white">
        <iframe
          srcDoc={book.content}
          title={book.title}
          className="w-full h-full border-none"
          sandbox="allow-scripts allow-same-origin"
        />
      </div>
    </div>
  );
};
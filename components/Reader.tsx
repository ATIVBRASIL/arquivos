import React, { useEffect, useState } from 'react';
import { Book } from '../types';
import { ArrowLeft, Share2, Type, Clock } from 'lucide-react';

interface ReaderProps {
  book: Book;
  onClose: () => void;
}

export const Reader: React.FC<ReaderProps> = ({ book, onClose }) => {
  const [progress, setProgress] = useState(0);

  // Simulate progress tracking on scroll
  useEffect(() => {
    const handleScroll = () => {
      const totalHeight = document.documentElement.scrollHeight - window.innerHeight;
      const currentScroll = window.scrollY;
      const percentage = (currentScroll / totalHeight) * 100;
      setProgress(Math.min(100, Math.max(0, percentage)));
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <div className="min-h-screen bg-black-900 text-text-primary pt-20 animate-fade-in">
      {/* Top Reading Bar */}
      <div className="fixed top-16 md:top-20 left-0 right-0 bg-black-900/95 backdrop-blur border-b border-graphite-700 z-30 h-14 flex items-center justify-between px-4 md:px-8">
        <button 
          onClick={onClose}
          className="flex items-center gap-2 text-text-secondary hover:text-amber-500 transition-colors"
        >
          <ArrowLeft size={20} />
          <span className="hidden md:inline font-medium text-sm">Voltar ao Catálogo</span>
        </button>

        <span className="font-display font-semibold text-sm md:text-base tracking-wide truncate max-w-[200px] md:max-w-none text-gray-300">
          {book.title}
        </span>

        <div className="flex items-center gap-4">
          <button className="text-text-secondary hover:text-text-primary"><Type size={20} /></button>
          <button className="text-text-secondary hover:text-text-primary"><Share2 size={20} /></button>
        </div>

        {/* Reading Progress Bar */}
        <div 
          className="absolute bottom-0 left-0 h-0.5 bg-amber-500 transition-all duration-150"
          style={{ width: `${progress}%` }}
        />
      </div>

      {/* Content Area */}
      <div className="max-w-2xl mx-auto px-6 py-12 md:py-20">
        
        {/* Header */}
        <header className="mb-12 text-center border-b border-graphite-700 pb-8">
          <div className="inline-block px-3 py-1 rounded bg-graphite-800 text-amber-500 text-xs font-bold tracking-widest uppercase mb-4">
            {book.category}
          </div>
          <h1 className="text-3xl md:text-5xl font-display font-bold mb-6 text-white leading-tight">
            {book.title}
          </h1>
          <div className="flex items-center justify-center gap-6 text-text-muted text-sm">
             <div className="flex items-center gap-1">
               <Clock size={14} />
               <span>{book.readTime} de leitura</span>
             </div>
             <div>
               Atualizado em Out 2023
             </div>
          </div>
        </header>

        {/* HTML Content Injection */}
        <article 
          className="prose prose-invert prose-lg max-w-none prose-headings:font-display prose-headings:text-amber-500 prose-p:text-text-secondary prose-strong:text-text-primary prose-a:text-amber-500 hover:prose-a:text-amber-400"
          dangerouslySetInnerHTML={{ __html: book.content }}
        />

        {/* Footer Navigation */}
        <div className="mt-20 pt-10 border-t border-graphite-700 flex justify-between">
           <button className="text-text-muted hover:text-amber-500 transition-colors text-sm font-medium">
             &larr; Capítulo Anterior
           </button>
           <button className="text-text-muted hover:text-amber-500 transition-colors text-sm font-medium">
             Próximo Capítulo &rarr;
           </button>
        </div>
      </div>
    </div>
  );
};
import React from 'react';
import { X, ClipboardCheck, Shield } from 'lucide-react';
import { Book, User } from '../types';

interface ReaderProps {
  book: Book;
  user: User; // Agora o leitor reconhece quem está operando o sistema
  onClose: () => void;
}

export const Reader: React.FC<ReaderProps> = ({ book, user, onClose }) => {
  // Verifica se o manual possui um quiz configurado no banco de dados
  const hasQuiz = book.quiz_data && Array.isArray(book.quiz_data) && book.quiz_data.length > 0;

  return (
    <div className="fixed inset-0 z-50 bg-black flex flex-col animate-fade-in">
      {/* Cabeçalho de Controle e Identificação */}
      <header className="bg-graphite-800 border-b border-graphite-700 p-4 flex items-center justify-between shadow-2xl">
        <div className="flex items-center gap-4">
          <button 
            onClick={onClose}
            className="bg-black/20 hover:bg-amber-500 hover:text-black p-2 rounded-full transition-all text-text-muted"
            title="Fechar Manual"
          >
            <X size={24} />
          </button>
          <div className="flex flex-col">
            <h2 className="text-amber-500 font-display font-bold uppercase text-sm tracking-tight leading-none mb-1">
              {book.title}
            </h2>
            <div className="flex items-center gap-2">
              <Shield size={10} className="text-text-muted" />
              <p className="text-[9px] text-text-muted uppercase tracking-widest font-bold">
                Operador: <span className="text-text-secondary">{user.name}</span>
              </p>
            </div>
          </div>
        </div>

        {/* GATILHO DE AVALIAÇÃO: Só aparece se houver quiz configurado no Admin */}
        {hasQuiz ? (
          <button 
            className="bg-amber-500 hover:bg-amber-600 text-black px-4 py-2 rounded-lg font-bold text-[10px] uppercase flex items-center gap-2 shadow-glow transition-all active:scale-95 animate-pulse"
            onClick={() => alert("ALERTA: Iniciando Protocolo de Avaliação de Elite...")}
          >
            <ClipboardCheck size={16} /> Iniciar Avaliação
          </button>
        ) : (
          <div className="hidden md:flex flex-col items-end">
             <span className="text-[8px] text-text-muted uppercase font-black">Modo Leitura</span>
             <span className="text-[10px] text-graphite-500 uppercase font-bold italic">Sem Certificação</span>
          </div>
        )}
      </header>

      {/* Visualizador de Conteúdo Tático */}
      <div className="flex-1 bg-white relative">
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
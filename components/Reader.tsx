import React, { useState } from 'react';
import { X, ClipboardCheck, BookOpen } from 'lucide-react';
import { Book, User } from '../types';
import { QuizComponent } from './QuizComponent';

interface ReaderProps {
  book: Book;
  user: User;
  onClose: () => void;
}

export const Reader: React.FC<ReaderProps> = ({ book, user, onClose }) => {
  const [showQuiz, setShowQuiz] = useState(false);
  const hasQuiz = book.quiz_data && Array.isArray(book.quiz_data) && book.quiz_data.length > 0;

  // === AÇÃO DE VALIDAÇÃO COM ALERTA ===
  const handleStartValidation = () => {
    // Texto Tático de Alto Valor Percebido
    const confirmed = window.confirm(
      "⚠️ ATENÇÃO OPERADOR\n\n" +
      "A Certificação de Elite exige precisão mínima de 90%.\n" +
      "Falhas não validam a competência técnica.\n\n" +
      "Está pronto para iniciar a missão?"
    );

    if (confirmed) {
      setShowQuiz(true);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black flex flex-col animate-fade-in">
      {/* Cabeçalho */}
      <header className="bg-graphite-800 border-b border-graphite-700 p-4 flex items-center justify-between shadow-2xl shrink-0">
        <div className="flex items-center gap-4">
          <button 
            onClick={onClose}
            className="bg-black/20 hover:bg-amber-500 hover:text-black p-2 rounded-full transition-all text-text-muted"
          >
            <X size={24} />
          </button>
          <div>
            <h2 className="text-amber-500 font-display font-bold uppercase text-sm tracking-tight">{book.title}</h2>
            <p className="text-[9px] text-text-muted uppercase font-bold">Operador: {user.name}</p>
          </div>
        </div>

        {/* Botão de Validação Atualizado */}
        {hasQuiz && !showQuiz && (
          <button 
            className="bg-amber-500 hover:bg-amber-600 text-black px-4 py-2 rounded-lg font-bold text-[10px] uppercase flex items-center gap-2 shadow-glow transition-all active:scale-95 animate-pulse"
            onClick={handleStartValidation}
          >
            <ClipboardCheck size={16} /> INICIAR VALIDAÇÃO
          </button>
        )}

        {showQuiz && (
          <button 
            className="text-text-muted hover:text-white flex items-center gap-2 text-[10px] font-black uppercase"
            onClick={() => setShowQuiz(false)}
          >
            <BookOpen size={16} /> Voltar ao Manual
          </button>
        )}
      </header>

      {/* Área de Conteúdo Dinâmica */}
      <div className="flex-1 bg-black-900 overflow-hidden">
        {showQuiz ? (
          <div className="h-full flex items-center justify-center">
            <QuizComponent book={book} user={user} onClose={onClose} />
          </div>
        ) : (
          <iframe
            srcDoc={book.content}
            title={book.title}
            className="w-full h-full border-none bg-white"
            sandbox="allow-scripts allow-same-origin"
          />
        )}
      </div>
    </div>
  );
};
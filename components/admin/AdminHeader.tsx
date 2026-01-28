import React from 'react';
import { X } from 'lucide-react';
import { User } from '../../types'; // Ajuste o caminho conforme necessário

interface Props {
  user: User;
  onClose: () => void;
  children?: React.ReactNode; // Aqui entrará a Navegação
}

export const AdminHeader: React.FC<Props> = ({ user, onClose, children }) => {
  return (
    <div className="sticky top-0 bg-graphite-900 border-b border-graphite-700 p-4 flex flex-col md:flex-row justify-between items-center z-20 shadow-xl gap-4">
      <div className="flex items-center gap-6 w-full md:w-auto">
        <div className="flex items-center gap-4">
          <img
            src="/logo_ativ.png"
            alt="ATIV"
            className="h-10 md:h-12 w-auto object-contain drop-shadow-[0_0_8px_rgba(245,158,11,0.2)]"
          />
          <div className="flex flex-col justify-center">
            <h2 className="text-xl md:text-2xl font-display font-bold text-white uppercase tracking-tighter leading-none">
              COMANDO & CONTROLE
            </h2>
            <span className="text-[10px] text-text-muted uppercase font-bold">
              Operador: {user?.name || 'ADMIN'}
            </span>
          </div>
        </div>

        {/* Área para a Navegação (Injetada via children) */}
        {children}
      </div>

      <button
        onClick={onClose}
        className="absolute top-4 right-4 md:static p-2 hover:bg-graphite-800 rounded-full transition-colors text-text-muted hover:text-white"
        title="Fechar Painel"
      >
        <X size={24} />
      </button>
    </div>
  );
};
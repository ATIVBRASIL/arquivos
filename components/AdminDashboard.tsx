import React, { useState } from 'react';
import { Users, BookOpen, Mail, LayoutDashboard, ArrowLeft } from 'lucide-react';
import { User } from '../types';
import { UsersManager } from './UsersManager';
import { ContentManager } from './ContentManager';

interface AdminDashboardProps {
  user: User;
  onClose: () => void;
}

export const AdminDashboard: React.FC<AdminDashboardProps> = ({ user, onClose }) => {
  const [activeTab, setActiveTab] = useState<'overview' | 'users' | 'content' | 'inbox'>('overview');

  // Controle de permissões baseado nos perfis de administrador (RBAC)
  const isMaster = user.role === 'admin_master';
  const canManageUsers = isMaster || user.role === 'admin_op';
  const canManageContent = isMaster || user.role === 'admin_content';

  return (
    <div className="min-h-screen bg-black-900 text-text-primary flex flex-col md:flex-row animate-fade-in">
      
      {/* Sidebar Administrativa */}
      <aside className="w-full md:w-64 bg-graphite-800 border-r border-graphite-700 flex flex-col shadow-2xl">
        <div className="p-6 border-b border-graphite-700 flex items-center justify-between">
          <div>
            <h2 className="font-display font-bold text-xl text-amber-500 uppercase tracking-tight">Painel ADM</h2>
            <p className="text-[10px] text-text-muted uppercase tracking-widest">{user.role.replace('_', ' ')}</p>
          </div>
          <button onClick={onClose} className="md:hidden text-text-muted hover:text-amber-500 transition-colors">
            <ArrowLeft size={20} />
          </button>
        </div>

        <nav className="flex-1 p-4 space-y-2">
          <button 
            onClick={() => setActiveTab('overview')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200 ${activeTab === 'overview' ? 'bg-amber-500 text-black-900 font-bold shadow-glow' : 'hover:bg-graphite-700 text-text-secondary'}`}
          >
            <LayoutDashboard size={20} /> Visão Geral
          </button>

          {canManageUsers && (
            <button 
              onClick={() => setActiveTab('users')}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200 ${activeTab === 'users' ? 'bg-amber-500 text-black-900 font-bold shadow-glow' : 'hover:bg-graphite-700 text-text-secondary'}`}
            >
              <Users size={20} /> Usuários
            </button>
          )}

          {canManageContent && (
            <button 
              onClick={() => setActiveTab('content')}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200 ${activeTab === 'content' ? 'bg-amber-500 text-black-900 font-bold shadow-glow' : 'hover:bg-graphite-700 text-text-secondary'}`}
            >
              <BookOpen size={20} /> Conteúdo
            </button>
          )}

          <button 
            onClick={() => setActiveTab('inbox')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200 ${activeTab === 'inbox' ? 'bg-amber-500 text-black-900 font-bold shadow-glow' : 'hover:bg-graphite-700 text-text-secondary'}`}
          >
            <Mail size={20} /> Mensagens
          </button>
        </nav>

        <div className="p-4 border-t border-graphite-700">
          <button onClick={onClose} className="w-full flex items-center gap-3 px-4 py-3 text-text-muted hover:text-amber-500 transition-colors text-sm font-medium">
            <ArrowLeft size={18} /> Voltar ao App
          </button>
        </div>
      </aside>

      {/* Área de Conteúdo Dinâmico */}
      <main className="flex-1 p-6 md:p-10 overflow-y-auto">
        {activeTab === 'overview' && (
          <div className="animate-fade-in-up">
            <h1 className="text-3xl font-display font-bold mb-8 text-text-primary tracking-tight">Status Operacional</h1>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Métricas Conforme Seção 3.1 do RPD */}
              <div className="bg-graphite-800 p-6 rounded-xl border border-graphite-700 hover:border-amber-500/30 transition-colors group">
                <p className="text-text-muted text-sm mb-1 uppercase tracking-wider font-semibold group-hover:text-amber-500 transition-colors">Usuários Ativos</p>
                <p className="text-3xl font-bold text-text-primary">--</p>
              </div>
              
              <div className="bg-graphite-800 p-6 rounded-xl border border-graphite-700 hover:border-amber-500/30 transition-colors group">
                <p className="text-text-muted text-sm mb-1 uppercase tracking-wider font-semibold group-hover:text-amber-500 transition-colors">Ebooks Publicados</p>
                <p className="text-3xl font-bold text-text-primary">--</p>
              </div>
              
              <div className="bg-graphite-800 p-6 rounded-xl border border-graphite-700 hover:border-amber-500/30 transition-colors group">
                <p className="text-text-muted text-sm mb-1 uppercase tracking-wider font-semibold group-hover:text-amber-500 transition-colors">Mensagens Enviadas</p>
                <p className="text-3xl font-bold text-text-primary">--</p>
              </div>
            </div>
            
            <div className="mt-12 p-8 border border-dashed border-graphite-700 rounded-2xl flex flex-col items-center justify-center text-center bg-graphite-800/30">
              <LayoutDashboard size={40} className="text-graphite-600 mb-4" />
              <p className="text-text-secondary max-w-md italic">
                Painel administrativo configurado e pronto para operações estratégicas. Use o menu lateral para gerenciar operadores e ativos digitais.
              </p>
            </div>
          </div>
        )}

        {/* Módulo de Usuários (Módulo 3.2 do RPD) */}
        {activeTab === 'users' && <UsersManager />}

        {/* Módulo de Conteúdo (Módulo 3.3 do RPD) */}
        {activeTab === 'content' && <ContentManager />}

        {activeTab === 'inbox' && (
          <div className="flex flex-col items-center justify-center h-full py-20 text-text-muted animate-fade-in">
            <Mail size={48} className="mb-4 opacity-20" />
            <p className="text-lg font-display uppercase tracking-widest">Módulo de Comunicação</p>
            <p className="text-xs italic">Configuração da Inbox tática em progresso.</p>
          </div>
        )}
      </main>
    </div>
  );
};
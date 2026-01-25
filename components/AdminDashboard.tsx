import React, { useState } from 'react';
import { Users, BookOpen, Mail, LayoutDashboard, ArrowLeft } from 'lucide-react';
import { User } from '../types';
import { UsersManager } from './UsersManager';
import { ContentManager } from './ContentManager';
import { Overview } from './Overview';
import { MessagesManager } from './MessagesManager'; 

interface AdminDashboardProps {
  user: User;
  onClose: () => void;
}

export const AdminDashboard: React.FC<AdminDashboardProps> = ({ user, onClose }) => {
  const [activeTab, setActiveTab] = useState<'overview' | 'users' | 'content' | 'inbox'>('overview');

  // === CORREÇÃO DE PERMISSÕES (RBAC) ===
  // Agora aceita 'admin' (sua role atual) como Master
  const isMaster = user.role === 'admin' || user.role === 'admin_master';
  
  const canManageUsers = isMaster || user.role === 'admin_op';
  const canManageContent = isMaster || user.role === 'admin_content';

  return (
    <div className="min-h-screen bg-black text-text-primary flex flex-col md:flex-row animate-fade-in">
      
      {/* Sidebar Administrativa */}
      <aside className="w-full md:w-64 bg-graphite-800 border-r border-graphite-700 flex flex-col shadow-2xl">
        <div className="p-6 border-b border-graphite-700 flex items-center justify-between">
          <div>
            <h2 className="font-display font-bold text-xl text-amber-500 uppercase tracking-tight">Painel ADM</h2>
            <p className="text-[10px] text-text-muted uppercase tracking-widest">
                {/* Exibe 'COMANDO' se for admin, ou o nome da role */}
                {user.role === 'admin' ? 'COMANDO' : user.role.replace('_', ' ')}
            </p>
          </div>
          <button onClick={onClose} className="md:hidden text-text-muted hover:text-amber-500 transition-colors">
            <ArrowLeft size={20} />
          </button>
        </div>

        <nav className="flex-1 p-4 space-y-2">
          <button 
            onClick={() => setActiveTab('overview')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200 ${activeTab === 'overview' ? 'bg-amber-500 text-black font-bold shadow-glow' : 'hover:bg-graphite-700 text-text-secondary'}`}
          >
            <LayoutDashboard size={20} /> Visão Geral
          </button>

          {/* Botão Usuários - Agora Visível para Admin */}
          {canManageUsers && (
            <button 
              onClick={() => setActiveTab('users')}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200 ${activeTab === 'users' ? 'bg-amber-500 text-black font-bold shadow-glow' : 'hover:bg-graphite-700 text-text-secondary'}`}
            >
              <Users size={20} /> Usuários
            </button>
          )}

          {/* Botão Conteúdo - Agora Visível para Admin */}
          {canManageContent && (
            <button 
              onClick={() => setActiveTab('content')}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200 ${activeTab === 'content' ? 'bg-amber-500 text-black font-bold shadow-glow' : 'hover:bg-graphite-700 text-text-secondary'}`}
            >
              <BookOpen size={20} /> Conteúdo
            </button>
          )}

          <button 
            onClick={() => setActiveTab('inbox')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200 ${activeTab === 'inbox' ? 'bg-amber-500 text-black font-bold shadow-glow' : 'hover:bg-graphite-700 text-text-secondary'}`}
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
        
        {activeTab === 'overview' && <Overview />}

        {activeTab === 'users' && <UsersManager />}

        {activeTab === 'content' && <ContentManager />}

        {activeTab === 'inbox' && <MessagesManager />}
        
      </main>
    </div>
  );
};
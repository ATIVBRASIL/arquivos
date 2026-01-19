import React, { useState } from 'react';
import { Users, BookOpen, Mail, LayoutDashboard, ArrowLeft } from 'lucide-react';
import { User } from '../types';

interface AdminDashboardProps {
  user: User;
  onClose: () => void;
}

export const AdminDashboard: React.FC<AdminDashboardProps> = ({ user, onClose }) => {
  const [activeTab, setActiveTab] = useState<'overview' | 'users' | 'content' | 'inbox'>('overview');

  // Verifica permissões conforme o RBAC do RPD [cite: 15, 20]
  const isMaster = user.role === 'admin_master';
  const canManageUsers = isMaster || user.role === 'admin_op';
  const canManageContent = isMaster || user.role === 'admin_content';

  return (
    <div className="min-h-screen bg-black-900 text-text-primary flex flex-col md:flex-row animate-fade-in">
      
      {/* Sidebar Administrativa [cite: 132] */}
      <aside className="w-full md:w-64 bg-graphite-800 border-r border-graphite-700 flex flex-col">
        <div className="p-6 border-b border-graphite-700 flex items-center justify-between">
          <div>
            <h2 className="font-display font-bold text-xl text-amber-500">PAINEL ADM</h2>
            <p className="text-[10px] text-text-muted uppercase tracking-widest">{user.role.replace('_', ' ')}</p>
          </div>
          <button onClick={onClose} className="md:hidden text-text-muted"><ArrowLeft size={20} /></button>
        </div>

        <nav className="flex-1 p-4 space-y-2">
          <button 
            onClick={() => setActiveTab('overview')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${activeTab === 'overview' ? 'bg-amber-500 text-black-900 font-bold' : 'hover:bg-graphite-700 text-text-secondary'}`}
          >
            <LayoutDashboard size={20} /> Visão Geral
          </button>

          {canManageUsers && (
            <button 
              onClick={() => setActiveTab('users')}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${activeTab === 'users' ? 'bg-amber-500 text-black-900 font-bold' : 'hover:bg-graphite-700 text-text-secondary'}`}
            >
              <Users size={20} /> Usuários
            </button>
          )}

          {canManageContent && (
            <button 
              onClick={() => setActiveTab('content')}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${activeTab === 'content' ? 'bg-amber-500 text-black-900 font-bold' : 'hover:bg-graphite-700 text-text-secondary'}`}
            >
              <BookOpen size={20} /> Conteúdo
            </button>
          )}

          <button 
            onClick={() => setActiveTab('inbox')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${activeTab === 'inbox' ? 'bg-amber-500 text-black-900 font-bold' : 'hover:bg-graphite-700 text-text-secondary'}`}
          >
            <Mail size={20} /> Mensagens
          </button>
        </nav>

        <div className="p-4 border-t border-graphite-700">
          <button onClick={onClose} className="w-full flex items-center gap-3 px-4 py-3 text-text-muted hover:text-amber-500 transition-colors text-sm">
            <ArrowLeft size={18} /> Voltar ao App
          </button>
        </div>
      </aside>

      {/* Área de Conteúdo do Dashboard [cite: 50] */}
      <main className="flex-1 p-6 md:p-10 overflow-y-auto">
        {activeTab === 'overview' && (
          <div className="animate-fade-in-up">
            <h1 className="text-3xl font-display font-bold mb-8">Bem-vindo, Operador.</h1>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Cards de Métricas Simples [cite: 51, 54, 57] */}
              <div className="bg-graphite-800 p-6 rounded-xl border border-graphite-700">
                <p className="text-text-muted text-sm mb-1">Usuários Ativos</p>
                <p className="text-3xl font-bold text-amber-500">--</p>
              </div>
              <div className="bg-graphite-800 p-6 rounded-xl border border-graphite-700">
                <p className="text-text-muted text-sm mb-1">Ebooks Publicados</p>
                <p className="text-3xl font-bold text-amber-500">--</p>
              </div>
              <div className="bg-graphite-800 p-6 rounded-xl border border-graphite-700">
                <p className="text-text-muted text-sm mb-1">Mensagens Enviadas</p>
                <p className="text-3xl font-bold text-amber-500">--</p>
              </div>
            </div>
            <p className="mt-10 text-text-muted italic text-sm">Selecione um módulo no menu lateral para começar a gerenciar a plataforma.</p>
          </div>
        )}

        {activeTab === 'users' && <div className="text-center py-20 text-text-muted">Módulo de Usuários (Em breve)</div>}
        {activeTab === 'content' && <div className="text-center py-20 text-text-muted">Módulo de Conteúdo (Em breve)</div>}
        {activeTab === 'inbox' && <div className="text-center py-20 text-text-muted">Módulo de Mensagens (Em breve)</div>}
      </main>
    </div>
  );
};
import React, { useEffect, useState } from 'react';
import { supabase } from '../supabase';
import { User, UserRole } from '../types';
import { UserPlus, Search, ShieldAlert, Calendar, CheckCircle2, Ban } from 'lucide-react';
import { Button } from './Button';

export const UsersManager: React.FC = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  // Busca os usuários reais do Supabase (Módulo 3.2 do RPD)
  const fetchUsers = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .order('created_at', { ascending: false });

    if (!error && data) {
      const formattedUsers = data.map((p: any) => ({
        id: p.id,
        name: p.email.split('@')[0],
        email: p.email,
        subscriptionStatus: (p.is_active && (!p.expires_at || new Date(p.expires_at) > new Date())) ? 'active' : 'expired',
        role: p.role as UserRole,
        expiresAt: p.expires_at
      }));
      setUsers(formattedUsers);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const filteredUsers = users.filter(u => 
    u.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6 animate-fade-in-up">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <h2 className="text-2xl font-display font-bold">Gestão de Operadores</h2>
        <Button variant="primary" icon={<UserPlus size={18} />}>
          Novo Usuário
        </Button>
      </div>

      {/* Barra de Busca (Requisito 3.2) */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted w-5 h-5" />
        <input 
          type="text" 
          placeholder="Buscar por e-mail..." 
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full bg-graphite-800 border border-graphite-700 rounded-lg py-3 pl-10 pr-4 text-text-primary focus:border-amber-500 transition-colors"
        />
      </div>

      {/* Tabela de Usuários (Conforme Seção 3.2 do RPD) */}
      <div className="bg-graphite-800 border border-graphite-700 rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-black-900/50 text-text-muted text-xs uppercase tracking-widest">
                <th className="px-6 py-4 font-semibold">Operador</th>
                <th className="px-6 py-4 font-semibold">Nível / Role</th>
                <th className="px-6 py-4 font-semibold">Expiração</th>
                <th className="px-6 py-4 font-semibold">Status</th>
                <th className="px-6 py-4 font-semibold text-right">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-graphite-700">
              {loading ? (
                <tr><td colSpan={5} className="px-6 py-10 text-center text-text-muted">Sincronizando banco de dados...</td></tr>
              ) : filteredUsers.map((u) => (
                <tr key={u.id} className="hover:bg-graphite-700/30 transition-colors">
                  <td className="px-6 py-4">
                    <div className="font-medium text-text-primary">{u.name}</div>
                    <div className="text-xs text-text-muted">{u.email}</div>
                  </td>
                  <td className="px-6 py-4 text-sm font-mono text-amber-500/80">
                    {u.role.toUpperCase()}
                  </td>
                  <td className="px-6 py-4 text-sm text-text-secondary">
                    <div className="flex items-center gap-2">
                      <Calendar size={14} />
                      {u.expiresAt ? new Date(u.expiresAt).toLocaleDateString() : 'Vitalício'}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    {u.subscriptionStatus === 'active' ? (
                      <span className="flex items-center gap-1 text-green-500 text-xs font-bold uppercase">
                        <CheckCircle2 size={14} /> Ativo
                      </span>
                    ) : (
                      <span className="flex items-center gap-1 text-red-500 text-xs font-bold uppercase">
                        <Ban size={14} /> Inativo
                      </span>
                    )}
                  </td>
                  <td className="px-6 py-4 text-right">
                    <button className="text-text-muted hover:text-amber-500 transition-colors text-xs font-bold uppercase">
                      Gerenciar
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
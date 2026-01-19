import React, { useEffect, useState } from 'react';
import { supabase } from '../src/lib/supabase';
import { User, UserRole } from '../types';
import { Search, Calendar, CheckCircle2, Ban, Shield, Trash2, Save, X } from 'lucide-react';
import { Button } from './Button';

export const UsersManager: React.FC = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  
  // Estados para edição temporária
  const [editRole, setEditRole] = useState<UserRole>('user');
  const [editExpiry, setEditExpiry] = useState('');

  const fetchUsers = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .order('created_at', { ascending: false });

    if (!error && data) {
      setUsers(data.map((p: any) => ({
        id: p.id,
        name: p.email.split('@')[0],
        email: p.email,
        subscriptionStatus: (p.is_active && (!p.expires_at || new Date(p.expires_at) > new Date())) ? 'active' : 'expired',
        role: p.role as UserRole,
        expiresAt: p.expires_at,
        isActive: p.is_active
      })));
    }
    setLoading(false);
  };

  useEffect(() => { fetchUsers(); }, []);

  // Ação de Bloqueio/Ativação (Requisito 3.2) [cite: 71]
  const toggleUserStatus = async (id: string, currentStatus: boolean) => {
    const { error } = await supabase
      .from('profiles')
      .update({ is_active: !currentStatus })
      .eq('id', id);
    
    if (!error) fetchUsers();
  };

  // Ação de Salvar Edição (Expiração e Role) [cite: 72]
  const saveUserChanges = async (id: string) => {
    const { error } = await supabase
      .from('profiles')
      .update({ 
        role: editRole,
        expires_at: editExpiry || null
      })
      .eq('id', id);

    if (!error) {
      setEditingId(null);
      fetchUsers();
    }
  };

  const filteredUsers = users.filter(u => u.email.toLowerCase().includes(searchTerm.toLowerCase()));

  return (
    <div className="space-y-6 animate-fade-in-up">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-display font-bold">Gestão de Operadores</h2>
        <div className="relative w-64">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted w-4 h-4" />
          <input 
            type="text" 
            placeholder="Buscar operador..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-graphite-800 border border-graphite-700 rounded-lg py-2 pl-10 pr-4 text-sm focus:border-amber-500 outline-none"
          />
        </div>
      </div>

      <div className="bg-graphite-800 border border-graphite-700 rounded-xl overflow-hidden shadow-2xl">
        <table className="w-full text-left">
          <thead className="bg-black-900/50 text-text-muted text-[10px] uppercase tracking-widest">
            <tr>
              <th className="px-6 py-4">Operador</th>
              <th className="px-6 py-4">Nível / Role</th>
              <th className="px-6 py-4">Expiração</th>
              <th className="px-6 py-4 text-right">Ações</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-graphite-700">
            {loading ? (
              <tr><td colSpan={4} className="px-6 py-10 text-center text-text-muted italic">Sincronizando...</td></tr>
            ) : filteredUsers.map((u: any) => (
              <tr key={u.id} className="hover:bg-graphite-700/30 transition-colors">
                <td className="px-6 py-4">
                  <div className="flex items-center gap-3">
                    <div className={`w-2 h-2 rounded-full ${u.isActive ? 'bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.5)]' : 'bg-red-500'}`} />
                    <div>
                      <div className="font-medium text-text-primary text-sm">{u.email}</div>
                      <div className="text-[10px] text-text-muted uppercase">{u.id.substring(0,8)}</div>
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4">
                  {editingId === u.id ? (
                    <select 
                      value={editRole} 
                      onChange={(e) => setEditRole(e.target.value as UserRole)}
                      className="bg-black-900 border border-graphite-600 rounded text-xs p-1 text-amber-500"
                    >
                      <option value="user">USER</option>
                      <option value="admin_content">CONTENT</option>
                      <option value="admin_op">OPERATIONAL</option>
                      <option value="admin_master">MASTER</option>
                    </select>
                  ) : (
                    <span className="text-xs font-mono text-amber-500/80 bg-amber-500/5 px-2 py-1 rounded border border-amber-500/10">
                      {u.role.toUpperCase()}
                    </span>
                  )}
                </td>
                <td className="px-6 py-4">
                  {editingId === u.id ? (
                    <input 
                      type="date" 
                      value={editExpiry} 
                      onChange={(e) => setEditExpiry(e.target.value)}
                      className="bg-black-900 border border-graphite-600 rounded text-xs p-1 text-text-primary"
                    />
                  ) : (
                    <div className="text-xs text-text-secondary flex items-center gap-2">
                      <Calendar size={12} />
                      {u.expiresAt ? new Date(u.expiresAt).toLocaleDateString('pt-BR') : 'VITALÍCIO'}
                    </div>
                  )}
                </td>
                <td className="px-6 py-4 text-right space-x-2">
                  {editingId === u.id ? (
                    <>
                      <button onClick={() => saveUserChanges(u.id)} className="text-green-500 hover:text-green-400 p-1"><Save size={18} /></button>
                      <button onClick={() => setEditingId(null)} className="text-text-muted hover:text-text-primary p-1"><X size={18} /></button>
                    </>
                  ) : (
                    <>
                      <button 
                        onClick={() => {
                          setEditingId(u.id);
                          setEditRole(u.role);
                          setEditExpiry(u.expiresAt ? u.expiresAt.split('T')[0] : '');
                        }}
                        className="text-text-muted hover:text-amber-500 text-[10px] font-bold uppercase tracking-tighter transition-colors"
                      >
                        Editar
                      </button>
                      <button 
                        onClick={() => toggleUserStatus(u.id, u.isActive)}
                        className={`${u.isActive ? 'text-red-500/70 hover:text-red-500' : 'text-green-500/70 hover:text-green-500'} text-[10px] font-bold uppercase tracking-tighter transition-colors ml-4`}
                      >
                        {u.isActive ? 'Bloquear' : 'Ativar'}
                      </button>
                    </>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};
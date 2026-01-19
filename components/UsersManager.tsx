import React, { useEffect, useState } from 'react';
import { supabase } from '../src/lib/supabase';
import { Users, Shield, ShieldAlert, UserCheck, UserMinus, Search } from 'lucide-react';

interface Profile {
  id: string;
  full_name: string;
  role: string;
  status: 'active' | 'blocked';
  created_at: string;
}

export const UsersManager: React.FC = () => {
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  const fetchProfiles = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .order('created_at', { ascending: false });

    if (!error && data) {
      setProfiles(data);
    }
    setLoading(false);
  };

  useEffect(() => { fetchProfiles(); }, []);

  const toggleUserStatus = async (id: string, currentStatus: string) => {
    const newStatus = currentStatus === 'active' ? 'blocked' : 'active';
    const { error } = await supabase
      .from('profiles')
      .update({ status: newStatus })
      .eq('id', id);

    if (!error) fetchProfiles();
  };

  const filteredProfiles = profiles.filter(p => 
    p.full_name?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6 animate-fade-in-up">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-display font-bold text-text-primary uppercase tracking-tight">Controle de Operadores</h2>
          <p className="text-[10px] text-text-muted uppercase tracking-[0.2em] font-bold">Gestão de acessos e hierarquia do sistema</p>
        </div>
      </div>

      <div className="relative w-full">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted w-4 h-4" />
        <input 
          type="text" 
          placeholder="Buscar operador por nome..." 
          value={searchTerm} 
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full bg-graphite-800 border border-graphite-700 rounded-lg py-3 pl-10 pr-4 text-sm text-text-primary focus:border-amber-500 outline-none" 
        />
      </div>

      <div className="bg-graphite-800 border border-graphite-700 rounded-2xl overflow-hidden">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-black/40 border-b border-graphite-700">
              <th className="p-4 text-[10px] font-black text-amber-500 uppercase tracking-widest">Operador</th>
              <th className="p-4 text-[10px] font-black text-amber-500 uppercase tracking-widest">Nível de Acesso</th>
              <th className="p-4 text-[10px] font-black text-amber-500 uppercase tracking-widest">Status</th>
              <th className="p-4 text-[10px] font-black text-amber-500 uppercase tracking-widest text-right">Ações</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={4} className="p-10 text-center text-text-muted italic">Sincronizando base de dados...</td></tr>
            ) : filteredProfiles.length === 0 ? (
              <tr><td colSpan={4} className="p-10 text-center text-text-muted">Nenhum operador encontrado.</td></tr>
            ) : filteredProfiles.map((profile) => (
              <tr key={profile.id} className="border-b border-graphite-700/50 hover:bg-black/20 transition-colors">
                <td className="p-4">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-amber-500/10 flex items-center justify-center text-amber-500 font-bold text-xs">
                      {profile.full_name?.charAt(0) || 'U'}
                    </div>
                    <div>
                      <p className="text-sm font-bold text-text-primary">{profile.full_name || 'Usuário Sem Nome'}</p>
                      <p className="text-[9px] text-text-muted uppercase">ID: {profile.id.substring(0, 8)}</p>
                    </div>
                  </div>
                </td>
                <td className="p-4">
                  <div className="flex items-center gap-2">
                    {profile.role === 'admin_master' ? (
                      <span className="flex items-center gap-1 text-[10px] font-bold text-red-500 bg-red-500/10 px-2 py-1 rounded">
                        <ShieldAlert size={12} /> COMANDO MASTER
                      </span>
                    ) : (
                      <span className="flex items-center gap-1 text-[10px] font-bold text-amber-500 bg-amber-500/10 px-2 py-1 rounded">
                        <Shield size={12} /> OPERADOR
                      </span>
                    )}
                  </div>
                </td>
                <td className="p-4">
                  <span className={`text-[9px] font-black uppercase px-2 py-1 rounded ${
                    profile.status === 'active' ? 'text-green-500 bg-green-500/10' : 'text-graphite-400 bg-graphite-700'
                  }`}>
                    {profile.status === 'active' ? 'Autorizado' : 'Bloqueado'}
                  </span>
                </td>
                <td className="p-4 text-right">
                  <button 
                    onClick={() => toggleUserStatus(profile.id, profile.status)}
                    className={`p-2 rounded-lg transition-all ${
                      profile.status === 'active' ? 'text-text-muted hover:text-red-500 hover:bg-red-500/10' : 'text-text-muted hover:text-green-500 hover:bg-green-500/10'
                    }`}
                    title={profile.status === 'active' ? 'Bloquear Acesso' : 'Autorizar Acesso'}
                  >
                    {profile.status === 'active' ? <UserMinus size={18} /> : <UserCheck size={18} />}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};
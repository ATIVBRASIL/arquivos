import React, { useRef, useState } from 'react';
import { supabase } from '../../../src/lib/supabase';
import { Cohort } from '../../../types';
import {
  Layers,
  Plus,
  Trash2,
  ArrowLeft,
  Download,
  UserPlus,
  CheckCircle,
  AlertCircle,
  X,
  Upload,
} from 'lucide-react';

// Interfaces locais para isolar este componente
interface ProfileData {
  id: string;
  email: string;
  full_name: string;
  role: string;
  ticket_code?: string;
  created_at: string;
  cohort_id?: string;
  is_lifetime?: boolean;
  expires_at?: string;
}

interface UserExam {
  user_id: string;
  score: number;
  status: string;
}

interface WhitelistItem {
  id: string;
  cohort_id: string;
  allowed_code: string;
  used_at: string | null;
}

interface CohortsTabProps {
  cohorts: Cohort[];
  profiles: ProfileData[];
  whitelist: WhitelistItem[];
  attempts: UserExam[];
  onRefresh: () => void;
  setLoading: (loading: boolean) => void;
}

export const CohortsTab: React.FC<CohortsTabProps> = ({
  cohorts,
  profiles,
  whitelist,
  attempts,
  onRefresh,
  setLoading,
}) => {
  // --- ESTADOS LOCAIS ---
  const [newCohortName, setNewCohortName] = useState('');
  const [newCohortValidity, setNewCohortValidity] = useState('365');
  const [selectedCohort, setSelectedCohort] = useState<Cohort | null>(null);

  // --- ESTADOS: IMPORTAÇÃO ---
  const [isImporting, setIsImporting] = useState(false);
  const [importText, setImportText] = useState('');
  const [singleCode, setSingleCode] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  // === AÇÕES: TURMAS ===
  const handleCreateCohort = async () => {
    if (!newCohortName.trim()) return;

    const { error } = await supabase
      .from('cohorts')
      .insert([{ name: newCohortName.trim().toUpperCase(), validity_days: parseInt(newCohortValidity, 10) }]);

    if (error) {
      alert('Erro ao criar turma: ' + error.message);
      return;
    }

    setNewCohortName('');
    onRefresh();
  };

  const handleDeleteCohort = async (id: string) => {
    if (!confirm('ATENÇÃO: Excluir turma removerá o histórico associado. Continuar?')) return;

    const { error } = await supabase.from('cohorts').delete().eq('id', id);
    if (error) {
      alert('Erro ao excluir turma: ' + error.message);
      return;
    }

    if (selectedCohort?.id === id) setSelectedCohort(null);
    onRefresh();
  };

  // === IMPORTAÇÃO & WHITELIST ===
  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => setImportText((e.target?.result as string) || '');
    reader.readAsText(file);
  };

  const addCodesToWhitelist = async (codes: string[]) => {
    if (!selectedCohort) return;

    const sanitized = codes
      .map((c) => c.trim().toUpperCase())
      .filter((c) => c.length > 0);

    if (sanitized.length === 0) return;

    const whitelistItems = sanitized.map((code) => ({
      cohort_id: selectedCohort.id,
      allowed_code: code,
    }));

    setLoading(true);
    const { error } = await supabase.from('whitelist').insert(whitelistItems);
    setLoading(false);

    if (error) {
      if ((error as any).code === '23505') alert('Atenção: Algumas matrículas já existiam e foram ignoradas.');
      else alert('Erro: ' + error.message);
      return;
    }

    alert(`${whitelistItems.length} Matrícula(s) autorizada(s)!`);
    setIsImporting(false);
    setImportText('');
    setSingleCode('');
    onRefresh();
  };

  // === RELATÓRIOS E EXPORTAÇÃO ===
  const getCohortReportData = (cohortId: string) => {
    const cohortWhitelist = whitelist.filter((w) => w.cohort_id === cohortId);
    const cohortUsers = profiles.filter((p) => p.cohort_id === cohortId);

    const activeRows = cohortUsers.map((u) => {
      const userAttempts = attempts.filter((a) => a.user_id === u.id);
      const approvedCount = userAttempts.filter((a) => a.status === 'approved').length;

      return {
        matricula: u.ticket_code || 'LINK',
        nome: u.full_name,
        status: 'ATIVO' as const,
        data_cadastro: new Date(u.created_at).toLocaleDateString('pt-BR'),
        aprovados: approvedCount,
        expires: u.is_lifetime
          ? 'Vitalício'
          : u.expires_at
            ? new Date(u.expires_at).toLocaleDateString('pt-BR')
            : '-',
      };
    });

    const pendingRows = cohortWhitelist
      .filter((w) => w.used_at === null)
      .map((w) => ({
        matricula: w.allowed_code,
        nome: '-',
        status: 'PENDENTE' as const,
        data_cadastro: '-',
        aprovados: 0,
        expires: '-',
      }));

    return [...activeRows, ...pendingRows];
  };

  const exportToCSV = () => {
    if (!selectedCohort) return;

    const data = getCohortReportData(selectedCohort.id);
    const headers = ['Matricula', 'Nome', 'Status', 'Data Ativacao', 'Validade', 'Aprovados'];

    const csvRows = [headers.join(';')];
    data.forEach((row) =>
      csvRows.push([row.matricula, `"${row.nome}"`, row.status, row.data_cadastro, row.expires, String(row.aprovados)].join(';'))
    );

    const blob = new Blob([csvRows.join('\n')], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);

    const a = document.createElement('a');
    a.href = url;
    a.download = `Relatorio_${selectedCohort.name}.csv`;
    a.click();

    window.URL.revokeObjectURL(url);
  };

  // === RENDER: MODAL DE ADIÇÃO (dentro da Tab para simplificar) ===
  const renderImportModal = () => {
    if (!isImporting || !selectedCohort) return null;

    return (
      <div className="fixed inset-0 z-[60] bg-black/90 backdrop-blur-sm flex items-center justify-center p-4 animate-fade-in">
        <div className="bg-graphite-800 border border-graphite-700 w-full max-w-2xl rounded-2xl p-6 shadow-2xl">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-xl font-display font-bold text-white uppercase flex items-center gap-2">
              <UserPlus className="text-amber-500" /> Adicionar Agentes - {selectedCohort.name}
            </h3>
            <button onClick={() => setIsImporting(false)}>
              <X className="text-text-muted hover:text-white" />
            </button>
          </div>

          <div className="space-y-8">
            {/* OPÇÃO 1: ÚNICO */}
            <div className="bg-black/40 p-4 rounded-xl border border-graphite-700">
              <label className="text-xs font-bold text-amber-500 uppercase mb-2 block">Adicionar Único Agente</label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={singleCode}
                  onChange={(e) => setSingleCode(e.target.value)}
                  placeholder="DIGITE A MATRÍCULA / CÓDIGO"
                  className="flex-1 bg-graphite-800 border border-graphite-600 rounded-lg p-3 text-white font-bold uppercase outline-none focus:border-amber-500"
                />
                <button
                  onClick={() => addCodesToWhitelist([singleCode])}
                  disabled={!singleCode.trim()}
                  className="bg-amber-500 hover:bg-amber-600 disabled:opacity-50 text-black px-4 rounded-lg font-black uppercase"
                >
                  <Plus size={20} />
                </button>
              </div>
            </div>

            <div className="relative flex items-center justify-center">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-graphite-600" />
              </div>
              <span className="relative bg-graphite-800 px-2 text-[10px] text-text-muted uppercase font-bold">OU (EM MASSA)</span>
            </div>

            {/* OPÇÃO 2: CSV */}
            <div>
              <div className="flex justify-between items-end mb-1">
                <label className="text-xs font-bold text-text-muted uppercase block">Lista de Matrículas (CSV/TXT)</label>
                <div className="flex items-center gap-2">
                  <input type="file" ref={fileInputRef} onChange={handleFileUpload} className="hidden" accept=".csv,.txt" />
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    className="text-[10px] bg-graphite-700 hover:bg-white hover:text-black text-white px-2 py-1 rounded font-bold uppercase transition-colors flex items-center gap-1"
                  >
                    <Upload size={10} /> Carregar Arquivo
                  </button>
                </div>
              </div>

              <textarea
                value={importText}
                onChange={(e) => setImportText(e.target.value)}
                placeholder={'Ex:\n992102\n884102\nCNV-1029'}
                className="w-full h-32 bg-black border border-graphite-600 rounded-lg p-4 text-white font-mono text-sm focus:border-amber-500 outline-none resize-none"
              />

              <button
                onClick={() => addCodesToWhitelist(importText.split(/\r?\n/).filter((l) => l.trim()))}
                disabled={!importText.trim()}
                className="w-full mt-4 bg-graphite-700 hover:bg-white hover:text-black text-white p-3 rounded-lg font-bold uppercase transition-all disabled:opacity-50"
              >
                Processar Lista
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  };

  // === RENDER DA ABA ===
  return (
    <div className="animate-fade-in space-y-6">
      {renderImportModal()}

      {!selectedCohort ? (
        <>
          <h3 className="text-xl font-display font-bold text-white uppercase flex items-center gap-2">
            <Layers size={24} className="text-amber-500" /> Gestão de Turmas (B2B & Lançamentos)
          </h3>

          <div className="bg-graphite-800 border border-graphite-700 p-6 rounded-xl flex flex-col md:flex-row gap-4 items-end">
            <div className="flex-1 w-full space-y-2">
              <label className="text-xs text-text-muted uppercase font-bold block">Nome da Nova Turma / Empresa</label>
              <input
                type="text"
                value={newCohortName}
                onChange={(e) => setNewCohortName(e.target.value)}
                placeholder="Ex: GRUPO ALPHA"
                className="w-full bg-black border border-graphite-600 rounded-lg p-3 text-white focus:border-amber-500 outline-none uppercase font-bold"
              />
            </div>

            <div className="w-full md:w-48 space-y-2">
              <label className="text-xs text-text-muted uppercase font-bold block">Validade (Dias)</label>
              <select
                value={newCohortValidity}
                onChange={(e) => setNewCohortValidity(e.target.value)}
                className="w-full bg-black border border-graphite-600 rounded-lg p-3 text-white focus:border-amber-500 outline-none font-bold"
              >
                <option value="180">6 Meses (180)</option>
                <option value="365">1 Ano (365)</option>
                <option value="730">2 Anos (730)</option>
                <option value="36500">Vitalício</option>
              </select>
            </div>

            <button
              onClick={handleCreateCohort}
              disabled={!newCohortName.trim()}
              className="bg-amber-500 hover:bg-amber-600 disabled:opacity-50 text-black px-6 py-3 rounded-lg font-black uppercase tracking-wider flex items-center gap-2 transition-all w-full md:w-auto justify-center h-[50px]"
            >
              <Plus size={20} /> Criar Turma
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {cohorts.length === 0 ? (
              <p className="text-text-muted italic col-span-full text-center py-8">Nenhuma turma criada.</p>
            ) : (
              cohorts.map((cohort) => {
                const studentCount = profiles.filter((p) => p.cohort_id === cohort.id).length;
                const allowedCount = whitelist.filter((w) => w.cohort_id === cohort.id).length;

                return (
                  <div
                    key={cohort.id}
                    className="bg-graphite-800 border border-graphite-700 rounded-xl p-5 hover:border-amber-500 transition-colors group relative cursor-pointer"
                    onClick={() => setSelectedCohort(cohort)}
                  >
                    <div className="flex justify-between items-start mb-4">
                      <div>
                        <h4 className="font-bold text-white text-lg uppercase">{cohort.name}</h4>
                        <div className="flex items-center gap-2 mt-1">
                          <span className="text-[10px] text-text-muted font-mono">
                            {new Date(cohort.created_at).toLocaleDateString('pt-BR')}
                          </span>
                          <span className="text-[10px] bg-amber-500/10 text-amber-500 px-1 rounded border border-amber-500/20 font-bold uppercase">
                            {cohort.validity_days > 10000 ? 'VITALÍCIO' : `${cohort.validity_days} DIAS`}
                          </span>
                        </div>
                      </div>

                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          void handleDeleteCohort(cohort.id);
                        }}
                        className="text-graphite-600 hover:text-red-500 transition-colors"
                      >
                        <Trash2 size={18} />
                      </button>
                    </div>

                    <div className="grid grid-cols-2 gap-2 mb-4">
                      <div className="bg-black/30 p-2 rounded text-center">
                        <div className="text-xs text-text-muted uppercase font-bold">Liberados</div>
                        <div className="text-xl font-bold text-white">{allowedCount}</div>
                      </div>
                      <div className="bg-black/30 p-2 rounded text-center border border-amber-500/20">
                        <div className="text-xs text-text-muted uppercase font-bold">Ativados</div>
                        <div className="text-xl font-bold text-amber-500">{studentCount}</div>
                      </div>
                    </div>

                    <button className="w-full bg-graphite-700 group-hover:bg-white group-hover:text-black text-white text-xs font-bold uppercase py-3 rounded transition-all flex items-center justify-center gap-2">
                      Painel & Whitelist
                    </button>
                  </div>
                );
              })
            )}
          </div>
        </>
      ) : (
        <div className="animate-fade-in">
          <div className="flex items-center gap-4 mb-6">
            <button
              onClick={() => setSelectedCohort(null)}
              className="p-2 bg-graphite-800 hover:bg-white hover:text-black rounded-lg transition-colors"
            >
              <ArrowLeft size={20} />
            </button>
            <div>
              <h3 className="text-2xl font-display font-bold text-white uppercase">{selectedCohort.name}</h3>
              <p className="text-xs text-text-muted">
                Validade Padrão: {selectedCohort.validity_days > 10000 ? 'VITALÍCIA' : `${selectedCohort.validity_days} DIAS`}
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
            <div className="bg-graphite-800 border border-graphite-700 p-6 rounded-xl flex flex-col justify-between">
              <div>
                <h4 className="text-sm font-bold text-text-muted uppercase mb-2">Relatório Operacional</h4>
                <p className="text-xs text-text-secondary mb-4">Lista completa para o RH.</p>
              </div>
              <button
                onClick={exportToCSV}
                className="w-full bg-green-600 hover:bg-green-500 text-white font-bold uppercase py-3 rounded flex items-center justify-center gap-2"
              >
                <Download size={18} /> Baixar CSV
              </button>
            </div>

            <div className="bg-graphite-800 border border-graphite-700 p-6 rounded-xl flex flex-col justify-between">
              <div>
                <h4 className="text-sm font-bold text-text-muted uppercase mb-2">Expansão de Efetivo</h4>
                <p className="text-xs text-text-secondary mb-4">Adicionar matrículas (Unitário ou Lote).</p>
              </div>
              <button
                onClick={() => setIsImporting(true)}
                className="w-full bg-amber-500 hover:bg-amber-600 text-black font-bold uppercase py-3 rounded flex items-center justify-center gap-2"
              >
                <UserPlus size={18} /> Adicionar Agentes
              </button>
            </div>
          </div>

          <div className="bg-graphite-800 border border-graphite-700 rounded-xl overflow-hidden">
            <div className="p-4 border-b border-graphite-700 bg-black/20 flex justify-between items-center">
              <h4 className="font-bold text-white uppercase text-sm">Efetivo Completo</h4>
              <span className="text-[10px] text-text-muted uppercase">Ordenado por Status</span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="text-[10px] uppercase font-black text-text-muted tracking-widest bg-black/40">
                    <th className="p-4">Matrícula</th>
                    <th className="p-4">Agente</th>
                    <th className="p-4">Status</th>
                    <th className="p-4">Validade</th>
                    <th className="p-4">Desempenho</th>
                  </tr>
                </thead>

                <tbody className="divide-y divide-graphite-700">
                  {getCohortReportData(selectedCohort.id).map((row, idx) => (
                    <tr key={idx} className="hover:bg-graphite-700/50">
                      <td className="p-4 font-mono text-xs text-white font-bold">{row.matricula}</td>
                      <td className="p-4 text-sm text-text-secondary">{row.nome}</td>
                      <td className="p-4">
                        {row.status === 'ATIVO' ? (
                          <span className="bg-green-500/20 text-green-500 px-2 py-1 rounded text-[10px] font-black uppercase flex items-center gap-1 w-fit">
                            <CheckCircle size={10} /> Ativo
                          </span>
                        ) : (
                          <span className="bg-red-500/10 text-red-500 px-2 py-1 rounded text-[10px] font-black uppercase flex items-center gap-1 w-fit">
                            <AlertCircle size={10} /> Pendente
                          </span>
                        )}
                      </td>
                      <td className="p-4 text-xs font-mono">{row.expires}</td>
                      <td className="p-4">
                        {row.status === 'ATIVO' ? (
                          <div className="flex gap-3 text-xs">
                            <span className="text-purple-400 font-bold">{row.aprovados} Aprovados</span>
                          </div>
                        ) : (
                          <span className="text-text-muted text-xs">-</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
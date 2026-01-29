import React, { useState } from 'react';
// Estamos subindo 3 níveis (tabs -> admin -> components) para chegar na raiz e entrar em src
import { supabase } from '../../../src/lib/supabase';
import { Link as LinkIcon, CheckCircle, Copy } from 'lucide-react';

interface QuickAccessTabProps {
  onRefresh: () => void;
}

export const QuickAccessTab: React.FC<QuickAccessTabProps> = ({ onRefresh }) => {
  const [quickValidity, setQuickValidity] = useState('365');
  const [generatedLink, setGeneratedLink] = useState('');
  const [isGeneratingLink, setIsGeneratingLink] = useState(false);

  // === GERADOR DE LINK INDIVIDUAL (MÁGICO) ===
  const generateMagicLink = async () => {
    setIsGeneratingLink(true);
    setGeneratedLink('');

    try {
      const days = parseInt(quickValidity, 10);
      let targetCohortId = '';

      const cohortName = `INDIVIDUAL - ${days} DIAS`;

      // Busca no banco se já existe a turma "INDIVIDUAL - X DIAS"
      const { data: existingCohort, error: searchError } = await supabase
        .from('cohorts')
        .select('id')
        .eq('name', cohortName)
        .eq('validity_days', days)
        .maybeSingle();

      if (searchError) throw searchError;

      if (existingCohort?.id) {
        targetCohortId = existingCohort.id;
      } else {
        // Cria turma no banco se não existir
        const { data: newCohort, error: createError } = await supabase
          .from('cohorts')
          .insert([{ name: cohortName, validity_days: days }])
          .select()
          .single();

        if (createError || !newCohort?.id) throw new Error('Erro crítico ao criar grupo de validade.');
        targetCohortId = newCohort.id;

        // Atualiza lista global no pai, pois uma nova turma foi criada
        onRefresh();
      }

      // Código único
      const uniqueCode = `ATIV-${Math.random().toString(36).substring(2, 8).toUpperCase()}`;

      const { error: wlError } = await supabase.from('whitelist').insert([
        {
          cohort_id: targetCohortId,
          allowed_code: uniqueCode,
        },
      ]);

      if (wlError) throw wlError;

      const link = `${window.location.origin}/?invite=${uniqueCode}`;
      setGeneratedLink(link);
    } catch (err: any) {
      alert('Erro ao gerar link: ' + (err?.message || String(err)));
    } finally {
      setIsGeneratingLink(false);
    }
  };

  const copyLink = async () => {
    try {
      await navigator.clipboard.writeText(generatedLink);
      alert('Link copiado!');
    } catch {
      alert('Falha ao copiar. Copie manualmente.');
    }
  };

  return (
    <div className="animate-fade-in space-y-6">
      <div className="bg-graphite-800 border border-graphite-700 p-8 rounded-2xl max-w-2xl mx-auto shadow-2xl">
        <h3 className="text-2xl font-display font-bold text-white uppercase flex items-center gap-3 mb-6">
          <LinkIcon className="text-green-500" size={32} /> Gerador de Link Individual
        </h3>

        <p className="text-text-secondary text-sm mb-8">
          Use esta ferramenta para criar acesso imediato para um único agente (ex: venda avulsa ou cortesia). O sistema criará um
          link de ativação exclusivo.
        </p>

        <div className="space-y-6">
          <div>
            <label className="text-xs font-bold text-text-muted uppercase mb-2 block">Duração do Acesso</label>
            <select
              value={quickValidity}
              onChange={(e) => setQuickValidity(e.target.value)}
              className="w-full bg-black border border-graphite-600 rounded-lg p-4 text-white font-bold outline-none focus:border-green-500 transition-colors uppercase"
            >
              <option value="30">1 Mês (Degustação)</option>
              <option value="180">6 Meses (Semestral)</option>
              <option value="365">1 Ano (Anual)</option>
              <option value="730">2 Anos (Bi-anual)</option>
              <option value="36500">Vitalício</option>
            </select>
          </div>

          {!generatedLink ? (
            <button
              onClick={generateMagicLink}
              disabled={isGeneratingLink}
              className="w-full bg-green-500 hover:bg-green-600 text-black font-black uppercase py-4 rounded-xl flex items-center justify-center gap-2 transition-all shadow-lg hover:shadow-green-500/20 disabled:opacity-60"
            >
              {isGeneratingLink ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-black" /> Gerando...
                </>
              ) : (
                'GERAR LINK DE ACESSO'
              )}
            </button>
          ) : (
            <div className="animate-fade-in bg-black/60 border border-green-500/30 p-6 rounded-xl text-center">
              <div className="text-green-500 font-bold uppercase text-xs mb-2 flex items-center justify-center gap-2">
                <CheckCircle size={14} /> Link Gerado com Sucesso
              </div>
              <div className="bg-black p-3 rounded border border-graphite-700 text-text-primary font-mono text-sm break-all mb-4 select-all">
                {generatedLink}
              </div>
              <div className="flex gap-2">
                <button
                  onClick={copyLink}
                  className="flex-1 bg-white hover:bg-gray-200 text-black font-bold uppercase py-3 rounded-lg flex items-center justify-center gap-2 transition-colors"
                >
                  <Copy size={18} /> Copiar Link
                </button>
                <button
                  onClick={() => setGeneratedLink('')}
                  className="bg-graphite-700 hover:bg-graphite-600 text-white px-4 rounded-lg font-bold uppercase"
                >
                  Novo
                </button>
              </div>
              <p className="text-[10px] text-text-muted mt-4">* Envie este link diretamente para o agente. Ele poderá criar a senha imediatamente.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
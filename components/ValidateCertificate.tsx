import React, { useEffect, useMemo, useState } from 'react';
import { ShieldCheck, XCircle, Loader2, Shield, ArrowLeft, AlertTriangle } from 'lucide-react';
import { supabase } from '../src/lib/supabase';
import { Button } from './Button';

type ValidationResult = {
  cert_code: string;
  score: number | null;
  status: string | null;
  created_at: string | null;

  // derivados
  full_name: string | null;
  email: string | null;
  ebook_title: string | null;
  technical_skills: string | null;
};

function getCodeFromUrl(): string | null {
  try {
    const url = new URL(window.location.href);
    return url.searchParams.get('code');
  } catch {
    return null;
  }
}

function formatDate(iso: string | null): string {
  if (!iso) return '-';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleString('pt-BR', { timeZone: 'America/Sao_Paulo' });
}

function normalizeSkills(skills: string | null): string[] {
  if (!skills) return [];
  // separa por ponto final, limpa vazios e limita um pouco para não explodir layout
  return skills
    .split('.')
    .map(s => s.trim())
    .filter(Boolean)
    .slice(0, 10);
}

export const ValidateCertificate: React.FC = () => {
  const code = useMemo(() => getCodeFromUrl(), []);
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<ValidationResult | null>(null);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    const run = async () => {
      setLoading(true);
      setErr(null);

      if (!code) {
        setLoading(false);
        setErr('Código ausente. Verifique se a URL contém ?code=...');
        return;
      }

      try {
        /**
         * Estratégia robusta e compatível com RLS:
         * 1) Busca o exame por cert_code
         * 2) Se existir, busca ebook e perfil separadamente
         *
         * Isso evita depender de joins/foreign keys no SELECT público.
         */
        const { data: exam, error: examErr } = await supabase
          .from('user_exams')
          .select('cert_code, score, status, created_at, user_id, ebook_id')
          .eq('cert_code', code)
          .maybeSingle();

        if (examErr) throw examErr;
        if (!exam) {
          setData(null);
          setLoading(false);
          return;
        }

        let full_name: string | null = null;
        let email: string | null = null;
        let ebook_title: string | null = null;
        let technical_skills: string | null = null;

        // ALTERAÇÃO 1: Adicionado 'full_name' no select
        const [{ data: profile }, { data: ebook }] = await Promise.all([
          supabase.from('profiles').select('email, full_name').eq('id', exam.user_id).maybeSingle(),
          supabase.from('ebooks').select('title, technical_skills').eq('id', exam.ebook_id).maybeSingle(),
        ]);

        email = profile?.email ?? null;
        
        // ALTERAÇÃO 2: Lógica para usar o Nome Completo do banco, ou fallback para o email
        full_name = profile?.full_name || (email ? email.split('@')[0] : 'DESCONHECIDO');

        ebook_title = ebook?.title ?? null;
        technical_skills = (ebook as any)?.technical_skills ?? null;

        setData({
          cert_code: exam.cert_code,
          score: exam.score ?? null,
          status: exam.status ?? null,
          created_at: exam.created_at ?? null,
          full_name,
          email,
          ebook_title,
          technical_skills,
        });
      } catch (e: any) {
        console.error('[VALIDATE_CERT_ERROR]', e);
        setErr(e?.message || 'Falha ao validar.');
      } finally {
        setLoading(false);
      }
    };

    run();
  }, [code]);

  const skillsList = normalizeSkills(data?.technical_skills ?? null);
  const isValid = data && (data.status === 'approved' || data.status === 'valid');

  return (
    <div className="min-h-screen bg-black text-text-primary flex items-center justify-center p-4">
      <div className="w-full max-w-2xl bg-graphite-800/60 backdrop-blur-md border border-graphite-700 rounded-2xl shadow-2xl overflow-hidden">
        <div className="p-6 border-b border-graphite-700 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-black/40 border border-graphite-700 flex items-center justify-center">
              <Shield className="text-amber-500" size={18} />
            </div>
            <div>
              <div className="text-[10px] text-text-muted uppercase font-black tracking-widest">ATIV BRASIL</div>
              <div className="text-sm font-display font-bold uppercase tracking-tight">Validação Pública de Certificado</div>
            </div>
          </div>

          <Button
            variant="secondary"
            onClick={() => (window.location.href = 'https://arquivos.ativbrasil.com.br/')}
          >
            <ArrowLeft size={16} /> Voltar
          </Button>
        </div>

        <div className="p-6 space-y-5">
          {loading && (
            <div className="flex items-center justify-center gap-2 text-amber-500 text-[10px] font-bold uppercase italic animate-pulse">
              <Loader2 size={14} className="animate-spin" /> Consultando base de validação...
            </div>
          )}

          {!loading && err && (
            <div className="p-4 rounded-xl border border-red-500/30 bg-red-500/10">
              <div className="flex items-center gap-2 text-red-400 font-bold uppercase text-[10px]">
                <AlertTriangle size={14} /> Falha técnica
              </div>
              <div className="text-text-secondary text-xs mt-2">{err}</div>
            </div>
          )}

          {!loading && !err && !data && (
            <div className="p-6 rounded-xl border border-graphite-700 bg-black/30 text-center space-y-3">
              <XCircle className="text-red-500 mx-auto" size={40} />
              <div className="text-sm font-display font-bold uppercase">Certificado inválido</div>
              <div className="text-text-muted text-xs">
                Não existe registro para este código. Verifique se o QR corresponde a um certificado emitido.
              </div>
            </div>
          )}

          {!loading && !err && data && (
            <div className="space-y-4">
              <div className={`p-5 rounded-xl border ${isValid ? 'border-green-500/30 bg-green-500/10' : 'border-red-500/30 bg-red-500/10'}`}>
                <div className="flex items-center gap-3">
                  {isValid ? (
                    <ShieldCheck className="text-green-500" size={28} />
                  ) : (
                    <XCircle className="text-red-500" size={28} />
                  )}
                  <div>
                    <div className="text-[10px] uppercase font-black tracking-widest text-text-muted">Status</div>
                    <div className="text-lg font-display font-bold uppercase">
                      {isValid ? 'VÁLIDO' : 'NÃO APROVADO / INVÁLIDO'}
                    </div>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div className="p-4 rounded-xl border border-graphite-700 bg-black/30">
                  {/* ALTERAÇÃO 3: Rótulo alterado de Operador para Agente */}
                  <div className="text-[10px] uppercase font-black tracking-widest text-text-muted">Agente</div>
                  <div className="text-sm font-bold">{(data.full_name || '-').toUpperCase()}</div>
                  <div className="text-[11px] text-text-muted">{data.email || ''}</div>
                </div>

                <div className="p-4 rounded-xl border border-graphite-700 bg-black/30">
                  <div className="text-[10px] uppercase font-black tracking-widest text-text-muted">Curso / Manual</div>
                  <div className="text-sm font-bold">{(data.ebook_title || '-').toUpperCase()}</div>
                </div>

                <div className="p-4 rounded-xl border border-graphite-700 bg-black/30">
                  <div className="text-[10px] uppercase font-black tracking-widest text-text-muted">Código</div>
                  <div className="text-sm font-bold text-amber-500">{data.cert_code}</div>
                </div>

                <div className="p-4 rounded-xl border border-graphite-700 bg-black/30">
                  <div className="text-[10px] uppercase font-black tracking-widest text-text-muted">Emissão / Nota</div>
                  <div className="text-sm font-bold">{formatDate(data.created_at)}</div>
                  <div className="text-[11px] text-text-muted">Nota: {data.score ?? '-'}%</div>
                </div>
              </div>

              <div className="p-4 rounded-xl border border-graphite-700 bg-black/30">
                <div className="text-[10px] uppercase font-black tracking-widest text-text-muted mb-2">
                  Competências avaliadas
                </div>

                {skillsList.length === 0 ? (
                  <div className="text-text-muted text-xs italic">
                    Competências não informadas para este manual.
                  </div>
                ) : (
                  <ul className="space-y-1">
                    {skillsList.map((s, idx) => (
                      <li key={idx} className="text-sm text-text-secondary">
                        • {s}
                      </li>
                    ))}
                  </ul>
                )}
              </div>

              <div className="p-4 rounded-xl border border-amber-500/20 bg-amber-500/10">
                <div className="text-[10px] uppercase font-black tracking-widest text-amber-200/80">
                  Responsável pela certificação
                </div>
                <div className="text-sm font-bold text-text-primary">
                  Tenente Alex Andreoli Dantas – RE: 953118-1
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="px-6 pb-6">
          <div className="text-[10px] text-text-muted">
            Esta validação é pública e se baseia no código do certificado. Caso necessário, o Comando pode revogar certificados via status no banco.
          </div>
        </div>
      </div>
    </div>
  );
};
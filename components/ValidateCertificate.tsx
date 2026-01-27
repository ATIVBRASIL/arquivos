import React, { useEffect, useMemo, useState } from 'react';
import { ShieldCheck, XCircle, Loader2, ArrowLeft, AlertTriangle } from 'lucide-react';
import { supabase } from '../src/lib/supabase';
import { Button } from './Button';

type ValidationResult = {
  cert_code: string;
  score: number | null;
  status: string | null;
  created_at: string | null;
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

        const [{ data: profile }, { data: ebook }] = await Promise.all([
          supabase.from('profiles').select('email, full_name').eq('id', exam.user_id).maybeSingle(),
          supabase.from('ebooks').select('title, technical_skills').eq('id', exam.ebook_id).maybeSingle(),
        ]);

        email = profile?.email ?? null;
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
    <div className="min-h-screen bg-black text-text-primary flex items-center justify-center p-4 font-sans">
      <div className="w-full max-w-2xl bg-graphite-800/60 backdrop-blur-md border border-graphite-700 rounded-2xl shadow-2xl overflow-hidden">
        
        {/* Cabeçalho de Autoridade - ARSENAL ATIV */}
        <div className="p-6 border-b border-graphite-700 flex items-center justify-between bg-graphite-900/40">
          <div className="flex items-center gap-4">
            <img 
              src="/logo_ativ.png" 
              alt="ATIV BRASIL" 
              className="h-12 w-auto object-contain drop-shadow-[0_0_10px_rgba(245,158,11,0.2)]" 
            />
            <div className="flex flex-col">
              <div className="text-xl font-display font-bold uppercase tracking-tighter text-white leading-none">
                ARSENAL
              </div>
              <div className="text-[10px] text-amber-500 uppercase font-black tracking-widest mt-1">
                Validação Pública
              </div>
            </div>
          </div>

          <Button
            variant="secondary"
            onClick={() => (window.location.href = 'https://arquivos.ativbrasil.com.br/')}
            className="hidden sm:flex"
          >
            <ArrowLeft size={16} /> Voltar ao Sistema
          </Button>
        </div>

        <div className="p-6 space-y-5">
          {loading && (
            <div className="flex items-center justify-center gap-2 text-amber-500 text-[10px] font-bold uppercase italic animate-pulse py-10">
              <Loader2 size={14} className="animate-spin" /> Consultando base de inteligência...
            </div>
          )}

          {!loading && err && (
            <div className="p-4 rounded-xl border border-red-500/30 bg-red-500/10">
              <div className="flex items-center gap-2 text-red-400 font-bold uppercase text-[10px]">
                <AlertTriangle size={14} /> Falha de Comunicação
              </div>
              <div className="text-text-secondary text-xs mt-2">{err}</div>
            </div>
          )}

          {!loading && !err && !data && (
            <div className="p-10 rounded-xl border border-graphite-700 bg-black/30 text-center space-y-3">
              <XCircle className="text-red-500 mx-auto" size={48} />
              <div className="text-lg font-display font-bold uppercase text-white">Certificado Inválido</div>
              <div className="text-text-muted text-sm max-w-xs mx-auto">
                Não existe registro para este código em nossa base tática. Verifique a autenticidade do documento.
              </div>
            </div>
          )}

          {!loading && !err && data && (
            <div className="space-y-4 animate-fade-in">
              {/* Status Badge */}
              <div className={`p-5 rounded-xl border ${isValid ? 'border-green-500/30 bg-green-500/10' : 'border-red-500/30 bg-red-500/10'}`}>
                <div className="flex items-center gap-4">
                  {isValid ? (
                    <ShieldCheck className="text-green-500" size={32} />
                  ) : (
                    <XCircle className="text-red-500" size={32} />
                  )}
                  <div>
                    <div className="text-[10px] uppercase font-black tracking-widest text-text-muted">Status do Protocolo</div>
                    <div className={`text-xl font-display font-bold uppercase ${isValid ? 'text-green-500' : 'text-red-500'}`}>
                      {isValid ? 'VÁLIDO / AUTORIZADO' : 'NÃO APROVADO'}
                    </div>
                  </div>
                </div>
              </div>

              {/* Grid de Informações */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div className="p-4 rounded-xl border border-graphite-700 bg-black/30">
                  <div className="text-[10px] uppercase font-black tracking-widest text-text-muted">Agente Certificado</div>
                  <div className="text-base font-bold text-white">{(data.full_name || '-').toUpperCase()}</div>
                  <div className="text-[11px] text-text-muted">{data.email || ''}</div>
                </div>

                <div className="p-4 rounded-xl border border-graphite-700 bg-black/30">
                  <div className="text-[10px] uppercase font-black tracking-widest text-text-muted">Instrução / Manual</div>
                  <div className="text-base font-bold text-white">{(data.ebook_title || '-').toUpperCase()}</div>
                </div>

                <div className="p-4 rounded-xl border border-graphite-700 bg-black/30">
                  <div className="text-[10px] uppercase font-black tracking-widest text-text-muted">Código de Autenticidade</div>
                  <div className="text-base font-mono font-bold text-amber-500 tracking-wider">{data.cert_code}</div>
                </div>

                <div className="p-4 rounded-xl border border-graphite-700 bg-black/30">
                  <div className="text-[10px] uppercase font-black tracking-widest text-text-muted">Emissão e Desempenho</div>
                  <div className="text-base font-bold text-white">{formatDate(data.created_at)}</div>
                  <div className="text-[11px] text-text-muted font-bold">Aproveitamento: {data.score ?? '-'}%</div>
                </div>
              </div>

              {/* Competências */}
              <div className="p-4 rounded-xl border border-graphite-700 bg-black/30">
                <div className="text-[10px] uppercase font-black tracking-widest text-text-muted mb-3 border-b border-graphite-700 pb-2">
                  Competências Técnicas Avaliadas
                </div>

                {skillsList.length === 0 ? (
                  <div className="text-text-muted text-xs italic">
                    Ementa técnica não informada para este protocolo.
                  </div>
                ) : (
                  <ul className="grid grid-cols-1 gap-2">
                    {skillsList.map((s, idx) => (
                      <li key={idx} className="text-sm text-text-secondary flex items-start gap-2">
                        <div className="w-1.5 h-1.5 rounded-full bg-amber-500 mt-1.5 shrink-0" />
                        {s}
                      </li>
                    ))}
                  </ul>
                )}
              </div>

              {/* Assinatura do Comando */}
              <div className="p-5 rounded-xl border border-amber-500/20 bg-amber-500/5 mt-6 text-center md:text-left">
                <div className="text-[10px] uppercase font-black tracking-widest text-amber-500/80 mb-2">
                  Oficial Responsável pela Certificação
                </div>
                <div className="text-base font-bold text-text-primary">
                  Tenente Alex Andreoli Dantas – RE: 953118-1
                </div>
                <div className="text-[10px] text-text-muted uppercase font-bold mt-1 tracking-tighter">
                  Comando de Operações ATIV BRASIL
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="px-6 pb-6 pt-2">
          <div className="text-[10px] text-text-muted text-center leading-relaxed italic border-t border-graphite-700 pt-4">
            Este registro é imutável e baseia-se em protocolos de avaliação de elite. 
            O Comando reserva-se o direito de revogar credenciais em caso de conduta incompatível com a Areté.
          </div>
        </div>
      </div>
    </div>
  );
};
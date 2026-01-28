import React, { useEffect, useMemo, useRef, useState } from 'react';
import { ExternalLink, ChevronLeft, ChevronRight } from 'lucide-react';

export type BannerSlide = {
  id: string;
  title: string;
  subtitle: string;
  cta: string;
  url: string;
  imageUrl?: string;
  badge?: string;
};

type Props = {
  slides: BannerSlide[];
  intervalMs?: number; // default 5000
};

/**
 * Normaliza URL externa para evitar navegação “interna” acidental (ex: "www.site.com" vira /www.site.com).
 * - trim
 * - adiciona https:// quando não houver protocolo
 * - rejeita protocolos não http(s) por segurança
 */
function normalizeExternalUrl(raw?: string): string {
  const u = (raw ?? '').trim();
  if (!u) return '';

  // Bloqueia protocolos potencialmente perigosos
  if (/^(javascript|data|vbscript):/i.test(u)) return '';

  // Já é http(s)
  if (/^https?:\/\//i.test(u)) return u;

  // Se começar com //, assume https
  if (/^\/\//.test(u)) return `https:${u}`;

  // Caso comum: domínio sem protocolo
  return `https://${u}`;
}

export const BannerCarousel: React.FC<Props> = ({ slides, intervalMs = 5000 }) => {
  const safeSlides = useMemo(() => (Array.isArray(slides) ? slides.filter(Boolean) : []), [slides]);
  const [index, setIndex] = useState(0);
  const timerRef = useRef<number | null>(null);

  // Swipe
  const touchStartX = useRef<number | null>(null);
  const touchDeltaX = useRef(0);

  const count = safeSlides.length;

  const goTo = (next: number) => {
    if (count === 0) return;
    const normalized = ((next % count) + count) % count;
    setIndex(normalized);
  };

  const next = () => goTo(index + 1);
  const prev = () => goTo(index - 1);

  // Auto-rotate
  useEffect(() => {
    if (count <= 1) return;

    if (timerRef.current) window.clearInterval(timerRef.current);

    timerRef.current = window.setInterval(() => {
      setIndex((i) => (i + 1) % count);
    }, intervalMs);

    return () => {
      if (timerRef.current) window.clearInterval(timerRef.current);
      timerRef.current = null;
    };
  }, [count, intervalMs]);

  // Garantir index válido quando slides mudarem
  useEffect(() => {
    if (count === 0) return;
    if (index > count - 1) setIndex(0);
  }, [count, index]);

  if (safeSlides.length === 0) return null;

  const slide = safeSlides[index];

  const backgroundStyle: React.CSSProperties = slide.imageUrl
    ? {
        // NOVO: Adicionamos aspas simples '${slide.imageUrl}' para proteger o link
        backgroundImage: `linear-gradient(to right, rgba(0,0,0,0.78), rgba(0,0,0,0.45)), url('${slide.imageUrl}')`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
      }
    : {
        backgroundImage:
          'radial-gradient(circle at 20% 10%, rgba(245,158,11,0.22), transparent 40%), radial-gradient(circle at 80% 50%, rgba(255,255,255,0.06), transparent 45%), linear-gradient(135deg, rgba(17,17,17,1), rgba(0,0,0,1))',
      };

  const href = normalizeExternalUrl(slide.url);
  const hasHref = Boolean(href);

  const openExternal = (e?: React.SyntheticEvent) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    if (!hasHref) {
      alert('Banner sem URL configurada no painel.');
      return;
    }
    window.open(href, '_blank', 'noopener,noreferrer');
  };

  return (
    <section className="w-full">
      <div
        className="relative overflow-hidden rounded-2xl border border-graphite-700 bg-black"
        onTouchStart={(e) => {
          touchStartX.current = e.touches[0].clientX;
          touchDeltaX.current = 0;
        }}
        onTouchMove={(e) => {
          if (touchStartX.current == null) return;
          touchDeltaX.current = e.touches[0].clientX - touchStartX.current;
        }}
        onTouchEnd={() => {
          const dx = touchDeltaX.current;
          touchStartX.current = null;
          touchDeltaX.current = 0;

          if (Math.abs(dx) < 50) return;
          if (dx < 0) next();
          else prev();
        }}
      >
        {/* Link “wrapper” preservado, mas agora com URL normalizada + fallback de clique */}
        <a
          href={hasHref ? href : undefined}
          target="_blank"
          rel="noopener noreferrer"
          className="block"
          aria-label={slide.title}
          onClick={(e) => {
            // Se não tiver href, bloqueia navegação e informa.
            if (!hasHref) {
              e.preventDefault();
              e.stopPropagation();
              alert('Banner sem URL configurada no painel.');
            }
          }}
        >
          <div className="p-5 md:p-6" style={backgroundStyle}>
            <div className="flex items-start justify-between gap-4">
              <div className="min-w-0">
                {slide.badge && (
                  <div className="inline-flex items-center mb-3">
                    <span className="text-[10px] font-black uppercase tracking-[0.22em] text-amber-500 bg-amber-500/10 border border-amber-500/20 px-2 py-1 rounded">
                      {slide.badge}
                    </span>
                  </div>
                )}

                <h3 className="text-base md:text-lg font-display font-extrabold text-white uppercase tracking-tight">
                  {slide.title}
                </h3>

                <p className="mt-2 text-xs md:text-sm text-text-secondary max-w-[58ch]">{slide.subtitle}</p>

                {/* CTA mantém visual idêntico, mas agora garante abertura externa mesmo em edge-cases */}
                <button
                  type="button"
                  onClick={openExternal}
                  className="mt-4 inline-flex items-center gap-2 bg-amber-500 hover:bg-amber-600 text-black font-black uppercase tracking-wider text-[11px] px-4 py-2 rounded-lg transition-colors"
                  aria-label={slide.cta}
                >
                  <ExternalLink size={16} />
                  {slide.cta}
                </button>
              </div>

              {count > 1 && (
                <div className="hidden md:flex items-center gap-2">
                  <button
                    type="button"
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      prev();
                    }}
                    className="bg-black/40 hover:bg-black/60 border border-graphite-700 text-white p-2 rounded-lg transition-colors"
                    aria-label="Anterior"
                    title="Anterior"
                  >
                    <ChevronLeft size={18} />
                  </button>

                  <button
                    type="button"
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      next();
                    }}
                    className="bg-black/40 hover:bg-black/60 border border-graphite-700 text-white p-2 rounded-lg transition-colors"
                    aria-label="Próximo"
                    title="Próximo"
                  >
                    <ChevronRight size={18} />
                  </button>
                </div>
              )}
            </div>
          </div>
        </a>

        {count > 1 && (
          <div className="absolute bottom-3 left-0 right-0 flex items-center justify-center gap-2">
            {safeSlides.map((s, i) => (
              <button
                key={s.id}
                type="button"
                onClick={() => goTo(i)}
                className={`h-1.5 rounded-full transition-all ${
                  i === index ? 'w-10 bg-amber-500' : 'w-4 bg-white/20 hover:bg-white/35'
                }`}
                aria-label={`Ir para banner ${i + 1}`}
                title={`Ir para banner ${i + 1}`}
              />
            ))}
          </div>
        )}
      </div>
    </section>
  );
};

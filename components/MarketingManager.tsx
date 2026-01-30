import React, { useEffect, useMemo, useRef, useState } from 'react';
import { supabase } from '../src/lib/supabase';
import { Plus, Save, Trash2, Upload, X, Image as ImageIcon } from 'lucide-react';

type BannerRow = {
  id: string;
  created_at: string;
  updated_at: string;
  badge: string | null;
  title: string;
  subtitle: string;
  cta: string;
  url: string;
  image_url: string | null;
  sort_order: number;
  is_active: boolean;
};

type BannerForm = {
  badge: string;
  title: string;
  subtitle: string;
  cta: string;
  url: string;
  image_url: string;
  sort_order: number; // mantemos number no estado
  is_active: boolean;
};

const MAX = {
  badge: 14,
  title: 40,
  subtitle: 120,
  cta: 18,
  url: 240,
};

const emptyForm: BannerForm = {
  badge: '',
  title: '',
  subtitle: '',
  cta: '',
  url: '',
  image_url: '',
  sort_order: 0,
  is_active: true,
};

export const MarketingManager: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [banners, setBanners] = useState<BannerRow[]>([]);

  // Erros separados: validação vs banco
  const [formError, setFormError] = useState<string | null>(null);
  const [dbError, setDbError] = useState<string | null>(null);

  // Modal
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<BannerRow | null>(null);

  const [form, setForm] = useState<BannerForm>(emptyForm);

  // Evitar setState após unmount
  const mountedRef = useRef(true);
  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
    };
  }, []);

  // Trava scroll do body quando modal abre (evita navbar “invadindo” por rolagem e melhora UX)
  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = prev;
    };
  }, [open]);

  const sorted = useMemo(() => {
    return [...banners].sort(
      (a, b) => a.sort_order - b.sort_order || (a.created_at > b.created_at ? -1 : 1)
    );
  }, [banners]);

  const clearErrors = () => {
    setFormError(null);
    setDbError(null);
  };

  const updateForm = (patch: Partial<BannerForm>) => {
    // sempre que o usuário editar, limpamos erros (resolve “erro grudado”)
    clearErrors();
    setForm((p) => ({ ...p, ...patch }));
  };

  const resetForm = () => {
    setEditing(null);
    setForm(emptyForm);
    clearErrors();
  };

  const openCreate = () => {
    resetForm();
    setOpen(true);
  };

  const openEdit = (b: BannerRow) => {
    clearErrors();
    setEditing(b);
    setForm({
      badge: (b.badge || '').toUpperCase(),
      title: b.title ?? '',
      subtitle: b.subtitle ?? '',
      cta: (b.cta ?? '').toUpperCase(),
      url: b.url ?? '',
      image_url: b.image_url ?? '',
      sort_order: Number(b.sort_order) || 0,
      is_active: !!b.is_active,
    });
    setOpen(true);
  };

  const closeModal = () => {
    setOpen(false);
    resetForm();
  };

  const fetchBanners = async () => {
    setLoading(true);
    clearErrors();

    try {
      const { data, error } = await supabase
        .from('marketing_banners')
        .select('*')
        .order('sort_order', { ascending: true })
        .order('created_at', { ascending: false });

      if (!mountedRef.current) return;

      if (error) {
        setDbError(error.message);
        setBanners([]);
        return;
      }

      setBanners((data || []) as BannerRow[]);
    } finally {
      if (mountedRef.current) setLoading(false);
    }
  };

  useEffect(() => {
    fetchBanners();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const validate = (): string | null => {
    if (!form.title.trim()) return 'Título é obrigatório.';
    if (!form.subtitle.trim()) return 'Subtítulo é obrigatório.';
    if (!form.cta.trim()) return 'CTA é obrigatório.';
    if (!form.url.trim()) return 'URL é obrigatória.';
    return null;
  };

  const canSave =
    !!form.title.trim() && !!form.subtitle.trim() && !!form.cta.trim() && !!form.url.trim();

  const saveBanner = async () => {
    clearErrors();

    const v = validate();
    if (v) {
      setFormError(v);
      return;
    }

    setSaving(true);

    try {
      const payload = {
        badge: form.badge.trim() ? form.badge.trim().toUpperCase() : null,
        title: form.title.trim(),
        subtitle: form.subtitle.trim(),
        cta: form.cta.trim().toUpperCase(),
        url: form.url.trim(),
        image_url: form.image_url.trim() ? form.image_url.trim() : null,
        sort_order: Number.isFinite(form.sort_order) ? form.sort_order : 0,
        is_active: !!form.is_active,
      };

      const res = editing
        ? await supabase.from('marketing_banners').update(payload).eq('id', editing.id)
        : await supabase.from('marketing_banners').insert(payload);

      if (res.error) {
        setDbError(res.error.message);
        return; // ✅ não fecha modal
      }

      // ✅ sucesso
      setOpen(false);
      resetForm();
      await fetchBanners();
    } finally {
      if (mountedRef.current) setSaving(false);
    }
  };

  const deleteBanner = async (id: string) => {
    if (!confirm('Excluir este banner permanentemente?')) return;

    clearErrors();

    const { error } = await supabase.from('marketing_banners').delete().eq('id', id);
    if (error) {
      setDbError(error.message);
      return;
    }

    fetchBanners();
  };

  const toggleActive = async (b: BannerRow) => {
    clearErrors();

    const { error } = await supabase
      .from('marketing_banners')
      .update({ is_active: !b.is_active })
      .eq('id', b.id);

    if (error) {
      setDbError(error.message);
      return;
    }

    fetchBanners();
  };

  // Upload opcional (bucket "marketing")
  const uploadImage = async (file: File) => {
    clearErrors();

    const ext = file.name.split('.').pop()?.toLowerCase() || 'png';
    const safeName = file.name.replace(/\s+/g, '-').toLowerCase();
    const path = `banners/${Date.now()}-${safeName}`;

    const { error: upErr } = await supabase.storage.from('marketing').upload(path, file, {
      cacheControl: '3600',
      upsert: false,
      contentType: file.type || `image/${ext}`,
    });

    if (upErr) {
      setDbError(
        `Falha no upload. Provável motivo: bucket "marketing" não existe ou políticas não permitem. Erro: ${upErr.message}`
      );
      return;
    }

    const { data } = supabase.storage.from('marketing').getPublicUrl(path);
    updateForm({ image_url: data.publicUrl });
  };

  // Classes novas (melhor contraste / visão)
  const inputClass =
    'w-full bg-graphite-700/70 border border-graphite-600 rounded-lg p-3 text-white text-sm outline-none ' +
    'placeholder:text-text-muted/70 focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20';

  const textareaClass =
    'w-full bg-graphite-700/70 border border-graphite-600 rounded-lg p-3 text-white text-sm outline-none ' +
    'placeholder:text-text-muted/70 focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20';

  const numberInputClass =
    'w-full bg-graphite-700/70 border border-graphite-600 rounded-lg p-3 text-white text-sm outline-none ' +
    'placeholder:text-text-muted/70 focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20';

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-display font-bold text-white uppercase tracking-tight">
            Marketing
          </h2>
          <p className="text-xs text-text-muted mt-1">
            Controle do banner rotativo da Home (presencial, novidades e consultoria).
          </p>
        </div>

        <button
          onClick={openCreate}
          className="bg-amber-500 hover:bg-amber-600 text-black font-black uppercase tracking-wider text-xs px-4 py-3 rounded-lg flex items-center gap-2"
          type="button"
        >
          <Plus size={18} /> Novo Banner
        </button>
      </div>

      {(formError || dbError) && (
        <div className="bg-red-500/10 border border-red-500/20 text-red-500 text-xs font-bold p-3 rounded-lg">
          {formError || dbError}
        </div>
      )}

      <div className="bg-graphite-800 border border-graphite-700 rounded-2xl overflow-hidden">
        <div className="p-4 border-b border-graphite-700 flex items-center justify-between">
          <span className="text-[10px] font-black uppercase tracking-widest text-text-muted">
            Banners cadastrados
          </span>
          <span className="text-[10px] text-text-muted">{sorted.length} itens</span>
        </div>

        {loading ? (
          <div className="p-6 text-text-muted text-sm">Carregando...</div>
        ) : sorted.length === 0 ? (
          <div className="p-6 text-text-muted text-sm">
            Nenhum banner cadastrado. Clique em <b>Novo Banner</b>.
          </div>
        ) : (
          <div className="divide-y divide-graphite-700">
            {sorted.map((b) => (
              <div key={b.id} className="p-4 flex items-start justify-between gap-4">
                <div className="min-w-0">
                  <div className="flex items-center gap-2 mb-2">
                    {b.badge && (
                      <span className="text-[10px] font-black uppercase tracking-[0.22em] text-amber-500 bg-amber-500/10 border border-amber-500/20 px-2 py-1 rounded">
                        {b.badge}
                      </span>
                    )}

                    <span
                      className={`text-[10px] font-black uppercase tracking-widest px-2 py-1 rounded border ${
                        b.is_active
                          ? 'text-green-400 border-green-400/20 bg-green-400/10'
                          : 'text-text-muted border-graphite-700 bg-black/20'
                      }`}
                    >
                      {b.is_active ? 'ATIVO' : 'INATIVO'}
                    </span>

                    <span className="text-[10px] text-text-muted">Ordem: {b.sort_order}</span>
                  </div>

                  <div className="text-white font-bold uppercase line-clamp-1">{b.title}</div>
                  <div className="text-xs text-text-secondary mt-1 line-clamp-2">{b.subtitle}</div>

                  <div className="mt-2 text-[10px] text-text-muted break-all">
                    <span className="font-black uppercase">URL:</span> {b.url}
                  </div>

                  <div className="mt-2 flex items-center gap-2 text-[10px] text-text-muted">
                    <ImageIcon size={14} />
                    {b.image_url ? <span className="break-all">{b.image_url}</span> : <span>Sem imagem</span>}
                  </div>
                </div>

                <div className="flex flex-col gap-2 shrink-0">
                  <button
                    onClick={() => toggleActive(b)}
                    className={`px-3 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest border transition-colors ${
                      b.is_active
                        ? 'border-graphite-700 text-text-secondary hover:text-white hover:border-white/20'
                        : 'border-green-400/30 text-green-400 hover:bg-green-400/10'
                    }`}
                    type="button"
                  >
                    {b.is_active ? 'Desativar' : 'Ativar'}
                  </button>

                  <button
                    onClick={() => openEdit(b)}
                    className="px-3 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest border border-amber-500/30 text-amber-500 hover:bg-amber-500/10"
                    type="button"
                  >
                    Editar
                  </button>

                  <button
                    onClick={() => deleteBanner(b.id)}
                    className="px-3 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest border border-red-500/30 text-red-500 hover:bg-red-500/10 flex items-center justify-center gap-1"
                    type="button"
                  >
                    <Trash2 size={14} /> Excluir
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* MODAL */}
      {open && (
  <div
    className="fixed inset-x-0 bottom-0 z-[99999] bg-black/95 flex items-start md:items-center justify-center p-4 backdrop-blur-sm"
    style={{ top: 72 }}
  >
          {/* max-h + overflow-auto garante que nada fique “por baixo” do topo em zoom/telas menores */}
          <div className="relative z-[100000] w-full max-w-2xl max-h-[calc(100vh-72px-2rem)] overflow-auto bg-graphite-800 border border-graphite-700 rounded-2xl shadow-2xl">
            {/* header sticky: X sempre acessível */}
            <div className="sticky top-0 z-10 bg-graphite-800/95 backdrop-blur border-b border-graphite-700 p-5 flex items-center justify-between">
              <div>
                <h3 className="text-white font-display font-bold uppercase tracking-tight">
                  {editing ? 'Editar Banner' : 'Novo Banner'}
                </h3>
                <p className="text-xs text-text-muted mt-1">
                  Campos com limite de caracteres para manter a doutrina visual.
                </p>
              </div>

              <button
                onClick={closeModal}
                className="relative z-20 text-text-muted hover:text-white p-2 pointer-events-auto"
                type="button"
                aria-label="Fechar"
              >
                <X size={20} />
              </button>
            </div>

            {/* bloco de formulário com leve destaque */}
            <div className="p-5">
              <div className="bg-black/20 border border-white/5 rounded-xl p-4 space-y-4">
                {/* Badge + Ordem + Ativo */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-[10px] font-black uppercase tracking-widest text-text-muted mb-2">
                      Badge (opcional)
                    </label>
                    <input
                      value={form.badge}
                      maxLength={MAX.badge}
                      onChange={(e) => updateForm({ badge: e.target.value })}
                      className={`${inputClass} uppercase`}
                      placeholder="NOVIDADE"
                    />
                    <div className="mt-1 text-[10px] text-text-muted">
                      {form.badge.length}/{MAX.badge}
                    </div>
                  </div>

                  <div>
                    <label className="block text-[10px] font-black uppercase tracking-widest text-text-muted mb-2">
                      Ordem
                    </label>
                    <input
                      type="number"
                      value={form.sort_order}
                      onChange={(e) => updateForm({ sort_order: Number(e.target.value) || 0 })}
                      className={numberInputClass}
                      placeholder="0"
                    />
                  </div>

                  <div className="flex items-end gap-2">
                    <label className="flex items-center gap-2 text-xs text-text-secondary select-none">
                      <input
                        type="checkbox"
                        checked={form.is_active}
                        onChange={(e) => updateForm({ is_active: e.target.checked })}
                      />
                      Ativo
                    </label>
                  </div>
                </div>

                {/* Title */}
                <div>
                  <label className="block text-[10px] font-black uppercase tracking-widest text-text-muted mb-2">
                    Título
                  </label>
                  <input
                    value={form.title}
                    maxLength={MAX.title}
                    onChange={(e) => updateForm({ title: e.target.value })}
                    className={`${inputClass} uppercase`}
                    placeholder="NOVO PROTOCOLO DISPONÍVEL"
                  />
                  <div className="mt-1 text-[10px] text-text-muted">
                    {form.title.length}/{MAX.title}
                  </div>
                </div>

                {/* Subtitle */}
                <div>
                  <label className="block text-[10px] font-black uppercase tracking-widest text-text-muted mb-2">
                    Subtítulo
                  </label>
                  <textarea
                    value={form.subtitle}
                    maxLength={MAX.subtitle}
                    onChange={(e) => updateForm({ subtitle: e.target.value })}
                    className={textareaClass}
                    placeholder="Atualização do acervo..."
                    rows={3}
                  />
                  <div className="mt-1 text-[10px] text-text-muted">
                    {form.subtitle.length}/{MAX.subtitle}
                  </div>
                </div>

                {/* CTA + URL */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[10px] font-black uppercase tracking-widest text-text-muted mb-2">
                      CTA (texto do botão)
                    </label>
                    <input
                      value={form.cta}
                      maxLength={MAX.cta}
                      onChange={(e) => updateForm({ cta: e.target.value })}
                      className={`${inputClass} uppercase`}
                      placeholder="VER DETALHES"
                    />
                    <div className="mt-1 text-[10px] text-text-muted">
                      {form.cta.length}/{MAX.cta}
                    </div>
                  </div>

                  <div>
                    <label className="block text-[10px] font-black uppercase tracking-widest text-text-muted mb-2">
                      URL
                    </label>
                    <input
                      value={form.url}
                      maxLength={MAX.url}
                      onChange={(e) => updateForm({ url: e.target.value })}
                      className={inputClass}
                      placeholder="https://..."
                    />
                  </div>
                </div>

                {/* Image URL + Upload */}
                <div>
                  <label className="block text-[10px] font-black uppercase tracking-widest text-text-muted mb-2">
                    Imagem (URL pública) — opcional
                  </label>
                  <input
                    value={form.image_url}
                    onChange={(e) => updateForm({ image_url: e.target.value })}
                    className={inputClass}
                    placeholder="https://..."
                  />

                  <div className="mt-3 flex flex-col md:flex-row items-start md:items-center gap-3">
                    <label className="inline-flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-amber-500 border border-amber-500/30 bg-amber-500/10 px-3 py-2 rounded-lg cursor-pointer">
                      <Upload size={16} /> Upload (opcional)
                      <input
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={(e) => {
                          const f = e.target.files?.[0];
                          if (f) uploadImage(f);
                        }}
                      />
                    </label>

                    <p className="text-[10px] text-text-muted leading-relaxed">
                      * Upload usa bucket <b>marketing</b> no Supabase Storage. Se não existir/políticas, o sistema mostra erro e você pode usar URL.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <div className="p-5 border-t border-graphite-700 flex items-center justify-end gap-3">
              <button
                onClick={closeModal}
                className="px-4 py-3 rounded-lg text-xs font-black uppercase tracking-widest border border-graphite-700 text-text-secondary hover:text-white"
                type="button"
              >
                Cancelar
              </button>

              <button
                onClick={saveBanner}
                disabled={saving || !canSave}
                className="bg-amber-500 hover:bg-amber-600 disabled:opacity-60 text-black font-black uppercase tracking-wider text-xs px-5 py-3 rounded-lg flex items-center gap-2"
                title={!canSave ? 'Preencha Título, Subtítulo, CTA e URL.' : 'Salvar banner'}
                type="button"
              >
                <Save size={18} /> {saving ? 'Salvando...' : 'Salvar'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

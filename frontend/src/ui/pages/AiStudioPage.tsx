import React, { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import {
  Armchair,
  BadgeIndianRupee,
  Download,
  ImageIcon,
  Trash2,
  LampDesk,
  Palette,
  Ruler,
  Sparkles,
  Trees,
  Wand2
} from "lucide-react";
import { Link } from "react-router-dom";
import { useAuth } from "../../state/auth";
import { getBaseUrl, api } from "../../utils/api";
import { BackButton } from "../components/BackButton";
import { Surface } from "../components/Surface";

type DesignForm = {
  house_type: string;
  budget: string;
  style: string;
  room_type: string;
  plot_size: string;
  location: string;
  user_prompt: string;
};

type SavedDesign = {
  request: DesignForm & {
    id: number;
    user_id: number;
    created_at: string;
  };
  suggestion: {
    id: number;
    request_id: number;
    interior_suggestion: string;
    exterior_suggestion: string;
    color_palette: string;
    material_suggestion: string;
    lighting_suggestion: string;
    image_url: string;
    image_urls: Record<string, string>;
    provider: string;
    note: string;
    created_at: string;
  };
};

const initialForm: DesignForm = {
  house_type: "2BHK",
  budget: "Low budget",
  style: "Modern Indian",
  room_type: "Living Room",
  plot_size: "30x40",
  location: "Karnataka",
  user_prompt: "Need a clean modern family home with dining connection, storage, natural light, and a welcoming feel."
};

const fieldClass =
  "mt-2 w-full rounded-xl border border-white/10 bg-slate-950/50 px-4 py-3 text-sm text-slate-100 outline-none transition focus:border-cyan-300/40 focus:ring-2 focus:ring-cyan-400/20";

function SectionCard({
  title,
  icon: Icon,
  children
}: {
  title: string;
  icon: React.ComponentType<{ className?: string }>;
  children: React.ReactNode;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35 }}
      className="rounded-2xl border border-white/10 bg-white/[0.04] p-4 shadow-[0_20px_70px_rgba(15,23,42,0.28)]"
    >
      <div className="flex items-center gap-3">
        <div className="rounded-xl bg-cyan-400/10 p-2 text-cyan-200 ring-1 ring-cyan-300/20">
          <Icon className="h-4 w-4" />
        </div>
        <div className="text-sm font-semibold text-white">{title}</div>
      </div>
      <div className="mt-3 text-sm leading-7 text-slate-200">{children}</div>
    </motion.div>
  );
}

export function AiStudioPage() {
  const { token, user } = useAuth();
  const authed = Boolean(token && user);
  const [form, setForm] = useState<DesignForm>(initialForm);
  const [busy, setBusy] = useState(false);
  const [loadingSaved, setLoadingSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [current, setCurrent] = useState<SavedDesign | null>(null);
  const [saved, setSaved] = useState<SavedDesign[]>([]);
  const [previewImage, setPreviewImage] = useState<{ src: string; label: string } | null>(null);

  const examples = useMemo(
    () => [
      {
        label: "2BHK Modern",
        value: {
          house_type: "2BHK",
          budget: "Low budget",
          style: "Modern Indian",
          room_type: "Living Room",
          plot_size: "30x40",
          location: "Karnataka",
          user_prompt: "Need a compact modern Indian home with a bright living room and practical family layout."
        }
      },
      {
        label: "Luxury Villa",
        value: {
          house_type: "4BHK Villa",
          budget: "Premium budget",
          style: "Contemporary luxury",
          room_type: "Front Elevation",
          plot_size: "50x80",
          location: "Hyderabad",
          user_prompt: "Want a premium duplex villa feel with strong elevation, landscaped entry, and elegant interiors."
        }
      },
      {
        label: "Compact Kitchen",
        value: {
          house_type: "3BHK",
          budget: "Mid budget",
          style: "Minimal",
          room_type: "Kitchen",
          plot_size: "40x60",
          location: "Bengaluru",
          user_prompt: "Need a practical kitchen with maximum storage, bright counters, and easy daily workflow."
        }
      }
    ],
    []
  );

  const currentImageMap = useMemo(() => {
    if (!current) return {} as Record<string, string>;
    const fromField = current.suggestion.image_urls || {};
    if (Object.keys(fromField).length) return fromField;
    try {
      const parsed = JSON.parse(current.suggestion.image_url || "{}");
      if (parsed && typeof parsed === "object") {
        return parsed as Record<string, string>;
      }
    } catch {
      // ignore
    }
    return {} as Record<string, string>;
  }, [current]);

  useEffect(() => {
    if (!token) {
      setSaved([]);
      setCurrent(null);
      return;
    }
    let cancelled = false;
    setLoadingSaved(true);
    api
      .get<SavedDesign[]>("/ai/designs", token)
      .then((rows) => {
        if (cancelled) return;
        setSaved(rows);
        setCurrent((prev) => prev ?? rows[0] ?? null);
      })
      .catch(() => {
        if (!cancelled) setSaved([]);
      })
      .finally(() => {
        if (!cancelled) setLoadingSaved(false);
      });
    return () => {
      cancelled = true;
    };
  }, [token]);

  async function generateDesign() {
    if (!token) return;
    setBusy(true);
    setError(null);
    try {
      const res = await api.post<SavedDesign>("/ai/designs/generate", form, token);
      setCurrent(res);
      setSaved((prev) => [res, ...prev.filter((item) => item.request.id !== res.request.id)]);
    } catch (e: any) {
      setError(e?.message || "Unable to generate design");
    } finally {
      setBusy(false);
    }
  }

  async function downloadReport(designId: number) {
    if (!token) return;
    const res = await fetch(`${getBaseUrl()}/ai/designs/${designId}/report`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    if (!res.ok) {
      throw new Error("Unable to download PDF report");
    }
    const blob = await res.blob();
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = `constructhub-design-${designId}.pdf`;
    anchor.click();
    URL.revokeObjectURL(url);
  }

  async function deleteDesign(designId: number) {
    if (!token) return;
    try {
      await api.del<void>(`/ai/designs/${designId}`, token);
      setSaved((prev) => {
        const next = prev.filter((item) => item.request.id !== designId);
        setCurrent((curr) => {
          if (curr?.request.id === designId) return next[0] ?? null;
          return curr;
        });
        return next;
      });
    } catch (e: any) {
      setError(e?.message || "Unable to delete saved design");
    }
  }

  return (
    <div className="mx-auto w-full max-w-7xl px-4 py-10">
      <BackButton className="mb-4" />
      {!authed ? (
        <div className="mb-6 flex justify-end">
          <Link
            to="/login"
            className="rounded-xl bg-amber-400 px-4 py-2 text-sm font-medium text-slate-950 transition hover:bg-amber-300"
          >
            Login to use AI Studio
          </Link>
        </div>
      ) : null}

      <div className="mt-6 grid grid-cols-1 gap-5 xl:grid-cols-[0.96fr_1.04fr]">
        <Surface className="p-5">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-xs uppercase tracking-[0.28em] text-cyan-200/80">Design Requirement Form</div>
              <div className="mt-1 text-xl font-semibold text-white">Tell the AI what you want to build</div>
            </div>
            <Wand2 className="h-5 w-5 text-cyan-200" />
          </div>

          <div className="mt-5 grid grid-cols-1 gap-4 md:grid-cols-2">
            <label className="text-sm text-slate-200">
              House type
              <input
                className={fieldClass}
                value={form.house_type}
                onChange={(e) => setForm((prev) => ({ ...prev, house_type: e.target.value }))}
              />
            </label>
            <label className="text-sm text-slate-200">
              Budget
              <input
                className={fieldClass}
                value={form.budget}
                onChange={(e) => setForm((prev) => ({ ...prev, budget: e.target.value }))}
              />
            </label>
            <label className="text-sm text-slate-200">
              Style
              <input
                className={fieldClass}
                value={form.style}
                onChange={(e) => setForm((prev) => ({ ...prev, style: e.target.value }))}
              />
            </label>
            <label className="text-sm text-slate-200">
              Plot size
              <input
                className={fieldClass}
                value={form.plot_size}
                onChange={(e) => setForm((prev) => ({ ...prev, plot_size: e.target.value }))}
              />
            </label>
            <label className="text-sm text-slate-200">
              Location
              <input
                className={fieldClass}
                value={form.location}
                onChange={(e) => setForm((prev) => ({ ...prev, location: e.target.value }))}
              />
            </label>
          </div>

          <label className="mt-4 block text-sm text-slate-200">
            Input prompt
            <textarea
              className={`${fieldClass} min-h-[120px] resize-none`}
              value={form.user_prompt}
              onChange={(e) => setForm((prev) => ({ ...prev, user_prompt: e.target.value }))}
              placeholder="Example: I want a 2BHK home with a bright living room, dining connection, calm colors, modular kitchen, storage, balcony, and modern front elevation."
            />
          </label>

          <div className="mt-5 flex flex-wrap gap-2">
            {examples.map((example) => (
              <button
                key={example.label}
                type="button"
                onClick={() => setForm(example.value)}
                className="rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-xs text-slate-200 transition hover:bg-white/10"
              >
                {example.label}
              </button>
            ))}
          </div>

          {error ? <div className="mt-4 rounded-xl bg-rose-500/10 px-4 py-3 text-sm text-rose-100">{error}</div> : null}

          <button
            type="button"
            disabled={!authed || busy}
            onClick={generateDesign}
            className="mt-6 inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-[linear-gradient(135deg,#22d3ee,#3b82f6)] px-4 py-3 text-sm font-medium text-white shadow-[0_18px_45px_rgba(34,211,238,0.25)] transition hover:translate-y-[-1px] disabled:cursor-not-allowed disabled:opacity-60"
          >
            <Sparkles className="h-4 w-4" />
            {busy ? "Generating design..." : "Generate AI Design"}
          </button>
        </Surface>

        <Surface className="p-5">
          <div className="flex items-center justify-between gap-3">
            <div>
              <div className="text-xs uppercase tracking-[0.28em] text-amber-200/80">AI Suggestions</div>
              <div className="mt-1 text-xl font-semibold text-white">Interior + exterior guidance</div>
            </div>
            {current ? (
              <button
                type="button"
                onClick={() => downloadReport(current.request.id).catch((e) => setError(e.message))}
                className="inline-flex items-center gap-2 rounded-xl border border-amber-300/20 bg-amber-300/10 px-3 py-2 text-sm text-amber-50 transition hover:bg-amber-300/15"
              >
                <Download className="h-4 w-4" />
                Download PDF Report
              </button>
            ) : null}
          </div>

          {!current ? (
            <div className="mt-5 rounded-2xl border border-dashed border-white/10 bg-black/20 p-6 text-sm leading-7 text-slate-300">
              Generate a design to see <b className="text-white">interior ideas</b>, <b className="text-white">exterior ideas</b>,
              <b className="text-white"> color combinations</b>, <b className="text-white">materials</b>, and
              <b className="text-white"> lighting ideas</b>.
            </div>
          ) : (
            <div className="mt-5 space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-white/10 bg-white/[0.04] p-4">
                <div>
                  <div className="text-lg font-semibold text-white">{current.request.style} concept for {current.request.house_type}</div>
                  <div className="mt-1 text-sm text-slate-300">
                    {current.request.plot_size} · {current.request.location}
                  </div>
                </div>
              </div>

              {current.suggestion.note && current.suggestion.provider !== "offline" ? (
                <div className="rounded-2xl border border-amber-300/20 bg-amber-300/10 px-4 py-3 text-sm text-amber-50">
                  {current.suggestion.note}
                </div>
              ) : null}

              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <SectionCard title="Interior ideas" icon={Armchair}>
                  {current.suggestion.interior_suggestion}
                </SectionCard>
                <SectionCard title="Exterior ideas" icon={Trees}>
                  {current.suggestion.exterior_suggestion}
                </SectionCard>
                <SectionCard title="Color combinations" icon={Palette}>
                  {current.suggestion.color_palette}
                </SectionCard>
                <SectionCard title="Material suggestions" icon={BadgeIndianRupee}>
                  {current.suggestion.material_suggestion}
                </SectionCard>
                <SectionCard title="Lighting ideas" icon={LampDesk}>
                  {current.suggestion.lighting_suggestion}
                </SectionCard>
              </div>

              {Object.keys(currentImageMap).length ? (
                <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-4">
                  <div className="flex items-center gap-3">
                    <div className="rounded-xl bg-cyan-400/10 p-2 text-cyan-200 ring-1 ring-cyan-300/20">
                      <ImageIcon className="h-4 w-4" />
                    </div>
                    <div className="text-sm font-semibold text-white">Generated design images</div>
                  </div>

                  <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-2">
                    {Object.entries(currentImageMap).map(([key, value]) => {
                      const label = key
                        .replace(/_image$/, "")
                        .replace(/_/g, " ")
                        .replace(/\b\w/g, (m) => m.toUpperCase());
                      return (
                        <div key={key} className="overflow-hidden rounded-2xl border border-white/10 bg-black/20">
                          <button
                            type="button"
                            onClick={() => setPreviewImage({ src: `data:image/png;base64,${value}`, label })}
                            className="block w-full text-left"
                            title={`Open ${label}`}
                          >
                            <img
                              src={`data:image/png;base64,${value}`}
                              alt={label}
                              className="h-56 w-full cursor-zoom-in object-cover transition hover:opacity-95"
                            />
                          </button>
                          <div className="border-t border-white/10 px-4 py-3 text-sm font-medium text-slate-100">{label}</div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ) : null}

            </div>
          )}
        </Surface>
      </div>

      <Surface className="mt-6 p-5">
        <div className="flex items-center justify-between gap-3">
          <div>
            <div className="text-xs uppercase tracking-[0.28em] text-cyan-200/80">Saved Designs</div>
          </div>
          {loadingSaved ? <div className="text-sm text-slate-400">Loading...</div> : null}
        </div>

        {!saved.length ? (
          <div className="mt-4 rounded-2xl border border-dashed border-white/10 bg-black/20 p-5 text-sm text-slate-300">
            No saved designs yet. Generate one and it will appear here automatically.
          </div>
        ) : (
          <div className="mt-4 grid grid-cols-1 gap-4 lg:grid-cols-3">
            {saved.map((design) => (
              <div
                key={design.request.id}
                className={[
                  "rounded-2xl border p-4 transition",
                  current?.request.id === design.request.id
                    ? "border-cyan-300/40 bg-cyan-300/10"
                    : "border-white/10 bg-white/[0.04] hover:bg-white/[0.07]"
                ].join(" ")}
              >
                <div className="flex items-start justify-between gap-3">
                  <button type="button" onClick={() => setCurrent(design)} className="min-w-0 flex-1 text-left">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <div className="text-sm font-semibold text-white">
                          {design.request.house_type} · {design.request.room_type}
                        </div>
                        <div className="mt-1 text-xs text-slate-400">
                          {design.request.style} · {design.request.location}
                        </div>
                      </div>
                      <Ruler className="h-4 w-4 shrink-0 text-cyan-200" />
                    </div>
                    <div className="mt-3 text-sm leading-6 text-slate-300 line-clamp-3">{design.suggestion.interior_suggestion}</div>
                    <div className="mt-4 flex items-center justify-between text-xs text-slate-400">
                      <span>{new Date(design.request.created_at).toLocaleDateString()}</span>
                      <span>{design.suggestion.provider}</span>
                    </div>
                  </button>
                  <button
                    type="button"
                    onClick={() => deleteDesign(design.request.id)}
                    className="rounded-xl border border-rose-300/20 bg-rose-400/10 p-2 text-rose-100 transition hover:bg-rose-400/20"
                    title="Delete saved design"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </Surface>

      {previewImage ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/85 p-4">
          <div className="relative w-full max-w-5xl overflow-hidden rounded-3xl border border-white/10 bg-slate-950 shadow-2xl">
            <div className="flex items-center justify-between border-b border-white/10 px-5 py-4">
              <div className="text-sm font-semibold text-white">{previewImage.label}</div>
              <button
                type="button"
                onClick={() => setPreviewImage(null)}
                className="rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-slate-200 hover:bg-white/10"
              >
                Close
              </button>
            </div>
            <div className="bg-black p-3">
              <img src={previewImage.src} alt={previewImage.label} className="max-h-[78vh] w-full object-contain" />
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}

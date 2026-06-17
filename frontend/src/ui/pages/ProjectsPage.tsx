import React, { useEffect, useState } from "react";
import { ImagePlus, Trash2 } from "lucide-react";

import { useAuth } from "../../state/auth";
import { api, getBaseUrl } from "../../utils/api";
import { BackButton } from "../components/BackButton";
import { Surface } from "../components/Surface";

type CompanyProject = {
  id: number;
  company_id: number;
  client_name: string;
  title: string;
  summary: string;
  project_price: string;
  image_url: string;
  created_at: string;
};

function Field({
  label,
  value,
  onChange,
  placeholder = ""
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
}) {
  return (
    <div>
      <div className="text-xs text-slate-400">{label}</div>
      <input className="ch-input mt-1" value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} />
    </div>
  );
}

export function ProjectsPage() {
  const { token } = useAuth();
  const [projects, setProjects] = useState<CompanyProject[]>([]);
  const [clientName, setClientName] = useState("");
  const [projectTitle, setProjectTitle] = useState("");
  const [projectPrice, setProjectPrice] = useState("");
  const [projectSummary, setProjectSummary] = useState("");
  const [projectImage, setProjectImage] = useState<File | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = async () => {
    if (!token) return;
    try {
      const items = await api.get<CompanyProject[]>("/me/company-projects", token);
      setProjects(items);
    } catch (e: any) {
      setError(e?.message || "Failed to load projects");
    }
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  return (
    <div className="mx-auto w-full max-w-6xl px-4 py-10">
      <BackButton className="mb-4" />
      <div>
        <div className="text-xs text-slate-400">Projects</div>
        <div className="mt-1 text-2xl font-semibold tracking-tight text-slate-50">Completed building projects</div>
        <div className="mt-1 text-sm text-slate-300">
          Add completed building images and prices here. Clients will see them in the company View popup.
        </div>
      </div>

      <div className="mt-6 grid grid-cols-1 gap-4 lg:grid-cols-[380px_1fr]">
        <Surface className="p-5">
          <div className="flex items-center gap-2 text-sm font-semibold text-slate-50">
            <ImagePlus className="h-4 w-4 text-teal-300" />
            Add completed project
          </div>
          <div className="mt-2 text-xs text-slate-400">
            The total building count updates automatically from the projects added here.
          </div>

          <div className="mt-4 space-y-3">
            <Field label="Client name" value={clientName} onChange={setClientName} placeholder="e.g., Ramesh Kumar" />
            <Field label="Project title" value={projectTitle} onChange={setProjectTitle} placeholder="e.g., 3BHK Duplex Villa" />
            <Field label="Project price" value={projectPrice} onChange={setProjectPrice} placeholder="e.g., INR 42L" />
            <div>
              <div className="text-xs text-slate-400">Project summary</div>
              <textarea
                className="ch-textarea mt-1 min-h-[84px]"
                value={projectSummary}
                onChange={(e) => setProjectSummary(e.target.value)}
                placeholder="Short details about the completed building"
              />
            </div>
            <div>
              <div className="text-xs text-slate-400">Building image</div>
              <input
                type="file"
                accept="image/*"
                className="ch-input mt-1"
                onChange={(e) => setProjectImage(e.target.files?.[0] ?? null)}
              />
            </div>
            {error ? <div className="text-sm text-rose-300">{error}</div> : null}
            <button
              disabled={busy}
              onClick={async () => {
                if (!clientName.trim()) return setError("Client name is required.");
                if (!projectTitle.trim()) return setError("Project title is required.");
                if (!projectPrice.trim()) return setError("Project price is required.");
                if (!projectImage) return setError("Please add a building image.");
                if (!token) return;
                setError(null);
                setBusy(true);
                try {
                  const form = new FormData();
                  form.append("client_name", clientName);
                  form.append("title", projectTitle);
                  form.append("project_price", projectPrice);
                  form.append("summary", projectSummary);
                  form.append("image", projectImage);
                  const res = await fetch(`${getBaseUrl()}/me/company-projects`, {
                    method: "POST",
                    headers: { Authorization: `Bearer ${token}` },
                    body: form
                  });
                  if (!res.ok) {
                    const data = await res.json().catch(() => null);
                    throw new Error(data?.detail || "Failed to add project");
                  }
                  setClientName("");
                  setProjectTitle("");
                  setProjectPrice("");
                  setProjectSummary("");
                  setProjectImage(null);
                  await load();
                } catch (e: any) {
                  setError(e?.message || "Failed to add project");
                } finally {
                  setBusy(false);
                }
              }}
              className="ch-btn-primary w-full disabled:opacity-60"
            >
              {busy ? "Adding project..." : "Add completed project"}
            </button>
          </div>
        </Surface>

        <div className="space-y-4">
          <Surface className="p-5">
            <div className="flex items-center justify-between">
              <div className="text-sm font-semibold text-slate-50">Your completed projects</div>
              <div className="text-xs text-slate-400">{projects.length} project(s)</div>
            </div>

            <div className="mt-4 grid grid-cols-1 gap-4 xl:grid-cols-2">
              {projects.map((project) => (
                <div key={project.id} className="overflow-hidden rounded-xl bg-black/20 ring-1 ring-white/10">
                  {project.image_url ? (
                    <img src={`${getBaseUrl()}${project.image_url}`} alt={project.title} className="h-52 w-full object-cover" />
                  ) : null}
                  <div className="p-4">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <div className="text-xs uppercase tracking-[0.16em] text-slate-400">{project.client_name}</div>
                        <div className="text-base font-semibold text-slate-50">{project.title}</div>
                        <div className="mt-1 text-sm font-medium text-teal-200">{project.project_price}</div>
                      </div>
                      <button
                        onClick={async () => {
                          if (!token) return;
                          try {
                            await api.del(`/me/company-projects/${project.id}`, token);
                            await load();
                          } catch (e: any) {
                            setError(e?.message || "Failed to delete project");
                          }
                        }}
                        className="ch-btn-ghost px-3 py-2"
                      >
                        <Trash2 className="h-4 w-4 text-rose-300" />
                        Delete
                      </button>
                    </div>
                    {project.summary ? <div className="mt-3 text-sm leading-6 text-slate-300">{project.summary}</div> : null}
                  </div>
                </div>
              ))}
            </div>

            {!projects.length ? (
              <div className="mt-4 rounded-md bg-black/20 p-4 text-sm text-slate-300 ring-1 ring-white/10">
                No completed projects added yet.
              </div>
            ) : null}
          </Surface>
        </div>
      </div>
    </div>
  );
}

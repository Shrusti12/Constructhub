import React, { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Building2, Eye, Link2, MapPin, Search, X } from "lucide-react";
import { api, getBaseUrl } from "../../utils/api";
import { useAuth } from "../../state/auth";
import { BackButton } from "../components/BackButton";
import { Surface } from "../components/Surface";

type CompanyProfile = {
  id: number;
  user_id: number;
  name: string;
  location: string;
  description: string;
  website: string;
  services: string;
  logo_url: string;
  completed_projects: number;
  project_price_range: string;
};

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

type BuildRequest = {
  id: number;
  client_id: number;
  title: string;
  description: string;
  city: string;
  budget_min: number;
  budget_max: number;
  status: string;
  created_at: string;
};

type ClientProfile = { id: number; user_id: number; name: string; location: string; phone: string };

const WELCOME_KEY = "constructhub_welcome_shown";

function splitServices(services: string): string[] {
  return services
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean)
    .slice(0, 6);
}

function projectSearchText(projects: CompanyProject[] = []): string {
  return projects
    .map((p) => `${p.client_name} ${p.title} ${p.summary} ${p.project_price}`)
    .join(" ");
}

export function CompaniesPage() {
  const { user, token } = useAuth();
  const nav = useNavigate();
  const [companies, setCompanies] = useState<CompanyProfile[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [busyCompanyId, setBusyCompanyId] = useState<number | null>(null);
  const [clientProfile, setClientProfile] = useState<ClientProfile | null>(null);
  const [hideWelcome, setHideWelcome] = useState<boolean>(() => sessionStorage.getItem(WELCOME_KEY) === "1");
  const [q, setQ] = useState("");
  const [selectedCompany, setSelectedCompany] = useState<CompanyProfile | null>(null);
  const [selectedProjects, setSelectedProjects] = useState<CompanyProject[]>([]);
  const [projectsByCompany, setProjectsByCompany] = useState<Record<number, CompanyProject[]>>({});

  const canConnect = user?.role === "client" && Boolean(token);

  useEffect(() => {
    let canceled = false;
    (async () => {
      try {
        const res = await api.get<CompanyProfile[]>("/market/companies");
        if (!canceled) setCompanies(res);
      } catch (e: any) {
        if (!canceled) setError(e?.message || "Failed to load companies");
      }
    })();
    return () => {
      canceled = true;
    };
  }, []);

  useEffect(() => {
    let canceled = false;
    (async () => {
      if (!token || user?.role !== "client") return;
      try {
        const prof = await api.get<ClientProfile | null>("/me/client-profile", token);
        if (!canceled) setClientProfile(prof);
      } catch {
        // ignore
      }
    })();
    return () => {
      canceled = true;
    };
  }, [token, user?.role]);

  useEffect(() => {
    if (!token || user?.role !== "client") return;
    if (hideWelcome) return;
    const t = setTimeout(() => {
      sessionStorage.setItem(WELCOME_KEY, "1");
      setHideWelcome(true);
    }, 4500);
    return () => clearTimeout(t);
  }, [hideWelcome, token, user?.role]);

  const intro = useMemo(() => {
    if (!user) return "Browse companies. Login as a client to connect and chat.";
    if (user.role === "company") return "Browse other companies (connections are client -> company).";
    return "Pick a company, connect using one of your build requests, then chat after acceptance.";
  }, [user]);

  const welcomeName = (clientProfile?.name || "").trim() || user?.email || "there";
  const showWelcome = Boolean(token && user?.role === "client" && !hideWelcome);

  useEffect(() => {
    let canceled = false;
    (async () => {
      if (!companies.length) {
        setProjectsByCompany({});
        return;
      }
      const entries = await Promise.all(
        companies.map(async (company) => {
          try {
            const projects = await api.get<CompanyProject[]>(`/market/companies/${company.id}/projects`);
            return [company.id, projects] as const;
          } catch {
            return [company.id, []] as const;
          }
        })
      );
      if (!canceled) setProjectsByCompany(Object.fromEntries(entries));
    })();
    return () => {
      canceled = true;
    };
  }, [companies]);

  const filtered = useMemo(() => {
    const terms = q
      .trim()
      .toLowerCase()
      .split(/\s+/)
      .filter(Boolean);
    if (!terms.length) return companies;
    return companies.filter((c) => {
      const projects = projectsByCompany[c.id] || [];
      const s = `${c.name} ${c.location} ${c.services} ${c.description} ${projectSearchText(projects)}`.toLowerCase();
      return terms.every((term) => s.includes(term));
    });
  }, [companies, projectsByCompany, q]);

  useEffect(() => {
    let canceled = false;
    (async () => {
      if (!selectedCompany) {
        setSelectedProjects([]);
        return;
      }
      try {
        const cached = projectsByCompany[selectedCompany.id];
        if (cached) {
          if (!canceled) setSelectedProjects(cached);
          return;
        }
        const items = await api.get<CompanyProject[]>(`/market/companies/${selectedCompany.id}/projects`);
        if (!canceled) setSelectedProjects(items);
      } catch {
        if (!canceled) setSelectedProjects([]);
      }
    })();
    return () => {
      canceled = true;
    };
  }, [projectsByCompany, selectedCompany]);

  return (
    <div className="mx-auto w-full max-w-6xl px-4 py-10">
      <BackButton className="mb-4" />
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <div className="text-xs text-slate-400">Companies</div>
          <div className="mt-1 text-2xl font-semibold tracking-tight text-slate-50">Find the right team</div>
          <div className="mt-1 text-sm text-slate-300">{intro}</div>
        </div>
        {!user ? (
          <Link to="/login" className="ch-btn-primary">
            Login
          </Link>
        ) : null}
      </div>

      {showWelcome ? (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35 }}
          className="mt-4"
        >
          <div className="flex items-center justify-between rounded-md bg-teal-500/15 px-4 py-3 text-sm text-teal-50 ring-1 ring-teal-400/25">
            <div>
              <span className="font-semibold">Welcome, {welcomeName}</span>{" "}
              <span className="text-teal-100/80">Ready to connect?</span>
            </div>
            <button
              onClick={() => {
                sessionStorage.setItem(WELCOME_KEY, "1");
                setHideWelcome(true);
              }}
              className="inline-flex h-7 w-7 items-center justify-center rounded-md bg-black/20 ring-1 ring-white/10 hover:bg-black/30"
              title="Close"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </motion.div>
      ) : null}

      <div className="mt-6 flex items-center gap-2 rounded-md bg-black/25 px-3 py-2 ring-1 ring-white/10">
        <Search className="h-4 w-4 text-slate-400" />
        <input
          className="w-full bg-transparent text-sm text-slate-100 placeholder:text-slate-500 focus:outline-none"
          placeholder="Search 2BHK, 3BHK, duplex, interiors, city, price..."
          value={q}
          onChange={(e) => setQ(e.target.value)}
        />
      </div>

      <div className="mt-2 text-xs text-slate-400">
        Search checks company details and completed building projects added by each company.
      </div>

      {error ? <div className="mt-4 text-sm text-rose-300">{error}</div> : null}

      <div className="mt-6 grid grid-cols-1 gap-4 md:grid-cols-2">
        {filtered.map((c) => (
          <Surface key={c.id} className="p-5">
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-start gap-3">
                <div className="grid h-10 w-10 place-items-center rounded-md bg-teal-500/15 ring-1 ring-teal-400/25">
                  <Building2 className="h-5 w-5 text-teal-300" />
                </div>
                <div>
                  <div className="text-sm font-semibold text-slate-50">{c.name}</div>
                  <div className="mt-1 flex items-center gap-2 text-xs text-slate-400">
                    <MapPin className="h-3.5 w-3.5" />
                    {c.location || "-"}
                  </div>
                </div>
              </div>

              <button
                onClick={() => setSelectedCompany(c)}
                className="ch-btn-ghost px-3 py-2"
                title="View company details"
              >
                <Eye className="h-4 w-4 text-sky-300" />
                View
              </button>
            </div>

            {c.description ? <div className="mt-3 text-sm text-slate-300">{c.description}</div> : null}

            {c.services ? (
              <div className="mt-3 flex flex-wrap gap-2">
                {splitServices(c.services).map((s) => (
                  <span key={s} className="ch-chip">
                    {s}
                  </span>
                ))}
              </div>
            ) : null}

            {c.website ? (
              <a href={c.website} target="_blank" rel="noreferrer" className="mt-3 inline-block text-xs text-teal-200 hover:text-teal-100">
                {c.website}
              </a>
            ) : null}
          </Surface>
        ))}
      </div>

      {filtered.length === 0 ? (
        <div className="mt-6 rounded-md bg-black/20 p-4 text-sm text-slate-300 ring-1 ring-white/10">
          No companies found.
        </div>
      ) : null}

      {selectedCompany ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 px-4 py-6">
          <div className="flex max-h-[88vh] w-full max-w-2xl flex-col overflow-hidden rounded-2xl bg-slate-900 shadow-2xl ring-1 ring-white/10">
            <div className="border-b border-white/10 p-6">
            <div className="flex items-start justify-between gap-4">
              <div>
                <div className="text-xs uppercase tracking-[0.2em] text-slate-400">Registered Company</div>
                <div className="mt-2 text-2xl font-semibold text-slate-50">{selectedCompany.name}</div>
                <div className="mt-2 flex items-center gap-2 text-sm text-slate-300">
                  <MapPin className="h-4 w-4 text-teal-300" />
                  {selectedCompany.location || "Location not added"}
                </div>
              </div>
              <button
                onClick={() => setSelectedCompany(null)}
                className="inline-flex h-9 w-9 items-center justify-center rounded-lg bg-white/5 text-slate-300 ring-1 ring-white/10 hover:bg-white/10"
                title="Back"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            </div>

            <div className="flex-1 overflow-y-auto p-6">

            <div className="mt-6 grid gap-5 md:grid-cols-2">
              <div className="rounded-xl bg-white/5 p-4 ring-1 ring-white/10">
                <div className="text-sm font-semibold text-slate-100">About company</div>
                <div className="mt-2 text-sm leading-7 text-slate-300">
                  {selectedCompany.description || "No description added yet."}
                </div>
              </div>
              <div className="rounded-xl bg-white/5 p-4 ring-1 ring-white/10">
                <div className="text-sm font-semibold text-slate-100">Company track record</div>
                <div className="mt-3 text-sm text-slate-300">
                  <div className="rounded-lg bg-black/20 px-3 py-3 ring-1 ring-white/10">
                    <div className="text-xs uppercase tracking-[0.18em] text-slate-400">Buildings completed</div>
                    <div className="mt-1 text-lg font-semibold text-slate-50">{selectedCompany.completed_projects || 0}</div>
                  </div>
                </div>
              </div>
              <div className="rounded-xl bg-white/5 p-4 ring-1 ring-white/10 md:col-span-2">
                <div className="text-sm font-semibold text-slate-100">Services</div>
                <div className="mt-3 flex flex-wrap gap-2">
                  {splitServices(selectedCompany.services).length ? (
                    splitServices(selectedCompany.services).map((service) => (
                      <span key={service} className="ch-chip">
                        {service}
                      </span>
                    ))
                  ) : (
                    <span className="text-sm text-slate-400">No services added yet.</span>
                  )}
                </div>
              </div>
            </div>

            <div className="mt-5 rounded-xl bg-white/5 p-4 ring-1 ring-white/10">
              <div className="text-sm font-semibold text-slate-100">Completed buildings and prices</div>
              <div className="mt-4 grid gap-4 md:grid-cols-2">
                {selectedProjects.map((project) => (
                  <div key={project.id} className="overflow-hidden rounded-xl bg-black/20 ring-1 ring-white/10">
                    {project.image_url ? (
                      <img
                        src={`${getBaseUrl()}${project.image_url}`}
                        alt={project.title}
                        className="h-48 w-full object-cover"
                      />
                    ) : null}
                    <div className="p-4">
                      <div className="text-xs uppercase tracking-[0.16em] text-slate-400">{project.client_name}</div>
                      <div className="text-base font-semibold text-slate-50">{project.title}</div>
                      <div className="mt-1 text-sm font-medium text-teal-200">{project.project_price}</div>
                      {project.summary ? <div className="mt-2 text-sm leading-6 text-slate-300">{project.summary}</div> : null}
                    </div>
                  </div>
                ))}
              </div>
              {!selectedProjects.length ? (
                <div className="mt-4 rounded-lg bg-black/20 px-4 py-3 text-sm text-slate-300 ring-1 ring-white/10">
                  This company has not added completed building images yet.
                </div>
              ) : null}
            </div>

            {selectedCompany.website ? (
              <a
                href={selectedCompany.website}
                target="_blank"
                rel="noreferrer"
                className="mt-5 inline-block text-sm text-teal-200 hover:text-teal-100"
              >
                {selectedCompany.website}
              </a>
            ) : null}
            </div>

            <div className="flex flex-wrap justify-end gap-3 border-t border-white/10 bg-slate-900/95 p-6">
              <button
                disabled={!canConnect || busyCompanyId === selectedCompany.id}
                onClick={async () => {
                  if (!token) return nav("/login");
                  if (!canConnect) return;
                  setError(null);
                  setBusyCompanyId(selectedCompany.id);
                  try {
                    const myReqs = await api.get<BuildRequest[]>("/market/my/requests", token);
                    const openReqs = myReqs.filter((r) => r.status === "open" || r.status === "in_progress");
                    if (!openReqs.length) {
                      setError("Create a build request first (Dashboard -> New request).");
                      setSelectedCompany(null);
                      nav("/dashboard");
                      return;
                    }
                    const request = openReqs[0];
                    await api.post("/market/client-connect", { company_id: selectedCompany.id, request_id: request.id }, token);
                    setSelectedCompany(null);
                    nav("/chat");
                  } catch (e: any) {
                    setError(e?.message || "Failed to connect");
                  } finally {
                    setBusyCompanyId(null);
                  }
                }}
                className="ch-btn-primary px-4 py-2 disabled:opacity-60"
              >
                <Link2 className="h-4 w-4" />
                {busyCompanyId === selectedCompany.id ? "Connecting..." : "Connect"}
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}


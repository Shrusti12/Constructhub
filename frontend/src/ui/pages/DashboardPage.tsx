import React, { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Bot, Building2, Check, MessageCircle, Plus, RefreshCw, Trash2, X } from "lucide-react";

import { useAuth } from "../../state/auth";
import { api } from "../../utils/api";
import { BackButton } from "../components/BackButton";
import { Surface } from "../components/Surface";
import { useNotifications } from "../../state/notifications";

type CompanyProfile = {
  id: number;
  user_id: number;
  name: string;
  phone: string;
  location: string;
  description: string;
  website: string;
  services: string;
  logo_url: string;
  completed_projects: number;
  project_price_range: string;
};

type ClientProfile = { id: number; user_id: number; name: string; location: string; phone: string };

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

type InboxItem = {
  connection_id: number;
  status: string;
  request_id: number;
  company_id: number;
  counterpart_name: string;
  request_title?: string | null;
  client_name?: string | null;
  company_name?: string | null;
  last_message_body: string | null;
  last_message_at: string | null;
  unread_count: number;
};

type CompanyIncomingItem = {
  connection_id: number;
  request_id: number;
  company_id: number;
  status: string;
  client_name: string;
  client_phone: string;
  request_title: string;
  city: string;
  budget_min: number;
  budget_max: number;
  description: string;
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

export function DashboardPage() {
  const nav = useNavigate();
  const { user, token } = useAuth();
  const { notifications } = useNotifications();

  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const [companyProfile, setCompanyProfile] = useState<CompanyProfile | null>(null);
  const [clientProfile, setClientProfile] = useState<ClientProfile | null>(null);
  const [requests, setRequests] = useState<BuildRequest[]>([]);
  const [companyIncoming, setCompanyIncoming] = useState<CompanyIncomingItem[]>([]);
  const [inbox, setInbox] = useState<InboxItem[]>([]);

  const reload = async () => {
    if (!token || !user) return;
    setBusy(true);
    setError(null);
    try {
      if (user.role === "company") {
        const [incomingItems, inboxItems, profile] = await Promise.all([
          api.get<CompanyIncomingItem[]>("/market/company-incoming", token),
          api.get<InboxItem[]>("/market/inbox", token),
          api.get<CompanyProfile | null>("/me/company-profile", token)
        ]);
        setCompanyIncoming(incomingItems);
        setInbox(inboxItems);
        setCompanyProfile(profile);
        setRequests([]);
      } else {
        const [reqs, inboxItems, profile] = await Promise.all([
          api.get<BuildRequest[]>("/market/my/requests", token),
          api.get<InboxItem[]>("/market/inbox", token),
          api.get<ClientProfile | null>("/me/client-profile", token)
        ]);
        setRequests(reqs);
        setInbox(inboxItems);
        setClientProfile(profile);
        setCompanyIncoming([]);
      }
    } catch (e: any) {
      setError(e?.message || "Failed to load");
    } finally {
      setBusy(false);
    }
  };

  useEffect(() => {
    reload();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token, user?.id]);

  // Keep inbox feeling live (notifications poll every 3s).
  useEffect(() => {
    if (!token || !user) return;
    api.get<InboxItem[]>("/market/inbox", token).then(setInbox).catch(() => {});
  }, [notifications, token, user]);

  const title = user?.role === "client" ? "Client workspace" : "Company workspace";
  const unreadItems = useMemo(() => inbox.filter((x) => x.unread_count > 0), [inbox]);
  const pendingClientRequests = useMemo(
    () => companyIncoming.filter((x) => x.status === "pending"),
    [companyIncoming]
  );

  if (!user) return null;

  return (
    <div className="mx-auto w-full max-w-6xl px-4 py-10">
      <BackButton className="mb-4" />
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <div className="text-xs text-slate-400">Dashboard</div>
          <div className="mt-1 text-2xl font-semibold tracking-tight text-slate-50">{title}</div>
          <div className="mt-1 text-sm text-slate-300">Profile, requests, messages, and notifications in one place.</div>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <button onClick={reload} disabled={busy} className="ch-btn-ghost px-3 py-2" title="Refresh">
            <RefreshCw className="h-4 w-4" />
          </button>
        </div>
      </div>

      {error ? <div className="mt-4 text-sm text-rose-300">{error}</div> : null}

      <div className="mt-6 grid grid-cols-1 gap-4 lg:grid-cols-[340px_1fr]">
        <div className="space-y-4">
          <Surface className="p-5">
            <div className="text-sm font-semibold text-slate-50">Your profile</div>
            <div className="mt-3">
              {user.role === "company" ? (
                <CompanyProfileEditor
                  token={token!}
                  value={companyProfile}
                  onChange={setCompanyProfile}
                  onSaved={reload}
                />
              ) : (
                <ClientProfileEditor token={token!} value={clientProfile} onChange={setClientProfile} onSaved={reload} />
              )}
            </div>
          </Surface>

          <Surface className="p-5">
            <div className="flex items-center justify-between">
              <div className="text-sm font-semibold text-slate-50">Messages</div>
              <div className="text-xs text-slate-400">{inbox.length ? `${inbox.length} chats` : "No chats"}</div>
            </div>

            {user.role === "company" && pendingClientRequests.length ? (
              <div className="mt-3 rounded-md bg-amber-500/10 p-3 text-sm text-amber-50 ring-1 ring-amber-400/20">
                <span className="font-semibold">Notifications:</span> {pendingClientRequests.length} client request(s) waiting for your response
              </div>
            ) : null}

            {unreadItems.length ? (
              <div className="mt-3 rounded-md bg-teal-500/10 p-3 text-sm text-teal-50 ring-1 ring-teal-400/20">
                <span className="font-semibold">Notifications:</span> {unreadItems.length} new message thread(s)
              </div>
            ) : null}

            <div className="mt-3 space-y-2">
              {user.role === "company"
                ? pendingClientRequests.slice(0, 4).map((x) => (
                    <button
                      key={`pending-${x.connection_id}`}
                      onClick={() => nav("/dashboard")}
                      className="w-full rounded-md bg-black/20 px-3 py-2 text-left ring-1 ring-white/10 hover:bg-white/5"
                      title="Review request below"
                    >
                      <div className="flex items-center justify-between gap-2">
                        <div className="text-sm font-semibold text-slate-50">{x.client_name}</div>
                        <div className="text-xs text-amber-200">pending</div>
                      </div>
                      <div className="mt-1 line-clamp-1 text-xs text-slate-300">{x.request_title}</div>
                    </button>
                  ))
                : null}

              {inbox.slice(0, 8).map((x) => (
                <button
                  key={x.connection_id}
                  onClick={() => nav(`/chat?c=${x.connection_id}`)}
                  className="w-full rounded-md bg-black/20 px-3 py-2 text-left ring-1 ring-white/10 hover:bg-white/5"
                  title="Open chat"
                >
                  <div className="flex items-center justify-between gap-2">
                    <div className="text-sm font-semibold text-slate-50">{x.counterpart_name}</div>
                    {x.unread_count ? (
                      <div className="grid h-5 min-w-5 place-items-center rounded-full bg-teal-500/35 px-1 text-[11px] font-semibold text-teal-50 ring-1 ring-teal-400/40">
                        {x.unread_count > 99 ? "99+" : x.unread_count}
                      </div>
                    ) : (
                      <div className="text-xs text-slate-400">{x.status}</div>
                    )}
                  </div>
                  <div className="mt-1 line-clamp-1 text-xs text-slate-300">
                    {x.last_message_body ? x.last_message_body : "No messages yet"}
                  </div>
                </button>
              ))}

              {!inbox.length ? (
                <div className="rounded-md bg-black/20 p-3 text-sm text-slate-300 ring-1 ring-white/10">
                  {user.role === "company"
                    ? "No chats yet. Accept a client request to start communication."
                    : "No messages yet. Connect to a company and start a chat."}
                </div>
              ) : null}
            </div>
          </Surface>
        </div>

        <div className="space-y-4">
          <Surface className="p-5">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="text-sm font-semibold text-slate-50">
                {user.role === "client" ? "Your build requests" : "Client requests to your company"}
              </div>
              {user.role === "client" ? <CreateRequest token={token!} onCreated={reload} /> : null}
            </div>

            <div className="mt-4 grid grid-cols-1 gap-3">
              {user.role === "company"
                ? companyIncoming.slice(0, 20).map((item) => (
                    <CompanyIncomingCard key={item.connection_id} item={item} token={token!} onAction={reload} />
                  ))
                : requests
                    .filter((r) => true)
                    .slice(0, 20)
                    .map((r) => (
                      <RequestCard key={r.id} req={r} role={user.role} token={token!} onAction={reload} />
                    ))}
              {(user.role === "company" ? companyIncoming.length === 0 : requests.length === 0) ? (
                <div className="rounded-md bg-black/20 p-4 text-sm text-slate-300 ring-1 ring-white/10">
                  {user.role === "company" ? "No client requests yet." : "No requests yet."}
                </div>
              ) : null}
            </div>
          </Surface>
        </div>
      </div>
    </div>
  );
}

function CompanyIncomingCard({
  item,
  token,
  onAction
}: {
  item: CompanyIncomingItem;
  token: string;
  onAction: () => Promise<void>;
}) {
  const nav = useNavigate();
  const [busy, setBusy] = useState<"" | "accept" | "reject">("");
  const [err, setErr] = useState<string | null>(null);

  return (
    <div className="rounded-md bg-black/20 p-4 ring-1 ring-white/10">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div>
          <div className="text-sm font-semibold text-slate-50">{item.client_name}</div>
          <div className="mt-1 text-xs text-slate-400">
            {item.request_title} - {item.city || "-"} - {item.status}
          </div>
          {item.client_phone ? <div className="mt-1 text-xs text-slate-400">Phone: {item.client_phone}</div> : null}
        </div>
        <div className="text-xs text-teal-200">
          {item.budget_min || item.budget_max ? `INR ${item.budget_min}-${item.budget_max}` : "Budget: -"}
        </div>
      </div>

      {item.description ? <div className="mt-3 text-sm text-slate-300">{item.description}</div> : null}
      {err ? <div className="mt-2 text-sm text-rose-300">{err}</div> : null}

      <div className="mt-3 flex flex-wrap items-center justify-between gap-2">
        {item.status === "pending" ? (
          <div className="flex flex-wrap items-center gap-2">
            <button
              disabled={busy !== ""}
              onClick={async () => {
                setErr(null);
                setBusy("accept");
                try {
                  await api.post(`/market/connections/${item.connection_id}/company-accept`, undefined, token);
                  await onAction();
                } catch (e: any) {
                  setErr(e?.message || "Failed to accept");
                } finally {
                  setBusy("");
                }
              }}
              className="ch-btn-primary px-3 py-2 disabled:opacity-60"
            >
              <Check className="h-4 w-4" />
              {busy === "accept" ? "Accepting..." : `Accept ${item.client_name}`}
            </button>
            <button
              disabled={busy !== ""}
              onClick={async () => {
                setErr(null);
                setBusy("reject");
                try {
                  await api.post(`/market/connections/${item.connection_id}/company-reject`, undefined, token);
                  await onAction();
                } catch (e: any) {
                  setErr(e?.message || "Failed to reject");
                } finally {
                  setBusy("");
                }
              }}
              className="ch-btn-ghost px-3 py-2 disabled:opacity-60"
            >
              <X className="h-4 w-4" />
              {busy === "reject" ? "Rejecting..." : "Reject"}
            </button>
          </div>
        ) : item.status === "accepted" ? (
          <button onClick={() => nav(`/chat?c=${item.connection_id}`)} className="ch-btn-primary px-3 py-2">
            <MessageCircle className="h-4 w-4" />
            Chat with {item.client_name}
          </button>
        ) : (
          <div className="text-xs text-slate-400">Rejected</div>
        )}

        <div className="text-xs text-slate-400">
          {item.status === "accepted" ? "Client can now see this in chat." : "Review and respond to the client request."}
        </div>
      </div>
    </div>
  );
}

function CompanyProfileEditor({
  token,
  value,
  onChange,
  onSaved
}: {
  token: string;
  value: CompanyProfile | null;
  onChange: (v: CompanyProfile | null) => void;
  onSaved: () => Promise<void>;
}) {
  const [draft, setDraft] = useState<CompanyProfile>({
    id: 0,
    user_id: 0,
    name: "",
    phone: "",
    location: "",
    description: "",
    website: "",
    services: "",
    logo_url: "",
    completed_projects: 0,
    project_price_range: ""
  });
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    if (value) setDraft(value);
  }, [value]);

  return (
    <div className="space-y-3">
      <Field label="Company name" value={draft.name} onChange={(v) => setDraft((d) => ({ ...d, name: v }))} />
      <Field label="Phone" value={draft.phone} onChange={(v) => setDraft((d) => ({ ...d, phone: v }))} />
      <Field label="Location" value={draft.location} onChange={(v) => setDraft((d) => ({ ...d, location: v }))} />
      <Field label="Website" value={draft.website} onChange={(v) => setDraft((d) => ({ ...d, website: v }))} />
      <div>
        <div className="text-xs text-slate-400">Services</div>
        <textarea
          className="ch-textarea mt-1 min-h-[84px]"
          value={draft.services}
          onChange={(e) => setDraft((d) => ({ ...d, services: e.target.value }))}
          placeholder="e.g., turnkey construction, interiors, plumbing, electrical"
        />
      </div>
      <div>
        <div className="text-xs text-slate-400">Description</div>
        <textarea
          className="ch-textarea mt-1 min-h-[84px]"
          value={draft.description}
          onChange={(e) => setDraft((d) => ({ ...d, description: e.target.value }))}
          placeholder="Your pitch in 2-3 lines"
        />
      </div>
      {err ? <div className="text-sm text-rose-300">{err}</div> : null}
      <button
        disabled={busy}
        onClick={async () => {
          setErr(null);
          setBusy(true);
          try {
            const saved = await api.put<CompanyProfile>("/me/company-profile", draft, token);
            onChange(saved);
            await onSaved();
          } catch (e: any) {
            setErr(e?.message || "Failed to save");
          } finally {
            setBusy(false);
          }
        }}
        className="ch-btn-primary w-full disabled:opacity-60"
      >
        {busy ? "Saving..." : "Save profile"}
      </button>
    </div>
  );
}

function ClientProfileEditor({
  token,
  value,
  onChange,
  onSaved
}: {
  token: string;
  value: ClientProfile | null;
  onChange: (v: ClientProfile | null) => void;
  onSaved: () => Promise<void>;
}) {
  const [draft, setDraft] = useState<ClientProfile>({ id: 0, user_id: 0, name: "", location: "", phone: "" });
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    if (value) setDraft(value);
  }, [value]);

  return (
    <div className="space-y-3">
      <Field label="Name" value={draft.name} onChange={(v) => setDraft((d) => ({ ...d, name: v }))} />
      <Field label="Location" value={draft.location} onChange={(v) => setDraft((d) => ({ ...d, location: v }))} />
      <Field label="Phone" value={draft.phone} onChange={(v) => setDraft((d) => ({ ...d, phone: v }))} />
      {err ? <div className="text-sm text-rose-300">{err}</div> : null}
      <button
        disabled={busy}
        onClick={async () => {
          setErr(null);
          setBusy(true);
          try {
            const saved = await api.put<ClientProfile>("/me/client-profile", draft, token);
            onChange(saved);
            await onSaved();
          } catch (e: any) {
            setErr(e?.message || "Failed to save");
          } finally {
            setBusy(false);
          }
        }}
        className="ch-btn-primary w-full disabled:opacity-60"
      >
        {busy ? "Saving..." : "Save profile"}
      </button>
    </div>
  );
}

function CreateRequest({ token, onCreated }: { token: string; onCreated: () => Promise<void> }) {
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [city, setCity] = useState("");
  const [budgetMin, setBudgetMin] = useState("0");
  const [budgetMax, setBudgetMax] = useState("0");
  const [description, setDescription] = useState("");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  return (
    <div>
      <button onClick={() => setOpen((v) => !v)} className="ch-btn-primary px-3 py-2" title="New request">
        <Plus className="h-4 w-4" />
        New request
      </button>
      {open ? (
        <div className="mt-3 rounded-md bg-black/20 p-4 ring-1 ring-white/10">
          <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
            <Field label="Title" value={title} onChange={setTitle} placeholder="e.g., 3BHK renovation" />
            <Field label="City" value={city} onChange={setCity} placeholder="e.g., Mumbai" />
            <Field label="Budget min" value={budgetMin} onChange={setBudgetMin} placeholder="0" />
            <Field label="Budget max" value={budgetMax} onChange={setBudgetMax} placeholder="0" />
          </div>
          <div className="mt-3">
            <div className="text-xs text-slate-400">Description</div>
            <textarea
              className="ch-textarea mt-1 min-h-[96px]"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Add scope, timeline, and constraints"
            />
          </div>
          {err ? <div className="mt-2 text-sm text-rose-300">{err}</div> : null}
          <div className="mt-3 flex items-center justify-between">
            <button
              disabled={busy}
              onClick={async () => {
                setErr(null);
                setBusy(true);
                try {
                  await api.post(
                    "/market/requests",
                    {
                      title,
                      description,
                      city,
                      budget_min: Number(budgetMin || 0),
                      budget_max: Number(budgetMax || 0)
                    },
                    token
                  );
                  setTitle("");
                  setCity("");
                  setBudgetMin("0");
                  setBudgetMax("0");
                  setDescription("");
                  setOpen(false);
                  await onCreated();
                } catch (e: any) {
                  setErr(e?.message || "Failed to create");
                } finally {
                  setBusy(false);
                }
              }}
              className="ch-btn-primary disabled:opacity-60"
            >
              {busy ? "Creating..." : "Create"}
            </button>
            <div className="text-xs text-slate-400">Companies can connect after you post.</div>
          </div>
        </div>
      ) : null}
    </div>
  );
}

function RequestCard({
  req,
  role,
  token,
  onAction
}: {
  req: BuildRequest;
  role: "company" | "client";
  token: string;
  onAction: () => Promise<void>;
}) {
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [confirmDelete, setConfirmDelete] = useState(false);

  return (
    <div className="rounded-md bg-black/20 p-4 ring-1 ring-white/10">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div>
          <div className="text-sm font-semibold text-slate-50">{req.title}</div>
          <div className="mt-1 text-xs text-slate-400">
            {req.city || "-"} - {req.status} - #{req.id}
          </div>
        </div>
        <div className="text-xs text-teal-200">
          {req.budget_min || req.budget_max ? `INR ${req.budget_min}-${req.budget_max}` : "Budget: -"}
        </div>
      </div>
      {req.description ? <div className="mt-3 text-sm text-slate-300">{req.description}</div> : null}
      {err ? <div className="mt-2 text-sm text-rose-300">{err}</div> : null}

      {role === "company" ? (
        <div className="mt-3 flex items-center justify-between">
          <button
            disabled={busy}
            onClick={async () => {
              setErr(null);
              setBusy(true);
              try {
                await api.post("/market/connections", { request_id: req.id }, token);
                await onAction();
              } catch (e: any) {
                setErr(e?.message || "Failed to connect");
              } finally {
                setBusy(false);
              }
            }}
            className="ch-btn-ghost px-3 py-2 disabled:opacity-60"
          >
            {busy ? "Connecting..." : "Connect"}
          </button>
          <div className="text-xs text-slate-400">Client accepts to start chat.</div>
        </div>
      ) : (
        <div className="mt-3 flex items-center justify-between">
          <div className="flex flex-wrap items-center gap-2">
            {!confirmDelete ? (
              <button
                disabled={busy}
                onClick={() => setConfirmDelete(true)}
                className="inline-flex items-center gap-2 rounded-md bg-rose-500/15 px-3 py-2 text-sm text-rose-50 ring-1 ring-rose-400/25 hover:bg-rose-500/20 disabled:opacity-60"
              >
                <Trash2 className="h-4 w-4" />
                Delete
              </button>
            ) : (
              <>
                <div className="rounded-md bg-rose-500/10 px-3 py-2 text-sm text-rose-100 ring-1 ring-rose-400/20">
                  Are you sure to delete this request?
                </div>
                <button
                  disabled={busy}
                  onClick={async () => {
                    setErr(null);
                    setBusy(true);
                    try {
                      await api.del(`/market/requests/${req.id}`, token);
                      await onAction();
                    } catch (e: any) {
                      setErr(e?.message || "Failed to delete request");
                    } finally {
                      setBusy(false);
                      setConfirmDelete(false);
                    }
                  }}
                  className="inline-flex items-center gap-2 rounded-md bg-rose-500/20 px-3 py-2 text-sm text-rose-50 ring-1 ring-rose-400/30 hover:bg-rose-500/25 disabled:opacity-60"
                >
                  {busy ? "Deleting..." : "Yes, delete"}
                </button>
                <button
                  disabled={busy}
                  onClick={() => setConfirmDelete(false)}
                  className="inline-flex items-center gap-2 rounded-md bg-white/5 px-3 py-2 text-sm text-slate-100 ring-1 ring-white/10 hover:bg-white/10 disabled:opacity-60"
                >
                  Cancel
                </button>
              </>
            )}
          </div>
          <div className="text-xs text-slate-400">Remove old requests you no longer want to share.</div>
        </div>
      )}
    </div>
  );
}


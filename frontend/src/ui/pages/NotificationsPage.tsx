import React, { useEffect, useMemo, useState } from "react";
import { Check, MessageCircle, X } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";

import { api } from "../../utils/api";
import { useAuth } from "../../state/auth";
import { useNotifications } from "../../state/notifications";
import { BackButton } from "../components/BackButton";
import { Surface } from "../components/Surface";

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

export function NotificationsPage() {
  const nav = useNavigate();
  const { user, token } = useAuth();
  const { notifications, refresh } = useNotifications();
  const [incoming, setIncoming] = useState<CompanyIncomingItem[]>([]);
  const [inbox, setInbox] = useState<InboxItem[]>([]);
  const [error, setError] = useState<string | null>(null);

  const load = async () => {
    if (!token || !user) return;
    setError(null);
    try {
      if (user.role === "company") {
        const [incomingItems, inboxItems] = await Promise.all([
          api.get<CompanyIncomingItem[]>("/market/company-incoming", token),
          api.get<InboxItem[]>("/market/inbox", token)
        ]);
        setIncoming(incomingItems);
        setInbox(inboxItems);
      } else {
        const inboxItems = await api.get<InboxItem[]>("/market/inbox", token);
        setInbox(inboxItems);
        setIncoming([]);
      }
      await refresh();
    } catch (e: any) {
      setError(e?.message || "Failed to load notifications");
    }
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token, user?.id]);

  const pendingIncoming = useMemo(() => incoming.filter((x) => x.status === "pending"), [incoming]);
  const acceptedIncoming = useMemo(() => incoming.filter((x) => x.status === "accepted"), [incoming]);
  const unreadChats = useMemo(() => inbox.filter((x) => x.unread_count > 0), [inbox]);

  if (!user || !token) return null;

  if (user.role !== "company") {
    return (
      <div className="mx-auto w-full max-w-5xl px-4 py-10">
        <BackButton className="mb-4" />
        <Surface className="p-6">
          <div className="text-xs text-slate-400">Notifications</div>
          <div className="mt-2 text-2xl font-semibold tracking-tight text-slate-50">Your updates</div>
          <div className="mt-4 grid gap-3">
            {unreadChats.map((item) => (
              <button
                key={item.connection_id}
                onClick={() => nav(`/chat?c=${item.connection_id}`)}
                className="w-full rounded-md bg-black/20 px-4 py-3 text-left ring-1 ring-white/10 hover:bg-white/5"
              >
                <div className="flex items-center justify-between gap-2">
                  <div className="text-sm font-semibold text-slate-50">{item.counterpart_name}</div>
                  <div className="text-xs text-teal-200">{item.unread_count} unread</div>
                </div>
                <div className="mt-1 text-xs text-slate-300">
                  {item.last_message_body || "Open chat"}
                </div>
              </button>
            ))}
            {!unreadChats.length ? (
              <div className="rounded-md bg-black/20 p-4 text-sm text-slate-300 ring-1 ring-white/10">
                No new notifications right now.
              </div>
            ) : null}
          </div>
        </Surface>
      </div>
    );
  }

  return (
    <div className="mx-auto w-full max-w-6xl px-4 py-10">
      <BackButton className="mb-4" />
      <div>
        <div className="text-xs text-slate-400">Notifications</div>
        <div className="mt-2 text-2xl font-semibold tracking-tight text-slate-50">Client requests and updates</div>
        <div className="mt-1 text-sm text-slate-300">
          Review incoming client requests, accept or reject them, and jump into active chats.
        </div>
      </div>

      {error ? <div className="mt-4 text-sm text-rose-300">{error}</div> : null}

      <div className="mt-6 grid grid-cols-1 gap-4 md:grid-cols-3">
        <Surface className="p-5">
          <div className="text-xs text-slate-400">Pending</div>
          <div className="mt-2 text-3xl font-semibold tracking-tight text-amber-300">{pendingIncoming.length}</div>
          <div className="mt-1 text-sm text-slate-300">Client requests waiting for your response</div>
        </Surface>
        <Surface className="p-5">
          <div className="text-xs text-slate-400">Accepted</div>
          <div className="mt-2 text-3xl font-semibold tracking-tight text-teal-300">{acceptedIncoming.length}</div>
          <div className="mt-1 text-sm text-slate-300">Requests you already accepted</div>
        </Surface>
        <Surface className="p-5">
          <div className="text-xs text-slate-400">Unread chats</div>
          <div className="mt-2 text-3xl font-semibold tracking-tight text-sky-300">
            {Object.values(notifications?.unread_by_connection || {}).reduce((a, b) => a + b, 0)}
          </div>
          <div className="mt-1 text-sm text-slate-300">Messages waiting in chat</div>
        </Surface>
      </div>

      <div className="mt-6 grid grid-cols-1 gap-4 lg:grid-cols-[1.3fr_0.9fr]">
        <Surface className="p-5">
          <div className="text-sm font-semibold text-slate-50">Incoming client requests</div>
          <div className="mt-4 grid gap-3">
            {incoming.map((item) => (
              <CompanyIncomingCard key={item.connection_id} item={item} token={token} onAction={load} />
            ))}
            {!incoming.length ? (
              <div className="rounded-md bg-black/20 p-4 text-sm text-slate-300 ring-1 ring-white/10">
                No client notifications yet.
              </div>
            ) : null}
          </div>
        </Surface>

        <Surface className="p-5">
          <div className="text-sm font-semibold text-slate-50">Chat notifications</div>
          <div className="mt-4 grid gap-3">
            {unreadChats.map((item) => (
              <button
                key={item.connection_id}
                onClick={() => nav(`/chat?c=${item.connection_id}`)}
                className="w-full rounded-md bg-black/20 px-4 py-3 text-left ring-1 ring-white/10 hover:bg-white/5"
              >
                <div className="flex items-center justify-between gap-2">
                  <div className="text-sm font-semibold text-slate-50">{item.counterpart_name}</div>
                  <div className="text-xs text-teal-200">{item.unread_count} unread</div>
                </div>
                <div className="mt-1 text-xs text-slate-300">
                  {item.last_message_body || "Open chat"}
                </div>
              </button>
            ))}
            {!unreadChats.length ? (
              <div className="rounded-md bg-black/20 p-4 text-sm text-slate-300 ring-1 ring-white/10">
                No unread chat notifications.
              </div>
            ) : null}
          </div>
        </Surface>
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
  const [error, setError] = useState<string | null>(null);

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
      {error ? <div className="mt-2 text-sm text-rose-300">{error}</div> : null}

      <div className="mt-3 flex flex-wrap items-center justify-between gap-2">
        {item.status === "pending" ? (
          <div className="flex flex-wrap items-center gap-2">
            <button
              disabled={busy !== ""}
              onClick={async () => {
                setError(null);
                setBusy("accept");
                try {
                  await api.post(`/market/connections/${item.connection_id}/company-accept`, undefined, token);
                  await onAction();
                } catch (e: any) {
                  setError(e?.message || "Failed to accept");
                } finally {
                  setBusy("");
                }
              }}
              className="ch-btn-primary px-3 py-2 disabled:opacity-60"
            >
              <Check className="h-4 w-4" />
              {busy === "accept" ? "Accepting..." : "Accept"}
            </button>
            <button
              disabled={busy !== ""}
              onClick={async () => {
                setError(null);
                setBusy("reject");
                try {
                  await api.post(`/market/connections/${item.connection_id}/company-reject`, undefined, token);
                  await onAction();
                } catch (e: any) {
                  setError(e?.message || "Failed to reject");
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
            Open chat
          </button>
        ) : (
          <div className="text-xs text-slate-400">Rejected</div>
        )}

        <div className="text-xs text-slate-400">
          {item.status === "pending" ? "Client is waiting for your response." : "Conversation status updated."}
        </div>
      </div>
    </div>
  );
}

import React, { useEffect, useMemo, useRef, useState } from "react";
import { api, getBaseUrl } from "../../utils/api";
import { useAuth } from "../../state/auth";
import { useNotifications } from "../../state/notifications";
import { BackButton } from "../components/BackButton";
import { Surface } from "../components/Surface";
import { Check, MessageCircle, Paperclip, RefreshCw, Search, Send, Trash2, X } from "lucide-react";
import { useSearchParams } from "react-router-dom";

type Connection = { id: number; request_id: number; company_id: number; status: string; created_at: string };
type Message = {
  id: number;
  connection_id: number;
  sender_user_id: number;
  body: string;
  attachment_name: string;
  attachment_url: string;
  attachment_kind: string;
  created_at: string;
};
type CompanyProfile = { id: number; name: string; location: string };
type BuildRequest = { id: number; title: string; city: string };
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

export function ChatPage() {
  const { token, user } = useAuth();
  const { notifications, refresh: refreshNotifications } = useNotifications();
  const [params] = useSearchParams();
  const [connections, setConnections] = useState<Connection[]>([]);
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [draft, setDraft] = useState("");
  const [q, setQ] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [deletingChat, setDeletingChat] = useState(false);
  const [deletingMessageId, setDeletingMessageId] = useState<number | null>(null);
  const [companyById, setCompanyById] = useState<Record<number, CompanyProfile>>({});
  const [requestById, setRequestById] = useState<Record<number, BuildRequest>>({});
  const [inboxByConnectionId, setInboxByConnectionId] = useState<Record<number, InboxItem>>({});
  const endRef = useRef<HTMLDivElement | null>(null);
  const messagesWrapRef = useRef<HTMLDivElement | null>(null);
  const attachmentInputRef = useRef<HTMLInputElement | null>(null);

  const selected = useMemo(() => connections.find((c) => c.id === selectedId) || null, [connections, selectedId]);

  const filteredConnections = useMemo(() => {
    const t = q.trim();
    if (!t) return connections;
    return connections.filter((c) => `${c.id}`.includes(t) || `${c.request_id}`.includes(t) || `${c.company_id}`.includes(t));
  }, [connections, q]);

  const reloadConnections = async (preferredSelectedId?: number | null) => {
    if (!token) return;
    const conns = await api.get<Connection[]>("/market/connections", token);
    setConnections(conns);
    const fromQuery = Number(params.get("c") || "");
    if (fromQuery && conns.some((c) => c.id === fromQuery)) {
      setSelectedId(fromQuery);
      return;
    }
    const nextSelected = preferredSelectedId === undefined ? selectedId : preferredSelectedId;
    if (!nextSelected && conns.length) setSelectedId(conns[0].id);
    if (!conns.length) setSelectedId(null);
  };

  const loadMessages = async (connectionId: number, opts?: { stickToBottom?: boolean }) => {
    if (!token) return;
    const msgs = await api.get<Message[]>(`/market/connections/${connectionId}/messages`, token);
    const wrap = messagesWrapRef.current;
    const nearBottom = wrap ? wrap.scrollHeight - wrap.scrollTop - wrap.clientHeight < 120 : true;
    setMessages(msgs);
    if (opts?.stickToBottom || nearBottom) {
      queueMicrotask(() => endRef.current?.scrollIntoView({ block: "end" }));
    }
    refreshNotifications().catch(() => {});
  };

  useEffect(() => {
    let canceled = false;
    (async () => {
      if (!token) return;
      try {
        const [_, inbox] = await Promise.all([
          reloadConnections(),
          api.get<InboxItem[]>("/market/inbox", token).then((items) => {
            const map: Record<number, InboxItem> = {};
            for (const item of items) map[item.connection_id] = item;
            setInboxByConnectionId(map);
          })
        ]);
      } catch (e: any) {
        if (!canceled) setError(e?.message || "Failed to load connections");
      }
    })();
    return () => {
      canceled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token, user?.id]);

  useEffect(() => {
    let canceled = false;
    (async () => {
      try {
        const [companies, requests] = await Promise.all([
          api.get<CompanyProfile[]>("/market/companies"),
          api.get<BuildRequest[]>("/market/requests")
        ]);
        if (canceled) return;
        const cMap: Record<number, CompanyProfile> = {};
        for (const c of companies) cMap[c.id] = c;
        const rMap: Record<number, BuildRequest> = {};
        for (const r of requests) rMap[r.id] = r;
        setCompanyById(cMap);
        setRequestById(rMap);
      } catch {
        // ignore (chat still works without names)
      }
    })();
    return () => {
      canceled = true;
    };
  }, []);

  useEffect(() => {
    let canceled = false;
    (async () => {
      if (!selectedId) return;
      try {
        await loadMessages(selectedId, { stickToBottom: true });
      } catch {
        if (!canceled) setMessages([]);
      }
    })();
    return () => {
      canceled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedId]);

  if (!user || !token) return null;

  const canChat = selected?.status === "accepted";
  const showCompanyActions = user.role === "company" && selected?.status === "pending";
  const selectedCompanyName = selected ? companyById[selected.company_id]?.name : null;
  const selectedRequestTitle = selected ? requestById[selected.request_id]?.title : null;
  const selectedInbox = selected ? inboxByConnectionId[selected.id] : null;
  const selectedClientName = selectedInbox?.client_name || null;
  const canUpload = Boolean(selected && canChat);

  const attachmentUrl = (url: string) => {
    if (!url) return "";
    if (url.startsWith("http://") || url.startsWith("https://")) return url;
    return `${getBaseUrl()}${url}`;
  };

  return (
    <div className="mx-auto w-full max-w-6xl px-4 py-10">
      <BackButton className="mb-4" />
      <div className="flex items-end justify-between">
        <div>
          <div className="text-xs text-slate-400">Chat</div>
          <div className="mt-1 text-2xl font-semibold tracking-tight">Messages</div>
        </div>
      </div>

      {error ? <div className="mt-4 text-sm text-rose-300">{error}</div> : null}

      <div className="mt-6 grid grid-cols-1 gap-4 lg:grid-cols-3">
        <Surface className="p-4 lg:col-span-1">
          <div className="flex items-center justify-between gap-2">
            <div className="text-sm font-semibold">Chats</div>
            <MessageCircle className="h-4 w-4 text-slate-400" />
          </div>

          <div className="mt-3 flex items-center gap-2 rounded-md bg-black/25 px-3 py-2 ring-1 ring-white/10">
            <Search className="h-4 w-4 text-slate-400" />
            <input
              className="w-full bg-transparent text-sm text-slate-100 placeholder:text-slate-500 focus:outline-none"
              placeholder="Search by id..."
              value={q}
              onChange={(e) => setQ(e.target.value)}
            />
          </div>

          <div className="mt-3 space-y-2">
            {filteredConnections.map((c) => (
              <button
                key={c.id}
                onClick={() => setSelectedId(c.id)}
                className={[
                  "w-full rounded-md px-3 py-2 text-left text-sm ring-1 ring-white/10 transition-colors",
                  selectedId === c.id ? "bg-white/10" : "bg-black/20 hover:bg-white/5"
                ].join(" ")}
              >
                <div className="flex items-center justify-between">
                  <div className="font-semibold">
                    {user.role === "client"
                      ? companyById[c.company_id]?.name || `Company #${c.company_id}`
                      : inboxByConnectionId[c.id]?.client_name || `Client for request #${c.request_id}`}
                  </div>
                  <div className="flex items-center gap-2">
                    {notifications?.unread_by_connection?.[c.id] ? (
                      <div className="grid h-5 min-w-5 place-items-center rounded-full bg-teal-500/30 px-1 text-[11px] font-semibold text-teal-50 ring-1 ring-teal-400/35">
                        {notifications.unread_by_connection[c.id] > 99 ? "99+" : notifications.unread_by_connection[c.id]}
                      </div>
                    ) : null}
                    <div className="text-xs text-teal-200">{c.status}</div>
                  </div>
                </div>
                <div className="mt-0.5 text-xs text-slate-400">
                  {user.role === "company" ? (
                    <>
                      {inboxByConnectionId[c.id]?.request_title || requestById[c.request_id]?.title || `Request #${c.request_id}`} -{" "}
                      {requestById[c.request_id]?.city || "-"}
                    </>
                  ) : (
                    <>
                      {requestById[c.request_id]?.title ? (
                        <>
                          {requestById[c.request_id]?.title} - {requestById[c.request_id]?.city || "-"}
                        </>
                      ) : (
                        <>Request #{c.request_id}</>
                      )}{" "}
                      -{" "}
                      {companyById[c.company_id]?.name ? (
                        <>
                          {companyById[c.company_id]?.name} - {companyById[c.company_id]?.location || "-"}
                        </>
                      ) : (
                        <>Company #{c.company_id}</>
                      )}
                    </>
                  )}
                </div>
              </button>
            ))}

            {connections.length === 0 ? (
              <div className="rounded-md bg-black/20 p-3 text-sm text-slate-300 ring-1 ring-white/10">
                No chats yet. Use Companies - Connect, or connect from Dashboard.
              </div>
            ) : null}
          </div>
        </Surface>

        <Surface className="p-0 lg:col-span-2">
          <div className="flex items-center justify-between border-b border-white/10 px-4 py-3">
            <div>
              <div className="text-sm font-semibold">
                {selected
                  ? user.role === "client"
                    ? selectedCompanyName || `Company #${selected.company_id}`
                    : selectedClientName || `Client for request #${selected.request_id}`
                  : "Select a chat"}
              </div>
              {selected ? (
                <div className="text-xs text-slate-400">
                  {user.role === "client" ? (
                    <>
                      {selectedRequestTitle ? selectedRequestTitle : `Request #${selected.request_id}`} -{" "}
                      {selectedCompanyName ? selectedCompanyName : `Company #${selected.company_id}`}
                    </>
                  ) : (
                    <>
                      {selectedClientName || "Client"} -{" "}
                      {selectedInbox?.request_title || selectedRequestTitle || `Request #${selected.request_id}`}
                    </>
                  )}
                </div>
              ) : null}
            </div>

            {selected ? (
              <div className="flex items-center gap-2">
                <button
                  onClick={() => selected && loadMessages(selected.id, { stickToBottom: false }).catch(() => {})}
                  className="inline-flex h-9 w-9 items-center justify-center rounded-md bg-white/5 text-slate-100 ring-1 ring-white/10 hover:bg-white/10"
                  title="Refresh messages"
                >
                  <RefreshCw className="h-4 w-4" />
                </button>
                {showCompanyActions ? (
                  <>
                    <button
                      onClick={async () => {
                        setError(null);
                        try {
                          await api.post(`/market/connections/${selected.id}/company-accept`, undefined, token);
                          await reloadConnections();
                        } catch (e: any) {
                          setError(e?.message || "Failed to accept");
                        }
                      }}
                      className="inline-flex items-center gap-2 rounded-md bg-teal-500/20 px-3 py-2 text-sm text-teal-50 ring-1 ring-teal-400/30 hover:bg-teal-500/25"
                      title="Accept"
                    >
                      <Check className="h-4 w-4" />
                      Accept {selectedClientName || "client"}
                    </button>
                    <button
                      onClick={async () => {
                        setError(null);
                        try {
                          await api.post(`/market/connections/${selected.id}/company-reject`, undefined, token);
                          await reloadConnections();
                        } catch (e: any) {
                          setError(e?.message || "Failed to reject");
                        }
                      }}
                      className="inline-flex items-center gap-2 rounded-md bg-white/5 px-3 py-2 text-sm text-slate-100 ring-1 ring-white/10 hover:bg-white/10"
                      title="Reject"
                    >
                      <X className="h-4 w-4" />
                      Reject {selectedClientName || "client"}
                    </button>
                  </>
                ) : null}

                <button
                  disabled={deletingChat || busy}
                  onClick={async () => {
                    if (!selected) return;
                    const ok = window.confirm("Delete this chat? This will remove the conversation and all messages.");
                    if (!ok) return;
                    setDeletingChat(true);
                    setError(null);
                    try {
                      await api.del(`/market/connections/${selected.id}`, token);
                      setMessages([]);
                      await reloadConnections(null);
                    } catch (e: any) {
                      setError(e?.message || "Failed to delete chat");
                    } finally {
                      setDeletingChat(false);
                    }
                  }}
                  className="inline-flex h-9 w-9 items-center justify-center rounded-md bg-rose-500/15 text-rose-50 ring-1 ring-rose-400/25 hover:bg-rose-500/20 disabled:opacity-60"
                  title="Delete chat"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            ) : null}
          </div>

          <div
            ref={messagesWrapRef}
            className="relative h-[460px] overflow-auto bg-[radial-gradient(circle_at_20%_20%,rgba(20,184,166,0.08),transparent_35%),radial-gradient(circle_at_70%_30%,rgba(56,189,248,0.06),transparent_40%),linear-gradient(to_bottom,rgba(0,0,0,0.10),rgba(0,0,0,0.25))] px-4 py-3"
          >
            {!selected ? (
              <div className="rounded-md bg-black/20 p-4 text-sm text-slate-300 ring-1 ring-white/10">
                Select a chat from the left.
              </div>
            ) : user.role === "client" && selected.status === "pending" ? (
              <div className="rounded-md bg-black/20 p-4 text-sm text-slate-300 ring-1 ring-white/10">
                Your request has been sent to <span className="font-semibold text-slate-100">{selectedCompanyName || "this company"}</span>.
                Once the company accepts it, this chat will open for communication.
              </div>
            ) : messages.length ? (
              <div className="space-y-2">
                {messages.map((m) => (
                  <div
                    key={m.id}
                    className={[
                      "group relative max-w-[85%] rounded-2xl px-3 py-2 text-sm shadow-glow ring-1 ring-white/10",
                      m.sender_user_id === user.id
                        ? "ml-auto bg-teal-500/15 text-slate-50"
                        : "bg-white/5 text-slate-100"
                    ].join(" ")}
                  >
                    {m.sender_user_id === user.id ? (
                      <button
                        disabled={deletingMessageId === m.id}
                        onClick={async () => {
                          const ok = window.confirm("Delete this message?");
                          if (!ok) return;
                          setDeletingMessageId(m.id);
                          setError(null);
                          try {
                            await api.del(`/market/messages/${m.id}`, token);
                            setMessages((prev) => prev.filter((x) => x.id !== m.id));
                          } catch (e: any) {
                            setError(e?.message || "Failed to delete message");
                          } finally {
                            setDeletingMessageId(null);
                          }
                        }}
                        className="absolute right-2 top-2 grid h-7 w-7 place-items-center rounded-full bg-black/30 text-slate-200 opacity-0 ring-1 ring-white/10 transition-opacity hover:bg-black/40 group-hover:opacity-100 disabled:opacity-60"
                        title="Delete message"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    ) : null}
                    {m.body ? <div className="whitespace-pre-wrap pr-8">{m.body}</div> : null}
                    {m.attachment_url ? (
                      <div className={m.body ? "mt-2" : "pr-8"}>
                        {m.attachment_kind === "image" ? (
                          <a href={attachmentUrl(m.attachment_url)} target="_blank" rel="noreferrer">
                            <img
                              src={attachmentUrl(m.attachment_url)}
                              alt={m.attachment_name || "attachment"}
                              className="max-h-56 rounded-xl object-cover ring-1 ring-white/10"
                            />
                          </a>
                        ) : (
                          <a
                            href={attachmentUrl(m.attachment_url)}
                            target="_blank"
                            rel="noreferrer"
                            className="inline-flex items-center gap-2 rounded-md bg-black/20 px-3 py-2 text-sm text-teal-100 ring-1 ring-white/10 hover:bg-black/30"
                          >
                            <Paperclip className="h-4 w-4" />
                            {m.attachment_name || "Open file"}
                          </a>
                        )}
                      </div>
                    ) : null}
                    <div className="mt-1 text-[11px] text-slate-400">{new Date(m.created_at).toLocaleString()}</div>
                  </div>
                ))}
                <div ref={endRef} />
              </div>
            ) : (
              <div className="rounded-md bg-black/20 p-4 text-sm text-slate-300 ring-1 ring-white/10">
                No messages yet.
              </div>
            )}
          </div>

          <div className="border-t border-white/10 px-3 py-3">
            <div className="flex items-end gap-2">
              {canUpload ? (
                <>
                  <input
                    ref={attachmentInputRef}
                    type="file"
                    multiple
                    className="hidden"
                    onChange={async (e) => {
                      if (!selected) return;
                      const files = Array.from(e.target.files || []);
                      if (!files.length) return;
                      setBusy(true);
                      setError(null);
                      try {
                        const form = new FormData();
                        for (const file of files) form.append("files", file);
                        if (draft.trim()) form.append("body", draft.trim());
                        const res = await fetch(`${getBaseUrl()}/market/connections/${selected.id}/attachments`, {
                          method: "POST",
                          headers: { Authorization: `Bearer ${token}` },
                          body: form
                        });
                        if (!res.ok) {
                          const j = await res.json().catch(() => null);
                          throw new Error(j?.detail || "Failed to upload attachment");
                        }
                        const sent = (await res.json()) as Message[];
                        setMessages((prev) => [...prev, ...sent]);
                        setDraft("");
                        queueMicrotask(() => endRef.current?.scrollIntoView({ block: "end" }));
                        refreshNotifications().catch(() => {});
                      } catch (e: any) {
                        setError(e?.message || "Failed to upload attachment");
                      } finally {
                        e.target.value = "";
                        setBusy(false);
                      }
                    }}
                  />
                  <button
                    type="button"
                    disabled={!selected || !canChat || busy}
                    onClick={() => attachmentInputRef.current?.click()}
                    className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-white/5 text-slate-100 ring-1 ring-white/10 hover:bg-white/10 disabled:opacity-60"
                    title="Attach images or files"
                  >
                    <Paperclip className="h-5 w-5" />
                  </button>
                </>
              ) : null}
              <textarea
                disabled={!selected || !canChat || busy}
                className="min-h-[44px] max-h-[140px] w-full resize-none rounded-2xl bg-black/30 px-4 py-3 text-sm ring-1 ring-white/10 placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-teal-400/40 disabled:opacity-60"
                placeholder={selected ? (canChat ? "Message..." : "Accept the connection to chat") : "Select a chat"}
                value={draft}
                onChange={(e) => setDraft(e.target.value)}
              />
              <button
                disabled={!selected || !canChat || busy || !draft.trim()}
                onClick={async () => {
                  if (!selected) return;
                  const body = draft.trim();
                  if (!body) return;
                  setBusy(true);
                  setError(null);
                  try {
                    const msg = await api.post<Message>(
                      `/market/connections/${selected.id}/messages`,
                      { body },
                      token
                    );
                    setMessages((prev) => [...prev, msg]);
                    setDraft("");
                    queueMicrotask(() => endRef.current?.scrollIntoView({ block: "end" }));
                  } catch (e: any) {
                    setError(e?.message || "Failed to send");
                  } finally {
                    setBusy(false);
                  }
                }}
                className="inline-flex h-[44px] w-[44px] items-center justify-center rounded-full bg-teal-500/20 text-teal-50 ring-1 ring-teal-400/30 hover:bg-teal-500/25 disabled:opacity-60"
                title="Send"
              >
                <Send className="h-4 w-4" />
              </button>
            </div>
          </div>
        </Surface>
      </div>
    </div>
  );
}

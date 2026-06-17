import React, { useMemo, useState } from "react";
import { KeyRound, RefreshCw } from "lucide-react";

import { BackButton } from "../components/BackButton";
import { Surface } from "../components/Surface";

type AdminUserRow = {
  id: number;
  email: string;
  role: "company" | "client";
  created_at: string;
  hashed_password: string;
};

const KEY_STORAGE = "constructhub_admin_key";

function getApiBase(): string {
  const v = (import.meta as any).env?.VITE_API_BASE_URL as string | undefined;
  return (v && v.trim()) || "http://127.0.0.1:8000";
}

export function AdminUsersPage() {
  const [adminKey, setAdminKey] = useState(() => sessionStorage.getItem(KEY_STORAGE) || "");
  const [users, setUsers] = useState<AdminUserRow[]>([]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const headers = useMemo<HeadersInit>(() => {
    const h: Record<string, string> = {};
    const k = adminKey.trim();
    if (k) h["X-Admin-Key"] = k;
    return h;
  }, [adminKey]);

  const load = async () => {
    setBusy(true);
    setError(null);
    try {
      const res = await fetch(`${getApiBase()}/admin/users`, { headers });
      if (!res.ok) {
        const j = await res.json().catch(() => null);
        throw new Error(j?.detail || `${res.status} ${res.statusText}`);
      }
      setUsers((await res.json()) as AdminUserRow[]);
    } catch (e: any) {
      setError(e?.message || "Failed to load");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="mx-auto w-full max-w-6xl px-4 py-10">
      <BackButton className="mb-4" />
      <div>
        <div className="text-xs text-slate-400">Admin</div>
        <div className="mt-1 text-2xl font-semibold tracking-tight text-slate-50">Users table</div>
        <div className="mt-1 text-sm text-slate-300">
          Passwords are not stored in plain text. This shows <span className="text-slate-100">hashed_password</span>.
        </div>
      </div>

      <div className="mt-6 grid grid-cols-1 gap-4">
        <Surface className="p-5">
          <div className="flex flex-wrap items-center gap-3">
            <div className="inline-flex items-center gap-2 text-sm text-slate-200">
              <KeyRound className="h-4 w-4 text-teal-300" />
              Admin key
            </div>
            <input
              className="ch-input flex-1"
              placeholder="X-Admin-Key"
              value={adminKey}
              onChange={(e) => {
                setAdminKey(e.target.value);
                sessionStorage.setItem(KEY_STORAGE, e.target.value);
              }}
            />
            <button disabled={busy} onClick={load} className="ch-btn-ghost px-3 py-2" title="Refresh">
              <RefreshCw className="h-4 w-4" />
              Refresh
            </button>
          </div>
          {error ? <div className="mt-3 text-sm text-rose-300">{error}</div> : null}
        </Surface>

        <Surface className="overflow-hidden">
          <div className="overflow-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-black/30 text-xs text-slate-300">
                <tr>
                  <th className="whitespace-nowrap px-4 py-3">id</th>
                  <th className="whitespace-nowrap px-4 py-3">email</th>
                  <th className="whitespace-nowrap px-4 py-3">role</th>
                  <th className="whitespace-nowrap px-4 py-3">created_at</th>
                  <th className="whitespace-nowrap px-4 py-3">hashed_password</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/10">
                {users.map((u) => (
                  <tr key={u.id} className="hover:bg-white/5">
                    <td className="whitespace-nowrap px-4 py-3 text-slate-200">{u.id}</td>
                    <td className="whitespace-nowrap px-4 py-3 text-slate-100">{u.email}</td>
                    <td className="whitespace-nowrap px-4 py-3 text-teal-200">{u.role}</td>
                    <td className="whitespace-nowrap px-4 py-3 text-slate-300">
                      {new Date(u.created_at).toLocaleString()}
                    </td>
                    <td className="px-4 py-3 font-mono text-xs text-slate-300">{u.hashed_password}</td>
                  </tr>
                ))}
                {!users.length ? (
                  <tr>
                    <td colSpan={5} className="px-4 py-6 text-sm text-slate-300">
                      No users loaded.
                    </td>
                  </tr>
                ) : null}
              </tbody>
            </table>
          </div>
        </Surface>
      </div>
    </div>
  );
}

import React, { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { BackButton } from "../components/BackButton";
import { Surface } from "../components/Surface";
import { Role, useAuth } from "../../state/auth";

function Segmented({
  value,
  onChange
}: {
  value: Role;
  onChange: (v: Role) => void;
}) {
  return (
    <div className="inline-flex rounded-md bg-black/30 p-1 ring-1 ring-white/10">
      {(["client", "company"] as Role[]).map((x) => (
        <button
          key={x}
          onClick={() => onChange(x)}
          className={[
            "rounded-md px-3 py-2 text-sm transition-colors",
            value === x ? "bg-white/10 text-white" : "text-slate-300 hover:text-white"
          ].join(" ")}
        >
          {x === "client" ? "Client" : "Company"}
        </button>
      ))}
    </div>
  );
}

export function LoginPage() {
  const nav = useNavigate();
  const loc = useLocation() as any;
  const { login } = useAuth();
  const [role, setRole] = useState<Role>("client");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  return (
    <div className="mx-auto w-full max-w-md px-4 py-10">
      <BackButton className="mb-4" />
      <Surface className="p-6">
        <div className="text-xs text-slate-400">Login</div>
        <div className="mt-2 text-2xl font-semibold tracking-tight text-slate-50">Welcome back</div>

        <div className="mt-5">
          <div className="text-xs text-slate-400">Login as</div>
          <div className="mt-2">
            <Segmented value={role} onChange={setRole} />
          </div>
        </div>

        <div className="mt-5 grid grid-cols-1 gap-3">
          <input
            className="w-full rounded-md bg-black/30 px-3 py-2 text-sm ring-1 ring-white/10 placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-teal-400/40"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            autoComplete="email"
          />
          <input
            className="w-full rounded-md bg-black/30 px-3 py-2 text-sm ring-1 ring-white/10 placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-teal-400/40"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            type="password"
            autoComplete="current-password"
          />

          {error ? <div className="text-sm text-rose-300">{error}</div> : null}

          <button
            disabled={busy}
            onClick={async () => {
              setError(null);
              const cleanEmail = email.trim();
              const cleanPassword = password.trim();
              if (!cleanEmail && !cleanPassword) {
                setError("Email and password are required.");
                return;
              }
              if (!cleanEmail) {
                setError("Email is required.");
                return;
              }
              if (!cleanPassword) {
                setError("Password is required.");
                return;
              }
              setBusy(true);
              try {
                const me = await login(cleanEmail, cleanPassword);
                if (me.role !== role) {
                  setError(`This account is a ${me.role}. Switch to ${me.role} and login again.`);
                  return;
                }
                if (loc?.state?.from) {
                  nav(loc.state.from);
                } else {
                  nav("/dashboard");
                }
              } catch (e: any) {
                const message = String(e?.message || "Login failed");
                if (message.includes("422")) {
                  setError("Please enter both email and password.");
                } else {
                  setError(message);
                }
              } finally {
                setBusy(false);
              }
            }}
            className="rounded-md bg-teal-500/20 px-4 py-2 text-sm text-teal-50 ring-1 ring-teal-400/30 hover:bg-teal-500/25 disabled:opacity-60"
          >
            {busy ? "Signing in..." : "Sign in"}
          </button>

          <div className="text-sm text-slate-300">
            New here?{" "}
            <Link to="/register" className="text-teal-200 hover:text-teal-100">
              Create an account
            </Link>
          </div>
        </div>
      </Surface>
    </div>
  );
}


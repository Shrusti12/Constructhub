import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
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
            "px-3 py-2 text-sm rounded-md transition-colors",
            value === x ? "bg-white/10 text-white" : "text-slate-300 hover:text-white"
          ].join(" ")}
        >
          {x === "client" ? "Client" : "Company"}
        </button>
      ))}
    </div>
  );
}

export function RegisterPage() {
  const nav = useNavigate();
  const { register } = useAuth();
  const [role, setRole] = useState<Role>("client");
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  return (
    <div className="mx-auto w-full max-w-md px-4 py-10">
      <BackButton className="mb-4" />
      <Surface className="p-6">
        <div className="text-xs text-slate-400">Register</div>
        <div className="mt-2 text-2xl font-semibold tracking-tight">Create your account</div>

        <div className="mt-5">
          <div className="text-xs text-slate-400">Account type</div>
          <div className="mt-2">
            <Segmented value={role} onChange={setRole} />
          </div>
        </div>

        <div className="mt-5 grid grid-cols-1 gap-3">
          <input
            className="w-full rounded-md bg-black/30 px-3 py-2 text-sm ring-1 ring-white/10 placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-teal-400/40"
            placeholder={role === "company" ? "Company name" : "Full name"}
            value={name}
            onChange={(e) => setName(e.target.value)}
            autoComplete="name"
          />
          <input
            className="w-full rounded-md bg-black/30 px-3 py-2 text-sm ring-1 ring-white/10 placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-teal-400/40"
            placeholder="Phone number"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            autoComplete="tel"
          />
          <input
            className="w-full rounded-md bg-black/30 px-3 py-2 text-sm ring-1 ring-white/10 placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-teal-400/40"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            autoComplete="email"
          />
          <input
            className="w-full rounded-md bg-black/30 px-3 py-2 text-sm ring-1 ring-white/10 placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-teal-400/40"
            placeholder="Password (min 8 chars)"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            type="password"
            autoComplete="new-password"
          />

          {error ? <div className="text-sm text-rose-300">{error}</div> : null}

          <button
            disabled={busy}
            onClick={async () => {
              setError(null);
              const cleanName = name.trim();
              const cleanPhone = phone.trim();
              if (cleanName.length < 2) {
                setError("Please enter a valid name");
                return;
              }
              if (cleanPhone.length < 7) {
                setError("Please enter a valid phone number");
                return;
              }
              setBusy(true);
              try {
                await register({ name: cleanName, phone: cleanPhone, email, password, role });
                nav(role === "client" ? "/companies" : "/dashboard");
              } catch (e: any) {
                setError(e?.message || "Registration failed");
              } finally {
                setBusy(false);
              }
            }}
            className="rounded-md bg-teal-500/20 px-4 py-2 text-sm text-teal-50 ring-1 ring-teal-400/30 hover:bg-teal-500/25 disabled:opacity-60"
          >
            {busy ? "Creating…" : "Create account"}
          </button>

          <div className="text-sm text-slate-300">
            Already have an account?{" "}
            <Link to="/login" className="text-teal-200 hover:text-teal-100">
              Login
            </Link>
          </div>
        </div>
      </Surface>
    </div>
  );
}

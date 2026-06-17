import React, { useMemo, useState } from "react";
import { Link, NavLink, useNavigate } from "react-router-dom";
import { Building2, LogOut, Menu, Sparkles, X } from "lucide-react";
import { useAuth } from "../../state/auth";
import { useNotifications } from "../../state/notifications";
import { Surface } from "./Surface";

function NavItem({ to, label, onClick }: { to: string; label: string; onClick?: () => void }) {
  return (
    <NavLink
      to={to}
      onClick={onClick}
      className={({ isActive }) =>
        [
          "relative px-3 py-2 text-sm rounded-md transition-colors",
          isActive ? "bg-white/10 text-white" : "text-slate-200 hover:bg-white/5 hover:text-white"
        ].join(" ")
      }
    >
      {label}
    </NavLink>
  );
}

export function Navbar() {
  const nav = useNavigate();
  const { user, logout } = useAuth();
  const { notifications } = useNotifications();
  const pending = notifications?.pending_connections || 0;
  const unreadTotal = notifications ? Object.values(notifications.unread_by_connection).reduce((a, b) => a + b, 0) : 0;
  const badge = pending + unreadTotal;

  const [mobileOpen, setMobileOpen] = useState(false);

  const links = useMemo(
    () => [
      { to: "/", label: "Home" },
      { to: "/about", label: "About" },
      ...(user?.role === "company" ? [{ to: "/notifications", label: "Notifications" }] : [{ to: "/companies", label: "Companies" }]),
      ...(user?.role === "company" ? [{ to: "/projects", label: "Projects" }] : []),
      ...(user?.role === "company" ? [] : [{ to: "/ai", label: "AI Studio" }]),
      ...(user ? [{ to: "/dashboard", label: "Dashboard" }] : []),
      ...(user ? [{ to: "/chat", label: "Chat" }] : [])
    ],
    [user]
  );

  return (
    <div className="sticky top-0 z-40 border-b border-white/10 bg-slate-950/65 backdrop-blur">
      <div className="mx-auto flex w-full max-w-6xl items-center justify-between px-4 py-3">
        <Link to="/" className="flex items-center gap-2">
          <div className="grid h-10 w-10 place-items-center rounded-lg bg-teal-500/15 ring-1 ring-teal-400/25">
            <Building2 className="h-5 w-5 text-teal-300" />
          </div>
          <div className="leading-tight">
            <div className="text-sm font-semibold tracking-tight text-slate-50">ConstructHub</div>
            <div className="text-xs text-slate-400">Companies meet clients</div>
          </div>
        </Link>

        <div className="hidden items-center gap-1 md:flex">
          {links.map((l) =>
            l.to === "/chat" && user ? (
              <div key={l.to} className="relative">
                <NavItem to={l.to} label={l.label} />
                {unreadTotal > 0 ? (
                  <div className="absolute -right-1 -top-1 grid h-5 min-w-5 place-items-center rounded-full bg-teal-500/40 px-1 text-[11px] font-semibold text-teal-50 ring-1 ring-teal-400/40">
                    {unreadTotal > 99 ? "99+" : unreadTotal}
                  </div>
                ) : null}
              </div>
            ) : l.to === "/notifications" && user?.role === "company" ? (
              <div key={l.to} className="relative">
                <NavItem to={l.to} label={l.label} />
                {pending > 0 ? (
                  <div className="absolute -right-1 -top-1 grid h-5 min-w-5 place-items-center rounded-full bg-amber-500/40 px-1 text-[11px] font-semibold text-amber-50 ring-1 ring-amber-400/40">
                    {pending > 99 ? "99+" : pending}
                  </div>
                ) : null}
              </div>
            ) : (
              <NavItem key={l.to} to={l.to} label={l.label} />
            )
          )}
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setMobileOpen((v) => !v)}
            className="ch-btn-ghost px-3 py-2 md:hidden"
            title="Menu"
          >
            {mobileOpen ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
          </button>

          {user ? (
            <>
              <div className="hidden text-xs text-slate-300 md:block">
                {user.email} - <span className="text-teal-300">{user.role}</span>
              </div>
              <button
                onClick={() => {
                  logout();
                  nav("/");
                }}
                className="ch-btn-ghost px-3 py-2"
                title="Logout"
              >
                <LogOut className="h-4 w-4" />
                <span className="hidden sm:inline">Logout</span>
              </button>
            </>
          ) : (
            <>
              <Link to="/login" className="ch-btn-ghost px-3 py-2">
                Login
              </Link>
              <Link to="/register" className="ch-btn-primary px-3 py-2">
                <Sparkles className="h-4 w-4" />
                Register
              </Link>
            </>
          )}
        </div>
      </div>

      {mobileOpen ? (
        <div className="border-t border-white/10 md:hidden">
          <div className="mx-auto w-full max-w-6xl px-4 py-3">
            <Surface className="p-2">
              <div className="grid grid-cols-2 gap-1">
                {links.map((l) => (
                  <NavItem key={l.to} to={l.to} label={l.label} onClick={() => setMobileOpen(false)} />
                ))}
              </div>
            </Surface>
          </div>
        </div>
      ) : null}
    </div>
  );
}

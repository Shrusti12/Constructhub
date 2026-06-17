import React from "react";
import { Link } from "react-router-dom";

export function Footer() {
  const year = new Date().getFullYear();
  return (
    <footer className="mt-10 border-t border-white/10">
      <div className="mx-auto w-full max-w-6xl px-4 py-10">
        <div className="grid grid-cols-1 gap-8">
          <div>
            <div className="text-sm font-semibold text-slate-50">Quick links</div>
            <div className="mt-3 grid gap-2 text-sm">
              <Link className="text-slate-300 hover:text-slate-100" to="/register">
                Register
              </Link>
              <Link className="text-slate-300 hover:text-slate-100" to="/login">
                Login
              </Link>
              <Link className="text-slate-300 hover:text-slate-100" to="/companies">
                Companies
              </Link>
              <Link className="text-slate-300 hover:text-slate-100" to="/ai">
                AI Studio
              </Link>
            </div>
          </div>
        </div>

        <div className="mt-8 flex flex-col gap-2 border-t border-white/10 pt-6 text-xs text-slate-400 md:flex-row md:items-center md:justify-between">
          <div>Copyright (c) {year} ConstructHub. All rights reserved.</div>
          <div className="text-slate-500">College project demo</div>
        </div>
      </div>
    </footer>
  );
}

import React, { useState } from "react";
import { Surface } from "../components/Surface";

export function ContactPage() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [sent, setSent] = useState(false);

  return (
    <div className="mx-auto w-full max-w-2xl px-4 py-10">
      <Surface className="p-6">
        <div className="text-xs text-slate-400">Contact</div>
        <div className="mt-6 grid grid-cols-1 gap-3">
          <input
            className="w-full rounded-md bg-black/30 px-3 py-2 text-sm ring-1 ring-white/10 placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-teal-400/40"
            placeholder="Name"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
          <input
            className="w-full rounded-md bg-black/30 px-3 py-2 text-sm ring-1 ring-white/10 placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-teal-400/40"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
          <textarea
            className="min-h-[120px] w-full rounded-md bg-black/30 px-3 py-2 text-sm ring-1 ring-white/10 placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-teal-400/40"
            placeholder="Message"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
          />
          <div className="flex items-center justify-between">
            <button
              onClick={() => setSent(true)}
              className="rounded-md bg-teal-500/20 px-4 py-2 text-sm text-teal-50 ring-1 ring-teal-400/30 hover:bg-teal-500/25"
            >
              Send
            </button>
            {sent ? <div className="text-xs text-teal-200">Saved locally (demo).</div> : null}
          </div>
        </div>
      </Surface>
    </div>
  );
}

import React from "react";
import { ArrowLeft } from "lucide-react";
import { useNavigate } from "react-router-dom";

export function BackButton({ className = "" }: { className?: string }) {
  const navigate = useNavigate();

  return (
    <button
      type="button"
      onClick={() => navigate(-1)}
      className={[
        "inline-flex items-center gap-2 rounded-md bg-white/5 px-3 py-2 text-sm text-slate-100 ring-1 ring-white/10 transition hover:bg-white/10",
        className
      ].join(" ")}
    >
      <ArrowLeft className="h-4 w-4" />
      Back
    </button>
  );
}

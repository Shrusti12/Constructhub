import React from "react";

export function Surface({
  children,
  className = ""
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={[
        "group relative overflow-hidden rounded-lg bg-white/[0.045] ring-1 ring-white/10 shadow-glow backdrop-blur-sm",
        "transition-transform duration-300 will-change-transform hover:-translate-y-[1px]",
        className
      ].join(" ")}
    >
      <div className="pointer-events-none absolute inset-0 opacity-0 transition-opacity duration-500 group-hover:opacity-100">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_18%_20%,rgba(20,184,166,0.18),transparent_45%),radial-gradient(circle_at_78%_30%,rgba(56,189,248,0.14),transparent_46%),radial-gradient(circle_at_50%_95%,rgba(251,146,60,0.10),transparent_45%)]" />
      </div>
      <div className="relative z-10">{children}</div>
    </div>
  );
}

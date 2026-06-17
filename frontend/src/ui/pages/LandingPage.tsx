import React from "react";
import { motion } from "framer-motion";
import { ArrowRight, Bot, Briefcase, CheckCircle2, MessageSquare, ShieldCheck } from "lucide-react";
import { Link } from "react-router-dom";
import { Surface } from "../components/Surface";
import { StarfieldHero } from "../components/StarfieldHero";

function Feature({
  icon,
  title,
  body
}: {
  icon: React.ReactNode;
  title: string;
  body: string;
}) {
  return (
    <Surface className="p-5">
      <div className="flex items-start gap-3">
        <div className="grid h-10 w-10 place-items-center rounded-md bg-teal-500/15 ring-1 ring-teal-400/25">
          {icon}
        </div>
        <div>
          <div className="text-sm font-semibold text-slate-50">{title}</div>
          <div className="mt-1 text-sm text-slate-300">{body}</div>
        </div>
      </div>
    </Surface>
  );
}

function Step({ n, title, body }: { n: string; title: string; body: string }) {
  return (
    <Surface className="p-5">
      <div className="flex items-start gap-3">
        <div className="grid h-10 w-10 place-items-center rounded-md bg-white/5 ring-1 ring-white/10 text-sm font-semibold text-slate-50">
          {n}
        </div>
        <div>
          <div className="text-sm font-semibold text-slate-50">{title}</div>
          <div className="mt-1 text-sm text-slate-300">{body}</div>
        </div>
      </div>
    </Surface>
  );
}

export function LandingPage() {
  return (
    <div>
      <div className="relative overflow-hidden border-b border-white/10">
        <StarfieldHero />
        <div className="relative z-10 mx-auto grid w-full max-w-6xl grid-cols-1 gap-10 px-4 py-14 md:grid-cols-2 md:py-20">
          <div>
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              className="ch-chip"
            >
              <span className="mr-2 inline-block h-2 w-2 rounded-full bg-teal-400" />
              Connect companies and clients faster
            </motion.div>

            <motion.h1
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, delay: 0.05 }}
              className="mt-5 text-4xl font-semibold tracking-tight text-slate-50 md:text-5xl"
            >
              Build smarter with <span className="text-teal-300">ConstructHub</span>
            </motion.h1>

            <motion.p
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, delay: 0.1 }}
              className="mt-4 text-base leading-relaxed text-slate-300"
            >
              Clients post build requests. Companies respond. Once accepted, chat in one place and keep the project moving.
            </motion.p>

            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, delay: 0.15 }}
              className="mt-6 flex flex-wrap items-center gap-3"
            >
              <Link to="/register" className="ch-btn-primary">
                Get started
                <ArrowRight className="h-4 w-4" />
              </Link>
              <Link to="/companies" className="ch-btn-ghost">
                Browse companies
                <Briefcase className="h-4 w-4 text-teal-300" />
              </Link>
              <Link to="/ai" className="ch-btn-ghost">
                Try AI Studio
                <Bot className="h-4 w-4 text-teal-300" />
              </Link>
            </motion.div>

            <div className="mt-7 flex flex-wrap items-center gap-2 text-xs text-slate-300">
              <span className="ch-chip">
                <CheckCircle2 className="h-3.5 w-3.5 text-teal-300" />
                Role-based accounts
              </span>
              <span className="ch-chip">
                <CheckCircle2 className="h-3.5 w-3.5 text-teal-300" />
                Connection workflow
              </span>
              <span className="ch-chip">
                <CheckCircle2 className="h-3.5 w-3.5 text-teal-300" />
                Chat after acceptance
              </span>
            </div>
          </div>

          <div className="md:pl-4">
            <motion.div
              initial={{ opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, delay: 0.05 }}
            >
              <Surface className="p-5">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-xs text-slate-400">Today</div>
                    <div className="text-sm font-semibold text-slate-50">Project feed</div>
                  </div>
                  <div className="ch-chip">Live demo</div>
                </div>

                <div className="mt-4 space-y-3">
                  {[
                    { t: "2BHK Renovation", c: "Pune", b: "INR 8L-12L" },
                    { t: "Small Office Fit-out", c: "Bengaluru", b: "INR 15L-22L" },
                    { t: "House Construction", c: "Hyderabad", b: "INR 35L-50L" }
                  ].map((x) => (
                    <div
                      key={x.t}
                      className="flex items-center justify-between rounded-md bg-black/25 px-4 py-3 ring-1 ring-white/10"
                    >
                      <div>
                        <div className="text-sm font-semibold text-slate-50">{x.t}</div>
                        <div className="text-xs text-slate-400">{x.c}</div>
                      </div>
                      <div className="text-xs text-teal-200">{x.b}</div>
                    </div>
                  ))}
                </div>

                <div className="mt-4 text-xs text-slate-400">
                  Create an account to post requests or connect as a company.
                </div>
              </Surface>
            </motion.div>
          </div>
        </div>
      </div>

      <div className="mx-auto w-full max-w-6xl px-4 py-12">
        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          <Step n="01" title="Client posts" body="Add project title, city, budget, and scope." />
          <Step n="02" title="Company connects" body="Companies reach out to work with you." />
          <Step n="03" title="Accept + chat" body="Accept a connection and coordinate inside chat." />
        </div>

        <div className="mt-8 grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Feature
            icon={<Briefcase className="h-5 w-5 text-teal-300" />}
            title="Company profiles"
            body="Show services, location, and a crisp pitch."
          />
          <Feature
            icon={<MessageSquare className="h-5 w-5 text-teal-300" />}
            title="Connections + chat"
            body="Once accepted, coordinate in one thread."
          />
          <Feature
            icon={<ShieldCheck className="h-5 w-5 text-teal-300" />}
            title="Role-based access"
            body="Clients post. Companies respond."
          />
          <Feature
            icon={<Bot className="h-5 w-5 text-teal-300" />}
            title="AI Studio"
            body="Get build suggestions and concept images."
          />
        </div>
      </div>
    </div>
  );
}

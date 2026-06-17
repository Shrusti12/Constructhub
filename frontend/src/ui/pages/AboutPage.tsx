import React, { useMemo } from "react";
import { motion } from "framer-motion";
import {
  BadgeCheck,
  Building2,
  CheckCircle2,
  ClipboardCheck,
  FileCheck2,
  Globe,
  Quote,
  Sparkles,
  Target,
  Users,
  Wrench
} from "lucide-react";
import { BackButton } from "../components/BackButton";
import { Surface } from "../components/Surface";
import heroConstructionImg from "../../assets/hero-construction.jpg";

function svgData(svg: string) {
  return `data:image/svg+xml,${encodeURIComponent(svg)}`;
}

export function AboutPage() {
  const images = useMemo(() => {
    const hero = svgData(`
<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="800" viewBox="0 0 1200 800">
  <defs>
    <linearGradient id="sky" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="#0b2b4a"/>
      <stop offset="0.55" stop-color="#07162e"/>
      <stop offset="1" stop-color="#050a16"/>
    </linearGradient>
    <linearGradient id="sun" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stop-color="#fbbf24" stop-opacity="0.75"/>
      <stop offset="1" stop-color="#fb923c" stop-opacity="0.25"/>
    </pattern>
  </defs>
  <rect width="1200" height="800" fill="url(#sky)"/>
  <circle cx="220" cy="180" r="180" fill="url(#sun)" opacity="0.55"/>

  <!-- Distant buildings -->
  <g opacity="0.45">
    <rect x="90" y="320" width="170" height="320" fill="#0a1022"/>
    <rect x="290" y="260" width="220" height="380" fill="#091528"/>
    <rect x="540" y="300" width="190" height="340" fill="#0a0f20"/>
    <rect x="760" y="240" width="260" height="400" fill="#091427"/>
  </g>

  <!-- Crane -->
  <g fill="none" stroke="rgba(251,191,36,0.85)" stroke-width="10" stroke-linecap="round" stroke-linejoin="round">
    <path d="M770 170v440"/>
    <path d="M770 190h300"/>
    <path d="M990 190l-50 70"/>
    <path d="M940 260h90"/>
    <path d="M1025 260v70"/>
    <path d="M995 330h60"/>
  </g>

  <!-- Foreground site -->
  <g>
    <rect x="140" y="420" width="840" height="260" fill="rgba(0,0,0,0.35)" stroke="rgba(255,255,255,0.10)" stroke-width="2"/>
    <rect x="170" y="460" width="250" height="180" fill="rgba(255,255,255,0.06)"/>
    <rect x="440" y="460" width="250" height="180" fill="rgba(255,255,255,0.06)"/>
    <rect x="710" y="460" width="240" height="180" fill="rgba(255,255,255,0.06)"/>
  </g>

  <!-- Workers -->
  <g>
    <circle cx="860" cy="520" r="34" fill="rgba(255,255,255,0.10)"/>
    <rect x="830" y="552" width="60" height="110" rx="16" fill="rgba(56,189,248,0.22)" stroke="rgba(255,255,255,0.14)" stroke-width="2"/>
    <path d="M820 604h80" stroke="rgba(255,255,255,0.25)" stroke-width="10" stroke-linecap="round"/>
    <path d="M836 486h48l-10 30h-28z" fill="rgba(251,191,36,0.95)"/>

    <circle cx="940" cy="535" r="30" fill="rgba(255,255,255,0.10)"/>
    <rect x="915" y="563" width="52" height="100" rx="16" fill="rgba(20,184,166,0.18)" stroke="rgba(255,255,255,0.14)" stroke-width="2"/>
    <path d="M902 610h78" stroke="rgba(255,255,255,0.25)" stroke-width="10" stroke-linecap="round"/>
    <path d="M920 505h44l-9 26h-26z" fill="rgba(251,191,36,0.95)"/>

    <!-- Blueprint paper -->
    <rect x="872" y="590" width="92" height="62" rx="10" fill="rgba(255,255,255,0.12)" stroke="rgba(255,255,255,0.25)" stroke-width="2"/>
    <path d="M884 608h68M884 624h58M884 640h48" stroke="rgba(251,191,36,0.70)" stroke-width="4" stroke-linecap="round"/>
  </g>
</svg>`);

    const blueprint = svgData(`
<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="800" viewBox="0 0 1200 800">
  <defs>
    <linearGradient id="g" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stop-color="#0f766e" stop-opacity="0.65"/>
      <stop offset="0.55" stop-color="#0ea5e9" stop-opacity="0.55"/>
      <stop offset="1" stop-color="#fb923c" stop-opacity="0.35"/>
    </linearGradient>
    <pattern id="p" width="48" height="48" patternUnits="userSpaceOnUse">
      <path d="M48 0H0V48" fill="none" stroke="rgba(255,255,255,0.10)" stroke-width="1"/>
      <path d="M24 0V48M0 24H48" fill="none" stroke="rgba(255,255,255,0.06)" stroke-width="1"/>
    </linearGradient>
  </defs>
  <rect width="1200" height="800" fill="#050a16"/>
  <rect width="1200" height="800" fill="url(#g)" opacity="0.55"/>
  <rect width="1200" height="800" fill="url(#p)" opacity="0.9"/>
  <g fill="none" stroke="rgba(255,255,255,0.65)" stroke-width="4">
    <path d="M190 570V240h520v110h190v220H190z"/>
    <path d="M330 570V330h240v240H330z"/>
    <path d="M710 570V430h120v140H710z"/>
  </g>
  <g fill="none" stroke="rgba(251,191,36,0.75)" stroke-width="3">
    <path d="M240 290h420"/>
    <path d="M240 360h70m80 0h70m80 0h70"/>
    <path d="M240 430h420"/>
  </g>
  <circle cx="980" cy="210" r="86" fill="rgba(2,6,23,0.55)" stroke="rgba(255,255,255,0.12)" stroke-width="2"/>
  <path d="M935 230l35-44 35 44" fill="none" stroke="rgba(56,189,248,0.75)" stroke-width="6" stroke-linecap="round" stroke-linejoin="round"/>
  <path d="M945 232h70" fill="none" stroke="rgba(255,255,255,0.65)" stroke-width="4" stroke-linecap="round"/>
</svg>`);

    const city = svgData(`
<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="800" viewBox="0 0 1200 800">
  <defs>
    <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stop-color="#07162e"/>
      <stop offset="0.55" stop-color="#050a16"/>
      <stop offset="1" stop-color="#0b2b4a"/>
    </linearGradient>
  </defs>
  <rect width="1200" height="800" fill="url(#bg)"/>
  <circle cx="950" cy="210" r="150" fill="rgba(251,191,36,0.22)"/>
  <g fill="rgba(255,255,255,0.06)">
    <rect x="120" y="260" width="180" height="420" rx="18"/>
    <rect x="340" y="220" width="220" height="460" rx="18"/>
    <rect x="600" y="280" width="200" height="400" rx="18"/>
    <rect x="840" y="240" width="240" height="440" rx="18"/>
  </g>
  <g stroke="rgba(56,189,248,0.35)" stroke-width="4">
    <path d="M160 660h920"/>
  </g>
  <g fill="none" stroke="rgba(251,191,36,0.75)" stroke-width="8" stroke-linecap="round">
    <path d="M860 210v450"/>
    <path d="M860 240h260"/>
    <path d="M1050 240l-46 62"/>
  </g>
</svg>`);

    return { hero, blueprint, city };
  }, []);

  return (
    <div className="mx-auto w-full max-w-6xl px-4 py-10">
      <BackButton className="mb-4" />
      <motion.div
        initial={{ opacity: 0, y: 14 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, amount: 0.25 }}
        transition={{ duration: 0.55 }}
      >
        <Surface className="overflow-hidden">
          <div className="grid grid-cols-1 items-stretch gap-0 lg:grid-cols-2">
            <div className="p-7 md:p-10">
              <div className="text-xs font-semibold tracking-widest text-amber-300">ABOUT US</div>
              <div className="mt-4 text-4xl font-semibold tracking-tight text-slate-50 md:text-5xl">
                Building The Future,{" "}
                <span className="text-amber-300">Together</span>
              </div>
              <div className="mt-4 h-1 w-12 rounded-full bg-amber-400/80" />
              <div className="mt-5 max-w-xl text-sm leading-relaxed text-slate-300">
                <span className="font-semibold text-slate-50">ConstructHub</span> is a smart platform built to simplify{" "}
                <span className="font-semibold text-slate-50">construction planning</span>, connect{" "}
                <span className="font-semibold text-slate-50">clients</span> with trusted{" "}
                <span className="font-semibold text-slate-50">companies</span>, and keep conversations organized in one place.
              </div>

              <div className="mt-8 grid grid-cols-2 gap-4 md:grid-cols-4">
                {[
                  { icon: <Target className="h-5 w-5 text-amber-300" />, t: "Our Mission", b: "Make projects clear and fast." },
                  { icon: <Globe className="h-5 w-5 text-amber-300" />, t: "Our Vision", b: "One hub for construction." },
                  { icon: <BadgeCheck className="h-5 w-5 text-amber-300" />, t: "Our Values", b: "Integrity and quality." },
                  { icon: <Users className="h-5 w-5 text-amber-300" />, t: "Commitment", b: "Reliable collaboration." },
                ].map((x, idx) => (
                  <motion.div
                    key={x.t}
                    initial={{ opacity: 0, y: 10 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true, amount: 0.2 }}
                    transition={{ duration: 0.45, delay: 0.03 * idx }}
                    className="rounded-md bg-black/20 p-3 ring-1 ring-white/10"
                  >
                    <div className="grid h-10 w-10 place-items-center rounded-md bg-amber-500/10 ring-1 ring-amber-400/20">
                      {x.icon}
                    </div>
                    <div className="mt-3 text-sm font-semibold text-slate-100">{x.t}</div>
                    <div className="mt-1 text-xs text-slate-300">{x.b}</div>
                  </motion.div>
                ))}
              </div>
            </div>

            <div className="relative min-h-[320px]">
              <img
                src={heroConstructionImg}
                alt="Construction site"
                className="h-full w-full object-cover"
              />
              <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(to_left,rgba(0,0,0,0.0),rgba(0,0,0,0.35))]" />

              <div className="absolute bottom-6 left-6 right-6">
                <div className="rounded-lg bg-[#071b33]/90 p-5 text-slate-100 ring-1 ring-white/10 backdrop-blur-sm">
                  <div className="flex items-start gap-3">
                    <div className="grid h-9 w-9 place-items-center rounded-md bg-amber-500/10 ring-1 ring-amber-400/20">
                      <Quote className="h-5 w-5 text-amber-300" />
                    </div>
                    <div className="text-sm leading-relaxed">
                      We believe in{" "}
                      <span className="font-semibold text-white">innovation</span>,{" "}
                      <span className="font-semibold text-white">transparency</span>, and building strong relationships to
                      shape the future of construction.
                      <div className="mt-4 h-1 w-12 rounded-full bg-amber-400/80" />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </Surface>
      </motion.div>

      <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-2">
        <motion.div
          initial={{ opacity: 0, y: 14 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.25 }}
          transition={{ duration: 0.55, delay: 0.05 }}
        >
          <Surface className="p-7 md:p-8">
            <div className="text-2xl font-semibold tracking-tight text-slate-50">What We Provide</div>
            <div className="mt-3 text-sm text-slate-300">
              End-to-end support for project discovery and coordination.
            </div>

            <div className="mt-5 grid grid-cols-1 gap-3 sm:grid-cols-2">
              {[
                { icon: <ClipboardCheck className="h-5 w-5 text-sky-300" />, t: "Project requests", b: "Collect scope, city, budget." },
                { icon: <FileCheck2 className="h-5 w-5 text-teal-300" />, t: "Verified profiles", b: "Company details in one place." },
                { icon: <Building2 className="h-5 w-5 text-amber-300" />, t: "Company directory", b: "Find the right partner." },
                { icon: <Wrench className="h-5 w-5 text-fuchsia-300" />, t: "AI assistance", b: "Suggestions and concept images." },
              ].map((x, idx) => (
                <motion.div
                  key={x.t}
                  initial={{ opacity: 0, y: 10 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, amount: 0.2 }}
                  transition={{ duration: 0.45, delay: 0.03 * idx }}
                  className="rounded-md bg-black/20 p-4 ring-1 ring-white/10"
                >
                  <div className="grid h-11 w-11 place-items-center rounded-full bg-white/5 ring-1 ring-white/10">
                    {x.icon}
                  </div>
                  <div className="mt-3 text-sm font-semibold text-slate-100">{x.t}</div>
                  <div className="mt-1 text-xs text-slate-300">{x.b}</div>
                </motion.div>
              ))}
            </div>
          </Surface>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 14 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.25 }}
          transition={{ duration: 0.55, delay: 0.08 }}
        >
          <Surface className="p-7 md:p-8">
            <div className="flex items-start justify-between gap-4">
              <div>
                <div className="text-2xl font-semibold tracking-tight text-slate-50">Why Choose ConstructHub?</div>
                <div className="mt-3 text-sm text-slate-300">
                  Designed for <span className="font-semibold text-slate-50">clarity</span> and{" "}
                  <span className="font-semibold text-slate-50">trust</span>.
                </div>
              </div>
              <div className="hidden h-20 w-20 overflow-hidden rounded-lg ring-1 ring-white/10 md:block">
                <img src={images.city} alt="Construction illustration" className="h-full w-full object-cover" />
              </div>
            </div>

            <div className="mt-5 grid gap-2 text-sm text-slate-200">
              {[
                "Trusted and organized project details",
                "Easy to use and user-friendly interface",
                "Save time and reduce coordination delays",
                "All-in-one platform for your build needs",
                "Secure and reliable"
              ].map((x, i) => (
                <motion.div
                  key={x}
                  initial={{ opacity: 0, y: 10 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, amount: 0.2 }}
                  transition={{ duration: 0.45, delay: 0.02 * i }}
                  className="flex items-start gap-2 rounded-md bg-black/20 px-3 py-2 ring-1 ring-white/10"
                >
                  <CheckCircle2 className="mt-0.5 h-4 w-4 text-amber-300" />
                  <div>{x}</div>
                </motion.div>
              ))}
            </div>

            <div className="mt-6 grid grid-cols-2 gap-3 md:grid-cols-4">
              {[
                { n: "500+", t: "Companies" },
                { n: "1200+", t: "Projects" },
                { n: "3000+", t: "Users" },
                { n: "50+", t: "Teams" },
              ].map((x, idx) => (
                <motion.div
                  key={x.t}
                  initial={{ opacity: 0, y: 10 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, amount: 0.2 }}
                  transition={{ duration: 0.45, delay: 0.03 * idx }}
                  className="rounded-md bg-black/20 px-3 py-3 ring-1 ring-white/10"
                >
                  <div className="text-2xl font-semibold tracking-tight text-amber-300">{x.n}</div>
                  <div className="mt-1 text-xs text-slate-300">{x.t}</div>
                </motion.div>
              ))}
            </div>
          </Surface>
        </motion.div>
      </div>
    </div>
  );
}

"use client";

import { useState } from "react";
import {
  Check,
  ChevronRight,
  CircleHelp,
  FileText,
  Folder,
  Globe,
  Pencil,
  Settings,
} from "lucide-react";
import Link from "next/link";
import { AppShell } from "@/components/app-shell";
import { Badge } from "@/components/ui/badge";
import { ProgressBar } from "@/components/ui/progress-bar";

const eventCriteria = [
  { name: "Innovation & Originality", weight: "30%" },
  { name: "Technical Execution", weight: "30%" },
  { name: "Market Feasibility", weight: "20%" },
  { name: "Design & UX", weight: "20%" },
];

const topTeams = [
  { rank: 1, initials: "NQ", name: "NeoQuants", description: "DeFi Trading Algo", score: "94.5 pts", featured: true },
  { rank: 2, initials: "PB", name: "PayBridge", description: "Cross-border Remittance", score: "92.0 pts" },
  { rank: 3, initials: "AI", name: "Aura Identity", description: "KYC Compliance Tool", score: "89.5 pts" },
];

const timeline = [
  { title: "Kickoff & Ideation", detail: "Oct 24, 09:00 AM", state: "done" },
  { title: "Hacking Phase", detail: "Ends in 2h 15m", state: "current" },
  { title: "Evaluation Commences", detail: "Oct 26, 02:00 PM", state: "upcoming" },
  { title: "Final Pitches & Awards", detail: "Oct 26, 05:00 PM", state: "upcoming" },
];

const tabs = ["Overview", "Projects", "Judges", "Schedule"];

function EventStat({ label, children, dark = false }: { label: string; children: React.ReactNode; dark?: boolean }) {
  return <article className={`rounded-lg border p-6 shadow-card ${dark ? "border-primary bg-primary text-white" : "border-black/[0.04] bg-white text-ink"}`}><p className={`font-serif text-base font-bold ${dark ? "text-white/55" : "text-ink"}`}>{label}</p>{children}</article>;
}

function PlaceholderTab({ tab }: { tab: string }) {
  return <section className="rounded-lg border border-black/[0.04] bg-white p-8 text-center shadow-card"><div className="mx-auto flex size-12 items-center justify-center rounded-full bg-surface-high text-ink"><FileText className="size-5" /></div><h2 className="mt-4 font-serif text-2xl font-bold text-ink">{tab}</h2><p className="mx-auto mt-2 max-w-md text-sm leading-6 text-ink-muted">Esta visão será alimentada pelos dados do evento assim que a persistência e as permissões estiverem conectadas.</p></section>;
}

export default function IdeathonDetailsPage() {
  const [activeTab, setActiveTab] = useState("Overview");

  return (
    <AppShell activeSection="overview">
      <div className="mx-auto w-full max-w-container space-y-6 px-4 py-7 sm:px-6 lg:px-8 lg:py-9">
        <section className="flex flex-col justify-between gap-5 xl:flex-row xl:items-end">
          <div>
            <div className="mb-4 flex items-center gap-3 text-xs font-semibold text-ink-muted"><Link href="/admin" className="hover:text-ink">Events</Link><ChevronRight className="size-3.5" /><span>FinTech Innovate 2024</span></div>
            <div className="flex flex-wrap items-center gap-4"><h1 className="font-serif text-4xl font-bold tracking-[-0.045em] text-ink sm:text-5xl">FinTech Innovate 2024</h1><Badge tone="lime" className="border border-lime-deep/40 bg-lime/20 font-serif text-sm"><span className="size-2 rounded-full bg-lime-deep" />Live</Badge></div>
          </div>
          <div className="flex flex-wrap items-center gap-3"><Link href="/public/fintech-innovate-2024" className="inline-flex min-h-11 items-center gap-2 rounded-md border border-ink-muted bg-white px-4 text-sm font-semibold transition-colors hover:bg-surface-low"><Globe className="size-4" />View Public Page</Link><Link href="/admin/ideathons/fintech-2024/configuracao" className="inline-flex min-h-11 items-center gap-2 rounded-md bg-lime px-4 text-sm font-bold text-lime-foreground transition-colors hover:bg-lime/85"><Pencil className="size-4" />Edit Event</Link></div>
        </section>

        <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4" aria-label="Resumo do evento">
          <EventStat label="Total Teams"><p className="mt-5 font-serif text-4xl font-bold text-ink">24</p></EventStat>
          <EventStat label="Active Participants"><p className="mt-5 font-serif text-4xl font-bold text-ink">120</p></EventStat>
          <EventStat label="Evaluation Progress"><div className="mt-4 flex items-end justify-between gap-3"><span className="font-serif text-base font-bold text-ink"> </span><strong className="font-serif text-3xl font-bold text-ink">90%</strong></div><ProgressBar value={90} showLabel={false} className="mt-4" /></EventStat>
          <EventStat label="Time Remaining" dark><p className="mt-5 font-serif text-4xl font-bold tracking-[-0.04em] text-lime">02:15:00</p></EventStat>
        </section>

        <div className="grid grid-cols-1 items-start gap-6 xl:grid-cols-[minmax(0,2fr)_minmax(320px,0.98fr)]">
          <div className="space-y-6">
            <nav className="flex gap-7 overflow-x-auto border-b border-outline/60" aria-label="Detalhes do ideathon">
              {tabs.map((tab) => activeTab === tab && tab === "Projects" ? <Link href="/admin/ideathons/fintech-2024/projetos" key={tab} className="whitespace-nowrap border-b-2 border-primary px-1 pb-4 font-serif text-base font-bold text-ink">{tab}</Link> : <button type="button" key={tab} onClick={() => setActiveTab(tab)} className={`whitespace-nowrap border-b-2 px-1 pb-4 font-serif text-base font-bold transition-colors ${activeTab === tab ? "border-primary text-ink" : "border-transparent text-ink-muted hover:text-ink"}`}>{tab}</button>)}
            </nav>
            {activeTab !== "Overview" ? <PlaceholderTab tab={activeTab} /> : <>
              <section className="rounded-lg border border-black/[0.04] bg-white p-6 shadow-card sm:p-8" aria-labelledby="about-event-title"><h2 id="about-event-title" className="font-serif text-2xl font-bold text-ink">About the Event</h2><p className="mt-6 font-serif text-lg leading-8 text-ink-muted">FinTech Innovate 2024 is an intensive 48-hour ideathon focused on accelerating next-generation financial technology solutions. This year&apos;s themes center around decentralized finance, inclusive banking, and AI-driven risk assessment. We are bringing together developers, financial analysts, and designers to create scalable prototypes that challenge the status quo of modern banking.</p></section>

              <section className="rounded-lg border border-black/[0.04] bg-white p-6 shadow-card sm:p-8" aria-labelledby="criteria-title"><div className="flex items-center justify-between gap-4"><h2 id="criteria-title" className="font-serif text-2xl font-bold text-ink">Evaluation Criteria</h2><Link href="/admin/ideathons/fintech-2024/configuracao" className="inline-flex items-center gap-2 text-sm font-serif text-ink-muted hover:text-ink"><Settings className="size-4" />Configure</Link></div><div className="mt-7 grid grid-cols-1 gap-4 sm:grid-cols-2">{eventCriteria.map((criterion) => <div key={criterion.name} className="flex items-center justify-between gap-4 rounded-md bg-surface-high px-5 py-5"><span className="font-serif text-lg text-ink">{criterion.name}</span><span className="shrink-0 rounded bg-white px-3 py-1.5 font-serif text-sm font-bold text-ink shadow-sm">{criterion.weight}</span></div>)}</div></section>

              <section className="rounded-lg border border-black/[0.04] bg-white p-6 shadow-card sm:p-8" aria-labelledby="top-teams-title"><div className="flex items-center justify-between gap-4"><h2 id="top-teams-title" className="font-serif text-2xl font-bold text-ink">Top Teams (Provisional)</h2><Link href="/admin/ideathons/fintech-2024/resultados" className="font-serif text-sm text-ink-muted hover:text-ink">View All</Link></div><div className="mt-6 divide-y divide-outline/30">{topTeams.map((team) => <div key={team.name} className="flex items-center gap-4 py-5 first:pt-0 last:pb-0"><span className="w-6 font-serif text-base text-ink">{team.rank}</span><span className={`flex size-12 shrink-0 items-center justify-center rounded-md font-serif text-sm font-bold ${team.featured ? "bg-primary text-lime" : "bg-surface-container text-ink"}`}>{team.initials}</span><div className="min-w-0 flex-1"><p className="font-serif text-lg text-ink">{team.name}</p><p className="font-serif text-base text-ink-muted">{team.description}</p></div><span className="shrink-0 rounded-full bg-surface-container px-3 py-2 font-serif text-sm font-bold text-ink">{team.score}</span></div>)}</div></section>
            </>}
          </div>

          <aside className="space-y-6">
            <section className="rounded-lg border border-black/[0.04] bg-white p-6 shadow-card" aria-labelledby="organizer-title"><h2 id="organizer-title" className="font-serif text-lg font-bold uppercase tracking-[0.08em] text-ink-muted">Organizer</h2><div className="mt-6 flex items-center gap-4"><span className="flex size-14 items-center justify-center rounded-full bg-primary text-lg font-bold text-lime">SJ</span><div><p className="font-serif text-lg text-ink">Sarah Jenkins</p><p className="font-serif text-base text-ink-muted">Lead Program Manager</p></div></div><a href="mailto:sarah.jenkins@example.com" className="mt-6 flex min-h-11 items-center justify-center rounded-md border border-outline px-4 font-serif text-sm font-bold text-ink transition-colors hover:bg-surface-low">Contact Organizer</a></section>

            <section className="rounded-lg border border-black/[0.04] bg-white p-6 shadow-card" aria-labelledby="quick-links-title"><h2 id="quick-links-title" className="font-serif text-lg font-bold uppercase tracking-[0.08em] text-ink-muted">Quick Links</h2><div className="mt-5 space-y-2"><a href="#guidelines" className="flex items-center gap-4 rounded-md p-3 font-serif text-base text-ink transition-colors hover:bg-surface-low"><span className="flex size-10 items-center justify-center rounded bg-surface-high"><FileText className="size-5" /></span>Event Guidelines</a><a href="#drive" className="flex items-center gap-4 rounded-md p-3 font-serif text-base text-ink transition-colors hover:bg-surface-low"><span className="flex size-10 items-center justify-center rounded bg-surface-high"><Folder className="size-5" /></span>Resource Drive</a><a href="mailto:support@revvolucao.com" className="flex items-center gap-4 rounded-md p-3 font-serif text-base text-ink transition-colors hover:bg-surface-low"><span className="flex size-10 items-center justify-center rounded bg-surface-high"><CircleHelp className="size-5" /></span>Support Desk</a></div></section>

            <section className="rounded-lg bg-primary p-7 text-white shadow-card" aria-labelledby="timeline-title"><h2 id="timeline-title" className="font-serif text-lg font-bold uppercase tracking-[0.08em] text-white/55">Event Timeline</h2><div className="mt-7 space-y-0">{timeline.map((item, index) => <div key={item.title} className="relative flex gap-4 pb-7 last:pb-0"><div className="relative z-10 flex size-8 shrink-0 items-center justify-center rounded-full border-2 border-primary bg-white text-primary">{item.state === "done" ? <Check className="size-4" /> : item.state === "current" ? <span className="size-2.5 rounded-full bg-lime" /> : null}</div>{index < timeline.length - 1 ? <span className="absolute left-[15px] top-8 h-[calc(100%-16px)] w-px bg-white/20" aria-hidden="true" /> : null}<div><p className={`font-serif text-base font-bold ${item.state === "current" ? "text-lime" : "text-white"}`}>{item.title}</p><p className="mt-1 font-serif text-sm text-white/55">{item.detail}</p></div></div>)}</div></section>
          </aside>
        </div>
      </div>
    </AppShell>
  );
}

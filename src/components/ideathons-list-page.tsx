"use client";

import { useEffect, useState } from "react";
import { LoaderCircle, Plus, Search } from "lucide-react";
import Link from "next/link";
import { AppShell } from "@/components/app-shell";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/field";
import { Modal } from "@/components/ui/modal";

type Ideathon = { id: string; name: string; slug: string; description: string; status: "DRAFT" | "READY" | "LIVE" | "CLOSED"; ideaCount: number; startsAt: string | null; endsAt: string | null };
const statusLabels = { DRAFT: "Rascunho", READY: "Pronto", LIVE: "Ao vivo", CLOSED: "Encerrado" };

export function IdeathonsListPage({ initialSearch = "" }: { initialSearch?: string }) {
  const [items, setItems] = useState<Ideathon[]>([]);
  const [search, setSearch] = useState(initialSearch);
  const [loading, setLoading] = useState(true);
  const [notice, setNotice] = useState("");
  const [modalOpen, setModalOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ name: "", slug: "", description: "" });

  async function load() {
    setLoading(true);
    try {
      const response = await fetch("/api/admin/ideathons", { cache: "no-store" });
      const payload = await response.json();
      if (!response.ok) throw new Error(payload.error || "Não foi possível carregar os ideathons.");
      setItems(payload.data);
    } catch (error) {
      setNotice(error instanceof Error ? error.message : "Não foi possível carregar os ideathons.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { void load(); }, []);

  async function createIdeathon() {
    setSaving(true);
    try {
      const response = await fetch("/api/admin/ideathons", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(form) });
      const payload = await response.json();
      if (!response.ok) throw new Error(payload.error || "Não foi possível criar o ideathon.");
      setItems((current) => [payload.data, ...current]);
      setModalOpen(false);
      setForm({ name: "", slug: "", description: "" });
      setNotice("Ideathon criado com sucesso.");
    } catch (error) {
      setNotice(error instanceof Error ? error.message : "Não foi possível criar o ideathon.");
    } finally {
      setSaving(false);
    }
  }

  const visible = items.filter((item) => `${item.name} ${item.slug}`.toLowerCase().includes(search.trim().toLowerCase()));
  return <AppShell navigation="management" activeSection="ideathons" darkHeader headerAction={<Button type="button" onClick={() => setModalOpen(true)} className="min-h-9 rounded-full px-4 text-xs"><Plus className="size-3.5" />Novo ideathon</Button>}><div className="mx-auto w-full max-w-container space-y-6 px-4 py-7 sm:px-6 lg:px-8 lg:py-9"><section className="flex flex-col justify-between gap-5 sm:flex-row sm:items-end"><div><p className="text-xs font-bold uppercase tracking-[0.14em] text-lime-deep">Gestão de eventos</p><h1 className="mt-2 text-3xl font-bold tracking-[-0.055em] text-ink sm:text-4xl">Ideathons</h1><p className="mt-2 text-base text-ink-muted">Crie e acompanhe os eventos cadastrados na plataforma.</p></div><Button type="button" onClick={() => setModalOpen(true)}><Plus className="size-4" />Criar ideathon</Button></section>{notice ? <p className="rounded-md bg-lime/30 px-4 py-3 text-sm font-semibold text-lime-deep" role="status">{notice}</p> : null}<section className="rounded-lg border border-outline/45 bg-white p-4 shadow-card"><label className="relative block max-w-md"><Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-ink-muted" /><span className="sr-only">Buscar ideathon</span><input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Buscar por nome ou slug" className="min-h-11 w-full rounded-md border border-outline/70 bg-surface-low pl-10 pr-3.5 text-sm text-ink focus:border-lime focus:bg-white focus:outline-none focus:ring-2 focus:ring-lime/40" /></label></section><section className="grid gap-4 lg:grid-cols-2" aria-label="Ideathons cadastrados">{loading ? <div className="col-span-full flex justify-center rounded-lg bg-white p-14"><LoaderCircle className="size-6 animate-spin text-lime-deep" /></div> : visible.map((item) => <article key={item.id} className="rounded-lg border border-outline/45 bg-white p-5 shadow-card sm:p-6"><div className="flex items-start justify-between gap-4"><div><h2 className="text-xl font-bold tracking-[-0.03em] text-ink">{item.name}</h2><p className="mt-1 text-sm text-ink-muted">/{item.slug}</p></div><Badge tone={item.status === "LIVE" ? "lime" : item.status === "CLOSED" ? "neutral" : "indigo"}>{statusLabels[item.status]}</Badge></div><p className="mt-5 min-h-12 text-sm leading-6 text-ink-muted">{item.description || "Sem descrição cadastrada."}</p><div className="mt-5 flex items-center justify-between border-t border-outline/30 pt-4"><span className="text-sm font-semibold text-ink-muted">{item.ideaCount} {item.ideaCount === 1 ? "ideia" : "ideias"}</span><Link href={`/admin/ideathons/${item.id}`} className="text-sm font-bold text-lime-deep hover:underline">Abrir evento</Link></div></article>)}{!loading && !visible.length ? <div className="col-span-full rounded-lg bg-white p-14 text-center text-sm text-ink-muted">Nenhum ideathon encontrado.</div> : null}</section></div><Modal open={modalOpen} onClose={() => setModalOpen(false)} title="Criar ideathon"><div className="space-y-4"><Input id="new-ideathon-name" label="Nome" required value={form.name} onChange={(event) => setForm((current) => ({ ...current, name: event.target.value }))} placeholder="Ex: Ideathon Sustentabilidade" /><Input id="new-ideathon-slug" label="Slug" required value={form.slug} onChange={(event) => setForm((current) => ({ ...current, slug: event.target.value }))} placeholder="ideathon-sustentabilidade" /><label className="block text-sm font-semibold text-ink" htmlFor="new-ideathon-description">Descrição<textarea id="new-ideathon-description" value={form.description} onChange={(event) => setForm((current) => ({ ...current, description: event.target.value }))} className="mt-2 min-h-28 w-full rounded-md border border-outline/70 bg-surface-low px-3.5 py-3 text-sm font-normal text-ink focus:border-lime focus:bg-white focus:outline-none focus:ring-2 focus:ring-lime/40" /></label><div className="flex justify-end gap-2 border-t border-outline/40 pt-4"><Button type="button" variant="ghost" onClick={() => setModalOpen(false)}>Cancelar</Button><Button type="button" disabled={saving || !form.name.trim() || !form.slug.trim()} onClick={() => void createIdeathon()}>{saving ? "Criando..." : "Criar ideathon"}</Button></div></div></Modal></AppShell>;
}

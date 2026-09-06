"use client";

import { useEffect, useState } from "react";
import { Archive, LoaderCircle, MoreHorizontal, Plus } from "lucide-react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { AppShell } from "@/components/app-shell";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/field";

type IdeaStatus = "ACTIVE" | "ARCHIVED";
type StatusFilter = "ALL" | IdeaStatus;

type Idea = {
  id: string;
  name: string;
  problem: string;
  solution: string;
  teamName: string;
  category: string | null;
  status: IdeaStatus;
};

const statusFilters: Array<{ value: StatusFilter; label: string }> = [
  { value: "ALL", label: "Todas" },
  { value: "ACTIVE", label: "Ativas" },
  { value: "ARCHIVED", label: "Arquivadas" },
];

export default function ProjectsPage() {
  const params = useParams<{ id: string }>();
  const ideathonId = String(params.id);
  const [ideas, setIdeas] = useState<Idea[]>([]);
  const [ideathonName, setIdeathonName] = useState("Ideathon");
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("ALL");
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [notice, setNotice] = useState("");
  const pageSize = 10;

  useEffect(() => {
    let active = true;
    setLoading(true);
    fetch(`/api/admin/ideathons/${ideathonId}/ideas`)
      .then(async (response) => {
        const payload = await response.json();
        if (!response.ok) throw new Error(payload.error || "Não foi possível carregar as ideias.");
        return payload;
      })
      .then((payload) => {
        if (!active) return;
        setIdeas(payload.data);
        setIdeathonName(payload.ideathon.name);
      })
      .catch((error: Error) => active && setNotice(error.message))
      .finally(() => active && setLoading(false));
    return () => {
      active = false;
    };
  }, [ideathonId]);

  async function archiveIdea(idea: Idea) {
    if (!window.confirm(`Arquivar a ideia “${idea.name}”?`)) return;
    const response = await fetch(`/api/admin/ideathons/${ideathonId}/ideas/${idea.id}`, { method: "DELETE" });
    const payload = await response.json();
    if (!response.ok) {
      setNotice(payload.error || "Não foi possível arquivar a ideia.");
      return;
    }
    setIdeas((current) => current.map((currentIdea) => currentIdea.id === idea.id ? { ...currentIdea, status: "ARCHIVED" } : currentIdea));
    setNotice("Ideia arquivada com sucesso.");
  }

  const normalizedSearch = search.trim().toLowerCase();
  const filteredIdeas = ideas.filter((idea) => {
    const matchesStatus = statusFilter === "ALL" || idea.status === statusFilter;
    const matchesSearch = !normalizedSearch || `${idea.name} ${idea.problem} ${idea.solution} ${idea.teamName} ${idea.category || ""}`.toLowerCase().includes(normalizedSearch);
    return matchesStatus && matchesSearch;
  });
  const pageCount = Math.max(1, Math.ceil(filteredIdeas.length / pageSize));
  const visibleIdeas = filteredIdeas.slice((page - 1) * pageSize, page * pageSize);

  function changeSearch(value: string) {
    setSearch(value);
    setPage(1);
  }

  function changeStatusFilter(value: StatusFilter) {
    setStatusFilter(value);
    setPage(1);
  }

  return (
    <AppShell navigation="management" activeSection="ideathons" darkHeader headerAction={<Link href={`/admin/ideathons/${ideathonId}/projetos/novo`} className="inline-flex min-h-9 items-center gap-2 rounded-full bg-lime px-4 text-xs font-bold text-lime-foreground transition-colors hover:bg-lime/85"><Plus className="size-3.5" />Nova ideia</Link>}>
      <div className="mx-auto w-full max-w-container space-y-6 px-4 py-7 sm:px-6 lg:px-8 lg:py-9">
        <section className="flex flex-col justify-between gap-5 xl:flex-row xl:items-end"><div><h1 className="text-3xl font-bold tracking-[-0.055em] text-ink sm:text-4xl">Gestão de Ideias</h1><p className="mt-2 text-base text-ink-muted">{ideathonName}</p></div><Link href={`/admin/ideathons/${ideathonId}/projetos/novo`} className="inline-flex min-h-10 items-center justify-center gap-2 rounded-md bg-lime px-4 text-sm font-semibold text-lime-foreground transition-colors hover:bg-lime/85"><Plus className="size-4" />Cadastrar Nova Ideia</Link></section>
        {notice ? <p className="rounded-md bg-lime/30 px-4 py-3 text-sm font-semibold text-lime-deep" role="status">{notice}</p> : null}
        <section className="rounded-lg border border-outline/45 bg-white p-4 shadow-card sm:flex sm:items-center sm:justify-between sm:gap-5" aria-label="Busca e filtros de ideias"><Input id="idea-search" label="Buscar ideias" value={search} onChange={(event) => changeSearch(event.target.value)} placeholder="Buscar por ideia, equipe ou categoria..." className="min-h-10 bg-surface-low sm:max-w-sm" /><div className="mt-4 flex flex-wrap gap-2 sm:mt-0 sm:justify-end">{statusFilters.map((filter) => { const count = filter.value === "ALL" ? ideas.length : ideas.filter((idea) => idea.status === filter.value).length; const selected = statusFilter === filter.value; return <button type="button" key={filter.value} onClick={() => changeStatusFilter(filter.value)} className={`rounded-full border px-4 py-2 text-xs font-semibold transition-colors ${selected ? "border-lime-deep/30 bg-lime/20 text-lime-deep" : "border-outline/60 bg-white text-ink-muted hover:border-ink-muted hover:text-ink"}`} aria-pressed={selected}>{filter.label} ({count})</button>; })}</div></section>
        <section className="overflow-hidden rounded-lg border border-outline/45 bg-white shadow-card" aria-labelledby="ideas-table-title"><h2 id="ideas-table-title" className="sr-only">Ideias cadastradas</h2><div className="overflow-x-auto"><table className="w-full min-w-[800px] border-collapse text-left"><thead><tr className="bg-surface-low"><th className="px-6 py-4 text-xs font-semibold text-ink-muted">Ideia</th><th className="px-6 py-4 text-xs font-semibold text-ink-muted">Equipe</th><th className="px-6 py-4 text-xs font-semibold text-ink-muted">Categoria</th><th className="px-6 py-4 text-xs font-semibold text-ink-muted">Status</th><th className="w-28 px-6 py-4 text-right text-xs font-semibold text-ink-muted">Ações</th></tr></thead><tbody className="divide-y divide-outline/40">{loading ? <tr><td colSpan={5} className="px-6 py-12 text-center text-sm text-ink-muted"><LoaderCircle className="mx-auto size-5 animate-spin" />Carregando ideias...</td></tr> : visibleIdeas.map((idea) => <tr key={idea.id} className="transition-colors hover:bg-surface-low/45"><td className="px-6 py-4"><p className="text-sm font-bold text-ink">{idea.name}</p><p className="mt-0.5 max-w-md truncate text-sm text-ink-muted">{idea.solution}</p></td><td className="px-6 py-4 text-sm text-ink">{idea.teamName}</td><td className="px-6 py-4 text-sm text-ink">{idea.category || "Sem categoria"}</td><td className="px-6 py-4"><Badge tone={idea.status === "ACTIVE" ? "lime" : "indigo"}>{idea.status === "ACTIVE" ? "Ativa" : "Arquivada"}</Badge></td><td className="px-6 py-4 text-right"><Link href={`/admin/ideathons/${ideathonId}/projetos/${idea.id}/editar`} className="inline-flex rounded-md p-2 text-ink-muted transition-colors hover:bg-surface-container hover:text-ink" aria-label={`Editar ${idea.name}`}><MoreHorizontal className="size-5" /></Link>{idea.status === "ACTIVE" ? <button type="button" onClick={() => void archiveIdea(idea)} className="inline-flex rounded-md p-2 text-ink-muted transition-colors hover:bg-danger-soft hover:text-danger" aria-label={`Arquivar ${idea.name}`}><Archive className="size-4" /></button> : null}</td></tr>)}</tbody></table></div>{!loading && !visibleIdeas.length ? <div className="px-6 py-12 text-center text-sm text-ink-muted">Nenhuma ideia encontrada.</div> : null}<footer className="flex items-center justify-between border-t border-outline/40 bg-surface-low px-6 py-4 text-sm text-ink-muted"><span>Mostrando {visibleIdeas.length ? (page - 1) * pageSize + 1 : 0}–{Math.min(page * pageSize, filteredIdeas.length)} de {filteredIdeas.length}</span><div className="flex items-center gap-2"><button type="button" disabled={page === 1} onClick={() => setPage((current) => current - 1)} className="rounded border border-outline/60 px-3 py-1.5 text-xs font-semibold disabled:cursor-not-allowed disabled:opacity-40">Anterior</button><span className="text-xs">Página {page} de {pageCount}</span><button type="button" disabled={page === pageCount} onClick={() => setPage((current) => current + 1)} className="rounded border border-outline/60 px-3 py-1.5 text-xs font-semibold disabled:cursor-not-allowed disabled:opacity-40">Próxima</button></div></footer></section>
      </div>
    </AppShell>
  );
}

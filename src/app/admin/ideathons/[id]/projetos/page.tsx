"use client";

import { useState } from "react";
import { MoreHorizontal, Plus } from "lucide-react";
import Link from "next/link";
import { AppShell } from "@/components/app-shell";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input, Select } from "@/components/ui/field";
import { Modal } from "@/components/ui/modal";

type ProjectStatus = "Em Análise" | "Aprovado" | "Rejeitado";

type Project = {
  id: number;
  name: string;
  description: string;
  team: string;
  category: string;
  status: ProjectStatus;
};

const initialProjects: Project[] = [
  { id: 1, name: "PayStream", description: "Micropagamentos via streaming", team: "CodeCrafters", category: "B2B Solutions", status: "Aprovado" },
  { id: 2, name: "EcoInvest AI", description: "Análise ESG automatizada", team: "Green Techies", category: "Investimentos", status: "Em Análise" },
  { id: 3, name: "BlockLend", description: "Empréstimos P2P Descentralizados", team: "Crypto Bros", category: "DeFi", status: "Rejeitado" },
  { id: 4, name: "ClearLedger", description: "Auditoria financeira inteligente", team: "FinOps Lab", category: "FinTech", status: "Aprovado" },
  { id: 5, name: "OpenCredit", description: "Crédito inclusivo para pequenos negócios", team: "Nova Impact", category: "Inclusão", status: "Em Análise" },
  { id: 6, name: "SafePay", description: "Proteção contra fraude em pagamentos", team: "Shield Works", category: "Segurança", status: "Aprovado" },
  { id: 7, name: "FundFlow", description: "Gestão colaborativa de investimentos", team: "Capital Crew", category: "Investimentos", status: "Em Análise" },
  { id: 8, name: "Remitly Local", description: "Remessas rápidas para comunidades", team: "Borderless", category: "Pagamentos", status: "Aprovado" },
  { id: 9, name: "TokenTax", description: "Impostos para ativos digitais", team: "Ledger Minds", category: "DeFi", status: "Rejeitado" },
  { id: 10, name: "Bankless ID", description: "Identidade financeira portátil", team: "Identity First", category: "Inclusão", status: "Em Análise" },
  { id: 11, name: "Invoice AI", description: "Automação de contas a receber", team: "Flow State", category: "B2B Solutions", status: "Aprovado" },
  { id: 12, name: "MicroSure", description: "Microsseguros sob demanda", team: "Care Finance", category: "Seguros", status: "Rejeitado" },
];

const statusFilters: Array<{ value: "Todos" | ProjectStatus; label: string }> = [
  { value: "Todos", label: "Todos" },
  { value: "Em Análise", label: "Em Análise" },
  { value: "Aprovado", label: "Aprovado" },
  { value: "Rejeitado", label: "Rejeitado" },
];

const statusTone: Record<ProjectStatus, "lime" | "indigo" | "danger"> = { "Aprovado": "lime", "Em Análise": "indigo", "Rejeitado": "danger" };

export default function ProjectsPage() {
  const [projects, setProjects] = useState(initialProjects);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<"Todos" | ProjectStatus>("Todos");
  const [page, setPage] = useState(1);
  const [modalOpen, setModalOpen] = useState(false);
  const [notice, setNotice] = useState("");
  const [newProject, setNewProject] = useState({ name: "", description: "", team: "", category: "", status: "Em Análise" as ProjectStatus });

  const normalizedSearch = search.trim().toLowerCase();
  const filteredProjects = projects.filter((project) => {
    const matchesStatus = statusFilter === "Todos" || project.status === statusFilter;
    const matchesSearch = !normalizedSearch || `${project.name} ${project.description} ${project.team} ${project.category}`.toLowerCase().includes(normalizedSearch);
    return matchesStatus && matchesSearch;
  });
  const pageSize = 3;
  const pageCount = Math.max(1, Math.ceil(filteredProjects.length / pageSize));
  const visibleProjects = filteredProjects.slice((page - 1) * pageSize, page * pageSize);

  function changeStatusFilter(value: "Todos" | ProjectStatus) {
    setStatusFilter(value);
    setPage(1);
  }

  function addProject() {
    if (!newProject.name.trim() || !newProject.team.trim() || !newProject.category.trim()) return;
    setProjects((current) => [...current, { id: Date.now(), ...newProject, name: newProject.name.trim(), description: newProject.description.trim() || "Sem descrição informada", team: newProject.team.trim(), category: newProject.category.trim() }]);
    setNewProject({ name: "", description: "", team: "", category: "", status: "Em Análise" });
    setModalOpen(false);
    setNotice("Projeto cadastrado com sucesso.");
    setPage(1);
  }

  function openProjectModal() {
    setNotice("");
    setNewProject({ name: "", description: "", team: "", category: "", status: "Em Análise" });
    setModalOpen(true);
  }

  return (
    <AppShell navigation="management" activeSection="ideathons" darkHeader headerAction={<Link href="/admin/ideathons/fintech-2024/projetos/novo" className="inline-flex min-h-9 items-center gap-2 rounded-full bg-lime px-4 text-xs font-bold text-lime-foreground transition-colors hover:bg-lime/85"><Plus className="size-3.5" />Add Project</Link>}>
      <div className="mx-auto w-full max-w-container space-y-6 px-4 py-7 sm:px-6 lg:px-8 lg:py-9">
        <section className="flex flex-col justify-between gap-5 xl:flex-row xl:items-end"><div><h1 className="text-3xl font-bold tracking-[-0.055em] text-ink sm:text-4xl">Gestão de Projetos</h1><p className="mt-2 text-base text-ink-muted">FinTech Innovate 2024</p></div><Link href="/admin/ideathons/fintech-2024/projetos/novo" className="inline-flex min-h-10 items-center justify-center gap-2 rounded-md bg-lime px-4 text-sm font-semibold text-lime-foreground transition-colors hover:bg-lime/85"><Plus className="size-4" />Cadastrar Novo Projeto</Link></section>

        {notice ? <p className="rounded-md bg-lime/30 px-4 py-3 text-sm font-semibold text-lime-deep" role="status">{notice}</p> : null}

        <section className="rounded-lg border border-outline/45 bg-white p-4 shadow-card sm:flex sm:items-center sm:justify-between sm:gap-5" aria-label="Busca e filtros de projetos"><Input id="project-search" label="Buscar projetos" value={search} onChange={(event) => { setSearch(event.target.value); setPage(1); }} placeholder="Buscar projetos..." className="min-h-10 bg-surface-low sm:max-w-sm" /><div className="mt-4 flex flex-wrap gap-2 sm:mt-0 sm:justify-end">{statusFilters.map((filter) => { const count = filter.value === "Todos" ? projects.length : projects.filter((project) => project.status === filter.value).length; const selected = statusFilter === filter.value; return <button type="button" key={filter.value} onClick={() => changeStatusFilter(filter.value)} className={`rounded-full border px-4 py-2 text-xs font-semibold transition-colors ${selected ? "border-lime-deep/30 bg-lime/20 text-lime-deep" : "border-outline/60 bg-white text-ink-muted hover:border-ink-muted hover:text-ink"}`} aria-pressed={selected}>{filter.label} ({count})</button>; })}</div></section>

        <section className="overflow-hidden rounded-lg border border-outline/45 bg-white shadow-card" aria-labelledby="projects-table-title"><h2 id="projects-table-title" className="sr-only">Projetos cadastrados</h2><div className="overflow-x-auto"><table className="w-full min-w-[800px] border-collapse text-left"><thead><tr className="bg-surface-low"><th className="px-6 py-4 text-xs font-semibold text-ink-muted">Projeto</th><th className="px-6 py-4 text-xs font-semibold text-ink-muted">Equipe</th><th className="px-6 py-4 text-xs font-semibold text-ink-muted">Categoria</th><th className="px-6 py-4 text-xs font-semibold text-ink-muted">Status</th><th className="w-20 px-6 py-4 text-right text-xs font-semibold text-ink-muted">Ações</th></tr></thead><tbody className="divide-y divide-outline/40">{visibleProjects.map((project) => <tr key={project.id} className="transition-colors hover:bg-surface-low/45"><td className="px-6 py-4"><p className="text-sm font-bold text-ink">{project.name}</p><p className="mt-0.5 text-sm text-ink-muted">{project.description}</p></td><td className="px-6 py-4 text-sm text-ink">{project.team}</td><td className="px-6 py-4 text-sm text-ink">{project.category}</td><td className="px-6 py-4"><Badge tone={statusTone[project.status]}>{project.status}</Badge></td><td className="px-6 py-4 text-right"><Link href={`/admin/ideathons/fintech-2024/projetos/${project.id}/editar`} className="inline-flex rounded-md p-2 text-ink-muted transition-colors hover:bg-surface-container hover:text-ink" aria-label={`Editar ${project.name}`}><MoreHorizontal className="size-5" /></Link></td></tr>)}</tbody></table></div>{!visibleProjects.length ? <div className="px-6 py-12 text-center text-sm text-ink-muted">Nenhum projeto encontrado.</div> : null}<footer className="flex items-center justify-between border-t border-outline/40 bg-surface-low px-6 py-4 text-sm text-ink-muted"><span>Mostrando {visibleProjects.length ? (page - 1) * pageSize + 1 : 0}–{Math.min(page * pageSize, filteredProjects.length)} de {filteredProjects.length} projetos</span><div className="flex items-center gap-4"><button type="button" onClick={() => setPage((current) => Math.max(1, current - 1))} disabled={page === 1} className="text-2xl leading-none text-ink-muted/50 disabled:cursor-not-allowed" aria-label="Página anterior">‹</button><button type="button" onClick={() => setPage((current) => Math.min(pageCount, current + 1))} disabled={page === pageCount} className="text-2xl leading-none text-ink disabled:cursor-not-allowed" aria-label="Próxima página">›</button></div></footer></section>
      </div>

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title="Cadastrar Novo Projeto"><div className="space-y-4"><Input id="new-project-name" label="Nome do projeto" required value={newProject.name} onChange={(event) => setNewProject((current) => ({ ...current, name: event.target.value }))} placeholder="Ex: PayStream" /><Input id="new-project-description" label="Descrição" value={newProject.description} onChange={(event) => setNewProject((current) => ({ ...current, description: event.target.value }))} placeholder="Resumo da solução" /><Input id="new-project-team" label="Equipe" required value={newProject.team} onChange={(event) => setNewProject((current) => ({ ...current, team: event.target.value }))} placeholder="Ex: CodeCrafters" /><Input id="new-project-category" label="Categoria" required value={newProject.category} onChange={(event) => setNewProject((current) => ({ ...current, category: event.target.value }))} placeholder="Ex: B2B Solutions" /><Select id="new-project-status" label="Status" value={newProject.status} onChange={(event) => setNewProject((current) => ({ ...current, status: event.target.value as ProjectStatus }))}><option value="Em Análise">Em Análise</option><option value="Aprovado">Aprovado</option><option value="Rejeitado">Rejeitado</option></Select><div className="flex justify-end gap-2 pt-2"><Button type="button" variant="ghost" onClick={() => setModalOpen(false)}>Cancelar</Button><Button type="button" onClick={addProject} disabled={!newProject.name.trim() || !newProject.team.trim() || !newProject.category.trim()}>Cadastrar Projeto</Button></div></div></Modal>
    </AppShell>
  );
}

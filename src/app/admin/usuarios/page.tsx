"use client";

import { useState } from "react";
import { Filter, MoreHorizontal, Plus } from "lucide-react";
import { AppShell } from "@/components/app-shell";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input, Select } from "@/components/ui/field";
import { Modal } from "@/components/ui/modal";

type UserRole = "Administrador" | "Avaliador";
type UserStatus = "Ativo" | "Inativo";

type PlatformUser = {
  id: number;
  name: string;
  email: string;
  role: UserRole;
  status: UserStatus;
  lastAccess: string;
  initials: string;
};

const initialUsers: PlatformUser[] = [
  { id: 1, name: "Ana Clara Silva", email: "ana.silva@revvolucao.com", role: "Administrador", status: "Ativo", lastAccess: "Hoje, 09:41", initials: "AS" },
  { id: 2, name: "Marcos Ribeiro", email: "marcos.r@externo.com", role: "Avaliador", status: "Ativo", lastAccess: "Ontem, 16:20", initials: "MR" },
  { id: 3, name: "Carlos Eduardo", email: "carlos.ed@empresa.com", role: "Avaliador", status: "Inativo", lastAccess: "12 Mar 2024", initials: "CE" },
];

const avatarStyles = ["bg-lime/45 text-lime-deep", "bg-surface-container text-ink-muted", "bg-primary-container text-white", "bg-indigo/15 text-indigo-deep"];

export default function UsersPage() {
  const [users, setUsers] = useState(initialUsers);
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState<"all" | UserRole>("all");
  const [statusFilter, setStatusFilter] = useState<"all" | UserStatus>("all");
  const [modalOpen, setModalOpen] = useState(false);
  const [notice, setNotice] = useState("");
  const [newUser, setNewUser] = useState({ name: "", email: "", role: "Administrador" as UserRole, status: "Ativo" as UserStatus });

  const filteredUsers = users.filter((user) => {
    const term = search.trim().toLowerCase();
    return (roleFilter === "all" || user.role === roleFilter)
      && (statusFilter === "all" || user.status === statusFilter)
      && (!term || `${user.name} ${user.email}`.toLowerCase().includes(term));
  });

  function openModal() {
    setNotice("");
    setModalOpen(true);
  }

  function addUser() {
    if (!newUser.name.trim() || !newUser.email.trim()) return;
    const initials = newUser.name.trim().split(/\s+/).slice(0, 2).map((part) => part[0]).join("").toUpperCase();
    setUsers((current) => [...current, { id: Date.now(), name: newUser.name.trim(), email: newUser.email.trim(), role: newUser.role, status: newUser.status, lastAccess: "Nunca", initials }]);
    setNewUser({ name: "", email: "", role: "Administrador", status: "Ativo" });
    setModalOpen(false);
    setNotice("Usuário adicionado com sucesso.");
  }

  return (
    <AppShell
      navigation="management"
      activeSection="users"
      headerAction={<button type="button" onClick={openModal} className="inline-flex min-h-9 items-center gap-2 rounded-full bg-lime px-4 text-xs font-bold text-lime-foreground transition-colors hover:bg-lime/85"><Plus className="size-3.5" />Add User</button>}
    >
      <div className="mx-auto w-full max-w-container space-y-6 px-4 py-7 sm:px-6 lg:px-8 lg:py-9">
        <section className="flex flex-col justify-between gap-5 xl:flex-row xl:items-end">
          <div><h1 className="text-3xl font-bold tracking-[-0.055em] text-ink sm:text-4xl">Gestão de Usuários</h1><p className="mt-2 text-base text-ink-muted">Gerencie acessos, permissões e status dos usuários da plataforma.</p></div>
          <div className="flex items-center gap-2"><button type="button" onClick={() => setFiltersOpen((open) => !open)} className={`inline-flex min-h-10 items-center gap-2 rounded-full border px-4 text-sm font-semibold transition-colors ${filtersOpen ? "border-ink bg-surface-low" : "border-outline bg-white hover:bg-surface-low"}`} aria-expanded={filtersOpen}><Filter className="size-4" />Filtros</button><Button type="button" onClick={openModal}><Plus className="size-4" />Adicionar Usuário</Button></div>
        </section>

        {filtersOpen ? <section className="flex flex-col gap-3 rounded-lg border border-black/[0.04] bg-white p-4 shadow-card sm:flex-row sm:items-end" aria-label="Filtros de usuários"><Input id="user-search" label="Buscar usuário" value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Nome ou e-mail" className="min-h-10" /><Select id="user-role" label="Perfil" value={roleFilter} onChange={(event) => setRoleFilter(event.target.value as "all" | UserRole)} className="min-h-10"><option value="all">Todos os perfis</option><option value="Administrador">Administrador</option><option value="Avaliador">Avaliador</option></Select><Select id="user-status" label="Status" value={statusFilter} onChange={(event) => setStatusFilter(event.target.value as "all" | UserStatus)} className="min-h-10"><option value="all">Todos os status</option><option value="Ativo">Ativo</option><option value="Inativo">Inativo</option></Select></section> : null}

        {notice ? <p className="rounded-md bg-lime/30 px-4 py-3 text-sm font-semibold text-lime-deep" role="status">{notice}</p> : null}

        <section className="overflow-hidden rounded-lg border border-outline/45 bg-white shadow-card" aria-labelledby="users-table-title">
          <h2 id="users-table-title" className="sr-only">Lista de usuários</h2>
          <div className="overflow-x-auto"><table className="w-full min-w-[760px] border-collapse text-left"><thead><tr className="bg-surface-low"><th className="px-6 py-4 text-[11px] font-semibold uppercase tracking-[0.08em] text-ink-muted">Usuário</th><th className="px-6 py-4 text-[11px] font-semibold uppercase tracking-[0.08em] text-ink-muted">Perfil / Papel</th><th className="px-6 py-4 text-[11px] font-semibold uppercase tracking-[0.08em] text-ink-muted">Status</th><th className="px-6 py-4 text-[11px] font-semibold uppercase tracking-[0.08em] text-ink-muted">Último acesso</th><th className="w-20 px-6 py-4 text-right text-[11px] font-semibold uppercase tracking-[0.08em] text-ink-muted">Ações</th></tr></thead><tbody className="divide-y divide-outline/40">{filteredUsers.map((user, index) => <tr key={user.id} className={`transition-colors hover:bg-surface-low/45 ${user.status === "Inativo" ? "text-ink-muted/75" : ""}`}><td className="px-6 py-5"><div className="flex items-center gap-4"><span className={`flex size-10 shrink-0 items-center justify-center rounded-full text-xs font-semibold ${avatarStyles[index % avatarStyles.length]}`}>{user.initials}</span><div><p className="text-sm font-bold text-ink">{user.name}</p><p className="mt-0.5 text-sm text-ink-muted">{user.email}</p></div></div></td><td className="px-6 py-5 text-sm text-ink-muted">{user.role}</td><td className="px-6 py-5"><Badge tone={user.status === "Ativo" ? "lime" : "danger"}>{user.status}</Badge></td><td className="px-6 py-5 text-sm text-ink-muted">{user.lastAccess}</td><td className="px-6 py-5 text-right"><button type="button" onClick={() => setNotice(`Ações de ${user.name} estarão disponíveis com a persistência.`)} className="rounded-md p-2 text-ink-muted transition-colors hover:bg-surface-container hover:text-ink" aria-label={`Ações de ${user.name}`}><MoreHorizontal className="size-5" /></button></td></tr>)}</tbody></table></div>
          {!filteredUsers.length ? <div className="px-6 py-12 text-center text-sm text-ink-muted">Nenhum usuário encontrado com esses filtros.</div> : null}
          <footer className="flex items-center justify-between border-t border-outline/40 bg-surface-low px-6 py-4 text-sm text-ink-muted"><span>Mostrando 1–{filteredUsers.length} de 45 usuários</span><div className="flex items-center gap-4"><button type="button" className="text-2xl leading-none text-ink-muted/50" aria-label="Página anterior">‹</button><button type="button" className="text-2xl leading-none text-ink" aria-label="Próxima página">›</button></div></footer>
        </section>
      </div>

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title="Adicionar Novo Usuário">
        <div className="space-y-4">
          <Input id="new-user-name" label="Nome Completo" required value={newUser.name} onChange={(event) => setNewUser((current) => ({ ...current, name: event.target.value }))} placeholder="Ex: Ana Clara Silva" />
          <Input id="new-user-email" label="E-mail Corporativo" type="email" required value={newUser.email} onChange={(event) => setNewUser((current) => ({ ...current, email: event.target.value }))} placeholder="usuario@empresa.com" />
          <Select id="new-user-role" label="Perfil / Papel" value={newUser.role} onChange={(event) => setNewUser((current) => ({ ...current, role: event.target.value as UserRole }))}><option value="Administrador">Administrador</option><option value="Avaliador">Avaliador</option></Select>
          <fieldset><legend className="mb-2 block text-sm font-semibold text-ink">Status</legend><div className="flex items-center gap-5"><label className="inline-flex cursor-pointer items-center gap-2 text-sm text-ink"><input type="radio" name="new-user-status" value="Ativo" checked={newUser.status === "Ativo"} onChange={() => setNewUser((current) => ({ ...current, status: "Ativo" }))} className="size-4 border-outline text-lime-deep focus:ring-lime" />Ativo</label><label className="inline-flex cursor-pointer items-center gap-2 text-sm text-ink-muted"><input type="radio" name="new-user-status" value="Inativo" checked={newUser.status === "Inativo"} onChange={() => setNewUser((current) => ({ ...current, status: "Inativo" }))} className="size-4 border-outline text-lime-deep focus:ring-lime" />Inativo</label></div></fieldset>
          <div className="-mx-6 mt-6 flex justify-end gap-2 border-t border-outline/40 bg-surface-low px-6 py-4"><Button type="button" variant="ghost" onClick={() => setModalOpen(false)}>Cancelar</Button><Button type="button" onClick={addUser} disabled={!newUser.name.trim() || !newUser.email.trim()}>Cadastrar Usuário</Button></div>
        </div>
      </Modal>
    </AppShell>
  );
}

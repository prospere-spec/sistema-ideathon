"use client";

import { useEffect, useState } from "react";
import { Filter, LoaderCircle, Plus, UserRound } from "lucide-react";
import { AppShell } from "@/components/app-shell";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input, Select } from "@/components/ui/field";
import { Modal } from "@/components/ui/modal";

type UserRole = "ADMIN" | "EVALUATOR";
type UserStatus = "ACTIVE" | "INACTIVE";
type PlatformUser = { id: string; name: string; email: string; role: UserRole; status: UserStatus; updatedAt: string };
const roleLabels = { ADMIN: "Administrador", EVALUATOR: "Avaliador" };
const statusLabels = { ACTIVE: "Ativo", INACTIVE: "Inativo" };

export default function UsersPage() {
  const [users, setUsers] = useState<PlatformUser[]>([]);
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState<"all" | UserRole>("all");
  const [statusFilter, setStatusFilter] = useState<"all" | UserStatus>("all");
  const [modalOpen, setModalOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [notice, setNotice] = useState("");
  const [error, setError] = useState("");
  const [temporaryPassword, setTemporaryPassword] = useState("");
  const [newUser, setNewUser] = useState({ name: "", email: "", role: "EVALUATOR" as UserRole, status: "ACTIVE" as UserStatus });

  async function load() {
    setLoading(true);
    try {
      const response = await fetch("/api/admin/users", { cache: "no-store" });
      const payload = await response.json();
      if (!response.ok) throw new Error(payload.error || "Não foi possível carregar os usuários.");
      setUsers(payload.data);
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : "Não foi possível carregar os usuários.");
    } finally {
      setLoading(false);
    }
  }
  useEffect(() => { void load(); }, []);

  async function addUser() {
    setSaving(true);
    try {
      const response = await fetch("/api/admin/users", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(newUser) });
      const payload = await response.json();
      if (!response.ok) throw new Error(payload.error || "Não foi possível cadastrar o usuário.");
      setUsers((current) => [...current, payload.data]);
      setTemporaryPassword(payload.data.temporaryPassword);
      setNotice("Usuário cadastrado. Entregue a senha temporária com segurança.");
      setNewUser({ name: "", email: "", role: "EVALUATOR", status: "ACTIVE" });
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : "Não foi possível cadastrar o usuário.");
    } finally {
      setSaving(false);
    }
  }

  async function toggleStatus(user: PlatformUser) {
    const status: UserStatus = user.status === "ACTIVE" ? "INACTIVE" : "ACTIVE";
    try {
      const response = await fetch(`/api/admin/users/${user.id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ status }) });
      const payload = await response.json();
      if (!response.ok) throw new Error(payload.error || "Não foi possível atualizar o usuário.");
      setUsers((current) => current.map((item) => item.id === user.id ? payload.data : item));
      setNotice(`Usuário ${status === "ACTIVE" ? "ativado" : "desativado"}.`);
    } catch (toggleError) {
      setError(toggleError instanceof Error ? toggleError.message : "Não foi possível atualizar o usuário.");
    }
  }

  const filteredUsers = users.filter((user) => (roleFilter === "all" || user.role === roleFilter) && (statusFilter === "all" || user.status === statusFilter) && (!search.trim() || `${user.name} ${user.email}`.toLowerCase().includes(search.trim().toLowerCase())));
  return <AppShell navigation="management" activeSection="users" headerAction={<Button type="button" onClick={() => setModalOpen(true)} className="min-h-9 rounded-full px-4 text-xs"><Plus className="size-3.5" />Novo usuário</Button>}><div className="mx-auto w-full max-w-container space-y-6 px-4 py-7 sm:px-6 lg:px-8 lg:py-9"><section className="flex flex-col justify-between gap-5 xl:flex-row xl:items-end"><div><p className="text-xs font-bold uppercase tracking-[0.14em] text-lime-deep">Administração</p><h1 className="mt-2 text-3xl font-bold tracking-[-0.055em] text-ink sm:text-4xl">Gestão de usuários</h1><p className="mt-2 text-base text-ink-muted">Gerencie acessos, permissões e status persistidos na plataforma.</p></div><Button type="button" onClick={() => setModalOpen(true)}><Plus className="size-4" />Adicionar usuário</Button></section>{notice ? <p className="rounded-md bg-lime/30 px-4 py-3 text-sm font-semibold text-lime-deep" role="status">{notice}{temporaryPassword ? <code className="ml-2 rounded bg-white/60 px-2 py-1">{temporaryPassword}</code> : null}</p> : null}{error ? <p className="rounded-md bg-danger-soft/60 px-4 py-3 text-sm font-semibold text-danger" role="alert">{error}</p> : null}<section className="flex flex-col gap-3 rounded-lg border border-outline/45 bg-white p-4 shadow-card sm:flex-row sm:items-end"><button type="button" onClick={() => setFiltersOpen((open) => !open)} className="inline-flex min-h-10 items-center gap-2 self-start rounded-md border border-outline px-4 text-sm font-semibold hover:bg-surface-low" aria-expanded={filtersOpen}><Filter className="size-4" />Filtros</button>{filtersOpen ? <><Input id="user-search" label="Buscar usuário" value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Nome ou e-mail" className="min-h-10" /><Select id="user-role" label="Perfil" value={roleFilter} onChange={(event) => setRoleFilter(event.target.value as "all" | UserRole)} className="min-h-10"><option value="all">Todos os perfis</option><option value="ADMIN">Administradores</option><option value="EVALUATOR">Avaliadores</option></Select><Select id="user-status" label="Status" value={statusFilter} onChange={(event) => setStatusFilter(event.target.value as "all" | UserStatus)} className="min-h-10"><option value="all">Todos os status</option><option value="ACTIVE">Ativos</option><option value="INACTIVE">Inativos</option></Select></> : null}</section><section className="overflow-hidden rounded-lg border border-outline/45 bg-white shadow-card"><div className="overflow-x-auto"><table className="w-full min-w-[760px] border-collapse text-left"><thead><tr className="bg-surface-low"><th className="px-6 py-4 text-xs font-semibold text-ink-muted">Usuário</th><th className="px-6 py-4 text-xs font-semibold text-ink-muted">Perfil</th><th className="px-6 py-4 text-xs font-semibold text-ink-muted">Status</th><th className="px-6 py-4 text-xs font-semibold text-ink-muted">Atualizado</th><th className="px-6 py-4 text-right text-xs font-semibold text-ink-muted">Ação</th></tr></thead><tbody className="divide-y divide-outline/30">{loading ? <tr><td colSpan={5} className="px-6 py-12 text-center text-sm text-ink-muted"><LoaderCircle className="mx-auto size-5 animate-spin" />Carregando usuários...</td></tr> : filteredUsers.map((user) => <tr key={user.id} className="hover:bg-surface-low/40"><td className="px-6 py-5"><div className="flex items-center gap-3"><span className="flex size-10 items-center justify-center rounded-full bg-primary text-lime"><UserRound className="size-4" /></span><div><p className="text-sm font-bold text-ink">{user.name}</p><p className="text-sm text-ink-muted">{user.email}</p></div></div></td><td className="px-6 py-5 text-sm text-ink-muted">{roleLabels[user.role]}</td><td className="px-6 py-5"><Badge tone={user.status === "ACTIVE" ? "lime" : "danger"}>{statusLabels[user.status]}</Badge></td><td className="px-6 py-5 text-sm text-ink-muted">{new Date(user.updatedAt).toLocaleString("pt-BR")}</td><td className="px-6 py-5 text-right"><Button type="button" variant="ghost" onClick={() => void toggleStatus(user)}>{user.status === "ACTIVE" ? "Desativar" : "Ativar"}</Button></td></tr>)}</tbody></table></div>{!loading && !filteredUsers.length ? <p className="px-6 py-12 text-center text-sm text-ink-muted">Nenhum usuário encontrado.</p> : null}<footer className="border-t border-outline/40 bg-surface-low px-6 py-4 text-sm text-ink-muted">Mostrando {filteredUsers.length} de {users.length} usuários</footer></section></div><Modal open={modalOpen} onClose={() => setModalOpen(false)} title="Adicionar usuário"><div className="space-y-4"><Input id="new-user-name" label="Nome completo" required value={newUser.name} onChange={(event) => setNewUser((current) => ({ ...current, name: event.target.value }))} placeholder="Ex: Ana Clara Silva" /><Input id="new-user-email" label="E-mail corporativo" type="email" required value={newUser.email} onChange={(event) => setNewUser((current) => ({ ...current, email: event.target.value }))} placeholder="usuario@empresa.com" /><Select id="new-user-role" label="Perfil" value={newUser.role} onChange={(event) => setNewUser((current) => ({ ...current, role: event.target.value as UserRole }))}><option value="EVALUATOR">Avaliador</option><option value="ADMIN">Administrador</option></Select><Select id="new-user-status" label="Status" value={newUser.status} onChange={(event) => setNewUser((current) => ({ ...current, status: event.target.value as UserStatus }))}><option value="ACTIVE">Ativo</option><option value="INACTIVE">Inativo</option></Select><div className="flex justify-end gap-2 border-t border-outline/40 pt-4"><Button type="button" variant="ghost" onClick={() => setModalOpen(false)}>Cancelar</Button><Button type="button" disabled={saving || !newUser.name.trim() || !newUser.email.trim()} onClick={() => void addUser()}>{saving ? "Cadastrando..." : "Cadastrar usuário"}</Button></div></div></Modal></AppShell>;
}

"use client";

import { useEffect, useState } from "react";
import { Check, Clipboard, Copy, Filter, LoaderCircle, Plus, RefreshCw, UserRound, X } from "lucide-react";
import { AppShell } from "@/components/app-shell";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input, Select } from "@/components/ui/field";
import { Modal } from "@/components/ui/modal";

type UserRole = "ADMIN" | "EVALUATOR";
type UserStatus = "ACTIVE" | "INACTIVE";
type PlatformUser = { id: string; name: string; email: string; role: UserRole; status: UserStatus; updatedAt: string };
type TemporaryPasswordUser = Pick<PlatformUser, "id" | "name" | "email">;

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
  const [copied, setCopied] = useState(false);
  const [temporaryPassword, setTemporaryPassword] = useState("");
  const [temporaryPasswordUser, setTemporaryPasswordUser] = useState<TemporaryPasswordUser | null>(null);
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
    setError("");
    try {
      const response = await fetch("/api/admin/users", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(newUser) });
      const payload = await response.json();
      if (!response.ok) throw new Error(payload.error || "Não foi possível cadastrar o usuário.");
      setUsers((current) => [...current, payload.data]);
      setTemporaryPassword(payload.data.temporaryPassword);
      setTemporaryPasswordUser({ id: payload.data.id, name: payload.data.name, email: payload.data.email });
      setCopied(false);
      setModalOpen(false);
      setNotice("Usuário cadastrado. A senha temporária está pronta para ser copiada.");
      setNewUser({ name: "", email: "", role: "EVALUATOR", status: "ACTIVE" });
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : "Não foi possível cadastrar o usuário.");
    } finally {
      setSaving(false);
    }
  }

  async function resetPassword(user: TemporaryPasswordUser) {
    if (!window.confirm(`Gerar uma nova senha temporária para ${user.name}? A senha anterior deixará de funcionar.`)) return;
    setSaving(true);
    setError("");
    try {
      const response = await fetch(`/api/admin/users/${user.id}`, { method: "POST" });
      const payload = await response.json();
      if (!response.ok) throw new Error(payload.error || "Não foi possível gerar uma nova senha.");
      setTemporaryPassword(payload.data.temporaryPassword);
      setTemporaryPasswordUser({ id: payload.data.id, name: payload.data.name, email: payload.data.email });
      setCopied(false);
      setNotice("Nova senha temporária gerada. Copie e entregue com segurança.");
    } catch (resetError) {
      setError(resetError instanceof Error ? resetError.message : "Não foi possível gerar uma nova senha.");
    } finally {
      setSaving(false);
    }
  }

  async function copyPassword() {
    if (!temporaryPassword) return;
    await navigator.clipboard.writeText(temporaryPassword);
    setCopied(true);
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

  return <AppShell navigation="management" activeSection="users" headerAction={<Button type="button" onClick={() => setModalOpen(true)} className="min-h-9 rounded-full px-4 text-xs"><Plus className="size-3.5" />Novo usuário</Button>}>
    <div className="mx-auto w-full max-w-container space-y-6 px-4 py-7 sm:px-6 lg:px-8 lg:py-9">
      <section className="flex flex-col justify-between gap-5 xl:flex-row xl:items-end"><div><p className="text-xs font-bold uppercase tracking-[0.14em] text-lime-deep">Administração</p><h1 className="mt-2 text-3xl font-bold tracking-[-0.055em] text-ink sm:text-4xl">Gestão de usuários</h1><p className="mt-2 text-base text-ink-muted">Gerencie acessos, permissões e status persistidos na plataforma.</p></div><Button type="button" onClick={() => setModalOpen(true)}><Plus className="size-4" />Adicionar usuário</Button></section>
      {notice ? <p className="rounded-md bg-lime/30 px-4 py-3 text-sm font-semibold text-lime-deep" role="status">{notice}</p> : null}
      {error ? <p className="rounded-md bg-danger-soft/60 px-4 py-3 text-sm font-semibold text-danger" role="alert">{error}</p> : null}
      {temporaryPasswordUser ? <section className="relative overflow-hidden rounded-lg border border-lime/50 bg-primary p-5 text-white shadow-card sm:p-7" aria-label="Senha temporária"><button type="button" onClick={() => setTemporaryPasswordUser(null)} className="absolute right-4 top-4 rounded-md p-1.5 text-white/60 hover:bg-white/10 hover:text-white" aria-label="Fechar senha temporária"><X className="size-5" /></button><div className="flex items-start gap-4"><span className="flex size-11 shrink-0 items-center justify-center rounded-md bg-lime text-lime-foreground"><Clipboard className="size-5" /></span><div className="min-w-0"><p className="text-xs font-bold uppercase tracking-[0.14em] text-lime">Credencial temporária</p><h2 className="mt-1 text-xl font-bold">{temporaryPasswordUser.name}</h2><p className="mt-1 text-sm text-white/65">{temporaryPasswordUser.email} · use esta senha no primeiro acesso</p></div></div><div className="mt-5 flex flex-col gap-3 sm:flex-row sm:items-center"><code className="flex-1 rounded-md border border-white/15 bg-white/10 px-4 py-3 text-lg font-bold tracking-[0.08em] text-lime">{temporaryPassword}</code><Button type="button" variant="secondary" onClick={() => void copyPassword()}><Copy className="size-4" />{copied ? "Copiada" : "Copiar senha"}</Button><Button type="button" variant="ghost" disabled={saving} onClick={() => void resetPassword(temporaryPasswordUser)} className="text-white hover:bg-white/10 hover:text-white"><RefreshCw className="size-4" />Gerar outra</Button></div><p className="mt-3 text-xs text-white/55">A senha só é exibida nesta área. Entregue-a com segurança; o usuário deverá trocá-la no primeiro acesso.</p></section> : null}
      <section className="flex flex-col gap-3 rounded-lg border border-outline/45 bg-white p-4 shadow-card sm:flex-row sm:items-end"><button type="button" onClick={() => setFiltersOpen((open) => !open)} className="inline-flex min-h-10 items-center gap-2 self-start rounded-md border border-outline px-4 text-sm font-semibold hover:bg-surface-low" aria-expanded={filtersOpen}><Filter className="size-4" />Filtros</button>{filtersOpen ? <><Input id="user-search" label="Buscar usuário" value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Nome ou e-mail" className="min-h-10" /><Select id="user-role" label="Perfil" value={roleFilter} onChange={(event) => setRoleFilter(event.target.value as "all" | UserRole)} className="min-h-10"><option value="all">Todos os perfis</option><option value="ADMIN">Administradores</option><option value="EVALUATOR">Avaliadores</option></Select><Select id="user-status" label="Status" value={statusFilter} onChange={(event) => setStatusFilter(event.target.value as "all" | UserStatus)} className="min-h-10"><option value="all">Todos os status</option><option value="ACTIVE">Ativos</option><option value="INACTIVE">Inativos</option></Select></> : <p className="text-sm text-ink-muted">{filteredUsers.length} usuário(s) encontrado(s).</p>}</section>
      <section className="overflow-hidden rounded-lg border border-outline/45 bg-white shadow-card"><div className="overflow-x-auto"><table className="w-full min-w-[900px] border-collapse text-left"><thead><tr className="bg-surface-low"><th className="px-6 py-4 text-xs font-semibold text-ink-muted">Usuário</th><th className="px-6 py-4 text-xs font-semibold text-ink-muted">Perfil</th><th className="px-6 py-4 text-xs font-semibold text-ink-muted">Status</th><th className="px-6 py-4 text-right text-xs font-semibold text-ink-muted">Ações</th></tr></thead><tbody className="divide-y divide-outline/30">{loading ? <tr><td colSpan={4} className="px-6 py-12 text-center text-sm text-ink-muted"><LoaderCircle className="mx-auto size-5 animate-spin" />Carregando usuários...</td></tr> : filteredUsers.map((user) => <tr key={user.id} className="hover:bg-surface-low/40"><td className="px-6 py-4"><div className="flex items-center gap-3"><span className="flex size-10 items-center justify-center rounded-full bg-primary text-xs font-bold text-lime">{user.name.split(/\s+/).slice(0, 2).map((part) => part[0]).join("").toUpperCase()}</span><div><p className="text-sm font-bold text-ink">{user.name}</p><p className="text-xs text-ink-muted">{user.email}</p></div></div></td><td className="px-6 py-4 text-sm text-ink">{roleLabels[user.role]}</td><td className="px-6 py-4"><Badge tone={user.status === "ACTIVE" ? "lime" : "neutral"}>{statusLabels[user.status]}</Badge></td><td className="px-6 py-4 text-right"><div className="flex justify-end gap-2"><Button type="button" variant="secondary" onClick={() => void resetPassword(user)}><RefreshCw className="size-4" />Senha temporária</Button><Button type="button" variant="ghost" onClick={() => void toggleStatus(user)}>{user.status === "ACTIVE" ? "Desativar" : "Ativar"}</Button></div></td></tr>)}</tbody></table></div>{!loading && !filteredUsers.length ? <div className="px-6 py-12 text-center text-sm text-ink-muted"><UserRound className="mx-auto mb-2 size-5" />Nenhum usuário encontrado.</div> : null}</section>
    </div>
    <Modal open={modalOpen} onClose={() => setModalOpen(false)} title="Novo usuário"><div className="space-y-4"><Input id="new-user-name" label="Nome completo" value={newUser.name} onChange={(event) => setNewUser((current) => ({ ...current, name: event.target.value }))} placeholder="Ex: Ana Costa" /><Input id="new-user-email" label="E-mail" type="email" value={newUser.email} onChange={(event) => setNewUser((current) => ({ ...current, email: event.target.value }))} placeholder="ana@empresa.com" /><Select id="new-user-role" label="Perfil" value={newUser.role} onChange={(event) => setNewUser((current) => ({ ...current, role: event.target.value as UserRole }))}><option value="EVALUATOR">Avaliador</option><option value="ADMIN">Administrador</option></Select><Select id="new-user-status" label="Status" value={newUser.status} onChange={(event) => setNewUser((current) => ({ ...current, status: event.target.value as UserStatus }))}><option value="ACTIVE">Ativo</option><option value="INACTIVE">Inativo</option></Select><div className="rounded-md bg-surface-low p-3 text-xs leading-5 text-ink-muted">Uma senha temporária intuitiva será gerada após o cadastro e aparecerá em um painel próprio para copiar ou gerar novamente.</div><div className="flex justify-end gap-2"><Button type="button" variant="ghost" onClick={() => setModalOpen(false)}>Cancelar</Button><Button type="button" loading={saving} onClick={() => void addUser()}><Plus className="size-4" />Cadastrar usuário</Button></div></div></Modal>
  </AppShell>;
}

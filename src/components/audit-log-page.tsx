"use client";

import { useEffect, useState } from "react";
import { ClipboardList, LoaderCircle } from "lucide-react";
import { useParams } from "next/navigation";
import { AppShell } from "@/components/app-shell";

type AuditLog = { id: string; action: string; entityType: string; entityId: string | null; metadata: Record<string, unknown>; createdAt: string; actor: string | null; actorEmail: string | null };

const actionLabels: Record<string, string> = {
  IDEA_CREATED: "Ideia criada",
  IDEA_UPDATED: "Ideia atualizada",
  IDEA_ARCHIVED: "Ideia arquivada",
  ROOM_CREATED: "Sala criada",
  ROOM_UPDATED: "Sala atualizada",
  ROOM_STARTED: "Sala iniciada",
  ROOM_CLOSED: "Sala encerrada",
  ROOM_DELETED: "Sala removida",
  IDEA_ASSIGNED_TO_ROOM: "Ideia atribuída à sala",
  IDEA_REMOVED_FROM_ROOM: "Ideia removida da sala",
  ROOM_EVALUATORS_UPDATED: "Banca atualizada",
  EVALUATION_DRAFT_CREATED: "Rascunho criado",
  EVALUATION_DRAFT_SAVED: "Rascunho salvo",
  EVALUATION_SUBMITTED: "Avaliação enviada",
};

export function AuditLogPage({ ideathonId }: { ideathonId: string }) {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [action, setAction] = useState("");
  const [entityType, setEntityType] = useState("");
  const [loading, setLoading] = useState(true);
  const [notice, setNotice] = useState("");

  useEffect(() => {
    let active = true;
    const query = new URLSearchParams({ limit: "100" });
    if (action) query.set("action", action);
    if (entityType) query.set("entityType", entityType);
    fetch(`/api/admin/ideathons/${ideathonId}/audit-logs?${query}`)
      .then(async (response) => {
        const payload = await response.json();
        if (!response.ok) throw new Error(payload.error || "Não foi possível carregar a auditoria.");
        return payload;
      })
      .then((payload) => active && setLogs(payload.data))
      .catch((error: Error) => active && setNotice(error.message))
      .finally(() => active && setLoading(false));
    return () => {
      active = false;
    };
  }, [action, entityType, ideathonId]);

  return (
    <AppShell navigation="management" activeSection="ideathons" darkHeader>
      <div className="mx-auto w-full max-w-container space-y-6 px-4 py-7 sm:px-6 lg:px-8 lg:py-9">
        <section><p className="flex items-center gap-2 text-xs font-bold uppercase tracking-[0.14em] text-lime-deep"><ClipboardList className="size-4" />Rastreabilidade</p><h1 className="mt-2 text-3xl font-bold tracking-[-0.055em] text-ink sm:text-4xl">Auditoria</h1><p className="mt-2 text-base text-ink-muted">Histórico das operações administrativas e avaliações deste ideathon.</p></section>
        {notice ? <p className="rounded-md bg-danger-soft/60 px-4 py-3 text-sm font-semibold text-danger" role="alert">{notice}</p> : null}
        <section className="flex flex-col gap-4 rounded-lg border border-outline/45 bg-white p-4 shadow-card sm:flex-row sm:items-end"><label className="w-full text-xs font-bold text-ink-muted sm:max-w-xs">Ação<select value={action} onChange={(event) => setAction(event.target.value)} className="mt-2 min-h-11 w-full rounded-md border border-outline/70 bg-white px-3.5 text-sm font-normal text-ink focus:border-lime focus:outline-none focus:ring-2 focus:ring-lime/40"><option value="">Todas as ações</option>{Object.entries(actionLabels).map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></label><label className="w-full text-xs font-bold text-ink-muted sm:max-w-xs">Entidade<select value={entityType} onChange={(event) => setEntityType(event.target.value)} className="mt-2 min-h-11 w-full rounded-md border border-outline/70 bg-white px-3.5 text-sm font-normal text-ink focus:border-lime focus:outline-none focus:ring-2 focus:ring-lime/40"><option value="">Todas as entidades</option><option value="IDEA">Ideia</option><option value="ROOM">Sala</option><option value="PHASE_IDEA">Ideia na fase</option><option value="EVALUATION">Avaliação</option></select></label></section>
        <section className="overflow-hidden rounded-lg border border-outline/45 bg-white shadow-card"><div className="overflow-x-auto"><table className="w-full min-w-[760px] border-collapse text-left"><thead><tr className="bg-surface-low"><th className="px-6 py-4 text-xs font-semibold text-ink-muted">Data</th><th className="px-6 py-4 text-xs font-semibold text-ink-muted">Ação</th><th className="px-6 py-4 text-xs font-semibold text-ink-muted">Ator</th><th className="px-6 py-4 text-xs font-semibold text-ink-muted">Entidade</th><th className="px-6 py-4 text-xs font-semibold text-ink-muted">Detalhes</th></tr></thead><tbody className="divide-y divide-outline/30">{loading ? <tr><td colSpan={5} className="px-6 py-12 text-center text-sm text-ink-muted"><LoaderCircle className="mx-auto size-5 animate-spin" />Carregando histórico...</td></tr> : logs.map((log) => <tr key={log.id} className="hover:bg-surface-low/40"><td className="whitespace-nowrap px-6 py-4 text-xs text-ink-muted">{new Date(log.createdAt).toLocaleString("pt-BR")}</td><td className="px-6 py-4 text-sm font-semibold text-ink">{actionLabels[log.action] || log.action}</td><td className="px-6 py-4"><p className="text-sm text-ink">{log.actor || "Sistema"}</p><p className="text-xs text-ink-muted">{log.actorEmail || ""}</p></td><td className="px-6 py-4 text-xs font-semibold text-ink-muted">{log.entityType}</td><td className="max-w-md px-6 py-4 text-xs text-ink-muted"><code className="break-all">{JSON.stringify(log.metadata)}</code></td></tr>)}</tbody></table></div>{!loading && !logs.length ? <div className="px-6 py-12 text-center text-sm text-ink-muted">Nenhum evento encontrado.</div> : null}</section>
      </div>
    </AppShell>
  );
}

"use client";

import { useEffect, useState } from "react";
import { Check, Layers3 } from "lucide-react";
import Link from "next/link";
import { AppShell } from "@/components/app-shell";
import { Button } from "@/components/ui/button";

type Room = { id: string; name: string; status: "DRAFT" | "READY" | "LIVE" | "CLOSED"; position: number };
type PhaseIdea = { id: string; name: string; category: string | null; teamName: string; phaseIdeaId: string | null; roomId: string | null; roomName: string | null; presentationOrder: number | null; participationStatus: string | null };
type PhaseIdeasPayload = { phase: { name: string; status: string }; rooms: Room[]; data: PhaseIdea[]; error?: string };
type AssignmentPayload = { data: { id: string; orderedIds?: string[]; presentationOrder: number | null }; error?: string };

async function readJsonResponse<T>(response: Response): Promise<Partial<T>> {
  const body = await response.text();
  if (!body.trim()) return {};
  try {
    const payload: unknown = JSON.parse(body);
    return payload && typeof payload === "object" ? payload as Partial<T> : {};
  } catch {
    return {};
  }
}

export function PhaseIdeasPage({ ideathonId, phaseId }: { ideathonId: string; phaseId: string }) {
  const [phaseName, setPhaseName] = useState("Fase");
  const [phaseStatus, setPhaseStatus] = useState("");
  const [ideas, setIdeas] = useState<PhaseIdea[]>([]);
  const [rooms, setRooms] = useState<Room[]>([]);
  const [notice, setNotice] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [savingId, setSavingId] = useState("");

  useEffect(() => {
    let active = true;
    fetch(`/api/admin/ideathons/${ideathonId}/phases/${phaseId}/ideas`)
      .then(async (response) => {
        const payload = await readJsonResponse<PhaseIdeasPayload>(response);
        if (!response.ok) throw new Error(payload.error || "Não foi possível carregar as ideias.");
        if (!payload.phase || !payload.data || !payload.rooms) throw new Error("A resposta da API de ideias está incompleta.");
        return payload as PhaseIdeasPayload;
      })
      .then((payload) => {
        if (!active) return;
        setPhaseName(payload.phase.name);
        setPhaseStatus(payload.phase.status);
        setIdeas(payload.data);
        setRooms(payload.rooms);
      })
      .catch((error: Error) => active && setError(error.message))
      .finally(() => active && setLoading(false));
    return () => {
      active = false;
    };
  }, [ideathonId, phaseId]);

  async function assignIdea(idea: PhaseIdea, roomId: string | null) {
    setSavingId(idea.id);
    setError("");
    try {
      const response = await fetch(`/api/admin/ideathons/${ideathonId}/phases/${phaseId}/ideas/${idea.id}/room`, { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ roomId }) });
      const payload = await readJsonResponse<AssignmentPayload>(response);
      if (!response.ok) {
        setError(payload.error || "Não foi possível atualizar a distribuição.");
        return;
      }
      if (!payload.data) {
        setError("A resposta da API de distribuição está incompleta.");
        return;
      }
      const data = payload.data;
      const room = rooms.find((item) => item.id === roomId);
      const orderedIds = Array.isArray(data.orderedIds) ? data.orderedIds as string[] : [];
      setIdeas((current) => current.map((item) => {
        const updated = item.id === idea.id ? { ...item, phaseIdeaId: data.id, roomId, roomName: room?.name || null, presentationOrder: data.presentationOrder } : item;
        const orderIndex = updated.phaseIdeaId ? orderedIds.indexOf(updated.phaseIdeaId) : -1;
        return orderIndex >= 0 ? { ...updated, presentationOrder: orderIndex + 1 } : updated;
      }));
      setNotice(roomId ? `“${idea.name}” atribuída à ${room?.name}.` : `“${idea.name}” removida da sala.`);
    } catch {
      setError("Não foi possível atualizar a distribuição.");
    } finally {
      setSavingId("");
    }
  }

  async function saveOrder(idea: PhaseIdea, value: string) {
    if (!idea.roomId) return;
    const presentationOrder = Number(value);
    if (!Number.isInteger(presentationOrder) || presentationOrder < 1) {
      setError("Informe uma ordem de apresentação inteira e positiva.");
      return;
    }
    setSavingId(idea.id);
    setError("");
    try {
      const response = await fetch(`/api/admin/ideathons/${ideathonId}/phases/${phaseId}/ideas/${idea.id}/room`, { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ roomId: idea.roomId, presentationOrder }) });
      const payload = await readJsonResponse<AssignmentPayload>(response);
      if (!response.ok) {
        setError(payload.error || "Não foi possível salvar a ordem.");
        return;
      }
      if (!payload.data) {
        setError("A resposta da API de ordem está incompleta.");
        return;
      }
      const data = payload.data;
      const orderedIds = Array.isArray(data.orderedIds) ? data.orderedIds as string[] : [];
      setIdeas((current) => current.map((item) => {
        const updated = item.id === idea.id ? { ...item, presentationOrder: data.presentationOrder } : item;
        const orderIndex = updated.phaseIdeaId ? orderedIds.indexOf(updated.phaseIdeaId) : -1;
        return orderIndex >= 0 ? { ...updated, presentationOrder: orderIndex + 1 } : updated;
      }));
      setNotice(`Ordem de “${idea.name}” atualizada.`);
    } catch {
      setError("Não foi possível salvar a ordem.");
    } finally {
      setSavingId("");
    }
  }

  const distributionEditable = phaseStatus !== "LIVE" && phaseStatus !== "CLOSED";
  const orderEditable = phaseStatus !== "CLOSED";

  return (
    <AppShell navigation="management" activeSection="ideathons" darkHeader>
      <div className="mx-auto w-full max-w-container space-y-6 px-4 py-7 sm:px-6 lg:px-8 lg:py-9">
        <section className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end"><div><Link href={`/admin/ideathons/${ideathonId}/salas`} className="text-xs font-bold uppercase tracking-[0.14em] text-lime-deep hover:underline">Salas e bancas</Link><h1 className="mt-2 text-3xl font-bold tracking-[-0.055em] text-ink sm:text-4xl">Ideias por fase</h1><p className="mt-2 text-base text-ink-muted">{phaseName}</p></div><span className="rounded-full bg-surface-container px-3 py-2 text-xs font-bold text-ink-muted">{phaseStatus || "Carregando"}</span></section>
        {notice ? <p className="rounded-md bg-lime/30 px-4 py-3 text-sm font-semibold text-lime-deep" role="status">{notice}</p> : null}
        {error ? <p className="rounded-md bg-danger-soft/60 px-4 py-3 text-sm font-semibold text-danger" role="alert">{error}</p> : null}
        {phaseStatus === "LIVE" ? <p className="rounded-md bg-indigo/10 px-4 py-3 text-sm text-indigo-deep">A distribuição está bloqueada porque a fase está ao vivo. A ordem de apresentação continua disponível para ajustes.</p> : null}
        <section className="overflow-hidden rounded-lg border border-outline/45 bg-white shadow-card"><div className="overflow-x-auto"><table className="w-full min-w-[900px] border-collapse text-left"><thead><tr className="bg-surface-low"><th className="px-6 py-4 text-xs font-semibold text-ink-muted">Ideia</th><th className="px-6 py-4 text-xs font-semibold text-ink-muted">Equipe</th><th className="px-6 py-4 text-xs font-semibold text-ink-muted">Participação</th><th className="px-6 py-4 text-xs font-semibold text-ink-muted">Sala</th><th className="px-6 py-4 text-xs font-semibold text-ink-muted">Ordem de apresentação</th></tr></thead><tbody className="divide-y divide-outline/40">{loading ? <tr><td colSpan={5} className="px-6 py-12 text-center text-sm text-ink-muted">Carregando ideias...</td></tr> : ideas.map((idea) => <tr key={idea.id} className="hover:bg-surface-low/40"><td className="px-6 py-4"><p className="text-sm font-bold text-ink">{idea.name}</p><p className="mt-1 max-w-sm truncate text-xs text-ink-muted">{idea.category || "Sem categoria"}</p></td><td className="px-6 py-4 text-sm text-ink">{idea.teamName}</td><td className="px-6 py-4">{idea.phaseIdeaId ? <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-lime-deep"><Check className="size-4" />Incluída na fase</span> : <Button type="button" variant="secondary" disabled={!distributionEditable || savingId === idea.id} onClick={() => void assignIdea(idea, null)} className="min-h-9 px-3 py-1 text-xs"><Layers3 className="size-3.5" />Incluir na fase</Button>}</td><td className="px-6 py-4"><select aria-label={`Sala da ideia ${idea.name}`} disabled={!distributionEditable || savingId === idea.id} value={idea.roomId || ""} onChange={(event) => void assignIdea(idea, event.target.value || null)} className="min-h-10 w-full max-w-xs rounded-md border border-outline/70 bg-white px-3 text-sm text-ink focus:border-lime focus:outline-none focus:ring-2 focus:ring-lime/40"><option value="">Sem sala</option>{rooms.map((room) => <option key={room.id} value={room.id} disabled={room.status === "LIVE" || room.status === "CLOSED"}>{room.name}</option>)}</select></td><td className="px-6 py-4"><input type="number" min="1" aria-label={`Ordem de apresentação da ideia ${idea.name}`} disabled={!idea.roomId || !orderEditable || savingId === idea.id} value={idea.presentationOrder ?? ""} onChange={(event) => setIdeas((current) => current.map((item) => item.id === idea.id ? { ...item, presentationOrder: event.target.value ? Number(event.target.value) : null } : item))} onBlur={(event) => void saveOrder(idea, event.currentTarget.value)} placeholder="Automática" className="min-h-10 w-32 rounded-md border border-outline/70 bg-white px-3 text-sm text-ink focus:border-lime focus:outline-none focus:ring-2 focus:ring-lime/40 disabled:bg-surface-low" /></td></tr>)}</tbody></table></div>{!loading && !ideas.length ? <div className="px-6 py-12 text-center text-sm text-ink-muted">Nenhuma ideia cadastrada neste ideathon.</div> : null}</section>
      </div>
    </AppShell>
  );
}

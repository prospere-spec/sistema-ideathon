"use client";

import { useEffect, useState } from "react";
import { DoorOpen, Layers3, Pencil, Plus, Save, Users } from "lucide-react";
import Link from "next/link";
import { AppShell } from "@/components/app-shell";
import { Button } from "@/components/ui/button";

type Phase = { id: string; name: string; position: number; status: string };
type Room = { id: string; name: string; position: number; status: "DRAFT" | "READY" | "LIVE" | "CLOSED"; phaseId: string; phaseName: string; phaseStatus: string; ideaCount: number; evaluatorCount: number };

const statusLabel = { DRAFT: "Rascunho", READY: "Pronta", LIVE: "Ao vivo", CLOSED: "Encerrada" };

export function RoomManagementPage({ ideathonId }: { ideathonId: string }) {
  const [rooms, setRooms] = useState<Room[]>([]);
  const [phases, setPhases] = useState<Phase[]>([]);
  const [phaseId, setPhaseId] = useState("");
  const [name, setName] = useState("");
  const [editingRoomId, setEditingRoomId] = useState("");
  const [editingName, setEditingName] = useState("");
  const [editingPosition, setEditingPosition] = useState(0);
  const [notice, setNotice] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    let active = true;
    fetch(`/api/admin/ideathons/${ideathonId}/rooms`)
      .then(async (response) => {
        const payload = await response.json();
        if (!response.ok) throw new Error(payload.error || "Não foi possível carregar as salas.");
        return payload;
      })
      .then((payload) => {
        if (!active) return;
        setRooms(payload.data);
        setPhases(payload.phases);
        setPhaseId((current: string) => current || payload.phases[0]?.id || "");
      })
      .catch((error: Error) => active && setNotice(error.message))
      .finally(() => active && setLoading(false));
    return () => {
      active = false;
    };
  }, [ideathonId]);

  async function createRoom() {
    if (!name.trim() || !phaseId) return;
    setSaving(true);
    const response = await fetch(`/api/admin/ideathons/${ideathonId}/rooms`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ name, phaseId }) });
    const payload = await response.json();
    setSaving(false);
    if (!response.ok) {
      setNotice(payload.error || "Não foi possível criar a sala.");
      return;
    }
    const phase = phases.find((item) => item.id === phaseId);
    setRooms((current) => [...current, { ...payload.data, phaseId, phaseName: phase?.name || "", phaseStatus: phase?.status || "DRAFT", ideaCount: 0, evaluatorCount: 0 }]);
    setName("");
    setNotice("Sala criada com sucesso.");
  }

  async function saveRoomDetails() {
    const room = rooms.find((item) => item.id === editingRoomId);
    if (!room || !editingName.trim()) return;
    setSaving(true);
    const response = await fetch(`/api/admin/ideathons/${ideathonId}/rooms/${room.id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ name: editingName, position: editingPosition }) });
    const payload = await response.json();
    setSaving(false);
    if (!response.ok) {
      setNotice(payload.error || "Não foi possível editar a sala.");
      return;
    }
    setRooms((current) => current.map((item) => item.id === room.id ? { ...item, ...payload.data } : item).sort((left, right) => left.phaseId.localeCompare(right.phaseId) || left.position - right.position));
    setEditingRoomId("");
    setNotice("Sala atualizada com sucesso.");
  }

  async function changeStatus(room: Room, status: Room["status"]) {
    const response = await fetch(`/api/admin/ideathons/${ideathonId}/rooms/${room.id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ status }) });
    const payload = await response.json();
    if (!response.ok) {
      setNotice(payload.error || "Não foi possível atualizar a sala.");
      return;
    }
    setRooms((current) => current.map((item) => item.id === room.id ? { ...item, ...payload.data } : item));
    setNotice(`Sala ${statusLabel[status].toLowerCase()} com sucesso.`);
  }

  async function removeRoom(room: Room) {
    if (!window.confirm(`Remover a sala “${room.name}”?`)) return;
    const response = await fetch(`/api/admin/ideathons/${ideathonId}/rooms/${room.id}`, { method: "DELETE" });
    const payload = await response.json();
    if (!response.ok) {
      setNotice(payload.error || "Não foi possível remover a sala.");
      return;
    }
    if (payload.data.deleted) setRooms((current) => current.filter((item) => item.id !== room.id));
    else setRooms((current) => current.map((item) => item.id === room.id ? { ...item, status: "CLOSED" } : item));
    setNotice(payload.data.deleted ? "Sala removida com sucesso." : "A sala foi encerrada porque já possui uso registrado.");
  }

  return (
    <AppShell navigation="management" activeSection="ideathons" darkHeader>
      <div className="mx-auto w-full max-w-container space-y-6 px-4 py-7 sm:px-6 lg:px-8 lg:py-9">
        <section><p className="text-xs font-bold uppercase tracking-[0.14em] text-lime-deep">Operação do ideathon</p><h1 className="mt-2 text-3xl font-bold tracking-[-0.055em] text-ink sm:text-4xl">Salas e bancas</h1><p className="mt-2 max-w-2xl text-base text-ink-muted">Crie as salas de avaliação e prepare a distribuição por fase.</p></section>
        {notice ? <p className="rounded-md bg-lime/30 px-4 py-3 text-sm font-semibold text-lime-deep" role="status">{notice}</p> : null}
        <section className="rounded-lg border border-outline/45 bg-white p-5 shadow-card sm:p-7" aria-labelledby="new-room-title"><div className="flex items-center gap-3"><span className="flex size-9 items-center justify-center rounded-full bg-lime/30 text-lime-deep"><Plus className="size-5" /></span><div><h2 id="new-room-title" className="text-lg font-bold text-ink">Criar sala</h2><p className="text-sm text-ink-muted">A sala começará em rascunho.</p></div></div><div className="mt-6 grid grid-cols-1 gap-4 md:grid-cols-[1fr_1fr_auto] md:items-end"><label className="text-xs font-bold text-ink-muted">Nome da sala<input value={name} onChange={(event) => setName(event.target.value)} placeholder="Ex: Banca Norte" className="mt-2 min-h-11 w-full rounded-md border border-outline/70 bg-surface-low px-3.5 text-sm font-normal text-ink focus:border-lime focus:bg-white focus:outline-none focus:ring-2 focus:ring-lime/40" /></label><label className="text-xs font-bold text-ink-muted">Fase<select value={phaseId} onChange={(event) => setPhaseId(event.target.value)} className="mt-2 min-h-11 w-full rounded-md border border-outline/70 bg-surface-low px-3.5 text-sm font-normal text-ink focus:border-lime focus:bg-white focus:outline-none focus:ring-2 focus:ring-lime/40"><option value="">Selecione uma fase</option>{phases.map((phase) => <option key={phase.id} value={phase.id} disabled={phase.status === "LIVE" || phase.status === "CLOSED"}>{phase.name} ({statusLabel[phase.status as keyof typeof statusLabel] || phase.status})</option>)}</select></label><Button type="button" disabled={saving || loading || !name.trim() || !phaseId} onClick={() => void createRoom()}><Plus className="size-4" />Criar sala</Button></div></section>
        <section className="grid grid-cols-1 gap-4 lg:grid-cols-2" aria-label="Salas cadastradas">{loading ? <p className="text-sm text-ink-muted">Carregando salas...</p> : rooms.map((room) => <article key={room.id} className="rounded-lg border border-outline/45 bg-white p-5 shadow-card sm:p-6"><div className="flex items-start justify-between gap-4"><div className="flex min-w-0 items-center gap-3"><span className="flex size-11 shrink-0 items-center justify-center rounded-md bg-primary text-lime"><DoorOpen className="size-5" /></span><div className="min-w-0"><h2 className="truncate text-lg font-bold text-ink">{room.name}</h2><p className="mt-0.5 text-sm text-ink-muted">{room.phaseName} · posição {room.position}</p></div></div><span className={`rounded-full px-3 py-1 text-xs font-bold ${room.status === "LIVE" ? "bg-lime/30 text-lime-deep" : room.status === "CLOSED" ? "bg-surface-container text-ink-muted" : "bg-indigo/10 text-indigo-deep"}`}>{statusLabel[room.status]}</span></div>{editingRoomId === room.id ? <div className="mt-4 grid grid-cols-[1fr_100px_auto] items-end gap-2 rounded-md bg-surface-low p-3"><label className="text-xs font-bold text-ink-muted">Nome<input value={editingName} onChange={(event) => setEditingName(event.target.value)} className="mt-1 min-h-10 w-full rounded-md border border-outline/60 bg-white px-3 text-sm font-normal text-ink focus:border-lime focus:outline-none" /></label><label className="text-xs font-bold text-ink-muted">Posição<input type="number" min="0" value={editingPosition} onChange={(event) => setEditingPosition(Number(event.target.value))} className="mt-1 min-h-10 w-full rounded-md border border-outline/60 bg-white px-3 text-sm font-normal text-ink focus:border-lime focus:outline-none" /></label><div className="flex gap-1"><Button type="button" disabled={saving} onClick={() => void saveRoomDetails()} className="px-3"><Save className="size-4" /><span className="sr-only">Salvar</span></Button><Button type="button" variant="ghost" onClick={() => setEditingRoomId("")} className="px-3">Cancelar</Button></div></div> : null}<div className="mt-6 grid grid-cols-2 gap-3"><div className="rounded-md bg-surface-low p-3"><p className="text-xs text-ink-muted">Ideias</p><p className="mt-1 flex items-center gap-2 text-lg font-bold text-ink"><Layers3 className="size-4 text-lime-deep" />{room.ideaCount}</p></div><div className="rounded-md bg-surface-low p-3"><p className="text-xs text-ink-muted">Avaliadores</p><p className="mt-1 flex items-center gap-2 text-lg font-bold text-ink"><Users className="size-4 text-lime-deep" />{room.evaluatorCount}</p></div></div><div className="mt-5 flex flex-wrap items-center gap-2 border-t border-outline/30 pt-4">{room.status !== "LIVE" && room.status !== "CLOSED" ? <button type="button" onClick={() => { setEditingRoomId(room.id); setEditingName(room.name); setEditingPosition(room.position); }} className="inline-flex items-center gap-1 rounded-md border border-outline px-3 py-2 text-xs font-semibold text-ink hover:bg-surface-low"><Pencil className="size-3.5" />Editar</button> : null}<Link href={`/admin/ideathons/${ideathonId}/fases/${room.phaseId}/ideias`} className="rounded-md border border-outline px-3 py-2 text-xs font-semibold text-ink hover:bg-surface-low">Distribuir ideias</Link><Link href={`/admin/ideathons/${ideathonId}/avaliadores`} className="rounded-md border border-outline px-3 py-2 text-xs font-semibold text-ink hover:bg-surface-low">Configurar banca</Link>{room.status === "DRAFT" ? <button type="button" onClick={() => void changeStatus(room, "READY")} className="rounded-md bg-lime px-3 py-2 text-xs font-bold text-lime-foreground hover:bg-lime/85">Marcar pronta</button> : null}{room.status === "READY" ? <button type="button" onClick={() => void changeStatus(room, "LIVE")} className="rounded-md bg-primary px-3 py-2 text-xs font-bold text-white hover:bg-primary/90">Iniciar sala</button> : null}{room.status !== "LIVE" && room.status !== "CLOSED" ? <button type="button" onClick={() => void removeRoom(room)} className="ml-auto rounded-md px-3 py-2 text-xs font-semibold text-danger hover:bg-danger-soft">Remover</button> : null}</div></article>)}</section>
        {!loading && !rooms.length ? <div className="rounded-lg border border-dashed border-outline bg-white px-6 py-12 text-center text-sm text-ink-muted">Nenhuma sala criada neste ideathon.</div> : null}
      </div>
    </AppShell>
  );
}

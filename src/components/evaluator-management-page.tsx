"use client";

import { useEffect, useState } from "react";
import { Check, Users } from "lucide-react";
import Link from "next/link";
import { AppShell } from "@/components/app-shell";
import { Button } from "@/components/ui/button";

type Room = { id: string; name: string; status: "DRAFT" | "READY" | "LIVE" | "CLOSED"; phaseId: string; phaseName: string };
type AssignedRoom = { id: string; name: string; phaseId: string; phaseName: string };
type Evaluator = { id: string; name: string; email: string; rooms: AssignedRoom[] };

export function EvaluatorManagementPage({ ideathonId }: { ideathonId: string }) {
  const [rooms, setRooms] = useState<Room[]>([]);
  const [evaluators, setEvaluators] = useState<Evaluator[]>([]);
  const [selectedRoomId, setSelectedRoomId] = useState("");
  const [selectedEvaluatorIds, setSelectedEvaluatorIds] = useState<string[]>([]);
  const [notice, setNotice] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    let active = true;
    Promise.all([fetch(`/api/admin/ideathons/${ideathonId}/rooms`).then(async (response) => { const payload = await response.json(); if (!response.ok) throw new Error(payload.error); return payload; }), fetch(`/api/admin/ideathons/${ideathonId}/evaluators`).then(async (response) => { const payload = await response.json(); if (!response.ok) throw new Error(payload.error); return payload; })])
      .then(([roomPayload, evaluatorPayload]) => {
        if (!active) return;
        setRooms(roomPayload.data);
        setEvaluators(evaluatorPayload.data);
        setSelectedRoomId(roomPayload.data[0]?.id || "");
      })
      .catch((error: Error) => active && setError(error.message || "Não foi possível carregar os avaliadores."))
      .finally(() => active && setLoading(false));
    return () => {
      active = false;
    };
  }, [ideathonId]);

  useEffect(() => {
    if (!selectedRoomId) {
      setSelectedEvaluatorIds([]);
      return;
    }
    setSelectedEvaluatorIds(evaluators.filter((evaluator) => evaluator.rooms.some((room) => room.id === selectedRoomId)).map((evaluator) => evaluator.id));
  }, [evaluators, selectedRoomId]);

  const selectedRoom = rooms.find((room) => room.id === selectedRoomId);
  const canEdit = selectedRoom?.status === "DRAFT" || selectedRoom?.status === "READY";

  async function saveAssignments() {
    if (!selectedRoomId || !canEdit) return;
    setSaving(true);
    setError("");
    const response = await fetch(`/api/admin/ideathons/${ideathonId}/rooms/${selectedRoomId}/evaluators`, { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ evaluatorIds: selectedEvaluatorIds }) });
    const payload = await response.json();
    setSaving(false);
    if (!response.ok) {
      setError(payload.error || "Não foi possível atualizar a banca.");
      return;
    }
    setEvaluators((current) => current.map((evaluator) => {
      const withoutRoom = evaluator.rooms.filter((room) => room.id !== selectedRoomId);
      return selectedEvaluatorIds.includes(evaluator.id) && selectedRoom ? { ...evaluator, rooms: [...withoutRoom, { id: selectedRoom.id, name: selectedRoom.name, phaseId: selectedRoom.phaseId, phaseName: selectedRoom.phaseName }] } : { ...evaluator, rooms: withoutRoom };
    }));
    setNotice("Composição da banca atualizada.");
  }

  function toggleEvaluator(id: string) {
    setSelectedEvaluatorIds((current) => current.includes(id) ? current.filter((item) => item !== id) : [...current, id]);
  }

  return (
    <AppShell navigation="management" activeSection="ideathons" darkHeader>
      <div className="mx-auto w-full max-w-container space-y-6 px-4 py-7 sm:px-6 lg:px-8 lg:py-9">
        <section><Link href={`/admin/ideathons/${ideathonId}/salas`} className="text-xs font-bold uppercase tracking-[0.14em] text-lime-deep hover:underline">Salas e bancas</Link><h1 className="mt-2 text-3xl font-bold tracking-[-0.055em] text-ink sm:text-4xl">Avaliadores</h1><p className="mt-2 max-w-2xl text-base text-ink-muted">Monte a composição de cada banca com avaliadores ativos.</p></section>
        {notice ? <p className="rounded-md bg-lime/30 px-4 py-3 text-sm font-semibold text-lime-deep" role="status">{notice}</p> : null}
        {error ? <p className="rounded-md bg-danger-soft/60 px-4 py-3 text-sm font-semibold text-danger" role="alert">{error}</p> : null}
        <section className="rounded-lg border border-outline/45 bg-white p-5 shadow-card sm:p-7" aria-labelledby="room-selector-title"><div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end"><div><h2 id="room-selector-title" className="text-lg font-bold text-ink">Banca selecionada</h2><p className="mt-1 text-sm text-ink-muted">A mesma pessoa pode participar de várias salas.</p></div><label className="w-full text-xs font-bold text-ink-muted sm:max-w-sm">Sala<select value={selectedRoomId} onChange={(event) => setSelectedRoomId(event.target.value)} disabled={loading} className="mt-2 min-h-11 w-full rounded-md border border-outline/70 bg-white px-3.5 text-sm font-normal text-ink focus:border-lime focus:outline-none focus:ring-2 focus:ring-lime/40"><option value="">Selecione uma sala</option>{rooms.map((room) => <option key={room.id} value={room.id}>{room.name} · {room.phaseName} ({room.status})</option>)}</select></label></div>{selectedRoom && !canEdit ? <p className="mt-4 rounded-md bg-surface-low px-3 py-2 text-xs font-semibold text-ink-muted">Esta sala está {selectedRoom.status === "LIVE" ? "ao vivo" : "encerrada"} e não aceita alterações.</p> : null}</section>
        <section className="rounded-lg border border-outline/45 bg-white shadow-card" aria-labelledby="evaluator-list-title"><div className="flex items-center justify-between gap-4 border-b border-outline/40 px-5 py-5 sm:px-7"><div><h2 id="evaluator-list-title" className="text-xl font-bold text-ink">Avaliadores ativos</h2><p className="mt-1 text-sm text-ink-muted">{selectedEvaluatorIds.length} selecionado(s) para esta banca</p></div><Button type="button" disabled={!selectedRoomId || !canEdit || saving} onClick={() => void saveAssignments()}><Check className="size-4" />{saving ? "Salvando..." : "Salvar banca"}</Button></div><div className="divide-y divide-outline/30">{loading ? <p className="px-6 py-12 text-center text-sm text-ink-muted">Carregando avaliadores...</p> : evaluators.map((evaluator) => <label key={evaluator.id} className="flex cursor-pointer items-center gap-4 px-5 py-4 hover:bg-surface-low/50 sm:px-7"><input type="checkbox" checked={selectedEvaluatorIds.includes(evaluator.id)} onChange={() => toggleEvaluator(evaluator.id)} disabled={!selectedRoomId || !canEdit} className="size-4 rounded border-outline text-lime-deep focus:ring-lime" /><span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-primary text-sm font-bold text-lime">{evaluator.name.split(/\s+/).slice(0, 2).map((part) => part[0]).join("").toUpperCase()}</span><span className="min-w-0 flex-1"><strong className="block text-sm text-ink">{evaluator.name}</strong><span className="block truncate text-xs text-ink-muted">{evaluator.email}</span></span><span className="hidden items-center gap-1 text-xs text-ink-muted sm:flex"><Users className="size-3.5" />{evaluator.rooms.length} sala(s)</span></label>)}</div>{!loading && !evaluators.length ? <div className="px-6 py-12 text-center text-sm text-ink-muted">Nenhum avaliador ativo cadastrado.</div> : null}</section>
        <section className="rounded-lg border border-outline/45 bg-white p-5 shadow-card sm:p-7"><h2 className="text-lg font-bold text-ink">Distribuição atual</h2><div className="mt-5 grid grid-cols-1 gap-3 md:grid-cols-2">{evaluators.map((evaluator) => <div key={evaluator.id} className="rounded-md bg-surface-low p-4"><p className="text-sm font-bold text-ink">{evaluator.name}</p><p className="mt-2 text-xs text-ink-muted">{evaluator.rooms.length ? evaluator.rooms.map((room) => room.name).join(", ") : "Nenhuma sala atribuída"}</p></div>)}</div></section>
      </div>
    </AppShell>
  );
}

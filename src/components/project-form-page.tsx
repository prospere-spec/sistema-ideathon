"use client";

import { useEffect, useState, type FormEvent } from "react";
import { ArrowLeft, FileVideo, Globe, Lightbulb, Link as LinkIcon, Plus, Rocket, Trash2, Users } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { AppShell } from "@/components/app-shell";
import { Button } from "@/components/ui/button";
import { FieldLabel } from "@/components/ui/field";

type ProjectFormPageProps = {
  mode: "create" | "edit";
  ideathonId: string;
  ideaId?: string;
};

type ProjectForm = {
  name: string;
  problem: string;
  solution: string;
  audience: string;
  differentiation: string;
  category: string;
  pitchDeckUrl: string;
  videoPitchUrl: string;
  websiteUrl: string;
};

type Member = { id: string; name: string; role: string; email?: string | null };

const emptyForm: ProjectForm = {
  name: "",
  problem: "",
  solution: "",
  audience: "",
  differentiation: "",
  category: "",
  pitchDeckUrl: "",
  videoPitchUrl: "",
  websiteUrl: "",
};

export function ProjectFormPage({ mode, ideathonId, ideaId }: ProjectFormPageProps) {
  const router = useRouter();
  const isEditing = mode === "edit";
  const [form, setForm] = useState(emptyForm);
  const [teamName, setTeamName] = useState("");
  const [members, setMembers] = useState<Member[]>([]);
  const [memberFormOpen, setMemberFormOpen] = useState(false);
  const [newMember, setNewMember] = useState({ name: "", role: "", email: "" });
  const [notice, setNotice] = useState("");
  const [loading, setLoading] = useState(isEditing);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!isEditing || !ideaId) return;

    let active = true;
    fetch(`/api/admin/ideathons/${ideathonId}/ideas/${ideaId}`)
      .then(async (response) => {
        const payload = await response.json();
        if (!response.ok) throw new Error(payload.error || "Não foi possível carregar a ideia.");
        return payload.data;
      })
      .then((idea) => {
        if (!active) return;
        setForm({
          name: idea.name,
          problem: idea.problem,
          solution: idea.solution,
          audience: idea.audience || "",
          differentiation: idea.differentiation || "",
          category: idea.category || "",
          pitchDeckUrl: idea.pitchDeckUrl || "",
          videoPitchUrl: idea.videoPitchUrl || "",
          websiteUrl: idea.websiteUrl || "",
        });
        setTeamName(idea.teamName);
        setMembers(idea.members.map((member: Member) => ({ ...member, id: member.id || crypto.randomUUID() })));
      })
      .catch((error: Error) => active && setNotice(error.message))
      .finally(() => active && setLoading(false));

    return () => {
      active = false;
    };
  }, [ideathonId, ideaId, isEditing]);

  function updateField(field: keyof ProjectForm, value: string) {
    setForm((current) => ({ ...current, [field]: value }));
    setNotice("");
  }

  function addMember() {
    if (!newMember.name.trim()) return;
    setMembers((current) => [...current, { id: crypto.randomUUID(), name: newMember.name.trim(), role: newMember.role.trim() || "Membro da equipe", email: newMember.email.trim() || null }]);
    setNewMember({ name: "", role: "", email: "" });
    setMemberFormOpen(false);
  }

  async function submitForm(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!form.name.trim() || !form.problem.trim() || !form.solution.trim() || !teamName.trim()) {
      setNotice("Preencha o nome, o problema, a solução e o nome da equipe.");
      return;
    }

    setSaving(true);
    setNotice("");
    try {
      const response = await fetch(isEditing ? `/api/admin/ideathons/${ideathonId}/ideas/${ideaId}` : `/api/admin/ideathons/${ideathonId}/ideas`, {
        method: isEditing ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...form,
          teamName,
          members: members.map(({ name, role, email }) => ({ name, role, email })),
        }),
      });
      const payload = await response.json();
      if (!response.ok) throw new Error(payload.error || "Não foi possível salvar a ideia.");
      router.push(`/admin/ideathons/${ideathonId}/projetos`);
      router.refresh();
    } catch (error) {
      setNotice(error instanceof Error ? error.message : "Não foi possível salvar a ideia.");
    } finally {
      setSaving(false);
    }
  }

  const backHref = `/admin/ideathons/${ideathonId}/projetos`;
  return (
    <AppShell navigation="management" activeSection="ideathons" darkHeader headerAction={<Link href="/admin/usuarios" className="inline-flex min-h-9 items-center gap-2 rounded-full bg-lime px-4 text-xs font-bold text-lime-foreground transition-colors hover:bg-lime/85"><Plus className="size-3.5" />Add User</Link>}>
      <div className="mx-auto w-full max-w-container space-y-8 px-4 py-7 sm:px-6 lg:px-8 lg:py-9">
        <section className="flex flex-col justify-between gap-5 sm:flex-row sm:items-start">
          <div><h1 className="text-3xl font-bold tracking-[-0.055em] text-ink sm:text-4xl">{isEditing ? "Editar Ideia" : "Cadastrar Nova Ideia"}</h1><p className="mt-2 text-base text-ink-muted">Vincule a solução e a equipe ao ideathon selecionado.</p></div>
          <Link href={backHref} className="inline-flex items-center gap-2 self-start pt-2 text-sm font-semibold text-ink transition-colors hover:text-lime-deep"><ArrowLeft className="size-5" />Voltar</Link>
        </section>

        {notice ? <p className="rounded-md bg-danger-soft/60 px-4 py-3 text-sm font-semibold text-danger" role="alert">{notice}</p> : null}
        {loading ? <p className="rounded-md bg-surface-low px-4 py-3 text-sm text-ink-muted" role="status">Carregando ideia...</p> : null}

        {!loading ? <form onSubmit={submitForm}>
          <div className="grid grid-cols-1 items-start gap-6 xl:grid-cols-[minmax(0,2fr)_minmax(320px,1fr)]">
            <div className="space-y-6">
              <section className="rounded-lg border border-black/[0.04] bg-white p-6 shadow-card sm:p-8" aria-labelledby="solution-overview-title">
                <div className="flex items-center gap-3 border-b border-outline/40 pb-4"><Lightbulb className="size-6 text-ink" /><h2 id="solution-overview-title" className="text-xl font-semibold tracking-[-0.035em] text-ink">Visão Geral da Solução</h2></div>
                <div className="mt-6 space-y-6">
                  <div><FieldLabel htmlFor="project-name" required>Nome da Ideia</FieldLabel><input id="project-name" required value={form.name} onChange={(event) => updateField("name", event.target.value)} placeholder="Ex: EcoTrack Solutions" className="min-h-14 w-full rounded-md border border-outline/70 bg-surface-low px-5 text-base text-ink placeholder:text-ink-muted/70 focus:border-lime focus:bg-white focus:outline-none focus:ring-2 focus:ring-lime/40" /></div>
                  <div><FieldLabel htmlFor="project-problem" required>Declaração do Problema</FieldLabel><textarea id="project-problem" required maxLength={1000} value={form.problem} onChange={(event) => updateField("problem", event.target.value)} placeholder="Qual dor específica sua solução resolve?" className="min-h-32 w-full resize-y rounded-md border border-outline/70 bg-surface-low px-5 py-4 text-base leading-7 text-ink placeholder:text-ink-muted/70 focus:border-lime focus:bg-white focus:outline-none focus:ring-2 focus:ring-lime/40" /><p className="mt-1 text-right text-sm text-ink-muted">{form.problem.length}/1000 caracteres</p></div>
                  <div><FieldLabel htmlFor="project-solution" required>Descrição da Solução</FieldLabel><textarea id="project-solution" required maxLength={2000} value={form.solution} onChange={(event) => updateField("solution", event.target.value)} placeholder="Descreva como sua solução funciona na prática." className="min-h-36 w-full resize-y rounded-md border border-outline/70 bg-surface-low px-5 py-4 text-base leading-7 text-ink placeholder:text-ink-muted/70 focus:border-lime focus:bg-white focus:outline-none focus:ring-2 focus:ring-lime/40" /></div>
                </div>
              </section>
              <section className="rounded-lg border border-black/[0.04] bg-white p-6 shadow-card sm:p-8" aria-labelledby="market-fit-title">
                <div className="flex items-center gap-3 border-b border-outline/40 pb-4"><span className="text-xl font-bold text-ink">↗</span><h2 id="market-fit-title" className="text-xl font-semibold tracking-[-0.035em] text-ink">Adequação de Mercado</h2></div>
                <div className="mt-6 space-y-6"><div><FieldLabel htmlFor="project-category">Categoria</FieldLabel><input id="project-category" value={form.category} onChange={(event) => updateField("category", event.target.value)} placeholder="Ex: FinTech, Educação, Sustentabilidade" className="min-h-14 w-full rounded-md border border-outline/70 bg-surface-low px-4 text-base text-ink placeholder:text-ink-muted/70 focus:border-lime focus:bg-white focus:outline-none focus:ring-2 focus:ring-lime/40" /></div><div className="grid grid-cols-1 gap-6 md:grid-cols-2"><div><FieldLabel htmlFor="project-audience">Público-Alvo</FieldLabel><textarea id="project-audience" value={form.audience} onChange={(event) => updateField("audience", event.target.value)} placeholder="Quem são seus primeiros clientes ou usuários?" className="min-h-32 w-full resize-y rounded-md border border-outline/70 bg-surface-low px-5 py-4 text-base leading-7 text-ink placeholder:text-ink-muted/70 focus:border-lime focus:bg-white focus:outline-none focus:ring-2 focus:ring-lime/40" /></div><div><FieldLabel htmlFor="project-differentiation">Diferencial Competitivo</FieldLabel><textarea id="project-differentiation" value={form.differentiation} onChange={(event) => updateField("differentiation", event.target.value)} placeholder="Por que sua solução é melhor?" className="min-h-32 w-full resize-y rounded-md border border-outline/70 bg-surface-low px-5 py-4 text-base leading-7 text-ink placeholder:text-ink-muted/70 focus:border-lime focus:bg-white focus:outline-none focus:ring-2 focus:ring-lime/40" /></div></div></div>
              </section>
            </div>
            <aside className="space-y-6">
              <section className="rounded-lg border border-black/[0.04] bg-white p-6 shadow-card" aria-labelledby="team-title">
                <div className="flex items-center gap-3 border-b border-outline/40 pb-4"><Users className="size-6 text-ink" /><h2 id="team-title" className="text-xl font-semibold tracking-[-0.035em] text-ink">Equipe</h2></div>
                <div className="mt-6"><FieldLabel htmlFor="team-name" required>Nome da Equipe</FieldLabel><input id="team-name" required value={teamName} onChange={(event) => { setTeamName(event.target.value); setNotice(""); }} placeholder="Ex: Alpha Team" className="min-h-14 w-full rounded-md border border-outline/70 bg-surface-low px-4 text-base text-ink placeholder:text-ink-muted/70 focus:border-lime focus:bg-white focus:outline-none focus:ring-2 focus:ring-lime/40" /></div>
                <p className="mb-2 mt-6 text-sm font-semibold text-ink">Integrantes</p><div className="space-y-2">{members.map((member) => <div key={member.id} className="flex items-center gap-3 rounded-md border border-outline/40 bg-surface-low p-3"><span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-surface-container text-sm font-semibold text-ink">{member.name.split(/\s+/).slice(0, 2).map((part) => part[0]).join("").toUpperCase()}</span><div className="min-w-0 flex-1"><p className="text-sm font-bold text-ink">{member.name}</p><p className="text-sm text-ink-muted">{member.role}</p></div><button type="button" onClick={() => setMembers((current) => current.filter((item) => item.id !== member.id))} className="rounded p-1 text-ink-muted transition-colors hover:bg-danger-soft hover:text-danger" aria-label={`Remover ${member.name}`}><Trash2 className="size-4" /></button></div>)}</div>
                {memberFormOpen ? <div className="mt-3 space-y-2 rounded-md border border-lime-deep/30 bg-lime/10 p-3"><input value={newMember.name} onChange={(event) => setNewMember((current) => ({ ...current, name: event.target.value }))} placeholder="Nome do integrante" className="min-h-10 w-full rounded-md border border-outline/60 bg-white px-3 text-sm focus:border-lime focus:outline-none" /><input value={newMember.role} onChange={(event) => setNewMember((current) => ({ ...current, role: event.target.value }))} placeholder="Função na equipe" className="min-h-10 w-full rounded-md border border-outline/60 bg-white px-3 text-sm focus:border-lime focus:outline-none" /><input type="email" value={newMember.email} onChange={(event) => setNewMember((current) => ({ ...current, email: event.target.value }))} placeholder="E-mail (opcional)" className="min-h-10 w-full rounded-md border border-outline/60 bg-white px-3 text-sm focus:border-lime focus:outline-none" /><div className="flex justify-end gap-2"><Button type="button" variant="ghost" onClick={() => setMemberFormOpen(false)}>Cancelar</Button><Button type="button" onClick={addMember}>Adicionar</Button></div></div> : <button type="button" onClick={() => setMemberFormOpen(true)} className="mt-3 inline-flex items-center gap-2 text-sm font-semibold text-lime-deep hover:underline"><Plus className="size-4" />Adicionar integrante</button>}
              </section>
              <section className="rounded-lg border border-black/[0.04] bg-white p-6 shadow-card" aria-labelledby="resources-title"><div className="flex items-center gap-3 border-b border-outline/40 pb-4"><LinkIcon className="size-6 text-ink" /><h2 id="resources-title" className="text-xl font-semibold tracking-[-0.035em] text-ink">Recursos</h2></div><div className="mt-6 space-y-5"><div><FieldLabel htmlFor="pitch-deck">Pitch Deck (URL)</FieldLabel><div className="relative"><FileVideo className="pointer-events-none absolute left-4 top-1/2 size-4 -translate-y-1/2 text-ink-muted" /><input id="pitch-deck" type="url" value={form.pitchDeckUrl} onChange={(event) => updateField("pitchDeckUrl", event.target.value)} placeholder="https://..." className="min-h-14 w-full rounded-md border border-outline/70 bg-surface-low pl-11 pr-4 text-base text-ink placeholder:text-ink-muted/70 focus:border-lime focus:bg-white focus:outline-none focus:ring-2 focus:ring-lime/40" /></div></div><div><FieldLabel htmlFor="video-pitch">Vídeo Pitch (URL)</FieldLabel><div className="relative"><FileVideo className="pointer-events-none absolute left-4 top-1/2 size-4 -translate-y-1/2 text-ink-muted" /><input id="video-pitch" type="url" value={form.videoPitchUrl} onChange={(event) => updateField("videoPitchUrl", event.target.value)} placeholder="https://..." className="min-h-14 w-full rounded-md border border-outline/70 bg-surface-low pl-11 pr-4 text-base text-ink placeholder:text-ink-muted/70 focus:border-lime focus:bg-white focus:outline-none focus:ring-2 focus:ring-lime/40" /></div></div><div><FieldLabel htmlFor="project-website">Website ou Protótipo</FieldLabel><div className="relative"><Globe className="pointer-events-none absolute left-4 top-1/2 size-4 -translate-y-1/2 text-ink-muted" /><input id="project-website" type="url" value={form.websiteUrl} onChange={(event) => updateField("websiteUrl", event.target.value)} placeholder="https://..." className="min-h-14 w-full rounded-md border border-outline/70 bg-surface-low pl-11 pr-4 text-base text-ink placeholder:text-ink-muted/70 focus:border-lime focus:bg-white focus:outline-none focus:ring-2 focus:ring-lime/40" /></div></div></div></section>
              <div><Button type="submit" disabled={saving} className="min-h-16 w-full text-base"><Rocket className="size-5" />{saving ? "Salvando..." : isEditing ? "Salvar Alterações" : "Cadastrar Ideia"}</Button><p className="mt-3 text-center text-sm text-ink-muted">A ideia ficará vinculada a este ideathon.</p></div>
            </aside>
          </div>
        </form> : null}
      </div>
    </AppShell>
  );
}

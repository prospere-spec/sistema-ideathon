import { beforeEach, describe, expect, it } from "vitest";
import { createDemoIdeathon, createDemoRoom, demoDashboard, getDemoAuditLogs, getDemoEvaluation, getDemoIdeathon, getDemoResults, getDemoRooms, patchDemoIdeathon, patchDemoPhase, patchDemoRoom, resetDemoState, saveDemoEvaluation, submitDemoEvaluation } from "./demo-store";

describe("fluxo demo do administrador", () => {
  beforeEach(() => resetDemoState());

  it("cria um ideathon e permite navegar até o detalhe", () => {
    const created = createDemoIdeathon({ name: "Novo desafio", slug: "novo-desafio", description: "Teste de fluxo" });

    expect(created.status).toBe("DRAFT");
    expect(getDemoIdeathon(created.id)?.name).toBe("Novo desafio");
    expect(demoDashboard().data.some((event) => event.id === created.id)).toBe(true);
  });

  it("promove o ideathon ao iniciar uma fase e exige que ela seja encerrada antes do fechamento", () => {
    const created = createDemoIdeathon({ name: "Ciclo de vida", slug: "ciclo-de-vida" });
    const phaseId = getDemoIdeathon(created.id)!.phases[0].id;

    expect(patchDemoIdeathon(created.id, { status: "READY" })).toMatchObject({ error: expect.any(String), status: 409 });
    expect(patchDemoPhase(created.id, phaseId, { status: "READY" })).toMatchObject({ status: "READY" });
    expect(patchDemoPhase(created.id, phaseId, { status: "LIVE" })).toMatchObject({ status: "LIVE" });
    expect(getDemoIdeathon(created.id)?.status).toBe("LIVE");
    expect(patchDemoIdeathon(created.id, { status: "CLOSED" })).toMatchObject({ error: expect.any(String), status: 409 });
    expect(patchDemoPhase(created.id, phaseId, { status: "CLOSED" })).toMatchObject({ status: "CLOSED" });
    expect(patchDemoIdeathon(created.id, { status: "CLOSED" })).toMatchObject({ data: { status: "CLOSED" } });
    expect(patchDemoPhase(created.id, phaseId, { status: "READY" })).toBeNull();
  });

  it("cria e atualiza uma sala mantendo o estado em memória", () => {
    const room = createDemoRoom("demo-ideathon", { name: "Banca Sul", phaseId: "demo-phase" });
    expect(room?.status).toBe("DRAFT");

    const updated = patchDemoRoom("demo-ideathon", room!.id, { name: "Banca Sul 2", status: "READY" });
    expect(updated).toMatchObject({ id: room!.id, name: "Banca Sul 2", status: "READY" });
    expect(getDemoRooms("demo-ideathon")?.data.some((item) => item.id === room!.id && item.name === "Banca Sul 2")).toBe(true);
  });

  it("pausa, conclui e reabre uma fase", () => {
    expect(patchDemoPhase("demo-ideathon", "demo-phase", { status: "READY" })).toMatchObject({ status: "READY" });
    expect(patchDemoPhase("demo-ideathon", "demo-phase", { status: "LIVE" })).toMatchObject({ status: "LIVE" });
    expect(patchDemoPhase("demo-ideathon", "demo-phase", { status: "CLOSED" })).toMatchObject({ status: "CLOSED" });
    expect(patchDemoPhase("demo-ideathon", "demo-phase", { status: "LIVE" })).toBeNull();
    expect(patchDemoPhase("demo-ideathon", "demo-phase", { status: "READY" })).toMatchObject({ status: "READY" });
  });

  it("redefine as salas da fase para rascunho sem remover vínculos", () => {
    const before = getDemoRooms("demo-ideathon")?.data.find((room) => room.id === "demo-room");
    expect(before).toMatchObject({ status: "LIVE", ideaCount: 1, evaluatorCount: 1 });
    const extraRoom = createDemoRoom("demo-ideathon", { name: "Banca Sul", phaseId: "demo-phase" });
    expect(extraRoom).toBeTruthy();
    patchDemoRoom("demo-ideathon", extraRoom!.id, { status: "CLOSED" });

    const updated = patchDemoPhase("demo-ideathon", "demo-phase", { status: "DRAFT" });
    const after = getDemoRooms("demo-ideathon")?.data.find((room) => room.id === "demo-room");
    const extraAfter = getDemoRooms("demo-ideathon")?.data.find((room) => room.id === extraRoom!.id);

    expect(updated).toMatchObject({ status: "DRAFT" });
    expect(after).toMatchObject({ status: "DRAFT", ideaCount: 1, evaluatorCount: 1 });
    expect(extraAfter).toMatchObject({ status: "DRAFT" });

    const edited = patchDemoRoom("demo-ideathon", "demo-room", { name: "Banca Norte revisada", position: 2, status: "READY" });
    expect(edited).toMatchObject({ name: "Banca Norte revisada", position: 2, status: "READY" });
  });

  it("salva, envia uma avaliação e trata o reenvio de forma idempotente", () => {
    const loaded = getDemoEvaluation("demo-phase", "demo-idea", "demo-evaluator");
    expect("data" in loaded).toBe(true);
    if (!("data" in loaded) || !loaded.data) return;
    const scores = loaded.data.criteria.map((criterion, index) => ({ criterionId: criterion.id, score: index + 3 }));

    const saved = saveDemoEvaluation("demo-phase", "demo-idea", "demo-evaluator", { scores, feedback: "Boa proposta." });
    if (!("data" in saved) || !saved.data) return;
    expect("saved" in saved.data && saved.data.saved).toBe(true);
    const submitted = submitDemoEvaluation(loaded.data.evaluationId, "demo-evaluator", { scores, feedback: "Boa proposta." });
    if (!("data" in submitted) || !submitted.data) return;
    expect(submitted.data.idempotent).toBe(false);
    const repeated = submitDemoEvaluation(loaded.data.evaluationId, "demo-evaluator", { scores, feedback: "Outro texto não deve substituir o envio." });

    expect(repeated).toMatchObject({ data: { idempotent: true, finalScore: submitted.data.finalScore } });
    const results = getDemoResults("demo-ideathon");
    if (!("data" in results) || !results.data) return;
    expect(results.data[0]).toMatchObject({ ideaId: "demo-idea", rank: 1, receivedEvaluations: 1, completionPercent: 100 });
    expect(getDemoAuditLogs("demo-ideathon", { limit: 50, action: "EVALUATION_SUBMITTED", entityType: "EVALUATION" }).data).toHaveLength(1);
  });
});

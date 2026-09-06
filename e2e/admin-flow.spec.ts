import { expect, test } from "@playwright/test";

test.setTimeout(120_000);

test("administrador percorre dashboard, ideathon e sala no modo demo", async ({ page }) => {
  await page.goto("/login");
  await page.getByLabel("E-mail Corporativo").fill("admin@demo.local");
  await page.getByRole("textbox", { name: "Senha" }).fill("demo123");
  await page.getByRole("button", { name: "Entrar no painel" }).click();
  await expect.poll(async () => (await page.context().cookies()).some((cookie) => cookie.name === "ideathon-demo-role" && cookie.value === "ADMIN"), { timeout: 30_000 }).toBe(true);
  await expect(page).toHaveURL(/\/admin$/, { timeout: 30_000 });
  await expect(page.getByRole("heading", { name: "Dashboard administrativo" })).toBeVisible({ timeout: 30_000 });
  await page.getByRole("link", { name: "Ideathons", exact: true }).click();
  await expect(page).toHaveURL(/\/admin\/ideathons$/);

  await page.getByRole("button", { name: "Criar ideathon" }).last().click();
  await page.getByLabel("Nome").fill("Desafio de Fluxo");
  await page.getByLabel("Slug").fill("desafio-de-fluxo");
  await page.getByLabel("Descrição").fill("Ideathon criado no teste demo.");
  await page.getByRole("button", { name: "Criar ideathon", exact: true }).last().click();
  await expect(page.getByRole("status")).toContainText("Ideathon criado com sucesso.");

  await page.getByRole("link", { name: "Abrir evento" }).first().click();
  await expect(page).toHaveURL(/\/admin\/ideathons\/demo-ideathon-/);
  await expect(page.getByRole("heading", { name: "Desafio de Fluxo" })).toBeVisible();
  await page.getByRole("link", { name: "Salas", exact: true }).click();
  await expect(page).toHaveURL(/\/salas$/);
  await expect(page.getByRole("heading", { name: "Salas e bancas" })).toBeVisible();

  await page.getByLabel("Nome da sala").fill("Banca Demo");
  await page.getByRole("button", { name: "Criar sala" }).click();
  await expect(page.getByRole("heading", { name: "Banca Demo" })).toBeVisible();
  await page.getByRole("link", { name: "Auditoria" }).click();
  await expect(page).toHaveURL(/\/auditoria$/);
  await expect(page.getByRole("heading", { name: "Auditoria" })).toBeVisible();
  await expect(page.getByRole("cell", { name: "Sala criada", exact: true })).toBeVisible();
});

test("avaliador salva, envia e repete uma avaliação no modo demo", async ({ page }) => {
  await page.goto("/login");
  await page.getByLabel("E-mail Corporativo").fill("avaliador@demo.local");
  await page.getByRole("textbox", { name: "Senha" }).fill("demo123");
  await page.getByRole("button", { name: "Entrar no painel" }).click();
  await expect.poll(async () => (await page.context().cookies()).some((cookie) => cookie.name === "ideathon-demo-role" && cookie.value === "EVALUATOR"), { timeout: 30_000 }).toBe(true);
  await expect(page).toHaveURL(/\/avaliador$/, { timeout: 30_000 });
  await expect(page.getByRole("heading", { name: "Olá, Avaliador Demo" })).toBeVisible({ timeout: 30_000 });
  await page.getByRole("link", { name: "Avaliar ideia" }).click();
  await expect(page.getByRole("heading", { name: "Painel do Avaliador - Rede de Energia Comunitária" })).toBeVisible();

  await page.getByRole("button", { name: "Nota 4" }).nth(0).click();
  await page.getByRole("button", { name: "Nota 5" }).nth(1).click();
  await page.getByRole("button", { name: "Nota 3" }).nth(2).click();
  await page.getByLabel("Escreva suas observações").fill("Avaliação demo persistida.");

  const submitResponsePromise = page.waitForResponse((response) => response.url().includes("/api/evaluations/") && response.url().endsWith("/submit") && response.request().method() === "POST");
  await page.getByRole("button", { name: "Enviar avaliação" }).click();
  const submitPayload = await (await submitResponsePromise).json();
  expect(submitPayload.data.idempotent).toBe(false);
  await expect(page.getByRole("status")).toContainText("Avaliação enviada com sucesso.");

  const repeatedPayload = await page.evaluate(async ({ evaluationId, scores, feedback }) => {
    const response = await fetch(`/api/evaluations/${evaluationId}/submit`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ scores, feedback }) });
    return response.json();
  }, { evaluationId: submitPayload.data.evaluationId, scores: submitPayload.data.scores, feedback: "Tentativa repetida" });
  expect(repeatedPayload.data.idempotent).toBe(true);
  await expect(page.getByRole("button", { name: "Enviar avaliação" })).toBeDisabled();
});

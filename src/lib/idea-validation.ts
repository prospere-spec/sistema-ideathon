export type IdeaMemberInput = {
  name: string;
  role: string;
  email?: string;
};

export type IdeaInput = {
  name: string;
  problem: string;
  solution: string;
  audience: string | null;
  differentiation: string | null;
  category: string | null;
  pitchDeckUrl: string | null;
  videoPitchUrl: string | null;
  websiteUrl: string | null;
  teamName: string;
  members: IdeaMemberInput[];
};

function optionalText(value: unknown) {
  if (value === undefined || value === null) return null;
  const text = String(value).trim();
  return text || null;
}

export function parseIdeaInput(input: unknown): { data: IdeaInput } | { error: string } {
  if (!input || typeof input !== "object") return { error: "Envie um objeto de ideia válido." };

  const body = input as Record<string, unknown>;
  const name = String(body.name ?? "").trim();
  const problem = String(body.problem ?? "").trim();
  const solution = String(body.solution ?? "").trim();
  const teamName = String(body.teamName ?? "").trim();

  if (!name || !problem || !solution || !teamName) {
    return { error: "Nome da ideia, problema, solução e equipe são obrigatórios." };
  }

  const rawMembers = body.members === undefined ? [] : body.members;
  if (!Array.isArray(rawMembers)) return { error: "A lista de integrantes é inválida." };

  const members: IdeaMemberInput[] = [];
  for (const member of rawMembers) {
    if (!member || typeof member !== "object") return { error: "Há um integrante inválido na equipe." };
    const record = member as Record<string, unknown>;
    const memberName = String(record.name ?? "").trim();
    if (!memberName) return { error: "Todo integrante precisa ter um nome." };
    members.push({
      name: memberName,
      role: optionalText(record.role) || "Membro da equipe",
      email: optionalText(record.email) || undefined,
    });
  }

  return {
    data: {
      name,
      problem,
      solution,
      audience: optionalText(body.audience),
      differentiation: optionalText(body.differentiation),
      category: optionalText(body.category),
      pitchDeckUrl: optionalText(body.pitchDeckUrl),
      videoPitchUrl: optionalText(body.videoPitchUrl),
      websiteUrl: optionalText(body.websiteUrl),
      teamName,
      members,
    },
  };
}

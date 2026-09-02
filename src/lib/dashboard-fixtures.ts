export type IdeathonRow = {
  id: string;
  name: string;
  initial: string;
  note: string;
  progress: number;
  ideas: number | null;
  status: string;
  tone: "lime" | "indigo" | "neutral";
};

export const ideathons: IdeathonRow[] = [
  { id: "green-tech", name: "GreenTech Challenge 2024", initial: "G", note: "Termina em 3 dias", progress: 75, ideas: 142, status: "Em andamento", tone: "lime" },
  { id: "fintech", name: "FinTech Innovate", initial: "F", note: "Avaliação final", progress: 90, ideas: 89, status: "Avaliação", tone: "indigo" },
  { id: "eduhack", name: "EduHack 2024", initial: "E", note: "Inicia em 5 dias", progress: 10, ideas: null, status: "Pendente", tone: "neutral" },
];

export const reviewers = [
  { name: "Ana Silva", event: "FinTech Innovate", initials: "AS", count: 45 },
  { name: "Carlos Mendes", event: "GreenTech Challenge", initials: "CM", count: 32 },
  { name: "Roberto Lima", event: "Múltiplos", initials: "RL", count: 28 },
];

export const submissionBars = [
  { day: "S", value: 32 },
  { day: "T", value: 50 },
  { day: "Q", value: 42 },
  { day: "Q", value: 80, highlight: true },
  { day: "S", value: 60 },
  { day: "S", value: 46 },
];

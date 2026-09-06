export const isDemoMode = process.env.DEMO_MODE === "true";
export const demoRoleCookie = "ideathon-demo-role";

export const demoUser = {
  id: "demo-admin",
  name: "Administrador Demo",
  email: "admin@demo.local",
  role: "ADMIN" as const,
  status: "ACTIVE" as const,
  mustChangePassword: false,
};

export const demoEvaluator = {
  id: "demo-evaluator",
  name: "Avaliador Demo",
  email: "avaliador@demo.local",
  role: "EVALUATOR" as const,
  status: "ACTIVE" as const,
  mustChangePassword: false,
};

export function getDemoUser(role: string | undefined) {
  return role === "EVALUATOR" ? demoEvaluator : demoUser;
}

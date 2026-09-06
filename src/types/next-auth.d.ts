import type { DefaultSession } from "next-auth";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      role: "ADMIN" | "EVALUATOR";
      status: "ACTIVE" | "INACTIVE";
      mustChangePassword: boolean;
    } & DefaultSession["user"];
  }

  interface User {
    role: "ADMIN" | "EVALUATOR";
    status: "ACTIVE" | "INACTIVE";
    mustChangePassword: boolean;
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id: string;
    role: "ADMIN" | "EVALUATOR";
    status: "ACTIVE" | "INACTIVE";
    mustChangePassword: boolean;
  }
}

declare module "@auth/core/adapters" {
  interface AdapterUser {
    role: "ADMIN" | "EVALUATOR";
    status: "ACTIVE" | "INACTIVE";
    mustChangePassword: boolean;
  }
}

import { DrizzleAdapter } from "@auth/drizzle-adapter";
import { compare } from "bcryptjs";
import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import { eq } from "drizzle-orm";
import { getDb } from "@/db";
import { accounts, sessions, users, verificationTokens } from "@/db/schema";
import { demoUser, isDemoMode } from "@/lib/demo-mode";

const database = isDemoMode ? undefined : getDb();
const adapter = database ? DrizzleAdapter(database, { usersTable: users, accountsTable: accounts, sessionsTable: sessions, verificationTokensTable: verificationTokens }) : undefined;

export const { handlers, signIn, signOut, auth } = NextAuth({
  adapter,
  session: {
    strategy: isDemoMode ? "jwt" : "database",
    maxAge: 8 * 60 * 60,
  },
  pages: {
    signIn: "/login",
  },
  providers: [
    Credentials({
      name: "Credenciais",
      credentials: {
        email: { label: "E-mail", type: "email" },
        password: { label: "Senha", type: "password" },
      },
      async authorize(credentials) {
        const email = String(credentials?.email ?? "").trim().toLowerCase();
        const password = String(credentials?.password ?? "");

        if (!email || !password) return null;
        if (isDemoMode) return email === demoUser.email && password === "demo123" ? demoUser : null;
        if (!database) return null;

        const [user] = await database
          .select()
          .from(users)
          .where(eq(users.email, email))
          .limit(1);

        if (!user || user.status !== "ACTIVE" || !user.passwordHash) return null;
        if (!(await compare(password, user.passwordHash))) return null;

        return {
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role,
          status: user.status,
          mustChangePassword: user.mustChangePassword,
        };
      },
    }),
  ],
  callbacks: {
    async session({ session, user }) {
      session.user.id = user.id;
      session.user.role = user.role;
      session.user.status = user.status;
      session.user.mustChangePassword = user.mustChangePassword;
      return session;
    },
  },
  secret: process.env.AUTH_SECRET,
  trustHost: true,
});

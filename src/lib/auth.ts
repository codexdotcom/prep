import NextAuth from "next-auth";
import { PrismaAdapter } from "@auth/prisma-adapter";
import Google from "next-auth/providers/google";
import Credentials from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import { db } from "./db";

export const { handlers, auth, signIn, signOut } = NextAuth({
  adapter: PrismaAdapter(db),
  session: { strategy: "jwt" },
  pages: {
    signIn: "/auth/login",
  },
  providers: [
    Google({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
      allowDangerousEmailAccountLinking: true,
    }),
    Credentials({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) return null;

        const user = await db.user.findUnique({
          where: { email: credentials.email as string },
        });

        if (!user || !user.hashedPassword) return null;

        const isValid = await bcrypt.compare(
          credentials.password as string,
          user.hashedPassword
        );

        if (!isValid) return null;

        return {
          id: user.id,
          email: user.email,
          name: user.name,
          image: user.image,
        };
      },
    }),
  ],
  callbacks: {
    async signIn() {
      return true;
    },
    async redirect({ url, baseUrl }) {
      // After sign-in, always go to onboarding (it can redirect to dashboard if already complete)
      if (url.includes("/api/auth") || url.includes("/auth/login") || url === baseUrl) {
        return `${baseUrl}/onboarding`;
      }
      if (url.startsWith("/")) return `${baseUrl}${url}`;
      if (new URL(url).origin === baseUrl) return url;
      return `${baseUrl}/onboarding`;
    },
    async jwt({ token, user, trigger }) {
      if (user) {
        token.id = user.id;
      }

      if (trigger === "signIn" || trigger === "signUp") {
        const profile = await db.studentProfile.findUnique({
          where: { userId: token.id as string },
        });
        token.hasProfile = !!profile;
        token.onboardingComplete = !!profile?.onboardingCompletedAt;
      }

      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string;
        (session as any).hasProfile = token.hasProfile;
        (session as any).onboardingComplete = token.onboardingComplete;
      }
      return session;
    },
  },
});
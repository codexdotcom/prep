import NextAuth from "next-auth";
import Google from "next-auth/providers/google";
import Credentials from "next-auth/providers/credentials";
import { db } from "./db";
import bcrypt from "bcryptjs";

export const { handlers, auth, signIn, signOut } = NextAuth({
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

        return { id: user.id, email: user.email, name: user.name, image: user.image };
      },
    }),
  ],
  session: { strategy: "jwt" },
  pages: {
    signIn: "/auth/login",
  },
 // In src/lib/auth.ts — update the signIn callback:

callbacks: {
  async signIn({ user, account, profile: googleProfile }) {
    if (account?.provider === "google" && user.email) {
      try {
        const existing = await db.user.findUnique({
          where: { email: user.email },
        });

        if (!existing) {
          const created = await db.user.create({
            data: {
              email: user.email,
              name: user.name,
              image: user.image,
            },
          });
          // Override the user.id so JWT gets the DB ID
          user.id = created.id;
        } else {
          // Ensure JWT uses the existing DB ID
          user.id = existing.id;
          // Update name/image if changed
          await db.user.update({
            where: { id: existing.id },
            data: {
              name: user.name || existing.name,
              image: user.image || existing.image,
            },
          });
        }
      } catch (err) {
        console.error("signIn callback error:", err);
        // Don't block login
      }
    }
    return true;
  },

  async jwt({ token, user }) {
    if (user) {
      token.id = user.id;
    }

    if (token.id) {
      const profile = await db.studentProfile.findUnique({
        where: { userId: token.id as string },
        select: { id: true },
      });
      token.hasProfile = !!profile;
    }

    return token;
  },

  async redirect({ url, baseUrl }) {
    if (url.startsWith("/")) return `${baseUrl}${url}`;
    if (url.startsWith(baseUrl)) return url;
    return baseUrl;
  },

  async session({ session, token }) {
    if (session.user && token.id) {
      session.user.id = token.id as string;
      (session as any).hasProfile = token.hasProfile;
    }
    return session;
  },
},
    
});
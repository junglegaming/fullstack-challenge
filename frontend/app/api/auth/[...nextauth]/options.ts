import { NextAuthOptions } from "next-auth"
import KeycloakProvider from "next-auth/providers/keycloak"
import { DefaultSession } from "next-auth"

declare module "next-auth" {
  interface Session {
    user: {
      accessToken?: string
      idToken?: string
    } & DefaultSession["user"]
  }

  interface User {
    accessToken?: string
    idToken?: string
  }

  interface JWT {
    accessToken?: string
    idToken?: string
  }
}

export const authOptions: NextAuthOptions = {
  session: {
    strategy: "jwt",
  },
  pages: {
    signIn: "/auth",
    error: "/auth",
  },
  providers: [
    KeycloakProvider({
      clientId: process.env.AUTH_KEYCLOAK_ID!,
      clientSecret: process.env.AUTH_KEYCLOAK_SECRET!,
      issuer: process.env.NEXT_PUBLIC_KEYCLOAK_ISSUER || process.env.AUTH_KEYCLOAK_ISSUER!,
    }),
  ],
  callbacks: {
    async jwt({ token, account }) {
      if (account) {
        token.accessToken = account.access_token
        token.idToken = account.id_token
      }
      return token
    },
    async session({ session, token }) {
      if (session.user) {
        // @ts-expect-error - Extending session user type
        session.user.accessToken = token.accessToken
        // @ts-expect-error - Extending session user type
        session.user.idToken = token.idToken
      }
      return session
    },
  },
}

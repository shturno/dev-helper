import NextAuth from "next-auth"
import CredentialsProvider from "next-auth/providers/credentials"
import GithubProvider from "next-auth/providers/github"

// Define a more robust configuration for NextAuth
const handler = NextAuth({
  providers: [
    GithubProvider({
      clientId: process.env.GITHUB_ID || "",
      clientSecret: process.env.GITHUB_SECRET || "",
    }),
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Senha", type: "password" },
      },
      async authorize(credentials) {
        // In production, this would be a real API call
        // This is just a simulation for development
        if (credentials?.email === "user@example.com" && credentials?.password === "password") {
          return {
            id: "1",
            name: "João Silva",
            email: "user@example.com",
          }
        }
        return null
      },
    }),
  ],
  pages: {
    signIn: "/login",
  },
  // Add secret for JWT encryption
  secret: process.env.NEXTAUTH_SECRET || "a-development-secret-for-testing-only",
  // Add session configuration
  session: {
    strategy: "jwt",
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },
  // Add debug mode for development
  debug: process.env.NODE_ENV === "development",
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id
      }
      return token
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string
      }
      return session
    },
  },
})

export { handler as GET, handler as POST }

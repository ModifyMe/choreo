import { NextAuthOptions } from "next-auth"
import GoogleProvider from "next-auth/providers/google"
import { PrismaAdapter } from "@next-auth/prisma-adapter"
import { prisma } from "@/lib/prisma"
import { User } from "next-auth"
import { AdapterUser } from "next-auth/adapters"

export const authOptions = {
    adapter: PrismaAdapter(prisma),
    providers: [
        GoogleProvider({
            clientId: process.env.GOOGLE_CLIENT_ID || "",
            clientSecret: process.env.GOOGLE_CLIENT_SECRET || "",
        }),
    ],
    callbacks: {
        session: async ({ session, user }: { session: any; user: User | AdapterUser }) => {
            if (session?.user) {
                session.user.id = user.id;
            }
            return session;
        },
    },
    trustHost: true,
} as NextAuthOptions

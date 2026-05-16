import NextAuth from 'next-auth';
import Google from 'next-auth/providers/google';
import Credentials from 'next-auth/providers/credentials';
import { PrismaAdapter } from '@auth/prisma-adapter';
import prisma from '@/lib/prisma';

export const { handlers, auth, signIn, signOut } = NextAuth({
  adapter: PrismaAdapter(prisma),
  providers: [
    // Google OAuth
    Google({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),

    // Email/Phone OTP (custom credentials)
    Credentials({
      id: 'otp-login',
      name: 'OTP Login',
      credentials: {
        identifier: { label: 'Email or Phone', type: 'text' },
        otp: { label: 'OTP', type: 'text' },
      },
      async authorize(credentials) {
        if (!credentials?.identifier || !credentials?.otp) return null;

        const identifier = credentials.identifier as string;
        const otp = credentials.otp as string;

        // In production: Verify OTP against stored OTP (Redis/DB)
        // For now: Accept any 6-digit OTP in development
        if (process.env.NODE_ENV === 'development' && otp.length === 6) {
          // Find or create user
          const isEmail = identifier.includes('@');
          let user = await prisma.user.findFirst({
            where: isEmail ? { email: identifier } : { phone: identifier },
          });

          if (!user) {
            user = await prisma.user.create({
              data: {
                ...(isEmail ? { email: identifier } : { phone: identifier }),
                name: isEmail ? identifier.split('@')[0] : `User ${identifier.slice(-4)}`,
              },
            });
          }

          return { id: user.id, name: user.name, email: user.email, image: user.image };
        }

        // Production: Verify real OTP here (Twilio/MSG91)
        return null;
      },
    }),
  ],

  session: {
    strategy: 'jwt',
  },

  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.sub = user.id;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user && token.sub) {
        session.user.id = token.sub;
      }
      return session;
    },
  },

  pages: {
    signIn: '/', // Our custom login page
  },
});

import { COOKIE_NAME, ONE_YEAR_MS } from "@shared/const";
import { randomUUID } from "node:crypto";
import { z } from "zod";
import { eq } from "drizzle-orm";
import { users } from "../drizzle/schema";
import { getDb } from "./db";
import { getSessionCookieOptions } from "./_core/cookies";
import { sdk } from "./_core/sdk";
import { systemRouter } from "./_core/systemRouter";
import { publicProcedure, router } from "./_core/trpc";
import { libraryRouter } from "./libraryRouter";
import { hashPassword, verifyPassword } from "./passwordAuth";

export const appRouter = router({
    // if you need to use socket.io, read and register route in server/_core/index.ts, all api should start with '/api/' so that the gateway can route correctly
  system: systemRouter,
  auth: router({
    me: publicProcedure.query(opts => opts.ctx.user),
    signup: publicProcedure.input(z.object({ name: z.string().trim().min(1).max(160), email: z.string().email().max(320), password: z.string().min(8).max(128) })).mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database is not available");
      const email = input.email.trim().toLowerCase();
      const existing = await db.select({ id: users.id }).from(users).where(eq(users.email, email)).limit(1);
      if (existing[0]) throw new Error("An account with this email already exists");
      const openId = `password_${randomUUID()}`;
      const passwordHash = await hashPassword(input.password);
      await db.insert(users).values({ openId, name: input.name, email, passwordHash, loginMethod: "password", role: "member", readingStreak: 0, points: 0 });
      const token = await sdk.createSessionToken(openId, { name: input.name, expiresInMs: ONE_YEAR_MS });
      ctx.res.cookie(COOKIE_NAME, token, { ...getSessionCookieOptions(ctx.req), maxAge: ONE_YEAR_MS });
      return { authenticated: true, name: input.name, email };
    }),
    login: publicProcedure.input(z.object({ email: z.string().email().max(320), password: z.string().min(1).max(128) })).mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database is not available");
      const email = input.email.trim().toLowerCase();
      const rows = await db.select().from(users).where(eq(users.email, email)).limit(1);
      const user = rows[0];
      if (!user?.passwordHash || !(await verifyPassword(input.password, user.passwordHash))) throw new Error("Invalid email or password");
      await db.update(users).set({ lastSignedIn: new Date() }).where(eq(users.id, user.id));
      const token = await sdk.createSessionToken(user.openId, { name: user.name ?? "", expiresInMs: ONE_YEAR_MS });
      ctx.res.cookie(COOKIE_NAME, token, { ...getSessionCookieOptions(ctx.req), maxAge: ONE_YEAR_MS });
      return { authenticated: true, name: user.name, email: user.email };
    }),
    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      return {
        success: true,
      } as const;
    }),
  }),
  library: libraryRouter,
});

export type AppRouter = typeof appRouter;

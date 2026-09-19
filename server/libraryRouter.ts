import { and, eq } from "drizzle-orm";
import { z } from "zod";
import { books, users } from "../drizzle/schema";
import { getDb } from "./db";
import { validateInventory } from "./libraryLogic";
import {
  borrowBook,
  createReview,
  createRoom,
  getBook,
  getDashboardStats,
  getBorrowHistory,
  getProgress,
  getUserBadges,
  joinRoom,
  listBooks,
  listReviews,
  listRooms,
  listWishlist,
  returnBook,
  toggleWishlist,
  updateProgress,
} from "./libraryDb";
import { adminProcedure, protectedProcedure, router } from "./_core/trpc";
import { TRPCError } from "@trpc/server";

const bookInput = z.object({
  title: z.string().trim().min(1).max(255),
  author: z.string().trim().min(1).max(255),
  isbn: z.string().trim().max(32).optional(),
  genre: z.string().trim().min(1).max(100),
  description: z.string().max(10000).optional(),
  content: z.string().max(200000).optional(),
  keyPoints: z.string().max(10000).optional(),
  coverImageUrl: z.string().url().optional(),
  totalCopies: z.number().int().min(1).max(10000),
  availableCopies: z.number().int().min(0).max(10000).optional(),
  moodTags: z.array(z.string().trim().min(1).max(40)).max(12).default([]),
  totalPages: z.number().int().min(0).max(10000).default(0),
});

const safe = async <T>(operation: () => Promise<T>): Promise<T> => {
  try { return await operation(); } catch (error) {
    if (error instanceof TRPCError) throw error;
    throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: error instanceof Error ? error.message : "Database operation failed" });
  }
};

const voiceCommandResponse = z.object({
  action: z.enum(["play", "pause", "stop", "next", "previous", "catalog", "dashboard", "page", "unknown"]),
  reply: z.string().trim().min(1).max(240),
});

export const libraryRouter = router({
  books: router({
    list: protectedProcedure.input(z.object({ search: z.string().trim().max(120).optional(), genre: z.string().max(100).optional(), page: z.number().int().min(1).default(1), pageSize: z.number().int().min(1).max(50).default(12) })).query(({ input }) => safe(() => listBooks(input))),
    getById: protectedProcedure.input(z.object({ id: z.number().int().positive() })).query(({ input }) => safe(async () => {
      const book = await getBook(input.id);
      if (!book) throw new TRPCError({ code: "NOT_FOUND", message: "Book not found" });
      return book;
    })),
    create: adminProcedure.input(bookInput).mutation(({ input }) => safe(async () => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database is not available" });
      const values = { ...input, availableCopies: input.availableCopies ?? input.totalCopies, moodTags: JSON.stringify(input.moodTags) };
      try { validateInventory(values.totalCopies, values.availableCopies); } catch (error) { throw new TRPCError({ code: "BAD_REQUEST", message: error instanceof Error ? error.message : "Invalid inventory" }); }
      const inserted = await db.insert(books).values(values);
      return { id: Number(inserted[0].insertId) };
    })),
    update: adminProcedure.input(bookInput.partial().extend({ id: z.number().int().positive() })).mutation(({ input }) => safe(async () => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database is not available" });
      const { id, moodTags, ...rest } = input;
      const existing = await getBook(id);
      if (!existing) throw new TRPCError({ code: "NOT_FOUND", message: "Book not found" });
      const nextTotal = rest.totalCopies ?? existing.totalCopies;
      const nextAvailable = rest.availableCopies ?? existing.availableCopies;
      try { validateInventory(nextTotal, nextAvailable); } catch (error) { throw new TRPCError({ code: "BAD_REQUEST", message: error instanceof Error ? error.message : "Invalid inventory" }); }
      await db.update(books).set({ ...rest, ...(moodTags ? { moodTags: JSON.stringify(moodTags) } : {}) }).where(eq(books.id, id));
      return { id };
    })),
    delete: adminProcedure.input(z.object({ id: z.number().int().positive() })).mutation(({ input }) => safe(async () => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database is not available" });
      const existing = await getBook(input.id);
      if (!existing) throw new TRPCError({ code: "NOT_FOUND", message: "Book not found" });
      await db.delete(books).where(eq(books.id, input.id));
      return { deleted: true };
    })),
  }),
  borrow: router({
    borrowBook: protectedProcedure.input(z.object({ bookId: z.number().int().positive() })).mutation(({ ctx, input }) => safe(() => borrowBook(ctx.user.id, input.bookId))),
    returnBook: protectedProcedure.input(z.object({ recordId: z.number().int().positive() })).mutation(({ ctx, input }) => safe(() => returnBook(ctx.user.id, input.recordId))),
    myHistory: protectedProcedure.query(({ ctx }) => safe(() => getBorrowHistory(ctx.user.id))),
  }),
  reviews: router({
    create: protectedProcedure.input(z.object({ bookId: z.number().int().positive(), rating: z.number().int().min(1).max(5), comment: z.string().trim().max(4000).optional() })).mutation(({ ctx, input }) => safe(() => createReview(ctx.user.id, input.bookId, input.rating, input.comment))),
    listByBook: protectedProcedure.input(z.object({ bookId: z.number().int().positive() })).query(({ input }) => safe(() => listReviews(input.bookId))),
  }),
  wishlist: router({
    toggle: protectedProcedure.input(z.object({ bookId: z.number().int().positive() })).mutation(({ ctx, input }) => safe(() => toggleWishlist(ctx.user.id, input.bookId))),
    listMine: protectedProcedure.query(({ ctx }) => safe(() => listWishlist(ctx.user.id))),
  }),
  readingProgress: router({
    get: protectedProcedure.input(z.object({ bookId: z.number().int().positive() })).query(({ ctx, input }) => safe(() => getProgress(ctx.user.id, input.bookId))),
    update: protectedProcedure.input(z.object({ bookId: z.number().int().positive(), pagesRead: z.number().int().min(0), totalPages: z.number().int().positive(), pagesPerDay: z.number().int().min(1).max(1000).default(20) })).mutation(({ ctx, input }) => safe(() => updateProgress(ctx.user.id, input.bookId, input.pagesRead, input.totalPages, input.pagesPerDay))),
  }),
  admin: router({
    dashboardStats: adminProcedure.query(() => safe(() => getDashboardStats())),
  }),
  readingRooms: router({
    list: protectedProcedure.query(() => safe(() => listRooms())),
    create: protectedProcedure.input(z.object({ name: z.string().trim().min(2).max(180), bookId: z.number().int().positive(), startDate: z.coerce.date(), endDate: z.coerce.date() })).mutation(({ ctx, input }) => safe(async () => {
      if (input.endDate <= input.startDate) throw new TRPCError({ code: "BAD_REQUEST", message: "End date must be after start date" });
      return createRoom(ctx.user.id, input);
    })),
    join: protectedProcedure.input(z.object({ roomId: z.number().int().positive() })).mutation(({ ctx, input }) => safe(() => joinRoom(ctx.user.id, input.roomId))),
  }),
  voiceAssistant: router({
    command: protectedProcedure.input(z.object({ command: z.string().trim().min(1).max(160) })).mutation(({ input }) => safe(async () => {
      const apiKey = process.env.GROQ_API_KEY;
      if (!apiKey) throw new TRPCError({ code: "PRECONDITION_FAILED", message: "Voice assistant is not configured." });
      const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${apiKey}` },
        body: JSON.stringify({
          model: "llama-3.1-8b-instant",
          temperature: 0,
          max_tokens: 80,
          response_format: { type: "json_object" },
          messages: [
            { role: "system", content: "Classify the short reader command. Return only JSON with action and reply. Actions: play, pause, stop, next, previous, catalog, dashboard, page, unknown. Map read this book/play to play; previous page to previous; what page am I on to page; navigation requests to catalog/dashboard. Reply must be a brief spoken response and must not mention book content." },
            { role: "user", content: input.command },
          ],
        }),
      });
      if (!response.ok) throw new TRPCError({ code: "BAD_GATEWAY", message: "Voice assistant service is temporarily unavailable." });
      const payload = await response.json() as { choices?: Array<{ message?: { content?: string } }> };
      const content = payload.choices?.[0]?.message?.content;
      if (!content) throw new TRPCError({ code: "BAD_GATEWAY", message: "Voice assistant returned no command." });
      try { return voiceCommandResponse.parse(JSON.parse(content)); } catch { throw new TRPCError({ code: "BAD_GATEWAY", message: "Voice assistant returned an invalid command." }); }
    })),
  }),
  profile: router({
    update: protectedProcedure.input(z.object({ name: z.string().trim().min(1).max(160), email: z.string().email().max(320) })).mutation(({ ctx, input }) => safe(async () => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database is not available" });
      await db.update(users).set({ name: input.name, email: input.email }).where(eq(users.id, ctx.user.id));
      return { updated: true };
    })),
    badges: protectedProcedure.query(({ ctx }) => safe(() => getUserBadges(ctx.user.id))),
  }),
});

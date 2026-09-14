import { and, count, desc, eq, gt, like, lt, or, sql } from "drizzle-orm";
import { badges, books, borrowRecords, readingProgress, readingRooms, reviews, roomMembers, users, userBadges, wishlist } from "../drizzle/schema";
import { getDb } from "./db";
import { calculateFineAmount, getDueDate, predictFinishDate } from "./libraryLogic";

export function assertDb<T>(db: T | null): T {
  if (!db) throw new Error("Database is not available");
  return db;
}

export async function listBooks(input: { search?: string; genre?: string; page: number; pageSize: number }) {
  const db = assertDb(await getDb());
  const filters = [];
  if (input.search) filters.push(or(like(books.title, `%${input.search}%`), like(books.author, `%${input.search}%`), like(books.isbn, `%${input.search}%`)));
  if (input.genre && input.genre !== "All genres") filters.push(eq(books.genre, input.genre));
  const where = filters.length ? and(...filters) : undefined;
  const rows = await db.select().from(books).where(where).orderBy(desc(books.createdAt)).limit(input.pageSize).offset((input.page - 1) * input.pageSize);
  const total = await db.select({ value: count() }).from(books).where(where);
  return { items: rows, total: Number(total[0]?.value ?? 0), page: input.page, pageSize: input.pageSize };
}

export async function getBook(id: number) {
  const db = assertDb(await getDb());
  const rows = await db.select().from(books).where(eq(books.id, id)).limit(1);
  return rows[0];
}

export async function borrowBook(userId: number, bookId: number) {
  const db = assertDb(await getDb());
  return db.transaction(async (tx) => {
    const bookRows = await tx.select().from(books).where(eq(books.id, bookId)).limit(1);
    const book = bookRows[0];
    if (!book) throw new Error("Book not found");
    if (book.availableCopies <= 0) throw new Error("Book is currently unavailable");
    const active = await tx.select().from(borrowRecords).where(and(eq(borrowRecords.userId, userId), eq(borrowRecords.bookId, bookId), eq(borrowRecords.status, "borrowed"))).limit(1);
    if (active[0]) throw new Error("You already have this book borrowed");
    const dueDate = getDueDate(new Date());
    const inserted = await tx.insert(borrowRecords).values({ userId, bookId, dueDate, status: "borrowed", fineAmount: 0 });
    await tx.update(books).set({ availableCopies: sql`${books.availableCopies} - 1` }).where(and(eq(books.id, bookId), gt(books.availableCopies, 0)));
    return { id: Number(inserted[0].insertId), dueDate };
  });
}

export async function returnBook(userId: number, recordId: number) {
  const db = assertDb(await getDb());
  return db.transaction(async (tx) => {
    const rows = await tx.select().from(borrowRecords).where(and(eq(borrowRecords.id, recordId), eq(borrowRecords.userId, userId))).limit(1);
    const record = rows[0];
    if (!record) throw new Error("Borrow record not found");
    if (record.status === "returned") throw new Error("This book has already been returned");
    const returnDate = new Date();
    const { overdueDays, fineAmount } = calculateFineAmount(record.dueDate, returnDate);
    await tx.update(borrowRecords).set({ returnDate, fineAmount, status: "returned" }).where(eq(borrowRecords.id, recordId));
    await tx.update(books).set({ availableCopies: sql`${books.availableCopies} + 1` }).where(eq(books.id, record.bookId));
    return { recordId, fineAmount, overdueDays };
  });
}

export async function getBorrowHistory(userId: number) {
  const db = assertDb(await getDb());
  return db.select({ record: borrowRecords, book: books }).from(borrowRecords).innerJoin(books, eq(books.id, borrowRecords.bookId)).where(eq(borrowRecords.userId, userId)).orderBy(desc(borrowRecords.borrowDate));
}

export async function toggleWishlist(userId: number, bookId: number) {
  const db = assertDb(await getDb());
  const existing = await db.select().from(wishlist).where(and(eq(wishlist.userId, userId), eq(wishlist.bookId, bookId))).limit(1);
  if (existing[0]) { await db.delete(wishlist).where(eq(wishlist.id, existing[0].id)); return { saved: false }; }
  await db.insert(wishlist).values({ userId, bookId });
  return { saved: true };
}

export async function listWishlist(userId: number) {
  const db = assertDb(await getDb());
  return db.select({ item: wishlist, book: books }).from(wishlist).innerJoin(books, eq(books.id, wishlist.bookId)).where(eq(wishlist.userId, userId)).orderBy(desc(wishlist.addedAt));
}

export async function updateProgress(userId: number, bookId: number, pagesRead: number, totalPages: number, pagesPerDay: number) {
  const db = assertDb(await getDb());
  const finish = predictFinishDate(new Date(), pagesRead, totalPages, pagesPerDay);
  await db.insert(readingProgress).values({ userId, bookId, pagesRead, totalPages, pagesPerDay, predictedFinishDate: finish }).onDuplicateKeyUpdate({ set: { pagesRead, totalPages, pagesPerDay, predictedFinishDate: finish, lastUpdated: new Date() } });
  return { pagesRead, totalPages, predictedFinishDate: finish };
}

export async function getProgress(userId: number, bookId: number) {
  const db = assertDb(await getDb());
  const rows = await db.select().from(readingProgress).where(and(eq(readingProgress.userId, userId), eq(readingProgress.bookId, bookId))).limit(1);
  return rows[0] ?? null;
}

export async function listReviews(bookId: number) {
  const db = assertDb(await getDb());
  return db.select({ review: reviews, user: { id: users.id, name: users.name } }).from(reviews).innerJoin(users, eq(users.id, reviews.userId)).where(eq(reviews.bookId, bookId)).orderBy(desc(reviews.createdAt));
}

export async function createReview(userId: number, bookId: number, rating: number, comment?: string) {
  const db = assertDb(await getDb());
  await db.insert(reviews).values({ userId, bookId, rating, comment: comment ?? null }).onDuplicateKeyUpdate({ set: { rating, comment: comment ?? null, updatedAt: new Date() } });
  const avg = await db.select({ value: sql<number>`COALESCE(AVG(${reviews.rating}), 0)` }).from(reviews).where(eq(reviews.bookId, bookId));
  const avgRating = Math.round(Number(avg[0]?.value ?? 0) * 100);
  await db.update(books).set({ avgRating }).where(eq(books.id, bookId));
  return { avgRating };
}

export async function getDashboardStats() {
  const db = assertDb(await getDb());
  const [bookCount, activeBorrowCount, overdueCount, memberCount] = await Promise.all([
    db.select({ value: count() }).from(books),
    db.select({ value: count() }).from(borrowRecords).where(eq(borrowRecords.status, "borrowed")),
    db.select({ value: count() }).from(borrowRecords).where(or(eq(borrowRecords.status, "overdue"), and(eq(borrowRecords.status, "borrowed"), lt(borrowRecords.dueDate, new Date())))),
    db.select({ value: count() }).from(users).where(eq(users.role, "member")),
  ]);
  return { totalBooks: Number(bookCount[0]?.value ?? 0), activeBorrows: Number(activeBorrowCount[0]?.value ?? 0), overdueCount: Number(overdueCount[0]?.value ?? 0), totalMembers: Number(memberCount[0]?.value ?? 0) };
}

export async function listRooms() {
  const db = assertDb(await getDb());
  return db.select({ room: readingRooms, book: books, memberCount: count(roomMembers.id) }).from(readingRooms).innerJoin(books, eq(books.id, readingRooms.bookId)).leftJoin(roomMembers, eq(roomMembers.roomId, readingRooms.id)).groupBy(readingRooms.id, books.id).orderBy(desc(readingRooms.createdAt));
}

export async function createRoom(userId: number, input: { name: string; bookId: number; startDate: Date; endDate: Date }) {
  const db = assertDb(await getDb());
  const inserted = await db.insert(readingRooms).values({ ...input, createdBy: userId });
  const roomId = Number(inserted[0].insertId);
  await db.insert(roomMembers).values({ roomId, userId });
  return { roomId };
}

export async function joinRoom(userId: number, roomId: number) {
  const db = assertDb(await getDb());
  await db.insert(roomMembers).values({ roomId, userId }).onDuplicateKeyUpdate({ set: { joinedAt: new Date() } });
  return { roomId, joined: true };
}

export async function getUserBadges(userId: number) {
  const db = assertDb(await getDb());
  return db.select({ award: userBadges, badge: badges }).from(userBadges).innerJoin(badges, eq(badges.id, userBadges.badgeId)).where(eq(userBadges.userId, userId)).orderBy(desc(userBadges.earnedAt));
}

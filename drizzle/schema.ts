import {
  int,
  mysqlEnum,
  mysqlTable,
  text,
  timestamp,
  unique,
  varchar,
} from "drizzle-orm/mysql-core";

export const users = mysqlTable("users", {
  id: int("id").autoincrement().primaryKey(),
  openId: varchar("openId", { length: 64 }).notNull().unique(),
  name: text("name"),
  email: varchar("email", { length: 320 }),
  passwordHash: varchar("passwordHash", { length: 255 }),
  loginMethod: varchar("loginMethod", { length: 64 }),
  role: mysqlEnum("role", ["member", "admin"]).default("member").notNull(),
  readingStreak: int("readingStreak").default(0).notNull(),
  points: int("points").default(0).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull(),
});

export const books = mysqlTable("books", {
  id: int("id").autoincrement().primaryKey(),
  title: varchar("title", { length: 255 }).notNull(),
  author: varchar("author", { length: 255 }).notNull(),
  isbn: varchar("isbn", { length: 32 }).unique(),
  genre: varchar("genre", { length: 100 }).notNull(),
  description: text("description"),
  coverImageUrl: text("coverImageUrl"),
  totalCopies: int("totalCopies").default(1).notNull(),
  availableCopies: int("availableCopies").default(1).notNull(),
  moodTags: text("moodTags"),
  avgRating: int("avgRating").default(0).notNull(),
  totalPages: int("totalPages").default(0).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export const borrowRecords = mysqlTable("borrow_records", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  bookId: int("bookId").notNull(),
  borrowDate: timestamp("borrowDate").defaultNow().notNull(),
  dueDate: timestamp("dueDate").notNull(),
  returnDate: timestamp("returnDate"),
  fineAmount: int("fineAmount").default(0).notNull(),
  status: mysqlEnum("status", ["borrowed", "returned", "overdue"]).default("borrowed").notNull(),
});

export const reviews = mysqlTable("reviews", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  bookId: int("bookId").notNull(),
  rating: int("rating").notNull(),
  comment: text("comment"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
}, (table) => ({
  userBookUnique: unique("reviews_user_book_unique").on(table.userId, table.bookId),
}));

export const wishlist = mysqlTable("wishlist", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  bookId: int("bookId").notNull(),
  addedAt: timestamp("addedAt").defaultNow().notNull(),
}, (table) => ({
  userBookUnique: unique("wishlist_user_book_unique").on(table.userId, table.bookId),
}));

export const readingProgress = mysqlTable("reading_progress", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  bookId: int("bookId").notNull(),
  pagesRead: int("pagesRead").default(0).notNull(),
  totalPages: int("totalPages").default(0).notNull(),
  pagesPerDay: int("pagesPerDay").default(20).notNull(),
  predictedFinishDate: timestamp("predictedFinishDate"),
  lastUpdated: timestamp("lastUpdated").defaultNow().onUpdateNow().notNull(),
}, (table) => ({
  userBookUnique: unique("progress_user_book_unique").on(table.userId, table.bookId),
}));

export const badges = mysqlTable("badges", {
  id: int("id").autoincrement().primaryKey(),
  name: varchar("name", { length: 120 }).notNull().unique(),
  description: text("description").notNull(),
  iconUrl: text("iconUrl"),
  points: int("points").default(0).notNull(),
});

export const userBadges = mysqlTable("user_badges", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  badgeId: int("badgeId").notNull(),
  earnedAt: timestamp("earnedAt").defaultNow().notNull(),
}, (table) => ({
  userBadgeUnique: unique("user_badge_unique").on(table.userId, table.badgeId),
}));

export const readingRooms = mysqlTable("reading_rooms", {
  id: int("id").autoincrement().primaryKey(),
  name: varchar("name", { length: 180 }).notNull(),
  bookId: int("bookId").notNull(),
  createdBy: int("createdBy").notNull(),
  startDate: timestamp("startDate").notNull(),
  endDate: timestamp("endDate").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export const roomMembers = mysqlTable("room_members", {
  id: int("id").autoincrement().primaryKey(),
  roomId: int("roomId").notNull(),
  userId: int("userId").notNull(),
  joinedAt: timestamp("joinedAt").defaultNow().notNull(),
}, (table) => ({
  roomUserUnique: unique("room_user_unique").on(table.roomId, table.userId),
}));

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;
export type Book = typeof books.$inferSelect;
export type InsertBook = typeof books.$inferInsert;
export type BorrowRecord = typeof borrowRecords.$inferSelect;
export type Review = typeof reviews.$inferSelect;
export type WishlistItem = typeof wishlist.$inferSelect;
export type ReadingProgress = typeof readingProgress.$inferSelect;
export type Badge = typeof badges.$inferSelect;
export type ReadingRoom = typeof readingRooms.$inferSelect;

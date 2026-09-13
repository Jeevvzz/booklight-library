CREATE TABLE `badges` (
	`id` int AUTO_INCREMENT NOT NULL,
	`name` varchar(120) NOT NULL,
	`description` text NOT NULL,
	`iconUrl` text,
	`points` int NOT NULL DEFAULT 0,
	CONSTRAINT `badges_id` PRIMARY KEY(`id`),
	CONSTRAINT `badges_name_unique` UNIQUE(`name`)
);
--> statement-breakpoint
CREATE TABLE `books` (
	`id` int AUTO_INCREMENT NOT NULL,
	`title` varchar(255) NOT NULL,
	`author` varchar(255) NOT NULL,
	`isbn` varchar(32),
	`genre` varchar(100) NOT NULL,
	`description` text,
	`coverImageUrl` text,
	`totalCopies` int NOT NULL DEFAULT 1,
	`availableCopies` int NOT NULL DEFAULT 1,
	`moodTags` text,
	`avgRating` int NOT NULL DEFAULT 0,
	`totalPages` int NOT NULL DEFAULT 0,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `books_id` PRIMARY KEY(`id`),
	CONSTRAINT `books_isbn_unique` UNIQUE(`isbn`)
);
--> statement-breakpoint
CREATE TABLE `borrow_records` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`bookId` int NOT NULL,
	`borrowDate` timestamp NOT NULL DEFAULT (now()),
	`dueDate` timestamp NOT NULL,
	`returnDate` timestamp,
	`fineAmount` int NOT NULL DEFAULT 0,
	`status` enum('borrowed','returned','overdue') NOT NULL DEFAULT 'borrowed',
	CONSTRAINT `borrow_records_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `reading_progress` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`bookId` int NOT NULL,
	`pagesRead` int NOT NULL DEFAULT 0,
	`totalPages` int NOT NULL DEFAULT 0,
	`predictedFinishDate` timestamp,
	`lastUpdated` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `reading_progress_id` PRIMARY KEY(`id`),
	CONSTRAINT `progress_user_book_unique` UNIQUE(`userId`,`bookId`)
);
--> statement-breakpoint
CREATE TABLE `reading_rooms` (
	`id` int AUTO_INCREMENT NOT NULL,
	`name` varchar(180) NOT NULL,
	`bookId` int NOT NULL,
	`createdBy` int NOT NULL,
	`startDate` timestamp NOT NULL,
	`endDate` timestamp NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `reading_rooms_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `reviews` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`bookId` int NOT NULL,
	`rating` int NOT NULL,
	`comment` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `reviews_id` PRIMARY KEY(`id`),
	CONSTRAINT `reviews_user_book_unique` UNIQUE(`userId`,`bookId`)
);
--> statement-breakpoint
CREATE TABLE `room_members` (
	`id` int AUTO_INCREMENT NOT NULL,
	`roomId` int NOT NULL,
	`userId` int NOT NULL,
	`joinedAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `room_members_id` PRIMARY KEY(`id`),
	CONSTRAINT `room_user_unique` UNIQUE(`roomId`,`userId`)
);
--> statement-breakpoint
CREATE TABLE `user_badges` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`badgeId` int NOT NULL,
	`earnedAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `user_badges_id` PRIMARY KEY(`id`),
	CONSTRAINT `user_badge_unique` UNIQUE(`userId`,`badgeId`)
);
--> statement-breakpoint
CREATE TABLE `wishlist` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`bookId` int NOT NULL,
	`addedAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `wishlist_id` PRIMARY KEY(`id`),
	CONSTRAINT `wishlist_user_book_unique` UNIQUE(`userId`,`bookId`)
);
--> statement-breakpoint
ALTER TABLE `users` MODIFY COLUMN `role` enum('member','admin') NOT NULL DEFAULT 'member';--> statement-breakpoint
ALTER TABLE `users` ADD `passwordHash` varchar(255);--> statement-breakpoint
ALTER TABLE `users` ADD `readingStreak` int DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE `users` ADD `points` int DEFAULT 0 NOT NULL;
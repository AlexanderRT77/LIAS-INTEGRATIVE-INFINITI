CREATE TABLE `analytics_report_history` (
	`id` int AUTO_INCREMENT NOT NULL,
	`reportId` int NOT NULL,
	`userId` int NOT NULL,
	`status` enum('pending','processing','completed','failed') NOT NULL DEFAULT 'pending',
	`fileUrl` text,
	`fileSize` int,
	`errorMessage` text,
	`executedAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `analytics_report_history_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `analytics_reports` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`name` varchar(255) NOT NULL,
	`description` text,
	`frequency` enum('daily','weekly','monthly') NOT NULL,
	`dayOfWeek` int,
	`dayOfMonth` int,
	`hour` int NOT NULL DEFAULT 9,
	`minute` int NOT NULL DEFAULT 0,
	`format` enum('csv','pdf') NOT NULL DEFAULT 'pdf',
	`destination` enum('email','googleDrive','oneDrive') NOT NULL DEFAULT 'email',
	`recipientEmail` varchar(320),
	`timeRange` enum('7d','30d','90d') NOT NULL DEFAULT '7d',
	`includeModels` text,
	`includeCategories` text,
	`includeBenchmarks` tinyint NOT NULL DEFAULT 1,
	`isActive` tinyint NOT NULL DEFAULT 1,
	`lastRunAt` timestamp,
	`nextRunAt` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `analytics_reports_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
ALTER TABLE `analytics_report_history` ADD CONSTRAINT `analytics_report_history_reportId_analytics_reports_id_fk` FOREIGN KEY (`reportId`) REFERENCES `analytics_reports`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `analytics_report_history` ADD CONSTRAINT `analytics_report_history_userId_users_id_fk` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `analytics_reports` ADD CONSTRAINT `analytics_reports_userId_users_id_fk` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;
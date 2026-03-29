CREATE TABLE `cloud_storage_credentials` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`provider` enum('googleDrive','oneDrive') NOT NULL,
	`accessToken` text NOT NULL,
	`refreshToken` text,
	`expiresAt` timestamp,
	`rootFolderId` varchar(255),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `cloud_storage_credentials_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `export_history` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`scheduledExportId` int,
	`searchQuery` varchar(255) NOT NULL,
	`format` enum('csv','pdf') NOT NULL,
	`destination` enum('email','googleDrive','oneDrive') NOT NULL,
	`status` enum('pending','processing','completed','failed') NOT NULL DEFAULT 'pending',
	`fileUrl` text,
	`fileSize` int,
	`errorMessage` text,
	`exportedAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `export_history_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `scheduled_exports` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`name` varchar(255) NOT NULL,
	`searchQuery` varchar(255) NOT NULL,
	`filters` text,
	`frequency` enum('daily','weekly','monthly') NOT NULL,
	`dayOfWeek` int,
	`dayOfMonth` int,
	`hour` int DEFAULT 9,
	`exportFormat` enum('csv','pdf','both') NOT NULL DEFAULT 'csv',
	`destination` enum('email','googleDrive','oneDrive','both') NOT NULL DEFAULT 'email',
	`email` varchar(320),
	`isActive` tinyint NOT NULL DEFAULT 1,
	`lastRun` timestamp,
	`nextRun` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `scheduled_exports_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
ALTER TABLE `cloud_storage_credentials` ADD CONSTRAINT `cloud_storage_credentials_userId_users_id_fk` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `export_history` ADD CONSTRAINT `export_history_userId_users_id_fk` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `export_history` ADD CONSTRAINT `export_history_scheduledExportId_scheduled_exports_id_fk` FOREIGN KEY (`scheduledExportId`) REFERENCES `scheduled_exports`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `scheduled_exports` ADD CONSTRAINT `scheduled_exports_userId_users_id_fk` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;
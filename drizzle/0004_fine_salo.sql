CREATE TABLE `videoTasks` (
	`id` varchar(64) NOT NULL,
	`userId` varchar(64) NOT NULL,
	`ideaId` varchar(64),
	`idea` text NOT NULL,
	`scenes` text NOT NULL,
	`duration` int NOT NULL,
	`aspectRatio` enum('portrait','landscape') NOT NULL DEFAULT 'portrait',
	`taskId` varchar(128),
	`status` enum('draft','generating','completed','failed') NOT NULL DEFAULT 'draft',
	`videoUrl` text,
	`error` text,
	`createdAt` timestamp DEFAULT (now()),
	`updatedAt` timestamp DEFAULT (now()),
	CONSTRAINT `videoTasks_id` PRIMARY KEY(`id`)
);

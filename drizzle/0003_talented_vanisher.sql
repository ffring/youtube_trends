CREATE TABLE `channelAudits` (
	`id` varchar(64) NOT NULL,
	`userId` varchar(64) NOT NULL,
	`channelId` varchar(64) NOT NULL,
	`overallScore` varchar(32),
	`seoScore` varchar(32),
	`engagementScore` varchar(32),
	`contentQualityScore` varchar(32),
	`recommendations` text,
	`strengths` text,
	`weaknesses` text,
	`createdAt` timestamp DEFAULT (now()),
	CONSTRAINT `channelAudits_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `competitorVideos` (
	`id` varchar(64) NOT NULL,
	`competitorId` varchar(64) NOT NULL,
	`videoId` varchar(64) NOT NULL,
	`title` text NOT NULL,
	`viewCount` varchar(64),
	`likeCount` varchar(64),
	`commentCount` varchar(64),
	`publishedAt` timestamp,
	`thumbnailUrl` text,
	`tags` text,
	`duration` varchar(32),
	`analyzedAt` timestamp DEFAULT (now()),
	CONSTRAINT `competitorVideos_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `competitors` (
	`id` varchar(64) NOT NULL,
	`userId` varchar(64) NOT NULL,
	`channelId` varchar(64) NOT NULL,
	`channelTitle` text,
	`channelDescription` text,
	`thumbnailUrl` text,
	`subscriberCount` varchar(64),
	`videoCount` varchar(64),
	`viewCount` varchar(64),
	`addedAt` timestamp DEFAULT (now()),
	`lastAnalyzedAt` timestamp,
	CONSTRAINT `competitors_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `trendAlerts` (
	`id` varchar(64) NOT NULL,
	`userId` varchar(64) NOT NULL,
	`topicId` varchar(64),
	`alertType` enum('keyword_trending','competitor_video','viral_opportunity') NOT NULL,
	`title` text NOT NULL,
	`description` text,
	`data` text,
	`isRead` enum('yes','no') NOT NULL DEFAULT 'no',
	`createdAt` timestamp DEFAULT (now()),
	CONSTRAINT `trendAlerts_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `videoScorecards` (
	`id` varchar(64) NOT NULL,
	`userId` varchar(64) NOT NULL,
	`videoId` varchar(64) NOT NULL,
	`title` text,
	`seoScore` varchar(32),
	`engagementScore` varchar(32),
	`trendScore` varchar(32),
	`overallScore` varchar(32),
	`suggestions` text,
	`analyzedAt` timestamp DEFAULT (now()),
	CONSTRAINT `videoScorecards_id` PRIMARY KEY(`id`)
);

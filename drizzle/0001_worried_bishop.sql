CREATE TABLE `contentIdeas` (
	`id` varchar(64) NOT NULL,
	`userId` varchar(64) NOT NULL,
	`topicId` varchar(64),
	`contentType` enum('long','short') NOT NULL,
	`title` text NOT NULL,
	`description` text,
	`script` text,
	`tags` text,
	`thumbnailPrompt` text,
	`thumbnailUrl` text,
	`trendBasis` text,
	`score` varchar(32),
	`status` enum('draft','approved','used') NOT NULL DEFAULT 'draft',
	`createdAt` timestamp DEFAULT (now()),
	CONSTRAINT `contentIdeas_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `trendingVideos` (
	`id` varchar(64) NOT NULL,
	`videoId` varchar(64) NOT NULL,
	`title` text NOT NULL,
	`channelTitle` text,
	`viewCount` varchar(64),
	`likeCount` varchar(64),
	`commentCount` varchar(64),
	`publishedAt` timestamp,
	`thumbnailUrl` text,
	`category` varchar(128),
	`tags` text,
	`duration` varchar(32),
	`isShort` enum('yes','no') NOT NULL DEFAULT 'no',
	`trendScore` varchar(32),
	`analyzedAt` timestamp DEFAULT (now()),
	CONSTRAINT `trendingVideos_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `userTopics` (
	`id` varchar(64) NOT NULL,
	`userId` varchar(64) NOT NULL,
	`name` text NOT NULL,
	`description` text,
	`keywords` text,
	`createdAt` timestamp DEFAULT (now()),
	CONSTRAINT `userTopics_id` PRIMARY KEY(`id`)
);

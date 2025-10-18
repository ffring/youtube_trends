CREATE TABLE `youtubeChannels` (
	`id` varchar(64) NOT NULL,
	`userId` varchar(64) NOT NULL,
	`channelId` varchar(64) NOT NULL,
	`channelTitle` text,
	`channelDescription` text,
	`thumbnailUrl` text,
	`subscriberCount` varchar(64),
	`videoCount` varchar(64),
	`viewCount` varchar(64),
	`accessToken` text NOT NULL,
	`refreshToken` text NOT NULL,
	`tokenExpiresAt` timestamp,
	`connectedAt` timestamp DEFAULT (now()),
	`lastSyncedAt` timestamp,
	CONSTRAINT `youtubeChannels_id` PRIMARY KEY(`id`)
);

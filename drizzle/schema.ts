import { int, mysqlEnum, mysqlTable, text, timestamp, varchar } from "drizzle-orm/mysql-core";

/**
 * Core user table backing auth flow.
 * Extend this file with additional tables as your product grows.
 * Columns use camelCase to match both database fields and generated types.
 */
export const users = mysqlTable("users", {
  id: varchar("id", { length: 64 }).primaryKey(),
  name: text("name"),
  email: varchar("email", { length: 320 }),
  loginMethod: varchar("loginMethod", { length: 64 }),
  role: mysqlEnum("role", ["user", "admin"]).default("user").notNull(),
  createdAt: timestamp("createdAt").defaultNow(),
  lastSignedIn: timestamp("lastSignedIn").defaultNow(),
});

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;

// YouTube channel connections
export const youtubeChannels = mysqlTable("youtubeChannels", {
  id: varchar("id", { length: 64 }).primaryKey(),
  userId: varchar("userId", { length: 64 }).notNull(),
  channelId: varchar("channelId", { length: 64 }).notNull(),
  channelTitle: text("channelTitle"),
  channelDescription: text("channelDescription"),
  thumbnailUrl: text("thumbnailUrl"),
  subscriberCount: varchar("subscriberCount", { length: 64 }),
  videoCount: varchar("videoCount", { length: 64 }),
  viewCount: varchar("viewCount", { length: 64 }),
  accessToken: text("accessToken").notNull(),
  refreshToken: text("refreshToken").notNull(),
  tokenExpiresAt: timestamp("tokenExpiresAt"),
  connectedAt: timestamp("connectedAt").defaultNow(),
  lastSyncedAt: timestamp("lastSyncedAt"),
});

export type YouTubeChannel = typeof youtubeChannels.$inferSelect;
export type InsertYouTubeChannel = typeof youtubeChannels.$inferInsert;

// User topics/themes for content creation
export const userTopics = mysqlTable("userTopics", {
  id: varchar("id", { length: 64 }).primaryKey(),
  userId: varchar("userId", { length: 64 }).notNull(),
  name: text("name").notNull(),
  description: text("description"),
  keywords: text("keywords"), // JSON array of keywords
  createdAt: timestamp("createdAt").defaultNow(),
});

export type UserTopic = typeof userTopics.$inferSelect;
export type InsertUserTopic = typeof userTopics.$inferInsert;

// Analyzed trending videos
export const trendingVideos = mysqlTable("trendingVideos", {
  id: varchar("id", { length: 64 }).primaryKey(),
  videoId: varchar("videoId", { length: 64 }).notNull(),
  title: text("title").notNull(),
  channelTitle: text("channelTitle"),
  viewCount: varchar("viewCount", { length: 64 }),
  likeCount: varchar("likeCount", { length: 64 }),
  commentCount: varchar("commentCount", { length: 64 }),
  publishedAt: timestamp("publishedAt"),
  thumbnailUrl: text("thumbnailUrl"),
  category: varchar("category", { length: 128 }),
  tags: text("tags"), // JSON array
  duration: varchar("duration", { length: 32 }),
  isShort: mysqlEnum("isShort", ["yes", "no"]).default("no").notNull(),
  trendScore: varchar("trendScore", { length: 32 }),
  analyzedAt: timestamp("analyzedAt").defaultNow(),
});

export type TrendingVideo = typeof trendingVideos.$inferSelect;
export type InsertTrendingVideo = typeof trendingVideos.$inferInsert;

// Generated content ideas
export const contentIdeas = mysqlTable("contentIdeas", {
  id: varchar("id", { length: 64 }).primaryKey(),
  userId: varchar("userId", { length: 64 }).notNull(),
  topicId: varchar("topicId", { length: 64 }),
  contentType: mysqlEnum("contentType", ["long", "short"]).notNull(),
  title: text("title").notNull(),
  description: text("description"),
  script: text("script"),
  tags: text("tags"), // JSON array
  thumbnailPrompt: text("thumbnailPrompt"),
  thumbnailUrl: text("thumbnailUrl"),
  trendBasis: text("trendBasis"), // JSON array of trending video IDs
  score: varchar("score", { length: 32 }),
  status: mysqlEnum("status", ["draft", "approved", "used"]).default("draft").notNull(),
  createdAt: timestamp("createdAt").defaultNow(),
});

export type ContentIdea = typeof contentIdeas.$inferSelect;
export type InsertContentIdea = typeof contentIdeas.$inferInsert;

// Competitor channels tracking
export const competitors = mysqlTable("competitors", {
  id: varchar("id", { length: 64 }).primaryKey(),
  userId: varchar("userId", { length: 64 }).notNull(),
  channelId: varchar("channelId", { length: 64 }).notNull(),
  channelTitle: text("channelTitle"),
  channelDescription: text("channelDescription"),
  thumbnailUrl: text("thumbnailUrl"),
  subscriberCount: varchar("subscriberCount", { length: 64 }),
  videoCount: varchar("videoCount", { length: 64 }),
  viewCount: varchar("viewCount", { length: 64 }),
  addedAt: timestamp("addedAt").defaultNow(),
  lastAnalyzedAt: timestamp("lastAnalyzedAt"),
});

export type Competitor = typeof competitors.$inferSelect;
export type InsertCompetitor = typeof competitors.$inferInsert;

// Competitor videos tracking
export const competitorVideos = mysqlTable("competitorVideos", {
  id: varchar("id", { length: 64 }).primaryKey(),
  competitorId: varchar("competitorId", { length: 64 }).notNull(),
  videoId: varchar("videoId", { length: 64 }).notNull(),
  title: text("title").notNull(),
  viewCount: varchar("viewCount", { length: 64 }),
  likeCount: varchar("likeCount", { length: 64 }),
  commentCount: varchar("commentCount", { length: 64 }),
  publishedAt: timestamp("publishedAt"),
  thumbnailUrl: text("thumbnailUrl"),
  tags: text("tags"), // JSON array
  duration: varchar("duration", { length: 32 }),
  analyzedAt: timestamp("analyzedAt").defaultNow(),
});

export type CompetitorVideo = typeof competitorVideos.$inferSelect;
export type InsertCompetitorVideo = typeof competitorVideos.$inferInsert;

// Channel audit results
export const channelAudits = mysqlTable("channelAudits", {
  id: varchar("id", { length: 64 }).primaryKey(),
  userId: varchar("userId", { length: 64 }).notNull(),
  channelId: varchar("channelId", { length: 64 }).notNull(),
  overallScore: varchar("overallScore", { length: 32 }),
  seoScore: varchar("seoScore", { length: 32 }),
  engagementScore: varchar("engagementScore", { length: 32 }),
  contentQualityScore: varchar("contentQualityScore", { length: 32 }),
  recommendations: text("recommendations"), // JSON array
  strengths: text("strengths"), // JSON array
  weaknesses: text("weaknesses"), // JSON array
  createdAt: timestamp("createdAt").defaultNow(),
});

export type ChannelAudit = typeof channelAudits.$inferSelect;
export type InsertChannelAudit = typeof channelAudits.$inferInsert;

// Video scorecards
export const videoScorecards = mysqlTable("videoScorecards", {
  id: varchar("id", { length: 64 }).primaryKey(),
  userId: varchar("userId", { length: 64 }).notNull(),
  videoId: varchar("videoId", { length: 64 }).notNull(),
  title: text("title"),
  seoScore: varchar("seoScore", { length: 32 }),
  engagementScore: varchar("engagementScore", { length: 32 }),
  trendScore: varchar("trendScore", { length: 32 }),
  overallScore: varchar("overallScore", { length: 32 }),
  suggestions: text("suggestions"), // JSON array
  analyzedAt: timestamp("analyzedAt").defaultNow(),
});

export type VideoScorecard = typeof videoScorecards.$inferSelect;
export type InsertVideoScorecard = typeof videoScorecards.$inferInsert;

// Trend alerts
export const trendAlerts = mysqlTable("trendAlerts", {
  id: varchar("id", { length: 64 }).primaryKey(),
  userId: varchar("userId", { length: 64 }).notNull(),
  topicId: varchar("topicId", { length: 64 }),
  alertType: mysqlEnum("alertType", ["keyword_trending", "competitor_video", "viral_opportunity"]).notNull(),
  title: text("title").notNull(),
  description: text("description"),
  data: text("data"), // JSON with alert details
  isRead: mysqlEnum("isRead", ["yes", "no"]).default("no").notNull(),
  createdAt: timestamp("createdAt").defaultNow(),
});

export type TrendAlert = typeof trendAlerts.$inferSelect;
export type InsertTrendAlert = typeof trendAlerts.$inferInsert;

// Video generation tasks (Sora 2 Pro)
export const videoTasks = mysqlTable("videoTasks", {
  id: varchar("id", { length: 64 }).primaryKey(),
  userId: varchar("userId", { length: 64 }).notNull(),
  ideaId: varchar("ideaId", { length: 64 }), // Link to contentIdeas if generated from idea
  idea: text("idea").notNull(), // Original user idea
  scenes: text("scenes").notNull(), // JSON array of {prompt, duration}
  duration: int("duration").notNull(), // 10, 15, or 25 seconds
  aspectRatio: mysqlEnum("aspectRatio", ["portrait", "landscape"]).default("portrait").notNull(),
  taskId: varchar("taskId", { length: 128 }), // Sora API task ID
  status: mysqlEnum("status", ["draft", "generating", "completed", "failed"]).default("draft").notNull(),
  videoUrl: text("videoUrl"), // URL of generated video
  error: text("error"), // Error message if failed
  createdAt: timestamp("createdAt").defaultNow(),
  updatedAt: timestamp("updatedAt").defaultNow(),
});

export type VideoTask = typeof videoTasks.$inferSelect;
export type InsertVideoTask = typeof videoTasks.$inferInsert;

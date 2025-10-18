import { eq, desc, and } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
import { InsertUser, users, userTopics, InsertUserTopic, trendingVideos, InsertTrendingVideo, contentIdeas, InsertContentIdea, youtubeChannels, InsertYouTubeChannel, competitors, InsertCompetitor, competitorVideos, InsertCompetitorVideo, channelAudits, InsertChannelAudit, videoScorecards, InsertVideoScorecard, trendAlerts, InsertTrendAlert, videoTasks, InsertVideoTask, VideoTask } from "../drizzle/schema";
import { ENV } from './_core/env';

let _db: ReturnType<typeof drizzle> | null = null;

// Lazily create the drizzle instance so local tooling can run without a DB.
export async function getDb() {
  if (!_db && process.env.DATABASE_URL) {
    try {
      _db = drizzle(process.env.DATABASE_URL);
    } catch (error) {
      console.warn("[Database] Failed to connect:", error);
      _db = null;
    }
  }
  return _db;
}

export async function upsertUser(user: InsertUser): Promise<void> {
  if (!user.id) {
    throw new Error("User ID is required for upsert");
  }

  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot upsert user: database not available");
    return;
  }

  try {
    const values: InsertUser = {
      id: user.id,
    };
    const updateSet: Record<string, unknown> = {};

    const textFields = ["name", "email", "loginMethod"] as const;
    type TextField = (typeof textFields)[number];

    const assignNullable = (field: TextField) => {
      const value = user[field];
      if (value === undefined) return;
      const normalized = value ?? null;
      values[field] = normalized;
      updateSet[field] = normalized;
    };

    textFields.forEach(assignNullable);

    if (user.lastSignedIn !== undefined) {
      values.lastSignedIn = user.lastSignedIn;
      updateSet.lastSignedIn = user.lastSignedIn;
    }
    if (user.role === undefined) {
      if (user.id === ENV.ownerId) {
        user.role = 'admin';
        values.role = 'admin';
        updateSet.role = 'admin';
      }
    }

    if (Object.keys(updateSet).length === 0) {
      updateSet.lastSignedIn = new Date();
    }

    await db.insert(users).values(values).onDuplicateKeyUpdate({
      set: updateSet,
    });
  } catch (error) {
    console.error("[Database] Failed to upsert user:", error);
    throw error;
  }
}

export async function getUser(id: string) {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot get user: database not available");
    return undefined;
  }

  const result = await db.select().from(users).where(eq(users.id, id)).limit(1);

  return result.length > 0 ? result[0] : undefined;
}

// User Topics
export async function createUserTopic(topic: InsertUserTopic) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.insert(userTopics).values(topic);
  return topic;
}

export async function getUserTopics(userId: string) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(userTopics).where(eq(userTopics.userId, userId)).orderBy(desc(userTopics.createdAt));
}

export async function deleteUserTopic(id: string) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.delete(userTopics).where(eq(userTopics.id, id));
}

// Trending Videos
export async function saveTrendingVideo(video: InsertTrendingVideo) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.insert(trendingVideos).values(video);
  return video;
}

export async function getTrendingVideos(limit: number = 50) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(trendingVideos).orderBy(desc(trendingVideos.analyzedAt)).limit(limit);
}

export async function getTrendingVideosByType(isShort: "yes" | "no", limit: number = 50) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(trendingVideos).where(eq(trendingVideos.isShort, isShort)).orderBy(desc(trendingVideos.trendScore)).limit(limit);
}

// Content Ideas
export async function createContentIdea(idea: InsertContentIdea) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.insert(contentIdeas).values(idea);
  return idea;
}

export async function getUserContentIdeas(userId: string) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(contentIdeas).where(eq(contentIdeas.userId, userId)).orderBy(desc(contentIdeas.createdAt));
}

export async function updateContentIdeaStatus(id: string, status: "draft" | "approved" | "used") {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.update(contentIdeas).set({ status }).where(eq(contentIdeas.id, id));
}

export async function deleteContentIdea(id: string) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.delete(contentIdeas).where(eq(contentIdeas.id, id));
}

// YouTube Channels
export async function saveYouTubeChannel(channel: InsertYouTubeChannel) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.insert(youtubeChannels).values(channel).onDuplicateKeyUpdate({
    set: {
      channelTitle: channel.channelTitle,
      channelDescription: channel.channelDescription,
      thumbnailUrl: channel.thumbnailUrl,
      subscriberCount: channel.subscriberCount,
      videoCount: channel.videoCount,
      viewCount: channel.viewCount,
      accessToken: channel.accessToken,
      refreshToken: channel.refreshToken,
      tokenExpiresAt: channel.tokenExpiresAt,
      lastSyncedAt: new Date(),
    },
  });
  return channel;
}

export async function getUserYouTubeChannel(userId: string) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(youtubeChannels).where(eq(youtubeChannels.userId, userId)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

export async function updateYouTubeChannelTokens(id: string, accessToken: string, refreshToken: string, expiresAt: Date) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.update(youtubeChannels).set({ accessToken, refreshToken, tokenExpiresAt: expiresAt }).where(eq(youtubeChannels.id, id));
}

export async function deleteYouTubeChannel(id: string) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.delete(youtubeChannels).where(eq(youtubeChannels.id, id));
}

// Competitors
export async function createCompetitor(competitor: InsertCompetitor) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.insert(competitors).values(competitor);
  return competitor;
}

export async function getUserCompetitors(userId: string) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(competitors).where(eq(competitors.userId, userId)).orderBy(desc(competitors.addedAt));
}

export async function getCompetitor(id: string) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(competitors).where(eq(competitors.id, id)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

export async function deleteCompetitor(id: string) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.delete(competitors).where(eq(competitors.id, id));
}

// Competitor Videos
export async function createCompetitorVideo(video: InsertCompetitorVideo) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.insert(competitorVideos).values(video);
  return video;
}

export async function getCompetitorVideos(competitorId: string) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(competitorVideos).where(eq(competitorVideos.competitorId, competitorId)).orderBy(desc(competitorVideos.publishedAt));
}

// Channel Audits
export async function createChannelAudit(audit: InsertChannelAudit) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.insert(channelAudits).values(audit);
  return audit;
}

export async function getLatestChannelAudit(userId: string) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(channelAudits).where(eq(channelAudits.userId, userId)).orderBy(desc(channelAudits.createdAt)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

export async function getUserRecentVideos(userId: string, limit: number = 20) {
  const db = await getDb();
  if (!db) return [];
  // This would need to fetch from user's channel videos - for now return trending videos as placeholder
  return db.select().from(trendingVideos).orderBy(desc(trendingVideos.publishedAt)).limit(limit);
}

// Video Scorecards
export async function createVideoScorecard(scorecard: InsertVideoScorecard) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.insert(videoScorecards).values(scorecard);
  return scorecard;
}

export async function getVideoScorecard(userId: string, videoId: string) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(videoScorecards)
    .where(and(eq(videoScorecards.userId, userId), eq(videoScorecards.videoId, videoId)))
    .orderBy(desc(videoScorecards.analyzedAt))
    .limit(1);
  return result.length > 0 ? result[0] : undefined;
}

export async function getVideoById(videoId: string) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(trendingVideos).where(eq(trendingVideos.videoId, videoId)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

// Trend Alerts
export async function createTrendAlert(alert: InsertTrendAlert) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.insert(trendAlerts).values(alert);
  return alert;
}

export async function getUserTrendAlerts(userId: string) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(trendAlerts).where(eq(trendAlerts.userId, userId)).orderBy(desc(trendAlerts.createdAt));
}

export async function markAlertAsRead(id: string) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.update(trendAlerts).set({ isRead: 'yes' }).where(eq(trendAlerts.id, id));
}


// Video Tasks functions
export async function createVideoTask(task: InsertVideoTask): Promise<void> {
  const db = await getDb();
  if (!db) return;
  await db.insert(videoTasks).values(task);
}

export async function getVideoTask(id: string): Promise<VideoTask | undefined> {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(videoTasks).where(eq(videoTasks.id, id)).limit(1);
  return result[0];
}

export async function getUserVideoTasks(userId: string): Promise<VideoTask[]> {
  const db = await getDb();
  if (!db) return [];
  return await db.select().from(videoTasks).where(eq(videoTasks.userId, userId)).orderBy(desc(videoTasks.createdAt));
}

export async function updateVideoTask(id: string, updates: Partial<InsertVideoTask>): Promise<void> {
  const db = await getDb();
  if (!db) return;
  await db.update(videoTasks).set({ ...updates, updatedAt: new Date() }).where(eq(videoTasks.id, id));
}


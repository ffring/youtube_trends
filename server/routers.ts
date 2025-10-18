import { COOKIE_NAME } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { publicProcedure, router, protectedProcedure } from "./_core/trpc";
import { z } from "zod";
import { nanoid } from "nanoid";
import { eq } from "drizzle-orm";
import * as db from "./db";
import { contentIdeas } from "../drizzle/schema";
import { getAuthorizationUrl, exchangeCodeForTokens, getChannelInfo, getTrendingVideosAuthenticated, refreshAccessToken } from "./services/youtubeOAuthService";
import { generateContentIdea, analyzeTrends } from "./services/aiContentService";
import { calculateTrendScore } from "./services/youtubeService";
import { analyzeCompetitorChannel } from "./services/competitorService";
import { performChannelAudit } from "./services/channelAuditService";
import { generateVideoScorecard } from "./services/videoScorecardService";

export const appRouter = router({
  system: systemRouter,

  auth: router({
    me: publicProcedure.query(opts => opts.ctx.user),
    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      return {
        success: true,
      } as const;
    }),
  }),

  youtube: router({
    getAuthUrl: protectedProcedure.query(({ ctx }) => {
      const state = nanoid();
      // Use PUBLIC_URL from env for production, fallback to request host for dev
      const baseUrl = (process.env.PUBLIC_URL || `${ctx.req.protocol}://${ctx.req.get('host')}`).replace(/\/$/, '');
      const redirectUri = `${baseUrl}/api/youtube/callback`;
      
      const authUrl = getAuthorizationUrl(
        {
          clientId: process.env.GOOGLE_CLIENT_ID!,
          clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
          redirectUri,
        },
        state
      );
      
      return { authUrl, state };
    }),

    getConnectedChannel: protectedProcedure.query(async ({ ctx }) => {
      const channel = await db.getUserYouTubeChannel(ctx.user.id);
      if (!channel) return null;
      
      // Don't expose tokens to client
      const { accessToken, refreshToken, ...safeChannel } = channel;
      return safeChannel;
    }),

    disconnectChannel: protectedProcedure.mutation(async ({ ctx }) => {
      const channel = await db.getUserYouTubeChannel(ctx.user.id);
      if (channel) {
        await db.deleteYouTubeChannel(channel.id);
      }
      return { success: true };
    }),

    getTrending: protectedProcedure
      .input(z.object({
        regionCode: z.string().optional(),
        maxResults: z.number().optional(),
        keywords: z.string().optional(),
      }))
      .query(async ({ ctx, input }) => {
        const channel = await db.getUserYouTubeChannel(ctx.user.id);
        if (!channel) {
          throw new Error('YouTube channel not connected');
        }

        // Check if token needs refresh
        let accessToken = channel.accessToken;
        if (channel.tokenExpiresAt && new Date(channel.tokenExpiresAt) < new Date()) {
          const tokens = await refreshAccessToken(
            {
              clientId: process.env.GOOGLE_CLIENT_ID!,
              clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
              redirectUri: '',
            },
            channel.refreshToken
          );
          await db.updateYouTubeChannelTokens(channel.id, tokens.accessToken, tokens.refreshToken, tokens.expiresAt);
          accessToken = tokens.accessToken;
        }

        let videos;
        
        // If keywords provided, search by keywords instead of trending
        if (input.keywords && input.keywords.trim()) {
          const { searchVideosByKeywords } = await import('./services/youtubeOAuthService');
          videos = await searchVideosByKeywords(
            accessToken,
            input.keywords,
            input.regionCode || 'US',
            input.maxResults || 50
          );
        } else {
          // Get trending videos by region
          videos = await getTrendingVideosAuthenticated(
            accessToken,
            input.regionCode || 'US',
            input.maxResults || 50
          );
        }

        // Save to database and calculate scores
        const processedVideos = videos.map((v: any) => {
          const duration = v.contentDetails?.duration || 'PT0S';
          const isShort = isYouTubeShort(duration);
          
          const video = {
            id: v.id,
            title: v.snippet?.title || '',
            channelTitle: v.snippet?.channelTitle || '',
            viewCount: v.statistics?.viewCount || '0',
            likeCount: v.statistics?.likeCount || '0',
            commentCount: v.statistics?.commentCount || '0',
            publishedAt: v.snippet?.publishedAt || new Date().toISOString(),
            thumbnailUrl: v.snippet?.thumbnails?.high?.url || '',
            category: v.snippet?.categoryId || '',
            tags: v.snippet?.tags || [],
            duration,
            isShort,
          };
          
          const score = calculateTrendScore(video);
          
          // Save to DB asynchronously
          db.saveTrendingVideo({
            id: nanoid(),
            videoId: video.id,
            title: video.title,
            channelTitle: video.channelTitle,
            viewCount: video.viewCount,
            likeCount: video.likeCount,
            commentCount: video.commentCount,
            publishedAt: new Date(video.publishedAt),
            thumbnailUrl: video.thumbnailUrl,
            category: video.category,
            tags: JSON.stringify(video.tags),
            duration: video.duration,
            isShort: isShort ? 'yes' : 'no',
            trendScore: String(score),
          }).catch(err => console.error('Error saving trending video:', err));
          
          return { ...video, score };
        });

        return processedVideos;
      }),
  }),

  content: router({
    // Topics
    getUserTopics: protectedProcedure.query(async ({ ctx }) => {
      const topics = await db.getUserTopics(ctx.user.id);
      return topics.map(t => ({
        ...t,
        keywords: t.keywords ? JSON.parse(t.keywords) : [],
      }));
    }),

    addTopic: protectedProcedure
      .input(z.object({
        name: z.string(),
        description: z.string().optional(),
        keywords: z.array(z.string()).optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        const topic = await db.createUserTopic({
          id: nanoid(),
          userId: ctx.user.id,
          name: input.name,
          description: input.description,
          keywords: input.keywords ? JSON.stringify(input.keywords) : null,
        });
        return topic;
      }),

    deleteTopic: protectedProcedure
      .input(z.object({ id: z.string() }))
      .mutation(async ({ input }) => {
        await db.deleteUserTopic(input.id);
        return { success: true };
      }),

    // Ideas
    getUserIdeas: protectedProcedure.query(async ({ ctx }) => {
      const ideas = await db.getUserContentIdeas(ctx.user.id);
      return ideas.map(i => ({
        ...i,
        tags: i.tags ? JSON.parse(i.tags) : [],
      }));
    }),
  }),

  topics: router({
    list: protectedProcedure.query(async ({ ctx }) => {
      return db.getUserTopics(ctx.user.id);
    }),

    create: protectedProcedure
      .input(z.object({
        name: z.string(),
        description: z.string().optional(),
        keywords: z.array(z.string()).optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        const topic = await db.createUserTopic({
          id: nanoid(),
          userId: ctx.user.id,
          name: input.name,
          description: input.description,
          keywords: input.keywords ? JSON.stringify(input.keywords) : null,
        });
        return topic;
      }),

    delete: protectedProcedure
      .input(z.object({ id: z.string() }))
      .mutation(async ({ input }) => {
        await db.deleteUserTopic(input.id);
        return { success: true };
      }),
  }),

  competitors: router({
    list: protectedProcedure.query(async ({ ctx }) => {
      return db.getUserCompetitors(ctx.user.id);
    }),

    add: protectedProcedure
      .input(z.object({ channelId: z.string() }))
      .mutation(async ({ ctx, input }) => {
        const channel = await db.getUserYouTubeChannel(ctx.user.id);
        if (!channel) {
          throw new Error('YouTube channel not connected');
        }

        // Analyze competitor channel
        const analysis = await analyzeCompetitorChannel(input.channelId, channel.accessToken);
        
        // Save competitor
        const competitor = await db.createCompetitor({
          id: nanoid(),
          userId: ctx.user.id,
          channelId: analysis.channelId,
          channelTitle: analysis.channelTitle,
          channelDescription: analysis.channelDescription,
          thumbnailUrl: analysis.thumbnailUrl,
          subscriberCount: analysis.subscriberCount,
          videoCount: analysis.videoCount,
          viewCount: analysis.viewCount,
          lastAnalyzedAt: new Date(),
        });

        // Save recent videos
        for (const video of analysis.recentVideos) {
          await db.createCompetitorVideo({
            id: nanoid(),
            competitorId: competitor.id,
            videoId: video.videoId,
            title: video.title,
            viewCount: video.viewCount,
            likeCount: video.likeCount,
            commentCount: video.commentCount,
            publishedAt: video.publishedAt,
            thumbnailUrl: video.thumbnailUrl,
            tags: JSON.stringify(video.tags),
            duration: video.duration,
          });
        }

        return { competitor, analysis };
      }),

    delete: protectedProcedure
      .input(z.object({ id: z.string() }))
      .mutation(async ({ input }) => {
        await db.deleteCompetitor(input.id);
        return { success: true };
      }),

    analyze: protectedProcedure
      .input(z.object({ id: z.string() }))
      .query(async ({ ctx, input }) => {
        const competitor = await db.getCompetitor(input.id);
        if (!competitor || competitor.userId !== ctx.user.id) {
          throw new Error('Competitor not found');
        }

        const videos = await db.getCompetitorVideos(competitor.id);
        return {
          competitor,
          videos: videos.map(v => ({
            ...v,
            tags: v.tags ? JSON.parse(v.tags) : [],
          })),
        };
      }),
  }),

  audit: router({
    performChannelAudit: protectedProcedure.mutation(async ({ ctx }) => {
      const channel = await db.getUserYouTubeChannel(ctx.user.id);
      if (!channel) {
        throw new Error('YouTube channel not connected');
      }

      // Get recent videos from user's channel
      const recentVideos = await db.getUserRecentVideos(ctx.user.id, 20);
      
      const auditResult = await performChannelAudit({
        channelTitle: channel.channelTitle || '',
        channelDescription: channel.channelDescription || '',
        subscriberCount: channel.subscriberCount || '0',
        videoCount: channel.videoCount || '0',
        viewCount: channel.viewCount || '0',
        recentVideos: recentVideos.map(v => ({
          title: v.title,
          viewCount: v.viewCount || '0',
          likeCount: v.likeCount || '0',
          commentCount: v.commentCount || '0',
          tags: v.tags ? JSON.parse(v.tags) : [],
        })),
      });

      // Save audit result
      const audit = await db.createChannelAudit({
        id: nanoid(),
        userId: ctx.user.id,
        channelId: channel.channelId,
        overallScore: String(auditResult.overallScore),
        seoScore: String(auditResult.seoScore),
        engagementScore: String(auditResult.engagementScore),
        contentQualityScore: String(auditResult.contentQualityScore),
        recommendations: JSON.stringify(auditResult.recommendations),
        strengths: JSON.stringify(auditResult.strengths),
        weaknesses: JSON.stringify(auditResult.weaknesses),
      });

      return { ...audit, ...auditResult };
    }),

    performChannelAuditByUrl: protectedProcedure
      .input(z.object({ channelUrl: z.string() }))
      .mutation(async ({ ctx, input }) => {
        const channel = await db.getUserYouTubeChannel(ctx.user.id);
        if (!channel) {
          throw new Error('YouTube channel not connected');
        }

        // Check if token needs refresh
        let accessToken = channel.accessToken;
        if (channel.tokenExpiresAt && new Date(channel.tokenExpiresAt) < new Date()) {
          const tokens = await refreshAccessToken(
            {
              clientId: process.env.GOOGLE_CLIENT_ID!,
              clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
              redirectUri: '',
            },
            channel.refreshToken
          );
          await db.updateYouTubeChannelTokens(channel.id, tokens.accessToken, tokens.refreshToken, tokens.expiresAt);
          accessToken = tokens.accessToken;
        }

        const { performChannelAuditWithRealData, extractChannelId, getChannelIdByHandle } = await import('./services/channelAuditService');
        
        // Extract channel ID from URL
        let channelIdentifier = extractChannelId(input.channelUrl);
        if (!channelIdentifier) {
          throw new Error('Invalid channel URL');
        }

        // Get actual channel ID
        const channelId = await getChannelIdByHandle(accessToken, channelIdentifier);
        
        // Perform audit with real data
        const auditResult = await performChannelAuditWithRealData(accessToken, channelId);

        // Save audit result
        const audit = await db.createChannelAudit({
          id: nanoid(),
          userId: ctx.user.id,
          channelId: channelId,
          overallScore: String(auditResult.overallScore),
          seoScore: String(auditResult.seoScore),
          engagementScore: String(auditResult.engagementScore),
          contentQualityScore: String(auditResult.contentQualityScore),
          recommendations: JSON.stringify(auditResult.recommendations),
          strengths: JSON.stringify(auditResult.strengths),
          weaknesses: JSON.stringify(auditResult.weaknesses),
        });

        return { 
          ...audit, 
          ...auditResult,
          recommendations: auditResult.recommendations,
          strengths: auditResult.strengths,
          weaknesses: auditResult.weaknesses,
        };
      }),

    getLatestAudit: protectedProcedure.query(async ({ ctx }) => {
      const audit = await db.getLatestChannelAudit(ctx.user.id);
      if (!audit) return null;
      
      return {
        ...audit,
        recommendations: audit.recommendations ? JSON.parse(audit.recommendations) : [],
        strengths: audit.strengths ? JSON.parse(audit.strengths) : [],
        weaknesses: audit.weaknesses ? JSON.parse(audit.weaknesses) : [],
        analyzedVideos: audit.analyzedVideos ? JSON.parse(audit.analyzedVideos) : [],
      };
    }),
  }),

  scorecard: router({
    generateForVideo: protectedProcedure
      .input(z.object({ videoId: z.string() }))
      .mutation(async ({ ctx, input }) => {
        // Get video data from trending videos or user's videos
        const video = await db.getVideoById(input.videoId);
        if (!video) {
          throw new Error('Video not found');
        }

        const scorecard = await generateVideoScorecard({
          title: video.title,
          description: '',
          tags: video.tags ? JSON.parse(video.tags) : [],
          viewCount: video.viewCount || '0',
          likeCount: video.likeCount || '0',
          commentCount: video.commentCount || '0',
          publishedAt: video.publishedAt || new Date(),
        });

        // Save scorecard
        const saved = await db.createVideoScorecard({
          id: nanoid(),
          userId: ctx.user.id,
          videoId: input.videoId,
          title: video.title,
          seoScore: String(scorecard.seoScore),
          engagementScore: String(scorecard.engagementScore),
          trendScore: String(scorecard.trendScore),
          overallScore: String(scorecard.overallScore),
          suggestions: JSON.stringify(scorecard.suggestions),
        });

        return { ...saved, ...scorecard };
      }),

    getForVideo: protectedProcedure
      .input(z.object({ videoId: z.string() }))
      .query(async ({ ctx, input }) => {
        const scorecard = await db.getVideoScorecard(ctx.user.id, input.videoId);
        if (!scorecard) return null;
        
        return {
          ...scorecard,
          suggestions: scorecard.suggestions ? JSON.parse(scorecard.suggestions) : [],
        };
      }),
  }),

  alerts: router({
    list: protectedProcedure.query(async ({ ctx }) => {
      const alerts = await db.getUserTrendAlerts(ctx.user.id);
      return alerts.map(a => ({
        ...a,
        data: a.data ? JSON.parse(a.data) : {},
      }));
    }),

    markAsRead: protectedProcedure
      .input(z.object({ id: z.string() }))
      .mutation(async ({ input }) => {
        await db.markAlertAsRead(input.id);
        return { success: true };
      }),

    create: protectedProcedure
      .input(z.object({
        topicId: z.string().optional(),
        alertType: z.enum(['keyword_trending', 'competitor_video', 'viral_opportunity']),
        title: z.string(),
        description: z.string(),
        data: z.any().optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        const alert = await db.createTrendAlert({
          id: nanoid(),
          userId: ctx.user.id,
          topicId: input.topicId || null,
          alertType: input.alertType,
          title: input.title,
          description: input.description || null,
          data: input.data ? JSON.stringify(input.data) : null,
        });
        return alert;
      }),
  }),

  video: router({
    // Generate video prompt from idea
    generatePrompt: protectedProcedure
      .input(z.object({
        idea: z.string(),
        duration: z.number().optional(),
      }))
      .mutation(async ({ input }) => {
        const { generateVideoPrompt } = await import('./services/soraVideoService');
        const result = await generateVideoPrompt(input.idea, input.duration || 15);
        return result;
      }),

    // Refine video prompt through chat
    refinePrompt: protectedProcedure
      .input(z.object({
        originalIdea: z.string(),
        currentScenes: z.array(z.object({
          prompt: z.string(),
          duration: z.number(),
        })),
        userFeedback: z.string(),
        duration: z.number(),
        chatHistory: z.array(z.object({
          role: z.enum(['user', 'assistant']),
          content: z.string(),
        })).optional(),
      }))
      .mutation(async ({ input }) => {
        const { refineVideoPrompt } = await import('./services/soraVideoService');
        const result = await refineVideoPrompt(
          input.originalIdea,
          input.currentScenes,
          input.userFeedback,
          input.duration,
          input.chatHistory || []
        );
        return result;
      }),

    // Create video generation task
    createTask: protectedProcedure
      .input(z.object({
        ideaId: z.string().optional(),
        idea: z.string(),
        scenes: z.array(z.object({
          prompt: z.string(),
          duration: z.number(),
        })),
        duration: z.number(),
        aspectRatio: z.enum(['portrait', 'landscape']).optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        const { createVideoTask } = await import('./services/soraVideoService');
        
        const taskId = await createVideoTask(
          input.scenes,
          input.duration,
          input.aspectRatio || 'portrait'
        );

        const videoTaskId = nanoid();
        await db.createVideoTask({
          id: videoTaskId,
          userId: ctx.user.id,
          ideaId: input.ideaId || null,
          idea: input.idea,
          scenes: JSON.stringify(input.scenes),
          duration: input.duration,
          aspectRatio: input.aspectRatio || 'portrait',
          taskId,
          status: 'generating',
        });

        return { id: videoTaskId, taskId, status: 'generating' };
      }),

    // Query video task status
    queryTask: protectedProcedure
      .input(z.object({ id: z.string() }))
      .query(async ({ input }) => {
        const task = await db.getVideoTask(input.id);
        if (!task || !task.taskId) {
          throw new Error('Task not found');
        }

        const { queryVideoTask } = await import('./services/soraVideoService');
        const result = await queryVideoTask(task.taskId);

        // Update task status
        if (result.status === 'completed' && result.output) {
          await db.updateVideoTask(task.id, {
            status: 'completed',
            videoUrl: result.output.video_url,
          });
        } else if (result.status === 'failed') {
          await db.updateVideoTask(task.id, {
            status: 'failed',
            error: result.error || 'Unknown error',
          });
        }

        return {
          ...task,
          scenes: JSON.parse(task.scenes),
          soraStatus: result.status,
          videoUrl: result.output?.video_url,
          error: result.error,
        };
      }),

    // List user's video tasks
    list: protectedProcedure.query(async ({ ctx }) => {
      const tasks = await db.getUserVideoTasks(ctx.user.id);
      return tasks.map(t => ({
        ...t,
        scenes: JSON.parse(t.scenes),
      }));
    }),

    // Update video task
    update: protectedProcedure
      .input(z.object({
        id: z.string(),
        scenes: z.array(z.object({
          prompt: z.string(),
          duration: z.number(),
        })).optional(),
      }))
      .mutation(async ({ input }) => {
        const updates: any = {};
        if (input.scenes) {
          updates.scenes = JSON.stringify(input.scenes);
        }
        await db.updateVideoTask(input.id, updates);
        return { success: true };
      }),

    // Delete video task
    delete: protectedProcedure
      .input(z.object({ id: z.string() }))
      .mutation(async ({ input }) => {
        const db_instance = await db.getDb();
        if (!db_instance) throw new Error('Database not available');
        const { videoTasks } = await import('../drizzle/schema');
        await db_instance.delete(videoTasks).where(eq(videoTasks.id, input.id));
        return { success: true };
      }),
  }),

  ideas: router({
    getUserIdeas: protectedProcedure.query(async ({ ctx }) => {
      const ideas = await db.getUserContentIdeas(ctx.user.id);
      return ideas.map(i => ({
        ...i,
        tags: i.tags ? JSON.parse(i.tags) : [],
      }));
    }),
    list: protectedProcedure.query(async ({ ctx }) => {
      return db.getUserContentIdeas(ctx.user.id);
    }),

    generate: protectedProcedure
      .input(z.object({
        topicId: z.string().optional(),
        topic: z.string(),
        keywords: z.array(z.string()).optional(),
        contentType: z.enum(['long', 'short']),
        useTrends: z.boolean().optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        let trendingVideos: any[] = [];
        
        if (input.useTrends) {
          const videos = await db.getTrendingVideosByType(
            input.contentType === 'short' ? 'yes' : 'no',
            20
          );
          trendingVideos = videos.map(v => ({
            id: v.videoId,
            title: v.title,
            viewCount: v.viewCount,
            likeCount: v.likeCount,
            tags: v.tags ? JSON.parse(v.tags) : [],
          }));
        }

        const generated = await generateContentIdea({
          topic: input.topic,
          keywords: input.keywords,
          contentType: input.contentType,
          trendingVideos,
        });

        const idea = await db.createContentIdea({
          id: nanoid(),
          userId: ctx.user.id,
          topicId: input.topicId || null,
          contentType: input.contentType,
          title: generated.title,
          description: generated.description,
          script: generated.script,
          tags: JSON.stringify(generated.tags),
          thumbnailPrompt: generated.thumbnailPrompt,
          trendBasis: trendingVideos.length > 0 ? JSON.stringify(trendingVideos.map(v => v.id)) : null,
          score: '0',
        });

        return { ...idea, generated };
      }),

    updateStatus: protectedProcedure
      .input(z.object({
        id: z.string(),
        status: z.enum(['draft', 'approved', 'used']),
      }))
      .mutation(async ({ input }) => {
        await db.updateContentIdeaStatus(input.id, input.status);
        return { success: true };
      }),

    delete: protectedProcedure
      .input(z.object({ id: z.string() }))
      .mutation(async ({ input }) => {
        await db.deleteContentIdea(input.id);
        return { success: true };
      }),

    generateThumbnail: protectedProcedure
      .input(z.object({ id: z.string() }))
      .mutation(async ({ ctx, input }) => {
        const ideas = await db.getUserContentIdeas(ctx.user.id);
        const idea = ideas.find(i => i.id === input.id);
        
        if (!idea || !idea.thumbnailPrompt) {
          throw new Error('Idea or thumbnail prompt not found');
        }

        // Generate thumbnail using built-in image generation
        const { generateImage } = await import('./_core/imageGeneration');
        const result = await generateImage({
          prompt: idea.thumbnailPrompt,
        });

        // Update idea with generated thumbnail URL
        const db_instance = await db.getDb();
        if (db_instance) {
          await db_instance.update(contentIdeas)
            .set({ thumbnailUrl: result.url })
            .where(eq(contentIdeas.id, idea.id));
        }

        return { url: result.url, prompt: idea.thumbnailPrompt };
      }),
  }),
});

function isYouTubeShort(duration: string): boolean {
  const match = duration.match(/PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/);
  if (!match) return false;
  const hours = parseInt(match[1] || '0');
  const minutes = parseInt(match[2] || '0');
  const seconds = parseInt(match[3] || '0');
  const totalSeconds = hours * 3600 + minutes * 60 + seconds;
  return totalSeconds <= 60;
}

export type AppRouter = typeof appRouter;


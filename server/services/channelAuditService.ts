import { invokeLLM } from '../_core/llm';

export interface ChannelAuditResult {
  overallScore: number;
  seoScore: number;
  engagementScore: number;
  contentQualityScore: number;
  recommendations: string[];
  strengths: string[];
  weaknesses: string[];
  analyzedVideos?: Array<{
    videoId: string;
    title: string;
    viewCount: string;
    likeCount: string;
    commentCount: string;
  }>;
  channelTitle?: string;
}

export interface VideoData {
  videoId: string;
  title: string;
  description: string;
  viewCount: string;
  likeCount: string;
  commentCount: string;
  publishedAt: string;
  tags: string[];
  duration: string;
}

export async function performChannelAudit(channelData: {
  channelTitle: string;
  channelDescription: string;
  subscriberCount: string;
  videoCount: string;
  viewCount: string;
  recentVideos: Array<{
    title: string;
    viewCount: string;
    likeCount: string;
    commentCount: string;
    tags: string[];
  }>;
}): Promise<ChannelAuditResult> {
  // Calculate basic metrics
  const avgViews = channelData.recentVideos.reduce((sum, v) => 
    sum + parseInt(v.viewCount || '0'), 0) / channelData.recentVideos.length;
  
  const avgEngagement = channelData.recentVideos.reduce((sum, v) => {
    const views = parseInt(v.viewCount || '0');
    const likes = parseInt(v.likeCount || '0');
    const comments = parseInt(v.commentCount || '0');
    return sum + (views > 0 ? ((likes + comments) / views) * 100 : 0);
  }, 0) / channelData.recentVideos.length;

  // Collect all tags
  const allTags = channelData.recentVideos.flatMap(v => v.tags);
  const uniqueTags = Array.from(new Set(allTags));

  // Use LLM for deep analysis
  const prompt = `Проанализируй YouTube канал и дай детальный аудит:

Название канала: ${channelData.channelTitle}
Описание: ${channelData.channelDescription}
Подписчики: ${channelData.subscriberCount}
Всего видео: ${channelData.videoCount}
Всего просмотров: ${channelData.viewCount}

Средние просмотры на видео: ${Math.round(avgViews)}
Средняя вовлеченность: ${avgEngagement.toFixed(2)}%

Последние видео:
${channelData.recentVideos.slice(0, 10).map(v => 
  `- "${v.title}" (${v.viewCount} просмотров, ${v.likeCount} лайков)`
).join('\n')}

Используемые теги: ${uniqueTags.slice(0, 20).join(', ')}

Оцени канал по шкале от 0 до 100 в следующих категориях:
1. SEO оптимизация (теги, заголовки, описания)
2. Вовлеченность аудитории
3. Качество контента

Дай конкретные рекомендации по улучшению, сильные стороны и слабости канала.`;

  const response = await invokeLLM({
    messages: [
      { role: 'system', content: 'Ты эксперт по YouTube аналитике. Анализируй каналы объективно и давай конкретные, действенные рекомендации.' },
      { role: 'user', content: prompt }
    ],
    response_format: {
      type: 'json_schema',
      json_schema: {
        name: 'channel_audit',
        strict: true,
        schema: {
          type: 'object',
          properties: {
            seoScore: { type: 'number', description: 'SEO score from 0 to 100' },
            engagementScore: { type: 'number', description: 'Engagement score from 0 to 100' },
            contentQualityScore: { type: 'number', description: 'Content quality score from 0 to 100' },
            recommendations: {
              type: 'array',
              items: { type: 'string' },
              description: 'List of specific recommendations'
            },
            strengths: {
              type: 'array',
              items: { type: 'string' },
              description: 'List of channel strengths'
            },
            weaknesses: {
              type: 'array',
              items: { type: 'string' },
              description: 'List of channel weaknesses'
            }
          },
          required: ['seoScore', 'engagementScore', 'contentQualityScore', 'recommendations', 'strengths', 'weaknesses'],
          additionalProperties: false
        }
      }
    }
  });

  const content = response.choices[0].message.content;
  const result = JSON.parse(typeof content === 'string' ? content : '{}');
  
  const overallScore = Math.round(
    (result.seoScore + result.engagementScore + result.contentQualityScore) / 3
  );

  return {
    overallScore,
    seoScore: result.seoScore,
    engagementScore: result.engagementScore,
    contentQualityScore: result.contentQualityScore,
    recommendations: result.recommendations,
    strengths: result.strengths,
    weaknesses: result.weaknesses,
    channelTitle: channelData.channelTitle
  };
}

/**
 * Perform audit with real data from YouTube API
 */
export async function performChannelAuditWithRealData(
  accessToken: string,
  channelId: string
): Promise<ChannelAuditResult> {
  // Get channel info
  const channelUrl = new URL('https://www.googleapis.com/youtube/v3/channels');
  channelUrl.searchParams.set('part', 'snippet,statistics,brandingSettings');
  channelUrl.searchParams.set('id', channelId);

  const channelResponse = await fetch(channelUrl.toString(), {
    headers: { Authorization: `Bearer ${accessToken}` },
  });

  if (!channelResponse.ok) {
    throw new Error('Failed to fetch channel data');
  }

  const channelData = await channelResponse.json();
  const channel = channelData.items?.[0];

  if (!channel) {
    throw new Error('Channel not found');
  }

  // Get channel's recent videos
  const searchUrl = new URL('https://www.googleapis.com/youtube/v3/search');
  searchUrl.searchParams.set('part', 'id');
  searchUrl.searchParams.set('channelId', channelId);
  searchUrl.searchParams.set('order', 'date');
  searchUrl.searchParams.set('type', 'video');
  searchUrl.searchParams.set('maxResults', '20');

  const searchResponse = await fetch(searchUrl.toString(), {
    headers: { Authorization: `Bearer ${accessToken}` },
  });

  if (!searchResponse.ok) {
    throw new Error('Failed to fetch channel videos');
  }

  const searchData = await searchResponse.json();
  const videoIds = searchData.items?.map((item: any) => item.id.videoId).filter(Boolean) || [];

  // Get video details
  let videos: VideoData[] = [];
  if (videoIds.length > 0) {
    const videosUrl = new URL('https://www.googleapis.com/youtube/v3/videos');
    videosUrl.searchParams.set('part', 'snippet,statistics,contentDetails');
    videosUrl.searchParams.set('id', videoIds.join(','));

    const videosResponse = await fetch(videosUrl.toString(), {
      headers: { Authorization: `Bearer ${accessToken}` },
    });

    if (videosResponse.ok) {
      const videosData = await videosResponse.json();
      videos = videosData.items?.map((item: any) => ({
        videoId: item.id,
        title: item.snippet?.title || '',
        description: item.snippet?.description || '',
        viewCount: item.statistics?.viewCount || '0',
        likeCount: item.statistics?.likeCount || '0',
        commentCount: item.statistics?.commentCount || '0',
        publishedAt: item.snippet?.publishedAt || '',
        tags: item.snippet?.tags || [],
        duration: item.contentDetails?.duration || '',
      })) || [];
    }
  }

  // Calculate metrics
  const avgViews = videos.reduce((sum, v) => sum + parseInt(v.viewCount), 0) / (videos.length || 1);
  const avgEngagement = videos.reduce((sum, v) => {
    const views = parseInt(v.viewCount);
    const likes = parseInt(v.likeCount);
    const comments = parseInt(v.commentCount);
    return sum + (views > 0 ? ((likes + comments) / views) * 100 : 0);
  }, 0) / (videos.length || 1);

  // Collect all tags
  const allTags = videos.flatMap(v => v.tags);
  const uniqueTags = Array.from(new Set(allTags));

  // Prepare detailed video analysis for LLM
  const videoAnalysis = videos.slice(0, 10).map(v => {
    const views = parseInt(v.viewCount);
    const likes = parseInt(v.likeCount);
    const comments = parseInt(v.commentCount);
    const engagement = views > 0 ? ((likes + comments) / views * 100).toFixed(2) : '0';
    return `- "${v.title}"
  Просмотры: ${views.toLocaleString()}, Лайки: ${likes.toLocaleString()}, Комментарии: ${comments.toLocaleString()}
  Вовлеченность: ${engagement}%
  Теги: ${v.tags.slice(0, 5).join(', ')}`;
  }).join('\n\n');

  // Use LLM for deep analysis with REAL data
  const prompt = `Проанализируй YouTube канал на основе РЕАЛЬНЫХ данных и дай КОНКРЕТНЫЕ рекомендации:

ИНФОРМАЦИЯ О КАНАЛЕ:
Название: ${channel.snippet?.title}
Описание: ${channel.snippet?.description}
Подписчики: ${parseInt(channel.statistics?.subscriberCount || '0').toLocaleString()}
Всего видео: ${channel.statistics?.videoCount}
Всего просмотров: ${parseInt(channel.statistics?.viewCount || '0').toLocaleString()}

МЕТРИКИ:
Средние просмотры на видео: ${Math.round(avgViews).toLocaleString()}
Средняя вовлеченность: ${avgEngagement.toFixed(2)}%
Уникальных тегов: ${uniqueTags.length}

ДЕТАЛЬНЫЙ АНАЛИЗ ПОСЛЕДНИХ ВИДЕО:
${videoAnalysis}

ЗАДАЧА:
1. Оцени канал объективно по шкале 0-100 в категориях: SEO, вовлеченность, качество контента
2. Дай КОНКРЕТНЫЕ рекомендации с примерами:
   - Какие видео работают лучше и почему
   - Какие видео работают хуже и что исправить
   - Конкретные теги/заголовки для улучшения SEO
   - Конкретные действия для повышения вовлеченности
3. Укажи сильные стороны канала с примерами конкретных видео
4. Укажи слабые стороны с примерами и способами исправления

ВАЖНО: Все рекомендации должны быть основаны на реальных данных видео, указывай конкретные названия видео в примерах.`;

  const response = await invokeLLM({
    messages: [
      { 
        role: 'system', 
        content: 'Ты эксперт YouTube-аналитик. Анализируй каналы на основе реальных данных и давай конкретные, действенные рекомендации с примерами конкретных видео. Избегай общих фраз.' 
      },
      { role: 'user', content: prompt }
    ],
    response_format: {
      type: 'json_schema',
      json_schema: {
        name: 'channel_audit',
        strict: true,
        schema: {
          type: 'object',
          properties: {
            seoScore: { type: 'number', description: 'SEO score from 0 to 100' },
            engagementScore: { type: 'number', description: 'Engagement score from 0 to 100' },
            contentQualityScore: { type: 'number', description: 'Content quality score from 0 to 100' },
            recommendations: {
              type: 'array',
              items: { type: 'string' },
              description: 'List of specific, actionable recommendations with examples of real videos'
            },
            strengths: {
              type: 'array',
              items: { type: 'string' },
              description: 'List of channel strengths with examples of specific videos'
            },
            weaknesses: {
              type: 'array',
              items: { type: 'string' },
              description: 'List of channel weaknesses with examples and solutions'
            }
          },
          required: ['seoScore', 'engagementScore', 'contentQualityScore', 'recommendations', 'strengths', 'weaknesses'],
          additionalProperties: false
        }
      }
    }
  });

  const content = response.choices[0].message.content;
  const result = JSON.parse(typeof content === 'string' ? content : '{}');
  
  const overallScore = Math.round(
    (result.seoScore + result.engagementScore + result.contentQualityScore) / 3
  );

  return {
    overallScore,
    seoScore: result.seoScore,
    engagementScore: result.engagementScore,
    contentQualityScore: result.contentQualityScore,
    recommendations: result.recommendations,
    strengths: result.strengths,
    weaknesses: result.weaknesses,
    analyzedVideos: videos.slice(0, 10).map(v => ({
      videoId: v.videoId,
      title: v.title,
      viewCount: v.viewCount,
      likeCount: v.likeCount,
      commentCount: v.commentCount,
    })),
    channelTitle: channel.snippet?.title
  };
}

/**
 * Extract channel ID from various YouTube URL formats
 */
export function extractChannelId(url: string): string | null {
  // Handle @username format
  const usernameMatch = url.match(/@([a-zA-Z0-9_-]+)/);
  if (usernameMatch) {
    return `@${usernameMatch[1]}`;
  }

  // Handle /c/ format
  const customMatch = url.match(/\/c\/([a-zA-Z0-9_-]+)/);
  if (customMatch) {
    return customMatch[1];
  }

  // Handle /channel/ format
  const channelMatch = url.match(/\/channel\/([a-zA-Z0-9_-]+)/);
  if (channelMatch) {
    return channelMatch[1];
  }

  // Handle /user/ format
  const userMatch = url.match(/\/user\/([a-zA-Z0-9_-]+)/);
  if (userMatch) {
    return userMatch[1];
  }

  return null;
}

/**
 * Get channel ID by handle or username
 */
export async function getChannelIdByHandle(
  accessToken: string,
  handle: string
): Promise<string> {
  // If it's already a channel ID (starts with UC), return it
  if (handle.startsWith('UC') && handle.length === 24) {
    return handle;
  }

  // Try to search for the channel
  const searchUrl = new URL('https://www.googleapis.com/youtube/v3/search');
  searchUrl.searchParams.set('part', 'snippet');
  searchUrl.searchParams.set('q', handle);
  searchUrl.searchParams.set('type', 'channel');
  searchUrl.searchParams.set('maxResults', '1');

  const response = await fetch(searchUrl.toString(), {
    headers: { Authorization: `Bearer ${accessToken}` },
  });

  if (!response.ok) {
    throw new Error('Failed to find channel');
  }

  const data = await response.json();
  const channelId = data.items?.[0]?.id?.channelId;

  if (!channelId) {
    throw new Error('Channel not found');
  }

  return channelId;
}


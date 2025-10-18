/**
 * YouTube API Service
 * Handles interaction with YouTube Data API v3
 */

export interface YouTubeVideo {
  id: string;
  title: string;
  channelTitle: string;
  viewCount: string;
  likeCount: string;
  commentCount: string;
  publishedAt: string;
  thumbnailUrl: string;
  category: string;
  tags: string[];
  duration: string;
  isShort: boolean;
}

export interface YouTubeSearchParams {
  query?: string;
  maxResults?: number;
  order?: 'date' | 'rating' | 'relevance' | 'viewCount';
  publishedAfter?: string;
  videoDuration?: 'short' | 'medium' | 'long' | 'any';
}

/**
 * Search for trending videos on YouTube
 */
export async function searchTrendingVideos(
  apiKey: string,
  params: YouTubeSearchParams = {}
): Promise<YouTubeVideo[]> {
  const {
    query = '',
    maxResults = 50,
    order = 'viewCount',
    publishedAfter,
    videoDuration = 'any'
  } = params;

  try {
    // Search for videos
    const searchUrl = new URL('https://www.googleapis.com/youtube/v3/search');
    searchUrl.searchParams.set('part', 'snippet');
    searchUrl.searchParams.set('type', 'video');
    searchUrl.searchParams.set('maxResults', String(maxResults));
    searchUrl.searchParams.set('order', order);
    searchUrl.searchParams.set('key', apiKey);
    
    if (query) {
      searchUrl.searchParams.set('q', query);
    }
    
    if (publishedAfter) {
      searchUrl.searchParams.set('publishedAfter', publishedAfter);
    }
    
    if (videoDuration !== 'any') {
      searchUrl.searchParams.set('videoDuration', videoDuration);
    }

    const searchResponse = await fetch(searchUrl.toString());
    if (!searchResponse.ok) {
      throw new Error(`YouTube API error: ${searchResponse.statusText}`);
    }

    const searchData = await searchResponse.json();
    const videoIds = searchData.items?.map((item: any) => item.id.videoId).filter(Boolean) || [];

    if (videoIds.length === 0) {
      return [];
    }

    // Get detailed video statistics
    const videosUrl = new URL('https://www.googleapis.com/youtube/v3/videos');
    videosUrl.searchParams.set('part', 'snippet,statistics,contentDetails');
    videosUrl.searchParams.set('id', videoIds.join(','));
    videosUrl.searchParams.set('key', apiKey);

    const videosResponse = await fetch(videosUrl.toString());
    if (!videosResponse.ok) {
      throw new Error(`YouTube API error: ${videosResponse.statusText}`);
    }

    const videosData = await videosResponse.json();

    return videosData.items?.map((item: any) => {
      const duration = item.contentDetails?.duration || 'PT0S';
      const isShort = isYouTubeShort(duration);

      return {
        id: item.id,
        title: item.snippet?.title || '',
        channelTitle: item.snippet?.channelTitle || '',
        viewCount: item.statistics?.viewCount || '0',
        likeCount: item.statistics?.likeCount || '0',
        commentCount: item.statistics?.commentCount || '0',
        publishedAt: item.snippet?.publishedAt || new Date().toISOString(),
        thumbnailUrl: item.snippet?.thumbnails?.high?.url || item.snippet?.thumbnails?.default?.url || '',
        category: item.snippet?.categoryId || '',
        tags: item.snippet?.tags || [],
        duration,
        isShort,
      };
    }) || [];
  } catch (error) {
    console.error('Error fetching YouTube videos:', error);
    throw error;
  }
}

/**
 * Get trending videos by region
 */
export async function getTrendingByRegion(
  apiKey: string,
  regionCode: string = 'US',
  maxResults: number = 50
): Promise<YouTubeVideo[]> {
  try {
    const url = new URL('https://www.googleapis.com/youtube/v3/videos');
    url.searchParams.set('part', 'snippet,statistics,contentDetails');
    url.searchParams.set('chart', 'mostPopular');
    url.searchParams.set('regionCode', regionCode);
    url.searchParams.set('maxResults', String(maxResults));
    url.searchParams.set('key', apiKey);

    const response = await fetch(url.toString());
    if (!response.ok) {
      throw new Error(`YouTube API error: ${response.statusText}`);
    }

    const data = await response.json();

    return data.items?.map((item: any) => {
      const duration = item.contentDetails?.duration || 'PT0S';
      const isShort = isYouTubeShort(duration);

      return {
        id: item.id,
        title: item.snippet?.title || '',
        channelTitle: item.snippet?.channelTitle || '',
        viewCount: item.statistics?.viewCount || '0',
        likeCount: item.statistics?.likeCount || '0',
        commentCount: item.statistics?.commentCount || '0',
        publishedAt: item.snippet?.publishedAt || new Date().toISOString(),
        thumbnailUrl: item.snippet?.thumbnails?.high?.url || item.snippet?.thumbnails?.default?.url || '',
        category: item.snippet?.categoryId || '',
        tags: item.snippet?.tags || [],
        duration,
        isShort,
      };
    }) || [];
  } catch (error) {
    console.error('Error fetching trending videos:', error);
    throw error;
  }
}

/**
 * Check if a video is a YouTube Short based on duration
 * Shorts are typically under 60 seconds
 */
function isYouTubeShort(duration: string): boolean {
  // Parse ISO 8601 duration format (e.g., PT1M30S = 1 minute 30 seconds)
  const match = duration.match(/PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/);
  if (!match) return false;

  const hours = parseInt(match[1] || '0');
  const minutes = parseInt(match[2] || '0');
  const seconds = parseInt(match[3] || '0');

  const totalSeconds = hours * 3600 + minutes * 60 + seconds;
  return totalSeconds <= 60;
}

/**
 * Calculate trend score based on engagement metrics
 */
export function calculateTrendScore(video: YouTubeVideo): number {
  const views = parseInt(video.viewCount) || 0;
  const likes = parseInt(video.likeCount) || 0;
  const comments = parseInt(video.commentCount) || 0;

  // Engagement rate
  const engagementRate = views > 0 ? (likes + comments) / views : 0;

  // Recency factor (newer videos get higher scores)
  const publishedDate = new Date(video.publishedAt);
  const now = new Date();
  const daysSincePublished = (now.getTime() - publishedDate.getTime()) / (1000 * 60 * 60 * 24);
  const recencyFactor = Math.max(0, 1 - daysSincePublished / 30); // Decay over 30 days

  // Combined score
  const score = (views * 0.5 + likes * 10 + comments * 20) * engagementRate * recencyFactor;

  return Math.round(score);
}


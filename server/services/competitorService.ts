import { google } from 'googleapis';

const youtube = google.youtube('v3');

export interface CompetitorAnalysis {
  channelId: string;
  channelTitle: string;
  channelDescription: string;
  thumbnailUrl: string;
  subscriberCount: string;
  videoCount: string;
  viewCount: string;
  recentVideos: Array<{
    videoId: string;
    title: string;
    viewCount: string;
    likeCount: string;
    commentCount: string;
    publishedAt: Date;
    thumbnailUrl: string;
    tags: string[];
    duration: string;
  }>;
  avgViewsPerVideo: number;
  avgEngagementRate: number;
  topPerformingTags: string[];
}

export async function analyzeCompetitorChannel(
  channelId: string,
  accessToken: string
): Promise<CompetitorAnalysis> {
  const auth = new google.auth.OAuth2();
  auth.setCredentials({ access_token: accessToken });

  // Get channel details
  const channelResponse = await youtube.channels.list({
    auth,
    part: ['snippet', 'statistics', 'contentDetails'],
    id: [channelId],
  });

  const channel = channelResponse.data.items?.[0];
  if (!channel) {
    throw new Error('Channel not found');
  }

  const channelStats = channel.statistics!;
  const channelSnippet = channel.snippet!;

  // Get recent videos
  const uploadsPlaylistId = channel.contentDetails?.relatedPlaylists?.uploads;
  if (!uploadsPlaylistId) {
    throw new Error('Could not find uploads playlist');
  }

  const playlistResponse = await youtube.playlistItems.list({
    auth,
    part: ['snippet', 'contentDetails'],
    playlistId: uploadsPlaylistId,
    maxResults: 20,
  });

  const videoIds = playlistResponse.data.items?.map((item: any) => item.contentDetails?.videoId).filter(Boolean) || [];

  // Get video details
  const videosResponse = await youtube.videos.list({
    auth,
    part: ['snippet', 'statistics', 'contentDetails'],
    id: videoIds as string[],
  });

  const videos = videosResponse.data.items || [];

  const recentVideos = videos.map((video: any) => ({
    videoId: video.id!,
    title: video.snippet?.title || '',
    viewCount: video.statistics?.viewCount || '0',
    likeCount: video.statistics?.likeCount || '0',
    commentCount: video.statistics?.commentCount || '0',
    publishedAt: new Date(video.snippet?.publishedAt || Date.now()),
    thumbnailUrl: video.snippet?.thumbnails?.high?.url || '',
    tags: video.snippet?.tags || [],
    duration: video.contentDetails?.duration || '',
  }));

  // Calculate analytics
  const totalViews = recentVideos.reduce((sum: number, v: any) => sum + parseInt(v.viewCount || '0'), 0);
  const avgViewsPerVideo = totalViews / recentVideos.length;

  const totalEngagement = recentVideos.reduce((sum: number, v: any) => {
    const views = parseInt(v.viewCount || '0');
    const likes = parseInt(v.likeCount || '0');
    const comments = parseInt(v.commentCount || '0');
    return sum + (views > 0 ? ((likes + comments) / views) * 100 : 0);
  }, 0);
  const avgEngagementRate = totalEngagement / recentVideos.length;

  // Find top performing tags
  const tagCounts: Record<string, number> = {};
  recentVideos.forEach((video: any) => {
    video.tags.forEach((tag: string) => {
      tagCounts[tag] = (tagCounts[tag] || 0) + 1;
    });
  });
  const topPerformingTags = Object.entries(tagCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10)
    .map(([tag]) => tag);

  return {
    channelId,
    channelTitle: channelSnippet.title || '',
    channelDescription: channelSnippet.description || '',
    thumbnailUrl: channelSnippet.thumbnails?.high?.url || '',
    subscriberCount: channelStats.subscriberCount || '0',
    videoCount: channelStats.videoCount || '0',
    viewCount: channelStats.viewCount || '0',
    recentVideos,
    avgViewsPerVideo,
    avgEngagementRate,
    topPerformingTags,
  };
}


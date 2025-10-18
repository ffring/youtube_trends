/**
 * YouTube OAuth Service
 * Handles Google OAuth flow for YouTube API access
 */

export interface YouTubeOAuthConfig {
  clientId: string;
  clientSecret: string;
  redirectUri: string;
}

export interface YouTubeTokens {
  accessToken: string;
  refreshToken: string;
  expiresAt: Date;
}

export interface YouTubeChannelInfo {
  channelId: string;
  channelTitle: string;
  channelDescription: string;
  thumbnailUrl: string;
  subscriberCount: string;
  videoCount: string;
  viewCount: string;
}

/**
 * Generate OAuth authorization URL
 */
export function getAuthorizationUrl(config: YouTubeOAuthConfig, state: string): string {
  const params = new URLSearchParams({
    client_id: config.clientId,
    redirect_uri: config.redirectUri,
    response_type: 'code',
    scope: [
      'https://www.googleapis.com/auth/youtube.readonly',
      'https://www.googleapis.com/auth/youtube.force-ssl',
      'https://www.googleapis.com/auth/userinfo.profile',
    ].join(' '),
    access_type: 'offline',
    prompt: 'consent',
    state,
  });

  return `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`;
}

/**
 * Exchange authorization code for tokens
 */
export async function exchangeCodeForTokens(
  config: YouTubeOAuthConfig,
  code: string
): Promise<YouTubeTokens> {
  try {
    const response = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        code,
        client_id: config.clientId,
        client_secret: config.clientSecret,
        redirect_uri: config.redirectUri,
        grant_type: 'authorization_code',
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Failed to exchange code: ${error}`);
    }

    const data = await response.json();

    return {
      accessToken: data.access_token,
      refreshToken: data.refresh_token,
      expiresAt: new Date(Date.now() + data.expires_in * 1000),
    };
  } catch (error) {
    console.error('Error exchanging code for tokens:', error);
    throw error;
  }
}

/**
 * Refresh access token
 */
export async function refreshAccessToken(
  config: YouTubeOAuthConfig,
  refreshToken: string
): Promise<YouTubeTokens> {
  try {
    const response = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        refresh_token: refreshToken,
        client_id: config.clientId,
        client_secret: config.clientSecret,
        grant_type: 'refresh_token',
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Failed to refresh token: ${error}`);
    }

    const data = await response.json();

    return {
      accessToken: data.access_token,
      refreshToken: refreshToken, // Keep the same refresh token
      expiresAt: new Date(Date.now() + data.expires_in * 1000),
    };
  } catch (error) {
    console.error('Error refreshing access token:', error);
    throw error;
  }
}

/**
 * Get user's YouTube channel information
 */
export async function getChannelInfo(accessToken: string): Promise<YouTubeChannelInfo> {
  try {
    const response = await fetch(
      'https://www.googleapis.com/youtube/v3/channels?part=snippet,statistics&mine=true',
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      }
    );

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Failed to get channel info: ${error}`);
    }

    const data = await response.json();

    if (!data.items || data.items.length === 0) {
      throw new Error('No YouTube channel found for this account');
    }

    const channel = data.items[0];

    return {
      channelId: channel.id,
      channelTitle: channel.snippet?.title || '',
      channelDescription: channel.snippet?.description || '',
      thumbnailUrl: channel.snippet?.thumbnails?.high?.url || channel.snippet?.thumbnails?.default?.url || '',
      subscriberCount: channel.statistics?.subscriberCount || '0',
      videoCount: channel.statistics?.videoCount || '0',
      viewCount: channel.statistics?.viewCount || '0',
    };
  } catch (error) {
    console.error('Error getting channel info:', error);
    throw error;
  }
}

/**
 * Search trending videos using authenticated API
 */
export async function searchVideosAuthenticated(
  accessToken: string,
  params: {
    query?: string;
    maxResults?: number;
    order?: 'date' | 'rating' | 'relevance' | 'viewCount';
    publishedAfter?: string;
  }
): Promise<any[]> {
  const {
    query = '',
    maxResults = 50,
    order = 'viewCount',
    publishedAfter,
  } = params;

  try {
    const searchUrl = new URL('https://www.googleapis.com/youtube/v3/search');
    searchUrl.searchParams.set('part', 'snippet');
    searchUrl.searchParams.set('type', 'video');
    searchUrl.searchParams.set('maxResults', String(maxResults));
    searchUrl.searchParams.set('order', order);

    if (query) {
      searchUrl.searchParams.set('q', query);
    }

    if (publishedAfter) {
      searchUrl.searchParams.set('publishedAfter', publishedAfter);
    }

    const response = await fetch(searchUrl.toString(), {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Failed to search videos: ${error}`);
    }

    const data = await response.json();
    return data.items || [];
  } catch (error) {
    console.error('Error searching videos:', error);
    throw error;
  }
}

/**
 * Get trending videos by region using authenticated API
 */
export async function getTrendingVideosAuthenticated(
  accessToken: string,
  regionCode: string = 'US',
  maxResults: number = 50
): Promise<any[]> {
  try {
    const url = new URL('https://www.googleapis.com/youtube/v3/videos');
    url.searchParams.set('part', 'snippet,statistics,contentDetails');
    url.searchParams.set('chart', 'mostPopular');
    url.searchParams.set('regionCode', regionCode);
    url.searchParams.set('maxResults', String(maxResults));

    const response = await fetch(url.toString(), {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Failed to get trending videos: ${error}`);
    }

    const data = await response.json();
    return data.items || [];
  } catch (error) {
    console.error('Error getting trending videos:', error);
    throw error;
  }
}


/**
 * Search videos by keywords using authenticated API
 */
export async function searchVideosByKeywords(
  accessToken: string,
  keywords: string,
  regionCode: string = 'US',
  maxResults: number = 50
): Promise<any[]> {
  try {
    // First, search for videos
    const searchUrl = new URL('https://www.googleapis.com/youtube/v3/search');
    searchUrl.searchParams.set('part', 'snippet');
    searchUrl.searchParams.set('type', 'video');
    searchUrl.searchParams.set('q', keywords);
    searchUrl.searchParams.set('regionCode', regionCode);
    searchUrl.searchParams.set('maxResults', String(maxResults));
    searchUrl.searchParams.set('order', 'viewCount'); // Sort by view count for trending results
    searchUrl.searchParams.set('relevanceLanguage', regionCode === 'RU' ? 'ru' : 'en');

    const searchResponse = await fetch(searchUrl.toString(), {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });

    if (!searchResponse.ok) {
      const error = await searchResponse.text();
      throw new Error(`Failed to search videos: ${error}`);
    }

    const searchData = await searchResponse.json();
    const videoIds = searchData.items?.map((item: any) => item.id.videoId).filter(Boolean) || [];

    if (videoIds.length === 0) {
      return [];
    }

    // Get detailed video information
    const videosUrl = new URL('https://www.googleapis.com/youtube/v3/videos');
    videosUrl.searchParams.set('part', 'snippet,statistics,contentDetails');
    videosUrl.searchParams.set('id', videoIds.join(','));

    const videosResponse = await fetch(videosUrl.toString(), {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });

    if (!videosResponse.ok) {
      const error = await videosResponse.text();
      throw new Error(`Failed to get video details: ${error}`);
    }

    const videosData = await videosResponse.json();
    return videosData.items || [];
  } catch (error) {
    console.error('Error searching videos by keywords:', error);
    throw error;
  }
}


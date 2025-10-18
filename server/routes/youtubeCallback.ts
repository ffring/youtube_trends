import { Router } from 'express';
import { nanoid } from 'nanoid';
import { exchangeCodeForTokens, getChannelInfo } from '../services/youtubeOAuthService';
import { saveYouTubeChannel } from '../db';
import { sdk } from '../_core/sdk';

const router = Router();

router.get('/api/youtube/callback', async (req, res) => {
  const { code, state, error } = req.query;

  if (error) {
    return res.redirect(`/?error=${encodeURIComponent(error as string)}`);
  }

  if (!code) {
    return res.redirect('/?error=no_code');
  }

  try {
    // Get user from session using SDK
    const user = await sdk.authenticateRequest(req);
    if (!user) {
      return res.redirect('/?error=not_authenticated');
    }

    // Use PUBLIC_URL from env for production, fallback to request host for dev
    const baseUrl = (process.env.PUBLIC_URL || `${req.protocol}://${req.get('host')}`).replace(/\/$/, '');
    const redirectUri = `${baseUrl}/api/youtube/callback`;

    // Exchange code for tokens
    const tokens = await exchangeCodeForTokens(
      {
        clientId: process.env.GOOGLE_CLIENT_ID!,
        clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
        redirectUri,
      },
      code as string
    );

    // Get channel info
    const channelInfo = await getChannelInfo(tokens.accessToken);

    // Save to database
    await saveYouTubeChannel({
      id: nanoid(),
      userId: user.id,
      channelId: channelInfo.channelId,
      channelTitle: channelInfo.channelTitle,
      channelDescription: channelInfo.channelDescription,
      thumbnailUrl: channelInfo.thumbnailUrl,
      subscriberCount: channelInfo.subscriberCount,
      videoCount: channelInfo.videoCount,
      viewCount: channelInfo.viewCount,
      accessToken: tokens.accessToken,
      refreshToken: tokens.refreshToken,
      tokenExpiresAt: tokens.expiresAt,
    });

    // Redirect to success page
    res.redirect('/?youtube_connected=true');
  } catch (error) {
    console.error('YouTube OAuth callback error:', error);
    res.redirect(`/?error=${encodeURIComponent('oauth_failed')}`);
  }
});

export default router;


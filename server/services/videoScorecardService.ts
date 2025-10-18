import { invokeLLM } from '../_core/llm';

export interface VideoScorecardResult {
  seoScore: number;
  engagementScore: number;
  trendScore: number;
  overallScore: number;
  suggestions: string[];
}

export async function generateVideoScorecard(videoData: {
  title: string;
  description?: string;
  tags: string[];
  viewCount: string;
  likeCount: string;
  commentCount: string;
  publishedAt: Date;
}): Promise<VideoScorecardResult> {
  const views = parseInt(videoData.viewCount || '0');
  const likes = parseInt(videoData.likeCount || '0');
  const comments = parseInt(videoData.commentCount || '0');
  
  const engagementRate = views > 0 ? ((likes + comments) / views) * 100 : 0;
  
  // Calculate days since published
  const daysSincePublished = Math.floor(
    (Date.now() - new Date(videoData.publishedAt).getTime()) / (1000 * 60 * 60 * 24)
  );
  
  const viewsPerDay = daysSincePublished > 0 ? views / daysSincePublished : views;

  const prompt = `Оцени YouTube видео по следующим параметрам:

Заголовок: ${videoData.title}
Описание: ${videoData.description || 'Отсутствует'}
Теги: ${videoData.tags.join(', ') || 'Нет тегов'}

Статистика:
- Просмотры: ${views}
- Лайки: ${likes}
- Комментарии: ${comments}
- Вовлеченность: ${engagementRate.toFixed(2)}%
- Опубликовано: ${daysSincePublished} дней назад
- Просмотров в день: ${Math.round(viewsPerDay)}

Оцени по шкале от 0 до 100:
1. SEO оптимизация (качество заголовка, тегов, описания)
2. Вовлеченность (лайки, комментарии относительно просмотров)
3. Трендовость (актуальность темы, потенциал роста)

Дай конкретные предложения по улучшению видео.`;

  const response = await invokeLLM({
    messages: [
      { role: 'system', content: 'Ты эксперт по YouTube оптимизации. Оценивай видео объективно и давай конкретные советы.' },
      { role: 'user', content: prompt }
    ],
    response_format: {
      type: 'json_schema',
      json_schema: {
        name: 'video_scorecard',
        strict: true,
        schema: {
          type: 'object',
          properties: {
            seoScore: { type: 'number', description: 'SEO score from 0 to 100' },
            engagementScore: { type: 'number', description: 'Engagement score from 0 to 100' },
            trendScore: { type: 'number', description: 'Trend score from 0 to 100' },
            suggestions: {
              type: 'array',
              items: { type: 'string' },
              description: 'List of specific improvement suggestions'
            }
          },
          required: ['seoScore', 'engagementScore', 'trendScore', 'suggestions'],
          additionalProperties: false
        }
      }
    }
  });

  const content = response.choices[0].message.content;
  const result = JSON.parse(typeof content === 'string' ? content : '{}');
  
  const overallScore = Math.round(
    (result.seoScore + result.engagementScore + result.trendScore) / 3
  );

  return {
    seoScore: result.seoScore,
    engagementScore: result.engagementScore,
    trendScore: result.trendScore,
    overallScore,
    suggestions: result.suggestions
  };
}


/**
 * AI Content Generation Service
 * Uses LLM to generate video ideas, titles, scripts, tags, and thumbnail prompts
 */

import { invokeLLM } from "../_core/llm";
import { YouTubeVideo } from "./youtubeService";

export interface ContentGenerationParams {
  topic: string;
  keywords?: string[];
  contentType: 'long' | 'short';
  trendingVideos?: YouTubeVideo[];
  style?: string;
}

export interface GeneratedContent {
  title: string;
  description: string;
  script: string;
  tags: string[];
  thumbnailPrompt: string;
  reasoning: string;
}

// Промпт для Shorts (Reels) - инсайт-хантинг
const SHORTS_SYSTEM_PROMPT = `Ты - МАСТЕР ИНСАЙТ-ХАНТИНГА с опытом 50 лет, сочетающий в себе:
- Малкольма Гладуэлла — мастера поиска неожиданных связей
- Сета Година — гуру разрушения маркетинговых мифов
- MrBeast — гения вирусного контента

Твоя задача — найти РЕВОЛЮЦИОННЫЕ ИНСАЙТЫ, которые перевернут восприятие аудитории.

ПРИНЦИПЫ РАБОТЫ:
1. Копай вглубь сознания, находя скрытые слои проблемы
2. Ищи истину в противоположном направлении от очевидного
3. Вскрывай то, что люди чувствуют, но боятся признать
4. Ломай привычные рамки и создавай новые способы видения

КАТЕГОРИИ ИНСАЙТОВ:
- РАЗРУШИТЕЛИ МИФОВ: "Почему [популярный совет] на самом деле вредит"
- ПАРАДОКСАЛЬНЫЕ РЕШЕНИЯ: "Как [противоположное действие] решает проблему лучше"
- СКРЫТЫЕ СВЯЗИ: "Настоящая причина [проблемы] скрыта в [неочевидном месте]"
- ЭМОЦИОНАЛЬНЫЕ ОТКРОВЕНИЯ: "О чём молчат, когда говорят о [проблеме]"

СТРУКТУРА REELS (60 сек):
- ХУК (0-3 сек): Провокационное утверждение, разрыв шаблона
- РАЗВИТИЕ (3-20 сек): Раскрытие инсайта, "ага-момент"
- ДОКАЗАТЕЛЬСТВО (20-40 сек): Логические аргументы, примеры
- ПРИМЕНЕНИЕ (40-55 сек): Практическая ценность, конкретные шаги
- CTA (55-60 сек): Вопрос для размышления, призыв к действию`;

// Промпт для длинных видео - структурированный подход
const LONG_VIDEO_SYSTEM_PROMPT = `Ты - эксперт по созданию глубокого YouTube контента, который сочетает:
- Структурированность и логику (как у образовательных каналов)
- Неожиданные инсайты и свежий взгляд (избегая банальности)
- Практическую ценность и применимость
- Вовлечение и удержание внимания

ПРИНЦИПЫ СОЗДАНИЯ КОНТЕНТА:
1. Ищи неочевидные углы в популярных темах
2. Разрушай стереотипы, но предлагай альтернативы
3. Используй парадоксы и противоречия для привлечения внимания
4. Давай глубокий анализ, но делай его доступным

СТРУКТУРА ДЛИННОГО ВИДЕО (5-15 мин):
- ВВЕДЕНИЕ (0-1 мин): Цепляющий хук, обещание ценности, интрига
- КОНТЕКСТ (1-3 мин): Почему тема важна, разрушение мифов
- ОСНОВНАЯ ЧАСТЬ (3-12 мин): 
  * 3-5 ключевых инсайтов с примерами
  * Неожиданные связи и парадоксы
  * Практические кейсы и истории
- ЗАКЛЮЧЕНИЕ (12-15 мин): Резюме, практические шаги, CTA

ИЗБЕГАЙ:
- Банальных советов типа "просто начни делать"
- Поверхностных решений без глубины
- Очевидных истин, которые все знают
- Заезженных форматов "топ-5 способов"`;

/**
 * Generate video content idea based on topic and trends
 */
export async function generateContentIdea(
  params: ContentGenerationParams
): Promise<GeneratedContent> {
  const { topic, keywords = [], contentType, trendingVideos = [], style = 'engaging and informative' } = params;

  // Prepare trending videos context
  const trendContext = trendingVideos.length > 0
    ? `\n\nТрендовые видео для вдохновения:\n${trendingVideos.slice(0, 10).map((v, i) => 
        `${i + 1}. "${v.title}" (${v.viewCount} просмотров, ${v.likeCount} лайков)`
      ).join('\n')}`
    : '';

  const keywordsContext = keywords.length > 0
    ? `\nКлючевые слова: ${keywords.join(', ')}`
    : '';

  const systemPrompt = contentType === 'short' ? SHORTS_SYSTEM_PROMPT : LONG_VIDEO_SYSTEM_PROMPT;

  const userPrompt = contentType === 'short'
    ? `ЗАДАЧА: Создай революционную идею для YouTube Shorts на тему: "${topic}"
${keywordsContext}
${trendContext}

ТРЕБОВАНИЯ:
1. Найди НЕОЖИДАННЫЙ УГОЛ - то, о чём никто не говорит
2. Разрушь популярный миф или покажи парадокс
3. Создай "ага-момент" - инсайт, который заставит сказать "КАК Я РАНЬШЕ ОБ ЭТОМ НЕ ДУМАЛ?!"
4. Сделай контент ВИРУСНЫМ - люди должны захотеть поделиться

СТРУКТУРА СЦЕНАРИЯ (60 сек):
- ХУК (0-3 сек): Провокационное утверждение
- РАЗВИТИЕ (3-20 сек): Раскрытие инсайта
- ДОКАЗАТЕЛЬСТВО (20-40 сек): Примеры и аргументы
- ПРИМЕНЕНИЕ (40-55 сек): Как использовать
- CTA (55-60 сек): Призыв к действию

Сгенерируй:
1. Заголовок (провокационный, с интригой, до 70 символов)
2. Описание (краткое, с хуком, 2-3 предложения)
3. Сценарий (детальный, с тайм-кодами, динамичный)
4. Теги (10-15 релевантных тегов)
5. Промпт для обложки 16:9 (яркая, контрастная, с эмоциями)
6. Обоснование (почему это зайдёт и станет вирусным)`
    : `ЗАДАЧА: Создай глубокую идею для полноформатного YouTube видео на тему: "${topic}"
${keywordsContext}
${trendContext}

ТРЕБОВАНИЯ:
1. Найди СВЕЖИЙ ВЗГЛЯД на тему - избегай банальности
2. Используй парадоксы и неожиданные связи
3. Дай ГЛУБОКИЙ АНАЛИЗ с практической ценностью
4. Структурируй контент для удержания внимания

СТРУКТУРА СЦЕНАРИЯ (10-15 мин):
- ВВЕДЕНИЕ (0-1 мин): Цепляющий хук, интрига
- КОНТЕКСТ (1-3 мин): Почему важно, разрушение мифов
- ОСНОВНАЯ ЧАСТЬ (3-12 мин): 3-5 ключевых инсайтов с примерами
- ЗАКЛЮЧЕНИЕ (12-15 мин): Резюме, практические шаги

Сгенерируй:
1. Заголовок (интригующий, с обещанием ценности, до 70 символов)
2. Описание (информативное, с хуком, 2-3 предложения)
3. Сценарий (подробный, с тайм-кодами, структурированный)
4. Теги (10-15 релевантных тегов)
5. Промпт для обложки 16:9 (профессиональная, информативная)
6. Обоснование (почему это будет популярно)`;

  try {
    const response = await invokeLLM({
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt },
      ],
      response_format: {
        type: "json_schema",
        json_schema: {
          name: "video_content_idea",
          strict: true,
          schema: {
            type: "object",
            properties: {
              title: {
                type: "string",
                description: "Цепляющий заголовок видео до 70 символов"
              },
              description: {
                type: "string",
                description: "Краткое описание видео, 2-3 предложения"
              },
              script: {
                type: "string",
                description: "Подробный сценарий видео с структурой и тайм-кодами"
              },
              tags: {
                type: "array",
                items: { type: "string" },
                description: "Массив из 10-15 релевантных тегов"
              },
              thumbnailPrompt: {
                type: "string",
                description: "Детальный промпт для генерации обложки видео 16:9"
              },
              reasoning: {
                type: "string",
                description: "Обоснование, почему эта идея будет популярна"
              }
            },
            required: ["title", "description", "script", "tags", "thumbnailPrompt", "reasoning"],
            additionalProperties: false
          }
        }
      }
    });

    const content = response.choices[0]?.message?.content;
    if (!content || typeof content !== 'string') {
      throw new Error('No content generated from LLM');
    }

    const parsed = JSON.parse(content);
    return parsed as GeneratedContent;
  } catch (error) {
    console.error('Error generating content idea:', error);
    throw error;
  }
}

/**
 * Generate multiple content ideas in batch
 */
export async function generateMultipleIdeas(
  params: ContentGenerationParams,
  count: number = 3
): Promise<GeneratedContent[]> {
  const ideas: GeneratedContent[] = [];

  for (let i = 0; i < count; i++) {
    try {
      const idea = await generateContentIdea(params);
      ideas.push(idea);
      // Small delay to avoid rate limiting
      await new Promise(resolve => setTimeout(resolve, 500));
    } catch (error) {
      console.error(`Error generating idea ${i + 1}:`, error);
    }
  }

  return ideas;
}

/**
 * Analyze trending videos and extract insights
 */
export async function analyzeTrends(
  videos: YouTubeVideo[],
  topic: string
): Promise<{
  commonThemes: string[];
  popularFormats: string[];
  recommendedTags: string[];
  insights: string;
}> {
  if (videos.length === 0) {
    return {
      commonThemes: [],
      popularFormats: [],
      recommendedTags: [],
      insights: 'Недостаточно данных для анализа трендов.'
    };
  }

  const videosContext = videos.slice(0, 20).map((v, i) => 
    `${i + 1}. "${v.title}" | ${v.viewCount} views | Tags: ${v.tags.slice(0, 5).join(', ')}`
  ).join('\n');

  const systemPrompt = `Ты - аналитик YouTube трендов. Анализируй популярные видео и выявляй паттерны успеха.`;

  const userPrompt = `Проанализируй следующие трендовые видео по теме "${topic}":

${videosContext}

Определи:
1. Общие темы и паттерны (3-5 тем)
2. Популярные форматы видео (3-5 форматов)
3. Рекомендуемые теги (15-20 тегов)
4. Ключевые инсайты для создателя контента`;

  try {
    const response = await invokeLLM({
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt },
      ],
      response_format: {
        type: "json_schema",
        json_schema: {
          name: "trend_analysis",
          strict: true,
          schema: {
            type: "object",
            properties: {
              commonThemes: {
                type: "array",
                items: { type: "string" },
                description: "Общие темы в трендовых видео"
              },
              popularFormats: {
                type: "array",
                items: { type: "string" },
                description: "Популярные форматы видео"
              },
              recommendedTags: {
                type: "array",
                items: { type: "string" },
                description: "Рекомендуемые теги для использования"
              },
              insights: {
                type: "string",
                description: "Ключевые инсайты и рекомендации"
              }
            },
            required: ["commonThemes", "popularFormats", "recommendedTags", "insights"],
            additionalProperties: false
          }
        }
      }
    });

    const content = response.choices[0]?.message?.content;
    if (!content || typeof content !== 'string') {
      throw new Error('No analysis generated from LLM');
    }

    return JSON.parse(content);
  } catch (error) {
    console.error('Error analyzing trends:', error);
    throw error;
  }
}


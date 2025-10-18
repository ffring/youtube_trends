import { ENV } from '../_core/env';

const SORA_API_URL = 'https://kie.ai/api/v1/jobs';
const SORA_API_KEY = process.env.SORA_API_KEY || '';

interface SoraScene {
  prompt: string;
  duration: number;
}

interface SoraCreateTaskRequest {
  model: string;
  callBackUrl?: string;
  input: {
    shots?: SoraScene[];
    prompt?: string;
    n_frames: string;
    image_urls?: string[];
    aspect_ratio: 'portrait' | 'landscape';
  };
}

interface SoraTaskResponse {
  code: number;
  message: string;
  data: {
    taskId: string;
    status: string;
  };
}

interface SoraQueryResponse {
  code: number;
  message: string;
  data: {
    taskId: string;
    status: string; // 'pending', 'processing', 'completed', 'failed'
    output?: {
      video_url: string;
      duration: number;
    };
    error?: string;
  };
}

export interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
}

// Промпт для генерации вирусных видео
const VIRAL_VIDEO_SYSTEM_PROMPT = `Ты - МАСТЕР ВИРУСНОГО ВИДЕО-КОНТЕНТА, эксперт по созданию Shorts, которые набирают миллионы просмотров.

ПРИНЦИПЫ ВИРУСНОСТИ:
1. МГНОВЕННЫЙ ХУК (первые 0.5 сек) - визуальный шок, неожиданность
2. ЭМОЦИОНАЛЬНЫЙ ТРИГГЕР - удивление, восторг, любопытство, шок
3. ДИНАМИКА И ДВИЖЕНИЕ - постоянная смена кадров, энергия
4. ВИЗУАЛЬНАЯ ЭСТЕТИКА - кинематографичность, профессиональное освещение
5. STORYTELLING - даже за 10-15 секунд должна быть микро-история

ТЕХНИКИ СОЗДАНИЯ ВИРУСНЫХ СЦЕН:

ДЛЯ 10 СЕКУНД:
- 2 сцены максимум (5+5 или 4+6 секунд)
- Сверхбыстрая динамика
- Один мощный визуальный эффект
- Фокус на одном wow-моменте

ДЛЯ 15 СЕКУНД:
- 2-3 сцены (5+5+5 или 6+4+5 секунд)
- Развитие микро-истории
- Нарастание интенсивности
- Кульминация в конце

ВИЗУАЛЬНЫЕ ЭЛЕМЕНТЫ:
- Освещение: cinematic lighting, golden hour, neon glow, dramatic shadows
- Камера: smooth tracking shot, slow-motion, dutch angle, POV shot
- Композиция: rule of thirds, leading lines, symmetry, depth of field
- Цвет: vibrant colors, color grading, contrast, saturation
- Движение: dynamic motion, speed ramping, camera movement, subject action

КАТЕГОРИИ ВИРУСНОГО КОНТЕНТА:
1. ТРАНСФОРМАЦИЯ - до/после, превращение, изменение
2. НЕОЖИДАННОСТЬ - plot twist, сюрприз, обман ожиданий
3. МАСТЕРСТВО - демонстрация навыка, талант, профессионализм
4. КРАСОТА - эстетика, визуальное удовольствие, арт
5. ЭМОЦИИ - радость, восторг, умиление, вдохновение
6. ЮМОР - комедия, абсурд, ирония
7. ЭКСТРИМ - опасность, адреналин, риск

СТРУКТУРА ПРОМПТА:
[Тип кадра] [Объект/Действие] [Освещение] [Настроение] [Камера] [Детали]

ПРИМЕРЫ:
"Close-up shot of hands skillfully folding origami crane, golden hour sunlight streaming through window, warm and peaceful atmosphere, shallow depth of field, smooth slow-motion, paper texture visible"

"Wide cinematic shot of person jumping off cliff into crystal clear turquoise water, drone perspective descending, bright midday sun, exhilarating and free feeling, speed ramp from slow to fast motion"`;

/**
 * Generate viral video prompt from user's idea using LLM
 */
export async function generateVideoPrompt(
  idea: string, 
  duration: number = 15,
  chatHistory: ChatMessage[] = []
): Promise<{ scenes: SoraScene[]; explanation: string }> {
  const { invokeLLM } = await import('../_core/llm');
  
  const durationGuidance = duration === 10 
    ? `ХРОНОМЕТРАЖ: 10 секунд - создай 2 сцены (5+5 или 4+6 сек). Сверхдинамично, один мощный wow-момент.`
    : `ХРОНОМЕТРАЖ: 15 секунд - создай 2-3 сцены (5+5+5 или 6+4+5 сек). Развитие микро-истории с кульминацией.`;

  const messages: ChatMessage[] = [
    { role: 'user' as const, content: `${durationGuidance}

ЗАДАЧА: Создай ВИРУСНЫЙ промпт для Shorts на тему: "${idea}"

ТРЕБОВАНИЯ:
1. Визуальный ШОК с первой секунды
2. Кинематографичность - профессиональное освещение, камера, композиция
3. Эмоциональный триггер - удивление, восторг, любопытство
4. Динамика - постоянное движение, энергия
5. Storytelling - микро-история даже за ${duration} секунд

Каждая сцена должна содержать:
- Тип кадра (close-up, wide shot, POV и т.д.)
- Детальное описание действия
- Освещение (golden hour, neon, dramatic и т.д.)
- Настроение и атмосферу
- Движение камеры (tracking, slow-motion и т.д.)
- Визуальные детали (текстуры, цвета, эффекты)

Используй профессиональную кинематографическую терминологию на английском.` }
  ];

  // Add chat history for refinement
  if (chatHistory.length > 0) {
    messages.push(...chatHistory);
  }

  const response = await invokeLLM({
    messages: [
      { role: 'system', content: VIRAL_VIDEO_SYSTEM_PROMPT },
      ...messages
    ],
    response_format: {
      type: 'json_schema',
      json_schema: {
        name: 'viral_video_scenes',
        strict: true,
        schema: {
          type: 'object',
          properties: {
            scenes: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  prompt: { 
                    type: 'string',
                    description: 'Детальное кинематографическое описание сцены на английском'
                  },
                  duration: { 
                    type: 'number',
                    description: 'Длительность сцены в секундах'
                  }
                },
                required: ['prompt', 'duration'],
                additionalProperties: false
              }
            },
            explanation: {
              type: 'string',
              description: 'Объяснение концепции и почему это будет вирусным'
            }
          },
          required: ['scenes', 'explanation'],
          additionalProperties: false
        }
      }
    }
  });

  const content = response.choices[0].message.content;
  if (!content) {
    throw new Error('Failed to generate video prompt');
  }

  const parsed = JSON.parse(content);
  return parsed;
}

/**
 * Refine video prompt through chat with AI
 */
export async function refineVideoPrompt(
  originalIdea: string,
  currentScenes: SoraScene[],
  userFeedback: string,
  duration: number,
  chatHistory: ChatMessage[] = []
): Promise<{ scenes: SoraScene[]; explanation: string; chatHistory: ChatMessage[] }> {
  const { invokeLLM } = await import('../_core/llm');

  const newChatHistory: ChatMessage[] = [
    ...chatHistory,
    {
      role: 'user',
      content: `Текущие сцены:
${currentScenes.map((s, i) => `Сцена ${i + 1} (${s.duration}с): ${s.prompt}`).join('\n')}

Пожелание по доработке: ${userFeedback}`
    }
  ];

  const response = await invokeLLM({
    messages: [
      { role: 'system', content: VIRAL_VIDEO_SYSTEM_PROMPT },
      { role: 'user', content: `Исходная идея: "${originalIdea}"\nХронометраж: ${duration} секунд` },
      ...newChatHistory
    ],
    response_format: {
      type: 'json_schema',
      json_schema: {
        name: 'refined_video_scenes',
        strict: true,
        schema: {
          type: 'object',
          properties: {
            scenes: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  prompt: { type: 'string' },
                  duration: { type: 'number' }
                },
                required: ['prompt', 'duration'],
                additionalProperties: false
              }
            },
            explanation: {
              type: 'string',
              description: 'Что изменилось и почему'
            }
          },
          required: ['scenes', 'explanation'],
          additionalProperties: false
        }
      }
    }
  });

  const content = response.choices[0].message.content;
  if (!content) {
    throw new Error('Failed to refine video prompt');
  }

  const parsed = JSON.parse(content);
  
  newChatHistory.push({
    role: 'assistant',
    content: `Обновленные сцены:\n${parsed.scenes.map((s: SoraScene, i: number) => 
      `Сцена ${i + 1} (${s.duration}с): ${s.prompt}`
    ).join('\n')}\n\n${parsed.explanation}`
  });

  return {
    scenes: parsed.scenes,
    explanation: parsed.explanation,
    chatHistory: newChatHistory
  };
}

/**
 * Create video generation task using Sora 2 Pro API
 */
export async function createVideoTask(
  scenes: SoraScene[],
  duration: number = 15,
  aspectRatio: 'portrait' | 'landscape' = 'portrait'
): Promise<string> {
  // Check API key
  if (!SORA_API_KEY || SORA_API_KEY === '') {
    throw new Error('SORA_API_KEY не настроен. Добавьте ключ в переменные окружения.');
  }

  const model = 'sora-2-pro-storyboard';
  const nFrames = duration === 10 ? '10' : duration === 25 ? '25' : '15';

  // Validate total duration matches n_frames
  const totalDuration = scenes.reduce((sum, scene) => sum + scene.duration, 0);
  const expectedDuration = parseInt(nFrames);
  if (Math.abs(totalDuration - expectedDuration) > 0.5) {
    throw new Error(`Общая длительность сцен (${totalDuration}с) должна соответствовать длительности видео (${expectedDuration}с)`);
  }

  const requestBody: SoraCreateTaskRequest = {
    model,
    input: {
      shots: scenes,
      n_frames: nFrames,
      aspect_ratio: aspectRatio
    }
  };

  console.log('[Sora API] Creating task...');
  console.log('[Sora API] Model:', model);
  console.log('[Sora API] Duration:', nFrames, 'seconds');
  console.log('[Sora API] Aspect ratio:', aspectRatio);
  console.log('[Sora API] Scenes count:', scenes.length);
  console.log('[Sora API] Request body:', JSON.stringify(requestBody, null, 2));

  try {
    const response = await fetch(`${SORA_API_URL}/createTask`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${SORA_API_KEY}`
      },
      body: JSON.stringify(requestBody)
    });

    console.log('[Sora API] Response status:', response.status, response.statusText);

    if (!response.ok) {
      const errorText = await response.text();
      console.error('[Sora API] Error response:', errorText);
      
      // Try to parse error as JSON
      try {
        const errorJson = JSON.parse(errorText);
        throw new Error(`Sora API ошибка: ${errorJson.message || errorText}`);
      } catch {
        throw new Error(`Sora API ошибка (${response.status}): ${errorText}`);
      }
    }

    const result: SoraTaskResponse = await response.json();
    console.log('[Sora API] Response data:', JSON.stringify(result, null, 2));
    
    if (result.code !== 200) {
      throw new Error(`Sora API ошибка: ${result.message}`);
    }

    console.log('[Sora API] Task created successfully. Task ID:', result.data.taskId);
    return result.data.taskId;
  } catch (error) {
    console.error('[Sora API] Exception:', error);
    if (error instanceof Error) {
      throw error;
    }
    throw new Error('Неизвестная ошибка при создании задачи Sora');
  }
}

/**
 * Query video generation task status
 */
export async function queryVideoTask(taskId: string): Promise<SoraQueryResponse['data']> {
  const response = await fetch(`${SORA_API_URL}/queryTask?taskId=${taskId}`, {
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${SORA_API_KEY}`
    }
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Sora API error: ${response.status} - ${errorText}`);
  }

  const result: SoraQueryResponse = await response.json();
  
  if (result.code !== 200) {
    throw new Error(`Sora API error: ${result.message}`);
  }

  return result.data;
}

/**
 * Generate complete video from idea (full workflow)
 */
export async function generateVideoFromIdea(
  idea: string,
  duration: number = 15,
  aspectRatio: 'portrait' | 'landscape' = 'portrait'
): Promise<{ taskId: string; scenes: SoraScene[]; explanation: string }> {
  // Step 1: Generate prompt from idea
  const { scenes, explanation } = await generateVideoPrompt(idea, duration);
  
  // Step 2: Create video generation task
  const taskId = await createVideoTask(scenes, duration, aspectRatio);
  
  return { taskId, scenes, explanation };
}


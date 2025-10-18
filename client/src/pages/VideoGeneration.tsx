import Header from "@/components/Header";
import { useState } from 'react';
import { trpc } from '@/lib/trpc';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Loader2, Video, Sparkles, MessageSquare, Send, Check, Download, RefreshCw, Wand2 } from 'lucide-react';
import { toast } from 'sonner';
import { ScrollArea } from '@/components/ui/scroll-area';

interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
}

export default function VideoGeneration() {
  const [idea, setIdea] = useState('');
  const [duration, setDuration] = useState<10 | 15>(15);
  const [aspectRatio, setAspectRatio] = useState<'portrait' | 'landscape'>('portrait');
  const [scenes, setScenes] = useState<Array<{ prompt: string; duration: number }>>([]);
  const [explanation, setExplanation] = useState('');
  const [chatHistory, setChatHistory] = useState<ChatMessage[]>([]);
  const [chatInput, setChatInput] = useState('');
  const [showChat, setShowChat] = useState(false);
  const [generatingTask, setGeneratingTask] = useState<string | null>(null);

  const generatePromptMutation = trpc.video.generatePrompt.useMutation();
  const refinePromptMutation = trpc.video.refinePrompt.useMutation();
  const createTaskMutation = trpc.video.createTask.useMutation();
  const { data: videoTasks, refetch: refetchTasks } = trpc.video.list.useQuery();
  const { data: taskStatus, refetch: refetchStatus } = trpc.video.queryTask.useQuery(
    { id: generatingTask || '' },
    { enabled: !!generatingTask, refetchInterval: 5000 }
  );

  const handleGeneratePrompt = async () => {
    if (!idea.trim()) {
      toast.error('Введите идею для видео');
      return;
    }

    try {
      const result = await generatePromptMutation.mutateAsync({ idea, duration });
      setScenes(result.scenes);
      setExplanation(result.explanation);
      setShowChat(true);
      toast.success('Вирусный промпт сгенерирован! 🔥');
    } catch (error) {
      toast.error('Ошибка генерации промпта');
      console.error(error);
    }
  };

  const handleChatSubmit = async () => {
    if (!chatInput.trim() || !idea) return;

    const userMessage = chatInput;
    setChatInput('');

    try {
      const result = await refinePromptMutation.mutateAsync({
        originalIdea: idea,
        currentScenes: scenes,
        userFeedback: userMessage,
        duration,
        chatHistory,
      });

      setScenes(result.scenes);
      setExplanation(result.explanation);
      setChatHistory(result.chatHistory);
      toast.success('Промпт обновлен!');
    } catch (error) {
      toast.error('Ошибка доработки промпта');
      console.error(error);
    }
  };

  const handleCreateVideo = async () => {
    if (scenes.length === 0) {
      toast.error('Сначала сгенерируйте промпт');
      return;
    }

    try {
      const result = await createTaskMutation.mutateAsync({
        idea,
        scenes,
        duration,
        aspectRatio,
      });
      setGeneratingTask(result.id);
      toast.success('Видео отправлено на генерацию! 🎬');
      refetchTasks();
    } catch (error) {
      toast.error('Ошибка создания задачи');
      console.error(error);
    }
  };

  const getPriceForDuration = (dur: number) => {
    if (dur === 10) return '$0.45';
    if (dur === 15) return '$0.675';
    return '$0.00';
  };

  return (
    <>
      <Header title="Генерация Shorts" />

    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-gradient-to-br from-purple-500 to-pink-500 rounded-xl shadow-lg">
            <Video className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-slate-900">Генерация Shorts</h1>
            <p className="text-slate-600">Создавайте вирусные видео с помощью Sora 2 Pro AI</p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column - Input */}
          <div className="lg:col-span-1 space-y-6">
            <Card className="border-purple-100 shadow-lg">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Sparkles className="w-5 h-5 text-purple-500" />
                  Шаг 1: Идея
                </CardTitle>
                <CardDescription>
                  Опишите идею для вирусного Shorts
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label>Идея для видео</Label>
                  <Textarea
                    value={idea}
                    onChange={(e) => setIdea(e.target.value)}
                    placeholder="Например: Как приготовить идеальную пасту карбонара за 60 секунд"
                    rows={4}
                    className="mt-2"
                  />
                </div>

                <div>
                  <Label>Длительность</Label>
                  <RadioGroup
                    value={duration.toString()}
                    onValueChange={(v) => setDuration(parseInt(v) as 10 | 15)}
                    className="mt-2 space-y-2"
                  >
                    <div className="flex items-center space-x-2 p-3 border rounded-lg hover:bg-slate-50">
                      <RadioGroupItem value="10" id="10s" />
                      <Label htmlFor="10s" className="flex-1 cursor-pointer">
                        10 секунд <span className="text-slate-500 text-sm">({getPriceForDuration(10)})</span>
                      </Label>
                    </div>
                    <div className="flex items-center space-x-2 p-3 border rounded-lg hover:bg-slate-50">
                      <RadioGroupItem value="15" id="15s" />
                      <Label htmlFor="15s" className="flex-1 cursor-pointer">
                        15 секунд <span className="text-slate-500 text-sm">({getPriceForDuration(15)})</span>
                      </Label>
                    </div>
                  </RadioGroup>
                </div>

                <div>
                  <Label>Формат</Label>
                  <RadioGroup
                    value={aspectRatio}
                    onValueChange={(v) => setAspectRatio(v as 'portrait' | 'landscape')}
                    className="mt-2 space-y-2"
                  >
                    <div className="flex items-center space-x-2 p-3 border rounded-lg hover:bg-slate-50">
                      <RadioGroupItem value="portrait" id="portrait" />
                      <Label htmlFor="portrait" className="flex-1 cursor-pointer">
                        Вертикальный 9:16 (Shorts)
                      </Label>
                    </div>
                    <div className="flex items-center space-x-2 p-3 border rounded-lg hover:bg-slate-50">
                      <RadioGroupItem value="landscape" id="landscape" />
                      <Label htmlFor="landscape" className="flex-1 cursor-pointer">
                        Горизонтальный 16:9
                      </Label>
                    </div>
                  </RadioGroup>
                </div>

                <Button
                  onClick={handleGeneratePrompt}
                  disabled={generatePromptMutation.isPending || !idea.trim()}
                  className="w-full bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600"
                >
                  {generatePromptMutation.isPending ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Генерация...
                    </>
                  ) : (
                    <>
                      <Wand2 className="w-4 h-4 mr-2" />
                      Создать вирусный промпт
                    </>
                  )}
                </Button>
              </CardContent>
            </Card>
          </div>

          {/* Middle Column - Scenes & Chat */}
          <div className="lg:col-span-2 space-y-6">
            {scenes.length > 0 && (
              <>
                <Card className="border-green-100 shadow-lg">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Check className="w-5 h-5 text-green-500" />
                      Шаг 2: Промпт готов
                    </CardTitle>
                    <CardDescription>
                      {explanation}
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {scenes.map((scene, index) => (
                      <div key={index} className="p-4 bg-slate-50 rounded-lg border">
                        <div className="flex items-center justify-between mb-2">
                          <span className="font-semibold text-slate-700">
                            Сцена {index + 1}
                          </span>
                          <span className="text-sm text-slate-500">{scene.duration} сек</span>
                        </div>
                        <p className="text-sm text-slate-600 leading-relaxed">{scene.prompt}</p>
                      </div>
                    ))}

                    <Button
                      onClick={handleCreateVideo}
                      disabled={createTaskMutation.isPending}
                      className="w-full bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600"
                      size="lg"
                    >
                      {createTaskMutation.isPending ? (
                        <>
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                          Отправка...
                        </>
                      ) : (
                        <>
                          <Video className="w-4 h-4 mr-2" />
                          Создать видео ({getPriceForDuration(duration)})
                        </>
                      )}
                    </Button>
                  </CardContent>
                </Card>

                {/* Chat for refinement */}
                <Card className="border-blue-100 shadow-lg">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <MessageSquare className="w-5 h-5 text-blue-500" />
                      Доработка промпта
                    </CardTitle>
                    <CardDescription>
                      Общайтесь с AI для улучшения промпта
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <ScrollArea className="h-64 mb-4 p-4 bg-slate-50 rounded-lg">
                      {chatHistory.length === 0 ? (
                        <div className="text-center text-slate-400 py-8">
                          <MessageSquare className="w-12 h-12 mx-auto mb-2 opacity-50" />
                          <p>Начните диалог для доработки промпта</p>
                          <p className="text-sm mt-1">Например: "Добавь больше динамики" или "Сделай более кинематографично"</p>
                        </div>
                      ) : (
                        <div className="space-y-3">
                          {chatHistory.map((msg, i) => (
                            <div
                              key={i}
                              className={`p-3 rounded-lg ${
                                msg.role === 'user'
                                  ? 'bg-blue-100 ml-8'
                                  : 'bg-white mr-8 border'
                              }`}
                            >
                              <p className="text-sm font-semibold mb-1">
                                {msg.role === 'user' ? 'Вы' : 'AI'}
                              </p>
                              <p className="text-sm text-slate-700 whitespace-pre-wrap">{msg.content}</p>
                            </div>
                          ))}
                        </div>
                      )}
                    </ScrollArea>

                    <div className="flex gap-2">
                      <Input
                        value={chatInput}
                        onChange={(e) => setChatInput(e.target.value)}
                        onKeyPress={(e) => e.key === 'Enter' && handleChatSubmit()}
                        placeholder="Напишите, что изменить..."
                        disabled={refinePromptMutation.isPending}
                      />
                      <Button
                        onClick={handleChatSubmit}
                        disabled={refinePromptMutation.isPending || !chatInput.trim()}
                        size="icon"
                      >
                        {refinePromptMutation.isPending ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                          <Send className="w-4 h-4" />
                        )}
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </>
            )}
          </div>
        </div>

        {/* Video Tasks History */}
        {videoTasks && videoTasks.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>История генерации</CardTitle>
              <CardDescription>Ваши сгенерированные видео</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {videoTasks.map((task) => (
                  <div key={task.id} className="p-4 border rounded-lg space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-semibold">{task.duration}s</span>
                      <span
                        className={`text-xs px-2 py-1 rounded-full ${
                          task.status === 'completed'
                            ? 'bg-green-100 text-green-700'
                            : task.status === 'failed'
                            ? 'bg-red-100 text-red-700'
                            : 'bg-yellow-100 text-yellow-700'
                        }`}
                      >
                        {task.status === 'completed'
                          ? 'Готово'
                          : task.status === 'failed'
                          ? 'Ошибка'
                          : 'Генерация...'}
                      </span>
                    </div>
                    <p className="text-sm text-slate-600 line-clamp-2">{task.idea}</p>
                    {task.videoUrl && (
                      <Button
                        size="sm"
                        variant="outline"
                        className="w-full"
                        onClick={() => window.open(task.videoUrl!, '_blank')}
                      >
                        <Download className="w-4 h-4 mr-2" />
                        Скачать
                      </Button>
                    )}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
    </>
  );
}


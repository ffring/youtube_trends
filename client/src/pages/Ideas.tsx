import { useState } from "react";
import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { trpc } from "@/lib/trpc";
import { Loader2, Sparkles, Copy, Check, ArrowLeft, Image, Trash2 } from "lucide-react";
import { Link } from "wouter";
import { toast } from "sonner";
import { getLoginUrl } from "@/const";

export default function Ideas() {
  const { user, isAuthenticated } = useAuth();
  const [topic, setTopic] = useState("");
  const [keywords, setKeywords] = useState("");
  const [contentType, setContentType] = useState<"long" | "short">("long");
  const [useTrends, setUseTrends] = useState(true);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const utils = trpc.useUtils();
  const { data: ideas, isLoading: ideasLoading } = trpc.ideas.getUserIdeas.useQuery(undefined, {
    enabled: isAuthenticated,
  });
  
  const generateMutation = trpc.ideas.generate.useMutation({
    onSuccess: () => {
      utils.ideas.getUserIdeas.invalidate();
      setTopic("");
      setKeywords("");
      toast.success("Идея успешно сгенерирована!");
    },
    onError: (error) => {
      toast.error(`Ошибка: ${error.message}`);
    },
  });

  const deleteMutation = trpc.ideas.delete.useMutation({
    onSuccess: () => {
      utils.ideas.getUserIdeas.invalidate();
      toast.success("Идея удалена");
    },
  });

  const updateStatusMutation = trpc.ideas.updateStatus.useMutation({
    onSuccess: () => {
      utils.ideas.getUserIdeas.invalidate();
    },
  });

  const generateThumbnailMutation = trpc.ideas.generateThumbnail.useMutation({
    onSuccess: () => {
      utils.ideas.getUserIdeas.invalidate();
      toast.success("Обложка сгенерирована!");
    },
    onError: (error) => {
      toast.error(`Ошибка генерации: ${error.message}`);
    },
  });

  const handleGenerate = () => {
    if (!topic.trim()) {
      toast.error("Введите тему для генерации");
      return;
    }

    const keywordArray = keywords
      .split(",")
      .map((k) => k.trim())
      .filter(Boolean);

    generateMutation.mutate({
      topic,
      keywords: keywordArray.length > 0 ? keywordArray : undefined,
      contentType,
      useTrends,
    });
  };

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    toast.success("Скопировано в буфер обмена");
    setTimeout(() => setCopiedId(null), 2000);
  };

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle>Требуется авторизация</CardTitle>
            <CardDescription>
              Войдите, чтобы генерировать идеи для видео
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button asChild className="w-full">
              <a href={getLoginUrl()}>Войти</a>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <>
      <Header title="Генерация идей" />
    <div className="min-h-screen flex flex-col bg-gray-50">

      <main className="flex-1 container mx-auto px-4 py-8">
        <div className="grid lg:grid-cols-2 gap-8">
          {/* Generation Form */}
          <Card className="h-fit sticky top-24">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-yellow-500" />
                Создать новую идею
              </CardTitle>
              <CardDescription>
                Введите тему и ключевые слова для генерации идеи с помощью AI
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="topic">Тема видео *</Label>
                <Input
                  id="topic"
                  placeholder="Например: Как начать программировать на Python"
                  value={topic}
                  onChange={(e) => setTopic(e.target.value)}
                />
              </div>

              <div>
                <Label htmlFor="keywords">Ключевые слова (через запятую)</Label>
                <Input
                  id="keywords"
                  placeholder="python, программирование, туториал, для начинающих"
                  value={keywords}
                  onChange={(e) => setKeywords(e.target.value)}
                />
                <p className="text-xs text-gray-500 mt-1">
                  Добавьте ключевые слова для более точной генерации
                </p>
              </div>

              <div>
                <Label htmlFor="content-type">Тип контента *</Label>
                <Select value={contentType} onValueChange={(v: "long" | "short") => setContentType(v)}>
                  <SelectTrigger id="content-type">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="long">Длинное видео (10+ минут)</SelectItem>
                    <SelectItem value="short">Shorts (до 60 секунд)</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="flex items-center space-x-2">
                <Checkbox
                  id="use-trends"
                  checked={useTrends}
                  onCheckedChange={(checked) => setUseTrends(checked as boolean)}
                />
                <Label htmlFor="use-trends" className="text-sm font-normal cursor-pointer">
                  Использовать трендовые видео для генерации
                </Label>
              </div>

              <Button
                className="w-full"
                onClick={handleGenerate}
                disabled={generateMutation.isPending}
              >
                {generateMutation.isPending ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Генерация...
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4 mr-2" />
                    Сгенерировать идею
                  </>
                )}
              </Button>

              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mt-4">
                <p className="text-sm text-blue-900">
                  <strong>💡 Совет:</strong> Чем конкретнее тема и ключевые слова, тем лучше результат!
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Ideas List */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-bold">Сгенерированные идеи</h2>
              {ideas && ideas.length > 0 && (
                <Badge variant="secondary">{ideas.length} идей</Badge>
              )}
            </div>

            {ideasLoading ? (
              <div className="flex justify-center py-12">
                <Loader2 className="w-8 h-8 animate-spin text-gray-400" />
              </div>
            ) : ideas && ideas.length > 0 ? (
              ideas.map((idea: any) => (
                <Card key={idea.id} className="overflow-hidden">
                  <CardHeader className="bg-gradient-to-r from-blue-50 to-purple-50">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <Badge variant={idea.contentType === "short" ? "default" : "secondary"}>
                            {idea.contentType === "short" ? "Shorts" : "Длинное видео"}
                          </Badge>
                          <Badge variant="outline">{idea.status || "draft"}</Badge>
                        </div>
                        <CardTitle className="text-lg">{idea.title}</CardTitle>
                        <CardDescription className="mt-2">{idea.description}</CardDescription>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => deleteMutation.mutate({ id: idea.id })}
                      >
                        <Trash2 className="w-4 h-4 text-red-600" />
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent className="pt-6 space-y-4">
                    {/* Script */}
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <Label className="text-sm font-semibold">Сценарий</Label>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => copyToClipboard(idea.script, `script-${idea.id}`)}
                        >
                          {copiedId === `script-${idea.id}` ? (
                            <Check className="w-4 h-4 text-green-600" />
                          ) : (
                            <Copy className="w-4 h-4" />
                          )}
                        </Button>
                      </div>
                      <Textarea
                        value={idea.script}
                        readOnly
                        rows={6}
                        className="text-sm bg-gray-50"
                      />
                    </div>

                    {/* Tags */}
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <Label className="text-sm font-semibold">Теги</Label>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() =>
                            copyToClipboard(
                              Array.isArray(idea.tags) ? idea.tags.join(", ") : "",
                              `tags-${idea.id}`
                            )
                          }
                        >
                          {copiedId === `tags-${idea.id}` ? (
                            <Check className="w-4 h-4 text-green-600" />
                          ) : (
                            <Copy className="w-4 h-4" />
                          )}
                        </Button>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {Array.isArray(idea.tags) && idea.tags.map((tag: string, idx: number) => (
                          <Badge key={idx} variant="outline">
                            {tag}
                          </Badge>
                        ))}
                      </div>
                    </div>

                    {/* Thumbnail */}
                    <div>
                      <Label className="text-sm font-semibold mb-2 block">Обложка (16:9)</Label>
                      {idea.thumbnailUrl ? (
                        <div className="relative aspect-video rounded-lg overflow-hidden bg-gray-100">
                          <img
                            src={idea.thumbnailUrl}
                            alt="Обложка"
                            className="w-full h-full object-cover"
                          />
                        </div>
                      ) : (
                        <div className="space-y-2">
                          <div className="bg-gray-100 border-2 border-dashed border-gray-300 rounded-lg p-4 text-center aspect-video flex items-center justify-center">
                            <div>
                              <Image className="w-12 h-12 text-gray-400 mx-auto mb-2" />
                              <p className="text-sm text-gray-600">Обложка не сгенерирована</p>
                            </div>
                          </div>
                          <Button
                            variant="outline"
                            className="w-full"
                            onClick={() => generateThumbnailMutation.mutate({ id: idea.id })}
                            disabled={generateThumbnailMutation.isPending}
                          >
                            {generateThumbnailMutation.isPending ? (
                              <>
                                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                Генерация...
                              </>
                            ) : (
                              <>
                                <Image className="w-4 h-4 mr-2" />
                                Сгенерировать обложку 16:9
                              </>
                            )}
                          </Button>
                          {idea.thumbnailPrompt && (
                            <p className="text-xs text-gray-500 mt-1">
                              Промпт: {idea.thumbnailPrompt}
                            </p>
                          )}
                        </div>
                      )}
                    </div>

                    {/* Status Actions */}
                    <div className="flex gap-2 pt-2">
                      <Button
                        variant={idea.status === "approved" ? "default" : "outline"}
                        size="sm"
                        onClick={() =>
                          updateStatusMutation.mutate({
                            id: idea.id,
                            status: "approved",
                          })
                        }
                      >
                        Одобрить
                      </Button>
                      <Button
                        variant={idea.status === "used" ? "default" : "outline"}
                        size="sm"
                        onClick={() =>
                          updateStatusMutation.mutate({
                            id: idea.id,
                            status: "used",
                          })
                        }
                      >
                        Использовано
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))
            ) : (
              <Card>
                <CardContent className="py-12 text-center">
                  <Sparkles className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-600 mb-2">Пока нет сгенерированных идей</p>
                  <p className="text-sm text-gray-500">
                    Заполните форму слева и нажмите "Сгенерировать идею"
                  </p>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </main>
    </div>
    </>
  );
}


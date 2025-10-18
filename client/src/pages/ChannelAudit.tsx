import Header from "@/components/Header";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { CheckCircle2, XCircle, Lightbulb, TrendingUp, Search, MessageSquare, ExternalLink, Video } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

export default function ChannelAudit() {
  const [channelUrl, setChannelUrl] = useState("");
  const { data: audit, refetch } = trpc.audit.getLatestAudit.useQuery();
  const performAudit = trpc.audit.performChannelAudit.useMutation({
    onSuccess: () => {
      refetch();
      toast.success("Аудит завершен!");
    },
    onError: (error) => {
      toast.error(`Ошибка: ${error.message}`);
    }
  });

  const performCustomAudit = trpc.audit.performChannelAuditByUrl.useMutation({
    onSuccess: () => {
      refetch();
      toast.success("Аудит завершен!");
      setChannelUrl("");
    },
    onError: (error) => {
      toast.error(`Ошибка: ${error.message}`);
    }
  });

  const handleCustomAudit = () => {
    if (!channelUrl.trim()) {
      toast.error("Введите URL канала");
      return;
    }
    performCustomAudit.mutate({ channelUrl });
  };

  const getScoreColor = (score: number) => {
    if (score >= 80) return "text-green-600";
    if (score >= 60) return "text-yellow-600";
    return "text-red-600";
  };

  const getScoreBadge = (score: number) => {
    if (score >= 80) return "Отлично";
    if (score >= 60) return "Хорошо";
    if (score >= 40) return "Средне";
    return "Требует улучшения";
  };

  return (
    <>
      <Header title="Аудит канала" />

    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 py-12 px-4">
      <div className="container max-w-4xl">
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-2">Аудит канала</h1>
          <p className="text-gray-600">
            Получите детальный анализ любого YouTube канала с конкретными рекомендациями
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-6 mb-8">
          <Card>
            <CardHeader>
              <CardTitle>Мой канал</CardTitle>
              <CardDescription>
                Анализ вашего подключенного YouTube канала
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button
                onClick={() => performAudit.mutate()}
                disabled={performAudit.isPending}
                size="lg"
                className="w-full"
              >
                {performAudit.isPending ? "Анализируем..." : "Запустить аудит"}
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Любой канал</CardTitle>
              <CardDescription>
                Введите URL канала для анализа
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="channel-url">URL канала</Label>
                <Input
                  id="channel-url"
                  placeholder="https://www.youtube.com/@channelname"
                  value={channelUrl}
                  onChange={(e) => setChannelUrl(e.target.value)}
                />
                <p className="text-xs text-gray-500 mt-1">
                  Например: youtube.com/@channelname или youtube.com/c/channelname
                </p>
              </div>
              <Button
                onClick={handleCustomAudit}
                disabled={performCustomAudit.isPending}
                size="lg"
                className="w-full"
              >
                {performCustomAudit.isPending ? "Анализируем..." : "Анализировать"}
              </Button>
            </CardContent>
          </Card>
        </div>

        {audit && (
          <>
            <Card className="mb-8">
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span>Общая оценка</span>
                  {audit.channelTitle && (
                    <Badge variant="outline" className="text-sm font-normal">
                      {audit.channelTitle}
                    </Badge>
                  )}
                </CardTitle>
                <CardDescription>
                  Проанализировано: {new Date(audit.createdAt!).toLocaleDateString()}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-center mb-6">
                  <div className={`text-6xl font-bold ${getScoreColor(parseInt(audit.overallScore || "0"))}`}>
                    {audit.overallScore}/100
                  </div>
                  <Badge className="mt-2">
                    {getScoreBadge(parseInt(audit.overallScore || "0"))}
                  </Badge>
                </div>

                <div className="space-y-4">
                  <div>
                    <div className="flex justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <Search className="w-4 h-4" />
                        <span className="font-medium">SEO Оптимизация</span>
                      </div>
                      <span className={`font-bold ${getScoreColor(parseInt(audit.seoScore || "0"))}`}>
                        {audit.seoScore}/100
                      </span>
                    </div>
                    <Progress value={parseInt(audit.seoScore || "0")} />
                  </div>

                  <div>
                    <div className="flex justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <MessageSquare className="w-4 h-4" />
                        <span className="font-medium">Вовлеченность</span>
                      </div>
                      <span className={`font-bold ${getScoreColor(parseInt(audit.engagementScore || "0"))}`}>
                        {audit.engagementScore}/100
                      </span>
                    </div>
                    <Progress value={parseInt(audit.engagementScore || "0")} />
                  </div>

                  <div>
                    <div className="flex justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <TrendingUp className="w-4 h-4" />
                        <span className="font-medium">Качество контента</span>
                      </div>
                      <span className={`font-bold ${getScoreColor(parseInt(audit.contentQualityScore || "0"))}`}>
                        {audit.contentQualityScore}/100
                      </span>
                    </div>
                    <Progress value={parseInt(audit.contentQualityScore || "0")} />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Analyzed Videos */}
            {audit.analyzedVideos && audit.analyzedVideos.length > 0 && (
              <Card className="mb-8">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Video className="w-5 h-5" />
                    Проанализированные видео
                  </CardTitle>
                  <CardDescription>
                    Топ видео канала с метриками
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {audit.analyzedVideos.map((video: any, i: number) => (
                      <div key={i} className="p-3 bg-gray-50 rounded-lg">
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex-1">
                            <h4 className="font-medium text-sm mb-1 line-clamp-2">{video.title}</h4>
                            <div className="flex flex-wrap gap-3 text-xs text-gray-600">
                              <span>👁 {parseInt(video.viewCount).toLocaleString()} просмотров</span>
                              <span>👍 {parseInt(video.likeCount).toLocaleString()} лайков</span>
                              <span>💬 {parseInt(video.commentCount).toLocaleString()} комментариев</span>
                              <span className="font-semibold text-primary">
                                {((parseInt(video.likeCount) / parseInt(video.viewCount)) * 100).toFixed(2)}% вовлеченность
                              </span>
                            </div>
                          </div>
                          <a 
                            href={`https://youtube.com/watch?v=${video.videoId}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-primary hover:text-primary/80"
                          >
                            <ExternalLink className="w-4 h-4" />
                          </a>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-green-600">
                    <CheckCircle2 className="w-5 h-5" />
                    Сильные стороны
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-2">
                    {audit.strengths?.map((strength: string, i: number) => (
                      <li key={i} className="flex items-start gap-2">
                        <CheckCircle2 className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
                        <span className="text-sm">{strength}</span>
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-red-600">
                    <XCircle className="w-5 h-5" />
                    Слабые стороны
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-2">
                    {audit.weaknesses?.map((weakness: string, i: number) => (
                      <li key={i} className="flex items-start gap-2">
                        <XCircle className="w-4 h-4 text-red-600 mt-0.5 flex-shrink-0" />
                        <span className="text-sm">{weakness}</span>
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            </div>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Lightbulb className="w-5 h-5 text-yellow-600" />
                  Конкретные рекомендации
                </CardTitle>
                <CardDescription>
                  Действия для улучшения канала
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="space-y-3">
                  {audit.recommendations?.map((rec: string, i: number) => (
                    <li key={i} className="flex items-start gap-3 p-3 bg-yellow-50 rounded-lg">
                      <Lightbulb className="w-5 h-5 text-yellow-600 mt-0.5 flex-shrink-0" />
                      <span className="text-sm">{rec}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          </>
        )}

        {!audit && !performAudit.isPending && !performCustomAudit.isPending && (
          <div className="text-center py-12 text-gray-500">
            <TrendingUp className="w-16 h-16 mx-auto mb-4 opacity-50" />
            <p>Запустите аудит для получения детального анализа канала</p>
          </div>
        )}
      </div>
    </div>
    </>
  );
}


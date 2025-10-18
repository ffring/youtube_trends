import Header from "@/components/Header";
import { useState } from "react";
import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { trpc } from "@/lib/trpc";
import { Loader2, TrendingUp, ArrowLeft, ExternalLink, Search } from "lucide-react";
import { Link } from "wouter";
import { toast } from "sonner";
import { getLoginUrl } from "@/const";

export default function TrendingVideos() {
  const { user, isAuthenticated } = useAuth();
  const [regionCode, setRegionCode] = useState("US");
  const [maxResults, setMaxResults] = useState(50);
  const [searchKeywords, setSearchKeywords] = useState("");
  const [videoType, setVideoType] = useState<"all" | "shorts" | "long">("all");

  const { data: videos, isLoading, refetch } = trpc.youtube.getTrending.useQuery(
    { regionCode, maxResults, keywords: searchKeywords },
    {
      enabled: isAuthenticated,
    }
  );

  const handleRefresh = () => {
    refetch();
    toast.success("Обновление трендов...");
  };

  // Filter videos by type only (keywords filtering now done on backend)
  const filteredVideos = videos?.filter((video: any) => {
    // Filter by video type
    if (videoType === "shorts" && !video.isShort) return false;
    if (videoType === "long" && video.isShort) return false;
    return true;
  });

  if (!isAuthenticated) {
    return (
    <>
      <Header title="Трендовые видео" />

      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle>Требуется авторизация</CardTitle>
            <CardDescription>
              Войдите, чтобы просматривать трендовые видео
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button asChild className="w-full">
              <a href={getLoginUrl()}>Войти</a>
            </Button>
          </CardContent>
        </Card>
      </div>
      </>
    );
  }

  return (
    <>
      <Header title="Трендовые видео" />
    <div className="min-h-screen flex flex-col bg-gray-50">

      <main className="flex-1 container mx-auto px-4 py-8">
        <div className="space-y-6">
          {/* Filters Card */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="w-5 h-5" />
                Фильтры и поиск
              </CardTitle>
              <CardDescription>Настройте параметры поиска трендовых видео</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="search-keywords">Поиск по ключевым словам</Label>
                  <div className="flex gap-2">
                    <Input
                      id="search-keywords"
                      placeholder="python, туториал, обучение..."
                      value={searchKeywords}
                      onChange={(e) => setSearchKeywords(e.target.value)}
                    />
                    <Button variant="outline" size="icon">
                      <Search className="w-4 h-4" />
                    </Button>
                  </div>
                  <p className="text-xs text-gray-500 mt-1">
                    Введите ключевые слова через запятую
                  </p>
                </div>

                <div>
                  <Label htmlFor="video-type">Тип видео</Label>
                  <Select value={videoType} onValueChange={(v: "all" | "shorts" | "long") => setVideoType(v)}>
                    <SelectTrigger id="video-type">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Все видео</SelectItem>
                      <SelectItem value="shorts">Только Shorts</SelectItem>
                      <SelectItem value="long">Только длинные видео</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="flex flex-wrap gap-4">
                <div className="flex items-center gap-2">
                  <Label htmlFor="region">Регион:</Label>
                  <Select value={regionCode} onValueChange={setRegionCode}>
                    <SelectTrigger id="region" className="w-[180px]">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="US">🇺🇸 США</SelectItem>
                      <SelectItem value="RU">🇷🇺 Россия</SelectItem>
                      <SelectItem value="GB">🇬🇧 Великобритания</SelectItem>
                      <SelectItem value="DE">🇩🇪 Германия</SelectItem>
                      <SelectItem value="FR">🇫🇷 Франция</SelectItem>
                      <SelectItem value="JP">🇯🇵 Япония</SelectItem>
                      <SelectItem value="KR">🇰🇷 Южная Корея</SelectItem>
                      <SelectItem value="BR">🇧🇷 Бразилия</SelectItem>
                      <SelectItem value="IN">🇮🇳 Индия</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="flex items-center gap-2">
                  <Label htmlFor="max-results">Количество:</Label>
                  <Select value={String(maxResults)} onValueChange={(v) => setMaxResults(Number(v))}>
                    <SelectTrigger id="max-results" className="w-[120px]">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="25">25</SelectItem>
                      <SelectItem value="50">50</SelectItem>
                      <SelectItem value="100">100</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <Button onClick={handleRefresh} disabled={isLoading}>
                  {isLoading ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin mr-2" />
                      Загрузка...
                    </>
                  ) : (
                    <>
                      <TrendingUp className="h-4 w-4 mr-2" />
                      Обновить тренды
                    </>
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Results */}
          {isLoading ? (
            <div className="flex justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : filteredVideos && filteredVideos.length > 0 ? (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <p className="text-sm text-gray-600">
                  Найдено видео: <strong>{filteredVideos.length}</strong>
                  {searchKeywords && ` по запросу "${searchKeywords}"`}
                </p>
                <Badge variant="secondary">
                  {videoType === "shorts" ? "Shorts" : videoType === "long" ? "Длинные" : "Все"}
                </Badge>
              </div>

              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredVideos.map((video: any) => (
                  <Card key={video.id} className="overflow-hidden hover:shadow-lg transition-shadow">
                    <div className="relative aspect-video bg-gray-100">
                      <img
                        src={video.thumbnailUrl}
                        alt={video.title}
                        className="w-full h-full object-cover"
                      />
                      {video.isShort && (
                        <Badge className="absolute top-2 right-2 bg-red-600">
                          Shorts
                        </Badge>
                      )}
                      <div className="absolute bottom-2 right-2 bg-black/80 text-white text-xs px-2 py-1 rounded">
                        {video.duration}
                      </div>
                    </div>
                    <CardHeader className="pb-3">
                      <CardTitle className="text-base line-clamp-2 leading-tight">
                        {video.title}
                      </CardTitle>
                      <CardDescription className="line-clamp-1">
                        {video.channelTitle}
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      {/* Stats Grid */}
                      <div className="grid grid-cols-3 gap-2 text-sm">
                        <div>
                          <div className="text-gray-500 text-xs">Просмотры</div>
                          <div className="font-semibold">
                            {parseInt(video.viewCount).toLocaleString()}
                          </div>
                        </div>
                        <div>
                          <div className="text-gray-500 text-xs">Лайки</div>
                          <div className="font-semibold">
                            {parseInt(video.likeCount).toLocaleString()}
                          </div>
                        </div>
                        <div>
                          <div className="text-gray-500 text-xs">Комменты</div>
                          <div className="font-semibold">
                            {parseInt(video.commentCount).toLocaleString()}
                          </div>
                        </div>
                      </div>

                      {/* Engagement Rate */}
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-gray-600">Вовлеченность:</span>
                        <Badge variant="outline" className="font-semibold">
                          {((parseInt(video.likeCount) / parseInt(video.viewCount)) * 100).toFixed(2)}%
                        </Badge>
                      </div>

                      {/* Trend Score */}
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-gray-600">Тренд скор:</span>
                        <Badge variant="default" className="bg-green-600">
                          {video.score}
                        </Badge>
                      </div>

                      {/* Tags */}
                      {video.tags && video.tags.length > 0 && (
                        <div className="space-y-1">
                          <div className="text-xs text-gray-500">Теги:</div>
                          <div className="flex flex-wrap gap-1">
                            {video.tags.slice(0, 3).map((tag: string, i: number) => (
                              <Badge key={i} variant="outline" className="text-xs">
                                {tag}
                              </Badge>
                            ))}
                            {video.tags.length > 3 && (
                              <Badge variant="outline" className="text-xs">
                                +{video.tags.length - 3}
                              </Badge>
                            )}
                          </div>
                        </div>
                      )}

                      {/* Actions */}
                      <div className="flex gap-2 pt-2">
                        <Button asChild variant="outline" size="sm" className="flex-1">
                          <a
                            href={`https://youtube.com/watch?v=${video.id}`}
                            target="_blank"
                            rel="noopener noreferrer"
                          >
                            <ExternalLink className="w-3 h-3 mr-1" />
                            Открыть
                          </a>
                        </Button>
                        <Button variant="default" size="sm" className="flex-1">
                          Анализ
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          ) : (
            <Card>
              <CardContent className="py-12 text-center">
                <TrendingUp className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-600 mb-2">
                  {searchKeywords || videoType !== "all"
                    ? "Видео не найдены по заданным фильтрам"
                    : "Нет трендовых видео"}
                </p>
                <p className="text-sm text-gray-500">
                  Попробуйте изменить фильтры или обновить тренды
                </p>
              </CardContent>
            </Card>
          )}
        </div>
      </main>
    </div>
    </>
  );
}


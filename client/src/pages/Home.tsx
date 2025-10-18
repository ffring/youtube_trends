import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { APP_LOGO, APP_TITLE, getLoginUrl } from "@/const";
import { trpc } from "@/lib/trpc";
import { TrendingUp, Video, Lightbulb, Youtube, Loader2, Users, BarChart3, Bell, Clapperboard } from "lucide-react";
import { Link } from "wouter";

export default function Home() {
  const { user, loading, isAuthenticated } = useAuth();
  const { data: channel, isLoading: channelLoading } = trpc.youtube.getConnectedChannel.useQuery(undefined, {
    enabled: isAuthenticated,
  });

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex flex-col">
        <header className="border-b">
          <div className="container mx-auto px-4 py-4 flex items-center justify-between">
            <div className="flex items-center gap-2">
              {APP_LOGO && <img src={APP_LOGO} alt={APP_TITLE} className="h-8" />}
              <h1 className="text-2xl font-bold">{APP_TITLE}</h1>
            </div>
            <Button asChild>
              <a href={getLoginUrl()}>Войти</a>
            </Button>
          </div>
        </header>

        <main className="flex-1 flex flex-col items-center justify-center px-4">
          <div className="max-w-4xl w-full text-center space-y-8">
            <div className="space-y-4">
              <h2 className="text-5xl font-bold tracking-tight">
                Анализируй тренды YouTube
                <br />
                <span className="text-primary">Создавай вирусный контент</span>
              </h2>
              <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
                Минимальный VidIQ: находи трендовые темы, генерируй идеи для видео, 
                получай готовые сценарии, заголовки и обложки с помощью AI
              </p>
            </div>

            <div className="grid md:grid-cols-3 gap-6 mt-12">
              <Card>
                <CardHeader>
                  <TrendingUp className="h-10 w-10 text-primary mb-2" />
                  <CardTitle>Трендовые ключевые слова</CardTitle>
                </CardHeader>
                <CardContent>
                  <CardDescription>
                    Анализируй популярные видео и находи темы, которые сейчас залетают
                  </CardDescription>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <Lightbulb className="h-10 w-10 text-primary mb-2" />
                  <CardTitle>Идеи для видео</CardTitle>
                </CardHeader>
                <CardContent>
                  <CardDescription>
                    AI генерирует идеи на основе трендов и твоей ниши
                  </CardDescription>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <Video className="h-10 w-10 text-primary mb-2" />
                  <CardTitle>Готовый контент</CardTitle>
                </CardHeader>
                <CardContent>
                  <CardDescription>
                    Получай заголовки, сценарии, теги и обложки для Shorts и длинных видео
                  </CardDescription>
                </CardContent>
              </Card>
            </div>

            <Button size="lg" asChild className="mt-8">
              <a href={getLoginUrl()}>
                Начать бесплатно
              </a>
            </Button>
          </div>
        </main>

        <footer className="border-t py-6">
          <div className="container mx-auto px-4 text-center text-sm text-muted-foreground">
            YouTube Trends Analyzer — твой помощник в создании вирусного контента
          </div>
        </footer>
      </div>
    );
  }

  // Authenticated user view
  return (
    <div className="min-h-screen flex flex-col">
      <header className="border-b">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            {APP_LOGO && <img src={APP_LOGO} alt={APP_TITLE} className="h-8" />}
            <h1 className="text-2xl font-bold">{APP_TITLE}</h1>
          </div>
          <div className="flex items-center gap-4">
            <span className="text-sm text-muted-foreground">{user?.name}</span>
            <Button variant="outline" asChild>
              <Link href="/settings">Настройки</Link>
            </Button>
          </div>
        </div>
      </header>

      <main className="flex-1 container mx-auto px-4 py-8">
        {!channel ? (
          <div className="max-w-2xl mx-auto text-center space-y-6">
            <div className="bg-muted rounded-lg p-8 space-y-4">
              <Youtube className="h-16 w-16 text-primary mx-auto" />
              <h2 className="text-2xl font-bold">Подключи свой YouTube канал</h2>
              <p className="text-muted-foreground">
                Для начала работы подключи свой канал через Google OAuth. 
                Это позволит анализировать тренды и генерировать персонализированные рекомендации.
              </p>
              <ConnectYouTubeButton />
            </div>
          </div>
        ) : (
          <div className="space-y-8">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-3xl font-bold">Добро пожаловать!</h2>
                <p className="text-muted-foreground mt-1">
                  Канал подключен: <span className="font-medium">{channel.channelTitle}</span>
                </p>
              </div>
            </div>

            <div className="grid md:grid-cols-4 gap-4">
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium text-muted-foreground">
                    Подписчики
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {parseInt(channel.subscriberCount || '0').toLocaleString()}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium text-muted-foreground">
                    Видео
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {parseInt(channel.videoCount || '0').toLocaleString()}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium text-muted-foreground">
                    Просмотры
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {parseInt(channel.viewCount || '0').toLocaleString()}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium text-muted-foreground">
                    Статус
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-green-600">
                    Активен
                  </div>
                </CardContent>
              </Card>
            </div>

            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              <Link href="/trending-keywords">
                <Card className="hover:shadow-lg transition-shadow cursor-pointer">
                  <CardHeader>
                    <TrendingUp className="h-8 w-8 text-primary mb-2" />
                    <CardTitle>Трендовые ключевые слова</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <CardDescription>
                      Найди популярные темы и ключевые слова в твоей нише
                    </CardDescription>
                  </CardContent>
                </Card>
              </Link>

              <Link href="/ideas">
                <Card className="hover:shadow-lg transition-shadow cursor-pointer">
                  <CardHeader>
                    <Lightbulb className="h-8 w-8 text-primary mb-2" />
                    <CardTitle>Идеи для видео</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <CardDescription>
                      Генерируй идеи на основе трендов с помощью AI
                    </CardDescription>
                  </CardContent>
                </Card>
              </Link>

              <Link href="/trending-videos">
                <Card className="hover:shadow-lg transition-shadow cursor-pointer">
                  <CardHeader>
                    <Video className="h-8 w-8 text-primary mb-2" />
                    <CardTitle>Трендовые видео</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <CardDescription>
                      Смотри что сейчас набирает популярность
                    </CardDescription>
                  </CardContent>
                </Card>
              </Link>

              <Link href="/my-topics">
                <Card className="hover:shadow-lg transition-shadow cursor-pointer">
                  <CardHeader>
                    <Youtube className="h-8 w-8 text-primary mb-2" />
                    <CardTitle>Мои темы</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <CardDescription>
                      Управляй своими темами и нишами для контента
                    </CardDescription>
                  </CardContent>
                </Card>
              </Link>

              <Link href="/competitors">
                <Card className="hover:shadow-lg transition-shadow cursor-pointer">
                  <CardHeader>
                    <Users className="h-8 w-8 text-purple-600 mb-2" />
                    <CardTitle>Анализ конкурентов</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <CardDescription>
                      Отслеживай конкурентов и учись на их успехах
                    </CardDescription>
                  </CardContent>
                </Card>
              </Link>

              <Link href="/channel-audit">
                <Card className="hover:shadow-lg transition-shadow cursor-pointer">
                  <CardHeader>
                    <BarChart3 className="h-8 w-8 text-green-600 mb-2" />
                    <CardTitle>Аудит канала</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <CardDescription>
                      Получи детальный анализ и рекомендации по улучшению
                    </CardDescription>
                  </CardContent>
                </Card>
              </Link>

              <Link href="/trend-alerts">
                <Card className="hover:shadow-lg transition-shadow cursor-pointer">
                  <CardHeader>
                    <Bell className="h-8 w-8 text-yellow-600 mb-2" />
                    <CardTitle>Трендовые уведомления</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <CardDescription>
                      Будь в курсе трендов и возможностей для вирусного контента
                    </CardDescription>
                  </CardContent>
                </Card>
              </Link>

              <Link href="/video-generation">
                <Card className="hover:shadow-lg transition-shadow cursor-pointer bg-gradient-to-br from-purple-50 to-pink-50 border-purple-200">
                  <CardHeader>
                    <Clapperboard className="h-8 w-8 text-purple-600 mb-2" />
                    <CardTitle className="text-purple-900">Генерация Shorts</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <CardDescription className="text-purple-700">
                      Создавай видео с помощью Sora 2 Pro AI — от идеи до готового Shorts
                    </CardDescription>
                  </CardContent>
                </Card>
              </Link>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

function ConnectYouTubeButton() {
  const { data, isLoading } = trpc.youtube.getAuthUrl.useQuery();

  if (isLoading) {
    return (
      <Button disabled>
        <Loader2 className="h-4 w-4 animate-spin mr-2" />
        Загрузка...
      </Button>
    );
  }

  return (
    <Button size="lg" asChild>
      <a href={data?.authUrl}>
        <Youtube className="h-5 w-5 mr-2" />
        Подключить YouTube канал
      </a>
    </Button>
  );
}


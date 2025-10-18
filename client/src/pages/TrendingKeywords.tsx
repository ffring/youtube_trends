import Header from "@/components/Header";
import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { getLoginUrl } from "@/const";
import { trpc } from "@/lib/trpc";
import { ArrowLeft, TrendingUp, Search, Loader2 } from "lucide-react";
import { useState } from "react";
import { Link } from "wouter";

export default function TrendingKeywords() {
  const { user, isAuthenticated } = useAuth();
  const [searchQuery, setSearchQuery] = useState("");

  if (!isAuthenticated) {
    return (
    <>
      <Header title="Трендовые ключевые слова" />

      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle>Требуется авторизация</CardTitle>
            <CardDescription>
              Войдите, чтобы получить доступ к трендовым ключевым словам
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
      <Header title="Трендовые ключевые слова" />
    <div className="min-h-screen bg-gray-50">

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Search className="w-5 h-5" />
              Поиск трендовых ключевых слов
            </CardTitle>
            <CardDescription>
              Введите тему или ключевое слово для поиска трендов
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex gap-2">
              <Input
                placeholder="Например: программирование, кулинария, путешествия..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="flex-1"
              />
              <Button>
                <Search className="w-4 h-4 mr-2" />
                Найти
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Trending Keywords Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {/* Placeholder cards */}
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <Card key={i} className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <TrendingUp className="w-5 h-5 text-green-600" />
                  Ключевое слово #{i}
                </CardTitle>
                <CardDescription>Категория: Общее</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Объем поиска:</span>
                    <span className="font-semibold">~{Math.floor(Math.random() * 100000)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Конкуренция:</span>
                    <span className="font-semibold text-orange-600">Средняя</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Тренд:</span>
                    <span className="font-semibold text-green-600">↑ Растет</span>
                  </div>
                </div>
                <Button className="w-full mt-4" variant="outline">
                  Использовать для идеи
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Info Card */}
        <Card className="mt-8 bg-blue-50 border-blue-200">
          <CardHeader>
            <CardTitle className="text-blue-900">💡 Как использовать трендовые ключевые слова?</CardTitle>
          </CardHeader>
          <CardContent className="text-blue-800">
            <ul className="space-y-2 list-disc list-inside">
              <li>Выбирайте ключевые слова с высоким объемом поиска и низкой конкуренцией</li>
              <li>Используйте растущие тренды для создания актуального контента</li>
              <li>Комбинируйте несколько ключевых слов для уникальных идей</li>
              <li>Регулярно проверяйте обновления трендов</li>
            </ul>
          </CardContent>
        </Card>
      </main>
    </div>
    </>
  );
}


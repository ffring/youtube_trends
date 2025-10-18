import Header from "@/components/Header";
import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Trash2, TrendingUp, Users, Video, Eye } from "lucide-react";
import { Link } from "wouter";

export default function Competitors() {
  const [channelId, setChannelId] = useState("");
  const { data: competitors, refetch } = trpc.competitors.list.useQuery();
  const addCompetitor = trpc.competitors.add.useMutation({
    onSuccess: () => {
      refetch();
      setChannelId("");
    },
  });
  const deleteCompetitor = trpc.competitors.delete.useMutation({
    onSuccess: () => refetch(),
  });

  const handleAdd = () => {
    if (channelId.trim()) {
      addCompetitor.mutate({ channelId: channelId.trim() });
    }
  };

  return (
    <>
      <Header title="Анализ конкурентов" />

    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 py-12 px-4">
      <div className="container max-w-6xl">
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-2">Анализ конкурентов</h1>
          <p className="text-gray-600">
            Отслеживайте конкурентов и анализируйте их стратегию для улучшения своего контента
          </p>
        </div>

        <Card className="mb-8">
          <CardHeader>
            <CardTitle>Добавить конкурента</CardTitle>
            <CardDescription>
              Введите ID YouTube канала конкурента для анализа
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex gap-2">
              <Input
                placeholder="UC..."
                value={channelId}
                onChange={(e) => setChannelId(e.target.value)}
                onKeyPress={(e) => e.key === "Enter" && handleAdd()}
              />
              <Button
                onClick={handleAdd}
                disabled={addCompetitor.isPending || !channelId.trim()}
              >
                {addCompetitor.isPending ? "Анализ..." : "Добавить"}
              </Button>
            </div>
          </CardContent>
        </Card>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {competitors?.map((competitor) => (
            <Card key={competitor.id} className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    {competitor.thumbnailUrl && (
                      <img
                        src={competitor.thumbnailUrl}
                        alt={competitor.channelTitle || ""}
                        className="w-12 h-12 rounded-full"
                      />
                    )}
                    <div>
                      <CardTitle className="text-lg">
                        {competitor.channelTitle}
                      </CardTitle>
                      <CardDescription className="text-xs">
                        {competitor.channelId}
                      </CardDescription>
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => deleteCompetitor.mutate({ id: competitor.id })}
                  >
                    <Trash2 className="w-4 h-4 text-red-500" />
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-3 gap-4 mb-4">
                  <div className="text-center">
                    <div className="flex items-center justify-center gap-1 text-gray-600 mb-1">
                      <Users className="w-4 h-4" />
                      <span className="text-xs">Подписчики</span>
                    </div>
                    <div className="font-bold">
                      {parseInt(competitor.subscriberCount || "0").toLocaleString()}
                    </div>
                  </div>
                  <div className="text-center">
                    <div className="flex items-center justify-center gap-1 text-gray-600 mb-1">
                      <Video className="w-4 h-4" />
                      <span className="text-xs">Видео</span>
                    </div>
                    <div className="font-bold">
                      {parseInt(competitor.videoCount || "0").toLocaleString()}
                    </div>
                  </div>
                  <div className="text-center">
                    <div className="flex items-center justify-center gap-1 text-gray-600 mb-1">
                      <Eye className="w-4 h-4" />
                      <span className="text-xs">Просмотры</span>
                    </div>
                    <div className="font-bold text-sm">
                      {(parseInt(competitor.viewCount || "0") / 1000000).toFixed(1)}M
                    </div>
                  </div>
                </div>
                <Link href={`/competitors/${competitor.id}`}>
                  <Button variant="outline" className="w-full">
                    <TrendingUp className="w-4 h-4 mr-2" />
                    Детальный анализ
                  </Button>
                </Link>
              </CardContent>
            </Card>
          ))}
        </div>

        {competitors?.length === 0 && (
          <div className="text-center py-12 text-gray-500">
            <Users className="w-16 h-16 mx-auto mb-4 opacity-50" />
            <p>Добавьте конкурентов для начала анализа</p>
          </div>
        )}
      </div>
    </div>
    </>
  );
}


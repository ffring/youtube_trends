import Header from "@/components/Header";
import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { getLoginUrl } from "@/const";
import { trpc } from "@/lib/trpc";
import { ArrowLeft, Plus, Trash2, Edit2, Loader2 } from "lucide-react";
import { useState } from "react";
import { Link } from "wouter";
import { toast } from "sonner";

export default function MyTopics() {
  const { user, isAuthenticated } = useAuth();
  const [isAddingTopic, setIsAddingTopic] = useState(false);
  const [newTopic, setNewTopic] = useState({ name: "", description: "", keywords: "" });

  const { data: topics, isLoading } = trpc.content.getUserTopics.useQuery(undefined, {
    enabled: isAuthenticated,
  });

  const utils = trpc.useUtils();
  const addTopicMutation = trpc.content.addTopic.useMutation({
    onSuccess: () => {
      utils.content.getUserTopics.invalidate();
      setNewTopic({ name: "", description: "", keywords: "" });
      setIsAddingTopic(false);
      toast.success("Тема добавлена!");
    },
    onError: (error) => {
      toast.error("Ошибка: " + error.message);
    },
  });

  const deleteTopicMutation = trpc.content.deleteTopic.useMutation({
    onSuccess: () => {
      utils.content.getUserTopics.invalidate();
      toast.success("Тема удалена");
    },
  });

  const handleAddTopic = () => {
    if (!newTopic.name.trim()) {
      toast.error("Введите название темы");
      return;
    }
    addTopicMutation.mutate({
      name: newTopic.name,
      description: newTopic.description,
      keywords: newTopic.keywords.split(",").map((k) => k.trim()).filter(Boolean),
    });
  };

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle>Требуется авторизация</CardTitle>
            <CardDescription>
              Войдите, чтобы управлять своими темами
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
      <Header title="Мои темы" />
    <div className="min-h-screen bg-gray-50">
      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        <div className="mb-6 flex justify-end">
          <Button onClick={() => setIsAddingTopic(true)}>
            <Plus className="w-4 h-4 mr-2" />
            Добавить тему
          </Button>
        </div>
        {/* Add Topic Form */}
        {isAddingTopic && (
          <Card className="mb-6">
            <CardHeader>
              <CardTitle>Новая тема</CardTitle>
              <CardDescription>
                Добавьте тему для генерации идей контента
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="topic-name">Название темы</Label>
                <Input
                  id="topic-name"
                  placeholder="Например: Программирование на Python"
                  value={newTopic.name}
                  onChange={(e) => setNewTopic({ ...newTopic, name: e.target.value })}
                />
              </div>
              <div>
                <Label htmlFor="topic-description">Описание (необязательно)</Label>
                <Textarea
                  id="topic-description"
                  placeholder="Краткое описание темы..."
                  value={newTopic.description}
                  onChange={(e) => setNewTopic({ ...newTopic, description: e.target.value })}
                  rows={3}
                />
              </div>
              <div>
                <Label htmlFor="topic-keywords">Ключевые слова (через запятую)</Label>
                <Input
                  id="topic-keywords"
                  placeholder="python, программирование, туториал, обучение"
                  value={newTopic.keywords}
                  onChange={(e) => setNewTopic({ ...newTopic, keywords: e.target.value })}
                />
              </div>
              <div className="flex gap-2">
                <Button
                  onClick={handleAddTopic}
                  disabled={addTopicMutation.isPending}
                >
                  {addTopicMutation.isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                  Добавить
                </Button>
                <Button
                  variant="outline"
                  onClick={() => {
                    setIsAddingTopic(false);
                    setNewTopic({ name: "", description: "", keywords: "" });
                  }}
                >
                  Отмена
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Topics List */}
        {isLoading ? (
          <div className="flex justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-gray-400" />
          </div>
        ) : topics && topics.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {topics.map((topic) => (
              <Card key={topic.id} className="hover:shadow-lg transition-shadow">
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    <span className="truncate">{topic.name}</span>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => deleteTopicMutation.mutate({ id: topic.id })}
                    >
                      <Trash2 className="w-4 h-4 text-red-600" />
                    </Button>
                  </CardTitle>
                  {topic.description && (
                    <CardDescription className="line-clamp-2">
                      {topic.description}
                    </CardDescription>
                  )}
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div>
                      <p className="text-sm font-medium text-gray-700 mb-2">Ключевые слова:</p>
                      <div className="flex flex-wrap gap-1">
                        {topic.keywords.map((keyword: string, idx: number) => (
                          <span
                            key={idx}
                            className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full"
                          >
                            {keyword}
                          </span>
                        ))}
                      </div>
                    </div>
                    <Button asChild className="w-full" variant="outline">
                      <Link href={`/ideas?topic=${topic.id}`}>
                        Генерировать идеи
                      </Link>
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <Card>
            <CardContent className="py-12 text-center">
              <p className="text-gray-600 mb-4">У вас пока нет сохраненных тем</p>
              <Button onClick={() => setIsAddingTopic(true)}>
                <Plus className="w-4 h-4 mr-2" />
                Добавить первую тему
              </Button>
            </CardContent>
          </Card>
        )}
      </main>
    </div>
    </>
  );
}


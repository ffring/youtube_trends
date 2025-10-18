import Header from "@/components/Header";
import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Bell, TrendingUp, Users, Zap, Check } from "lucide-react";

export default function TrendAlerts() {
  const { data: alerts, refetch } = trpc.alerts.list.useQuery();
  const markAsRead = trpc.alerts.markAsRead.useMutation({
    onSuccess: () => refetch(),
  });

  const getAlertIcon = (type: string) => {
    switch (type) {
      case "keyword_trending":
        return <TrendingUp className="w-5 h-5 text-blue-600" />;
      case "competitor_video":
        return <Users className="w-5 h-5 text-purple-600" />;
      case "viral_opportunity":
        return <Zap className="w-5 h-5 text-yellow-600" />;
      default:
        return <Bell className="w-5 h-5 text-gray-600" />;
    }
  };

  const getAlertColor = (type: string) => {
    switch (type) {
      case "keyword_trending":
        return "border-l-4 border-l-blue-600";
      case "competitor_video":
        return "border-l-4 border-l-purple-600";
      case "viral_opportunity":
        return "border-l-4 border-l-yellow-600";
      default:
        return "border-l-4 border-l-gray-600";
    }
  };

  const unreadCount = alerts?.filter((a) => a.isRead === "no").length || 0;

  return (
    <>
      <Header title="Трендовые уведомления" />

    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 py-12 px-4">
      <div className="container max-w-4xl">
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-4xl font-bold mb-2">Трендовые уведомления</h1>
            <p className="text-gray-600">
              Будьте в курсе трендов и возможностей для вирусного контента
            </p>
          </div>
          {unreadCount > 0 && (
            <Badge variant="destructive" className="text-lg px-4 py-2">
              {unreadCount} новых
            </Badge>
          )}
        </div>

        <div className="space-y-4">
          {alerts?.map((alert) => (
            <Card
              key={alert.id}
              className={`${getAlertColor(alert.alertType)} ${
                alert.isRead === "no" ? "bg-blue-50" : ""
              } hover:shadow-md transition-shadow`}
            >
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-3">
                    {getAlertIcon(alert.alertType)}
                    <div>
                      <CardTitle className="text-lg">{alert.title}</CardTitle>
                      <CardDescription className="mt-1">
                        {new Date(alert.createdAt!).toLocaleString()}
                      </CardDescription>
                    </div>
                  </div>
                  {alert.isRead === "no" && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => markAsRead.mutate({ id: alert.id })}
                    >
                      <Check className="w-4 h-4 mr-1" />
                      Прочитано
                    </Button>
                  )}
                </div>
              </CardHeader>
              {alert.description && (
                <CardContent>
                  <p className="text-sm text-gray-700">{alert.description}</p>
                  {alert.data && Object.keys(alert.data).length > 0 && (
                    <div className="mt-3 p-3 bg-white rounded-lg border">
                      <pre className="text-xs overflow-auto">
                        {JSON.stringify(alert.data, null, 2)}
                      </pre>
                    </div>
                  )}
                </CardContent>
              )}
            </Card>
          ))}
        </div>

        {alerts?.length === 0 && (
          <div className="text-center py-12 text-gray-500">
            <Bell className="w-16 h-16 mx-auto mb-4 opacity-50" />
            <p>Пока нет уведомлений</p>
            <p className="text-sm mt-2">
              Мы будем уведомлять вас о трендах и возможностях для вашего контента
            </p>
          </div>
        )}
      </div>
    </div>
    </>
  );
}


import { useParams, useNavigate } from "react-router-dom";
import { useRequest, useRequestActivity } from "../hooks/use-request";
import { useAuth } from "../lib/auth";
import { ActivityTimeline } from "../components/activity-timeline";
import { CommentComposer } from "../components/comment-composer";
import { StatusActions } from "../components/status-actions";
import { ArrowLeft, MapPin, User, Clock, Calendar, Wrench } from "lucide-react";
import { cn } from "../lib/utils";
import { t } from "../lib/i18n";

const priorityStyles: Record<string, string> = {
  urgent: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400",
  high: "bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400",
  normal: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
  low: "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400",
};

export function RequestDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { profile } = useAuth();
  const { data: request, isLoading } = useRequest(id!);
  const { data: activity } = useRequestActivity(id!);

  if (isLoading) {
    return (
      <div className="p-6 space-y-4">
        <div className="h-8 w-64 bg-muted animate-pulse rounded" />
        <div className="h-4 w-96 bg-muted animate-pulse rounded" />
        <div className="h-32 bg-muted animate-pulse rounded-lg" />
      </div>
    );
  }

  if (!request) {
    return (
      <div className="p-6">
        <h1 className="text-xl font-bold text-destructive">{t("detail.not_found")}</h1>
        <button onClick={() => navigate(-1)} className="text-sm text-primary mt-2">{t("detail.go_back")}</button>
      </div>
    );
  }

  const isStaff = profile && ["owner_admin", "staff"].includes(profile.role_key);

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      {/* Header */}
      <div>
        <button onClick={() => navigate(-1)} className="text-sm text-muted-foreground hover:text-foreground flex items-center gap-1 mb-3">
          <ArrowLeft className="h-4 w-4" /> {t("detail.back")}
        </button>
        <div className="flex items-start justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-sm text-muted-foreground font-mono">#{request.request_number}</span>
              <span className={cn("text-xs font-medium px-2 py-0.5 rounded-full", priorityStyles[request.priority_key] || priorityStyles.normal)}>
                {request.priority_key}
              </span>
            </div>
            <h1 className="text-xl font-bold">{request.title}</h1>
          </div>
          <StatusActions request={request} userRole={profile?.role_key || ""} />
        </div>
      </div>

      {/* Summary */}
      <div className="bg-card border rounded-lg p-4 grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
        {request.description && (
          <div className="sm:col-span-2 text-muted-foreground">{request.description}</div>
        )}
        <div className="flex items-center gap-2">
          <MapPin className="h-4 w-4 text-muted-foreground flex-shrink-0" />
          <span>{request.location_detail || t("detail.no_location")}</span>
        </div>
        <div className="flex items-center gap-2">
          <User className="h-4 w-4 text-muted-foreground flex-shrink-0" />
          <span>{request.requester_name}</span>
        </div>
        <div className="flex items-center gap-2">
          <Clock className="h-4 w-4 text-muted-foreground flex-shrink-0" />
          <span>{t("detail.submitted", { date: new Date(request.created_at).toLocaleDateString() })}</span>
        </div>
        {request.scheduled_start_at && (
          <div className="flex items-center gap-2">
            <Calendar className="h-4 w-4 text-muted-foreground flex-shrink-0" />
            <span>{t("detail.scheduled", { date: new Date(request.scheduled_start_at).toLocaleDateString() })}</span>
          </div>
        )}
        {request.resolution_summary && (
          <div className="sm:col-span-2 bg-green-50 dark:bg-green-900/20 rounded p-3 text-green-800 dark:text-green-300">
            <span className="font-medium">{t("detail.resolution")}</span>{request.resolution_summary}
          </div>
        )}
      </div>

      {/* Activity timeline */}
      <div>
        <h2 className="text-sm font-semibold mb-3">{t("detail.activity")}</h2>
        <ActivityTimeline items={activity || []} isStaff={!!isStaff} />
      </div>

      {/* Comment composer */}
      <CommentComposer requestId={request.id} isStaff={!!isStaff} />
    </div>
  );
}

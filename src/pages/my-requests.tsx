import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { apiGet } from "../api/client";
import { cn } from "../lib/utils";
import { Clock, AlertTriangle, PlusCircle } from "lucide-react";
import { t } from "../lib/i18n";

interface RequestRow {
  id: string;
  request_number: number;
  title: string;
  status_key: string;
  priority_key: string;
  property_id: string;
  updated_at: string;
}

interface Status {
  key: string;
  label: string;
  color_token: string;
  is_open: boolean;
  is_terminal: boolean;
}

const priorityStyles: Record<string, string> = {
  urgent: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400",
  high: "bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400",
  normal: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
  low: "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400",
};

const statusColorMap: Record<string, string> = {
  blue: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
  yellow: "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400",
  purple: "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400",
  orange: "bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400",
  pink: "bg-pink-100 text-pink-700 dark:bg-pink-900/30 dark:text-pink-400",
  cyan: "bg-cyan-100 text-cyan-700 dark:bg-cyan-900/30 dark:text-cyan-400",
  green: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400",
  gray: "bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400",
  red: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400",
};

function formatRelative(dateStr: string): string {
  const d = new Date(dateStr);
  const now = new Date();
  const diffMs = now.getTime() - d.getTime();
  const diffMins = Math.floor(diffMs / 60_000);
  if (diffMins < 1) return "just now";
  if (diffMins < 60) return `${diffMins}m ago`;
  const diffHours = Math.floor(diffMins / 60);
  if (diffHours < 24) return `${diffHours}h ago`;
  const diffDays = Math.floor(diffHours / 24);
  if (diffDays < 7) return `${diffDays}d ago`;
  return d.toLocaleDateString();
}

export function MyRequestsPage() {
  const navigate = useNavigate();
  const { data: requests, isLoading } = useQuery({
    queryKey: ["my-requests"],
    queryFn: () => apiGet<RequestRow[]>("/rest/v1/maintenance_requests?order=updated_at.desc"),
    refetchInterval: 30_000,
  });
  const { data: statuses } = useQuery({
    queryKey: ["all-statuses"],
    queryFn: () => apiGet<Status[]>("/rest/v1/request_statuses"),
    staleTime: 60_000,
  });

  const statusMap = new Map(statuses?.map(s => [s.key, s]) || []);

  // Group: open, resolved (awaiting confirmation), closed/canceled
  const open = requests?.filter(r => {
    const s = statusMap.get(r.status_key);
    return s?.is_open && r.status_key !== "resolved";
  }) || [];
  const resolved = requests?.filter(r => r.status_key === "resolved") || [];
  const closed = requests?.filter(r => {
    const s = statusMap.get(r.status_key);
    return s && !s.is_open;
  }) || [];

  if (isLoading) {
    return (
      <div className="p-6 space-y-3">
        {[1, 2, 3].map(i => <div key={i} className="h-20 bg-muted animate-pulse rounded-lg" />)}
      </div>
    );
  }

  const renderCard = (req: RequestRow) => {
    const status = statusMap.get(req.status_key);
    return (
      <button
        key={req.id}
        onClick={() => navigate(`/app/requests/${req.id}`)}
        className="w-full text-left bg-card border rounded-lg p-4 hover:shadow-md transition-shadow"
      >
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <span className="text-xs text-muted-foreground font-mono">#{req.request_number}</span>
              <span className={cn("text-[10px] font-medium px-1.5 py-0.5 rounded-full", priorityStyles[req.priority_key] || priorityStyles.normal)}>
                {req.priority_key}
              </span>
            </div>
            <h3 className="text-sm font-medium truncate">{req.title}</h3>
          </div>
          <div className="flex flex-col items-end gap-1 flex-shrink-0">
            <span className={cn("text-[10px] font-medium px-2 py-0.5 rounded-full", statusColorMap[status?.color_token || "gray"])}>
              {status?.label || req.status_key}
            </span>
            <span className="text-[10px] text-muted-foreground flex items-center gap-0.5">
              <Clock className="h-2.5 w-2.5" /> {formatRelative(req.updated_at)}
            </span>
          </div>
        </div>
      </button>
    );
  };

  const isEmpty = (requests?.length || 0) === 0;

  return (
    <div className="max-w-2xl mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold">{t("my_requests.heading")}</h1>
        <button
          onClick={() => navigate("/app/report")}
          className="flex items-center gap-1.5 px-3 py-1.5 bg-primary text-primary-foreground rounded-md text-sm font-medium hover:opacity-90"
        >
          <PlusCircle className="h-4 w-4" /> {t("my_requests.report_issue")}
        </button>
      </div>

      {isEmpty && (
        <div className="text-center py-12">
          <AlertTriangle className="h-10 w-10 text-muted-foreground/30 mx-auto mb-3" />
          <p className="text-muted-foreground">{t("my_requests.no_requests")}</p>
          <button onClick={() => navigate("/app/report")} className="text-sm text-primary mt-2 hover:underline">{t("my_requests.report_first")}</button>
        </div>
      )}

      {open.length > 0 && (
        <div>
          <h2 className="text-sm font-semibold text-muted-foreground mb-2">{t("my_requests.open")}</h2>
          <div className="space-y-2">{open.map(renderCard)}</div>
        </div>
      )}

      {resolved.length > 0 && (
        <div>
          <h2 className="text-sm font-semibold text-muted-foreground mb-2">{t("my_requests.awaiting_confirmation")}</h2>
          <div className="space-y-2">{resolved.map(renderCard)}</div>
        </div>
      )}

      {closed.length > 0 && (
        <div>
          <h2 className="text-sm font-semibold text-muted-foreground mb-2">{t("my_requests.closed")}</h2>
          <div className="space-y-2">{closed.map(renderCard)}</div>
        </div>
      )}
    </div>
  );
}

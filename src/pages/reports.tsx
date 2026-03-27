import { useQuery } from "@tanstack/react-query";
import { apiGet } from "../api/client";
import { cn } from "../lib/utils";
import {
  BarChart3,
  AlertCircle,
  Clock,
  UserX,
  Activity,
  Download,
  FileSpreadsheet,
} from "lucide-react";
import { t } from "../lib/i18n";

interface RequestMetrics {
  open_count: number;
  overdue_count: number;
  unassigned_count: number;
  avg_first_response_hours_30d: number | null;
}

interface MaintenanceRequest {
  id: string;
  request_number: number;
  title: string;
  status_key: string;
  priority_key: string;
  created_at: string;
  updated_at: string;
}

interface ExportRow {
  [key: string]: unknown;
}

function formatHours(hours: number | null): string {
  if (hours == null) return "--";
  if (hours < 1) return `${Math.round(hours * 60)}m`;
  if (hours < 24) return `${hours.toFixed(1)}h`;
  return `${(hours / 24).toFixed(1)}d`;
}

function toCsv(rows: ExportRow[]): string {
  if (rows.length === 0) return "";
  const headers = Object.keys(rows[0]);
  const lines = [
    headers.join(","),
    ...rows.map((row) =>
      headers
        .map((h) => {
          const val = row[h];
          const str = val == null ? "" : String(val);
          return str.includes(",") || str.includes('"') || str.includes("\n")
            ? `"${str.replace(/"/g, '""')}"`
            : str;
        })
        .join(",")
    ),
  ];
  return lines.join("\n");
}

function downloadCsv(csv: string, filename: string) {
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
}

export function ReportsPage() {
  const { data: metricsArr, isLoading: metricsLoading } = useQuery({
    queryKey: ["request-metrics"],
    queryFn: () => apiGet<RequestMetrics[]>("/rest/v1/v_request_metrics"),
    refetchInterval: 60_000,
  });

  const { data: requests, isLoading: requestsLoading } = useQuery({
    queryKey: ["all-requests-for-report"],
    queryFn: () =>
      apiGet<MaintenanceRequest[]>("/rest/v1/maintenance_requests?order=created_at.desc&select=id,request_number,title,status_key,priority_key,created_at,updated_at"),
  });

  const metrics = metricsArr?.[0] || null;

  // Group requests by status
  const statusGroups: Record<string, MaintenanceRequest[]> = {};
  if (requests) {
    for (const req of requests) {
      if (!statusGroups[req.status_key]) {
        statusGroups[req.status_key] = [];
      }
      statusGroups[req.status_key].push(req);
    }
  }

  const sortedStatuses = Object.entries(statusGroups).sort(
    (a, b) => b[1].length - a[1].length
  );

  const handleExport = async () => {
    try {
      const exportData = await apiGet<ExportRow[]>("/rest/v1/v_request_export");
      const csv = toCsv(exportData);
      const date = new Date().toISOString().slice(0, 10);
      downloadCsv(csv, `maintenance-requests-${date}.csv`);
    } catch (err) {
      alert(t("toast.export_failed", { error: err instanceof Error ? err.message : "Unknown error" }));
    }
  };

  const kpiCards = [
    {
      label: t("reports.open_requests"),
      value: metrics?.open_count ?? "--",
      icon: Activity,
      color: "text-blue-600 dark:text-blue-400",
      bg: "bg-blue-100 dark:bg-blue-900/30",
    },
    {
      label: t("reports.overdue"),
      value: metrics?.overdue_count ?? "--",
      icon: AlertCircle,
      color: "text-red-600 dark:text-red-400",
      bg: "bg-red-100 dark:bg-red-900/30",
    },
    {
      label: t("reports.unassigned"),
      value: metrics?.unassigned_count ?? "--",
      icon: UserX,
      color: "text-amber-600 dark:text-amber-400",
      bg: "bg-amber-100 dark:bg-amber-900/30",
    },
    {
      label: t("reports.avg_response"),
      value: formatHours(metrics?.avg_first_response_hours_30d ?? null),
      icon: Clock,
      color: "text-purple-600 dark:text-purple-400",
      bg: "bg-purple-100 dark:bg-purple-900/30",
    },
  ];

  if (metricsLoading && requestsLoading) {
    return (
      <div className="p-6 space-y-6">
        <div className="h-8 w-48 bg-muted animate-pulse rounded" />
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-24 bg-muted animate-pulse rounded-lg" />
          ))}
        </div>
        <div className="h-64 bg-muted animate-pulse rounded-lg" />
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">{t("reports.heading")}</h1>
        <button
          onClick={handleExport}
          className="flex items-center gap-1.5 px-3 py-1.5 border rounded-md text-sm font-medium hover:bg-muted transition-colors"
        >
          <Download className="h-4 w-4" /> {t("reports.export_csv")}
        </button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {kpiCards.map((kpi) => {
          const Icon = kpi.icon;
          return (
            <div key={kpi.label} className="bg-card border rounded-lg p-4">
              <div className="flex items-center gap-3">
                <div className={cn("h-10 w-10 rounded-lg flex items-center justify-center flex-shrink-0", kpi.bg)}>
                  <Icon className={cn("h-5 w-5", kpi.color)} />
                </div>
                <div>
                  <p className="text-2xl font-bold">{kpi.value}</p>
                  <p className="text-xs text-muted-foreground">{kpi.label}</p>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Requests by Status */}
      <div className="bg-card border rounded-lg overflow-hidden">
        <div className="p-4 border-b flex items-center gap-2">
          <BarChart3 className="h-4 w-4 text-muted-foreground" />
          <h2 className="text-sm font-semibold">{t("reports.by_status")}</h2>
          <span className="text-xs text-muted-foreground ml-auto">
            {t("reports.total", { count: requests?.length || 0 })}
          </span>
        </div>

        {sortedStatuses.length === 0 && !requestsLoading && (
          <div className="text-center py-12">
            <FileSpreadsheet className="h-10 w-10 text-muted-foreground/30 mx-auto mb-3" />
            <p className="text-muted-foreground">{t("reports.no_requests")}</p>
          </div>
        )}

        {requestsLoading && (
          <div className="p-4 space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-10 bg-muted animate-pulse rounded" />
            ))}
          </div>
        )}

        {sortedStatuses.length > 0 && (
          <div className="divide-y">
            {/* Table header */}
            <div className="grid grid-cols-12 gap-4 px-4 py-2 text-xs font-medium text-muted-foreground bg-muted/30">
              <div className="col-span-4">{t("reports.status_col")}</div>
              <div className="col-span-2 text-right">{t("reports.count_col")}</div>
              <div className="col-span-6">{t("reports.distribution_col")}</div>
            </div>

            {/* Table rows */}
            {sortedStatuses.map(([statusKey, reqs]) => {
              const pct = requests ? Math.round((reqs.length / requests.length) * 100) : 0;
              return (
                <div key={statusKey} className="grid grid-cols-12 gap-4 px-4 py-3 items-center text-sm">
                  <div className="col-span-4">
                    <span className="font-medium capitalize">
                      {statusKey.replace(/_/g, " ")}
                    </span>
                  </div>
                  <div className="col-span-2 text-right font-mono text-muted-foreground">
                    {reqs.length}
                  </div>
                  <div className="col-span-6 flex items-center gap-2">
                    <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
                      <div
                        className="h-full bg-primary rounded-full transition-all"
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                    <span className="text-xs text-muted-foreground w-10 text-right">{pct}%</span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

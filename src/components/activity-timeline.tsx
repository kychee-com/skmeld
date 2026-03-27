import type { ActivityItem } from "../hooks/use-request";
import { cn } from "../lib/utils";
import { MessageSquare, ArrowRight, Lock } from "lucide-react";
import { t } from "../lib/i18n";

interface ActivityTimelineProps {
  items: ActivityItem[];
  isStaff: boolean;
}

function formatTime(dateStr: string): string {
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

export function ActivityTimeline({ items, isStaff }: ActivityTimelineProps) {
  if (items.length === 0) {
    return <div className="text-sm text-muted-foreground">{t("timeline.no_activity")}</div>;
  }

  return (
    <div className="space-y-3">
      {items.map((item) => {
        const isInternal = item.visibility === "internal";
        if (isInternal && !isStaff) return null;

        return (
          <div
            key={item.id}
            className={cn(
              "flex gap-3 text-sm",
              isInternal && "opacity-75",
            )}
          >
            {/* Icon */}
            <div className={cn(
              "flex-shrink-0 w-7 h-7 rounded-full flex items-center justify-center mt-0.5",
              item.activity_type === "comment"
                ? "bg-primary/10 text-primary"
                : "bg-muted text-muted-foreground",
            )}>
              {item.activity_type === "comment" ? (
                <MessageSquare className="h-3.5 w-3.5" />
              ) : (
                <ArrowRight className="h-3.5 w-3.5" />
              )}
            </div>

            {/* Content */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-0.5">
                <span className="font-medium text-foreground">{item.actor_name || "System"}</span>
                {isInternal && (
                  <span className="flex items-center gap-0.5 text-[10px] text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-900/20 px-1.5 py-0.5 rounded">
                    <Lock className="h-2.5 w-2.5" /> {t("timeline.internal")}
                  </span>
                )}
                <span className="text-xs text-muted-foreground">{formatTime(item.created_at)}</span>
              </div>
              {item.body && (
                <div className={cn(
                  "text-muted-foreground whitespace-pre-wrap",
                  item.activity_type === "comment" && "bg-muted/50 rounded-lg p-2.5 mt-1",
                )}>
                  {item.body}
                </div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}

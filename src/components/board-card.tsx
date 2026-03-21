import { useDraggable } from "@dnd-kit/core";
import { cn } from "../lib/utils";
import type { BoardCard } from "../hooks/use-board";
import { Clock, Paperclip, AlertTriangle, User } from "lucide-react";

const priorityStyles: Record<string, string> = {
  urgent: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400",
  high: "bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400",
  normal: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
  low: "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400",
};

function formatAge(hours: number): string {
  if (hours < 1) return "<1h";
  if (hours < 24) return `${Math.floor(hours)}h`;
  const days = Math.floor(hours / 24);
  return `${days}d`;
}

interface BoardCardProps {
  card: BoardCard;
  isDragging?: boolean;
  onClick?: () => void;
}

export function BoardCardComponent({ card, isDragging, onClick }: BoardCardProps) {
  const { attributes, listeners, setNodeRef, transform } = useDraggable({
    id: card.id,
  });

  const style = transform
    ? { transform: `translate(${transform.x}px, ${transform.y}px)` }
    : undefined;

  const isOverdue = card.is_overdue_response || card.is_overdue_resolution;

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...listeners}
      {...attributes}
      onClick={onClick}
      className={cn(
        "bg-card border rounded-lg p-3 cursor-grab active:cursor-grabbing transition-shadow hover:shadow-md",
        isDragging && "opacity-70 shadow-lg rotate-2",
        isOverdue && "border-destructive/50",
      )}
    >
      {/* Header */}
      <div className="flex items-start justify-between gap-2 mb-1.5">
        <span className="text-xs text-muted-foreground font-mono">#{card.request_number}</span>
        <span className={cn("text-[10px] font-medium px-1.5 py-0.5 rounded-full", priorityStyles[card.priority_key] || priorityStyles.normal)}>
          {card.priority_label}
        </span>
      </div>

      {/* Title */}
      <h3 className="text-sm font-medium leading-snug line-clamp-2 mb-2">{card.title}</h3>

      {/* Location */}
      <div className="text-xs text-muted-foreground truncate mb-2">
        {card.property_name}{card.space_name ? ` · ${card.space_name}` : ""}
      </div>

      {/* Footer */}
      <div className="flex items-center justify-between text-xs text-muted-foreground">
        <div className="flex items-center gap-2">
          {/* Age */}
          <span className={cn("flex items-center gap-0.5", isOverdue && "text-destructive font-medium")}>
            {isOverdue && <AlertTriangle className="h-3 w-3" />}
            <Clock className="h-3 w-3" />
            {formatAge(card.age_hours)}
          </span>

          {/* Attachments */}
          {card.attachment_count > 0 && (
            <span className="flex items-center gap-0.5">
              <Paperclip className="h-3 w-3" />
              {card.attachment_count}
            </span>
          )}
        </div>

        <div className="flex items-center gap-1.5">
          {/* Category */}
          <span className="text-[10px] bg-muted px-1.5 py-0.5 rounded truncate max-w-[80px]">
            {card.category_label}
          </span>

          {/* Assignee */}
          {card.assignee_name ? (
            <span className="flex items-center gap-0.5 text-[10px]" title={card.assignee_name}>
              <User className="h-3 w-3" />
              {card.assignee_name.split(" ")[0]}
            </span>
          ) : (
            <span className="text-[10px] text-muted-foreground/50">unassigned</span>
          )}
        </div>
      </div>
    </div>
  );
}

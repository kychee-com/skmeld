import { useDroppable } from "@dnd-kit/core";
import { cn } from "../lib/utils";
import { t } from "../lib/i18n";
import type { BoardCard, BoardStatus } from "../hooks/use-board";
import { BoardCardComponent } from "./board-card";

const statusColorMap: Record<string, string> = {
  blue: "border-t-blue-500",
  yellow: "border-t-yellow-500",
  purple: "border-t-purple-500",
  orange: "border-t-orange-500",
  pink: "border-t-pink-500",
  cyan: "border-t-cyan-500",
  green: "border-t-green-500",
  gray: "border-t-gray-400",
  red: "border-t-red-500",
};

interface BoardColumnProps {
  status: BoardStatus;
  cards: BoardCard[];
  onCardClick: (card: BoardCard) => void;
}

export function BoardColumn({ status, cards, onCardClick }: BoardColumnProps) {
  const { setNodeRef, isOver } = useDroppable({ id: status.key });

  return (
    <div
      ref={setNodeRef}
      className={cn(
        "flex flex-col min-w-[280px] w-[300px] bg-muted/30 rounded-lg border-t-2 transition-colors",
        statusColorMap[status.color_token] || "border-t-gray-400",
        isOver && "bg-primary/5 ring-1 ring-primary/20",
      )}
    >
      {/* Header */}
      <div className="sticky top-0 px-3 py-2.5 flex items-center justify-between bg-muted/30 rounded-t-lg">
        <h2 className="text-sm font-semibold text-foreground">{status.label}</h2>
        <span className="text-xs text-muted-foreground bg-muted px-1.5 py-0.5 rounded-full font-medium">
          {cards.length}
        </span>
      </div>

      {/* Cards */}
      <div className="flex-1 overflow-y-auto px-2 pb-2 space-y-2 min-h-[100px]">
        {cards.length === 0 && (
          <div className="flex items-center justify-center h-20 text-xs text-muted-foreground/50">
            {t("board.no_requests")}
          </div>
        )}
        {cards.map((card) => (
          <BoardCardComponent
            key={card.id}
            card={card}
            onClick={() => onCardClick(card)}
          />
        ))}
      </div>
    </div>
  );
}

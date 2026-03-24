import { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { DndContext, DragEndEvent, DragOverlay, DragStartEvent, closestCenter, PointerSensor, useSensor, useSensors } from "@dnd-kit/core";
import { useBoardCards, useBoardStatuses, type BoardCard } from "../hooks/use-board";
import { BoardColumn } from "../components/board-column";
import { BoardCardComponent } from "../components/board-card";
import { BoardFilters } from "../components/board-filters";
import { invokeFunction } from "../api/client";
import { useQueryClient } from "@tanstack/react-query";

export function BoardPage() {
  const { data: statuses, isLoading: statusesLoading } = useBoardStatuses();
  const [filters, setFilters] = useState<Record<string, string>>({});
  const { data: cards, isLoading: cardsLoading } = useBoardCards(filters);
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const [activeCard, setActiveCard] = useState<BoardCard | null>(null);
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
  );

  const columnCards = useMemo(() => {
    const map: Record<string, BoardCard[]> = {};
    if (statuses) {
      for (const s of statuses) map[s.key] = [];
    }
    if (cards) {
      for (const card of cards) {
        if (map[card.status_key]) {
          map[card.status_key].push(card);
        }
      }
    }
    return map;
  }, [statuses, cards]);

  const handleDragStart = (event: DragStartEvent) => {
    const card = cards?.find((c) => c.id === event.active.id);
    if (card) setActiveCard(card);
  };

  const handleDragEnd = async (event: DragEndEvent) => {
    setActiveCard(null);
    const { active, over } = event;
    if (!over || !active) return;

    const cardId = active.id as string;
    const targetStatus = over.id as string;
    const card = cards?.find((c) => c.id === cardId);
    if (!card || card.status_key === targetStatus) return;

    // Optimistic update
    queryClient.setQueryData(["board-cards", filters], (old: BoardCard[] | undefined) =>
      old?.map((c) => (c.id === cardId ? { ...c, status_key: targetStatus } : c)),
    );

    try {
      await invokeFunction("transition-request", {
        request_id: cardId,
        to_status_key: targetStatus,
      });
      queryClient.invalidateQueries({ queryKey: ["board-cards"] });
    } catch {
      // Revert on error
      queryClient.invalidateQueries({ queryKey: ["board-cards"] });
    }
  };

  const handleCardClick = (card: BoardCard) => {
    navigate(`/app/requests/${card.id}`);
  };

  if (statusesLoading || cardsLoading) {
    return (
      <div className="p-6">
        <div className="flex items-center gap-3 mb-6">
          <div className="h-8 w-32 bg-muted animate-pulse rounded" />
          <div className="h-8 w-24 bg-muted animate-pulse rounded" />
        </div>
        <div className="flex gap-4 overflow-x-auto pb-4">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="min-w-[300px] bg-muted/30 rounded-lg p-3 space-y-3">
              <div className="h-5 w-24 bg-muted animate-pulse rounded" />
              {[1, 2].map((j) => (
                <div key={j} className="h-24 bg-muted animate-pulse rounded-md" />
              ))}
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col">
      <div className="p-4 pb-2 flex items-center justify-between">
        <h1 className="text-xl font-bold">Board</h1>
        <BoardFilters filters={filters} onChange={setFilters} />
      </div>

      <div className="flex-1 overflow-x-auto px-4 pb-4">
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragStart={handleDragStart}
          onDragEnd={handleDragEnd}
        >
          <div className="flex gap-3 h-full min-w-min">
            {statuses?.map((status) => (
              <BoardColumn
                key={status.key}
                status={status}
                cards={columnCards[status.key] || []}
                onCardClick={handleCardClick}
              />
            ))}
          </div>

          <DragOverlay>
            {activeCard && <BoardCardComponent card={activeCard} isDragging />}
          </DragOverlay>
        </DndContext>
      </div>
    </div>
  );
}

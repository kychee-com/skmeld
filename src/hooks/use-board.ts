import { useQuery } from "@tanstack/react-query";
import { apiGet } from "../api/client";

export interface BoardCard {
  id: string;
  request_number: number;
  title: string;
  status_key: string;
  status_label: string;
  status_color: string;
  status_board_order: number;
  priority_key: string;
  priority_label: string;
  priority_color: string;
  priority_sort_order: number;
  category_key: string;
  category_label: string;
  category_icon: string;
  property_id: string;
  property_name: string;
  space_id: string | null;
  space_name: string | null;
  requester_name: string;
  requester_profile_user_id: string | null;
  assignee_user_id: string | null;
  assignee_name: string | null;
  vendor_id: string | null;
  vendor_name: string | null;
  scheduled_start_at: string | null;
  scheduled_end_at: string | null;
  first_response_due_at: string | null;
  resolution_due_at: string | null;
  first_responded_at: string | null;
  created_at: string;
  updated_at: string;
  attachment_count: number;
  age_hours: number;
  is_overdue_response: boolean;
  is_overdue_resolution: boolean;
}

export interface BoardStatus {
  key: string;
  label: string;
  color_token: string;
  board_order: number;
}

export function useBoardCards(filters?: Record<string, string>) {
  return useQuery({
    queryKey: ["board-cards", filters],
    queryFn: async () => {
      let path = "/rest/v1/v_request_board?order=priority_sort_order.asc,created_at.asc";
      if (filters) {
        for (const [key, value] of Object.entries(filters)) {
          if (value) path += `&${key}=${value}`;
        }
      }
      return apiGet<BoardCard[]>(path);
    },
    refetchInterval: 15_000,
  });
}

export function useBoardStatuses() {
  return useQuery({
    queryKey: ["board-statuses"],
    queryFn: () =>
      apiGet<BoardStatus[]>(
        "/rest/v1/request_statuses?show_in_board=eq.true&order=board_order.asc",
      ),
    staleTime: 60_000,
  });
}

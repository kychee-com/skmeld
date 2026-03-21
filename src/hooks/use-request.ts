import { useQuery } from "@tanstack/react-query";
import { apiGet } from "../api/client";

export interface MaintenanceRequest {
  id: string;
  request_number: number;
  title: string;
  description: string | null;
  property_id: string;
  space_id: string | null;
  category_key: string;
  priority_key: string;
  status_key: string;
  source_key: string;
  requester_profile_user_id: string | null;
  requester_name: string;
  requester_email: string | null;
  requester_phone: string | null;
  assignee_user_id: string | null;
  vendor_id: string | null;
  location_detail: string | null;
  entry_preference_key: string | null;
  pets_present: boolean | null;
  preferred_visit_window: string | null;
  access_instructions: string | null;
  scheduled_start_at: string | null;
  scheduled_end_at: string | null;
  first_response_due_at: string | null;
  resolution_due_at: string | null;
  first_responded_at: string | null;
  resolved_at: string | null;
  closed_at: string | null;
  resolution_summary: string | null;
  created_at: string;
  updated_at: string;
}

export interface ActivityItem {
  id: string;
  request_id: string;
  activity_type: "event" | "comment";
  event_type: string | null;
  visibility: string;
  body: string | null;
  actor_user_id: string | null;
  actor_name: string | null;
  payload: unknown;
  created_at: string;
}

export function useRequest(id: string) {
  return useQuery({
    queryKey: ["request", id],
    queryFn: () => apiGet<MaintenanceRequest[]>(`/rest/v1/maintenance_requests?id=eq.${id}`).then(r => r[0]),
    enabled: !!id,
  });
}

export function useRequestActivity(requestId: string) {
  return useQuery({
    queryKey: ["request-activity", requestId],
    queryFn: () => apiGet<ActivityItem[]>(`/rest/v1/v_request_activity?request_id=eq.${requestId}&order=created_at.asc`),
    enabled: !!requestId,
    refetchInterval: 15_000,
  });
}

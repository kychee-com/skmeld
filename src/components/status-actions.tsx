import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { invokeFunction } from "../api/client";
import type { MaintenanceRequest } from "../hooks/use-request";
import { cn } from "../lib/utils";

const transitionLabels: Record<string, string> = {
  triaged: "Mark Under Review",
  scheduled: "Schedule",
  in_progress: "Start Work",
  waiting_on_resident: "Wait on Resident",
  waiting_on_vendor: "Wait on Vendor",
  resolved: "Mark Resolved",
  closed: "Close",
  canceled: "Cancel",
};

const staffTransitions: Record<string, string[]> = {
  submitted: ["triaged", "scheduled", "in_progress", "canceled"],
  triaged: ["scheduled", "in_progress", "waiting_on_resident", "waiting_on_vendor", "resolved", "canceled"],
  scheduled: ["in_progress", "waiting_on_resident", "waiting_on_vendor", "resolved", "canceled"],
  in_progress: ["waiting_on_resident", "waiting_on_vendor", "resolved", "canceled"],
  waiting_on_resident: ["triaged", "in_progress", "resolved", "canceled"],
  waiting_on_vendor: ["triaged", "in_progress", "resolved", "canceled"],
  resolved: ["triaged", "closed"],
};

const residentTransitions: Record<string, string[]> = {
  resolved: ["closed", "triaged"],
};

interface StatusActionsProps {
  request: MaintenanceRequest;
  userRole: string;
}

export function StatusActions({ request, userRole }: StatusActionsProps) {
  const [showDialog, setShowDialog] = useState(false);
  const [targetStatus, setTargetStatus] = useState("");
  const [note, setNote] = useState("");
  const [loading, setLoading] = useState(false);
  const queryClient = useQueryClient();

  const isStaff = ["owner_admin", "staff"].includes(userRole);
  const transitions = isStaff
    ? staffTransitions[request.status_key] || []
    : residentTransitions[request.status_key] || [];

  if (transitions.length === 0) return null;

  const needsNote = ["waiting_on_resident", "resolved", "canceled"].includes(targetStatus);
  const noteLabel = targetStatus === "resolved" ? "Resolution summary" : targetStatus === "canceled" ? "Cancellation reason" : "Note for resident";

  const handleTransition = async () => {
    if (needsNote && !note.trim()) return;
    setLoading(true);
    try {
      await invokeFunction("transition-request", {
        request_id: request.id,
        to_status_key: targetStatus,
        ...(targetStatus === "resolved" ? { resolution_summary: note } : {}),
        ...(targetStatus === "canceled" ? { cancellation_reason: note } : {}),
        ...(targetStatus === "waiting_on_resident" ? { public_note: note } : {}),
        ...(targetStatus === "triaged" && userRole === "resident" ? { public_note: note || "Still not fixed" } : {}),
      });
      queryClient.invalidateQueries({ queryKey: ["request"] });
      queryClient.invalidateQueries({ queryKey: ["request-activity"] });
      queryClient.invalidateQueries({ queryKey: ["board-cards"] });
      setShowDialog(false);
      setNote("");
    } catch (err) {
      console.error("Transition failed:", err);
    } finally {
      setLoading(false);
    }
  };

  const quickTransitions = transitions.filter((t) => !["waiting_on_resident", "resolved", "canceled"].includes(t));
  const dialogTransitions = transitions.filter((t) => ["waiting_on_resident", "resolved", "canceled"].includes(t));
  // Resident reopen needs a note
  const residentReopen = !isStaff && transitions.includes("triaged");

  return (
    <div className="flex items-center gap-2 flex-wrap">
      {quickTransitions.map((t) => (
        <button
          key={t}
          onClick={() => {
            if (residentReopen && t === "triaged") {
              setTargetStatus(t);
              setShowDialog(true);
            } else {
              setTargetStatus(t);
              handleTransition();
            }
          }}
          className="px-3 py-1.5 text-xs font-medium border rounded-md hover:bg-accent transition-colors"
        >
          {t === "triaged" && !isStaff ? "Still Not Fixed" : transitionLabels[t] || t}
        </button>
      ))}
      {dialogTransitions.map((t) => (
        <button
          key={t}
          onClick={() => { setTargetStatus(t); setShowDialog(true); }}
          className={cn(
            "px-3 py-1.5 text-xs font-medium rounded-md transition-colors",
            t === "resolved" ? "bg-green-600 text-white hover:bg-green-700" :
            t === "canceled" ? "bg-destructive text-destructive-foreground hover:opacity-90" :
            "border hover:bg-accent",
          )}
        >
          {transitionLabels[t] || t}
        </button>
      ))}
      {!isStaff && transitions.includes("closed") && (
        <button
          onClick={() => { setTargetStatus("closed"); handleTransition(); }}
          className="px-3 py-1.5 text-xs font-medium bg-primary text-primary-foreground rounded-md hover:opacity-90"
        >
          Confirm Fixed
        </button>
      )}

      {/* Dialog for transitions that need a note */}
      {showDialog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-card rounded-lg p-6 w-full max-w-md space-y-4 shadow-xl">
            <h3 className="font-semibold">{transitionLabels[targetStatus] || targetStatus}</h3>
            <div>
              <label className="text-sm font-medium mb-1 block">{noteLabel}</label>
              <textarea
                value={note}
                onChange={(e) => setNote(e.target.value)}
                rows={3}
                className="w-full px-3 py-2 border rounded-md bg-background text-sm resize-none focus:outline-none focus:ring-2 focus:ring-primary"
                placeholder={needsNote ? "Required..." : "Optional note..."}
              />
            </div>
            <div className="flex justify-end gap-2">
              <button
                onClick={() => { setShowDialog(false); setNote(""); }}
                className="px-3 py-1.5 text-sm border rounded-md hover:bg-accent"
              >
                Cancel
              </button>
              <button
                onClick={handleTransition}
                disabled={loading || (needsNote && !note.trim())}
                className="px-3 py-1.5 text-sm bg-primary text-primary-foreground rounded-md hover:opacity-90 disabled:opacity-50"
              >
                {loading ? "Saving..." : "Confirm"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiGet, invokeFunction } from "../api/client";
import { cn } from "../lib/utils";
import {
  Users,
  Mail,
  Clock,
  UserPlus,
  X,
  Shield,
  Wrench,
  Home,
  Check,
  AlertCircle,
  Copy,
} from "lucide-react";

interface Profile {
  user_id: string;
  email: string;
  full_name: string;
  phone: string | null;
  role_key: string;
  is_active: boolean;
  created_at: string;
}

interface Invite {
  id: string;
  email: string;
  full_name: string;
  role_key: string;
  space_ids: string[] | null;
  created_at: string;
  accepted_at: string | null;
}

const roleIcons: Record<string, typeof Shield> = {
  owner_admin: Shield,
  staff: Wrench,
  resident: Home,
};

const roleStyles: Record<string, string> = {
  owner_admin: "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400",
  staff: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
  resident: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400",
};

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString();
}

export function PeoplePage() {
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState<"users" | "invites">("users");
  const [showInviteForm, setShowInviteForm] = useState(false);
  const [inviteForm, setInviteForm] = useState({
    email: "",
    full_name: "",
    role_key: "staff" as string,
    space_ids: "",
  });
  const [inviteError, setInviteError] = useState<string | null>(null);
  const [inviteResult, setInviteResult] = useState<{ email_sent: boolean; email_error?: string; claim_url?: string } | null>(null);

  const { data: profiles, isLoading: profilesLoading } = useQuery({
    queryKey: ["profiles-active"],
    queryFn: () => apiGet<Profile[]>("/rest/v1/profiles?is_active=eq.true&order=full_name.asc"),
  });

  const { data: invites, isLoading: invitesLoading } = useQuery({
    queryKey: ["invites-pending"],
    queryFn: () => apiGet<Invite[]>("/rest/v1/invites?accepted_at=is.null&order=created_at.desc"),
  });

  const sendInvite = useMutation({
    mutationFn: (data: { email: string; full_name: string; role_key: string; space_ids?: string[] }) =>
      invokeFunction<{ invites: Array<{ email_sent: boolean; email_error?: string; claim_url?: string }> }>("create-invites", {
        invites: [data],
      }),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["invites-pending"] });
      const result = data.invites?.[0];
      if (result) {
        setInviteResult(result);
      }
      setInviteForm({ email: "", full_name: "", role_key: "staff", space_ids: "" });
      setInviteError(null);
    },
    onError: (err: Error) => {
      setInviteError(err.message);
    },
  });

  const handleInviteSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setInviteError(null);
    const payload: { email: string; full_name: string; role_key: string; space_ids?: string[] } = {
      email: inviteForm.email,
      full_name: inviteForm.full_name,
      role_key: inviteForm.role_key,
    };
    if (inviteForm.space_ids.trim()) {
      payload.space_ids = inviteForm.space_ids.split(",").map((s) => s.trim()).filter(Boolean);
    }
    sendInvite.mutate(payload);
  };

  const tabs = [
    { key: "users" as const, label: "Active Users", count: profiles?.length || 0 },
    { key: "invites" as const, label: "Pending Invites", count: invites?.length || 0 },
  ];

  const isLoading = activeTab === "users" ? profilesLoading : invitesLoading;

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">People</h1>
        <button
          onClick={() => setShowInviteForm(true)}
          className="flex items-center gap-1.5 px-3 py-1.5 bg-primary text-primary-foreground rounded-md text-sm font-medium hover:opacity-90"
        >
          <UserPlus className="h-4 w-4" /> Invite
        </button>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 border-b">
        {tabs.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={cn(
              "px-4 py-2 text-sm font-medium border-b-2 -mb-px transition-colors",
              activeTab === tab.key
                ? "border-primary text-foreground"
                : "border-transparent text-muted-foreground hover:text-foreground"
            )}
          >
            {tab.label}
            {tab.count > 0 && (
              <span className="ml-1.5 text-xs bg-muted rounded-full px-1.5 py-0.5">{tab.count}</span>
            )}
          </button>
        ))}
      </div>

      {/* Invite result */}
      {inviteResult && (
        <div className={cn(
          "border rounded-lg p-4 flex items-start gap-3",
          inviteResult.email_sent
            ? "bg-green-50 border-green-200 dark:bg-green-900/10 dark:border-green-800"
            : "bg-amber-50 border-amber-200 dark:bg-amber-900/10 dark:border-amber-800"
        )}>
          {inviteResult.email_sent ? (
            <Check className="h-5 w-5 text-green-600 flex-shrink-0 mt-0.5" />
          ) : (
            <AlertCircle className="h-5 w-5 text-amber-600 flex-shrink-0 mt-0.5" />
          )}
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium">
              {inviteResult.email_sent
                ? "Invite email sent!"
                : "Invite created — email could not be sent"}
            </p>
            {inviteResult.email_error && (
              <p className="text-xs text-muted-foreground mt-0.5">{inviteResult.email_error}</p>
            )}
            {!inviteResult.email_sent && inviteResult.claim_url && (
              <div className="mt-2 flex items-center gap-2">
                <code className="text-xs bg-background border rounded px-2 py-1 truncate block">{inviteResult.claim_url}</code>
                <button
                  onClick={() => { navigator.clipboard.writeText(inviteResult.claim_url!); }}
                  className="flex-shrink-0 p-1 rounded hover:bg-background"
                  title="Copy link"
                >
                  <Copy className="h-3.5 w-3.5" />
                </button>
              </div>
            )}
          </div>
          <button onClick={() => setInviteResult(null)} className="text-muted-foreground hover:text-foreground flex-shrink-0">
            <X className="h-4 w-4" />
          </button>
        </div>
      )}

      {/* Invite form */}
      {showInviteForm && (
        <div className="bg-card border rounded-lg p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-semibold">Send Invite</h2>
            <button onClick={() => { setShowInviteForm(false); setInviteError(null); }} className="text-muted-foreground hover:text-foreground">
              <X className="h-4 w-4" />
            </button>
          </div>
          <p className="text-xs text-muted-foreground mb-3">An invite email will be sent to the address below.</p>
          <form onSubmit={handleInviteSubmit} className="space-y-3">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-medium text-muted-foreground">Email *</label>
                <input
                  required
                  type="email"
                  value={inviteForm.email}
                  onChange={(e) => setInviteForm((f) => ({ ...f, email: e.target.value }))}
                  className="mt-1 w-full rounded-md border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                  placeholder="user@example.com"
                />
              </div>
              <div>
                <label className="text-xs font-medium text-muted-foreground">Full Name *</label>
                <input
                  required
                  value={inviteForm.full_name}
                  onChange={(e) => setInviteForm((f) => ({ ...f, full_name: e.target.value }))}
                  className="mt-1 w-full rounded-md border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                />
              </div>
              <div>
                <label className="text-xs font-medium text-muted-foreground">Role *</label>
                <select
                  required
                  value={inviteForm.role_key}
                  onChange={(e) => setInviteForm((f) => ({ ...f, role_key: e.target.value }))}
                  className="mt-1 w-full rounded-md border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                >
                  <option value="staff">Staff</option>
                  <option value="resident">Resident</option>
                </select>
              </div>
              <div>
                <label className="text-xs font-medium text-muted-foreground">Space IDs (optional, comma-separated)</label>
                <input
                  value={inviteForm.space_ids}
                  onChange={(e) => setInviteForm((f) => ({ ...f, space_ids: e.target.value }))}
                  className="mt-1 w-full rounded-md border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                  placeholder="uuid1, uuid2"
                />
              </div>
            </div>
            {inviteError && (
              <p className="text-sm text-destructive">{inviteError}</p>
            )}
            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => { setShowInviteForm(false); setInviteError(null); }}
                className="px-3 py-1.5 text-sm rounded-md border hover:bg-muted"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={sendInvite.isPending}
                className="px-3 py-1.5 text-sm rounded-md bg-primary text-primary-foreground hover:opacity-90 disabled:opacity-50"
              >
                {sendInvite.isPending ? "Sending..." : "Send Invite"}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Loading skeleton */}
      {isLoading && (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-16 bg-muted animate-pulse rounded-lg" />
          ))}
        </div>
      )}

      {/* Active Users tab */}
      {activeTab === "users" && !profilesLoading && (
        <>
          {(!profiles || profiles.length === 0) && (
            <div className="text-center py-12">
              <Users className="h-10 w-10 text-muted-foreground/30 mx-auto mb-3" />
              <p className="text-muted-foreground">No active users</p>
            </div>
          )}
          <div className="space-y-2">
            {profiles?.map((p) => {
              const RoleIcon = roleIcons[p.role_key] || Users;
              return (
                <div key={p.user_id} className="flex items-center gap-3 p-4 bg-card border rounded-lg">
                  <div className="h-9 w-9 rounded-full bg-muted flex items-center justify-center flex-shrink-0">
                    <RoleIcon className="h-4 w-4 text-muted-foreground" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <h3 className="text-sm font-medium truncate">{p.full_name}</h3>
                    <p className="text-xs text-muted-foreground truncate flex items-center gap-1">
                      <Mail className="h-3 w-3" /> {p.email}
                    </p>
                  </div>
                  <span className={cn("text-[10px] font-medium px-2 py-0.5 rounded-full", roleStyles[p.role_key] || roleStyles.staff)}>
                    {p.role_key.replace("_", " ")}
                  </span>
                  <span className="text-xs text-muted-foreground hidden sm:block">
                    Joined {formatDate(p.created_at)}
                  </span>
                </div>
              );
            })}
          </div>
        </>
      )}

      {/* Pending Invites tab */}
      {activeTab === "invites" && !invitesLoading && (
        <>
          {(!invites || invites.length === 0) && (
            <div className="text-center py-12">
              <Mail className="h-10 w-10 text-muted-foreground/30 mx-auto mb-3" />
              <p className="text-muted-foreground">No pending invites</p>
              <button onClick={() => setShowInviteForm(true)} className="text-sm text-primary mt-2 hover:underline">
                Send an invite
              </button>
            </div>
          )}
          <div className="space-y-2">
            {invites?.map((inv) => (
              <div key={inv.id} className="flex items-center gap-3 p-4 bg-card border rounded-lg">
                <div className="h-9 w-9 rounded-full bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center flex-shrink-0">
                  <Clock className="h-4 w-4 text-amber-600 dark:text-amber-400" />
                </div>
                <div className="min-w-0 flex-1">
                  <h3 className="text-sm font-medium truncate">{inv.full_name}</h3>
                  <p className="text-xs text-muted-foreground truncate flex items-center gap-1">
                    <Mail className="h-3 w-3" /> {inv.email}
                  </p>
                </div>
                <span className={cn("text-[10px] font-medium px-2 py-0.5 rounded-full", roleStyles[inv.role_key] || roleStyles.staff)}>
                  {inv.role_key}
                </span>
                <span className="text-xs text-muted-foreground hidden sm:block">
                  Sent {formatDate(inv.created_at)}
                </span>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

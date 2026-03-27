import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { invokeFunction } from "../api/client";
import { cn } from "../lib/utils";
import { Send, Lock } from "lucide-react";
import { t } from "../lib/i18n";

interface CommentComposerProps {
  requestId: string;
  isStaff: boolean;
}

export function CommentComposer({ requestId, isStaff }: CommentComposerProps) {
  const [body, setBody] = useState("");
  const [visibility, setVisibility] = useState<"public" | "internal">("public");
  const [sending, setSending] = useState(false);
  const queryClient = useQueryClient();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!body.trim()) return;

    setSending(true);
    try {
      await invokeFunction("add-comment", {
        request_id: requestId,
        visibility,
        body: body.trim(),
      });
      setBody("");
      queryClient.invalidateQueries({ queryKey: ["request-activity", requestId] });
    } catch (err) {
      console.error("Failed to add comment:", err);
    } finally {
      setSending(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-2">
      <div className="relative">
        <textarea
          value={body}
          onChange={(e) => setBody(e.target.value)}
          placeholder={t("comment.placeholder")}
          rows={3}
          className="w-full px-3 py-2 border rounded-lg bg-background text-foreground resize-none focus:outline-none focus:ring-2 focus:ring-primary text-sm"
        />
      </div>

      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          {isStaff && (
            <div className="flex items-center gap-1 text-xs">
              <button
                type="button"
                onClick={() => setVisibility("public")}
                className={cn(
                  "px-2.5 py-1 rounded-md transition-colors",
                  visibility === "public" ? "bg-primary/10 text-primary font-medium" : "text-muted-foreground hover:bg-accent",
                )}
              >
                {t("comment.public")}
              </button>
              <button
                type="button"
                onClick={() => setVisibility("internal")}
                className={cn(
                  "px-2.5 py-1 rounded-md flex items-center gap-1 transition-colors",
                  visibility === "internal" ? "bg-amber-50 text-amber-700 dark:bg-amber-900/20 dark:text-amber-400 font-medium" : "text-muted-foreground hover:bg-accent",
                )}
              >
                <Lock className="h-3 w-3" /> {t("comment.internal")}
              </button>
            </div>
          )}
        </div>

        <button
          type="submit"
          disabled={!body.trim() || sending}
          className="flex items-center gap-1.5 px-3 py-1.5 bg-primary text-primary-foreground rounded-md text-sm font-medium hover:opacity-90 disabled:opacity-50 transition-opacity"
        >
          <Send className="h-3.5 w-3.5" />
          {sending ? t("comment.sending") : t("comment.send")}
        </button>
      </div>
    </form>
  );
}

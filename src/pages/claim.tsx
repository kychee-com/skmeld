import { useState } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { useAuth } from "../lib/auth";
import { invokeFunction } from "../api/client";
import { t } from "../lib/i18n";

export function ClaimPage() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get("token") || "";
  const { user, signup, login, refreshProfile } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState<"signup" | "claiming" | "done">("signup");

  const handleSignupAndClaim = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      if (!user) {
        await signup(email, password);
        await login(email, password);
      }
      setStep("claiming");
      await invokeFunction("redeem-invite", { token });
      await refreshProfile();
      setStep("done");
      setTimeout(() => navigate("/app", { replace: true }), 1500);
    } catch (err) {
      setError(err instanceof Error ? err.message : t("claim.failed"));
      setStep("signup");
    } finally {
      setLoading(false);
    }
  };

  if (!token) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-destructive">{t("claim.invalid_link")}</h1>
          <p className="text-muted-foreground mt-2">{t("claim.missing_token")}</p>
        </div>
      </div>
    );
  }

  if (step === "done") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-primary">{t("claim.welcome")}</h1>
          <p className="text-muted-foreground mt-2">{t("claim.redirect")}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <div className="w-full max-w-sm space-y-6">
        <div className="text-center">
          <h1 className="text-3xl font-bold text-primary">{t("claim.brand")}</h1>
          <p className="text-muted-foreground mt-1">
            {user ? t("claim.claiming") : t("claim.create_prompt")}
          </p>
        </div>

        {!user && (
          <form onSubmit={handleSignupAndClaim} className="space-y-4">
            {error && (
              <div className="bg-destructive/10 text-destructive text-sm p-3 rounded-md">{error}</div>
            )}

            <div>
              <label htmlFor="email" className="block text-sm font-medium mb-1">{t("auth.email_label")}</label>
              <input
                id="email"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-3 py-2 border rounded-md bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium mb-1">{t("auth.password_label")}</label>
              <input
                id="password"
                type="password"
                required
                minLength={8}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-3 py-2 border rounded-md bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-2 px-4 bg-primary text-primary-foreground rounded-md font-medium hover:opacity-90 disabled:opacity-50 transition-opacity"
            >
              {loading ? (step === "claiming" ? t("claim.setting_up") : t("claim.creating")) : t("claim.create_button")}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}

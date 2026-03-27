import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useAuth } from "../lib/auth";
import { t } from "../lib/i18n";

export function LoginPage() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [expiredNotice, setExpiredNotice] = useState(false);
  const [loading, setLoading] = useState(false);

  const redirect = searchParams.get("redirect") || "/app";

  // Show expired notice and clean URL param
  useEffect(() => {
    if (searchParams.get("expired") === "true") {
      setExpiredNotice(true);
      window.history.replaceState({}, "", "/login" + (redirect !== "/app" ? `?redirect=${redirect}` : ""));
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setExpiredNotice(false);
    setLoading(true);
    try {
      await login(email, password);
      navigate(redirect, { replace: true });
    } catch (err) {
      setError(err instanceof Error ? err.message : t("auth.login_failed"));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <div className="w-full max-w-sm space-y-6">
        <div className="text-center">
          <h1 className="text-3xl font-bold text-primary">{t("auth.brand")}</h1>
          <p className="text-muted-foreground mt-1">{t("auth.subtitle")}</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {expiredNotice && !error && (
            <div className="bg-amber-50 border border-amber-200 text-amber-800 text-sm p-3 rounded-md">
              {t("toast.session_expired")}
            </div>
          )}

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
              placeholder={t("auth.email_placeholder")}
            />
          </div>

          <div>
            <label htmlFor="password" className="block text-sm font-medium mb-1">{t("auth.password_label")}</label>
            <input
              id="password"
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-3 py-2 border rounded-md bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
              placeholder={t("auth.password_placeholder")}
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-2 px-4 bg-primary text-primary-foreground rounded-md font-medium hover:opacity-90 disabled:opacity-50 transition-opacity"
          >
            {loading ? t("auth.signing_in") : t("auth.sign_in")}
          </button>
        </form>
      </div>
    </div>
  );
}

import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiGet, apiPatch } from "../api/client";
import { cn } from "../lib/utils";
import { t, setLanguage, currentLanguage, brand } from "../lib/i18n";
import { Settings, Save, Check, Palette } from "lucide-react";

interface AppSettings {
  id: number;
  app_name: string;
  company_name: string;
  support_email: string;
  support_phone: string;
  emergency_instructions: string;
  time_zone: string;
  theme_key: string;
  allow_requester_priority_selection: boolean;
  show_pets_field: boolean;
  show_preferred_visit_window: boolean;
  show_entry_preference: boolean;
}

const themeOptions = [
  { key: "emerald", label: "Emerald", color: "bg-emerald-500" },
  { key: "blue", label: "Blue", color: "bg-blue-500" },
  { key: "indigo", label: "Indigo", color: "bg-indigo-500" },
  { key: "rose", label: "Rose", color: "bg-rose-500" },
  { key: "amber", label: "Amber", color: "bg-amber-500" },
];

export function SettingsPage() {
  const queryClient = useQueryClient();
  const [saved, setSaved] = useState(false);

  const { data: settingsArr, isLoading } = useQuery({
    queryKey: ["app-settings"],
    queryFn: () => apiGet<AppSettings[]>("/rest/v1/app_settings"),
  });

  const settings = settingsArr?.[0] || null;

  const [form, setForm] = useState<Partial<AppSettings>>({});

  useEffect(() => {
    if (settings) {
      setForm({
        app_name: settings.app_name,
        company_name: settings.company_name,
        support_email: settings.support_email,
        support_phone: settings.support_phone,
        emergency_instructions: settings.emergency_instructions,
        time_zone: settings.time_zone,
        theme_key: settings.theme_key,
        allow_requester_priority_selection: settings.allow_requester_priority_selection,
        show_pets_field: settings.show_pets_field,
        show_preferred_visit_window: settings.show_preferred_visit_window,
        show_entry_preference: settings.show_entry_preference,
      });
    }
  }, [settings]);

  const saveSettings = useMutation({
    mutationFn: (data: Partial<AppSettings>) =>
      apiPatch("/rest/v1/app_settings?id=eq.1", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["app-settings"] });
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    saveSettings.mutate(form);
  };

  const updateField = <K extends keyof AppSettings>(key: K, value: AppSettings[K]) => {
    setForm((f) => ({ ...f, [key]: value }));
  };

  if (isLoading) {
    return (
      <div className="p-6 space-y-4">
        <div className="h-8 w-48 bg-muted animate-pulse rounded" />
        <div className="h-64 bg-muted animate-pulse rounded-lg" />
        <div className="h-48 bg-muted animate-pulse rounded-lg" />
      </div>
    );
  }

  if (!settings) {
    return (
      <div className="p-6">
        <h1 className="text-2xl font-bold">{t("settings.heading")}</h1>
        <div className="text-center py-12">
          <Settings className="h-10 w-10 text-muted-foreground/30 mx-auto mb-3" />
          <p className="text-muted-foreground">{t("settings.no_settings")}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">{t("settings.heading")}</h1>
        {saved && (
          <span className="flex items-center gap-1 text-sm text-green-600 dark:text-green-400">
            <Check className="h-4 w-4" /> {t("settings.saved")}
          </span>
        )}
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* General settings */}
        <div className="bg-card border rounded-lg p-5 space-y-4">
          <h2 className="text-sm font-semibold">{t("settings.general")}</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-medium text-muted-foreground">{t("settings.app_name")}</label>
              <input
                value={form.app_name || ""}
                onChange={(e) => updateField("app_name", e.target.value)}
                className="mt-1 w-full rounded-md border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
              />
            </div>
            <div>
              <label className="text-xs font-medium text-muted-foreground">{t("settings.company_name")}</label>
              <input
                value={form.company_name || ""}
                onChange={(e) => updateField("company_name", e.target.value)}
                className="mt-1 w-full rounded-md border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
              />
            </div>
            <div>
              <label className="text-xs font-medium text-muted-foreground">{t("settings.support_email")}</label>
              <input
                type="email"
                value={form.support_email || ""}
                onChange={(e) => updateField("support_email", e.target.value)}
                className="mt-1 w-full rounded-md border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
              />
            </div>
            <div>
              <label className="text-xs font-medium text-muted-foreground">{t("settings.support_phone")}</label>
              <input
                type="tel"
                value={form.support_phone || ""}
                onChange={(e) => updateField("support_phone", e.target.value)}
                className="mt-1 w-full rounded-md border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
              />
            </div>
            <div>
              <label className="text-xs font-medium text-muted-foreground">{t("settings.time_zone")}</label>
              <input
                value={form.time_zone || ""}
                onChange={(e) => updateField("time_zone", e.target.value)}
                className="mt-1 w-full rounded-md border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                placeholder={t("settings.time_zone_placeholder")}
              />
            </div>
            <div className="sm:col-span-2">
              <label className="text-xs font-medium text-muted-foreground">{t("settings.emergency_label")}</label>
              <textarea
                value={form.emergency_instructions || ""}
                onChange={(e) => updateField("emergency_instructions", e.target.value)}
                rows={3}
                className="mt-1 w-full rounded-md border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring resize-none"
                placeholder={t("settings.emergency_placeholder")}
              />
            </div>
          </div>
        </div>

        {/* Theme */}
        <div className="bg-card border rounded-lg p-5 space-y-4">
          <div className="flex items-center gap-2">
            <Palette className="h-4 w-4 text-muted-foreground" />
            <h2 className="text-sm font-semibold">{t("settings.theme")}</h2>
          </div>
          <div className="flex flex-wrap gap-3">
            {themeOptions.map((theme) => (
              <button
                key={theme.key}
                type="button"
                onClick={() => updateField("theme_key", theme.key)}
                className={cn(
                  "flex items-center gap-2 px-3 py-2 rounded-lg border text-sm transition-colors",
                  form.theme_key === theme.key
                    ? "border-primary bg-primary/5 ring-2 ring-ring"
                    : "hover:bg-muted"
                )}
              >
                <div className={cn("h-4 w-4 rounded-full", theme.color)} />
                {theme.label}
              </button>
            ))}
          </div>
        </div>

        {/* Language picker — only when multiple languages configured */}
        {brand.languages.length > 1 && (
          <div className="bg-card border rounded-lg p-5 space-y-4">
            <h2 className="text-sm font-semibold">{t("settings.language")}</h2>
            <div className="flex flex-wrap gap-2">
              {brand.languages.map((locale) => (
                <button
                  key={locale}
                  type="button"
                  onClick={() => setLanguage(locale)}
                  className={cn(
                    "px-3 py-2 rounded-lg border text-sm transition-colors",
                    currentLanguage() === locale
                      ? "border-primary bg-primary/5 ring-2 ring-ring"
                      : "hover:bg-muted"
                  )}
                >
                  {locale.toUpperCase()}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Intake form toggles */}
        <div className="bg-card border rounded-lg p-5 space-y-4">
          <h2 className="text-sm font-semibold">{t("settings.intake_heading")}</h2>
          <p className="text-xs text-muted-foreground">
            {t("settings.intake_description")}
          </p>
          <div className="space-y-3">
            <ToggleRow
              label={t("settings.toggle_priority")}
              description={t("settings.toggle_priority_desc")}
              checked={form.allow_requester_priority_selection ?? false}
              onChange={(v) => updateField("allow_requester_priority_selection", v)}
            />
            <ToggleRow
              label={t("settings.toggle_pets")}
              description={t("settings.toggle_pets_desc")}
              checked={form.show_pets_field ?? false}
              onChange={(v) => updateField("show_pets_field", v)}
            />
            <ToggleRow
              label={t("settings.toggle_visit")}
              description={t("settings.toggle_visit_desc")}
              checked={form.show_preferred_visit_window ?? false}
              onChange={(v) => updateField("show_preferred_visit_window", v)}
            />
            <ToggleRow
              label={t("settings.toggle_entry")}
              description={t("settings.toggle_entry_desc")}
              checked={form.show_entry_preference ?? false}
              onChange={(v) => updateField("show_entry_preference", v)}
            />
          </div>
        </div>

        {/* Save button */}
        <div className="flex justify-end">
          <button
            type="submit"
            disabled={saveSettings.isPending}
            className="flex items-center gap-1.5 px-4 py-2 bg-primary text-primary-foreground rounded-md text-sm font-medium hover:opacity-90 disabled:opacity-50"
          >
            <Save className="h-4 w-4" />
            {saveSettings.isPending ? t("settings.saving") : t("settings.save")}
          </button>
        </div>
      </form>
    </div>
  );
}

function ToggleRow({
  label,
  description,
  checked,
  onChange,
}: {
  label: string;
  description: string;
  checked: boolean;
  onChange: (value: boolean) => void;
}) {
  return (
    <div className="flex items-start justify-between gap-4">
      <div>
        <p className="text-sm font-medium">{label}</p>
        <p className="text-xs text-muted-foreground">{description}</p>
      </div>
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        onClick={() => onChange(!checked)}
        className={cn(
          "relative inline-flex h-5 w-9 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors",
          checked ? "bg-primary" : "bg-muted"
        )}
      >
        <span
          className={cn(
            "pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform",
            checked ? "translate-x-4" : "translate-x-0"
          )}
        />
      </button>
    </div>
  );
}

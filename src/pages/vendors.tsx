import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiGet, apiPost, apiPatch } from "../api/client";
import { cn } from "../lib/utils";
import { t } from "../lib/i18n";
import {
  Truck,
  Plus,
  Pencil,
  X,
  Mail,
  Phone,
  User,
  ToggleLeft,
  ToggleRight,
} from "lucide-react";

interface Vendor {
  id: string;
  name: string;
  primary_contact_name: string | null;
  email: string | null;
  phone: string | null;
  trade_category_key: string | null;
  notes: string | null;
  is_active: boolean;
}

type VendorFormData = {
  name: string;
  primary_contact_name: string;
  email: string;
  phone: string;
  trade_category_key: string;
  notes: string;
};

const emptyForm: VendorFormData = {
  name: "",
  primary_contact_name: "",
  email: "",
  phone: "",
  trade_category_key: "",
  notes: "",
};

const tradeCategories = [
  { key: "plumbing", label: "Plumbing" },
  { key: "electrical", label: "Electrical" },
  { key: "hvac", label: "HVAC" },
  { key: "general", label: "General Maintenance" },
  { key: "painting", label: "Painting" },
  { key: "landscaping", label: "Landscaping" },
  { key: "cleaning", label: "Cleaning" },
  { key: "pest_control", label: "Pest Control" },
  { key: "appliance", label: "Appliance Repair" },
  { key: "roofing", label: "Roofing" },
  { key: "flooring", label: "Flooring" },
  { key: "locksmith", label: "Locksmith" },
  { key: "other", label: "Other" },
];

export function VendorsPage() {
  const queryClient = useQueryClient();
  const [showForm, setShowForm] = useState(false);
  const [editingVendor, setEditingVendor] = useState<Vendor | null>(null);
  const [form, setForm] = useState<VendorFormData>(emptyForm);

  const { data: vendors, isLoading } = useQuery({
    queryKey: ["vendors"],
    queryFn: () => apiGet<Vendor[]>("/rest/v1/vendors?order=name.asc"),
  });

  const invalidate = () => queryClient.invalidateQueries({ queryKey: ["vendors"] });

  const createVendor = useMutation({
    mutationFn: (data: VendorFormData) => apiPost("/rest/v1/vendors", data),
    onSuccess: () => {
      invalidate();
      closeForm();
    },
  });

  const updateVendor = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<VendorFormData> }) =>
      apiPatch(`/rest/v1/vendors?id=eq.${id}`, data),
    onSuccess: () => {
      invalidate();
      closeForm();
    },
  });

  const toggleActive = useMutation({
    mutationFn: ({ id, is_active }: { id: string; is_active: boolean }) =>
      apiPatch(`/rest/v1/vendors?id=eq.${id}`, { is_active }),
    onSuccess: invalidate,
  });

  const openAdd = () => {
    setEditingVendor(null);
    setForm(emptyForm);
    setShowForm(true);
  };

  const openEdit = (v: Vendor) => {
    setEditingVendor(v);
    setForm({
      name: v.name,
      primary_contact_name: v.primary_contact_name || "",
      email: v.email || "",
      phone: v.phone || "",
      trade_category_key: v.trade_category_key || "",
      notes: v.notes || "",
    });
    setShowForm(true);
  };

  const closeForm = () => {
    setShowForm(false);
    setEditingVendor(null);
    setForm(emptyForm);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingVendor) {
      updateVendor.mutate({ id: editingVendor.id, data: form });
    } else {
      createVendor.mutate(form);
    }
  };

  const tradeCategoryLabel = (key: string | null) =>
    tradeCategories.find((c) => c.key === key)?.label || key || "";

  if (isLoading) {
    return (
      <div className="p-6 space-y-3">
        <div className="h-8 w-48 bg-muted animate-pulse rounded" />
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-20 bg-muted animate-pulse rounded-lg" />
        ))}
      </div>
    );
  }

  const activeVendors = vendors?.filter((v) => v.is_active) || [];
  const inactiveVendors = vendors?.filter((v) => !v.is_active) || [];

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">{t("vendors.heading")}</h1>
        <button
          onClick={openAdd}
          className="flex items-center gap-1.5 px-3 py-1.5 bg-primary text-primary-foreground rounded-md text-sm font-medium hover:opacity-90"
        >
          <Plus className="h-4 w-4" /> {t("vendors.add")}
        </button>
      </div>

      {/* Vendor form */}
      {showForm && (
        <div className="bg-card border rounded-lg p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-semibold">
              {editingVendor ? t("vendors.edit") : t("vendors.new")}
            </h2>
            <button onClick={closeForm} className="text-muted-foreground hover:text-foreground">
              <X className="h-4 w-4" />
            </button>
          </div>
          <form onSubmit={handleSubmit} className="space-y-3">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-medium text-muted-foreground">{t("vendors.company_name_label")}</label>
                <input
                  required
                  value={form.name}
                  onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                  className="mt-1 w-full rounded-md border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                />
              </div>
              <div>
                <label className="text-xs font-medium text-muted-foreground">{t("vendors.primary_contact_label")}</label>
                <input
                  value={form.primary_contact_name}
                  onChange={(e) => setForm((f) => ({ ...f, primary_contact_name: e.target.value }))}
                  className="mt-1 w-full rounded-md border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                />
              </div>
              <div>
                <label className="text-xs font-medium text-muted-foreground">{t("vendors.email_label")}</label>
                <input
                  type="email"
                  value={form.email}
                  onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
                  className="mt-1 w-full rounded-md border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                />
              </div>
              <div>
                <label className="text-xs font-medium text-muted-foreground">{t("vendors.phone_label")}</label>
                <input
                  type="tel"
                  value={form.phone}
                  onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))}
                  className="mt-1 w-full rounded-md border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                />
              </div>
              <div>
                <label className="text-xs font-medium text-muted-foreground">{t("vendors.trade_label")}</label>
                <select
                  value={form.trade_category_key}
                  onChange={(e) => setForm((f) => ({ ...f, trade_category_key: e.target.value }))}
                  className="mt-1 w-full rounded-md border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                >
                  <option value="">{t("vendors.trade_placeholder")}</option>
                  {tradeCategories.map((c) => (
                    <option key={c.key} value={c.key}>{c.label}</option>
                  ))}
                </select>
              </div>
              <div className="sm:col-span-2">
                <label className="text-xs font-medium text-muted-foreground">{t("vendors.notes_label")}</label>
                <textarea
                  value={form.notes}
                  onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))}
                  rows={3}
                  className="mt-1 w-full rounded-md border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring resize-none"
                />
              </div>
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={closeForm}
                className="px-3 py-1.5 text-sm rounded-md border hover:bg-muted"
              >
                {t("vendors.cancel")}
              </button>
              <button
                type="submit"
                disabled={createVendor.isPending || updateVendor.isPending}
                className="px-3 py-1.5 text-sm rounded-md bg-primary text-primary-foreground hover:opacity-90 disabled:opacity-50"
              >
                {editingVendor ? t("vendors.save_changes") : t("vendors.add_button")}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Empty state */}
      {activeVendors.length === 0 && inactiveVendors.length === 0 && !showForm && (
        <div className="text-center py-12">
          <Truck className="h-10 w-10 text-muted-foreground/30 mx-auto mb-3" />
          <p className="text-muted-foreground">{t("vendors.no_vendors")}</p>
          <button onClick={openAdd} className="text-sm text-primary mt-2 hover:underline">
            {t("vendors.add_first")}
          </button>
        </div>
      )}

      {/* Active vendors */}
      {activeVendors.length > 0 && (
        <div className="space-y-2">
          {activeVendors.map((vendor) => (
            <div key={vendor.id} className="bg-card border rounded-lg p-4">
              <div className="flex items-start gap-3">
                <div className="h-9 w-9 rounded-full bg-muted flex items-center justify-center flex-shrink-0 mt-0.5">
                  <Truck className="h-4 w-4 text-muted-foreground" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="text-sm font-medium">{vendor.name}</h3>
                    {vendor.trade_category_key && (
                      <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400">
                        {tradeCategoryLabel(vendor.trade_category_key)}
                      </span>
                    )}
                  </div>
                  <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
                    {vendor.primary_contact_name && (
                      <span className="flex items-center gap-1">
                        <User className="h-3 w-3" /> {vendor.primary_contact_name}
                      </span>
                    )}
                    {vendor.email && (
                      <span className="flex items-center gap-1">
                        <Mail className="h-3 w-3" /> {vendor.email}
                      </span>
                    )}
                    {vendor.phone && (
                      <span className="flex items-center gap-1">
                        <Phone className="h-3 w-3" /> {vendor.phone}
                      </span>
                    )}
                  </div>
                  {vendor.notes && (
                    <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{vendor.notes}</p>
                  )}
                </div>
                <div className="flex items-center gap-1 flex-shrink-0">
                  <button onClick={() => openEdit(vendor)} className="text-muted-foreground hover:text-foreground p-1">
                    <Pencil className="h-3.5 w-3.5" />
                  </button>
                  <button
                    onClick={() => toggleActive.mutate({ id: vendor.id, is_active: false })}
                    className="text-muted-foreground hover:text-amber-600 p-1"
                    title="Deactivate"
                  >
                    <ToggleRight className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Inactive vendors */}
      {inactiveVendors.length > 0 && (
        <div>
          <h2 className="text-sm font-semibold text-muted-foreground mb-2">{t("vendors.inactive")}</h2>
          <div className="space-y-2">
            {inactiveVendors.map((vendor) => (
              <div key={vendor.id} className="bg-card border rounded-lg p-4 opacity-60">
                <div className="flex items-center gap-3">
                  <div className="h-9 w-9 rounded-full bg-muted flex items-center justify-center flex-shrink-0">
                    <Truck className="h-4 w-4 text-muted-foreground" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <h3 className="text-sm font-medium">{vendor.name}</h3>
                    {vendor.trade_category_key && (
                      <span className="text-xs text-muted-foreground">{tradeCategoryLabel(vendor.trade_category_key)}</span>
                    )}
                  </div>
                  <button
                    onClick={() => toggleActive.mutate({ id: vendor.id, is_active: true })}
                    className="text-muted-foreground hover:text-green-600 p-1"
                    title="Reactivate"
                  >
                    <ToggleLeft className="h-4 w-4" />
                  </button>
                  <button onClick={() => openEdit(vendor)} className="text-muted-foreground hover:text-foreground p-1">
                    <Pencil className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiGet, apiPost, apiPatch } from "../api/client";
import { cn } from "../lib/utils";
import {
  Building2,
  ChevronDown,
  ChevronRight,
  Plus,
  Pencil,
  Archive,
  X,
  Layers,
} from "lucide-react";
import { t } from "../lib/i18n";

interface Property {
  id: string;
  name: string;
  code: string;
  street_1: string | null;
  city: string | null;
  state: string | null;
  postal_code: string | null;
  is_active: boolean;
}

interface Space {
  id: string;
  property_id: string;
  name: string;
  code: string;
  space_type_key: string;
  floor: number | null;
  is_active: boolean;
}

interface SpaceType {
  key: string;
  label: string;
}

type PropertyFormData = {
  name: string;
  code: string;
  street_1: string;
  city: string;
  state: string;
  postal_code: string;
};

type SpaceFormData = {
  name: string;
  code: string;
  space_type_key: string;
  floor: string;
};

const emptyPropertyForm: PropertyFormData = {
  name: "",
  code: "",
  street_1: "",
  city: "",
  state: "",
  postal_code: "",
};

const emptySpaceForm: SpaceFormData = {
  name: "",
  code: "",
  space_type_key: "",
  floor: "",
};

export function PropertiesPage() {
  const queryClient = useQueryClient();
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set());
  const [editingProperty, setEditingProperty] = useState<Property | null>(null);
  const [showPropertyForm, setShowPropertyForm] = useState(false);
  const [propertyForm, setPropertyForm] = useState<PropertyFormData>(emptyPropertyForm);

  const [editingSpace, setEditingSpace] = useState<Space | null>(null);
  const [showSpaceFormFor, setShowSpaceFormFor] = useState<string | null>(null);
  const [spaceForm, setSpaceForm] = useState<SpaceFormData>(emptySpaceForm);

  const { data: properties, isLoading } = useQuery({
    queryKey: ["properties"],
    queryFn: () => apiGet<Property[]>("/rest/v1/properties?order=name.asc"),
  });

  const { data: spaces } = useQuery({
    queryKey: ["spaces"],
    queryFn: () => apiGet<Space[]>("/rest/v1/spaces?order=name.asc"),
  });

  const { data: spaceTypes } = useQuery({
    queryKey: ["space-types"],
    queryFn: () => apiGet<SpaceType[]>("/rest/v1/space_types?order=label.asc"),
    staleTime: 60_000,
  });

  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: ["properties"] });
    queryClient.invalidateQueries({ queryKey: ["spaces"] });
  };

  const createProperty = useMutation({
    mutationFn: (data: PropertyFormData) =>
      apiPost("/rest/v1/properties", data),
    onSuccess: () => {
      invalidate();
      closePropertyForm();
    },
  });

  const updateProperty = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<PropertyFormData> }) =>
      apiPatch(`/rest/v1/properties?id=eq.${id}`, data),
    onSuccess: () => {
      invalidate();
      closePropertyForm();
    },
  });

  const archiveProperty = useMutation({
    mutationFn: (id: string) =>
      apiPatch(`/rest/v1/properties?id=eq.${id}`, { is_active: false }),
    onSuccess: invalidate,
  });

  const createSpace = useMutation({
    mutationFn: (data: { name: string; code: string; space_type_key: string; floor: number | null; property_id: string }) =>
      apiPost("/rest/v1/spaces", data),
    onSuccess: () => {
      invalidate();
      closeSpaceForm();
    },
  });

  const updateSpace = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<{ name: string; code: string; space_type_key: string; floor: number | null }> }) =>
      apiPatch(`/rest/v1/spaces?id=eq.${id}`, data),
    onSuccess: () => {
      invalidate();
      closeSpaceForm();
    },
  });

  const archiveSpace = useMutation({
    mutationFn: (id: string) =>
      apiPatch(`/rest/v1/spaces?id=eq.${id}`, { is_active: false }),
    onSuccess: invalidate,
  });

  const toggleExpand = (id: string) => {
    setExpandedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const openAddProperty = () => {
    setEditingProperty(null);
    setPropertyForm(emptyPropertyForm);
    setShowPropertyForm(true);
  };

  const openEditProperty = (p: Property) => {
    setEditingProperty(p);
    setPropertyForm({
      name: p.name,
      code: p.code,
      street_1: p.street_1 || "",
      city: p.city || "",
      state: p.state || "",
      postal_code: p.postal_code || "",
    });
    setShowPropertyForm(true);
  };

  const closePropertyForm = () => {
    setShowPropertyForm(false);
    setEditingProperty(null);
    setPropertyForm(emptyPropertyForm);
  };

  const handlePropertySubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingProperty) {
      updateProperty.mutate({ id: editingProperty.id, data: propertyForm });
    } else {
      createProperty.mutate(propertyForm);
    }
  };

  const openAddSpace = (propertyId: string) => {
    setEditingSpace(null);
    setSpaceForm(emptySpaceForm);
    setShowSpaceFormFor(propertyId);
  };

  const openEditSpace = (s: Space) => {
    setEditingSpace(s);
    setSpaceForm({
      name: s.name,
      code: s.code,
      space_type_key: s.space_type_key,
      floor: s.floor != null ? String(s.floor) : "",
    });
    setShowSpaceFormFor(s.property_id);
  };

  const closeSpaceForm = () => {
    setShowSpaceFormFor(null);
    setEditingSpace(null);
    setSpaceForm(emptySpaceForm);
  };

  const handleSpaceSubmit = (e: React.FormEvent, propertyId: string) => {
    e.preventDefault();
    const payload = {
      name: spaceForm.name,
      code: spaceForm.code,
      space_type_key: spaceForm.space_type_key,
      floor: spaceForm.floor ? parseInt(spaceForm.floor, 10) : null,
    };
    if (editingSpace) {
      updateSpace.mutate({ id: editingSpace.id, data: payload });
    } else {
      createSpace.mutate({ ...payload, property_id: propertyId });
    }
  };

  const spaceTypeLabel = (key: string) =>
    spaceTypes?.find((st) => st.key === key)?.label || key;

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

  const activeProperties = properties?.filter((p) => p.is_active) || [];
  const archivedProperties = properties?.filter((p) => !p.is_active) || [];

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">{t("properties.heading")}</h1>
        <button
          onClick={openAddProperty}
          className="flex items-center gap-1.5 px-3 py-1.5 bg-primary text-primary-foreground rounded-md text-sm font-medium hover:opacity-90"
        >
          <Plus className="h-4 w-4" /> {t("properties.add")}
        </button>
      </div>

      {/* Property form modal */}
      {showPropertyForm && (
        <div className="bg-card border rounded-lg p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-semibold">
              {editingProperty ? t("properties.edit") : t("properties.new")}
            </h2>
            <button onClick={closePropertyForm} className="text-muted-foreground hover:text-foreground">
              <X className="h-4 w-4" />
            </button>
          </div>
          <form onSubmit={handlePropertySubmit} className="space-y-3">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-medium text-muted-foreground">{t("properties.name_label")}</label>
                <input
                  required
                  value={propertyForm.name}
                  onChange={(e) => setPropertyForm((f) => ({ ...f, name: e.target.value }))}
                  className="mt-1 w-full rounded-md border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                />
              </div>
              <div>
                <label className="text-xs font-medium text-muted-foreground">{t("properties.code_label")}</label>
                <input
                  required
                  value={propertyForm.code}
                  onChange={(e) => setPropertyForm((f) => ({ ...f, code: e.target.value }))}
                  className="mt-1 w-full rounded-md border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                  placeholder={t("properties.code_placeholder")}
                />
              </div>
              <div className="sm:col-span-2">
                <label className="text-xs font-medium text-muted-foreground">{t("properties.street_label")}</label>
                <input
                  value={propertyForm.street_1}
                  onChange={(e) => setPropertyForm((f) => ({ ...f, street_1: e.target.value }))}
                  className="mt-1 w-full rounded-md border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                />
              </div>
              <div>
                <label className="text-xs font-medium text-muted-foreground">{t("properties.city_label")}</label>
                <input
                  value={propertyForm.city}
                  onChange={(e) => setPropertyForm((f) => ({ ...f, city: e.target.value }))}
                  className="mt-1 w-full rounded-md border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-medium text-muted-foreground">{t("properties.state_label")}</label>
                  <input
                    value={propertyForm.state}
                    onChange={(e) => setPropertyForm((f) => ({ ...f, state: e.target.value }))}
                    className="mt-1 w-full rounded-md border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                  />
                </div>
                <div>
                  <label className="text-xs font-medium text-muted-foreground">{t("properties.postal_label")}</label>
                  <input
                    value={propertyForm.postal_code}
                    onChange={(e) => setPropertyForm((f) => ({ ...f, postal_code: e.target.value }))}
                    className="mt-1 w-full rounded-md border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                  />
                </div>
              </div>
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={closePropertyForm}
                className="px-3 py-1.5 text-sm rounded-md border hover:bg-muted"
              >
                {t("properties.cancel")}
              </button>
              <button
                type="submit"
                disabled={createProperty.isPending || updateProperty.isPending}
                className="px-3 py-1.5 text-sm rounded-md bg-primary text-primary-foreground hover:opacity-90 disabled:opacity-50"
              >
                {editingProperty ? t("properties.save_changes") : t("properties.create")}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Empty state */}
      {activeProperties.length === 0 && !showPropertyForm && (
        <div className="text-center py-12">
          <Building2 className="h-10 w-10 text-muted-foreground/30 mx-auto mb-3" />
          <p className="text-muted-foreground">{t("properties.no_properties")}</p>
          <button onClick={openAddProperty} className="text-sm text-primary mt-2 hover:underline">
            {t("properties.add_first")}
          </button>
        </div>
      )}

      {/* Active properties */}
      <div className="space-y-2">
        {activeProperties.map((prop) => {
          const isExpanded = expandedIds.has(prop.id);
          const propSpaces = spaces?.filter((s) => s.property_id === prop.id && s.is_active) || [];

          return (
            <div key={prop.id} className="bg-card border rounded-lg overflow-hidden">
              {/* Property header */}
              <div className="flex items-center gap-3 p-4">
                <button onClick={() => toggleExpand(prop.id)} className="text-muted-foreground hover:text-foreground">
                  {isExpanded ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                </button>
                <Building2 className="h-5 w-5 text-muted-foreground flex-shrink-0" />
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <h3 className="text-sm font-medium truncate">{prop.name}</h3>
                    <span className="text-xs text-muted-foreground font-mono">{prop.code}</span>
                  </div>
                  {(prop.city || prop.state) && (
                    <p className="text-xs text-muted-foreground truncate">
                      {[prop.street_1, prop.city, prop.state, prop.postal_code].filter(Boolean).join(", ")}
                    </p>
                  )}
                </div>
                <span className="text-xs text-muted-foreground">{t("properties.spaces_count", { count: propSpaces.length })}</span>
                <button onClick={() => openEditProperty(prop)} className="text-muted-foreground hover:text-foreground p-1">
                  <Pencil className="h-3.5 w-3.5" />
                </button>
                <button
                  onClick={() => { if (confirm(t("properties.archive_confirm"))) archiveProperty.mutate(prop.id); }}
                  className="text-muted-foreground hover:text-destructive p-1"
                >
                  <Archive className="h-3.5 w-3.5" />
                </button>
              </div>

              {/* Expanded spaces */}
              {isExpanded && (
                <div className="border-t px-4 pb-4 pt-3 space-y-2">
                  {propSpaces.length === 0 && showSpaceFormFor !== prop.id && (
                    <p className="text-xs text-muted-foreground py-2">{t("properties.no_spaces")}</p>
                  )}

                  {propSpaces.map((space) => (
                    <div
                      key={space.id}
                      className="flex items-center gap-3 px-3 py-2 bg-muted/30 rounded-md text-sm"
                    >
                      <Layers className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                      <div className="min-w-0 flex-1">
                        <span className="font-medium">{space.name}</span>
                        <span className="text-muted-foreground ml-2 text-xs font-mono">{space.code}</span>
                      </div>
                      <span className="text-xs text-muted-foreground">{spaceTypeLabel(space.space_type_key)}</span>
                      {space.floor != null && (
                        <span className="text-xs text-muted-foreground">{t("properties.floor", { floor: String(space.floor) })}</span>
                      )}
                      <button onClick={() => openEditSpace(space)} className="text-muted-foreground hover:text-foreground p-1">
                        <Pencil className="h-3 w-3" />
                      </button>
                      <button
                        onClick={() => { if (confirm(t("properties.archive_space_confirm"))) archiveSpace.mutate(space.id); }}
                        className="text-muted-foreground hover:text-destructive p-1"
                      >
                        <Archive className="h-3 w-3" />
                      </button>
                    </div>
                  ))}

                  {/* Space form */}
                  {showSpaceFormFor === prop.id ? (
                    <form
                      onSubmit={(e) => handleSpaceSubmit(e, prop.id)}
                      className="bg-muted/20 border rounded-md p-3 space-y-3"
                    >
                      <div className="flex items-center justify-between">
                        <h4 className="text-xs font-semibold">{editingSpace ? t("properties.edit_space") : t("properties.new_space")}</h4>
                        <button type="button" onClick={closeSpaceForm} className="text-muted-foreground hover:text-foreground">
                          <X className="h-3.5 w-3.5" />
                        </button>
                      </div>
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="text-xs font-medium text-muted-foreground">{t("properties.space_name_label")}</label>
                          <input
                            required
                            value={spaceForm.name}
                            onChange={(e) => setSpaceForm((f) => ({ ...f, name: e.target.value }))}
                            className="mt-1 w-full rounded-md border bg-background px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                          />
                        </div>
                        <div>
                          <label className="text-xs font-medium text-muted-foreground">{t("properties.space_code_label")}</label>
                          <input
                            required
                            value={spaceForm.code}
                            onChange={(e) => setSpaceForm((f) => ({ ...f, code: e.target.value }))}
                            className="mt-1 w-full rounded-md border bg-background px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                            placeholder={t("properties.space_code_placeholder")}
                          />
                        </div>
                        <div>
                          <label className="text-xs font-medium text-muted-foreground">{t("properties.space_type_label")}</label>
                          <select
                            required
                            value={spaceForm.space_type_key}
                            onChange={(e) => setSpaceForm((f) => ({ ...f, space_type_key: e.target.value }))}
                            className="mt-1 w-full rounded-md border bg-background px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                          >
                            <option value="">{t("properties.space_type_placeholder")}</option>
                            {spaceTypes?.map((st) => (
                              <option key={st.key} value={st.key}>{st.label}</option>
                            ))}
                          </select>
                        </div>
                        <div>
                          <label className="text-xs font-medium text-muted-foreground">{t("properties.space_floor_label")}</label>
                          <input
                            type="number"
                            value={spaceForm.floor}
                            onChange={(e) => setSpaceForm((f) => ({ ...f, floor: e.target.value }))}
                            className="mt-1 w-full rounded-md border bg-background px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                          />
                        </div>
                      </div>
                      <div className="flex justify-end gap-2">
                        <button
                          type="button"
                          onClick={closeSpaceForm}
                          className="px-3 py-1 text-xs rounded-md border hover:bg-muted"
                        >
                          {t("properties.cancel")}
                        </button>
                        <button
                          type="submit"
                          disabled={createSpace.isPending || updateSpace.isPending}
                          className="px-3 py-1 text-xs rounded-md bg-primary text-primary-foreground hover:opacity-90 disabled:opacity-50"
                        >
                          {editingSpace ? t("properties.space_save") : t("properties.space_add")}
                        </button>
                      </div>
                    </form>
                  ) : (
                    <button
                      onClick={() => openAddSpace(prop.id)}
                      className="flex items-center gap-1.5 text-xs text-primary hover:underline pt-1"
                    >
                      <Plus className="h-3 w-3" /> {t("properties.add_space")}
                    </button>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Archived properties */}
      {archivedProperties.length > 0 && (
        <div>
          <h2 className="text-sm font-semibold text-muted-foreground mb-2">{t("properties.archived")}</h2>
          <div className="space-y-2">
            {archivedProperties.map((prop) => (
              <div key={prop.id} className="flex items-center gap-3 p-4 bg-card border rounded-lg opacity-60">
                <Building2 className="h-5 w-5 text-muted-foreground flex-shrink-0" />
                <div className="min-w-0 flex-1">
                  <span className="text-sm font-medium">{prop.name}</span>
                  <span className="text-xs text-muted-foreground ml-2 font-mono">{prop.code}</span>
                </div>
                <span className="text-xs text-muted-foreground">{t("properties.archived")}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

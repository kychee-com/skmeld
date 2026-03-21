import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { apiGet, invokeFunction } from "../api/client";
import { cn } from "../lib/utils";
import { Camera, AlertTriangle, X } from "lucide-react";

interface Property { id: string; name: string; }
interface Space { id: string; property_id: string; name: string; }
interface Category { key: string; label: string; icon_name: string; intake_hint: string; }
interface Priority { key: string; label: string; is_default: boolean; }
interface EntryPref { key: string; label: string; }

export function ReportPage() {
  const navigate = useNavigate();
  const { data: properties } = useQuery({ queryKey: ["properties"], queryFn: () => apiGet<Property[]>("/rest/v1/properties?is_active=eq.true&order=name.asc") });
  const { data: allSpaces } = useQuery({ queryKey: ["spaces"], queryFn: () => apiGet<Space[]>("/rest/v1/spaces?is_active=eq.true&order=name.asc") });
  const { data: categories } = useQuery({ queryKey: ["categories"], queryFn: () => apiGet<Category[]>("/rest/v1/request_categories?is_active=eq.true&order=sort_order.asc") });
  const { data: priorities } = useQuery({ queryKey: ["priorities"], queryFn: () => apiGet<Priority[]>("/rest/v1/priority_levels?order=sort_order.asc") });
  const { data: entryPrefs } = useQuery({ queryKey: ["entry-prefs"], queryFn: () => apiGet<EntryPref[]>("/rest/v1/entry_preferences?order=sort_order.asc") });
  const { data: settings } = useQuery({ queryKey: ["settings"], queryFn: () => apiGet<Array<{ allow_requester_priority_selection: boolean; show_pets_field: boolean; show_preferred_visit_window: boolean; show_entry_preference: boolean; emergency_instructions: string }>>("/rest/v1/app_settings").then(r => r[0]) });

  const [propertyId, setPropertyId] = useState("");
  const [spaceId, setSpaceId] = useState("");
  const [categoryKey, setCategoryKey] = useState("");
  const [priorityKey, setPriorityKey] = useState("");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [locationDetail, setLocationDetail] = useState("");
  const [entryPrefKey, setEntryPrefKey] = useState("");
  const [petsPresent, setPetsPresent] = useState<boolean | null>(null);
  const [visitWindow, setVisitWindow] = useState("");
  const [accessInstructions, setAccessInstructions] = useState("");
  const [photos, setPhotos] = useState<File[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  const spaces = allSpaces?.filter(s => s.property_id === propertyId) || [];
  const selectedCategory = categories?.find(c => c.key === categoryKey);
  const defaultPriority = priorities?.find(p => p.is_default)?.key || "normal";

  const handlePhotoAdd = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    setPhotos(prev => [...prev, ...files].slice(0, 6));
  };

  const removePhoto = (index: number) => {
    setPhotos(prev => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!propertyId || !title) return;
    setError("");
    setSubmitting(true);

    try {
      await invokeFunction("submit-request", {
        title,
        description,
        property_id: propertyId,
        space_id: spaceId || null,
        category_key: categoryKey || null,
        priority_key: settings?.allow_requester_priority_selection ? (priorityKey || defaultPriority) : undefined,
        location_detail: locationDetail || null,
        entry_preference_key: entryPrefKey || null,
        pets_present: petsPresent,
        preferred_visit_window: visitWindow || null,
        access_instructions: accessInstructions || null,
      });
      navigate("/app/my-requests");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to submit request");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto p-6">
      {/* Emergency banner */}
      {settings?.emergency_instructions && (
        <div className="mb-6 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4 flex gap-3">
          <AlertTriangle className="h-5 w-5 text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5" />
          <div className="text-sm text-red-800 dark:text-red-300">{settings.emergency_instructions}</div>
        </div>
      )}

      <h1 className="text-xl font-bold mb-6">Report an Issue</h1>

      <form onSubmit={handleSubmit} className="space-y-5">
        {error && <div className="bg-destructive/10 text-destructive text-sm p-3 rounded-md">{error}</div>}

        {/* Property */}
        <div>
          <label className="block text-sm font-medium mb-1">Property *</label>
          <select value={propertyId} onChange={e => { setPropertyId(e.target.value); setSpaceId(""); }} required className="w-full px-3 py-2 border rounded-md bg-background text-sm">
            <option value="">Select property...</option>
            {properties?.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
          </select>
        </div>

        {/* Space */}
        {spaces.length > 0 && (
          <div>
            <label className="block text-sm font-medium mb-1">Unit / Space</label>
            <select value={spaceId} onChange={e => setSpaceId(e.target.value)} className="w-full px-3 py-2 border rounded-md bg-background text-sm">
              <option value="">Select unit...</option>
              {spaces.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
            </select>
          </div>
        )}

        {/* Category cards */}
        <div>
          <label className="block text-sm font-medium mb-2">Category</label>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
            {categories?.map(cat => (
              <button
                key={cat.key}
                type="button"
                onClick={() => setCategoryKey(cat.key === categoryKey ? "" : cat.key)}
                className={cn(
                  "p-3 border rounded-lg text-left text-sm transition-colors",
                  categoryKey === cat.key ? "border-primary bg-primary/5 ring-1 ring-primary" : "hover:bg-accent",
                )}
              >
                <div className="font-medium">{cat.label}</div>
              </button>
            ))}
          </div>
          {selectedCategory?.intake_hint && (
            <p className="text-xs text-muted-foreground mt-1.5">{selectedCategory.intake_hint}</p>
          )}
        </div>

        {/* Title */}
        <div>
          <label className="block text-sm font-medium mb-1">What's the issue? *</label>
          <input type="text" value={title} onChange={e => setTitle(e.target.value)} required placeholder="e.g., Kitchen faucet dripping" className="w-full px-3 py-2 border rounded-md bg-background text-sm" />
        </div>

        {/* Description */}
        <div>
          <label className="block text-sm font-medium mb-1">Details</label>
          <textarea value={description} onChange={e => setDescription(e.target.value)} rows={3} placeholder="Describe the issue in more detail..." className="w-full px-3 py-2 border rounded-md bg-background text-sm resize-none" />
        </div>

        {/* Location */}
        <div>
          <label className="block text-sm font-medium mb-1">Exact location</label>
          <input type="text" value={locationDetail} onChange={e => setLocationDetail(e.target.value)} placeholder="e.g., Master bathroom, under the sink" className="w-full px-3 py-2 border rounded-md bg-background text-sm" />
        </div>

        {/* Priority */}
        {settings?.allow_requester_priority_selection && (
          <div>
            <label className="block text-sm font-medium mb-1">Priority</label>
            <select value={priorityKey || defaultPriority} onChange={e => setPriorityKey(e.target.value)} className="w-full px-3 py-2 border rounded-md bg-background text-sm">
              {priorities?.map(p => <option key={p.key} value={p.key}>{p.label}</option>)}
            </select>
          </div>
        )}

        {/* Entry preference */}
        {settings?.show_entry_preference && (
          <div>
            <label className="block text-sm font-medium mb-1">Entry preference</label>
            <select value={entryPrefKey} onChange={e => setEntryPrefKey(e.target.value)} className="w-full px-3 py-2 border rounded-md bg-background text-sm">
              <option value="">Select...</option>
              {entryPrefs?.map(ep => <option key={ep.key} value={ep.key}>{ep.label}</option>)}
            </select>
          </div>
        )}

        {/* Pets */}
        {settings?.show_pets_field && (
          <div className="flex items-center gap-3">
            <label className="text-sm font-medium">Pets in the unit?</label>
            <div className="flex gap-2">
              <button type="button" onClick={() => setPetsPresent(true)} className={cn("px-3 py-1 text-xs rounded-md border", petsPresent === true ? "bg-primary/10 text-primary border-primary" : "hover:bg-accent")}>Yes</button>
              <button type="button" onClick={() => setPetsPresent(false)} className={cn("px-3 py-1 text-xs rounded-md border", petsPresent === false ? "bg-primary/10 text-primary border-primary" : "hover:bg-accent")}>No</button>
            </div>
          </div>
        )}

        {/* Visit window */}
        {settings?.show_preferred_visit_window && (
          <div>
            <label className="block text-sm font-medium mb-1">Preferred visit window</label>
            <input type="text" value={visitWindow} onChange={e => setVisitWindow(e.target.value)} placeholder="e.g., Weekday mornings" className="w-full px-3 py-2 border rounded-md bg-background text-sm" />
          </div>
        )}

        {/* Access instructions */}
        <div>
          <label className="block text-sm font-medium mb-1">Access instructions</label>
          <input type="text" value={accessInstructions} onChange={e => setAccessInstructions(e.target.value)} placeholder="e.g., Gate code 1234, key under mat" className="w-full px-3 py-2 border rounded-md bg-background text-sm" />
        </div>

        {/* Photos */}
        <div>
          <label className="block text-sm font-medium mb-2">Photos (up to 6)</label>
          <div className="flex flex-wrap gap-2">
            {photos.map((photo, i) => (
              <div key={i} className="relative w-20 h-20 rounded-md overflow-hidden border">
                <img src={URL.createObjectURL(photo)} alt="" className="w-full h-full object-cover" />
                <button type="button" onClick={() => removePhoto(i)} className="absolute top-0.5 right-0.5 bg-black/50 rounded-full p-0.5">
                  <X className="h-3 w-3 text-white" />
                </button>
              </div>
            ))}
            {photos.length < 6 && (
              <label className="w-20 h-20 border-2 border-dashed rounded-md flex items-center justify-center cursor-pointer hover:bg-accent transition-colors">
                <Camera className="h-5 w-5 text-muted-foreground" />
                <input type="file" accept="image/*" multiple onChange={handlePhotoAdd} className="hidden" />
              </label>
            )}
          </div>
        </div>

        {/* Submit */}
        <button
          type="submit"
          disabled={submitting || !propertyId || !title}
          className="w-full py-2.5 bg-primary text-primary-foreground rounded-md font-medium hover:opacity-90 disabled:opacity-50 transition-opacity"
        >
          {submitting ? "Submitting..." : "Submit Request"}
        </button>
      </form>
    </div>
  );
}

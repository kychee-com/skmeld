import { useState } from "react";
import { Search, Filter, X } from "lucide-react";
import { cn } from "../lib/utils";
import { t } from "../lib/i18n";

interface BoardFiltersProps {
  filters: Record<string, string>;
  onChange: (filters: Record<string, string>) => void;
}

export function BoardFilters({ filters, onChange }: BoardFiltersProps) {
  const [search, setSearch] = useState("");
  const [showPanel, setShowPanel] = useState(false);

  const activeCount = Object.values(filters).filter(Boolean).length;

  const handleSearch = (value: string) => {
    setSearch(value);
    if (value) {
      onChange({ ...filters, title: `ilike.*${value}*` });
    } else {
      const { title: _, ...rest } = filters;
      onChange(rest);
    }
  };

  const setFilter = (key: string, value: string) => {
    if (value) {
      onChange({ ...filters, [key]: value });
    } else {
      const next = { ...filters };
      delete next[key];
      onChange(next);
    }
  };

  const clearAll = () => {
    setSearch("");
    onChange({});
  };

  return (
    <div className="flex items-center gap-2">
      {/* Search */}
      <div className="relative">
        <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
        <input
          type="text"
          placeholder={t("filter.search_placeholder")}
          value={search}
          onChange={(e) => handleSearch(e.target.value)}
          className="h-8 w-44 pl-8 pr-3 text-sm border rounded-md bg-background focus:outline-none focus:ring-1 focus:ring-primary"
        />
      </div>

      {/* Filter toggle */}
      <button
        onClick={() => setShowPanel(!showPanel)}
        className={cn(
          "h-8 px-2.5 text-sm border rounded-md flex items-center gap-1.5 transition-colors",
          showPanel ? "bg-primary/10 border-primary text-primary" : "hover:bg-accent",
        )}
      >
        <Filter className="h-3.5 w-3.5" />
        {t("filter.filters")}
        {activeCount > 0 && (
          <span className="bg-primary text-primary-foreground text-[10px] px-1.5 py-0.5 rounded-full">{activeCount}</span>
        )}
      </button>

      {activeCount > 0 && (
        <button onClick={clearAll} className="h-8 px-2 text-xs text-muted-foreground hover:text-foreground flex items-center gap-1">
          <X className="h-3 w-3" />
          {t("filter.clear")}
        </button>
      )}

      {/* Quick filters */}
      {showPanel && (
        <div className="flex items-center gap-2 ml-2">
          <button
            onClick={() => setFilter("assignee_user_id", filters.assignee_user_id ? "" : "eq.null")}
            className={cn(
              "h-7 px-2.5 text-xs border rounded-md transition-colors",
              filters.assignee_user_id ? "bg-primary/10 text-primary border-primary" : "hover:bg-accent",
            )}
          >
            {t("filter.unassigned")}
          </button>
          <button
            onClick={() => setFilter("is_overdue_resolution", filters.is_overdue_resolution ? "" : "eq.true")}
            className={cn(
              "h-7 px-2.5 text-xs border rounded-md transition-colors",
              filters.is_overdue_resolution ? "bg-destructive/10 text-destructive border-destructive" : "hover:bg-accent",
            )}
          >
            {t("filter.overdue")}
          </button>
          <button
            onClick={() => setFilter("priority_key", filters.priority_key ? "" : "eq.urgent")}
            className={cn(
              "h-7 px-2.5 text-xs border rounded-md transition-colors",
              filters.priority_key ? "bg-red-50 text-red-700 border-red-300 dark:bg-red-900/20 dark:text-red-400" : "hover:bg-accent",
            )}
          >
            {t("filter.urgent")}
          </button>
        </div>
      )}
    </div>
  );
}

import { useState } from "react";

import { Card, Empty, ErrorState, Loading, PageHeader } from "@/components";

import { ActivitiesTable } from "./components/ActivitiesTable";
import { ActivityFilters } from "./components/ActivityFilters";
import { ImportDialog } from "./components/ImportDialog";
import { useActivityImport } from "./hooks/useActivityImport";
import { useActivityList } from "./hooks/useActivityList";

/** Every workout in a date range as a sortable, searchable table. */
export function ActivitiesPage() {
  const { activities, rows, filters, sort, sortBy } = useActivityList();
  const imports = useActivityImport();
  const [importing, setImporting] = useState(false);

  return (
    <>
      <PageHeader
        title="Activities"
        description="One row per workout (duplicates from other services are merged)."
        actions={
          <button type="button" className="btn primary" onClick={() => setImporting(true)}>
            Import workout
          </button>
        }
      />
      <ImportDialog open={importing} onClose={() => setImporting(false)} imports={imports} />
      <ActivityFilters
        presetId={filters.presetId}
        onPresetChange={filters.setPresetId}
        sport={filters.sport}
        onSportChange={filters.setSport}
        search={filters.search}
        onSearchChange={filters.setSearch}
      />
      <Card label="Activities" style={{ padding: 0 }}>
        {activities.isError ? (
          <ErrorState error={activities.error} />
        ) : activities.isPending ? (
          <Loading />
        ) : rows.length === 0 ? (
          <Empty title="No workouts match" />
        ) : (
          <div className={activities.isFetching ? "table-wrap refetching" : "table-wrap"}>
            <ActivitiesTable rows={rows} sort={sort} onSort={sortBy} />
          </div>
        )}
      </Card>
      {activities.data ? <p className="small muted">{rows.length} workouts</p> : null}
    </>
  );
}

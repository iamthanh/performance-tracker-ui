import { Card, Empty, ErrorState, Loading, PageHeader } from "@/components";

import { ActivitiesTable } from "./components/ActivitiesTable";
import { ActivityFilters } from "./components/ActivityFilters";
import { useActivityList } from "./hooks/useActivityList";

/** Every workout in a date range as a sortable, searchable table. */
export function ActivitiesPage() {
  const { activities, rows, filters, sort, sortBy } = useActivityList();

  return (
    <>
      <PageHeader title="Activities" description="One row per workout (duplicates from other services are merged)." />
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

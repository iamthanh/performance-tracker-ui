import { Field, RangePresetPicker, Segmented } from "@/components";

import { SPORT_FILTERS } from "../lib/filters";

export function ActivityFilters({
  presetId,
  onPresetChange,
  sport,
  onSportChange,
  search,
  onSearchChange,
}: {
  presetId: string;
  onPresetChange: (id: string) => void;
  sport: string;
  onSportChange: (sport: string) => void;
  search: string;
  onSearchChange: (search: string) => void;
}) {
  return (
    <div className="filters">
      <RangePresetPicker value={presetId} onChange={onPresetChange} />
      <Segmented label="Sport" value={sport} onChange={onSportChange} options={SPORT_FILTERS} />
      <Field inline label={<span className="sr-only">Search names</span>}>
        <input type="search" placeholder="Search names" value={search} onChange={(e) => onSearchChange(e.target.value)} />
      </Field>
    </div>
  );
}

import { ErrorCard, LoadingCard, PageHeader } from "@/components";

import { DayNav } from "./components/DayNav";
import { DayTiles } from "./components/DayTiles";
import { EntriesCard } from "./components/EntriesCard";
import { FoodsCard } from "./components/FoodsCard";
import { useNutritionDay } from "./hooks/useNutritionDay";

/** A day's food and drink against the energy burned, and the saved foods used to log it. */
export function NutritionPage() {
  const { day, go, setDay, reset, entries, totals, daily } = useNutritionDay();
  const failed = entries.isError ? entries.error : daily.isError ? daily.error : null;

  return (
    <>
      <PageHeader
        title="Nutrition"
        description="What you ate and drank against what you burned. Burned calories come from your watch once Garmin is synced."
        actions={<DayNav day={day} onPrevious={() => go(-1)} onNext={() => go(1)} onToday={reset} onPick={setDay} />}
      />
      {failed ? (
        <ErrorCard error={failed} />
      ) : entries.isPending ? (
        <LoadingCard />
      ) : (
        <>
          <DayTiles day={totals} />
          <EntriesCard day={day} entries={entries.data ?? []} />
          <FoodsCard />
        </>
      )}
    </>
  );
}

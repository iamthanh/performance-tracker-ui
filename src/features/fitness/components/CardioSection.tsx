import { useCardio } from "@/api";
import { EmptyCard, ErrorCard, LoadingCard } from "@/components";

import { cardioDays } from "../lib/cardio";
import { CardioCard } from "./CardioCard";
import { CardioComponentsCard } from "./CardioComponentsCard";
import { CardioModelCard } from "./CardioModelCard";

/** How fit your heart is over the range: heart rate against power on steady riding, resting heart rate and
 *  heart-rate recovery. */
export function CardioSection({ range }: { range: { start: string; end: string } }) {
  const cardio = useCardio({ start_date: range.start, end_date: range.end });
  if (cardio.isError) return <ErrorCard error={cardio.error} />;
  if (cardio.isPending) return <LoadingCard label="Loading the cardio index…" />;
  const { model } = cardio.data;
  const days = cardioDays(cardio.data.days);
  if (!model || !days.length) {
    return (
      <EmptyCard title="No cardio index yet">
        {!model ? (
          <>
            It needs rides with both power and heart rate: import them, then run <code>fitness-hub analyze</code>.
          </>
        ) : (
          <>No values in this range: it needs at least 5 rides with steady riding in {cardio.data.window_days} days. Try a longer range.</>
        )}
      </EmptyCard>
    );
  }
  return (
    <>
      <CardioCard cardio={cardio.data} model={model} days={days} refetching={cardio.isFetching} />
      <CardioComponentsCard cardio={cardio.data} days={days} />
      <CardioModelCard model={model} rides={cardio.data.rides} />
    </>
  );
}

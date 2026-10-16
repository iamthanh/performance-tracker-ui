import { useThresholds } from "@/api";
import { ErrorCard, LoadingCard, PageHeader } from "@/components";
import { today } from "@/lib/dates";

import { FtpHistoryCard } from "./components/FtpHistoryCard";
import { ThresholdForm } from "./components/ThresholdForm";
import { ThresholdTiles } from "./components/ThresholdTiles";
import { ThresholdValuesCard } from "./components/ThresholdValuesCard";
import { useThresholdEditor } from "./hooks/useThresholdEditor";

/** The thresholds behind TSS, intensity and zones: what is in effect, its history, and overrides. */
export function SettingsPage() {
  const thresholds = useThresholds(today());
  const editor = useThresholdEditor();

  if (thresholds.isError) return <ErrorCard error={thresholds.error} />;
  if (thresholds.isPending) return <LoadingCard />;
  const values = thresholds.data.values;

  return (
    <>
      <PageHeader
        title="Settings"
        description="Thresholds behind TSS, intensity and zones. Automatic values follow your best efforts; your own values override them from their date on."
      />
      <ThresholdTiles inEffect={thresholds.data.in_effect} />
      <ThresholdForm editor={editor} />
      <FtpHistoryCard values={values} />
      <ThresholdValuesCard values={values} editor={editor} />
    </>
  );
}

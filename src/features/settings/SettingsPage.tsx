import { useThresholds } from "@/api";
import { ErrorCard, LoadingCard, PageHeader } from "@/components";
import { today } from "@/lib/dates";

import { CardioSettingsCard } from "./components/CardioSettingsCard";
import { FtpHistoryCard } from "./components/FtpHistoryCard";
import { PerformanceSettingsCard } from "./components/PerformanceSettingsCard";
import { ThresholdForm } from "./components/ThresholdForm";
import { ThresholdTiles } from "./components/ThresholdTiles";
import { ThresholdValuesCard } from "./components/ThresholdValuesCard";
import { useThresholdEditor } from "./hooks/useThresholdEditor";
import { useThresholdForm } from "./hooks/useThresholdForm";

/** The thresholds behind TSS, intensity and zones (what is in effect, its history, and overrides), and the
 *  performance and cardio indexes' settings. */
export function SettingsPage() {
  const thresholds = useThresholds(today());
  const form = useThresholdForm();
  const editor = useThresholdEditor();

  if (thresholds.isError) return <ErrorCard error={thresholds.error} />;
  if (thresholds.isPending) return <LoadingCard />;
  const values = thresholds.data.values;

  return (
    <>
      <PageHeader
        title="Settings"
        description="Thresholds behind TSS, intensity and zones, and how your performance and cardio indexes are weighted. Automatic thresholds follow your best efforts; your own values override them from their date on."
      />
      <ThresholdTiles inEffect={thresholds.data.in_effect} />
      <ThresholdForm form={form} editor={editor} />
      <FtpHistoryCard values={values} />
      <ThresholdValuesCard values={values} editor={editor} />
      <PerformanceSettingsCard />
      <CardioSettingsCard />
    </>
  );
}

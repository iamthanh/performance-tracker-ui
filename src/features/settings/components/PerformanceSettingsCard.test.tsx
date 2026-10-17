import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { fireEvent, render, screen } from "@testing-library/react";

import type { PerformanceSettings } from "@/api";
import { mockApi } from "@/test/utils";

import { PerformanceSettingsCard } from "./PerformanceSettingsCard";

const ROAD = { sprint: 10, anaerobic: 10, vo2max: 15, threshold: 30, endurance: 15, durability: 20 };
const CLIMBER = { sprint: 5, anaerobic: 5, vo2max: 25, threshold: 30, endurance: 20, durability: 15 };

it("saves a preset and says so after the form reloads with the new weights", async () => {
  let saved: PerformanceSettings = {
    weights: ROAD,
    decay_per_week: 0.01,
    presets: { road: { label: "Road / endurance", weights: ROAD }, climber: { label: "Climber", weights: CLIMBER } },
  };
  const calls = mockApi({
    "/performance/settings": (_url, init) => {
      if (init?.method === "PUT") saved = { ...saved, ...JSON.parse(String(init.body)) };
      return saved;
    },
  });
  render(
    <QueryClientProvider client={new QueryClient()}>
      <PerformanceSettingsCard />
    </QueryClientProvider>,
  );
  fireEvent.click(await screen.findByRole("button", { name: "Climber" }));
  expect(screen.getByLabelText("VO2max (5 min)")).toHaveValue(25);
  fireEvent.click(screen.getByRole("button", { name: "Save" }));
  expect(await screen.findByText("Saved. The performance index uses the new weights.")).toBeInTheDocument();
  const put = calls.find((c) => c.init?.method === "PUT")!;
  expect(JSON.parse(String(put.init!.body))).toEqual({ weights: CLIMBER, decay_per_week: 0.01 });
  expect(await screen.findByLabelText("VO2max (5 min)")).toHaveValue(25); // refilled from the saved settings
});

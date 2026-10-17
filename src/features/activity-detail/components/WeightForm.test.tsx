import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { useState } from "react";

import type { WorkoutWeight } from "@/api";
import type { WeightUnit } from "@/lib/nutrition";
import { mockApi } from "@/test/utils";

import { WeightForm } from "./WeightForm";

function Harness({ weight }: { weight: WorkoutWeight | null }) {
  const [unit, setUnit] = useState<WeightUnit>("kg");
  return <WeightForm source="strava" sourceId="42" weight={weight} unit={unit} onUnit={setUnit} />;
}

function renderForm(weight: WorkoutWeight | null = null) {
  const calls = mockApi({ "/activities/strava/42/weight": (_url, init) => JSON.parse(String(init!.body)) });
  render(
    <QueryClientProvider client={new QueryClient()}>
      <Harness weight={weight} />
    </QueryClientProvider>,
  );
  return () => calls.filter((c) => c.init?.method === "PUT").map((c) => JSON.parse(String(c.init!.body)));
}

beforeEach(() => localStorage.clear());

it("saves pounds as kilograms and converts what is typed on a unit switch", async () => {
  const puts = renderForm();
  fireEvent.change(screen.getByLabelText("Weight before (kg)"), { target: { value: "72.57" } });
  fireEvent.change(screen.getByLabelText("Unit"), { target: { value: "lb" } });
  expect(screen.getByLabelText("Weight before (lb)")).toHaveValue(159.99); // typed text converted, not lost
  fireEvent.change(screen.getByLabelText("Weight after (lb)"), { target: { value: "157.4" } });
  fireEvent.click(screen.getByRole("button", { name: "Save weights" }));
  await waitFor(() => expect(puts()).toHaveLength(1));
  expect(puts()[0]).toEqual({ pre_kg: 72.57, post_kg: 71.4 });
  expect(await screen.findByText("Saved")).toBeInTheDocument();
  fireEvent.change(screen.getByLabelText("Weight after (lb)"), { target: { value: "157" } });
  expect(screen.queryByText("Saved")).not.toBeInTheDocument(); // stale once edited
  expect(localStorage.getItem("pt-weight-unit")).toBe("lb");
});

it("shows saved weights and clears them", async () => {
  const puts = renderForm({ pre_kg: 72, post_kg: 70.8, note: null, updated_at: "t" });
  expect(screen.getByLabelText("Weight before (kg)")).toHaveValue(72);
  fireEvent.change(screen.getByLabelText("Weight before (kg)"), { target: { value: "" } });
  fireEvent.change(screen.getByLabelText("Weight after (kg)"), { target: { value: "" } });
  fireEvent.click(screen.getByRole("button", { name: "Save weights" }));
  await waitFor(() => expect(puts()).toEqual([{ pre_kg: null, post_kg: null }]));
});

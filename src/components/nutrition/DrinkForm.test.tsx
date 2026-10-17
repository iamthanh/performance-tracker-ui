import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";

import { mockApi } from "@/test/utils";

import { DrinkForm } from "./DrinkForm";

function renderForm() {
  const calls = mockApi({ "/nutrition/entries": () => ({ id: 1 }) });
  render(
    <QueryClientProvider client={new QueryClient()}>
      <DrinkForm date="2026-10-12" activity={{ source: "strava", source_id: "42" }} />
    </QueryClientProvider>,
  );
  return () => calls.filter((c) => c.init?.method === "POST").map((c) => JSON.parse(String(c.init!.body)));
}

beforeEach(() => localStorage.clear());

it("logs bottles with their recipe, previews the totals and remembers the recipe", async () => {
  const posts = renderForm();
  expect(screen.getByRole("button", { name: "Add bottle" })).toBeDisabled(); // nothing in the bottle yet
  fireEvent.change(screen.getByLabelText("Bottles"), { target: { value: "2" } });
  fireEvent.change(screen.getByLabelText("Water (ml/bottle)"), { target: { value: "750" } });
  fireEvent.change(screen.getByLabelText("Salt (g/bottle)"), { target: { value: "1.5" } });
  fireEvent.change(screen.getByLabelText("Maltodextrin (g/bottle)"), { target: { value: "60" } });
  fireEvent.change(screen.getByLabelText("Sucrose (g/bottle)"), { target: { value: "48" } });
  fireEvent.click(screen.getByRole("button", { name: "+ Other ingredient" }));
  fireEvent.change(screen.getByLabelText("Other ingredient"), { target: { value: "Caffeine powder" } });
  fireEvent.change(screen.getByLabelText("Caffeine (mg/bottle)"), { target: { value: "100" } });
  fireEvent.change(screen.getByLabelText("Minutes in"), { target: { value: "0" } });
  expect(screen.getByText(/2 × bottle: 1,500 ml · 216 g carbs \(glucose : fructose 1 : 0\.3\) · 1,180 mg sodium · 200 mg caffeine · 864 kcal/)).toBeInTheDocument();
  fireEvent.click(screen.getByRole("button", { name: "Add 2 bottles" }));
  await waitFor(() => expect(posts()).toHaveLength(1));
  expect(posts()[0]).toEqual({
    local_date: "2026-10-12",
    meal: "during_workout",
    activity_source: "strava",
    activity_source_id: "42",
    offset_s: 0,
    drink: {
      bottles: 2,
      water_ml: 750,
      salt_g: 1.5,
      maltodextrin_g: 60,
      sucrose_g: 48,
      other: [{ name: "Caffeine powder", grams: null, carbs_g: null, sodium_mg: null, caffeine_mg: 100 }],
    },
  });
  await waitFor(() => expect(screen.getByLabelText("Bottles")).toHaveValue(1));
  expect(screen.getByLabelText("Water (ml/bottle)")).toHaveValue(750); // the recipe stays for the next bottle
  expect(JSON.parse(localStorage.getItem("pt-last-bottle")!)).toMatchObject({ water_ml: "750", sucrose_g: "48" });
});

it("starts empty when the remembered recipe is garbage", () => {
  localStorage.setItem("pt-last-bottle", '{"water_ml": 5, "other": [null, 3]}');
  renderForm();
  expect(screen.getByLabelText("Water (ml/bottle)")).toHaveValue(null);
  expect(screen.getAllByRole("group", { name: /Other ingredient/ })).toHaveLength(2); // rows kept, but blank
});

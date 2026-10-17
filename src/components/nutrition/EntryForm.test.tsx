import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";

import { mockApi } from "@/test/utils";

import { EntryForm } from "./EntryForm";

const gel = { id: 7, name: "Maurten Gel 100", brand: null, serving: "1 gel", kcal: 100, carbs_g: 25, sugars_g: null,
  protein_g: null, fat_g: null, fiber_g: null, sodium_mg: 20, potassium_mg: null, caffeine_mg: null, fluid_ml: null,
  note: null, archived: false, created_at: "", updated_at: "" }; // prettier-ignore

function renderForm() {
  const calls = mockApi({ "/nutrition/foods": () => [gel], "/nutrition/entries": () => ({ id: 1 }) });
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  render(
    <QueryClientProvider client={client}>
      <EntryForm date="2026-10-12" meal="during_workout" activity={{ source: "strava", source_id: "42" }} />
    </QueryClientProvider>,
  );
  const posts = () => calls.filter((c) => c.init?.method === "POST").map((c) => JSON.parse(String(c.init!.body)));
  return { posts };
}

describe("logging a workout's fueling", () => {
  it("links a typed-in item to the workout, per serving, with the time into it", async () => {
    const { posts } = renderForm();
    expect(screen.queryByLabelText("Meal")).not.toBeInTheDocument();
    fireEvent.change(screen.getByLabelText("Name"), { target: { value: "Rice cake" } });
    fireEvent.change(screen.getByLabelText("Carbs (g/serving)"), { target: { value: "18" } });
    fireEvent.change(screen.getByLabelText("Sodium (mg/serving)"), { target: { value: "75" } });
    fireEvent.change(screen.getByLabelText("Servings"), { target: { value: "2" } });
    fireEvent.change(screen.getByLabelText("Minutes in"), { target: { value: "1.1" } });
    expect(screen.getByText(/Adds 36 g carbs · 150 mg sodium/)).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Add" }));
    await waitFor(() => expect(posts()).toHaveLength(1));
    expect(posts()[0]).toEqual({
      local_date: "2026-10-12",
      meal: "during_workout",
      servings: 2,
      name: "Rice cake",
      carbs_g: 36,
      sodium_mg: 150,
      activity_source: "strava",
      activity_source_id: "42",
      offset_s: 66,
    });
    await waitFor(() => expect(screen.getByLabelText("Name")).toHaveValue(""));
    expect(screen.getByLabelText("Minutes in")).toHaveValue(null);
  });

  it("logs a saved food by id and servings", async () => {
    const { posts } = renderForm();
    await screen.findByRole("option", { name: /Maurten Gel 100/ }); // the saved foods have loaded
    fireEvent.change(screen.getByLabelText("Item"), { target: { value: "7" } });
    fireEvent.change(screen.getByLabelText("Servings"), { target: { value: "3" } });
    expect(screen.queryByLabelText("Name")).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Add" }));
    await waitFor(() => expect(posts()).toHaveLength(1));
    expect(posts()[0]).toMatchObject({ food_id: 7, servings: 3, meal: "during_workout", activity_source_id: "42" });
    expect(posts()[0]).not.toHaveProperty("offset_s");
  });
});

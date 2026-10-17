import { fireEvent, render, screen } from "@testing-library/react";

import type { Effort, WPrime } from "@/api";

import { EffortsCard } from "./EffortsCard";
import { WPrimeCard } from "./WPrimeCard";

const effort = (start_s: number): Effort => ({
  start_s,
  end_s: start_s + 60,
  duration_s: 60,
  avg_power_w: 350,
  max_power_w: 420,
  avg_hr: 160,
  max_hr: 168,
  avg_cadence: 92,
  work_kj: 21,
  pct_ftp: 140,
  zone: "Z6 Anaerobic",
  w_prime_spent_j: 6000,
});

it("lists efforts with W/kg and shows the rest on demand", () => {
  const items = Array.from({ length: 20 }, (_, i) => effort(600 + i * 300));
  render(<EffortsCard efforts={{ ftp_w: 250, count: 20, time_above_s: 1260, work_above_kj: 120, items }} kg={70} />);
  expect(screen.getAllByText("Z6 Anaerobic")).toHaveLength(15);
  expect(screen.getAllByText("5.00")).toHaveLength(15); // 350 W at 70 kg
  fireEvent.click(screen.getByRole("button", { name: "Show all 20" }));
  expect(screen.getAllByText("Z6 Anaerobic")).toHaveLength(20);
  expect(screen.getByText("21:00")).toBeInTheDocument(); // time above FTP
});

it("leaves W/kg out without a body weight and says when there were no efforts", () => {
  render(<EffortsCard efforts={{ ftp_w: 250, count: 0, time_above_s: 0, work_above_kj: 0, items: [] }} kg={null} />);
  expect(screen.getByText("No efforts above FTP in this ride.")).toBeInTheDocument();
  expect(screen.queryByText("W/kg")).toBeNull();
});

it("summarises W' balance and warns when it went below zero", () => {
  const w: WPrime = {
    cp_w: 250,
    w_prime_j: 20000,
    origin: "ftp",
    min_j: -1500,
    min_at_s: 3600,
    matches: [{ start_s: 1800, low_at_s: 1860, spent_j: 6000, low_j: 14000 }],
  };
  render(<WPrimeCard w={w} />);
  expect(screen.getByText("Typical default")).toBeInTheDocument();
  expect(screen.getByText(/went below zero/)).toBeInTheDocument();
  expect(screen.getByText("14.0 kJ (70%)")).toBeInTheDocument();
});

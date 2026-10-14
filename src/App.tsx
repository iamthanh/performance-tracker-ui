import { useState } from "react";
import { NavLink, Navigate, Route, Routes, useLocation } from "react-router-dom";

import { useHealth } from "./api/hooks";
import { ErrorBoundary } from "./components/ErrorBoundary";
import { formatDay } from "./lib/dates";
import { applyTheme, storedTheme, type ThemeChoice } from "./lib/theme";
import { ActivitiesPage } from "./pages/ActivitiesPage";
import { ActivityPage } from "./pages/ActivityPage";
import { CalendarPage } from "./pages/CalendarPage";
import { FitnessPage } from "./pages/FitnessPage";
import { HealthPage } from "./pages/HealthPage";
import { PowerCurvePage } from "./pages/PowerCurvePage";
import { SettingsPage } from "./pages/SettingsPage";

const NAV = [
  { to: "/fitness", label: "Fitness" },
  { to: "/calendar", label: "Calendar" },
  { to: "/activities", label: "Activities" },
  { to: "/power", label: "Power curve" },
  { to: "/health", label: "Health" },
  { to: "/settings", label: "Settings" },
];

const THEME_NEXT: Record<ThemeChoice, ThemeChoice> = { system: "light", light: "dark", dark: "system" };
const THEME_LABEL: Record<ThemeChoice, string> = { system: "Auto", light: "Light", dark: "Dark" };

function DataFreshness() {
  const health = useHealth();
  if (health.isError) return <span>API offline</span>;
  const latest = health.data?.latest_activity_date;
  return <span>{latest ? `Data through ${formatDay(latest)}` : ""}</span>;
}

export function App() {
  const [theme, setTheme] = useState<ThemeChoice>(storedTheme);
  const location = useLocation();
  const cycleTheme = () => {
    const next = THEME_NEXT[theme];
    applyTheme(next);
    setTheme(next);
  };
  return (
    <div className="shell">
      <header className="topbar">
        <div className="brand">Performance Tracker</div>
        <nav className="nav" aria-label="Main">
          {NAV.map((item) => (
            <NavLink key={item.to} to={item.to}>
              {item.label}
            </NavLink>
          ))}
        </nav>
        <div className="topbar-end">
          <span className="freshness">
            <DataFreshness />
          </span>
          <button type="button" className="btn ghost small" onClick={cycleTheme} title="Colour theme">
            Theme: {THEME_LABEL[theme]}
          </button>
        </div>
      </header>
      <main className="main">
        <ErrorBoundary resetKey={location.pathname + location.search}>
          <Routes>
            <Route path="/" element={<Navigate to="/fitness" replace />} />
            <Route path="/fitness" element={<FitnessPage />} />
            <Route path="/calendar" element={<CalendarPage />} />
            <Route path="/activities" element={<ActivitiesPage />} />
            <Route path="/activities/:source/:id" element={<ActivityPage />} />
            <Route path="/power" element={<PowerCurvePage />} />
            <Route path="/health" element={<HealthPage />} />
            <Route path="/settings" element={<SettingsPage />} />
            <Route path="*" element={<Navigate to="/fitness" replace />} />
          </Routes>
        </ErrorBoundary>
      </main>
    </div>
  );
}

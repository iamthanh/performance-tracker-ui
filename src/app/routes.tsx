import { Navigate, Route, Routes } from "react-router-dom";

import { ActivitiesPage } from "@/features/activities";
import { ActivityPage } from "@/features/activity-detail";
import { CalendarPage } from "@/features/calendar";
import { FitnessPage } from "@/features/fitness";
import { HealthPage } from "@/features/health";
import { PowerCurvePage } from "@/features/power-curve";
import { SettingsPage } from "@/features/settings";

export function AppRoutes() {
  return (
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
  );
}

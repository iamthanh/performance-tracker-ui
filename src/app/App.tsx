import { useLocation } from "react-router-dom";

import { ErrorBoundary } from "@/components";

import { TopBar } from "./layout/TopBar";
import { AppRoutes } from "./routes";

/** The app shell: top bar, then the current page. Providers are set up in main.tsx (and in tests). */
export function App() {
  const location = useLocation();
  return (
    <div className="shell">
      <TopBar />
      <main className="main">
        <ErrorBoundary resetKey={location.pathname + location.search}>
          <AppRoutes />
        </ErrorBoundary>
      </main>
    </div>
  );
}

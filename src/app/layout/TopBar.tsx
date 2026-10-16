import { NavLink } from "react-router-dom";

import { NAV_ITEMS } from "../nav";
import { DataFreshness } from "./DataFreshness";
import { ThemeToggle } from "./ThemeToggle";

export function TopBar() {
  return (
    <header className="topbar">
      <div className="brand">Performance Tracker</div>
      <nav className="nav" aria-label="Main">
        {NAV_ITEMS.map((item) => (
          <NavLink key={item.to} to={item.to}>
            {item.label}
          </NavLink>
        ))}
      </nav>
      <div className="topbar-end">
        <span className="freshness">
          <DataFreshness />
        </span>
        <ThemeToggle />
      </div>
    </header>
  );
}

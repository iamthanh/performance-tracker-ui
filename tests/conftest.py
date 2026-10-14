from __future__ import annotations

from pathlib import Path
from typing import Any

import httpx
import pytest

from fitness_hub.config import Settings
from fitness_hub.db import Store


@pytest.fixture(autouse=True)
def _no_network(monkeypatch: pytest.MonkeyPatch) -> None:
    """Tests never talk to real provider APIs."""

    def refuse(self: Any, request: httpx.Request) -> httpx.Response:
        raise AssertionError(f"unexpected real HTTP request: {request.method} {request.url}")

    monkeypatch.setattr(httpx.HTTPTransport, "handle_request", refuse)


@pytest.fixture
def home(tmp_path: Path, monkeypatch: pytest.MonkeyPatch) -> Path:
    """An isolated FITNESS_HUB_HOME used by Settings.from_env() (CLI and server)."""
    home = tmp_path / "home"
    monkeypatch.setenv("FITNESS_HUB_HOME", str(home))
    monkeypatch.chdir(tmp_path)  # no stray ./.env
    for key in ("STRAVA_CLIENT_ID", "STRAVA_CLIENT_SECRET", "GOOGLE_CLIENT_ID", "GOOGLE_CLIENT_SECRET"):
        monkeypatch.delenv(key, raising=False)
    return home


@pytest.fixture
def settings(home: Path) -> Settings:
    return Settings.from_env()


def activity(source: str, source_id: str, start: str, activity_type: str, distance_m: float, **extra: Any) -> dict:
    return {
        "source": source,
        "source_id": source_id,
        "start_time": start,
        "local_date": start[:10],
        "activity_type": activity_type,
        "name": f"{activity_type} {source_id}",
        "distance_m": distance_m,
        "moving_s": 3600,
        "elevation_gain_m": 300,
        "avg_hr": 140,
        "raw": {"id": source_id},
        **extra,
    }


@pytest.fixture
def seeded(settings: Settings) -> Settings:
    """A database where one ride was recorded by both Garmin and Strava."""
    with Store(settings.db_path) as store:
        store.upsert_activities(
            [
                activity("garmin", "g1", "2026-10-06T07:00:05Z", "road_biking", 40000, calories=900),
                activity("strava", "s1", "2026-10-06T07:00:50Z", "Ride", 40100, avg_power_w=215),
                activity("strava", "s2", "2026-10-08T17:00:00Z", "Run", 10000),
            ]
        )
        store.upsert_daily_metrics(
            [
                {"source": "garmin", "date": "2026-10-10", "metric": "resting_hr", "value": 49},
                {"source": "google_health", "date": "2026-10-10", "metric": "resting_hr", "value": 51},
            ]
        )
        store.upsert_sleep_sessions(
            [{"source": "garmin", "source_id": "z", "local_date": "2026-10-10", "minutes_asleep": 431, "is_main": 1}]
        )
        store.upsert_body_measurements(
            [{"source": "garmin", "ts": "2026-10-10T06:00:00Z", "metric": "weight_kg", "value": 72.4}]
        )
        store.record_sync("strava", "activities", cursor="2026-10-08T17:00:00Z", rows=2)
    return settings

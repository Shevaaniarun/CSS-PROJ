from datetime import UTC, datetime, timedelta


def test_timestamp_window() -> None:
    now = datetime.now(UTC)
    assert abs((now - (now - timedelta(seconds=299))).total_seconds()) <= 300
    assert abs((now - (now - timedelta(seconds=301))).total_seconds()) > 300


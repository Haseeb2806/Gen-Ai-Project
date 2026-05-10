from fastapi.testclient import TestClient

from backend.app.main import app
from backend.app.routers import upload


client = TestClient(app)


def test_valid_csv_upload_returns_dataset_summary() -> None:
    response = client.post(
        "/upload",
        files={"file": ("bookings.csv", b"hotel,is_canceled\nCity Hotel,1\nResort Hotel,0\n")},
    )

    assert response.status_code == 200
    body = response.json()
    assert body["filename"] == "bookings.csv"
    assert body["row_count"] == 2
    assert body["column_count"] == 2
    assert body["column_names"] == ["hotel", "is_canceled"]
    assert body["profile"]["row_count"] == 2
    assert body["profile"]["column_count"] == 2


def test_upload_rejects_non_csv_file() -> None:
    response = client.post(
        "/upload",
        files={"file": ("bookings.txt", b"hotel,is_canceled\nCity Hotel,1\n")},
    )

    assert response.status_code == 400
    assert response.json()["detail"] == "Only CSV files are accepted."


def test_upload_rejects_malformed_csv() -> None:
    response = client.post(
        "/upload",
        files={"file": ("bad.csv", b'hotel,is_canceled\n"City Hotel,1\n')},
    )

    assert response.status_code == 400
    assert response.json()["detail"] == "CSV file could not be parsed by pandas."


def test_upload_rejects_csv_over_size_limit(monkeypatch) -> None:
    monkeypatch.setattr(upload, "MAX_UPLOAD_SIZE_BYTES", 10)

    response = client.post(
        "/upload",
        files={"file": ("large.csv", b"hotel,is_canceled\nCity Hotel,1\n")},
    )

    assert response.status_code == 413
    assert response.json()["detail"] == "CSV file exceeds the 50MB size limit."

from fastapi.testclient import TestClient

from backend.app.db.storage import get_dataset, initialize_database
from backend.app.main import app


def test_uploaded_dataset_metadata_is_saved(monkeypatch, tmp_path) -> None:
    monkeypatch.setenv("DATALENS_DB_PATH", str(tmp_path / "test.db"))
    initialize_database()
    client = TestClient(app)

    upload_response = client.post(
        "/upload",
        files={"file": ("bookings.csv", b"hotel,is_canceled\nCity Hotel,1\nResort Hotel,0\n")},
    )

    assert upload_response.status_code == 200
    dataset_id = upload_response.json()["dataset_id"]
    saved_dataset = get_dataset(dataset_id)
    assert saved_dataset is not None
    assert saved_dataset["filename"] == "bookings.csv"
    assert saved_dataset["row_count"] == 2
    assert saved_dataset["column_count"] == 2
    assert saved_dataset["column_names"] == ["hotel", "is_canceled"]


def test_uploaded_rows_are_saved(monkeypatch, tmp_path) -> None:
    monkeypatch.setenv("DATALENS_DB_PATH", str(tmp_path / "test.db"))
    initialize_database()
    client = TestClient(app)

    upload_response = client.post(
        "/upload",
        files={"file": ("bookings.csv", b"hotel,is_canceled\nCity Hotel,1\nResort Hotel,0\n")},
    )

    dataset_id = upload_response.json()["dataset_id"]
    saved_dataset = get_dataset(dataset_id)
    assert saved_dataset is not None
    assert saved_dataset["rows"] == [
        {"hotel": "City Hotel", "is_canceled": 1},
        {"hotel": "Resort Hotel", "is_canceled": 0},
    ]


def test_dataset_list_endpoint_works(monkeypatch, tmp_path) -> None:
    monkeypatch.setenv("DATALENS_DB_PATH", str(tmp_path / "test.db"))
    initialize_database()
    client = TestClient(app)

    upload_response = client.post(
        "/upload",
        files={"file": ("bookings.csv", b"hotel,is_canceled\nCity Hotel,1\n")},
    )
    dataset_id = upload_response.json()["dataset_id"]

    list_response = client.get("/datasets")

    assert list_response.status_code == 200
    datasets = list_response.json()["datasets"]
    assert len(datasets) == 1
    assert datasets[0]["dataset_id"] == dataset_id
    assert datasets[0]["filename"] == "bookings.csv"
    assert "rows" not in datasets[0]


def test_dataset_retrieve_endpoint_works(monkeypatch, tmp_path) -> None:
    monkeypatch.setenv("DATALENS_DB_PATH", str(tmp_path / "test.db"))
    initialize_database()
    client = TestClient(app)

    upload_response = client.post(
        "/upload",
        files={"file": ("bookings.csv", b"hotel,is_canceled\nCity Hotel,1\n")},
    )
    dataset_id = upload_response.json()["dataset_id"]

    retrieve_response = client.get(f"/datasets/{dataset_id}")

    assert retrieve_response.status_code == 200
    body = retrieve_response.json()
    assert body["dataset_id"] == dataset_id
    assert body["filename"] == "bookings.csv"
    assert body["rows"] == [{"hotel": "City Hotel", "is_canceled": 1}]


def test_invalid_dataset_id_returns_clear_error(monkeypatch, tmp_path) -> None:
    monkeypatch.setenv("DATALENS_DB_PATH", str(tmp_path / "test.db"))
    initialize_database()
    client = TestClient(app)

    response = client.get("/datasets/missing-id")

    assert response.status_code == 404
    assert response.json()["detail"] == "Dataset 'missing-id' was not found."

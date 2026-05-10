from fastapi.testclient import TestClient

from backend.app.main import app


client = TestClient(app)


def test_summary_rejects_invalid_dataset_id() -> None:
    response = client.post("/summary", json={"dataset_id": "missing-id"})

    assert response.status_code == 404
    assert response.json()["detail"] == "Dataset missing-id not found"


def test_summary_generates_hotel_booking_findings(monkeypatch, tmp_path) -> None:
    monkeypatch.setenv("DATALENS_DB_PATH", str(tmp_path / "test.db"))
    dataset_id = _upload_hotel_dataset()

    response = client.post("/summary", json={"dataset_id": dataset_id})

    assert response.status_code == 200
    body = response.json()
    assert body["dataset_id"] == dataset_id
    assert "cancellation" in body["summary"].lower()
    assert "source countries" in body["summary"].lower()
    assert "adr" in body["summary"].lower()
    assert "lead-time" in body["summary"].lower()
    assert "repeat guest" in body["summary"].lower()
    assert body["key_findings"]
    assert body["data_quality_notes"]
    assert body["data"]["cancellation"]["question_type"] == "cancellation_rate"


def test_summary_returns_generic_profile_for_non_hotel_dataset(monkeypatch, tmp_path) -> None:
    monkeypatch.setenv("DATALENS_DB_PATH", str(tmp_path / "test.db"))
    upload_response = client.post(
        "/upload",
        files={"file": ("products.csv", b"product,price\nApple,1.00\nBanana,0.50\n")},
    )
    dataset_id = upload_response.json()["dataset_id"]

    response = client.post("/summary", json={"dataset_id": dataset_id})

    assert response.status_code == 200
    body = response.json()
    assert "required hotel columns were not present" in body["summary"]
    assert body["data"]["profile"]["filename"] == "products.csv"


def _upload_hotel_dataset() -> str:
    csv_data = b"""hotel,is_canceled,lead_time,arrival_date_year,arrival_date_month,country,market_segment,is_repeated_guest,adr
City Hotel,0,10,2015,July,PRT,Direct,0,100
City Hotel,1,30,2015,July,GBR,Direct,0,80
Resort Hotel,0,5,2015,August,GBR,Corporate,1,150
Resort Hotel,1,40,2015,September,FRA,Online,1,200
City Hotel,0,2,2015,September,PRT,Direct,0,120"""
    response = client.post(
        "/upload",
        files={"file": ("hotel_booking.csv", csv_data)},
    )
    assert response.status_code == 200
    return response.json()["dataset_id"]

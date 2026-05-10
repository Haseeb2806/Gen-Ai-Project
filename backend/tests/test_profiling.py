import pandas as pd
from fastapi.testclient import TestClient

from backend.app.main import app
from backend.app.services.profiling import profile_dataframe


def _column(profile: dict, name: str) -> dict:
    return next(column for column in profile["columns"] if column["name"] == name)


def test_numeric_column_profiling() -> None:
    dataframe = pd.DataFrame({"adr": [100, 150, 200]})

    profile = profile_dataframe(dataframe)
    column = _column(profile, "adr")

    assert column["detected_type"] == "numeric"
    assert column["null_count"] == 0
    assert column["null_percentage"] == 0.0
    assert column["unique_value_count"] == 3
    assert column["stats"] == {
        "min": 100,
        "max": 200,
        "mean": 150,
        "median": 150,
    }


def test_categorical_column_profiling() -> None:
    dataframe = pd.DataFrame({"hotel": ["City Hotel", "Resort Hotel", "City Hotel"]})

    profile = profile_dataframe(dataframe)
    column = _column(profile, "hotel")

    assert column["detected_type"] == "categorical"
    assert column["unique_value_count"] == 2
    assert column["top_values"] == [
        {"value": "City Hotel", "count": 2},
        {"value": "Resort Hotel", "count": 1},
    ]


def test_datetime_column_detection() -> None:
    dataframe = pd.DataFrame({"arrival_date": ["2026-01-01", "2026-02-15", "2026-03-20"]})

    profile = profile_dataframe(dataframe)
    column = _column(profile, "arrival_date")

    assert column["detected_type"] == "datetime"


def test_null_count_calculation() -> None:
    dataframe = pd.DataFrame({"children": [0, None, 2, None]})

    profile = profile_dataframe(dataframe)
    column = _column(profile, "children")

    assert column["null_count"] == 2
    assert column["null_percentage"] == 50.0


def test_profile_response_structure_after_upload() -> None:
    client = TestClient(app)

    response = client.post(
        "/upload",
        files={
            "file": (
                "bookings.csv",
                b"hotel,arrival_date,adr\nCity Hotel,2026-01-01,120\nResort Hotel,2026-01-02,90\n",
            )
        },
    )

    assert response.status_code == 200
    body = response.json()
    assert body["filename"] == "bookings.csv"
    assert body["row_count"] == 2
    assert body["column_count"] == 3
    assert body["column_names"] == ["hotel", "arrival_date", "adr"]
    assert body["profile"]["row_count"] == 2
    assert body["profile"]["column_count"] == 3
    assert {column["name"] for column in body["profile"]["columns"]} == {
        "hotel",
        "arrival_date",
        "adr",
    }

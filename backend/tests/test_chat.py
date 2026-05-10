"""Tests for chat endpoint and chat tools."""

import json
import os

import pytest
from fastapi.testclient import TestClient

from backend.app.main import app
from backend.app.services.chat_tools import (
    answer_hotel_booking_question,
    calculate_grouped_metric,
    calculate_summary_metric,
    get_dataset_profile,
    get_dataset_rows_sample,
)


client = TestClient(app)


class TestChatTools:
    """Test backend chat tools for data-grounded queries."""

    def test_get_dataset_profile(self, hotel_booking_dataset_id_tool_test) -> None:
        """get_dataset_profile returns dataset metadata."""
        result = get_dataset_profile(hotel_booking_dataset_id_tool_test)

        assert "column_names" in result
        assert "hotel" in result["column_names"]
        assert "is_canceled" in result["column_names"]

    def test_get_dataset_profile_invalid_id(self) -> None:
        """get_dataset_profile returns error for invalid dataset."""
        result = get_dataset_profile("invalid-id")

        assert "error" in result

    def test_get_dataset_rows_sample(self, hotel_booking_dataset_id_tool_test) -> None:
        """get_dataset_rows_sample returns sample rows."""
        result = get_dataset_rows_sample(hotel_booking_dataset_id_tool_test, limit=5)

        assert "sample" in result
        assert "total_rows" in result
        assert len(result["sample"]) <= 5

    def test_calculate_summary_metric_mean(self, hotel_booking_dataset_id_tool_test) -> None:
        """calculate_summary_metric calculates mean for numeric column."""
        result = calculate_summary_metric(hotel_booking_dataset_id_tool_test, "adr", "mean")

        assert "value" in result
        assert result["metric"] == "mean"
        assert result["value"] > 0

    def test_calculate_summary_metric_count(self, hotel_booking_dataset_id_tool_test) -> None:
        """calculate_summary_metric counts rows."""
        result = calculate_summary_metric(hotel_booking_dataset_id_tool_test, "adr", "count")

        assert "value" in result
        assert result["metric"] == "count"
        assert result["value"] > 0

    def test_calculate_grouped_metric_rate(self, hotel_booking_dataset_id_tool_test) -> None:
        """calculate_grouped_metric calculates rate by group."""
        result = calculate_grouped_metric(
            hotel_booking_dataset_id_tool_test,
            "hotel",
            "is_canceled",
            "rate",
        )

        assert "results" in result
        assert "group_column" in result
        # Should have City Hotel and/or Resort Hotel
        assert len(result["results"]) > 0


class TestChatEndpoint:
    """Test POST /chat endpoint."""

    def test_chat_rejects_invalid_dataset_id(self) -> None:
        """POST /chat returns 404 for invalid dataset_id."""
        response = client.post(
            "/chat",
            json={
                "dataset_id": "invalid-id",
                "question": "What is the cancellation rate?",
            },
        )

        assert response.status_code == 404

    def test_chat_answers_cancellation_rate_question(self, monkeypatch, tmp_path) -> None:
        """POST /chat answers cancellation rate question."""
        monkeypatch.setenv("DATALENS_DB_PATH", str(tmp_path / "test.db"))
        
        csv_data = b"""hotel,is_canceled,lead_time,arrival_date_year,arrival_date_month,country,market_segment,is_repeated_guest,adr
City Hotel,0,342,2015,July,PRT,Direct,0,100
City Hotel,1,737,2015,July,GBR,Direct,0,0
Resort Hotel,0,7,2015,July,GBR,Corporate,1,75"""
        
        upload_response = client.post(
            "/upload",
            files={"file": ("hotel_booking.csv", csv_data)},
        )
        dataset_id = upload_response.json()["dataset_id"]
        
        response = client.post(
            "/chat",
            json={
                "dataset_id": dataset_id,
                "question": "What is the overall cancellation rate?",
            },
        )

        assert response.status_code == 200
        body = response.json()
        assert body["dataset_id"] == dataset_id
        assert "cancellation" in body["answer"].lower()
        assert "data" in body
        assert body["data"]["question_type"] == "cancellation_rate"
        assert "overall_rate" in body["data"]
        assert "by_hotel" in body["data"]

    def test_chat_includes_data_grounded_calculations(self, monkeypatch, tmp_path) -> None:
        """POST /chat response includes methodology and data."""
        monkeypatch.setenv("DATALENS_DB_PATH", str(tmp_path / "test.db"))
        
        csv_data = b"""hotel,is_canceled,lead_time,arrival_date_year,arrival_date_month,country,market_segment,is_repeated_guest,adr
City Hotel,0,342,2015,July,PRT,Direct,0,100
City Hotel,1,737,2015,July,GBR,Direct,0,0"""
        
        upload_response = client.post(
            "/upload",
            files={"file": ("hotel_booking.csv", csv_data)},
        )
        dataset_id = upload_response.json()["dataset_id"]
        
        response = client.post(
            "/chat",
            json={
                "dataset_id": dataset_id,
                "question": "What is the cancellation rate?",
            },
        )

        body = response.json()
        assert "methodology" in body["data"]
        assert body["data"]["methodology"]  # Non-empty string

    def test_chat_answers_top_countries_question(self, monkeypatch, tmp_path) -> None:
        """POST /chat answers top source markets question."""
        monkeypatch.setenv("DATALENS_DB_PATH", str(tmp_path / "test.db"))
        
        csv_data = b"""hotel,is_canceled,lead_time,arrival_date_year,arrival_date_month,country,market_segment,is_repeated_guest,adr
City Hotel,0,342,2015,July,PRT,Direct,0,100
City Hotel,0,100,2015,July,USA,Direct,0,100
Resort Hotel,0,7,2015,July,GBR,Corporate,1,75"""
        
        upload_response = client.post(
            "/upload",
            files={"file": ("hotel_booking.csv", csv_data)},
        )
        dataset_id = upload_response.json()["dataset_id"]
        
        response = client.post(
            "/chat",
            json={
                "dataset_id": dataset_id,
                "question": "Which countries are the top source markets?",
            },
        )

        assert response.status_code == 200
        body = response.json()
        assert "top" in body["answer"].lower() or "market" in body["answer"].lower()
        assert body["data"]["question_type"] == "top_markets"
        assert "top_markets" in body["data"]

    def test_chat_answers_adr_by_month_question(self, monkeypatch, tmp_path) -> None:
        """POST /chat answers ADR by month question."""
        monkeypatch.setenv("DATALENS_DB_PATH", str(tmp_path / "test.db"))
        
        csv_data = b"""hotel,is_canceled,lead_time,arrival_date_year,arrival_date_month,country,market_segment,is_repeated_guest,adr
City Hotel,0,342,2015,July,PRT,Direct,0,100
Resort Hotel,0,7,2015,August,GBR,Corporate,1,150"""
        
        upload_response = client.post(
            "/upload",
            files={"file": ("hotel_booking.csv", csv_data)},
        )
        dataset_id = upload_response.json()["dataset_id"]
        
        response = client.post(
            "/chat",
            json={
                "dataset_id": dataset_id,
                "question": "What is the average daily rate by month?",
            },
        )

        assert response.status_code == 200
        body = response.json()
        assert "adr" in body["answer"].lower() or "average" in body["answer"].lower()
        assert body["data"]["question_type"] == "adr_by_month"
        assert "adr_by_month" in body["data"]

    def test_chat_answers_lead_time_question(self, monkeypatch, tmp_path) -> None:
        """POST /chat answers lead time correlation question."""
        monkeypatch.setenv("DATALENS_DB_PATH", str(tmp_path / "test.db"))
        
        csv_data = b"""hotel,is_canceled,lead_time,arrival_date_year,arrival_date_month,country,market_segment,is_repeated_guest,adr
City Hotel,0,342,2015,July,PRT,Direct,0,100
City Hotel,1,737,2015,July,GBR,Direct,0,0
Resort Hotel,0,7,2015,July,GBR,Corporate,1,75"""
        
        upload_response = client.post(
            "/upload",
            files={"file": ("hotel_booking.csv", csv_data)},
        )
        dataset_id = upload_response.json()["dataset_id"]
        
        response = client.post(
            "/chat",
            json={
                "dataset_id": dataset_id,
                "question": "How does lead time correlate with cancellation?",
            },
        )

        assert response.status_code == 200
        body = response.json()
        assert "lead" in body["answer"].lower()
        assert body["data"]["question_type"] == "lead_time_cancellation"

    def test_chat_answers_repeat_guest_question(self, monkeypatch, tmp_path) -> None:
        """POST /chat answers repeat guest rates question."""
        monkeypatch.setenv("DATALENS_DB_PATH", str(tmp_path / "test.db"))
        
        csv_data = b"""hotel,is_canceled,lead_time,arrival_date_year,arrival_date_month,country,market_segment,is_repeated_guest,adr
City Hotel,0,342,2015,July,Direct,Direct,0,100
City Hotel,0,100,2015,July,Online,Online,1,100
Resort Hotel,0,7,2015,July,Corporate,Corporate,0,75"""
        
        upload_response = client.post(
            "/upload",
            files={"file": ("hotel_booking.csv", csv_data)},
        )
        dataset_id = upload_response.json()["dataset_id"]
        
        response = client.post(
            "/chat",
            json={
                "dataset_id": dataset_id,
                "question": "Which market segments have the highest repeat guest rates?",
            },
        )

        assert response.status_code == 200
        body = response.json()
        assert "repeat" in body["answer"].lower()
        assert body["data"]["question_type"] == "repeat_guest_rates"
        assert "repeat_rates" in body["data"]

    def test_chat_returns_error_for_unclear_question(self, monkeypatch, tmp_path) -> None:
        """POST /chat returns error for unclear questions."""
        monkeypatch.setenv("DATALENS_DB_PATH", str(tmp_path / "test.db"))
        
        csv_data = b"""hotel,is_canceled,lead_time,arrival_date_year,arrival_date_month,country,market_segment,is_repeated_guest,adr
City Hotel,0,342,2015,July,PRT,Direct,0,100"""
        
        upload_response = client.post(
            "/upload",
            files={"file": ("hotel_booking.csv", csv_data)},
        )
        dataset_id = upload_response.json()["dataset_id"]
        
        response = client.post(
            "/chat",
            json={
                "dataset_id": dataset_id,
                "question": "What color is the sky?",
            },
        )

        assert response.status_code == 400


class TestHotelBookingQuestions:
    """Test Hotel Booking specific question answering."""

    def test_answer_hotel_booking_question_cancellation(self, hotel_booking_dataset_id_tool_test) -> None:
        """answer_hotel_booking_question returns cancellation rate data."""
        result = answer_hotel_booking_question(
            hotel_booking_dataset_id_tool_test,
            "What is the overall cancellation rate and how does it differ between hotel types?",
        )

        assert "error" not in result
        assert result["question_type"] == "cancellation_rate"
        assert "overall_rate" in result
        assert 0 <= result["overall_rate"] <= 1
        assert "by_hotel" in result
        assert isinstance(result["by_hotel"], dict)

    def test_answer_hotel_booking_question_top_markets(self, hotel_booking_dataset_id_tool_test) -> None:
        """answer_hotel_booking_question returns top markets."""
        result = answer_hotel_booking_question(
            hotel_booking_dataset_id_tool_test,
            "Which countries are the top 10 source markets?",
        )

        assert "error" not in result
        assert result["question_type"] == "top_markets"
        assert "top_markets" in result
        assert len(result["top_markets"]) > 0

    def test_answer_hotel_booking_question_adr_by_month(self, hotel_booking_dataset_id_tool_test) -> None:
        """answer_hotel_booking_question returns ADR by month."""
        result = answer_hotel_booking_question(
            hotel_booking_dataset_id_tool_test,
            "What is the average daily rate by month?",
        )

        assert "error" not in result
        assert result["question_type"] == "adr_by_month"
        assert "adr_by_month" in result
        assert len(result["adr_by_month"]) > 0

    def test_answer_hotel_booking_question_lead_time(self, hotel_booking_dataset_id_tool_test) -> None:
        """answer_hotel_booking_question returns lead time analysis."""
        result = answer_hotel_booking_question(
            hotel_booking_dataset_id_tool_test,
            "How does lead time correlate with cancellation probability?",
        )

        assert "error" not in result
        assert result["question_type"] == "lead_time_cancellation"
        assert "avg_lead_time_canceled" in result
        assert "avg_lead_time_non_canceled" in result

    def test_answer_hotel_booking_question_repeat_guests(self, hotel_booking_dataset_id_tool_test) -> None:
        """answer_hotel_booking_question returns repeat guest rates."""
        result = answer_hotel_booking_question(
            hotel_booking_dataset_id_tool_test,
            "Which market segments have the highest repeat guest rates?",
        )

        assert "error" not in result
        assert result["question_type"] == "repeat_guest_rates"
        assert "repeat_rates" in result
        assert len(result["repeat_rates"]) > 0

    def test_answer_hotel_booking_question_rejects_non_hotel_booking(self, monkeypatch, tmp_path) -> None:
        """answer_hotel_booking_question rejects non-Hotel Booking datasets."""
        monkeypatch.setenv("DATALENS_DB_PATH", str(tmp_path / "test.db"))
        
        # Create a simple dataset without Hotel Booking columns
        simple_csv = b"product,price\nApple,1.00\nBanana,0.50\n"
        upload_response = client.post(
            "/upload",
            files={"file": ("products.csv", simple_csv)},
        )
        simple_dataset_id = upload_response.json()["dataset_id"]

        result = answer_hotel_booking_question(
            simple_dataset_id,
            "What is the cancellation rate?",
        )

        assert "error" in result



@pytest.fixture
def hotel_booking_dataset_id_tool_test(monkeypatch, tmp_path) -> str:
    """Fixture: upload Hotel Booking sample data and return dataset_id for tool tests."""
    monkeypatch.setenv("DATALENS_DB_PATH", str(tmp_path / "test.db"))

    # Create a minimal Hotel Booking CSV with all required columns
    csv_data = b"""hotel,is_canceled,lead_time,arrival_date_year,arrival_date_month,country,market_segment,is_repeated_guest,adr
City Hotel,0,342,2015,July,PRT,Direct,0,100
City Hotel,1,737,2015,July,GBR,Direct,0,0
Resort Hotel,0,7,2015,July,GBR,Corporate,1,75
Resort Hotel,0,13,2015,July,FRA,Corporate,0,75
City Hotel,1,14,2015,July,USA,Online,0,50
Resort Hotel,0,0,2015,August,DEU,Online,0,150
City Hotel,0,0,2015,August,ITA,Direct,0,120
City Hotel,1,1,2015,September,ESP,Direct,0,80
Resort Hotel,1,100,2015,September,NLD,Online,1,200
City Hotel,0,50,2015,September,CHE,Corporate,0,110"""

    response = client.post(
        "/upload",
        files={"file": ("hotel_booking.csv", csv_data)},
    )

    assert response.status_code == 200
    return response.json()["dataset_id"]

from __future__ import annotations

from typing import Any

from backend.app.db.storage import get_dataset
from backend.app.services.chat_tools import answer_hotel_booking_question


HOTEL_SUMMARY_QUESTIONS = {
    "cancellation": "What is the overall cancellation rate and how does it differ between City Hotel and Resort Hotel?",
    "top_markets": "Which countries are the top 10 source markets?",
    "lead_time": "How does lead time correlate with cancellation probability?",
    "adr_by_month": "What is the average daily rate by month?",
    "repeat_guests": "Which market segments have the highest repeat guest rates?",
}


def generate_executive_summary(dataset_id: str) -> dict[str, Any] | None:
    """Generate a deterministic, data-grounded executive summary for a saved dataset."""
    dataset = get_dataset(dataset_id)
    if dataset is None:
        return None

    rows = dataset.get("rows", [])
    column_names = dataset.get("column_names", [])
    data_quality_notes = _data_quality_notes(dataset, rows)
    is_hotel_booking = _is_hotel_booking_dataset(column_names)

    if not is_hotel_booking:
        summary = (
            f"Dataset '{dataset['filename']}' contains {dataset['row_count']} rows and "
            f"{dataset['column_count']} columns. No Hotel Booking Demand-specific summary was "
            "generated because the required hotel columns were not present."
        )
        return {
            "dataset_id": dataset_id,
            "summary": summary,
            "key_findings": [summary],
            "data_quality_notes": data_quality_notes,
            "data": {"profile": _profile_metadata(dataset)},
        }

    results = {
        name: answer_hotel_booking_question(dataset_id, question)
        for name, question in HOTEL_SUMMARY_QUESTIONS.items()
    }
    key_findings = _hotel_key_findings(results)
    summary = " ".join(key_findings + data_quality_notes)

    return {
        "dataset_id": dataset_id,
        "summary": summary,
        "key_findings": key_findings,
        "data_quality_notes": data_quality_notes,
        "data": results,
    }


def _is_hotel_booking_dataset(column_names: list[str]) -> bool:
    required_columns = {"hotel", "is_canceled", "adr"}
    return required_columns.issubset(set(column_names))


def _profile_metadata(dataset: dict[str, Any]) -> dict[str, Any]:
    return {
        "filename": dataset["filename"],
        "row_count": dataset["row_count"],
        "column_count": dataset["column_count"],
        "column_names": dataset["column_names"],
    }


def _data_quality_notes(dataset: dict[str, Any], rows: list[dict[str, Any]]) -> list[str]:
    missing_count = sum(
        1
        for row in rows
        for value in row.values()
        if value is None or value == ""
    )
    notes = [
        f"Data quality: {dataset['row_count']} rows and {dataset['column_count']} columns were loaded from {dataset['filename']}."
    ]
    if missing_count:
        notes.append(f"Detected {missing_count} missing values across saved rows.")
    else:
        notes.append("No missing values were detected in saved rows.")
    notes.append("No cleaning log is available yet, so this summary uses the persisted uploaded rows.")
    return notes


def _hotel_key_findings(results: dict[str, dict[str, Any]]) -> list[str]:
    findings: list[str] = []

    cancellation = results.get("cancellation", {})
    if "error" not in cancellation:
        overall_rate = cancellation.get("overall_rate")
        by_hotel = cancellation.get("by_hotel", {})
        if isinstance(overall_rate, (float, int)):
            findings.append(f"Overall cancellation rate is {overall_rate:.1%}.")
        if by_hotel:
            comparison = ", ".join(
                f"{hotel}: {rate:.1%}" for hotel, rate in by_hotel.items() if isinstance(rate, (float, int))
            )
            if comparison:
                findings.append(f"Cancellation by hotel type: {comparison}.")

    top_markets = results.get("top_markets", {})
    if "error" not in top_markets and top_markets.get("top_markets"):
        top_items = list(top_markets["top_markets"].items())[:5]
        findings.append(
            "Top source countries are "
            + ", ".join(f"{country} ({count})" for country, count in top_items)
            + "."
        )

    adr_by_month = results.get("adr_by_month", {})
    if "error" not in adr_by_month and adr_by_month.get("adr_by_month"):
        adr_items = list(adr_by_month["adr_by_month"].items())
        if adr_items:
            highest_month, highest_adr = max(adr_items, key=lambda item: item[1])
            findings.append(f"Highest average ADR is in {highest_month} at {highest_adr}.")

    lead_time = results.get("lead_time", {})
    if "error" not in lead_time:
        canceled = lead_time.get("avg_lead_time_canceled")
        non_canceled = lead_time.get("avg_lead_time_non_canceled")
        if isinstance(canceled, (float, int)) and isinstance(non_canceled, (float, int)):
            findings.append(
                f"Canceled bookings average {canceled:.0f} lead-time days versus {non_canceled:.0f} for non-canceled bookings."
            )

    repeat_guests = results.get("repeat_guests", {})
    if "error" not in repeat_guests and repeat_guests.get("repeat_rates"):
        segment, rate = next(iter(repeat_guests["repeat_rates"].items()))
        findings.append(f"Highest repeat guest rate is in {segment} at {rate:.1%}.")

    return findings

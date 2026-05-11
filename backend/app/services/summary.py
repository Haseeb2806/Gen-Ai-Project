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
    dataset_type = _detect_dataset_type(column_names)

    if dataset_type == "hotel":
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
    
    elif dataset_type == "sales":
        key_findings = _sales_key_findings(dataset, rows, column_names)
        summary = " ".join(key_findings + data_quality_notes)
        
        return {
            "dataset_id": dataset_id,
            "summary": summary,
            "key_findings": key_findings,
            "data_quality_notes": data_quality_notes,
            "data": {"profile": _profile_metadata(dataset), "dataset_type": "sales"},
        }
    
    else:  # generic
        key_findings = _generic_key_findings(dataset, rows, column_names)
        summary = " ".join(key_findings + data_quality_notes)
        
        return {
            "dataset_id": dataset_id,
            "summary": summary,
            "key_findings": key_findings,
            "data_quality_notes": data_quality_notes,
            "data": {"profile": _profile_metadata(dataset), "dataset_type": "generic"},
        }


def _detect_dataset_type(column_names: list[str]) -> str:
    """Detect the dataset type: 'hotel', 'sales', or 'generic'."""
    names_normalized = [col.lower().replace("_", "").replace("-", "") for col in column_names]
    names_set = set(names_normalized)
    
    # Check for hotel booking signals - more specific check
    hotel_signals = {"hotel", "iscanceled", "adr", "leadtime", "marketsequment", "country", "reservationstatusdate"}
    if len(hotel_signals & names_set) >= 3:
        return "hotel"
    
    # Check for sales/retail signals - need strong evidence
    # Primary sales measures (weekly_sales is a strong signal)
    strong_sales_measures = {"sales", "weeklysales", "yearlysales", "revenue"}
    has_strong_sales = any(
        name in strong_sales_measures
        for name in names_normalized
    )
    
    # Store/Product dimensions
    strong_dimensions = {"store", "storeid", "product", "productid"}
    has_dimension = any(
        name in strong_dimensions
        for name in names_normalized
    )
    
    if has_strong_sales and has_dimension:
        return "sales"
    
    # Default to generic
    return "generic"


def _is_hotel_booking_dataset(column_names: list[str]) -> bool:
    """Legacy check for hotel booking dataset."""
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


def _sales_key_findings(dataset: dict[str, Any], rows: list[dict[str, Any]], column_names: list[str]) -> list[str]:
    """Generate sales/retail-focused key findings."""
    findings: list[str] = []
    
    # Find sales-related columns
    sales_col = None
    store_col = None
    date_col = None
    holiday_col = None
    
    for col in column_names:
        col_lower = col.lower()
        if any(x in col_lower for x in ["sales", "revenue", "amount"]) and not sales_col:
            sales_col = col
        if any(x in col_lower for x in ["store", "product", "category"]) and not store_col:
            store_col = col
        if any(x in col_lower for x in ["date", "month", "week"]) and not date_col:
            date_col = col
        if any(x in col_lower for x in ["holiday", "flag"]) and not holiday_col:
            holiday_col = col
    
    # Calculate sales metrics
    if sales_col:
        sales_values = []
        for row in rows:
            val = row.get(sales_col)
            if val is not None:
                try:
                    sales_values.append(float(val))
                except (ValueError, TypeError):
                    pass
        
        if sales_values:
            avg_sales = sum(sales_values) / len(sales_values)
            total_sales = sum(sales_values)
            findings.append(f"Average {sales_col.replace('_', ' ').title()} is ${avg_sales:,.2f}.")
            findings.append(f"Total {sales_col.replace('_', ' ').title()} across dataset is ${total_sales:,.2f}.")
    
    # Store performance
    if store_col and sales_col:
        store_metrics: dict[str, list[float]] = {}
        for row in rows:
            store = str(row.get(store_col, "Unknown"))
            sales_val = row.get(sales_col)
            if sales_val is not None:
                try:
                    if store not in store_metrics:
                        store_metrics[store] = []
                    store_metrics[store].append(float(sales_val))
                except (ValueError, TypeError):
                    pass
        
        if store_metrics:
            best_store = max(store_metrics.items(), key=lambda x: sum(x[1]) / len(x[1]))
            findings.append(f"Best performing {store_col.replace('_', ' ').title().lower()} is {best_store[0]} with average {best_store[1][0]:,.2f}.")
    
    # Holiday comparison
    if holiday_col and sales_col:
        holiday_sales = []
        non_holiday_sales = []
        for row in rows:
            sales_val = row.get(sales_col)
            holiday_val = row.get(holiday_col)
            if sales_val is not None and holiday_val is not None:
                try:
                    sales_f = float(sales_val)
                    if float(holiday_val) == 1:
                        holiday_sales.append(sales_f)
                    else:
                        non_holiday_sales.append(sales_f)
                except (ValueError, TypeError):
                    pass
        
        if holiday_sales and non_holiday_sales:
            avg_holiday = sum(holiday_sales) / len(holiday_sales)
            avg_non_holiday = sum(non_holiday_sales) / len(non_holiday_sales)
            findings.append(f"Holiday periods show average {sales_col.replace('_', ' ').title().lower()} of ${avg_holiday:,.2f} vs ${avg_non_holiday:,.2f} for non-holiday periods.")
    
    if not findings:
        findings.append(f"Dataset contains {len(rows)} sales transactions across {len(column_names)} fields.")
    
    return findings


def _generic_key_findings(dataset: dict[str, Any], rows: list[dict[str, Any]], column_names: list[str]) -> list[str]:
    """Generate generic/exploratory key findings."""
    findings: list[str] = []
    
    findings.append(f"Dataset contains {len(rows)} rows across {len(column_names)} columns.")
    
    # Find numeric and categorical columns
    numeric_cols = []
    categorical_cols = []
    
    if rows:
        first_row = rows[0]
        for col in column_names:
            val = first_row.get(col)
            if val is not None:
                try:
                    float(val)
                    numeric_cols.append(col)
                except (ValueError, TypeError):
                    categorical_cols.append(col)
    
    if numeric_cols:
        findings.append(f"Found {len(numeric_cols)} numeric field(s): {', '.join(numeric_cols[:3])}{'...' if len(numeric_cols) > 3 else ''}.")
    
    if categorical_cols:
        findings.append(f"Found {len(categorical_cols)} categorical field(s): {', '.join(categorical_cols[:3])}{'...' if len(categorical_cols) > 3 else ''}.")
    
    missing_total = sum(
        1 for row in rows
        for value in row.values()
        if value is None or value == ""
    )
    if missing_total > 0:
        findings.append(f"Detected {missing_total} missing values across all fields.")
    else:
        findings.append("No missing values detected in the dataset.")
    
    if not findings:
        findings.append(f"Dataset profiled with {len(column_names)} fields and {len(rows)} records.")
    
    return findings

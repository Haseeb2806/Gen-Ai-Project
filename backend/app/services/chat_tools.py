"""Backend tools for data-grounded chat queries."""

from __future__ import annotations

import json
import re
from typing import Any

import pandas as pd

from backend.app.db.storage import get_dataset


# Helper function to extract years from question
def extract_years_from_question(question: str) -> list[int]:
    """Extract year numbers from question."""
    years = re.findall(r'\b(201\d|202\d)\b', question)
    return [int(y) for y in years]


# Helper function to extract month from question
def extract_month_from_question(question: str) -> str | None:
    """Extract month name from question."""
    month_names = ["january", "february", "march", "april", "may", "june",
                   "july", "august", "september", "october", "november", "december"]
    question_lower = question.lower()
    for month in month_names:
        if month in question_lower:
            return month.capitalize()
    return None


# Helper function to identify metric type from question
def identify_metric_type(question: str) -> str:
    """Identify what metric is being asked for."""
    question_lower = question.lower()
    
    if any(word in question_lower for word in ["compare", "difference", "vs", "versus", "vs.", "between"]):
        return "comparison"
    elif any(word in question_lower for word in ["total", "sum", "all"]):
        return "sum"
    elif any(word in question_lower for word in ["average", "avg", "mean", "typical"]):
        return "average"
    elif any(word in question_lower for word in ["maximum", "max", "highest", "highest"]):
        return "max"
    elif any(word in question_lower for word in ["minimum", "min", "lowest"]):
        return "min"
    elif any(word in question_lower for word in ["count", "how many", "number of"]):
        return "count"
    elif any(word in question_lower for word in ["rate", "percentage", "%"]):
        return "rate"
    else:
        return "summary"


# Helper to find column matches in question
def find_matching_columns(question: str, available_columns: list[str]) -> list[str]:
    """Find columns mentioned in the question."""
    question_lower = question.lower()
    matches = []
    
    for col in available_columns:
        col_lower = col.lower()
        if col_lower in question_lower or col_lower.replace("_", " ") in question_lower:
            matches.append(col)
    
    # Map common aliases
    aliases = {
        "price": ["adr", "daily_rate"],
        "rate": ["adr", "cancellation", "is_canceled"],
        "booking": ["hotel", "booking"],
        "guest": ["is_repeated_guest", "guests"],
        "date": ["arrival_date_month", "arrival_date_year"],
    }
    
    for alias, cols in aliases.items():
        if alias in question_lower:
            for col in cols:
                if col in available_columns and col not in matches:
                    matches.append(col)
    
    return matches


def get_dataset_profile(dataset_id: str) -> dict[str, Any]:
    """Get the profile (column names, types, statistics) for a dataset.
    
    Args:
        dataset_id: The dataset ID to profile
        
    Returns:
        Profile dictionary with column information
    """
    dataset = get_dataset(dataset_id)
    if not dataset:
        return {"error": f"Dataset {dataset_id} not found"}
    
    return {
        "filename": dataset["filename"],
        "row_count": dataset["row_count"],
        "column_count": dataset["column_count"],
        "column_names": dataset["column_names"],
    }


def get_dataset_rows_sample(dataset_id: str, limit: int = 10, offset: int = 0) -> dict[str, Any]:
    """Get a sample of rows from a dataset.
    
    Args:
        dataset_id: The dataset ID
        limit: Number of rows to return
        offset: Starting row index
        
    Returns:
        Dictionary with rows array
    """
    dataset = get_dataset(dataset_id)
    if not dataset:
        return {"error": f"Dataset {dataset_id} not found"}
    
    rows = dataset.get("rows", [])
    sample = rows[offset:offset + limit]
    
    return {
        "total_rows": len(rows),
        "offset": offset,
        "limit": limit,
        "sample": sample,
    }


def calculate_summary_metric(dataset_id: str, column: str, metric: str) -> dict[str, Any]:
    """Calculate a summary metric (min, max, mean, median, count, sum) for a column.
    
    Args:
        dataset_id: The dataset ID
        column: Column name
        metric: One of 'min', 'max', 'mean', 'median', 'count', 'sum'
        
    Returns:
        Dictionary with metric value or error
    """
    dataset = get_dataset(dataset_id)
    if not dataset:
        return {"error": f"Dataset {dataset_id} not found"}
    
    rows = dataset.get("rows", [])
    if not rows:
        return {"error": "Dataset has no rows"}
    
    # Extract column values
    values = []
    for row in rows:
        val = row.get(column)
        if val is not None:
            try:
                values.append(float(val))
            except (ValueError, TypeError):
                pass
    
    if not values:
        return {"error": f"No numeric values found in column {column}"}
    
    if metric == "min":
        return {"metric": metric, "value": min(values)}
    elif metric == "max":
        return {"metric": metric, "value": max(values)}
    elif metric == "mean":
        return {"metric": metric, "value": sum(values) / len(values)}
    elif metric == "median":
        sorted_vals = sorted(values)
        n = len(sorted_vals)
        if n % 2 == 0:
            return {"metric": metric, "value": (sorted_vals[n // 2 - 1] + sorted_vals[n // 2]) / 2}
        else:
            return {"metric": metric, "value": sorted_vals[n // 2]}
    elif metric == "count":
        return {"metric": metric, "value": len(values)}
    elif metric == "sum":
        return {"metric": metric, "value": sum(values)}
    else:
        return {"error": f"Unknown metric: {metric}"}


def calculate_grouped_metric(
    dataset_id: str,
    group_column: str,
    value_column: str,
    metric: str,
) -> dict[str, Any]:
    """Calculate grouped metrics (e.g., cancellation rate by hotel type).
    
    Args:
        dataset_id: The dataset ID
        group_column: Column to group by
        value_column: Column to calculate metric on
        metric: One of 'mean', 'count', 'rate' (for binary 0/1), 'sum'
        
    Returns:
        Dictionary with groups and their metric values
    """
    dataset = get_dataset(dataset_id)
    if not dataset:
        return {"error": f"Dataset {dataset_id} not found"}
    
    rows = dataset.get("rows", [])
    if not rows:
        return {"error": "Dataset has no rows"}
    
    # Group rows by group_column
    groups: dict[str, list[float]] = {}
    group_counts: dict[str, int] = {}
    
    for row in rows:
        group_key = str(row.get(group_column, "Unknown"))
        value = row.get(value_column)
        
        if group_key not in groups:
            groups[group_key] = []
            group_counts[group_key] = 0
        
        group_counts[group_key] += 1
        
        if value is not None:
            try:
                groups[group_key].append(float(value))
            except (ValueError, TypeError):
                pass
    
    results = {}
    
    if metric == "rate":
        # For binary values (0/1), calculate rate of 1s
        for group_key, values in groups.items():
            if values:
                rate = sum(1 for v in values if v == 1) / len(values)
                results[group_key] = round(rate, 4)
    elif metric == "mean":
        for group_key, values in groups.items():
            if values:
                results[group_key] = round(sum(values) / len(values), 2)
    elif metric == "count":
        for group_key in groups:
            results[group_key] = group_counts[group_key]
    elif metric == "sum":
        for group_key, values in groups.items():
            if values:
                results[group_key] = round(sum(values), 2)
    else:
        return {"error": f"Unknown metric: {metric}"}
    
    return {"group_column": group_column, "value_column": value_column, "metric": metric, "results": results}


def answer_hotel_booking_question(dataset_id: str, question: str) -> dict[str, Any]:
    """Answer a Hotel Booking question using intelligent pattern matching and dynamic analysis.
    
    Args:
        dataset_id: The dataset ID
        question: The user's question
        
    Returns:
        Dictionary with answer and data
    """
    question_lower = question.lower()
    dataset = get_dataset(dataset_id)
    
    if not dataset:
        return {"error": f"Dataset {dataset_id} not found"}
    
    col_names = dataset.get("column_names", [])
    rows = dataset.get("rows", [])
    
    if not rows:
        return {"error": "Dataset has no rows"}
    
    # Extract query parameters
    metric_type = identify_metric_type(question)
    years = extract_years_from_question(question)
    month = extract_month_from_question(question)
    matching_cols = find_matching_columns(question, col_names)
    
    # Handle dataset info questions
    if any(phrase in question_lower for phrase in ["row count", "column count", "rows", "columns", "how many", "dataset size", "dimensions"]):
        return {
            "question_type": "dataset_info",
            "answer": f"This dataset has {len(rows)} rows and {len(col_names)} columns.",
            "row_count": len(rows),
            "column_count": len(col_names),
            "column_names": col_names,
            "methodology": "Retrieved dataset metadata",
        }
    
    # --- YEAR/TIME-BASED COMPARISONS ---
    if years and "compare" in question_lower or (years and "vs" in question_lower):
        return handle_year_comparison(dataset_id, rows, years, question)
    
    # --- PRICE/ADR ANALYSIS ---
    if any(keyword in question_lower for keyword in ["price", "adr", "daily rate", "rate", "cost"]):
        return handle_price_analysis(dataset_id, rows, month, years, metric_type, question)
    
    # --- CANCELLATION ANALYSIS ---
    if "cancel" in question_lower:
        return handle_cancellation_analysis(dataset_id, rows, month, years, metric_type, question)
    
    # --- COUNTRY/MARKET ANALYSIS ---
    if any(keyword in question_lower for keyword in ["country", "market", "source", "origin"]):
        return handle_market_analysis(dataset_id, rows, years, metric_type, question)
    
    # --- LEAD TIME ANALYSIS ---
    if "lead" in question_lower:
        return handle_lead_time_analysis(dataset_id, rows, month, years, question)
    
    # --- REPEAT GUEST ANALYSIS ---
    if "repeat" in question_lower or "guest" in question_lower:
        return handle_repeat_guest_analysis(dataset_id, rows, metric_type, question)
    
    # --- GENERIC METRIC CALCULATION ---
    if matching_cols and metric_type != "summary":
        for col in matching_cols:
            return handle_generic_metric(dataset_id, rows, col, metric_type, month, years, question)
    
    # Fallback
    return {
        "error": "Could not determine how to answer this question",
        "hint": "Try asking about: prices/ADR, cancellations, countries, lead time, repeat guests, or specific metrics",
        "tips": [
            "Compare 2017 vs 2018 prices",
            "What was the average price in April?",
            "Show me cancellation rates by country",
            "How does lead time affect cancellations?",
            "Which market segments have most repeat guests?"
        ],
    }


def handle_year_comparison(dataset_id: str, rows: list, years: list[int], question: str) -> dict[str, Any]:
    """Handle year-to-year comparisons."""
    question_lower = question.lower()
    
    # Determine what metric to compare
    if "price" in question_lower or "adr" in question_lower or "rate" in question_lower:
        metric_col = "adr"
        metric_name = "Average Daily Rate"
    elif "cancel" in question_lower:
        metric_col = "is_canceled"
        metric_name = "Cancellation Rate"
    elif "booking" in question_lower:
        metric_col = None
        metric_name = "Bookings"
    else:
        metric_col = "adr"
        metric_name = "Average Daily Rate"
    
    # Group by year
    data_by_year = {}
    for year in years:
        year_data = []
        for row in rows:
            row_year = row.get("arrival_date_year")
            if row_year == year:
                year_data.append(row)
        
        if metric_col and metric_col != "is_canceled":
            values = [float(r.get(metric_col, 0)) for r in year_data if r.get(metric_col)]
            avg = sum(values) / len(values) if values else 0
            data_by_year[year] = avg
        elif metric_col == "is_canceled":
            canceled = sum(1 for r in year_data if r.get("is_canceled") == 1)
            rate = (canceled / len(year_data)) * 100 if year_data else 0
            data_by_year[year] = rate
        else:
            data_by_year[year] = len(year_data)
    
    # Generate comparison
    if len(data_by_year) == 2:
        years_sorted = sorted(data_by_year.keys())
        val1, val2 = data_by_year[years_sorted[0]], data_by_year[years_sorted[1]]
        pct_change = ((val2 - val1) / val1 * 100) if val1 > 0 else 0
        change_text = "increased" if pct_change > 0 else "decreased"
        
        return {
            "question_type": "year_comparison",
            "answer": f"{metric_name} {change_text} from {val1:.2f} in {years_sorted[0]} to {val2:.2f} in {years_sorted[1]} ({pct_change:+.1f}%)",
            "year_1": years_sorted[0],
            "value_1": round(val1, 2),
            "year_2": years_sorted[1],
            "value_2": round(val2, 2),
            "percent_change": round(pct_change, 2),
            "metric": metric_name,
            "methodology": f"Compared {metric_name} across years",
        }
    
    return {"error": "Need at least 2 years for comparison"}


def handle_price_analysis(dataset_id: str, rows: list, month: str | None, years: list[int], metric_type: str, question: str) -> dict[str, Any]:
    """Handle price/ADR analysis queries."""
    adr_data = []
    
    for row in rows:
        adr = row.get("adr")
        if adr is not None:
            try:
                adr_val = float(adr)
                if adr_val > 0:
                    adr_data.append((adr_val, row))
            except (ValueError, TypeError):
                pass
    
    if not adr_data:
        return {"error": "No price data available"}
    
    # Filter by month if specified
    if month:
        adr_data = [(v, r) for v, r in adr_data if r.get("arrival_date_month") == month]
    
    # Filter by year if specified
    if years:
        adr_data = [(v, r) for v, r in adr_data if r.get("arrival_date_year") in years]
    
    values = [v for v, _ in adr_data]
    
    if metric_type == "average":
        avg_price = sum(values) / len(values)
        answer = f"The average price is €{avg_price:.2f}"
        if month:
            answer += f" in {month}"
        if years:
            answer += f" for year(s) {','.join(map(str, years))}"
        
        return {
            "question_type": "price_analysis",
            "answer": answer,
            "average_price": round(avg_price, 2),
            "count": len(values),
            "min_price": round(min(values), 2),
            "max_price": round(max(values), 2),
            "methodology": "Calculated statistics on ADR (Average Daily Rate) column",
        }
    
    elif metric_type == "max":
        max_price = max(values)
        return {
            "question_type": "price_analysis",
            "answer": f"The highest price is €{max_price:.2f}",
            "max_price": round(max_price, 2),
            "methodology": "Found maximum ADR value",
        }
    
    elif metric_type == "min":
        min_price = min(values)
        return {
            "question_type": "price_analysis",
            "answer": f"The lowest price is €{min_price:.2f}",
            "min_price": round(min_price, 2),
            "methodology": "Found minimum ADR value",
        }
    
    else:
        avg_price = sum(values) / len(values)
        return {
            "question_type": "price_summary",
            "answer": f"Price statistics: Average €{avg_price:.2f}, Min €{min(values):.2f}, Max €{max(values):.2f} ({len(values)} bookings)",
            "average": round(avg_price, 2),
            "min": round(min(values), 2),
            "max": round(max(values), 2),
            "count": len(values),
            "methodology": "Calculated price statistics",
        }


def handle_cancellation_analysis(dataset_id: str, rows: list, month: str | None, years: list[int], metric_type: str, question: str) -> dict[str, Any]:
    """Handle cancellation analysis queries."""
    filtered_rows = rows
    
    if month:
        filtered_rows = [r for r in filtered_rows if r.get("arrival_date_month") == month]
    
    if years:
        filtered_rows = [r for r in filtered_rows if r.get("arrival_date_year") in years]
    
    if not filtered_rows:
        return {"error": "No data for the specified filters"}
    
    canceled = sum(1 for r in filtered_rows if r.get("is_canceled") == 1)
    total = len(filtered_rows)
    cancel_rate = (canceled / total) * 100 if total > 0 else 0
    
    answer = f"The cancellation rate is {cancel_rate:.1f}%"
    if month:
        answer += f" in {month}"
    if years:
        answer += f" ({len(years)} year(s))"
    
    return {
        "question_type": "cancellation_analysis",
        "answer": answer,
        "cancellation_rate": round(cancel_rate, 2),
        "canceled_count": canceled,
        "total_count": total,
        "methodology": "Calculated cancellation rate from is_canceled column",
    }


def handle_market_analysis(dataset_id: str, rows: list, years: list[int], metric_type: str, question: str) -> dict[str, Any]:
    """Handle market/country analysis queries."""
    filtered_rows = rows
    
    if years:
        filtered_rows = [r for r in filtered_rows if r.get("arrival_date_year") in years]
    
    country_counts = {}
    for row in filtered_rows:
        country = str(row.get("country", "Unknown"))
        country_counts[country] = country_counts.get(country, 0) + 1
    
    top_10 = sorted(country_counts.items(), key=lambda x: x[1], reverse=True)[:10]
    
    answer = f"Top markets: {', '.join(f'{c} ({n})' for c, n in top_10)}"
    
    return {
        "question_type": "market_analysis",
        "answer": answer,
        "top_markets": {c: n for c, n in top_10},
        "methodology": "Ranked countries by booking volume",
    }


def handle_lead_time_analysis(dataset_id: str, rows: list, month: str | None, years: list[int], question: str) -> dict[str, Any]:
    """Handle lead time analysis queries."""
    filtered_rows = rows
    
    if month:
        filtered_rows = [r for r in filtered_rows if r.get("arrival_date_month") == month]
    
    if years:
        filtered_rows = [r for r in filtered_rows if r.get("arrival_date_year") in years]
    
    # Compare canceled vs non-canceled
    canceled_lead = []
    non_canceled_lead = []
    
    for row in filtered_rows:
        lead_time = row.get("lead_time")
        if lead_time is not None:
            try:
                lt = float(lead_time)
                if row.get("is_canceled") == 1:
                    canceled_lead.append(lt)
                else:
                    non_canceled_lead.append(lt)
            except (ValueError, TypeError):
                pass
    
    if not canceled_lead or not non_canceled_lead:
        return {"error": "Insufficient data for lead time analysis"}
    
    avg_canceled = sum(canceled_lead) / len(canceled_lead)
    avg_non_canceled = sum(non_canceled_lead) / len(non_canceled_lead)
    
    difference = avg_canceled - avg_non_canceled
    
    return {
        "question_type": "lead_time_analysis",
        "answer": f"Canceled bookings have {avg_canceled:.0f} day average lead time vs {avg_non_canceled:.0f} days for non-canceled (difference: {difference:+.0f} days)",
        "canceled_avg_lead_time": round(avg_canceled, 2),
        "non_canceled_avg_lead_time": round(avg_non_canceled, 2),
        "difference": round(difference, 2),
        "methodology": "Compared average lead_time for canceled vs non-canceled bookings",
    }


def handle_repeat_guest_analysis(dataset_id: str, rows: list, metric_type: str, question: str) -> dict[str, Any]:
    """Handle repeat guest analysis queries."""
    repeat_count = sum(1 for r in rows if r.get("is_repeated_guest") == 1)
    total = len(rows)
    repeat_rate = (repeat_count / total) * 100 if total > 0 else 0
    
    return {
        "question_type": "repeat_guest_analysis",
        "answer": f"Repeat guest rate: {repeat_rate:.1f}% ({repeat_count} out of {total} bookings)",
        "repeat_rate": round(repeat_rate, 2),
        "repeat_count": repeat_count,
        "total_count": total,
        "methodology": "Calculated percentage of is_repeated_guest=1",
    }


def handle_generic_metric(dataset_id: str, rows: list, column: str, metric_type: str, month: str | None, years: list[int], question: str) -> dict[str, Any]:
    """Handle generic metric calculations for any column."""
    filtered_rows = rows
    
    if month:
        filtered_rows = [r for r in filtered_rows if r.get("arrival_date_month") == month]
    
    if years:
        filtered_rows = [r for r in filtered_rows if r.get("arrival_date_year") in years]
    
    # Extract numeric values
    values = []
    for row in filtered_rows:
        val = row.get(column)
        if val is not None:
            try:
                values.append(float(val))
            except (ValueError, TypeError):
                pass
    
    if not values:
        return {"error": f"No numeric data found in {column}"}
    
    results = {
        "question_type": "generic_metric",
        "column": column,
        "count": len(values),
        "methodology": f"Calculated statistics on {column}",
    }
    
    if metric_type in ["average", "summary"]:
        avg = sum(values) / len(values)
        results["answer"] = f"Average {column}: {avg:.2f}"
        results["average"] = round(avg, 2)
    
    if metric_type in ["sum", "summary"]:
        total = sum(values)
        results["answer"] = f"Total {column}: {total:.2f}"
        results["sum"] = round(total, 2)
    
    if metric_type in ["max", "summary"]:
        max_val = max(values)
        results["answer"] = f"Maximum {column}: {max_val:.2f}"
        results["max"] = round(max_val, 2)
    
    if metric_type in ["min", "summary"]:
        min_val = min(values)
        results["answer"] = f"Minimum {column}: {min_val:.2f}"
        results["min"] = round(min_val, 2)
    
    return results

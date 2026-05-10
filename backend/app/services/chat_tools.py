"""Backend tools for data-grounded chat queries."""

from __future__ import annotations

import json
from typing import Any

import pandas as pd

from backend.app.db.storage import get_dataset


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
    """Answer a Hotel Booking specific question using backend tools.
    
    Args:
        dataset_id: The dataset ID (must be Hotel Booking)
        question: The user's question
        
    Returns:
        Dictionary with answer and methodology
    """
    question_lower = question.lower()
    dataset = get_dataset(dataset_id)
    
    if not dataset:
        return {"error": f"Dataset {dataset_id} not found"}
    
    # Check if this is a Hotel Booking dataset
    col_names = dataset.get("column_names", [])
    is_hotel_booking = "is_canceled" in col_names and "hotel" in col_names and "adr" in col_names
    
    if not is_hotel_booking:
        return {"error": "This question requires a Hotel Booking dataset"}
    
    rows = dataset.get("rows", [])
    
    # Q3: Lead time and cancellation correlation (CHECK FIRST - more specific)
    if "lead" in question_lower and ("cancel" in question_lower or "correlat" in question_lower):
        # Calculate average lead time for canceled vs non-canceled
        canceled_lead_times = []
        non_canceled_lead_times = []
        
        for row in rows:
            lead_time = row.get("lead_time")
            is_canceled = row.get("is_canceled")
            
            if lead_time is not None:
                try:
                    lt = float(lead_time)
                    if is_canceled == 1:
                        canceled_lead_times.append(lt)
                    else:
                        non_canceled_lead_times.append(lt)
                except (ValueError, TypeError):
                    pass
        
        avg_canceled = sum(canceled_lead_times) / len(canceled_lead_times) if canceled_lead_times else 0
        avg_non_canceled = sum(non_canceled_lead_times) / len(non_canceled_lead_times) if non_canceled_lead_times else 0
        
        return {
            "question_type": "lead_time_cancellation",
            "answer": f"Canceled bookings have average lead time of {avg_canceled:.0f} days vs {avg_non_canceled:.0f} days for non-canceled.",
            "avg_lead_time_canceled": round(avg_canceled, 2),
            "avg_lead_time_non_canceled": round(avg_non_canceled, 2),
            "methodology": "Calculated mean lead_time for canceled (is_canceled=1) vs non-canceled (is_canceled=0) bookings",
        }
    
    # Q1: Cancellation rate overall and by hotel type
    if "cancellation" in question_lower:
        total_rows = len(rows)
        canceled_count = sum(1 for row in rows if row.get("is_canceled") == 1)
        overall_rate = canceled_count / total_rows if total_rows > 0 else 0
        
        # By hotel type
        hotel_rates = calculate_grouped_metric(dataset_id, "hotel", "is_canceled", "rate")
        
        return {
            "question_type": "cancellation_rate",
            "answer": f"The overall cancellation rate is {overall_rate:.1%}.",
            "overall_rate": round(overall_rate, 4),
            "by_hotel": hotel_rates.get("results", {}),
            "methodology": "Calculated as: count of is_canceled=1 / total rows",
        }
    
    # Q2: Top 10 source markets (countries)
    if "source" in question_lower or ("market" in question_lower and "country" in question_lower):
        country_counts: dict[str, int] = {}
        for row in rows:
            country = str(row.get("country", "Unknown"))
            country_counts[country] = country_counts.get(country, 0) + 1
        
        # Sort and get top 10
        top_10 = sorted(country_counts.items(), key=lambda x: x[1], reverse=True)[:10]
        
        return {
            "question_type": "top_markets",
            "answer": f"The top 10 source markets are: {', '.join(f'{c} ({n})' for c, n in top_10)}",
            "top_markets": {country: count for country, count in top_10},
            "methodology": "Counted bookings by country, ranked by frequency",
        }
    
    # Q4: Average daily rate (ADR) by month
    if "adr" in question_lower or ("average" in question_lower and "rate" in question_lower and "month" in question_lower):
        adr_by_month: dict[str, list[float]] = {}
        
        for row in rows:
            month = str(row.get("arrival_date_month", "Unknown"))
            adr = row.get("adr")
            
            if adr is not None:
                try:
                    adr_val = float(adr)
                    if adr_val >= 0:  # Exclude negative ADR
                        if month not in adr_by_month:
                            adr_by_month[month] = []
                        adr_by_month[month].append(adr_val)
                except (ValueError, TypeError):
                    pass
        
        # Calculate average ADR per month
        adr_averages = {}
        for month, values in adr_by_month.items():
            if values:
                adr_averages[month] = round(sum(values) / len(values), 2)
        
        # Sort by expected month order
        month_order = ["January", "February", "March", "April", "May", "June",
                      "July", "August", "September", "October", "November", "December"]
        sorted_adr = {m: adr_averages[m] for m in month_order if m in adr_averages}
        
        return {
            "question_type": "adr_by_month",
            "answer": f"Average Daily Rate by month: {', '.join(f'{m}: €{v}' for m, v in sorted_adr.items())}",
            "adr_by_month": sorted_adr,
            "methodology": "Calculated mean adr per arrival_date_month, ordered by calendar",
        }
    
    # Q5: Repeat guest rates by market segment
    if "repeat" in question_lower and "market" in question_lower:
        segment_repeat: dict[str, dict[str, int]] = {}
        
        for row in rows:
            segment = str(row.get("market_segment", "Unknown"))
            is_repeat = row.get("is_repeated_guest", 0)
            
            if segment not in segment_repeat:
                segment_repeat[segment] = {"repeat": 0, "total": 0}
            
            segment_repeat[segment]["total"] += 1
            if is_repeat == 1:
                segment_repeat[segment]["repeat"] += 1
        
        # Calculate repeat rates
        repeat_rates = {}
        for segment, counts in segment_repeat.items():
            if counts["total"] > 0:
                rate = counts["repeat"] / counts["total"]
                repeat_rates[segment] = round(rate, 4)
        
        # Sort by rate descending
        sorted_repeat = dict(sorted(repeat_rates.items(), key=lambda x: x[1], reverse=True))
        
        return {
            "question_type": "repeat_guest_rates",
            "answer": f"Repeat guest rates by market segment: {', '.join(f'{s}: {r:.1%}' for s, r in sorted_repeat.items())}",
            "repeat_rates": sorted_repeat,
            "methodology": "Calculated rate of is_repeated_guest=1 per market_segment",
        }
    
    # Fallback: unclear question
    return {
        "error": "Could not determine how to answer this question",
        "hint": "Try asking about: cancellation rates, top source markets, lead time correlation, ADR by month, or repeat guests",
    }

from __future__ import annotations

from typing import Any

import pandas as pd
from pandas.api.types import is_datetime64_any_dtype, is_numeric_dtype


TOP_VALUE_LIMIT = 5


def profile_dataframe(dataframe: pd.DataFrame) -> dict[str, Any]:
    """Return a deterministic profile for a parsed CSV dataframe."""
    row_count = int(len(dataframe))
    columns = [_profile_column(dataframe[column], row_count) for column in dataframe.columns]

    return {
        "row_count": row_count,
        "column_count": int(len(dataframe.columns)),
        "columns": columns,
    }


def _profile_column(series: pd.Series, row_count: int) -> dict[str, Any]:
    detected_type = _detect_column_type(series)
    null_count = int(series.isna().sum())
    null_percentage = round((null_count / row_count) * 100, 2) if row_count else 0.0

    profile: dict[str, Any] = {
        "name": str(series.name),
        "detected_type": detected_type,
        "null_count": null_count,
        "null_percentage": null_percentage,
        "unique_value_count": int(series.nunique(dropna=True)),
    }

    if detected_type == "numeric":
        numeric_series = pd.to_numeric(series, errors="coerce")
        profile["stats"] = {
            "min": _clean_number(numeric_series.min()),
            "max": _clean_number(numeric_series.max()),
            "mean": _clean_number(numeric_series.mean()),
            "median": _clean_number(numeric_series.median()),
        }

    if detected_type == "categorical":
        counts = series.dropna().value_counts().head(TOP_VALUE_LIMIT)
        profile["top_values"] = [
            {"value": str(value), "count": int(count)} for value, count in counts.items()
        ]

    return profile


def _detect_column_type(series: pd.Series) -> str:
    if is_numeric_dtype(series):
        return "numeric"

    if is_datetime64_any_dtype(series) or _is_datetime_like(series):
        return "datetime"

    if _is_categorical_like(series):
        return "categorical"

    return "text"


def _is_datetime_like(series: pd.Series) -> bool:
    non_null = series.dropna()
    if non_null.empty:
        return False

    parsed = pd.to_datetime(non_null, errors="coerce")
    return bool(parsed.notna().mean() >= 0.8)


def _is_categorical_like(series: pd.Series) -> bool:
    non_null_count = int(series.notna().sum())
    if non_null_count == 0:
        return True

    unique_count = int(series.nunique(dropna=True))
    return unique_count <= 20 or (unique_count / non_null_count) <= 0.5


def _clean_number(value: Any) -> float | int | None:
    if pd.isna(value):
        return None

    number = float(value)
    return int(number) if number.is_integer() else number

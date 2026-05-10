"""Hotel Booking data cleaning service.

This module provides deterministic cleaning rules for the Hotel Booking Demand dataset.
Rules are applied only when matching columns exist, preserving compatibility with other CSV files.
"""

from __future__ import annotations

from typing import Any

import pandas as pd


# Privacy columns to ignore (case-insensitive)
PRIVACY_COLUMNS = {"name", "email", "phone", "phone-number", "credit", "credit_card", "card_number"}

# Month ordering for arrival_date_month
MONTH_ORDER = {
    "January": 1,
    "February": 2,
    "March": 3,
    "April": 4,
    "May": 5,
    "June": 6,
    "July": 7,
    "August": 8,
    "September": 9,
    "October": 10,
    "November": 11,
    "December": 12,
}

# ADR threshold for outliers
ADR_OUTLIER_THRESHOLD = 10000


def clean_and_profile(dataframe: pd.DataFrame) -> tuple[pd.DataFrame, dict[str, Any]]:
    """Apply cleaning rules and return cleaned dataframe and cleaning log.

    Args:
        dataframe: Input pandas DataFrame

    Returns:
        Tuple of (cleaned_dataframe, cleaning_log)
        cleaning_log contains:
        - privacy_columns_ignored: list of column names that were ignored
        - children_filled_count: number of null children values filled with 0
        - zero_guest_rows_count: number of rows with no guests
        - negative_adr_count: number of negative ADR values flagged
        - extreme_adr_count: number of extreme ADR values flagged
    """
    cleaning_log: dict[str, Any] = {
        "privacy_columns_ignored": [],
        "children_filled_count": 0,
        "zero_guest_rows_count": 0,
        "negative_adr_count": 0,
        "extreme_adr_count": 0,
    }

    # Make a copy to avoid modifying original
    df = dataframe.copy()

    # Step 1: Identify and mark privacy columns (but keep them for now)
    privacy_cols = _identify_privacy_columns(df)
    if privacy_cols:
        cleaning_log["privacy_columns_ignored"] = privacy_cols

    # Step 2: Fill missing children values with 0 (only for Hotel Booking dataset)
    if "children" in df.columns:
        filled_count = _fill_missing_children(df)
        cleaning_log["children_filled_count"] = filled_count

    # Step 3: Identify zero-guest rows (for later exclusion from analytics)
    zero_guest_count = _identify_zero_guest_rows(df)
    cleaning_log["zero_guest_rows_count"] = zero_guest_count

    # Step 4: Handle ADR cleaning (negative and extreme values)
    if "adr" in df.columns:
        negative_count, extreme_count = _clean_adr(df)
        cleaning_log["negative_adr_count"] = negative_count
        cleaning_log["extreme_adr_count"] = extreme_count

    # Step 5: Validate arrival_date_month ordering (informational only, no modification)
    if "arrival_date_month" in df.columns:
        _validate_month_ordering(df)

    return df, cleaning_log


def filter_analytical_data(dataframe: pd.DataFrame) -> pd.DataFrame:
    """Filter dataframe for analytical summaries.

    Excludes rows where adults + children + babies == 0.
    Also removes privacy columns.

    Args:
        dataframe: Cleaned DataFrame

    Returns:
        Filtered DataFrame suitable for analytics
    """
    df = dataframe.copy()

    # Remove privacy columns
    privacy_cols = _identify_privacy_columns(df)
    if privacy_cols:
        df = df.drop(columns=privacy_cols)

    # Exclude zero-guest rows (only if occupancy columns exist)
    if all(col in df.columns for col in ["adults", "children", "babies"]):
        df = df[~((df["adults"] + df["children"] + df["babies"]) == 0)]

    return df


def get_privacy_columns_for_hiding(dataframe: pd.DataFrame) -> list[str]:
    """Get list of privacy columns to hide from UI/profile output.

    Args:
        dataframe: Input DataFrame

    Returns:
        List of privacy column names found in dataframe
    """
    return _identify_privacy_columns(dataframe)


def _identify_privacy_columns(dataframe: pd.DataFrame) -> list[str]:
    """Identify columns that should be hidden (case-insensitive matching)."""
    privacy_cols = []
    for col in dataframe.columns:
        col_lower = col.lower()
        # Check if column matches any privacy pattern
        if any(pattern in col_lower for pattern in PRIVACY_COLUMNS):
            privacy_cols.append(col)
    return privacy_cols


def _fill_missing_children(dataframe: pd.DataFrame) -> int:
    """Fill missing children values with 0.

    Args:
        dataframe: DataFrame to modify in-place

    Returns:
        Number of values filled
    """
    if "children" not in dataframe.columns:
        return 0

    before_count = int(dataframe["children"].isna().sum())
    dataframe["children"] = dataframe["children"].fillna(0).astype(int)
    return before_count


def _identify_zero_guest_rows(dataframe: pd.DataFrame) -> int:
    """Count rows where adults + children + babies == 0.

    Args:
        dataframe: DataFrame to analyze

    Returns:
        Count of zero-guest rows
    """
    if not all(col in dataframe.columns for col in ["adults", "children", "babies"]):
        return 0

    zero_guest = (dataframe["adults"] + dataframe["children"] + dataframe["babies"]) == 0
    return int(zero_guest.sum())


def _clean_adr(dataframe: pd.DataFrame) -> tuple[int, int]:
    """Handle ADR cleaning: flag negative and extreme values.

    Args:
        dataframe: DataFrame to modify in-place

    Returns:
        Tuple of (negative_count, extreme_count)
    """
    if "adr" not in dataframe.columns:
        return 0, 0

    adr_series = dataframe["adr"]

    # Count negative values and set to NaN
    negative_mask = adr_series < 0
    negative_count = int(negative_mask.sum())
    if negative_count > 0:
        dataframe.loc[negative_mask, "adr"] = pd.NA

    # Count extreme values (> 10000)
    extreme_mask = adr_series > ADR_OUTLIER_THRESHOLD
    extreme_count = int(extreme_mask.sum())

    return negative_count, extreme_count


def _validate_month_ordering(dataframe: pd.DataFrame) -> None:
    """Validate that arrival_date_month can be ordered correctly.

    This is informational - the system will handle month ordering when
    creating time-series aggregations.

    Args:
        dataframe: DataFrame with arrival_date_month column
    """
    if "arrival_date_month" not in dataframe.columns:
        return

    # Check that all non-null values are valid month names
    months = dataframe["arrival_date_month"].dropna().unique()
    for month in months:
        if month not in MONTH_ORDER:
            # This is a warning - we can still handle it, just not in calendar order
            pass


def get_month_order_map() -> dict[str, int]:
    """Get the month name to number mapping for calendar ordering.

    Returns:
        Dict mapping month names to numbers 1-12
    """
    return MONTH_ORDER.copy()

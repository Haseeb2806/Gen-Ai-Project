"""Tests for Hotel Booking data cleaning service."""

import pandas as pd
import pytest

from backend.app.services.cleaning import (
    ADR_OUTLIER_THRESHOLD,
    clean_and_profile,
    filter_analytical_data,
    get_month_order_map,
    get_privacy_columns_for_hiding,
)


class TestFillMissingChildren:
    """Test filling missing children values with 0."""

    def test_fills_missing_children_with_zero(self):
        """Missing children values are filled with 0."""
        df = pd.DataFrame({
            "adults": [2, 1, 1],
            "children": [None, 1.0, None],
            "babies": [0, 0, 0],
        })

        cleaned_df, cleaning_log = clean_and_profile(df)

        assert cleaning_log["children_filled_count"] == 2
        assert cleaned_df["children"].tolist() == [0, 1, 0]
        assert cleaned_df["children"].dtype in [int, "Int64"]

    def test_no_children_column(self):
        """When children column doesn't exist, no error."""
        df = pd.DataFrame({
            "adults": [2, 1],
            "name": ["Alice", "Bob"],
        })

        cleaned_df, cleaning_log = clean_and_profile(df)

        assert cleaning_log["children_filled_count"] == 0

    def test_all_children_values_present(self):
        """When all children values present, no filling needed."""
        df = pd.DataFrame({
            "adults": [2, 1],
            "children": [0, 1],
            "babies": [0, 0],
        })

        cleaned_df, cleaning_log = clean_and_profile(df)

        assert cleaning_log["children_filled_count"] == 0
        assert cleaned_df["children"].tolist() == [0, 1]


class TestZeroGuestRows:
    """Test identifying zero-guest rows."""

    def test_counts_zero_guest_rows(self):
        """Zero-guest rows (adults + children + babies == 0) are counted."""
        df = pd.DataFrame({
            "adults": [2, 1, 0, 0],
            "children": [0, 0, 0, 0],
            "babies": [0, 0, 0, 0],
        })

        cleaned_df, cleaning_log = clean_and_profile(df)

        # Only row at index 2 has 0+0+0, row at index 3 has 0+0+0 = 2 zero-guest rows
        assert cleaning_log["zero_guest_rows_count"] == 2

    def test_zero_guests_excluded_from_profile(self):
        """Zero-guest rows are excluded from analytical profile via filter_analytical_data."""
        df = pd.DataFrame({
            "adults": [2, 1, 0],
            "children": [0, 0, 0],
            "babies": [0, 0, 0],
            "adr": [100.0, 150.0, 50.0],
        })

        cleaned_df, cleaning_log = clean_and_profile(df)
        analytical_df = filter_analytical_data(df)

        # Analytical data should only have 2 rows (zero-guest row excluded)
        assert len(analytical_df) == 2

    def test_zero_guest_rows_not_excluded_if_columns_missing(self):
        """When occupancy columns don't exist, no zero-guest filtering."""
        df = pd.DataFrame({
            "hotel": ["H1", "H2"],
            "adr": [100.0, 150.0],
        })

        cleaned_df, cleaning_log = clean_and_profile(df)

        assert cleaning_log["zero_guest_rows_count"] == 0


class TestADRCleaning:
    """Test ADR (Average Daily Rate) cleaning."""

    def test_negative_adr_values_flagged(self):
        """Negative ADR values are flagged and set to NaN."""
        df = pd.DataFrame({
            "hotel": ["H1", "H2", "H3"],
            "adr": [-100.0, 150.0, 200.0],
        })

        cleaned_df, cleaning_log = clean_and_profile(df)

        assert cleaning_log["negative_adr_count"] == 1
        assert pd.isna(cleaned_df.iloc[0]["adr"])
        assert cleaned_df.iloc[1]["adr"] == 150.0

    def test_extreme_adr_values_flagged(self):
        """ADR values exceeding threshold are flagged."""
        df = pd.DataFrame({
            "hotel": ["H1", "H2", "H3"],
            "adr": [100.0, ADR_OUTLIER_THRESHOLD + 1, 200.0],
        })

        cleaned_df, cleaning_log = clean_and_profile(df)

        assert cleaning_log["extreme_adr_count"] == 1

    def test_multiple_adr_issues(self):
        """Multiple ADR issues (negative and extreme) are counted separately."""
        df = pd.DataFrame({
            "hotel": ["H1", "H2", "H3"],
            "adr": [-100.0, ADR_OUTLIER_THRESHOLD + 500, 200.0],
        })

        cleaned_df, cleaning_log = clean_and_profile(df)

        assert cleaning_log["negative_adr_count"] == 1
        assert cleaning_log["extreme_adr_count"] == 1

    def test_no_adr_column(self):
        """When ADR column doesn't exist, no error."""
        df = pd.DataFrame({
            "hotel": ["H1", "H2"],
            "price": [100.0, 150.0],
        })

        cleaned_df, cleaning_log = clean_and_profile(df)

        assert cleaning_log["negative_adr_count"] == 0
        assert cleaning_log["extreme_adr_count"] == 0


class TestPrivacyColumns:
    """Test privacy column identification and hiding."""

    def test_identifies_privacy_columns(self):
        """Privacy columns are identified (case-insensitive)."""
        df = pd.DataFrame({
            "hotel": ["H1"],
            "name": ["Guest"],
            "email": ["guest@example.com"],
            "phone_number": ["555-1234"],
            "credit_card": ["****"],
        })

        cleaned_df, cleaning_log = clean_and_profile(df)

        privacy_cols = cleaning_log["privacy_columns_ignored"]
        assert "name" in privacy_cols
        assert "email" in privacy_cols
        assert "phone_number" in privacy_cols
        assert "credit_card" in privacy_cols

    def test_privacy_columns_case_insensitive(self):
        """Privacy column matching is case-insensitive."""
        df = pd.DataFrame({
            "hotel": ["H1"],
            "EMAIL": ["guest@example.com"],
            "Phone": ["555-1234"],
            "Credit_Card": ["****"],
        })

        cleaned_df, cleaning_log = clean_and_profile(df)

        privacy_cols = cleaning_log["privacy_columns_ignored"]
        assert "EMAIL" in privacy_cols
        assert "Phone" in privacy_cols
        assert "Credit_Card" in privacy_cols

    def test_privacy_columns_excluded_from_profile(self):
        """Privacy columns are excluded from analytical profile."""
        df = pd.DataFrame({
            "hotel": ["H1", "H2"],
            "name": ["Alice", "Bob"],
            "adr": [100.0, 150.0],
            "email": ["a@ex.com", "b@ex.com"],
        })

        cleaned_df, cleaning_log = clean_and_profile(df)

        # Privacy columns should be in log but not in profiled columns
        assert "name" in cleaning_log["privacy_columns_ignored"]
        assert "email" in cleaning_log["privacy_columns_ignored"]

    def test_no_privacy_columns(self):
        """When no privacy columns present, log empty."""
        df = pd.DataFrame({
            "hotel": ["H1"],
            "adr": [100.0],
            "country": ["US"],
        })

        cleaned_df, cleaning_log = clean_and_profile(df)

        assert cleaning_log["privacy_columns_ignored"] == []

    def test_get_privacy_columns_for_hiding(self):
        """get_privacy_columns_for_hiding returns privacy column list."""
        df = pd.DataFrame({
            "hotel": ["H1"],
            "name": ["Guest"],
            "email": ["guest@example.com"],
        })

        privacy_cols = get_privacy_columns_for_hiding(df)

        assert "name" in privacy_cols
        assert "email" in privacy_cols
        assert "hotel" not in privacy_cols


class TestArrivalDateMonth:
    """Test arrival_date_month handling."""

    def test_month_order_map_complete(self):
        """Month order map contains all 12 months in calendar order."""
        month_map = get_month_order_map()

        assert month_map["January"] == 1
        assert month_map["February"] == 2
        assert month_map["December"] == 12
        assert len(month_map) == 12

    def test_arrival_date_month_present(self):
        """Processing with arrival_date_month column works."""
        df = pd.DataFrame({
            "hotel": ["H1", "H2"],
            "arrival_date_month": ["January", "December"],
        })

        cleaned_df, cleaning_log = clean_and_profile(df)

        # Should complete without error, values unchanged
        assert cleaned_df["arrival_date_month"].tolist() == ["January", "December"]

    def test_arrival_date_month_missing(self):
        """Processing without arrival_date_month column works."""
        df = pd.DataFrame({
            "hotel": ["H1", "H2"],
            "arrival_date": ["2023-01-01", "2023-12-31"],
        })

        cleaned_df, cleaning_log = clean_and_profile(df)

        # Should complete without error
        assert "arrival_date_month" not in cleaned_df.columns


class TestFilterAnalyticalData:
    """Test filter_analytical_data function."""

    def test_excludes_zero_guest_rows(self):
        """Zero-guest rows are excluded from analytical data."""
        df = pd.DataFrame({
            "adults": [2, 1, 0],
            "children": [1, 0, 0],
            "babies": [0, 0, 0],
            "adr": [100.0, 150.0, 50.0],
        })

        analytical_df = filter_analytical_data(df)

        assert len(analytical_df) == 2
        assert analytical_df.iloc[0]["adr"] == 100.0
        assert analytical_df.iloc[1]["adr"] == 150.0

    def test_removes_privacy_columns(self):
        """Privacy columns are removed from analytical data."""
        df = pd.DataFrame({
            "hotel": ["H1", "H2"],
            "adr": [100.0, 150.0],
            "name": ["Alice", "Bob"],
            "email": ["a@ex.com", "b@ex.com"],
        })

        analytical_df = filter_analytical_data(df)

        assert "name" not in analytical_df.columns
        assert "email" not in analytical_df.columns
        assert "hotel" in analytical_df.columns
        assert "adr" in analytical_df.columns

    def test_handles_missing_occupancy_columns(self):
        """Works when occupancy columns don't exist."""
        df = pd.DataFrame({
            "hotel": ["H1", "H2"],
            "adr": [100.0, 150.0],
        })

        analytical_df = filter_analytical_data(df)

        # Should return all rows (no zero-guest filtering)
        assert len(analytical_df) == 2


class TestCleaningLog:
    """Test cleaning log structure and completeness."""

    def test_cleaning_log_structure(self):
        """Cleaning log contains all expected keys."""
        df = pd.DataFrame({
            "hotel": ["H1"],
            "children": [None],
            "adults": [2],
            "babies": [0],
            "adr": [100.0],
        })

        cleaned_df, cleaning_log = clean_and_profile(df)

        assert "privacy_columns_ignored" in cleaning_log
        assert "children_filled_count" in cleaning_log
        assert "zero_guest_rows_count" in cleaning_log
        assert "negative_adr_count" in cleaning_log
        assert "extreme_adr_count" in cleaning_log

    def test_hotel_booking_comprehensive(self):
        """Full Hotel Booking dataset cleaning with multiple rules applied."""
        df = pd.DataFrame({
            "hotel": ["H1", "H2", "H3", "H4"],
            "adults": [2, 1, 0, 2],
            "children": [None, 2.0, 0, 1],
            "babies": [0, 0, 0, 0],
            "adr": [-100.0, 150.0, 50.0, ADR_OUTLIER_THRESHOLD + 100],
            "name": ["Alice", "Bob", "Charlie", "David"],
            "email": ["a@ex.com", "b@ex.com", "c@ex.com", "d@ex.com"],
            "country": ["US", "UK", "DE", "FR"],
        })

        cleaned_df, cleaning_log = clean_and_profile(df)

        # Verify all rules applied
        assert cleaning_log["children_filled_count"] == 1
        assert cleaning_log["zero_guest_rows_count"] == 1
        assert cleaning_log["negative_adr_count"] == 1
        assert cleaning_log["extreme_adr_count"] == 1
        assert len(cleaning_log["privacy_columns_ignored"]) == 2

    def test_non_hotel_booking_dataset(self):
        """Generic CSV without Hotel Booking columns works."""
        df = pd.DataFrame({
            "product": ["A", "B"],
            "price": [10.0, 20.0],
            "quantity": [5, 3],
        })

        cleaned_df, cleaning_log = clean_and_profile(df)

        # Should complete without error, minimal log
        assert cleaning_log["children_filled_count"] == 0
        assert cleaning_log["zero_guest_rows_count"] == 0
        assert cleaning_log["negative_adr_count"] == 0
        assert cleaning_log["extreme_adr_count"] == 0


class TestEdgeCases:
    """Test edge cases and boundary conditions."""

    def test_empty_dataframe(self):
        """Empty dataframe is handled gracefully."""
        df = pd.DataFrame()

        cleaned_df, cleaning_log = clean_and_profile(df)

        assert len(cleaned_df) == 0
        assert cleaning_log["children_filled_count"] == 0

    def test_single_row_dataframe(self):
        """Single row dataframe is processed correctly."""
        df = pd.DataFrame({
            "hotel": ["H1"],
            "adults": [2],
            "children": [None],
            "babies": [0],
        })

        cleaned_df, cleaning_log = clean_and_profile(df)

        assert len(cleaned_df) == 1
        assert cleaning_log["children_filled_count"] == 1

    def test_all_zero_guests(self):
        """Dataframe with all zero-guest rows filtered correctly."""
        df = pd.DataFrame({
            "adults": [0, 0, 0],
            "children": [0, 0, 0],
            "babies": [0, 0, 0],
            "adr": [100.0, 150.0, 50.0],
        })

        cleaned_df, cleaning_log = clean_and_profile(df)
        analytical_df = filter_analytical_data(df)

        assert cleaning_log["zero_guest_rows_count"] == 3
        # Analytical data should have 0 rows (all were zero-guest)
        assert len(analytical_df) == 0

    def test_nan_handling_in_occupancy(self):
        """NaN values in occupancy columns are handled."""
        df = pd.DataFrame({
            "adults": [2.0, pd.NA, 1.0],
            "children": [0.0, 0.0, pd.NA],
            "babies": [0.0, pd.NA, 0.0],
            "adr": [100.0, 150.0, 200.0],
        })

        cleaned_df, cleaning_log = clean_and_profile(df)

        # Should complete without error
        assert "children_filled_count" in cleaning_log

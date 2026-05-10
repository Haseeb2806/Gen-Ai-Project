from __future__ import annotations

import json
import os
import sqlite3
from pathlib import Path
from typing import Any
from uuid import uuid4

import pandas as pd

DEFAULT_DATABASE_PATH = Path("data/datalens.db")


def initialize_database() -> None:
    """Create the SQLite schema used for uploaded datasets."""
    database_path = _database_path()
    database_path.parent.mkdir(parents=True, exist_ok=True)

    with _connect() as connection:
        connection.execute(
            """
            CREATE TABLE IF NOT EXISTS datasets (
                id TEXT PRIMARY KEY,
                filename TEXT NOT NULL,
                row_count INTEGER NOT NULL,
                column_count INTEGER NOT NULL,
                column_names_json TEXT NOT NULL,
                created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
            )
            """
        )
        connection.execute(
            """
            CREATE TABLE IF NOT EXISTS dataset_rows (
                dataset_id TEXT NOT NULL,
                row_index INTEGER NOT NULL,
                row_json TEXT NOT NULL,
                PRIMARY KEY (dataset_id, row_index),
                FOREIGN KEY (dataset_id) REFERENCES datasets(id) ON DELETE CASCADE
            )
            """
        )


def save_dataset(filename: str, dataframe: pd.DataFrame) -> str:
    """Persist uploaded dataset metadata and rows, returning its dataset id."""
    initialize_database()
    dataset_id = str(uuid4())
    column_names = [str(column) for column in dataframe.columns]
    records = _dataframe_records(dataframe)

    with _connect() as connection:
        connection.execute(
            """
            INSERT INTO datasets (id, filename, row_count, column_count, column_names_json)
            VALUES (?, ?, ?, ?, ?)
            """,
            (
                dataset_id,
                filename,
                int(len(dataframe)),
                int(len(dataframe.columns)),
                json.dumps(column_names),
            ),
        )
        connection.executemany(
            """
            INSERT INTO dataset_rows (dataset_id, row_index, row_json)
            VALUES (?, ?, ?)
            """,
            [
                (dataset_id, row_index, json.dumps(record))
                for row_index, record in enumerate(records)
            ],
        )

    return dataset_id


def list_datasets() -> list[dict[str, Any]]:
    """Return saved dataset metadata ordered from newest to oldest."""
    initialize_database()

    with _connect() as connection:
        rows = connection.execute(
            """
            SELECT id, filename, row_count, column_count, column_names_json, created_at
            FROM datasets
            ORDER BY created_at DESC, id DESC
            """
        ).fetchall()

    return [_metadata_from_row(row) for row in rows]


def get_dataset(dataset_id: str) -> dict[str, Any] | None:
    """Return saved dataset metadata and rows for a dataset id."""
    initialize_database()

    with _connect() as connection:
        metadata_row = connection.execute(
            """
            SELECT id, filename, row_count, column_count, column_names_json, created_at
            FROM datasets
            WHERE id = ?
            """,
            (dataset_id,),
        ).fetchone()
        if metadata_row is None:
            return None

        row_records = connection.execute(
            """
            SELECT row_json
            FROM dataset_rows
            WHERE dataset_id = ?
            ORDER BY row_index ASC
            """,
            (dataset_id,),
        ).fetchall()

    dataset = _metadata_from_row(metadata_row)
    dataset["rows"] = [json.loads(row["row_json"]) for row in row_records]
    return dataset


def _connect() -> sqlite3.Connection:
    connection = sqlite3.connect(_database_path())
    connection.row_factory = sqlite3.Row
    return connection


def _database_path() -> Path:
    return Path(os.getenv("DATALENS_DB_PATH", str(DEFAULT_DATABASE_PATH)))


def _metadata_from_row(row: sqlite3.Row) -> dict[str, Any]:
    return {
        "dataset_id": row["id"],
        "filename": row["filename"],
        "row_count": int(row["row_count"]),
        "column_count": int(row["column_count"]),
        "column_names": json.loads(row["column_names_json"]),
        "created_at": row["created_at"],
    }


def _dataframe_records(dataframe: pd.DataFrame) -> list[dict[str, Any]]:
    normalized = dataframe.astype(object).where(pd.notna(dataframe), None)
    return normalized.to_dict(orient="records")

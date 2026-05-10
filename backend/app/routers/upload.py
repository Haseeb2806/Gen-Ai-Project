from io import BytesIO

import pandas as pd
from fastapi import APIRouter, File, HTTPException, UploadFile, status
from pandas.errors import EmptyDataError, ParserError

from backend.app.services.profiling import profile_dataframe

router = APIRouter()

MAX_UPLOAD_SIZE_BYTES = 50 * 1024 * 1024


@router.post("/upload")
async def upload_csv(file: UploadFile = File(...)) -> dict[str, object]:
    """Validate an uploaded CSV and return a dataset summary with a column profile."""
    if not file.filename or not file.filename.lower().endswith(".csv"):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Only CSV files are accepted.",
        )

    contents = await file.read()
    if len(contents) > MAX_UPLOAD_SIZE_BYTES:
        raise HTTPException(
            status_code=status.HTTP_413_REQUEST_ENTITY_TOO_LARGE,
            detail="CSV file exceeds the 50MB size limit.",
        )

    try:
        dataframe = pd.read_csv(BytesIO(contents), on_bad_lines="error")
    except EmptyDataError as exc:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="CSV file is empty or has no parseable columns.",
        ) from exc
    except (ParserError, UnicodeDecodeError) as exc:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="CSV file could not be parsed by pandas.",
        ) from exc

    return {
        "filename": file.filename,
        "row_count": int(len(dataframe)),
        "column_count": int(len(dataframe.columns)),
        "column_names": list(dataframe.columns),
        "profile": profile_dataframe(dataframe),
    }

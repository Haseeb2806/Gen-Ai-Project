from fastapi import APIRouter, HTTPException, status

from backend.app.db.storage import get_dataset, list_datasets

router = APIRouter()


@router.get("/datasets")
def list_saved_datasets() -> dict[str, list[dict[str, object]]]:
    """List uploaded datasets saved in SQLite."""
    return {"datasets": list_datasets()}


@router.get("/datasets/{dataset_id}")
def retrieve_saved_dataset(dataset_id: str) -> dict[str, object]:
    """Return saved dataset metadata and rows by dataset id."""
    dataset = get_dataset(dataset_id)
    if dataset is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Dataset '{dataset_id}' was not found.",
        )

    return dataset

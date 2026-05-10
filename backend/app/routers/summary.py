from typing import Any

from fastapi import APIRouter, HTTPException, status
from pydantic import BaseModel

from backend.app.services.summary import generate_executive_summary

router = APIRouter()


class SummaryRequest(BaseModel):
    dataset_id: str


class SummaryResponse(BaseModel):
    dataset_id: str
    summary: str
    key_findings: list[str]
    data_quality_notes: list[str]
    data: dict[str, Any]


@router.post("/summary", response_model=SummaryResponse)
async def summary(request: SummaryRequest) -> SummaryResponse:
    """Generate a data-grounded executive summary for a saved dataset."""
    result = generate_executive_summary(request.dataset_id)
    if result is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Dataset {request.dataset_id} not found",
        )

    return SummaryResponse(**result)

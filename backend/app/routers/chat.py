"""Chat endpoint for data-grounded questions."""

from __future__ import annotations

import os
from typing import Any

from fastapi import APIRouter, HTTPException, status
from pydantic import BaseModel

from backend.app.db.storage import get_dataset
from backend.app.services.chat_tools import answer_hotel_booking_question

router = APIRouter()


class ChatRequest(BaseModel):
    """Request body for chat endpoint."""

    dataset_id: str
    question: str


class ChatResponse(BaseModel):
    """Response from chat endpoint."""

    dataset_id: str
    question: str
    answer: str
    data: dict[str, Any]


def _get_llm_api_key() -> str | None:
    """Get configured LLM API key from environment."""
    provider = os.getenv("LLM_PROVIDER", "").lower()
    
    if provider == "gemini":
        return os.getenv("GEMINI_API_KEY")
    elif provider == "anthropic":
        return os.getenv("ANTHROPIC_API_KEY")
    elif provider == "openai":
        return os.getenv("OPENAI_API_KEY")
    elif provider == "groq":
        return os.getenv("GROQ_API_KEY")
    
    return None


@router.post("/chat", response_model=ChatResponse)
async def chat(request: ChatRequest) -> ChatResponse:
    """Answer a data-grounded question about a dataset.
    
    Args:
        request: ChatRequest with dataset_id and question
        
    Returns:
        ChatResponse with answer and data
    """
    # Validate dataset exists
    dataset = get_dataset(request.dataset_id)
    if not dataset:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Dataset {request.dataset_id} not found",
        )
    
    # Check if LLM API key is configured
    api_key = _get_llm_api_key()
    
    # For now, always use deterministic local tools (no LLM integration yet)
    # This ensures test stability
    if not api_key:
        # Deterministic local answer using backend tools
        result = answer_hotel_booking_question(request.dataset_id, request.question)
        
        if "error" in result:
            # Could not answer with tools
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=result.get("error", "Could not answer this question"),
            )
        
        # Extract answer from result
        answer = result.get("answer", "")
        data = {k: v for k, v in result.items() if k != "answer"}
        
        return ChatResponse(
            dataset_id=request.dataset_id,
            question=request.question,
            answer=answer,
            data=data,
        )
    
    # Future: If LLM API key is configured, call LLM with tools
    # For now, fall through to local tools
    result = answer_hotel_booking_question(request.dataset_id, request.question)
    
    if "error" in result:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=result.get("error", "Could not answer this question"),
        )
    
    answer = result.get("answer", "")
    data = {k: v for k, v in result.items() if k != "answer"}
    
    return ChatResponse(
        dataset_id=request.dataset_id,
        question=request.question,
        answer=answer,
        data=data,
    )

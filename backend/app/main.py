from collections.abc import AsyncIterator
from contextlib import asynccontextmanager

from fastapi import FastAPI

from backend.app.db.storage import initialize_database
from backend.app.routers.chat import router as chat_router
from backend.app.routers.datasets import router as datasets_router
from backend.app.routers.health import router as health_router
from backend.app.routers.upload import router as upload_router


@asynccontextmanager
async def lifespan(_: FastAPI) -> AsyncIterator[None]:
    """Initialize persistence for uploaded datasets."""
    initialize_database()
    yield


app = FastAPI(title="DataLens API", lifespan=lifespan)
app.include_router(health_router)
app.include_router(upload_router)
app.include_router(datasets_router)
app.include_router(chat_router)

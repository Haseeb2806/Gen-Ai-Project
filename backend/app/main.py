from collections.abc import AsyncIterator
from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from backend.app.db.storage import initialize_database
from backend.app.routers.chat import router as chat_router
from backend.app.routers.datasets import router as datasets_router
from backend.app.routers.health import router as health_router
from backend.app.routers.summary import router as summary_router
from backend.app.routers.upload import router as upload_router


@asynccontextmanager
async def lifespan(_: FastAPI) -> AsyncIterator[None]:
    """Initialize persistence for uploaded datasets."""
    initialize_database()
    yield


app = FastAPI(title="DataLens API", lifespan=lifespan)

# Enable CORS for Vercel frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Allow all origins
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(health_router)
app.include_router(upload_router)
app.include_router(datasets_router)
app.include_router(chat_router)
app.include_router(summary_router)

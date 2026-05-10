from fastapi import FastAPI

from backend.app.routers.health import router as health_router
from backend.app.routers.upload import router as upload_router

app = FastAPI(title="DataLens API")
app.include_router(health_router)
app.include_router(upload_router)

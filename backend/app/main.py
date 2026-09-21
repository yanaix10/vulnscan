from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.config import settings
from app.database import engine, Base
import app.models  # Loads Target, Scan, Finding onto Base.metadata
from app.api import scans, targets, findings, reports


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Automatically creates targets, scans, and findings tables on startup
    Base.metadata.create_all(bind=engine)
    yield


app = FastAPI(title="VulnScan API", lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Mount all API routers
app.include_router(scans.router, prefix="/api/scans", tags=["Scans"])
app.include_router(targets.router, prefix="/api/targets", tags=["Targets"])
app.include_router(findings.router, prefix="/api/findings", tags=["Findings"])
app.include_router(reports.router, prefix="/api/reports", tags=["Reports"])


@app.get("/")
def health_check():
    return {"status": "VulnScan API is running"}
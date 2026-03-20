from fastapi import APIRouter

from app.api.v1 import admin, company, dev, gate, worker

api_router = APIRouter()
api_router.include_router(admin.router)
api_router.include_router(company.router)
api_router.include_router(gate.router)
api_router.include_router(worker.router)
api_router.include_router(dev.router)

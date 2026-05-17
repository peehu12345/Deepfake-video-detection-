from fastapi import APIRouter
from .predictions import router as predictions_router
from .evaluation import router as evaluation_router

router = APIRouter()
router.include_router(predictions_router)
router.include_router(evaluation_router)

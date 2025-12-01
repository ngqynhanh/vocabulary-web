from fastapi import APIRouter
from services.translate_service import TranslateService

router = APIRouter(prefix="/translate", tags=["Translate"])
service = TranslateService()

@router.get("/")
def translate(text: str):
    return service.translate(text)

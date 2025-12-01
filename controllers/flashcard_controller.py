from fastapi import APIRouter
from services.flashcard_service import FlashcardService

router = APIRouter(prefix="/flashcard", tags=["Flashcard"])
service = FlashcardService()

@router.get("/next")
def next_card():
    return service.next()

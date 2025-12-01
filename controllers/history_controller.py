from fastapi import APIRouter
from services.history_service import HistoryService

router = APIRouter(prefix="/history", tags=["History"])
service = HistoryService()

@router.post("/add")
def add(word: str):
    service.add(word)
    return {"status": "ok"}

@router.get("/")
def all_history():
    return service.all()

@router.delete("/undo")
def undo():
    return service.undo()

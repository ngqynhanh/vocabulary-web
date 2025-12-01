from fastapi import APIRouter
from services.search_service import SearchService

def get_router(trie):
    router = APIRouter(prefix="/search", tags=["Search"])
    service = SearchService(trie)

    @router.get("/")
    def search(word: str):
        return service.search(word)

    return router

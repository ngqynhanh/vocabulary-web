from fastapi import FastAPI

from repository.dictionary_loader import DictionaryLoader
from controllers import search_controller, flashcard_controller, history_controller, translate_controller

app = FastAPI(title="Dictionary Backend (Python + DS&A)")

# Load dictionary using Trie
loader = DictionaryLoader()
loader.load()
trie = loader.get_trie()

# Routers
app.include_router(search_controller.get_router(trie))
app.include_router(flashcard_controller.router)
app.include_router(history_controller.router)
app.include_router(translate_controller.router)

@app.get("/")
def root():
    return {"message": "Dictionary API running!"}

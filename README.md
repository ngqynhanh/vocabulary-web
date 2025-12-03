# Smart Dictionary Backend (Spring Boot) – API Overview

This README summarizes backend features and all REST endpoints (methods, paths, request params/bodies, response shapes) for CRUD-like operations and study flows.

Backend stack: Spring Boot (Java). Core data structures implemented for trie search, flashcards (circular list), history (stack), favorites (HashMap), and external dictionary integration.

## Features
- Search with trie suggestions and Levenshtein correction
- Flashcard study flow (current/next, remember/not-remember)
- Track not-remembered words via a stack for re-study
- Favorites (O(1) lookup with `HashMap<String, WordItem>`) – add/remove/list/get
- History of looked-up words (stack, newest-first)
- External dictionary integration (dictionaryapi.dev) for definitions

## Base URL
- Local development: `http://localhost:8080`

## Endpoints

### Search & Suggestions
- `GET /search?word=<string>`
  - Params: `word` (query)
  - Response (found): `{ found: true, word: string, definition: string }`
  - Response (not found): `{ found: false, correction?: string }`

- `GET /suggest?q=<prefix>`
  - Params: `q` (query prefix)
  - Response: `string[]` (suggested words from trie)

### History
- `GET /history`
  - Response: `string[]` (newest-first)

### Flashcards
- Data structure: Circular linked list of `{ word, definition }`

- `GET /flashcard`
  - Returns the current card without advancing.
  - Response: `{ word: string, definition: string } | null`

- `POST /flashcard/next`
  - Advances pointer and returns the next card.
  - Response: `{ word: string, definition: string } | null`

- `POST /flashcard/remember`
  - Marks current card as remembered and advances internally.
  - Response: `{ status: "ok", action: "remember" }`

- `POST /flashcard/not-remember`
  - Marks current card as not remembered, pushes `word` to NotRememberedStack, and advances.
  - Response: `{ status: "ok", action: "not-remember" }`

- `GET /flashcard/pending`
  - Returns the not-remembered stack (newest-first) for re-study.
  - Response: `string[]`

### Favorites
- Data structure: `Map<String, WordItem>` with O(1) CRUD operations
- `WordItem` model: `{ word: string, definition: string }`

- `GET /favorites`
  - Response: `WordItem[]`

- `GET /favorites/{word}`
  - Path: `word` (case-insensitive)
  - Response (found): `{ found: true, word: string, definition: string }`
  - Response (not found): `{ found: false }`

- `POST /favorites/{word}`
  - Path: `word`
  - Adds the word to favorites (requires existing in local dictionary).
  - Response (ok): `{ status: "ok", favorite: true, word: string }`
  - Response (error): `{ status: "error", message: "Word not found in dictionary" }`

- `DELETE /favorites/{word}`
  - Path: `word`
  - Removes the word from favorites.
  - Response: `{ status: "ok" | "not-found", favorite: false, word: string }`

### External Dictionary (dictionaryapi.dev)
- `GET /external/definitions?word=<string>`
  - Params: `word`
  - Response (ok): `{ source: "dictionaryapi.dev", word: string, status: "ok", data: any }` (data is parsed JSON from the upstream API)
  - Response (error): `{ source: "dictionaryapi.dev", word: string, status: "error" | "parse-error", error: string }`

## Data Structures (Backend)
- `Trie` – prefix search for suggestions
- `Levenshtein` – closest match suggestion when not found
- `HistoryStack` – `push(word)`, `getHistory()`
- `FlashcardList` – circular list with `getCurrent()`, `getNext()`, `reviewCurrent(remembered, stack)`
- `NotRememberedStack` – `push(word)`, `getPending()`, `clear()`
- `FavoriteWords` – `add(WordItem)`, `get(word)`, `remove(word)`, `isFavorite(word)`, `list()`

## Typical Flows
- Study:
  - Load current card: `GET /flashcard`
  - Flip in UI; mark as ✓ or ✗ → `POST /flashcard/remember` or `POST /flashcard/not-remember`
  - Next: `POST /flashcard/next`
  - Review pending: `GET /flashcard/pending`

- Favorites:
  - Toggle favorite from UI with `GET` to check and `POST`/`DELETE` to set.
  - List all favorites: `GET /favorites`

- Search:
  - Quick lookup: `GET /search?word=...`
  - Suggestions while typing: `GET /suggest?q=...`
  - External fallback: `GET /external/definitions?word=...`

## Notes
- CORS: Controller annotated to allow frontend access (`@CrossOrigin(origins = "*")`).
- Local dictionary data is loaded from `src/main/resources/dictionary.json` at startup.
- Consider persistence for favorites and pending stack (JSON/SQLite) if you need durability across restarts.

## Run Backend
Ensure you have Java 11+ and Maven/Gradle project setup. Typical Spring Boot run:

```cmd
mvn spring-boot:run
```

or build and run the jar:

```cmd
mvn package
java -jar target\smartdictionary-*.jar
```

Frontend assumes backend on `http://localhost:8080`.

package com.example.smartdictionary;

import org.springframework.web.bind.annotation.*;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.core.type.TypeReference;
import org.springframework.core.io.ClassPathResource;

import jakarta.annotation.PostConstruct;
import java.io.IOException;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@RestController
@CrossOrigin(origins = "*") // Allow frontend access
public class DictionaryController {

    // Data Structures
    private final Trie trie = new Trie();
    private final HistoryStack history = new HistoryStack();
    private final FlashcardList flashcards = new FlashcardList();
    private final NotRememberedStack notRemembered = new NotRememberedStack();
    private final FavoriteWords favorites = new FavoriteWords();
    private final DictionaryApiService dictionaryApi = new DictionaryApiService();
    private Map<String, String> dictionaryData = new HashMap<>();

    // Load data when server starts
    @PostConstruct
    public void init() {
        try {
            // Read from src/main/resources/dictionary.json
            ObjectMapper mapper = new ObjectMapper();
            dictionaryData = mapper.readValue(
                new ClassPathResource("dictionary.json").getInputStream(), 
                new TypeReference<Map<String, String>>(){}
            );

            // Populate Data Structures
            for (Map.Entry<String, String> entry : dictionaryData.entrySet()) {
                trie.insert(entry.getKey());
                flashcards.add(entry.getKey(), entry.getValue());
            }
            System.out.println("Dictionary loaded successfully!");

        } catch (IOException e) {
            e.printStackTrace();
            System.err.println("Failed to load dictionary.json");
        }
    }

    @GetMapping("/search")
    public Map<String, Object> search(@RequestParam String word) {
        String searchWord = word.toLowerCase();
        Map<String, Object> response = new HashMap<>();

        if (dictionaryData.containsKey(searchWord)) {
            history.push(searchWord);
            response.put("found", true);
            response.put("word", searchWord);
            response.put("definition", dictionaryData.get(searchWord));
        } else {
            response.put("found", false);
            String correction = Levenshtein.findClosest(searchWord, dictionaryData.keySet());
            response.put("correction", correction);
        }
        return response;
    }

    @GetMapping("/suggest")
    public List<String> suggest(@RequestParam String q) {
        return trie.searchPrefix(q);
    }

    @GetMapping("/history")
    public List<String> getHistory() {
        return history.getHistory();
    }

    @GetMapping("/flashcard")
    public Map<String, String> getFlashcard() {
        FlashcardList.CardNode card = flashcards.getCurrent();
        if (card == null) return null;

        Map<String, String> response = new HashMap<>();
        response.put("word", card.word);
        response.put("definition", card.definition);
        return response;
    }

    @PostMapping("/flashcard/next")
    public Map<String, String> nextFlashcard() {
        FlashcardList.CardNode card = flashcards.getNext();
        if (card == null) return null;

        Map<String, String> response = new HashMap<>();
        response.put("word", card.word);
        response.put("definition", card.definition);
        return response;
    }

    @PostMapping("/flashcard/remember")
    public Map<String, Object> rememberCurrent() {
        flashcards.reviewCurrent(true, notRemembered);
        Map<String, Object> response = new HashMap<>();
        response.put("status", "ok");
        response.put("action", "remember");
        return response;
    }

    @PostMapping("/flashcard/not-remember")
    public Map<String, Object> notRememberCurrent() {
        flashcards.reviewCurrent(false, notRemembered);
        Map<String, Object> response = new HashMap<>();
        response.put("status", "ok");
        response.put("action", "not-remember");
        return response;
    }

    @GetMapping("/flashcard/pending")
    public List<String> getPendingNotRemembered() {
        return notRemembered.getPending();
    }

    // External Dictionary API (dictionaryapi.dev)
    @GetMapping("/external/definitions")
    public Map<String, Object> getExternalDefinitions(@RequestParam String word) {
        Map<String, Object> result = new HashMap<>();
        String json = dictionaryApi.fetchRawJson(word);
        result.put("source", "dictionaryapi.dev");
        result.put("word", word.toLowerCase());
        if (json != null) {
            result.put("status", "ok");
            try {
                ObjectMapper mapper = new ObjectMapper();
                Object parsed = mapper.readValue(json, Object.class);
                result.put("data", parsed);
            } catch (IOException e) {
                result.put("status", "parse-error");
                result.put("error", "Failed to parse API response");
            }
        } else {
            result.put("status", "error");
            result.put("error", "No response or non-2xx status");
        }
        return result;
    }

    // Favorites APIs
    @GetMapping("/favorites")
    public List<WordItem> listFavorites() {
        return favorites.list();
    }

    @GetMapping("/favorites/{word}")
    public Map<String, Object> getFavorite(@PathVariable String word) {
        Map<String, Object> response = new HashMap<>();
        WordItem item = favorites.get(word);
        response.put("found", item != null);
        if (item != null) {
            response.put("word", item.getWord());
            response.put("definition", item.getDefinition());
        }
        return response;
    }

    @PostMapping("/favorites/{word}")
    public Map<String, Object> addFavorite(@PathVariable String word) {
        String key = word.toLowerCase();
        Map<String, Object> response = new HashMap<>();

        if (!dictionaryData.containsKey(key)) {
            response.put("status", "error");
            response.put("message", "Word not found in dictionary");
            return response;
        }

        WordItem item = new WordItem(key, dictionaryData.get(key));
        favorites.add(item);
        response.put("status", "ok");
        response.put("favorite", true);
        response.put("word", item.getWord());
        return response;
    }

    @DeleteMapping("/favorites/{word}")
    public Map<String, Object> removeFavorite(@PathVariable String word) {
        Map<String, Object> response = new HashMap<>();
        boolean removed = favorites.remove(word);
        response.put("status", removed ? "ok" : "not-found");
        response.put("favorite", false);
        response.put("word", word.toLowerCase());
        return response;
    }
}
package com.example.smartdictionary;

import org.springframework.web.bind.annotation.*;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.core.type.TypeReference;
import org.springframework.core.io.ClassPathResource;

import jakarta.annotation.PostConstruct;
import java.io.IOException;
import java.util.ArrayList;
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
    private final TranslateService translationService = new TranslateService();
    private Map<String, String> dictionaryData = new HashMap<>();
    // Store definitions for words not in dictionary (e.g., sample sets)
    private final Map<String, String> sampleSetDefinitions = new HashMap<>();

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

    // Get favorites as flashcard set
    @GetMapping("/flashcard/favorites")
    public List<Map<String, String>> getFavoriteFlashcards() {
        List<WordItem> favoriteItems = favorites.list();
        List<Map<String, String>> result = new ArrayList<>();
        for (WordItem item : favoriteItems) {
            Map<String, String> card = new HashMap<>();
            card.put("word", item.getWord());
            card.put("definition", item.getDefinition());
            result.add(card);
        }
        return result;
    }

    // Get not-remembered words as flashcard set (with definitions)
    @GetMapping("/flashcard/not-remembered")
    public List<Map<String, String>> getNotRememberedFlashcards() {
        List<String> words = notRemembered.getPending();
        List<Map<String, String>> result = new ArrayList<>();
        for (String word : words) {
            Map<String, String> card = new HashMap<>();
            card.put("word", word);
            // Get definition from dictionary, sample set definitions, or use placeholder
            if (dictionaryData.containsKey(word)) {
                card.put("definition", dictionaryData.get(word));
            } else if (sampleSetDefinitions.containsKey(word)) {
                card.put("definition", sampleSetDefinitions.get(word));
            } else {
                card.put("definition", "Definition not available");
            }
            result.add(card);
        }
        return result;
    }

    // Mark a not-remembered word as remembered (remove from stack)
    @PostMapping("/flashcard/not-remembered/{word}/remember")
    public Map<String, Object> markNotRememberedAsRemembered(@PathVariable String word) {
        Map<String, Object> response = new HashMap<>();
        String key = word.toLowerCase();
        
        // Remove from not-remembered stack
        boolean removed = notRemembered.remove(key);
        
        // Also remove from sample set definitions if it was stored there
        if (removed) {
            sampleSetDefinitions.remove(key);
        }
        
        response.put("status", removed ? "ok" : "not-found");
        response.put("message", removed ? "Word marked as remembered" : "Word not found in not-remembered list");
        response.put("word", key);
        return response;
    }

    // Mark a word as not remembered (add to stack)
    // Accepts optional definition in request body for words not in dictionary (e.g., sample sets)
    @PostMapping("/flashcard/not-remembered/{word}")
    public Map<String, Object> markAsNotRemembered(@PathVariable String word, 
                                                   @RequestBody(required = false) Map<String, String> body) {
        Map<String, Object> response = new HashMap<>();
        String key = word.toLowerCase();
        
        // Allow any word to be marked as not remembered, even if not in dictionary
        // This enables sample sets (animals, coding) to work
        notRemembered.push(key);
        
        // Store definition if provided (for sample sets)
        if (body != null && body.containsKey("definition") && !dictionaryData.containsKey(key)) {
            sampleSetDefinitions.put(key, body.get("definition"));
        }
        
        response.put("status", "ok");
        response.put("message", "Word added to not-remembered list");
        response.put("word", key);
        return response;
    }

    // External Dictionary API endpoint removed - using only JSON data

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
    public Map<String, Object> addFavorite(@PathVariable String word,
                                          @RequestBody(required = false) Map<String, String> body) {
        String key = word.toLowerCase();
        Map<String, Object> response = new HashMap<>();

        // Get definition from dictionary or from request body (for sample sets)
        String definition;
        if (dictionaryData.containsKey(key)) {
            definition = dictionaryData.get(key);
        } else if (body != null && body.containsKey("definition")) {
            // Allow favoriting words from sample sets with their definitions
            definition = body.get("definition");
        } else {
            // If not in dictionary and no definition provided, use a default
            definition = "No definition available";
        }

        WordItem item = new WordItem(key, definition);
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

    // Translation API
    @PostMapping("/translate")
    public Map<String, Object> translate(@RequestBody Map<String, String> request) {
        Map<String, Object> response = new HashMap<>();
        
        String text = request.get("text");
        String sourceLang = request.getOrDefault("sourceLang", "en");
        String targetLang = request.getOrDefault("targetLang", "es");
        
        if (text == null || text.isBlank()) {
            response.put("status", "error");
            response.put("message", "Text is required");
            return response;
        }
        
        String translated = translationService.translate(text, sourceLang, targetLang);
        
        if (translated != null) {
            response.put("status", "ok");
            response.put("originalText", text);
            response.put("translatedText", translated);
            response.put("sourceLang", sourceLang);
            response.put("targetLang", targetLang);
        } else {
            response.put("status", "error");
            response.put("message", "Translation failed");
        }
        
        return response;
    }

    @GetMapping("/translate")
    public Map<String, Object> translateGet(@RequestParam String text,
                                           @RequestParam(defaultValue = "en") String sourceLang,
                                           @RequestParam(defaultValue = "es") String targetLang) {
        Map<String, Object> response = new HashMap<>();
        
        if (text == null || text.isBlank()) {
            response.put("status", "error");
            response.put("message", "Text is required");
            return response;
        }
        
        String translated = translationService.translate(text, sourceLang, targetLang);
        
        if (translated != null) {
            response.put("status", "ok");
            response.put("originalText", text);
            response.put("translatedText", translated);
            response.put("sourceLang", sourceLang);
            response.put("targetLang", targetLang);
        } else {
            response.put("status", "error");
            response.put("message", "Translation failed");
        }
        
        return response;
    }
}
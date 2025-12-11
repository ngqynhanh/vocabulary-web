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

    //Data Structures
    private final Trie trie = new Trie();
    private final HistoryStack history = new HistoryStack();
    private final FlashcardList flashcards = new FlashcardList();
    private final NotRememberedStack notRemembered = new NotRememberedStack();
    private final FavoriteWords favorites = new FavoriteWords();
    private final TranslateService translateService = new TranslateService();
    private Map<String, String> dictionaryData = new HashMap<>();
    //Store definitions for words not in dictionary
    private final Map<String, String> sampleSetDefinitions = new HashMap<>();
    //Sample sets loaded from JSON resources
    private List<Map<String, String>> animalSet = new ArrayList<>();
    private List<Map<String, String>> codingSet = new ArrayList<>();

    //Load data when server starts
    @PostConstruct
    public void init() {
        try {
            //Read from src/main/resources/dictionary.json
            ObjectMapper mapper = new ObjectMapper();
            dictionaryData = mapper.readValue(
                new ClassPathResource("dictionary.json").getInputStream(), 
                new TypeReference<Map<String, String>>(){}
            );

            //Populate Data Structures
            for (Map.Entry<String, String> entry : dictionaryData.entrySet()) {
                trie.insert(entry.getKey());
                flashcards.add(entry.getKey(), entry.getValue());
            }
            System.out.println("Dictionary loaded successfully!");

            //Load sample sets from resources
            animalSet = mapper.readValue(
                new ClassPathResource("animal.json").getInputStream(),
                new TypeReference<List<Map<String, String>>>() {}
            );
            codingSet = mapper.readValue(
                new ClassPathResource("coding.json").getInputStream(),
                new TypeReference<List<Map<String, String>>>() {}
            );
            //Keep definitions available for not-remembered lookups
            addSampleDefinitions(animalSet);
            addSampleDefinitions(codingSet);

        } catch (IOException e) {
            e.printStackTrace();
            System.err.println("Failed to load dictionary.json");
        }
    }

    @GetMapping("/search")
    public Map<String, Object> search(@RequestParam String word) {
        String searchWord = word.toLowerCase();
        Map<String, Object> response = new HashMap<>();

        //Always add to history, regardless of whether word is found
        history.push(searchWord);

        if (dictionaryData.containsKey(searchWord)) {
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

    // Translate EN -> VI
    @PostMapping("/translate")
    public Map<String, Object> translate(@RequestParam String text) {
        Map<String, Object> result = new HashMap<>();
        result.put("source", "en");
        result.put("target", "vi");
        result.put("text", text);
        String translated = translateService.translateEnToVi(text);
        if (translated != null) {
            result.put("status", "ok");
            result.put("translation", translated);
        } else {
            result.put("status", "error");
            String detail = translateService.getLastError();
            result.put("error", detail != null ? detail : "Translation service unavailable or API error. Check backend logs.");
        }
        return result;
    }

    //Get favorites as flashcard set
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

    // Sample set endpoints
    @GetMapping("/flashcard/sample/animals")
    public List<Map<String, String>> getAnimalSet() {
        return animalSet;
    }

    @GetMapping("/flashcard/sample/coding")
    public List<Map<String, String>> getCodingSet() {
        return codingSet;
    }

    private void addSampleDefinitions(List<Map<String, String>> sampleSet) {
        if (sampleSet == null) return;
        for (Map<String, String> item : sampleSet) {
            String word = item.getOrDefault("word", "").toLowerCase();
            String definition = item.getOrDefault("definition", "");
            if (!word.isEmpty() && !definition.isEmpty()) {
                sampleSetDefinitions.put(word, definition);
            }
        }
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

    @PostMapping("/flashcard/add-favorite")
    public Map<String, Object> addFavoriteToFlashcard(@RequestBody Map<String, String> body) {
        Map<String, Object> response = new HashMap<>();
        try {
            String word = body.getOrDefault("word", "").toLowerCase();
            String definition = body.getOrDefault("definition", "No definition available");

            if (word.isEmpty()) {
                response.put("status", "error");
                response.put("message", "Word is required");
                return response;
            }

            flashcards.add(word, definition);

            response.put("status", "ok");
            response.put("message", "Added to flashcard list");
            response.put("word", word);
        } catch (Exception e) {
            response.put("status", "error");
            response.put("message", "Error: " + e.getMessage());
        }
        return response;
    }
}
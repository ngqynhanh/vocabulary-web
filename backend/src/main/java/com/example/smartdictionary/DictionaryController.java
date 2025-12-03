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
        FlashcardList.CardNode card = flashcards.getNext();
        if (card == null) return null;
        
        Map<String, String> response = new HashMap<>();
        response.put("word", card.word);
        response.put("definition", card.definition);
        return response;
    }
}
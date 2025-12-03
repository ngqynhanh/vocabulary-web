package com.example.smartdictionary;

import java.util.Map;
import java.util.HashMap;
import java.util.List;
import java.util.ArrayList;

/**
 * Favorite words store with O(1) lookup using a HashMap.
 */
public class FavoriteWords {
    private final Map<String, WordItem> dict = new HashMap<>();

    public void add(WordItem item) {
        if (item == null || item.getWord() == null) return;
        dict.put(item.getWord().toLowerCase(), item);
    }

    public WordItem get(String word) {
        if (word == null) return null;
        return dict.get(word.toLowerCase());
    }

    public boolean remove(String word) {
        if (word == null) return false;
        return dict.remove(word.toLowerCase()) != null;
    }

    public boolean isFavorite(String word) {
        if (word == null) return false;
        return dict.containsKey(word.toLowerCase());
    }

    public List<WordItem> list() {
        return new ArrayList<>(dict.values());
    }
}

package com.example.smartdictionary;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertNull;
import static org.junit.jupiter.api.Assertions.assertTrue;

import org.junit.jupiter.api.Test;

class FavoriteWordsTest {

    @Test
    void addGetRemoveFavorites() {
        FavoriteWords fav = new FavoriteWords();
        WordItem item = new WordItem("apple", "A fruit");
        fav.add(item);

        assertTrue(fav.isFavorite("apple"));
        assertFalse(fav.isFavorite("banana"));

        WordItem got = fav.get("apple");
        assertEquals("apple", got.getWord());
        assertEquals("A fruit", got.getDefinition());

        boolean removed = fav.remove("apple");
        assertTrue(removed);
        assertNull(fav.get("apple"));
    }
}
